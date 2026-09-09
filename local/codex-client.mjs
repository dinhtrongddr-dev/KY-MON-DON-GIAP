import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {existsSync} from 'node:fs';
export const MODEL='gpt-5.6-sol';
function launcher(){
 const custom=process.env.QIMEN_CODEX_BIN;
 if(custom)return custom.endsWith('.js')?[process.execPath,[custom]]:[custom,[]];
 if(process.platform==='win32'){
   for(const p of (process.env.PATH||'').split(';')){
     const js=join(p,'node_modules','@openai','codex','bin','codex.js');
     if(existsSync(js))return [process.execPath,[js]];
     const exe=join(p,'codex.exe');if(existsSync(exe))return [exe,[]];
   }
 }
 return ['codex',[]];
}
export async function runCodex(instructions,input,schema,{signal,spawnProcess=spawn}={}) {
 const cwd=await mkdtemp(join(tmpdir(),'qimen-reading-'));
 let proc, timer, seq=0, finished=false;
 const pending=new Map(); let resolveTurn,rejectTurn,lastText='';
 const turnDone=new Promise((resolve,reject)=>{resolveTurn=resolve;rejectTurn=reject;});
 // Install rejection handler before initialize can fail.
 turnDone.catch(()=>{});
 const fail=(error)=>{for(const p of pending.values())p.reject(error);pending.clear();rejectTurn(error);};
 const abort=()=>{fail(new Error('Đã hủy hoặc hết thời gian chờ Codex.'));proc?.kill();};
 try {
   const env={...process.env}; delete env.OPENAI_API_KEY; delete env.CODEX_API_KEY;
   const [binary,prefix]=launcher();
   proc=spawnProcess(binary,[...prefix,'app-server','--listen','stdio://','-c','features.shell_tool=false','-c','features.unified_exec=false','-c','web_search="disabled"'],{cwd,env,shell:false,stdio:['pipe','pipe','pipe'],windowsHide:true});
   proc.stdin.on('error',()=>fail(new Error('Kết nối với Codex đã đóng.')));
   proc.on('error',()=>fail(new Error('Không khởi động được Codex CLI. Cài Codex CLI và chạy codex login trên máy này.')));
   proc.on('exit',()=>{if(!finished)fail(new Error('Codex đã đóng trước khi hoàn tất. Kiểm tra đăng nhập, phiên bản CLI và quyền dùng GPT-5.6 Sol.'));});
   proc.stderr.on('data',()=>{}); // Never expose CLI logs or authentication material to browser.
   const send=(m)=>proc.stdin.write(JSON.stringify(m)+'\n');
   const request=(method,params)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});send({id,method,params});});
   createInterface({input:proc.stdout}).on('line',line=>{
     let m;try{m=JSON.parse(line);}catch{return;}
     if(m.id!==undefined && m.method){send({id:m.id,error:{code:-32601,message:'This client does not allow tools or approval requests.'}});fail(new Error('Codex yêu cầu công cụ ngoài phạm vi luận; đã dừng.'));proc.kill();return;}
     if(m.id!==undefined){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error('Codex từ chối yêu cầu. Kiểm tra phiên bản CLI, đăng nhập và quyền dùng model.')):p.resolve(m.result);}return;}
     const item=m.params?.item;
     if(m.method==='item/started' && item && !['userMessage','agentMessage','reasoning'].includes(item.type)){fail(new Error('Lượt luận đã dừng vì Codex yêu cầu công cụ.'));proc.kill();return;}
     if(m.method==='item/completed' && item?.type==='agentMessage')lastText=item.text||lastText;
     if(m.method==='turn/completed'){if(m.params?.turn?.status==='completed')resolveTurn(lastText);else fail(new Error('Codex chưa hoàn tất lượt luận. Có thể đã hết hạn mức hoặc bị gián đoạn.'));}
   });
   timer=setTimeout(abort,180000);signal?.addEventListener('abort',abort,{once:true});
   if(signal?.aborted)throw new Error('Đã hủy.');
   await request('initialize',{clientInfo:{name:'qimen_local',title:'Kỳ Môn Local',version:'1.0.0'},capabilities:{experimentalApi:false}});
   send({method:'initialized',params:{}});
   const auth=await request('account/read',{refreshToken:false});
   if(auth.account?.type!=='chatgpt')throw new Error('Codex chưa đăng nhập bằng ChatGPT. Chạy codex login, chọn tài khoản ChatGPT rồi thử lại. Không dùng API key cho cầu nối này.');
   const started=await request('thread/start',{model:MODEL,cwd,approvalPolicy:'never',sandbox:'readOnly',ephemeral:true,baseInstructions:instructions});
   await request('turn/start',{threadId:started.thread.id,model:MODEL,effort:'medium',approvalPolicy:'never',sandboxPolicy:{type:'readOnly',access:{type:'restricted',includePlatformDefaults:false,readableRoots:[cwd]}},input:[{type:'text',text:JSON.stringify(input)}],outputSchema:schema});
   const text=await turnDone;
   try{return JSON.parse(text);}catch{throw new Error('Codex không trả JSON hợp lệ. Hãy thử lại.');}
 } finally {finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);proc?.kill();await rm(cwd,{recursive:true,force:true});}
}
