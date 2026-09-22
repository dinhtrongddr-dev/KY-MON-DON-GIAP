import {SEMANTIC_MATRIX,SEMANTIC_MATRIX_VERSION} from './matrix-data.mjs';
export {SEMANTIC_MATRIX_VERSION};

const byName=group=>new Map(SEMANTIC_MATRIX.symbols[group].map(item=>[item.name,item]));
const BY_NAME=Object.freeze({palaces:byName('palaces'),deities:byName('deities'),stars:byName('stars'),doors:byName('doors'),stems:byName('stems')});
const PALACE_BY_NUMBER=new Map(SEMANTIC_MATRIX.symbols.palaces.map(item=>[Number(item.id.match(/(\d+)$/)?.[1]),item]));
const TOPIC_DOMAIN=Object.freeze({work:'career',study:'study_exam',money:'investment_finance',investment:'investment_finance',contract:'business',social:'general_decision',family:'children_parenting',love:'love_relationship',debt:'investment_finance',property:'real_estate',travel:'travel_relocation',health:'health',dispute:'legal_dispute',lost:'find_person_object',launch:'business'});
const MENH_DOMAIN=Object.freeze({SELF:'general_decision',FAMILY:'children_parenting',CHILDREN:'children_parenting',MARRIAGE:'love_relationship',CAREER:'career',WEALTH:'investment_finance',LUCK:'general_decision',ANNUAL:'general_decision',GLOBAL:'general_decision'});
const CONTRAST_PAIRS=Object.freeze([['growth','block'],['opening','ending'],['cooperation','conflict'],['visibility','hidden']]);
const STATE_CUE=Object.freeze({strong_supported:'mức lực hiện tại giúp nghĩa chính biểu hiện rõ hơn',weak_trapped:'mức lực hiện tại khiến nghĩa chính khó phát huy trọn vẹn',void:'tín hiệu hiện còn thiếu lực hoặc chưa thành hình',tomb:'tín hiệu bị giữ hoặc khó phát huy',punishment:'quá trình có thêm ma sát',horse:'nhịp thay đổi và di chuyển tăng',fan_yin:'diễn biến dễ đảo chiều hoặc qua lại',fu_yin:'diễn biến dễ lặp, chậm hoặc đứng yên'});

export const semanticDomainForTopic=topicId=>TOPIC_DOMAIN[topicId]||'general_decision';
export const semanticDomainForMenh=domain=>MENH_DOMAIN[domain]||'general_decision';
export const semanticDomain=id=>SEMANTIC_MATRIX.domains[id]||SEMANTIC_MATRIX.domains.general_decision;
const entry=(group,value)=>value?BY_NAME[group].get(value.vi||value.name||value)||null:null;
const uniq=a=>[...new Set(a.filter(Boolean))];

