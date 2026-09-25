import {unique,PALACE_LABELS,plainEngineMeaning,palaceNumber} from './narrativePrimitives.mjs';
const HARM={void:'Không Vong',tomb:'Nhập Mộ',punishment:'Kích Hình',door_pressure:'Môn bức cung'};
export const ACTOR_LABELS={
  self:'Người hỏi',event:'Sự việc',money:'Nguồn thu',capital:'Vốn',
  contract:'Thỏa thuận và giấy tờ',execution:'Thực hiện',customer:'Khách hàng',
  competitor:'Đối thủ',authority:'Phía có thẩm quyền',decisionMaker:'Đại diện quyền quyết định',
  family_child:'Việc chăm sóc con',family_rest:'Sinh hoạt gia đình',
  menh_self:'Bản thân',menh_parent:'Gia đình gốc',menh_child:'Con cái',
  menh_career:'Sự nghiệp',menh_wealth:'Tài vận'
};
const name=x=>typeof x==='string'?x:x?.vi||x?.name||x?.han||'';
export function palaceEvidence(p,layer){
  if(!p)return '';
  const number=p.number||palaceNumber(p.code),label=PALACE_LABELS[number]||p.name;
  const rows=[label+': '+[name(p.star),name(p.door),name(p.spirit||p.deity)].filter(Boolean).join(' · ')+'.'];
  rows.push('Thiên can '+(p.heavenStems||[]).map(name).join(' + ')+'; địa can '+name(p.earthStem)+'.');
  const conditions=[];
  if(p.voided||p.void)conditions.push('Không Vong');
  if(p.horse)conditions.push('Dịch Mã');
  if(p.carriesQin)conditions.push('Thiên Cầm cùng can ký');
  if(conditions.length)rows.push(conditions.join('; ')+'.');
  const s=layer?.strength;
  if(s)rows.push('Vượng suy riêng: '+[
    s.star?'Tinh '+s.star.level+' ('+s.star.status+')':'',
    s.door?'Môn '+s.door.level+' ('+s.door.status+')':'',
    s.palace?'Cung '+s.palace.level+' ('+s.palace.status+')':'',
    ...(s.stems||[]).map(x=>'Can '+x.stem+': '+(x.level||x.longevity?.vi||x.longevity||'đã xét riêng'))
  ].filter(Boolean).join('; ')+'.');
  const t=layer?.structure;
  if(t){
    const relation=typeof t.doorRelation==='string'?t.doorRelation:t.doorRelation?.label;
    if(relation)rows.push(relation+'.');
    const harms=unique((t.fourHarms||[]).map(h=>(HARM[h.code]||'Điều kiện bất lợi')+(h.stem?' tại can '+h.stem:'')+(h.carried?' (can ký)':'')));
    if(harms.length)rows.push(harms.join('; ')+'.');
    for(const x of t.stemResponses||[])if(x.plainMeaning)rows.push('Can '+x.pair+': '+x.plainMeaning);
    for(const x of t.patterns||[])if(x.plainMeaning)rows.push(x.plainMeaning);
  }
  return unique(rows).join(' ');
}
export function eventClaimEvidence(claim,context){
  const c=context.allInOne,g=c.reasoning,b=g.evidenceBundles.find(x=>x.id===claim.bundleId);
  if(!b){
    const p=g.nianmingProfile?.people?.find(x=>claim.evidenceIds.includes(x.evidenceId));
    return p?'Niên Mệnh '+p.label+' tại '+PALACE_LABELS[p.palace]+', chỉ làm căn cứ hỗ trợ cho đại diện đã xác định.':'';
  }
  const p=c.board.palaces.find(x=>x.number===b.palace);
  const layer={strength:b.strengthProfile,structure:{doorRelation:b.doorRelation,fourHarms:b.fourHarms,stemResponses:b.stemResponses,patterns:b.structurePatterns}};
  const roles=unique(b.actorIds.map(id=>ACTOR_LABELS[id]||b.roles.find(r=>r.id===id)?.meaning).filter(Boolean));
  const texts=[roles.join(' / ')+': '+palaceEvidence(p,layer)];
  for(const edge of g.relationships.filter(e=>claim.evidenceIds.includes(e.id))){
    const fact=context.facts[edge.id];if(fact)texts.push(plainEngineMeaning(fact));
  }
  for(const relation of [b.structuralRelations?.starDoor,b.structuralRelations?.doorPalace,...(b.structuralRelations?.stemPairs||[]).map(x=>x.relation)])if(relation?.text)texts.push(relation.text+'.');
  for(const x of b.stemResponses||[])if(x.plainMeaning)texts.push('Can '+x.pair+': '+x.plainMeaning);
  const k=b.keying;
  if(k){
    for(const x of [k.doorDoor,...(k.doorStems||[]),...(k.wonders||[]),k.doorPalace])
      if(x?.plainMeaning)texts.push(x.plainMeaning);
  }
  for(const x of b.formation?.matches||[])if(x.plainMeaning)
    texts.push(x.name+': '+x.plainMeaning+(x.qualified===false?' Điều kiện chưa đủ.':''));
  return unique(texts).join('\n\n');
}
export function comparisonEvidence(row,context){
  const c=context.allInOne,candidate=c.comparison?.candidates?.find(x=>x.id===row.id);
  const palaces=candidate?candidate.details.map(d=>candidate.board.palaces.find(p=>p.number===d.number)):[c.board.palaces.find(p=>p.number===Number(row.id.replace('direction_','')))];
  return unique([row.label+'; thứ hạng '+row.rank+'.',...palaces.map(p=>palaceEvidence(p)),...(row.supports||[]),...(row.blockers||[]),...(row.formationMarkers||[]).map(x=>x.name+': '+x.plainMeaning),...(row.directionMarkers||[]).map(x=>x.name+': '+x.plainMeaning)]).join('\n\n');
}
export function paragraphEvidence(ids,contract,unit){
  return unit.comparisonId?unit.technicalEvidence:technicalForClaims(ids,contract,{includeGlobal:unit.id==='overview'});
}
export function paragraphTrace(ids,contract,unit){
  return {...traceForClaims(ids,contract),...(unit.comparisonId?{comparison_id:unit.comparisonId}:{}),...(unit.interactionIds?{interaction_ids:unit.interactionIds}:{}),...(unit.recommendationId?{recommendation_id:unit.recommendationId}:{})};
}
export function technicalForClaims(ids,contract,{includeGlobal=true}={}){
  return unique(ids.filter(id=>includeGlobal||id!=='GLOBAL_STRUCTURE')
    .map(id=>contract.claims.find(c=>c.id===id)?.technicalEvidence).filter(Boolean)).join('\n\n');
}
export function traceForClaims(ids,contract){
  const claims=ids.map(id=>contract.claims.find(c=>c.id===id)).filter(Boolean);
  return {claim_ids:ids,evidence_ids:unique(claims.flatMap(c=>c.evidenceIds)),rule_ids:unique(claims.flatMap(c=>c.ruleIds)),
    modifier_ids:unique(claims.flatMap(c=>c.modifierIds||[]))};
}
