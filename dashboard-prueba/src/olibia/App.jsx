import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {data} from './data';
import {filterRows, channelFor, NO_FILTERS} from './filters';
import {GOAL, OWNERS, CHANNELS, FUNNEL, CURRENT, TODAY_LABEL, periodState, byPriority, sumValue, closedDelta, stageDot, PHOTOS} from './model';
import {AllComponentsShowcase, ButtonShowcase, DropdownShowcase, TooltipShowcase, SearchShowcase, PeriodCardShowcase, ExpandableShowcase, AiTextShowcase, SkeletonShowcase, ToastShowcase, ColumnShowcase, ThemeSwitchShowcase, TableShowcase, ModalShowcase, FallbackShowcase, EmptyStateShowcase, PatternsShowcase} from './showcase';
import {Sidebar, SettingsPanel, Filters, Summary, OpportunityTable} from './components';
import {Button, IconButton} from '../ui/button';
import {ColumnChart} from '../ui/columns';
import {Ring} from '../ui/chart-forms';
import {BarList} from '../ui/bar-list';
import {Modal} from '../ui/modal';
import {Fallback, PageFallback} from '../ui/fallback';
import {FollowUpKpi, FollowUpDock, NegotiationsSummary, negotiationsToFollow} from './followup-kpi';
import {OpportunityDetail, OpportunityDetailFooter} from './detail';
import {Icon} from '../ui/icons';
import {PeriodCard} from './period';
import {DashboardSkeleton} from './skeletons';
import {SkeletonState, SkWire, ChartSkeleton} from '../ui/skeleton';
import {ToastProvider, useToast} from '../ui/toast';
import {Dropdown} from '../ui/dropdown';
import '../ui/fonts.css';
import '../ui/tokens.css';
import '../ui/base.css';
import './layout.css';
import '../ui/side-nav.css';
import '../ui/kpis.css';
import './showcase.css';
import './entry.css';
import '../ui/buttons.css';
import '../ui/glass.css'; // capa vidrio: siempre la última hoja

// Recarga en el sitio: mientras dura, envuelve los componentes en el estado de skeleton (corriente y banda)
// sin ocultarlos; cada componente pinta como skeleton solo sus datos.
function Reloading({active, children}) {
  return active ? <SkeletonState inline label="Actualizando datos del periodo…">{children}</SkeletonState> : children;
}

// Panel de gráfica: el título se mantiene durante la recarga y el contenido pasa a barras de skeleton.
// fallback: si sus datos no llegaron, el cuerpo es el Fallback (error de carga) en lugar de la gráfica.
function ChartPanel({title, loading, fallback, skeleton, children}) {
  return <section className={['panel', 'chart-panel', loading && 'sk-block'].filter(Boolean).join(' ')}>
    {loading && <SkWire/>}
    <h2>{title}</h2>
    {loading ? <ChartSkeleton shape={skeleton}/> : fallback || children}
  </section>;
}

// Fallos simulados del back: 1 de cada 3 cargas de la página falla algo al azar: una de las 6 cards (muestra su
// Fallback) o, con la misma probabilidad, todo el dashboard (fallback de página). El contador vive en este navegador. Cambiar de periodo es una petición nueva y llega bien.
const CARD_ERRORS = {
  period: 'No pudimos mostrar los indicadores del periodo.',
  table: 'No pudimos mostrar las oportunidades abiertas.',
  stage: 'No pudimos mostrar las oportunidades por etapa.',
  owner: 'No pudimos mostrar los cierres por ejecutivo.',
  month: 'No pudimos mostrar los cierres de meses anteriores.',
  channel: 'No pudimos mostrar el origen de las oportunidades.',
};
// Para revisar una card concreta: ?fallo=period|table|stage|owner|month|channel la fuerza en esa carga.
// ?fallo=all: no llega nada (servicio caído) y se muestra el fallback de página.
const FAILING_CARD = (() => {
  const forced = new URLSearchParams(location.search).get('fallo');
  if (forced in CARD_ERRORS || forced === 'all') return forced;
  try {
    const loads = Number(localStorage.getItem('olibia-loads') || 0) + 1;
    localStorage.setItem('olibia-loads', String(loads));
    const options = [...Object.keys(CARD_ERRORS), 'all'];
    return loads % 3 === 0 ? options[Math.floor(Math.random() * options.length)] : null;
  } catch { return null; }
})();

const formatOne = n => n.toLocaleString('es-CO', {maximumFractionDigits: 1});

