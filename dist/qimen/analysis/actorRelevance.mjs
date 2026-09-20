import {normalizeQuestion} from '../ai/classifier.mjs';
import {domainSemantics} from '../modes/semantics.mjs';
// Legacy mode roles remain available internally; only these roles enter synthesis.
export function relevantActorIds(context,roles,modePlan={}) {
  if(!context)return roles.map(r=>r.id);
  const q=normalizeQuestion(context.question),finance=context.domain==='finance';
  const ids=new Set(['self','event',...(finance?['money','capital']:domainSemantics(context.domain).roles)]);
  for(const r of roles)if(r.resolverVersion==='KM-YONGSHEN-2.0'&&r.yongshenTier!=='counterpart')ids.add(r.id);
  for(const id of ['customer','competitor','decisionMaker'])ids.delete(id);
  if(!roles.find(r=>r.id==='authority')?.resolverVersion)ids.delete('authority');
  const commercial=context.domain==='business'&&(['contract','negotiation','reply'].includes(context.intent)||/\b(bao gia|giao dich)\b/.test(q));
  if(commercial)ids.add('customer');
  for(const s of context.stakeholders)if(s.status==='mentioned')ids.add(s.role);
  if(ids.has('decisionMaker')||/\b(tham quyen|phe duyet|cap tren|sep)\b/.test(q))ids.add('authority');
  if(finance&&/\b(thanh toan|cong no|chot|cam ket|thoa thuan|hop dong)\b/.test(q))ids.add('contract');
  if(finance&&['confirmation','execution','cash_realization','completion'].includes(context.outcomeTarget?.stageAsked))ids.add('payment');
  if(context.mode==='business'||context.mode==='negotiation'){
    for(const id of ['service','quote','contract'])if(!finance||commercial)ids.add(id);
  }
  if(['execution','completion','cash_realization','realization'].includes(context.outcomeTarget?.stageAsked))ids.add('execution');
  if(roles.find(r=>r.id==='movement')?.resolverVersion||/\b(chuyen|di chuyen|di xa|thay doi|chu dong)\b/.test(q))ids.add('movement');
  if(['timing','direction'].includes(context.mode))for(const id of modePlan.roleIds||[])if(!['customer','authority','competitor','decisionMaker'].includes(id))ids.add(id);
  const hasResolver=roles.some(r=>r.resolverVersion==='KM-YONGSHEN-2.0');
  for(const r of roles)if((r.id.startsWith('topic_')&&!hasResolver)||r.status==='user_supplied')ids.add(r.id);
  return roles.filter(r=>ids.has(r.id)).map(r=>r.id);
}
