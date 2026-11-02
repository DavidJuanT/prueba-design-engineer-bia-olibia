// Datos del pedido (tarea 02 del PDF). Nada inventado: lo derivado es solo aritmética sobre estos valores.
export const TARIFF = 800;                        // COP por kWh, igual en los dos periodos (factura = consumo × tarifa: $4,8 M → $6 M)
export const USAGE = {previous: 6000, current: 7500};
export const MAIN_SITE = 1200;                    // kWh adicionales de la sede que concentra el aumento
export const OTHER_SITES = 300;                   // kWh adicionales de las otras dos sedes, en conjunto

// Filtros. Periodo: solo octubre tiene datos (los del pedido); el resto de opciones
// existen en el menú y muestran un estado vacío. Sede: las tres por separado o todas.
export const DATA_PERIOD = 'oct';
export const PERIODS = [
  ['oct', 'Octubre'],
  ['sep', 'Septiembre'],
  ['ago', 'Agosto'],
  ['3m', 'Últimos 3 meses'],
  ['6m', 'Últimos 6 meses'],
];
