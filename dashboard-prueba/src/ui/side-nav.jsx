import React from 'react';
import {Icon} from './icons';
import './side-nav.css';

// Menú lateral: lista de áreas del producto dentro de un <aside> (que pone cada producto, con su id y su estado).
// - items: [{label, icon?, active?, soon?, onSelect?}]. El activo es un enlace con aria-current; los que no están construidos se
//   muestran deshabilitados (aria-disabled): en gris y con la nota `soon` debajo (p. ej. «Próximamente»), o sin nota y en
//   el color del texto (`soon` vacío) cuando el producto quiere el menú completo aunque solo una página exista.
// - onSelect (opcional): el ítem navega dentro de la página (p. ej. un índice de secciones): todos son enlaces y el activo
//   lleva aria-current="location".
// - icon (opcional): Material Symbol a la izquierda del texto; en el activo toma el color primario.
// - En móvil el <aside> se oculta y se abre como cajón con el botón «Menú» (.menu-toggle) y el fondo .drawer-backdrop.
export function SideNav({items, label = 'Principal'}) {
  return <nav aria-label={label}><ul>{items.map(item => <li key={item.label}>{item.onSelect
    ? <a href="#" className={item.active ? 'active' : undefined} aria-current={item.active ? 'location' : undefined} onClick={e => { e.preventDefault(); item.onSelect(); }}>{item.icon && <Icon name={item.icon}/>}{item.label}</a>
    : item.active
    ? <a href="#" className="active" aria-current="page" onClick={e => e.preventDefault()}>{item.icon && <Icon name={item.icon}/>}{item.label}</a>
    : <span className={item.soon ? 'soon' : 'soon soon--plain'} aria-disabled="true">{item.icon && <Icon name={item.icon}/>}{item.label}{item.soon && <small>{item.soon}</small>}</span>}</li>)}</ul></nav>;
}
