import {useEffect, useRef} from 'react';

// Soporte de teclado compartido por los productos.
export const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const visible = el => el.getClientRects().length > 0 && !el.closest('[inert], [hidden], [aria-hidden=true]');
export const focusables = root => [...root.querySelectorAll(FOCUSABLE)].filter(el => el.tabIndex >= 0 && visible(el));

// Primer enfocable que sigue a `el` en el documento (fuera de `el`).
function nextFocusable(el) {
  return focusables(document).find(f => !el.contains(f) && (el.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING));
}

// Enfoca un elemento que no es enfocable de por sí (título, main): tabindex -1, sin dejarlo en el orden de Tab.
export function focusTarget(el) {
  if (!el) return;
  if (!el.matches(FOCUSABLE) && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus();
}

// useKeyboardSupport: se monta una vez por producto.
// 1. Rescate de foco: si el elemento con foco desaparece (cerrar el aviso, «Intentar de nuevo», un botón que se va),
//    el foco no cae al inicio de la página. Va a lo que sigue en el bloque que sobrevive: dentro de una tarjeta o
//    región, a su primer enfocable o a su título; si la tarjeta se volvió a montar (reintento), a su título; si se fue
//    el bloque entero, al siguiente enfocable de la página; si no hay, al <main>.
// 2. Foco sin tapar: si el elemento enfocado queda debajo de algo fijo marcado con data-obscures (cabecera, filtros
//    fijos, barra inferior), la página se desplaza lo justo para dejarlo a la vista, con 8 px de aire.
export function useKeyboardSupport() {
  useEffect(() => {
    let pending = null;
    const onFocusOut = e => {
      if (e.relatedTarget) return;
      const target = e.target;
      const next = nextFocusable(target);
      const ancestors = [];
      for (let a = target.parentElement; a; a = a.parentElement) ancestors.push(a);
      const title = target.closest('section, [role=region], article')?.querySelector('h2, h3')?.textContent;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (target.isConnected && !target.disabled) return;
        if (active && active !== document.body) return;
        const kept = ancestors.find(a => a.isConnected);
        const region = kept?.closest('section, [role=dialog], [role=region], article');
        if (region && region.tagName !== 'MAIN') {
          const inside = focusables(region)[0];
          return inside ? inside.focus() : focusTarget(region.querySelector('h1, h2, h3') || region);
        }
        const again = title && [...document.querySelectorAll('main h2, main h3')].find(h => h.textContent === title);
        if (again) return focusTarget(again);
        if (next?.isConnected && visible(next)) return next.focus();
        focusTarget(document.querySelector('main'));
      });
    };
    const onFocusIn = e => {
      const el = e.target;
      if (el === document.body || el.tagName === 'MAIN') return;
      const r = el.getBoundingClientRect();
      for (const o of document.querySelectorAll('[data-obscures]')) {
        if (o.contains(el) || !visible(o)) continue;
        const b = o.getBoundingClientRect();
        if (b.bottom <= r.top || b.top >= r.bottom || b.right <= r.left || b.left >= r.right) continue;
        if (b.top < innerHeight / 2) window.scrollBy(0, r.top - b.bottom - 8);
        else window.scrollBy(0, r.bottom - b.top + 8);
        return;
      }
    };
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('focusin', onFocusIn);
    return () => { document.removeEventListener('focusout', onFocusOut); document.removeEventListener('focusin', onFocusIn); cancelAnimationFrame(pending); };
  }, []);
}

// useDrawer: menú lateral móvil como panel modal.
// Al abrir, el foco entra al primer enlace y el resto de la página (inert) no recibe foco ni clics; Tab y
// Shift+Tab giran dentro del cajón. Escape (o el fondo) cierra y el foco vuelve al botón «Menú».
export function useDrawer(open, onClose, id = 'sidebar', inert = 'main, header') {
  const opener = useRef(null);
  useEffect(() => {
    if (!open) return;
    const drawer = document.getElementById(id);
    opener.current = document.activeElement;
    const others = [...document.querySelectorAll(inert)].filter(el => !el.contains(drawer));
    others.forEach(el => { el.inert = true; });
    requestAnimationFrame(() => focusables(drawer)[0]?.focus());
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables(drawer);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!drawer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      others.forEach(el => { el.inert = false; });
      const back = opener.current;
      if (back?.isConnected && (!document.activeElement || document.activeElement === document.body || drawer?.contains(document.activeElement))) back.focus();
    };
  }, [open]);
}

// Roving tabindex: una sola parada de Tab para un grupo (columnas de una gráfica, filas de una lista);
// las flechas recorren los elementos, Inicio y Fin van al primero y al último.
export function useRoving(count) {
  const index = useRef(0);
  const refs = useRef([]);
  const props = i => ({
    ref: el => { refs.current[i] = el; },
    tabIndex: i === Math.min(index.current, count - 1) ? 0 : -1,
    onFocus: () => {
      index.current = i;
      refs.current.forEach((el, j) => el && el.setAttribute('tabindex', j === i ? '0' : '-1'));
    },
    onKeyDown: e => {
      const move = {ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: count - 1}[e.key];
      if (move === undefined) return;
      e.preventDefault();
      refs.current[Math.max(0, Math.min(count - 1, move))]?.focus();
    },
  });
  return props;
}
