import React, {createContext, useContext, useEffect, useState} from 'react';
import {Button, IconButton} from '../ui/button';
import {DeltaPill, FilteredBadge} from '../ui/badges';
import {Dropdown, MultiDropdown} from '../ui/dropdown';
import {InfoTip, Tooltip} from '../ui/tooltip';
import {SearchField} from '../ui/search';
import {Expandable} from '../ui/expandable';
import {AiText} from '../ui/aitext';
import {DashboardSkeleton} from './skeletons';
import {SkeletonState, SkBlock, SkStep, SkLine, ChartSkeleton} from '../ui/skeleton';
import {Toast, ToastProvider, useToast} from '../ui/toast';
import {ColumnChart} from '../ui/columns';
import {Ring} from '../ui/chart-forms';
import {BarList} from '../ui/bar-list';
import {LineChart} from '../ui/line-chart';
import {stageDot, initials} from './model';
import {ThemeSwitch} from '../ui/theme-switch';
import {DataTable} from '../ui/table';
import {Fallback, PageFallback} from '../ui/fallback';
import {EmptyState} from '../ui/empty-state';
import {tableEmptyCopy} from './components';
import {StatusPill} from '../ui/status-pill';
import {FilterSheetButton} from '../ui/filter-sheet';
import {Chip} from '../ui/chip';
import {Modal} from '../ui/modal';
import {OpportunityDetail, OpportunityDetailFooter} from './detail';
import {Icon} from '../ui/icons';
import {SideNav} from '../ui/side-nav';
import {Avatar} from '../ui/avatar';
import {PeriodCard} from './period';
import {FollowUpKpi, NegotiationsSummary} from './followup-kpi';
import {reducedMotion} from '../ui/media';

// Guías visuales del design system, en dos páginas:
// - #componentes: el sistema en sí (fundamentos y componentes) con contenido de ejemplo neutro, porque se reutiliza
//   en otros productos. Cada componente tiene su bloque (…Sections) y su ruta propia (#boton, #modal…).
// - #patrones: cómo se usa en Olibia (datos y textos del dashboard), separado del sistema.

// Página de guía: título y vuelta al dashboard; barra fija con el índice (si lo hay) y el cambio de tema,
// y un botón abajo a la derecha para volver al inicio tras hacer scroll.
const GuideTheme = createContext(['system', () => {}]);
function GuidePage({title, description, index, nav, children}) {
  // El tema se guarda en las mismas preferencias que Configuración, así el dashboard lo conserva al volver.
  const [theme, setTheme] = useState(() => savedPrefs().theme || 'system');
  const switchTheme = value => {
    setTheme(value);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({...savedPrefs(), theme: value})); } catch {}
  };
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const page = <main className="showcase">
    <div className="showcase-head">
      <div><h1>{title}</h1><p className="muted">{description}</p></div>
      <div className="showcase-head-actions">
        <Button variant="transparent" size="small" onClick={() => { location.hash = ''; }}>Volver al dashboard</Button>
        {nav && <ThemeSwitch value={theme} onChange={switchTheme}/>}
      </div>
    </div>
    <div className={nav ? 'showcase-bar showcase-bar--nav' : 'showcase-bar'}>
      {index || <span/>}
      <ThemeSwitch value={theme} onChange={switchTheme}/>
    </div>
    <GuideTheme.Provider value={[theme, switchTheme]}>{children}</GuideTheme.Provider>
    <IconButton icon="top" label="Volver al inicio" variant="primary" className={['showcase-top', scrolled && 'is-visible'].filter(Boolean).join(' ')}
      tabIndex={scrolled ? 0 : -1} aria-hidden={!scrolled}
      onClick={() => window.scrollTo({top: 0, behavior: reducedMotion() ? 'auto' : 'smooth'})}/>
  </main>;
  // Con menú lateral: la columna fija a la izquierda y la guía al lado (en móvil el menú se oculta y queda el índice de arriba)
  return nav ? <div className="shell showcase-shell"><aside className="showcase-menu">{nav}</aside>{page}</div> : page;
}

// ─── Fundamentos ────────────────────────────────────────────────────────────────────────────────────────────

// Colores por función. Los tokens de un componente se describen por su papel en él, no por la pantalla donde aparece.
const COLOR_GROUPS = [
  ['Acción', [
    ['--color-primary-600', 'Color principal: botón primary, datos destacados, foco'],
    ['--color-action-hover', 'Botón primary en hover'],
    ['--color-action-press', 'Botón primary en press'],
    ['--color-primary-text', 'Texto sobre tintes del color principal (botón secondary, badge)'],
    ['--color-primary-link', 'Texto de acciones sin fondo (botón transparent, enlaces) y acentos de ilustraciones'],
    ['--color-primary-50', 'Tinte de fondo: botón secondary; hover de transparent'],
    ['--color-primary-100', 'Hover de secondary; press de transparent'],
    ['--color-primary-200', 'Press de secondary'],
    ['--color-primary-25', 'Tinte más suave de la escala (reservado)'],
  ]],
  ['Deshabilitado', [
    ['--color-disabled-bg', 'Fondo de controles deshabilitados'],
    ['--color-disabled-text', 'Texto de controles deshabilitados'],
    ['--color-disabled-text-hc', 'Texto deshabilitado de alto contraste (superficies tintadas)'],
  ]],
  ['Superficies, bordes y texto', [
    ['--color-bg', 'Fondo de la página y de los menús flotantes'],
    ['--color-surface', 'Tarjetas, paneles y modales'],
    ['--color-chrome', 'Cabecera y navegación lateral'],
    ['--color-surface-sunken', 'Superficies hundidas: cabecera de tabla, navegación secundaria, pistas'],
    ['--color-surface-hover', 'Hover de filas y opciones'],
    ['--color-border', 'Bordes y divisores'],
    ['--color-border-strong', 'Bordes de controles (línea de campos) y trazo de ilustraciones'],
    ['--color-text', 'Texto principal'],
    ['--color-text-muted', 'Texto secundario, etiquetas, iconos y placeholder'],
  ]],
  ['Estados', [
    ['--color-banner-border', 'Banner: borde (naranja #E6540B)'],
    ['--color-banner-bg', 'Banner: fondo, el mismo de las cards (el aviso lo marcan el borde y el icono)'],
    ['--color-banner-icon', 'Banner: icono (círculo con «!»)'],
    ['--color-warning-medium-bg', 'Aviso: fondo de la pill de aviso'],
    ['--color-warning-medium-border', 'Aviso: borde (reservado)'],
    ['--color-warning-medium-text', 'Aviso: texto de la pill y carga baja de ilustraciones'],
    ['--color-success-bg', 'Positivo: fondo de la pill (alias de --color-status-al-dia-bg)'],
    ['--color-success', 'Positivo: texto de la pill y meta cumplida (alias del verde del paso 4)'],
    ['--color-delta-up-bg', 'Variación positiva: fondo'],
    ['--color-delta-up-text', 'Variación positiva: texto'],
    ['--color-delta-up-icon', 'Variación positiva: flecha'],
    ['--color-delta-down-bg', 'Variación negativa: fondo'],
    ['--color-delta-down-text', 'Variación negativa: texto y flecha'],
  ]],
  ['Escala de progreso', [
    ['--color-dot-contacto', 'Paso 1 de 4 (inicio, amarillo)'],
    ['--color-dot-calificacion', 'Paso 2 de 4 (lima)'],
    ['--color-dot-propuesta', 'Paso 3 de 4 (verde claro); base de --color-chart-goal'],
    ['--color-dot-negociacion', 'Paso 4 de 4 (verde, cerca del final)'],
  ]],
  ['Datos', [
    ['--color-data', 'Relleno de barras horizontales'],
    ['--color-track', 'Pista de barras horizontales'],
    ['--color-chart-history', 'Columnas no destacadas (lavanda grisáceo, tenue)'],
    ['--color-action', 'Columna destacada'],
  ]],
  ['Superficies flotantes', [
    ['--color-tooltip-bg', 'Fondo del tooltip (igual en ambos temas)'],
    ['--color-tooltip-border', 'Borde del tooltip'],
    ['--color-tooltip-text', 'Texto del tooltip'],
    ['--color-toast-bg', 'Fondo del toast (igual en ambos temas)'],
    ['--color-toast-border', 'Borde del toast'],
    ['--color-toast-timer', 'Línea del tiempo restante del toast'],
    ['--color-toast-success', 'Icono de éxito'],
    ['--color-toast-error', 'Icono de error'],
    ['--color-toast-neutral', 'Icono neutro y texto de las acciones del toast'],
    ['--color-backdrop', 'Fondo detrás de modales y menús móviles'],
  ]],
];

// Valor real del token en el tema activo; se actualiza al cambiar de tema.
function useThemeValue(token) {
  const read = () => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const [value, setValue] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setValue(read()));
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, [token]);
  return value;
}

function Swatch({token, usage}) {
  const value = useThemeValue(token);
  return <div className="swatch">
    <span className="swatch-chip" style={{background: `var(${token})`}}/>
    <div><code>{token}</code><span className="swatch-value">{value}</span><p className="muted">{usage}</p></div>
  </div>;
}
// Tokens que usa un componente, por su papel en él; va al final de su bloque.
function Tokens({items}) {
  return <section className="panel showcase-section">
    <h3 className="showcase-subtitle">Tokens</h3>
    <div className="swatches">{items.map(([token, usage]) => <Swatch key={token} token={token} usage={usage}/>)}</div>
  </section>;
}

