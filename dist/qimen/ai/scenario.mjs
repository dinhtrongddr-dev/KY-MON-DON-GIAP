import {domainSemantics} from '../modes/semantics.mjs';
export function buildScenario(selected,context,graph,interactions=[],modePlan={computed:{}},processed={}) {
  const primary=selected.filter(b=>b.actorIds.some(id=>['self','event'].includes(id))),main=primary.length?primary:selected.slice(0,1);
  const relevantRoles=new Set([...domainSemantics(context.domain).roles,...(modePlan.roleIds||[])]);
  const conditionWeight={realization_condition:4,actor_specific_condition:4,execution_condition:3,decision_stability:2,activation_condition:2};
  // A blocked goal or known decision maker may govern the next step even when
  // self/event are in a different palace. This ranks attention, not probability.
  const conflicts=selected.flatMap(b=>b.conflicts.map(c=>{
    const mainActor=c.actorIds.some(id=>['self','event'].includes(id)||b.roles.some(r=>r.id===id&&r.status==='user_supplied'));
    const questionRelevance=mainActor?1:c.actorIds.some(id=>relevantRoles.has(id)||id.startsWith('topic_'))?0.9:0.5;
    const stagePriority=c.affectedDimensions?.includes(processed.primaryJudgment?.dimension)?2:1;
    const priority=(conditionWeight[c.dominant]||1)*questionRelevance*stagePriority+b.relevance.conflictPriority/10;
    return {...c,claimId:`claim_${b.palace}`,priority,priorityBasis:{questionRelevance,conditionWeight:conditionWeight[c.dominant]||1,evidenceRelevance:b.relevance.score}};
  })).sort((a,b)=>b.priority-a.priority);
  const principal=conflicts[0]||null;
  const claims=[...new Set([...(processed.primaryJudgment?.claimIds||main.map(b=>`claim_${b.palace}`)),...(principal?[principal.claimId]:[])])];
  const other=selected.filter(b=>!claims.includes(`claim_${b.palace}`)).slice(0,2).map(b=>`claim_${b.palace}`);
  const strategy=context.questionType==='strategy';
  const selectedPalaces=new Set(selected.map(b=>b.palace));
  const edges=graph.relations.filter(e=>selectedPalaces.has(e.fromPalace)&&selectedPalaces.has(e.toPalace));
  const opening=main.some(b=>['kai','sheng','xiu'].includes(b.symbols.door.id));
  const stance=context.needsClarification?'clarify_subject':principal?.dominant==='realization_condition'?'requires_realization':
    conflicts.some(c=>c.code==='reversal')?'unstable_progress':principal?'condition_constrained':opening?'conditional_opening':'check_bottleneck';
  const objective=strategy?'choose_action_sequence':context.questionType==='comparison'?'compare_evidence':context.questionType==='diagnosis'?'explain_bottleneck':context.questionType==='decision'?'compare_conditions':'assess_conditional_outcome';
  const operations={prediction:'observe_response_and_conditions',strategy:'activate_and_test_response',business:strategy?'advance_commercial_gate':'assess_commercial_stage',negotiation:'exchange_conditions_after_verification',timing:'compare_computed_candidate_conditions',direction:'compare_directions_and_origin'};
  const inputs=Object.fromEntries(['path','initiative','posture','closing','concessions','stopConditions','otherKnown','powerRelation','action','targets','origin'].filter(k=>modePlan.computed[k]!==undefined).map(k=>[k,modePlan.computed[k]]));
  if(modePlan.computed.bottlenecks)inputs.bottlenecks=modePlan.computed.bottlenecks.filter(b=>b.signals.length);
  const activeRoles=new Set(graph.nodes.map(n=>n.id));
  if(inputs.bottlenecks)inputs.bottlenecks=inputs.bottlenecks.filter(b=>activeRoles.has(b.role));
  if(!activeRoles.has('authority')&&!activeRoles.has('decisionMaker')){
    if(inputs.closing)inputs.closing={...inputs.closing,gates:inputs.closing.gates.filter(x=>x!=='Người duyệt')};
    if(inputs.posture==='discover_authority_and_needs')inputs.posture='clarify_scope_and_needs';
    if(inputs.stopConditions)inputs.stopConditions=inputs.stopConditions.filter(x=>!x.includes('quyền duyệt'));
  }
  const modeDecision={operation:operations[context.mode],ruleSet:modePlan.ruleSet||null,inputs};
  const turningPoint=principal?.resolution||processed.primaryJudgment?.condition||'Cần dấu hiệu riêng của bước đang xét trước khi chuyển sang kết quả cuối.';
  const agency=interactions.filter(i=>i.affectsGoal);
  const goalEdges=edges.filter(e=>agency.some(i=>i.edgeId===e.id));
  const currentEdges=goalEdges.filter(e=>[e.from,e.to].includes('event')&&[e.from,e.to].includes('self'));
  const outcomeEdges=goalEdges.filter(e=>[e.from,e.to].some(id=>['money','contract','payment'].includes(id)));
  return {objective,agency,modeDecision,primaryJudgment:{...processed.primaryJudgment,stance,questionType:context.questionType,claimIds:claims},
    sequence:processed.eventStages?.transitions||[],
    mainConflict:principal,
    stages:[
      {stage:'current',dependsOn:null,eventStages:['POSSIBILITY','EMERGENCE'],operation:'establish_current_position',claimIds:claims,relationshipIds:currentEdges.map(e=>e.id),focus:context.stage,insight:processed.primaryJudgment?.main},
      {stage:'next',dependsOn:'current',eventStages:['FORMATION','CONFIRMATION','EXECUTION'],operation:modeDecision.operation,claimIds:[...new Set([...claims,...other])],relationshipIds:goalEdges.filter(e=>!e.samePalace).map(e=>e.id),condition:turningPoint,insight:agency.map(i=>i.implication).join(' ')},
      {stage:'outcome',dependsOn:'next',eventStages:['REALIZATION','COMPLETION'],operation:strategy?'verify_goal_then_escalate':'distinguish_progress_from_final_outcome',claimIds:claims,relationshipIds:outcomeEdges.map(e=>e.id),condition:processed.primaryJudgment?.distinction||'Không đồng nhất tiến triển với kết quả cuối.'}],
    turningPoint,alternative:{id:'alternative_conditions_unmet',claimIds:claims,trigger:'Điều kiện chuyển chưa được xác nhận hoặc xuất hiện thông tin thực tế trái giả thuyết.',consequence:'Giữ lại bước xác minh, điều chỉnh phương án; không tự khẳng định mục tiêu cuối đã đạt.'},
    timing:processed.timing||{horizon:context.timeHorizon,basis:'question_horizon_only',limit:'Chưa có mốc ứng kỳ đủ rõ.'}};
}
