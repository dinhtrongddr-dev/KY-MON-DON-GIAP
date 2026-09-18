import {fiveCombinationCounterpart} from '../resolvers.mjs';

export const REQUIRED_MARRIAGE_RESOLVERS=Object.freeze([
  'DAY_STEM','XIU_MEN','LIU_HE','YI_GENG','DAY_STEM_FIVE_COMBINATION_COUNTERPART',
]);
const canonical=value=>String(value??'').trim().toUpperCase();

export function marriageResolverBundle({dayStem,sexMetadata=null}={}){
  const stem=canonical(dayStem);
  const counterpart=fiveCombinationCounterpart(stem);
  const auxiliaries=sexMetadata==='FEMALE'?['YI','DING']:sexMetadata==='MALE'?['GENG','BING']:[];
  return Object.freeze({
    requiredResolvers:REQUIRED_MARRIAGE_RESOLVERS,
    universalSolePrimary:false,
    dayStem:stem,
    fiveCombinationCounterpart:counterpart,
    counterpartRemainsActiveSpouseEvidence:true,
    counterpartUniversalSolePrimary:false,
    yiGengAlwaysActive:true,
    traditionalAuxiliaryStems:Object.freeze(auxiliaries),
  });
}
export function marriageInspectSet(dayStem){
  const bundle=marriageResolverBundle({dayStem});
  return Object.freeze(['LIU_HE','YI_GENG',bundle.dayStem+'_'+bundle.fiveCombinationCounterpart]);
}
