import {CASE_LIBRARY,CASE_LIBRARY_VERSION,CASE_RETENTION_POLICY} from './library.mjs';

export const CASE_ENGINE_VERSION='KM-CASE-1.0';
export const CASE_RETRIEVAL_PROFILE='PROVENANCE_ADAPTATION_BOUNDED';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const uniq=xs=>[...new Set((xs||[]).filter(Boolean))];
const includesAll=(haystack,needles)=>needles.every(x=>haystack.includes(x));
const overlap=(a,b)=>{const set=new Set(a);return b.filter(x=>set.has(x)).length;};

export function validateCaseLibrary(library=CASE_LIBRARY){
  if(!Array.isArray(library)||!library.length)throw new Error('KM-CASE: thư viện case rỗng.');
  const ids=new Set();
  for(const c of library){
    if(!c||typeof c!=='object'||!c.caseId||ids.has(c.caseId))throw new Error('KM-CASE: caseId thiếu hoặc trùng.');
    ids.add(c.caseId);
    if(!['event','natal'].includes(c.product))throw new Error('KM-CASE: product không hợp lệ ở '+c.caseId);
    if(!c.provenance?.kind||!c.provenance?.verification||!c.provenance?.sourceRef)throw new Error('KM-CASE: thiếu provenance ở '+c.caseId);
    if(c.provenance.observedOutcome===true&&!c.provenance.outcomeEvidence)throw new Error('KM-CASE: outcome case phải có outcomeEvidence riêng ở '+c.caseId);
    if(!c.match||!c.guidance)throw new Error('KM-CASE: thiếu match/guidance ở '+c.caseId);
    for(const key of ['assembly','adaptation','avoid'])if(!Array.isArray(c.guidance[key]))throw new Error('KM-CASE: guidance '+key+' phải là mảng ở '+c.caseId);
    if(!Array.isArray(c.guidance.principleIds)||!c.guidance.principleIds.length)throw new Error('KM-CASE: thiếu principleIds ở '+c.caseId);
  }
  return true;
}
validateCaseLibrary();

function hardMatch(c,target){
  const m=c.match,issues=[];
  if(m.domains?.length&&!m.domains.includes(target.domain))issues.push('domain');
  if(m.modes?.length&&!m.modes.includes(target.mode))issues.push('mode');
  if(m.stages?.length&&!m.stages.includes(target.stage))issues.push('stage');
  if(m.requiredRoles?.length&&!includesAll(target.roles,m.requiredRoles))issues.push('required_roles');
  if(m.requiredSecondaryDomains?.length&&!includesAll(target.secondaryDomains,m.requiredSecondaryDomains))issues.push('secondary_domains');
  if(m.requiredUnresolvedRoles?.length&&!includesAll(target.unresolvedRoles,m.requiredUnresolvedRoles))issues.push('unresolved_roles');
  if(m.requiredGlobalPatterns?.length&&!includesAll(target.globalPatterns,m.requiredGlobalPatterns))issues.push('global_patterns');
  if(m.requiredClaims?.length&&!includesAll(target.claims,m.requiredClaims))issues.push('claims');
  if(m.requiredTiming===true&&target.hasTiming!==true)issues.push('timing');
  if(m.requiredAnnual===true&&target.hasAnnual!==true)issues.push('annual');
  return issues;
}
function scoreCase(c,target){
  const hard=hardMatch(c,target);if(hard.length)return null;
  const m=c.match;let matched=0,possible=0,adaptationCost=0;const adaptationNeeds=[];
  const exact=(present,w=1)=>{possible+=w;if(present)matched+=w;};
  if(m.domains?.length)exact(m.domains.includes(target.domain),3);
  if(m.modes?.length)exact(m.modes.includes(target.mode),1.5);
  if(m.stages?.length)exact(m.stages.includes(target.stage),2);
  if(m.requiredRoles?.length)exact(includesAll(target.roles,m.requiredRoles),2);
  if(m.requiredSecondaryDomains?.length)exact(includesAll(target.secondaryDomains,m.requiredSecondaryDomains),1.5);
  if(m.requiredUnresolvedRoles?.length)exact(includesAll(target.unresolvedRoles,m.requiredUnresolvedRoles),1.5);
  if(m.requiredGlobalPatterns?.length)exact(includesAll(target.globalPatterns,m.requiredGlobalPatterns),2);
  if(m.requiredClaims?.length)exact(includesAll(target.claims,m.requiredClaims),2);
  if(m.requiredTiming===true)exact(target.hasTiming===true,2);
  if(m.requiredAnnual===true)exact(target.hasAnnual===true,2);
  if(m.preferredRoles?.length){
    const ratio=overlap(target.roles,m.preferredRoles)/m.preferredRoles.length;possible+=1.5;matched+=1.5*ratio;
    if(ratio<1){adaptationCost+=1-ratio;adaptationNeeds.push('Không đủ toàn bộ vai phụ của case tham chiếu; chỉ chuyển nguyên tắc, không chuyển kết luận.');}
  }
  if(m.preferredAnswerClasses?.length){
    const ok=m.preferredAnswerClasses.includes(target.answerClass);possible+=1;matched+=ok?1:0;
    if(!ok){adaptationCost+=1;adaptationNeeds.push('Mức kết luận hiện tại khác case tham chiếu; tuyệt đối giữ primaryJudgment của bàn hiện tại.');}
  }
  const similarity=possible?matched/possible:0.5;
  if(target.product==='event'&&target.secondaryDomains.length&&!(m.requiredSecondaryDomains||[]).length){
    adaptationCost+=0.25;adaptationNeeds.push('Target có domain phụ; chỉ dùng guidance nào không làm mất thứ bậc domain hiện tại.');
  }
  const fitBand=similarity>=0.86&&adaptationCost<=0.25?'direct':similarity>=0.68&&adaptationCost<=1?'close':'contextual';
  return {caseId:c.caseId,similarity:Number(similarity.toFixed(3)),adaptationCost:Number(adaptationCost.toFixed(3)),fitBand,
    priority:Number(c.priority)||0,specificity:possible,adaptationNeeds,case:c};
}
function conflictProfile(rows){
  const seen=new Map(),conflicts=[];
  for(const row of rows)for(const id of row.case.guidance.principleIds){
    if(!seen.has(id))seen.set(id,row.caseId);else if(seen.get(id)!==row.caseId)continue;
  }
  return {detected:conflicts.length>0,items:conflicts};
}

