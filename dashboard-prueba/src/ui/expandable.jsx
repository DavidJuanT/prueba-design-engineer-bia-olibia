import React, {useId, useState} from 'react';
import {Icon} from './icons';
import './expandable.css';

// Desplegable de contenido (disclosure): un encabezado-botón muestra u oculta el contenido.
// El título va dentro de un encabezado real (h2 por defecto) para mantener la navegación por encabezados.
// Accesibilidad: botón con aria-expanded y aria-controls; el contenido cerrado lleva `inert`
// para que no reciba foco. Altura animada con grid-template-rows (0fr → 1fr).
// Cada apertura vuelve a montar el contenido, así sus animaciones de entrada (p. ej. AiText) se repiten.
// forceState: 'open' | 'closed' | 'hover' | 'focus', solo para la guía.
// icon: icono opcional antes del título (p. ej. «ai» para contenido de IA).
export function Expandable({title, icon, defaultOpen = false, headingLevel = 2, forceState, className, children}) {
  const id = useId();
  const [open, setOpen] = useState(forceState === 'open' || (forceState !== 'closed' && defaultOpen));
  const [opened, setOpened] = useState(0);
  const Heading = `h${headingLevel}`;
  const toggle = () => { if (!open) setOpened(n => n + 1); setOpen(!open); };
  return <div className={['expandable', open && 'is-open', forceState && `is-${forceState}`, className].filter(Boolean).join(' ')}>
    <Heading className="expandable-heading">
      <button type="button" className="expandable-trigger" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-trigger`} onClick={toggle}>
        {icon && <Icon name={icon} size={20}/>}
        <span>{title}</span>
        <Icon name="chevron" size={22}/>
      </button>
    </Heading>
    <div className="expandable-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} inert={!open}>
      <div className="expandable-inner"><div key={opened}>{children}</div></div>
    </div>
  </div>;
}
