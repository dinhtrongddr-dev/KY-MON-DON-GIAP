export const TIMEPLACE_VERSION='KM-TIMEPLACE-2.0';

const two=n=>String(n).padStart(2,'0');
const sameParts=(a,b)=>['year','month','day','hour','minute'].every(k=>a[k]===b[k]);
const localUtcMs=input=>Date.UTC(input.year,input.month-1,input.day,input.hour,input.minute);
const normalizeMinutes=value=>Math.round(value*1e9)/1e9;

function validateZone(zone){
  if(typeof zone!=='string'||!zone.trim())throw new Error('Nhập múi giờ IANA, ví dụ Asia/Ho_Chi_Minh.');
  const name=zone.trim();
  try{new Intl.DateTimeFormat('en-US',{timeZone:name}).format(0);}catch{throw new Error('Múi giờ IANA không hợp lệ.');}
  return name;
}

const FORMATTERS=new Map();
function formatter(zone,timeZoneName='longOffset'){
  const key=zone+'|'+timeZoneName;if(FORMATTERS.has(key))return FORMATTERS.get(key);
  const value=new Intl.DateTimeFormat('en-CA',{
    timeZone:zone,calendar:'gregory',numberingSystem:'latn',hourCycle:'h23',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',
    timeZoneName
  });FORMATTERS.set(key,value);return value;
}

