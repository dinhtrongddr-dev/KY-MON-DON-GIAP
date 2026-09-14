import {buildEvidenceBundles} from '../analysis/evidenceBundles.mjs';
import {scoreEvidence} from '../analysis/evidenceScore.mjs';
import {translateToRealWorld} from './realWorld.mjs';
import {buildScenario} from './scenario.mjs';
import {buildRecommendations} from './recommendations.mjs';
import {freezeData} from '../schemas/board.mjs';
import {analyzeInteractions} from '../analysis/interactions.mjs';
export function buildReadingEvidenceGraph(analysis,questionContext,modePlan,graph) {
  const candidates=buildEvidenceBundles(analysis,questionContext,graph,modePlan);
  const selected=scoreEvidence(candidates,questionContext,graph).map(b=>({...b,translation:translateToRealWorld(b,questionContext)}));
  const interactions=analyzeInteractions(graph,selected);
  const likelyScenario=buildScenario(selected,questionContext,graph,interactions,modePlan);
  const claims=selected.map(b=>({id:`claim_${b.palace}`,bundleId:b.id,actorIds:b.actorIds,evidenceIds:[...new Set([...b.evidenceIds,...interactions.filter(i=>b.actorIds.includes(i.from)||b.actorIds.includes(i.to)).slice(0,2).map(i=>i.edgeId)])],
    mechanism:b.translation.mechanism,interpretation:b.translation.interaction,
    realWorldManifestation:b.translation.manifestation,implication:b.translation.implication,
    conflicts:b.conflicts,priority:b.relevance.score,status:'conditional_interpretation'}));
  const selectedPalaces=new Set(selected.map(b=>b.palace));
  return freezeData({schemaVersion:'ReadingEvidenceGraph/1',questionContext,mode:questionContext.mode,modeRuleSet:modePlan.ruleSet,
    actors:graph.nodes,nodes:graph.nodes,relationships:graph.relations.filter(e=>selectedPalaces.has(e.fromPalace)&&selectedPalaces.has(e.toPalace)),
    evidenceBundles:selected,claims,interactions,conflicts:selected.flatMap(b=>b.conflicts.map(c=>({...c,claimId:`claim_${b.palace}`}))),
    supports:selected.map(b=>({claimId:`claim_${b.palace}`,capability:b.translation.capacity,condition:b.translation.implication})),
    blockers:selected.filter(b=>b.conflicts.length).map(b=>({claimId:`claim_${b.palace}`,conditions:b.conflicts})),
    opportunities:selected.filter(b=>['access','conditional_access','contact','growth'].includes(b.translation.mechanism)).map(b=>`claim_${b.palace}`),
    turningPoints:[likelyScenario.turningPoint],likelyScenario,recommendations:buildRecommendations(likelyScenario,selected,questionContext),
    unresolved:analysis.roles.filter(r=>r.status==='unresolved').map(r=>({id:r.id,label:r.label,reason:r.basis})),
    coverage:{candidateBundles:candidates.length,selectedBundles:selected.length,unsupported:analysis.coverage.unsupported,
      semantics:'Registry diễn giải của ứng dụng; không phải bằng chứng thực tế hoặc đồng thuận mọi trường phái.'}});
}
