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
import {eventCaseTarget,retrieveCases} from '../case/engine.mjs';
export function buildReadingEvidenceGraph(analysis,questionContext,modePlan,graph,board=null) {
  const active=new Set(relevantActorIds(questionContext,analysis.roles,modePlan));
  graph={...graph,nodes:graph.nodes.filter(n=>active.has(n.id)),relations:graph.relations.filter(e=>active.has(e.from)&&active.has(e.to))};
  const activeClusters=analysis.roleProfile.sharedPalaceClusters.map(c=>({...c,roleIds:c.roleIds.filter(id=>active.has(id))})).filter(c=>c.roleIds.length>1);
  const clusteredActive=new Set(activeClusters.flatMap(c=>c.roleIds));
  const activeRoleRows=analysis.roleProfile.roles.filter(r=>active.has(r.id)).map(r=>r.evidenceIndependence==='shared_palace_cluster'&&!clusteredActive.has(r.id)?{...r,evidenceIndependence:'independent_in_active_graph'}:r);
  const activeRoleById=new Map(activeRoleRows.map(r=>[r.id,r]));
  const influencePriority=i=>{
    const a=activeRoleById.get(i.from),b=activeRoleById.get(i.to);
    if(!a||!b)return -1;
    if([i.from,i.to].includes('self'))return 4;
    if(a.status==='user_supplied'||b.status==='user_supplied')return 3;
    if(['counterpart','competitor','authority'].includes(a.party)||['counterpart','competitor','authority'].includes(b.party))return 2;
    if(a.yongshenTier==='primary'&&b.yongshenTier==='primary')return 1;
    return 0;
  };
  const activeInfluences=analysis.roleProfile.influences.filter(i=>active.has(i.from)&&active.has(i.to)).map((i,index)=>({i,index,p:influencePriority(i)})).filter(x=>x.p>0).sort((a,b)=>b.p-a.p||a.index-b.index).slice(0,16).map(x=>x.i);
  const activeRoleProfile={...analysis.roleProfile,
    roles:activeRoleRows,
    influences:activeInfluences,
    sharedPalaceClusters:activeClusters,
    multiActor:{...analysis.roleProfile.multiActor,
      parties:[...new Set(analysis.roleProfile.roles.filter(r=>active.has(r.id)).map(r=>r.party))],
      resolvedCounterparts:analysis.roleProfile.multiActor.resolvedCounterparts.filter(id=>active.has(id)),
      unresolvedCounterparts:analysis.roleProfile.multiActor.unresolvedCounterparts.filter(id=>active.has(id))}};
  const candidates=buildEvidenceBundles(analysis,questionContext,graph,modePlan);
  const selected=scoreEvidence(candidates,questionContext,graph).map(b=>({...b,translation:translateToRealWorld(b,questionContext)}));
  const interactions=analyzeInteractions(graph,selected);
  const outcomeDimensions=buildOutcomeDimensions(selected,questionContext,interactions);
  const eventStages=buildEventStages(outcomeDimensions,questionContext,interactions);
  const primaryJudgment=buildPrimaryJudgment(outcomeDimensions,eventStages,selected,questionContext);
  const timing=buildTiming(questionContext,board,selected);
  const caseProfile=retrieveCases(eventCaseTarget({analysis,questionContext,selected,primaryJudgment,timing}),{limit:3});
  const likelyScenario=buildScenario(selected,questionContext,graph,interactions,modePlan,{outcomeDimensions,eventStages,primaryJudgment,timing,roleProfile:activeRoleProfile});
  const claims=selected.map(b=>({id:`claim_${b.palace}`,bundleId:b.id,actorIds:b.actorIds,evidenceIds:[...new Set([...b.evidenceIds,...interactions.filter(i=>b.actorIds.includes(i.from)||b.actorIds.includes(i.to)).slice(0,2).map(i=>i.edgeId)])],
    mechanism:b.translation.mechanism,interpretation:b.translation.interaction,
    realWorldManifestation:b.translation.manifestation,implication:b.translation.implication,
    ruleIds:['rule_board','rule_elements','rule_conditions','rule_strength','rule_structure_v2','rule_keying_v3','rule_formation_v3','rule_role_v2','rule_synthesis','rule_stages','rule_timing_scope',...new Set(b.actorIds.map(id=>analysis.roles.find(r=>r.id===id).selectionRule.id))],
    counterEvidenceIds:b.conflicts.length?[`c${b.palace}`,...(b.states.some(s=>['fan_yin','fu_yin'].includes(s.code))?['patterns']:[])]:[],
    limitations:[RULE_REGISTRY.rule_synthesis.conditions,...new Set(b.actorIds.flatMap(id=>analysis.roles.find(r=>r.id===id).limitations))],
    semanticTags:[...new Set([b.translation.mechanism,...b.actorIds.filter(id=>!id.startsWith('topic_')),...b.states.map(s=>s.code)])],
    conflicts:b.conflicts,priority:b.relevance.score,status:'conditional_interpretation'}));
  const selectedPalaces=new Set(selected.map(b=>b.palace));
  return freezeData({schemaVersion:'ReadingEvidenceGraph/2',questionContext,mode:questionContext.mode,modeRuleSet:modePlan.ruleSet,
    usefulGodProfile:analysis.yongshenProfile,
    roleProfile:activeRoleProfile,
    strengthProfile:{version:analysis.palaces[0]?.strength?.version||'legacy',profile:analysis.palaces[0]?.strength?.profile||'legacy',meaning:'Tinh/Môn/Can/Cung dùng mô hình sức riêng; trọng số chỉ xếp ưu tiên, không phải xác suất.'},
    structureProfile:{version:analysis.structures.version,profile:analysis.structures.profile,coverage:analysis.structures.coverage,limitations:analysis.structures.limitations},
    keyingProfile:{version:analysis.keying.version,profile:analysis.keying.profile,coverage:analysis.keying.coverage,limitations:analysis.keying.limitations},
    formationProfile:{version:analysis.formations.version,profile:analysis.formations.profile,coverage:analysis.formations.coverage,limitations:analysis.formations.limitations,directional:analysis.formations.directional},
    caseProfile,
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
