import {buildWriterContext} from './writerContext.mjs';
import {NARRATIVE_VERSION,freezeNarrative,unique,normalizeNarrative,atom,unit,plainEngineMeaning,semanticMeaning,GENERAL_NOTE,validateNarrativeContract} from './narrativePrimitives.mjs';
import {eventClaimEvidence,comparisonEvidence,ACTOR_LABELS} from './narrativeEvidence.mjs';
import {wantsDevelopment} from './presentation.mjs';
const FACET_RULES=[
  {id:'decision',label:'Quyết định đang cân nhắc',pattern:/\b(nghi viec|co nen|quyet dinh|phan van|lua chon)\b/,roles:[],kind:'decision'},
  {id:'approval_timing',label:'Mốc được giải quyết',pattern:/\b(duyet|phe duyet|cuoi thang|giai quyet)\b/,roles:['contract','authority','decisionMaker','event'],kind:'timing_scope'},
  {id:'financial_capacity',label:'Nguồn lực trong thời gian nghỉ',pattern:/\b(kinh te|tai chinh|nguon luc|thu nhap|du tien|tien bac)\b/,roles:['money','capital'],kind:'resources'},
  {id:'career_return',label:'Khả năng quay lại công việc',pattern:/\b(tim cong viec|tim viec|quay lai nghe|quay lai cong viec|tu[t]? hau|u li)\b/,roles:['self','execution'],kind:'practical_consideration'}
];
export function buildAnswerFacets(context,deliberation=null){
  const g=context.allInOne.reasoning,q=context.question,n=normalizeNarrative(q),facets=[];
  const decision=/\b(nghi viec|co nen|quyet dinh|phan van|lua chon)\b/.test(n)||['decision','strategy'].includes(g.questionContext.questionType);
  if(decision)for(const rule of FACET_RULES){
    const match=rule.pattern.exec(n);if(!match)continue;
    const selected=rule.roles.length?g.claims.filter(c=>c.status!=='corroboration_only'&&c.actorIds.some(id=>rule.roles.includes(id))).map(c=>c.id):g.primaryJudgment.claimIds;
    const leavePlan=/\b(nghi viec|nghi o nha|tam nghi)\b/.test(n);
    const label=rule.id==='financial_capacity'&&!leavePlan?'Nguồn lực tài chính':rule.id==='career_return'&&!leavePlan?'Khả năng chuyển hoặc tìm việc':rule.label;
    facets.push({id:rule.id,label,kind:rule.kind,source:'explicit',sourceQuote:q.slice(match.index,match.index+match[0].length),claimIds:selected.length?selected:g.primaryJudgment.claimIds});
  }
  // Semantic planner suggestions must carry an exact question quote. A generated
  // label/why_relevant is not evidence and is never copied into the contract.
  for(const item of deliberation?.semantic_frame?.related_considerations||[]){
    const quote=item.source_quote;
    if(item.source!=='explicit'||typeof quote!=='string'||quote.length<6||!q.includes(quote))continue;
    if(facets.some(f=>normalizeNarrative(quote).includes(normalizeNarrative(f.sourceQuote))))continue;
    const ids=(item.claim_ids||[]).filter(id=>g.claims.some(c=>c.id===id&&c.status!=='corroboration_only'));
    if(!ids.length)continue;
    const label=/\bo nha\b/.test(normalizeNarrative(quote))?'Duy trì việc ở nhà lâu dài':quote.slice(0,120);
    // Different exact quotations may describe the same consideration. Merge
    // their supporting claims rather than make the writer answer it twice.
    const duplicate=facets.find(f=>f.label===label);
    if(duplicate){duplicate.claimIds=unique([...duplicate.claimIds,...ids]);continue;}
    facets.push({id:'consideration_'+facets.length,label,kind:'practical_consideration',source:'explicit',sourceQuote:quote,claimIds:ids});
    if(facets.length>=6)break;
  }
  return facets;
}
export function validateDeliberation(plan,context){
  const g=context.allInOne.reasoning,ids=new Set(g.claims.map(c=>c.id));
  if(!plan||plan.answer_class!==g.primaryJudgment.answerClass)throw new Error('PLANNER_VERDICT_CHANGED');
  for(const key of ['decisive_claim_ids','counter_claim_ids'])
    if(!Array.isArray(plan[key])||plan[key].some(id=>!ids.has(id)))throw new Error('PLANNER_UNKNOWN_CLAIM');
  if(plan.decisive_claim_ids.some(id=>g.claims.find(c=>c.id===id).status==='corroboration_only'))throw new Error('CORROBORATOR_OVERRIDE');
  if(plan.bottleneck_claim_id&&!ids.has(plan.bottleneck_claim_id))throw new Error('PLANNER_UNKNOWN_BOTTLENECK');
  for(const s of plan.stage_logic||[])if(s.claim_ids.some(id=>!ids.has(id)))throw new Error('PLANNER_UNKNOWN_STAGE_CLAIM');
  return plan;
}
const OPENINGS={
  conditional_positive:'Hướng này có điểm thuận để theo đuổi, nhưng chỉ nên chốt khi các điều kiện cần thiết đã sẵn sàng.',
  positive:'Hướng này nhận được sự hỗ trợ rõ hơn từ bàn hiện tại; vẫn cần gắn quyết định với điều kiện thực tế.',
  conditional:'Bạn có thể tiếp tục chuẩn bị cho hướng này, nhưng chưa nên chốt khi những điểm đang cản vẫn còn nguyên.',
  uncertain:'Hiện chưa đủ rõ để nghiêng hẳn về một phương án; điểm cần làm rõ nằm ở những điều kiện dưới đây.',
  negative:'Hướng này đang gặp nhiều trở ngại; nên xem lại cách làm trước khi tăng cam kết.',
  conditional_negative:'Trở ngại đang lấn át phần thuận; cần tháo đúng chỗ vướng trước khi tiến thêm.',
  unclear:'Hiện chưa đủ rõ để chốt một hướng đi.'
};
function claimAtoms(claim,writer){
  const out=[],ids=[claim.id],i=claim.interpretation||{};
  const subject=unique(claim.actorIds.map(id=>ACTOR_LABELS[id]||writer.readingGraph.nodes.find(n=>n.actorId===id)?.role).filter(Boolean)).join(' và ').toLowerCase();
  if(i.opening||i.means)out.push(atom(claim.id+'_meaning',
    (i.opening?'Với '+(subject||'việc đang hỏi')+', điểm đáng chú ý nằm ở '+i.opening+'. ':'')+
    (i.means?'Hướng xử lý là '+i.means+'. ':'')+
    (i.counterpartCondition?'Việc cần chú ý thêm là '+i.counterpartCondition+'.':''),ids,{actorIds:claim.actorIds}));
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
  const conclusion=g.primaryJudgment.answerClass,opening=OPENINGS[conclusion]||plainEngineMeaning(g.primaryJudgment.main);
  const allAtoms=g.claims.flatMap(cl=>claimAtoms(cl,writer));
  const forIds=ids=>allAtoms.filter(a=>a.claimIds.some(id=>ids.includes(id)));
  const units=[unit('answer','Kết luận chính',primaryIds,[
    atom('answer_verdict',opening,primaryIds,{required:true}),
    atom('answer_condition',g.primaryJudgment.condition,primaryIds,{required:true,kind:'constraint'})
  ],{conclusion,stage:g.primaryJudgment.stageAsked})];
  for(const f of facets){
    const points=forIds(f.claimIds).map(a=>({...a,id:f.id+'_'+a.id}));
    if(f.kind==='timing_scope')points.unshift(atom(f.id+'_scope',
      g.timing.allowedPredictions.length
        ?'Mốc bạn mong muốn cần được phân biệt với các thời điểm đã tính; chưa có dữ kiện xác nhận quyết định của nơi giải quyết.'
        :'Mốc được giải quyết bạn nêu hiện là mục tiêu sắp xếp, chưa phải ngày được bàn xác nhận. '+(/\b(?:viet|nop|gui) don\b/.test(normalizeNarrative(context.question))?'Việc gửi đơn và ngày được chấp thuận là hai chuyện riêng.':'Được đưa vào xử lý và được chấp thuận vẫn là hai bước khác nhau.'),
      f.claimIds,{required:true,kind:'scope'}));
    if(f.kind==='resources')points.unshift(atom(f.id+'_budget',
      'Để biết nguồn lực có đủ cho phương án đang tính hay không, hãy đặt những khoản thu có thể dựa vào cạnh các chi phí phải gánh. Những điểm hỗ trợ trong bàn chưa cho biết số dư thực tế.',
      f.claimIds,{required:true,kind:'practical_consideration'}));
    if(f.kind==='practical_consideration')points.unshift(atom(f.id+'_preparation',
      f.id==='career_return'?(/\b(nghi viec|nghi o nha|tam nghi)\b/.test(normalizeNarrative(context.question))?'Việc nghỉ một thời gian chưa cho phép kết luận bạn sẽ tụt hậu hay mất đường nghề. Giữ liên hệ công việc và dành một nhịp đều cho việc học là cách chuẩn bị cho lúc quay lại.':'Khi tìm hoặc chuyển việc, hãy gắn việc học và chuẩn bị hồ sơ với yêu cầu của công việc đang nhắm tới. Duy trì liên hệ nghề nghiệp là một cách chủ động mở thêm lựa chọn.'):/\bo nha\b/.test(normalizeNarrative(f.sourceQuote))?'Muốn duy trì việc ở nhà lâu dài, bạn cần thu xếp nhịp sinh hoạt và trách nhiệm chăm sóc sao cho có thể theo được đều đặn. Được giải quyết nghỉ mới là bước đầu; sức bền của phương án còn phụ thuộc cách tổ chức sau đó.':'Khía cạnh này cần được thu xếp trước khi chốt quyết định. Hãy xác định việc nào mình có thể chủ động làm và việc nào còn phụ thuộc sự phối hợp.',
      f.claimIds,{required:true,kind:'practical_consideration'}));
    if(f.kind==='decision')points.unshift(atom(f.id+'_decision',
      'Tách mong muốn thực hiện khỏi mức sẵn sàng để thực hiện. Một phương án có ý nghĩa với bạn vẫn cần nguồn lực, sự thu xếp và điều kiện giải quyết đi cùng.',
      f.claimIds,{required:true}));
    units.push(unit(f.id,f.label,f.claimIds,points,{conclusion:f.kind==='timing_scope'?'scope_only':f.kind==='resources'?'budget_required':f.kind==='practical_consideration'?'preparation_dependent':conclusion,source:f.source,sourceQuote:f.sourceQuote}));
  }
  if(!facets.length){
    const ids=unique(g.claims.filter(cl=>cl.status!=='corroboration_only').map(cl=>cl.id));
    units.push(unit('situation','Điều đang tác động',ids,forIds(ids),{conclusion}));
  }
  const conflict=g.likelyScenario.mainConflict;
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
  for(const r of g.recommendations.slice(0,facets.length?2:3)){
    if(units.some(u=>u.atoms.some(a=>a.required&&a.meaning===plainEngineMeaning(r.action))))continue;
    units.push(unit(r.id,'Điều nên làm',[r.claimId],[
      atom(r.id+'_action',r.action,[r.claimId],{kind:'recommendation',required:true}),
      atom(r.id+'_effect',r.expectedEffect,[r.claimId],{kind:'recommendation'})
    ],{certainty:'recommendation',conclusion:'recommendation',recommendationId:r.id}));
  }
  if(g.timing.allowedPredictions.length)units.push(unit('timing','Thời điểm đáng chú ý',primaryIds,
    (g.timing.candidates||[]).map((t,i)=>atom('timing_'+i,'Mốc '+t.display+' là thời điểm đáng theo dõi sự thay đổi, chưa xác nhận kết quả sẽ xảy ra vào ngày đó.',primaryIds,{kind:'timing_window',required:true})),
    {certainty:'scope',conclusion:'window_not_event'}));
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
