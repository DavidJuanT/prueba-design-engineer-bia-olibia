import React, {useEffect, useId, useRef, useState} from 'react';
import {Icon} from './icons';
import './dropdown.css';
import {MOBILE_QUERY} from './media';

const MENU_MAX = 320;   // Alto máximo del menú; con más opciones aparece scroll
const GAP = 4;          // Separación entre disparador y menú
// Compara sin mayúsculas ni tildes: «cal» encuentra «Calificación».
const fold = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Desplegable del design system: solo borde inferior y menú flotante propio (el <select> nativo no se puede estilizar).
// options: [[value, label, lead], ...] — lead opcional: icono o avatar a la izquierda de la opción; el de la opción
// elegida se repite en el disparador. icon: nombre de Icon fijo en el disparador (si la opción no trae lead).
// Teclado: Enter/Espacio/flechas abren; flechas, Inicio y Fin recorren; escribir salta a la opción que empieza así;
// Enter elige; Escape y Tab cierran.
// Abre hacia abajo si cabe; si no, hacia el lado con más espacio. Fijo a la ventana para que
// ningún contenedor con scroll (el modal de Configuración) lo recorte. `extra`: alto añadido (pie con botones).
function placeMenu(rootEl, count, extra = 0) {
  const rect = rootEl.getBoundingClientRect();
  const row = matchMedia(MOBILE_QUERY).matches ? 44 : 40;
  const wanted = Math.min(count * row + 10, MENU_MAX) + extra;
  const below = innerHeight - rect.bottom - GAP * 2;
  const above = rect.top - GAP * 2;
  const up = below < wanted && above > below;
  const box = fixedBox(rootEl);
  return {up, style: {
    position: 'fixed', left: rect.left - box.left, right: 'auto', width: rect.width,
    maxHeight: Math.min(MENU_MAX + extra, up ? above : below),
    ...(up ? {top: 'auto', bottom: box.bottom - rect.top + GAP} : {top: rect.bottom + GAP - box.top, bottom: 'auto'}),
  }};
}

// Caja respecto a la que se coloca un elemento fijo. Un ancestro con desenfoque, filtro o transformación (los filtros
// fijos y los modales de la capa vidrio) pasa a ser esa caja en lugar de la ventana; sin él, la ventana.
export function fixedBox(el) {
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const c = getComputedStyle(node);
    if (c.transform !== 'none' || c.filter !== 'none' || (c.backdropFilter && c.backdropFilter !== 'none') || c.webkitBackdropFilter && c.webkitBackdropFilter !== 'none' || c.perspective !== 'none' || /paint|layout|strict|content/.test(c.contain)) {
      const r = node.getBoundingClientRect();
      return {left: r.left + node.clientLeft, top: r.top + node.clientTop, bottom: r.top + node.clientTop + node.clientHeight};
    }
  }
  return {left: 0, top: 0, bottom: innerHeight};
}