function strengthModifier(strength){
  if(!strength)return null;
  const levels=[strength.star?.level,strength.door?.level,strength.palace?.level,...(strength.stems||[]).map(x=>x.level)].filter(Boolean);
  const strong=levels.filter(x=>x==='mạnh'||x==='khá mạnh').length;
  const weak=levels.filter(x=>x==='yếu'||x==='rất yếu').length;
  if(strong>weak)return 'strong_supported';
  if(weak>strong)return 'weak_trapped';
  const weights=[strength.star?.weight,strength.door?.weight,strength.palace?.weight,...(strength.stems||[]).map(x=>x.capacityWeight)].filter(Number.isFinite);
  if(weights.length){const avg=weights.reduce((a,b)=>a+b,0)/weights.length;if(avg>=.72)return 'strong_supported';if(avg<=.35)return 'weak_trapped';}
  return null;
}
function stateNotes(palace,board,conditions,strength){
  const ids=[],strengthId=strengthModifier(strength);if(strengthId)ids.push(strengthId);
  if(palace?.voided)ids.push('void');if(palace?.horse)ids.push('horse');
  const harms=conditions?.fourHarms||[];
  const tombs=(conditions?.stemTombs||[]).length||(conditions?.wonderTombs||[]).length||harms.some(x=>x.code==='tomb');
  const punishment=(conditions?.punishment||[]).length||harms.some(x=>x.code==='punishment');
  if(tombs)ids.push('tomb');if(punishment)ids.push('punishment');
  const p=board?.patterns||{};if(board?.fuYin||p.starFuYin||p.doorFuYin)ids.push('fu_yin');if(board?.fanYin||p.starFanYin||p.doorFanYin)ids.push('fan_yin');
  return uniq(ids).map(id=>({id,...SEMANTIC_MATRIX.state_modifiers[id]})).filter(x=>x.rule);
}
function componentEntries(palace){
  const out=[],push=(layer,role,item,meta={})=>{if(item)out.push({layer,role,item,...meta});};
  push('Cung','palace_context',PALACE_BY_NUMBER.get(Number(palace?.number)));
  push('Môn','action_channel',entry('doors',palace?.door));
  push('Tinh','operating_style',entry('stars',palace?.star));
  push('Thần','hidden_factor',entry('deities',palace?.spirit));
  const stems=palace?.heavenStems||[];
  push('Thiên can chính','heaven_stem_expression',entry('stems',stems[0]),{primary:true,index:0});
  stems.slice(1).forEach((stem,index)=>push('Thiên can phụ '+(index+1),'heaven_stem_expression',entry('stems',stem),{primary:false,index:index+1}));
  push('Địa can','earth_stem_foundation',entry('stems',palace?.earthStem));
  return out;
}
function translated(item,domainId){
  const dm=item.domain_meanings?.[domainId];
  if(dm)return {focus:dm.focus,light:dm.light,shadow:dm.shadow,source:'symbol_domain'};
  const domain=semanticDomain(domainId),terms=uniq((item.tags||[]).map(tag=>domain.overrides?.[tag])).slice(0,3);
  return {focus:terms.length?terms.join(' · '):(item.core_meaning||item.event),light:item.light,shadow:item.shadow,source:'tag_fallback'};
}
function cue(item,domainId){
  const t=translated(item,domainId),match=t.focus.match(/Liên hệ nổi bật:\s*([^\.]+)/i);
  const relation=match?.[1]?.split(' · ')[0]?.trim();
  return [item.keywords?.[0],relation].filter(Boolean).join(' — ').toLowerCase();
}
function itemStrength(component,strength){
  if(!strength)return null;
  const plain=row=>row?{level:row.level||null,status:row.status||null}:null;
  if(component.role==='palace_context')return plain(strength.palace);
  if(component.role==='action_channel')return plain(strength.door);
  if(component.role==='operating_style')return plain(strength.star);
  if(component.role==='heaven_stem_expression'){
    const row=(strength.stems||[])[component.index];if(!row)return null;
    const w=row.capacityWeight,level=row.level||(Number.isFinite(w)?w>=.8?'mạnh':w>=.6?'khá mạnh':w>=.4?'trung bình':w>=.2?'yếu':'rất yếu':null);
    return {level,status:row.longevity?.vi||row.status||null};
  }
  return null;
}
function itemRecord(component,domainId,secondaryDomainId,mode,strength){
  const {item}=component,primary=translated(item,domainId),secondary=secondaryDomainId?translated(item,secondaryDomainId):null;
  return {layer:component.layer,role:component.role,id:item.id,name:item.name,primary:component.primary??null,keywords:[...item.keywords].slice(0,3),tags:[...item.tags],
    core_meaning:item.core_meaning,meaning:primary.focus,mode_meaning:item[mode]||item.event,light:item.light,shadow:item.shadow,
    domain_meaning:primary,secondary_domain_meaning:secondary,associations:item.associations,group:item.group||null,strength:itemStrength(component,strength)};
}
function mergedAssociations(items){
  const out={people:[],matters:[],objects:[],places:[]};
  for(const row of items)for(const key of Object.keys(out))out[key].push(...(row.associations?.[key]||[]));
  for(const key of Object.keys(out))out[key]=uniq(out[key]).slice(0,16);
  return out;
}
function naturalSummary(components,domainId,secondaryDomainId,states){
  const at=role=>components.find(x=>x.role===role&&x.primary!==false)?.item,parts=[];
  const palace=at('palace_context'),door=at('action_channel'),star=at('operating_style'),deity=at('hidden_factor'),stem=at('heaven_stem_expression');
  if(palace)parts.push('Bối cảnh '+cue(palace,domainId));
  if(door)parts.push('hành động qua '+cue(door,domainId));
  if(star)parts.push('vận hành theo '+cue(star,domainId));
  if(deity)parts.push('hậu trường có '+cue(deity,domainId));
  if(stem)parts.push('nguồn lực chính '+cue(stem,domainId));
  const tags=components.flatMap(x=>x.item.tags||[]),contrast=CONTRAST_PAIRS.find(([a,b])=>tags.includes(a)&&tags.includes(b));
  if(contrast){
    const domain=semanticDomain(domainId),a=domain.overrides?.[contrast[0]],b=domain.overrides?.[contrast[1]];
    if(a&&b)parts.push('có '+a+' nhưng đồng thời '+b);
  }else if(states[0])parts.push(STATE_CUE[states[0].id]||states[0].rule.replace(/[.!?]+$/,'').toLowerCase());
  return parts.join('; ')+'.';
}
export function semanticBundle(palace,{mode='event',domainId='general_decision',secondaryDomainId=null,board=null,conditions=null,strength=null}={}){
  const components=componentEntries(palace),domain=semanticDomain(domainId),secondary=secondaryDomainId&&secondaryDomainId!==domainId?semanticDomain(secondaryDomainId):null;
  const items=components.map(component=>itemRecord(component,domainId,secondaryDomainId,mode,strength));
  const states=stateNotes(palace,board,conditions,strength);
  const keywords=uniq(items.flatMap(item=>item.keywords)).slice(0,3);
  const byRole=role=>items.filter(item=>item.role===role);
  const palaceContext=byRole('palace_context')[0]||null,actionChannel=byRole('action_channel')[0]||null,operatingStyle=byRole('operating_style')[0]||null,hiddenFactor=byRole('hidden_factor')[0]||null;
  const heaven=byRole('heaven_stem_expression'),earth=byRole('earth_stem_foundation')[0]||null;
  const strengthState=states.find(x=>x.id==='strong_supported'||x.id==='weak_trapped')?.id||null;
  const expression=strengthState==='strong_supported'?'biểu hiện rõ hơn':strengthState==='weak_trapped'?'khó phát huy trọn vẹn':'biểu hiện theo điều kiện thực tế';
  const emphasis=strengthState==='strong_supported'?'light':strengthState==='weak_trapped'?'shadow':'core';
  const confidence=strengthState==='strong_supported'?'cao hơn':strengthState==='weak_trapped'?'thận trọng hơn':'trung tính';
  return Object.freeze({
    version:SEMANTIC_MATRIX_VERSION,mode,domainId,domainLabel:domain.label,secondaryDomainId:secondary?secondaryDomainId:null,secondaryDomainLabel:secondary?.label||null,
    keywords,summary:naturalSummary(components,domainId,secondaryDomainId,states),items,states,
    palace_context:palaceContext,action_channel:actionChannel,operating_style:operatingStyle,hidden_factor:hiddenFactor,
    heaven_stem_expression:{primary:heaven.find(x=>x.primary===true)||null,secondary:heaven.filter(x=>x.primary===false)},
    earth_stem_foundation:earth,
    domain_translation:{primary:{id:domainId,label:domain.label},secondary:secondary?{id:secondaryDomainId,label:secondary.label}:null},
    associations:mergedAssociations(items),
    strength_expression:{state:strengthState,description:expression,emphasis,confidence}
  });
}
export function semanticGuideForBoard(board,{mode='event',domainId='general_decision',secondaryDomainId=null,palaceNumbers=null,analysisPalaces=null}={}){
  const wanted=palaceNumbers?new Set(palaceNumbers.map(Number)):null,rows=analysisPalaces||[];
  return (board?.palaces||[]).filter(p=>!wanted||wanted.has(p.number)).map(p=>{
    const analysis=Array.isArray(rows)?rows.find(x=>Number(x.palace??x.number)===Number(p.number)):rows?.[p.number]||rows?.[String(p.number)]||null;
    const conditions=analysis?.conditions||analysis?.structure||null,strength=analysis?.strength||null;
    return {palace:p.number,...semanticBundle(p,{mode,domainId,secondaryDomainId,board,conditions,strength})};
  });
}
export function semanticDomainVocabulary(domainId){
  const domain=semanticDomain(domainId);return Object.freeze({id:domainId,label:domain.label,overrides:{...domain.overrides},safety:domain.safety||null});
}
export function semanticAssemblyRules(){return Object.freeze(Object.fromEntries(Object.entries(SEMANTIC_MATRIX.assembly_rules).map(([id,value])=>[id,value.rule])));}
