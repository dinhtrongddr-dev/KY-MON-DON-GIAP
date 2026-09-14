import {domainSemantics} from '../modes/semantics.mjs';
// A ranking of explanatory relevance, deliberately NOT a score of luck or probability.
export function scoreEvidence(bundles,context,graph) {
  const targetRoles=domainSemantics(context.domain).roles;
  const ranked=bundles.map(b=>{
    const questionRelevance=b.actorIds.some(id=>targetRoles.includes(id))?1.2:0.65;
    const actorRelevance=b.actorIds.includes('event')?1.55:b.actorIds.includes('self')?1.5:1;
    const structuralStrength=['vượng','tướng'].includes(b.strength.status)?1.1:1;
    // Aliases of the same palace cannot count as independent corroboration.
    const neighbours=new Set(graph.relations.filter(e=>b.relationshipIds.includes(e.id)&&!e.samePalace).map(e=>e.fromPalace===b.palace?e.toPalace:e.fromPalace));
    const corroboration=1+Math.min(neighbours.size,3)*0.06;
    const stateModifier=b.conflicts.length?1.15:1;
    const score=Number((questionRelevance*actorRelevance*structuralStrength*corroboration*stateModifier).toFixed(3));
    return {...b,relevance:{score,questionRelevance,actorRelevance,structuralStrength,corroboration,stateModifier,meaning:'Mức ưu tiên giải thích; điều kiện cản tăng nhu cầu xem xét, không tăng xác suất tốt.'}};
  }).sort((a,b)=>b.relevance.score-a.relevance.score||a.palace-b.palace);
  const primary=ranked.filter(b=>b.actorIds.some(id=>['self','event'].includes(id)));
  return [...primary,...ranked.filter(b=>!primary.includes(b))].slice(0,context.depth==='deep'?6:4);
}
