// Read-only QA harness. No API proxy, credentials, or production deployment.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const docs=new URL('../docs/writer-layer/regression/',import.meta.url);
const page=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Writer QA · develop</title>
<style>body{margin:20px;background:#102226;color:#e7edef;font:16px system-ui}button,select{font:inherit;padding:8px;margin:4px}iframe{border:1px solid #547075;display:block;height:850px;max-width:100%;background:#102226}</style>
<h1>Writer QA · develop</h1><label>Bài mẫu <select id="case"><option value="menh">Cao Thị Thảo Trang</option><option value="question">Nghỉ việc chăm con</option></select></label>
<button id="desktop">Desktop 1100 px</button><button id="mobile">Mobile 390 px</button><p id="size">Khung đọc: 1100 px</p><iframe title="Bài luận thử nghiệm" id="reading" width="1100" src="/__qa/frame?kind=menh"></iframe><script src="/__qa/controls.js"></script></html>`;
const controls=`const frame=document.getElementById('reading');document.getElementById('case').onchange=e=>{frame.src='/__qa/frame?kind='+e.target.value};for(const [id,width] of [['desktop',1100],['mobile',390]])document.getElementById(id).onclick=()=>{frame.width=width;document.getElementById('size').textContent='Khung đọc: '+width+' px'};`;
const frame=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bài luận · QA</title><link rel="stylesheet" href="/styles.css"><style>body{margin:0;padding:20px;min-width:0}#qa-reading{max-width:900px;margin:auto}</style><main id="qa-reading"></main><script type="module" src="/__qa/render.mjs"></script></html>`;
const render=`import {renderSurfaceReading} from '/reading-format.mjs';const kind=new URLSearchParams(location.search).get('kind');const r=await fetch('/__qa/reading?kind='+kind).then(x=>x.json());renderSurfaceReading(document.getElementById('qa-reading'),r.reading);document.body.dataset.status=r.status;`;
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://localhost');
  try{
    let body,type='text/html; charset=utf-8';
    if(url.pathname==='/__qa')body=page;
    else if(url.pathname==='/__qa/controls.js'){body=controls;type='text/javascript';}
    else if(url.pathname==='/__qa/frame')body=frame;
    else if(url.pathname==='/__qa/render.mjs'){body=render;type='text/javascript';}
    else if(url.pathname==='/__qa/reading'){
      const kind=url.searchParams.get('kind');if(!['menh','question'].includes(kind))throw Error('unknown case');
      try{body=await readFile(new URL(kind+'-live.json',docs));}catch{body=await readFile(new URL(kind+'-fallback.json',docs));}type='application/json';
    }else{
      const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
      if(!path.startsWith(root.endsWith(sep)?root:root+sep))throw Error('outside dist');
      body=await readFile(path);type=({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'})[extname(path)]||type;
    }
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'});res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(8879,'127.0.0.1',()=>console.log('Read-only writer QA: http://127.0.0.1:8879/__qa'));
