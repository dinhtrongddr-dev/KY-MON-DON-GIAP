import {SHARE_ORIGIN} from './site-config.mjs';

const SHARE_ID=/^[A-Za-z0-9_-]{20,64}$/;

export function sharedViewId(){
  try{
    const id=new URLSearchParams(globalThis.location?.search||'').get('share')||'';
    return SHARE_ID.test(id)?id:'';
  }catch{return '';}
}

function shareEndpoint(id){
  const host=String(globalThis.location?.hostname||'').toLowerCase();
  if(host==='127.0.0.1'||host==='localhost'||host.endsWith('.trycloudflare.com'))return (globalThis.location?.origin||'')+'/api/share/'+id;
  return SHARE_ORIGIN+'/api/share/'+id;
}

export async function initSharedView({kind,resultSelector,controlSelector='.control-panel'}){
  const id=sharedViewId();
  if(!id)return false;
  document.body.classList.add('share-view-mode');
  const control=document.querySelector(controlSelector);if(control)control.hidden=true;
  const result=document.querySelector(resultSelector);
  if(!result)throw new Error('Thiếu vùng kết quả để mở link chia sẻ.');
  result.hidden=false;result.setAttribute('aria-busy','true');
  try{
    const response=await fetch(shareEndpoint(id),{credentials:'omit',cache:'no-store'});
    let data;try{data=await response.json();}catch{throw new Error('Dữ liệu chia sẻ không đọc được.');}
    if(!response.ok)throw new Error(data?.error||'Link chia sẻ không tồn tại hoặc đã hết hạn.');
    if(data.kind!==kind)throw new Error('Link chia sẻ không đúng loại bàn.');
    if(!data.snapshot?.html)throw new Error('Link chia sẻ này dùng định dạng cũ.');
    result.className=data.snapshot.className||result.className;
    result.innerHTML=data.snapshot.html;
    result.hidden=false;
    result.querySelectorAll('.local-controls,.local-preference,.ai-feedback,.activity-summary,.activity-history,#local-setup,#rule-analyze,#rule-preview,.report-pdf-button,.share-result-link').forEach(node=>node.remove());
    result.querySelectorAll('button,input,select,textarea').forEach(node=>{node.tabIndex=-1;node.setAttribute('aria-disabled','true');});
    document.title=data.kind==='menh'?'Kỳ Môn Mệnh · Bản chia sẻ':'Kỳ Môn Hỏi Việc · Bản chia sẻ';
    result.setAttribute('aria-busy','false');
    result.scrollIntoView?.({block:'start'});
    return true;
  }catch(error){
    result.replaceChildren();
    const box=document.createElement('section');box.className='learning-panel share-view-error';
    const title=document.createElement('h2');title.textContent='Không mở được bản chia sẻ';
    const copy=document.createElement('p');copy.textContent=error instanceof Error?error.message:'Link chia sẻ không đọc được.';
    box.append(title,copy);result.append(box);result.setAttribute('aria-busy','false');
    return true;
  }
}
