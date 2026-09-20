export const STAGE_KEYS=['POSSIBILITY','EMERGENCE','FORMATION','CONFIRMATION','EXECUTION','REALIZATION','COMPLETION'];
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
    const directEvent=supportive.find(b=>b.actorIds.includes('event'));
    const clustered=directEvent&&(['vượng','tướng'].includes(directEvent.strength.status)||['ren','xin','fu','chong'].includes(directEvent.symbols.star.id));
    const status=index===6?'unresolved':index>=3?(hasSupport&&specific?'conditional':specific?'uncertain':'unresolved'):
      supportive.length?(conflicts.length||index===2&&pressure.length||!clustered?'conditional':'positive'):'uncertain';
    const conditions=unique([...conflicts.map(c=>c.resolution),...pressure.map(i=>i.implication)]);
    if(index>=3)conditions.push(finance?[
      '', '', '', 'Khoản thu có nội dung cam kết cụ thể.', 'Có bước xử lý được thực hiện.',
      'Có khoản thực nhận quan sát được; không dùng cơ hội hoặc lời hẹn thay bằng chứng nhận tiền.', 'Các phần việc còn lại đã kết thúc.'
    ][index]:['','','','Có sự thống nhất rõ về bước tiếp.','Bước thực hiện đã diễn ra.','Kết quả được ghi nhận trong thực tế.','Không còn phần việc chưa hoàn tất.'][index]);
    const symbols=unique(supportive.map(b=>{
      const stemSupport=b.stemResponses?.filter(r=>r.actorIds?.some(id=>rolesByStage[index].includes(id))&&r.weight>=0.75).map(r=>`${r.pair}: ${r.plainMeaning}`).join(', ');
      return `${b.symbols.door.vi} + ${b.symbols.star.vi} + ${b.symbols.deity.vi}${stemSupport?` + cấu trúc ${stemSupport}`:''} tại cung ${b.palace}`;
    }));
    result[key]={status,supportingEvidenceIds:supports.length?supports:index>=3&&upstreamSupport?[...result[keys[1]].supportingEvidenceIds]:[],
      limitingEvidenceIds:limits,conditions,confidenceLevel:supportive.length?'moderate':'low',
      reason:index===6?'Chưa có dữ kiện thực tế xác nhận hoàn tất; không suy việc đã xong từ tượng.':
        supportive.length?`${symbols.join('; ')} hỗ trợ tầng ${key}${limits.length?', kèm điều kiện chuyển bước riêng':''}.`:
          upstreamSupport?'Có hỗ trợ ở tầng trước; tầng này còn thiếu xác nhận riêng.':'Chưa có cụm tượng trực tiếp đủ rõ cho tầng này.',
      relationshipIds:relationEffects.map(i=>i.edgeId),basis:'symbolic_interpretation_not_observed_fact'};
  }
  return result;
}