export function retrieveCases(target,{limit=3,library=CASE_LIBRARY}={}){
  if(!target||!['event','natal'].includes(target.product))throw new Error('KM-CASE: target không hợp lệ.');
  const ranked=library.filter(c=>c.product===target.product).map(c=>scoreCase(c,target)).filter(Boolean)
    .filter(row=>row.similarity>=0.5&&row.adaptationCost<=1.75)
    .sort((a,b)=>b.similarity-a.similarity||a.adaptationCost-b.adaptationCost||b.priority-a.priority||b.specificity-a.specificity||a.caseId.localeCompare(b.caseId))
    .slice(0,Math.max(0,limit));
  const conflict=conflictProfile(ranked);
  return freeze({
    version:CASE_ENGINE_VERSION,
    libraryVersion:CASE_LIBRARY_VERSION,
    profile:CASE_RETRIEVAL_PROFILE,
    product:target.product,
    targetSummary:{
      domain:target.domain||null,mode:target.mode||null,stage:target.stage||null,answerClass:target.answerClass||null,
      roles:uniq(target.roles),secondaryDomains:uniq(target.secondaryDomains),unresolvedRoles:uniq(target.unresolvedRoles),
      globalPatterns:uniq(target.globalPatterns),claims:uniq(target.claims),hasTiming:target.hasTiming===true,hasAnnual:target.hasAnnual===true
    },
    retrieved:ranked.map(row=>freeze({
      caseId:row.caseId,
      fitBand:row.fitBand,
      similarity:row.similarity,
      adaptationCost:row.adaptationCost,
      adaptationNeeds:Object.freeze(row.adaptationNeeds),
      provenance:row.case.provenance,
      principles:row.case.guidance.principleIds,
      guidance:row.case.guidance
    })),
    conflictDetected:conflict.detected,
    conflictItems:Object.freeze(conflict.items),
    verdictOverrideAllowed:false,
    majorityVoteAllowed:false,
    probabilityAllowed:false,
    outcomeCalibrationAllowed:ranked.some(r=>r.case.provenance.observedOutcome===true),
    retentionPolicy:CASE_RETENTION_POLICY,
    meaning:'Case chỉ là tiền lệ phương pháp để lắp luận và kiểm tra guardrail. Kết luận, Dụng Thần, cấu trúc, strength, vai và timing của bàn hiện tại luôn có quyền ưu tiên; case không phải phiếu bầu hay xác suất.'
  });
}

