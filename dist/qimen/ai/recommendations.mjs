export function buildRecommendations(scenario,selected,context) {
  const isStrategy=context.questionType==='strategy';
  return selected.slice(0,4).map((b,i)=>({id:`action_${b.palace}`,claimId:`claim_${b.palace}`,order:i+1,
    operation:isStrategy?b.translation.action.verb:i===0?'observe_before_conclude':b.translation.action.verb,
    objective:b.translation.action.object,focus:b.translation.action.focus,
    counterpartCheck:b.translation.action.counterpartCheck,relationshipChecks:(scenario.agency||[]).filter(r=>b.actorIds.includes(r.from)||b.actorIds.includes(r.to)).map(r=>r.check),doneWhen:b.translation.action.completionEvidence,
    requires:b.conflicts[0]?.resolution||scenario.turningPoint,
    avoid:b.states.some(s=>s.code==='fan_yin')?'Không coi phản hồi đầu tiên là quyết định cuối.':
      b.symbols.deity.id==='snake'?'Không hứa dựa trên giả định chưa kiểm chứng.':
      b.symbols.door.id==='fear'?'Không mở rộng cam kết khi thông tin còn gây tranh luận.':'Không bỏ qua điều kiện xác nhận của bước này.'}));
}
