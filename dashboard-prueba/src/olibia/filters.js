// Sin filtros ni búsqueda (estado inicial y «Limpiar filtros»).
export const NO_FILTERS = {query: '', stage: [], owner: '', channel: '', minimum: ''};

export function channelFor(row, allRows) {
  const index = allRows.indexOf(row);
  return index < Math.ceil(allRows.length / 2) ? 'Outbound' : index < allRows.length - 1 ? 'Referidos' : 'Inbound';
}
// stage: lista de etapas (selección múltiple); vacía = todas.
export function filterRows(allRows, {query = '', stage = [], owner = '', channel = '', minimum = ''} = {}) {
  return allRows.filter(row => row[0].toLowerCase().includes(query.trim().toLowerCase()) && (!stage.length || stage.includes(row[1])) && (!owner || row[3] === owner) && (!channel || channelFor(row, allRows) === channel) && (!minimum || row[2] >= Number(minimum)));
}
