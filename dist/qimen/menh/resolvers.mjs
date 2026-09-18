export const FIVE_STEM_COMBINATIONS=Object.freeze({
  JIA:'JI',JI:'JIA',YI:'GENG',GENG:'YI',BING:'XIN',XIN:'BING',
  DING:'REN',REN:'DING',WU:'GUI',GUI:'WU',
});
export const SIX_JIA_HIDDEN_INSTRUMENTS=Object.freeze({
  JIA_ZI:'WU',JIA_XU:'JI',JIA_SHEN:'GENG',JIA_WU:'XIN',JIA_CHEN:'REN',JIA_YIN:'GUI',
});
const STEMS=new Set(Object.keys(FIVE_STEM_COMBINATIONS));
const JIA_BRANCHES=new Set(['ZI','XU','SHEN','WU','CHEN','YIN']);
const canonical=value=>String(value??'').trim().toUpperCase();

export function fiveCombinationCounterpart(stem){
  const key=canonical(stem),paired=FIVE_STEM_COMBINATIONS[key];
  if(!paired)throw new Error('KM-MENH: thiên can không hợp lệ: '+(stem??'')+'.');
  return paired;
}
export function resolvePillarStem(stem,branch){
  const s=canonical(stem);
  if(!STEMS.has(s))throw new Error('KM-MENH: thiên can không hợp lệ: '+(stem??'')+'.');
  if(s!=='JIA')return s;
  const b=canonical(branch);
  if(!JIA_BRANCHES.has(b))throw new Error('KM-MENH: trụ Giáp cần một trong sáu chi hợp lệ để xác định ẩn nghi.');
  return SIX_JIA_HIDDEN_INSTRUMENTS['JIA_'+b];
}
export function resolveAbstractStem(stem){
  const s=canonical(stem);
  if(!STEMS.has(s))throw new Error('KM-MENH: thiên can không hợp lệ: '+(stem??'')+'.');
  return s==='JIA'?'ZHI_FU_JIA_PROXY':s;
}
