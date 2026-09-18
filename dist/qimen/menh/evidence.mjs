import {resolvePillarStem} from './resolvers.mjs';
import {palaceElementRelation} from './relations.mjs';

export const EVIDENCE_PRIORITY=Object.freeze({
  GLOBAL_HARD_STRUCTURE:1,
  SELF_CORE:2,
  DOMAIN_PRIMARY:3,
  DOMAIN_CORROBORATORS:4,
  LUCK_PERIOD_BACKGROUND:5,
  ANNUAL_ACTIVATION:6,
  OPTIONAL_TRANSMISSION:7,
});
const SEVERITY=Object.freeze({INFO:1,SOFT:2,MEDIUM:3,HIGH:4,HARD:5});
const freeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
};
const text=value=>String(value??'').trim();
const canonical=value=>text(value).toUpperCase();

export function evidenceDedupeKey({domain='GENERAL',palace='GLOBAL',mechanism}={}){
  const m=canonical(mechanism);
  if(!m)throw new Error('KM-MENH: evidence cần mechanism để dedupe.');
  return canonical(domain)+':'+canonical(palace)+':'+m;
}
export function createEvidence(input={}){
  const priorityClass=canonical(input.priorityClass);
  if(!EVIDENCE_PRIORITY[priorityClass])throw new Error('KM-MENH: priorityClass evidence không hợp lệ.');
  const severity=canonical(input.severity||'INFO');
  if(!SEVERITY[severity])throw new Error('KM-MENH: severity evidence không hợp lệ.');
  const required=['evidenceId','ruleId','sourceTier','domain','mechanism','effectTag','provenance'];
  for(const key of required)if(!text(input[key]))throw new Error('KM-MENH: evidence thiếu '+key+'.');
  const palace=text(input.palace||'GLOBAL');
  return freeze({
    evidenceId:text(input.evidenceId),ruleId:text(input.ruleId),sourceTier:text(input.sourceTier),
    provenance:text(input.provenance),domain:canonical(input.domain),palace,
    mechanism:canonical(input.mechanism),effectTag:canonical(input.effectTag),
    severity,priorityClass,dedupeKey:text(input.dedupeKey)||evidenceDedupeKey({domain:input.domain,palace,mechanism:input.mechanism}),
    favorable:input.favorable===true,sourceBacked:input.sourceBacked!==false,
    affectedDomains:Object.freeze([...(input.affectedDomains||[]).map(canonical)]),
    relation:input.relation?freeze({...input.relation}):null,
    metadata:freeze({...input.metadata}),
  });
}
const evidenceRank=e=>[
  EVIDENCE_PRIORITY[e.priorityClass]??999,
  -(SEVERITY[e.severity]??0),
  e.evidenceId,
];
const compare=(a,b)=>{
  const ra=evidenceRank(a),rb=evidenceRank(b);
  for(let i=0;i<ra.length;i++){if(ra[i]<rb[i])return -1;if(ra[i]>rb[i])return 1;}
  return 0;
};
export function dedupeEvidence(list=[]){
  const groups=new Map();
  for(const raw of list){
    const e=raw?.dedupeKey?raw:createEvidence(raw);
    const group=groups.get(e.dedupeKey)||[];
    group.push(e);groups.set(e.dedupeKey,group);
  }
  const out=[];
  for(const [dedupeKey,group] of groups){
    group.sort(compare);
    const primary=group[0];
    out.push(freeze({
      ...primary,
      evidenceId:primary.evidenceId,
      mergedEvidenceIds:Object.freeze(group.map(e=>e.evidenceId)),
      mergedRuleIds:Object.freeze([...new Set(group.map(e=>e.ruleId))]),
      aliasCount:group.length,
      rawVoteWeight:1,
      dedupeKey,
    }));
  }
  return Object.freeze(out.sort(compare));
}
export function resolveSelfIdentity({pillars}={}){
  if(!Array.isArray(pillars)||pillars.length!==4)throw new Error('KM-MENH: cần đủ bốn trụ để xác định Nhật can.');
  const day=canonical(pillars[2]);
  const match=/^(JIA|YI|BING|DING|WU|JI|GENG|XIN|REN|GUI)_(ZI|CHOU|YIN|MAO|CHEN|SI|WU|WEI|SHEN|YOU|XU|HAI)$/.exec(day);
  if(!match)throw new Error('KM-MENH: Nhật trụ canonical không hợp lệ.');
  return freeze({
    selfStem:resolvePillarStem(match[1],match[2]),
    sourceDayStem:match[1],
    sourceDayBranch:match[2],
    selfResolver:'DAY_STEM_PALACE',
    requireZhiFuZhiShiBaseline:true,
  });
}
function baselineEvidence({id,ruleId,mechanism,fromPalace,toPalace,sourceTier,provenance,effectTag}){
  const relation=palaceElementRelation(fromPalace,toPalace);
  return createEvidence({
    evidenceId:id,ruleId,sourceTier,provenance,domain:'SELF',palace:String(fromPalace.number??fromPalace.palace),
    mechanism,effectTag,severity:'INFO',priorityClass:'SELF_CORE',relation,
    metadata:{toPalace:toPalace.number??toPalace.palace,samePalace:relation.samePalace},
  });
}
export function buildSelfCoreEvidence({
  dayStemPalace,hourStemPalace,zhiFuPalace,zhiShiPalace,
  sourceTier='A1',provenance='DIRECT_ZHANG'
}={}){
  if(!dayStemPalace||!hourStemPalace||!zhiFuPalace||!zhiShiPalace)
    throw new Error('KM-MENH: self core cần Nhật can, Thời can, Trực Phù và Trực Sử palace.');
  const self=createEvidence({
    evidenceId:'SELF_DAY_STEM',ruleId:'KMZ-SELF-001',sourceTier,provenance,domain:'SELF',
    palace:String(dayStemPalace.number??dayStemPalace.palace),mechanism:'DAY_STEM_PALACE',
    effectTag:'SELF_IDENTITY',severity:'INFO',priorityClass:'SELF_CORE',
  });
  return dedupeEvidence([
    self,
    baselineEvidence({id:'SELF_ZHI_FU_BASELINE',ruleId:'KMZ-SELF-002',mechanism:'ZHI_FU_VS_SELF',
      fromPalace:dayStemPalace,toPalace:zhiFuPalace,sourceTier,provenance,effectTag:'ZHI_FU_BASELINE'}),
    baselineEvidence({id:'SELF_ZHI_SHI_BASELINE',ruleId:'KMZ-SELF-002',mechanism:'ZHI_SHI_VS_SELF',
      fromPalace:dayStemPalace,toPalace:zhiShiPalace,sourceTier,provenance,effectTag:'ZHI_SHI_BASELINE'}),
    baselineEvidence({id:'SELF_HOUR_DAY_BASELINE',ruleId:'KMZ-SELF-003',mechanism:'HOUR_STEM_VS_DAY_STEM',
      fromPalace:hourStemPalace,toPalace:dayStemPalace,sourceTier,provenance,effectTag:'GENERAL_PROCESS_BASELINE'}),
  ]);
}
export function createGlobalHardEvidence(input={}){
  const severity=canonical(input.severity);
  if(!['HIGH','HARD'].includes(severity))throw new Error('KM-MENH: global hard structure phải HIGH hoặc HARD.');
  if(input.sourceBacked!==true)throw new Error('KM-MENH: global hard structure phải có nguồn.');
  if(!Array.isArray(input.affectedDomains)||input.affectedDomains.length===0)
    throw new Error('KM-MENH: global hard structure phải khai báo domain bị ảnh hưởng.');
  return createEvidence({...input,domain:'GLOBAL',palace:input.palace||'GLOBAL',
    priorityClass:'GLOBAL_HARD_STRUCTURE',sourceBacked:true,severity});
}
