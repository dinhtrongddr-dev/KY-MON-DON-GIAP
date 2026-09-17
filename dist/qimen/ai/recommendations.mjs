export function buildRecommendations(scenario,selected,context) {
  const isStrategy=context.questionType==='strategy';
  const decisive=selected.find(b=>`claim_${b.palace}`===scenario.mainConflict?.claimId);
  const ordered=decisive?[decisive,...selected.filter(b=>b!==decisive)]:selected;
  return ordered.slice(0,4).map((b,i)=>{
    const relation=(scenario.agency||[]).find(r=>r.affectsGoal&&!r.samePalace&&(b.actorIds.includes(r.from)||b.actorIds.includes(r.to)));
    const conflict=b===decisive?scenario.mainConflict:b.conflicts[0];
    const action=relation&&i===1?relation.implication:conflict?.resolution||`Chọn một bước cụ thể để ${b.translation.action.object}; dùng ${b.translation.action.focus}.`;
    return {id:`action_${b.palace}`,claimId:`claim_${b.palace}`,order:i+1,
    action,reason:relation&&i===1?relation.implication:conflict?.blocker||`${b.symbols.door.vi} kết hợp ${b.symbols.star.vi} hỗ trợ ${b.translation.objective}.`,
    sourceEvidenceIds:[...new Set([...b.evidenceIds,...(relation?.evidenceIds||[])])],
    targetBlocker:relation&&i===1?relation.edgeId:conflict?.id||`transition_${context.outcomeTarget?.stageAsked||'formation'}`,
    expectedEffect:relation?.effect==='pressure'?'Giảm phần yêu cầu chưa đáp ứng ở người hỏi.':conflict?.effect==='not_yet_realized'?'Tách khả năng đang có khỏi kết quả đã sử dụng được.':'Tạo dấu hiệu cụ thể cho bước tiếp theo.',
    operation:i===0?scenario.modeDecision.operation:isStrategy?b.translation.action.verb:'observe_before_conclude',
    objective:b.translation.action.object,focus:b.translation.action.focus,
    counterpartCheck:b.translation.action.counterpartCheck,relationshipChecks:(scenario.agency||[]).filter(r=>b.actorIds.includes(r.from)||b.actorIds.includes(r.to)).map(r=>r.check),doneWhen:b.translation.action.completionEvidence,
    requires:b===decisive?scenario.mainConflict.resolution:b.conflicts[0]?.resolution||scenario.turningPoint,
    avoid:b.states.some(s=>s.code==='fan_yin')?'Không coi phản hồi đầu tiên là quyết định cuối.':
      b.symbols.deity.id==='snake'?'Không hứa dựa trên giả định chưa kiểm chứng.':
      b.symbols.door.id==='fear'?'Không mở rộng cam kết khi thông tin còn gây tranh luận.':'Không bỏ qua điều kiện của bước này.'};});
}