// Cierres por mes: el mes en curso destacado, la meta y la tendencia; abajo, el promedio
function MonthlyCloses({d}) {
  const avg = d.history.reduce((t, n) => t + n, 0) / d.history.length;
  return <ColumnChart label={`Cierres por mes frente a la meta de ${GOAL}`} max={Math.max(GOAL, ...d.history)} goal={GOAL} trend
    highlight={[d.history.length - 1]} footer={['Promedio de cierres en el año', `${formatOne(avg)} por mes`]}
    items={d.labels.map((m, i) => [m, d.history[i], `${m}: ${d.history[i]} de ${GOAL} cierres (${Math.round(d.history[i] / GOAL * 100)} %)`])}/>;
}

// Origen por canal: el canal que más aporta destacado; abajo, el total abierto (respeta los filtros)
function ChannelOrigin({rows, all}) {
  const counts = CHANNELS.map(c => rows.filter(r => channelFor(r, all) === c).length);
  const top = Math.max(...counts);
  // Conteo del momento, sin histórico ni meta: todas en el morado principal y sin carril.
  return <ColumnChart label="Oportunidades abiertas por canal" max={Math.max(4, Math.ceil(top / 2) * 2)}
    highlight="all" track={false} footer={['Total de oportunidades abiertas', rows.length]}
    items={CHANNELS.map((c, i) => [c, counts[i], `${c}: ${counts[i]} de ${rows.length} abiertas${rows.length ? ` (${Math.round(counts[i] / rows.length * 100)} %)` : ''}`])}/>;
}

