import React, {useEffect, useRef, useState} from 'react';
import {DeltaPill, FilteredBadge, KpiIcon} from '../ui/badges';
import {SkWire, SkLine} from '../ui/skeleton';
import {reducedMotion} from '../ui/media';

// Tarjeta del periodo: los 4 KPIs y el Resumen AI en una sola tarjeta con divisores. Es la tarjeta destacada de la
// pantalla (.card--featured sin data-theme, variante clara): lavanda agrisada en el tema claro y violeta en el oscuro (glass.css).
//
// Animación de las cifras (900 ms, salida suave, misma curva para todas):
// - Al cargar y al cambiar de periodo (resetKey), las 4 cifras cuentan desde 0 y la barra de la meta
//   se llena a la vez que su número.
// - Al cambiar un filtro solo cambian Oportunidades abiertas y Valor del pipeline: cuentan desde su
//   valor anterior hasta el nuevo. La meta y los cierres no se mueven porque no dependen de los filtros.
// - Con movimiento reducido (sistema o Configuración) se muestran los valores finales al instante.
const COUNT_MS = 900;
const easeOut = t => 1 - Math.pow(1 - t, 3);

// Valor que se anima hacia `value`: desde 0 si cambia resetKey; desde el valor mostrado si solo cambia el valor.
function useAnimatedNumber(value, resetKey) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  const current = useRef(shown);
  const lastKey = useRef(undefined);
  useEffect(() => {
    const from = lastKey.current !== resetKey ? 0 : current.current;
    lastKey.current = resetKey;
    const set = v => { current.current = v; setShown(v); };
    if (reducedMotion() || from === value) { set(value); return; }
    let frame;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / COUNT_MS, 1);
      set(from + (value - from) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, resetKey]);
  return shown;
}

// Cifra animada. El lector de pantalla lee solo el valor final (texto oculto a la vista);
// los números intermedios van con aria-hidden.
function Figure({value, shown, format = n => n}) {
  return <><span className="sr-only">{format(value)}</span><span aria-hidden="true">{format(Math.round(shown))}</span></>;
}

// Barra de la meta: misma pista y relleno que las gráficas; su ancho sigue al número animado.
function GoalBar({shown, closed, goal}) {
  return <div className="track goal-bar" role="img" aria-label={`${closed} de ${goal} cierres; faltan ${Math.max(goal - closed, 0)}`}>
    <div className="fill" style={{width: `${Math.min(shown / goal, 1) * 100}%`}}/>
  </div>;
}

// loading: recarga de datos (p. ej. al cambiar de periodo). Títulos y marcadores estáticos se mantienen;
// las cifras, la barra de la meta y la variación son skeleton. Al terminar, las cifras cuentan desde 0.
// extra: KPI adicional en segunda posición, junto a la meta (p. ej. el seguimiento de negociaciones).
export function PeriodCard({closed, goal, delta, openCount, pipeline, resetKey, loading, extra, children}) {
  const closedShown = useAnimatedNumber(closed, resetKey);
  const openShown = useAnimatedNumber(openCount, resetKey);
  const pipelineShown = useAnimatedNumber(pipeline, resetKey);
  const value = node => loading ? <div className="value"><SkLine size="value" width="55%"/></div> : <div className="value">{node}</div>;
  return <section className={['card', 'card--featured', 'period-card', loading && 'sk-block'].filter(Boolean).join(' ')} aria-label="Resumen del periodo">
    {loading && <SkWire/>}
    <div className={['period-kpis', extra && 'has-extra'].filter(Boolean).join(' ')}>
      <div><div className="kpi-label">Meta comercial<KpiIcon icon="flag" tip={`Meta del equipo: ${goal} cierres en el periodo`}/></div>
        {value(<><Figure value={closed} shown={closedShown}/> de {goal}</>)}
        {loading ? <SkLine width="70%"/> : <GoalBar shown={closedShown} closed={closed} goal={goal}/>}</div>
      {extra && !loading && <div className="kpi-extra">{extra}</div>}
      <div><div className="kpi-label">Cierres del mes{!loading && <DeltaPill value={delta} tip="Frente al mes pasado"/>}</div>
        {value(<Figure value={closed} shown={closedShown}/>)}</div>
      <div><div className="kpi-label">Oportunidades abiertas<FilteredBadge/></div>
        {value(<Figure value={openCount} shown={openShown}/>)}</div>
      <div><div className="kpi-label">Valor del pipeline<FilteredBadge/></div>
        {value(<Figure value={pipeline} shown={pipelineShown} format={n => `$${n} M`}/>)}</div>
    </div>
    {children}
  </section>;
}
