import React from 'react';
import {Icon} from './icons';

// Botón del design system. El ancho se ajusta al contenido.
// variant: primary · secondary · transparent — size: large · medium · small — fullWidth ocupa todo el ancho.
export function Button({variant = 'primary', size = 'medium', fullWidth = false, className, type = 'button', ...props}) {
  return <button type={type} className={['btn', `btn--${size}`, `btn--${variant}`, fullWidth && 'btn--full', className].filter(Boolean).join(' ')} {...props}/>;
}

// Botón de solo icono: 40×40 px, icono de 20 px. `label` es obligatorio: es su nombre accesible.
export function IconButton({icon, label, variant = 'transparent', className, ...props}) {
  return <Button variant={variant} className={['btn--icon', className].filter(Boolean).join(' ')} aria-label={label} title={label} {...props}><Icon name={icon}/></Button>;
}
