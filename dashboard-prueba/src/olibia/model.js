// Reglas de negocio y de tiempo del dashboard. Sin React: funciones puras sobre los datos.

export const GOAL = 10;
export const OWNERS = ['Ana López', 'Carlos Ruiz', 'Laura Díaz', 'Mateo Gil'];
export const CHANNELS = ['Outbound', 'Referidos', 'Inbound'];
// Etapas de más cerca a más lejos del cierre.
export const FUNNEL = ['Negociación', 'Propuesta', 'Calificación', 'Contacto'];
// Clase de color por etapa: más intensa cuanto más cerca del cierre.
export const STAGE_CLASS = {Contacto: 'stage-contacto', 'Calificación': 'stage-calificacion', Propuesta: 'stage-propuesta', 'Negociación': 'stage-negociacion'};
// Token de color de cada etapa (punto de la pill, tramo del anillo): --color-dot-contacto…
export const stageDot = stage => `--color-dot-${STAGE_CLASS[stage].slice('stage-'.length)}`;
export {initials} from '../ui/avatar';
// Fotos de ejemplo de los responsables (retratos aleatorios de randomuser.me; sin conexión se ven las iniciales)
export const PHOTOS = {
  'Ana López': 'https://randomuser.me/api/portraits/women/44.jpg', 'Carlos Ruiz': 'https://randomuser.me/api/portraits/men/32.jpg',
  'Laura Díaz': 'https://randomuser.me/api/portraits/women/68.jpg', 'Mateo Gil': 'https://randomuser.me/api/portraits/men/75.jpg',
};

// "Hoy" simulado: lunes 26 oct 2026, primer día de la recta final.
// Se fija para que la demo tenga sentido cuando se revise después de octubre.
const TODAY = new Date(2026, 9, 26);
const YEAR = TODAY.getFullYear();
const STRETCH_DAYS = 5;
const DAY_MS = 864e5;

export const MONTHS = {oct: {month: 9, name: 'octubre'}, sep: {month: 8, name: 'septiembre'}};
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const isBusinessDay = date => date.getDay() % 6 !== 0;
const sameDay = (a, b) => a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const capitalize = text => text[0].toUpperCase() + text.slice(1);
// "A", "A y B", "A, B y C".
export const list = items => items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : items[0];

// Estado de un periodo respecto a hoy: cerrado, recta final (últimos 5 días hábiles) o en curso.
export function periodState(key) {
  const {month, name} = MONTHS[key];
  const stretch = [];
  for (const date = new Date(YEAR, month + 1, 0); stretch.length < STRETCH_DAYS; date.setDate(date.getDate() - 1)) {
    if (isBusinessDay(date)) stretch.unshift(new Date(date));
  }
  const last = stretch[stretch.length - 1];
  if (TODAY > last) return {state: 'cerrado', name};
  let remaining = 0;
  for (const date = new Date(TODAY); date <= last; date.setDate(date.getDate() + 1)) {
    if (isBusinessDay(date)) remaining++;
  }
  const day = stretch.findIndex(date => sameDay(date, TODAY)) + 1;
  return {state: day ? 'recta' : 'curso', name, day, total: STRETCH_DAYS, remaining};
}

// El contador de días se refiere siempre al mes en curso, sin importar el periodo seleccionado.
export const CURRENT = periodState(Object.keys(MONTHS).find(key => MONTHS[key].month === TODAY.getMonth()));
export const TODAY_LABEL = capitalize(TODAY.toLocaleDateString('es-CO', {weekday: 'long', day: 'numeric', month: 'long'}));

// Próximo contacto relativo a hoy ("mié 28 oct · en 2 días"); en periodos cerrados, la fecha tal cual.
export function contactLabel(text, open) {
  if (!open) return text;
  const [day, month] = text.split(' ');
  const date = new Date(YEAR, MONTH_NAMES.findIndex(name => name.startsWith(month)), Number(day));
  const diff = Math.round((date - TODAY) / DAY_MS);
  const when = diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : diff < 0 ? 'vencido' : `en ${diff} días`;
  return `${WEEKDAYS[date.getDay()]} ${text} · ${when}`;
}

// Prioridad: etapa más cercana al cierre → próximo contacto más cercano → mayor valor.
// Las filas de un periodo comparten mes, así que basta con comparar el día.
export const byPriority = (a, b) =>
  FUNNEL.indexOf(a[1]) - FUNNEL.indexOf(b[1]) || parseInt(a[4]) - parseInt(b[4]) || b[2] - a[2];

export const sumValue = rows => rows.reduce((sum, row) => sum + row[2], 0);

// Diferencia de cierres frente al mes anterior, a partir del histórico del periodo (número con signo).
export const closedDelta = ({history}) => history[history.length - 1] - history[history.length - 2];