// Preferencias de Configuración, guardadas en este navegador.
const PREFS_KEY = 'olibia-settings';
const DEFAULT_PREFS = {theme: 'system', motion: 'system', density: 'comfortable'};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function savedPrefs() {
  try { return {...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')}; } catch { return DEFAULT_PREFS; }
}
// Traduce las preferencias a atributos del <html> que usa el CSS. "Sistema" sigue al sistema operativo.
function applyPrefs({theme, motion, density}) {
  const root = document.documentElement;
  root.dataset.theme = theme === 'system' ? (darkQuery.matches ? 'dark' : 'light') : theme;
  root.dataset.motion = motion;
  root.dataset.density = density;
}
// Se aplica antes del primer render para no mostrar un destello del tema equivocado.
applyPrefs(savedPrefs());

function App() {
  const [period, setPeriod] = useState('oct');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState({});
  const toast = useToast();
  const [banner, setBanner] = useState(true);
  const [prefs, setPrefs] = useState(savedPrefs);
  const [settings, setSettings] = useState(false);
  const [negotiations, setNegotiations] = useState(false);
  const [menu, setMenu] = useState(false);
  // Carga simulada (datos estáticos): skeleton 1,6 s al abrir y 1 s al cambiar de periodo.
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);
  // Reintento del fallback de página: vuelve a la carga inicial completa (skeleton y barrido de entrada)
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setLoading(true);
    const first = firstLoad.current;
    if (!first) setFailed(null);
    let end;
    const t = setTimeout(() => {
      setLoading(false); firstLoad.current = false;
      // Entrada tras la carga inicial: barrido sincronizado de 900 ms (entry.css); luego se retira el skeleton
      if (first) { setEntering(true); end = setTimeout(() => setEntering(false), 1000); }
    }, first ? 1600 : 1000);
    return () => { clearTimeout(t); clearTimeout(end); };
  }, [period, attempt]);
  const [entering, setEntering] = useState(false);
  // Card sin datos (fallo simulado) y card que se está reintentando: solo esa vuelve a cargar, 1 s
  const [failed, setFailed] = useState(FAILING_CARD);
  const [retrying, setRetrying] = useState(null);
  function retry(id) {
    setFailed(null); setRetrying(id);
    setTimeout(() => setRetrying(null), 1000);
  }
  const hasFilters = filters.stage.length > 0 || !!(filters.owner || filters.channel || filters.minimum);
  const pageFailed = !loading && failed === 'all';
  function retryPage() { setFailed(null); firstLoad.current = true; setAttempt(n => n + 1); }
  const fallback = id => !loading && failed === id ? <Fallback message={CARD_ERRORS[id]} onRetry={() => retry(id)}/> : null;
  const cardLoading = id => loading || retrying === id;

  useEffect(() => {
    applyPrefs(prefs);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
    if (prefs.theme !== 'system') return;
    const onSystemChange = () => applyPrefs(prefs);
    darkQuery.addEventListener('change', onSystemChange);
    return () => darkQuery.removeEventListener('change', onSystemChange);
  }, [prefs]);

  // El menú móvil se cierra con Escape.
  useEffect(() => {
    if (!menu) return;
    const onKey = e => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  const d = data[period];
  const info = periodState(period);
  const open = info.state !== 'cerrado';
  const gap = Math.max(GOAL - d.closed, 0);
  // Los filtros recortan el análisis (KPIs, embudo, origen y tabla); la búsqueda solo localiza empresas en la tabla.
  const rows = filterRows(d.rows, {...filters, query: ''}).sort(byPriority);
  const tableRows = filterRows(d.rows, filters).sort(byPriority);
  const total = sumValue(rows);
  const isDone = row => !!done[period + row[0]];
  // Oportunidades que pueden cerrar la brecha: las N primeras por prioridad (sin filtros), N = cierres que faltan.
  const closers = open ? [...d.rows].sort(byPriority).slice(0, gap) : [];
  const followed = closers.filter(isDone).length;
  // Negociaciones que cierran la brecha: con al menos una, aparece el KPI «Negociaciones al día»
  const deals = negotiationsToFollow(closers);

  const updateFilters = change => setFilters(current => ({...current, ...change}));
  const showPending = () => setFilters({...NO_FILTERS, stage: ['Negociación']});

  function exportCSV() {
    const csv = [['Empresa', 'Etapa', 'Valor mensual COP millones', 'Responsable', 'Proximo contacto'], ...tableRows].map(r => r.join(';')).join('\r\n');
    // Descarga directa: tipo binario y enlace con `download` en el documento, así el navegador lo guarda en
    // Descargas sin abrirlo en otra pestaña ni mostrar un diálogo propio de la página.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], {type: 'application/octet-stream'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = `olibia-${period}.csv`;
    a.style.display = 'none';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // Exportar con confirmación: éxito o error (con «Reintentar»).
  function exportWithToast() {
    try {
      exportCSV();
      toast({type: 'success', title: 'CSV exportado'});
    } catch {
      toast({type: 'error', title: 'No se pudo exportar el CSV', action: {label: 'Reintentar', onClick: exportWithToast}});
    }
  }
  // Limpiar filtros con opción de deshacer.
  function clearFilters() {
    const previous = filters;
    setFilters(NO_FILTERS);
    toast({type: 'neutral', title: 'Filtros restablecidos', action: {label: 'Deshacer', onClick: () => setFilters(previous)}});
  }
  // Sin toast: la confirmación ya está a la vista en el modal (pill, botón y estado) y en la fila de la tabla.
  // Reversible: el mismo botón pasa a «Deshacer» (sin límite de tiempo mientras el modal está abierto).
  const [undone, setUndone] = useState(null);
  function markFollowUp(row) {
    setDone(current => ({...current, [period + row[0]]: true}));
    setUndone(null);
  }
  const [negDetail, setNegDetail] = useState(null);
  const [backTo, setBackTo] = useState(null);
  const detailStatus = row => !open ? 'Periodo cerrado: no se registran seguimientos.'
    : isDone(row) ? `Seguimiento registrado en esta sesión.${closers.includes(row) ? ` Oportunidades que cierran la brecha con seguimiento: ${followed} de ${closers.length}.` : ''}`
    : undone === period + row[0] ? 'Seguimiento deshecho.' : '';
  function undoFollowUp(row) {
    setDone(current => { const next = {...current}; delete next[period + row[0]]; return next; });
    setUndone(period + row[0]);
  }

  return <>
    <header className={loading && firstLoad.current ? 'top is-loading' : 'top'}><div><Button variant="transparent" className="menu-toggle" aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}><Icon name="menu"/>Menú</Button><span className="brand">olibia</span><small>Gestión comercial</small></div><span className="muted">Equipo comercial</span></header>
    <div className={['shell', entering && 'is-entering'].filter(Boolean).join(' ')}>
      <Sidebar open={menu} loading={loading && firstLoad.current} onSettings={() => { setMenu(false); setSettings(true); }}/>
      {menu && <div className="drawer-backdrop" onClick={() => setMenu(false)}/>}
      <main>
        {/* Nada llegó del back: el fallback de página sustituye todo el contenido */}
        {pageFailed && <PageFallback title="No pudimos cargar el dashboard" onRetry={retryPage}/>}
        {/* Carga inicial: todo el contenido es skeleton (incluidos título, aviso, periodo y filtros) */}
        {!pageFailed && !(loading && firstLoad.current) && <>
        <div className="toolbar">
          <div><h1>Dashboard comercial</h1><span className="muted">Resumen de resultados y oportunidades</span></div>
          <p className="today">{TODAY_LABEL}<br/><strong>{CURRENT.remaining} {CURRENT.remaining === 1 ? 'día hábil' : 'días hábiles'} para el cierre</strong></p>
        </div>

        {banner && open && <section className="banner" aria-label="Aviso comercial">
          <div className="banner-body"><div className="banner-head"><Icon name="warningFill"/><strong>{info.state === 'recta' ? 'Recta final del mes' : 'Mes en curso'}</strong></div><p>Revisa las oportunidades abiertas y coordina los próximos contactos con tu equipo.</p>
            <Button variant="transparent" className="banner-action" onClick={showPending}>Ver negociaciones</Button></div>
          <IconButton icon="close" label="Cerrar aviso" onClick={() => setBanner(false)}/>
        </section>}

        <div className="periodbar">
          <div className="period-field">
            <label id="periodLabel" htmlFor="period">Periodo</label>
            <div className="filters">
              <Dropdown id="period" labelledBy="periodLabel" className="period-select" icon="calendar" value={period} onChange={setPeriod} options={[['oct', 'Octubre 2026'], ['sep', 'Septiembre 2026']]}/>
              <span className={open ? 'badge period-status' : 'badge period-status is-closed'}>{open ? 'En curso' : 'Cerrado'}</span>
            </div>
          </div>
          <Button variant="secondary" onClick={exportWithToast}>Exportar CSV</Button>
        </div>

        <Filters filters={filters} onChange={updateFilters} onClear={clearFilters}/>
        </>}

        {/* Primera carga: skeleton completo. Después (cambio de periodo) se recarga en el sitio: los componentes
            se mantienen y solo sus datos variables (los que vendrían de la base de datos) son skeleton */}
        {pageFailed ? null : loading && firstLoad.current ? <DashboardSkeleton/> : <Reloading active={loading}>
        {fallback('period') ? <section className="card period-card" aria-label="Resumen del periodo">{fallback('period')}</section>
          : <Reloading active={retrying === 'period'}><PeriodCard resetKey={cardLoading('period') ? 'loading' : period} loading={cardLoading('period')} closed={d.closed} goal={GOAL} delta={closedDelta(d)} openCount={rows.length} pipeline={total}
          extra={deals.length > 0 && <FollowUpKpi deals={deals} isDone={isDone} onOpen={() => setNegotiations(true)}/>}>
          <Summary info={info} closed={d.closed} closers={closers} isDone={isDone} onShowPending={showPending} loading={cardLoading('period')}/>
        </PeriodCard></Reloading>}
        {!fallback('period') && !cardLoading('period') && deals.length > 0 && <FollowUpDock deals={deals} isDone={isDone} paused={negotiations} onOpen={() => setNegotiations(true)}/>}

        <Reloading active={retrying === 'table'}><OpportunityTable rows={tableRows} closers={closers} open={open} query={filters.query} onQuery={query => updateFilters({query})} hasFilters={hasFilters} onClearFilters={clearFilters} isDone={isDone} onSelect={setSelected} loading={cardLoading('table')} fallback={fallback('table')}/></Reloading>

        {/* Primera fila: oportunidades abiertas (etapa y origen), con más ancho para el anillo; debajo, los cierres */}
        <div className="split split--ring">
          <Reloading active={retrying === 'stage'}><ChartPanel loading={cardLoading('stage')} fallback={fallback('stage')} skeleton="ring" title="Oportunidades por etapa"><StageRing rows={rows}/></ChartPanel></Reloading>
          <Reloading active={retrying === 'channel'}><ChartPanel loading={cardLoading('channel')} fallback={fallback('channel')} title="Origen de oportunidades abiertas"><ChannelOrigin rows={rows} all={d.rows}/></ChartPanel></Reloading>
        </div>
        {/* Cierres en una sola tarjeta: por mes (equipo frente a la meta) arriba y, debajo, el desglose por ejecutivo */}
        <Reloading active={retrying === 'month' || retrying === 'owner'}><ChartPanel loading={cardLoading('month') || cardLoading('owner')} fallback={fallback('month') || fallback('owner')} title="Cierres por mes · Equipo completo">
          <MonthlyCloses d={d}/>
          <h3 className="chart-subtitle">Cierres por ejecutivo · {{oct: 'Octubre', sep: 'Septiembre'}[period]}</h3>
          <OwnerRanking owners={d.owners}/>
        </ChartPanel></Reloading>
        </Reloading>}

        <footer className="foot">Datos ficticios para el ejercicio de diseño · Sin conexión a sistemas de Bia/Olibia</footer>
      </main>
    </div>

    {/* Durante el barrido el skeleton sigue encima y sale al mismo paso que entra el contenido */}
    {entering && <div className="shell entry-ghost" aria-hidden="true"><Sidebar loading/><main><DashboardSkeleton/></main></div>}

    {settings && <Modal size="large" title="Configuración" onClose={() => setSettings(false)}>
      <SettingsPanel prefs={prefs} onChange={change => setPrefs(current => ({...current, ...change}))}/>
    </Modal>}

    {/* Negociaciones: tocar un responsable abre su detalle en el mismo modal, con «Volver» a la lista (no se pierde el camino) */}
    {negotiations && <Modal sheet title={negDetail ? negDetail[0] : 'Negociaciones que cierran la brecha'} view={negDetail ? negDetail[0] : 'lista'}
      onBack={negDetail ? () => { setBackTo(negDetail[0]); setNegDetail(null); } : undefined}
      onClose={() => { setNegotiations(false); setNegDetail(null); setBackTo(null); }}
      footer={negDetail && <OpportunityDetailFooter open={open} done={isDone(negDetail)} onMark={() => markFollowUp(negDetail)} onUndo={() => undoFollowUp(negDetail)} status={detailStatus(negDetail)}/>}>
      {negDetail ? <OpportunityDetail row={negDetail} open={open} done={isDone(negDetail)}/>
        : <NegotiationsSummary deals={deals} isDone={isDone} onMark={markFollowUp} onUndo={undoFollowUp} focusRow={backTo} onSelect={row => { setBackTo(null); setNegDetail(row); }}/>}
    </Modal>}

    {selected && <Modal sheet title={selected[0]} onClose={() => setSelected(null)}
      footer={<OpportunityDetailFooter open={open} done={isDone(selected)} onMark={() => markFollowUp(selected)} onUndo={() => undoFollowUp(selected)}
        status={detailStatus(selected)}/>}>
      <OpportunityDetail row={selected} open={open} done={isDone(selected)}/>
    </Modal>}
  </>;
}

// Oportunidades por etapa: dona horizontal con el valor abierto de cada etapa, en el orden del embudo
// (Contacto → Negociación) y con el color de su etapa; total al centro y resumen abajo.
function StageRing({rows}) {
  const total = sumValue(rows);
  const items = [...FUNNEL].reverse().map(stage => {
    const inStage = rows.filter(r => r[1] === stage);
    const value = sumValue(inStage);
    return {label: stage, value, display: `$${value} M`, meta: `${inStage.length} oport.`, marker: {dot: stageDot(stage)}, color: stageDot(stage)};
  });
  const count = `${rows.length} ${rows.length === 1 ? 'oportunidad' : 'oportunidades'}`;
  return <Ring layout="horizontal" items={items} label="Valor abierto por etapa" center={[`$${total} M`, count]} footer={[`Valor abierto en ${count}`, `$${total} M`]}/>;
}

// Cierres por ejecutivo: ranking sin pista (no hay meta individual); el resumen da el avance del equipo hacia la meta.
function OwnerRanking({owners}) {
  const closes = owners.reduce((sum, n) => sum + n, 0);
  const items = OWNERS.map((name, i) => ({label: name, value: owners[i], display: owners[i], pill: closes ? `${Math.round(owners[i] / closes * 100)} %` : undefined, meta: 'del equipo',
    marker: {person: name, photo: PHOTOS[name]}}));
  return <BarList items={items} label="Cierres por ejecutivo" footer={['Cierres del equipo frente a la meta', `${closes} de ${GOAL}`]}/>;
}

// Guías del design system: #componentes muestra todos; #boton, #dropdown, #tooltip, #kpi y #search, uno a uno.
const GUIDES = {'#componentes': AllComponentsShowcase, '#boton': ButtonShowcase, '#dropdown': DropdownShowcase, '#tooltip': TooltipShowcase, '#kpi': PeriodCardShowcase, '#search': SearchShowcase, '#resumen': PeriodCardShowcase, '#expandable': ExpandableShowcase, '#ia': AiTextShowcase, '#skeleton': SkeletonShowcase, '#toast': ToastShowcase, '#columnas': ColumnShowcase, '#tema': ThemeSwitchShowcase, '#tabla': TableShowcase, '#modal': ModalShowcase, '#error': FallbackShowcase, '#fallback': FallbackShowcase, '#vacio': EmptyStateShowcase, '#patrones': PatternsShowcase};

function Root() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const Guide = GUIDES[hash];
  return Guide ? <Guide/> : <ToastProvider><App/></ToastProvider>;
}

createRoot(document.getElementById('root')).render(<Root/>);
