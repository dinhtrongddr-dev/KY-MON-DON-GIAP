import {prepareMenhReading} from './menh-reading-core.mjs';
import {renderMenhDeterministic} from './menh-view.mjs';
import {initMenhAi} from './menh-ai.mjs';
import {createActivityLog} from './activity-log.mjs';

const $=id=>document.getElementById(id);
const form=$('menh-form'),date=$('birth-date'),time=$('birth-time'),unknown=$('birth-time-unknown');
const timezone=$('menh-timezone'),sex=$('menh-sex'),age=$('menh-age'),annual=$('menh-annual-year');
const error=$('menh-form-error'),result=$('menh-result'),deterministic=$('menh-deterministic');
const activity=createActivityLog();
let rememberedTime='',currentPrepared=null;

export function collectMenhForm(){
  return {
    birthDateLocal:date.value,
    birthTimeMode:unknown.checked?'UNKNOWN':'KNOWN',
    birthTimeLocal:unknown.checked?null:time.value,
    tzOffset:Number(timezone.value),
    sexMetadata:sex.value||null,
    age:age.value===''?null:Number(age.value),
    annualYear:annual.value===''?null:Number(annual.value),
  };
}
export function syncUnknownBirthTime(){
  if(unknown.checked){
    if(time.value)rememberedTime=time.value;
    time.value='';time.disabled=true;time.required=false;
    $('birth-time-help').textContent='Không dùng giờ mặc định. Hệ thống lập 12 giờ đôi / tối đa 13 bàn ứng viên.';
  }else{
    time.disabled=false;time.required=true;
    if(!time.value&&rememberedTime)time.value=rememberedTime;
    $('birth-time-help').textContent='Nhập giờ dân dụng tại nơi sinh.';
  }
}
function clearResult(){
  currentPrepared=null;result.hidden=true;deterministic.replaceChildren();error.hidden=true;error.textContent='';
}
unknown.addEventListener('change',()=>{syncUnknownBirthTime();clearResult();});
form.addEventListener('input',event=>{if(event.target!==unknown)clearResult();});
form.addEventListener('submit',event=>{
  event.preventDefault();error.hidden=true;error.textContent='';
  try{
    currentPrepared=prepareMenhReading(collectMenhForm());
    renderMenhDeterministic(deterministic,currentPrepared);
    result.hidden=false;activity.recordChart();
    result.scrollIntoView?.({behavior:'smooth',block:'start'});
  }catch(e){error.textContent=e.message;error.hidden=false;result.hidden=true;}
});
annual.value=String(new Date().getFullYear());
syncUnknownBirthTime();
initMenhAi({prepare:()=>collectMenhForm(),activity});
