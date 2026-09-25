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
test('decision facets outside childcare do not acquire an invented career break',()=>{
  const investment=prepareReading({...fixtures.question,question:'Tôi có nên đầu tư thêm vốn khi nguồn lực tài chính hạn chế?'});
  const c=buildQuestionNarrativeContract(investment.context),finance=c.units.find(u=>u.id==='financial_capacity');
  assert.ok(finance);assert.doesNotMatch(finance.label+' '+finance.atoms.map(a=>a.meaning).join(' '),/thời gian nghỉ|chăm con/);
  const job=prepareReading({...fixtures.question,question:'Tôi có nên tìm công việc khác lúc này không?'});
  const career=buildQuestionNarrativeContract(job.context).units.find(u=>u.id==='career_return');
  assert.ok(career);assert.doesNotMatch(career.label+' '+career.atoms.map(a=>a.meaning).join(' '),/nghỉ một thời gian|quay lại công việc/);
});
test('overlapping explicit long-term considerations merge their trace into one facet',()=>{
  const g=event.context.allInOne.reasoning,ids=g.primaryJudgment.claimIds;
  const planning={answer_class:g.primaryJudgment.answerClass,decisive_claim_ids:ids,counter_claim_ids:[],stage_logic:[],semantic_frame:{related_considerations:[
    {source:'explicit',source_quote:'ở nhà chăm con hoàn toàn',claim_ids:[ids[0]]},
    {source:'explicit',source_quote:'thuận trong việc nghỉ ở nhà ít nhất 1 năm không?',claim_ids:[ids[1]]}
  ]}};
  const c=buildQuestionNarrativeContract(event.context,{deliberation:planning});
  const facets=c.facets.filter(f=>f.label==='Duy trì việc ở nhà lâu dài');
  assert.equal(facets.length,1);assert.deepEqual(new Set(facets[0].claimIds),new Set(ids.slice(0,2)));
  assert.equal(auditSurfaceStyle(naturalSurfaceFallback(c)).some(x=>x.code==='REPEATED_SENTENCE'),false);
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
test('a negated certainty sentence is not rejected by legacy keyword scanning',()=>{
  const draft=append(fallbackDraft(qc),'answer',' Chưa đủ cơ sở để nói việc xin nghỉ chắc chắn sẽ được giải quyết đúng mong muốn.');
  assert.doesNotThrow(()=>validateReading(hydrateSurfaceReading(draft,qc),event.facts,'general',event.context));
  const m=append(fallbackDraft(mc),'overview',' Điều này không có nghĩa bạn chắc chắn sẽ thành công.');
  assert.doesNotThrow(()=>validateMenhReading(hydrateSurfaceReading(m,mc),ctx));
});
test('paragraph breaks inside natural section text do not create a prose quota gate',()=>{
  const draft=fallbackDraft(qc),row=section(draft,'answer');
  row.text=Array.from({length:6},(_,i)=>'Ý diễn đạt '+i+': '+row.text).join('\n\n');
  assert.doesNotThrow(()=>validateSurfaceDraft(draft,qc));
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
  for(const s of draft.sections)s.text+=' Bạn cần xác minh lại các điều kiện trước khi tự chốt quyết định này.';
  const codes=auditSurfaceStyle(draft).map(x=>x.code);assert.ok(codes.includes('REPEATED_SENTENCE'));assert.ok(codes.includes('REPEATED_VERIFICATION'));
});
test('both real fixtures produce readable fallback meanings without internal English',()=>{
  for(const c of [qc,mc]){
    const r=naturalSurfaceFallback(c);
    assert.ok(surfaceParagraphs(r).every(p=>p.meaning.trim()&&p.atom_ids.length));
    assert.doesNotMatch(meaningOf(r),/\b(?:deterministic|resolver|claim|evidence|pipeline|corroborator|cap|veto|profile)\b|GLOBAL_STRUCTURE|KM-/i);
  }
});
