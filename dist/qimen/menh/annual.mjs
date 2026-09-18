import {branchToPalace} from './luck.mjs';
import {resolvePillarStem} from './resolvers.mjs';
import {validateNatalView} from './schema.mjs';

export const ANNUAL_STEM_LAYER='TIAN_PAN_ACTIVE_STEM';
export const ANNUAL_STEM_LAYER_AUTHORITY='TRANSMISSION_CORROBORATED';
const PALACE_BY_NUMBER=Object.freeze({1:'KAN_1',2:'KUN_2',3:'ZHEN_3',4:'XUN_4',6:'QIAN_6',7:'DUI_7',8:'GEN_8',9:'LI_9'});
const STEM_BY_HAN=Object.freeze({'甲':'JIA','乙':'YI','丙':'BING','丁':'DING','戊':'WU','己':'JI','庚':'GENG','辛':'XIN','壬':'REN','癸':'GUI'});
const STEMS=new Set(['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI']);
const BRANCHES=new Set(['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI']);
const canonical=value=>String(value??'').trim().toUpperCase();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

export function parseAnnualPillar(annualPillar){
  const match=/^(JIA|YI|BING|DING|WU|JI|GENG|XIN|REN|GUI)_(ZI|CHOU|YIN|MAO|CHEN|SI|WU|WEI|SHEN|YOU|XU|HAI)$/.exec(canonical(annualPillar));
  if(!match)throw new Error('KM-MENH: lưu niên phải là can_chi canonical hợp lệ.');
  return Object.freeze({stem:match[1],branch:match[2]});
}
function canonicalStem(value){
  const raw=String(value??'').trim();
  const upper=raw.toUpperCase();
  if(STEMS.has(upper))return upper;
  if(STEM_BY_HAN[raw])return STEM_BY_HAN[raw];
  return null;
}
export function resolveAnnualIdentity(annualPillar){
  const {stem,branch}=parseAnnualPillar(annualPillar);
  return Object.freeze({
    annualStem:stem,
    annualBranch:branch,
    resolvedStem:resolvePillarStem(stem,branch),
    annualBranchPalace:branchToPalace(branch),
    stemPriority:'PRIMARY',
    branchPriority:'SECONDARY',
  });
}
export function locateAnnualStemFromSnapshot({annualPillar,heavenPlateStemPalace}={}){
  const identity=resolveAnnualIdentity(annualPillar);
  const palace=heavenPlateStemPalace?.[identity.resolvedStem];
  if(!palace)throw new Error('KM-MENH: không tìm thấy lưu niên can trên Thiên bàn snapshot.');
  return Object.freeze({
    ...identity,
    annualStemPalace:palace,
    layerUsed:ANNUAL_STEM_LAYER,
    annualStemLayerAuthority:ANNUAL_STEM_LAYER_AUTHORITY,
    universalZhangDoctrine:false,
  });
}
export function locateAnnualStemOnNatal(natalView,annualPillar){
  validateNatalView(natalView);
  const identity=resolveAnnualIdentity(annualPillar);
  const matches=[];
  for(const palace of natalView.baseBoard.palaces||[]){
    if(palace.number===5)continue;
    if((palace.heavenStems||[]).some(stem=>canonicalStem(stem?.han??stem)===identity.resolvedStem))
      matches.push(PALACE_BY_NUMBER[palace.number]);
  }
  if(matches.length!==1)throw new Error('KM-MENH: Thiên bàn phải xác định đúng một cung cho lưu niên can; tìm thấy '+matches.length+'.');
  return Object.freeze({...identity,annualStemPalace:matches[0],layerUsed:ANNUAL_STEM_LAYER,
    annualStemLayerAuthority:ANNUAL_STEM_LAYER_AUTHORITY,universalZhangDoctrine:false});
}
export function createAnnualOverlay(natalView,{annualPillar,luckOverlay=null}={}){
  validateNatalView(natalView);
  const before=JSON.stringify(natalView);
  const located=locateAnnualStemOnNatal(natalView,annualPillar);
  const overlay=freeze({
    overlayType:'ANNUAL',
    specVersion:natalView.specVersion,
    profileId:natalView.profileId,
    natal:natalView,
    annual:{...located},
    luckOverlay:luckOverlay||null,
    natalMutation:false,
  });
  if(JSON.stringify(natalView)!==before)throw new Error('KM-MENH: annual overlay không được mutate natal chart.');
  return overlay;
}
