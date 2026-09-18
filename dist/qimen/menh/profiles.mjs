import {MENH_PROFILE_SCHEMA_VERSION,MENH_SPEC_VERSION} from './version.mjs';

export const DEFAULT_MENH_PROFILE_ID='ZHANG_ADVANCED_CLASS_LIFETIME';
export const LEGACY_MENH_PROFILE_ID='ZHANG_SHENQI_GENERAL_NATAL_LEGACY';

const PROFILES={
  [DEFAULT_MENH_PROFILE_ID]:{
    schemaVersion:MENH_PROFILE_SCHEMA_VERSION,specVersion:MENH_SPEC_VERSION,
    profileId:DEFAULT_MENH_PROFILE_ID,status:'DEFAULT_FROZEN',
    chartFamily:'SHI_JIA_QIMEN',plate:'ROTATING',juMethod:'CHAI_BU',chartPersistence:'FIXED_NATAL',
    center5:{YANG_DUN:{lodgePalace:'GEN_8',lodgePalaceNumber:8,associatedDoor:'SHENG'},
      YIN_DUN:{lodgePalace:'KUN_2',lodgePalaceNumber:2,associatedDoor:'SI'}},
    annualStemLayer:'TIAN_PAN_ACTIVE_STEM',
  },
  [LEGACY_MENH_PROFILE_ID]:{
    schemaVersion:MENH_PROFILE_SCHEMA_VERSION,specVersion:MENH_SPEC_VERSION,
    profileId:LEGACY_MENH_PROFILE_ID,status:'RESEARCH_COMPATIBILITY_FROZEN',
    chartFamily:'SHI_JIA_QIMEN',plate:'ROTATING',chartPersistence:'FIXED_NATAL',
    center5:{YANG_DUN:{lodgePalace:'KUN_2',lodgePalaceNumber:2,associatedDoor:null},
      YIN_DUN:{lodgePalace:'KUN_2',lodgePalaceNumber:2,associatedDoor:null}},
    annualStemLayer:'TIAN_PAN_ACTIVE_STEM',
  },
};
const freeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
};
freeze(PROFILES);
export const MENH_PROFILES=PROFILES;

export function normalizeMenhDun(dun){
  if(dun==='yang'||dun==='YANG_DUN')return 'YANG_DUN';
  if(dun==='yin'||dun==='YIN_DUN')return 'YIN_DUN';
  throw new Error('KM-MENH: âm/dương độn không hợp lệ.');
}
export function getMenhProfile(profileId=DEFAULT_MENH_PROFILE_ID){
  const profile=PROFILES[profileId];
  if(!profile)throw new Error('KM-MENH: profile không được hỗ trợ: '+(profileId||'(trống)')+'.');
  return profile;
}
export function center5Lodging(profileId,dun){
  const profile=getMenhProfile(profileId);
  return profile.center5[normalizeMenhDun(dun)];
}
export function assertCenter5Compatible(profileId,dun,observedLodgePalace){
  const expected=center5Lodging(profileId,dun);
  if(expected.lodgePalace!==observedLodgePalace){
    throw new Error('KM-MENH: Trung 5 '+observedLodgePalace+' không tương thích profile '+profileId+'; cần profile nguồn rõ ràng.');
  }
  return expected;
}
