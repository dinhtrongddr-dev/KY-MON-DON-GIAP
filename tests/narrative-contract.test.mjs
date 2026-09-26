import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareReading,validateReading,buildReadingRequest} from '../local/reading.mjs';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {buildQuestionNarrativeContract,validateDeliberation} from '../dist/qimen/ai/narrativeContract.mjs';
import {buildMenhNarrativeFromContext} from '../dist/qimen/menh/ai/narrative-contract.mjs';
import {surfacePayload,validateNarrativeContract,plainEngineMeaning} from '../dist/qimen/ai/narrativePrimitives.mjs';
import {fallbackDraft,hydrateSurfaceReading,validateSurfaceDraft,validateSurfaceReading,naturalSurfaceFallback,auditSurfaceStyle,surfaceParagraphs} from '../dist/qimen/ai/surfaceReading.mjs';
import {writeSurface} from '../local/surface-writer.mjs';
import {acceptFidelity,meaningOf} from './surface-fixture.mjs';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/writer-regression.json',import.meta.url)));
const event=prepareReading(fixtures.question),menh=prepareMenhReading(fixtures.menh);
const ctx=buildMenhWriterContext(menh.result,{birthTimeMode:'KNOWN'});
const qc=buildQuestionNarrativeContract(event.context),mc=buildMenhNarrativeFromContext(ctx);
const copy=x=>structuredClone(x);
const section=(draft,id)=>draft.sections.find(s=>s.id===id);
const append=(draft,id,text)=>{section(draft,id).text+=text;return draft;};

