import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AllComponentsShowcase, ButtonShowcase, DropdownShowcase, TooltipShowcase, SearchShowcase, ExpandableShowcase, AiTextShowcase, SkeletonShowcase, ToastShowcase, ColumnShowcase, ThemeSwitchShowcase, TableShowcase, ModalShowcase, FallbackShowcase, EmptyStateShowcase} from './showcase';
import '../ui/fonts.css';
import '../ui/tokens.css';
import '../ui/base.css';
import '../olibia/layout.css'; // algunos ejemplos usan su maquetación (filas de configuración, filtros)
import '../ui/side-nav.css';
import '../ui/kpis.css';
import './showcase.css';
import '../olibia/entry.css';
import '../ui/buttons.css';
import '../ui/glass.css'; // capa vidrio: siempre la última hoja

// Página propia del design system (sistema.html), aparte de los productos: Olibia y Bia consumen src/ui y
// enlazan aquí. Sin hash o con #componentes muestra todo; #boton, #modal… una guía.
const GUIDES = {'#componentes': AllComponentsShowcase, '#boton': ButtonShowcase, '#dropdown': DropdownShowcase, '#tooltip': TooltipShowcase, '#search': SearchShowcase, '#expandable': ExpandableShowcase, '#ia': AiTextShowcase, '#skeleton': SkeletonShowcase, '#toast': ToastShowcase, '#columnas': ColumnShowcase, '#tema': ThemeSwitchShowcase, '#tabla': TableShowcase, '#modal': ModalShowcase, '#error': FallbackShowcase, '#fallback': FallbackShowcase, '#vacio': EmptyStateShowcase};

// Tema guardado (las mismas preferencias que Olibia), antes del primer render para no mostrar un destello.
try {
  const theme = JSON.parse(localStorage.getItem('olibia-settings') || '{}').theme || 'system';
  document.documentElement.dataset.theme = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
} catch {}

function Root() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onHash = () => { setHash(location.hash); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const Guide = GUIDES[hash] || AllComponentsShowcase;
  return <Guide/>;
}

createRoot(document.getElementById('root')).render(<Root/>);
