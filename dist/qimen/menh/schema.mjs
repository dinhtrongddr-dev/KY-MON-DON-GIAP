import {MENH_NATAL_SCHEMA_VERSION,MENH_SPEC_VERSION} from './version.mjs';
import {getMenhProfile} from './profiles.mjs';

export function validateNatalView(view){
  if(view?.schemaVersion!==MENH_NATAL_SCHEMA_VERSION||view?.specVersion!==MENH_SPEC_VERSION)
    throw new Error('KM-MENH: NatalView sai phiên bản.');
  getMenhProfile(view.profileId);
  if(view.chartPersistence!=='FIXED_NATAL'||view.center5Lodging?.policy!=='SEMANTIC_LODGING_ONLY')
    throw new Error('KM-MENH: NatalView không đúng hợp đồng bất biến.');
  if(!view.baseBoard||!Object.isFrozen(view)||!Object.isFrozen(view.baseBoard))
    throw new Error('KM-MENH: NatalView phải là bản sao bất biến của bàn nguồn.');
  return view;
}
