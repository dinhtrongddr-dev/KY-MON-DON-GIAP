import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildReadingRequest} from '../local/reading.mjs';
import {createOutcomeRegistry} from '../local/outcome-registry.mjs';
import {
  VALIDATION_VERSION,OUTCOME_REGISTRY_VERSION,OUTCOME_REGISTRY_POLICY,
  buildValidationSnapshot,normalizeOutcomeSubmission,resolveObservationWindow,summarizeValidationRecords
} from '../dist/qimen/validation/protocol.mjs';
import {CASE_LIBRARY} from '../dist/qimen/case/library.mjs';

const incomeBody={
  input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7},
  question:'Trong tuần này tôi có khoản tiền vào được phát sinh không?',
  topic:'general',mode:'auto',method:'chaibu'
};
const unresolvedBody={
  input:{year:2026,month:9,day:21,hour:10,minute:0,tzOffset:7},
  question:'Trong 30 ngày tới, tôi có ký được hợp đồng A không?',
  topic:'contract',mode:'auto',method:'chaibu'
};

test('Phase 12 versions and policy forbid automatic collection, Case writes and probability calibration',()=>{
  assert.equal(VALIDATION_VERSION,'KM-VALIDATION-1.0');
  assert.equal(OUTCOME_REGISTRY_VERSION,'KM-OUTCOME-REGISTRY-1.0');
  assert.equal(OUTCOME_REGISTRY_POLICY.autoRegisterReadings,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.autoCollectOutcomes,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.storesQuestionText,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.storesBirthDate,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.storesEvidenceBody,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.storesFreeTextOutcomeNotes,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.writesCaseLibrary,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.probabilityCalibrationAllowed,false);
  assert.equal(OUTCOME_REGISTRY_POLICY.predictiveValidityClaimAllowed,false);
});

test('observation windows lock explicit duration and relative week against the original board time',()=>{
  const duration=resolveObservationWindow({status:'explicit_duration',amount:30,unit:'day',code:'duration'},unresolvedBody.input);
  assert.equal(duration.status,'RESOLVED');
  assert.equal(duration.startAt,'2026-09-21T03:00:00.000Z');
  assert.equal(duration.dueAt,'2026-10-21T03:00:00.000Z');
  const week=resolveObservationWindow({status:'explicit_relative',code:'this_week'},incomeBody.input);
  assert.equal(week.status,'RESOLVED');
  assert.equal(week.dueAt,'2026-09-20T16:59:59.999Z');
});

test('conditional-positive becomes a directional snapshot while unresolved abstains instead of being scored as no',async()=>{
  const positive=await buildReadingRequest(incomeBody);
  const positiveSnapshot=buildValidationSnapshot(positive,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-positive'});
  assert.equal(positive.context.allInOne.reasoning.primaryJudgment.answerClass,'conditional_positive');
  assert.equal(positiveSnapshot.judgment.prediction.kind,'DIRECTIONAL');
  assert.equal(positiveSnapshot.judgment.prediction.outcomeClass,'OBSERVED');
  assert.equal(positiveSnapshot.temporalIntegrity.status,'PROSPECTIVE');
  assert.equal(positiveSnapshot.eligibility.benchmarkEligibleAtCapture,true);

  const unresolved=await buildReadingRequest(unresolvedBody);
  const unresolvedSnapshot=buildValidationSnapshot(unresolved,{capturedAt:'2026-09-21T03:04:00Z'});
  assert.equal(unresolved.context.allInOne.reasoning.primaryJudgment.answerClass,'unresolved');
  assert.equal(unresolvedSnapshot.judgment.prediction.kind,'ABSTAIN');
  assert.equal(unresolvedSnapshot.judgment.prediction.outcomeClass,null);
  assert.equal(unresolvedSnapshot.eligibility.reason,'UNRESOLVED');
});


test('directional snapshot without an opaque evaluation unit stays outside benchmark to prevent repeat-outcome inflation',async()=>{
  const p=await buildReadingRequest(incomeBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z'});
  assert.equal(snapshot.judgment.prediction.kind,'DIRECTIONAL');
  assert.equal(snapshot.eligibility.benchmarkEligibleAtCapture,false);
  assert.equal(snapshot.eligibility.reason,'MISSING_EVALUATION_UNIT');
});

test('validation snapshot stores no question text, AI prose, raw birth date or user statements',async()=>{
  const p=await buildReadingRequest({...incomeBody,nianming:{self:'17/07/1994'}});
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-privacy'}),json=JSON.stringify(snapshot);
  assert.doesNotMatch(json,/Trong tuần này|17\/07\/1994|1994-07-17/);
  assert.equal(snapshot.privacy.questionTextStored,false);
  assert.equal(snapshot.privacy.birthDateStored,false);
  assert.equal(snapshot.requestFingerprint,p.requestFingerprint);
});

test('backdated charts are RETROSPECTIVE and can never enter benchmark metrics',async()=>{
  const p=await buildReadingRequest(incomeBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-21T05:00:00Z',evaluationUnitRef:'unit-backdated'});
  assert.equal(snapshot.temporalIntegrity.status,'RETROSPECTIVE');
  assert.equal(snapshot.eligibility.benchmarkEligibleAtCapture,false);
  assert.throws(()=>normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:event-1',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-21T06:00:00Z'}),/có trước snapshot/i);
  const outcome=normalizeOutcomeSubmission(snapshot,{outcomeClass:'NOT_OBSERVED',observedAt:'2026-09-21T05:30:00Z',sourceKind:'system_record',sourceRef:'crm:window-closed',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-21T06:00:00Z'});
  assert.equal(outcome.benchmarkEligible,false);
  assert.equal(outcome.verificationStatus,'REVIEWED_DESCRIPTIVE');
});

test('unknown horizon is kept for monitoring but not treated as a failed forecast',async()=>{
  const p=await buildReadingRequest({...incomeBody,question:'Tôi có khoản tiền vào được phát sinh không?'});
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z'});
  assert.equal(snapshot.observationWindow.status,'NO_SCORABLE_HORIZON');
  assert.equal(snapshot.eligibility.benchmarkEligibleAtCapture,false);
  assert.equal(snapshot.eligibility.reason,'NO_SCORABLE_HORIZON');
});

test('benchmark outcome needs post-snapshot independent external evidence and a human review',async()=>{
  const p=await buildReadingRequest(incomeBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-evidence'});
  assert.throws(()=>normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-15T10:00:00Z',sourceKind:'system_record',sourceRef:'crm:old',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T00:00:00Z'}),/có trước snapshot/i);
  const manual=normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'manual_attestation',sourceRef:'attestation:1',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T01:00:00Z'});
  assert.equal(manual.benchmarkEligible,false);assert.equal(manual.verificationStatus,'REVIEWED_DESCRIPTIVE');
  const verified=normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:payment-created',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T01:00:00Z'});
  assert.equal(verified.benchmarkEligible,true);assert.equal(verified.verificationStatus,'VERIFIED_BENCHMARK');
});

