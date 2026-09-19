import {prepareMenhReading} from './menh-reading-core.mjs';
import {renderMenhDeterministic} from './menh-view.mjs';
import {initMenhAi} from './menh-ai.mjs';
import {createActivityLog} from './activity-log.mjs';

const $=id=>document.getElementById(id);
const form=$('menh-form'),name=$('birth-name'),place=$('birth-place'),date=$('birth-date'),dateNative=$('birth-date-native'),datePicker=$('birth-date-picker'),time=$('birth-time'),unknown=$('birth-time-unknown');
const timezone=$('menh-timezone'),sex=$('menh-sex'),age=$('menh-age'),annual=$('menh-annual-year'),rectification=$('birth-time-rectification');
const rectWindow=$('rect-time-window'),rectEventList=$('rect-event-list'),rectAdd=$('rect-add-event');
const EVENT_OPTIONS=[['MARRIAGE','Kết hôn / chia tay lớn'],['CHILDREN','Sinh con / thay đổi lớn vì con'],['CAREER','Đổi nghề / khởi nghiệp / bước ngoặt công việc'],['WEALTH','Tài chính biến động lớn'],['FAMILY','Biến cố gia đình / cha mẹ'],['RELOCATION','Chuyển nhà / chuyển nơi sống lớn']];
const two=n=>String(n).padStart(2,'0');
function maskDate(value){const raw=String(value||'').replace(/[^\d/]/g,'');if((raw.match(/\//g)||[]).length>=2)return raw.slice(0,10);const digits=raw.replace(/\D/g,'').slice(0,8);return digits.length<=2?digits:digits.length<=4?digits.slice(0,2)+'/'+digits.slice(2):digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);}
function parseBirthDate(value){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value||'').trim());if(!m)throw new Error('Ngày sinh phải theo định dạng DD/MM/YYYY.');const day=+m[1],month=+m[2],year=+m[3];if(year<1900||year>2100)throw new Error('Năm sinh phải nằm trong khoảng 1900–2100.');const check=new Date(Date.UTC(year,month-1,day));if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day)throw new Error('Ngày sinh không hợp lệ.');return `${year}-${two(month)}-${two(day)}`;}
function formatBirthDateIso(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));return m?`${m[3]}/${m[2]}/${m[1]}`:'';}
function maskTime(value){const raw=String(value||'');if(raw.includes(':'))return raw.replace(/[^\d:]/g,'').slice(0,5);const digits=raw.replace(/\D/g,'').slice(0,4);return digits.length<=2?digits:digits.slice(0,2)+':'+digits.slice(2);}
function parseBirthTime(value){const m=/^(\d{1,2}):(\d{2})$/.exec(String(value||'').trim());if(!m)throw new Error('Giờ sinh phải theo định dạng 24 giờ HH:MM.');const hour=+m[1],minute=+m[2];if(hour>23||minute>59)throw new Error('Giờ sinh không hợp lệ.');return `${two(hour)}:${two(minute)}`;}
function addRectEvent(value={}){
  const row=document.createElement('div');row.className='rect-event-row';
  const opts=EVENT_OPTIONS.map(([v,t])=>`<option value="${v}"${value.kind===v?' selected':''}>${t}</option>`).join('');
  row.innerHTML=`<label class="field"><span>Loại sự kiện</span><select class="rect-kind">${opts}</select></label><label class="field"><span>Ngày / tháng / năm</span><input class="rect-date" type="text" inputmode="text" autocomplete="off" placeholder="VD: 20/10/2020, 03/2022 hoặc 2018" value="${value.date||''}"><small>DD/MM/YYYY · MM/YYYY · YYYY</small></label><button class="rect-remove" type="button" aria-label="Xóa sự kiện">×</button>`;
  row.querySelector('.rect-remove').addEventListener('click',()=>{row.remove();clearResult();});rectEventList.append(row);
}
function parseEventDate(raw){
  const v=String(raw||'').trim().replace(/\s+/g,'');let m;
  if((m=/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(v)))return {year:+m[3],month:+m[2],day:+m[1],precision:'DAY',date:v};
  if((m=/^(\d{1,2})[\/-](\d{4})$/.exec(v)))return {year:+m[2],month:+m[1],day:null,precision:'MONTH',date:v};
  if((m=/^(\d{4})$/.exec(v)))return {year:+m[1],month:null,day:null,precision:'YEAR',date:v};
  return null;
}
function parseEventDates(raw){return String(raw||'').split(/[,;\n]+/).map(parseEventDate).filter(Boolean);}
function collectRectEvents(){return [...rectEventList.querySelectorAll('.rect-event-row')].flatMap(row=>parseEventDates(row.querySelector('.rect-date').value).map(d=>({kind:row.querySelector('.rect-kind').value,...d})));}
const error=$('menh-form-error'),result=$('menh-result'),deterministic=$('menh-deterministic');
const activity=createActivityLog();
let rememberedTime='',currentPrepared=null;

export function collectMenhForm(){
  return {
    fullName:name.value.trim()||null,
    birthPlace:place.value.trim()||null,
    birthDateLocal:parseBirthDate(date.value),
    birthTimeMode:unknown.checked?'UNKNOWN':'KNOWN',
    birthTimeLocal:unknown.checked?null:parseBirthTime(time.value),
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
    $('birth-time-help').textContent='Nhập giờ theo định dạng 24 giờ, ví dụ 07:30.';
  }
}
function clearResult(){
  currentPrepared=null;result.hidden=true;deterministic.replaceChildren();error.hidden=true;error.textContent='';
}
date.addEventListener('input',()=>{date.value=maskDate(date.value);date.setCustomValidity('');});
date.addEventListener('blur',()=>{try{const iso=parseBirthDate(date.value);date.value=formatBirthDateIso(iso);dateNative.value=iso;date.setCustomValidity('');}catch(e){date.setCustomValidity(e.message);}});
dateNative.addEventListener('change',()=>{if(dateNative.value){date.value=formatBirthDateIso(dateNative.value);date.setCustomValidity('');clearResult();}});
datePicker.addEventListener('click',()=>{try{dateNative.value=parseBirthDate(date.value);}catch{};if(typeof dateNative.showPicker==='function')dateNative.showPicker();else{dateNative.focus();dateNative.click();}});
time.addEventListener('input',()=>{time.value=maskTime(time.value);time.setCustomValidity('');});
time.addEventListener('blur',()=>{if(unknown.checked||!time.value)return;try{time.value=parseBirthTime(time.value);time.setCustomValidity('');}catch(e){time.setCustomValidity(e.message);}});
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
