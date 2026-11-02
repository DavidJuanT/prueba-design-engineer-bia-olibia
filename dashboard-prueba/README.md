# Olibia · Dashboard comercial en React

Tarea 1 de la prueba Design Engineer Bia/Olibia: uplift del dashboard comercial para el líder de un equipo de ventas. Datos ficticios, sin backend.

## Ejecutar
Requiere Node.js 20 o superior.

```sh
npm ci
npm run build
npm start
```

Abre http://localhost:3000. También puedes abrir `dist/index.html` directamente: contiene React, CSS, fuentes y JavaScript y funciona sin conexión.

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Dashboard comercial |
| `#componentes` | Design system: fundamentos y componentes con contenido neutro |
| `#patrones` | Patrones de Olibia: cómo se aplica el sistema en este producto |
| `#boton`, `#dropdown`, `#tooltip`, `#search`, `#expandable`, `#ia`, `#skeleton`, `#toast`, `#columnas`, `#tabla`, `#modal`, `#tema`, `#vacio`, `#fallback`, `#kpi` | Guía de un solo componente |
| `?fallo=period\|table\|stage\|owner\|month\|channel\|all` | Fuerza un error de carga simulado (sin el parámetro, 1 de cada 3 cargas falla algo al azar) |

## Estructura
- `src/ui/`: design system reutilizable. Fundamentos (`tokens.css`, `fonts.css`, `base.css`, `buttons.css` y `glass.css`, la capa «vidrio» que se carga la última), `media.js` (punto de corte móvil y movimiento reducido) y un `.jsx` + `.css` por componente (botón, pills, desplegable, tooltip, tabla, modal, toast, skeleton, gráficas…). No importa nada de `src/olibia/`.
- `src/olibia/`: el producto. `App.jsx` (pantalla, estado y rutas), `model.js`, `filters.js` y `data.js` (reglas del negocio, filtros y datos ficticios), patrones (`components.jsx`, `period.jsx`, `detail.jsx`, `followup-kpi.jsx`, `skeletons.jsx`), `layout.css` y las páginas del design system (`showcase.jsx`).
- `archive/previews/`: vistas previas ya decididas (gráficas y formas para etapa y ejecutivo), fuera del bundle, para conservar la comparación.
- `build.mjs`: compilación con esbuild y generación de un HTML autónomo.

## Documentación
- [`../docs/01-objetivos-olibia.md`](../docs/01-objetivos-olibia.md): objetivo UX, jobs del líder, estructura de la pantalla, casos, decisiones (D1–D18) y pendientes.
- [`../docs/02-design-system.md`](../docs/02-design-system.md): fundamentos, capa vidrio, componentes con su uso en Olibia y tiempos de movimiento.

## Qué cambió respecto al material inicial
- Pantalla ordenada por las preguntas del líder: periodo y meta, negociaciones al día, oportunidades abiertas y gráficas de contexto.
- Design system propio con capa visual «vidrio» en claro y oscuro, documentado y con guías navegables.
- Gráficas elegidas por lo que dice cada dato: columnas con meta y tendencia (cierres por mes), columnas sin carril (origen), anillo horizontal (valor por etapa) y ranking sin pista (cierres por ejecutivo).
- Filtros combinables por etapa, responsable, canal y valor mensual; la búsqueda solo afecta a la tabla. En móvil, bottom sheet y chips.
- Detalle de oportunidad en modal y registro de seguimiento; marca de las oportunidades que cierran la brecha.
- Estados de carga (skeleton), vacío y error simulado por card o de página, con reintento.
- Configuración de tema, movimiento reducido y densidad, recordada en el navegador.

Los seguimientos se guardan solo durante la sesión. La exportación CSV y los filtros funcionan localmente.

## Entrega
Un repositorio de GitHub con ambas tareas en React, README con instrucciones, explicación de decisiones y enlace a una demo. Incluye la reflexión de la tarea 3 en el README o en `criterio.md`. Pendiente: tarea 2 (Bia), repositorio y demo publicada.
