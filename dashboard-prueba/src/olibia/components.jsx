import React, {useEffect, useRef, useState} from 'react';
import {Icon} from '../ui/icons';
import {Dropdown, MultiDropdown} from '../ui/dropdown';
import {InfoTip, Tooltip} from '../ui/tooltip';
import {SearchField} from '../ui/search';
import {Expandable} from '../ui/expandable';
import {AiText} from '../ui/aitext';
import {DataTable} from '../ui/table';
import {StatusPill} from '../ui/status-pill';
import {EmptyState} from '../ui/empty-state';
import {ThemeSwitch} from '../ui/theme-switch';
import {FilterSheetButton} from '../ui/filter-sheet';
import {useMobile} from '../ui/media';
import {SidebarSkeleton} from './skeletons';
import {SkWire, SkLine} from '../ui/skeleton';
import {GOAL, OWNERS, PHOTOS, CHANNELS, FUNNEL, STAGE_CLASS, list, contactLabel, capitalize} from './model';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {NoData} from '../ui/badges';
import {SideNav} from '../ui/side-nav';
import {IconButton} from '../ui/button';

// Menú vertical: áreas del producto para el líder comercial. Solo el Dashboard está construido en esta demo.
const MENU = ['Dashboard', 'Oportunidades', 'Agenda de contactos', 'Equipo', 'Reportes'].map((label, i) => i === 0 ? {label, active: true} : {label, soon: 'Próximamente'});


// En móvil el menú es un panel lateral que se abre con el botón «Menú» de la cabecera.
// loading: primera carga; el menú se muestra como skeleton y la corriente recorre su línea divisoria.
export function Sidebar({open, loading, onSettings, onClose}) {
  return <aside id="sidebar" className={[open && 'open', loading && 'is-loading'].filter(Boolean).join(' ') || undefined}>
    {onClose && <div className="drawer-head"><span className="drawer-title">Menú</span><IconButton icon="close" label="Cerrar menú" className="drawer-close" onClick={onClose}/></div>}
    {loading ? <SidebarSkeleton/> : <>
    <SideNav items={MENU}/>
    <div className="settings"><button className="settings-toggle" aria-haspopup="dialog" onClick={onSettings}><Icon name="settings"/>Configuración</button></div>
    </>}
  </aside>;
}

