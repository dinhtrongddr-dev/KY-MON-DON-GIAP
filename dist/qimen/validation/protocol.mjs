export const VALIDATION_VERSION='KM-VALIDATION-1.0';
export const OUTCOME_REGISTRY_VERSION='KM-OUTCOME-REGISTRY-1.0';
export const VALIDATION_SNAPSHOT_SCHEMA='QimenValidationSnapshot/1';
export const OBSERVED_OUTCOME_SCHEMA='QimenObservedOutcome/1';

export const OUTCOME_REGISTRY_POLICY=Object.freeze({
  autoRegisterReadings:false,
  autoCollectOutcomes:false,
  storesQuestionText:false,
  storesBirthDate:false,
  storesEvidenceBody:false,
  storesFreeTextOutcomeNotes:false,
  writesCaseLibrary:false,
  probabilityCalibrationAllowed:false,
  brierScoreAllowed:false,
  logLossAllowed:false,
  predictiveValidityClaimAllowed:false,
  manualReviewRequired:true,
  independentOutcomeEvidenceRequiredForBenchmark:true
});

const TRACKS=new Set(['MONITORING','BLIND_HOLDOUT']);
const OUTCOME_CLASSES=new Set(['OBSERVED','NOT_OBSERVED','INDETERMINATE','CANCELLED_EXTERNAL']);
const SOURCE_KINDS=new Set(['system_record','document_record','public_record','manual_attestation']);
const DAY=86_400_000;
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const iso=ms=>new Date(ms).toISOString();
const finiteMs=value=>{
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(typeof value==='string'&&value.trim()){const ms=Date.parse(value);if(Number.isFinite(ms))return ms;}
  return null;
};
const cleanText=(value,max=240)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';
const OPAQUE_REF=/^[A-Za-z0-9][A-Za-z0-9._:\/?#=&%+~@-]{2,}$/;
const opaqueRef=(value,max=240)=>{
  if(typeof value!=='string')return null;
  const v=value.trim();
  if(!v||v.length>max||/\s/.test(v)||!OPAQUE_REF.test(v))return null;
  return v;
};

function civilInstant(input){
  if(!input||!Number.isInteger(input.year)||!Number.isInteger(input.month)||!Number.isInteger(input.day)||!Number.isInteger(input.hour)||!Number.isInteger(input.minute)||!Number.isFinite(input.tzOffset))throw new Error('KM-VALIDATION: thiếu thời điểm bàn hợp lệ.');
  return Date.UTC(input.year,input.month-1,input.day,input.hour,input.minute)-input.tzOffset*3_600_000;
}
function localCivilMs(input){return Date.UTC(input.year,input.month-1,input.day,input.hour,input.minute);}
function localToUtc(localMs,offset){return localMs-offset*3_600_000;}
function endOfLocalDay(localMs){const d=new Date(localMs);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-1;}
function addDuration(localMs,amount,unit){
  const d=new Date(localMs);
  if(unit==='day')return localMs+amount*DAY;
  if(unit==='week')return localMs+amount*7*DAY;
  if(unit==='month')return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+amount,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes());
  if(unit==='year')return Date.UTC(d.getUTCFullYear()+amount,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes());
  return null;
}
function resolveRelative(localMs,code){
  const d=new Date(localMs),y=d.getUTCFullYear(),m=d.getUTCMonth(),day=d.getUTCDate(),dow=d.getUTCDay();
  const mondayOffset=(dow+6)%7;
  if(code==='today')return endOfLocalDay(localMs);
  if(code==='tomorrow')return Date.UTC(y,m,day+2)-1;
  if(code==='this_week')return Date.UTC(y,m,day-mondayOffset+7)-1;
  if(code==='next_week')return Date.UTC(y,m,day-mondayOffset+14)-1;
  if(code==='this_month')return Date.UTC(y,m+1,1)-1;
  if(code==='next_month')return Date.UTC(y,m+2,1)-1;
  return null;
}
export function resolveObservationWindow(timeHorizon,boardInput){
  const startMs=civilInstant(boardInput),localMs=localCivilMs(boardInput),offset=boardInput.tzOffset;
  let dueLocal=null,basis='UNRESOLVED';
  if(timeHorizon?.status==='explicit_duration'&&Number.isFinite(timeHorizon.amount)&&timeHorizon.amount>0){
    dueLocal=addDuration(localMs,timeHorizon.amount,timeHorizon.unit);basis='EXPLICIT_DURATION';
  }else if(timeHorizon?.status==='explicit_relative'){
    dueLocal=resolveRelative(localMs,timeHorizon.code);basis=dueLocal==null?'UNRESOLVED':'EXPLICIT_RELATIVE';
  }
  const dueMs=dueLocal==null?null:localToUtc(dueLocal,offset);
  return freeze({
    status:dueMs==null?'NO_SCORABLE_HORIZON':'RESOLVED',
    basis,
    startAt:iso(startMs),
    dueAt:dueMs==null?null:iso(dueMs),
    source:{status:timeHorizon?.status||'unknown',code:timeHorizon?.code||'unknown',amount:Number.isFinite(timeHorizon?.amount)?timeHorizon.amount:null,unit:timeHorizon?.unit||null}
  });
}
function classifyPrediction(answerClass){
  if(answerClass==='conditional_positive')return {kind:'DIRECTIONAL',outcomeClass:'OBSERVED',abstentionReason:null};
  if(answerClass==='negative'||answerClass==='conditional_negative')return {kind:'DIRECTIONAL',outcomeClass:'NOT_OBSERVED',abstentionReason:null};
  if(answerClass==='conditional')return {kind:'ABSTAIN',outcomeClass:null,abstentionReason:'CONDITIONAL'};
  if(answerClass==='needs_clarification')return {kind:'ABSTAIN',outcomeClass:null,abstentionReason:'NEEDS_CLARIFICATION'};
  return {kind:'ABSTAIN',outcomeClass:null,abstentionReason:'UNRESOLVED'};
}
function temporalIntegrity(boardAt,capturedAt){
  const delta=capturedAt-boardAt;
  if(boardAt>capturedAt+5*60_000)return {status:'FUTURE_BOARD_TIME',deltaMs:delta,benchmarkEligible:false};
  if(Math.abs(delta)<=30*60_000)return {status:'PROSPECTIVE',deltaMs:delta,benchmarkEligible:true};
  return {status:'RETROSPECTIVE',deltaMs:delta,benchmarkEligible:false};
}
export function buildValidationSnapshot(prepared,{capturedAt=Date.now(),track='MONITORING',evaluationUnitRef=null}={}){
  if(!prepared?.requestFingerprint||!prepared?.chartFingerprint||!prepared?.context?.allInOne?.reasoning?.primaryJudgment)throw new Error('KM-VALIDATION: cần buildReadingRequest đã có fingerprint.');
  if(!TRACKS.has(track))throw new Error('KM-VALIDATION: track không hợp lệ.');
  const capturedMs=finiteMs(capturedAt);if(capturedMs==null)throw new Error('KM-VALIDATION: capturedAt không hợp lệ.');
  const qc=prepared.context.allInOne.questionContext,pj=prepared.context.allInOne.reasoning.primaryJudgment;
  const boardInput=prepared.timePlace?.boardInput||prepared.chart?.input;
  const boardAt=civilInstant(boardInput),window=resolveObservationWindow(qc.timeHorizon,boardInput);
  const prediction=classifyPrediction(pj.answerClass),temporal=temporalIntegrity(boardAt,capturedMs);
  const dueMs=finiteMs(window.dueAt),unitRef=opaqueRef(evaluationUnitRef,96);
  if(evaluationUnitRef!=null&&!unitRef)throw new Error('KM-VALIDATION: evaluationUnitRef phải là mã opaque 6–96 ký tự, không chứa khoảng trắng.');
  const horizonMaturesAfterCapture=dueMs!=null&&dueMs>capturedMs;
  const benchmarkEligibleAtCapture=temporal.benchmarkEligible&&horizonMaturesAfterCapture&&!!unitRef;
  return freeze({
    schemaVersion:VALIDATION_SNAPSHOT_SCHEMA,
    validationVersion:VALIDATION_VERSION,
    registryVersion:OUTCOME_REGISTRY_VERSION,
    track,
    evaluationUnitRef:unitRef,
    capturedAt:iso(capturedMs),
    chartAt:iso(boardAt),
    requestFingerprint:prepared.requestFingerprint,
    chartFingerprint:prepared.chartFingerprint,
    rules:prepared.request?.rules||prepared.context?.rules||null,
    protocol:prepared.request?.protocol??null,
    caseRules:prepared.request?.caseRules||null,
    nianmingRules:prepared.request?.nianmingRules||null,
    target:{domain:qc.domain,mode:qc.mode,questionType:qc.questionType,intent:qc.intent,stageAsked:pj.stageAsked,dimension:pj.dimension},
    judgment:{answerClass:pj.answerClass,stageAsked:pj.stageAsked,dimension:pj.dimension,prediction},
    observationWindow:window,
    temporalIntegrity:temporal,
    eligibility:{
      benchmarkEligibleAtCapture,
      directional:prediction.kind==='DIRECTIONAL',
      horizonResolved:dueMs!=null,
      horizonMaturesAfterCapture,
      reason:benchmarkEligibleAtCapture?'PROSPECTIVE_WITH_HORIZON_AND_UNIT':
        !temporal.benchmarkEligible?temporal.status:
        dueMs==null?'NO_SCORABLE_HORIZON':
        !horizonMaturesAfterCapture?'HORIZON_ALREADY_MATURED':
        prediction.kind==='ABSTAIN'?prediction.abstentionReason:
        !unitRef?'MISSING_EVALUATION_UNIT':'UNSUPPORTED'
    },
    privacy:{questionTextStored:false,birthDateStored:false,userStatementsStored:false,aiProseStored:false,evaluationUnitOpaque:true},
    policy:OUTCOME_REGISTRY_POLICY
  });
}
export function normalizeOutcomeSubmission(snapshot,submission,{recordedAt=Date.now()}={}){
  if(snapshot?.schemaVersion!==VALIDATION_SNAPSHOT_SCHEMA)throw new Error('KM-OUTCOME: snapshot không hợp lệ.');
  if(!submission||typeof submission!=='object'||Array.isArray(submission))throw new Error('KM-OUTCOME: dữ liệu outcome không hợp lệ.');
  const outcomeClass=submission.outcomeClass;
  if(!OUTCOME_CLASSES.has(outcomeClass))throw new Error('KM-OUTCOME: outcomeClass không hợp lệ.');
  const sourceKind=submission.sourceKind;
  if(!SOURCE_KINDS.has(sourceKind))throw new Error('KM-OUTCOME: sourceKind không hợp lệ.');
  const sourceRef=opaqueRef(submission.sourceRef,240);
  if(!sourceRef)throw new Error('KM-OUTCOME: sourceRef phải là mã/URL tham chiếu opaque, không phải nội dung bằng chứng thô.');
  const recordedMs=finiteMs(recordedAt);if(recordedMs==null)throw new Error('KM-OUTCOME: recordedAt không hợp lệ.');
  const capturedMs=finiteMs(snapshot.capturedAt),dueMs=finiteMs(snapshot.observationWindow?.dueAt);
  const observedMs=finiteMs(submission.observedAt)??recordedMs;
  if(observedMs<capturedMs)throw new Error('KM-OUTCOME: outcome/evidence có trước snapshot; không đủ tính prospective.');
  if(observedMs>recordedMs+5*60_000)throw new Error('KM-OUTCOME: observedAt nằm trong tương lai.');
  if(outcomeClass==='OBSERVED'&&dueMs!=null&&observedMs>dueMs)throw new Error('KM-OUTCOME: sự kiện xảy ra sau deadline phải ghi NOT_OBSERVED cho cửa sổ đã khóa.');
  if(outcomeClass==='NOT_OBSERVED'&&dueMs!=null&&recordedMs<dueMs)throw new Error('KM-OUTCOME: chưa tới deadline nên chưa thể xác nhận NOT_OBSERVED.');
  const humanReviewed=submission.humanReviewed===true,independentOfReading=submission.independentOfReading===true;
  const externalSource=sourceKind!=='manual_attestation';
  const scorableClass=['OBSERVED','NOT_OBSERVED'].includes(outcomeClass);
  const benchmarkEligible=Boolean(snapshot.eligibility?.benchmarkEligibleAtCapture===true&&scorableClass&&humanReviewed&&independentOfReading&&externalSource);
  const verificationStatus=benchmarkEligible?'VERIFIED_BENCHMARK':humanReviewed&&scorableClass?'REVIEWED_DESCRIPTIVE':humanReviewed?'REVIEWED_EXCLUDED':'REVIEW_REQUIRED';
  return freeze({
    schemaVersion:OBSERVED_OUTCOME_SCHEMA,
    registryVersion:OUTCOME_REGISTRY_VERSION,
    outcomeClass,
    observedAt:iso(observedMs),
    recordedAt:iso(recordedMs),
    sourceKind,
    sourceRef,
    humanReviewed,
    independentOfReading,
    externalSource,
    verificationStatus,
    benchmarkEligible,
    lateOccurrenceRef:submission.lateOccurrenceRef==null?null:(opaqueRef(submission.lateOccurrenceRef,160)||(()=>{throw new Error('KM-OUTCOME: lateOccurrenceRef phải là mã opaque, không phải mô tả sự việc.');})())
  });
}
const safeRatio=(n,d)=>d?Number((n/d).toFixed(4)):null;
function summarizeRows(rows){
  const benchmark=rows.filter(r=>r.outcome?.benchmarkEligible===true);
  const directional=benchmark.filter(r=>r.snapshot.judgment.prediction.kind==='DIRECTIONAL');
  const abstained=benchmark.filter(r=>r.snapshot.judgment.prediction.kind==='ABSTAIN');
  const matched=directional.filter(r=>r.snapshot.judgment.prediction.outcomeClass===r.outcome.outcomeClass);
  const confusion={predictedObserved_observed:0,predictedObserved_notObserved:0,predictedNotObserved_observed:0,predictedNotObserved_notObserved:0};
  for(const r of directional){
    const p=r.snapshot.judgment.prediction.outcomeClass,o=r.outcome.outcomeClass;
    if(p==='OBSERVED'&&o==='OBSERVED')confusion.predictedObserved_observed++;
    else if(p==='OBSERVED'&&o==='NOT_OBSERVED')confusion.predictedObserved_notObserved++;
    else if(p==='NOT_OBSERVED'&&o==='OBSERVED')confusion.predictedNotObserved_observed++;
    else if(p==='NOT_OBSERVED'&&o==='NOT_OBSERVED')confusion.predictedNotObserved_notObserved++;
  }
  return {benchmarkOutcomes:benchmark.length,directionalScored:directional.length,abstained:abstained.length,matched:matched.length,mismatched:directional.length-matched.length,coverage:safeRatio(directional.length,benchmark.length),abstentionRate:safeRatio(abstained.length,benchmark.length),historicalAgreementRate:safeRatio(matched.length,directional.length),confusion};
}
function groupSummary(rows,keyFn){
  return Object.fromEntries([...new Set(rows.map(keyFn).filter(Boolean))].sort().map(key=>[key,summarizeRows(rows.filter(r=>keyFn(r)===key))]));
}
export function summarizeValidationRecords(records,{asOf=Date.now()}={}){
  if(!Array.isArray(records))throw new Error('KM-VALIDATION: records phải là mảng.');
  const asOfMs=finiteMs(asOf);if(asOfMs==null)throw new Error('KM-VALIDATION: asOf không hợp lệ.');
  const matured=records.filter(r=>{const due=finiteMs(r.snapshot?.observationWindow?.dueAt);return due!=null&&due<=asOfMs;});
  const withOutcome=records.filter(r=>r.outcome);
  const closedRows=matured;
  const overall=summarizeRows(closedRows);
  const blind=closedRows.filter(r=>r.snapshot?.track==='BLIND_HOLDOUT');
  const directionalN=overall.directionalScored;
  return freeze({
    validationVersion:VALIDATION_VERSION,
    registryVersion:OUTCOME_REGISTRY_VERSION,
    asOf:iso(asOfMs),
    totals:{
      records:records.length,
      prospective:records.filter(r=>r.snapshot?.temporalIntegrity?.status==='PROSPECTIVE').length,
      retrospective:records.filter(r=>r.snapshot?.temporalIntegrity?.status==='RETROSPECTIVE').length,
      horizonResolved:records.filter(r=>r.snapshot?.observationWindow?.status==='RESOLVED').length,
      matured:matured.length,
      withOutcome:withOutcome.length,
      verifiedBenchmark:records.filter(r=>r.outcome?.verificationStatus==='VERIFIED_BENCHMARK').length,
      reviewedDescriptive:records.filter(r=>r.outcome?.verificationStatus==='REVIEWED_DESCRIPTIVE').length,
      pendingReview:records.filter(r=>r.outcome&&r.outcome.verificationStatus==='REVIEW_REQUIRED').length
    },
    selective:overall,
    blindHoldout:summarizeRows(blind),
    byDomain:groupSummary(closedRows,r=>r.snapshot?.target?.domain),
    byStage:groupSummary(closedRows,r=>r.snapshot?.target?.stageAsked),
    reportability:{
      status:directionalN<20?'COUNTS_ONLY':'DESCRIPTIVE_ONLY',
      historicalAgreementRateDisplayAllowed:directionalN>=20,
      minimumDirectionalCasesForRate:20,
      predictiveValidityClaimAllowed:false,
      probabilityCalibrationAllowed:false,
      properScoringAllowed:false,
      meaning:directionalN<20?'Chưa đủ ngưỡng quản trị nội bộ để hiển thị tỷ lệ tổng hợp; chỉ báo số đếm.':'Chỉ được mô tả tỷ lệ khớp lịch sử trên case đã khóa trước outcome. Không gọi đây là xác suất tương lai hay xác nhận tính đúng của Kỳ Môn.'
    },
    policy:OUTCOME_REGISTRY_POLICY
  });
}
