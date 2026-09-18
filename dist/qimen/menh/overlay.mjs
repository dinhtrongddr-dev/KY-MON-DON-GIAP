import {DEFAULT_MENH_PROFILE_ID} from './profiles.mjs';
import {validateNatalView} from './schema.mjs';
import {luckAtAge} from './luck.mjs';

const freeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
};

export function createLuckOverlay(natalView,{birthYearBranch,age}={}){
  validateNatalView(natalView);
  if(natalView.profileId!==DEFAULT_MENH_PROFILE_ID)
    throw new Error('KM-MENH: đại vận 8 cung x 15 năm chỉ thuộc profile ZHANG_ADVANCED_CLASS_LIFETIME.');
  const active=luckAtAge(birthYearBranch,age);
  return freeze({
    overlayType:'LUCK_15_YEAR',
    specVersion:natalView.specVersion,
    profileId:natalView.profileId,
    natal:natalView,
    birthYearBranch:String(birthYearBranch??'').trim().toUpperCase(),
    period:{
      index:active.index,
      ageStart:active.ageStart,
      ageEnd:active.ageEnd,
      palace:active.palace,
      age:active.age,
      ageWithinPeriod:active.ageWithinPeriod,
      activeFiveYearLayer:active.activeFiveYearLayer,
    },
  });
}
