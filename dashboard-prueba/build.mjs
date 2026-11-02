import {build} from 'esbuild';
import fs from 'node:fs';
// Dos páginas autónomas que comparten src/ui: Olibia (tarea 1) en index.html y Bia (tarea 2) en bia.html.
const PAGES = [['app', 'src/olibia/App.jsx', 'index', 'Olibia · Dashboard base React'], ['bia', 'src/bia/App.jsx', 'bia', 'Bia · Tu factura de energía']];
await build({entryPoints:Object.fromEntries(PAGES.map(([name, src]) => [name, src])),bundle:true,minify:true,outdir:'dist',entryNames:'[name]',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',loader:{'.woff2':'dataurl','.svg':'text'}});
for (const [name, , file, title] of PAGES) {
  const js=fs.readFileSync(`dist/${name}.js`,'utf8').replace(/<\/script/gi,'<\\/script');
  const css=fs.readFileSync(`dist/${name}.css`,'utf8');
  fs.writeFileSync(`dist/${file}.html`,`<!doctype html><html lang="es" class="skin-glass"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
}
