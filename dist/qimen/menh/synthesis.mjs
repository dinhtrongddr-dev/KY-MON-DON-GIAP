import {dedupeEvidence,EVIDENCE_PRIORITY} from './evidence.mjs';

const canonical=value=>String(value??'').trim().toUpperCase();

export function synthesizeEvidence(evidence,{domain='SELF'}={}){
  const target=canonical(domain);
  const unique=dedupeEvidence(evidence);
  const applicable=unique.filter(e=>e.domain===target||e.domain==='GLOBAL'&&e.affectedDomains.includes(target));
  const hard=applicable.filter(e=>e.priorityClass==='GLOBAL_HARD_STRUCTURE');
  const local=applicable.filter(e=>e.priorityClass!=='GLOBAL_HARD_STRUCTURE');
  const capIds=hard.map(e=>e.evidenceId);
  const resolved=applicable.map(e=>Object.freeze({
    ...e,
    synthesisStatus:e.favorable&&hard.length?'CAPPED_BY_GLOBAL_HARD':'ACTIVE',
    cappedBy:Object.freeze(e.favorable?[...capIds]:[]),
  }));
  return Object.freeze({
    domain:target,
    precedenceOrder:Object.freeze(Object.entries(EVIDENCE_PRIORITY).sort((a,b)=>a[1]-b[1]).map(([k])=>k)),
    decisionMode:'PRECEDENCE_NOT_VOTE',
    rawVoteCounting:false,
    globalHardStructureEvaluatedBeforeDomainSynthesis:true,
    favorableLocalSignalsMayBeCapped:hard.length>0,
    automaticBadFateVeto:false,
    globalHardEvidenceIds:Object.freeze(capIds),
    evidence:Object.freeze(resolved),
  });
}
