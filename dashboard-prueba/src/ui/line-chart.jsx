import React, {useState} from 'react';
import {Icon} from './icons';
import {useInView} from './columns';
import './line-chart.css';

// Gráfica de líneas con varias series: ver cómo cambia un valor a lo largo de un eje (horas, días) y comparar pocas
// series entre sí. Cada serie es una línea de 2 px con un área degradada debajo; los colores salen de los tokens de
// serie (--color-series-1..3), en orden fijo. Con dos o más series lleva leyenda arriba a la derecha.
// - labels: nombres del eje horizontal (p. ej. ['00', '01', …]).
// - series: [{key, label, color: '--color-series-1', values: [n, …], dash}], un valor por etiqueta. dash (opcional): trazo
//   de la línea (stroke-dasharray en px, p. ej. '6 4' discontinua o '1 4' punteada), para distinguir series sin depender del color.
// - max: tope del eje vertical (marca 0, la mitad y el tope). format: cómo se escribe un valor (tooltip y tabla);
//   tick: cómo se escribe en el eje (sin unidad: la unidad va en el título o el subtítulo). point: el rótulo del punto
//   en el tooltip (p. ej. «12» → «12:00»).
// - bands: [{from, to, label}] zonas sombreadas entre dos índices del eje (p. ej. un horario), con su rótulo arriba
//   (un salto de línea «\n» en `label` lo parte en dos líneas).
// - Puntero o flechas del teclado: línea vertical con los valores de todas las series en ese punto (tooltip).
// - xTitle / yTitle (opcionales): qué mide cada eje (p. ej. «Hora» y «kWh»); el vertical va arriba del eje, en horizontal,
//   y el horizontal centrado bajo las etiquetas.
// - legend={false}: sin leyenda, cuando la identidad de cada serie ya la da otra pieza junto a la gráfica (p. ej. KPIs con su punto).
// - Accesible: el grupo tiene nombre (`label`) y una tabla oculta con todos los valores para el lector de pantalla.
const SMOOTH = 6; // Curva Catmull-Rom → Bézier: suaviza sin pasar de largo los puntos

function curve(points) {
  return points.reduce((d, [x, y], i) => {
    if (!i) return `M${x},${y}`;
    const [x0, y0] = points[i - 2] || points[i - 1], [x1, y1] = points[i - 1], [x3, y3] = points[i + 1] || [x, y];
    return `${d} C${x1 + (x - x0) / SMOOTH},${y1 + (y - y0) / SMOOTH} ${x - (x3 - x1) / SMOOTH},${y - (y3 - y1) / SMOOTH} ${x},${y}`;
  }, '');
}

export function SeriesDot({color}) {
  return <span className="linechart-dot" style={{'--dot': `var(${color})`}} aria-hidden="true"/>;
}

