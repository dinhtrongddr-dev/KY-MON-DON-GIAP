import http from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {runCodex,MODEL} from './codex-client.mjs';
import {prepareReading,INSTRUCTIONS,readingSchema,validateReading,RULE_VERSION} from './reading.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
export function createBridge({token=randomBytes(24).toString('hex'),port=8765,runner=runCodex}={}){
 let busy=false;
 const origin=`http://127.0.0.1:${port}`;
 const allowed=new Set([origin,'https://kymon.tkgiongnoi2.chatgpt.site']);
 const files=new Set(['/index.html','/styles.css','/app.mjs','/guide.mjs','/qimen.mjs','/ai-local.mjs','/vendor/lunar.js','/vendor/LICENSE.lunar-javascript']);
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
     if(value.length!==expected.length||!timingSafeEqual(value,expected))return send(401,{error:'Mã ghép nối không đúng. Nhập mã hiển thị trong cửa sổ server local.'});
     if(path==='/api/status'&&req.method==='GET')return send(200,{service:'qimen-local',model:MODEL,rules:RULE_VERSION});
     if(path!=='/api/read'||req.method!=='POST')return send(404,{error:'Không có chức năng này.'});
     if(busy)return send(429,{error:'Đang có một lượt luận. Đợi lượt đó xong rồi thử lại.'});
     if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
     const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
     try{
       const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>16000)return send(413,{error:'Câu hỏi quá dài.'});chunks.push(c);}
       let prepared;try{prepared=prepareReading(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(e){return send(400,{error:e.message});}
       if(busy)return send(429,{error:'Đang có một lượt luận.'});busy=true;
       try{
         const result=validateReading(await runner(INSTRUCTIONS,prepared.context,readingSchema(prepared.facts),{signal:controller.signal}),prepared.facts);
         send(200,{model:MODEL,rules:RULE_VERSION,reading:result,facts:prepared.facts});
       }finally{busy=false;}
     }catch(e){if(!res.destroyed)send(502,{error:e.message||'Không kết nối được Codex.'});}
     return;
   }
   const file=path==='/'?'/index.html':path;
   if(!['GET','HEAD'].includes(req.method)||!files.has(file))return send(404,{error:'Không tìm thấy.'});
   try{const data=await readFile(resolve(root,'.'+file));res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8'})[extname(file)]||'text/plain');res.writeHead(200);res.end(req.method==='HEAD'?undefined:data);}catch{send(404,{error:'Thiếu tệp giao diện.'});}
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
