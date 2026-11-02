# Prueba Design Engineer · Bia | Olibia

Dos experiencias en React que comparten un mismo design system.

| | Demo | Código |
|---|---|---|
| 01 · Uplift radical de Olibia (dashboard comercial) | [PENDIENTE: enlace de la demo]/olibia | [`dashboard-prueba/src/olibia`](dashboard-prueba/src/olibia) |
| 02 · Experiencia para Bia (factura de energía) | [PENDIENTE: enlace de la demo]/bia | [`dashboard-prueba/src/bia`](dashboard-prueba/src/bia) |
| Design system | [PENDIENTE: enlace de la demo]/sistema | [`dashboard-prueba/src/ui`](dashboard-prueba/src/ui) |

Para ejecutarlo en local, ver [`dashboard-prueba/README.md`](dashboard-prueba/README.md).

## Decisiones estructurales del proyecto

Antes de entrar en cada experiencia, estas son las decisiones que comparten las dos.

**Dirección de diseño.** Empecé por el color. Hice un benchmark del sector energético (Neuenergy, Celsia, Erco Energía, entre otras) y casi todas usan amarillos, naranjas y verdes; el morado me permitía diferenciar la marca de su competencia.

**Elección visual.** Sobre ese morado construí una estética moderna, con transparencias, luces, sombras y contrastes, que funciona en modo claro y oscuro. Buscaba transmitir precisión y dinamismo, y usar la profundidad y los acentos de color para jerarquizar datos y alertas sin perder legibilidad.

**Tipografía.** Como los números son el centro de las dos experiencias, trabajé con dos familias y un rol para cada una. Saira para las cifras protagonistas: su forma geométrica recuerda a los contadores de energía. Geist para textos y cifras secundarias, porque se lee muy bien en pantalla; en tablas y datos pequeños la uso con cifras tabulares, para que los números se alineen y se comparen con facilidad.

**Un design system compartido.** Olibia y Bia son la misma marca para usuarios distintos, así que decidí que compartieran componentes y tokens. Eso me dio velocidad al implementar y consistencia entre las dos experiencias. El sistema tiene su propia página (`/sistema`).

**Proceso.** En los dos pedidos seguí el mismo camino: entender el problema, definir los objetivos de negocio y un objetivo UX observable, y diseñar la experiencia y la interfaz a partir de ellos. Al final optimicé y depuré el código, y revisé la consistencia entre interfaces, la accesibilidad y la navegación por teclado.

## 01 · Olibia

### Planteamiento

En Olibia, una herramienta de gestión comercial, el equipo de ventas no ha cumplido la meta de 10 cierres en seis meses, y en la recta final de octubre van 8 de 10. El dashboard mostraba datos, pero no jerarquizaba cuántos cierres faltaban ni priorizaba qué oportunidades podían cubrir la brecha.

**Objetivos.** Para el negocio, cumplir la meta cada mes sin vaciar las etapas tempranas del pipeline. Para el líder (objetivo UX), identificar la brecha y las oportunidades que la cubren, y registrar su seguimiento desde la vista principal.

**Cómo lo mediría.** Que el líder identifique la brecha y registre a tiempo los seguimientos; en negocio, cierres frente a la meta y oportunidades que avanzan de etapa.

### Decisiones de diseño

Con eso claro, diseñé alrededor de una pregunta: ¿qué falta para llegar a la meta?

**1. Jerarquía.** Agrupé en una card destacada lo que el líder debe ver primero: meta («8 de 10»), negociaciones al día, cierres y pipeline. Debajo, el Resumen AI nombra las dos negociaciones que cierran la brecha y lleva a ellas.

**2. Acción en contexto.** Ahí mismo registra el seguimiento, sin cambiar de vista: la pill pasa a «Al día» y se puede deshacer. Y ordené la tabla por cercanía al cierre, que define a quién contactar primero.

**3. Accesibilidad.** Por último, lo revisé con teclado, lector de pantalla y en móvil (bottom sheets y filtro fijo), en claro y oscuro y con movimiento reducido.

## 02 · Bia

### Planteamiento

Bia comercializa, monitorea, diagnostica y factura la energía de negocios para que decidan con información trazable. El caso: el administrador de tres cafeterías ve que su factura subió un 25 % con la tarifa igual, y no sabe qué sede ni qué variación lo explican.

**Objetivos.** Para el negocio, que los clientes usen el diagnóstico y vuelvan a él para decidir. Para el administrador (objetivo UX), entender que el aumento viene del consumo, qué sede lo concentra y qué variación investigar primero.

**Cómo lo mediría.** Cuántos identifican la sede y la variación correctas, y en cuánto tiempo; en negocio, adopción, frecuencia de uso y retención.

### Decisiones de diseño

El administrador llega con una duda concreta, así que organicé la página para responder cuatro preguntas en orden: qué pasó, por qué, dónde y cuándo.

**1. Jerarquía.** Lo primero que ve es la respuesta: el impacto en factura y consumo, el consumo extra y una tarifa sin cambio que descarta el precio. Los patrones horarios y el detalle operativo quedan al final, para quien quiera profundizar.

**2. Exploración progresiva.** Después, cada bloque responde la siguiente pregunta, de lo macro al detalle, hasta la sede que concentra el incremento.

**3. Asistencia contextual.** En el camino, el Resumen AI destaca los hallazgos de cada vista y separa lo observado de lo que podría explicarlo.

**4. Trazabilidad.** Por eso el consumo fuera de horario aparece como señal por investigar, no como una causa: los datos no alcanzan para confirmarla.

## Herramientas y AI

- **Recursos:** iconos Material Symbols; fuentes Geist y Saira (Fontsource).
- **AI:** usé Claude Code (Claude Opus) para implementar, auditar (espaciados en múltiplos de 4, colores, teclado, lector de pantalla, móvil) y documentar. También me apoyé en un skill de estrategia UX para aterrizar el objetivo UX y los criterios de aceptación de cada experiencia.
- **Figma:** lo usé para construir colores y tonos cuando las propuestas de la IA no me convencían.

## Qué refiné personalmente

Revisé cada decisión de diseño y cada detalle de implementación para reducir inconsistencias, evitar retrabajo y cumplir los objetivos.

Áreas de refinamiento:

- **Dirección visual:** identidad, paleta de color, tipografías Saira y Geist, escala tipográfica y jerarquías.
- **Sistema de interfaz:** componentes, layouts, consistencia visual y reutilización del design system.
- **Accesibilidad y responsive:** navegación por teclado, compatibilidad con lectores de pantalla y adaptación a dispositivos móviles.
- **Implementación:** consistencia y mantenibilidad del código.

Mi objetivo fue construir una experiencia cuidada en lo visual y sólida en lo funcional, con una base consistente que facilite su escalabilidad. Además, hice QA visual y cada cierto tiempo pedí optimización y depuración del código.

## Tiempo dedicado

Datos según Claude Code.

**25 h 31 min** de trabajo, del 29 de octubre al 2 de noviembre de 2026.

| Etapa | Tiempo |
|---|---|
| Olibia y design system (29 oct – 1 nov) | 14 h 56 min |
| Bia, más el pulido y la documentación de las dos (1 – 2 nov) | 10 h 35 min |

Me tomé más tiempo en el design system para que la base fuera sólida y escalable. Por eso Bia me tomó menos, y ese tiempo lo dediqué casi todo a la experiencia.
