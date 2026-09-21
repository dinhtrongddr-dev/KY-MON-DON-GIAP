import {locateStem,palaceConditions} from '../../guide.mjs';
import {elementLink} from '../analysis/relationships.mjs';
import {seasonalStrength,roleStrength,STRENGTH_VERSION,STRENGTH_PROFILE} from '../analysis/strength.mjs';
import {analyzeStructures,STRUCTURE_VERSION,STRUCTURE_PROFILE} from '../analysis/structureEngine.mjs';
import {fiveCombinationCounterpart} from './resolvers.mjs';

export const MENH_ANALYSIS_LAYER_VERSION='KM-MENH-ANALYSIS-1.1';

const STEM_CANON=Object.freeze({'甲':'JIA','乙':'YI','丙':'BING','丁':'DING','戊':'WU','己':'JI','庚':'GENG','辛':'XIN','壬':'REN','癸':'GUI'});
const STEM_HAN=Object.freeze(Object.fromEntries(Object.entries(STEM_CANON).map(([han,key])=>[key,han])));
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

function locate(board,stemOrPillar){
  return locateStem(board,stemOrPillar).palace;
}
function palaceModel(board,p){
  const conditions=palaceConditions(p);
  return {
    ...p,
    conditions,
    strength:seasonalStrength(board,p),
    starDoor:elementLink(p.star.element,p.door.element),
    doorPalace:elementLink(p.door.element,p.element),
    stemPairs:p.heavenStems.map((s,i)=>({
      heaven:s,earth:p.earthStem,carried:i>0,
      relation:elementLink(s.element,p.earthStem.element),
      punishment:conditions.punishment.includes(s.vi),
      wonderTomb:conditions.wonderTombs.includes(s.vi),
    })),
  };
}
function role(board,id,label,stem,yongshenTier){
  if(stem==='甲')return {id,label,stem:null,palace:board.zhiFu.palace,yongshenTier,basis:'menh:abstract-jia:'+id,status:'resolved'};
  const located=locateStem(board,stem);
  return {id,label,stem:located.effective,palace:located.palace.number,yongshenTier,basis:'menh:stem:'+id,status:'resolved'};
}
function menhRoles(board){
  const dayHan=board.pillars.day.stem.han,yearHan=board.pillars.year.stem.han,hourHan=board.pillars.hour.stem.han;
  const dayCanon=STEM_CANON[dayHan],paired=dayCanon?fiveCombinationCounterpart(dayCanon):null;
  return [
    role(board,'menh_self','Bản thân',board.pillars.day,'primary'),
    role(board,'menh_parent','Cha mẹ / gia đình gốc',board.pillars.year,'primary'),
    role(board,'menh_children','Con cái / hậu vận trực tiếp',board.pillars.hour,'primary'),
    role(board,'menh_capital','Nguồn lực / vốn','戊','corroborator'),
    role(board,'menh_marriage_yi','Trục hôn nhân Ất','乙','corroborator'),
    role(board,'menh_marriage_geng','Trục hôn nhân Canh','庚','corroborator'),
    ...(paired&&STEM_HAN[paired]?[role(board,'menh_day_pair','Can hợp của Nhật can',STEM_HAN[paired],'corroborator')]:[]),
  ];
}
function publicStrength(s){
  return {
    version:s.version,profile:s.profile,monthBranch:s.monthBranch,monthElement:s.monthElement,
    star:s.star,door:s.door,palace:s.palace,
    stems:s.stems.map(row=>({
      stem:row.stem,element:row.element,carried:row.carried,capacityWeight:row.capacityWeight,
      longevity:row.longevity,palaceSupport:row.palaceSupport,convention:row.convention,
    })),
    convention:s.convention,
  };
}
function publicStructure(s){
  return {
    palace:s.palace,doorRelation:s.doorRelation,
    fourHarms:s.fourHarms.map(x=>({...x})),
    stemResponses:s.stemResponses.map(x=>({
      id:x.id,pair:x.pair,heavenStem:x.heavenStem,earthStem:x.earthStem,carried:x.carried,
      tone:x.tone,weight:x.weight,plainMeaning:x.plainMeaning,actorIds:[...x.actorIds],roleTiers:[...x.roleTiers],
    })),
    patterns:s.patterns.map(x=>({
      id:x.id,pair:x.pair||null,tone:x.tone,qualified:x.qualified??null,plainMeaning:x.plainMeaning,
    })),
    priority:s.priority,
    meaning:s.meaning,
  };
}
export function buildMenhAnalysisLayers(board){
  const palaces=board.palaces.filter(p=>p.number!==5).map(p=>palaceModel(board,p));
  const roles=menhRoles(board);
  const structures=analyzeStructures(board,palaces,roles);
  const byNumber=Object.fromEntries(palaces.map(p=>[
    p.number,
    {
      palace:p.number,
      strength:publicStrength(p.strength),
      structure:publicStructure(structures.byPalace[p.number]),
    }
  ]));
  const roleConditions=roles.map(r=>{
    const p=palaces.find(x=>x.number===r.palace),s=structures.byPalace[r.palace];
    const strength=roleStrength(r,p.strength);
    return {
      id:r.id,label:r.label,stem:r.stem,palace:r.palace,yongshenTier:r.yongshenTier,
      strength,
      fourHarms:s.fourHarms.filter(x=>x.actorIds.includes(r.id)),
      stemResponses:s.stemResponses.filter(x=>x.actorIds.includes(r.id)).map(x=>({
        pair:x.pair,tone:x.tone,weight:x.weight,plainMeaning:x.plainMeaning,carried:x.carried,
      })),
    };
  });
  return freeze({
    version:MENH_ANALYSIS_LAYER_VERSION,
    strengthProfile:{version:STRENGTH_VERSION,profile:STRENGTH_PROFILE},
    structureProfile:{version:STRUCTURE_VERSION,profile:STRUCTURE_PROFILE,coverage:structures.coverage,limitations:structures.limitations},
    byPalace:byNumber,
    roles:roleConditions,
    meaning:'Lớp Strength/Structure bổ sung mức lực và điều kiện cho đúng trục Mệnh; không phải xác suất, không đổi Dụng Thần Mệnh và không tự tạo sự kiện đời thực.',
  });
}
