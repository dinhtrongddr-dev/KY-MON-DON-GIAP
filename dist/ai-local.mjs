import {buildReadingRequest,assertCompatible,validateReadingResponse,RULE_VERSION} from './reading-core.mjs';
import {renderReading} from './reading-view.mjs';
export function initLocalAi({prepare}) {
 const $=id=>document.getElementById(id);
 const token=$('local-token'),status=$('ai-status'),answer=$('ai-answer'),read=$('ai-read'),cancel=$('ai-cancel');
 let active=null,version=0;
 const endpoint='https://ky-mon-codex-relay.dinhtrongddr.workers.dev';
 const cancelWork=()=>{version++;active?.abort();active=null;read.disabled=false;cancel.hidden=true;answer.hidden=true;answer.replaceChildren();};
 const invalidate=()=>{cancelWork();status.textContent='Dữ liệu đã thay đổi. Bấm Luận bằng AI để luận câu hỏi và bàn mới.';};
 document.getElementById('chart-form').addEventListener('input',invalidate);
 document.getElementById('chart-form').addEventListener('change',invalidate);
 document.addEventListener('qimen-chart',invalidate);
 token.addEventListener('input',()=>{cancelWork();status.textContent='Mã ghép nối đã thay đổi; hãy kiểm tra kết nối.';});
 cancel.addEventListener('click',()=>{cancelWork();status.textContent='Đã hủy lượt luận.';});
 async function call(path,body,signal){
   if(!token.value.trim())throw new Error('Nhập mã kết nối AI. Mở hướng dẫn kết nối nếu cần trợ giúp.');
   let response;try{response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{'X-Qimen-Token':token.value.trim(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,credentials:'omit',cache:'no-store'});}catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;throw new Error('Không kết nối được AI. Kiểm tra bộ kết nối rồi thử lại.');}
   let data;try{data=await response.json();}catch{throw new Error('Kết nối AI trả dữ liệu không đọc được. Kiểm tra kết nối rồi thử lại.');}
   if(!response.ok)throw new Error(typeof data?.error==='string'?data.error:'AI báo lỗi.');return data;
 }
 $('local-check').addEventListener('click',async()=>{
   const v=++version;active?.abort();active=null;answer.hidden=true;read.disabled=false;cancel.hidden=true;
   status.textContent='Đang kiểm tra kết nối AI…';
   try{const data=await call('/api/status',null,AbortSignal.timeout(8000));assertCompatible(data);if(v===version)status.textContent=`Kết nối sẵn sàng · ${RULE_VERSION}. Quyền truy cập AI sẽ được kiểm tra khi bắt đầu luận.`;}catch(e){if(v===version)status.textContent=e.message||'Hết thời gian kiểm tra.';}
 });
 read.addEventListener('click',async()=>{
   cancelWork();let body;try{body=prepare();if(!body.question)throw new Error('Hãy nhập sự việc cần hỏi trước khi luận.');}catch(e){status.textContent=e.message;return;}
   const v=++version;active=new AbortController();const controller=active;
   const timeout=setTimeout(()=>controller.abort(),190000);read.disabled=true;cancel.hidden=false;status.textContent='AI đang phối hợp các tượng và kiểm tra diễn biến theo câu hỏi. Bài chuyên sâu có thể mất vài phút; bạn có thể Hủy.';
   try{
     const prepared=await buildReadingRequest(body);
     if(v!==version)return;
     const health=await call('/api/status',null,controller.signal);assertCompatible(health);
     if(v!==version)return;
     if(prepared.context.warnings.length)status.textContent=prepared.context.warnings.join(' ')+' AI đang luận…';
     const data=await call('/api/read',prepared.request,controller.signal);
     if(v!==version)return;
     renderReading(answer,validateReadingResponse(data,prepared),prepared);
     status.textContent='Đã nhận lời luận AI; căn cứ và mã bàn khớp lượt hỏi này. Nội dung diễn giải vẫn cần đối chiếu thực tế.';
   }catch(e){if(v===version)status.textContent=controller.signal.aborted?'Đã hết thời gian chờ. Kiểm tra kết nối AI rồi thử lại.':e.message;}finally{clearTimeout(timeout);if(v===version){active=null;read.disabled=false;cancel.hidden=true;}}
 });
}
