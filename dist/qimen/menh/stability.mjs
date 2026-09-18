const canonical=value=>String(value??'').trim().toUpperCase();

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
