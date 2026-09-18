const canonical=value=>String(value??'').trim().toUpperCase();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

export function classifyCandidateDirections(candidateDirections=[]){
  const values=candidateDirections.map(canonical).filter(Boolean);
  if(values.length===0)return Object.freeze({classification:'UNRESOLVED',majorityVerdictAllowed:false,stableValue:null});
  const first=values[0],stable=values.every(v=>v===first);
  return Object.freeze({
    classification:stable?'STABLE':'TIME_SENSITIVE',
    majorityVerdictAllowed:false,
    stableValue:stable?first:null,
    candidateCount:values.length,
  });
}
export function unknownBirthTimeGuard(){
  return Object.freeze({
    autoSelectedBirthHour:null,
    exactHourClaimAllowed:false,
    rectificationEnabled:false,
    majorityVerdictAllowed:false,
  });
}
const stableEvidenceSignature=e=>JSON.stringify({
  ruleId:e.ruleId,domain:e.domain,palace:e.palace,mechanism:e.mechanism,effectTag:e.effectTag,severity:e.severity,
  summary:e.metadata?.summary||null,
});
const stableClaimSignature=c=>JSON.stringify({
  claimId:c.claimId,type:c.type,domain:c.domain,text:c.text,ruleIds:c.ruleIds,evidenceIds:c.evidenceIds,
});
export function summarizeUnknownCandidateResults(results){
  if(!Array.isArray(results)||results.length<12||results.length>13)throw new Error('KM-MENH: stability cần 12 hoặc 13 candidate results.');
  const profiles=new Set(results.map(r=>r.profileId));
  if(profiles.size!==1)throw new Error('KM-MENH: UNKNOWN candidates phải cùng profile.');
  const claimIds=[...new Set(results.flatMap(r=>r.claims.map(c=>c.claimId)))];
  const stableClaims=[],stableEvidence=[],stableFindings=[],timeSensitiveFindings=[];
  const evidenceByResult=results.map(r=>new Map((r.evidence||[]).map(e=>[e.evidenceId,e])));
  for(const claimId of claimIds){
    const claims=results.map(r=>r.claims.find(c=>c.claimId===claimId)||null);
    const signatures=claims.map(c=>c?stableClaimSignature(c):null);
    const sameClaim=claims.every(Boolean)&&signatures.every(s=>s===signatures[0]);
    let sameEvidence=sameClaim;
    const stableForClaim=[];
    if(sameClaim){
      for(const evidenceId of claims[0].evidenceIds){
        const items=evidenceByResult.map(map=>map.get(evidenceId)||null);
        if(!items.every(Boolean)||!items.map(stableEvidenceSignature).every(s=>s===stableEvidenceSignature(items[0]))){
          sameEvidence=false;break;
        }
        stableForClaim.push(items[0]);
      }
    }
    if(sameClaim&&sameEvidence){
      stableClaims.push(claims[0]);
      for(const e of stableForClaim)if(!stableEvidence.some(x=>x.evidenceId===e.evidenceId))stableEvidence.push(e);
      stableFindings.push(freeze({claimId,domain:claims[0].domain,text:claims[0].text,classification:'STABLE'}));
    }else{
      const variants=[...new Set(claims.filter(Boolean).map(c=>c.text))];
      const domain=claims.find(Boolean)?.domain||'GENERAL';
      timeSensitiveFindings.push(freeze({claimId,domain,classification:'TIME_SENSITIVE',variantCount:variants.length,samples:Object.freeze(variants.slice(0,3))}));
    }
  }
  const domains=['SELF','FAMILY','CHILDREN','MARRIAGE','CAREER','WEALTH'];
  const stableDomains=new Set(stableFindings.map(x=>x.domain));
  const timeDomains=new Set(timeSensitiveFindings.map(x=>x.domain));
  const unresolvedDomains=domains.filter(d=>!stableDomains.has(d)&&!timeDomains.has(d));
  const lucks=results.map(r=>r.luck?JSON.stringify(r.luck):null);
  const commonLuck=lucks[0]&&lucks.every(x=>x===lucks[0])?results[0].luck:null;
  return freeze({
    stableClaims:Object.freeze(stableClaims),
    stableEvidence:Object.freeze(stableEvidence),
    stableFindings:Object.freeze(stableFindings),
    timeSensitiveFindings:Object.freeze(timeSensitiveFindings),
    unresolvedDomains:Object.freeze(unresolvedDomains),
    commonLuck,
    majorityVerdictAllowed:false,
  });
}