// labelledBy: id de una etiqueta que no envuelve al desplegable (si lo envuelve, se detecta sola).
export function Dropdown({id, value, options, onChange, icon, disabled, className, labelledBy, 'aria-label': ariaLabel, forceState}) {
  const auto = useId();
  const triggerId = id || `dd-${auto}`;
  const listId = `${triggerId}-list`;
  const valueId = `${triggerId}-value`;
  const [open, setOpen] = useState(forceState === 'open');
  // En la guía, el estado «open» fijo muestra además una fila en hover.
  const [active, setActive] = useState(forceState === 'open' ? 1 : -1);
  const [closing, setClosing] = useState(false);
  const [picked, setPicked] = useState(0); // Cuenta selecciones para re-animar el valor en el disparador
  const [place, setPlace] = useState(null); // Posición fija del menú, calculada al abrir
  const [wrapLabelId, setLabelId] = useState();
  const labelId = labelledBy || wrapLabelId;
  const root = useRef(null);
  const menu = useRef(null);
  const search = useRef({text: '', timer: 0});
  const selectedIndex = options.findIndex(([v]) => v === value);
  const label = options[selectedIndex]?.[1] ?? '';
  const lead = options[selectedIndex]?.[2];

  // Nombre accesible = etiqueta + valor («Etapa, Todas las etapas»), no solo la etiqueta.
  useEffect(() => {
    const field = root.current?.closest('label');
    if (labelledBy || !field) return;
    field.id ||= `${triggerId}-label`;
    setLabelId(field.id);
  }, [triggerId, labelledBy]);

  // Clic fuera cierra con animación; scroll de la página o cambio de tamaño cierran al instante
  // porque el menú está fijado a la posición del disparador.
  useEffect(() => {
    if (!open || forceState) return;
    const onDown = e => { if (!root.current?.contains(e.target)) close(); };
    const onScroll = e => { if (!menu.current?.contains(e.target)) finishClose(); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', finishClose);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', finishClose);
    };
  }, [open, forceState]);

  // La opción marcada con teclado siempre queda a la vista dentro del menú.
  useEffect(() => {
    if (open && active >= 0) menu.current?.children[active]?.scrollIntoView({block: 'nearest'});
  }, [open, active]);

  function show(index = selectedIndex) { setPlace(placeMenu(root.current, options.length)); setClosing(false); setOpen(true); setActive(Math.max(index, 0)); }
  // Cerrar: primero corre la animación de salida y luego se desmonta el menú (con movimiento reducido es inmediato).
  function close() { if (open) setClosing(true); }
  function finishClose() { setOpen(false); setClosing(false); }
  // Elegir: el menú empieza a recogerse en el mismo clic y, a la vez, el valor nuevo entra suave en el disparador.
  function choose(index) { onChange?.(options[index][0]); close(); setPicked(n => n + 1); root.current?.querySelector('button')?.focus(); }

  // Buscar escribiendo, como en el <select> nativo: las letras se acumulan durante 500 ms;
  // repetir la misma letra recorre las opciones que empiezan por ella.
  function typeAhead(char) {
    const s = search.current;
    clearTimeout(s.timer);
    s.text = s.text === char ? char : s.text + char;
    s.timer = setTimeout(() => { s.text = ''; }, 500);
    const from = open ? active : selectedIndex;
    const start = s.text.length === 1 ? from + 1 : from;
    const query = fold(s.text);
    for (let k = 0; k < options.length; k++) {
      const i = (start + k + options.length) % options.length;
      if (fold(options[i][1]).startsWith(query)) { open && !closing ? setActive(i) : show(i); return; }
    }
  }

  function onKeyDown(e) {
    const last = options.length - 1;
    const typing = search.current.text !== '';
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key !== ' ' || typing)) { e.preventDefault(); typeAhead(fold(e.key)); return; }
    if (!open || closing) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); show(e.key === 'ArrowUp' ? last : selectedIndex); }
      return;
    }
    const move = {ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last}[e.key];
    if (move !== undefined) { e.preventDefault(); setActive(move); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    // stopPropagation: dentro de un modal, Escape cierra el menú y no el modal.
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close();
  }

  return <div ref={root} className={['dropdown', open && !closing && 'is-open', forceState && `is-${forceState}`, (icon || lead) && 'has-icon', className].filter(Boolean).join(' ')}>
    <button type="button" id={triggerId} className="dropdown-trigger" disabled={disabled}
      aria-label={labelId ? undefined : ariaLabel} aria-labelledby={labelId ? `${labelId} ${valueId}` : undefined}
      aria-haspopup="listbox" aria-expanded={open && !closing} aria-controls={open ? listId : undefined}
      aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
      onClick={() => (open && !closing ? close() : show())} onKeyDown={onKeyDown}>
      {lead ? <span className="dropdown-lead" key={`lead-${picked}`}>{lead}</span> : icon && <Icon name={icon} size={16}/>}
      <span id={valueId} className={['dropdown-value', picked > 0 && 'is-picked'].filter(Boolean).join(' ')} key={picked}>{label}</span>
      <Icon name="chevron"/>
    </button>
    {open && <ul ref={menu} className={['dropdown-menu', place?.up && 'is-up', closing && 'is-closing'].filter(Boolean).join(' ')}
      style={forceState ? undefined : place?.style} role="listbox" id={listId} aria-labelledby={labelId || triggerId}
      // preventDefault: si el desplegable está dentro de un <label>, el clic no debe reenviarse al disparador y reabrir el menú.
      onClick={e => e.preventDefault()}
      onAnimationEnd={e => { if (closing && e.target === e.currentTarget) finishClose(); }}>
      {options.map(([v, text, optionLead], i) => <li key={v} id={`${listId}-${i}`} role="option" aria-selected={v === value}
        className={i === active ? 'is-active' : undefined} style={{'--i': i}}
        onPointerEnter={() => setActive(i)} onPointerDown={e => e.preventDefault()} onClick={e => { e.preventDefault(); choose(i); }}>{optionLead && <span className="dropdown-lead">{optionLead}</span>}<span className="dropdown-option-text">{text}</span></li>)}
    </ul>}
  </div>;
}

