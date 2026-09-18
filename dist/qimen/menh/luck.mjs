export const BRANCH_TO_PALACE=Object.freeze({
  ZI:'KAN_1',CHOU:'GEN_8',YIN:'GEN_8',MAO:'ZHEN_3',CHEN:'XUN_4',SI:'XUN_4',
  WU:'LI_9',WEI:'KUN_2',SHEN:'KUN_2',YOU:'DUI_7',XU:'QIAN_6',HAI:'QIAN_6',
});
export const CLOCKWISE_PALACES=Object.freeze([
  'KAN_1','GEN_8','ZHEN_3','XUN_4','LI_9','KUN_2','DUI_7','QIAN_6',
]);
export const LUCK_LAYERS=Object.freeze({
  NINE_STAR:'NINE_STAR',
  EIGHT_DOOR:'EIGHT_DOOR',
  TEN_STEM_KE_YING_AND_PALACE_STATE:'TEN_STEM_KE_YING_AND_PALACE_STATE',
});
const canonical=value=>String(value??'').trim().toUpperCase();

export function branchToPalace(branch){
  const palace=BRANCH_TO_PALACE[canonical(branch)];
  if(!palace)throw new Error('KM-MENH: địa chi không hợp lệ cho đại vận: '+(branch??'')+'.');
  return palace;
}
export function nextClockwisePalace(palace,steps=1){
  if(!Number.isInteger(steps))throw new Error('KM-MENH: số bước cung phải là số nguyên.');
  const start=CLOCKWISE_PALACES.indexOf(canonical(palace));
  if(start<0)throw new Error('KM-MENH: cung đại vận không hợp lệ: '+(palace??'')+'.');
  const offset=((steps%8)+8)%8;
  return CLOCKWISE_PALACES[(start+offset)%8];
}
export function activeLuckLayer(ageWithinPeriod){
  if(!Number.isInteger(ageWithinPeriod)||ageWithinPeriod<1||ageWithinPeriod>15)
    throw new Error('KM-MENH: tuổi trong đại vận phải từ 1 đến 15.');
  if(ageWithinPeriod<=5)return LUCK_LAYERS.NINE_STAR;
  if(ageWithinPeriod<=10)return LUCK_LAYERS.EIGHT_DOOR;
  return LUCK_LAYERS.TEN_STEM_KE_YING_AND_PALACE_STATE;
}
export function buildLuckPeriods(birthYearBranch){
  const start=branchToPalace(birthYearBranch);
  return Object.freeze(Array.from({length:8},(_,index)=>{
    const ageStart=index*15+1,ageEnd=ageStart+14;
    return Object.freeze({
      index,
      ageStart,
      ageEnd,
      ages:ageStart+'-'+ageEnd,
      palace:nextClockwisePalace(start,index),
    });
  }));
}
export function luckAtAge(birthYearBranch,age){
  if(!Number.isInteger(age)||age<1||age>120)throw new Error('KM-MENH: tuổi đại vận phải là số nguyên từ 1 đến 120.');
  const periodIndex=Math.floor((age-1)/15);
  const ageWithinPeriod=(age-1)%15+1;
  const period=buildLuckPeriods(birthYearBranch)[periodIndex];
  return Object.freeze({
    ...period,
    age,
    ageWithinPeriod,
    activeFiveYearLayer:activeLuckLayer(ageWithinPeriod),
  });
}
