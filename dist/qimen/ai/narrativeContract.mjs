import {buildWriterContext} from './writerContext.mjs';
import {NARRATIVE_VERSION,freezeNarrative,unique,normalizeNarrative,atom,unit,plainEngineMeaning,semanticMeaning,GENERAL_NOTE,validateNarrativeContract} from './narrativePrimitives.mjs';
import {eventClaimEvidence,comparisonEvidence,ACTOR_LABELS} from './narrativeEvidence.mjs';
import {wantsDevelopment} from './presentation.mjs';
const FACET_RULES=[
  {id:'decision',label:'Quyết định đang cân nhắc',pattern:/\b(nghi viec|co nen|nen|quyet dinh|phan van|lua chon|hay tu choi)\b/,roles:[],kind:'decision'},
  {id:'approval_timing',label:'Mốc được giải quyết',pattern:/\b(duyet|phe duyet|cuoi thang|giai quyet)\b/,roles:['contract','authority','decisionMaker','event'],kind:'timing_scope'},
  {id:'financial_capacity',label:'Nguồn lực trong thời gian nghỉ',pattern:/\b(kinh te|tai chinh|nguon luc|thu nhap|du tien|tien bac|bien loi nhuan|loi nhuan|chi phi|dong tien)\b/,roles:['money','capital'],kind:'resources'},
  {id:'career_return',label:'Khả năng quay lại công việc',pattern:/\b(tim cong viec|tim viec|quay lai nghe|quay lai cong viec|tu[t]? hau|u li)\b/,roles:['self','execution'],kind:'practical_consideration'}
];
function considerationMergeTarget(label,why,facets){
  const byLabel=[
    ['approval_timing',/\b(duyet|phe duyet|giai quyet|don nghi|thu tuc)\b/],
    ['financial_capacity',/\b(tai chinh|kinh te|nguon luc|thu nhap|chi phi|dong tien|loi nhuan|bien loi nhuan|bao gia|gia|von)\b/],
    ['career_return',/\b(tim lai cong viec|tim cong viec|tim viec|quay lai|nghe nghiep|ky nang|nang luc|tut hau|u li)\b/],
    ['decision',/\b(cham con|o nha|mot nam|dai han|do ben|nhan|tu choi|lua chon|quyet dinh|doi tuong|cam ket|hop dong|thoi han|trong thang|thang nay|khung)\b/]
  ];
  for(const [id,pattern] of byLabel)if(pattern.test(label)){
    const target=facets.find(f=>f.id===id);if(target)return target;
  }
  const combined=label+' '+why;
  for(const [id,pattern] of byLabel.slice(0,3))if(pattern.test(combined)){
    const target=facets.find(f=>f.id===id);if(target)return target;
  }
  return null;
}
export function buildAnswerFacets(context,deliberation=null){
  const g=context.allInOne.reasoning,q=context.question,n=normalizeNarrative(q),facets=[];
  const decision=/\b(nghi viec|co nen|nen|quyet dinh|phan van|lua chon|hay tu choi)\b/.test(n)||['decision','strategy'].includes(g.questionContext.questionType);
  if(decision)for(const rule of FACET_RULES){
    const match=rule.pattern.exec(n);if(!match)continue;
    const selected=rule.roles.length?g.claims.filter(c=>c.status!=='corroboration_only'&&c.actorIds.some(id=>rule.roles.includes(id))).map(c=>c.id):g.primaryJudgment.claimIds;
    const leavePlan=/\b(nghi viec|nghi o nha|tam nghi)\b/.test(n),margin=/\b(bien loi nhuan|loi nhuan|chi phi|dong tien)\b/.test(n);
    const label=rule.id==='financial_capacity'?(margin?'Biên lợi nhuận và nguồn lực':leavePlan?rule.label:'Nguồn lực tài chính'):rule.id==='career_return'&&!leavePlan?'Khả năng chuyển hoặc tìm việc':rule.label;
    facets.push({id:rule.id,label,kind:rule.kind,source:'explicit',sourceQuote:q.slice(match.index,match.index+match[0].length),claimIds:selected.length?selected:g.primaryJudgment.claimIds});
  }
  for(const item of deliberation?.semantic_frame?.related_considerations||[]){
    const source=item.source,quote=item.source_quote;
    if(!['explicit','entailed','check_only'].includes(source))continue;
    if(source==='explicit'&&(typeof quote!=='string'||quote.length<6||!q.includes(quote)))continue;
    if(source!=='explicit'&&quote)continue;
    const ids=(item.claim_ids||[]).filter(id=>g.claims.some(c=>c.id===id&&c.status!=='corroboration_only'));
    if(!ids.length)continue;
    const generatedLabel=String(item.label||'').replace(/[\r\n]+/g,' ').trim().slice(0,90);
    const whyRelevant=String(item.why_relevant||'').replace(/[\r\n]+/g,' ').trim().slice(0,240);
    if(source!=='explicit'&&(!generatedLabel||!whyRelevant))continue;
    const label=source==='explicit'?(/\bo nha\b/.test(normalizeNarrative(quote))?'Duy trì việc ở nhà lâu dài':quote.slice(0,120)):generatedLabel;
    const normalizedLabel=normalizeNarrative(label),normalizedWhy=normalizeNarrative(whyRelevant);
    const mergeTarget=considerationMergeTarget(normalizedLabel,normalizedWhy,facets);
    if(mergeTarget){
      mergeTarget.claimIds=unique([...mergeTarget.claimIds,...ids]);
      mergeTarget.plannerNotes=unique([...(mergeTarget.plannerNotes||[]),[generatedLabel||label,whyRelevant].filter(Boolean).join(': ')]);
      continue;
    }
    const duplicate=facets.find(f=>normalizeNarrative(f.label)===normalizeNarrative(label));
    if(duplicate){
      duplicate.claimIds=unique([...duplicate.claimIds,...ids]);
      duplicate.plannerNotes=unique([...(duplicate.plannerNotes||[]),whyRelevant]);
      continue;
    }
    const extraCount=facets.filter(f=>f.id.startsWith('consideration_')).length;
    if(extraCount>=2)continue;
    facets.push({id:'consideration_'+facets.length,label,kind:source==='explicit'?'practical_consideration':'related_consideration',source,sourceQuote:source==='explicit'?quote:'',whyRelevant,claimIds:ids});
  }
  return facets;
}
export function validateDeliberation(plan,context){
  const g=context.allInOne.reasoning,ids=new Set(g.claims.map(c=>c.id)),coreIds=new Set(g.claims.filter(c=>c.status!=='corroboration_only').map(c=>c.id));
  if(!plan||plan.answer_class!==g.primaryJudgment.answerClass)throw new Error('PLANNER_VERDICT_CHANGED');
  for(const key of ['decisive_claim_ids','counter_claim_ids'])
    if(!Array.isArray(plan[key])||plan[key].some(id=>!ids.has(id)))throw new Error('PLANNER_UNKNOWN_CLAIM');
  if(plan.decisive_claim_ids.some(id=>!coreIds.has(id)))throw new Error('CORROBORATOR_OVERRIDE');
  if(plan.bottleneck_claim_id&&!ids.has(plan.bottleneck_claim_id))throw new Error('PLANNER_UNKNOWN_BOTTLENECK');
  for(const s of plan.stage_logic||[])if(!Array.isArray(s.claim_ids)||s.claim_ids.some(id=>!ids.has(id)))throw new Error('PLANNER_UNKNOWN_STAGE_CLAIM');
  for(const item of plan.semantic_frame?.related_considerations||[]){
    if(!['explicit','entailed','check_only'].includes(item.source)||!Array.isArray(item.claim_ids)||item.claim_ids.some(id=>!coreIds.has(id)))throw new Error('PLANNER_INVALID_CONSIDERATION');
    if(item.source==='explicit'&&(!item.source_quote||!context.question.includes(item.source_quote)))throw new Error('PLANNER_QUOTE_NOT_IN_QUESTION');
    if(item.source!=='explicit'&&item.source_quote)throw new Error('PLANNER_INVENTED_QUOTE');
  }
  const recommendationIds=new Set(g.recommendations.map(r=>r.id));
  if((plan.recommendation_ids||[]).some(id=>id&&!recommendationIds.has(id)))throw new Error('PLANNER_UNKNOWN_RECOMMENDATION');
  return plan;
}
function decisionPhrase(question){
  const clean=String(question||'').replace(/\s+/g,' ').trim();
  const match=clean.match(/(?:^|[,;])\s*(?:(?:tôi|mình|chúng tôi)\s+)?(?:có\s+)?nên\s+(.+?)(?:\s+vì\s+|[?.!]|$)/i)
    ||normalizeNarrative(clean).match(/(?:^|[,;])\s*(?:(?:toi|minh|chung toi)\s+)?(?:co\s+)?nen\s+(.+?)(?:\s+vi\s+|[?.!]|$)/i);
  return match?match[1].trim().replace(/\s+(?:không|khong)$/i,'').slice(0,140):'';
}
function contextualOpening(context,g,facets){
  const main=plainEngineMeaning(g.primaryJudgment.main),n=normalizeNarrative(context.question),phrase=decisionPhrase(context.question);
  const decision=!!phrase||(!['timing','direction'].includes(context.allInOne.classification.mode)&&/\b(co nen|nen|lua chon|quyet dinh|hay tu choi)\b/.test(n));
  if(decision){
    const subject=phrase?'Với việc '+phrase+', ':'Với quyết định đang cân nhắc, ';
    const lead={
      positive:'bàn nghiêng về hướng có thể tiến hành, nhưng quyết định vẫn cần gắn với điều kiện thực tế.',
      conditional_positive:'bàn nghiêng về tiếp tục hơn là dừng lại, với điều kiện phải xử lý được điểm đang cản.',
      conditional:'bàn cho thấy việc này có cửa tiến hành nhưng chưa thuận trọn; chỉ nên chốt sau khi xử lý được điều kiện then chốt.',
      uncertain:'hiện chưa đủ rõ để nghiêng hẳn về một phương án.',
      unresolved:/\b(bien loi nhuan|loi nhuan)\b/.test(n)?'chưa nên nhận dự án theo điều kiện hiện tại; chỉ nhận khi biên thực tế đạt ngưỡng chấp nhận.':/\bhop dong thue mat bang\b/.test(n)?'chưa nên ký ngay; chỉ ký khi điều khoản, hồ sơ và sức chịu tài chính đã đạt ngưỡng của bạn.':'chưa nên chốt theo phương án hiện tại; chỉ tiến khi ngưỡng quyết định đã đủ rõ.',
      needs_clarification:'cần làm rõ thêm dữ kiện trước khi chọn phương án.',
      negative:'bàn nghiêng về chưa nên tiến hành theo cách hiện tại.',
      conditional_negative:'phần bất lợi đang lấn át; chỉ nên xem lại quyết định sau khi tháo được điểm vướng chính.'
    }[g.primaryJudgment.answerClass];
    if(lead)return subject+lead;
  }
  const focus=facets.find(f=>f.source==='explicit')?.label?.toLowerCase();
  if(!focus||main.toLowerCase().startsWith(focus))return main;
  if(['decision','strategy'].includes(g.questionContext.questionType))return 'Với '+focus+', '+main.charAt(0).toLowerCase()+main.slice(1);
  if(g.questionContext.questionType==='timing')return 'Về thời điểm đang hỏi, '+main.charAt(0).toLowerCase()+main.slice(1);
  return main;
}
function claimAtoms(claim,writer){
  const out=[],ids=[claim.id],i=claim.interpretation||{};
  const subject=unique(claim.actorIds.map(id=>ACTOR_LABELS[id]||writer.readingGraph.nodes.find(n=>n.actorId===id)?.role).filter(Boolean)).join(' và ').toLowerCase();
  if(i.opening||i.means)out.push(atom(claim.id+'_meaning',
    (i.opening?'Với '+(subject||'việc đang hỏi')+', điểm đáng chú ý nằm ở '+i.opening+'. ':'')+
    (i.means?'Hướng xử lý là '+i.means+'. ':'')+
    (i.counterpartCondition?'Việc cần chú ý thêm là '+i.counterpartCondition+'.':''),ids,{actorIds:claim.actorIds}));
  const palace=Number(/^claim_(\d+)$/.exec(claim.id)?.[1]||0),semantic=writer.semanticMatrix?.palaces?.find(p=>p.palace===palace);
  for(const [key,role] of [['action',semantic?.actionChannel],['hidden',semantic?.hiddenFactor]]){
    const meaning=semanticMeaning(role);if(meaning)out.push(atom(claim.id+'_domain_'+key,meaning,ids,{kind:'domain_translation'}));
  }
  const bundle=writer.readingGraph.evidenceBundles.find(b=>b.id===claim.bundleId);
  if(bundle){
    for(const [index,x] of (bundle.stemResponses||[]).entries())if(x.actorIds?.some(id=>claim.actorIds.includes(id)))
      out.push(atom(claim.id+'_condition_'+index,x.plainMeaning,ids,{kind:'constraint'}));
    for(const [index,x] of (claim.conflicts||[]).entries())
      out.push(atom(claim.id+'_limit_'+index,x.text||x.blocker||x.resolution,ids,{kind:'constraint'}));
  }
  return out;
}
export function buildQuestionNarrativeContract(context,{deliberation=null}={}){
  const writer=buildWriterContext(context),c=context.allInOne,g=c.reasoning;
  if(deliberation)validateDeliberation(deliberation,context);
  const claims=g.claims.map(cl=>({id:cl.id,evidenceIds:cl.evidenceIds,ruleIds:cl.ruleIds,
    actorIds:cl.actorIds,status:cl.status,certainty:'conditional',technicalEvidence:eventClaimEvidence(cl,context)}));
  const facets=buildAnswerFacets(context,deliberation),primaryIds=g.primaryJudgment.claimIds;
  const conclusion=g.primaryJudgment.answerClass,opening=contextualOpening(context,g,facets);
  const allAtoms=g.claims.flatMap(cl=>claimAtoms(cl,writer));
  const forIds=ids=>allAtoms.filter(a=>a.claimIds.some(id=>ids.includes(id)));
  const orderedForIds=ids=>{const rows=[],seen=new Set();for(const id of ids)for(const a of allAtoms)if(a.claimIds.includes(id)&&!seen.has(a.id)){seen.add(a.id);rows.push(a);}return rows;};
  const usedGrounding=new Set(),groundingRoles={timing_scope:['contract','authority','event'],resources:['money','capital','execution','quote'],practical_consideration:['self','execution'],decision:['event','contract','opportunity','service']};
  const requireGrounding=(points,kind)=>{
    const candidates=points.filter(a=>a.kind==='interpretation'&&a.actorIds?.length&&!usedGrounding.has(a.meaning));if(!candidates.length)return;
    const roles=groundingRoles[kind]||[],selected=candidates.find(a=>a.actorIds.some(id=>roles.includes(id)))||candidates[0];
    selected.required=true;usedGrounding.add(selected.meaning);
  };
  const stageRows=deliberation?.stage_logic||[],answerPlan=stageRows.find(row=>row.slot==='answer'),alternativePlan=stageRows.find(row=>row.slot==='alternative');
  const answerPlanIds=(answerPlan?.claim_ids||[]).filter(id=>primaryIds.includes(id)),alternativePlanIds=(alternativePlan?.claim_ids||[]).filter(id=>primaryIds.includes(id));
  const answerAtoms=[
    atom('answer_verdict',opening,primaryIds,{required:true}),
    ...(answerPlan?.note&&answerPlanIds.length?[atom('answer_planner',answerPlan.note,answerPlanIds,{kind:'planner_synthesis'})]:[]),
    ...(alternativePlan?.note&&alternativePlanIds.length?[atom('answer_alternative',alternativePlan.note,alternativePlanIds,{required:true,kind:'planner_synthesis'})]:[]),
    atom('answer_condition',g.primaryJudgment.condition,primaryIds,{required:!answerPlan,kind:'constraint'})
  ];
  const units=[unit('answer','Kết luận chính',primaryIds,answerAtoms,{conclusion,stage:g.primaryJudgment.stageAsked})];
  for(const f of facets){
    const points=orderedForIds(f.claimIds).map(a=>({...a,id:f.id+'_'+a.id}));
    requireGrounding(points,f.kind);
    if(f.kind==='timing_scope')points.unshift(atom(f.id+'_scope',
      g.timing.allowedPredictions.length
        ?'Mốc bạn mong muốn cần được phân biệt với các thời điểm đã tính; chưa có dữ kiện xác nhận quyết định của nơi giải quyết.'
        :'Mốc được giải quyết bạn nêu hiện là mục tiêu sắp xếp, chưa phải ngày được bàn xác nhận. '+(/\b(?:viet|nop|gui) don\b/.test(normalizeNarrative(context.question))?'Việc gửi đơn và ngày được chấp thuận là hai chuyện riêng.':'Được đưa vào xử lý và được chấp thuận vẫn là hai bước khác nhau.'),
      f.claimIds,{required:true,kind:'scope'}));
    if(f.kind==='resources')points.unshift(atom(f.id+'_budget',
      /\b(bien loi nhuan|loi nhuan|chi phi|dong tien)\b/.test(normalizeNarrative(context.question))
        ?'Biên lợi nhuận cần được tính sau toàn bộ chi phí, phần việc phát sinh và nguồn lực phải bỏ ra. Tín hiệu thuận trong bàn không thay thế con số lợi nhuận thực tế.'
        :'Để biết nguồn lực có đủ cho phương án đang tính hay không, hãy đặt những khoản thu có thể dựa vào cạnh các chi phí phải gánh. Những điểm hỗ trợ trong bàn chưa cho biết số dư thực tế.',
      f.claimIds,{required:true,kind:'practical_consideration'}));
    if(f.kind==='practical_consideration')points.unshift(atom(f.id+'_preparation',
      f.id==='career_return'?(/\b(nghi viec|nghi o nha|tam nghi)\b/.test(normalizeNarrative(context.question))?'Việc nghỉ một thời gian chưa cho phép kết luận bạn sẽ tụt hậu hay mất đường nghề. Giữ liên hệ công việc và dành một nhịp đều cho việc học là cách chuẩn bị cho lúc quay lại.':'Khi tìm hoặc chuyển việc, hãy gắn việc học và chuẩn bị hồ sơ với yêu cầu của công việc đang nhắm tới. Duy trì liên hệ nghề nghiệp là một cách chủ động mở thêm lựa chọn.'):/\bo nha\b/.test(normalizeNarrative(f.sourceQuote))?'Muốn duy trì việc ở nhà lâu dài, bạn cần thu xếp nhịp sinh hoạt và trách nhiệm chăm sóc sao cho có thể theo được đều đặn. Được giải quyết nghỉ mới là bước đầu; sức bền của phương án còn phụ thuộc cách tổ chức sau đó.':'Đây là điểm cần kiểm tra riêng trước khi chốt. Hãy xác định tiêu chí thực tế và dấu hiệu nào sẽ khiến bạn giữ hoặc đổi quyết định.',
      f.claimIds,{required:true,kind:'practical_consideration'}));
    const plannerNoteLimit=f.kind==='resources'?2:1;
    for(const [index,note] of (f.plannerNotes||[]).slice(0,plannerNoteLimit).entries())points.unshift(atom(f.id+'_planner_'+index,
      note.replace(/[.!?]+$/,'')+'.',f.claimIds,{required:true,kind:'planner_synthesis'}));
    if(f.kind==='related_consideration')points.unshift(atom(f.id+'_frame',
      f.source==='check_only'
        ?'Trước khi chốt, hãy kiểm tra '+f.label.toLowerCase()+' vì '+f.whyRelevant.replace(/[.!?]+$/,'').replace(/^./,c=>c.toLowerCase())+'. Đây là dữ liệu còn cần xác minh.'
        :'Trong quyết định này, '+f.label.toLowerCase()+' liên quan trực tiếp vì '+f.whyRelevant.replace(/[.!?]+$/,'').replace(/^./,c=>c.toLowerCase())+'. Chỉ dùng khía cạnh này để so sánh phương án, không coi là kết quả đã xảy ra.',
      f.claimIds,{required:true,kind:'practical_consideration'}));
    if(f.kind==='decision'){
      const decisionPlans=stageRows.filter(row=>['action','next'].includes(row.slot)&&row.note).map(row=>({...row,claim_ids:row.claim_ids.filter(id=>f.claimIds.includes(id))})).filter(row=>row.claim_ids.length);
      points.unshift(atom(f.id+'_decision','Đặt các phương án lên cùng tiêu chí về lợi ích, nguồn lực phải bỏ ra và điều kiện có thể kiểm soát. Chỉ chốt khi phương án được chọn đáp ứng giới hạn thực tế của bạn.',f.claimIds,{required:!decisionPlans.length}));
      for(const row of decisionPlans.reverse())points.unshift(atom(f.id+'_plan_'+row.slot,row.note,row.claim_ids,{required:true,kind:'planner_synthesis'}));
    }
    const facetConclusion=f.kind==='timing_scope'?'scope_only':f.kind==='resources'?'budget_required':f.kind==='practical_consideration'?'preparation_dependent':f.kind==='related_consideration'?'check_only':conclusion;
    units.push(unit(f.id,f.label,f.claimIds,points,{conclusion:facetConclusion,source:f.source,sourceQuote:f.sourceQuote}));
  }
  if(!facets.length){
    const planned=unique([...(deliberation?.decisive_claim_ids||[]),...(deliberation?.counter_claim_ids||[])]);
    const ids=planned.length?planned:unique(g.claims.filter(cl=>cl.status!=='corroboration_only').map(cl=>cl.id));
    units.push(unit('situation','Điều đang tác động',ids,forIds(ids),{conclusion}));
  }
  const plannedBottleneck=deliberation?.bottleneck_claim_id&&g.claims.find(cl=>cl.id===deliberation.bottleneck_claim_id);
  const plannedConflict=plannedBottleneck?.conflicts?.[0],conflict=plannedConflict?{...plannedConflict,claimId:plannedBottleneck.id}:g.likelyScenario.mainConflict;
  if(conflict&&plainEngineMeaning(conflict.text||conflict.resolution)!==units[0].atoms.find(a=>a.id==='answer_condition')?.meaning)units.push(unit('bottleneck','Điểm cần chuẩn bị trước',[conflict.claimId],[
    atom('bottleneck_constraint',conflict.text||conflict.resolution,[conflict.claimId],{required:true,kind:'constraint'}),
    atom('bottleneck_response',conflict.resolution,[conflict.claimId],{kind:'recommendation'})
  ],{conclusion:'condition_to_resolve'}));
  const asksDevelopment=!['timing','direction'].includes(c.classification.mode)&&wantsDevelopment(context.question);
  if(asksDevelopment)for(const s of g.likelyScenario.stages){
    units.push(unit('development_'+s.stage,{current:'Hiện tại',next:'Bước tiếp theo',outcome:'Điều kiện để có kết quả'}[s.stage],s.claimIds,
      [atom('stage_'+s.stage,s.insight||s.condition||g.primaryJudgment.distinction,s.claimIds,{required:true})],
      {conclusion:s.stage,stage:s.stage,interactionIds:s.relationshipIds}));
  }
  const plannedRecommendationIds=(deliberation?.recommendation_ids||[]).filter(Boolean),plannedRecommendations=plannedRecommendationIds.map(id=>g.recommendations.find(r=>r.id===id)).filter(Boolean);
  const recommendations=facets.length?[]:unique([...plannedRecommendations,...g.recommendations]).slice(0,3);
  for(const r of recommendations){
    if(units.some(u=>u.atoms.some(a=>a.required&&a.meaning===plainEngineMeaning(r.action))))continue;
    units.push(unit(r.id,'Điều nên làm',[r.claimId],[
      atom(r.id+'_action',r.action,[r.claimId],{kind:'recommendation',required:true}),
      atom(r.id+'_effect',r.expectedEffect,[r.claimId],{kind:'recommendation'})
    ],{certainty:'recommendation',conclusion:'recommendation',recommendationId:r.id}));
  }
  if(g.timing.allowedPredictions.length){
    const displays=(g.timing.candidates||[]).map(t=>t.display),dateList=displays.length>1?displays.slice(0,-1).join(', ')+' và '+displays.at(-1):displays[0];
    const pace={slow:'thiên về chậm',fast:'có xu hướng nhanh',mixed:'có thể đổi nhịp'}[g.timing.pace?.tendency]||'cần được theo dõi';
    units.push(unit('timing','Thời điểm đáng chú ý',primaryIds,[atom('timing_window_summary',
      'Nhịp của việc này '+pace+'. Trong phạm vi đang hỏi, '+dateList+' là '+(displays.length>1?'các mốc':'mốc')+' phù hợp để chủ động rà lại tiến triển và điều chỉnh cách xử lý, không phải ngày bảo đảm kết quả.',primaryIds,{kind:'timing_window',required:true})],
      {certainty:'scope',conclusion:'window_not_event'}));
  }
  for(const row of writer.comparisons||[])units.push(unit('comparison_'+row.id,row.label,primaryIds,
    [atom('comparison_'+row.id,row.label+' xếp thứ '+row.rank+' trong các phương án đã so sánh; đây là mức phù hợp tương đối với việc đang hỏi.',primaryIds,{kind:'comparison',required:true}),
      ...row.blockers.length?[atom('comparison_'+row.id+'_limits','Phương án này vẫn có điều đang cản việc thực hiện; thứ hạng không có nghĩa mọi điều kiện đã sẵn sàng.',primaryIds,{kind:'constraint',required:true})]:[],
      ...(row.formationMarkers||[]).map((x,i)=>atom('comparison_'+row.id+'_approach_'+i,x.plainMeaning,primaryIds,{kind:'practical_consideration'}))],
    {certainty:'scope',conclusion:'relative_fit',comparisonId:row.id,rank:row.rank,technicalEvidence:comparisonEvidence(row,context)}));
  const spirit=c.spiritActivation;
  if(spirit?.requested){
    const r=spirit.recommended,meaning=r
      ?'Thực hành với '+r.spirit.name+': đặt hướng '+r.backDirection+' sau lưng, mặt nhìn về '+r.faceDirection+'. Mức phù hợp: '+r.activationLevel+'. Đây là thực hành tượng trưng để tập trung và định hướng hành động.'
      :'Hiện chưa có phương vị đủ điều kiện để ưu tiên.';
    units.push(unit('spirit_practice','Hướng thực hành',primaryIds,[atom('spirit_fixed',meaning,primaryIds,{kind:'instruction',required:true})],{certainty:'scope',conclusion:'symbolic_practice'}));
  }
  const contract={
    version:NARRATIVE_VERSION,kind:'question',identity:{topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:g.questionContext.questionType},
    question:context.question,claims,units,facets,showDevelopment:asksDevelopment,
    primaryConclusion:{conclusion,certainty:'conditional',stage:g.primaryJudgment.stageAsked,meaning:opening,claimIds:primaryIds},
    userFacts:g.questionContext.userStatements||[],allowedImplications:['Nối những ý đã được cấp vào đúng hoàn cảnh câu hỏi.','Các việc chuẩn bị là khuyến nghị, không phải sự kiện đã xảy ra.'],
    forbiddenImplications:[...g.primaryJudgment.forbiddenClaims,'Không đổi thứ hạng, đại diện, hướng thực hành hoặc ngày từ dữ liệu đã tính.','Không tự nâng giai đoạn; có thuận lợi không có nghĩa đã đạt kết quả.'],
    note:GENERAL_NOTE
  };
  validateNarrativeContract(contract);return freezeNarrative(contract);
}
