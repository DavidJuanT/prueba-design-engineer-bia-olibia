import React from 'react';
import {Icon} from './icons';
import './chip.css';

// Chip: etiqueta corta de un valor elegido (un filtro, una etiqueta) que se puede quitar con su ×.
// - `onRemove` añade la ×; sin él es un chip de solo lectura.
// - `removeLabel` es el nombre accesible de la × («Quitar filtro Etapa: Negociación»).
// - `forceState` (solo guías): 'hover' o 'focus' en la ×.
export function Chip({children, onRemove, removeLabel, forceState, as: Tag = 'span'}) {
  return <Tag className={['chip', onRemove && 'chip--removable', forceState && `is-${forceState}`].filter(Boolean).join(' ')}>
    <span>{children}</span>
    {onRemove && <button type="button" className="chip-remove" aria-label={removeLabel || `Quitar ${children}`} onClick={onRemove}><Icon name="close" size={16}/></button>}
  </Tag>;
}
