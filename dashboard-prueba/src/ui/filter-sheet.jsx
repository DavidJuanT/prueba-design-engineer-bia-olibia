import React, {useState} from 'react';
import {Button} from './button';
import {Icon} from './icons';
import {Modal} from './modal';
import {Chip} from './chip';
import './filter-sheet.css';

// Filtros en móvil: un solo botón («Filtros», con cuántos hay activos) abre un bottom sheet con todos los filtros.
// - Cada filtro de una opción es un <select> nativo: al tocarlo se abre la selección del sistema (rueda en iOS,
//   lista en Android). Los de varias opciones (multiple) son casillas a la vista dentro del sheet: el <select multiple>
//   nativo no es fiable (en escritorio y en algunos navegadores es una lista de una línea que solo marca la primera).
// - Lo elegido es un borrador hasta «Aplicar», que filtra una sola vez y cierra; «Limpiar» vacía el borrador.
// - Debajo del botón, los filtros activos se ven como chips: la × de cada uno lo quita y «Limpiar» los quita todos,
//   sin abrir el sheet.
// fields: [{key, label, all, options: [[valor, texto]], multiple}] · onClear: limpia todos (opcional)
export function FilterSheetButton({filters, fields, onApply, onClear, title = 'Filtros', fullWidth = true}) {
  const [open, setOpen] = useState(false);
  const active = fields.filter(f => f.multiple ? filters[f.key].length : filters[f.key]).length;
  return <>
    <Button variant="secondary" fullWidth={fullWidth} className="filter-sheet-toggle" onClick={() => setOpen(true)} aria-haspopup="dialog">
      <Icon name="filter" size={20}/>Filtros{active > 0 && <span className="filter-sheet-count" aria-label={`, ${active} activos`}>{active}</span>}
    </Button>
    <FilterChips filters={filters} fields={fields} onApply={onApply} onClear={onClear}/>
    {open && <FilterSheet title={title} filters={filters} fields={fields} onClose={() => setOpen(false)} onApply={draft => { onApply(draft); setOpen(false); }}/>}
  </>;
}

function FilterSheet({title, filters, fields, onClose, onApply}) {
  const [draft, setDraft] = useState(() => Object.fromEntries(fields.map(f => [f.key, filters[f.key]])));
  const empty = Object.fromEntries(fields.map(f => [f.key, f.multiple ? [] : '']));
  const isEmpty = fields.every(f => f.multiple ? !draft[f.key].length : !draft[f.key]);
  return <Modal sheet title={title} onClose={onClose}
    footer={<>
      <Button variant="transparent" disabled={isEmpty} onClick={() => setDraft(empty)}>Limpiar</Button>
      <Button variant="primary" onClick={() => onApply(draft)}>Aplicar</Button>
    </>}>
    <div className="filter-sheet-fields">
      {fields.map(f => f.multiple
        ? <fieldset key={f.key} className="check-field">
            <legend>{f.label}<span className="check-field-summary">{summary(draft[f.key], f)}</span></legend>
            {f.options.map(([value, text]) => {
              const checked = draft[f.key].includes(value);
              const toggle = () => setDraft(d => ({...d, [f.key]: checked ? d[f.key].filter(v => v !== value) : [...d[f.key], value]}));
              return <label key={value} className="check-row"><input type="checkbox" checked={checked} onChange={toggle}/>
                <span className="check-box" aria-hidden="true"><Icon name="check" size={14}/></span>{text}</label>;
            })}
          </fieldset>
        : <label key={f.key} className="native-select-field">{f.label}
            <span className="native-select">
              <select value={draft[f.key]} onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))}>
                <option value="">{f.all}</option>
                {f.options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
              <Icon name="chevron" size={20}/>
            </span>
          </label>)}
    </div>
  </Modal>;
}

// Chips de los filtros activos: uno por valor (en los de varias opciones, uno por opción elegida).
function FilterChips({filters, fields, onApply, onClear}) {
  const chips = fields.flatMap(f => f.multiple
    ? filters[f.key].map(v => ({f, value: v, text: textOf(f, v)}))
    : filters[f.key] ? [{f, value: filters[f.key], text: textOf(f, filters[f.key])}] : []);
  if (!chips.length) return null;
  const remove = ({f, value}) => onApply({[f.key]: f.multiple ? filters[f.key].filter(v => v !== value) : ''});
  const clearAll = onClear || (() => onApply(Object.fromEntries(fields.map(f => [f.key, f.multiple ? [] : '']))));
  return <ul className="chip-list filter-chips" aria-label="Filtros activos">
    {chips.map(c => <Chip as="li" key={c.f.key + c.value} removeLabel={`Quitar filtro ${c.f.label}: ${c.text}`} onRemove={() => remove(c)}>{c.text}</Chip>)}
    <li><Button variant="transparent" size="small" onClick={clearAll}>Limpiar</Button></li>
  </ul>;
}
const textOf = (f, v) => f.options.find(([value]) => value === v)?.[1] ?? v;

const summary = (values, f) => !values.length ? f.all : values.length === 1 ? values[0] : `${values.length} ${f.unit}`;

