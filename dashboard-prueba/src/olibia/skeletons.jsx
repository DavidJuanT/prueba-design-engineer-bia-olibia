import React from 'react';
import {SkeletonState, SkBlock, SkStep, SkLine, ChartSkeleton} from '../ui/skeleton';

// Skeletons con la forma del dashboard de Olibia, armados con las piezas genéricas de ui/skeleton.

// Menú lateral en la primera carga: cinco opciones y Configuración como líneas.
export function SidebarSkeleton() {
  return <div className="sk-root sk-menu-root">
    <div className="sk-menu" aria-hidden="true">{['70%', '62%', '78%', '48%', '56%'].map((w, i) => <SkLine key={i} width={w}/>)}</div>
    <div className="sk-menu-settings" aria-hidden="true"><SkLine width="60%"/></div>
  </div>;
}

// Skeleton del dashboard. `full`: carga inicial (cabecera de la página, aviso, periodo y filtros también);
// sin `full`: cambio de periodo (solo lo que depende del periodo).
export function DashboardSkeleton({full = true}) {
  return <SkeletonState>
    {full && <>
      <div className="sk-toolbar">
        <SkStep><SkLine width="260px" size="title"/><SkLine width="220px"/></SkStep>
        <SkStep className="sk-toolbar-date"><SkLine width="140px"/><SkLine width="180px"/></SkStep>
      </div>
      <SkBlock className="sk-banner"><SkStep><SkLine width="28%"/><SkLine width="60%"/><SkLine width="14%"/></SkStep></SkBlock>
      <div className="sk-periodbar">
        <SkStep><SkLine width="64px"/><div className="sk-field" style={{width: 180}}/></SkStep>
        <SkLine width="112px" size="button"/>
      </div>
      <div className="sk-filters">
        {[0, 1, 2, 3].map(i => <SkStep key={i}><SkLine width="40%"/><div className="sk-field"/></SkStep>)}
      </div>
    </>}
    <SkBlock className="sk-period">
      <div className="sk-period-kpis">
        {[0, 1, 2, 3].map(i => <SkStep key={i}><SkLine width="60%"/><SkLine width="45%" size="value"/><SkLine width="80%"/></SkStep>)}
      </div>
      <SkStep className="sk-period-ai"><SkLine width="22%"/><SkLine width="96%"/><SkLine width="70%"/></SkStep>
    </SkBlock>
    <SkBlock className="sk-table">
      {Array.from({length: 5}, (_, r) => <div className="sk-row" key={r}>
        {['80%', '70%', '50%', '65%', '75%', '60%', '40%'].map((w, c) => <SkStep key={c}><SkLine width={w}/></SkStep>)}
      </div>)}
    </SkBlock>
    {/* Como la página: anillo y origen (3 : 2); debajo, cierres por mes y por ejecutivo en una sola tarjeta */}
    <div className="sk-split split--ring">
      {['ring', 'bars'].map(shape => <SkBlock key={shape} className="sk-chart">
        <SkLine width="45%" size="title"/>
        <ChartSkeleton shape={shape}/>
      </SkBlock>)}
    </div>
    <div className="sk-split sk-split--one">
      <SkBlock className="sk-chart"><SkLine width="30%" size="title"/><ChartSkeleton shape="bars"/></SkBlock>
    </div>
  </SkeletonState>;
}
