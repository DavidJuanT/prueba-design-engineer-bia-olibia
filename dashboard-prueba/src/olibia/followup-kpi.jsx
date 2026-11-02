import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Button} from '../ui/button';
import {KpiIcon} from '../ui/badges';
import {StatusPill} from '../ui/status-pill';
import {contactLabel, sumValue, PHOTOS} from './model';
import {Avatar} from '../ui/avatar';
import './followup-kpi.css';
import {reducedMotion} from '../ui/media';

// Negociaciones que cierran la brecha (las de etapa Negociación entre las N más cerca del cierre).
export const negotiationsToFollow = closers => closers.filter(r => r[1] === 'Negociación');

// KPI «Negociaciones al día» (segunda posición, junto a la meta): cuántas negociaciones que cierran la brecha
// tienen seguimiento («0 de 2») y el CTA «Dar seguimiento», que abre el resumen de las negociaciones.
// Solo se muestra si hay negociaciones que cierran la brecha; al registrar todas queda «2 de 2» en verde y sin CTA
// (no queda nada que hacer).
export function FollowUpKpi({deals, isDone, onOpen}) {
  const followed = deals.filter(isDone).length;
  const complete = followed === deals.length;
  return <>
    <div className="kpi-label">Negociaciones al día<KpiIcon icon="handshake" tip="Negociaciones que cierran la brecha"/></div>
    <div className={['value', 'followup-value', complete && 'is-complete'].filter(Boolean).join(' ')}>{followed} de {deals.length}</div>
    {!complete && <Button variant="primary" size="small" fullWidth className="followup-cta" aria-haspopup="dialog" onClick={onOpen}>Dar seguimiento</Button>}
  </>;
}

// Móvil: el mismo KPI fijo abajo, a mano mientras haya seguimientos pendientes (es la acción más importante de la pantalla).
// Al completarlos muestra el verde «2 de 2» un momento y se retira; el KPI vuelve a la tarjeta. Si al montar ya está
// completo, no aparece. Va en un portal al body: la tarjeta del periodo tiene desenfoque y sería la caja de un elemento
// fijo dentro de ella. En escritorio no se pinta. `paused`: mientras el sheet de negociaciones está abierto la barra
// queda detrás, así que la cuenta para retirarla empieza al cerrarlo (el usuario ve el verde).
const DOCK_HOLD = 1600;
const DOCK_OUT = 320;
export function FollowUpDock({paused, ...props}) {
  const complete = props.deals.every(props.isDone);
  const [phase, setPhase] = useState(complete ? 'gone' : 'shown');
  useEffect(() => {
    if (!complete) { setPhase('shown'); return; }
    if (phase !== 'shown' || paused) return;
    const hold = setTimeout(() => setPhase('leaving'), DOCK_HOLD);
    const out = setTimeout(() => setPhase('gone'), DOCK_HOLD + (reducedMotion() ? 0 : DOCK_OUT));
    return () => { clearTimeout(hold); clearTimeout(out); };
  }, [complete, paused]);
  // Alto de la barra en --dock-h: los toasts se apilan encima de ella en lugar de taparla
  const dock = useRef(null);
  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--dock-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty('--dock-h'); };
  }, [phase === 'gone']);
  if (phase === 'gone') return null;
  return createPortal(<div ref={dock} className={['followup-dock', 'card', 'card--featured', phase === 'leaving' && 'is-leaving'].filter(Boolean).join(' ')} data-theme="dark" role="region" aria-label="Seguimiento de negociaciones">
    <FollowUpKpi {...props}/>
  </div>, document.body);
}

// Contenido del modal «Negociaciones que cierran la brecha», con el modelo del detalle de oportunidad: cifras clave
// arriba (valor sumado y avance) y filas de 56 px debajo, una por negociación: avatar y responsable a la izquierda
// con la empresa, el valor y cuándo es el contacto; a la derecha «Registrar» o la pill «Al día».
// Registrar → la pill «Al día» aparece delante y el mismo botón pasa a «Deshacer» (transparent): es el mismo elemento,
// así que el foco de teclado se queda en la fila. Cada cambio se anuncia en una región role="status" oculta.
export function NegotiationsSummary({deals, isDone, onMark, onUndo, onSelect, focusRow}) {
  const followed = deals.filter(isDone).length;
  const [message, setMessage] = useState('');
  // Al volver del detalle, el foco regresa al responsable que se abrió
  const list = useRef(null);
  useEffect(() => { if (focusRow) list.current?.querySelector(`[data-row="${CSS.escape(focusRow)}"]`)?.focus(); }, []);
  const toggle = row => {
    const doneNow = !isDone(row);
    (doneNow ? onMark : onUndo)(row);
    setMessage(`Seguimiento de ${row[0]} ${doneNow ? 'registrado' : 'deshecho'}. ${followed + (doneNow ? 1 : -1)} de ${deals.length} al día.`);
  };
  return <div className="detail negotiations">
    <div className="detail-figures">
      <div><div className="kpi-label">En negociación · COP</div><div className="value">${sumValue(deals)} M</div></div>
      <div><div className="kpi-label">Con seguimiento</div><div className={['value', 'followup-value', followed === deals.length && 'is-complete'].filter(Boolean).join(' ')}>{followed} de {deals.length}</div></div>
    </div>
    <ul className="negotiations-list" aria-label="Responsables" ref={list}>{deals.map(row => <li key={row[0]}>
      <Avatar name={row[3]} photo={PHOTOS[row[3]]}/>
      <button type="button" className="negotiations-name" data-row={row[0]} onClick={() => onSelect(row)} aria-label={`${row[3]}: ver ${row[0]}`}>
        <span>{row[3]}</span><span className="negotiations-meta">{row[0]} · ${row[2]} M · {contactLabel(row[4], true).split(' · ')[1]}</span>
      </button>
      {isDone(row) && <StatusPill done/>}
      <Button variant={isDone(row) ? 'transparent' : 'secondary'} size="small" onClick={() => toggle(row)}
        aria-label={`${isDone(row) ? 'Deshacer' : 'Registrar'} seguimiento de ${row[0]}`}>{isDone(row) ? 'Deshacer' : 'Registrar'}</Button>
    </li>)}</ul>
    <p className="sr-only" role="status">{message}</p>
  </div>;
}