// Escritorio: los 4 filtros en una fila. Móvil: un solo botón «Filtros» que abre un bottom sheet con selects nativos.
const FILTER_FIELDS = [
  {key: 'stage', label: 'Etapa', all: 'Todas las etapas', unit: 'etapas', multiple: true, options: [...FUNNEL].reverse().map(stage => [stage, stage])},
  {key: 'owner', label: 'Responsable', all: 'Todos los responsables', allLead: <Icon name="group" size={20}/>, options: OWNERS.map(o => [o, o, <Avatar name={o} photo={PHOTOS[o]}/>])},
  {key: 'channel', label: 'Canal', all: 'Todos los canales', options: CHANNELS.map(c => [c, c])},
  {key: 'minimum', label: 'Valor mensual', all: 'Todos los valores', options: [['30', 'Desde $30 M COP'], ['50', 'Desde $50 M COP']]},
];
// Escritorio: contenedor fijo; al hacer scroll se queda bajo la cabecera y el contenido pasa por debajo, y al quedar
// fijo gana sombra. En móvil no es fijo (solo título y botón «Filtros»).
export function Filters({filters, onChange, onClear}) {
  const mobile = useMobile();
  const ref = useRef(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    // Bloque del título (alto + margen) y margen inferior medidos una vez: al recogerse el título, el margen crece eso mismo
    const title = ref.current?.querySelector('.heading-info');
    if (title) {
      ref.current.style.setProperty('--filter-title', `${title.offsetHeight + parseFloat(getComputedStyle(title).marginBottom)}px`);
      // Los márgenes se funden con el del bloque siguiente: cuenta el mayor
      const next = ref.current.nextElementSibling;
      const gap = Math.max(parseFloat(getComputedStyle(ref.current).marginBottom), next ? parseFloat(getComputedStyle(next).marginTop) : 0);
      ref.current.style.setProperty('--filter-gap', `${gap}px`);
    }
    const check = () => { frame = 0; const el = ref.current; if (!el) return; const c = getComputedStyle(el); setStuck(c.position === 'sticky' && window.scrollY > 0 && el.getBoundingClientRect().top <= parseFloat(c.top) + 1); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    check();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);
  return <section ref={ref} className={['panel filter-panel', stuck && 'is-stuck'].filter(Boolean).join(' ')} data-obscures><div className="heading-info"><h2>Filtrar oportunidades abiertas</h2>
      <InfoTip label="Información sobre filtrar oportunidades abiertas">Aplican al pipeline, a las gráficas de oportunidades y a la tabla. La meta, los cierres y el resumen AI muestran el total del periodo. El buscador de la tabla solo busca en la tabla.</InfoTip></div>
    {mobile ? <FilterSheetButton title="Filtrar oportunidades" filters={filters} fields={FILTER_FIELDS} onApply={onChange} onClear={onClear}/> : <div className="filter-grid">
      {/* Etapa admite varias a la vez: se marcan con casillas y se aplican con «Aplicar» */}
      {FILTER_FIELDS.map(({key, label, all, allLead, unit, multiple, options}) => <label key={key}>{label}{multiple
        ? <MultiDropdown value={filters[key]} onApply={value => onChange({[key]: value})} allLabel={all} unit={unit} options={options}/>
        : <Dropdown value={filters[key]} onChange={value => onChange({[key]: value})} options={[['', all, allLead], ...options]}/>}</label>)}
      <Button variant="transparent" onClick={onClear}>Limpiar filtros</Button>
    </div>}
  </section>;
}

// Textos según qué vació la tabla: la búsqueda, los filtros o ambos. Nunca culpa al usuario: describe y sugiere.
export function tableEmptyCopy(query, hasFilters) {
  const q = query.trim();
  if (q && hasFilters) return {title: `No encontramos «${q}» con estos filtros`, message: 'Puede estar en otra etapa, responsable o canal.', action: 'Limpiar búsqueda y filtros'};
  if (q) return {title: `No encontramos «${q}»`, message: 'Revisa cómo está escrito o busca otra empresa.', action: 'Borrar búsqueda'};
  return {title: 'No hay oportunidades con estos filtros', message: 'Prueba quitando alguno para ver más resultados.', action: 'Limpiar filtros'};
}

// Fila de ajuste: etiqueta y descripción a la izquierda, control a la derecha.
function SettingRow({label, htmlFor, description, children}) {
  return <div className="setting-row">
    <div><label className="setting-label" id={`${htmlFor}-label`} htmlFor={htmlFor}>{label}</label>{description && <p className="setting-description">{description}</p>}</div>
    {children}
  </div>;
}

function SettingSelect({id, value, options, onChange, disabled}) {
  return <Dropdown id={id} labelledBy={`${id}-label`} value={value} options={options} onChange={onChange} disabled={disabled}/>;
}

// Categorías de Configuración. Cada una devuelve sus filas.
const CATEGORIES = [
  {id: 'appearance', label: 'Apariencia', render: (prefs, set) => <>
    <SettingRow label="Tema" htmlFor="theme" description="«Sistema» sigue el tema de tu computador y cambia con él.">
      <ThemeSwitch value={prefs.theme} onChange={theme => set({theme})} labelledBy="theme-label"/>
    </SettingRow>
    <SettingRow label="Movimiento" htmlFor="motion" description="«Reducido» desactiva animaciones y transiciones aunque el sistema no lo pida.">
      <SettingSelect id="motion" value={prefs.motion} onChange={motion => set({motion})} options={[['system', 'Sistema'], ['reduced', 'Reducido']]}/>
    </SettingRow>
    <SettingRow label="Densidad de la tabla" htmlFor="density" description="Altura de las filas en la tabla de oportunidades.">
      <SettingSelect id="density" value={prefs.density} onChange={density => set({density})} options={[['comfortable', 'Cómoda'], ['compact', 'Compacta']]}/>
    </SettingRow>
  </>},
  {id: 'team', label: 'Equipo comercial', render: () =>
    // Ajuste de producto aún no disponible: se muestra deshabilitado con el valor vigente (5 días).
    <SettingRow label={<>Duración de la recta final <span className="badge">Próximamente</span></>} htmlFor="stretch" description="Días hábiles antes del cierre en que el dashboard muestra el aviso de recta final.">
      <SettingSelect id="stretch" value="5" disabled options={[['3', '3 días hábiles'], ['5', '5 días hábiles'], ['7', '7 días hábiles']]}/>
    </SettingRow>},
];

export function SettingsPanel({prefs, onChange}) {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const category = CATEGORIES.find(c => c.id === active);
  // Flechas arriba/abajo recorren las categorías, como en una lista de pestañas vertical.
  function onKeyDown(e) {
    const step = {ArrowDown: 1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = CATEGORIES[(CATEGORIES.indexOf(category) + step + CATEGORIES.length) % CATEGORIES.length];
    setActive(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }
  return <div className="settings-layout">
    <div className="settings-nav" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
      {CATEGORIES.map(c => <button key={c.id} id={`tab-${c.id}`} role="tab" aria-selected={c.id === active} aria-controls="settingsPanel" tabIndex={c.id === active ? 0 : -1} onClick={() => setActive(c.id)}>{c.label}</button>)}
    </div>
    <section className="settings-content" id="settingsPanel" role="tabpanel" aria-labelledby={`tab-${active}`}>
      <h3>{category.label}</h3>
      {category.render(prefs, onChange)}
    </section>
  </div>;
}

// Resumen simulado: habla de la brecha con la meta, los días hábiles y las oportunidades que pueden cubrirla.
// loading: recarga de datos; el título del desplegable se mantiene y el texto es skeleton.
export function Summary({info, closed, closers, isDone, onShowPending, loading}) {
  const gap = Math.max(GOAL - closed, 0);
  const pending = closers.filter(row => !isDone(row)).map(row => row[0]);
  let content, action = false;
  if (info.state === 'cerrado') {
    content = <p>{capitalize(info.name)} cerró con <strong>{closed} de {GOAL} cierres</strong>{gap ? `; faltaron ${gap} para la meta.` : ' y cumplió la meta.'}</p>;
  } else if (!gap) {
    content = <p>La meta del mes está cumplida.</p>;
  } else {
    action = true;
    content = <>
      <p>Faltan <strong>{gap} cierres</strong> para la meta y quedan <strong>{info.remaining} días hábiles</strong>. Las {closers.length} oportunidades más cerca de cerrar pueden cubrir la brecha: {list(closers.map(r => `${r[0]} (${r[1]}, $${r[2]} M, contacto ${contactLabel(r[4], true)})`))}.</p>
      <p><strong>Siguiente paso sugerido:</strong> {pending.length
        ? `registrar el seguimiento de ${list(pending)} con ${pending.length > 1 ? 'sus responsables' : 'su responsable'} antes de la fecha de contacto.`
        : 'todas tienen seguimiento al día; confirma el cierre con los responsables.'}</p>
    </>;
  }
  // Parte inferior de la tarjeta del periodo: desplegable cerrado por defecto; al abrirlo, el texto de IA
  // aparece palabra a palabra y el CTA entra al terminar.
  return <div className="period-ai ai-widget">
    <Expandable title="Resumen AI" icon="ai">
      {loading ? <div><SkLine width="96%"/><SkLine width="88%"/><SkLine width="60%"/></div> : <>
      {/* key: si cambia el periodo o el seguimiento, el resumen nuevo se vuelve a escribir */}
      <AiText key={`${info.name}-${pending.length}`} thinking="Analizando cierres y pipeline…" after={action && <Button variant="primary" onClick={onShowPending}>Ver negociaciones pendientes</Button>}>{content}</AiText>
      </>}
    </Expandable>
  </div>;
}

// Columnas de la tabla de oportunidades (DataTable); `sk`: ancho de la línea skeleton mientras carga.
// Las que cubren la brecha (closers) llevan una bandera junto al nombre (tooltip «Cierra la brecha») y una franja morada a la izquierda.
const opportunityColumns = (open, isDone, onSelect, closers = []) => [
  {label: 'Empresa', sk: '80%', cell: r => closers.includes(r)
    ? <span className="row-name">{r[0]}<Tooltip content="Cierra la brecha" label={`${r[0]} cierra la brecha`}><span className="gap-flag"><Icon name="flag" size={14}/></span></Tooltip></span> : r[0]},
  {label: 'Etapa', sk: '70%', cell: r => <span className={`pill stage ${STAGE_CLASS[r[1]]}`}>{r[1]}</span>},
  {label: 'Valor mensual', sk: '50%', cell: r => `$${r[2]} M`},
  {label: 'Responsable', sk: '65%', cell: r => r[3]},
  {label: 'Próximo contacto', sk: '75%', cell: r => contactLabel(r[4], open).split(' · ')[0]},   // Solo la fecha: los días que faltan van en el detalle y en el KPI de seguimiento
  // Periodo cerrado: «—». Los datos no dicen si hubo seguimiento; marcarlo «Al día» sería inventarlo
  {label: 'Seguimiento', sk: '60%', cell: r => open ? <StatusPill done={isDone(r)}/> : <NoData/>},
  {label: 'Detalle', sk: '40%', cell: r => <Button variant="transparent" size="small" aria-label={`Ver ${r[0]}`} onClick={() => onSelect(r)}>Ver</Button>},
];

// loading: recarga de datos; título, buscador y cabeceras se mantienen y las filas son skeleton.
// fallback: si las oportunidades no llegaron, se mantiene el título y el cuerpo es el Fallback (error de carga).
// Sin resultados: estado vacío según lo que vació la tabla; su acción borra la búsqueda (onQuery('')) o, si hay
// filtros, los limpia todos con la búsqueda (onClearFilters, con su toast de Deshacer).
export function OpportunityTable({rows, open, query, onQuery, hasFilters, onClearFilters, isDone, onSelect, loading, fallback, closers = []}) {
  if (fallback) return <section className="panel table-panel"><div className="tabletools"><h2>Oportunidades abiertas</h2></div>{fallback}</section>;
  return <section className={['panel', 'table-panel', loading && 'sk-block'].filter(Boolean).join(' ')}>
    {loading && <SkWire/>}
    <DataTable title="Oportunidades abiertas" loading={loading} rows={rows} rowKey={r => r[0]} columns={opportunityColumns(open, isDone, onSelect, closers)} rowClass={r => closers.includes(r) && 'is-closer'}
      tools={<SearchField label="Buscar empresa" placeholder="Buscar empresa…" value={query} onChange={onQuery}/>}
      empty={<EmptyState {...tableEmptyCopy(query, hasFilters)} onAction={() => hasFilters ? onClearFilters() : onQuery('')}/>}/>
  </section>;
}