function ColorSections() {
  return COLOR_GROUPS.map(([group, tokens]) => <section key={group} className="panel showcase-section">
    <h3 className="showcase-subtitle">{group}</h3>
    <div className="swatches">{tokens.map(([token, usage]) => <Swatch key={token} token={token} usage={usage}/>)}</div>
  </section>);
}

// Iconos (Material Symbols rounded): nombre de su función, no de la pantalla.
const ICON_LIST = [['close', 'Cerrar'], ['menu', 'Menú'], ['settings', 'Ajustes'], ['calendar', 'Calendario'], ['warning', 'Aviso'], ['chevron', 'Desplegar'], ['info', 'Información'], ['search', 'Buscar'], ['trendUp', 'Sube'], ['trendDown', 'Baja'], ['filter', 'Filtrado'], ['top', 'Volver arriba'], ['ai', 'IA'], ['success', 'Éxito'], ['error', 'Error'], ['check', 'Hecho'], ['sun', 'Claro'], ['moon', 'Oscuro'], ['computer', 'Sistema']];

function IconSections() {
  return <section className="panel showcase-section">
    <div className="showcase-icons">{ICON_LIST.map(([name, label]) => <div key={name}><Icon name={name} size={24}/><small className="muted">{label}</small></div>)}</div>
  </section>;
}

// ─── Componentes (contenido de ejemplo neutro) ───────────────────────────────────────────────────────────────

// Botón: variantes, estados y tamaños.
const VARIANTS = [['primary', 'Primary'], ['secondary', 'Secondary'], ['transparent', 'Transparent']];
const STATES = [['Idle', ''], ['Hover', 'is-hover'], ['Press', 'is-press'], ['Disabled', 'disabled']];
const SIZES = [['large', '48 px'], ['medium', '32 px'], ['small', '24 px']];

