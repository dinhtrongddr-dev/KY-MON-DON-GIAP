import {generateQimen,toQimenBoard} from './qimen/core/board.mjs';
import {analyzeMenhNatal,analyzeUnknownMenhCandidates,createMenhNatal,MENH_PROTOCOL,MENH_RULE_VERSION,prepareUnknownBirthTimeCandidates} from './menh-core.mjs';
import {buildMenhWriterContext} from './qimen/menh/ai/writer-context.mjs';
import {validateMenhReading} from './qimen/menh/ai/reading-audit.mjs';
import {resolveTimePlace} from './qimen/timePlace.mjs';
import {rectifyMenhCandidates,RECTIFICATION_EVENT_DOMAIN,RECTIFICATION_WINDOWS} from './qimen/menh/rectification.mjs';
import {CASE_ENGINE_VERSION} from './qimen/case/engine.mjs';
import {NARRATIVE_VERSION} from './qimen/ai/narrativePrimitives.mjs';

const STEM=Object.freeze({'甲':'JIA','乙':'YI','丙':'BING','丁':'DING','戊':'WU','己':'JI','庚':'GENG','辛':'XIN','壬':'REN','癸':'GUI'});
const BRANCH=Object.freeze({'子':'ZI','丑':'CHOU','寅':'YIN','卯':'MAO','辰':'CHEN','巳':'SI','午':'WU','未':'WEI','申':'SHEN','酉':'YOU','戌':'XU','亥':'HAI'});
const UPGRADE_MESSAGE=`Bộ kết nối AI chưa hỗ trợ ${MENH_RULE_VERSION}. Hãy cập nhật bộ kết nối rồi thử lại.`;
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const two=n=>String(n).padStart(2,'0');

