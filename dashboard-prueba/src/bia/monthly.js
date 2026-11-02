import {USAGE, MAIN_SITE, OTHER_SITES} from './data';

// Consumo por sede y por mes (kWh), de mayo a octubre de 2026. Cuadra con el pedido: septiembre suma 6.000 y octubre
// 7.500; la sede principal sube 1.200 y las sedes 2 y 3, 300 entre las dos. El reparto por sede y los meses de mayo a
// agosto son datos de ejemplo (decisión del usuario), para que sedes y meses cuenten la misma historia.
export const MONTHS = [['May', 'mayo'], ['Jun', 'junio'], ['Jul', 'julio'], ['Ago', 'agosto'], ['Sep', 'septiembre'], ['Oct', 'octubre']];
export const SITE_USAGE = {
  principal: [2900, 3050, 2950, 3100, 3000, 4200],
  sede2: [1650, 1720, 1680, 1750, 1700, 1900],
  sede3: [1250, 1330, 1270, 1350, 1300, 1400],
};
export const SITE_NAMES = {principal: 'Sede Centro', sede2: 'Sede Norte', sede3: 'Sede Sur'};
// Comportamiento y estado de pago de cada sede: datos de ejemplo (la maqueta de la tabla). La factura solo se puede
// ver si está pagada.
export const SITE_STATUS = {
  principal: {offHours: true, paid: true},
  sede2: {offHours: false, paid: false},
  sede3: {offHours: false, paid: true},
};

// Mes de cada opción del filtro de periodo (índice en MONTHS). Los rangos (3 y 6 meses) no tienen un mes anterior
// con el que comparar: siguen sin datos.
export const PERIOD_MONTH = {oct: 5, sep: 4, ago: 3};

// Consumo de un mes: de una sede o, sin sede, la suma de las tres
export const usageOf = (site, month) => site ? SITE_USAGE[site][month] : Object.values(SITE_USAGE).reduce((sum, list) => sum + list[month], 0);

// Comprobación con el pedido (falla en consola si alguien cambia los datos y dejan de cuadrar)
console.assert(usageOf('', 4) === USAGE.previous && usageOf('', 5) === USAGE.current
  && SITE_USAGE.principal[5] - SITE_USAGE.principal[4] === MAIN_SITE
  && SITE_USAGE.sede2[5] - SITE_USAGE.sede2[4] + SITE_USAGE.sede3[5] - SITE_USAGE.sede3[4] === OTHER_SITES, 'Bia: los datos por sede no cuadran con el pedido');

// Consumo promedio por hora (kWh) de un día del mes, por sede. Datos de ejemplo: una curva de cafetería (abre a las
// 6, pico al mediodía, cierra a las 20) repartida para que sume el consumo del mes. En octubre la Sede Centro sube de
// noche: es el consumo fuera de horario de la tabla. Fuera de horario = 22:00 – 06:00.
const DAYS = [31, 30, 31, 31, 30, 31];
const DAY_SHAPE = [0.45, 0.42, 0.4, 0.4, 0.42, 0.5, 0.9, 1.4, 1.7, 1.8, 1.9, 2.2, 2.5, 2.4, 2, 1.8, 1.7, 1.6, 1.4, 1.1, 0.8, 0.6, 0.5, 0.48];
const NIGHT_SHAPE = [1.15, 1.1, 1.05, 1.1, 1.2, 1.15, 1, 1.4, 1.7, 1.8, 1.9, 2.2, 2.5, 2.4, 2, 1.8, 1.7, 1.6, 1.4, 1.1, 0.85, 0.8, 1, 1.1];
export const HOURS = Array.from({length: 24}, (_, h) => String(h).padStart(2, '0'));
export const OFF_HOURS = [22, 23, 0, 1, 2, 3, 4, 5];
export const hourlyOf = (site, month) => {
  const shape = SITE_STATUS[site].offHours && month === 5 ? NIGHT_SHAPE : DAY_SHAPE;
  const sum = shape.reduce((a, b) => a + b, 0);
  return shape.map(v => Math.round(v / sum * SITE_USAGE[site][month] / DAYS[month] * 10) / 10);
};
// kWh fuera de horario en el mes (promedio por hora × días), redondeado a decenas
export const offHoursOf = (site, month) => Math.round(OFF_HOURS.reduce((sum, h) => sum + hourlyOf(site, month)[h], 0) * DAYS[month] / 10) * 10;
