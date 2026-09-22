import {initSharedView} from './share-view.mjs';
import {prepareMenhReading} from './menh-reading-core.mjs';
import {renderMenhDeterministic} from './menh-view.mjs';
import {initMenhAi} from './menh-ai.mjs';
import {createActivityLog} from './activity-log.mjs';

const $=id=>document.getElementById(id);
const form=$('menh-form'),name=$('birth-name'),place=$('birth-place'),date=$('birth-date'),dateNative=$('birth-date-native'),datePicker=$('birth-date-picker'),time=$('birth-time'),hour=$('birth-hour'),minute=$('birth-minute'),unknown=$('birth-time-unknown');
const timezone=$('menh-timezone'),timezoneMode=$('menh-timezone-mode'),ianaTimezone=$('menh-iana-timezone'),dstDisambiguation=$('menh-dst-disambiguation'),longitude=$('menh-longitude'),latitude=$('menh-latitude'),sex=$('menh-sex'),age=$('menh-age'),annual=$('menh-annual-year'),rectification=$('birth-time-rectification');
const rectWindow=$('rect-time-window'),rectEventList=$('rect-event-list'),rectAdd=$('rect-add-event');
const EVENT_OPTIONS=[['MARRIAGE','Kết hôn / chia tay lớn'],['CHILDREN','Sinh con / thay đổi lớn vì con'],['CAREER','Đổi nghề / khởi nghiệp / bước ngoặt công việc'],['WEALTH','Tài chính biến động lớn'],['FAMILY','Biến cố gia đình / cha mẹ'],['RELOCATION','Chuyển nhà / chuyển nơi sống lớn']];
const two=n=>String(n).padStart(2,'0');
function maskDate(value,{deleting=false}={}){
  const digits=String(value||'').replace(/\D/g,'').slice(0,8);
  if(!digits)return '';
  if(digits.length===1)return digits;
  if(digits.length===2)return deleting?digits:digits+'/';
  if(digits.length===3)return digits.slice(0,2)+'/'+digits.slice(2);
  if(digits.length===4)return deleting?digits.slice(0,2)+'/'+digits.slice(2):digits.slice(0,2)+'/'+digits.slice(2)+'/';
  return digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
}
function parseBirthDate(value){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value||'').trim());if(!m)throw new Error('Ngày sinh phải theo định dạng DD/MM/YYYY.');const day=+m[1],month=+m[2],year=+m[3];if(year<1900||year>2100)throw new Error('Năm sinh phải nằm trong khoảng 1900–2100.');const check=new Date(Date.UTC(year,month-1,day));if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day)throw new Error('Ngày sinh không hợp lệ.');return `${year}-${two(month)}-${two(day)}`;}
function formatBirthDateIso(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));return m?`${m[3]}/${m[2]}/${m[1]}`:'';}
function parseBirthTime(value){const m=/^(\d{2}):(\d{2})$/.exec(String(value||'').trim());if(!m)throw new Error('Hãy chọn đủ giờ và phút sinh.');const h=+m[1],min=+m[2];if(h>23||min>59)throw new Error('Giờ sinh không hợp lệ.');return `${two(h)}:${two(min)}`;}
function populateTimeSelectors(){
  for(let h=0;h<24;h++)hour.add(new Option(two(h),two(h)));
  for(let m=0;m<60;m++)minute.add(new Option(two(m),two(m)));
}
function syncTimeValueFromSelectors(){time.value=hour.value&&minute.value?`${hour.value}:${minute.value}`:'';}
function syncTimeSelectorsFromValue(value){
  const m=/^(\d{2}):(\d{2})$/.exec(String(value||''));
  hour.value=m?m[1]:'';minute.value=m?m[2]:'';
}
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
const error=$('menh-form-error'),result=$('menh-result'),deterministic=$('menh-deterministic'),floatingNav=$('menh-floating-nav'),resultSwitch=$('menh-result-switch'),spiritSwitch=$('menh-spirit-switch');
const activity=createActivityLog();
let rememberedTime='',currentPrepared=null;

