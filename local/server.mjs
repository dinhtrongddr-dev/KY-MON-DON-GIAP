import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {runAI,MODEL,REASONING_EFFORT,ROUTING_MODE,aiRouteOf,writerProviderFromEnv} from './ai-client.mjs';
import {runSurfaceText} from './surface-writer.mjs';
import {prepareReading,RULE_VERSION,READING_PROTOCOL,readingIdentity} from './reading.mjs';
import {interpretReading} from './interpret.mjs';
import {prepareMenhReading,menhReadingIdentity,MENH_RULE_VERSION,MENH_PROTOCOL} from './menh-reading.mjs';
import {interpretMenhReading} from './menh-interpret.mjs';
import {createActivityStore,defaultActivityPath} from './activity-store.mjs';
import {defaultAiDiagnosticPath,recordAiDiagnostic} from './ai-diagnostics.mjs';
import {SITE_ORIGIN,ALLOWED_WEB_ORIGINS} from '../dist/site-config.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';
import {NIANMING_VERSION} from '../dist/qimen/analysis/nianmingEngine.mjs';
import {defaultShareDir,loadShare,pruneShares,renderSharePage,saveShare} from './share-store.mjs';
import {createOutcomeRegistry,defaultOutcomeRegistryPath} from './outcome-registry.mjs';
import {OUTCOME_REGISTRY_VERSION,VALIDATION_VERSION} from '../dist/qimen/validation/protocol.mjs';
import {NARRATIVE_VERSION} from '../dist/qimen/ai/narrativePrimitives.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const TUNNEL_SUFFIX='.trycloudflare.com';
const KEEPALIVE_CHUNK=' '.repeat(2048);

function validatePairingToken(value){
 const token=String(value||'').trim();
 if(token.length<4||token.length>128)throw new Error('Mã ghép nối cấu hình phải dài từ 4 đến 128 ký tự.');
 return token;
}
function defaultPairingToken(){
 const configured=process.env.QIMEN_PAIRING_TOKEN?.trim();
 if(configured)return validatePairingToken(configured);
 return randomBytes(24).toString('hex');
}
function configuredTunnelHostname(){
 return (process.env.QIMEN_TUNNEL_HOSTNAME||'').trim().toLowerCase();
}