export function LineChart({labels, series, max, bands = [], format = n => n, tick = n => n, point = l => l, label, legend = true, xTitle, yTitle}) {
  const [ref, inView] = useInView();
  const [active, setActive] = useState(null);
  const last = labels.length - 1;
  const x = i => i / last * 100, y = n => 100 - Math.min(n / max, 1) * 100;
  const pick = e => { const r = e.currentTarget.getBoundingClientRect(); setActive(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * last)); };
  const onKey = e => {
    const step = {ArrowRight: 1, ArrowLeft: -1}[e.key];
    if (step) { e.preventDefault(); setActive(i => Math.max(0, Math.min(last, (i ?? (step > 0 ? -1 : last + 1)) + step))); }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setActive(e.key === 'Home' ? 0 : last); }
    if (e.key === 'Escape') setActive(null);
  };
  return <div className="linechart">
    {legend && series.length > 1 && <ul className="linechart-legend">{series.map(s => <li key={s.key}><SeriesDot color={s.color}/>{s.label}</li>)}</ul>}
    {yTitle && <p className="linechart-ytitle" aria-hidden="true">{yTitle}</p>}
    <div className={['linechart-chart', inView && 'is-in'].filter(Boolean).join(' ')} ref={ref} role="group" aria-label={label}>
      <div className="linechart-yaxis" aria-hidden="true">{[max, max / 2, 0].map(t => <span key={t} style={{bottom: `${t / max * 100}%`}}>{tick(t)}</span>)}</div>
      <div className="linechart-plot" tabIndex={0} onPointerMove={pick} onPointerLeave={() => setActive(null)} onKeyDown={onKey} onBlur={() => setActive(null)}
        aria-label={`${label}. Usa las flechas para recorrer los valores`}>
        {[50].map(t => <i key={t} className="linechart-grid" style={{bottom: `${t}%`}} aria-hidden="true"/>)}
        {bands.map(b => <div key={b.from} className="linechart-band" style={{left: `${x(b.from)}%`, width: `${x(b.to) - x(b.from)}%`}} aria-hidden="true">
          {b.label && <span className="linechart-band-label"><Icon name="moon" size={20}/><span>{b.label}</span></span>}</div>)}
        <svg className="linechart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>{series.map(s => <linearGradient key={s.key} id={`lc-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`var(${s.color})`} stopOpacity=".28"/><stop offset="1" stopColor={`var(${s.color})`} stopOpacity="0"/></linearGradient>)}</defs>
          {series.map(s => { const d = curve(s.values.map((n, i) => [x(i), y(n)]));
            return <g key={s.key} style={{'--line': `var(${s.color})`}}>
              <path className="linechart-area" d={`${d} L100,100 L0,100 Z`} fill={`url(#lc-${s.key})`}/>
              <path className="linechart-line" d={d} style={s.dash ? {strokeDasharray: s.dash} : undefined}/>
            </g>; })}
        </svg>
        {/* Puntos de inicio y fin de cada línea (HTML: no se deforman con el SVG estirado) */}
        {series.flatMap(s => [0, last].map(i => <i key={`${s.key}-${i}`} className="linechart-point" style={{left: `${x(i)}%`, bottom: `${100 - y(s.values[i])}%`, '--dot': `var(${s.color})`}} aria-hidden="true"/>))}
        {active !== null && <>
          <i className="linechart-cursor" style={{left: `${x(active)}%`}} aria-hidden="true"/>
          {series.map(s => <i key={s.key} className="linechart-point is-active" style={{left: `${x(active)}%`, bottom: `${100 - y(s.values[active])}%`, '--dot': `var(${s.color})`}} aria-hidden="true"/>)}
          <div className="linechart-tip" aria-hidden="true" data-edge={active < last / 4 ? 'start' : active > last * 3 / 4 ? 'end' : undefined} style={{left: `${x(active)}%`}}>
            <strong>{point(labels[active])}</strong>
            {series.map(s => <span key={s.key}><SeriesDot color={s.color}/>{s.label}<b>{format(s.values[active])}</b></span>)}
          </div>
        </>}
      </div>
      {/* Región viva siempre montada: anuncia el punto que recorren las flechas (Inicio y Fin: primero y último) */}
      <p className="sr-only" aria-live="polite">{active !== null && `${point(labels[active])}: ${series.map(s => `${s.label} ${format(s.values[active])}`).join(', ')}`}</p>
      <div className="linechart-xaxis" aria-hidden="true">{labels.map((l, i) => <span key={l} style={{left: `${x(i)}%`}}>{l}</span>)}</div>
      {xTitle && <p className="linechart-xtitle" aria-hidden="true">{xTitle}</p>}
    </div>
    {/* La tabla va dentro de un div .sr-only: una tabla no respeta el ancho de 1 px y desbordaría la página en móvil */}
    <div className="sr-only"><table><caption>{label}</caption>
      <thead><tr><th scope="col">Punto</th>{series.map(s => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
      <tbody>{labels.map((l, i) => <tr key={l}><th scope="row">{l}</th>{series.map(s => <td key={s.key}>{format(s.values[i])}</td>)}</tr>)}</tbody>
    </table></div>
  </div>;
}
