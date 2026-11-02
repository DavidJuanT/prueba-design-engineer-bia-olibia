import React, {useState} from 'react';
import './avatar.css';

// Iniciales de un nombre: «Ana López» → «AL».
export const initials = name => name.split(' ').map(w => w[0]).join('');

// Avatar de persona: foto recortada en círculo, con las iniciales debajo como respaldo (sin conexión, mientras carga o
// si la foto falla). Decorativo: el nombre siempre va escrito al lado. Tamaño por CSS (24 px; --avatar-size lo cambia).
export function Avatar({name, photo}) {
  const [failed, setFailed] = useState(false);
  return <span className="avatar" aria-hidden="true">{initials(name)}
    {photo && !failed && <img src={photo} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)}/>}</span>;
}
