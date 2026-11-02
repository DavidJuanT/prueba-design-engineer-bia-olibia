import React, {useEffect, useRef} from 'react';
import './skeleton.css';
import {reducedMotion} from './media';

// Skeleton «circuito»: estado de carga con concepto de energía. Contornos y líneas continuas en gris
// tenue y una sola banda de corriente morada que recorre toda la pantalla de izquierda a derecha, despacio,
// atravesando a la vez todos los componentes (CSS, skeleton.css).
//
// Contornos de los contenedores (aquí, con requestAnimationFrame): una sola línea de corriente encadena todos
// los contenedores de arriba abajo. Entra en cada uno por su esquina superior izquierda y sale por la inferior
// izquierda, justo encima del siguiente, que la recoge; las filas alternan sentido (horario / antihorario).
// La línea es un cometa (punta brillante y cola que se desvanece) y se va apagando a medida que recorre cada
// contenedor. Al terminar el último vuelve a empezar por el primero.
// Es decorativo: el contenedor anuncia «Cargando…» con role="status" y el resto va con aria-hidden.
const SPEED = 0.7;     // px por ms a lo largo del contorno: velocidad constante en todos los contenedores
const WAVE_MS = 700;   // Retraso de la banda entre la primera y la última línea (de arriba abajo): efecto ola
// Cometa: [desfase desde la punta, largo, opacidad] de cada tramo, en px
const COMET = [[0, 70, 1], [70, 60, .45], [130, 70, .15]];

// Contorno de una pieza: tres tramos superpuestos forman la línea con cola que se desvanece.
function Wire({radius = 12}) {
  return <svg className="sk-wire" aria-hidden="true">
    {COMET.map((_, k) => <rect key={k} className="sk-wire-pulse" x="1" y="1" rx={radius}/>)}
  </svg>;
}

// Bloque con contorno punteado y su línea de corriente.
// El sentido de su línea lo decide su posición en la cadena (filas alternas).
export function SkBlock({radius = 12, className, children}) {
  return <div className={['sk-block', className].filter(Boolean).join(' ')}>
    <div className="sk-block-wire"><Wire radius={radius}/></div>
    {children}
  </div>;
}

// Grupo de líneas de una pieza (un filtro, una columna de KPI, una celda de la tabla).
export function SkStep({className, children}) {
  return <div className={['sk-step', className].filter(Boolean).join(' ')}>{children}</div>;
}

// Línea de texto: un cable horizontal por el que pasa la banda de corriente.
export function SkLine({width = '100%', size = 'text'}) {
  return <span className={`sk-line sk-line--${size}`} style={{width}}/>;
}

