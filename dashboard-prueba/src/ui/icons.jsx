import React from 'react';
// Material Symbols (estilo rounded, peso 400). Se importan como texto y se incrustan en el build.
import close from '@material-symbols/svg-400/rounded/close.svg';
import menu from '@material-symbols/svg-400/rounded/menu.svg';
import settings from '@material-symbols/svg-400/rounded/settings.svg';
import calendar from '@material-symbols/svg-400/rounded/calendar_month.svg';
import chevron from '@material-symbols/svg-400/rounded/keyboard_arrow_down.svg';
import info from '@material-symbols/svg-400/rounded/info.svg';
import search from '@material-symbols/svg-400/rounded/search.svg';
import top from '@material-symbols/svg-400/rounded/arrow_upward.svg';
import trendUp from '@material-symbols/svg-400/rounded/trending_up.svg';
import trendDown from '@material-symbols/svg-400/rounded/trending_down.svg';
import filter from '@material-symbols/svg-400/rounded/filter_alt.svg';
import success from '@material-symbols/svg-400/rounded/check_circle.svg';
import errorIcon from '@material-symbols/svg-400/rounded/error.svg';
import check from '@material-symbols/svg-400/rounded/check.svg';
import flag from '@material-symbols/svg-400/rounded/flag.svg';
import warning from '@material-symbols/svg-400/rounded/error.svg'; // Aviso: «!» dentro de un círculo, en contorno
import warningFill from '@material-symbols/svg-400/rounded/error-fill.svg'; // Aviso relleno: círculo lleno con el «!» calado (deja ver el fondo)
import sun from '@material-symbols/svg-400/rounded/light_mode.svg';
import sunFill from '@material-symbols/svg-400/rounded/light_mode-fill.svg';
import moon from '@material-symbols/svg-400/rounded/dark_mode.svg';
import moonFill from '@material-symbols/svg-400/rounded/dark_mode-fill.svg';
import computer from '@material-symbols/svg-400/rounded/computer.svg';
import computerFill from '@material-symbols/svg-400/rounded/computer-fill.svg';
import group from '@material-symbols/svg-400/rounded/group.svg';
import prev from '@material-symbols/svg-400/rounded/chevron_left.svg';
import next from '@material-symbols/svg-400/rounded/chevron_right.svg';
import back from '@material-symbols/svg-400/rounded/arrow_back.svg';
import handshake from '@material-symbols/svg-400/rounded/handshake.svg';
import store from '@material-symbols/svg-400/rounded/storefront.svg';
import bolt from '@material-symbols/svg-400/rounded/bolt.svg';
import receipt from '@material-symbols/svg-400/rounded/receipt_long.svg';
import home from '@material-symbols/svg-400/rounded/home.svg';
import usage from '@material-symbols/svg-400/rounded/analytics.svg';
import bell from '@material-symbols/svg-400/rounded/notifications.svg';
import building from '@material-symbols/svg-400/rounded/domain.svg';
import summary from '@material-symbols/svg-400/rounded/space_dashboard.svg';
import bars from '@material-symbols/svg-400/rounded/bar_chart.svg';
import download from '@material-symbols/svg-400/rounded/download.svg';
import contacts from '@material-symbols/svg-400/rounded/contacts.svg';
// IA: destellos dibujados a mano (este paquete de Material Symbols no incluye auto_awesome), misma retícula 960.
const ai = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 -960 960 960"><path d="M400 -760Q438.4 -478.4 720 -440Q438.4 -401.6 400 -120Q361.6 -401.6 80 -440Q361.6 -478.4 400 -760ZM740 -920Q756.8 -796.8 880 -780Q756.8 -763.2 740 -640Q723.2 -763.2 600 -780Q723.2 -796.8 740 -920ZM760 -300Q772.0 -212.0 860 -200Q772.0 -188.0 760 -100Q748.0 -188.0 660 -200Q748.0 -212.0 760 -300Z"/></svg>';

const ICONS = {contacts, home, usage, bell, building, summary, bars, download, store, bolt, receipt, back, group, prev, next, handshake, close, menu, settings, calendar, warning, warningFill, chevron, info, search, top, trendUp, trendDown, filter, ai, success, error: errorIcon, check, sun, sunFill, moon, moonFill, computer, computerFill, flag};

// Icono decorativo: hereda el color del texto (currentColor). El nombre accesible lo pone el botón.
export function Icon({name, size = 20}) {
  return <span className="icon" style={{'--icon-size': `${size}px`}} aria-hidden="true" dangerouslySetInnerHTML={{__html: ICONS[name]}}/>;
}
