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
  const primary=ranked.filter(b=>b.actorIds.some(id=>['self','event'].includes(id))||b.roles.some(r=>r.status==='user_supplied'));
  // At most five distinct required palaces: self, event and three supplied actors.
  // Leave a place for the goal mechanism without dropping a known counterpart.
  const limit=context.depth==='deep'?6:Math.min(6,Math.max(4,primary.length+1));
  return [...primary,...ranked.filter(b=>!primary.includes(b))].slice(0,limit);
}
