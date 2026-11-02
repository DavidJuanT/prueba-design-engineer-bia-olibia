import React, {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {Icon} from './icons';
import {fixedBox} from './dropdown';
import './tooltip.css';

// Lógica común de los tooltips. No depende del hover: se abre con hover, con foco de teclado y con
// toque/clic (que lo deja fijo). Cumple WCAG 1.4.13: se puede descartar (Escape), se puede recorrer con
// el puntero sin que desaparezca y permanece mientras el puntero o el foco estén en él.
function useTooltip(forceOpen, follow = false) {
  const tipId = useId();
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const bubble = useRef(null);
  const pointerX = useRef(null); // follow: posición x del ratón; la burbuja y su flecha la siguen
  const placeRef = useRef(null);
  const open = forceOpen || ((hover || focus || pinned) && !dismissed);

  // Fijado con clic o toque: se cierra al tocar fuera.
  useEffect(() => {
    if (!pinned) return;
    const onDown = e => { if (!root.current?.contains(e.target)) setPinned(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [pinned]);

  // Escape lo descarta aunque el foco esté en otro sitio (el puntero puede seguir encima).
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') { setDismissed(true); setPinned(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Si la burbuja se sale por la derecha (móvil), se desplaza a la izquierda. Después se mide dónde cae
  // el centro del disparador para colocar la flecha justo debajo (la flecha mide 9 px con su borde).
  // Dentro de un contenedor con scroll (la tabla) la burbuja se coloca fija, como el menú del desplegable: si no,
  // el overflow del contenedor la recorta. Se recoloca al hacer scroll.
  useLayoutEffect(() => {
    const el = bubble.current;
    if (!open || !el) return;
    const clipped = root.current.closest('.scroll');
    const place = () => {
      // Se mide con offsetLeft/offsetWidth y rects del disparador: no los altera la escala de la animación de entrada.
      el.style.removeProperty('--shift');
      const t = trigger.current, tr = t.getBoundingClientRect();
      let left;
      if (clipped) {
        const box = fixedBox(root.current), rr = root.current.getBoundingClientRect();
        left = rr.left - 8;
        Object.assign(el.style, {position: 'fixed', top: `${tr.bottom + 8 - box.top}px`, left: `calc(${left - box.left}px + var(--shift, 0px))`});
      } else left = root.current.getBoundingClientRect().left + el.offsetLeft;
      // Con follow y ratón, la flecha apunta al cursor y la burbuja empieza 16 px antes; si no, al centro del disparador
      const anchor = follow && pointerX.current != null ? pointerX.current : tr.left + tr.width / 2;
      const start = follow && pointerX.current != null ? anchor - 16 - left : 0;
      const over = left + start + el.offsetWidth - (document.documentElement.clientWidth - 16);
      const shift = follow ? Math.max(start - Math.max(over, 0), 16 - left) : over > 0 ? -over : 0;
      if (shift) el.style.setProperty('--shift', `${shift}px`);
      el.style.setProperty('--arrow-x', `${anchor - (left + shift) - el.clientLeft - 4.5}px`);
    };
    place();
    placeRef.current = place;
    if (!clipped) return () => { placeRef.current = null; };
    addEventListener('scroll', place, true);
    addEventListener('resize', place);
    return () => { placeRef.current = null; removeEventListener('scroll', place, true); removeEventListener('resize', place); };
  }, [open]);

  return {
    open,
    rootProps: {
      ref: root,
      onPointerEnter: e => { if (e.pointerType === 'mouse') { setHover(true); setDismissed(false); } },
      onPointerLeave: e => { if (e.pointerType === 'mouse') { setHover(false); pointerX.current = null; } },
      // follow: solo sobre el disparador, para que la burbuja no se mueva al pasar el puntero a ella
      onPointerMove: follow ? e => { if (e.pointerType === 'mouse' && trigger.current?.contains(e.target)) { pointerX.current = e.clientX; placeRef.current?.(); } } : undefined,
    },
    // Sin aria-expanded: un tooltip no expande nada. La descripción está siempre enlazada, así el lector la lee al enfocar.
    triggerProps: {
      ref: trigger,
      'aria-describedby': tipId,
      onFocus: e => { if (e.target.matches(':focus-visible')) { setFocus(true); setDismissed(false); } },
      onBlur: () => setFocus(false),
      onClick: () => { if (pinned && !dismissed) setPinned(false); else { setPinned(true); setDismissed(false); } },
    },
    // Siempre en el DOM (oculta con hidden cuando está cerrada): aria-describedby funciona aunque no se vea.
    bubbleProps: {ref: bubble, role: 'tooltip', id: tipId, className: 'infotip-bubble', hidden: !open},
  };
}

// Icono de información con tooltip, junto a un título.
// forceOpen: lo deja abierto (solo para la guía). className: variante visual.
export function InfoTip({label, children, forceOpen = false, className}) {
  const {open, rootProps, triggerProps, bubbleProps} = useTooltip(forceOpen);
  return <span {...rootProps} className={['infotip', open && 'is-open', className].filter(Boolean).join(' ')}>
    <button type="button" className="btn btn--transparent infotip-trigger" aria-label={label} {...triggerProps}>
      <Icon name="info" size={18}/>
    </button>
    <span {...bubbleProps}>{children}</span>
  </span>;
}

// Tooltip sobre cualquier elemento (p. ej. una pill): el elemento se vuelve enfocable con teclado.
// label: nombre accesible completo del disparador, para que no dependa del tooltip.
// follow (opcional): con ratón, la burbuja y su flecha siguen al cursor; útil en disparadores anchos (una barra).
// Con teclado o toque se coloca como siempre, bajo el centro del disparador.
// rove (opcional): props de useRoving cuando varios tooltips forman un grupo con una sola parada de Tab (barras de una gráfica).
export function Tooltip({content, label, children, forceOpen = false, follow = false, rove}) {
  const {open, rootProps, triggerProps, bubbleProps} = useTooltip(forceOpen, follow);
  const roving = rove && {tabIndex: rove.tabIndex, onKeyDown: rove.onKeyDown,
    ref: el => { triggerProps.ref.current = el; rove.ref(el); }, onFocus: e => { triggerProps.onFocus(e); rove.onFocus(e); }};
  return <span {...rootProps} className={['infotip', 'tooltip', open && 'is-open'].filter(Boolean).join(' ')}>
    <span tabIndex={0} role="button" aria-label={label} className="tooltip-trigger" {...triggerProps} {...roving}>{children}</span>
    <span {...bubbleProps}>{content}</span>
  </span>;
}
