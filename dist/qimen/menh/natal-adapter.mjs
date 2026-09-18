import {validateBoard,freezeData} from '../schemas/board.mjs';
import {DEFAULT_MENH_PROFILE_ID,center5Lodging,getMenhProfile,normalizeMenhDun} from './profiles.mjs';
import {MENH_NATAL_SCHEMA_VERSION,MENH_SPEC_VERSION} from './version.mjs';
import {validateNatalView} from './schema.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));

export function createNatalView(sourceBoard,{profileId=DEFAULT_MENH_PROFILE_ID}={}){
  validateBoard(sourceBoard);
  const profile=getMenhProfile(profileId),dun=normalizeMenhDun(sourceBoard.dun);
  const lodging=center5Lodging(profileId,dun);
  const view={
    schemaVersion:MENH_NATAL_SCHEMA_VERSION,specVersion:MENH_SPEC_VERSION,profileId:profile.profileId,
    chartPersistence:'FIXED_NATAL',sourceBoardSchemaVersion:sourceBoard.schemaVersion,
    sourceEngineVersion:sourceBoard.engineVersion||null,
    center5Lodging:{sourcePalace:'CENTER_5',sourcePalaceNumber:5,dun,
      lodgePalace:lodging.lodgePalace,lodgePalaceNumber:lodging.lodgePalaceNumber,
      associatedDoor:lodging.associatedDoor,policy:'SEMANTIC_LODGING_ONLY'},
    baseBoard:clone(sourceBoard),
  };
  freezeData(view);
  return validateNatalView(view);
}
