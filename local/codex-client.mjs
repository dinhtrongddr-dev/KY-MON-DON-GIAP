import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {mkdtemp,rm} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {existsSync} from 'node:fs';
export const MODEL='gpt-6-astra';
export const REASONING_EFFORT='high';
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
async function requireModel(request){
 let cursor=null;
 for(let page=0;page<20;page++){
   const result=await request('model/list',{cursor,includeHidden:true,limit:100});
   const model=result.data?.find(item=>item.model===MODEL||item.id===MODEL);
   if(model){
     if(!model.supportedReasoningEfforts?.some(item=>item.reasoningEffort===REASONING_EFFORT))throw new Error('GPT-6 Astra không hỗ trợ mức suy luận high trên tài khoản/CLI này.');
     return;
   }
   cursor=result.nextCursor;if(!cursor)break;
 }
 throw new Error('Tài khoản Codex hiện không có quyền dùng GPT-6 Astra. Cầu nối không tự đổi model.');
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
function turnFailure(error){
 if(error?.codexErrorInfo==='usageLimitExceeded')return new Error('Tài khoản ChatGPT của Kỳ Môn đã hết hạn mức Codex. Chờ hạn mức được đặt lại rồi thử lại.');
 return new Error('AI chưa hoàn tất lượt luận. Kiểm tra hạn mức, đăng nhập và kết nối Codex rồi thử lại.');
}
export async function runCodex(instructions,input,schema,{signal,spawnProcess=spawn}={}) {
 if(signal?.aborted)throw new Error('Đã hủy.');
 const cwd=await mkdtemp(join(tmpdir(),'qimen-reading-'));
 let proc, timer, seq=0, finished=false,threadId=null,turnId=null;
 const pending=new Map(); let resolveTurn,rejectTurn,lastText='';
 const turnDone=new Promise((resolve,reject)=>{resolveTurn=resolve;rejectTurn=reject;});
 // Install rejection handler before initialize can fail.
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
   for(const key of ['OPENAI_API_KEY','CODEX_API_KEY','CODEX_ACCESS_TOKEN','OPENAI_BASE_URL','QIMEN_PAIRING_TOKEN'])delete env[key];
   const [binary,prefix]=launcher();
   // Codex 0.154 enforces restricted reads through permission profiles, not readOnly.access.
   const config=['approval_policy="never"','features.shell_tool=false','features.unified_exec=false','web_search="disabled"','default_permissions="qimen-reader"',
     'permissions.qimen-reader.filesystem={'+JSON.stringify(cwd.replaceAll('\\','/'))+'="read"}','permissions.qimen-reader.network.enabled=false'];
   if(process.platform==='win32')config.push('windows.sandbox="elevated"');
   proc=spawnProcess(binary,[...prefix,'app-server','--listen','stdio://',...config.flatMap(value=>['-c',value])],{cwd,env,shell:false,stdio:['pipe','pipe','pipe'],windowsHide:true});
   proc.stdin.on('error',()=>fail(new Error('Kết nối với AI đã đóng.')));
   proc.on('error',()=>fail(new Error('Không khởi động được bộ kết nối AI. Xem lại hướng dẫn cài đặt rồi thử lại.')));
   proc.on('exit',()=>{if(!finished)fail(new Error('AI đã dừng trước khi hoàn tất. Kiểm tra kết nối và quyền truy cập rồi thử lại.'));});
   proc.stderr.on('data',()=>{}); // Never expose CLI logs or authentication material to browser.
   let outputBytes=0;
   proc.stdout.on('data',chunk=>{outputBytes+=Buffer.byteLength(chunk);if(outputBytes>4*1024*1024){fail(new Error('Phản hồi AI vượt giới hạn an toàn. Hãy rút gọn câu hỏi.'));proc.kill();}});
   const send=(m)=>proc.stdin.write(JSON.stringify(m)+'\n');
   const request=(method,params)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});send({id,method,params});});
   createInterface({input:proc.stdout}).on('line',line=>{
     let m;try{m=JSON.parse(line);}catch{return;}
     if(m.id!==undefined && m.method){send({id:m.id,error:{code:-32601,message:'This client does not allow tools or approval requests.'}});fail(new Error('AI yêu cầu công cụ ngoài phạm vi luận; đã dừng.'));proc.kill();return;}
     if(m.id!==undefined){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error('AI từ chối yêu cầu. Kiểm tra kết nối, đăng nhập và sandbox Windows elevated của Codex.')):p.resolve(m.result);}return;}
     if(m.method==='error'){fail(turnFailure(m.params?.error));proc.kill();return;}
     const item=m.params?.item;
     if(m.method==='item/started' && item && !['userMessage','agentMessage','reasoning'].includes(item.type)){fail(new Error('Lượt luận đã dừng vì AI yêu cầu công cụ ngoài phạm vi.'));proc.kill();return;}
     if(m.method==='item/completed' && item?.type==='agentMessage')lastText=item.text||lastText;
     if(m.method==='turn/completed'){if(m.params?.turn?.status==='completed')resolveTurn(lastText);else fail(turnFailure(m.params?.turn?.error));}
   });
   timer=setTimeout(abort,180000);signal?.addEventListener('abort',abort,{once:true});
   if(signal?.aborted)throw new Error('Đã hủy.');
   await request('initialize',{clientInfo:{name:'qimen_local',title:'Kỳ Môn Local',version:'5.0.0'},capabilities:{experimentalApi:false}});
   send({method:'initialized',params:{}});
   const auth=await request('account/read',{refreshToken:false});
   if(auth.account?.type!=='chatgpt')throw new Error('AI chưa được đăng nhập đúng tài khoản ChatGPT. Mở LOGIN-WINDOWS.cmd để đăng nhập hồ sơ Kỳ Môn rồi thử lại.');
   verifyPermissions((await request('config/read',{includeLayers:false,cwd})).config,cwd);
   await requireModel(request);
   const started=await request('thread/start',{model:MODEL,cwd,approvalPolicy:'never',ephemeral:true,baseInstructions:instructions});
   if(started.model!==MODEL||started.sandbox?.type!=='readOnly'||started.sandbox?.networkAccess!==false)throw new Error('Codex không giữ đúng model hoặc sandbox chỉ đọc. Đã dừng lượt luận.');
   threadId=started.thread.id;
   // Legacy sandbox overrides would replace the restricted profile selected above.
   const turn=await request('turn/start',{threadId,model:MODEL,effort:REASONING_EFFORT,approvalPolicy:'never',input:[{type:'text',text:JSON.stringify(input)}],outputSchema:schema});
   turnId=turn.turn.id;
   const text=await turnDone;
   try{return JSON.parse(text);}catch{throw new Error('AI trả kết quả chưa hợp lệ. Hãy thử lại.');}
 } finally {
   finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
   await stopProcess(proc);
   try{await rm(cwd,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch{}
 }
}
