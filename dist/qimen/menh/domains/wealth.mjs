import {elementLink} from '../relations.mjs';

const INNER_OUTER={
  YANG_DUN:{inner:new Set(['KAN_1','GEN_8','ZHEN_3','XUN_4']),outer:new Set(['LI_9','KUN_2','DUI_7','QIAN_6'])},
  YIN_DUN:{inner:new Set(['LI_9','KUN_2','DUI_7','QIAN_6']),outer:new Set(['KAN_1','GEN_8','ZHEN_3','XUN_4'])},
};
const canonical=value=>String(value??'').trim().toUpperCase();

export function wealthRelationSemantics({shengElement,selfElement}={}){
  const relation=elementLink(shengElement,selfElement);
  const map={
    generates:'SUPPORT',
    same:'ALIGNMENT',
    generated_by:'INPUT_COST',
    controls:'PRESSURE',
    controlled_by:'CONTEXT_REQUIRED',
  };
  return Object.freeze({relation:relation.kind,semantic:map[relation.kind],forcePositive:false});
}
export function palaceZone(dun,palace){
  const c=canonical(dun);
  const d=c==='YANG'||c==='YANG_DUN'?'YANG_DUN':c==='YIN'||c==='YIN_DUN'?'YIN_DUN':null;
  if(!d)throw new Error('KM-MENH: âm/dương độn không hợp lệ cho nội ngoại.');
  const p=canonical(palace);
  if(INNER_OUTER[d].inner.has(p))return 'INNER';
  if(INNER_OUTER[d].outer.has(p))return 'OUTER';
  throw new Error('KM-MENH: cung nội ngoại không hợp lệ.');
}
export function wealthInnerOuterTendency({dun,selfPalace,shengPalace}={}){
  const self=palaceZone(dun,selfPalace),sheng=palaceZone(dun,shengPalace);
  let tendency;
  if(sheng==='OUTER'&&self==='INNER')tendency='DEVELOPMENT_AWAY_FROM_ORIGIN';
  else if(self==='OUTER'&&sheng==='INNER')tendency='ANCESTRAL_LOCAL_ASSETS_HARDER_TO_RETAIN';
  else if(self==='INNER'&&sheng==='INNER')tendency='LOCAL_OR_ANCESTRAL_BASE_MORE_SUPPORTIVE';
  else tendency='DEVELOPMENT_OR_ENTERPRISE_AWAY_FROM_ORIGIN';
  return Object.freeze({selfZone:self,shengZone:sheng,tendency,claimType:'NATAL_TENDENCY',guaranteedMigrationEvent:false});
}
export function wealthResolverContract(){
  return Object.freeze({
    primary:'SHENG_MEN_VS_SELF',
    capitalCorroborator:'WU_OR_JIA_ZI_WU',
    wealthStar:'STAR_IN_SHENG_PALACE',
    numericWealthScore:false,
  });
}