test('contract construction preserves every board and deterministic judgment byte',()=>{
  const before=JSON.stringify({q:event.context,m:menh.result});
  buildQuestionNarrativeContract(event.context);buildMenhNarrativeFromContext(ctx);
  assert.equal(JSON.stringify({q:event.context,m:menh.result}),before);
  assert.equal(qc.primaryConclusion.conclusion,event.context.allInOne.reasoning.primaryJudgment.answerClass);
  assert.deepEqual(qc.primaryConclusion.claimIds,event.context.allInOne.reasoning.primaryJudgment.claimIds);
  assert.ok(Object.isFrozen(qc));assert.ok(Object.isFrozen(mc.units[0]));
});
test('Cao Thị Thảo Trang fixture retains the exact supplied placements and age period',()=>{
  const self=mc.claims.find(c=>c.id==='SELF_CORE').technicalEvidence;
  for(const word of ['Càn 6','Thiên Tâm','Đỗ Môn','Thái Âm','Kỷ','Không Vong'])assert.ok(self.includes(word),word);
  assert.match(mc.claims.find(c=>c.id==='WEALTH_CORE').technicalEvidence,/Khôn 2/);
  assert.match(mc.claims.find(c=>c.id==='LUCK_CURRENT').technicalEvidence,/31–45 tại Cấn 8/);
  assert.deepEqual(new Set(mc.globalModifier.mechanisms),new Set(['FU_YIN','FAN_YIN']));
});
test('Mệnh gives the Writer required integrated patterns for self, current luck and annual action',()=>{
  const required=id=>mc.units.find(u=>u.id===id).atoms.filter(a=>a.required&&a.kind==='life_synthesis');
  const self=required('self'),luck=required('luck'),annual=required('annual');
  assert.equal(self.length,1);assert.equal(luck.length,1);assert.equal(annual.length,1);
  assert.match(self[0].meaning,/phân tích.*không phải lúc nào cũng tự chuyển thành kết quả/i);
  const overview=mc.units.find(u=>u.id==='overview');
  assert.equal(overview.atoms.some(a=>a.meaning===self[0].meaning),false);
  assert.deepEqual(overview.atoms.map(a=>a.id),['global_pace']);
  assert.match(luck[0].meaning,/31–45.*củng cố.*mốc xem lại/i);
  assert.match(annual[0].meaning,/việc cần làm ngay.*thêm dữ liệu.*tăng tốc/i);
  for(const a of [...self,...luck,...annual]){
    assert.ok(a.sourceEvidenceIds.length);assert.doesNotMatch(a.meaning,/Không Vong|Phục Ngâm|Phản Ngâm|Càn 6|Cấn 8|Thiên bàn/);
  }
});
test('global effects cap affected units before narration and preserve GLOBAL_STRUCTURE trace',()=>{
  assert.equal(mc.globalModifier.effects.local_positive_signal_cap,true);
  assert.ok(mc.globalModifier.appliedTo.length>=6);
  for(const id of mc.globalModifier.appliedTo){const u=mc.units.find(x=>x.id===id);assert.equal(u.certainty,'conditional');assert.ok(u.claimIds.includes('GLOBAL_STRUCTURE'));}
  const invalid=copy(mc);invalid.units.find(x=>x.id==='career').certainty='tendency';
  assert.throws(()=>validateNarrativeContract(invalid),/GLOBAL_CERTAINTY_CAP/);
  invalid.units.find(x=>x.id==='career').certainty='conditional';invalid.globalModifier.effects.local_positive_signal_cap=false;
  assert.throws(()=>validateNarrativeContract(invalid),/GLOBAL_CAP_REMOVED/);
});
test('global modifier is expressed once as life meaning without obligatory technical wording',()=>{
  const r=naturalSurfaceFallback(mc);assert.equal(validateMenhReading(r,ctx),r);
  assert.doesNotMatch(meaningOf(r),/Phục Ngâm|Phản Ngâm|cap|veto|GLOBAL_STRUCTURE/);
  assert.equal(surfaceParagraphs(r).filter(p=>p.atom_ids.includes('global_pace')).length,1);
  for(const p of surfaceParagraphs(r).filter(p=>p.trace.modifier_ids.length))assert.ok(p.claim_ids.includes('GLOBAL_STRUCTURE'));
});
test('four explicit childcare decision facets survive classification as prediction',()=>{
  assert.deepEqual(qc.facets.map(x=>x.id),['decision','approval_timing','financial_capacity','career_return']);
  assert.equal(qc.showDevelopment,false);assert.ok(!qc.units.some(x=>x.id.startsWith('development_')));
  for(const facet of qc.facets){assert.equal(facet.source,'explicit');assert.ok(fixtures.question.question.includes(facet.sourceQuote));assert.ok(qc.units.find(x=>x.id===facet.id));}
  const deadline=qc.units.find(x=>x.id==='approval_timing');assert.equal(deadline.conclusion,'scope_only');
  assert.equal(event.context.allInOne.reasoning.timing.allowedPredictions.length,0);
});
test('multi-facet coverage cannot be removed and Writer cannot forge trace metadata',()=>{
  const draft=fallbackDraft(qc);draft.sections=draft.sections.filter(s=>s.id!=='career_return');
  assert.throws(()=>validateSurfaceDraft(draft,qc),/SCHEMA|MISSING_SECTION/);
  const bad=fallbackDraft(qc);section(bad,'financial_capacity').claim_ids=['invented'];
  assert.throws(()=>validateSurfaceDraft(bad,qc),/SECTION_SCHEMA/);
});
test('business choice keeps the asked alternatives, margin and domain meaning in the contract',()=>{
  const prepared=prepareReading({...fixtures.question,question:'Tôi nên nhận dự án này hay từ chối vì biên lợi nhuận đang thấp?',topic:'contract',mode:'business'});
  const contract=buildQuestionNarrativeContract(prepared.context);
  assert.deepEqual(contract.facets.map(f=>f.id),['decision','financial_capacity']);
  assert.match(contract.primaryConclusion.meaning,/nhận dự án này hay từ chối/i);
  assert.match(contract.units.find(u=>u.id==='financial_capacity').atoms.map(a=>a.meaning).join(' '),/Biên lợi nhuận.*toàn bộ chi phí/i);
  assert.ok(contract.units.flatMap(u=>u.atoms).some(a=>a.kind==='domain_translation'));
});
test('planner answer and decision steps survive as traced synthesis without changing the verdict',()=>{
  const prepared=prepareReading({...fixtures.question,question:'Tôi nên nhận dự án này hay từ chối vì biên lợi nhuận đang thấp?',topic:'contract',mode:'business'}),g=prepared.context.allInOne.reasoning,ids=g.primaryJudgment.claimIds;
  const planning={answer_class:g.primaryJudgment.answerClass,decisive_claim_ids:ids,counter_claim_ids:[],bottleneck_claim_id:'',recommendation_ids:[],semantic_frame:{related_considerations:[]},stage_logic:[
    {slot:'answer',claim_ids:ids.slice(0,2),note:'Chưa đủ căn cứ để nhận vô điều kiện.'},
    {slot:'action',claim_ids:ids.slice(0,2),note:'Đặt ngưỡng go/no-go trước khi cam kết.'},
    {slot:'alternative',claim_ids:ids.slice(0,2),note:'Nếu không đạt ngưỡng thì đàm phán lại hoặc từ chối.'}
  ]};
  const contract=buildQuestionNarrativeContract(prepared.context,{deliberation:planning}),answer=contract.units.find(u=>u.id==='answer'),decision=contract.units.find(u=>u.id==='decision');
  assert.equal(answer.atoms.filter(a=>a.kind==='planner_synthesis').length,2);
  assert.equal(answer.atoms.filter(a=>a.kind==='planner_synthesis'&&a.required).length,1);
  assert.equal(decision.atoms.filter(a=>a.kind==='planner_synthesis'&&a.required).length,1);
  assert.doesNotMatch(decision.atoms.map(a=>a.meaning).join(' '),/go\/no-go/i);
  assert.equal(contract.primaryConclusion.conclusion,g.primaryJudgment.answerClass);
});
test('planner check-only considerations add depth without becoming observed facts',()=>{
  const g=event.context.allInOne.reasoning,id=g.primaryJudgment.claimIds[0];
  const planning={answer_class:g.primaryJudgment.answerClass,decisive_claim_ids:[id],counter_claim_ids:[],stage_logic:[],recommendation_ids:[],semantic_frame:{related_considerations:[
    {label:'Phương án dự phòng',why_relevant:'quyết định đang hỏi có thể cần một lối lùi nếu điều kiện chính không đạt',source:'check_only',source_quote:'',claim_ids:[id]}
  ]}};
  const contract=buildQuestionNarrativeContract(event.context,{deliberation:planning}),facet=contract.facets.find(f=>f.source==='check_only');
  assert.ok(facet);assert.equal(facet.sourceQuote,'');
  assert.match(contract.units.find(u=>u.id===facet.id).atoms[0].meaning,/dữ liệu còn cần xác minh/i);
});
test('decision facets outside childcare do not acquire an invented career break',()=>{
  const investment=prepareReading({...fixtures.question,question:'Tôi có nên đầu tư thêm vốn khi nguồn lực tài chính hạn chế?'});
  const c=buildQuestionNarrativeContract(investment.context),finance=c.units.find(u=>u.id==='financial_capacity');
  assert.ok(finance);assert.doesNotMatch(finance.label+' '+finance.atoms.map(a=>a.meaning).join(' '),/thời gian nghỉ|chăm con/);
  const job=prepareReading({...fixtures.question,question:'Tôi có nên tìm công việc khác lúc này không?'});
  const career=buildQuestionNarrativeContract(job.context).units.find(u=>u.id==='career_return');
  assert.ok(career);assert.doesNotMatch(career.label+' '+career.atoms.map(a=>a.meaning).join(' '),/nghỉ một thời gian|quay lại công việc/);
});
test('overlapping childcare considerations enrich the four asked facets instead of creating duplicate sections',()=>{
  const g=event.context.allInOne.reasoning,ids=g.primaryJudgment.claimIds;
  const planning={answer_class:g.primaryJudgment.answerClass,decisive_claim_ids:ids,counter_claim_ids:[],stage_logic:[],recommendation_ids:[],semantic_frame:{related_considerations:[
    {label:'Khả năng chăm con toàn thời gian',why_relevant:'đây là mục tiêu trực tiếp của quyết định nghỉ',source:'explicit',source_quote:'ở nhà chăm con hoàn toàn',claim_ids:[ids[0]]},
    {label:'Độ bền của kế hoạch một năm',why_relevant:'việc được duyệt nghỉ chỉ là bước đầu của kế hoạch dài hạn',source:'explicit',source_quote:'thuận trong việc nghỉ ở nhà ít nhất 1 năm không?',claim_ids:[ids[1]]},
    {label:'Duy trì năng lực nghề nghiệp',why_relevant:'giúp khoảng nghỉ không đồng nghĩa với mất sự chủ động nghề nghiệp',source:'explicit',source_quote:'lo bản thân ù lì tụt hậu không?',claim_ids:[ids[0]]}
  ]}};
  const c=buildQuestionNarrativeContract(event.context,{deliberation:planning}),decision=c.facets.find(f=>f.id==='decision'),career=c.facets.find(f=>f.id==='career_return');
  assert.deepEqual(c.facets.map(f=>f.id),['decision','approval_timing','financial_capacity','career_return']);
  assert.ok(decision.plannerNotes.length>=2);assert.ok(career.plannerNotes.length>=1);
  assert.equal(auditSurfaceStyle(naturalSurfaceFallback(c)).some(x=>x.code==='REPEATED_SENTENCE'),false);
});
test('planner caps side considerations so a focused question does not become a checklist of sections',()=>{
  const prepared=prepareReading({input:{year:2026,month:9,day:21,hour:10,minute:25,tzOffset:7},question:'Tôi có nên ký hợp đồng thuê mặt bằng này trong tháng này không?',topic:'general',mode:'auto',method:'chaibu'}),g=prepared.context.allInOne.reasoning,id=g.primaryJudgment.claimIds[0];
  const related_considerations=[
    {label:'Khung ký trong tháng này',why_relevant:'quyết định phải nằm trong cửa sổ thời gian người hỏi đã nêu',source:'explicit',source_quote:'trong tháng này',claim_ids:[id]},
    ...['Mức độ phù hợp của mặt bằng','Thẩm quyền của người ký','Điều khoản bàn giao','Phương án thoát hợp đồng'].map(label=>({label,why_relevant:'đây là dữ liệu thực tế cần kiểm tra trước khi cam kết',source:'check_only',source_quote:'',claim_ids:[id]}))
  ];
  const c=buildQuestionNarrativeContract(prepared.context,{deliberation:{answer_class:g.primaryJudgment.answerClass,decisive_claim_ids:[id],counter_claim_ids:[],stage_logic:[],recommendation_ids:[],semantic_frame:{related_considerations}}}),decision=c.facets.find(f=>f.id==='decision');
  assert.equal(c.facets.filter(f=>f.id.startsWith('consideration_')).length,2);
  assert.ok(decision.plannerNotes.some(note=>/khung ký trong tháng này/i.test(note)));
  assert.ok(c.facets.length<=3);
});
test('Writer output is limited to section id and natural text',()=>{
  for(const [key,value] of [['claim_ids',['invented']],['certainty','observed'],['conclusion','positive'],['technicalEvidence','forged']]){
    const draft=fallbackDraft(qc);section(draft,'answer')[key]=value;
    assert.throws(()=>validateSurfaceDraft(draft,qc),/SECTION_SCHEMA/);
  }
  const draft=fallbackDraft(qc);section(draft,'answer').id='invented';
  assert.throws(()=>validateSurfaceDraft(draft,qc),/UNKNOWN_SECTION|MISSING_SECTION/);
});
test('writer payload excludes raw engine data and provenance ids',()=>{
  for(const c of [qc,mc]){
    const p=surfacePayload(c),serialized=JSON.stringify(p);
    for(const key of ['board','allInOne','readingGraph','usefulGodProfile','strengthProfile','structureProfile','semanticMatrix'])assert.equal(p[key],undefined);
    assert.ok(p.units.every(u=>u.allowedMeaning.length));
    assert.equal(serialized.includes('claimIds'),false);
    assert.equal(serialized.includes('atom_ids'),false);
    assert.equal(serialized.includes('evidenceIds'),false);
    assert.ok(serialized.length<JSON.stringify(c).length);
  }
});
test('Mệnh Writer sees only required synthesis or two diverse optional meanings',()=>{
  const payload=surfacePayload(mc);
  for(const row of payload.units){
    const source=mc.units.find(u=>u.id===row.id),required=source.atoms.filter(a=>a.required);
    if(required.length){
      assert.deepEqual(row.allowedMeaning.map(x=>x.meaning),required.map(x=>x.meaning));
    }else assert.ok(row.allowedMeaning.length<=2,row.id);
  }
  const family=payload.units.find(u=>u.id==='family').allowedMeaning.map(x=>x.meaning).join(' ');
  assert.match(family,/Nề nếp gia đình/i);assert.match(family,/Việc chăm sóc con/i);
});
test('technical evidence and provenance are reattached by the app and cannot be forged',()=>{
  for(const c of [qc,mc]){
    const good=hydrateSurfaceReading(fallbackDraft(c),c);assert.equal(validateSurfaceReading(good,c),good);
    for(const key of ['technicalEvidence','trace']){
      const bad=copy(good),p=Object.values(bad.sections)[0].paragraphs[0];
      p[key]=key==='trace'?{claim_ids:['invented']}:p.technicalEvidence+' Sinh Môn ở Trung Ngũ.';
      assert.throws(()=>validateSurfaceReading(bad,c));
    }
  }
});
test('planner cannot reverse judgment or promote corroboration-only claims',()=>{
  const g=event.context.allInOne.reasoning;
  assert.throws(()=>validateDeliberation({answer_class:'forged'},event.context),/PLANNER_VERDICT_CHANGED/);
  assert.throws(()=>validateDeliberation({answer_class:g.primaryJudgment.answerClass,decisive_claim_ids:['invented'],counter_claim_ids:[]},event.context),/UNKNOWN_CLAIM/);
});
test('surface factual audit still blocks fabricated placements, dates, money, probability and events',()=>{
  for(const sentence of ['Sinh Môn nằm ở cung 5.','Công ty sẽ chuyển 850 triệu đồng.','Bạn thành công với xác suất 95%.','Hợp đồng đã hoàn tất.','Kết quả sẽ đến vào 30/12/2027.']){
    const draft=append(fallbackDraft(qc),'answer',' '+sentence);
    const r=hydrateSurfaceReading(draft,qc);
    assert.throws(()=>validateReading(r,event.facts,'general',event.context),undefined,sentence);
  }
});
test('Mệnh safety gates reject medical, death, exact children and marriage claims',()=>{
  for(const sentence of ['Bạn sẽ chết 72 tuổi.','Bạn sẽ có 3 con.','Bạn sẽ kết hôn 2 lần.','Bạn chắc chắn vô sinh.','Bạn sẽ nhận 500 triệu đồng.']){
    const draft=append(fallbackDraft(mc),'overview',' '+sentence);
    assert.throws(()=>validateMenhReading(hydrateSurfaceReading(draft,mc),ctx),undefined,sentence);
  }
});
test('independent semantic review blocks contradictory prose without relying on Writer ids',async()=>{
  let writes=0,reviews=0;
  const r=await writeSurface(qc,{runner:async()=>{writes++;const draft=fallbackDraft(qc);section(draft,'answer').text='Mọi điều kiện đều đã sẵn sàng, cứ nộp đơn ngay.';return draft;},reviewer:async()=>{reviews++;return {violations:[{code:'VERDICT_CHANGED',unitId:'answer',sentence:'Mọi điều kiện đều đã sẵn sàng, cứ nộp đơn ngay.',reason:'Đảo kết luận có điều kiện.',allowedMeaning:['Kết luận và điều kiện đã duyệt.']}]};}});
  assert.equal(writes,2);assert.equal(reviews,2);assert.equal(r.status,'verified_fallback');
  assert.doesNotMatch(meaningOf(r),/Mọi điều kiện đều đã sẵn sàng/);
});
test('semantic review outages fail closed instead of marking a draft as verified',async()=>{
  await assert.rejects(writeSurface(qc,{runner:async()=>fallbackDraft(qc),reviewer:async()=>{throw Error('review unavailable');}}),/review unavailable/);
});
test('phrase-count style hints do not invalidate a semantically reviewed draft',async()=>{
  let writes=0;
  const reading=await writeSurface(qc,{reviewer:acceptFidelity,runner:async()=>{
    writes++;const d=fallbackDraft(qc);
    d.sections.slice(0,3).forEach((s,i)=>s.text+=' Bạn cần kiểm tra điều kiện khác nhau '+i+'.');
    return d;
  }});
  assert.equal(writes,1);assert.equal(reading.status,'reading');
});
test('editorial repetition alone does not trigger another LLM call',async()=>{
  let writes=0,reviews=0;
  const result=await writeSurface(qc,{runner:async()=>{
    writes++;const d=fallbackDraft(qc);
    d.sections.slice(0,2).forEach(s=>s.text+=' Bạn nên giữ cách sắp xếp phù hợp với những điều kiện thực tế của mình.');
    return d;
  },reviewer:async()=>{reviews++;return {violations:[]};}});
  assert.equal(writes,1);assert.equal(reviews,1);assert.equal(result.status,'reading');
});
test('negated certainty and stage warnings are not treated as positive claims',()=>{
  const draft=append(fallbackDraft(qc),'answer',' Chưa đủ cơ sở để nói việc xin nghỉ chắc chắn sẽ được giải quyết đúng mong muốn. Tránh xem dự án chắc chắn thành công khi điều kiện chưa sẵn sàng.');
  assert.doesNotThrow(()=>validateReading(hydrateSurfaceReading(draft,qc),event.facts,'general',event.context));
  const m=append(fallbackDraft(mc),'overview',' Điều này không có nghĩa bạn chắc chắn sẽ thành công.');
  assert.doesNotThrow(()=>validateMenhReading(hydrateSurfaceReading(m,mc),ctx));
});
test('paragraph breaks inside natural section text do not create a prose quota gate',()=>{
  const draft=fallbackDraft(qc),row=section(draft,'answer');
  row.text=Array.from({length:6},(_,i)=>'Ý diễn đạt '+i+': '+row.text).join('\n\n');
  assert.doesNotThrow(()=>validateSurfaceDraft(draft,qc));
  assert.doesNotMatch(hydrateSurfaceReading(draft,qc).sections.answer.paragraphs[0].meaning,/\n/);
});
test('controlled condition adapters translate the complete message before replacing terms',()=>{
  const meaning=plainEngineMeaning('Xử lý điều kiện cản tại Dụng Thần chính trước khi nâng mức kết luận hoặc mở rộng cam kết.');
  assert.doesNotMatch(meaning,/Dụng Thần|nâng mức kết luận|yếu tố quyết định/);
  assert.match(meaning,/trở ngại/);
  const r=naturalSurfaceFallback(qc);
  assert.doesNotMatch(meaningOf(r),/nên khâu|dấu hiệu đã được cấp/);
});
test('surface style flags internal words, repeated sentences and repeated verification, not strong sentences',()=>{
  const draft=fallbackDraft(qc);section(draft,'answer').text='Điểm cần chuẩn bị trước nằm ở tài chính và cách quay lại công việc.';
  assert.equal(auditSurfaceStyle(draft).some(x=>x.code==='INTERNAL_LANGUAGE'),false);
  section(draft,'answer').text+=' GLOBAL_STRUCTURE cap veto KM-FAKE profile deterministic resolver claim evidence pipeline corroborator.';
  assert.ok(auditSurfaceStyle(draft).some(x=>x.code==='INTERNAL_LANGUAGE'));
  section(draft,'answer').text+=' 投入';assert.ok(auditSurfaceStyle(draft).some(x=>x.code==='NON_VIETNAMESE_SCRIPT'));
  for(const s of draft.sections)s.text+=' Bạn cần xác minh lại các điều kiện trước khi tự chốt quyết định này.';
  const codes=auditSurfaceStyle(draft).map(x=>x.code);assert.ok(codes.includes('REPEATED_SENTENCE'));assert.ok(codes.includes('REPEATED_VERIFICATION'));
  const semantic=fallbackDraft(qc);semantic.sections[0].text+=' Hãy tách phần có thể chủ động với phần còn phụ thuộc bên khác trước khi chốt quyết định.';semantic.sections[1].text+=' Khi chốt quyết định, cần biết điều mình chủ động và điều vẫn phụ thuộc phối hợp.';
  assert.ok(auditSurfaceStyle(semantic).some(x=>x.code==='REPEATED_IDEA_FRAME'));
});
test('both real fixtures produce readable fallback meanings without internal English',()=>{
  for(const c of [qc,mc]){
    const r=naturalSurfaceFallback(c);
    assert.ok(surfaceParagraphs(r).every(p=>p.meaning.trim()&&p.atom_ids.length));
    assert.doesNotMatch(meaningOf(r),/\b(?:deterministic|resolver|claim|evidence|pipeline|corroborator|cap|veto|profile)\b|GLOBAL_STRUCTURE|KM-/i);
  }
});


