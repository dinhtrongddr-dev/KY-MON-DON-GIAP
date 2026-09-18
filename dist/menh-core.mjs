import {createNatalView} from './qimen/menh/natal-adapter.mjs';
import {createLuckOverlay} from './qimen/menh/overlay.mjs';
import {createAnnualOverlay} from './qimen/menh/annual.mjs';
import {buildBirthTimeCandidates} from './qimen/menh/candidates.mjs';
import {validateMenhResult} from './qimen/menh/audit.mjs';
import {synthesizeEvidence} from './qimen/menh/synthesis.mjs';
import {familyResolverRegistry} from './qimen/menh/domains/family.mjs';
import {childrenResolver} from './qimen/menh/domains/children.mjs';
import {marriageResolverBundle} from './qimen/menh/domains/marriage.mjs';
import {careerResolverContract} from './qimen/menh/domains/career.mjs';
import {wealthResolverContract} from './qimen/menh/domains/wealth.mjs';
import {DEFAULT_MENH_PROFILE_ID} from './qimen/menh/profiles.mjs';
import {MENH_SPEC_VERSION} from './qimen/menh/version.mjs';

export const MENH_PROTOCOL=1;
export const MENH_RULE_VERSION=MENH_SPEC_VERSION;

const freeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
};

export function createMenhNatal(sourceBoard,{profileId=DEFAULT_MENH_PROFILE_ID}={}){
  return createNatalView(sourceBoard,{profileId});
}
export function applyMenhLuck(natal,{birthYearBranch,age}={}){
  return createLuckOverlay(natal,{birthYearBranch,age});
}
export function applyMenhAnnual(natal,{annualPillar,luckOverlay=null}={}){
  return createAnnualOverlay(natal,{annualPillar,luckOverlay});
}
export function prepareUnknownBirthTimeCandidates(input){
  return buildBirthTimeCandidates({...input,birthTimeMode:'UNKNOWN',birthTimeLocal:null});
}
export function getMenhDomainContracts({dayStem,sexMetadata=null}={}){
  return freeze({
    family:familyResolverRegistry(),
    children:childrenResolver(),
    marriage:dayStem?marriageResolverBundle({dayStem,sexMetadata}):null,
    career:careerResolverContract(),
    wealth:wealthResolverContract(),
  });
}
export function analyzeMenhEvidence(evidence,{domain='SELF'}={}){
  return synthesizeEvidence(evidence,{domain});
}
export function buildMenhDeterministicResult(natal,{
  birthYearBranch=null,age=null,annualPillar=null,claims=[],outputTags=[],optionalTransmission={},
  dayStem=null,sexMetadata=null,sourceTrace=[]
}={}){
  const luck=birthYearBranch!=null&&age!=null?applyMenhLuck(natal,{birthYearBranch,age}):null;
  const annual=annualPillar?applyMenhAnnual(natal,{annualPillar,luckOverlay:luck}):null;
  const result=freeze({
    protocol:MENH_PROTOCOL,
    specVersion:MENH_SPEC_VERSION,
    ruleVersion:MENH_RULE_VERSION,
    profileId:natal.profileId,
    natal,
    luck:luck?.period||null,
    annual:annual?.annual||null,
    domains:getMenhDomainContracts({dayStem,sexMetadata}),
    claims:[...claims],
    outputTags:[...outputTags],
    optionalTransmission:{...optionalTransmission},
    sourceTrace:[...sourceTrace],
  });
  validateMenhResult(result);
  return result;
}
export {validateMenhResult};
