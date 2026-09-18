export const CLAIM_TYPES=Object.freeze({
  NATAL_TENDENCY:'NATAL_TENDENCY',
  PERIOD_ACTIVATION:'PERIOD_ACTIVATION',
  OBSERVED_EVENT:'OBSERVED_EVENT',
});
export const PROHIBITED_OUTPUT_TAGS=Object.freeze([
  'EXACT_DEATH_AGE','LIFESPAN_COUNTDOWN','EXACT_CHILD_COUNT','EXACT_CHILD_SEX','INFERTILITY_CERTAINTY',
  'DETERMINISTIC_PARENT_DEATH','DETERMINISTIC_SEVERE_DISEASE','DETERMINISTIC_ACCIDENT_DEATH',
  'EXACT_MARRIAGE_COUNT_FROM_PALACE_NUMBERS','NUMERIC_WEALTH_FROM_PALACE_NUMBER',
  'OVERALL_DESTINY_SCORE','SUCCESS_PROBABILITY',
]);
export const OPTIONAL_TRANSMISSION_DEFAULT_OFF=Object.freeze([
  'BRANCH_THREE_COMBINATION_THREE_MEETING_ACTIVATION','DAY_STEM_LU_GUANLU_SECONDARY_BODY_PROXY',
  'BAZI_TEN_YEAR_LUCK_INTEGRATION','FOUR_PILLARS_USEFUL_GOD_FUSION','HOUR_STEM_FINAL_LIFE_OUTCOME',
  'SEX_DUN_SHUN_NI_LABEL','EXACT_MONTH_DAY_YING_QI_BRANCH_NETWORK',
]);
const prohibited=new Set(PROHIBITED_OUTPUT_TAGS);
const canonical=value=>String(value??'').trim().toUpperCase();

export function createClaim({claimId,type,text,ruleIds,evidenceIds,domain='GENERAL'}={}){
  const t=canonical(type);
  if(!Object.values(CLAIM_TYPES).includes(t))throw new Error('KM-MENH: claim type không hợp lệ.');
  if(!String(claimId??'').trim())throw new Error('KM-MENH: claim thiếu claimId.');
  if(!Array.isArray(ruleIds)||ruleIds.length===0)throw new Error('KM-MENH: claim phải có ruleIds.');
  if(!Array.isArray(evidenceIds)||evidenceIds.length===0)throw new Error('KM-MENH: claim phải có evidenceIds.');
  return Object.freeze({
    claimId:String(claimId),type:t,text:String(text??''),domain:canonical(domain),
    ruleIds:Object.freeze([...new Set(ruleIds.map(String))]),
    evidenceIds:Object.freeze([...new Set(evidenceIds.map(String))]),
  });
}
export function assertClaimTransition(fromType,toType,{observedFact=false}={}){
  const from=canonical(fromType),to=canonical(toType);
  if(from==='NATAL_TENDENCY'&&to==='OBSERVED_EVENT'&&observedFact!==true)
    throw new Error('KM-MENH: NATAL_TENDENCY không được tự nâng thành OBSERVED_EVENT.');
  return true;
}
export function assertNoProhibitedOutput(tags=[]){
  for(const tag of tags.map(canonical))if(prohibited.has(tag))throw new Error('KM-MENH: output bị cấm: '+tag+'.');
  return true;
}
export function validateOptionalTransmission(config={}){
  for(const id of OPTIONAL_TRANSMISSION_DEFAULT_OFF)
    if(config[id]===true)throw new Error('KM-MENH: optional transmission mặc định phải tắt: '+id+'.');
  return true;
}
export function validateMenhResult(result){
  if(!result||typeof result!=='object')throw new Error('KM-MENH: result không hợp lệ.');
  if(!String(result.profileId??'').trim())throw new Error('KM-MENH: result phải serialize profileId.');
  if(!Array.isArray(result.claims))throw new Error('KM-MENH: result phải có claims.');
  for(const claim of result.claims)createClaim(claim);
  if(result.annual&&result.annual.annualStemLayerAuthority!=='TRANSMISSION_CORROBORATED')
    throw new Error('KM-MENH: annual result phải serialize annualStemLayerAuthority.');
  assertNoProhibitedOutput(result.outputTags||[]);
  validateOptionalTransmission(result.optionalTransmission||{});
  return result;
}
