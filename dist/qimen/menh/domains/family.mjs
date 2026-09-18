import {fiveCombinationCounterpart} from '../resolvers.mjs';

const YANG_STEMS=new Set(['JIA','BING','WU','GENG','REN']);
const YIN_STEMS=new Set(['YI','DING','JI','XIN','GUI']);
const canonical=value=>String(value??'').trim().toUpperCase();

export function stemPolarity(stem){
  const s=canonical(stem);
  if(YANG_STEMS.has(s))return 'YANG';
  if(YIN_STEMS.has(s))return 'YIN';
  throw new Error('KM-MENH: thiên can cha mẹ không hợp lệ.');
}
export function resolveParentPair({yearStem,yearStemPolarity}={}){
  const stem=canonical(yearStem);
  const polarity=yearStemPolarity?canonical(yearStemPolarity):stemPolarity(stem);
  if(!['YANG','YIN'].includes(polarity))throw new Error('KM-MENH: âm dương niên can không hợp lệ.');
  const pairedStem=fiveCombinationCounterpart(stem);
  return Object.freeze({
    yearStem:stem,
    yearStemPolarity:polarity,
    yearStemRole:polarity==='YANG'?'FATHER':'MOTHER',
    pairedStem,
    pairedStemRole:polarity==='YANG'?'MOTHER':'FATHER',
    resolverRole:'CORROBORATOR',
    soleParentResolver:false,
    aggregateResolver:'YEAR_STEM_PARENT_AGGREGATE',
    fatherCorroborator:'QIAN_6',
    motherCorroborator:'KUN_2',
  });
}
export function parentPairRolesFromPolarity(polarity){
  const p=canonical(polarity);
  if(p==='YANG')return Object.freeze({yearStemRole:'FATHER',pairedStemRole:'MOTHER',soleParentResolver:false});
  if(p==='YIN')return Object.freeze({yearStemRole:'MOTHER',pairedStemRole:'FATHER',soleParentResolver:false});
  throw new Error('KM-MENH: polarity phải YANG hoặc YIN.');
}
export function gengParentPattern(palace){
  const p=canonical(palace);
  if(p==='QIAN_6')return Object.freeze({target:'FATHER_SIDE',evidenceClass:'TRADITIONAL_STRONG_PATTERN',deterministicDeathClaim:'REJECT'});
  if(p==='KUN_2')return Object.freeze({target:'MOTHER_SIDE',evidenceClass:'TRADITIONAL_STRONG_PATTERN',deterministicDeathClaim:'REJECT'});
  return null;
}
export function familyResolverRegistry(){
  return Object.freeze({
    parentAggregate:'YEAR_STEM',
    fatherCorroborator:'QIAN_6',
    motherCorroborator:'KUN_2',
    parentPair:'YEAR_STEM_FIVE_COMBINATION_CORROBORATOR',
    children:'HOUR_STEM',
  });
}
