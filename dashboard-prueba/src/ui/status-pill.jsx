import React, {useLayoutEffect, useRef, useState} from 'react';
import {Icon} from './icons';
import './status-pill.css';

// Pill de estado binario: pendiente (amarillo) o hecho (verde, con check). Los textos cambian con `labels`;
// por defecto, los de Olibia: «Pendiente» y «Al día».
// Al pasar de un estado a otro se transforma en lugar de cambiar de golpe:
// el color funde, el ancho se ajusta, el texto viejo sale hacia arriba, el nuevo entra desde abajo y el check aparece.
// Solo anima cuando el estado cambia (no al montarse). Con movimiento reducido el cambio es inmediato.
const LABELS = {done: 'Al día', pending: 'Pendiente'};

export function StatusPill({done, labels = LABELS}) {
  const label = done ? labels.done : labels.pending;
  const [shown, setShown] = useState({label, prev: null, n: 0});
  // Cambio de estado: se guarda el texto anterior para animar su salida
  if (shown.label !== label) setShown(s => ({label, prev: s.label, n: s.n + 1}));
  const box = useRef(null), current = useRef(null), width = useRef(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!shown.n) { width.current = el.offsetWidth; return; }
    // El ancho pasa del texto anterior al nuevo con una transición (FLIP de ancho)
    const to = current.current.offsetWidth;
    el.style.width = `${width.current}px`;
    el.getBoundingClientRect();
    el.style.width = `${to}px`;
    width.current = to;
    const t = setTimeout(() => { el.style.width = ''; setShown(s => ({...s, prev: null})); }, 360);
    return () => clearTimeout(t);
  }, [shown.n]);

  const content = text => <>{text === labels.done && <Icon name="check" size={14}/>}{text}</>;
  return <span className={`pill status-pill ${done ? 'status-al-dia' : 'status-pendiente'}`}>
    <span className="status-pill-box" ref={box}>
      {shown.prev && <span className="status-pill-label is-out" aria-hidden="true">{content(shown.prev)}</span>}
      <span className={['status-pill-label', shown.n > 0 && 'is-in'].filter(Boolean).join(' ')} key={shown.n} ref={current}>{content(shown.label)}</span>
    </span>
  </span>;
}
