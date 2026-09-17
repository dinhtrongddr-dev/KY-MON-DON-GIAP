import {buildEvidenceBundles} from '../analysis/evidenceBundles.mjs';
import {scoreEvidence} from '../analysis/evidenceScore.mjs';
import {translateToRealWorld} from './realWorld.mjs';
import {buildScenario} from './scenario.mjs';
import {buildRecommendations} from './recommendations.mjs';
import {freezeData} from '../schemas/board.mjs';
import {analyzeInteractions} from '../analysis/interactions.mjs';
import {RULE_REGISTRY} from '../analysis/ruleRegistry.mjs';
import {buildOutcomeDimensions} from './outcomeDimensions.mjs';
import {buildEventStages} from './eventStages.mjs';
import {buildPrimaryJudgment} from './primaryJudgment.mjs';
import {buildTiming} from './timingEngine.mjs';
import {relevantActorIds} from '../analysis/actorRelevance.mjs';
export function buildReadingEvidenceGraph(analysis,questionContext,modePlan,graph,board=null) {
  const active=new Set(relevantActorIds(questionContext,analysis.roles,modePlan));
  graph={...graph,nodes:graph.nodes.filter(n=>active.has(n.id)),relations:graph.relations.filter(e=>active.has(e.from)&&active.has(e.to))};
  const candidates=buildEvidenceBundles(analysis,questionContext,graph,modePlan);
  const selected=scoreEvidence(candidates,questionContext,graph).map(b=>({...b,translation:translateToRealWorld(b,questionContext)}));
  const interactions=analyzeInteractions(graph,selected);
  const outcomeDimensions=buildOutcomeDimensions(selected,questionContext,interactions);
  const eventStages=buildEventStages(outcomeDimensions,questionContext,interactions);
  const primaryJudgment=buildPrimaryJudgment(outcomeDimensions,eventStages,selected,questionContext);
  const timing=buildTiming(questionContext,board,selected);
  const likelyScenario=buildScenario(selected,questionContext,graph,interactions,modePlan,{outcomeDimensions,eventStages,primaryJudgment,timing});
  const claims=selected.map(b=>({id:`claim_${b.palace}`,bundleId:b.id,actorIds:b.actorIds,evidenceIds:[...new Set([...b.evidenceIds,...interactions.filter(i=>b.actorIds.includes(i.from)||b.actorIds.includes(i.to)).slice(0,2).map(i=>i.edgeId)])],
    mechanism:b.translation.mechanism,interpretation:b.translation.interaction,
    realWorldManifestation:b.translation.manifestation,implication:b.translation.implication,
    ruleIds:['rule_board','rule_elements','rule_conditions','rule_strength','rule_synthesis','rule_stages','rule_timing_scope',...new Set(b.actorIds.map(id=>analysis.roles.find(r=>r.id===id).selectionRule.id))],
    counterEvidenceIds:b.conflicts.length?[`c${b.palace}`,...(b.states.some(s=>['fan_yin','fu_yin'].includes(s.code))?['patterns']:[])]:[],
    limitations:[RULE_REGISTRY.rule_synthesis.conditions,...new Set(b.actorIds.flatMap(id=>analysis.roles.find(r=>r.id===id).limitations))],
    semanticTags:[...new Set([b.translation.mechanism,...b.actorIds.filter(id=>!id.startsWith('topic_')),...b.states.map(s=>s.code)])],
    conflicts:b.conflicts,priority:b.relevance.score,status:'conditional_interpretation'}));
  const selectedPalaces=new Set(selected.map(b=>b.palace));
  return freezeData({schemaVersion:'ReadingEvidenceGraph/2',questionContext,mode:questionContext.mode,modeRuleSet:modePlan.ruleSet,
    outcomeDimensions,eventStages,primaryJudgment:{...primaryJudgment,claimIds:likelyScenario.primaryJudgment.claimIds},timing,
    actors:graph.nodes,nodes:graph.nodes,relationships:graph.relations.filter(e=>selectedPalaces.has(e.fromPalace)&&selectedPalaces.has(e.toPalace)),
    rules:RULE_REGISTRY,evidenceBundles:selected,claims,interactions,conflicts:selected.flatMap(b=>b.conflicts.map(c=>({...c,claimId:`claim_${b.palace}`}))),
    supports:selected.map(b=>({claimId:`claim_${b.palace}`,capability:b.translation.capacity,condition:b.translation.implication})),
    blockers:selected.filter(b=>b.conflicts.length).map(b=>({claimId:`claim_${b.palace}`,conditions:b.conflicts})),
    opportunities:selected.filter(b=>['access','conditional_access','contact','growth'].includes(b.translation.mechanism)).map(b=>`claim_${b.palace}`),
    turningPoints:[likelyScenario.turningPoint],likelyScenario,recommendations:buildRecommendations(likelyScenario,selected,questionContext),
    unresolved:graph.nodes.filter(r=>r.status==='unresolved').map(r=>({id:r.id,label:r.label,reason:r.basis})),
    coverage:{candidateBundles:candidates.length,selectedBundles:selected.length,unsupported:analysis.coverage.unsupported,
      semantics:'Registry diễn giải của ứng dụng; không phải bằng chứng thực tế hoặc đồng thuận mọi trường phái.'}});
}
