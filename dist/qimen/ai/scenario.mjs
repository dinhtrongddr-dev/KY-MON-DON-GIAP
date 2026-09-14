import {domainSemantics} from '../modes/semantics.mjs';
export function buildScenario(selected,context,graph,interactions=[],modePlan={computed:{}}) {
  const primary=selected.filter(b=>b.actorIds.some(id=>['self','event'].includes(id))),main=primary.length?primary:selected.slice(0,1);
  const relevantRoles=new Set([...domainSemantics(context.domain).roles,...(modePlan.roleIds||[])]);
  const conditionWeight={realization_condition:4,actor_specific_condition:4,execution_condition:3,decision_stability:2,activation_condition:2};
  // A blocked goal or known decision maker may govern the next step even when
  // self/event are in a different palace. This ranks attention, not probability.
  const conflicts=selected.flatMap(b=>b.conflicts.map(c=>{
    const mainActor=c.actorIds.some(id=>['self','event'].includes(id)||b.roles.some(r=>r.id===id&&r.status==='user_supplied'));
    const questionRelevance=mainActor?1:c.actorIds.some(id=>relevantRoles.has(id)||id.startsWith('topic_'))?0.9:0.5;
    const priority=(conditionWeight[c.dominant]||1)*questionRelevance+b.relevance.score/10;
    return {...c,claimId:`claim_${b.palace}`,priority,priorityBasis:{questionRelevance,conditionWeight:conditionWeight[c.dominant]||1,evidenceRelevance:b.relevance.score}};
  })).sort((a,b)=>b.priority-a.priority);
  const principal=conflicts[0]||null;
  const claims=[...new Set([...main.map(b=>`claim_${b.palace}`),...(principal?[principal.claimId]:[])])];
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
  const modeDecision={operation:operations[context.mode],ruleSet:modePlan.ruleSet||null,inputs};
  const turningPoint=principal?.resolution||'Một phản hồi thực tế xác nhận bước đang xét đã hoàn tất, trước khi coi mục tiêu cuối đã đạt.';
  const agency=interactions.filter(i=>i.from==='self'&&['event','customer','contract','opportunity'].includes(i.to));
  return {objective,agency,modeDecision,primaryJudgment:{stance,questionType:context.questionType,claimIds:claims,condition:turningPoint},
    mainConflict:principal,
    stages:[
      {stage:'current',dependsOn:null,operation:'establish_current_position',claimIds:claims,relationshipIds:edges.slice(0,1).map(e=>e.id),focus:context.stage},
      {stage:'next',dependsOn:'current',operation:modeDecision.operation,claimIds:[...new Set([...claims,...other])],relationshipIds:edges.filter(e=>!e.samePalace).slice(0,2).map(e=>e.id),condition:turningPoint},
      {stage:'outcome',dependsOn:'next',operation:strategy?'verify_goal_then_escalate':'distinguish_progress_from_final_outcome',claimIds:claims,relationshipIds:edges.slice(-1).map(e=>e.id),condition:'Chỉ chuyển sang kết quả nếu điều kiện ở chặng trước được xác nhận; nếu không, giữ kết quả ở trạng thái chưa hoàn tất.'}],
    turningPoint,alternative:{id:'alternative_conditions_unmet',claimIds:claims,trigger:'Điều kiện chuyển chưa được xác nhận hoặc xuất hiện thông tin thực tế trái giả thuyết.',consequence:'Giữ lại bước xác minh, điều chỉnh phương án; không tự khẳng định mục tiêu cuối đã đạt.'},
    timing:{horizon:context.timeHorizon,basis:'question_horizon_only',limit:'Không có phép tính ngày ứng nghiệm xác định trong planner này.'}};
}
