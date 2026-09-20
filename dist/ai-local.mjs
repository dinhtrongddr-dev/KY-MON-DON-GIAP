import {buildReadingRequest,assertCompatible,validateReadingResponse} from './reading-core.mjs';
import {renderReading} from './reading-view.mjs';
import {AI_RELAY_ORIGIN} from './site-config.mjs';
import {initPdfExport} from './report-export.mjs';
import {createReadingJobClient} from './reading-job-client.mjs';
export function initLocalAi({prepare,activity=null,captureReportVisual}) {
 const $=id=>document.getElementById(id);
 const token=$('local-token'),remember=$('local-remember'),rememberHint=$('local-remember-hint');
 const status=$('ai-status'),answer=$('ai-answer'),read=$('ai-read'),cancel=$('ai-cancel'),check=$('local-check');
 const progress=$('ai-progress'),elapsed=$('ai-elapsed'),readLabel=read.textContent;
 const storageKey='qimen.ai.connection-code';
 let active=null,activeJobId=null,version=0,progressTimer=null,requestTimeout=null,activityReadingId=null;
 const track=(method,...args)=>{try{return activity?.[method]?.(...args)??null;}catch{return null;}};
 const endpoint=AI_RELAY_ORIGIN;
 const jobClient=createReadingJobClient({
   endpoint,
   getToken:()=>token.value.trim(),
   onRunning:()=>{status.textContent='AI vẫn đang luận trên server. Bạn có thể chuyển sang ứng dụng khác; khi quay lại kết quả sẽ tự cập nhật.';},
   onReconnect:()=>{status.textContent='Mất kết nối tạm thời. AI vẫn tiếp tục luận trên server; đang chờ kết nối lại để nhận kết quả.';}
 });
 const pdf=initPdfExport({kind:'question',buttonId:'report-pdf',statusId:'ai-status',prepare,boardSelector:'#qimen-board',captureReportVisual});
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
 const scrollToAnswer=()=>{const go=()=>answer.scrollIntoView?.({behavior:'smooth',block:'start'});if(typeof requestAnimationFrame==='function')requestAnimationFrame(go);else go();};
 const cancelWork=()=>{version++;const jobId=activeJobId;activeJobId=null;active?.abort();active=null;if(jobId)void jobClient.cancel(jobId);if(activityReadingId){track('finishReading',activityReadingId,{status:'cancelled'});activityReadingId=null;}finishWork();answer.hidden=true;answer.replaceChildren();pdf.clear();};
 const invalidate=()=>{cancelWork();status.textContent='Dữ liệu đã thay đổi. Bấm Luận bằng AI để luận câu hỏi và bàn mới.';};
 document.getElementById('chart-form').addEventListener('input',invalidate);
 document.getElementById('chart-form').addEventListener('change',invalidate);
 document.addEventListener('qimen-chart',invalidate);
 token.addEventListener('input',()=>{if(remember.checked)savePreference();cancelWork();status.textContent='Mã kết nối đã thay đổi; hãy kiểm tra kết nối.';});
 cancel.addEventListener('click',()=>{cancelWork();status.textContent='Đã hủy yêu cầu AI.';});
 async function call(path,body,signal){
   const connectionCode=token.value.trim();
   if(!connectionCode)throw new Error('Nhập mã kết nối AI. Mở hướng dẫn kết nối nếu cần trợ giúp.');
   if(connectionCode.length<4||connectionCode.length>128)throw new Error('Mã kết nối AI phải dài từ 4 đến 128 ký tự.');
   let response;try{response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{'X-Qimen-Token':connectionCode,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,credentials:'omit',cache:'no-store'});}catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;throw new Error('Không kết nối được AI. Kiểm tra bộ kết nối rồi thử lại.');}
   let data;try{data=await response.json();}catch{throw new Error('Kết nối AI trả dữ liệu không đọc được. Kiểm tra kết nối rồi thử lại.');}
   if(typeof data?.error==='string'&&data.error.trim())throw new Error(data.error);
   if(!response.ok)throw new Error('AI báo lỗi.');return data;
 }
 check.addEventListener('click',async()=>{
   cancelWork();const v=version,controller=startWork('Đang kiểm tra kết nối AI…',false,8000);
   try{
     const data=await call('/api/status',null,controller.signal);assertCompatible(data);
     if(v===version)status.textContent='Kết nối AI sẵn sàng.';
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
     status.textContent='AI đang gửi lượt luận lên server…';
     activityReadingId=track('startReading');
     const started=await jobClient.start('/api/read/start',prepared.request,controller.signal);
     let data=started.legacyResult;
     if(!data){
       activeJobId=started.jobId;
       clearTimeout(requestTimeout);requestTimeout=null;
       status.textContent=started.reused?'Đã nối lại lượt luận đang chạy trên server.':'AI đang luận trên server. Có thể chuyển sang ứng dụng khác; khi quay lại kết quả sẽ tự cập nhật.';
       data=await jobClient.wait(started.jobId,controller.signal);
       if(activeJobId===started.jobId)activeJobId=null;
     }
     if(v!==version)return;
     status.textContent='AI đang hoàn thiện bài luận…';
     renderReading(answer,validateReadingResponse(data,prepared),prepared);
     const activityStatus=data.reading.status==='verified_fallback'?'fallback':data.reading.status==='needs_clarification'?'clarification':'completed';
     if(activityReadingId){track('finishReading',activityReadingId,{status:activityStatus,modelUsed:data.modelUsed});activityReadingId=null;}
     const modelText=data.modelUsed?` · ${data.modelUsed.label} / ${data.modelUsed.effort}`:'';
     if(data.reading.status!=='needs_clarification')pdf.setModel(data.modelUsed,prepared);
     status.textContent=data.reading.status==='verified_fallback'?`Đã nhận bài luận AI${modelText}. Một số phần còn cần đối chiếu thêm.`:data.reading.status==='needs_clarification'?'Cần bổ sung thông tin để AI luận đúng sự việc.':`Đã nhận bài luận AI${modelText}.`;
     scrollToAnswer();
   }catch(e){if(activityReadingId){track('finishReading',activityReadingId,{status:controller.signal.aborted?'timeout':'error'});activityReadingId=null;}if(v===version)status.textContent=controller.signal.aborted?'Đã hết thời gian chờ. Kiểm tra kết nối AI rồi thử lại.':e.message;}finally{if(v===version){active=null;finishWork();}}
 });
}
