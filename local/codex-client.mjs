import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {mkdtemp,rm} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {existsSync} from 'node:fs';

function runtimeFromEnv(env=process.env){
 const router=(env.QIMEN_AI_ROUTER||'').trim().toLowerCase();
 const is9Router=router==='9router';
 const model=(env.QIMEN_MODEL||'').trim()||(is9Router?'qimen-smart':'gpt-6-astra');
 const effort=(env.QIMEN_REASONING_EFFORT||'').trim()||(is9Router?'auto':'ultra');
 const provider=(env.QIMEN_CODEX_PROVIDER||'').trim();
 return {router:is9Router?'9router':'chatgpt',is9Router,model,effort,provider};
}

export const RUNTIME=runtimeFromEnv();
export const ROUTING_MODE=RUNTIME.router;
export const MODEL=RUNTIME.model;
export const REASONING_EFFORT=RUNTIME.effort;
export const READING_TIMEOUT_MS=600000;

function modelLabel(model){return model==='gpt-6-astra'?'GPT-6 Astra':model;}
function codexHome(){
 if(process.env.QIMEN_CODEX_HOME)return resolve(process.env.QIMEN_CODEX_HOME);
 if(process.platform==='win32'&&process.env.LOCALAPPDATA)return join(process.env.LOCALAPPDATA,'KyMonCodex','codex-home');
 return join(homedir(),'.qimen-codex');
}
function launcher(){
 const custom=process.env.QIMEN_CODEX_BIN||process.env.CODEX_CLI_PATH;
 if(custom){
   const binary=resolve(custom);
   if(!existsSync(binary))throw new Error('Đường dẫn Codex CLI không tồn tại. Kiểm tra QIMEN_CODEX_BIN.');
   return binary.toLowerCase().endsWith('.js')?[process.execPath,[binary]]:[binary,[]];
 }
 if(process.platform==='win32'){
   for(const p of (process.env.PATH||'').split(';')){
     const js=join(p,'node_modules','@openai','codex','bin','codex.js');
     if(existsSync(js))return [process.execPath,[js]];
     const exe=join(p,'codex.exe');if(existsSync(exe))return [exe,[]];
   }
 }
 return ['codex',[]];
}
function verify9RouterEnv(env,runtime){
 if(!runtime.is9Router)return;
 if(runtime.provider)return;
 const base=env.OPENAI_BASE_URL?.trim();
 const key=env.OPENAI_API_KEY?.trim();
 if(!base||!key)throw new Error('Chế độ 9router cần QIMEN_CODEX_PROVIDER hoặc OPENAI_BASE_URL + OPENAI_API_KEY của 9router.');
 let url;try{url=new URL(base);}catch{throw new Error('OPENAI_BASE_URL của 9router không hợp lệ.');}
 const local=['127.0.0.1','localhost','::1'].includes(url.hostname);
 if(!local||url.port!=='20128')throw new Error('Bridge chỉ cho phép 9router local tại cổng 20128 trên VPS.');
}
async function requireModel(request,runtime){
 let cursor=null;
 for(let page=0;page<20;page++){
   const result=await request('model/list',{cursor,includeHidden:true,limit:100});
   const model=result.data?.find(item=>item.model===runtime.model||item.id===runtime.model);
   if(model){
     if(runtime.effort!=='auto'&&!model.supportedReasoningEfforts?.some(item=>item.reasoningEffort===runtime.effort))throw new Error(`${modelLabel(runtime.model)} không hỗ trợ mức suy luận ${runtime.effort} trên tài khoản/CLI này.`);
     return;
   }
   cursor=result.nextCursor;if(!cursor)break;
 }
 throw new Error(`Tài khoản Codex hiện không có quyền dùng ${modelLabel(runtime.model)}. Cầu nối không tự đổi model.`);
}
function verifyPermissions(config,cwd){
 const profile=config?.permissions?.['qimen-reader'];
 const entries=Object.entries(profile?.filesystem||{}).filter(([,value])=>value!==null);
 const roots=Object.values(profile?.workspace_roots||{}).some(Boolean);
 if(config?.sandbox_mode!=null||config?.default_permissions!=='qimen-reader'||profile?.extends||roots||profile?.network?.enabled!==false||entries.length!==1||entries[0][1]!=='read'||resolve(entries[0][0])!==resolve(cwd)||(process.platform==='win32'&&config?.windows?.sandbox!=='elevated')){
   throw new Error('Cấu hình quyền đọc không đúng. Cần profile qimen-reader chỉ đọc thư mục tạm; không dùng sandbox_mode cũ hoặc mở rộng quyền.');
 }
}
async function stopProcess(proc){
 if(!proc||proc.exitCode!==null)return;
 await new Promise(resolve=>{
   let timer;const done=()=>{clearTimeout(timer);resolve();};
   proc.once('exit',done);timer=setTimeout(done,2000);timer.unref?.();
   try{proc.kill();}catch{done();}
 });
}
function turnFailure(error,runtime){
 if(error?.codexErrorInfo==='usageLimitExceeded')return new Error(runtime.is9Router?'9router chưa tìm được route còn hạn mức. Kiểm tra account pool/combo rồi thử lại.':'Tài khoản ChatGPT của Kỳ Môn đã hết hạn mức Codex. Chờ hạn mức được đặt lại rồi thử lại.');
 return new Error(runtime.is9Router?'AI chưa hoàn tất lượt luận qua 9router. Kiểm tra 9router, combo/model và provider rồi thử lại.':'AI chưa hoàn tất lượt luận. Kiểm tra hạn mức, đăng nhập và kết nối Codex rồi thử lại.');
}
export async function runCodex(instructions,input,schema,{signal,spawnProcess=spawn,runtime=runtimeFromEnv()}={}) {
 if(signal?.aborted)throw new Error('Đã hủy.');
 const cwd=await mkdtemp(join(tmpdir(),'qimen-reading-'));
 let proc, timer, seq=0, finished=false,threadId=null,turnId=null;
 const pending=new Map(); let resolveTurn,rejectTurn,lastText='';
 const turnDone=new Promise((resolve,reject)=>{resolveTurn=resolve;rejectTurn=reject;});
 turnDone.catch(()=>{});
 const fail=(error)=>{for(const p of pending.values())p.reject(error);pending.clear();rejectTurn(error);};
 const abort=()=>{
   if(threadId&&turnId&&proc?.stdin?.writable){
     try{proc.stdin.write(JSON.stringify({id:++seq,method:'turn/interrupt',params:{threadId,turnId}})+'\n');}catch{}
   }
   fail(new Error('Đã hủy hoặc hết thời gian chờ AI.'));proc?.kill();
 };
 try {
   const env={...process.env,CODEX_HOME:codexHome()};
   delete env.QIMEN_PAIRING_TOKEN;
   if(runtime.is9Router)verify9RouterEnv(env,runtime);
   else for(const key of ['OPENAI_API_KEY','CODEX_API_KEY','CODEX_ACCESS_TOKEN','OPENAI_BASE_URL'])delete env[key];
   const [binary,prefix]=launcher();
   const config=['approval_policy="never"','features.shell_tool=false','features.unified_exec=false','web_search="disabled"','default_permissions="qimen-reader"',
     'permissions.qimen-reader.filesystem={'+JSON.stringify(cwd.replaceAll('\\','/'))+'="read"}','permissions.qimen-reader.network.enabled=false'];
   if(runtime.provider)config.push('model_provider='+JSON.stringify(runtime.provider));
   if(process.platform==='win32')config.push('windows.sandbox="elevated"');
   proc=spawnProcess(binary,[...prefix,'app-server','--listen','stdio://',...config.flatMap(value=>['-c',value])],{cwd,env,shell:false,stdio:['pipe','pipe','pipe'],windowsHide:true});
   proc.stdin.on('error',()=>fail(new Error('Kết nối với AI đã đóng.')));
   proc.on('error',()=>fail(new Error('Không khởi động được bộ kết nối AI. Xem lại hướng dẫn cài đặt rồi thử lại.')));
   proc.on('exit',()=>{if(!finished)fail(new Error('AI đã dừng trước khi hoàn tất. Kiểm tra kết nối và quyền truy cập rồi thử lại.'));});
   proc.stderr.on('data',()=>{});
   let outputBytes=0;
   proc.stdout.on('data',chunk=>{outputBytes+=Buffer.byteLength(chunk);if(outputBytes>4*1024*1024){fail(new Error('Phản hồi AI vượt giới hạn an toàn. Hãy rút gọn câu hỏi.'));proc.kill();}});
   const send=(m)=>proc.stdin.write(JSON.stringify(m)+'\n');
   const request=(method,params)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});send({id,method,params});});
   createInterface({input:proc.stdout}).on('line',line=>{
     let m;try{m=JSON.parse(line);}catch{return;}
     if(m.id!==undefined && m.method){send({id:m.id,error:{code:-32601,message:'This client does not allow tools or approval requests.'}});fail(new Error('AI yêu cầu công cụ ngoài phạm vi luận; đã dừng.'));proc.kill();return;}
     if(m.id!==undefined){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(runtime.is9Router?'9router/Codex từ chối yêu cầu. Kiểm tra route, key và cấu hình provider.':'AI từ chối yêu cầu. Kiểm tra kết nối, đăng nhập và sandbox Windows elevated của Codex.')):p.resolve(m.result);}return;}
     if(m.method==='error'){fail(turnFailure(m.params?.error,runtime));proc.kill();return;}
     const item=m.params?.item;
     if(m.method==='item/started' && item && !['userMessage','agentMessage','reasoning'].includes(item.type)){fail(new Error('Lượt luận đã dừng vì AI yêu cầu công cụ ngoài phạm vi.'));proc.kill();return;}
     if(m.method==='item/completed' && item?.type==='agentMessage')lastText=item.text||lastText;
     if(m.method==='turn/completed'){if(m.params?.turn?.status==='completed')resolveTurn(lastText);else fail(turnFailure(m.params?.turn?.error,runtime));}
   });
   timer=setTimeout(abort,READING_TIMEOUT_MS);signal?.addEventListener('abort',abort,{once:true});
   if(signal?.aborted)throw new Error('Đã hủy.');
   await request('initialize',{clientInfo:{name:'qimen_local',title:'Kỳ Môn Local',version:'5.1.0'},capabilities:{experimentalApi:false}});
   send({method:'initialized',params:{}});
   if(!runtime.is9Router){
     const auth=await request('account/read',{refreshToken:false});
     if(auth.account?.type!=='chatgpt')throw new Error('AI chưa được đăng nhập đúng tài khoản ChatGPT. Mở LOGIN-WINDOWS.cmd để đăng nhập hồ sơ Kỳ Môn rồi thử lại.');
   }
   verifyPermissions((await request('config/read',{includeLayers:false,cwd})).config,cwd);
   if(!runtime.is9Router)await requireModel(request,runtime);
   const started=await request('thread/start',{model:runtime.model,cwd,approvalPolicy:'never',ephemeral:true,baseInstructions:instructions});
   if((!runtime.is9Router&&started.model!==runtime.model)||started.sandbox?.type!=='readOnly'||started.sandbox?.networkAccess!==false)throw new Error('Codex không giữ đúng model hoặc sandbox chỉ đọc. Đã dừng lượt luận.');
   threadId=started.thread.id;
   const turnParams={threadId,model:runtime.model,approvalPolicy:'never',input:[{type:'text',text:JSON.stringify(input)}],outputSchema:schema};
   if(runtime.effort!=='auto')turnParams.effort=runtime.effort;
   const turn=await request('turn/start',turnParams);
   turnId=turn.turn.id;
   const text=await turnDone;
   try{return JSON.parse(text);}catch{throw new Error('AI trả kết quả chưa hợp lệ. Hãy thử lại.');}
 } finally {
   finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
   await stopProcess(proc);
   try{await rm(cwd,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch{}
 }
}
