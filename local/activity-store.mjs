import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

const MAX_AGE_MS=30*24*60*60*1000;
const MAX_EVENTS=10000;
const STATUSES=new Set(['running','completed','fallback','clarification','error','cancelled','timeout','interrupted']);
const two=value=>String(value).padStart(2,'0');
const text=(value,max=96)=>typeof value==='string'?value.trim().slice(0,max):'';
export function defaultActivityPath(){
  const base=process.env.HOME||process.cwd();
  return process.env.QIMEN_ACTIVITY_LOG||resolve(base,'.local/state/kymon/activity.json');
}
function dayKey(ms,offset){
  const d=new Date(ms+offset*3_600_000);
  return `${d.getUTCFullYear()}-${two(d.getUTCMonth()+1)}-${two(d.getUTCDate())}`;
}
function sanitizeEvent(item,now){
  if(!item||!Number.isFinite(item.at)||item.at<now-MAX_AGE_MS||item.at>now+86_400_000)return null;
  if(item.type==='chart')return {id:text(item.id,64),type:'chart',at:item.at};
  if(item.type!=='reading')return null;
  return {id:text(item.id,64),type:'reading',at:item.at,status:STATUSES.has(item.status)?item.status:'interrupted',
    finishedAt:Number.isFinite(item.finishedAt)?item.finishedAt:null,model:text(item.model),route:text(item.route),effort:text(item.effort,24)};
}
function load(filePath,now){
  if(!filePath||!existsSync(filePath))return [];
  try{
    const parsed=JSON.parse(readFileSync(filePath,'utf8'));
    if(!parsed||!Array.isArray(parsed.events))return [];
    return parsed.events.map(item=>sanitizeEvent(item,now)).filter(Boolean).slice(-MAX_EVENTS);
  }catch{return [];}
}
export function createActivityStore({filePath=null,now=()=>Date.now()}={}){
  let sequence=0,events=load(filePath,now());
  let repaired=false;
  events=events.map(event=>event.type==='reading'&&event.status==='running'
    ?(repaired=true,{...event,status:'interrupted',finishedAt:now()}):event);
  const persist=()=>{
    if(!filePath)return;
    mkdirSync(dirname(filePath),{recursive:true,mode:0o700});
    events=events.map(item=>sanitizeEvent(item,now())).filter(Boolean).slice(-MAX_EVENTS);
    const tmp=`${filePath}.${process.pid}.tmp`;
    writeFileSync(tmp,JSON.stringify({version:1,events}),{encoding:'utf8',mode:0o600});
    renameSync(tmp,filePath);
  };
  if(repaired)persist();
  const append=event=>{events=[...events,event].slice(-MAX_EVENTS);persist();return event.id;};
  const recordChart=()=>{const at=now();return append({id:`chart-${at}-${sequence++}`,type:'chart',at});};
  const startReading=()=>{const at=now();return append({id:`reading-${at}-${sequence++}`,type:'reading',at,status:'running'});};
  const finishReading=(id,{status='completed',modelUsed=null}={})=>{
    const index=events.findIndex(event=>event.id===id&&event.type==='reading');
    if(index<0)return;
    events[index]={...events[index],status:STATUSES.has(status)?status:'error',finishedAt:now(),
      model:text(modelUsed?.label||modelUsed?.id),route:text(modelUsed?.routeLabel||modelUsed?.provider),effort:text(modelUsed?.effort,24)};
    persist();
  };
  const summary=(tzOffset=0)=>{
    tzOffset=Number(tzOffset);
    if(!Number.isFinite(tzOffset)||tzOffset<-14||tzOffset>14)tzOffset=0;
    const current=now(),today=dayKey(current,tzOffset);
    const todays=events.filter(event=>dayKey(event.at,tzOffset)===today);
    return {
      date:today,
      chartCount:todays.filter(event=>event.type==='chart').length,
      readingCount:todays.filter(event=>event.type==='reading').length,
      recentReadings:events.filter(event=>event.type==='reading').slice(-50).reverse().map(event=>({
        at:event.at,status:event.status,model:event.model,route:event.route,effort:event.effort
      }))
    };
  };
  return {recordChart,startReading,finishReading,summary};
}
