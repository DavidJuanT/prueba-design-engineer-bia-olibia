import http from 'node:http';
import fs from 'node:fs';
// /bia sirve la tarea 2; cualquier otra ruta, el dashboard de Olibia (tarea 1).
http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(req.url.startsWith('/bia') ? 'dist/bia.html' : 'dist/index.html'))}).listen(3000,()=>console.log('http://localhost:3000 · http://localhost:3000/bia'));
