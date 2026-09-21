import {buildMenhReadingRequest,assertMenhCompatible,validateMenhReadingResponse} from './menh-reading-core.mjs';
import {renderMenhAi} from './menh-view.mjs';
import {AI_RELAY_ORIGIN} from './site-config.mjs';
import {initPdfExport} from './report-export.mjs';
import {createReadingJobClient} from './reading-job-client.mjs';

export function initMenhAi({prepare,activity=null}){
  const $=id=>document.getElementById(id);
  const token=$('local-token'),remember=$('local-remember'),rememberHint=$('local-remember-hint');
  const status=$('menh-ai-status'),answer=$('menh-ai-answer'),read=$('menh-ai-read'),cancel=$('menh-ai-cancel'),check=$('menh-local-check'),resultSwitch=$('menh-result-switch');
  const tokenShell=$('menh-ai-token-shell'),connectionIcon=$('menh-ai-connection-icon');
  const progress=$('menh-ai-progress'),elapsed=$('menh-ai-elapsed'),readLabel=read.textContent;
  const storageKey='qimen.ai.connection-code';
  let active=null,activeJobId=null,version=0,progressTimer=null,requestTimeout=null,activityReadingId=null;
  const track=(method,...args)=>{try{return activity?.[method]?.(...args)??null;}catch{return null;}};
  const pdf=initPdfExport({kind:'menh',buttonId:'menh-report-pdf',statusId:'menh-ai-status',tokenId:'local-token',prepare,boardSelector:'#menh-deterministic .menh-qimen-board'});
  const setConnectionState=(state)=>{
    if(!tokenShell||!connectionIcon)return;
    const map={
      connected:{glyph:'✓',label:'AI đã kết nối'},
      checking:{glyph:'…',label:'Đang kiểm tra kết nối AI'},
      disconnected:{glyph:'×',label:'AI chưa kết nối'},
    },next=map[state]||map.disconnected;
    tokenShell.dataset.state=state in map?state:'disconnected';
    connectionIcon.textContent=next.glyph;
    connectionIcon.setAttribute('aria-label',next.label);
    connectionIcon.title=next.label;
  };
  setConnectionState('disconnected');
  let floatingAiReady=false;
  const setSwitchTarget=target=>{
    if(!resultSwitch)return;
    const aiTarget=target==='ai'&&floatingAiReady;
    resultSwitch.dataset.target=aiTarget?'ai':'board';
    resultSwitch.textContent=aiTarget?'AI':'Bàn';
    resultSwitch.setAttribute('aria-label',aiTarget?'Xem phần luận AI':'Xem bàn Kỳ Môn');
    resultSwitch.classList.toggle('is-ready',floatingAiReady);
  };
  const setFloatingAiReady=ready=>{floatingAiReady=!!ready;setSwitchTarget('board');};
  setFloatingAiReady(false);
  resultSwitch?.addEventListener('click',()=>{
    if(resultSwitch.disabled)return;
    if(resultSwitch.dataset.target==='ai'&&floatingAiReady&&!answer.hidden&&answer.childElementCount){
      answer.scrollIntoView?.({behavior:'smooth',block:'start'});
      setSwitchTarget('board');
      return;
    }
    const boardTarget=document.querySelector('#menh-deterministic .menh-workspace .board-column, #menh-deterministic .menh-board-unknown, #menh-deterministic .menh-board-section');
    if(!boardTarget)return;
    boardTarget.scrollIntoView?.({behavior:'smooth',block:'start'});
    setSwitchTarget(floatingAiReady?'ai':'board');
  });
  const jobClient=createReadingJobClient({
    endpoint:AI_RELAY_ORIGIN,
    getToken:()=>token.value.trim(),
    onRunning:()=>{status.textContent='AI vẫn đang luận Mệnh trên server. Bạn có thể chuyển sang ứng dụng khác; khi quay lại kết quả sẽ tự cập nhật.';},
    onReconnect:()=>{status.textContent='Mất kết nối tạm thời. AI vẫn tiếp tục luận trên server; đang chờ kết nối lại để nhận kết quả.';}
  });
  try{
    const saved=globalThis.localStorage?.getItem(storageKey)?.trim();
    if(saved){token.value=saved;remember.checked=true;rememberHint.textContent='Đã điền mã được ghi nhớ trên trình duyệt này.';}
  }catch{rememberHint.textContent='Trình duyệt không cho phép đọc mã đã lưu. Bạn vẫn có thể nhập mã để kết nối.';}
  const savePreference=()=>{
    try{
      const storage=globalThis.localStorage;if(!storage)throw new Error('Storage unavailable');
      const value=token.value.trim();
      if(remember.checked&&value)storage.setItem(storageKey,value);else storage.removeItem(storageKey);
      rememberHint.textContent=remember.checked?(value?'Đã ghi nhớ mã trên trình duyệt này.':'Nhập mã kết nối để ghi nhớ.'):'Không ghi nhớ mã sau khi đóng hoặc tải lại trang.';
    }catch{remember.checked=false;rememberHint.textContent='Trình duyệt không thể ghi nhớ mã. Mã hiện tại chỉ dùng trong lần mở trang này.';}
  };
  remember.addEventListener('change',savePreference);
  const finish=()=>{
    clearInterval(progressTimer);clearTimeout(requestTimeout);progressTimer=null;requestTimeout=null;
    progress.hidden=true;elapsed.hidden=true;answer.setAttribute('aria-busy','false');
    read.disabled=false;read.textContent=readLabel;check.disabled=false;cancel.hidden=true;
  };
  const start=(message,timeoutMs)=>{
    active=new AbortController();const controller=active,started=Date.now();
    const tick=()=>{elapsed.textContent='Đã chờ '+Math.max(0,Math.floor((Date.now()-started)/1000))+' giây';};
    tick();progressTimer=setInterval(tick,1000);requestTimeout=setTimeout(()=>controller.abort(),timeoutMs);
    progress.hidden=false;elapsed.hidden=false;answer.setAttribute('aria-busy','true');
    read.disabled=true;check.disabled=true;cancel.hidden=false;read.textContent='Đang luận Mệnh…';status.textContent=message;
    return controller;
  };
  const scrollToAnswer=()=>{const go=()=>answer.scrollIntoView?.({behavior:'smooth',block:'start'});if(typeof requestAnimationFrame==='function')requestAnimationFrame(go);else go();};
  const cancelWork=()=>{version++;const jobId=activeJobId;activeJobId=null;active?.abort();active=null;if(jobId)void jobClient.cancel(jobId);if(activityReadingId){track('finishReading',activityReadingId,{status:'cancelled'});activityReadingId=null;}finish();pdf.clear();};
  const invalidate=()=>{cancelWork();answer.hidden=true;answer.replaceChildren();setFloatingAiReady(false);status.textContent='Dữ kiện sinh đã thay đổi. Phân tích lại trước khi dùng AI.';};
  document.getElementById('menh-form').addEventListener('input',invalidate);
  document.getElementById('menh-form').addEventListener('change',invalidate);
  token.addEventListener('input',()=>{if(remember.checked)savePreference();cancelWork();setConnectionState('disconnected');status.textContent='Mã kết nối đã thay đổi; hãy kiểm tra kết nối.';});
  cancel.addEventListener('click',()=>{const wasChecking=tokenShell?.dataset.state==='checking';cancelWork();if(wasChecking)setConnectionState('disconnected');status.textContent='Đã hủy yêu cầu AI.';});
  async function call(path,body,signal){
    const connectionCode=token.value.trim();
    if(!connectionCode)throw new Error('Nhập mã kết nối AI.');
    if(connectionCode.length<4||connectionCode.length>128)throw new Error('Mã kết nối AI phải dài từ 4 đến 128 ký tự.');
    let response;
    try{response=await fetch(AI_RELAY_ORIGIN+path,{method:body?'POST':'GET',headers:{'X-Qimen-Token':connectionCode,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,credentials:'omit',cache:'no-store'});}
    catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;throw new Error('Không kết nối được AI. Kiểm tra bộ kết nối rồi thử lại.');}
    let data;try{data=await response.json();}catch{throw new Error('Kết nối AI trả dữ liệu không đọc được.');}
    if(typeof data?.error==='string'&&data.error.trim())throw new Error(data.error);
    if(!response.ok)throw new Error('AI báo lỗi.');
    return data;
  }
  check.addEventListener('click',async()=>{
    cancelWork();setConnectionState('checking');const v=version,controller=start('Đang kiểm tra kết nối AI…',8000);
    try{const data=await call('/api/status',null,controller.signal);assertMenhCompatible(data);if(v===version){setConnectionState('connected');status.textContent='AI đã kết nối · sẵn sàng.';}}
    catch(e){if(v===version){setConnectionState('disconnected');status.textContent=controller.signal.aborted?'Hết thời gian kiểm tra kết nối.':e.message;}}
    finally{if(v===version){active=null;finish();}}
  });
  read.addEventListener('click',async()=>{
    cancelWork();let body;
    try{body=prepare();}catch(e){status.textContent=e.message;return;}
    const v=version,controller=start('Đang chuẩn bị Mệnh bàn để AI phân tích…',610000);
    try{
      const prepared=await buildMenhReadingRequest(body);if(v!==version)return;
      setConnectionState('checking');const health=await call('/api/status',null,controller.signal);assertMenhCompatible(health);if(v!==version)return;
      setConnectionState('connected');status.textContent='AI đang gửi lượt luận Mệnh lên server…';
      activityReadingId=track('startReading');
      const started=await jobClient.start('/api/menh/read/start',prepared.request,controller.signal);
      let data=started.legacyResult;
      if(!data){
        activeJobId=started.jobId;
        clearTimeout(requestTimeout);requestTimeout=null;
        status.textContent=started.reused?'Đã nối lại lượt luận Mệnh đang chạy trên server.':'AI đang luận Mệnh trên server. Có thể chuyển sang ứng dụng khác; khi quay lại kết quả sẽ tự cập nhật.';
        data=await jobClient.wait(started.jobId,controller.signal);
        if(activeJobId===started.jobId)activeJobId=null;
      }
      if(v!==version)return;
      validateMenhReadingResponse(data,prepared);
      renderMenhAi(answer,data.reading);if(data.modelUsed){const model=document.createElement('p');model.className='ai-model-used';model.textContent=`Model: ${data.modelUsed.label} / ${data.modelUsed.effort}`;answer.prepend(model);}answer.hidden=false;setFloatingAiReady(answer.childElementCount>0);
      if(activityReadingId){track('finishReading',activityReadingId,{status:'completed',modelUsed:data.modelUsed});activityReadingId=null;}
      pdf.setModel(data.modelUsed);
      const modelText=data.modelUsed?' · '+data.modelUsed.label+' / '+data.modelUsed.effort:'';
      status.textContent='Đã nhận bài luận AI'+modelText+'.';
      scrollToAnswer();
    }catch(e){
      if(activityReadingId){track('finishReading',activityReadingId,{status:controller.signal.aborted?'timeout':'error'});activityReadingId=null;}
      if(v===version)status.textContent=controller.signal.aborted?'Đã hết thời gian chờ. Hãy thử lại.':e.message;
    }finally{if(v===version){active=null;finish();}}
  });
}
