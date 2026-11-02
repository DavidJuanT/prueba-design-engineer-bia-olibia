import React, {useRef} from 'react';
import {Icon} from './icons';
import './search.css';

// Campo de búsqueda del design system: mismo borde inferior que el Desplegable, lupa a la izquierda
// y botón para borrar cuando hay texto. Escape también borra (como el input search nativo).
// forceState: 'hover' | 'focus' solo para mostrar el estado en la guía.
export function SearchField({value, onChange, label, placeholder, disabled, className, forceState}) {
  const input = useRef(null);
  const clear = () => { onChange(''); input.current?.focus(); };
  return <div className={['search-field', value && 'has-value', forceState && `is-${forceState}`, className].filter(Boolean).join(' ')}>
    <Icon name="search"/>
    <input ref={input} type="search" aria-label={label} placeholder={placeholder} value={value} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange(''); } }}/>
    {value && !disabled && <button type="button" className="btn btn--transparent search-clear" aria-label="Borrar búsqueda" title="Borrar búsqueda" onClick={clear}>
      <Icon name="close" size={16}/>
    </button>}
  </div>;
}
