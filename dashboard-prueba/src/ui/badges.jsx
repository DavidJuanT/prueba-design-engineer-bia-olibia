import React from 'react';
import {Icon} from './icons';
import {Tooltip} from './tooltip';

// Variación frente al periodo anterior, como en apps de bróker: pill verde con flecha si sube,
// roja si baja y neutra si no cambia. El texto incluye el signo para no depender del color.
// tip: texto del tooltip (p. ej. «Frente al mes pasado»); también forma parte del nombre accesible.
// unit: sufijo del número (p. ej. « %» o « kWh»); el número lleva separador de miles (1.200). upIsBad: cuando subir es malo (un costo, un consumo), la subida va en rojo
// y la bajada en verde; la flecha sigue la dirección del número.
export function DeltaPill({value, tip, unit = '', upIsBad = false}) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const tone = dir === 'flat' || !upIsBad ? dir : dir === 'up' ? 'down' : 'up';
  const number = `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('es-CO')}`;
  const text = `${number}${unit}`;
  const pill = <span className={`pill delta delta--${tone}`}>
    {dir !== 'flat' && <Icon name={dir === 'up' ? 'trendUp' : 'trendDown'} size={14}/>}{number}{unit && <span className="pill-unit">{unit}</span>}
  </span>;
  // Nombre para el lector: la cifra y el tooltip; solo la primera letra en minúscula, así las unidades se leen bien (kWh, $1,2 M)
  return tip ? <Tooltip content={tip} label={`${text} ${tip[0].toLowerCase()}${tip.slice(1)}`}>{pill}</Tooltip> : pill;
}

// Marca de KPI filtrado: pill con icono de filtro y tooltip, en la misma posición que la variación.
export function FilteredBadge({tip = 'Cambia según los filtros'}) {
  return <Tooltip content={tip} label={tip}><span className="pill filtered-badge"><Icon name="filter" size={14}/></span></Tooltip>;
}

// Dato que no existe (p. ej. el seguimiento de un periodo cerrado): raya en gris con nombre accesible.
export function NoData() {
  return <span className="no-data" aria-label="Sin dato">—</span>;
}

// Icono de un KPI (qué mide): círculo de 20 px a la derecha del título, en la misma posición que la variación y el
// filtro, con tooltip. El icono lo elige el producto.
export function KpiIcon({icon, tip}) {
  return <Tooltip content={tip} label={tip}><span className="kpi-icon"><Icon name={icon} size={14}/></span></Tooltip>;
}
