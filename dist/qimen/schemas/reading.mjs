export const RESULT_KEYS=['status','topic_id','mode','questionType','summary','situation','development','bottleneck','actions','alternative','timing','comparisons','questions'];
export const STAGES=['current','next','outcome'];
export function readingSchema(_facts,context) {
  const g=context?.allInOne?.reasoning;if(!g)throw new Error('Thiếu kế hoạch luận đã kiểm chứng.');
  const str={type:'string'},arr=items=>({type:'array',items});
  const obj=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
  const choice=values=>values.length?{type:'string',enum:values}:str;
  const claims=arr(choice(g.claims.map(c=>c.id))),section={text:str,claim_ids:claims};
  const c=context.allInOne,rows=c.comparison?.ranking||c.plan.computed.ranking||[];
  return obj({status:{type:'string',enum:['reading','needs_clarification']},topic_id:choice([c.resolvedTopic]),mode:choice([c.classification.mode]),questionType:choice([c.questionContext.questionType]),
    summary:obj(section),situation:obj(section),development:arr(obj({...section,stage:choice(STAGES),condition:str})),
    bottleneck:obj({...section,resolution:str}),actions:arr(obj({recommendation_id:choice(g.recommendations.map(r=>r.id)),text:str})),
    alternative:obj({...section,id:choice([g.likelyScenario.alternative.id,''])}),timing:obj(section),comparisons:arr(obj({id:choice(rows.map(r=>r.id)),reason:str})),questions:arr(str)});
}