test('v2 semantic guards do not mistake natural Vietnamese for a weekday or promised outcome',()=>{
  const relationship=prepareReading({input:{year:2026,month:9,day:20,hour:21,minute:5,tzOffset:7},question:'Tôi có nên tiếp tục mối quan hệ này hay dừng lại?',topic:'general',mode:'auto',method:'chaibu'});
  const rc=buildQuestionNarrativeContract(relationship.context),rd=fallbackDraft(rc);
  section(rd,'answer').text+=' Đừng chỉ kỳ vọng mọi thứ tự thay đổi.';
  assert.doesNotThrow(()=>validateReading(hydrateSurfaceReading(rd,rc),relationship.facts,'general',relationship.context));

  const property=prepareReading({input:{year:2026,month:9,day:21,hour:10,minute:25,tzOffset:7},question:'Tôi có nên ký hợp đồng thuê mặt bằng này trong tháng này không?',topic:'general',mode:'auto',method:'chaibu'});
  const pc=buildQuestionNarrativeContract(property.context),pd=fallbackDraft(pc);
  const timing=section(pd,'timing');
  if(timing)timing.text='Các mốc 24/09/2026, 25/09/2026 và 30/09/2026 chỉ để quan sát; không xác nhận rằng hợp đồng sẽ được ký vào các ngày đó.';
  assert.doesNotThrow(()=>validateReading(hydrateSurfaceReading(pd,pc),property.facts,'general',property.context));
  const promised=fallbackDraft(pc),promisedTiming=section(promised,'timing');
  if(promisedTiming)promisedTiming.text='Hợp đồng sẽ được ký vào 30/09/2026.';
  assert.throws(()=>validateReading(hydrateSurfaceReading(promised,pc),property.facts,'general',property.context));
});

test('unknown-birth-time guidance may reference experiences without inventing a specific life event',()=>{
  const prepared=prepareMenhReading({birthDateLocal:'1990-01-01',birthTimeMode:'UNKNOWN',birthTimeLocal:null,tzOffset:7,age:37,annualYear:2026});
  const context=buildMenhWriterContext(prepared.result,{birthTimeMode:'UNKNOWN'}),contract=buildMenhNarrativeFromContext(context),draft=fallbackDraft(contract);
  section(draft,'birthTimeNote').text+=' Có thể dựa vào những chuyện bạn đã trải qua để thu hẹp hướng nghiên cứu, nhưng cách này chưa thể xác nhận giờ sinh thật.';
  assert.doesNotThrow(()=>validateMenhReading(hydrateSurfaceReading(draft,contract),context));
});
