import React from 'react';
import {focusTarget} from './keyboard';

// Enlace «Saltar al contenido»: primera parada de Tab; oculto hasta recibir foco. Lleva el foco al <main>
// (sin cambiar la URL), saltándose la cabecera, el menú, el aviso y los filtros.
export function SkipLink({target = 'main', children = 'Saltar al contenido'}) {
  return <a href="#" className="skip-link" onClick={e => { e.preventDefault(); focusTarget(document.querySelector(target)); }}>{children}</a>;
}
