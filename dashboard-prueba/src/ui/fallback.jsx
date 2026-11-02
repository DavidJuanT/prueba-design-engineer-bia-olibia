import React from 'react';
import {Button} from './button';
import './fallback.css';

// Fallback: estado de error de carga de cualquier card (sus datos no llegaron del back).
// La card conserva su título; el cuerpo cambia a: ilustración en línea de un cable desconectado,
// el mensaje y «Intentar de nuevo», que vuelve a pedir solo esos datos. Sirve para cualquier card:
// `message` concreta qué no se pudo mostrar; sin él, usa el genérico.
// role="alert": el lector de pantalla anuncia el fallo al aparecer.
export function Fallback({message = 'No pudimos mostrar esta información.', onRetry}) {
  return <div className="fallback" role="alert">
    <CableIllustration/>
    <p className="fallback-text">{message}</p>
    <Button variant="transparent" onClick={onRetry}>Intentar de nuevo</Button>
  </div>;
}

// Cable desconectado: los dos extremos de un cable no llegan a unirse. El enchufe se acerca, saltan chispas rojas
// en el hueco y vuelve sin conectar. Trazo de 2 px con extremos redondeados; cable, conector y enchufe en gris.
function CableIllustration() {
  return <svg className="fallback-art" width="168" height="96" viewBox="0 0 112 64" fill="none" aria-hidden="true">
    {/* Extremo izquierdo: cable y conector hembra con sus dos orificios */}
    <path className="fallback-line" d="M4 40c6 0 10-8 18-8h14" />
    <rect className="fallback-line" x="36" y="24" width="18" height="16" rx="4" />
    <path className="fallback-hole" d="M44 29v0M44 35v0" />
    {/* Chispas en el hueco */}
    <path className="fallback-spark" d="M58 24l1-5M58 40l1 5M62 22l3-4M62 42l3 4" />
    {/* Extremo derecho: enchufe con sus dos patas hacia el conector, y su cable */}
    <g className="fallback-plug">
      <path className="fallback-line" d="M70 29h-6M70 35h-6" />
      <rect className="fallback-line" x="70" y="24" width="16" height="16" rx="4" />
      <path className="fallback-line" d="M86 32h8c6 0 10-6 14-6" />
    </g>
  </svg>;
}

// Fallback de página: nada de la interfaz pudo cargar (el servicio no responde). Sustituye todo el contenido;
// la cabecera y la navegación se mantienen. El texto no culpa al usuario ni a su conexión: el fallo es nuestro.
// Ilustración mayor (un enchufe fuera del tomacorriente), título, explicación
// y «Intentar de nuevo» (primary), que vuelve a cargar todo el dashboard.
export function PageFallback({title = 'No pudimos cargar esta página', message = 'Tuvimos un problema de nuestro lado al traer la información. Intenta de nuevo en unos minutos.', onRetry}) {
  return <section className="page-fallback" role="alert" aria-labelledby="pageFallbackTitle">
    <OutletIllustration/>
    <h1 id="pageFallbackTitle">{title}</h1>
    <p>{message}</p>
    <Button variant="primary" onClick={onRetry}>Intentar de nuevo</Button>
  </section>;
}

// Tomacorriente en la pared y el enchufe fuera, con su cable: no hay energía para nada.
// Misma familia que la batería (trazo de 2 px, gris; acento en el morado del sistema): el enchufe se acerca,
// saltan chispas rojas y vuelve; la luz del tomacorriente parpadea en ámbar.
function OutletIllustration() {
  return <svg className="fallback-art page-fallback-art" width="176" height="104" viewBox="0 0 176 104" fill="none" aria-hidden="true">
    {/* Pared y tomacorriente con sus dos ranuras y su luz */}
    <path className="fallback-line" d="M8 92h68" />
    <rect className="fallback-line" x="14" y="14" width="56" height="72" rx="12" />
    <rect className="fallback-line" x="26" y="30" width="32" height="40" rx="8" />
    <path className="fallback-line" d="M37 42v10M47 42v10" />
    <circle className="fallback-charge" cx="42" cy="61" r="2.5" />
    {/* Chispas en el hueco */}
    <path className="fallback-spark" d="M80 40l-3-5M80 60l-3 5M86 37l2-6M86 63l2 6" />
    {/* Enchufe con sus patas hacia el tomacorriente, y el cable que cae */}
    <g className="fallback-plug">
      <path className="fallback-line" d="M98 44h-10M98 56h-10" />
      <rect className="fallback-line" x="98" y="36" width="22" height="28" rx="6" />
      <path className="fallback-line" d="M120 50h10c10 0 16 6 16 16v30" />
      <path className="fallback-bolt" d="M112 42l-5 8h6l-4 8" />
    </g>
  </svg>;
}
