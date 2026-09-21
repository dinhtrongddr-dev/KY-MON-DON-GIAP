import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading,validateReading} from '../local/reading.mjs';
import {prepareMenhReading,writerContextForPrepared} from '../local/menh-reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {readingFixture} from './reading-fixture.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {
  CASE_ENGINE_VERSION,eventCaseTarget,natalCaseTarget,proposeCaseRetention,retrieveCases,validateCaseLibrary,writerCaseGuidance
} from '../dist/qimen/case/engine.mjs';
import {CASE_LIBRARY,CASE_LIBRARY_VERSION,CASE_RETENTION_POLICY} from '../dist/qimen/case/library.mjs';

const eventBase={topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7}};
const prep=question=>prepareReading({...eventBase,question});

test('KM-CASE-1.0 library is provenance-locked and contains no empirical outcome claim by default',()=>{
  assert.equal(CASE_ENGINE_VERSION,'KM-CASE-1.0');
  assert.equal(CASE_LIBRARY_VERSION,'KM-CASE-LIBRARY-1.0');
  assert.equal(validateCaseLibrary(),true);
  assert.equal(new Set(CASE_LIBRARY.map(c=>c.caseId)).size,CASE_LIBRARY.length);
  assert.ok(CASE_LIBRARY.every(c=>c.provenance.sourceRef&&c.provenance.verification));
  assert.ok(CASE_LIBRARY.every(c=>c.provenance.observedOutcome===false));
  assert.equal(CASE_RETENTION_POLICY.autoRetainUserSessions,false);
  assert.equal(CASE_RETENTION_POLICY.storesQuestionText,false);
});

test('finance emergence golden retrieves directly but cannot override the planner verdict',()=>{
  const p=prep('Trong tuần này tôi có khoản tiền vào được phát sinh không?');
  const g=p.context.allInOne.reasoning,profile=g.caseProfile;
  assert.equal(g.primaryJudgment.answerClass,'conditional_positive');
  assert.equal(g.outcomeDimensions.income_emergence.status,'positive');
  assert.ok(['conditional','unresolved'].includes(g.outcomeDimensions.cash_realization.status));
  assert.equal(profile.retrieved[0].caseId,'case_event_finance_emergence_20260916');
  assert.equal(profile.retrieved[0].fitBand,'direct');
  assert.equal(profile.verdictOverrideAllowed,false);
  assert.equal(profile.majorityVoteAllowed,false);
  assert.equal(profile.probabilityAllowed,false);
});

test('case similarity never crosses a hard domain boundary',()=>{
  const target={product:'event',domain:'health',mode:'prediction',stage:'emergence',answerClass:'conditional_positive',
    roles:['self','money','capital'],secondaryDomains:[],unresolvedRoles:[],globalPatterns:[],claims:[],hasTiming:false,hasAnnual:false};
  const result=retrieveCases(target,{limit:10});
  assert.ok(!result.retrieved.some(x=>x.caseId==='case_event_finance_emergence_20260916'));
});

test('different answerClass creates adaptation burden instead of copying the old outcome',()=>{
  const target={product:'event',domain:'finance',mode:'prediction',stage:'emergence',answerClass:'negative',
    roles:['self','money','capital'],secondaryDomains:[],unresolvedRoles:[],globalPatterns:[],claims:[],hasTiming:false,hasAnnual:false};
  const result=retrieveCases(target);
  const row=result.retrieved.find(x=>x.caseId==='case_event_finance_emergence_20260916');
  assert.ok(row);
  assert.ok(row.adaptationCost>0);
  assert.ok(row.adaptationNeeds.some(x=>/khác case tham chiếu/i.test(x)));
  assert.equal(result.verdictOverrideAllowed,false);
});

test('mixed family plus finance retrieves the mixed-domain lesson without losing family primacy',()=>{
  const p=prep('Vợ tôi có nên ở nhà chăm con nhỏ đến 2 tuổi không? Tôi là trụ cột kinh tế, tôi có đủ khả năng không?');
  const g=p.context.allInOne.reasoning;
  assert.equal(p.context.allInOne.questionContext.domain,'family');
  assert.deepEqual(p.analysis.yongshenProfile.secondaryDomains,['finance']);
  assert.equal(g.caseProfile.retrieved[0].caseId,'case_event_family_finance_capacity');
  assert.equal(p.analysis.roles.find(r=>r.id==='family_child').yongshenTier,'primary');
  assert.equal(p.analysis.roles.find(r=>r.id==='money').yongshenTier,'secondary');
});

test('unresolved relationship counterpart retrieves a no-mind-reading guardrail only while unresolved',()=>{
  const p=prep('Tình cảm của tôi và người yêu sẽ tiến triển ra sao?');
  assert.equal(p.analysis.roles.find(r=>r.id==='customer').status,'unresolved');
  assert.equal(p.context.allInOne.reasoning.caseProfile.retrieved[0].caseId,'case_event_relationship_unresolved_counterpart');
  const target=eventCaseTarget({
    analysis:{...p.analysis,roles:p.analysis.roles.map(r=>r.id==='customer'?{...r,status:'user_supplied'}:r)},
    questionContext:p.context.allInOne.questionContext,
    selected:p.context.allInOne.reasoning.evidenceBundles,
    primaryJudgment:p.context.allInOne.reasoning.primaryJudgment,
    timing:p.context.allInOne.reasoning.timing
  });
  assert.ok(!retrieveCases(target,{limit:10}).retrieved.some(x=>x.caseId==='case_event_relationship_unresolved_counterpart'));
});

