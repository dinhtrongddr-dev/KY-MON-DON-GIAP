const STORAGE_KEY='qimen.activity.v1';
const MAX_AGE_MS=30*24*60*60*1000;
const MAX_EVENTS=500;
const READING_STATUSES=new Set(['running','completed','fallback','clarification','error','cancelled','timeout','interrupted']);

const two=value=>String(value).padStart(2,'0');
export function localDayKey(ms){
  const d=new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}`;
}
const safeText=(value,max=80)=>typeof value==='string'?value.trim().slice(0,max):'';
function sanitize(raw,now){
  if(!raw||!Array.isArray(raw.events))return [];
  const cutoff=now-MAX_AGE_MS;
  return raw.events.flatMap(item=>{
    if(!item||!Number.isFinite(item.at)||item.at<cutoff||item.at>now+86_400_000)return [];
    if(item.type==='chart')return [{id:safeText(item.id,64)||`chart-${item.at}`,type:'chart',at:item.at}];
    if(item.type!=='reading')return [];
    const status=READING_STATUSES.has(item.status)?item.status:'interrupted';
    return [{id:safeText(item.id,64)||`reading-${item.at}`,type:'reading',at:item.at,status,
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
export function createActivityLog({storage,document=globalThis.document,now=()=>Date.now()}={}){
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
  let sequence=0,events=[],persistent=!!storage;
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
    const ui=ids(),snapshot=summarizeActivity(events,now());
    if(ui.charts)ui.charts.textContent=String(snapshot.chartCount);
    if(ui.readings)ui.readings.textContent=String(snapshot.readingCount);
    if(ui.list){
      ui.list.replaceChildren();
      if(!snapshot.recentReadings.length){
        const li=document.createElement('li');li.textContent='Chưa có lượt luận nào được ghi trên thiết bị này.';li.className='activity-empty';ui.list.append(li);
      }else for(const event of snapshot.recentReadings){
        const li=document.createElement('li');li.className='activity-row';
        const when=document.createElement('time');when.dateTime=new Date(event.at).toISOString();when.textContent=formatMoment(event.at,now());
        const state=document.createElement('span');state.className=`activity-state activity-${event.status}`;state.textContent=statusLabel(event.status);
        const model=document.createElement('small');model.textContent=[event.model,event.route,event.effort].filter(Boolean).join(' · ');
        li.append(when,state,model);ui.list.append(li);
      }
    }
    if(ui.note)ui.note.textContent=persistent?'Lưu cục bộ trên trình duyệt này tối đa 30 ngày; không lưu nội dung câu hỏi.':'Trình duyệt không cho phép lưu; thống kê chỉ giữ trong phiên này và vẫn không lưu nội dung câu hỏi.';
    return snapshot;
  };
  const append=event=>{
    events=sanitize({events:[...events,event]},now());
    persist();render();return event.id;
  };
  const recordChart=()=>{
    const at=now();return append({id:`chart-${at}-${sequence++}`,type:'chart',at});
  };
  const startReading=()=>{
    const at=now();return append({id:`reading-${at}-${sequence++}`,type:'reading',at,status:'running'});
  };
  const finishReading=(id,{status='completed',modelUsed=null}={})=>{
    if(!id)return;
    const index=events.findIndex(e=>e.id===id&&e.type==='reading');
    if(index<0)return;
    const normalized=READING_STATUSES.has(status)?status:'error';
    events[index]={...events[index],status:normalized,finishedAt:now(),
      model:safeText(modelUsed?.label||modelUsed?.id),route:safeText(modelUsed?.routeLabel||modelUsed?.provider),effort:safeText(modelUsed?.effort,24)};
    events=sanitize({events},now());persist();render();
  };
  render();
  return {recordChart,startReading,finishReading,render,snapshot:()=>summarizeActivity(events,now())};
}
