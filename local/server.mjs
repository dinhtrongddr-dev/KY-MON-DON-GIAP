import http from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {runCodex,MODEL} from './codex-client.mjs';
import {prepareReading,RULE_VERSION,READING_PROTOCOL,readingIdentity} from './reading.mjs';
import {interpretReading} from './interpret.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
export function createBridge({token=randomBytes(24).toString('hex'),port=8765,runner=runCodex}={}){
 let busy=false;
 const origin=`http://127.0.0.1:${port}`;
 const allowed=new Set([origin,'https://kymon.tkgiongnoi2.chatgpt.site']);
 const files=new Set(['/index.html','/audit.html','/styles.css','/app.mjs','/guide.mjs','/qimen.mjs','/ai-local.mjs','/reading-core.mjs','/reading-focus.mjs','/reading-view.mjs','/favicon.svg','/favicon-32.png','/apple-touch-icon.png','/assets/taiji-ink.png','/vendor/lunar.js','/vendor/LICENSE.lunar-javascript']);
 const server=http.createServer(async(req,res)=>{
   const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
   res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
   if(req.headers.host!==`127.0.0.1:${port}`)return send(403,{error:'Host không hợp lệ.'});
   const requestOrigin=req.headers.origin;
   if(requestOrigin && !allowed.has(requestOrigin))return send(403,{error:'Nguồn truy cập không được phép.'});
   if(requestOrigin){res.setHeader('Access-Control-Allow-Origin',requestOrigin);res.setHeader('Vary','Origin');}
   if(req.method==='OPTIONS'){
     res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Qimen-Token');res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204);return res.end();
   }
   const path=new URL(req.url,origin).pathname;
   if(path.startsWith('/api/')){
     const value=Buffer.from(req.headers['x-qimen-token']||'');const expected=Buffer.from(token);
     if(value.length!==expected.length||!timingSafeEqual(value,expected))return send(401,{error:'Mã kết nối không đúng. Nhập mã hiện trong bộ kết nối AI.'});
     if(path==='/api/status'&&req.method==='GET')return send(200,{service:'qimen-local',model:MODEL,rules:RULE_VERSION,protocol:READING_PROTOCOL});
     if(path!=='/api/read'||req.method!=='POST')return send(404,{error:'Không có chức năng này.'});
     if(busy)return send(429,{error:'Đang có một lượt luận. Đợi lượt đó xong rồi thử lại.'});
     if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
     const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
     try{
       const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>16000)return send(413,{error:'Câu hỏi quá dài.'});chunks.push(c);}
       let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Dữ liệu JSON không hợp lệ.'});}
       let prepared;try{prepared=prepareReading(body);}catch(e){return send(400,{error:e.message});}
       const identity=await readingIdentity(prepared);
       if(body.rules!==RULE_VERSION || body.protocol!==READING_PROTOCOL || body.chartFingerprint!==identity.chartFingerprint || body.requestFingerprint!==identity.requestFingerprint) return send(409,{error:'Bàn hoặc bộ quy tắc của hai đầu kết nối không khớp. Cập nhật bộ kết nối và tải lại website.'});
       if(controller.signal.aborted)return;
       if(busy)return send(429,{error:'Đang có một lượt luận.'});busy=true;
       try{
         const result=await interpretReading(prepared,{runner,signal:controller.signal});
         if(!res.destroyed)send(200,{model:MODEL,rules:RULE_VERSION,protocol:READING_PROTOCOL,...identity,reading:result,facts:prepared.facts});
       }finally{busy=false;}
     }catch(e){if(!res.destroyed)send(502,{error:e.message||'Không kết nối được AI.'});}
     return;
   }
   const file=path==='/'?'/index.html':path;
   const qimenModule=/^\/qimen\/(core|analysis|modes|ai|schemas)\/[A-Za-z][A-Za-z0-9-]*\.mjs$/.test(file)||['/qimen/ui-controls.mjs','/qimen/ui-results.mjs'].includes(file);
   if(!['GET','HEAD'].includes(req.method)||(!files.has(file)&&!qimenModule))return send(404,{error:'Không tìm thấy.'});
   try{const data=await readFile(resolve(root,'.'+file));res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'text/plain');res.writeHead(200);res.end(req.method==='HEAD'?undefined:data);}catch{send(404,{error:'Thiếu tệp giao diện.'});}
 });
 return {server,token,origin};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const bridge=createBridge();
 bridge.server.on('error',e=>console.error(e.code==='EADDRINUSE'?'Cổng 8765 đang được dùng. Đóng server cũ rồi chạy lại.':'Không khởi động được server local.'));
 bridge.server.listen(8765,'127.0.0.1',()=>{
   console.log('Kỳ Môn Local • GPT-5.6 Sol\nMở trên máy tính: '+bridge.origin+'\nMã ghép nối: '+bridge.token+'\nGiữ cửa sổ này mở. Ctrl+C để dừng.');
 });
}
