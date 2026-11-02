import {useEffect, useState} from 'react';

// Punto de corte móvil: el mismo 850 px de las @media en CSS (las hojas no pueden leer esta constante).
export const MOBILE_QUERY = '(max-width: 850px)';

// Movimiento reducido: preferencia del sistema o «Reducido» en Configuración (data-motion en <html>).
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';

// true en pantallas de móvil, y se actualiza al cambiar el tamaño
export function useMobile() {
  const [mobile, setMobile] = useState(() => matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
