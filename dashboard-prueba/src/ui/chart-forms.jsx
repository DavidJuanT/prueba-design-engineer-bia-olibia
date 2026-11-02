import React, {useState} from 'react';
import {Marker} from './bar-list';
import {ChartFooter, useInView} from './columns';
import './chart-forms.css';

// Anillo: partes de un todo. Sin `goal`, composición del total con el color de cada item (dona); con `goal`, avance
// hacia la meta en morado y lo que falta queda en la pista. `layout="horizontal"`: anillo a la izquierda y leyenda a
// la derecha (en móvil se apila). Mismo contrato que BarList: items [{key, label, value, display, meta, marker, color}],
// `footer` [texto, valor] abajo con el pie de ColumnChart. Con `meta`, la leyenda va en dos líneas: nombre y cifra arriba;
// meta y porcentaje (alineado bajo la cifra) abajo, para que el nombre no se corte; puntero o foco atenúa lo demás y el centro muestra ese valor.
// Teclado: el anillo es una sola parada de Tab; las flechas recorren los tramos (Inicio y Fin: primero y último) y cada uno se anuncia.

// Tramo con esquinas redondeadas (from/to en fracción de vuelta, desde arriba en sentido horario). El trazo SVG solo
// ofrece extremos rectos o semicirculares; este trazado da el radio de los botones. Medidas en unidades del viewBox
// (160 → 176 px): anillo de 16 de grosor y esquinas de 4.
const OUT = 72, IN = 56, CORNER = 4;
function sector(from, to, gap) {
  const pt = (r, a) => `${(80 + r * Math.sin(a)).toFixed(2)} ${(80 - r * Math.cos(a)).toFixed(2)}`;
  const a0 = from * 2 * Math.PI + gap / 2 / 64, a1 = to * 2 * Math.PI - gap / 2 / 64;
  const c = Math.min(CORNER, (a1 - a0) * IN / 2); // un tramo muy corto no puede tener esquinas más anchas que él
  const dO = c / OUT, dI = c / IN, big = a1 - a0 > Math.PI ? 1 : 0;
  return `M${pt(OUT, a0 + dO)}A${OUT} ${OUT} 0 ${big} 1 ${pt(OUT, a1 - dO)}Q${pt(OUT, a1)} ${pt(OUT - c, a1)}L${pt(IN + c, a1)}`
    + `Q${pt(IN, a1)} ${pt(IN, a1 - dI)}A${IN} ${IN} 0 ${big} 0 ${pt(IN, a0 + dI)}Q${pt(IN, a0)} ${pt(IN + c, a0)}L${pt(OUT - c, a0)}Q${pt(OUT, a0)} ${pt(OUT, a0 + dO)}Z`;
}

const pct = (v, of) => `${Math.round(v / of * 100)} %`;

export function Ring({items, goal, center, footer, label, layout}) {
  const [active, setActive] = useState(null);
  const [ref, inView] = useInView();
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const whole = Math.max(goal ?? 0, total) || 1; // sin valores (filtros vacíos) el anillo queda solo con la pista
  const gap = goal ? 5 : 3; // hueco entre tramos; más ancho entre personas para poder contarlas
  let start = 0;
  const arcs = items.map((item, i) => { const turn = item.value / whole; const arc = {item, i, from: start, to: start + turn}; start += turn; return arc; });
  const shown = active === null ? center : [items[active].display, items[active].label];
  const on = i => ({onMouseEnter: () => setActive(i)});
  const onKey = e => {
    const last = items.length - 1;
    const next = {ArrowRight: (active ?? -1) + 1, ArrowDown: (active ?? -1) + 1, ArrowLeft: (active ?? last + 1) - 1, ArrowUp: (active ?? last + 1) - 1, Home: 0, End: last}[e.key];
    if (next !== undefined) { e.preventDefault(); setActive(Math.max(0, Math.min(last, next))); }
    if (e.key === 'Escape') setActive(null);
  };
  return <div ref={ref} className={['chart-form', layout === 'horizontal' && 'chart-form--h', active !== null && 'has-active', inView && 'is-in'].filter(Boolean).join(' ')} onMouseLeave={() => setActive(null)}>
    <div className="chart-ring" role="group" tabIndex={0} onKeyDown={onKey} onBlur={() => setActive(null)}
      aria-label={`${label}: ${items.map(i => `${i.label} ${i.display}`).join(', ')}${goal ? `; meta ${goal}` : ''}. Usa las flechas para recorrer los valores`}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="chart-ring-track" cx="80" cy="80" r="64"/>
        {arcs.filter(({item}) => item.value > 0).map(({item, i, from, to}) => <path key={item.key ?? item.label} d={sector(from, to, gap)}
          className={['chart-ring-arc', !goal && 'is-colored', active === i && 'is-active'].filter(Boolean).join(' ')}
          style={{'--i': i, ...(!goal && item.color && {'--seg': `var(${item.color})`})}} onMouseEnter={() => setActive(i)}/>)}
      </svg>
      <div className="chart-ring-center" aria-hidden="true"><b>{shown[0]}</b><span>{shown[1]}</span></div>
    </div>
    <p className="sr-only" aria-live="polite">{active !== null && `${items[active].label}: ${items[active].display}, ${pct(items[active].value, goal || total || 1)}`}</p>
    <ul className="chart-legend" aria-hidden="true">
      {items.map((item, i) => <li key={item.key ?? item.label} className={active === i ? 'is-active' : undefined} style={{'--i': i}} {...on(i)}>
        <Marker marker={item.marker}/><span className="bar-list-label">{item.label}</span>
        {item.meta
          ? <><span className="bar-list-value">{item.display}</span>
            <span className="bar-list-meta"><span>{item.meta}</span><span className="pill delta delta--flat bar-list-pill">{pct(item.value, goal || total || 1)}</span></span></>
          : <span className="bar-list-value">{item.display} <span className="pill delta delta--flat bar-list-pill">{pct(item.value, goal || total || 1)}</span></span>}
      </li>)}
    </ul>
    {footer && <ChartFooter footer={footer}/>}
  </div>;
}
