import React from 'react';
import {Button} from '../ui/button';
import {NoData} from '../ui/badges';
import {STAGE_CLASS, contactLabel} from './model';
import {StatusPill} from '../ui/status-pill';
import './detail.css';

// Detalle de una oportunidad, para el modal mediano. Jerarquía como la tarjeta del periodo:
// 1. Cifras clave (valor mensual y próximo contacto) con la etiqueta arriba y la cifra en Saira, separadas por un divisor.
//    Cuánto falta para el contacto va en una pill junto a la etiqueta, como la variación de los KPIs.
// 2. Atributos en filas: etiqueta gris a la izquierda y valor a la derecha (etapa, responsable, seguimiento).
// row: [empresa, etapa, valor (M COP), responsable, fecha] · open: periodo en curso · done: seguimiento registrado
export function OpportunityDetail({row, open, done}) {
  const [, stage, value, owner, date] = row;
  // «mié 28 oct · en 2 días» → pill «En 2 días» (roja si está vencido); en un periodo cerrado no hay pill
  const when = open ? contactLabel(date, true).split(' · ')[1] : null;
  return <div className="detail">
    <div className="detail-figures">
      <div><div className="kpi-label">Valor mensual · COP</div><div className="value">${value} M</div></div>
      <div><div className="kpi-label">Próximo contacto
        {when && <span className={`pill delta ${when === 'vencido' ? 'delta--down' : 'delta--flat'}`}>{when[0].toUpperCase() + when.slice(1)}</span>}</div>
        <div className="value">{date}</div></div>
    </div>
    <dl className="detail-list">
      <div><dt>Etapa</dt><dd><span className={`pill stage ${STAGE_CLASS[stage]}`}>{stage}</span></dd></div>
      <div><dt>Responsable</dt><dd>{owner}</dd></div>
      <div><dt>Seguimiento</dt><dd>{open ? <StatusPill done={done}/> : <NoData/>}</dd></div>
    </dl>
  </div>;
}

// Pie del detalle: estado a la izquierda y la acción (botón medium del ancho de su texto) a la derecha.
// Registrado, el mismo botón pasa a «Deshacer» (secondary): es el mismo elemento, así que el foco no se pierde, y el
// estado (role="status") anuncia el cambio. Antes quedaba deshabilitado y el foco se iba al documento.
export function OpportunityDetailFooter({open, done, onMark, onUndo, status}) {
  return <>
    <p className="dialog-status" role="status">{status}</p>
    {open && <Button variant={done ? 'secondary' : 'primary'} onClick={done ? onUndo : onMark}>{done ? 'Deshacer' : 'Marcar seguimiento realizado'}</Button>}
  </>;
}
