import {prepareMenhReading} from './menh-reading-core.mjs';
import {renderMenhDeterministic} from './menh-view.mjs';
import {initMenhAi} from './menh-ai.mjs';
import {createActivityLog} from './activity-log.mjs';

const $=id=>document.getElementById(id);
const form=$('menh-form'),name=$('birth-name'),place=$('birth-place'),date=$('birth-date'),time=$('birth-time'),unknown=$('birth-time-unknown');
const timezone=$('menh-timezone'),sex=$('menh-sex'),age=$('menh-age'),annual=$('menh-annual-year'),rectification=$('birth-time-rectification');
const rectWindow=$('rect-time-window'),rectEventList=$('rect-event-list'),rectAdd=$('rect-add-event');
const EVENT_OPTIONS=[['MARRIAGE','Kết hôn / chia tay lớn'],['CHILDREN','Sinh con / thay đổi lớn vì con'],['CAREER','Đổi nghề / khởi nghiệp / bước ngoặt công việc'],['WEALTH','Tài chính biến động lớn'],['FAMILY','Biến cố gia đình / cha mẹ'],['RELOCATION','Chuyển nhà / chuyển nơi sống lớn']];
function addRectEvent(value={}){
  const row=document.createElement('div');row.className='rect-event-row';
  const opts=EVENT_OPTIONS.map(([v,t])=>`<option value="${v}"${value.kind===v?' selected':''}>${t}</option>`).join('');
  row.innerHTML=`<label class="field"><span>Loại sự kiện</span><select class="rect-kind">${opts}</select></label><label class="field"><span>Ngày / tháng / năm</span><input class="rect-date" type="text" inputmode="text" autocomplete="off" placeholder="VD: 20/10/2020, 03/2022 hoặc 2018" value="${value.date||''}"><small>DD/MM/YYYY · MM/YYYY · YYYY</small></label><button class="rect-remove" type="button" aria-label="Xóa sự kiện">×</button>`;
  row.querySelector('.rect-remove').addEventListener('click',()=>{row.remove();clearResult();});rectEventList.append(row);
}
function parseEventDate(raw){
  const v=String(raw||'').trim();let m;
  if((m=/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(v)))return {year:+m[3],month:+m[2],day:+m[1],precision:'DAY',date:v};
  if((m=/^(\d{1,2})[\/-](\d{4})$/.exec(v)))return {year:+m[2],month:+m[1],day:null,precision:'MONTH',date:v};
  if((m=/^(\d{4})$/.exec(v)))return {year:+m[1],month:null,day:null,precision:'YEAR',date:v};
  return null;
}
function collectRectEvents(){return [...rectEventList.querySelectorAll('.rect-event-row')].map(row=>{const d=parseEventDate(row.querySelector('.rect-date').value);return d?{kind:row.querySelector('.rect-kind').value,...d}:null;}).filter(Boolean);}
const error=$('menh-form-error'),result=$('menh-result'),deterministic=$('menh-deterministic');
const activity=createActivityLog();
let rememberedTime='',currentPrepared=null;

export function collectMenhForm(){
  return {
    fullName:name.value.trim()||null,
    birthPlace:place.value.trim()||null,
    birthDateLocal:date.value,
    birthTimeMode:unknown.checked?'UNKNOWN':'KNOWN',
    birthTimeLocal:unknown.checked?null:time.value,
    tzOffset:Number(timezone.value),
    sexMetadata:sex.value||null,
    lifeEvents:unknown.checked?collectRectEvents():null,
    birthTimeWindow:unknown.checked?rectWindow.value:null,
    age:age.value===''?null:Number(age.value),
    annualYear:annual.value===''?null:Number(annual.value),
  };
}
export function syncUnknownBirthTime(){
  rectification.hidden=!unknown.checked;
  if(unknown.checked){
    if(time.value)rememberedTime=time.value;
    time.value='';time.disabled=true;time.required=false;
    $('birth-time-help').textContent='Không cần nhập giờ. Hệ thống sẽ đối chiếu các khung giờ sinh và các mốc cuộc đời bạn cung cấp.';
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
rectAdd.addEventListener('click',()=>addRectEvent());
if(!rectEventList.children.length){addRectEvent({kind:'MARRIAGE'});addRectEvent({kind:'CAREER'});addRectEvent({kind:'FAMILY'});}
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
deterministic.addEventListener('click',event=>{
  const button=event.target.closest?.('.menh-use-candidate');if(!button)return;
  rememberedTime=button.dataset.candidateTime;unknown.checked=false;syncUnknownBirthTime();time.value=rememberedTime;
  clearResult();form.requestSubmit();
  requestAnimationFrame(()=>document.getElementById('menh-ai-read')?.scrollIntoView?.({behavior:'smooth',block:'center'}));
});
annual.value=String(new Date().getFullYear());
syncUnknownBirthTime();
initMenhAi({prepare:()=>collectMenhForm(),activity});
