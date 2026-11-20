export const STAGE_KEYS=['POSSIBILITY','EMERGENCE','FORMATION','CONFIRMATION','EXECUTION','REALIZATION','COMPLETION'];
const ADVERSE_HARMS=['void','tomb','punishment','door_pressure'];
const GENERIC=['opportunity','emergence','formation','confirmation','execution','realization','completion'];
const FINANCE=['opportunity','income_emergence','income_formation','payment_commitment','payment_processing','cash_realization','completion'];
export const dimensionKeys=context=>context.domain==='finance'?FINANCE:GENERIC;
export function askedDimension(context) {
  const stage=context.outcomeTarget?.stageAsked||'formation';
  const index={opportunity:0,emergence:1,formation:2,confirmation:3,execution:4,cash_realization:5,realization:5,completion:6}[stage];
  return dimensionKeys(context)[index];
}
export function buildOutcomeDimensions(selected,context,interactions) {
  const finance=context.domain==='finance',keys=dimensionKeys(context);
  const rolesByStage=finance?[['money','opportunity'],['money','event'],['event','money'],['contract'],['payment','execution'],['money','capital','self','payment'],['event','payment']]:
    [['opportunity','event'],['event','quote'],['event','service'],['contract','event'],['execution','event'],['event','self'],['event','contract']];
  const unique=values=>[...new Set(values)];
  const result={};
  for(const [index,key] of keys.entries()) {
    const relevant=selected.filter(b=>b.actorIds.some(id=>rolesByStage[index].includes(id)));
    // A whole cluster supports a goal; an alias in the same palace adds no vote.
    const supportive=relevant.filter(b=>['kai','sheng','xiu'].includes(b.symbols.door.id)||context.intent==='reply'&&b.symbols.door.id==='jing'||
      b.stemResponses?.some(r=>r.actorIds?.some(id=>rolesByStage[index].includes(id))&&r.weight>=0.75));
    const conflicts=selected.flatMap(b=>b.conflicts.filter(c=>c.affectedDimensions.includes(key)||
      index>=3&&c.effect==='not_yet_realized'&&c.actorIds.includes('event')));
    const relationEffects=interactions.filter(i=>!i.samePalace&&i.affectsGoal&&index>=2);
    const pressure=relationEffects.filter(i=>i.effects.some(effect=>['pressure','obstruction'].includes(effect)));
    const supports=unique(supportive.flatMap(b=>b.evidenceIds));
    const limits=unique([...conflicts.flatMap(c=>c.evidenceIds),...pressure.flatMap(i=>i.evidenceIds)]);
    const upstreamSupport=index>1&&['positive','conditional'].includes(result[keys[1]]?.status);
    const hasSupport=supportive.length>0||(index>=3&&upstreamSupport);
    const specific=relevant.length>0;
    const strengthBand=b=>{
      const relevant=(b.capacityStrength?.roles||[]).filter(r=>rolesByStage[index].includes(r.roleId));
      if(!relevant.length)return b.capacityStrength?.band||null;
      const primaryIds=new Set((b.roles||[]).filter(r=>r.yongshenTier==='primary'&&rolesByStage[index].includes(r.id)).map(r=>r.id));
      const source=primaryIds.size?relevant.filter(r=>primaryIds.has(r.roleId)):relevant;
      const best=[...source].sort((a,b)=>(b.weight??0)-(a.weight??0))[0];
      return best?.band||b.capacityStrength?.band||null;
    };
    const directEvent=supportive.find(b=>b.actorIds.includes('event'))||supportive[0];
    const clustered=directEvent?(strengthBand(directEvent)==='strong'||(!directEvent.capacityStrength&&(['vượng','tướng'].includes(directEvent.strength.status)||['ren','xin','fu','chong'].includes(directEvent.symbols.star.id)))):false;
    const weakSupport=supportive.filter(b=>strengthBand(b)==='weak');
    // TG-CB-7.0 (P4, quyết định 2): symmetric adverse rule. A stage whose own Dụng Thần
    // carries two of the four harms (Không Vong, Nhập Mộ, Kích Hình, Môn bức), or one harm
    // together with a severe stem pattern / hung door, is adverse. With no supportive
    // cluster it is NEGATIVE; with support that is itself harmed, the adverse side dominates.
    const stageRole=ids=>ids?.some(id=>rolesByStage[index].includes(id));
    const harmCount=b=>(b.states||[]).filter(st=>ADVERSE_HARMS.includes(st.code)&&stageRole(st.actorIds)).length;
    const severeStem=b=>(b.stemResponses||[]).some(r=>r.weight<=-0.75&&stageRole(r.actorIds));
    const hungDoor=b=>['si','fear','shang'].includes(b.symbols?.door?.id);
    const severe=b=>harmCount(b)>=2||harmCount(b)>=1&&severeStem(b);
    const heavy=b=>severe(b)||harmCount(b)>=1&&hungDoor(b)||severeStem(b)&&hungDoor(b);
    const heavyRelevant=relevant.filter(heavy);
    const adverseDominant=specific&&heavyRelevant.length>0&&(supportive.length===0||supportive.every(heavy));
    const decisiveNegative=adverseDominant&&!supportive.length&&relevant.some(severe);
    const upstreamNegative=index>=3&&result[keys[2]]?.status==='negative';
    const status=upstreamNegative&&index<6?'negative':index===6?'unresolved':index>=3?(hasSupport&&specific?'conditional':specific?'uncertain':'unresolved'):
      decisiveNegative?'negative':
      supportive.length?(conflicts.length||weakSupport.length||index===2&&pressure.length||!clustered?'conditional':'positive'):'uncertain';
    const conditions=unique([...conflicts.map(c=>c.resolution),...pressure.map(i=>i.implication),...(weakSupport.length?['Biểu tượng hỗ trợ đang ở mức lực yếu theo mô hình mùa của chính Dụng Thần; cần thêm điều kiện thực tế hoặc hỗ trợ khác trước khi nâng kết luận.']:[])]);
    if(index>=3)conditions.push(finance?[
      '', '', '', 'Khoản thu có nội dung cam kết cụ thể.', 'Có bước xử lý được thực hiện.',
      'Có khoản thực nhận quan sát được; không dùng cơ hội hoặc lời hẹn thay bằng chứng nhận tiền.', 'Các phần việc còn lại đã kết thúc.'
    ][index]:['','','','Có sự thống nhất rõ về bước tiếp.','Bước thực hiện đã diễn ra.','Kết quả được ghi nhận trong thực tế.','Không còn phần việc chưa hoàn tất.'][index]);
    const symbols=unique(supportive.map(b=>{
      const stemSupport=b.stemResponses?.filter(r=>r.actorIds?.some(id=>rolesByStage[index].includes(id))&&r.weight>=0.75).map(r=>`${r.pair}: ${r.plainMeaning}`).join(', ');
      return `${b.symbols.door.vi} + ${b.symbols.star.vi} + ${b.symbols.deity.vi}${stemSupport?` + cấu trúc ${stemSupport}`:''} tại cung ${b.palace}`;
    }));
    const heavyLimits=unique(heavyRelevant.flatMap(b=>b.evidenceIds.filter(id=>/^(p|c|structure_)\d$/.test(id))));
    result[key]={status,adverseDominant:status==='negative'||adverseDominant,adverseEvidenceIds:heavyLimits,supportingEvidenceIds:supports.length?supports:index>=3&&upstreamSupport?[...result[keys[1]].supportingEvidenceIds]:[],
      limitingEvidenceIds:unique([...limits,...heavyLimits]),conditions,confidenceLevel:supportive.length?'moderate':'low',
      reason:status==='negative'?(upstreamNegative?'Tầng thành hình đã bất lợi nên tầng này không thể coi là đạt.':'Dụng Thần của tầng này bị nhiều hại cùng lúc (Không Vong, Nhập Mộ, Kích Hình, Môn bức hoặc hung cách) và không có cụm hỗ trợ: tầng này không thành theo bàn.'):
        index===6?'Chưa có dữ kiện thực tế xác nhận hoàn tất; không suy việc đã xong từ tượng.':
        supportive.length?`${symbols.join('; ')} hỗ trợ tầng ${key}${limits.length?', kèm điều kiện chuyển bước riêng':''}.`:
          upstreamSupport?'Có hỗ trợ ở tầng trước; tầng này còn thiếu xác nhận riêng.':'Chưa có cụm tượng trực tiếp đủ rõ cho tầng này.',
      relationshipIds:relationEffects.map(i=>i.edgeId),basis:'symbolic_interpretation_not_observed_fact'};
  }
  return result;
}
