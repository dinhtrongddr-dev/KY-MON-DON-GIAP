import {AI_RELAY_ORIGIN} from './site-config.mjs';

const STORAGE_KEY='qimen.activity.v1';
const MAX_AGE_MS=30*24*60*60*1000;
const MAX_EVENTS=500;
const READING_STATUSES=new Set(['running','completed','fallback','clarification','error','cancelled','timeout','interrupted']);
const two=value=>String(value).padStart(2,'0');
const safeText=(value,max=80)=>typeof value==='string'?value.trim().slice(0,max):'';

export function localDayKey(ms){
  const d=new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}`;
}
function sanitize(raw,now){
  if(!raw||!Array.isArray(raw.events))return [];
  const cutoff=now-MAX_AGE_MS;
  return raw.events.flatMap(item=>{
    if(!item||!Number.isFinite(item.at)||item.at<cutoff||item.at>now+86_400_000)return [];
    if(item.type==='chart')return [{id:safeText(item.id,64)||`chart-${item.at}`,type:'chart',at:item.at}];
    if(item.type!=='reading')return [];
    return [{id:safeText(item.id,64)||`reading-${item.at}`,type:'reading',at:item.at,
      status:READING_STATUSES.has(item.status)?item.status:'interrupted',
      finishedAt:Number.isFinite(item.finishedAt)?item.finishedAt:null,
      model:safeText(item.model),route:safeText(item.route),effort:safeText(item.effort,24)}];
  }).slice(-MAX_EVENTS);
}
function formatMoment(ms,now){
  const d=new Date(ms),today=localDayKey(now)===localDayKey(ms);
  const time=`${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  return today?time:`${two(d.getDate())}/${two(d.getMonth()+1)} ${time}`;
}
const statusLabel=status=>({
  running:'Đang luận',completed:'Hoàn tất',fallback:'Dữ kiện dự phòng',clarification:'Cần bổ sung',
  error:'Lỗi',cancelled:'Đã hủy',timeout:'Hết thời gian',interrupted:'Bị ngắt'
}[status]||status);