function ButtonSections() {
  return <>
    <section className="panel showcase-section">
      <h2>Variantes y estados</h2>
      <div className="scroll">
        <table className="showcase-table">
          <thead><tr><th>Variante</th>{STATES.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{VARIANTS.map(([variant, label]) => <tr key={variant}>
            <td>{label}</td>
            {STATES.map(([state, cls]) => <td key={state}>
              <Button variant={variant} className={cls && cls !== 'disabled' ? cls : undefined} disabled={cls === 'disabled'}>Acción</Button>
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Deshabilitado de alto contraste</h2>
      <p className="muted">Sobre superficies tintadas, como los filtros fijos, el texto deshabilitado pasa a <code>--color-disabled-text-hc</code>: gris neutro, legible y distinto del violeta activo. Se aplica solo dentro de <code>.is-stuck</code> o con la clase <code>btn--hc</code>.</p>
      <div className="showcase-hc">
        <div className="showcase-hc-surface"><Button variant="transparent" disabled>Acción</Button><small className="muted">Normal</small></div>
        <div className="showcase-hc-surface"><Button variant="transparent" className="btn--hc" disabled>Acción</Button><small className="muted">Alto contraste</small></div>
        <div className="showcase-hc-surface"><Button variant="transparent">Acción</Button><small className="muted">Activo</small></div>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Tamaños</h2>
      {VARIANTS.map(([variant]) => <div className="showcase-sizes" key={variant}>
        {SIZES.map(([size, height]) => <div key={size}><Button variant={variant} size={size}>Acción</Button><small className="muted">{variant} · {size} · {height}</small></div>)}
      </div>)}
    </section>
    <section className="panel showcase-section">
      <h2>Botón de icono · 40×40</h2>
      <div className="showcase-sizes">
        {VARIANTS.map(([variant, label]) => <div key={variant}><IconButton icon="close" label="Cerrar" variant={variant}/><small className="muted">{label}</small></div>)}
      </div>
    </section>
  </>;
}

// Desplegable: estados fijos, ejemplos interactivos y casos límite.
const OPTIONS = [['', 'Todas las opciones'], ['1', 'Opción 1'], ['2', 'Opción 2'], ['3', 'Opción 3'], ['4', 'Opción 4']];
const PERIODS = [['m1', 'Enero 2026'], ['m2', 'Febrero 2026'], ['m3', 'Marzo 2026']];
const MONTHS_PREVIEW = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => [m, `${m} 2026`]);
const LONG_PREVIEW = [['a', 'Opción con un nombre muy largo que no cabe en el campo'], ['b', 'Otra opción de texto extenso para probar el recorte']];

// Personas de ejemplo con foto (retratos aleatorios de randomuser.me; sin conexión, iniciales)
const SAMPLE_PEOPLE = [['Persona Uno', 'https://randomuser.me/api/portraits/women/12.jpg'], ['Persona Dos', 'https://randomuser.me/api/portraits/men/41.jpg'], ['Persona Tres', 'https://randomuser.me/api/portraits/women/90.jpg']];
const PEOPLE_OPTIONS = [['', 'Todas las personas', <Icon name="group" size={20}/>], ...SAMPLE_PEOPLE.map(([name, photo]) => [name, name, <Avatar name={name} photo={photo}/>])];

function DropdownSections() {
  const [person, setPerson] = useState('');
  const [period, setPeriod] = useState('m1');
  const [option, setOption] = useState('');
  const [month, setMonth] = useState('Enero');
  const [long, setLong] = useState('a');
  const [many, setMany] = useState([]);
  return <>
    <section className="panel showcase-section">
      <h2>Estados</h2>
      <div className="showcase-dropdowns">
        {[['Idle', undefined], ['Hover', 'hover'], ['Foco', 'focus'], ['Deshabilitado', 'disabled']].map(([title, state]) =>
          <label key={title}>{title}<Dropdown value="" options={OPTIONS} forceState={state} disabled={state === 'disabled'}/></label>)}
      </div>
      <div className="showcase-dropdowns showcase-dropdowns--open">
        <label>Abierto · selección y hover<Dropdown value="2" options={OPTIONS} forceState="open"/></label>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Interactivo</h2>
      <div className="showcase-dropdowns">
        <label>Con icono<Dropdown value={period} options={PERIODS} onChange={setPeriod} icon="calendar"/></label>
        <label>Sin icono<Dropdown value={option} options={OPTIONS} onChange={setOption}/></label>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Opciones con icono o avatar</h2>
      <p className="muted showcase-tip-note">Cada opción puede llevar delante un icono o un avatar (tercer elemento de la opción); el de la opción elegida se repite en el disparador, a 20 px.</p>
      <div className="showcase-dropdowns">
        <label>Interactivo<Dropdown value={person} options={PEOPLE_OPTIONS} onChange={setPerson}/></label>
      </div>
      <div className="showcase-dropdowns showcase-dropdowns--open">
        <label>Abierto<Dropdown value="Persona Dos" options={PEOPLE_OPTIONS} forceState="open"/></label>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Selección múltiple · con casillas y «Aplicar»</h2>
      <p className="muted showcase-tip-note">La selección es un borrador: se aplica con «Aplicar» o Enter; Escape o clic fuera cierran sin cambios. Espacio marca o desmarca la opción activa.</p>
      <div className="showcase-dropdowns">
        <label>Interactivo<MultiDropdown value={many} onApply={setMany} options={OPTIONS.slice(1)} allLabel="Todas las opciones" unit="opciones"/></label>
        <label>Valor aplicado<span className="showcase-applied">{many.length ? many.map(v => `Opción ${v}`).join(', ') : 'Todas las opciones'}</span></label>
      </div>
      <div className="showcase-dropdowns showcase-dropdowns--open showcase-dropdowns--multi">
        <label>Abierto · dos marcadas<MultiDropdown value={['2', '3']} options={OPTIONS.slice(1)} allLabel="Todas las opciones" unit="opciones" forceState="open"/></label>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Casos</h2>
      <div className="showcase-dropdowns">
        <label>Muchas opciones · scroll<Dropdown value={month} options={MONTHS_PREVIEW} onChange={setMonth}/></label>
        <label>Texto largo · se recorta<Dropdown value={long} options={LONG_PREVIEW} onChange={setLong} className="showcase-narrow"/></label>
      </div>
      <p className="muted">Lleva estos desplegables al borde inferior de la ventana para ver cómo el menú se abre hacia arriba. Escribe una letra con el campo enfocado para saltar a la opción.</p>
    </section>
  </>;
}

// Campo de búsqueda: estados fijos y uno interactivo.
function SearchSections() {
  const [query, setQuery] = useState('');
  const noop = () => {};
  const field = (title, props) => <div className="showcase-state"><p className="showcase-tip-name">{title}</p>
    <SearchField label="Buscar" placeholder="Buscar…" value="" onChange={noop} {...props}/></div>;
  return <>
    <section className="panel showcase-section">
      <h2>Estados</h2>
      <div className="showcase-dropdowns">
        {field('Idle')}
        {field('Hover', {forceState: 'hover'})}
        {field('Foco', {forceState: 'focus'})}
        {field('Con texto', {value: 'Texto buscado'})}
        {field('Deshabilitado', {disabled: true})}
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Interactivo</h2>
      <SearchField label="Buscar" placeholder="Buscar…" value={query} onChange={setQuery}/>
      <p className="muted showcase-tip-note">Escribe para ver el botón de borrar; Escape también borra.</p>
    </section>
  </>;
}

// Tooltip: abierto fijo para revisar el estilo y uno interactivo para la animación y el comportamiento.
const TIP_TEXT = 'Texto de ayuda breve que explica qué hace esta sección o cómo se calcula un dato.';

function TooltipSections() {
  return <section className="panel showcase-section">
    <div className="showcase-tips showcase-tips--open">
      <div><p className="showcase-tip-name">Abierto</p>
        <div className="showcase-row"><InfoTip label="Más información" forceOpen>{TIP_TEXT}</InfoTip></div></div>
      <div><p className="showcase-tip-name">Interactivo · icono de información</p>
        <div className="showcase-row"><InfoTip label="Más información">{TIP_TEXT}</InfoTip></div></div>
      <div><p className="showcase-tip-name">Interactivo · sobre otro elemento</p>
        <div className="showcase-row"><Tooltip content="Explica el estado" label="Aviso: explica el estado"><span className="pill status-pendiente">Aviso</span></Tooltip></div></div>
    </div>
  </section>;
}

// Texto de ejemplo para el contenido generado por IA.
const AI_TEXT = <>
  <p>Este es un <strong>resumen generado</strong> a partir de los datos disponibles. Destaca lo más relevante, explica por qué importa y nombra los elementos que conviene revisar primero.</p>
  <p><strong>Siguiente paso sugerido:</strong> una acción concreta que la persona puede hacer ahora.</p>
</>;

// Expandable: estados fijos.
function ExpandableSections() {
  return <section className="panel showcase-section">
    <h2>Estados</h2>
    <div className="showcase-expandables">
      {[['Cerrado', 'closed'], ['Hover', 'hover'], ['Foco', 'focus'], ['Abierto', 'open']].map(([label, state]) =>
        <div key={label}><p className="showcase-tip-name">{label}</p>
          <Expandable title="Título del contenido" icon="ai" headingLevel={3} forceState={state}><AiText>{AI_TEXT}</AiText></Expandable></div>)}
    </div>
  </section>;
}

// Texto de IA: «analiza y escribe»; se repite con el botón.
function AiTextSections() {
  const [run, setRun] = useState(0);
  return <section className="panel showcase-section">
    <div className="showcase-replay"><h3 className="showcase-subtitle">Analiza y escribe</h3><Button variant="secondary" size="small" onClick={() => setRun(n => n + 1)}>Repetir</Button></div>
    <p className="muted showcase-tip-note">Rótulo con brillo «Analizando…» (0,9 s; el texto se puede cambiar con `thinking`) y luego el texto palabra a palabra; la acción (`after`) entra al terminar.</p>
    <AiText key={run} after={<Button variant="primary">Acción sugerida</Button>}>{AI_TEXT}</AiText>
  </section>;
}

// Pills: aviso y positivo con fondo, variación con flecha, escala de progreso con punto, marca de filtro.
const DOT_PILLS = [['stage-contacto', 'Paso 1'], ['stage-calificacion', 'Paso 2'], ['stage-propuesta', 'Paso 3'], ['stage-negociacion', 'Paso 4']];

// Menú lateral: con iconos (todas las áreas a la vista) y solo texto con «Próximamente» en lo no construido
function SideNavSections() {
  return <section className="panel showcase-section">
    <div className="showcase-tips showcase-sidenavs">
      <div><p className="showcase-tip-name">Con iconos</p>
        <aside className="showcase-aside"><SideNav label="Ejemplo con iconos" items={[{label: 'Inicio', icon: 'home'}, {label: 'Resumen', icon: 'usage', active: true}, {label: 'Lugares', icon: 'store'}, {label: 'Documentos', icon: 'receipt'}, {label: 'Avisos', icon: 'bell'}]}/></aside></div>
      <div><p className="showcase-tip-name">Solo texto, con «Próximamente»</p>
        <aside className="showcase-aside"><SideNav label="Ejemplo solo texto" items={[{label: 'Resumen', active: true}, {label: 'Detalle', soon: 'Próximamente'}, {label: 'Reportes', soon: 'Próximamente'}]}/></aside></div>
    </div>
  </section>;
}

function PillSections() {
  return <section className="panel showcase-section">
    <div className="showcase-tips">
      <div><p className="showcase-tip-name">Estado · aviso y positivo</p>
        <div className="showcase-row"><span className="pill status-pendiente">Aviso</span><span className="pill status-al-dia">Positivo</span></div></div>
      <div><p className="showcase-tip-name">Variación · sube, baja y sin cambio (con tooltip)</p>
        <div className="showcase-row"><DeltaPill value={2} tip="Frente al periodo anterior"/><DeltaPill value={-1} tip="Frente al periodo anterior"/><DeltaPill value={0} tip="Frente al periodo anterior"/></div></div>
      <div><p className="showcase-tip-name">Variación · cuando subir es malo (upIsBad, con unidad)</p>
        <div className="showcase-row"><DeltaPill value={25} unit=" %" upIsBad tip="Frente al periodo anterior"/><DeltaPill value={-10} unit=" %" upIsBad tip="Frente al periodo anterior"/></div></div>
      <div><p className="showcase-tip-name">Escala de progreso · punto de color</p>
        <div className="showcase-row">{DOT_PILLS.map(([cls, label]) => <span key={cls} className={`pill stage ${cls}`}>{label}</span>)}</div></div>
      <div><p className="showcase-tip-name">Marca de filtro (con tooltip)</p>
        <div className="showcase-row"><FilteredBadge tip="Este dato cambia con los filtros"/></div></div>
    </div>
  </section>;
}

// Banner de aviso (warning medio).
function BannerSections() {
  return <section className="banner" aria-label="Aviso (ejemplo)">
    <div className="banner-body"><div className="banner-head"><Icon name="warningFill"/><strong>Título del aviso</strong></div><p>Texto breve que explica qué pasa y qué conviene hacer.</p>
      <Button variant="transparent" className="banner-action">Ver detalles</Button></div>
    <IconButton icon="close" label="Cerrar aviso"/>
  </section>;
}

// Toast: los tres tipos estáticos y botones que lanzan toasts reales.
function ToastDemoButtons() {
  const toast = useToast();
  return <div className="filters">
    <Button variant="secondary" size="small" onClick={() => toast({type: 'success', title: 'Archivo exportado'})}>Éxito</Button>
    <Button variant="secondary" size="small" onClick={() => toast({type: 'error', title: 'No se pudo guardar', action: {label: 'Reintentar'}})}>Error</Button>
    <Button variant="secondary" size="small" onClick={() => toast({type: 'neutral', title: 'Cambios descartados', action: {label: 'Deshacer'}})}>Neutro</Button>
  </div>;
}

function ToastSections() {
  return <ToastProvider>
    <section className="panel showcase-section">
      <h2>Tipos</h2>
      <div className="toast-static-list">
        <Toast static type="success" title="Archivo exportado" message="Segunda línea opcional con el detalle" onClose={() => {}}/>
        <Toast static type="error" title="No se pudo guardar" action={{label: 'Reintentar'}} onClose={() => {}}/>
        <Toast static type="neutral" title="Cambios descartados" action={{label: 'Deshacer'}} onClose={() => {}}/>
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Interactivo</h2>
      <p className="muted showcase-tip-note">Aparecen abajo al centro. Éxito y neutro se cierran a los 4 s (la línea inferior marca el tiempo y se pausa con el puntero encima); error se queda hasta cerrarlo. Máximo 3 a la vez. Úsalo para resultados que no se ven en pantalla o que se pueden deshacer.</p>
      <ToastDemoButtons/>
    </section>
  </ToastProvider>;
}

// Skeleton: piezas (bloque con contorno y corriente, líneas de texto, cifra, título y botón) armadas en una card.
function SkeletonSections() {
  const [run, setRun] = useState(0);
  return <>
    <div className="showcase-replay">
      <p className="muted">Bloque (`SkBlock`) con contorno punteado y su línea de corriente; líneas (`SkLine`) en gris con la banda morada que cruza en ola. Se arma con las mismas piezas para cualquier contenido.</p>
      <Button variant="secondary" size="small" onClick={() => setRun(n => n + 1)}>Repetir</Button>
    </div>
    <SkeletonState key={run} label="Cargando…">
      <div className="split">
        <SkBlock className="panel"><SkStep><SkLine width="40%" size="title"/></SkStep><SkStep><SkLine width="90%"/><SkLine width="75%"/><SkLine width="55%"/></SkStep></SkBlock>
        <SkBlock className="panel"><SkStep><SkLine width="35%"/><SkLine width="50%" size="value"/></SkStep><SkStep><SkLine width="70%" size="bar"/><SkLine width="45%" size="bar"/></SkStep><SkLine width="120px" size="button"/></SkBlock>
      </div>
    </SkeletonState>
  </>;
}

// Gráfica de líneas: tres series con área, una banda sombreada y tooltip; y una sola serie (sin leyenda).
const LINE_LABELS = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
const LINE_SERIES = [
  {key: 'a', label: 'Serie A', color: '--color-series-1', values: [6, 6.5, 5.8, 7, 8.2, 9, 8.6, 7.4, 6.8, 6, 5.6, 6.2]},
  {key: 'b', label: 'Serie B', color: '--color-series-2', values: [3, 3.4, 3.8, 4.4, 5, 5.2, 4.8, 4.2, 3.8, 3.4, 3.2, 3.4]},
  {key: 'c', label: 'Serie C', color: '--color-series-3', values: [1.6, 1.8, 2, 2.6, 3, 3.2, 3, 2.6, 2.2, 1.8, 1.6, 1.8]},
];
function LineSections() {
  return <>
    <p className="muted">Cómo cambia un valor a lo largo de un eje y cómo se comparan pocas series (hasta tres: una cuarta no inventa color). El color sigue a la serie, no a su orden. Pasa el puntero o usa las flechas para ver los valores de todas las series en un punto.</p>
    <section className="panel showcase-section"><h2>Tres series con banda</h2>
      <LineChart label="Valor por punto, tres series" labels={LINE_LABELS} series={LINE_SERIES} max={10} format={n => `${n} u`}
        bands={[{from: 0, to: 3, label: 'Zona destacada'}]}/></section>
    <section className="panel showcase-section"><h2>Una serie · sin leyenda</h2>
      <LineChart label="Valor por punto, una serie" labels={LINE_LABELS} series={LINE_SERIES.slice(0, 1)} max={10} format={n => `${n} u`}/></section>
    <Tokens items={[
      ['--color-series-1', 'Serie 1 (rosa)'],
      ['--color-series-2', 'Serie 2 (azul)'],
      ['--color-series-3', 'Serie 3 (cian)'],
      ['--color-surface-sunken', 'Banda sombreada'],
      ['--color-border-strong', 'Ejes y cursor'],
    ]}/>
  </>;
}

// Gráfica de columnas: con meta y tendencia, y por categorías sin carril. «Repetir» vuelve a montar para ver la entrada.
function ColumnSections() {
  const [run, setRun] = useState(0);
  const series = [['Ene', 4], ['Feb', 6], ['Mar', 5], ['Abr', 7], ['May', 6], ['Jun', 8]];
  const categories = [['Categoría A', 4], ['Categoría B', 3], ['Categoría C', 1]];
  return <>
    <div className="showcase-replay"><p className="muted">Pasa el puntero (el tooltip lo sigue), usa Tab o toca una columna para ver su valor. Las columnas crecen una tras otra, luego se dibuja la tendencia y aparecen los puntos.</p>
      <Button variant="secondary" size="small" onClick={() => setRun(n => n + 1)}>Repetir</Button></div>
    <div className="split" key={run}>
      <section className="panel showcase-section"><h2>Serie con meta y tendencia</h2>
        <ColumnChart label="Valor por mes frente a la meta de 10" max={10} goal={10} trend highlight={[5]} footer={['Promedio', '6 por mes']}
          items={series.map(([m, n]) => [m, n, `${m}: ${n} de 10 (${n * 10} %)`])}/></section>
      <section className="panel showcase-section"><h2>Categorías · sin carril, todas destacadas</h2>
        <ColumnChart label="Valor por categoría" max={4} highlight="all" track={false} footer={['Total', 8]}
          items={categories.map(([c, n]) => [c, n, `${c}: ${n} de 8 (${Math.round(n / 8 * 100)} %)`])}/></section>
    </div>
    <Tokens items={[
      ['--color-chart-history', 'Columnas no destacadas'],
      ['--color-action', 'Columna destacada (o todas con highlight="all")'],
      ['--color-primary-50', 'Carril: la escala completa (se quita con track={false})'],
      ['--color-chart-goal', 'Línea de meta, verde punteada'],
      ['--color-text-muted', 'Tendencia punteada y sus puntos; ejes y etiquetas'],
      ['--color-border-strong', 'Línea base y eje vertical'],
    ]}/>
  </>;
}

// Anillo: partes de un todo (dona, color por categoría) y avance hacia una meta (morado, la pista es lo que falta).
const RING_PARTS = [['Categoría A', 40, '--color-dot-contacto'], ['Categoría B', 76, '--color-dot-calificacion'], ['Categoría C', 79, '--color-dot-propuesta'], ['Categoría D', 143, '--color-dot-negociacion']];
const RING_PEOPLE = [['Persona A', 3], ['Persona B', 2], ['Persona C', 2], ['Persona D', 1]];
function RingSections() {
  const total = RING_PARTS.reduce((sum, p) => sum + p[1], 0);
  const parts = RING_PARTS.map(([label, value, color]) => ({label, value, display: value, marker: {dot: color}, color}));
  const people = RING_PEOPLE.map(([label, value]) => ({label, value, display: value, marker: {initials: label.slice(-1)}}));
  return <>
    <p className="muted">Pasa el puntero por un tramo o una fila: el centro muestra ese valor y el resto se atenúa. Los tramos tienen las esquinas de los botones sobre una pista oscura.</p>
    <div className="split">
      <section className="panel showcase-section"><h2>Horizontal · composición del total</h2>
        <Ring layout="horizontal" items={parts} label="Valor por categoría" center={[total, 'Total']} footer={['Total', total]}/></section>
      <section className="panel showcase-section"><h2>Vertical · avance hacia una meta de 10</h2>
        <Ring items={people} goal={10} label="Aporte por persona" center={['8 de 10', 'Avance']} footer={['Avance frente a la meta', '8 de 10']}/></section>
    </div>
    <Tokens items={[
      ['--color-dot-*', 'Tramos de la composición: el color de cada categoría'],
      ['--color-track', 'Pista del anillo; con meta, es lo que falta'],
      ['--color-text-muted', 'Etiqueta del centro y porcentaje de la leyenda'],
    ]}/>
  </>;
}

// Ranking: lista de barras sin pista para comparar pocas personas o elementos entre sí cuando no hay meta individual.
function RankingSections() {
  const items = RING_PEOPLE.map(([label, value]) => ({label, value, display: value, meta: `${Math.round(value / 8 * 100)} % del total`, marker: {initials: label.slice(-1)}}));
  return <>
    <p className="muted">La barra más larga es el mayor valor, no un 100 %: sin pista, el valor va justo al final de cada barra. En móvil se oculta el porcentaje.</p>
    <section className="panel showcase-section"><h2>Ranking</h2>
      <BarList items={items} label="Valor por persona" footer={['Total', 8]}/></section>
  </>;
}

// Avatar: foto, respaldo de iniciales y tamaños.
function AvatarSections() {
  const [name, photo] = SAMPLE_PEOPLE[0];
  return <>
    <p className="muted">Decorativo: el nombre siempre va escrito al lado. Si la foto no carga (sin conexión, error), quedan las iniciales.</p>
    <section className="panel showcase-section"><h2>Foto e iniciales · 20, 24 y 32 px</h2>
      <div className="showcase-row showcase-avatars">
        {[20, 24, 32].map(size => <span key={size} style={{'--avatar-size': `${size}px`}}><Avatar name={name} photo={photo}/><Avatar name="Persona Dos"/><small>{size} px</small></span>)}
      </div>
    </section>
  </>;
}

// Tarjeta destacada junto a una tarjeta normal: mismo contenido, distinta superficie.
function FeaturedCardSections() {
  const content = <><div className="kpi-label">Indicador principal<DeltaPill value={2}/></div><div className="value">8 de 10</div>
    <Button variant="primary" size="small">Acción</Button></>;
  return <>
    <p className="muted">Una por pantalla, para el resumen que se lee primero. Lleva <code>.card--featured</code>. Sin <code>data-theme</code> (la de Olibia): en claro, lavanda agrisada con borde violeta y sombra flotante, con los tokens claros; en oscuro, violeta <code>#2c224e</code>. Con <code>data-theme="dark"</code> (la barra fija de seguimiento): oscura y opaca también en claro, con los tokens oscuros.</p>
    <div className="showcase-featured">
      <section className="card card--featured"><p className="showcase-tip-name">Destacada</p>{content}</section>
      <section className="card card--featured" data-theme="dark"><p className="showcase-tip-name">Destacada oscura</p>{content}</section>
      <section className="card"><p className="showcase-tip-name">Normal</p>{content}</section>
    </div>
  </>;
}

// Tabla de datos: con datos (hover y buscador), cargando, vacía y en densidad compacta.
const TABLE_ROWS = [['Elemento A', 'stage-negociacion', 'Paso 4', 65, 'Positivo'], ['Elemento B', 'stage-propuesta', 'Paso 3', 51, 'Aviso'], ['Elemento C', 'stage-contacto', 'Paso 1', 22, 'Aviso']];
const TABLE_COLUMNS = [
  {label: 'Nombre', sk: '80%', cell: r => r[0]},
  {label: 'Progreso', sk: '70%', cell: r => <span className={`pill stage ${r[1]}`}>{r[2]}</span>},
  {label: 'Valor', sk: '50%', cell: r => `$${r[3]} M`},
  {label: 'Estado', sk: '60%', cell: r => <span className={`pill ${r[4] === 'Positivo' ? 'status-al-dia' : 'status-pendiente'}`}>{r[4]}</span>},
  {label: 'Acción', sk: '40%', cell: r => <Button variant="transparent" size="small" aria-label={`Ver ${r[0]}`}>Ver</Button>},
];
// 23 filas: más de 10, así se ve el paginador (3 páginas)
const TABLE_MANY = Array.from({length: 23}, (_, i) => [`Elemento ${i + 1}`, ...TABLE_ROWS[i % 3].slice(1)]);
function TableSections() {
  const [query, setQuery] = useState('');
  const rows = TABLE_ROWS.filter(r => r[0].toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <section className="panel showcase-section">
      <DataTable title="Con datos" rows={rows} rowKey={r => r[0]} columns={TABLE_COLUMNS}
        tools={<SearchField label="Buscar" placeholder="Buscar…" value={query} onChange={setQuery}/>}
        empty={<EmptyState title={`No encontramos «${query.trim()}»`} message="Revisa cómo está escrito o busca otro nombre." action="Borrar búsqueda" onAction={() => setQuery('')}/>}/>
    </section>
    {/* sk-root: variables de color del skeleton (SkeletonState las pone cuando envuelve la pantalla) */}
    <section className="panel showcase-section"><DataTable title="Con paginador · más de 10 filas" rows={TABLE_MANY} rowKey={r => r[0]} columns={TABLE_COLUMNS}/></section>
    <section className="panel showcase-section sk-root"><DataTable title="Cargando" loading skeletonRows={3} rows={[]} rowKey={r => r[0]} columns={TABLE_COLUMNS}/></section>
    <section className="panel showcase-section"><DataTable title="Vacía · texto simple" rows={[]} rowKey={r => r[0]} columns={TABLE_COLUMNS} empty="No hay datos para mostrar."/></section>
    <section className="panel showcase-section" data-density="compact"><DataTable title="Densidad compacta" rows={TABLE_ROWS} rowKey={r => r[0]} columns={TABLE_COLUMNS}/></section>
    <Tokens items={[
      ['--color-surface-sunken', 'Banda de la cabecera'],
      ['--color-text-muted', 'Texto de la cabecera'],
      ['--color-border', 'Divisor entre filas'],
      ['--color-surface-hover', 'Fila en hover'],
      ['--color-text', 'Texto de las celdas'],
    ]}/>
  </>;
}

// Modal: los dos tamaños dibujados en la página y para abrir de verdad, con contenido neutro.
const MODAL_BODY = <p className="muted" style={{margin: 0}}>Contenido del modal: un formulario corto, el detalle de un elemento o una confirmación. El cuerpo tiene 24 px de relleno y hace scroll si no cabe.</p>;
function LargeModalBody() {
  const [active, setActive] = useState('a');
  return <div className="settings-layout">
    <div className="settings-nav" role="tablist" aria-orientation="vertical">
      {[['a', 'Sección A'], ['b', 'Sección B']].map(([id, label]) => <button key={id} role="tab" aria-selected={active === id} onClick={() => setActive(id)}>{label}</button>)}
    </div>
    <section className="settings-content" role="tabpanel"><h3>{active === 'a' ? 'Sección A' : 'Sección B'}</h3>
      <p className="muted">El tamaño grande cede el espacio al contenido: trae su propia navegación y relleno.</p></section>
  </div>;
}
function ModalSections() {
  const [open, setOpen] = useState(null);
  const footer = close => <><p className="dialog-status" role="status">Estado opcional del pie</p><Button variant="secondary" onClick={close}>Cancelar</Button><Button variant="primary" onClick={close}>Confirmar</Button></>;
  return <>
    <section className="panel showcase-section">
      <h2>Abrir</h2>
      <p className="muted showcase-tip-note">Tab y Mayús+Tab quedan dentro del modal; Escape o un clic en el fondo lo cierran y el foco vuelve al botón. En móvil, el mediano con `sheet` sube desde abajo.</p>
      <div className="showcase-row">
        <Button variant="secondary" onClick={() => setOpen('medium')}>Mediano</Button>
        <Button variant="secondary" onClick={() => setOpen('large')}>Grande</Button>
      </div>
    </section>
    <section className="panel showcase-section"><h2>Mediano · con pie de acciones</h2>
      <Modal inline title="Título del modal" onClose={() => {}} footer={footer(() => {})}>{MODAL_BODY}</Modal></section>
    <section className="panel showcase-section"><h2>Mediano · sin pie</h2>
      <Modal inline title="Título del modal" onClose={() => {}}>{MODAL_BODY}</Modal></section>
    <section className="panel showcase-section"><h2>Grande</h2>
      <Modal inline size="large" title="Título del modal" onClose={() => {}}><LargeModalBody/></Modal></section>
    {open === 'medium' && <Modal sheet title="Título del modal" onClose={() => setOpen(null)} footer={footer(() => setOpen(null))}>{MODAL_BODY}</Modal>}
    {open === 'large' && <Modal size="large" title="Título del modal" onClose={() => setOpen(null)}><LargeModalBody/></Modal>}
    <Tokens items={[
      ['--color-backdrop', 'Fondo detrás del modal (con desenfoque de 2 px)'],
      ['--color-surface', 'Ventana'],
      ['--color-border', 'Divisores de cabecera y pie'],
      ['--color-text-muted', 'Estado del pie'],
      ['--color-border-strong', 'Asa del bottom sheet en móvil'],
    ]}/>
  </>;
}

// Estado vacío: interactivo (una lista que se puede vaciar) y su forma mínima.
function EmptyStateSections() {
  const [query, setQuery] = useState('zz');
  const rows = TABLE_ROWS.filter(r => r[0].toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <section className="panel showcase-section">
      <p className="muted showcase-tip-note">Escribe un nombre que no exista; la acción deshace lo que dejó la lista vacía.</p>
      <DataTable title="Lista con búsqueda" rows={rows} rowKey={r => r[0]} columns={TABLE_COLUMNS}
        tools={<SearchField label="Buscar" placeholder="Buscar…" value={query} onChange={setQuery}/>}
        empty={<EmptyState title={`No encontramos «${query.trim()}»`} message="Revisa cómo está escrito o busca otro nombre." action="Borrar búsqueda" onAction={() => setQuery('')}/>}/>
    </section>
    <div className="split">
      <section className="panel"><h2>Con sugerencia y acción</h2><EmptyState title="No hay resultados con estos filtros" message="Prueba quitando alguno para ver más resultados." action="Limpiar filtros" onAction={() => {}}/></section>
      <section className="panel"><h2>Solo título</h2><EmptyState title="Todavía no hay elementos"/></section>
    </div>
    <Tokens items={[
      ['--color-border-strong', 'Filas vacías (punteadas) y mango de la lupa'],
      ['--color-primary-link', 'Lente, brillo y acción'],
      ['--color-surface', 'Interior de la lente, que tapa las filas al pasar'],
      ['--color-text', 'Título (qué no se encontró)'],
      ['--color-text-muted', 'Sugerencia'],
    ]}/>
  </>;
}

// Fallback: error de carga de un bloque (interactivo, con reintento) y de la página completa.
function FallbackSections() {
  const [state, setState] = useState('error');
  const retry = () => { setState('loading'); setTimeout(() => setState('ok'), 1000); };
  return <>
    <section className="panel showcase-section">
      <h2>Bloque · interactivo</h2>
      <p className="muted showcase-tip-note">El bloque conserva su título. «Intentar de nuevo» vuelve a pedir solo sus datos: pasa a carga y luego muestra el contenido. Sin `message`, usa el genérico.</p>
      <div className="split">
        <section className={['panel', state === 'loading' && 'sk-block', state === 'loading' && 'sk-root'].filter(Boolean).join(' ')}>
          <h2>Título del bloque</h2>
          {state === 'error' && <Fallback onRetry={retry}/>}
          {state === 'loading' && <ChartSkeleton/>}
          {state === 'ok' && <p className="muted">Contenido del bloque cargado.</p>}
        </section>
        <div><Button variant="secondary" onClick={() => setState('error')} disabled={state === 'error'}>Simular fallo otra vez</Button></div>
      </div>
    </section>
    <section className="panel showcase-section"><h2>Bloque · con mensaje propio</h2>
      <Fallback message="No pudimos mostrar los datos de este bloque." onRetry={() => {}}/></section>
    <section className="panel showcase-section">
      <h2>Página completa · nada pudo cargar</h2>
      <p className="muted showcase-tip-note">Sustituye todo el contenido; la cabecera y la navegación se mantienen. Título y mensaje se pueden cambiar.</p>
      <PageFallback onRetry={() => {}}/>
    </section>
    <Tokens items={[
      ['--color-border-strong', 'Trazo de la ilustración (batería, enchufe, cable)'],
      ['--color-warning-medium-text', 'Carga baja (parpadea) y luz del tomacorriente'],
      ['--color-primary-link', 'Rayo, chispas y acción'],
      ['--color-text-muted', 'Mensaje'],
    ]}/>
  </>;
}

// Selector de tema: comparte el valor con el de la barra superior (GuideTheme), así todos muestran el mismo tema.
function ThemeSwitchSections() {
  const [value, setValue] = useContext(GuideTheme);
  return <>
    <section className="panel showcase-section">
      <h2>Interactivo</h2>
      <p className="muted showcase-tip-note">Pasa el puntero por cada opción para ver su tooltip. Con Tab entras a la opción elegida y con las flechas cambias. La página funde al tema nuevo; con movimiento reducido cambia al instante.</p>
      <div className="showcase-row"><ThemeSwitch value={value} onChange={setValue} label="Tema de ejemplo"/></div>
    </section>
    <section className="panel showcase-section">
      <h2>En una fila de ajustes</h2>
      <div className="setting-row"><div><span className="setting-label" id="theme-demo-label">Tema</span><p className="setting-description">«Sistema» sigue el tema del dispositivo y cambia con él.</p></div><ThemeSwitch value={value} onChange={setValue} labelledBy="theme-demo-label"/></div>
    </section>
    <Tokens items={[
      ['--color-surface-sunken', 'Pista en píldora'],
      ['--color-border-strong', 'Borde de la pista y de la perilla'],
      ['--color-surface', 'Perilla que se desliza a la opción elegida'],
      ['--color-primary-link', 'Icono elegido, en relleno'],
      ['--color-text-muted', 'Iconos no elegidos, en contorno'],
    ]}/>
  </>;
}

// Chip: estados fijos y una lista interactiva que se puede vaciar y restaurar.
const CHIP_VALUES = ['Categoría A', 'Categoría C', 'Persona 1'];
function ChipSections() {
  const [values, setValues] = useState(CHIP_VALUES);
  const state = (title, props) => <div><p className="showcase-tip-name">{title}</p><div className="showcase-row"><Chip {...props}>Categoría A</Chip></div></div>;
  return <>
    <section className="panel showcase-section">
      <h2>Estados</h2>
      <div className="showcase-tips">
        {state('Solo lectura')}
        {state('Con × para quitar', {onRemove: () => {}})}
        {state('× en hover', {onRemove: () => {}, forceState: 'hover'})}
        {state('× con foco', {onRemove: () => {}, forceState: 'focus'})}
      </div>
    </section>
    <section className="panel showcase-section">
      <h2>Interactivo · lista de chips</h2>
      <p className="muted showcase-tip-note">La × quita un chip; «Limpiar» los quita todos. Se ajustan en varias líneas.</p>
      {values.length
        ? <ul className="chip-list" aria-label="Valores elegidos" style={{marginTop: 'var(--space-3)'}}>
            {values.map(v => <Chip as="li" key={v} removeLabel={`Quitar ${v}`} onRemove={() => setValues(vs => vs.filter(x => x !== v))}>{v}</Chip>)}
            <li><Button variant="transparent" size="small" onClick={() => setValues([])}>Limpiar</Button></li>
          </ul>
        : <div className="showcase-row"><Button variant="secondary" size="small" onClick={() => setValues(CHIP_VALUES)}>Restaurar chips</Button></div>}
    </section>
    <Tokens items={[
      ['--color-primary-50', 'Fondo del chip'],
      ['--color-primary-text', 'Texto y ×'],
      ['--color-primary-100', 'Hover de la ×'],
      ['--color-focus', 'Anillo de foco de la ×'],
    ]}/>
  </>;
}

// Filtros en móvil: botón único que abre un bottom sheet con selects nativos (aquí también en escritorio, para verlo).
const SHEET_FIELDS = [
  {key: 'tags', label: 'Categoría', all: 'Todas las categorías', unit: 'categorías', multiple: true, options: [['A', 'Categoría A'], ['B', 'Categoría B'], ['C', 'Categoría C']]},
  {key: 'owner', label: 'Responsable', all: 'Todos', options: [['1', 'Persona 1'], ['2', 'Persona 2']]},
  {key: 'value', label: 'Valor', all: 'Todos los valores', options: [['30', 'Desde 30'], ['50', 'Desde 50']]},
];
function FilterSheetSections() {
  const [filters, setFilters] = useState({tags: ['A', 'C'], owner: '1', value: ''});
  return <>
    <section className="panel showcase-section">
      <p className="muted showcase-tip-note">En pantallas de móvil sustituye a la fila de desplegables. Al tocar un campo se abre la selección nativa del sistema (varias opciones: casillas); lo elegido se aplica con «Aplicar» y el botón muestra cuántos filtros hay activos. Debajo, los filtros activos como chips: la × quita uno y «Limpiar» todos, sin abrir el sheet.</p>
      <div style={{maxWidth: 360, marginTop: 'var(--space-3)'}}><FilterSheetButton filters={filters} fields={SHEET_FIELDS} onApply={change => setFilters(f => ({...f, ...change}))}/></div>
    </section>
    <Tokens items={[
      ['--color-primary-50', 'Fondo del botón y de los chips'],
      ['--color-primary-text', 'Texto de los chips'],
      ['--color-primary-100', 'Hover de la × del chip'],
      ['--color-action', 'Contador de filtros activos y casillas marcadas'],
      ['--color-border-strong', 'Línea de los selects y borde de las casillas'],
    ]}/>
  </>;
}

// ─── Página del sistema ─────────────────────────────────────────────────────────────────────────────────────

// [id, título, descripción, bloque]; la descripción dice qué es y para qué sirve, sin el caso de uso.
const SYSTEM = [
  ['Fundamentos', [
    ['colores', 'Colores', 'Tokens por función, con su valor en el tema actual. Cambia a oscuro para ver sus equivalentes.', ColorSections],
    ['iconos', 'Iconos', 'Material Symbols rounded; heredan el color del texto.', IconSections],
  ]],
  ['Componentes', [
    ['boton', 'Botón', 'Primary, secondary y transparent; idle, hover, press y disabled; large, medium y small. El ancho se ajusta al contenido.', ButtonSections],
    ['desplegable', 'Desplegable', 'Elegir una o varias opciones de una lista. Solo borde inferior; menú con el ancho del disparador y filas de 40 px.', DropdownSections],
    ['busqueda', 'Campo de búsqueda', 'Localizar elementos en una lista. Mismo borde inferior que el desplegable; botón para borrar con texto.', SearchSections],
    ['tooltip', 'Tooltip', 'Ayuda breve sobre un elemento. Se abre con hover, Tab o clic y se cierra con Escape.', TooltipSections],
    ['avatar', 'Avatar', 'Una persona: su foto en círculo o, si no hay, sus iniciales. Va junto al nombre en listas, rankings y opciones de un desplegable.', AvatarSections],
    ['menu-lateral', 'Menú lateral', 'Áreas del producto en una columna fija bajo la cabecera; icono opcional y la activa resaltada. En móvil se abre como cajón con el botón «Menú».', SideNavSections],
    ['pills', 'Pills', 'Etiquetas cortas de estado, variación, progreso o filtro. El color nunca va solo: texto, flecha o icono lo acompañan.', PillSections],
    ['chip', 'Chip', 'Etiqueta corta de un valor elegido (un filtro, una etiqueta); con su × se quita. Se agrupan en una lista que se ajusta en varias líneas.', ChipSections],
    ['destacada', 'Tarjeta destacada', 'El resumen principal de una pantalla: superficie oscura en claro y violeta en oscuro, con el mismo contenido y componentes que una tarjeta normal.', FeaturedCardSections],
    ['banner', 'Banner', 'Aviso persistente en la página, con acción y cierre.', BannerSections],
    ['toast', 'Toast', 'Resultado de un proceso: éxito, error o neutro. Abajo al centro; puede llevar una acción.', ToastSections],
    ['expandable', 'Expandable', 'Contenido que se muestra bajo demanda; se abre con clic, Enter o Espacio y anima su altura.', ExpandableSections],
    ['ia', 'Texto de IA', 'Todo texto generado por IA muestra «Analizando…» y luego aparece palabra a palabra; la acción entra al terminar.', AiTextSections],
    ['filtros-movil', 'Filtros en móvil', 'Un solo botón con el número de filtros activos abre un bottom sheet con selects nativos y casillas; los filtros activos se ven como chips que se quitan sin abrirlo.', FilterSheetSections],
    ['tabla', 'Tabla', 'Registros comparables fila a fila. Título y herramientas arriba; estados de carga y vacío; densidad cómoda o compacta.', TableSections],
    ['lineas', 'Gráfica de líneas', 'Cómo cambia un valor a lo largo de un eje (horas, días) en pocas series; área, bandas sombreadas y tooltip con todos los valores del punto.', LineSections],
    ['columnas', 'Gráfica de columnas', 'Comparar pocos valores sobre una escala; meta, tendencia, carril y resumen opcionales. Se anima al entrar en pantalla.', ColumnSections],
    ['anillo', 'Anillo', 'Partes de un todo (dona) o avance hacia una meta, con el total al centro y la leyenda al lado o debajo.', RingSections],
    ['ranking', 'Ranking', 'Comparar pocos elementos entre sí sin meta individual: barras sin pista con el valor al final.', RankingSections],
    ['modal', 'Modal', 'Tarea puntual sin perder la pantalla de fondo. Grande o mediano; trampa de foco; en móvil, bottom sheet.', ModalSections],
    ['tema', 'Selector de tema', 'Sistema, Claro u Oscuro en un interruptor de tres posiciones, con tooltip por opción.', ThemeSwitchSections],
    ['skeleton', 'Skeleton', 'Estado de carga: contornos y líneas con la corriente de energía; se arma con piezas para cualquier contenido.', SkeletonSections],
    ['vacio', 'Estado vacío', 'No hay resultados: qué no se encontró, una sugerencia y la acción que lo deshace. No es un error.', EmptyStateSections],
    ['fallback', 'Fallback', 'Error de carga de un bloque (reintenta solo ese bloque) o de la página completa. No culpa al usuario.', FallbackSections],
  ]],
];

// Página con índice por grupos; el índice desplaza con scrollIntoView (un #ancla cambiaría la ruta de la guía).
function IndexedPage({title, description, groups}) {
  const go = id => document.getElementById(`ds-${id}`)?.scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start'});
  // Sección activa: la última cuyo título ya pasó el tercio superior de la ventana
  const ids = groups.flatMap(([, items]) => items.map(([id]) => id));
  const [current, setCurrent] = useState(ids[0]);
  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight / 3;
      const passed = ids.filter(id => (document.getElementById(`ds-${id}`)?.getBoundingClientRect().top ?? Infinity) <= line);
      setCurrent(passed.at(-1) || ids[0]);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [groups]);
  // El ítem activo siempre a la vista dentro del menú (que tiene scroll propio), sin mover la página
  useEffect(() => {
    const menu = document.querySelector('.showcase-menu'), link = menu?.querySelector('.active');
    if (!link) return;
    const {top, bottom} = link.getBoundingClientRect(), box = menu.getBoundingClientRect();
    if (top < box.top + 48 || bottom > box.bottom - 48) menu.scrollTop += top - box.top - box.height / 2;
  }, [current]);
  const index = <nav className="showcase-index" aria-label="Índice">{groups.flatMap(([, items]) => items).map(([id, label]) =>
    <Button key={id} variant="secondary" size="small" onClick={() => go(id)}>{label}</Button>)}</nav>;
  const nav = groups.map(([group, items]) => <div key={group} className="showcase-nav-group">
    <p className="showcase-nav-title">{group}</p>
    <SideNav label={group} items={items.map(([id, label]) => ({label, active: id === current, onSelect: () => go(id)}))}/>
  </div>);
  return <GuidePage title={title} description={description} index={index} nav={nav}>
    {groups.map(([group, items]) => <div key={group} className="showcase-part">
      <p className="showcase-part-title">{group}</p>
      {items.map(([id, label, note, Sections]) => <section key={id} id={`ds-${id}`} className="showcase-group">
        <h2 className="showcase-group-title">{label}</h2>
        <p className="muted showcase-group-note">{note}</p>
        <Sections/>
      </section>)}
    </div>)}
  </GuidePage>;
}

export const AllComponentsShowcase = () => <IndexedPage title="Design system" description="Fundamentos y componentes, con contenido de ejemplo neutro para usarlos en cualquier producto. Cómo se usan en Olibia está en «Patrones de Olibia» (#patrones)." groups={SYSTEM}/>;

// ─── Patrones de Olibia: el sistema aplicado al dashboard comercial ──────────────────────────────────────────

const OLIBIA_AI = <>
  <p>Faltan <strong>2 cierres</strong> para la meta y quedan <strong>5 días hábiles</strong>. Las 2 oportunidades más cerca de cerrar pueden cubrir la brecha: Alimentos del Norte (Negociación, $65 M, contacto mié 28 oct · en 2 días) y Industrias Atlas (Negociación, $78 M, contacto jue 29 oct · en 3 días).</p>
  <p><strong>Siguiente paso sugerido:</strong> registrar el seguimiento de Alimentos del Norte y Industrias Atlas con sus responsables antes de la fecha de contacto.</p>
</>;
const OLIBIA_SUMMARY = <div className="period-ai ai-widget"><Expandable title="Resumen AI" icon="ai" headingLevel={3}>
  <AiText thinking="Analizando cierres y pipeline…" after={<Button variant="primary">Ver negociaciones pendientes</Button>}>{OLIBIA_AI}</AiText>
</Expandable></div>;

// Tarjeta del periodo: 4 KPIs (cifras que cuentan desde 0) y Resumen AI.
function PeriodSections() {
  const [run, setRun] = useState(0);
  const [filtered, setFiltered] = useState(false);
  return <>
    <div className="showcase-replay">
      <p className="muted">Repetir simula un cambio de periodo (las 4 cifras desde 0). Filtrar simula un filtro: solo cambian Oportunidades y Valor del pipeline, desde su valor anterior.</p>
      <div className="filters">
        <Button variant="secondary" size="small" onClick={() => setRun(n => n + 1)}>Repetir animación</Button>
        <Button variant="secondary" size="small" onClick={() => setFiltered(f => !f)}>{filtered ? 'Quitar filtro' : 'Filtrar: Negociación'}</Button>
      </div>
    </div>
    <PeriodCard resetKey={run} closed={8} goal={10} delta={2} openCount={filtered ? 2 : 8} pipeline={filtered ? 143 : 338}>{OLIBIA_SUMMARY}</PeriodCard>
    <p className="showcase-tip-name">Variación negativa y resumen corto</p>
    <PeriodCard resetKey={`neg-${run}`} closed={6} goal={10} delta={-1} openCount={5} pipeline={210}>
      <div className="period-ai ai-widget"><Expandable title="Resumen AI" icon="ai" headingLevel={3}><AiText thinking="Analizando cierres y pipeline…"><p>Septiembre cerró con <strong>6 de 10 cierres</strong>; faltaron 4 para la meta.</p></AiText></Expandable></div>
    </PeriodCard>
  </>;
}

// KPI «Negociaciones al día» (segunda posición de la tarjeta del periodo) y su modal con las negociaciones y responsables.
const DEALS = [['Alimentos del Norte', 'Negociación', 65, 'Laura Díaz', '28 oct'], ['Industrias Atlas', 'Negociación', 78, 'Mateo Gil', '29 oct']];
function FollowUpSections() {
  const [done, setDone] = useState({});
  const [open, setOpen] = useState(false);
  const isDone = row => !!done[row[0]];
  const mark = row => setDone(s => ({...s, [row[0]]: true}));
  return <>
    <div className="showcase-replay"><p className="muted">Solo aparece si hay negociaciones que cierran la brecha. «Dar seguimiento» abre el modal; registrar actualiza el KPI.</p>
      <Button variant="secondary" size="small" onClick={() => setDone({})}>Reiniciar</Button></div>
    <PeriodCard resetKey="fu" closed={8} goal={10} delta={2} openCount={8} pipeline={338}
      extra={<FollowUpKpi deals={DEALS} isDone={isDone} onOpen={() => setOpen(true)}/>}>{OLIBIA_SUMMARY}</PeriodCard>
    <section className="panel showcase-section"><h2>Modal · Negociaciones que cierran la brecha</h2>
      <Modal inline title="Negociaciones que cierran la brecha" onClose={() => {}}><NegotiationsSummary deals={DEALS} isDone={isDone} onMark={mark} onSelect={() => {}}/></Modal></section>
    {open && <Modal sheet title="Negociaciones que cierran la brecha" onClose={() => setOpen(false)}>
      <NegotiationsSummary deals={DEALS} isDone={isDone} onMark={mark} onSelect={() => {}}/>
    </Modal>}
  </>;
}

// Etapas (escala de progreso) y seguimiento (pill que se transforma de Pendiente a Al día).
const STAGE_PILLS = [['stage-contacto', 'Contacto'], ['stage-calificacion', 'Calificación'], ['stage-propuesta', 'Propuesta'], ['stage-negociacion', 'Negociación']];
function StageFollowUpSections() {
  const [done, setDone] = useState(false);
  return <section className="panel showcase-section">
    <div className="showcase-tips">
      <div><p className="showcase-tip-name">Etapa · del inicio al cierre</p>
        <div className="showcase-row">{STAGE_PILLS.map(([cls, label]) => <span key={cls} className={`pill stage ${cls}`}>{label}</span>)}</div></div>
      <div><p className="showcase-tip-name">Seguimiento · cambio de estado animado</p>
        <div className="showcase-row"><StatusPill done={done}/><Button variant="transparent" size="small" onClick={() => setDone(!done)}>{done ? 'Volver a pendiente' : 'Marcar al día'}</Button></div></div>
    </div>
  </section>;
}

// Detalle de oportunidad (contenido del modal mediano) en sus tres estados.
const DETAIL_ROW = ['Alimentos del Norte', 'Negociación', 65, 'Laura Díaz', '28 oct'];
function OpportunityDetailSections() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const detail = (key, isOpen, isDone, status) => <Modal inline key={key} title={DETAIL_ROW[0]} onClose={() => {}}
    footer={<OpportunityDetailFooter open={isOpen} done={isDone} status={status} onMark={() => {}}/>}>
    <OpportunityDetail row={DETAIL_ROW} open={isOpen} done={isDone}/>
  </Modal>;
  return <>
    <div className="showcase-replay"><p className="muted">Cifras como los KPIs, atributos en filas y la acción en el pie.</p>
      <Button variant="secondary" size="small" onClick={() => { setDone(false); setOpen(true); }}>Abrir detalle</Button></div>
    <section className="panel showcase-section"><h2>Pendiente</h2>{detail('p', true, false, '')}</section>
    <section className="panel showcase-section"><h2>Seguimiento registrado</h2>{detail('d', true, true, 'Seguimiento registrado en esta sesión.')}</section>
    <section className="panel showcase-section"><h2>Periodo cerrado</h2>{detail('c', false, false, 'Periodo cerrado: no se registran seguimientos.')}</section>
    {open && <Modal sheet title={DETAIL_ROW[0]} onClose={() => setOpen(false)}
      footer={<OpportunityDetailFooter open done={done} status={done ? 'Seguimiento registrado en esta sesión.' : ''} onMark={() => setDone(true)}/>}>
      <OpportunityDetail row={DETAIL_ROW} open done={done}/>
    </Modal>}
  </>;
}

// Las cuatro gráficas del dashboard.
const OLIBIA_STAGES = [['Contacto', 2, 40], ['Calificación', 2, 76], ['Propuesta', 2, 79], ['Negociación', 2, 143]];
const OLIBIA_OWNERS = [['Ana López', 3], ['Carlos Ruiz', 2], ['Laura Díaz', 2], ['Mateo Gil', 1]];
function OlibiaChartSections() {
  const months = [['May', 4], ['Jun', 6], ['Jul', 5], ['Ago', 7], ['Sep', 6], ['Oct', 8]];
  const channels = [['Outbound', 4], ['Referidos', 3], ['Inbound', 1]];
  const stages = OLIBIA_STAGES.map(([s, n, v]) => ({label: s, value: v, display: `$${v} M`, meta: `${n} oport.`, marker: {dot: stageDot(s)}, color: stageDot(s)}));
  const owners = OLIBIA_OWNERS.map(([name, n]) => ({label: name, value: n, display: n, meta: `${Math.round(n / 8 * 100)} % del equipo`, marker: {initials: initials(name)}}));
  return <div className="split">
    <section className="panel showcase-section"><h2>Cierres por mes · Equipo completo</h2>
      <ColumnChart label="Cierres por mes frente a la meta de 10" max={10} goal={10} trend highlight={[5]} footer={['Promedio de cierres en el año', '6 por mes']}
        items={months.map(([m, n]) => [m, n, `${m}: ${n} de 10 cierres (${n * 10} %)`])}/></section>
    <section className="panel showcase-section"><h2>Origen de oportunidades abiertas</h2>
      <ColumnChart label="Oportunidades abiertas por canal" max={4} highlight="all" track={false} footer={['Total de oportunidades abiertas', 8]}
        items={channels.map(([c, n]) => [c, n, `${c}: ${n} de 8 abiertas (${Math.round(n / 8 * 100)} %)`])}/></section>
    <section className="panel showcase-section"><h2>Oportunidades por etapa</h2>
      <Ring layout="horizontal" items={stages} label="Valor abierto por etapa" center={['$338 M', '8 oportunidades']} footer={['Valor abierto en 8 oportunidades', '$338 M']}/></section>
    <section className="panel showcase-section"><h2>Cierres por ejecutivo · Total del periodo</h2>
      <BarList items={owners} label="Cierres por ejecutivo" footer={['Cierres del equipo frente a la meta', '8 de 10']}/></section>
  </div>;
}

// Tabla de oportunidades vacía: textos según qué la vació.
function OlibiaEmptySections() {
  return <div className="split">
    <section className="panel"><h2>Solo búsqueda</h2><EmptyState {...tableEmptyCopy('Acme', false)} onAction={() => {}}/></section>
    <section className="panel"><h2>Solo filtros</h2><EmptyState {...tableEmptyCopy('', true)} onAction={() => {}}/></section>
    <section className="panel"><h2>Búsqueda y filtros</h2><EmptyState {...tableEmptyCopy('Acme', true)} onAction={() => {}}/></section>
  </div>;
}

// Fallback por card del dashboard y de la página.
const CARD_ERRORS = [
  ['Resumen del periodo', 'No pudimos mostrar los indicadores del periodo.'],
  ['Oportunidades abiertas', 'No pudimos mostrar las oportunidades abiertas.'],
  ['Oportunidades por etapa', 'No pudimos mostrar las oportunidades por etapa.'],
  ['Cierres por ejecutivo · Total del periodo', 'No pudimos mostrar los cierres por ejecutivo.'],
  ['Cierres por mes · Equipo completo', 'No pudimos mostrar los cierres de meses anteriores.'],
  ['Origen de oportunidades abiertas', 'No pudimos mostrar el origen de las oportunidades.'],
];
function OlibiaFallbackSections() {
  return <>
    <p className="muted showcase-tip-note">En la demo, 1 de cada 3 cargas falla una card al azar o la página entera; `?fallo=period|table|stage|owner|month|channel|all` fuerza un caso.</p>
    <div className="split">{CARD_ERRORS.map(([title, message]) => <section key={title} className="panel"><h2>{title}</h2><Fallback message={message} onRetry={() => {}}/></section>)}</div>
    <section className="panel showcase-section"><h2>Página</h2><PageFallback title="No pudimos cargar el dashboard" onRetry={() => {}}/></section>
  </>;
}

// Aviso de recta final.
function OlibiaBannerSections() {
  return <section className="banner" aria-label="Aviso comercial (ejemplo)">
    <div className="banner-body"><div className="banner-head"><Icon name="warningFill"/><strong>Recta final del mes</strong></div><p>Revisa las oportunidades abiertas y coordina los próximos contactos con tu equipo.</p>
      <Button variant="transparent" className="banner-action">Ver negociaciones</Button></div>
    <IconButton icon="close" label="Cerrar aviso"/>
  </section>;
}

// Skeleton del dashboard completo.
function OlibiaSkeletonSections() {
  const [run, setRun] = useState(0);
  return <>
    <div className="showcase-replay"><p className="muted">Carga inicial: todo el dashboard en skeleton; la línea de corriente encadena los contenedores de arriba abajo.</p>
      <Button variant="secondary" size="small" onClick={() => setRun(n => n + 1)}>Repetir</Button></div>
    <DashboardSkeleton key={run}/>
  </>;
}

const PATTERNS = [
  ['Pantalla', [
    ['p-periodo', 'Tarjeta del periodo', 'Tarjeta destacada de la pantalla. KPIs (meta, cierres, oportunidades y pipeline) con variación y marca de filtro, y el Resumen AI desplegable.', PeriodSections],
    ['p-seguimiento', 'Negociaciones al día', 'KPI en segunda posición, solo con negociaciones que cierran la brecha; «Dar seguimiento» abre el resumen con valor, avance y responsables.', FollowUpSections],
    ['p-banner', 'Aviso de recta final', 'Banner con el día de la recta final y el acceso a las negociaciones.', OlibiaBannerSections],
    ['p-graficas', 'Gráficas del dashboard', 'Cierres por mes (meta y tendencia), origen por canal (sin carril, todas destacadas), valor por etapa (anillo horizontal en el orden del embudo) y cierres por ejecutivo (ranking sin pista).', OlibiaChartSections],
    ['p-skeleton', 'Carga del dashboard', 'El skeleton armado con la estructura completa de la pantalla.', OlibiaSkeletonSections],
  ]],
  ['Oportunidades', [
    ['p-etapas', 'Etapas y seguimiento', 'Escala de progreso con los nombres del embudo y la pill de seguimiento que se transforma de Pendiente a Al día.', StageFollowUpSections],
    ['p-detalle', 'Detalle de oportunidad', 'Contenido del modal mediano: cifras, atributos y la acción «Marcar seguimiento realizado».', OpportunityDetailSections],
    ['p-vacio', 'Tabla sin resultados', 'Textos del estado vacío según lo que vació la tabla, y la acción que lo deshace.', OlibiaEmptySections],
    ['p-fallback', 'Errores de carga', 'Mensaje de cada card del dashboard y de la página.', OlibiaFallbackSections],
  ]],
];

export const PatternsShowcase = () => <IndexedPage title="Patrones de Olibia" description="Cómo se aplica el design system en el dashboard comercial: datos, textos y combinaciones propias de este producto." groups={PATTERNS}/>;

// Preferencias guardadas (misma clave que App.jsx)
const PREFS_KEY = 'olibia-settings';
function savedPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; } }

// Guías de un solo componente (contenido neutro).
const guide = (title, description, Sections) => () => <GuidePage title={`Design system · ${title}`} description={description}><Sections/></GuidePage>;
export const ButtonShowcase = guide('Botón', 'Variante × estado × tamaño. El ancho se ajusta al contenido.', ButtonSections);
export const DropdownShowcase = guide('Desplegable', 'Solo borde inferior. Menú con fondo de página, ancho del disparador y filas de 40 px.', DropdownSections);
export const SearchShowcase = guide('Campo de búsqueda', 'Mismo borde inferior que el desplegable. Lupa a la izquierda y botón para borrar con texto.', SearchSections);
export const TooltipShowcase = guide('Tooltip', 'Tinte morado. El interactivo se abre con hover, Tab o clic y se cierra con Escape.', TooltipSections);
export const ExpandableShowcase = guide('Expandable', 'Contenido bajo demanda. Se abre con clic, Enter o Espacio.', ExpandableSections);
export const AiTextShowcase = guide('Texto de IA', 'Todo texto generado por IA analiza y luego se escribe. Pulsa Repetir para verlo de nuevo.', AiTextSections);
export const SkeletonShowcase = guide('Skeleton', 'Estado de carga con concepto de energía: la corriente morada recorre los contornos.', SkeletonSections);
export const ToastShowcase = guide('Toast', 'Confirma el resultado de un proceso: éxito, error o neutro.', ToastSections);
export const ColumnShowcase = guide('Gráfica de columnas', 'Valor sobre una escala, con meta, tendencia, carril y resumen opcionales.', ColumnSections);
export const TableShowcase = guide('Tabla', 'Cabecera en banda redondeada, filas con divisor fino y hover suave; estados de carga y vacío.', TableSections);
export const ModalShowcase = guide('Modal', 'Dos tamaños: grande y mediano, con pie de acciones opcional.', ModalSections);
export const FallbackShowcase = guide('Fallback', 'Error de carga de un bloque o de la página: ilustración en línea, mensaje y reintento.', FallbackSections);
export const EmptyStateShowcase = guide('Estado vacío', 'Cuando no hay resultados: qué no se encontró, una sugerencia y la acción que lo deshace.', EmptyStateSections);
export const ThemeSwitchShowcase = guide('Selector de tema', 'Interruptor de tres posiciones: Sistema, Claro y Oscuro, con tooltip en cada opción.', ThemeSwitchSections);
export const PeriodCardShowcase = () => <GuidePage title="Patrones de Olibia · Tarjeta del periodo" description="KPIs y Resumen AI en una sola tarjeta. Las cifras se animan al cargar, al cambiar de periodo y al filtrar."><PeriodSections/></GuidePage>;