function partsAt(zone,utcMs){
  const raw=Object.fromEntries(formatter(zone).formatToParts(new Date(utcMs)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return {year:Number(raw.year),month:Number(raw.month),day:Number(raw.day),hour:Number(raw.hour),minute:Number(raw.minute),second:Number(raw.second||0),timeZoneName:raw.timeZoneName};
}

function parseOffsetMinutes(label){
  if(label==='GMT'||label==='UTC')return 0;
  const m=String(label||'').match(/^(?:GMT|UTC)([+-])(\d{1,2}):?(\d{2})?(?::(\d{2}))?$/);
  if(!m)throw new Error('Không đọc được UTC offset của múi giờ IANA trên thiết bị này.');
  const sign=m[1]==='-'?-1:1,h=Number(m[2]),min=Number(m[3]||0),sec=Number(m[4]||0);
  return sign*(h*60+min+sec/60);
}

export function offsetMinutesAt(zone,utcMs){
  const p=partsAt(zone,utcMs);
  return parseOffsetMinutes(p.timeZoneName);
}

export function localInputValueAtZone(utcMs,zone){
  zone=validateZone(zone);const p=partsAt(zone,utcMs);
  return p.year+'-'+two(p.month)+'-'+two(p.day)+'T'+two(p.hour)+':'+two(p.minute);
}

function offsetLabel(offsetMinutes){
  const sign=offsetMinutes<0?'−':'+';const total=Math.abs(Math.round(offsetMinutes));
  return 'UTC'+sign+two(Math.floor(total/60))+':'+two(total%60);
}

function candidateOffsets(zone,guess){
  const values=new Set();
  for(let h=-42;h<=42;h+=3)values.add(offsetMinutesAt(zone,guess+h*3600000));
  return [...values];
}

export function resolveIanaLocal(input,zone,{disambiguation='reject'}={}){
  zone=validateZone(zone);
  if(!['reject','earlier','later'].includes(disambiguation))throw new Error('Cách xử lý giờ DST trùng không hợp lệ.');
  const target={year:input.year,month:input.month,day:input.day,hour:input.hour,minute:input.minute};
  const guess=localUtcMs(input);
  const rows=candidateOffsets(zone,guess).map(offsetMinutes=>{
    const utcMs=guess-offsetMinutes*60000;
    const actual=partsAt(zone,utcMs);
    return {utcMs,offsetMinutes,actual};
  }).filter(r=>sameParts(target,r.actual)&&offsetMinutesAt(zone,r.utcMs)===r.offsetMinutes)
    .sort((a,b)=>a.utcMs-b.utcMs);
  const unique=[...new Map(rows.map(r=>[r.utcMs,r])).values()];
  if(!unique.length)throw new Error('Giờ '+two(input.hour)+':'+two(input.minute)+' ngày '+two(input.day)+'/'+two(input.month)+'/'+input.year+' không tồn tại trong '+zone+' do chuyển đồng hồ/DST. Hãy chọn giờ dân dụng hợp lệ khác.');
  if(unique.length>1&&disambiguation==='reject')throw new Error('Giờ '+two(input.hour)+':'+two(input.minute)+' ngày '+two(input.day)+'/'+two(input.month)+'/'+input.year+' xuất hiện hai lần trong '+zone+'. Chọn “lần sớm” hoặc “lần muộn” để xác định đúng UTC offset.');
  const chosen=unique.length===1?unique[0]:disambiguation==='later'?unique.at(-1):unique[0];
  if(Math.abs(chosen.offsetMinutes-Math.round(chosen.offsetMinutes))>1e-8)throw new Error('Múi giờ lịch sử tại thời điểm này có UTC offset theo giây; core hiện chỉ nhận đến phút nên KM-TIMEPLACE-2.0 không tự làm tròn.');
  if(chosen.offsetMinutes<-12*60||chosen.offsetMinutes>14*60)throw new Error('UTC offset lịch sử nằm ngoài phạm vi core UTC−12 đến UTC+14.');
  return {
    timeZone:zone,utcMs:chosen.utcMs,offsetMinutes:chosen.offsetMinutes,offsetHours:chosen.offsetMinutes/60,
    offsetLabel:offsetLabel(chosen.offsetMinutes),
    status:unique.length>1?'ambiguous_resolved':'unique',
    disambiguation:unique.length>1?disambiguation:null,
    alternatives:unique.map(r=>({utcMs:r.utcMs,offsetMinutes:r.offsetMinutes,offsetHours:r.offsetMinutes/60,offsetLabel:offsetLabel(r.offsetMinutes)}))
  };
}

function isLeap(y){return y%4===0&&(y%100!==0||y%400===0);}
function dayOfYear(input){
  return Math.floor((Date.UTC(input.year,input.month-1,input.day)-Date.UTC(input.year,0,1))/86400000)+1;
}
export function equationOfTimeMinutes(input){
  const days=isLeap(input.year)?366:365;
  const gamma=2*Math.PI/days*(dayOfYear(input)-1+(input.hour-12)/24);
  return 229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
}

function solarClock(input,offsetHours,longitude){
  const meanCorrection=4*longitude-60*offsetHours;
  const eot=equationOfTimeMinutes(input);
  const apparentCorrection=meanCorrection+eot;
  const civilMinutes=input.hour*60+input.minute;
  const raw=civilMinutes+apparentCorrection;
  const dayShift=Math.floor(raw/1440);
  const minutes=((raw%1440)+1440)%1440;
  const hh=Math.floor(minutes/60),mm=Math.floor(minutes%60),ss=Math.round((minutes-Math.floor(minutes))*60);
  return {
    longitude,standardMeridian:offsetHours*15,
    localMeanSolarCorrectionMinutes:normalizeMinutes(meanCorrection),
    equationOfTimeMinutes:normalizeMinutes(eot),
    apparentSolarCorrectionMinutes:normalizeMinutes(apparentCorrection),
    apparentSolarClock:{dayShift,hour:hh,minute:mm,second:ss>=60?59:ss},
    source:'NOAA_GML_GENERAL_SOLAR_POSITION_APPROXIMATION',
    application:'metadata_only',
    warning:'Giờ Mặt Trời biểu kiến chỉ để đối chiếu trong KM-TIMEPLACE-2.0; không tự thay giờ dân dụng dùng để lập bàn.'
  };
}

function normalizeCoordinates(raw={}){
  const hasLat=raw.latitude!==undefined&&raw.latitude!==null&&raw.latitude!=='';
  const hasLon=raw.longitude!==undefined&&raw.longitude!==null&&raw.longitude!=='';
  if(!hasLat&&!hasLon)return null;
  if(!hasLon)throw new Error('Muốn tính đối chiếu giờ Mặt Trời cần nhập kinh độ.');
  const longitude=Number(raw.longitude),latitude=hasLat?Number(raw.latitude):null;
  if(!Number.isFinite(longitude)||longitude<-180||longitude>180)throw new Error('Kinh độ phải từ −180 đến 180.');
  if(latitude!==null&&(!Number.isFinite(latitude)||latitude<-90||latitude>90))throw new Error('Vĩ độ phải từ −90 đến 90.');
  return {latitude,longitude};
}

export function resolveTimePlace(input,rawPolicy=null){
  const policy=rawPolicy&&typeof rawPolicy==='object'&&!Array.isArray(rawPolicy)?rawPolicy:{};
  const mode=policy.mode||'fixed_offset';
  if(!['fixed_offset','iana_civil'].includes(mode))throw new Error('Chế độ múi giờ không hợp lệ.');
  const coords=normalizeCoordinates(policy);
  let boardInput={...input},iana=null;
  if(mode==='iana_civil'){
    iana=resolveIanaLocal(input,policy.timeZone,{disambiguation:policy.disambiguation||'reject'});
    boardInput={...input,tzOffset:iana.offsetHours};
  }
  const effectiveOffset=boardInput.tzOffset;
  const solar=coords?solarClock(boardInput,effectiveOffset,coords.longitude):null;
  return {
    version:TIMEPLACE_VERSION,
    originalInput:{...input},
    boardInput,
    request:{
      mode,
      ...(mode==='iana_civil'?{timeZone:iana.timeZone,disambiguation:policy.disambiguation||'reject'}:{}),
      ...(coords?coords:{})
    },
    metadata:{
      mode,
      civilTimeBasis:mode==='iana_civil'?'iana_civil_history':'fixed_utc_offset',
      submittedOffsetHours:input.tzOffset,
      effectiveOffsetHours:effectiveOffset,
      iana,
      coordinates:coords,
      solar,
      boardApplication:mode==='iana_civil'?'iana_offset_only':'fixed_offset_unchanged',
      coreChanged:false,
      note:'KM-TIMEPLACE-2.0 không tự áp dụng giờ Mặt Trời vào core. Chỉ IANA civil mode, khi người dùng chọn rõ, mới thay UTC offset dùng để quy đổi cùng giờ dân dụng.'
    }
  };
}
