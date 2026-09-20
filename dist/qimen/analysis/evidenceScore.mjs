import {domainSemantics} from '../modes/semantics.mjs';
// Explanatory relevance is independent of adverse modifiers and is not probability.
export function scoreEvidence(bundles,context,graph) {
  const targetRoles=domainSemantics(context.domain).roles,stage=context.outcomeTarget?.stageAsked;
  const early=['opportunity','emergence','formation'].includes(stage),finance=context.domain==='finance';
  const ranked=bundles.map(b=>{
    const has=id=>b.actorIds.includes(id);
    const yongshenWeight=Math.max(0,...b.roles.map(r=>r.yongshenWeight||0));
    const questionRelevance=b.actorIds.some(id=>targetRoles.includes(id))?1:0.65;
    const actorRelevance=has('event')?1:has('self')?0.85:b.roles.some(r=>r.status==='user_supplied')?0.95:0.6;
    const goalRelevance=finance?(has('money')?1:has('event')?0.9:has('payment')&&!early?1:has('capital')&&!early?0.85:has('self')?0.45:0.6):
      has('event')?1:has(context.intent==='reply'?'quote':context.intent==='contract'?'contract':'opportunity')?0.95:0.6;
    const stageRelevance=finance?(early?(has('money')||has('event')?1:0.4):(has('payment')||has('capital')||has('self')?1:0.65)):has('event')?1:0.7;
    const structuralStrength=['vượng','tướng'].includes(b.strength.status)?1:0.6;
    const neighbours=new Set(graph.relations.filter(e=>b.relationshipIds.includes(e.id)&&!e.samePalace).map(e=>e.fromPalace===b.palace?e.toPalace:e.fromPalace));
    const corroboration=Math.min(neighbours.size,3)/3;
    const modifierImportance=Math.max(0,...b.conflicts.map(c=>c.severity==='high'?1:0.6));
    const structureImportance=Math.min(1,b.structurePriority||0);
    const conflictPriority=Number(((modifierImportance+0.5*structureImportance)*(0.5+goalRelevance+stageRelevance)).toFixed(3));
    const score=Number((questionRelevance+actorRelevance+3*goalRelevance+2*stageRelevance+0.8*yongshenWeight+0.35*structureImportance+0.4*structuralStrength+0.2*corroboration).toFixed(3));
    return {...b,relevance:{score,evidenceScore:score,questionRelevance,actorRelevance,goalRelevance,stageRelevance,yongshenWeight,structureImportance,structuralStrength,corroboration,modifierImportance,conflictPriority,
      meaning:'Ưu tiên căn cứ theo câu hỏi và giai đoạn; độ ưu tiên mâu thuẫn được xét riêng, không phải xác suất.'}};
  }).sort((a,b)=>b.relevance.score-a.relevance.score||a.palace-b.palace);
  const required=ranked.filter(b=>b.actorIds.some(id=>['self','event'].includes(id))||b.roles.some(r=>r.status==='user_supplied'||r.yongshenTier==='primary'));
  const limit=context.depth==='deep'?6:Math.min(6,Math.max(4,required.length+1));
  const chosen=new Set([...required,...ranked.filter(b=>!required.includes(b))].slice(0,limit));
  return ranked.filter(b=>chosen.has(b));
}
