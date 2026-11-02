# Olibia · Dashboard comercial en React

Tarea 1 de la prueba Design Engineer Bia/Olibia: uplift del dashboard comercial para el líder de un equipo de ventas. Datos ficticios, sin backend.

## Ejecutar
Requiere Node.js 20 o superior.

```sh
npm ci
npm run build
npm start
```

Abre http://localhost:3000/olibia. También puedes abrir `dist/olibia.html` directamente (y `bia.html`, `sistema.html`): contiene React, CSS, fuentes y JavaScript y funciona sin conexión.

## Rutas

| Ruta | Qué es |
|---|---|
| `/demo` | Las tres experiencias en una sola página, con una barra para cambiar entre ellas (`dist/demo.html`, un solo archivo). En GitHub Pages es la raíz del sitio |
| `/olibia` (o `/`) | Olibia: dashboard comercial |
| `/bia` | Bia: tu factura de energía |
| `/sistema` o `/sistema#componentes` | Design system: fundamentos y componentes con contenido neutro (página propia, `dist/sistema.html`) |
| `?fallo=period\|table\|stage\|owner\|month\|channel\|all` | Fuerza un error de carga simulado (sin el parámetro, 1 de cada 3 cargas falla algo al azar) |

## Estructura
- `src/ui/`: design system reutilizable. Fundamentos (`tokens.css`, `fonts.css`, `base.css`, `buttons.css` y `glass.css`, la capa «vidrio» que se carga la última), `media.js` (punto de corte móvil y movimiento reducido) y un `.jsx` + `.css` por componente (botón, pills, desplegable, tooltip, tabla, modal, toast, skeleton, gráficas…). No importa nada de `src/olibia/`.
- `src/olibia/`: el producto. `App.jsx` (pantalla, estado y rutas), `model.js`, `filters.js` y `data.js` (reglas del negocio, filtros y datos ficticios), patrones (`components.jsx`, `period.jsx`, `detail.jsx`, `followup-kpi.jsx`, `skeletons.jsx`), `layout.css` y `assets/people/` (fotos de los responsables).
- `src/bia/`: Bia (tarea 2). Solo consume `src/ui/`.
- `src/sistema/`: la página del design system (`App.jsx` con las rutas, `showcase.jsx` + `showcase.css`, `assets/` con las fotos de ejemplo). Se compila aparte, así Olibia y Bia no cargan su código; los productos consumen `src/ui/` y enlazan aquí.
- `src/demo/`: la barra de `demo.html` (`demo.js` + `demo.css`). `build.mjs` mete dentro el HTML de las tres páginas y monta cada una en su iframe, así sus estilos no se mezclan.
- `build.mjs`: compilación con esbuild y generación de un HTML autónomo.

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
