import {buildReadingRequest,assertCompatible,validateReadingResponse,RULE_VERSION} from './reading-core.mjs';
import {renderReading} from './reading-view.mjs';
import {AI_RELAY_ORIGIN} from './site-config.mjs';
export function initLocalAi({prepare}) {
 const $=id=>document.getElementById(id);
 const token=$('local-token'),remember=$('local-remember'),rememberHint=$('local-remember-hint');
 const status=$('ai-status'),answer=$('ai-answer'),read=$('ai-read'),cancel=$('ai-cancel'),check=$('local-check');
 const progress=$('ai-progress'),elapsed=$('ai-elapsed'),readLabel=read.textContent;
 const storageKey='qimen.ai.connection-code';
 let active=null,version=0,progressTimer=null,requestTimeout=null;
 const endpoint=AI_RELAY_ORIGIN;
 try{
   const saved=globalThis.localStorage?.getItem(storageKey)?.trim();
   if(saved){token.value=saved;remember.checked=true;rememberHint.textContent='Đã điền mã được ghi nhớ trên trình duyệt này.';}
 }catch{rememberHint.textContent='Trình duyệt không cho phép đọc mã đã lưu. Bạn vẫn có thể nhập mã để kết nối.';}
 const savePreference=()=>{
   try{
     const storage=globalThis.localStorage;
     if(!storage)throw new Error('Storage unavailable');
     const value=token.value.trim();
     if(remember.checked&&value)storage.setItem(storageKey,value);
     else storage.removeItem(storageKey);
     rememberHint.textContent=remember.checked
       ?(value?'Đã ghi nhớ mã trên trình duyệt này. Bỏ chọn để xóa mã đã lưu.':'Nhập mã kết nối để ghi nhớ trên trình duyệt này.')
       :'Không ghi nhớ mã sau khi đóng hoặc tải lại trang.';
   }catch{
     remember.checked=false;
     try{
       globalThis.localStorage?.removeItem(storageKey);
       rememberHint.textContent='Trình duyệt không thể ghi nhớ mã. Mã hiện tại chỉ dùng cho lần mở trang này.';
     }catch{rememberHint.textContent='Trình duyệt không cho phép cập nhật mã đã lưu. Bạn vẫn có thể nhập mã để kết nối.';}
   }
 };
 remember.addEventListener('change',savePreference);
 const finishWork=()=>{
   clearInterval(progressTimer);clearTimeout(requestTimeout);progressTimer=null;requestTimeout=null;
   progress.hidden=true;elapsed.hidden=true;answer.setAttribute('aria-busy','false');
   read.disabled=false;read.textContent=readLabel;check.disabled=false;cancel.hidden=true;
 };
 const startWork=(message,isReading,timeoutMs)=>{
   active=new AbortController();const controller=active,started=Date.now();
   const tick=()=>{elapsed.textContent=`Đã chờ ${Math.max(0,Math.floor((Date.now()-started)/1000))} giây`;};
   tick();progressTimer=setInterval(tick,1000);requestTimeout=setTimeout(()=>controller.abort(),timeoutMs);
   progress.hidden=false;elapsed.hidden=false;answer.setAttribute('aria-busy',String(isReading));
   read.disabled=true;check.disabled=true;cancel.hidden=false;
   read.textContent=isReading?'Đang luận AI…':readLabel;status.textContent=message;
   return controller;
 };
 const cancelWork=()=>{version++;active?.abort();active=null;finishWork();answer.hidden=true;answer.replaceChildren();};
 const invalidate=()=>{cancelWork();status.textContent='Dữ liệu đã thay đổi. Bấm Luận bằng AI để luận câu hỏi và bàn mới.';};
 document.getElementById('chart-form').addEventListener('input',invalidate);
 document.getElementById('chart-form').addEventListener('change',invalidate);
 document.addEventListener('qimen-chart',invalidate);
 token.addEventListener('input',()=>{if(remember.checked)savePreference();cancelWork();status.textContent='Mã kết nối đã thay đổi; hãy kiểm tra kết nối.';});
 cancel.addEventListener('click',()=>{cancelWork();status.textContent='Đã hủy yêu cầu AI.';});
 async function call(path,body,signal){
   if(!token.value.trim())throw new Error('Nhập mã kết nối AI. Mở hướng dẫn kết nối nếu cần trợ giúp.');
   let response;try{response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{'X-Qimen-Token':token.value.trim(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,credentials:'omit',cache:'no-store'});}catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;throw new Error('Không kết nối được AI. Kiểm tra bộ kết nối rồi thử lại.');}
   let data;try{data=await response.json();}catch{throw new Error('Kết nối AI trả dữ liệu không đọc được. Kiểm tra kết nối rồi thử lại.');}
   if(typeof data?.error==='string'&&data.error.trim())throw new Error(data.error);
   if(!response.ok)throw new Error('AI báo lỗi.');return data;
 }
 check.addEventListener('click',async()=>{
   cancelWork();const v=version,controller=startWork('Đang kiểm tra kết nối AI…',false,8000);
   try{
     const data=await call('/api/status',null,controller.signal);assertCompatible(data);
     if(v===version)status.textContent=`Kết nối sẵn sàng · ${RULE_VERSION}. Quyền truy cập AI sẽ được kiểm tra khi bắt đầu luận.`;
   }catch(e){if(v===version)status.textContent=controller.signal.aborted?'Hết thời gian kiểm tra kết nối. Hãy thử lại.':e.message;}
   finally{if(v===version){active=null;finishWork();}}
 });
 read.addEventListener('click',async()=>{
   cancelWork();let body;try{body=prepare();if(!body.question)throw new Error('Hãy nhập sự việc cần hỏi trước khi luận.');}catch(e){status.textContent=e.message;return;}
   const v=version,controller=startWork('Đang chuẩn bị dữ liệu bàn và câu hỏi…',true,610000);
   try{
     const prepared=await buildReadingRequest(body);
     if(v!==version)return;
     status.textContent='Đang kiểm tra kết nối AI…';
     const health=await call('/api/status',null,controller.signal);assertCompatible(health);
     if(v!==version)return;
     status.textContent=[...prepared.context.warnings,'AI đang ghép các căn cứ thành diễn biến cho sự việc đang hỏi. Bạn có thể Hủy trong lúc chờ.'].join(' ');
     const data=await call('/api/read',prepared.request,controller.signal);
     if(v!==version)return;
     status.textContent='Đang kiểm tra căn cứ và hoàn thiện bài luận…';
     renderReading(answer,validateReadingResponse(data,prepared),prepared);
     status.textContent=data.reading.status==='verified_fallback'?'AI chưa hoàn tất bài luận đủ căn cứ. Đang hiển thị phần dữ kiện đã tính để bạn đối chiếu.':data.reading.status==='needs_clarification'?'Cần bổ sung thông tin ảnh hưởng cách luận.':'Đã nhận lời luận AI; căn cứ và mã bàn khớp lượt hỏi này. Nội dung diễn giải vẫn cần đối chiếu thực tế.';
   }catch(e){if(v===version)status.textContent=controller.signal.aborted?'Đã hết thời gian chờ. Kiểm tra kết nối AI rồi thử lại.':e.message;}finally{if(v===version){active=null;finishWork();}}
 });
}
