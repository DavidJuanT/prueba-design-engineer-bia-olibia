import React, {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {IconButton} from './button';
import './modal.css';
import {reducedMotion} from './media';

// Modal del design system. Dos tamaños:
// - large (860 × 560): navegación y contenido propios a ancho completo, sin relleno (Configuración).
// - medium (560): contenido con relleno de 24 px y pie opcional con acciones (detalle de oportunidad).
// Cabecera: título con el estilo de los h2 (--font-heading) y botón de cerrar; divisor debajo.
// Pie (`footer`): estado a la izquierda y acciones a la derecha, botones medium del ancho de su texto.
// Accesibilidad: role=dialog con aria-modal; el foco entra al botón de cerrar, Tab y Mayús+Tab quedan atrapados
// dentro, Escape o clic en el fondo cierran, y al cerrarse el foco vuelve al elemento que lo abrió.
// Con `sheet`, en móvil se presenta como bottom sheet en lugar de ventana centrada.
// `inline` (solo guías): se dibuja en la página, sin fondo ni trampa de foco.
// `onBack`: navegación dentro del mismo modal (lista → detalle). Muestra «Volver» a la izquierda del título, que recibe
// el foco al aparecer; `view` identifica la vista para que el cuerpo entre deslizándose al cambiar.
// Animación «Elevación en capas»: entra subiendo y crece, con cabecera, cuerpo y pie en cascada; al cerrar baja con
// fundido y el modal se desmonta al terminar la salida (180 ms). Con movimiento reducido, todo es inmediato.
const EXIT_MS = 180;
export function Modal({title, onClose: close, size = 'medium', sheet = false, inline = false, footer, onBack, view, children}) {
  const titleId = useId();
  const dialog = useRef(null);
  const [opener] = useState(() => document.activeElement);
  const [closing, setClosing] = useState(false);
  useEffect(() => () => { if (!inline) opener?.focus?.(); }, [opener, inline]);
  const onClose = () => {
    if (inline || closing) return;
    if (reducedMotion()) { close(); return; }
    setClosing(true);
    setTimeout(close, EXIT_MS);
  };

  const onKeyDown = e => {
    if (inline) return;
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab') return;
    // Trampa de foco: del último elemento se vuelve al primero y viceversa
    const items = [...dialog.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  // Fuera de la guía se monta en <body>: un ancestro con desenfoque (los filtros fijos) atraparía su posición fija.
  const layer = <div className={['dialog', `dialog--${size}`, sheet && 'sheet', inline && 'dialog--inline', closing && 'is-closing'].filter(Boolean).join(' ')} onKeyDown={onKeyDown}
    onMouseDown={e => { if (!inline && e.target === e.currentTarget) onClose(); }}>
    {/* div y no article/header/footer: role=dialog no se permite en article, y un header fuera de main cuenta como
        segundo «banner» para el lector de pantalla */}
    <div ref={dialog} className="dialog-window" role="dialog" aria-modal={!inline} aria-labelledby={titleId}>
      <div className="dialog-header">{onBack && <IconButton icon="back" label="Volver" className="dialog-back" autoFocus onClick={onBack}/>}<h2 id={titleId}>{title}</h2><IconButton icon="close" label="Cerrar" autoFocus={!inline && !onBack} onClick={onClose}/></div>
      <div className={['dialog-body', view && 'dialog-view'].filter(Boolean).join(' ')} key={view}>{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </div>
  </div>;
  return inline ? layer : createPortal(layer, document.body);
}