function collectTimePlace(){
  const policy={mode:timezoneMode.value};
  if(policy.mode==='iana_civil'){policy.timeZone=ianaTimezone.value.trim();policy.disambiguation=dstDisambiguation.value;}
  if(longitude.value.trim()!=='')policy.longitude=Number(longitude.value);
  if(latitude.value.trim()!=='')policy.latitude=Number(latitude.value);
  return policy;
}
function syncTimePlace(){
  const iana=timezoneMode.value==='iana_civil';
  timezone.disabled=iana;ianaTimezone.disabled=!iana;dstDisambiguation.disabled=!iana;
  const timezoneHelp=$('menh-timezone-help');if(timezoneHelp)timezoneHelp.textContent=iana?'Múi giờ theo địa điểm sinh tự áp dụng chênh lệch lịch sử tại ngày sinh; ô UTC cố định tạm không dùng.':'Dùng UTC offset cố định theo giờ sinh đã nhập';
}
export function collectMenhForm(){
  return {
    fullName:name.value.trim()||null,
    birthPlace:place.value.trim()||null,
    birthDateLocal:parseBirthDate(date.value),
    birthTimeMode:unknown.checked?'UNKNOWN':'KNOWN',
    birthTimeLocal:unknown.checked?null:parseBirthTime(time.value),
    tzOffset:Number(timezone.value),
    timePlace:collectTimePlace(),
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
    time.value='';hour.value='';minute.value='';hour.disabled=true;minute.disabled=true;
    const birthTimeHelp=$('birth-time-help');if(birthTimeHelp)birthTimeHelp.textContent='Không cần chọn giờ. Hệ thống sẽ đối chiếu các khung giờ sinh và các mốc cuộc đời bạn cung cấp.';
  }else{
    hour.disabled=false;minute.disabled=false;
    if(!time.value&&rememberedTime)time.value=rememberedTime;
    syncTimeSelectorsFromValue(time.value);
    const birthTimeHelp=$('birth-time-help');if(birthTimeHelp)birthTimeHelp.textContent='Cuộn danh sách để chọn giờ và phút theo định dạng 24 giờ.';
  }
}
function clearResult(){
  currentPrepared=null;result.hidden=true;deterministic.replaceChildren();error.hidden=true;error.textContent='';
  if(floatingNav)floatingNav.hidden=true;
  if(resultSwitch){resultSwitch.disabled=true;resultSwitch.setAttribute('aria-disabled','true');resultSwitch.dataset.target='board';resultSwitch.textContent='Xem Bàn';resultSwitch.setAttribute('aria-label','Xem bàn Kỳ Môn');}
  if(spiritSwitch){spiritSwitch.disabled=true;spiritSwitch.setAttribute('aria-disabled','true');}
}
date.addEventListener('input',event=>{date.value=maskDate(date.value,{deleting:String(event.inputType||'').startsWith('delete')});date.setCustomValidity('');});
date.addEventListener('blur',()=>{try{const iso=parseBirthDate(date.value);date.value=formatBirthDateIso(iso);dateNative.value=iso;date.setCustomValidity('');}catch(e){date.setCustomValidity(e.message);}});
dateNative.addEventListener('change',()=>{if(dateNative.value){date.value=formatBirthDateIso(dateNative.value);date.setCustomValidity('');clearResult();}});
datePicker.addEventListener('click',()=>{try{dateNative.value=parseBirthDate(date.value);}catch{};if(typeof dateNative.showPicker==='function')dateNative.showPicker();else{dateNative.focus();dateNative.click();}});
for(const select of [hour,minute])select.addEventListener('change',()=>{syncTimeValueFromSelectors();time.dispatchEvent(new Event('input',{bubbles:true}));});
unknown.addEventListener('change',()=>{syncUnknownBirthTime();clearResult();});
timezoneMode.addEventListener('change',()=>{syncTimePlace();clearResult();});
rectAdd.addEventListener('click',()=>addRectEvent());
if(!rectEventList.children.length){addRectEvent({kind:'MARRIAGE'});addRectEvent({kind:'CAREER'});addRectEvent({kind:'FAMILY'});}
form.addEventListener('input',event=>{if(event.target!==unknown)clearResult();});
form.addEventListener('submit',event=>{
  event.preventDefault();error.hidden=true;error.textContent='';
  try{
    currentPrepared=prepareMenhReading(collectMenhForm());
    renderMenhDeterministic(deterministic,currentPrepared);
    result.hidden=false;
    if(floatingNav)floatingNav.hidden=false;
    if(resultSwitch){resultSwitch.disabled=false;resultSwitch.setAttribute('aria-disabled','false');resultSwitch.dataset.target='board';resultSwitch.textContent='Xem Bàn';resultSwitch.setAttribute('aria-label','Xem bàn Kỳ Môn');}
    if(spiritSwitch){spiritSwitch.disabled=false;spiritSwitch.setAttribute('aria-disabled','false');}
    activity.recordChart();
    result.scrollIntoView?.({behavior:'smooth',block:'start'});
  }catch(e){error.textContent=e.message;error.hidden=false;result.hidden=true;}
});
spiritSwitch?.addEventListener('click',()=>{
  if(spiritSwitch.disabled)return;
  const target=deterministic.querySelector('.menh-spirit-activation');
  if(!target)return;
  target.scrollIntoView?.({behavior:'smooth',block:'start'});
  target.classList.remove('is-quick-highlight');
  requestAnimationFrame(()=>target.classList.add('is-quick-highlight'));
  setTimeout(()=>target.classList.remove('is-quick-highlight'),900);
});
deterministic.addEventListener('click',event=>{
  const button=event.target.closest?.('.menh-use-candidate');if(!button)return;
  rememberedTime=button.dataset.candidateTime;unknown.checked=false;time.value=rememberedTime;syncUnknownBirthTime();
  clearResult();form.requestSubmit();
  requestAnimationFrame(()=>document.getElementById('menh-ai-read')?.scrollIntoView?.({behavior:'smooth',block:'center'}));
});
annual.value=String(new Date().getFullYear());
populateTimeSelectors();
syncTimePlace();
syncUnknownBirthTime();
initMenhAi({prepare:()=>collectMenhForm(),activity});
initSharedView({kind:'menh',resultSelector:'#menh-result'});
