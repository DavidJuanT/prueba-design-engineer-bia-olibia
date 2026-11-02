import React, {useEffect, useState} from 'react';
import './aitext.css';
import {reducedMotion} from './media';

// Texto generado por IA: «analiza y escribe».
// Regla del design system: todo contenido de IA (Resumen AI y los que vengan) se muestra con <AiText>.
// 1. Analiza: un rótulo con brillo («Analizando…», o el que se pase en `thinking`) durante 900 ms, como el estado de
//    razonamiento de los asistentes de IA.
// 2. Escribe: el texto aparece palabra a palabra (12 ms entre palabras) y `after` (p. ej. el CTA) al terminar.
// - Mantiene el marcado (párrafos, negritas): solo se parten los textos en palabras.
// - El rótulo es role="status" y el texto completo está en el DOM al escribir: el lector lo lee entero.
// - Con movimiento reducido se salta el análisis y el texto aparece completo al instante.
const STEP_MS = 12;
const THINK_MS = 900;

export function AiText({children, after, thinking = 'Analizando…'}) {
  const [written, setWritten] = useState(reducedMotion);
  useEffect(() => {
    if (written) return;
    const t = setTimeout(() => setWritten(true), THINK_MS);
    return () => clearTimeout(t);
  }, [written]);

  if (!written) return <div className="ai-text"><p className="ai-thinking" role="status">{thinking}</p></div>;

  let index = 0;
  const split = node => {
    if (typeof node === 'string') {
      return node.split(/(\s+)/).map((part, i) => /^\s+$/.test(part) || !part
        ? part
        : <span key={i} className="ai-word" style={{'--w': index++}}>{part}</span>);
    }
    if (Array.isArray(node)) return node.map((child, i) => <React.Fragment key={i}>{split(child)}</React.Fragment>);
    if (React.isValidElement(node) && node.props.children !== undefined) return React.cloneElement(node, undefined, split(node.props.children));
    return node;
  };
  const content = split(children);
  return <div className="ai-text" style={{'--ai-step': `${STEP_MS}ms`, '--ai-total': `${index * STEP_MS}ms`}}>
    {content}
    {after && <div className="ai-after">{after}</div>}
  </div>;
}
