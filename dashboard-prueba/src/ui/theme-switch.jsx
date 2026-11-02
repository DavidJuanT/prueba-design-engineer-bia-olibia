import React, {useEffect, useRef, useState} from 'react';
import {Icon} from './icons';
import './theme-switch.css';
import {reducedMotion} from './media';

// Selector de tema: interruptor de tres posiciones (Sistema · Claro · Oscuro).
// - Una perilla redonda se desliza hasta la opción elegida; su icono pasa de contorno a relleno.
// - La página cambia de tema con un fundido (View Transitions); con movimiento reducido, al instante.
// - Tooltip por opción con hover o Tab (uno a la vez) con el nombre de la opción.
// - Iconos de Material Symbols (rounded): computer, light_mode y dark_mode.
// - Accesibilidad: patrón radiogroup. Tab entra a la opción elegida; las flechas cambian de opción.
const OPTIONS = [
  ['system', 'Sistema', 'computer'],
  ['light', 'Claro', 'sun'],
  ['dark', 'Oscuro', 'moon'],
];
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// label: nombre accesible del grupo · labelledBy: id de una etiqueta visible (tiene prioridad sobre label)
export function ThemeSwitch({value, onChange, label = 'Tema', labelledBy}) {
  const [tip, setTip] = useState(null);
  const refs = useRef([]);
  const index = Math.max(OPTIONS.findIndex(([v]) => v === value), 0);

  // Escape cierra el tooltip abierto
  useEffect(() => {
    if (tip == null) return;
    const onKey = e => { if (e.key === 'Escape') setTip(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tip]);

  // El tema se aplica dentro de la transición para que el navegador funda la página vieja con la nueva
  const choose = next => {
    if (next === value) return;
    const apply = () => {
      document.documentElement.dataset.theme = next === 'system' ? (darkQuery.matches ? 'dark' : 'light') : next;
      onChange(next);
    };
    if (document.startViewTransition && !reducedMotion()) document.startViewTransition(apply);
    else apply();
  };

  const onKeyDown = e => {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    refs.current[next].focus();
    setTip(next);
    choose(OPTIONS[next][0]);
  };

  return <div className="theme-switch" role="radiogroup" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} style={{'--index': index}} onKeyDown={onKeyDown}>
    <span className="theme-switch-knob" aria-hidden="true"/>
    {OPTIONS.map(([v, name, icon], i) => <span className="theme-switch-item" key={v}
      onPointerEnter={e => { if (e.pointerType === 'mouse') setTip(i); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setTip(null); }}>
      <button type="button" role="radio" aria-checked={i === index} aria-label={name}
        tabIndex={i === index ? 0 : -1} ref={el => { refs.current[i] = el; }}
        className={['theme-switch-option', i === index && 'is-selected'].filter(Boolean).join(' ')}
        onClick={() => choose(v)}
        onFocus={e => { if (e.target.matches(':focus-visible')) setTip(i); }} onBlur={() => setTip(null)}>
        {/* Contorno y relleno superpuestos: al elegir, el relleno aparece con un fundido */}
        <span className="theme-switch-icon"><Icon name={icon} size={20}/><Icon name={`${icon}Fill`} size={20}/></span>
      </button>
      <span className="theme-switch-tip" hidden={tip !== i} aria-hidden="true"><span className="infotip-bubble">{name}</span></span>
    </span>)}
  </div>;
}