export function eventCaseTarget({analysis,questionContext,selected=[],primaryJudgment=null,timing=null}){
  const roles=uniq(selected.flatMap(b=>b.actorIds));
  const unresolvedRoles=uniq((analysis.roles||[]).filter(r=>r.status==='unresolved').map(r=>r.id));
  const globalPatterns=uniq([
    ...(analysis.patterns?.layers?.starFuYin||analysis.patterns?.layers?.doorFuYin?['FU_YIN']:[]),
    ...(analysis.patterns?.layers?.starFanYin||analysis.patterns?.layers?.doorFanYin?['FAN_YIN']:[])
  ]);
  return freeze({
    product:'event',
    domain:questionContext.domain,
    mode:questionContext.mode,
    questionType:questionContext.questionType,
    stage:questionContext.outcomeTarget?.stageAsked||null,
    answerClass:primaryJudgment?.answerClass||null,
    roles,
    secondaryDomains:uniq(analysis.yongshenProfile?.secondaryDomains||[]),
    unresolvedRoles,
    globalPatterns,
    claims:[],
    hasTiming:questionContext.mode==='timing'||Boolean(timing?.allowedPredictions?.length||timing?.candidates?.length),
    hasAnnual:false
  });
}

export function natalCaseTarget(result){
  const board=result.natal?.baseBoard;
  return freeze({
    product:'natal',
    domain:null,mode:null,questionType:null,stage:null,answerClass:null,
    roles:[],
    secondaryDomains:[],
    unresolvedRoles:[],
    globalPatterns:uniq([...(board?.fuYin?['FU_YIN']:[]),...(board?.fanYin?['FAN_YIN']:[])]),
    claims:uniq((result.claims||[]).map(c=>c.claimId)),
    hasTiming:false,
    hasAnnual:Boolean(result.annual)
  });
}

export function proposeCaseRetention(target,{sourceRef=null,humanReviewed=false,observedOutcome=false,outcomeEvidence=null}={}){
  if(!target||!['event','natal'].includes(target.product))throw new Error('KM-CASE retain: target không hợp lệ.');
  const eligible=Boolean(sourceRef&&humanReviewed&&(!observedOutcome||outcomeEvidence));
  return freeze({
    version:'KM-CASE-RETENTION-CANDIDATE/1',
    status:eligible?'READY_FOR_MANUAL_LIBRARY_REVIEW':'REVIEW_REQUIRED',
    autoRetained:false,
    questionTextStored:false,
    sourceRef:sourceRef||null,
    humanReviewed:humanReviewed===true,
    observedOutcome:observedOutcome===true,
    outcomeEvidenceRecorded:Boolean(outcomeEvidence),
    sanitizedSignature:{
      product:target.product,domain:target.domain||null,mode:target.mode||null,stage:target.stage||null,answerClass:target.answerClass||null,
      roles:uniq(target.roles),secondaryDomains:uniq(target.secondaryDomains),unresolvedRoles:uniq(target.unresolvedRoles),
      globalPatterns:uniq(target.globalPatterns),claims:uniq(target.claims),hasTiming:target.hasTiming===true,hasAnnual:target.hasAnnual===true
    },
    requirements:Object.freeze([
      'Human review bắt buộc trước khi thêm vào source-controlled case library.',
      'Phải có provenance/sourceRef độc lập.',
      'Nếu dùng case để đánh giá outcome, phải có outcomeEvidence ngoài lời luận Kỳ Môn.',
      'Không tự lưu nguyên văn câu hỏi hoặc dữ liệu phiên người dùng.'
    ])
  });
}

export function writerCaseGuidance(caseProfile){
  if(!caseProfile)return null;
  return freeze({
    version:caseProfile.version,
    profile:caseProfile.profile,
    role:'assembly_guidance_only',
    verdictOverrideAllowed:false,
    majorityVoteAllowed:false,
    probabilityAllowed:false,
    outcomeCalibrationAllowed:caseProfile.outcomeCalibrationAllowed===true,
    cases:caseProfile.retrieved.map(row=>freeze({
      applicability:row.fitBand==='direct'?'trực tiếp':row.fitBand==='close'?'gần':'cần thích nghi',
      observedOutcome:row.provenance.observedOutcome===true,
      assembly:row.guidance.assembly,
      adaptation:[...row.adaptationNeeds,...row.guidance.adaptation],
      avoid:row.guidance.avoid
    })),
    retention:{
      mode:caseProfile.retentionPolicy.mode,
      autoRetainUserSessions:false,
      storesQuestionText:false,
      requiresHumanReview:true
    },
    meaning:'Dùng các case như checklist cách lắp luận. Không được nhắc case/provenance trong văn người dùng, không mượn outcome cũ và không đổi kết luận của planner.'
  });
}
