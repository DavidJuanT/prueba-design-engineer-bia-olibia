import http from 'node:http';
import fs from 'node:fs';
// /demo junta las tres en una página; /olibia (y la raíz) sirve el dashboard de Olibia (tarea 1); /bia, la tarea 2; /sistema, el design system.
http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(req.url.startsWith('/demo') ? 'dist/demo.html' : req.url.startsWith('/bia') ? 'dist/bia.html' : req.url.startsWith('/sistema') ? 'dist/sistema.html' : 'dist/olibia.html'))}).listen(3000,()=>console.log('http://localhost:3000/olibia · http://localhost:3000/bia · http://localhost:3000/sistema'));
