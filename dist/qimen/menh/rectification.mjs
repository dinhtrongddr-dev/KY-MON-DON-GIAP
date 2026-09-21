import {MENH_RECTIFICATION_VERSION} from './version.mjs';

export const RECTIFICATION_VALIDATION_CASES=1;
export const RECTIFICATION_VALIDATION_STATUS='RESEARCH_ONLY';
export const RECTIFICATION_MIN_EVENTS=5;
export const RECTIFICATION_MIN_DOMAINS=3;

export const RECTIFICATION_EVENT_DOMAIN=Object.freeze({
  MARRIAGE:'MARRIAGE',
  CHILDREN:'CHILDREN',
  CAREER:'CAREER',
  WEALTH:'WEALTH',
  FAMILY:'FAMILY',
  RELOCATION:'SELF',
});

export const RECTIFICATION_WINDOWS=Object.freeze({
  ALL:null,
  MORNING:Object.freeze(['MAO','CHEN','SI','WU']),
  AFTERNOON:Object.freeze(['WU','WEI','SHEN','YOU']),
  EVENING:Object.freeze(['YOU','XU','HAI']),
  NIGHT:Object.freeze(['ZI','CHOU','YIN']),
});

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const codePalace=e=>e?.palace&&e.palace!=='GLOBAL'?e.palace:null;

function domainPalaces(result,domain){
  const claimIds=new Set(result.claims.filter(c=>c.domain===domain).map(c=>c.claimId));
  const evidenceIds=new Set(result.claims.filter(c=>claimIds.has(c.claimId)).flatMap(c=>c.evidenceIds));
  return new Set(result.evidence.filter(e=>evidenceIds.has(e.evidenceId)).map(codePalace).filter(Boolean));
}

function scoreEvent(baseResult,timedResult,event){
  const domain=RECTIFICATION_EVENT_DOMAIN[event.kind];
  const palaces=domainPalaces(baseResult,domain);
  const primary=timedResult.annual?.annualStemPalace||null;
  const secondary=timedResult.annual?.annualBranchPalace||null;
  const primaryMatch=primary?palaces.has(primary):false;
  const secondaryMatch=secondary?palaces.has(secondary):false;
  const supportUnits=(primaryMatch?2:0)+(secondaryMatch?1:0);
  return freeze({
    kind:event.kind,date:event.date,precision:event.precision,domain,
    annualResolutionOnly:true,
    primary,secondary,primaryMatch,secondaryMatch,supportUnits,
    mechanisms:Object.freeze([
      ...(primaryMatch?['ANNUAL_STEM_PRIMARY']:[]),
      ...(secondaryMatch?['ANNUAL_BRANCH_SECONDARY']:[]),
    ]),
  });
}

export function rectifyMenhCandidates(candidates,normalized,{analyzeEvent}={}){
  if(!Array.isArray(candidates)||!candidates.length)throw new Error('KM-MENH rectification: thiếu ứng viên giờ sinh.');
  if(typeof analyzeEvent!=='function')throw new Error('KM-MENH rectification: thiếu hàm phân tích lưu niên ứng viên.');
  const allowed=RECTIFICATION_WINDOWS[normalized.birthTimeWindow];
  const filtered=allowed?candidates.filter(c=>allowed.includes(c.family)):candidates;
  const events=(normalized.lifeEvents||[]).filter(e=>RECTIFICATION_EVENT_DOMAIN[e.kind]&&Number.isInteger(e.year));
  const base={
    version:MENH_RECTIFICATION_VERSION,
    validationStatus:RECTIFICATION_VALIDATION_STATUS,
    validationCaseCount:RECTIFICATION_VALIDATION_CASES,
    accuracyClaimAllowed:false,
    autoSelectedBirthHour:null,
    annualResolutionOnly:true,
    majorityVoteAllowed:false,
    searchWindow:normalized.birthTimeWindow,
    candidateCount:filtered.length,
    candidateIds:Object.freeze(filtered.map(c=>c.id)),
    eventCount:events.length,
    distinctDomains:new Set(events.map(e=>RECTIFICATION_EVENT_DOMAIN[e.kind])).size,
    minimumGate:{events:RECTIFICATION_MIN_EVENTS,domains:RECTIFICATION_MIN_DOMAINS},
    note:'Bộ lọc giờ sinh đang ở trạng thái nghiên cứu. Thứ hạng chỉ so sánh tương đối mức trùng kích hoạt lưu niên với các nhóm sự việc đã xảy ra; không phải xác suất và không chứng minh giờ sinh thật.',
  };
  if(!events.length)return freeze({...base,status:'NEED_EVENTS',leadingCandidateId:null,runnerUpId:null,ranked:[]});
  const ranked=filtered.map(candidate=>{
    const matches=events.map(event=>scoreEvent(candidate.result,analyzeEvent(candidate,event),event));
    const supportUnits=matches.reduce((sum,m)=>sum+m.supportUnits,0);
    const supportedEvents=matches.filter(m=>m.supportUnits>0).length;
    const primaryHits=matches.filter(m=>m.primaryMatch).length;
    const secondaryHits=matches.filter(m=>m.secondaryMatch).length;
    return {
      id:candidate.id,family:candidate.family,time:candidate.time,
      supportUnits,supportedEvents,primaryHits,secondaryHits,matches,
      board:candidate.result.natal.baseBoard,evidence:candidate.result.evidence,
    };
  }).sort((a,b)=>b.supportUnits-a.supportUnits||b.supportedEvents-a.supportedEvents||b.primaryHits-a.primaryHits||a.time.localeCompare(b.time));
  const numbered=ranked.map((row,index)=>freeze({...row,rank:index+1}));
  const enough=events.length>=RECTIFICATION_MIN_EVENTS&&base.distinctDomains>=RECTIFICATION_MIN_DOMAINS;
  const top=numbered[0]||null,second=numbered[1]||null;
  const status=!enough?'RESEARCH_INSUFFICIENT':!top?'RESEARCH_INSUFFICIENT':second&&top.supportUnits===second.supportUnits&&top.supportedEvents===second.supportedEvents?'RESEARCH_TIED':'RESEARCH_LEADING';
  return freeze({
    ...base,status,
    leadingCandidateId:status==='RESEARCH_LEADING'?top?.id||null:null,
    runnerUpId:second?.id||null,
    separationUnits:top&&second?top.supportUnits-second.supportUnits:null,
    ranked:numbered,
  });
}
