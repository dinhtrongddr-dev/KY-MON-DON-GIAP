export function initLocalAi({prepare}) {
 const $=id=>document.getElementById(id);
 const token=$('local-token'),status=$('ai-status'),answer=$('ai-answer'),read=$('ai-read'),cancel=$('ai-cancel');
 let active=null,version=0;
 const endpoint='http://127.0.0.1:8765';
 const cancelWork=()=>{version++;active?.abort();active=null;read.disabled=false;cancel.hidden=true;answer.hidden=true;answer.replaceChildren();};
 const invalidate=()=>{cancelWork();status.textContent='Dữ liệu đã thay đổi. Bấm Luận bằng AI để luận câu hỏi và bàn mới.';};
 document.getElementById('chart-form').addEventListener('input',invalidate);
 document.getElementById('chart-form').addEventListener('change',invalidate);
 document.addEventListener('qimen-chart',invalidate);
 token.addEventListener('input',()=>{cancelWork();status.textContent='Mã ghép nối đã thay đổi; hãy kiểm tra kết nối.';});
 cancel.addEventListener('click',()=>{cancelWork();status.textContent='Đã hủy lượt luận.';});
 async function call(path,body,signal){
   if(!token.value.trim())throw new Error('Nhập mã ghép nối từ cửa sổ server local. Mở hướng dẫn kết nối nếu chưa chạy server.');
   let response;try{response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{'X-Qimen-Token':token.value.trim(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,credentials:'omit',cache:'no-store'});}catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;throw new Error('Không kết nối được server local. Kiểm tra server đang mở trên cùng máy. Nếu trình duyệt chặn, mở bản local theo hướng dẫn.');}
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Server local báo lỗi.');return data;
 }
 $('local-check').addEventListener('click',async()=>{
   const v=++version;active?.abort();active=null;answer.hidden=true;read.disabled=false;cancel.hidden=true;
   status.textContent='Đang kiểm tra server local…';
   try{const data=await call('/api/status',null,AbortSignal.timeout(8000));if(v===version)status.textContent=`Đã kết nối server local · ${data.model}. Đăng nhập Codex sẽ được kiểm tra khi luận.`;}catch(e){if(v===version)status.textContent=e.message||'Hết thời gian kiểm tra.';}
 });
 const node=(tag,text,parent)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
 function render(data){
   const r=data.reading;answer.replaceChildren();
   node('h3',r.status==='needs_clarification'?'Cần làm rõ câu hỏi':'Luận theo bàn hiện tại',answer);
   node('p',r.summary,answer);
   const list=(title,items)=>{if(!items.length)return;node('h3',title,answer);const ul=node('ul','',answer);items.forEach(s=>node('li',s,ul));};
   list('Giả định khi luận',r.assumptions);
   for(const item of r.assessments){const section=node('section','',answer);section.className='ai-assessment';node('h3',item.title,section);node('p',item.interpretation,section);const details=node('details','',section);node('summary','Xem căn cứ trên bàn',details);for(const id of item.evidence_ids){node('p',data.facts[id]||'Không tìm thấy căn cứ.',details);if(/^p[1-9]$/.test(id)){const button=node('button','Chọn cung '+id.slice(1),details);button.type='button';button.className='jump-cung';button.addEventListener('click',()=>{const p=document.querySelector(`[data-palace="${id.slice(1)}"]`);p?.click();document.querySelector(`[data-palace="${id.slice(1)}"]`)?.scrollIntoView({block:'center',behavior:'smooth'});});}}}
   list('Cần bổ sung',r.questions);list('Việc nên kiểm tra thực tế',r.next_steps);
   node('p',`${data.model} · Bộ quy tắc ${data.rules} · Diễn giải tham khảo, cần đối chiếu căn cứ.`,answer);answer.hidden=false;
 }
 read.addEventListener('click',async()=>{
   cancelWork();let body;try{body=prepare();if(!body.question)throw new Error('Hãy nhập sự việc cần hỏi trước khi luận.');}catch(e){status.textContent=e.message;return;}
   const v=++version;active=new AbortController();const controller=active;
   const timeout=setTimeout(()=>controller.abort(),190000);read.disabled=true;cancel.hidden=false;status.textContent='Codex đang luận câu hỏi dựa trên bàn. Giữ server local mở…';
   try{const data=await call('/api/read',body,controller.signal);if(v!==version)return;render(data);status.textContent='Đã nhận lời luận từ Codex trên máy tính.';}catch(e){if(v===version)status.textContent=controller.signal.aborted?'Đã hết thời gian chờ. Kiểm tra Codex và thử lại.':e.message;}finally{clearTimeout(timeout);if(v===version){active=null;read.disabled=false;cancel.hidden=true;}}
 });
}