export function parseAllowedHost(value,port=8765,tunnelHostname=configuredTunnelHostname()){
 if(typeof value!=='string')return false;
 try{
   const parsed=new URL('http://'+value);
   const hostname=parsed.hostname.toLowerCase();
   if((hostname==='127.0.0.1'||hostname==='localhost')&&parsed.port===String(port))return {type:'local',hostname};
   if(tunnelHostname){
     if(hostname===tunnelHostname&&(parsed.port===''||parsed.port==='443'))return {type:'tunnel',hostname};
     return false;
   }
   if(hostname.length>TUNNEL_SUFFIX.length&&hostname.endsWith(TUNNEL_SUFFIX)&&(parsed.port===''||parsed.port==='443'))return {type:'tunnel',hostname};
   return false;
 }catch{return false;}
}
export function isAllowedOrigin(value,port,host){
 if(value===`http://127.0.0.1:${port}`||value===`http://localhost:${port}`||ALLOWED_WEB_ORIGINS.includes(value))return true;
 if(host?.type==='tunnel'&&value===`https://${host.hostname}`)return true;
 return false;
}
export function createBridge({token=defaultPairingToken(),port=8765,runner=runSurfaceText,reviewer=runAI,diagnostics=recordAiDiagnostic,activityStore=createActivityStore(),outcomeRegistry=createOutcomeRegistry(),keepAliveAfterMs=75000,keepAliveEveryMs=15000,tunnelHostname=configuredTunnelHostname(),shareDir=defaultShareDir()}={}){
 token=validatePairingToken(token);
 let busy=false,activeJob=null;
 const jobs=new Map(),JOB_TTL_MS=30*60*1000,JOB_ID=/^[A-Za-z0-9_-]{20,64}$/;
 const origin=`http://127.0.0.1:${port}`;
 const failures=new Map(),activityClients=new Map();
 const track=(method,...args)=>{try{return activityStore?.[method]?.(...args)??null;}catch{return null;}};
 const pruneJobs=()=>{
   const cutoff=Date.now()-JOB_TTL_MS;
   for(const [id,job] of jobs)if(job.finishedAt&&job.finishedAt<cutoff)jobs.delete(id);
   const finished=[...jobs.values()].filter(job=>job.finishedAt).sort((a,b)=>a.finishedAt-b.finishedAt);
   while(jobs.size>20&&finished.length){const job=finished.shift();jobs.delete(job.id);}
 };
 const readingData=(isMenh,prepared,identity,result)=>{
   const used=aiRouteOf(result);
   const modelUsed=used?{id:used.modelId,label:used.label,provider:used.provider,routeLabel:used.routeLabel,effort:used.effort,fallbackIndex:used.fallbackIndex}:null;
   const data=isMenh
     ?{router:used?.provider||ROUTING_MODE,model:used?.modelId||MODEL,reasoningEffort:used?.effort||REASONING_EFFORT,modelUsed,menhRules:MENH_RULE_VERSION,menhProtocol:MENH_PROTOCOL,caseRules:CASE_ENGINE_VERSION,...identity,reading:result}
     :{router:used?.provider||ROUTING_MODE,model:used?.modelId||MODEL,reasoningEffort:used?.effort||REASONING_EFFORT,modelUsed,rules:RULE_VERSION,protocol:READING_PROTOCOL,caseRules:CASE_ENGINE_VERSION,nianmingRules:NIANMING_VERSION,...identity,reading:result,facts:prepared.facts};
   return {data,modelUsed};
 };
 const startReadingJob=({isMenh,prepared,identity})=>{
   pruneJobs();
   const kind=isMenh?'menh':'question',fingerprint=identity.requestFingerprint;
   if(busy){
     if(activeJob?.status==='running'&&activeJob.kind===kind&&activeJob.requestFingerprint===fingerprint)return {job:activeJob,reused:true};
     return null;
   }
   const job={id:randomBytes(18).toString('base64url'),kind,requestFingerprint:fingerprint,status:'running',createdAt:Date.now(),finishedAt:0,result:null,error:null,controller:new AbortController()};
   jobs.set(job.id,job);activeJob=job;busy=true;
   job.promise=(async()=>{
     let activityReadingId=track('startReading');
     try{
       const result=isMenh?await interpretMenhReading(prepared,{runner,reviewer,signal:job.controller.signal}):await interpretReading(prepared,{runner,reviewer,signal:job.controller.signal});
       const {data,modelUsed}=readingData(isMenh,prepared,identity,result);
       const activityStatus=result.status==='verified_fallback'?'fallback':result.status==='needs_clarification'?'clarification':'completed';
       if(activityReadingId){track('finishReading',activityReadingId,{status:activityStatus,modelUsed});activityReadingId=null;}
       job.result=data;job.status='completed';
     }catch(e){
       const cancelled=job.controller.signal.aborted;
       diagnostics?.({type:'request_failure',flow:kind,stage:'async_job',code:e?.code||'AI_REQUEST_ERROR',fallbackAllowed:false,message:e?.message||String(e)});
       if(activityReadingId){track('finishReading',activityReadingId,{status:cancelled?'cancelled':'error'});activityReadingId=null;}
       job.error=cancelled?'Đã hủy lượt luận.':(e?.message||'Không kết nối được AI.');
       job.status=cancelled?'cancelled':'error';
     }finally{
       job.finishedAt=Date.now();
       if(activeJob===job)activeJob=null;
       busy=false;pruneJobs();
     }
   })();
   return {job,reused:false};
 };
 const files=new Set(['/index.html','/menh.html','/guide.html','/server.html','/info.html','/audit.html','/styles.css','/app.mjs','/menh-app.mjs','/menh-ai.mjs','/menh-view.mjs','/activity-log.mjs','/guide.mjs','/info.mjs','/qimen.mjs','/ai-local.mjs','/ai-progress-estimate.mjs','/report-export.mjs','/question-report.mjs','/share-view.mjs','/reading-core.mjs','/reading-job-client.mjs','/menh-reading-core.mjs','/menh-core.mjs','/reading-focus.mjs','/reading-view.mjs','/spirit-activation-ui.mjs','/favicon.svg','/favicon-32.png','/apple-touch-icon.png','/assets/taiji-ink.png','/assets/meditating-side-user.jpg','/vendor/lunar.js','/vendor/LICENSE.lunar-javascript']);
 const server=http.createServer(async(req,res)=>{
   const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
   res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
   res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
   res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://ky-mon-codex-relay.dinhtrongddr.workers.dev https://ai-origin.kymon.pp.ua; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
   const host=parseAllowedHost(req.headers.host,port,tunnelHostname);
   if(!host)return send(403,{error:'Host không hợp lệ.'});
   const requestUrl=new URL(req.url,origin),path=requestUrl.pathname;
   const requestOrigin=req.headers.origin;
   const publicShareMatch=/^\/api\/share\/([A-Za-z0-9_-]{20,64})$/.exec(path);
   const fetchSite=String(req.headers['sec-fetch-site']||'').toLowerCase();
   const noOriginTunnelRequest=host.type==='tunnel'&&!requestOrigin&&(!fetchSite||fetchSite==='same-origin'||fetchSite==='same-site'||fetchSite==='none');
   if(path.startsWith('/api/')&&((host.type==='tunnel'&&!requestOrigin&&!noOriginTunnelRequest)||(requestOrigin&&!isAllowedOrigin(requestOrigin,port,host))))return send(403,{error:'Nguồn truy cập không được phép.'});
   if(requestOrigin){res.setHeader('Access-Control-Allow-Origin',requestOrigin);res.setHeader('Vary','Origin');}
   if(req.method==='OPTIONS'){
     res.setHeader('Access-Control-Allow-Methods','POST, GET, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Qimen-Token');res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204);return res.end();
   }
   if(path.startsWith('/api/')){
     if(publicShareMatch&&req.method==='GET'){
       const record=await loadShare(shareDir,publicShareMatch[1]);
       if(!record)return send(404,{error:'Link chia sẻ không tồn tại hoặc đã hết hạn.'});
       return send(200,{id:record.id,kind:record.kind,createdAt:record.createdAt,expiresAt:record.expiresAt,snapshot:record.snapshot||null});
     }
     const relayClient=String(req.headers['x-qimen-client']||'');
     const client=/^[a-f0-9]{64}$/i.test(relayClient)?relayClient:String(req.headers['cf-connecting-ip']||req.socket.remoteAddress||'unknown').slice(0,128);
     const now=Date.now();
     if(path==='/api/activity'&&req.method==='GET')return send(200,{activity:activityStore.summary(requestUrl.searchParams.get('tzOffset'))});
     if(path==='/api/activity/chart'&&req.method==='POST'){
       let usage=activityClients.get(client);if(!usage||now-usage.startedAt>=3_600_000)usage={startedAt:now,count:0};
       if(usage.count>=300){res.setHeader('Retry-After','3600');return send(429,{error:'Quá nhiều lượt lập bàn trong một giờ.'});}
       usage.count++;activityClients.set(client,usage);track('recordChart');
       return send(200,{ok:true,activity:activityStore.summary(requestUrl.searchParams.get('tzOffset'))});
     }
     const value=Buffer.from(req.headers['x-qimen-token']||'');const expected=Buffer.from(token);
     let failure=failures.get(client);
     if(failure&&failure.blockedUntil>now){res.setHeader('Retry-After','600');return send(429,{error:'Quá nhiều lần nhập sai mã. Thử lại sau 10 phút.'});}
     if(failure&&now-failure.startedAt>300000){failures.delete(client);failure=null;}
     if(value.length!==expected.length||!timingSafeEqual(value,expected)){
       failure=failure||{startedAt:now,count:0,blockedUntil:0};failure.count++;
       if(failure.count>=8)failure.blockedUntil=now+600000;
       failures.set(client,failure);
       if(failure.blockedUntil){res.setHeader('Retry-After','600');return send(429,{error:'Quá nhiều lần nhập sai mã. Thử lại sau 10 phút.'});}
       return send(401,{error:'Mã ghép nối không đúng. Nhập mã hiển thị trong cửa sổ server.'});
     }
     failures.delete(client);
     if(path==='/api/share'&&req.method==='POST'){
       if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
       try{
         const chunks=[];let size=0;
         for await(const c of req){size+=c.length;if(size>256000)return send(413,{error:'Dữ liệu chia sẻ quá lớn.'});chunks.push(c);}
         let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Dữ liệu JSON không hợp lệ.'});}
         const record=await saveShare(shareDir,body);
         const publicOrigin=host.type==='tunnel'?('https://'+host.hostname):origin;
         return send(201,{id:record.id,url:publicOrigin+'/s/'+record.id,createdAt:record.createdAt,expiresAt:record.expiresAt});
       }catch(e){return send(400,{error:e.message||'Không tạo được link chia sẻ.'});}
     }
     if(path==='/api/validation/report'&&req.method==='GET'){
       try{return send(200,{validationRules:VALIDATION_VERSION,outcomeRegistryRules:OUTCOME_REGISTRY_VERSION,report:outcomeRegistry.report()});}
       catch(e){return send(500,{error:e.message||'Không đọc được báo cáo validation.'});}
     }
     if(path==='/api/validation/register'&&req.method==='POST'){
       if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
       const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>24000)return send(413,{error:'Dữ liệu validation quá lớn.'});chunks.push(c);}
       let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Dữ liệu JSON không hợp lệ.'});}
       const requestBody=body?.request;let prepared,identity;
       try{prepared=prepareReading(requestBody);identity=await readingIdentity(prepared);}catch(e){return send(400,{error:e.message});}
       const mismatch=requestBody?.rules!==RULE_VERSION||requestBody?.protocol!==READING_PROTOCOL||requestBody?.caseRules!==CASE_ENGINE_VERSION||requestBody?.nianmingRules!==NIANMING_VERSION||requestBody?.chartFingerprint!==identity.chartFingerprint||requestBody?.requestFingerprint!==identity.requestFingerprint;
       if(mismatch)return send(409,{error:'Snapshot validation không khớp bàn hoặc bộ quy tắc hiện tại.'});
       try{
         const result=outcomeRegistry.registerPrepared({...prepared,...identity,request:requestBody},{track:body?.track||'MONITORING',evaluationUnitRef:body?.evaluationUnitRef||null});
         return send(result.reused?200:201,{validationRules:VALIDATION_VERSION,outcomeRegistryRules:OUTCOME_REGISTRY_VERSION,reused:result.reused,record:result.record});
       }catch(e){return send(400,{error:e.message||'Không đăng ký được snapshot validation.'});}
     }
     if(path==='/api/validation/outcome'&&req.method==='POST'){
       if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
       const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>16000)return send(413,{error:'Dữ liệu outcome quá lớn.'});chunks.push(c);}
       let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Dữ liệu JSON không hợp lệ.'});}
       try{
         const record=outcomeRegistry.recordOutcome(body?.recordId,body?.outcome);
         return send(200,{validationRules:VALIDATION_VERSION,outcomeRegistryRules:OUTCOME_REGISTRY_VERSION,record});
       }catch(e){return send(400,{error:e.message||'Không ghi nhận được outcome.'});}
     }
     if(path==='/api/status'&&req.method==='GET')return send(200,{service:'qimen-local',router:ROUTING_MODE,model:MODEL,reasoningEffort:REASONING_EFFORT,writerProvider:writerProviderFromEnv(),writerModel:writerProviderFromEnv()==='chatgpt2api'?(process.env.CHATGPT2API_WRITER_MODEL||'gpt-5-6'):MODEL,writerEffort:writerProviderFromEnv()==='chatgpt2api'?(process.env.CHATGPT2API_REASONING_EFFORT||'xhigh'):REASONING_EFFORT,pipelineVersion:NARRATIVE_VERSION,rules:RULE_VERSION,protocol:READING_PROTOCOL,menhRules:MENH_RULE_VERSION,menhProtocol:MENH_PROTOCOL,caseRules:CASE_ENGINE_VERSION,nianmingRules:NIANMING_VERSION,validationRules:VALIDATION_VERSION,outcomeRegistryRules:OUTCOME_REGISTRY_VERSION,timeZoneRuntime:'Intl/IANA',tzdbVersion:process.versions.tz||null,access:host.type==='tunnel'?'internet':'local'});
     const jobMatch=/^\/api\/jobs\/([A-Za-z0-9_-]{20,64})$/.exec(path);
     if(jobMatch&&['GET','DELETE'].includes(req.method)){
       pruneJobs();const job=jobs.get(jobMatch[1]);
       if(!job)return send(404,{error:'Lượt luận không tồn tại hoặc đã hết thời gian lưu.'});
       if(req.method==='DELETE'){
         if(job.status==='running')job.controller.abort();
         return send(202,{jobId:job.id,status:job.status==='running'?'cancelling':job.status});
       }
       if(job.status==='completed')return send(200,{jobId:job.id,status:'completed',result:job.result});
       if(job.status==='error'||job.status==='cancelled')return send(200,{jobId:job.id,status:job.status,error:job.error});
       return send(200,{jobId:job.id,status:'running',createdAt:job.createdAt});
     }
     const isAsyncMenhStart=path==='/api/menh/read/start'&&req.method==='POST';
     const isAsyncQuestionStart=path==='/api/read/start'&&req.method==='POST';
     if(isAsyncQuestionStart||isAsyncMenhStart){
       if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
       const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>16000)return send(413,{error:'Câu hỏi quá dài.'});chunks.push(c);}
       let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Dữ liệu JSON không hợp lệ.'});}
       const isMenh=isAsyncMenhStart;let prepared,identity;
       try{
         prepared=isMenh?prepareMenhReading(body):prepareReading(body);
         identity=isMenh?await menhReadingIdentity(prepared):await readingIdentity(prepared);
       }catch(e){return send(400,{error:e.message});}
       const identityMismatch=isMenh
         ? body.rules!==MENH_RULE_VERSION||body.protocol!==MENH_PROTOCOL||body.caseRules!==CASE_ENGINE_VERSION||body.deterministicFingerprint!==identity.deterministicFingerprint||body.requestFingerprint!==identity.requestFingerprint
         : body.rules!==RULE_VERSION||body.protocol!==READING_PROTOCOL||body.caseRules!==CASE_ENGINE_VERSION||body.nianmingRules!==NIANMING_VERSION||body.chartFingerprint!==identity.chartFingerprint||body.requestFingerprint!==identity.requestFingerprint;
       if(identityMismatch)return send(409,{error:body.timePlace?.mode==='iana_civil'?'Dữ liệu múi giờ IANA giữa trình duyệt và server không khớp tại thời điểm này. Cập nhật trình duyệt/server hoặc tạm dùng UTC offset cố định rồi thử lại.':'Bàn hoặc bộ quy tắc của hai đầu kết nối không khớp. Cập nhật bộ kết nối và tải lại website.'});
       const started=startReadingJob({isMenh,prepared,identity});
       if(!started)return send(429,{error:'Đang có một lượt luận khác. Đợi lượt đó xong rồi thử lại.'});
       return send(202,{jobId:started.job.id,status:started.job.status,reused:started.reused});
     }
     const isMenhRead=path==='/api/menh/read'&&req.method==='POST';
     const isQuestionRead=path==='/api/read'&&req.method==='POST';
     if(!isQuestionRead&&!isMenhRead)return send(404,{error:'Không có chức năng này.'});
     if(busy)return send(429,{error:'Đang có một lượt luận. Đợi lượt đó xong rồi thử lại.'});
     if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Cần dữ liệu JSON.'});
     const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
     let activityReadingId=null;
     try{
       const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>16000)return send(413,{error:'Câu hỏi quá dài.'});chunks.push(c);}
       let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Dữ liệu JSON không hợp lệ.'});}
       let prepared,identity;
       try{
         prepared=isMenhRead?prepareMenhReading(body):prepareReading(body);
         identity=isMenhRead?await menhReadingIdentity(prepared):await readingIdentity(prepared);
       }catch(e){return send(400,{error:e.message});}
       const identityMismatch=isMenhRead
         ? body.rules!==MENH_RULE_VERSION||body.protocol!==MENH_PROTOCOL||body.caseRules!==CASE_ENGINE_VERSION||body.deterministicFingerprint!==identity.deterministicFingerprint||body.requestFingerprint!==identity.requestFingerprint
         : body.rules!==RULE_VERSION||body.protocol!==READING_PROTOCOL||body.caseRules!==CASE_ENGINE_VERSION||body.nianmingRules!==NIANMING_VERSION||body.chartFingerprint!==identity.chartFingerprint||body.requestFingerprint!==identity.requestFingerprint;
       if(identityMismatch)return send(409,{error:body.timePlace?.mode==='iana_civil'?'Dữ liệu múi giờ IANA giữa trình duyệt và server không khớp tại thời điểm này. Cập nhật trình duyệt/server hoặc tạm dùng UTC offset cố định rồi thử lại.':'Bàn hoặc bộ quy tắc của hai đầu kết nối không khớp. Cập nhật bộ kết nối và tải lại website.'});
       if(controller.signal.aborted)return;
       if(busy)return send(429,{error:'Đang có một lượt luận.'});busy=true;
       activityReadingId=track('startReading');
        let keepAliveTimer,keepAliveInterval,streaming=false;
        const stopKeepAlive=()=>{clearTimeout(keepAliveTimer);clearInterval(keepAliveInterval);};
        if(host.type==='tunnel'){
          keepAliveTimer=setTimeout(()=>{
            if(res.destroyed||res.writableEnded)return;
            streaming=true;
            res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
            res.write(KEEPALIVE_CHUNK);
            keepAliveInterval=setInterval(()=>{if(!res.destroyed&&!res.writableEnded)res.write(KEEPALIVE_CHUNK);},keepAliveEveryMs);
            keepAliveInterval.unref?.();
          },keepAliveAfterMs);
          keepAliveTimer.unref?.();
          res.once('close',stopKeepAlive);
        }
        try{
          const result=isMenhRead?await interpretMenhReading(prepared,{runner,reviewer,signal:controller.signal}):await interpretReading(prepared,{runner,reviewer,signal:controller.signal});
          const used=aiRouteOf(result);
          const modelUsed=used?{id:used.modelId,label:used.label,provider:used.provider,routeLabel:used.routeLabel,effort:used.effort,fallbackIndex:used.fallbackIndex}:null;
          const activityStatus=result.status==='verified_fallback'?'fallback':result.status==='needs_clarification'?'clarification':'completed';
          if(activityReadingId){track('finishReading',activityReadingId,{status:activityStatus,modelUsed});activityReadingId=null;}
          if(!res.destroyed){
            const data=isMenhRead
              ?{router:used?.provider||ROUTING_MODE,model:used?.modelId||MODEL,reasoningEffort:used?.effort||REASONING_EFFORT,modelUsed,menhRules:MENH_RULE_VERSION,menhProtocol:MENH_PROTOCOL,caseRules:CASE_ENGINE_VERSION,...identity,reading:result}
              :{router:used?.provider||ROUTING_MODE,model:used?.modelId||MODEL,reasoningEffort:used?.effort||REASONING_EFFORT,modelUsed,rules:RULE_VERSION,protocol:READING_PROTOCOL,caseRules:CASE_ENGINE_VERSION,nianmingRules:NIANMING_VERSION,...identity,reading:result,facts:prepared.facts};
            stopKeepAlive();
            streaming?res.end(JSON.stringify(data)):send(200,data);
          }
        }finally{stopKeepAlive();busy=false;}
      }catch(e){
        diagnostics?.({type:'request_failure',flow:isMenhRead?'menh':'question',stage:'request',code:e?.code||'AI_REQUEST_ERROR',fallbackAllowed:false,message:e?.message||String(e)});
        if(activityReadingId){track('finishReading',activityReadingId,{status:controller.signal.aborted?'cancelled':'error'});activityReadingId=null;}
        if(!res.destroyed){
          const data={error:e.message||'Không kết nối được AI.'};
          if(res.headersSent)res.end(JSON.stringify(data));
          else send(502,data);
        }
      }
     return;
   }
   const shareMatch=/^\/s\/([A-Za-z0-9_-]{20,64})$/.exec(path);
   if(shareMatch&&['GET','HEAD'].includes(req.method)){
     const record=await loadShare(shareDir,shareMatch[1]);
     if(!record){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow, noarchive'});return res.end(req.method==='HEAD'?undefined:'<!doctype html><meta charset="utf-8"><title>Link không tồn tại</title><p>Link chia sẻ không tồn tại hoặc đã bị xóa.</p>');}
     if(record.snapshot?.html){
       const appOrigin=host.hostname.endsWith(TUNNEL_SUFFIX)?('https://'+host.hostname):SITE_ORIGIN;
       const target=appOrigin+(record.kind==='menh'?'/menh.html':'/')+'?share='+encodeURIComponent(record.id);
       res.writeHead(302,{Location:target,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'});return res.end();
     }
     const page=renderSharePage(record);
     res.setHeader('Content-Type','text/html; charset=utf-8');
     res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
     res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
     res.writeHead(200);return res.end(req.method==='HEAD'?undefined:page);
   }
   if(host.type==='tunnel'){
     res.writeHead(302,{Location:SITE_ORIGIN+'/','Cache-Control':'no-store'});
     return res.end();
   }
   const file=path==='/'?'/index.html':path;
   const qimenModule=/^\/qimen\/(core|analysis|modes|ai|schemas|semantic|validation|case)\/[A-Za-z][A-Za-z0-9-]*\.mjs$/.test(file)||/^\/qimen\/menh\/(?:[A-Za-z0-9-]+\/)*[A-Za-z][A-Za-z0-9-]*\.mjs$/.test(file)||['/qimen/ui-controls.mjs','/qimen/ui-results.mjs','/qimen/timePlace.mjs','/site-config.mjs','/reading-format.mjs'].includes(file);
   if(!['GET','HEAD'].includes(req.method)||(!files.has(file)&&!qimenModule&&file!=='/downloads/ky-mon-ai.zip'))return send(404,{error:'Không tìm thấy.'});
   try{
     const data=await readFile(resolve(root,'.'+file));
     res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.zip':'application/zip'})[extname(file)]||'text/plain');res.writeHead(200);res.end(req.method==='HEAD'?undefined:data);
   }catch{send(404,{error:'Thiếu tệp giao diện.'});}
 });
 const sharePruneTimer=setInterval(()=>{pruneShares(shareDir).catch(()=>{});},6*60*60*1000);sharePruneTimer.unref?.();
 pruneShares(shareDir).catch(()=>{});
 server.on('close',()=>clearInterval(sharePruneTimer));
 return {server,token,origin};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const activityStore=createActivityStore({filePath:defaultActivityPath()});
 const outcomeRegistry=createOutcomeRegistry({filePath:defaultOutcomeRegistryPath()});
 const bridge=createBridge({activityStore,outcomeRegistry});
 bridge.server.on('error',e=>console.error(e.code==='EADDRINUSE'?'Cổng 8765 đang được dùng. Đóng server cũ rồi chạy lại.':'Không khởi động được server local.'));
 bridge.server.listen(8765,'127.0.0.1',()=>{
   console.log(`Kỳ Môn AI • ${ROUTING_MODE} • ${MODEL}\nMở trên máy chủ: ${bridge.origin}\nMã ghép nối: ${bridge.token}\nNhật ký lỗi AI: ${defaultAiDiagnosticPath()}\nOutcome registry: ${defaultOutcomeRegistryPath()}\nBridge chỉ nghe trên loopback; dùng Cloudflare Tunnel để nối Worker.`);
   if(process.platform==='win32'&&process.env.QIMEN_OPEN_BROWSER==='1'){
     const browser=spawn('rundll32.exe',['url.dll,FileProtocolHandler',SITE_ORIGIN+'/'],{detached:true,stdio:'ignore',windowsHide:true});
     browser.unref();
   }
 });
}
