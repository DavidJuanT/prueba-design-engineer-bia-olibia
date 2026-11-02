import {build} from 'esbuild';
import fs from 'node:fs';
// Tres páginas autónomas que comparten src/ui: Olibia (tarea 1) en olibia.html, Bia (tarea 2) en bia.html y el design system en sistema.html.
// index.html es una copia de Olibia, para que la raíz del sitio también la abra.
const PAGES = [['app', 'src/olibia/App.jsx', 'olibia', 'Olibia · Dashboard base React'], ['bia', 'src/bia/App.jsx', 'bia', 'Bia · Tu factura de energía'], ['sistema', 'src/sistema/App.jsx', 'sistema', 'Design system · Olibia y Bia']];
await build({entryPoints:Object.fromEntries(PAGES.map(([name, src]) => [name, src])),bundle:true,minify:true,outdir:'dist',entryNames:'[name]',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',loader:{'.woff2':'dataurl','.svg':'text','.jpg':'dataurl'}});
for (const [name, , file, title] of PAGES) {
  const js=fs.readFileSync(`dist/${name}.js`,'utf8').replace(/<\/script/gi,'<\\/script');
  const css=fs.readFileSync(`dist/${name}.css`,'utf8');
  fs.writeFileSync(`dist/${file}.html`,`<!doctype html><html lang="es" class="skin-glass"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
}
fs.copyFileSync('dist/olibia.html','dist/index.html');

// demo.html: las tres experiencias en un solo archivo, cada una en su iframe (sus hojas globales no se mezclan).
await build({entryPoints:{demo:'src/demo/demo.js', 'demo-style':'src/demo/demo.css'},bundle:true,minify:true,outdir:'dist',entryNames:'[name]',loader:{'.woff2':'dataurl'}});
const pages=JSON.stringify(Object.fromEntries(['olibia','bia','sistema'].map(p => [p, fs.readFileSync(`dist/${p}.html`,'utf8')]))).replace(/<\//g,'<\\/').replace(/<!--/g,'<\\!--');
const demoJs=fs.readFileSync('dist/demo.js','utf8').replace(/<\/script/gi,'<\\/script');
fs.writeFileSync('dist/demo.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prueba Design Engineer · Olibia y Bia</title><style>${fs.readFileSync('dist/demo-style.css','utf8')}</style></head><body><header class="demo-bar"><span class="demo-title">Prueba Design Engineer</span><div class="demo-tabs" role="tablist" aria-label="Experiencias"></div></header><main class="demo-frames"></main><script>const PAGES=${pages};</script><script>${demoJs}</script></body></html>`);
