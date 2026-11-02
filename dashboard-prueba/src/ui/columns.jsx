import React, {useEffect, useRef, useState} from 'react';
import {useRoving} from './keyboard';
import './columns.css';

// Gráfica de columnas (método dataviz): cada columna es la escala completa (carril tenue) y el relleno, el valor.
// - Ejes: línea base y eje vertical con 0 · mitad · máximo.
// - Color: las columnas en un lavanda grisáceo (--color-chart-history) y la destacada (`highlight`) en el morado principal.
// - Opcional: meta (línea verde punteada), tendencia (punteada discreta con un punto pequeño en cada tope)
//   y una fila de resumen abajo (`footer`: [texto, valor]).
// - Tooltip por columna: sigue al puntero; con teclado o toque (pantallas táctiles) queda sobre la columna.
// - Teclado: la gráfica es una sola parada de Tab; las flechas recorren las columnas (Inicio y Fin: primera y última).
// - Entrada: las columnas crecen desde la base una tras otra; luego la tendencia se dibuja y aparecen los puntos.
//   Arranca al entrar en pantalla; con movimiento reducido no hay animación.
// - Sin carril (`track={false}`): para conteos sin meta, donde el tope del eje no es un objetivo que alcanzar.
// - `onPick(i)` (opcional): cada columna pasa a ser un botón (p. ej. ir a ese mes); `pickLabel` completa su nombre.
// - `yTitle` (opcional): qué mide el eje vertical (p. ej. «Miles de kWh»), arriba del eje y en horizontal, como en LineChart.
// items: [[etiqueta, valor, tooltip]] · max: valor del tope del eje · highlight: índices destacados ('all': todas)
// Pie de gráfica: [texto, valor]. En el valor, solo las cifras (con su $) llevan la tipografía de los KPI; las
// palabras («de», «por mes», «M») van en la del texto. Lo comparten la gráfica de columnas, el anillo y el ranking.
export function ChartFooter({footer}) {
  const parts = String(footer[1]).split(/(\$?\d[\d.,]*)/);
  return <p className="colchart-footer">{footer[0]} <b>{parts.map((part, i) => i % 2 ? <span key={i} className="colchart-figure">{part}</span> : part)}</b></p>;
}

export function ColumnChart({items, max, goal, trend = false, track = true, highlight = [], footer, label, goalLabel = 'Meta', onPick, pickLabel = '', yTitle}) {
  const [ref, inView] = useInView();
  const pos = (i, n) => [(i + .5) / items.length * 100, n / max * 100];
  const ticks = [max, max / 2, 0];
  const rove = useRoving(items.length);
  return <div className={['colchart', !track && 'colchart--no-track'].filter(Boolean).join(' ')}>
    {yTitle && <p className="colchart-ytitle" aria-hidden="true">{yTitle}</p>}
    <div className={['colchart-chart', inView && 'is-in'].filter(Boolean).join(' ')} ref={ref} role="group" aria-label={label}
      style={{'--cols': items.length}}>
      <div className="colchart-yaxis" aria-hidden="true">{ticks.map(t => <span key={t} style={{bottom: `${t / max * 100}%`}}>{t}</span>)}</div>
      <div className="colchart-plot">
        {(goal != null || trend) && <svg className="colchart-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {goal != null && <line className="colchart-goal" x1="0" x2="100" y1={100 - goal / max * 100} y2={100 - goal / max * 100}/>}
          {trend && <polyline className="colchart-trend" points={items.map(([, n], i) => { const [x, y] = pos(i, n); return `${x},${100 - y}`; }).join(' ')}/>}
        </svg>}
        <div className="colchart-cols">{items.map(([name, n, tip], i) => <div className="colchart-col" key={name}>
          <span className={['colchart-bar', (highlight === 'all' || highlight.includes(i)) && 'is-highlight'].filter(Boolean).join(' ')}
            {...rove(i)} role={onPick ? 'button' : 'img'} aria-label={onPick ? `${tip}${pickLabel}` : tip} data-tip={tip}
            onClick={onPick && (() => onPick(i))} onKeyDown={e => { if (onPick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(i); } else rove(i).onKeyDown(e); }} data-edge={i === 0 ? 'start' : i === items.length - 1 ? 'end' : undefined}
            onMouseMove={followPointer} onMouseLeave={resetPointer}>
            <span className="colchart-fill" style={{height: `${Math.min(n / max, 1) * 100}%`, '--i': i}}/>
          </span>
        </div>)}</div>
        {goal != null && goalLabel && <span className="colchart-goal-label" style={{bottom: `${goal / max * 100}%`}} aria-hidden="true">{goalLabel}</span>}
        {trend && <div className="colchart-dots" aria-hidden="true">{items.map(([name, n], i) => { const [x, y] = pos(i, n);
          return <i key={name} className="colchart-dot" style={{left: `${x}%`, bottom: `${y}%`, '--i': i}}/>; })}</div>}
      </div>
      <div className="colchart-xaxis" aria-hidden="true">{items.map(([name]) => <span key={name}>{name}</span>)}</div>
    </div>
    {footer && <ChartFooter footer={footer}/>}
  </div>;
}

// La animación de entrada espera a que la gráfica esté en pantalla (las gráficas viven bajo el pliegue)
// La gráfica entra en pantalla (40 % visible): arranca su animación de entrada. También la usa el anillo.
export function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, {threshold: .4});
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

// Con mouse, el tooltip sale junto al puntero (--tip-x/--tip-y, en px dentro de la columna)
const followPointer = e => {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  el.style.setProperty('--tip-x', `${(e.clientX - r.left) / r.width * el.offsetWidth}px`);
  el.style.setProperty('--tip-y', `${(e.clientY - r.top) / r.height * el.offsetHeight}px`);
};
const resetPointer = e => { e.currentTarget.style.removeProperty('--tip-x'); e.currentTarget.style.removeProperty('--tip-y'); };
