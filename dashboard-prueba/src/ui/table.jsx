import React, {useEffect, useId, useState} from 'react';
import {SkLine} from './skeleton';
import {IconButton} from './button';
import './table.css';

// Tabla de datos reutilizable.
// - Cabecera: título (h2) a la izquierda y herramientas a la derecha (`tools`, p. ej. un buscador). Opcional.
// - Columnas: [{label, cell: fila => contenido, sk: ancho del skeleton, key?}]. `key` hace falta si `label` no es texto
//   (p. ej. un título con InfoTip). La cabecera es una banda redondeada sin bordes.
// - Filas con divisor fino y hover suave; con contenido más ancho que la pantalla, la tabla se desplaza en horizontal.
// - Estados: `loading` mantiene título, herramientas y cabeceras y pinta filas skeleton; sin filas muestra `empty`
//   (un texto, o un componente como <EmptyState>).
// - Densidad: cómoda por defecto; compacta con [data-density=compact] en un ancestro (Configuración).
// - `rowClass(fila)` (opcional): clase extra por fila, p. ej. para marcar filas destacadas.
// - Sin scroll vertical: como máximo `pageSize` filas (10); si hay más, un paginador debajo («1–10 de 23» y anterior /
//   siguiente). Al cambiar las filas (filtros, búsqueda) vuelve a la primera página.
export function DataTable({title, tools, columns, rows, rowKey, rowClass, loading, skeletonRows = 5, empty = 'No hay datos para mostrar.', label, pageSize = 10}) {
  const id = useId();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => setPage(0), [rows]);
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * pageSize, (current + 1) * pageSize);
  return <>
    {(title || tools) && <div className="tabletools">{title && <h2 id={id}>{title}</h2>}{tools}</div>}
    <div className="scroll">
      <table aria-labelledby={title ? id : undefined} aria-label={title ? undefined : label} aria-busy={loading || undefined}>
        <thead><tr>{columns.map(c => <th key={c.key ?? c.label} scope="col">{c.label}</th>)}</tr></thead>
        {loading ? <tbody aria-hidden="true">{Array.from({length: skeletonRows}, (_, r) => <tr key={r}>
          {columns.map(c => <td key={c.key ?? c.label}><SkLine width={c.sk || '60%'}/></td>)}
        </tr>)}</tbody> : <tbody>{shown.map(row => <tr key={rowKey(row)} className={rowClass?.(row) || undefined}>
          {columns.map(c => <td key={c.key ?? c.label}>{c.cell(row)}</td>)}
        </tr>)}</tbody>}
      </table>
      {!loading && !rows.length && (typeof empty === 'string' ? <p className="table-empty">{empty}</p> : empty)}
    </div>
    {!loading && pages > 1 && <nav className="table-pager" aria-label="Paginación">
      <span aria-live="polite">{current * pageSize + 1}–{current * pageSize + shown.length} de {rows.length}</span>
      <IconButton icon="prev" label="Página anterior" variant="secondary" size="small" disabled={current === 0} onClick={() => setPage(p => Math.max(0, Math.min(p, pages - 1) - 1))}/>
      <IconButton icon="next" label="Página siguiente" variant="secondary" size="small" disabled={current === pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))}/>
    </nav>}
  </>;
}