function parseDate(value){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');
  if(!m)throw new Error('Ngày sinh phải có dạng YYYY-MM-DD.');
  const [y,mo,d]=m.slice(1).map(Number),date=new Date(Date.UTC(y,mo-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==mo-1||date.getUTCDate()!==d)throw new Error('Ngày sinh không hợp lệ.');
  return {year:y,month:mo,day:d};
}
function parseTime(value){
  const m=/^(\d{2}):(\d{2})$/.exec(value||'');
  if(!m||Number(m[1])>23||Number(m[2])>59)throw new Error('Giờ sinh phải có dạng HH:mm hợp lệ.');
  return {hour:Number(m[1]),minute:Number(m[2])};
}
function normalizeTimePlacePolicy(raw){
  const policy=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const mode=policy.mode||'fixed_offset';
  if(!['fixed_offset','iana_civil'].includes(mode))throw new Error('Chế độ múi giờ Mệnh không hợp lệ.');
  const out={mode};
  if(mode==='iana_civil'){
    const timeZone=String(policy.timeZone||'').trim();
    if(!timeZone)throw new Error('Nhập múi giờ IANA nơi sinh, ví dụ Asia/Ho_Chi_Minh.');
    const disambiguation=policy.disambiguation||'reject';
    if(!['reject','earlier','later'].includes(disambiguation))throw new Error('Cách xử lý giờ DST trùng không hợp lệ.');
    out.timeZone=timeZone;out.disambiguation=disambiguation;
  }
  if(policy.longitude!==undefined&&policy.longitude!==null&&policy.longitude!=='')out.longitude=Number(policy.longitude);
  if(policy.latitude!==undefined&&policy.latitude!==null&&policy.latitude!=='')out.latitude=Number(policy.latitude);
  return freeze(out);
}
function normalizeLifeEvents(raw,birthYear){
  if(!Array.isArray(raw))return [];
  const out=[];
  for(const value of raw){
    const kind=String(value?.kind||'').toUpperCase(),year=Number(value?.year);
    if(!RECTIFICATION_EVENT_DOMAIN[kind]||!Number.isInteger(year)||year<birthYear||year>2100)continue;
    const month=value.month==null?null:Number(value.month),day=value.day==null?null:Number(value.day);
    if(month!==null&&(!Number.isInteger(month)||month<1||month>12))continue;
    if(day!==null){
      if(month===null||!Number.isInteger(day))continue;
      const check=new Date(Date.UTC(year,month-1,day));
      if(check.getUTCFullYear()!==year||check.getUTCMonth()+1!==month||check.getUTCDate()!==day)continue;
    }
    const precision=day!==null?'DAY':month!==null?'MONTH':'YEAR';
    out.push(freeze({kind,year,month,day,precision,date:String(value.date||year).slice(0,32)}));
  }
  return Object.freeze(out);
}
function normalizeBody(body={}){
  const date=parseDate(body.birthDateLocal);
  const mode=body.birthTimeMode;
  if(!['KNOWN','UNKNOWN'].includes(mode))throw new Error('Chọn biết giờ sinh hoặc không nhớ giờ sinh.');
  const time=mode==='KNOWN'?parseTime(body.birthTimeLocal):null;
  const tzOffset=Number(body.tzOffset);
  if(!Number.isFinite(tzOffset)||tzOffset<-12||tzOffset>14)throw new Error('Múi giờ UTC không hợp lệ.');
  const age=body.age==null||body.age===''?null:Number(body.age);
  if(age!=null&&(!Number.isInteger(age)||age<1||age>120))throw new Error('Tuổi đại vận phải là số nguyên từ 1 đến 120.');
  const annualYear=body.annualYear==null||body.annualYear===''?null:Number(body.annualYear);
  if(annualYear!=null&&(!Number.isInteger(annualYear)||annualYear<1900||annualYear>2100))throw new Error('Năm lưu niên phải từ 1900 đến 2100.');
  const sexMetadata=body.sexMetadata==null||body.sexMetadata===''?null:String(body.sexMetadata).toUpperCase();
  if(sexMetadata&&!['MALE','FEMALE'].includes(sexMetadata))throw new Error('Giới tính metadata không hợp lệ.');
  const fullName=body.fullName==null||body.fullName===''?null:String(body.fullName).trim().slice(0,120)||null;
  const birthPlace=body.birthPlace==null||body.birthPlace===''?null:String(body.birthPlace).trim().slice(0,160)||null;
  const birthTimeWindow=mode==='UNKNOWN'&&Object.hasOwn(RECTIFICATION_WINDOWS,body.birthTimeWindow||'ALL')?(body.birthTimeWindow||'ALL'):'ALL';
  const timePlace=normalizeTimePlacePolicy(body.timePlace);
  const lifeEvents=normalizeLifeEvents(body.lifeEvents,date.year);
  return freeze({...date,...(time||{}),fullName,birthPlace,lifeEvents,birthTimeWindow,birthDateLocal:body.birthDateLocal,birthTimeMode:mode,birthTimeLocal:mode==='KNOWN'?body.birthTimeLocal:null,tzOffset,timePlace,age,annualYear,sexMetadata});
}
function canonicalPillar(pillar){
  const stem=STEM[pillar?.stem?.han],branch=BRANCH[pillar?.branch?.han];
  if(!stem||!branch)throw new Error('Không chuyển được Can Chi sang canonical pillar.');
  return `${stem}_${branch}`;
}
function annualPillarForYear(year,normalized){
  if(year==null)return null;
  const base={year,month:7,day:1,hour:12,minute:0,tzOffset:normalized.tzOffset};
  const resolved=resolveTimePlace(base,normalized.timePlace);
  const chart=generateQimen(resolved.boardInput,'chaibu');
  return canonicalPillar(chart.pillars.year);
}
function inputFrom(date,time,tzOffset){
  const [year,month,day]=date.split('-').map(Number),[hour,minute]=time.split(':').map(Number);
  return {year,month,day,hour,minute,tzOffset};
}
function resolveNatalTime(normalized,time){
  const base=inputFrom(normalized.birthDateLocal,time,normalized.tzOffset);
  try{return resolveTimePlace(base,normalized.timePlace);}
  catch(error){
    if(normalized.birthTimeMode==='UNKNOWN'&&normalized.timePlace.mode==='iana_civil'){
      throw new Error('Ngày sinh này đi qua chuyển đổi giờ dân dụng của '+normalized.timePlace.timeZone+'. KM-MENH-1.1 không tự chọn một nhánh DST khi chưa biết giờ sinh: '+error.message);
    }
    throw error;
  }
}
function technicalFrom(board,profileId,birthTimeMode,inputTime,timePlace=null){
  return freeze({
    profileId,birthTimeMode,inputTime:inputTime||null,timePlace:timePlace?{
      version:timePlace.version,mode:timePlace.metadata.mode,civilTimeBasis:timePlace.metadata.civilTimeBasis,
      effectiveOffsetHours:timePlace.metadata.effectiveOffsetHours,timeZone:timePlace.metadata.iana?.timeZone||null,
      coordinates:timePlace.metadata.coordinates,solar:timePlace.metadata.solar,
    }:null,
    pillars:{year:board.pillars.year.vi,month:board.pillars.month.vi,day:board.pillars.day.vi,hour:board.pillars.hour.vi},
    pillarHan:{year:board.pillars.year.han,month:board.pillars.month.han,day:board.pillars.day.han,hour:board.pillars.hour.han},
    dun:board.dun,ju:board.ju,term:board.term?.vi||null,engineVersion:board.engineVersion,
  });
}
function analyzeOne(input,{age,annualPillar,sexMetadata}){
  const chart=generateQimen(input,'chaibu'),board=toQimenBoard(chart),natal=createMenhNatal(board);
  return {chart,board,natal,result:analyzeMenhNatal(natal,{age,annualPillar,sexMetadata,sourceTrace:['KM-MENH-1.1_RUNTIME']})};
}
export function prepareMenhReading(body){
  const normalized=normalizeBody(body);
  const annualPillar=annualPillarForYear(normalized.annualYear,normalized);
  if(normalized.birthTimeMode==='KNOWN'){
    const timePlace=resolveNatalTime(normalized,normalized.birthTimeLocal);
    const one=analyzeOne(timePlace.boardInput,{age:normalized.age,annualPillar,sexMetadata:normalized.sexMetadata});
    return freeze({
      input:normalized,
      result:one.result,
      technical:technicalFrom(one.board,one.result.profileId,'KNOWN',normalized.birthTimeLocal,timePlace),
      timePlace,
      candidateCount:1,
      annualPillar,
    });
  }
  const timezone=normalized.timePlace.mode==='iana_civil'?normalized.timePlace.timeZone:`UTC${normalized.tzOffset>=0?'+':''}${normalized.tzOffset}`;
  const set=prepareUnknownBirthTimeCandidates({birthDateLocal:normalized.birthDateLocal,timezone});
  const candidates=set.candidates.map(candidate=>{
    const timePlace=resolveNatalTime(normalized,candidate.birthTimeLocal);
    const one=analyzeOne(timePlace.boardInput,{age:normalized.age,annualPillar,sexMetadata:normalized.sexMetadata});
    return {
      id:candidate.id,family:candidate.family,time:candidate.birthTimeLocal,result:one.result,timePlace,
      technical:technicalFrom(one.board,one.result.profileId,'UNKNOWN',candidate.birthTimeLocal,timePlace)
    };
  });
  const composite=analyzeUnknownMenhCandidates(candidates.map(c=>c.result),{sourceTrace:['KM-MENH-1.1_RUNTIME']});
  const rectification=rectifyMenhCandidates(candidates,normalized,{
    analyzeEvent:(candidate,event)=>{
      const eventAnnualPillar=annualPillarForYear(event.year,normalized);
      return analyzeMenhNatal(candidate.result.natal,{age:null,annualPillar:eventAnnualPillar,sexMetadata:normalized.sexMetadata,sourceTrace:['KM-MENH-RECTIFICATION-1.0']});
    },
  });
  const effectiveOffsets=[...new Set(candidates.map(c=>c.timePlace.metadata.effectiveOffsetHours))];
  return freeze({
    input:normalized,
    result:composite,
    technical:{
      profileId:composite.profileId,birthTimeMode:'UNKNOWN',inputTime:null,
      candidateFamilies:set.familyCount,executableCandidateCount:set.executableCandidateCount,
      dayBoundaryVariants:set.dayBoundaryVariants,
      timePlace:{version:candidates[0]?.timePlace.version||'KM-TIMEPLACE-2.0',mode:normalized.timePlace.mode,timeZone:normalized.timePlace.timeZone||null,effectiveOffsets},
      yearPillars:Object.freeze([...new Set(candidates.map(c=>c.technical.pillarHan.year))]),
      dayPillars:Object.freeze([...new Set(candidates.map(c=>c.technical.pillarHan.day))]),
    },
    candidates:Object.freeze(candidates.map(c=>freeze({
      id:c.id,family:c.family,time:c.time,technical:c.technical,timePlace:c.timePlace.metadata,
      board:c.result.natal.baseBoard,claims:c.result.claims,evidence:c.result.evidence
    }))),
    candidateCount:candidates.length,
    rectification,
    annualPillar,
  });
}
async function digest(value){
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function menhReadingIdentity(prepared){
  const deterministicFingerprint=await digest({result:prepared.result,technical:prepared.technical,candidateCount:prepared.candidateCount});
  const caseGuidance=writerContextForPrepared(prepared).caseGuidance;
  const requestFingerprint=await digest({protocol:MENH_PROTOCOL,narrativeVersion:NARRATIVE_VERSION,rules:MENH_RULE_VERSION,caseRules:CASE_ENGINE_VERSION,input:prepared.input,deterministicFingerprint,caseGuidance});
  return {deterministicFingerprint,requestFingerprint};
}
export async function buildMenhReadingRequest(body){
  const prepared=prepareMenhReading(body),identity=await menhReadingIdentity(prepared);
  return {...prepared,...identity,request:{
    fullName:prepared.input.fullName,birthPlace:prepared.input.birthPlace,birthDateLocal:prepared.input.birthDateLocal,birthTimeMode:prepared.input.birthTimeMode,birthTimeLocal:prepared.input.birthTimeLocal,
    tzOffset:prepared.input.tzOffset,timePlace:prepared.input.timePlace,age:prepared.input.age,annualYear:prepared.input.annualYear,sexMetadata:prepared.input.sexMetadata,lifeEvents:prepared.input.lifeEvents,birthTimeWindow:prepared.input.birthTimeWindow,
    protocol:MENH_PROTOCOL,rules:MENH_RULE_VERSION,caseRules:CASE_ENGINE_VERSION,...identity,
  }};
}
export function assertMenhCompatible(data){
  if(data?.menhRules!==MENH_RULE_VERSION||data?.menhProtocol!==MENH_PROTOCOL||data?.caseRules!==CASE_ENGINE_VERSION)throw new Error(UPGRADE_MESSAGE);
}
export function writerContextForPrepared(prepared){
  return buildMenhWriterContext(prepared.result,{birthTimeMode:prepared.input.birthTimeMode,stability:prepared.result.stability||null,timePlace:prepared.technical?.timePlace||null,rectification:prepared.rectification||null});
}
export function validateMenhReadingResponse(data,prepared){
  assertMenhCompatible(data);
  if(data.deterministicFingerprint!==prepared.deterministicFingerprint||data.requestFingerprint!==prepared.requestFingerprint)
    throw new Error('Lời luận Mệnh không khớp dữ kiện sinh hoặc kết quả deterministic đang xem; kết quả đã bị chặn.');
  const context=writerContextForPrepared(prepared);
  validateMenhReading(data.reading,context);
  return data;
}
export {MENH_PROTOCOL,MENH_RULE_VERSION};