// inline: los hijos son componentes reales que muestran solo sus datos como skeleton (recarga en el sitio);
// no se ocultan a los lectores de pantalla porque siguen siendo usables.
export function SkeletonState({label = 'Cargando datos del periodo…', inline = false, children}) {
  const root = useRef(null);
  useEffect(() => {
    if (reducedMotion()) return;
    // Ola: cada línea recibe un retraso proporcional a su altura dentro del skeleton.
    const box = root.current.getBoundingClientRect();
    root.current.querySelectorAll('.sk-line, .sk-field').forEach(el => {
      const y = (el.getBoundingClientRect().top - box.top) / box.height;
      el.style.setProperty('--sk-wave', `${Math.round(y * WAVE_MS)}ms`);
    });
    // Cadena de contenedores: la línea entra en cada contenedor por su esquina superior izquierda y sale por
    // su esquina inferior izquierda, justo encima de la siguiente, que la recoge. Las filas alternan sentido:
    // horario (arriba → derecha → abajo) y antihorario (vuelta completa bajando por la izquierda y otra vez
    // la izquierda hasta abajo). Los contenedores de una misma fila (gráficas lado a lado) van a la vez.
    // Posiciones en px a lo largo del contorno; el rect empieza arriba a la izquierda y va en sentido horario.
    const corner = (rect, length, cx, cy) => {
      let at = 0, best = Infinity;
      for (let d = 0; d <= length; d += 2) {
        const pt = rect.getPointAtLength(d), dist = (pt.x - cx) ** 2 + (pt.y - cy) ** 2;
        if (dist < best) { best = dist; at = d; }
      }
      return at;
    };
    const rows = [];
    [...root.current.querySelectorAll('.sk-block')].forEach(block => {
      const top = Math.round(block.getBoundingClientRect().top / 8);
      const row = rows.find(r => r.top === top);
      row ? row.blocks.push(block) : rows.push({top, blocks: [block]});
    });
    rows.sort((a, b) => a.top - b.top);
    const legs = rows.map(({blocks}, r) => blocks.map(block => {
      const rects = [...block.querySelectorAll('.sk-wire-pulse')];
      const length = rects[0].getTotalLength();
      const box = rects[0].getBBox();
      const cw = r % 2 === 0;
      const bl = corner(rects[0], length, box.x, box.y + box.height);
      let tl = corner(rects[0], length, box.x, box.y);
      // Horario: de arriba izquierda (antes que bl) hasta bl. Antihorario: de arriba izquierda (después de bl)
      // bajando una vuelta entera más el lado izquierdo, hasta bl.
      if (cw && tl > bl) tl -= length;
      if (!cw && tl < bl) tl += length;
      return {rects, length, cw, from: tl, to: cw ? bl : bl - length};
    }));
    // Dibuja un tramo [a, b] del recorrido (posiciones sin envolver): lo recorta al viaje de ese contenedor
    // y, si cruza el inicio del contorno, lo parte en dos. Nunca usa trazos de largo 0: con extremos
    // redondeados se pintarían como un punto suelto en el inicio del contorno.
    const draw = (leg, rect, a, b, alpha) => {
      const lo = Math.min(leg.from, leg.to), hi = Math.max(leg.from, leg.to);
      a = Math.max(a, lo); b = Math.min(b, hi);
      if (b - a < 1) { rect.style.opacity = '0'; return; }
      const L = leg.length, s = ((a % L) + L) % L, e = s + (b - a);
      if (e <= L) {
        rect.style.strokeDasharray = `${e - s} ${2 * L}`;
        rect.style.strokeDashoffset = `${-s}`;
      } else {
        rect.style.strokeDasharray = `${e - L} ${s - (e - L)} ${L - s} ${2 * L}`;
        rect.style.strokeDashoffset = '0';
      }
      rect.style.opacity = String(alpha);
    };
    const paint = (leg, head, fade) => leg.rects.forEach((rect, k) => {
      const [gap, len, alpha] = COMET[k];
      // Cada tramo va detrás de la punta (más atrás en el sentido de avance) y se apaga con el recorrido.
      const start = leg.cw ? head - gap - len : head + gap;
      draw(leg, rect, start, start + len, alpha * fade);
    });
    const hide = leg => leg.rects.forEach(rect => { rect.style.opacity = '0'; });
    legs.flat().forEach(hide);

    let frame, i = 0, t0 = 0;
    const tick = now => {
      const row = legs[i];
      if (!t0) t0 = now;
      // Toda la fila avanza al ritmo de su contenedor más largo, así terminan juntos.
      const distance = Math.max(...row.map(leg => Math.abs(leg.to - leg.from)));
      const p = Math.min((now - t0) * SPEED / distance, 1);
      row.forEach(leg => {
        const head = leg.from + (leg.to - leg.from) * p;
        // Brillo completo al nacer y se va apagando hasta el 15 % al final de su recorrido.
        paint(leg, head, 1 - .85 * p);
      });
      if (p < 1) { frame = requestAnimationFrame(tick); return; }
      row.forEach(hide);
      i = (i + 1) % legs.length;
      t0 = 0;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <div className="sk-root" ref={root}>
    <p className="sr-only" role="status">{label}</p>
    {inline ? children : <div aria-hidden="true">{children}</div>}
  </div>;
}

// Contorno con línea de corriente para un componente real que está recargando sus datos.
export function SkWire() {
  return <div className="sk-block-wire"><Wire/></div>;
}

// Contenido de una gráfica en carga: barras (columnas y ranking) o anillo con su leyenda (oportunidades por etapa).
export function ChartSkeleton({shape = 'bars'}) {
  const lines = [70, 55, 85, 40];
  if (shape !== 'ring') return <div className="chart-skeleton" aria-hidden="true">{lines.map((w, k) => <SkLine key={k} width={`${w}%`} size="bar"/>)}</div>;
  return <div className="chart-skeleton chart-skeleton--ring" aria-hidden="true"><span className="sk-ring"/>
    <div>{lines.map((w, k) => <SkLine key={k} width={`${w}%`}/>)}</div></div>;
}
