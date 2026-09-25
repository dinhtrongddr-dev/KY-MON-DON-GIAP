import {buildMenhNarrativeFromContext} from './narrative-contract.mjs';
import {surfaceSchema} from '../../ai/surfaceReading.mjs';
export const MENH_READING_SECTIONS=Object.freeze(['overview','self','family','marriage','career','wealth','luck','annual','birthTimeNote']);
export function menhReadingSchema(context){return surfaceSchema(buildMenhNarrativeFromContext(context));}
export function legacyMenhReadingSchema(context){
  const str={type:'string'},arr=items=>({type:'array',items});
  const obj=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
  const ids=context.allowedClaimIds.length?{type:'string',enum:context.allowedClaimIds}:str;
  const section=obj({text:str,claim_ids:arr(ids)});
  return obj({
    status:{type:'string',enum:['reading']},
    specVersion:{type:'string',enum:[context.specVersion]},
    profileId:{type:'string',enum:[context.profileId]},
    overview:section,self:section,family:section,marriage:section,career:section,wealth:section,
    luck:section,annual:section,birthTimeNote:section,
  });
}
