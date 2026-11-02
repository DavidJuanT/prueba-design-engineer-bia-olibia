import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Icon} from './icons';
import './toast.css';

// Toast (snackbar): confirma el resultado de un proceso sin interrumpir.
// Tipos: success (proceso exitoso) · error (falló) · neutral (información).
// - Tamaño: ancho fijo de 450 px en todos los casos y 58 px de alto en una línea (base Material 3 + 10 px); abajo al centro.
//   En móvil ocupa el ancho de la pantalla con 16 px de margen.
// - Duración: success y neutral se cierran solos a los 4 s; error se queda hasta cerrarlo (WCAG 2.2.1).
//   El tiempo se pausa con el puntero encima o con el foco dentro.
// - Accesibilidad: success y neutral se anuncian con role="status" (educado); error con role="alert".
// - Se apilan hasta 3; el más nuevo abajo.
const DURATION = {success: 4000, neutral: 4000, error: null};
const ICON = {success: 'success', error: 'error', neutral: 'info'};
const MAX = 3;
const ToastContext = createContext(() => {});

// show({type, title, message, action: {label, onClick}, duration})
export const useToast = () => useContext(ToastContext);

export function ToastProvider({children}) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback(toast => {
    const id = Math.random().toString(36).slice(2);
    setToasts(list => [...list, {id, type: 'neutral', ...toast}].slice(-MAX));
    return id;
  }, []);
  const dismiss = useCallback(id => setToasts(list => list.filter(t => t.id !== id)), []);
  return <ToastContext.Provider value={show}>
    {children}
    <div className="toast-region" role="region" aria-label="Notificaciones">
      {toasts.map(t => <Toast key={t.id} {...t} onClose={() => dismiss(t.id)}/>)}
    </div>
  </ToastContext.Provider>;
}

// Un toast. También se usa solo en la guía (static: sin temporizador ni cierre automático).
export function Toast({type = 'neutral', title, message, action, duration = DURATION[type], onClose, static: isStatic}) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const started = useRef(0);
  const close = useCallback(() => setLeaving(true), []);

  // Temporizador que se pausa con hover o foco; reanuda con el tiempo que quedaba.
  useEffect(() => {
    if (!duration || isStatic || paused || leaving) return;
    started.current = performance.now();
    const t = setTimeout(close, remaining.current);
    return () => { clearTimeout(t); remaining.current -= performance.now() - started.current; };
  }, [duration, isStatic, paused, leaving, close]);

  return <div className={['toast', `toast--${type}`, leaving && 'is-leaving', paused && 'is-paused'].filter(Boolean).join(' ')}
    role={type === 'error' ? 'alert' : 'status'} style={duration ? {'--toast-duration': `${duration}ms`} : undefined}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    onAnimationEnd={e => { if (leaving && e.target === e.currentTarget) onClose?.(); }}>
    <Icon name={ICON[type]} size={20}/>
    <div className="toast-text"><strong>{title}</strong>{message && <span>{message}</span>}</div>
    {action && <button type="button" className="toast-action" onClick={() => { action.onClick?.(); close(); }}>{action.label}</button>}
    {/* Solo los que no se cierran solos (error) llevan botón de cerrar; los temporizados desaparecen con su tiempo */}
    {onClose && !duration && <button type="button" className="toast-close" aria-label="Cerrar notificación" onClick={close}><Icon name="close" size={18}/></button>}
    {duration && !isStatic && <span className="toast-timer" aria-hidden="true"/>}
  </div>;
}
