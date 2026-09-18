import {generateQimen,toQimenBoard} from './qimen/core/board.mjs';
import {analyzeMenhNatal,analyzeUnknownMenhCandidates,createMenhNatal,MENH_PROTOCOL,MENH_RULE_VERSION,prepareUnknownBirthTimeCandidates} from './menh-core.mjs';
import {buildMenhWriterContext} from './qimen/menh/ai/writer-context.mjs';
import {validateMenhReading} from './qimen/menh/ai/reading-audit.mjs';

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
  const lifeEvents=body.lifeEvents&&typeof body.lifeEvents==='object'?Object.fromEntries(Object.entries(body.lifeEvents).map(([k,v])=>[k,Object.freeze((Array.isArray(v)?v:[]).map(Number).filter(y=>Number.isInteger(y)&&y>=1900&&y<=2100))])):null;
  return freeze({...date,...(time||{}),fullName,birthPlace,lifeEvents,birthDateLocal:body.birthDateLocal,birthTimeMode:mode,birthTimeLocal:mode==='KNOWN'?body.birthTimeLocal:null,tzOffset,age,annualYear,sexMetadata});
}
function canonicalPillar(pillar){
  const stem=STEM[pillar?.stem?.han],branch=BRANCH[pillar?.branch?.han];
  if(!stem||!branch)throw new Error('Không chuyển được Can Chi sang canonical pillar.');
  return `${stem}_${branch}`;
}
const EVENT_DOMAIN=Object.freeze({marriage:'MARRIAGE',children:'CHILDREN',career:'CAREER',wealth:'WEALTH',family:'FAMILY'});
function rectifyCandidates(candidates,normalized){
  const events=Object.entries(normalized.lifeEvents||{}).flatMap(([kind,years])=>(years||[]).map(year=>({kind,domain:EVENT_DOMAIN[kind],year}))).filter(e=>e.domain);
  if(!events.length)return freeze({status:'NEED_EVENTS',eventCount:0,ranked:[]});
  const ranked=candidates.map(c=>{
    let points=0,maxPoints=0;const matches=[];
    const domainPalaces=new Map();
    for(const event of events){
      if(!domainPalaces.has(event.domain)){
        const ids=new Set(c.result.claims.filter(x=>x.domain===event.domain).flatMap(x=>x.evidenceIds));
        domainPalaces.set(event.domain,new Set(c.result.evidence.filter(e=>ids.has(e.evidenceId)&&e.palace&&e.palace!=='GLOBAL').map(e=>e.palace)));
      }
      const annualPillar=annualPillarForYear(event.year,normalized.tzOffset);
      const timed=analyzeOne(inputFrom(normalized.birthDateLocal,c.time,normalized.tzOffset),{age:event.year-normalized.year,annualPillar,sexMetadata:normalized.sexMetadata}).result;
      const primary=timed.annual?.annualStemPalace,secondary=timed.annual?.annualBranchPalace,palaces=domainPalaces.get(event.domain);
      const p=palaces.has(primary)?2:0,s=palaces.has(secondary)?1:0;points+=p+s;maxPoints+=3;
      matches.push(freeze({kind:event.kind,year:event.year,primaryMatch:p>0,secondaryMatch:s>0}));
    }
    return {id:c.id,family:c.family,time:c.time,points,maxPoints,matches,board:c.result.natal.baseBoard,evidence:c.result.evidence};
  }).sort((a,b)=>b.points-a.points||a.time.localeCompare(b.time));
  const best=ranked[0]?.points??0,second=ranked[1]?.points??0;
  const confidence=best===0?'INSUFFICIENT':best-second>=3?'STRONG':best-second>=1?'LEADING':'TIED';
  return freeze({status:confidence,eventCount:events.length,bestId:ranked[0]?.id||null,ranked:ranked.map((x,i)=>freeze({...x,rank:i+1}))});
}
function annualPillarForYear(year,tzOffset){
  if(year==null)return null;
  const chart=generateQimen({year,month:7,day:1,hour:12,minute:0,tzOffset},'chaibu');
  return canonicalPillar(chart.pillars.year);
}
function inputFrom(date,time,tzOffset){
  const [year,month,day]=date.split('-').map(Number),[hour,minute]=time.split(':').map(Number);
  return {year,month,day,hour,minute,tzOffset};
}
function technicalFrom(board,profileId,birthTimeMode,inputTime){
  return freeze({
    profileId,birthTimeMode,inputTime:inputTime||null,
    pillars:{year:board.pillars.year.vi,month:board.pillars.month.vi,day:board.pillars.day.vi,hour:board.pillars.hour.vi},
    pillarHan:{year:board.pillars.year.han,month:board.pillars.month.han,day:board.pillars.day.han,hour:board.pillars.hour.han},
    dun:board.dun,ju:board.ju,term:board.term?.vi||null,engineVersion:board.engineVersion,
  });
}
function analyzeOne(input,{age,annualPillar,sexMetadata}){
  const chart=generateQimen(input,'chaibu'),board=toQimenBoard(chart),natal=createMenhNatal(board);
  return {chart,board,natal,result:analyzeMenhNatal(natal,{age,annualPillar,sexMetadata,sourceTrace:['KM-MENH-1.0_RUNTIME']})};
}
export function prepareMenhReading(body){
  const normalized=normalizeBody(body);
  const annualPillar=annualPillarForYear(normalized.annualYear,normalized.tzOffset);
  if(normalized.birthTimeMode==='KNOWN'){
    const one=analyzeOne(inputFrom(normalized.birthDateLocal,normalized.birthTimeLocal,normalized.tzOffset),{age:normalized.age,annualPillar,sexMetadata:normalized.sexMetadata});
    return freeze({
      input:normalized,
      result:one.result,
      technical:technicalFrom(one.board,one.result.profileId,'KNOWN',normalized.birthTimeLocal),
      candidateCount:1,
      annualPillar,
    });
  }
  const set=prepareUnknownBirthTimeCandidates({birthDateLocal:normalized.birthDateLocal,timezone:`UTC${normalized.tzOffset>=0?'+':''}${normalized.tzOffset}`});
  const candidates=set.candidates.map(candidate=>{
    const one=analyzeOne(inputFrom(normalized.birthDateLocal,candidate.birthTimeLocal,normalized.tzOffset),{age:normalized.age,annualPillar,sexMetadata:normalized.sexMetadata});
    return {id:candidate.id,family:candidate.family,time:candidate.birthTimeLocal,result:one.result,technical:technicalFrom(one.board,one.result.profileId,'UNKNOWN',candidate.birthTimeLocal)};
  });
  const composite=analyzeUnknownMenhCandidates(candidates.map(c=>c.result),{sourceTrace:['KM-MENH-1.0_RUNTIME']});
  const rectification=rectifyCandidates(candidates,normalized);
  return freeze({
    input:normalized,
    result:composite,
    technical:{
      profileId:composite.profileId,birthTimeMode:'UNKNOWN',inputTime:null,
      candidateFamilies:set.familyCount,executableCandidateCount:set.executableCandidateCount,
      dayBoundaryVariants:set.dayBoundaryVariants,
      yearPillars:Object.freeze([...new Set(candidates.map(c=>c.technical.pillarHan.year))]),
      dayPillars:Object.freeze([...new Set(candidates.map(c=>c.technical.pillarHan.day))]),
    },
    candidates:Object.freeze(candidates.map(c=>freeze({id:c.id,family:c.family,time:c.time,technical:c.technical,board:c.result.natal.baseBoard,claims:c.result.claims,evidence:c.result.evidence}))),
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
  const requestFingerprint=await digest({protocol:MENH_PROTOCOL,rules:MENH_RULE_VERSION,input:prepared.input,deterministicFingerprint});
  return {deterministicFingerprint,requestFingerprint};
}
export async function buildMenhReadingRequest(body){
  const prepared=prepareMenhReading(body),identity=await menhReadingIdentity(prepared);
  return {...prepared,...identity,request:{
    fullName:prepared.input.fullName,birthPlace:prepared.input.birthPlace,birthDateLocal:prepared.input.birthDateLocal,birthTimeMode:prepared.input.birthTimeMode,birthTimeLocal:prepared.input.birthTimeLocal,
    tzOffset:prepared.input.tzOffset,age:prepared.input.age,annualYear:prepared.input.annualYear,sexMetadata:prepared.input.sexMetadata,lifeEvents:prepared.input.lifeEvents,
    protocol:MENH_PROTOCOL,rules:MENH_RULE_VERSION,...identity,
  }};
}
export function assertMenhCompatible(data){
  if(data?.menhRules!==MENH_RULE_VERSION||data?.menhProtocol!==MENH_PROTOCOL)throw new Error(UPGRADE_MESSAGE);
}
export function writerContextForPrepared(prepared){
  return buildMenhWriterContext(prepared.result,{birthTimeMode:prepared.input.birthTimeMode,stability:prepared.result.stability||null});
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