export function summarizeActivity(events,now=Date.now()){
  const day=localDayKey(now),today=events.filter(e=>localDayKey(e.at)===day);
  return {
    chartCount:today.filter(e=>e.type==='chart').length,
    readingCount:today.filter(e=>e.type==='reading').length,
    recentReadings:events.filter(e=>e.type==='reading').slice(-30).reverse()
  };
}
function remoteSnapshotOf(value){
  if(!value||!Number.isInteger(value.chartCount)||value.chartCount<0||!Number.isInteger(value.readingCount)||value.readingCount<0||!Array.isArray(value.recentReadings))return null;
  return {
    chartCount:value.chartCount,readingCount:value.readingCount,
    recentReadings:value.recentReadings.slice(0,50).flatMap(item=>{
      if(!item||!Number.isFinite(item.at))return [];
      return [{at:item.at,status:READING_STATUSES.has(item.status)?item.status:'interrupted',
        model:safeText(item.model),route:safeText(item.route),effort:safeText(item.effort,24)}];
    })
  };
}
export function createActivityLog({storage,document=globalThis.document,now=()=>Date.now(),fetcher=globalThis.fetch,endpoint=AI_RELAY_ORIGIN,pollMs=60_000}={}){
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
  let sequence=0,events=[],persistent=!!storage,remoteSnapshot=null,remoteState=document?'loading':'disabled';
  try{events=sanitize(JSON.parse(storage?.getItem(STORAGE_KEY)||'{}'),now());}catch{events=[];persistent=false;}
  let repaired=false;
  events=events.map(e=>e.type==='reading'&&e.status==='running'?(repaired=true,{...e,status:'interrupted',finishedAt:now()}):e);
  const persist=()=>{
    if(!storage){persistent=false;return false;}
    try{storage.setItem(STORAGE_KEY,JSON.stringify({version:1,events}));return true;}catch{persistent=false;return false;}
  };
  if(repaired)persist();
  const ids=()=>({
    charts:document?.getElementById?.('activity-chart-count'),
    readings:document?.getElementById?.('activity-reading-count'),
    list:document?.getElementById?.('activity-reading-list'),
    note:document?.getElementById?.('activity-storage-note')
  });
  const render=()=>{
    const ui=ids(),local=summarizeActivity(events,now()),snapshot=remoteSnapshot||local;
    if(ui.charts)ui.charts.textContent=String(snapshot.chartCount);
    if(ui.readings)ui.readings.textContent=String(snapshot.readingCount);
    if(ui.list){
      ui.list.replaceChildren();
      if(!snapshot.recentReadings.length){
        const li=document.createElement('li');li.textContent='Chưa có lượt luận nào được ghi.';li.className='activity-empty';ui.list.append(li);
      }else for(const event of snapshot.recentReadings.slice(0,30)){
        const li=document.createElement('li');li.className='activity-row';
        const when=document.createElement('time');when.dateTime=new Date(event.at).toISOString();when.textContent=formatMoment(event.at,now());
        const state=document.createElement('span');state.className=`activity-state activity-${event.status}`;state.textContent=statusLabel(event.status);
        const model=document.createElement('small');model.textContent=[event.model,event.route,event.effort].filter(Boolean).join(' · ');
        li.append(when,state,model);ui.list.append(li);
      }
    }
    if(ui.note){
      ui.note.textContent=remoteState==='live'
        ?'Tổng hợp từ bộ kết nối chung; lưu tối đa 30 ngày và không lưu nội dung câu hỏi.'
        :remoteState==='stale'?'Tạm chưa làm mới được máy chủ; đang hiển thị số liệu chung tải gần nhất.'
        :remoteState==='loading'?'Đang tải thống kê chung; nội dung câu hỏi không được đưa vào lịch sử.'
        :persistent?'Không tải được thống kê chung; đang hiển thị lịch sử cục bộ trên trình duyệt này.'
        :'Không tải được thống kê chung và trình duyệt không cho phép lưu lịch sử cục bộ.';
    }
    return snapshot;
  };
  const timezoneOffset=()=>-new Date(now()).getTimezoneOffset()/60;
  const applyRemote=data=>{
    const snapshot=remoteSnapshotOf(data?.activity);
    if(!snapshot)throw new Error('Invalid activity response');
    remoteSnapshot=snapshot;remoteState='live';render();return snapshot;
  };
  const refreshRemote=async()=>{
    if(!document||typeof fetcher!=='function')return null;
    try{
      const response=await fetcher(`${endpoint}/api/activity?tzOffset=${encodeURIComponent(timezoneOffset())}`,{credentials:'omit',cache:'no-store'});
      if(!response.ok)throw new Error('Activity unavailable');
      return applyRemote(await response.json());
    }catch{
      remoteState=remoteSnapshot?'stale':'error';render();return null;
    }
  };
  const append=event=>{
    events=sanitize({events:[...events,event]},now());persist();render();return event.id;
  };
  const recordChart=()=>{
    const at=now(),id=append({id:`chart-${at}-${sequence++}`,type:'chart',at});
    if(document&&typeof fetcher==='function')void fetcher(`${endpoint}/api/activity/chart?tzOffset=${encodeURIComponent(timezoneOffset())}`,{
      method:'POST',credentials:'omit',cache:'no-store'
    }).then(async response=>{if(response.ok)applyRemote(await response.json());else throw new Error();}).catch(()=>{remoteState=remoteSnapshot?'stale':'error';render();});
    return id;
  };
  const startReading=()=>{
    const at=now(),id=append({id:`reading-${at}-${sequence++}`,type:'reading',at,status:'running'});
    if(document&&typeof fetcher==='function')globalThis.setTimeout?.(()=>void refreshRemote(),750);
    return id;
  };
  const finishReading=(id,{status='completed',modelUsed=null}={})=>{
    if(!id)return;
    const index=events.findIndex(e=>e.id===id&&e.type==='reading');if(index<0)return;
    events[index]={...events[index],status:READING_STATUSES.has(status)?status:'error',finishedAt:now(),
      model:safeText(modelUsed?.label||modelUsed?.id),route:safeText(modelUsed?.routeLabel||modelUsed?.provider),effort:safeText(modelUsed?.effort,24)};
    events=sanitize({events},now());persist();render();void refreshRemote();
  };
  render();void refreshRemote();
  if(document&&typeof fetcher==='function'&&pollMs>0)globalThis.setInterval?.(()=>void refreshRemote(),pollMs);
  return {recordChart,startReading,finishReading,render,refresh:refreshRemote,snapshot:()=>remoteSnapshot||summarizeActivity(events,now())};
}
