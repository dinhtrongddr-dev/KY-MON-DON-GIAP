import {buildMenhReadingRequest,assertMenhCompatible,validateMenhReadingResponse} from './menh-reading-core.mjs';
import {renderMenhAi} from './menh-view.mjs';
import {AI_RELAY_ORIGIN} from './site-config.mjs';
import {initPdfExport} from './report-export.mjs';

export function initMenhAi({prepare,activity=null}){
  const $=id=>document.getElementById(id);
  const token=$('local-token'),remember=$('local-remember'),rememberHint=$('local-remember-hint');
  const status=$('menh-ai-status'),answer=$('menh-ai-answer'),read=$('menh-ai-read'),cancel=$('menh-ai-cancel'),check=$('menh-local-check');
  const progress=$('menh-ai-progress'),elapsed=$('menh-ai-elapsed'),readLabel=read.textContent;
  const storageKey='qimen.ai.connection-code';
  let active=null,version=0,progressTimer=null,requestTimeout=null,activityReadingId=null;
  const track=(method,...args)=>{try{return activity?.[method]?.(...args)??null;}catch{return null;}};
  const pdf=initPdfExport({kind:'menh',buttonId:'menh-report-pdf',statusId:'menh-ai-status',tokenId:'local-token',prepare,boardSelector:'#menh-deterministic .menh-qimen-board'});
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
  const cancelWork=()=>{version++;active?.abort();active=null;if(activityReadingId){track('finishReading',activityReadingId,{status:'cancelled'});activityReadingId=null;}finish();pdf.clear();};
  const invalidate=()=>{cancelWork();answer.hidden=true;answer.replaceChildren();status.textContent='Dữ kiện sinh đã thay đổi. Phân tích lại trước khi dùng AI.';};
  document.getElementById('menh-form').addEventListener('input',invalidate);
  document.getElementById('menh-form').addEventListener('change',invalidate);
  token.addEventListener('input',()=>{if(remember.checked)savePreference();cancelWork();status.textContent='Mã kết nối đã thay đổi; hãy kiểm tra kết nối.';});
  cancel.addEventListener('click',()=>{cancelWork();status.textContent='Đã hủy yêu cầu AI.';});
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
    cancelWork();const v=version,controller=start('Đang kiểm tra kết nối AI…',8000);
    try{const data=await call('/api/status',null,controller.signal);assertMenhCompatible(data);if(v===version)status.textContent='Kết nối AI sẵn sàng.';}
    catch(e){if(v===version)status.textContent=controller.signal.aborted?'Hết thời gian kiểm tra kết nối.':e.message;}
    finally{if(v===version){active=null;finish();}}
  });
  read.addEventListener('click',async()=>{
    cancelWork();let body;
    try{body=prepare();}catch(e){status.textContent=e.message;return;}
    const v=version,controller=start('Đang chuẩn bị Mệnh bàn để AI phân tích…',610000);
    try{
      const prepared=await buildMenhReadingRequest(body);if(v!==version)return;
      const health=await call('/api/status',null,controller.signal);assertMenhCompatible(health);if(v!==version)return;
      status.textContent=prepared.input.birthTimeMode==='UNKNOWN'?'AI đang luận những phần ổn định giữa các khung giờ sinh.':'AI đang phân tích Mệnh bàn và soạn bài luận.';
      activityReadingId=track('startReading');
      const data=await call('/api/menh/read',prepared.request,controller.signal);if(v!==version)return;
      validateMenhReadingResponse(data,prepared);
      renderMenhAi(answer,data.reading);if(data.modelUsed){const model=document.createElement('p');model.className='ai-model-used';model.textContent=`Model: ${data.modelUsed.label} / ${data.modelUsed.effort}`;answer.prepend(model);}answer.hidden=false;
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