test('an observed event after the locked deadline cannot be rewritten as an in-window hit',async()=>{
  const p=await buildReadingRequest(incomeBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-late'});
  assert.throws(()=>normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-21T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:late',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-21T01:00:00Z'}),/sau deadline/i);
});

test('registry de-duplicates prediction snapshots and locks an observed outcome against overwrite',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'kymon-outcomes-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const file=join(dir,'registry.json');
  const p=await buildReadingRequest(incomeBody);
  let clock=Date.parse('2026-09-16T00:50:00Z');
  const registry=createOutcomeRegistry({filePath:file,now:()=>clock});
  const first=registry.registerPrepared(p,{evaluationUnitRef:'unit-registry'}),second=registry.registerPrepared(p,{evaluationUnitRef:'unit-registry'});
  assert.equal(first.reused,false);assert.equal(second.reused,true);assert.equal(first.record.id,second.record.id);
  clock=Date.parse('2026-09-18T01:00:00Z');
  const row=registry.recordOutcome(first.record.id,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:id1',humanReviewed:true,independentOfReading:true});
  assert.equal(row.outcome.verificationStatus,'VERIFIED_BENCHMARK');
  assert.throws(()=>registry.recordOutcome(first.record.id,{outcomeClass:'NOT_OBSERVED',sourceKind:'system_record',sourceRef:'crm:2',humanReviewed:true,independentOfReading:true}),/đã khóa/i);
  const raw=await readFile(file,'utf8');
  assert.doesNotMatch(raw,/Trong tuần này/);
});



test('registry rejects a second distinct forecast for the same opaque evaluation unit',async()=>{
  const first=await buildReadingRequest(incomeBody);
  const second=await buildReadingRequest({...incomeBody,input:{...incomeBody.input,minute:47}});
  let clock=Date.parse('2026-09-16T00:50:00Z');
  const registry=createOutcomeRegistry({now:()=>clock});
  registry.registerPrepared(first,{evaluationUnitRef:'same-real-world-event'});
  assert.throws(()=>registry.registerPrepared(second,{evaluationUnitRef:'same-real-world-event'}),/evaluationUnitRef đã có snapshot/i);
});