test('timing precedent can be retrieved without fabricating an event date',()=>{
  const target={product:'event',domain:'business',mode:'timing',stage:'execution',answerClass:'conditional',
    roles:['self','event'],secondaryDomains:[],unresolvedRoles:[],globalPatterns:[],claims:[],hasTiming:true,hasAnnual:false};
  const result=retrieveCases(target);
  assert.equal(result.retrieved[0].caseId,'case_event_timing_trigger_precedence');
  assert.ok(result.retrieved[0].guidance.avoid.some(x=>/bịa ngày/i.test(x)));
  assert.equal(result.probabilityAllowed,false);
});

test('writer receives only bounded case guidance, never case ids, scores or source references',()=>{
  const p=prep('Trong tuần này tôi có khoản tiền vào được phát sinh không?');
  const writer=buildWriterContext(p.context),serialized=JSON.stringify(writer.caseGuidance);
  assert.equal(writer.caseGuidance.verdictOverrideAllowed,false);
  assert.equal(writer.caseGuidance.retention.autoRetainUserSessions,false);
  assert.equal(writer.caseGuidance.retention.storesQuestionText,false);
  assert.doesNotMatch(serialized,/case_event_|sourceRef|sourceCase|similarity|adaptationCost|DETERMINISTIC_GOLDEN/);
  assert.match(serialized,/Phân biệt rõ phát sinh/);
});

test('retention creates a sanitized review candidate and never auto-retains a user session',()=>{
  const p=prep('Trong tuần này tôi có khoản tiền vào được phát sinh không?');
  const g=p.context.allInOne.reasoning;
  const target=eventCaseTarget({analysis:p.analysis,questionContext:p.context.allInOne.questionContext,selected:g.evidenceBundles,primaryJudgment:g.primaryJudgment,timing:g.timing});
  const draft=proposeCaseRetention(target);
  assert.equal(draft.status,'REVIEW_REQUIRED');
  assert.equal(draft.autoRetained,false);
  assert.equal(draft.questionTextStored,false);
  assert.equal(JSON.stringify(draft).includes(p.context.question),false);
  const noEvidence=proposeCaseRetention(target,{sourceRef:'manual/case-1',humanReviewed:true,observedOutcome:true});
  assert.equal(noEvidence.status,'REVIEW_REQUIRED');
  const ready=proposeCaseRetention(target,{sourceRef:'manual/case-1',humanReviewed:true,observedOutcome:true,outcomeEvidence:'external-record'});
  assert.equal(ready.status,'READY_FOR_MANUAL_LIBRARY_REVIEW');
  assert.equal(ready.autoRetained,false);
});

test('Mệnh Z18 retrieves global precedence before domain-specific cases and still keeps frozen claims',()=>{
  const p=prepareMenhReading({birthDateLocal:'1970-01-03',birthTimeMode:'KNOWN',birthTimeLocal:'22:00',tzOffset:7,age:57,annualYear:2026});
  assert.equal(p.result.natal.baseBoard.fuYin,true);
  const target=natalCaseTarget(p.result),profile=retrieveCases(target,{limit:4});
  assert.equal(profile.retrieved[0].caseId,'case_menh_z18_global_precedence');
  assert.ok(p.result.claims.some(c=>c.claimId==='GLOBAL_STRUCTURE'));
  assert.ok(p.result.claims.some(c=>c.claimId==='MARRIAGE_CORE'));
  const writer=writerContextForPrepared(p),serialized=JSON.stringify(writer.caseGuidance);
  assert.match(serialized,/Đọc Phục Ngâm toàn cục trước/);
  assert.doesNotMatch(serialized,/Z18|LWF|case_menh_|sourceCase|sourceRef/);
});

test('writer case guidance never claims outcome calibration from the current seed corpus',()=>{
  const p=prep('Sức khỏe của tôi gần đây cần chú ý điều gì?');
  const compact=writerCaseGuidance(p.context.allInOne.reasoning.caseProfile);
  assert.equal(compact.outcomeCalibrationAllowed,false);
  assert.ok(compact.cases.every(c=>c.observedOutcome===false));
});

test('reading validator rejects leakage of Case Engine metadata into user-facing prose',()=>{
  const p=prep('Trong tuần này tôi có khoản tiền vào được phát sinh không?');
  const reading=readingFixture(p);
  reading.summary.text+=' Metadata KM-CASE không được hiển thị.';
  assert.throws(()=>validateReading(reading,p.facts,p.context.selectedTopic,p.context),/Case Engine nội bộ/);
});

test('Mệnh validator also rejects Case Engine metadata leakage',()=>{
  const prepared=prepareMenhReading({birthDateLocal:'1990-01-01',birthTimeMode:'KNOWN',birthTimeLocal:'09:30',tzOffset:7,age:37,annualYear:2026});
  const ctx=writerContextForPrepared(prepared),empty=()=>({text:'',claim_ids:[]});
  const global=ctx.globalStructure,first=ctx.claims[0];
  const overview=global?.active
    ?{text:`Toàn bàn có ${(global.mechanisms||[]).map(x=>x==='FU_YIN'?'Phục Ngâm':x==='FAN_YIN'?'Phản Ngâm':x).join(' + ')}. Đây là lớp ưu tiên phải xét trước và có thể giới hạn/cap tín hiệu cục bộ, nhưng không phải veto xấu tuyệt đối.`,claim_ids:[global.claimId]}
    :{text:'Tổng quan có điều kiện từ Mệnh bàn hiện tại.',claim_ids:[first.claimId]};
  const reading={status:'reading',specVersion:ctx.specVersion,profileId:ctx.profileId,overview,self:empty(),family:empty(),marriage:empty(),career:empty(),wealth:empty(),luck:empty(),annual:empty(),birthTimeNote:empty()};
  reading.overview.text+=' KM-CASE là metadata nội bộ.';
  assert.throws(()=>validateMenhReading(reading,ctx),/Case Engine nội bộ/);
});