// Desplegable de selección múltiple: opciones con casilla y pie con «Limpiar» y «Aplicar».
// La selección es un borrador mientras el menú está abierto: solo se aplica con «Aplicar» (o Enter);
// Escape o clic fuera cierran sin cambiar nada. Así varios cambios producen un solo filtrado.
// value: array de valores · options: [[value, label]] · allLabel: texto cuando no hay nada elegido
// (equivale a «todas») · unit: plural para el resumen («2 etapas»).
const FOOTER = 56;
export function MultiDropdown({id, value, options, onApply, allLabel, unit, labelledBy, className, forceState}) {
  const auto = useId();
  const triggerId = id || `dd-${auto}`;
  const listId = `${triggerId}-list`;
  const valueId = `${triggerId}-value`;
  const [open, setOpen] = useState(forceState === 'open');
  const [draft, setDraft] = useState(value);
  const [active, setActive] = useState(forceState === 'open' ? 2 : 0);
  const [closing, setClosing] = useState(false);
  const [picked, setPicked] = useState(0);
  const [place, setPlace] = useState(null);
  const [wrapLabelId, setLabelId] = useState();
  const labelId = labelledBy || wrapLabelId;
  const root = useRef(null);
  const summary = !value.length ? allLabel : value.length === 1 ? options.find(([v]) => v === value[0])?.[1] : `${value.length} ${unit}`;

  useEffect(() => {
    const field = root.current?.closest('label');
    if (labelledBy || !field) return;
    field.id ||= `${triggerId}-label`;
    setLabelId(field.id);
  }, [triggerId, labelledBy]);

  useEffect(() => {
    if (!open || forceState) return;
    const onDown = e => { if (!root.current?.contains(e.target)) close(); };
    const onScroll = e => { if (!root.current?.querySelector('.dropdown-menu')?.contains(e.target)) finishClose(); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', finishClose);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', finishClose);
    };
  }, [open, forceState]);

  function show() { setDraft(value); setPlace(placeMenu(root.current, options.length, FOOTER)); setClosing(false); setOpen(true); setActive(0); }
  function close() { if (open) setClosing(true); }
  function finishClose() { setOpen(false); setClosing(false); }
  const toggle = v => setDraft(d => d.includes(v) ? d.filter(x => x !== v) : options.map(([o]) => o).filter(o => o === v || d.includes(o)));
  function apply() { onApply?.(draft); setPicked(n => n + 1); close(); root.current?.querySelector('button')?.focus(); }

  function onKeyDown(e) {
    const last = options.length - 1;
    if (!open || closing) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    const move = {ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last}[e.key];
    if (move !== undefined) { e.preventDefault(); setActive(move); }
    else if (e.key === ' ') { e.preventDefault(); toggle(options[active][0]); }
    else if (e.key === 'Enter') { e.preventDefault(); apply(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }

  return <div ref={root} className={['dropdown', 'dropdown--multi', open && !closing && 'is-open', forceState && `is-${forceState}`, className].filter(Boolean).join(' ')}
    onBlur={e => { if (!forceState && open && !root.current.contains(e.relatedTarget)) close(); }}>
    <button type="button" id={triggerId} className="dropdown-trigger"
      aria-labelledby={labelId ? `${labelId} ${valueId}` : undefined}
      aria-haspopup="listbox" aria-expanded={open && !closing} aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${listId}-${active}` : undefined}
      onClick={() => (open && !closing ? close() : show())} onKeyDown={onKeyDown}>
      <span id={valueId} className={['dropdown-value', picked > 0 && 'is-picked'].filter(Boolean).join(' ')} key={picked}>{summary}</span>
      <Icon name="chevron"/>
    </button>
    {open && <div className={['dropdown-menu', 'dropdown-menu--multi', place?.up && 'is-up', closing && 'is-closing'].filter(Boolean).join(' ')}
      style={forceState ? undefined : place?.style}
      onClick={e => e.preventDefault()}
      onAnimationEnd={e => { if (closing && e.target === e.currentTarget) finishClose(); }}>
      <ul role="listbox" id={listId} aria-multiselectable="true" aria-labelledby={labelId || triggerId}>
        {options.map(([v, text], i) => <li key={v} id={`${listId}-${i}`} role="option" aria-selected={draft.includes(v)}
          className={i === active ? 'is-active' : undefined} style={{'--i': i}}
          onPointerEnter={() => setActive(i)} onPointerDown={e => e.preventDefault()} onClick={e => { e.preventDefault(); toggle(v); }}>
          <span className="dd-check" aria-hidden="true">{draft.includes(v) && <Icon name="check" size={14}/>}</span>{text}
        </li>)}
      </ul>
      <div className="dropdown-footer">
        <button type="button" className="btn btn--small btn--transparent" onClick={() => setDraft([])} disabled={!draft.length}>Limpiar</button>
        <button type="button" className="btn btn--small btn--primary" onClick={apply}>Aplicar</button>
      </div>
    </div>}
  </div>;
}
