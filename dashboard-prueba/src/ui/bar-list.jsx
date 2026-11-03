import React, {useState, useLayoutEffect, useRef} from 'react';
import {Avatar} from './avatar';
import {ChartFooter} from './columns';
import {useRoving} from './keyboard';
import './tooltip.css';
import './bar-list.css';

// Ranking: lista de barras sin pista para comparar pocos elementos entre sí cuando no tienen meta propia; la barra
// más larga es el mayor valor, no un 100 %. Una sola serie; la identidad la lleva el marcador (punto o iniciales).
// El resumen va abajo, con el pie de ColumnChart (`footer`: [texto, valor]). Puntero o foco en una fila: las demás
// se atenúan. Con teclado, la lista es una sola parada de Tab y las flechas recorren las filas.
// items: [{key, label, value, display, meta, pill, tip, marker}] · pill (opcional): cifra corta en una pill neutra junto al
// valor (p. ej. «38 %»), como en Variación de Bia; `meta` queda para el lector de pantalla · tip (opcional): texto de un tooltip que sale bajo el final
// de la barra con puntero o foco en la fila (p. ej. «56 % de 7.500 kWh»), en lugar de la meta fija · marker: {dot: '--color-dot-…'}, {initials} o {person, photo} (Avatar)
export function Marker({marker}) {
  if (marker?.person) return <Avatar name={marker.person} photo={marker.photo}/>;
  if (marker?.initials) return <span className="avatar" aria-hidden="true">{marker.initials}</span>;
  return marker?.dot ? <span className="bar-list-dot" style={{'--dot': `var(${marker.dot})`}}/> : null;
}

export function BarList({items, footer, label}) {
  const [active, setActive] = useState(null);
  const top = Math.max(...items.map(i => i.value), 1);
  const rove = useRoving(items.length);
  // Si el tooltip se sale por la derecha (móvil, barra larga), se corre a la izquierda y la flecha sigue en el final de la barra
  const list = useRef(null);
  useLayoutEffect(() => {
    const tip = list.current?.querySelector('.bar-list-tip');
    if (!tip) return;
    const over = tip.getBoundingClientRect().right - (document.documentElement.clientWidth - 16);
    if (over > 0) { tip.style.setProperty('--shift', `${-over}px`); tip.style.setProperty('--arrow-x', `${12 + over}px`); }
  }, [active]);
  return <div ref={list} className={['bar-list', active !== null && 'has-active'].filter(Boolean).join(' ')}>
    <ul aria-label={label} onMouseLeave={() => setActive(null)}>
      {items.map((item, i) => <li key={item.key ?? item.label} {...rove(i)} className={active === i ? 'is-active' : undefined}
        aria-label={`${item.label}: ${item.display}${item.pill ? ` (${item.pill}${item.meta ? ` ${item.meta}` : ''})` : item.meta ? `, ${item.meta}` : ''}${item.tip ? `, ${item.tip}` : ''}`}
        onMouseEnter={() => setActive(i)} onFocus={() => { rove(i).onFocus(); setActive(i); }} onBlur={() => setActive(null)}
        style={{'--i': i, '--w': `${item.value / top * 100}%`, '--f': item.value / top}}>
        <span className="bar-list-name" aria-hidden="true"><Marker marker={item.marker}/><span className="bar-list-label">{item.label}</span></span>
        <span className="bar-list-lane" aria-hidden="true"><span className="bar-list-fill">{item.tip && active === i && <span className="infotip-bubble bar-list-tip">{item.tip}</span>}</span><b>{item.display}</b>{item.pill ? <span className="pill delta delta--flat bar-list-pill">{item.pill}</span> : item.meta && <span className="bar-list-meta">{item.meta}</span>}</span>
      </li>)}
    </ul>
    {footer && <ChartFooter footer={footer}/>}
  </div>;
}
