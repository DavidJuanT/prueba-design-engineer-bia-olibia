import React from 'react';
import {Button} from './button';
import './empty-state.css';

// Estado vacío: la búsqueda o los filtros no dejan ningún resultado (no es un error: los datos sí llegaron).
// Ilustración en línea de la misma familia que el Fallback (una lupa que recorre filas vacías), un título que dice
// qué no se encontró, una sugerencia y una acción que deshace lo que dejó la lista vacía.
// role="status": el lector de pantalla lo anuncia sin interrumpir.
export function EmptyState({title, message, action, onAction}) {
  return <div className="empty-state" role="status">
    <SearchIllustration/>
    <p className="empty-state-title">{title}</p>
    {message && <p className="empty-state-text">{message}</p>}
    {action && <Button variant="transparent" onClick={onAction}>{action}</Button>}
  </div>;
}

// Lupa sobre tres filas vacías (punteadas): la búsqueda recorre la lista y no encuentra nada.
// Trazo de 2 px con extremos redondeados; filas y mango en gris, lente y brillo en el morado del sistema.
function SearchIllustration() {
  return <svg className="empty-state-art" width="112" height="64" viewBox="0 0 112 64" fill="none" aria-hidden="true">
    {/* Filas vacías de la tabla */}
    <path className="empty-state-row" d="M8 14h64M8 32h52M8 50h40" />
    {/* Lupa: lente, brillo y mango */}
    <g className="empty-state-lens">
      <circle className="empty-state-glass" cx="78" cy="28" r="15" />
      <path className="empty-state-glint" d="M70 23a9 9 0 0 1 6-5" />
      <path className="empty-state-handle" d="M89 39l10 10" />
    </g>
  </svg>;
}
