// Demo navegable en un solo archivo: PAGES (lo inserta build.mjs) trae el HTML completo de cada experiencia.
// Cada una se monta en su iframe la primera vez que se abre; el hash (#olibia, #bia, #sistema) dice cuál se ve.
const TABS = [['olibia', 'Olibia'], ['bia', 'Bia'], ['sistema', 'Design system']];
const tabs = document.querySelector('.demo-tabs');
const frames = document.querySelector('.demo-frames');

// Dentro de cada página, los enlaces a otra experiencia («Abrir Olibia») cambian de pestaña en vez de navegar el iframe.
const BRIDGE = `<script>document.addEventListener('click', e => {
  const a = e.target.closest('a[href]'); const m = a && a.getAttribute('href').match(/^(olibia|bia|sistema)\\.html$/);
  if (m) { e.preventDefault(); parent.postMessage({demo: m[1]}, '*'); }
}, true);<\/script>`;

const buttons = {}, iframes = {};
for (const [id, label] of TABS) {
  const b = document.createElement('button');
  Object.assign(b, {type: 'button', id: `tab-${id}`, className: 'demo-tab', textContent: label});
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-controls', `frame-${id}`);
  b.addEventListener('click', () => { location.hash = id; });
  tabs.append(buttons[id] = b);
  const f = document.createElement('iframe');
  Object.assign(f, {id: `frame-${id}`, title: label, hidden: true});
  f.setAttribute('role', 'tabpanel');
  f.setAttribute('aria-labelledby', `tab-${id}`);
  frames.append(iframes[id] = f);
}

// La barra toma el tema de la experiencia visible (cada una guarda el suyo)
let observer;
const followTheme = f => {
  observer?.disconnect();
  const root = f.contentDocument?.documentElement;
  if (!root) return;
  const sync = () => { document.documentElement.dataset.theme = root.dataset.theme || 'light'; };
  sync();
  observer = new MutationObserver(sync);
  observer.observe(root, {attributes: true, attributeFilter: ['data-theme']});
};

function show() {
  const id = TABS.some(([t]) => t === location.hash.slice(1)) ? location.hash.slice(1) : 'olibia';
  for (const [t] of TABS) {
    const on = t === id;
    buttons[t].setAttribute('aria-selected', String(on));
    buttons[t].tabIndex = on ? 0 : -1;
    iframes[t].hidden = !on;
  }
  const f = iframes[id];
  if (!f.srcdoc) {
    f.addEventListener('load', () => { if (!f.hidden) followTheme(f); });
    f.srcdoc = PAGES[id].replace('<head>', `<head>${BRIDGE}`);
  } else followTheme(f);
  document.title = `${TABS.find(([t]) => t === id)[1]} · Prueba Design Engineer`;
}

// Flechas, Inicio y Fin recorren las pestañas (una sola parada de Tab)
tabs.addEventListener('keydown', e => {
  const ids = TABS.map(([t]) => t), i = ids.indexOf(document.activeElement.id.replace('tab-', ''));
  const next = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1}[e.key];
  if (next === undefined || i < 0) return;
  e.preventDefault();
  const id = ids[(next + ids.length) % ids.length];
  buttons[id].focus();
  location.hash = id;
});

addEventListener('message', e => { if (e.data?.demo && iframes[e.data.demo]) location.hash = e.data.demo; });
addEventListener('hashchange', show);
show();
