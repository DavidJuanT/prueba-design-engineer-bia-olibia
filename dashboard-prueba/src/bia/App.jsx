import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {TARIFF, DATA_PERIOD, PERIODS} from './data';
import {MONTHS, SITE_USAGE, SITE_NAMES, SITE_STATUS, PERIOD_MONTH, usageOf, HOURS, hourlyOf, offHoursOf} from './monthly';
import {LineChart, SeriesDot} from '../ui/line-chart';
import {Ring} from '../ui/chart-forms';
import {Expandable} from '../ui/expandable';
import {AiText} from '../ui/aitext';
import {Icon} from '../ui/icons';
import {Button, IconButton} from '../ui/button';
import {DeltaPill} from '../ui/badges';
import {SideNav} from '../ui/side-nav';
import {Dropdown} from '../ui/dropdown';
import {EmptyState} from '../ui/empty-state';
import {ThemeSwitch} from '../ui/theme-switch';
import {InfoTip, Tooltip} from '../ui/tooltip';
import {Avatar} from '../ui/avatar';
import {ColumnChart, ChartFooter} from '../ui/columns';
import {DataTable} from '../ui/table';
import {StatusPill} from '../ui/status-pill';
import {SkeletonState, SkBlock, SkLine, ChartSkeleton} from '../ui/skeleton';
import {Fallback, PageFallback} from '../ui/fallback';
import {useKeyboardSupport, useDrawer, useRoving} from '../ui/keyboard';
import {SkipLink} from '../ui/skip-link';
import '../ui/fonts.css';
import '../ui/tokens.css';
import '../ui/base.css';
import '../ui/kpis.css';
import '../ui/side-nav.css';
import './bia.css';
import '../ui/buttons.css';
import '../ui/glass.css'; // capa vidrio: siempre la última hoja

