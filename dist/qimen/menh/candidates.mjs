import {BIRTH_TIME_MODES,normalizeBirthInput} from './input.mjs';

export const UNKNOWN_DOUBLE_HOUR_FAMILIES=Object.freeze([
  'ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI',
]);
const STANDARD=[
  ['ZI','EARLY_ZI','00:30','CURRENT_DAY_PILLAR'],
  ['CHOU','STANDARD','01:30','CURRENT_DAY_PILLAR'],
  ['YIN','STANDARD','03:30','CURRENT_DAY_PILLAR'],
  ['MAO','STANDARD','05:30','CURRENT_DAY_PILLAR'],
  ['CHEN','STANDARD','07:30','CURRENT_DAY_PILLAR'],
  ['SI','STANDARD','09:30','CURRENT_DAY_PILLAR'],
  ['WU','STANDARD','11:30','CURRENT_DAY_PILLAR'],
  ['WEI','STANDARD','13:30','CURRENT_DAY_PILLAR'],
  ['SHEN','STANDARD','15:30','CURRENT_DAY_PILLAR'],
  ['YOU','STANDARD','17:30','CURRENT_DAY_PILLAR'],
  ['XU','STANDARD','19:30','CURRENT_DAY_PILLAR'],
  ['HAI','STANDARD','21:30','CURRENT_DAY_PILLAR'],
  ['ZI','LATE_ZI','23:30','NEXT_DAY_PILLAR'],
];

export function buildBirthTimeCandidates(input){
  const normalized=normalizeBirthInput(input);
  if(normalized.birthTimeMode===BIRTH_TIME_MODES.KNOWN){
    return Object.freeze({
      birthTimeMode:'KNOWN',familyCount:1,executableCandidateCount:1,
      dayBoundaryVariants:[],candidates:Object.freeze([Object.freeze({
        id:'KNOWN',family:null,variant:'EXACT',birthDateLocal:normalized.birthDateLocal,
        birthTimeLocal:normalized.birthTimeLocal,timezone:normalized.timezone,dayPillarBoundary:'INPUT_EXACT',
      })]),
    });
  }
  const candidates=STANDARD.map(([family,variant,time,dayPillarBoundary])=>Object.freeze({
    id:family+'_'+variant,family,variant,birthDateLocal:normalized.birthDateLocal,
    birthTimeLocal:time,timezone:normalized.timezone,dayPillarBoundary,
  }));
  return Object.freeze({
    birthTimeMode:'UNKNOWN',familyCount:UNKNOWN_DOUBLE_HOUR_FAMILIES.length,
    executableCandidateCount:candidates.length,
    dayBoundaryVariants:Object.freeze(['ZI_EARLY_ZI','ZI_LATE_ZI']),
    candidates:Object.freeze(candidates),
  });
}
