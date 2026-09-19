import {SEMANTIC_MATRIX,SEMANTIC_MATRIX_VERSION} from './matrix-data.mjs';
export {SEMANTIC_MATRIX_VERSION};

const byName=group=>new Map(SEMANTIC_MATRIX.symbols[group].map(item=>[item.name,item]));
const BY_NAME=Object.freeze({
  palaces:byName('palaces'),deities:byName('deities'),stars:byName('stars'),doors:byName('doors'),stems:byName('stems'),
});
const PALACE_BY_NUMBER=new Map(SEMANTIC_MATRIX.symbols.palaces.map(item=>[Number(item.id.match(/(\d+)$/)?.[1]),item]));
const TOPIC_DOMAIN=Object.freeze({
  work:'career',study:'study_exam',money:'investment_finance',investment:'investment_finance',contract:'business',social:'general_decision',family:'children_parenting',love:'love_relationship',debt:'investment_finance',property:'real_estate',travel:'travel_relocation',health:'health',dispute:'legal_dispute',lost:'find_person_object',launch:'business',
});
const MENH_DOMAIN=Object.freeze({SELF:'general_decision',FAMILY:'children_parenting',CHILDREN:'children_parenting',MARRIAGE:'love_relationship',CAREER:'career',WEALTH:'investment_finance',LUCK:'general_decision',ANNUAL:'general_decision',GLOBAL:'general_decision'});
const CONTRAST_PAIRS=Object.freeze([['growth','block'],['opening','ending'],['cooperation','conflict'],['visibility','hidden']]);

export const semanticDomainForTopic=topicId=>TOPIC_DOMAIN[topicId]||'general_decision';
export const semanticDomainForMenh=domain=>MENH_DOMAIN[domain]||'general_decision';
export const semanticDomain=id=>SEMANTIC_MATRIX.domains[id]||SEMANTIC_MATRIX.domains.general_decision;
const entry=(group,value)=>value?BY_NAME[group].get(value.vi||value.name||value)||null:null;
const stateNotes=(palace,board,conditions)=>{
  const ids=[];
  if(palace?.voided)ids.push('void');if(palace?.horse)ids.push('horse');
  if((conditions?.wonderTombs||[]).length)ids.push('tomb');if((conditions?.punishment||[]).length)ids.push('punishment');
  const p=board?.patterns||{};if(board?.fuYin||p.starFuYin||p.doorFuYin)ids.push('fu_yin');if(board?.fanYin||p.starFanYin||p.doorFanYin)ids.push('fan_yin');
  return [...new Set(ids)].map(id=>({id,...SEMANTIC_MATRIX.state_modifiers[id]})).filter(x=>x.rule);
};
function componentEntries(palace){
  const palaceEntry=PALACE_BY_NUMBER.get(Number(palace?.number));
  return [
    ['Cung',palaceEntry],['Môn',entry('doors',palace?.door)],['Tinh',entry('stars',palace?.star)],['Thần',entry('deities',palace?.spirit)],
    ['Thiên can',entry('stems',palace?.heavenStems?.[0])],['Địa can',entry('stems',palace?.earthStem)],
  ].filter(([,item])=>item);
}
function tagRanking(components){
  const counts=new Map();for(const [,item] of components)for(const tag of item.tags||[])counts.set(tag,(counts.get(tag)||0)+1);
  return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}
function naturalSummary(components,domainId,secondaryDomainId,mode,states){
  const domain=semanticDomain(domainId),secondary=secondaryDomainId?semanticDomain(secondaryDomainId):null,ranked=tagRanking(components),terms=ranked.map(([tag])=>domain.overrides[tag]).filter(Boolean);
  const distinct=[...new Set(terms)].slice(0,3);
  const contrast=CONTRAST_PAIRS.find(([a,b])=>ranked.some(([t])=>t===a)&&ranked.some(([t])=>t===b));
  let sentence=mode==='destiny'?'Cung này nổi bật ở ':'Sự việc tại cung này nổi bật ở ';
  sentence+=(distinct.length?distinct.join(', '):'các tín hiệu cần đọc phối hợp')+'.';
  if(secondary&&secondaryDomainId!==domainId){
    const primarySet=new Set(distinct),supplement=ranked.map(([tag])=>secondary.overrides[tag]).find(term=>term&&!primarySet.has(term));
    if(supplement)sentence+=` Ở lớp phụ ${secondary.label.toLowerCase()}, cần bổ sung góc nhìn ${supplement}.`;
  }
  if(contrast){const [a,b]=contrast,aa=domain.overrides[a],bb=domain.overrides[b];if(aa&&bb)sentence+=` Có ${aa} nhưng đồng thời có ${bb}, nên không nên đọc một chiều.`;}
  if(states[0])sentence+=' '+states[0].rule;
  return sentence;
}
export function semanticBundle(palace,{mode='event',domainId='general_decision',secondaryDomainId=null,board=null,conditions=null}={}){
  const components=componentEntries(palace),states=stateNotes(palace,board,conditions),domain=semanticDomain(domainId),secondary=secondaryDomainId&&secondaryDomainId!==domainId?semanticDomain(secondaryDomainId):null;
  const items=components.map(([layer,item])=>({layer,id:item.id,name:item.name,keywords:[...item.keywords].slice(0,3),tags:[...item.tags],meaning:item[mode]||item.event,light:item.light,shadow:item.shadow}));
  const keywords=[...new Set(items.flatMap(item=>item.keywords))].slice(0,3);
  return Object.freeze({version:SEMANTIC_MATRIX_VERSION,mode,domainId,domainLabel:domain.label,secondaryDomainId:secondary?secondaryDomainId:null,secondaryDomainLabel:secondary?.label||null,keywords,summary:naturalSummary(components,domainId,secondaryDomainId,mode,states),items,states});
}
export function semanticGuideForBoard(board,{mode='event',domainId='general_decision',secondaryDomainId=null,palaceNumbers=null}={}){
  const wanted=palaceNumbers?new Set(palaceNumbers.map(Number)):null;
  return (board?.palaces||[]).filter(p=>!wanted||wanted.has(p.number)).map(p=>({palace:p.number,...semanticBundle(p,{mode,domainId,secondaryDomainId,board})}));
}
export function semanticDomainVocabulary(domainId){
  const domain=semanticDomain(domainId);return Object.freeze({id:domainId,label:domain.label,overrides:{...domain.overrides},safety:domain.safety||null});
}
export function semanticAssemblyRules(){return Object.freeze(Object.fromEntries(Object.entries(SEMANTIC_MATRIX.assembly_rules).map(([id,value])=>[id,value.rule])));}