// Formatos en español de Colombia: $3,36 M · $960 mil · 1.200 kWh
const number = (n, digits = 0) => n.toLocaleString('es-CO', {maximumFractionDigits: digits});
const money = n => Math.abs(n) >= 1e6 ? `$${number(n / 1e6, 2)} M` : `$${number(n / 1e3)} mil`;
const kwh = n => `${number(n)} kWh`;
const pct = (part, whole) => `${number(part / whole * 100)} %`;
const signed = (n, format) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${format(Math.abs(n))}`;
const change = (now, before) => Math.round((now - before) / before * 100);

// Tema (Sistema, Claro, Oscuro), guardado en este navegador
const PREFS_KEY = 'bia-settings';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const savedTheme = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}').theme || 'system'; } catch { return 'system'; } };
document.documentElement.dataset.theme = savedTheme() === 'system' ? (darkQuery.matches ? 'dark' : 'light') : savedTheme();

// Errores simulados para revisar los estados: ?fallo=kpis | distribucion | periodos | tabla | horario | all
const FAILING = new URLSearchParams(location.search || (frameElement ? parent.location.search : '')).get('fallo'); // en demo.html, la query de la demo
const ERRORS = {
  kpis: 'No pudimos mostrar el resumen de tu factura.',
  distribucion: 'No pudimos mostrar cómo se reparte el consumo.',
  periodos: 'No pudimos mostrar la evolución del consumo.',
  tabla: 'No pudimos mostrar el incremento por sede.',
  horario: 'No pudimos mostrar el consumo fuera de horario.',
};

// Tarjeta de KPIs de la librería (ui/kpis.css), igual con todas las sedes o con una: factura, consumo, consumo extra y tarifa del mes,
// el mes anterior como «Antes» y la variación en la pill; el tooltip dice cuánto subió o bajó frente a ese mes.
function Kpis({failed, onRetry, site, month, onSite}) {
  if (failed) return <section className="panel" aria-label="Resumen de la factura"><Fallback message={ERRORS.kpis} onRetry={onRetry}/></section>;
  const now = usageOf(site, month), before = usageOf(site, month - 1), previous = MONTHS[month - 1][1];
  const tiles = [
    {label: 'Factura total', value: <>{money(now * TARIFF)} <small>COP</small></>, note: `Antes: ${money(before * TARIFF)}`,
      pill: <DeltaPill value={change(now, before)} unit=" %" upIsBad tip={`${signed((now - before) * TARIFF, money)} frente a ${previous}`}/>},
    {label: 'Consumo total', value: kwh(now), note: `Antes: ${kwh(before)}`,
      pill: <DeltaPill value={change(now, before)} unit=" %" upIsBad tip={`${signed(now - before, kwh)} frente a ${previous}`}/>},
    // La diferencia en kWh frente al mes anterior y lo que suma (o resta) a la factura
    {label: now >= before ? 'Consumo extra' : 'Consumo menor', value: signed(now - before, kwh), note: `${signed((now - before) * TARIFF, money)} en la factura`},
    {label: 'Tarifa', value: `$${number(TARIFF)}/kWh`,
      pill: <Tooltip content={`Igual que en ${previous}`} label={`Sin cambio frente a ${previous}`}><span className="pill delta delta--flat">Sin cambio</span></Tooltip>},
  ];
  // Tarjeta destacada clara de la librería (sin data-theme): lavanda agrisada en claro, violeta en oscuro (glass.css)
  return <section className="card card--featured period-card bia-kpi-card" aria-label="Resumen de la factura">
    <div className="period-kpis">{tiles.map(t => <div key={t.label}>
      <div className="kpi-label">{t.label}{t.pill}</div>
      <div className="value">{t.value}</div>
      {t.note && <p className="kpi-note">{t.note}</p>}
    </div>)}</div>
    <Summary site={site} month={month} onSite={onSite}/>
  </section>;
}

// Resumen AI (como en Olibia: desplegable al pie de la tarjeta de KPIs, texto con <AiText>). Cuenta lo que pasó en el
// mes con las mismas cifras de la página: cuánto cambió, por qué (consumo o tarifa), qué sede pesa más y, con una sede
// fuera de horario, sus causas posibles.
// Causas posibles del consumo fuera de horario: suposiciones por confirmar, no hechos (el dato solo dice cuándo se consume).
const OFF_HOURS_CAUSES = ['Climatización programada fuera del horario de apertura', 'Refrigeración trabajando de más (puerta mal cerrada o compresor)', 'Equipos o iluminación que quedan encendidos', 'Turnos de limpieza o reposición de noche'];
function Summary({site, month, onSite}) {
  const name = MONTHS[month][1], previous = MONTHS[month - 1][1];
  const now = usageOf(site, month), before = usageOf(site, month - 1), diff = now - before;
  const total = usageOf('', month) - usageOf('', month - 1);
  const sites = Object.keys(SITE_USAGE).map(id => siteRow(id, month)).sort((a, b) => b.diff - a.diff);
  const top = sites[0];
  const offHours = sites.filter(r => r.offHours && (!site || r.id === site)).map(r => r.site);
  const verb = diff >= 0 ? 'subió' : 'bajó';
  // Todas las sedes: la respuesta y la sede que más pesa, con un botón para verla. Con una sede: su detalle y causas posibles
  const content = site ? <>
    <p>En {name}, la <strong>{SITE_NAMES[site]}</strong> consumió <strong>{kwh(now)}</strong> ({signed(diff, kwh)}, {signed(change(now, before), n => `${n} %`)} frente a {previous}); su factura pasó de {money(before * TARIFF)} a <strong>{money(now * TARIFF)}</strong>.{total > 0 && diff > 0 && <> Aporta el <strong>{pct(diff, total)}</strong> del aumento de las tres sedes.</>}</p>
    {offHours.length > 0 && <>
      <p>Registra consumo fuera de su horario habitual (22:00 – 06:00); todavía no está confirmado qué lo causa. <strong>Causas posibles:</strong></p>
      <ul>{OFF_HOURS_CAUSES.map(c => <li key={c}>{c}</li>)}</ul>
    </>}
  </> : <>
    {diff > 0 ? <p>Tu factura subió {money(diff * TARIFF)} porque consumiste más, no por la tarifa.</p>
      : <p>En {name}, tu factura {verb} a <strong>{money(now * TARIFF)}</strong> ({signed(diff, kwh)} frente a {previous}); la tarifa no cambió.</p>}
    {total > 0 && <p>{top.site} explica el {pct(top.diff, total)} del aumento ({signed(top.diff, kwh)}){offHours.includes(top.site) && ' y registra consumo fuera de su horario habitual'}.</p>}
  </>;
  const action = !site && total > 0 && <Button variant="primary" onClick={() => onSite(top.id)}>Ver {top.site}</Button>;
  return <div className="period-ai ai-widget">
    {/* Todas las sedes: abierto, es la respuesta a «¿por qué subió?» y lleva a la sede que más pesa. Con una sede filtrada:
        cerrado, primero sus cifras. key: se vuelve a abrir o cerrar al cambiar de sede */}
    <Expandable key={site || 'todas'} title="Resumen AI" icon="ai" defaultOpen={!site}>
      {/* key: si cambia el mes o la sede, el resumen nuevo se vuelve a escribir */}
      <AiText key={`${site}-${month}`} thinking="Analizando consumo y factura…" after={action}>{content}</AiText>
    </Expandable>
  </div>;
}

// Consumo del mes por sede (Anillo de la librería, como «Oportunidades por etapa» en Olibia). Junta dos datos: de dónde
// salen los kWh extra (el anillo y su %) y cuánto consumió cada sede (al lado de su nombre). Si alguna sede bajó, el
// reparto del aumento no tiene sentido y el anillo muestra el consumo del mes
function Distribution({failed, onRetry, month}) {
  const name = MONTHS[month][1];
  const total = usageOf('', month), extra = total - usageOf('', month - 1);
  const rows = Object.keys(SITE_USAGE).map(id => ({id, usage: usageOf(id, month), diff: usageOf(id, month) - usageOf(id, month - 1)}));
  const byIncrease = extra > 0 && rows.every(r => r.diff >= 0);
  const items = rows.sort((a, b) => (byIncrease ? b.diff - a.diff : b.usage - a.usage)).map(r => ({key: r.id, label: SITE_NAMES[r.id],
    marker: {dot: SITE_COLORS[r.id]}, color: SITE_COLORS[r.id],
    ...(byIncrease ? {value: r.diff, display: signed(r.diff, kwh), meta: `${kwh(r.usage)} en total`} : {value: r.usage, display: kwh(r.usage)})}));
  return <section className="panel chart-panel" aria-labelledby="distribution-title">
    <div className="heading-info"><h2 id="distribution-title">Consumo del mes por sede</h2></div>
    {failed ? <Fallback message={ERRORS.distribucion} onRetry={onRetry}/>
      : byIncrease
        ? <Ring items={items} label={`De dónde salen los ${kwh(extra)} extra de ${name}`} center={[`+${number(extra)}`, 'kWh extra']} layout="horizontal"
            footer={['Consumo total', kwh(total)]}/>
        : <Ring items={items} label={`Consumo por sede en ${name}`} center={[number(total), `kWh en ${name}`]} layout="horizontal"
            footer={['Consumo total', kwh(total)]}/>}
  </section>;
}

// Variación de consumo (opción C, compacta): una barra por sede con el consumo del mes anterior en
// gris y, pegado, el aumento en morado (si bajó, la parte que ya no se consumió, punteada); al final, el consumo del mes
// la variación en kWh con su % en una pill neutra (el consumo de cada mes, en el tooltip de la barra). Leyenda en la fila del título y filas de 24 px a 12 px entre sí.
function Variation({failed, onRetry, site, month}) {
  const ids = Object.keys(SITE_USAGE).filter(id => !site || id === site);
  const name = MONTHS[month][1], prev = MONTHS[month - 1][1];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const rows = ids.map(id => ({id, before: usageOf(id, month - 1), now: usageOf(id, month)})).map(r => ({...r, diff: r.now - r.before}));
  const top = Math.max(...rows.flatMap(r => [r.before, r.now]));
  const total = rows.reduce((sum, r) => sum + r.diff, 0);
  const rove = useRoving(rows.length); // Las barras son una sola parada de Tab; las flechas pasan de sede en sede
  const legend = !failed && <ul className="linechart-legend" aria-hidden="true"><li><SeriesDot color="--color-chart-history"/>Consumo de {prev}</li><li><SeriesDot color={total >= 0 ? '--color-spark' : '--color-action'}/>{total >= 0 ? 'Aumento' : 'Baja'} en {name}</li></ul>;
  return <section className="panel chart-panel" aria-labelledby="variation-title">
    <div className="bia-panel-head bia-var-head">
      <div className="heading-info"><h2 id="variation-title">Variación de consumo vs mes anterior</h2></div>
      {legend}
    </div>
    {failed ? <Fallback message={ERRORS.distribucion} onRetry={onRetry}/> : <div className="bia-var">
      <ul className="bia-var-rows" aria-label={`Consumo por sede en ${name} frente a ${prev}`}>{rows.map((r, i) => <li key={r.id} style={{'--i': i}}
        aria-label={`${SITE_NAMES[r.id]}: ${signed(r.diff, kwh)} (${signed(change(r.now, r.before), n => `${n} %`)}) frente a ${prev}`}>
        <span className="bia-var-name">{SITE_NAMES[r.id]}</span>
        <span className="bia-var-lane">
          <span className="bia-gain-wrap" style={{'--f': Math.max(r.before, r.now) / top}}>
            <Tooltip rove={rove(i)} content={`${cap(name)}: ${kwh(r.now)} · ${cap(prev)}: ${kwh(r.before)}`}
              label={`${SITE_NAMES[r.id]}: ${kwh(r.now)} en ${name}, ${kwh(r.before)} en ${prev}`}>
              <span className="bia-gain"><i style={{flexGrow: Math.min(r.before, r.now)}}/><i className={r.diff >= 0 ? 'is-now' : 'is-drop'} style={{flexGrow: Math.abs(r.diff)}}/></span>
            </Tooltip>
          </span>
          <b>{signed(r.diff, kwh)}</b>
          <span className="pill delta delta--flat">{signed(change(r.now, r.before), n => `${n} %`)}</span>
        </span>
      </li>)}</ul>
      <ChartFooter footer={[`${total >= 0 ? 'Aumento' : 'Baja'} total frente a ${prev}`, signed(total, kwh)]}/>
    </div>}
  </section>;
}

// Evolución del consumo (todas las sedes o la elegida), seis meses; el mes del filtro va resaltado
function Evolution({failed, onRetry, site, month}) {
  const values = MONTHS.map((_, i) => usageOf(site, i));
  const max = Math.ceil(Math.max(...values) / 2000) * 2; // Escala en miles de kWh, a un número par: el eje marca la mitad
  return <section className="panel chart-panel" aria-labelledby="evolution-title">
    <div className="heading-info"><h2 id="evolution-title">Evolución del consumo {site ? `de ${SITE_NAMES[site]}` : 'total'} (kWh)</h2></div>
    {failed ? <Fallback message={ERRORS.periodos} onRetry={onRetry}/>
      : <ColumnChart label="Consumo por mes, en miles de kWh" max={max} trend highlight={[month]} track={false} yTitle="Miles de kWh"
          footer={['Consumo promedio de los 6 meses', kwh(Math.round(values.reduce((sum, n) => sum + n, 0) / values.length))]}
          items={MONTHS.map(([short, name], i) => [short, values[i] / 1000, `${name[0].toUpperCase()}${name.slice(1)}: ${kwh(values[i])}${i ? ` (${signed(change(values[i], values[i - 1]), n => `${n} %`)})` : ''}`])}/>}
  </section>;
}

// Sedes (maqueta de la tabla): consumo del mes, variación en kWh frente al anterior,
// comportamiento (pill con punto), factura y estado de pago, con una fila de total al final. Pills y botones de la librería.
const siteRow = (id, month) => ({id, site: SITE_NAMES[id], usage: usageOf(id, month), diff: usageOf(id, month) - usageOf(id, month - 1), ...SITE_STATUS[id]});
const siteColumns = month => [
  {label: 'Sede', sk: '60%', cell: r => r.total ? 'Total' : <span className="bia-var-name">{r.site}</span>} /* Nombre de sede con el mismo peso que en las gráficas (medium); el total, semibold por su fila */,
  {label: 'Consumo (kWh)', sk: '40%', cell: r => kwh(r.usage)},
  {label: 'Variación', sk: '50%', cell: r => {
    const tip = `${signed(change(r.usage, r.usage - r.diff), n => `${n} %`)} frente a ${MONTHS[month - 1][1]}`;
    // El total va en texto, con el mismo peso que el resto de la fila; las sedes conservan la pill.
    return r.total
      ? <Tooltip content={tip} label={`${signed(r.diff, kwh)} ${tip}`}><span className="bia-total-delta">{signed(r.diff, kwh)}</span></Tooltip>
      : <DeltaPill value={r.diff} unit=" kWh" upIsBad tip={tip}/>;
  }},
  {label: 'Comportamiento', sk: '40%',
    cell: r => !r.total && <span className={`pill stage ${r.offHours ? 'stage-contacto' : 'stage-negociacion'}`}>{r.offHours ? 'Fuera de horario' : 'Normal'}</span>},
  {label: 'Factura (COP)', sk: '40%', cell: r => money(r.usage * TARIFF)},
  {label: 'Estado de pago', sk: '40%', cell: r => !r.total && <StatusPill done={r.paid} labels={{done: 'Pagada', pending: 'Pendiente'}}/>},
  {label: 'Documento', sk: '30%', cell: r => !r.total && (r.paid /* Pagada: ver la factura; pendiente: CTA principal para pagarla */
    ? <Button variant="transparent" size="small" className="bia-doc-btn" aria-label={`Ver factura de ${r.site}`}>Ver factura</Button>
    : <Button size="small" className="bia-doc-btn" aria-label={`Pagar factura de ${r.site}`}>Pagar</Button>)},
];
const SITE_OPTIONS = [['', 'Todas las sedes (3)'], ...Object.entries(SITE_NAMES)];
function Sites({failed, onRetry, site, month}) {
  const total = usageOf('', month) - usageOf('', month - 1);
  const rows = useMemo(() => {
    const list = Object.keys(SITE_USAGE).map(id => siteRow(id, month)).filter(r => !site || r.id === site);
    list.sort((a, b) => b.diff - a.diff); // Mayor aumento primero
    // Total de las tres sedes al final; solo cuando se ven las tres (con una sede no sumaría lo que se ve)
    return site ? list : [...list, {id: 'total', total: true, usage: usageOf('', month), diff: total}];
  }, [site, month, total]);
  return <section className="panel table-panel" id="sedes">
    {failed ? <><h2>Detalle por sede</h2><Fallback message={ERRORS.tabla} onRetry={onRetry}/></>
      : <DataTable title="Detalle por sede" columns={siteColumns(month)} rows={rows} rowKey={r => r.id} rowClass={r => r.total && 'bia-total-row'}
/>}
  </section>;
}

// Consumo fuera de horario por sede: curva promedio de un día del mes (gráfica de líneas de la librería) con la franja
// 22:00 – 06:00 sombreada y, debajo, los kWh fuera de horario de cada sede frente al mes anterior. El color sigue a la
// sede aunque el filtro deje una sola.
// Sedes en la gama del morado (la principal, la más marcada) y con textura distinta, para no depender solo del tono
const SITE_COLORS = {principal: '--color-ordinal-1', sede2: '--color-ordinal-2', sede3: '--color-ordinal-3'}; // Escala ordinal del sistema
const SITE_DASH = {principal: undefined, sede2: '6 4', sede3: '1 4'}; // Trazo de la línea
function OffHours({failed, onRetry, site, month}) {
  const ids = Object.keys(SITE_USAGE).filter(id => !site || id === site);
  const series = ids.map(id => ({key: id, label: SITE_NAMES[id], color: SITE_COLORS[id], dash: SITE_DASH[id], values: hourlyOf(id, month)}));
  const max = Math.ceil(Math.max(...series.flatMap(s => s.values)) / 4) * 4; // Tope múltiplo de 4: la mitad es entera
  const previous = MONTHS[month - 1][1];
  return <section className="panel bia-offhours" aria-labelledby="offhours-title">
    <div className="heading-info"><h2 id="offhours-title">Consumo promedio por hora (kWh)</h2>
      <InfoTip label="Información sobre el consumo fuera de horario">Fuera de horario es de 22:00 a 06:00. La curva es el consumo promedio por hora de un día de {MONTHS[month][1]}.</InfoTip></div>
    {failed ? <Fallback message={ERRORS.horario} onRetry={onRetry}/> : <>
      <LineChart label={`Consumo promedio por hora en ${MONTHS[month][1]}, por sede`} labels={HOURS} series={series} max={max}
        format={n => `${number(n, 1)} kWh`} tick={n => number(n)} point={h => `${h}:00`} bands={[{from: 0, to: 6, label: 'Fuera de horario\n(22:00 – 06:00)'}, {from: 22, to: 23}]} legend={false} xTitle="Hora del día" yTitle="kWh"/>
      <div className={['period-kpis bia-offhours-kpis', ids.length === 1 && 'is-single'].filter(Boolean).join(' ')}>{ids.map(id => {
        const now = offHoursOf(id, month), before = offHoursOf(id, month - 1);
        return <div key={id}>
          <div className="kpi-label"><span className="bia-offhours-site"><SeriesDot color={SITE_COLORS[id]}/>{SITE_NAMES[id]}</span>
            <DeltaPill value={change(now, before)} unit=" %" upIsBad tip={`${signed(now - before, kwh)} frente a ${previous}`}/></div>
          <div className="value"><span className="colchart-figure">{number(now)}</span> kWh</div>
          <p className="kpi-note">fuera de horario</p>
        </div>; })}</div>
    </>}
  </section>;
}

// Menú lateral (SideNav de la librería). Solo Resumen está construido; el resto se muestra deshabilitado, sin nota.
const MENU = [
  {label: 'Inicio', icon: 'home'},
  {label: 'Resumen', icon: 'summary', active: true},
  {label: 'Consumo', icon: 'bars'},
  {label: 'Sedes', icon: 'store'},
  {label: 'Facturación', icon: 'receipt'},
  {label: 'Reportes', icon: 'usage'},
];

function PageSkeleton() {
  return <SkeletonState label="Cargando el resumen…">
    <SkBlock className="bia-sk-panel"><SkLine width="30%"/><SkLine width="45%" size="value"/><SkLine width="20%"/></SkBlock>
    <div className="bia-split">{[0, 1].map(i => <SkBlock key={i} className="bia-sk-panel"><SkLine width="45%" size="title"/><ChartSkeleton/></SkBlock>)}</div>
  </SkeletonState>;
}

// Filtros fijos: «is-stuck» cuando la barra ya está pegada arriba (misma comprobación que los filtros de Olibia)
function useStuck() {
  const ref = useRef(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => { frame = 0; const el = ref.current; if (!el) return; const c = getComputedStyle(el); setStuck(c.position === 'sticky' && window.scrollY > 0 && el.getBoundingClientRect().top <= parseFloat(c.top) + 1); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    check();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);
  return [ref, stuck];
}

function App() {
  const [filtersRef, stuck] = useStuck();
  const [theme, setTheme] = useState(savedTheme);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(true);
  const [menu, setMenu] = useState(false);
  const [period, setPeriod] = useState(DATA_PERIOD);
  const [site, setSite] = useState('');
  // Cambiar un filtro es una consulta nueva: skeleton corto, como al cambiar de periodo en Olibia
  const refilter = apply => { apply(); setLoading(true); setTimeout(() => setLoading(false), 600); };
  const periodLabel = PERIODS.find(([id]) => id === period)[1];
  const [failed, setFailed] = useState(() => FAILING === 'all' ? {page: true} : {[FAILING]: FAILING in ERRORS});
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);
  // Teclado, como en Olibia: rescate de foco, foco sin tapar por la cabecera o los filtros fijos, menú móvil modal
  useKeyboardSupport();
  useDrawer(menu, () => setMenu(false));
  const onTheme = next => { setTheme(next); try { localStorage.setItem(PREFS_KEY, JSON.stringify({theme: next})); } catch {} };
  const retry = key => { setLoading(true); setTimeout(() => { setFailed(f => ({...f, [key]: false})); setLoading(false); }, 800); };
  const month = PERIOD_MONTH[period];

  return <>
    {/* Cabecera solo en móvil: botón «Menú» y logo. En escritorio el logo va arriba del menú lateral */}
    <SkipLink/>
    <header className="bia-top" data-obscures>
      <div className="bia-brand"><Button variant="transparent" className="menu-toggle" aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}><Icon name="menu"/>Menú</Button><span className="bia-logo"><Icon name="bolt" size={24}/>Bia</span></div>
    </header>
    <div className="bia-shell">
    <aside id="sidebar" className={menu ? 'open' : undefined}>
      <span className="bia-logo bia-aside-logo"><Icon name="bolt" size={28}/>Bia</span>
      <SideNav items={MENU}/>
      <div className="bia-aside-foot"><ThemeSwitch value={theme} onChange={onTheme}/><Avatar name="Administradora Demo"/></div>
    </aside>
    {menu && <div className="drawer-backdrop" onClick={() => setMenu(false)}/>}
    <main className="bia">
      {failed.page ? <PageFallback onRetry={() => retry('page')}/> : <>
        <div className="bia-toolbar"><h1>Resumen</h1></div>
        {/* Filtros fijos, como en Olibia: sin contenedor en reposo; al hacer scroll se quedan arriba con fondo y sombra */}
        <div ref={filtersRef} className={['bia-filters', stuck && 'is-stuck'].filter(Boolean).join(' ')} data-obscures>
            <label className="bia-field"><span>Periodo</span><Dropdown id="bia-period" icon="calendar" value={period} options={PERIODS} onChange={value => refilter(() => setPeriod(value))}/></label>
            <label className="bia-field"><span>Sede</span><Dropdown id="bia-site" icon="building" value={site} options={SITE_OPTIONS} onChange={value => refilter(() => setSite(value))}/></label>
            {/* Fijo, como en Olibia: siempre visible; vuelve a octubre y todas las sedes, desactivado si ya está así. Al usarlo queda desactivado: el foco pasa al periodo */}
            <Button variant="transparent" className="bia-clear" disabled={!site && period === DATA_PERIOD} onClick={() => { document.getElementById('bia-period').focus(); refilter(() => { setSite(''); setPeriod(DATA_PERIOD); }); }}>Limpiar</Button>
        </div>
        {banner && period === DATA_PERIOD && <section className="banner" aria-label="Aviso de consumo">
          <div className="banner-body"><div className="banner-head"><Icon name="warningFill"/><strong>Tu consumo aumentó un {change(usageOf('', month), usageOf('', month - 1))} % respecto al periodo anterior.</strong></div></div>
          <IconButton icon="close" label="Cerrar aviso" onClick={() => setBanner(false)}/>
        </section>}
        {loading ? <PageSkeleton/> : month === undefined ? <section className="panel">
          <EmptyState title={`Sin datos de los ${periodLabel.toLowerCase()}`} message="Por ahora hay datos de un mes frente al anterior: octubre, septiembre o agosto." action="Ver octubre" onAction={() => refilter(() => setPeriod(DATA_PERIOD))}/>
        </section> : <>
          {/* Orden: KPI → evolución y distribución → variación → consumo por hora → sedes */}
          {/* «Ver Sede …» cambia la vista: el foco pasa al filtro de sede, que anuncia la sede elegida */}
          <Kpis failed={failed.kpis} onRetry={() => retry('kpis')} site={site} month={month} onSite={id => { document.getElementById('bia-site').focus(); refilter(() => setSite(id)); }}/>
          <div className="bia-split bia-split--3">
            <Evolution failed={failed.periodos} onRetry={() => retry('periodos')} site={site} month={month}/>
            <Distribution failed={failed.distribucion} onRetry={() => retry('distribucion')} month={month}/>
            <Variation failed={failed.distribucion} onRetry={() => retry('distribucion')} site={site} month={month}/>
          </div>
          <OffHours failed={failed.horario} onRetry={() => retry('horario')} site={site} month={month}/>
          <Sites failed={failed.tabla} onRetry={() => retry('tabla')} site={site} month={month}/>
        </>}
      </>}
    </main>
    </div>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