test('early confirmed hits stay out of aggregate rates until the locked window closes',async()=>{
  const p=await buildReadingRequest(incomeBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-early'});
  const hit=normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:early-hit',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T01:00:00Z'});
  const early=summarizeValidationRecords([{id:'cccccccccccccccccccc',snapshot,outcome:hit}],{asOf:'2026-09-18T02:00:00Z'});
  assert.equal(early.totals.withOutcome,1);
  assert.equal(early.totals.matured,0);
  assert.equal(early.selective.directionalScored,0);
  assert.equal(early.selective.historicalAgreementRate,null);
  const closed=summarizeValidationRecords([{id:'cccccccccccccccccccc',snapshot,outcome:hit}],{asOf:'2026-09-21T00:00:00Z'});
  assert.equal(closed.totals.matured,1);
  assert.equal(closed.selective.directionalScored,1);
  assert.equal(closed.selective.historicalAgreementRate,1);
});

test('summary reports selective coverage/agreement as descriptive counts and never enables probability calibration',async()=>{
  const p=await buildReadingRequest(incomeBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-summary'});
  const hit=normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:hit',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-21T00:00:00Z'});
  const miss=normalizeOutcomeSubmission(snapshot,{outcomeClass:'NOT_OBSERVED',sourceKind:'document_record',sourceRef:'document:miss',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-21T00:00:00Z'});
  const report=summarizeValidationRecords([
    {id:'aaaaaaaaaaaaaaaaaaaa',snapshot,outcome:hit},
    {id:'bbbbbbbbbbbbbbbbbbbb',snapshot:{...snapshot,requestFingerprint:'other',track:'BLIND_HOLDOUT'},outcome:miss}
  ],{asOf:'2026-09-21T00:00:00Z'});
  assert.equal(report.selective.directionalScored,2);
  assert.equal(report.selective.matched,1);assert.equal(report.selective.mismatched,1);
  assert.equal(report.selective.coverage,1);assert.equal(report.selective.historicalAgreementRate,0.5);
  assert.equal(report.reportability.status,'COUNTS_ONLY');
  assert.equal(report.reportability.historicalAgreementRateDisplayAllowed,false);
  assert.equal(report.reportability.predictiveValidityClaimAllowed,false);
  assert.equal(report.reportability.probabilityCalibrationAllowed,false);
  assert.equal(report.reportability.properScoringAllowed,false);
});


test('closed abstention cases stay in benchmark denominator so coverage is not forced to 100%',async()=>{
  const p=await buildReadingRequest(unresolvedBody);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-21T03:04:00Z',evaluationUnitRef:'unit-abstain'});
  assert.equal(snapshot.judgment.prediction.kind,'ABSTAIN');
  assert.equal(snapshot.eligibility.benchmarkEligibleAtCapture,true);
  const outcome=normalizeOutcomeSubmission(snapshot,{outcomeClass:'NOT_OBSERVED',sourceKind:'system_record',sourceRef:'crm:abstain1',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-10-22T00:00:00Z'});
  assert.equal(outcome.benchmarkEligible,true);
  const report=summarizeValidationRecords([{id:'dddddddddddddddddddd',snapshot,outcome}],{asOf:'2026-10-22T00:00:00Z'});
  assert.equal(report.selective.benchmarkOutcomes,1);
  assert.equal(report.selective.directionalScored,0);
  assert.equal(report.selective.abstained,1);
  assert.equal(report.selective.coverage,0);
  assert.equal(report.selective.abstentionRate,1);
  assert.equal(report.selective.historicalAgreementRate,null);
});

test('opaque evaluation and evidence refs reject free-text payloads',async()=>{
  const p=await buildReadingRequest(incomeBody);
  assert.throws(()=>buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'đây là nguyên văn sự việc cần hỏi'}),/mã opaque/i);
  const snapshot=buildValidationSnapshot(p,{capturedAt:'2026-09-16T00:50:00Z',evaluationUnitRef:'unit-ref-safe'});
  assert.throws(()=>normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'đây là nội dung bằng chứng đầy đủ',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T01:00:00Z'}),/opaque/i);
  const sanitized=normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:safe1',note:'không được lưu ghi chú tự do',lateOccurrenceRef:'crm:late2',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T01:00:00Z'});
  assert.equal('note' in sanitized,false);assert.equal(sanitized.lateOccurrenceRef,'crm:late2');
  assert.throws(()=>normalizeOutcomeSubmission(snapshot,{outcomeClass:'OBSERVED',observedAt:'2026-09-18T00:00:00Z',sourceKind:'system_record',sourceRef:'crm:safe2',lateOccurrenceRef:'mô tả sự việc xảy ra muộn',humanReviewed:true,independentOfReading:true},{recordedAt:'2026-09-18T01:00:00Z'}),/lateOccurrenceRef.*opaque/i);
});

test('Phase 12 registry cannot mutate or reclassify the KM-CASE seed library',()=>{
  assert.ok(CASE_LIBRARY.every(c=>c.provenance.observedOutcome===false));
  assert.equal(OUTCOME_REGISTRY_POLICY.writesCaseLibrary,false);
});
