import {validateMenhResult} from '../audit.mjs';
import {MENH_RULE_VERSION,MENH_PROTOCOL} from '../../../menh-core.mjs';
import {SEMANTIC_MATRIX_VERSION,semanticAssemblyRules,semanticDomainForMenh,semanticDomainVocabulary,semanticGuideForBoard} from '../../semantic/matrix.mjs';
import {natalCaseTarget,retrieveCases,writerCaseGuidance} from '../../case/engine.mjs';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const PALACE_CODE=Object.freeze({1:'KAN_1',2:'KUN_2',3:'ZHEN_3',4:'XUN_4',5:'CENTER_5',6:'QIAN_6',7:'DUI_7',8:'GEN_8',9:'LI_9'});
const stem=s=>s?{han:s.han,vi:s.vi,element:s.element}:null;
const entity=x=>x?{id:x.id,han:x.han,vi:x.vi,element:x.element||null,quality:x.quality||null,meaning:x.meaning||null}:null;
function boardFacts(result,birthTimeMode){
  if(birthTimeMode!=='KNOWN')return null;
  const board=result.natal?.baseBoard;if(!board)return null;
  return {
    dun:board.dun,ju:board.ju,yuan:board.yuan,fuYin:board.fuYin===true,fanYin:board.fanYin===true,patterns:{...(board.patterns||{})},
    zhiFu:{star:entity(board.zhiFu?.star),palace:board.zhiFu?.palace??null},
    zhiShi:{door:entity(board.zhiShi?.door),palace:board.zhiShi?.palace??null},
    voidBranches:(board.voidBranches||[]).map(x=>({han:x.han,vi:x.vi})),
    horseBranch:board.horseBranch?{han:board.horseBranch.han,vi:board.horseBranch.vi}:null,
    palaces:(board.palaces||[]).map(p=>({code:PALACE_CODE[p.number]||String(p.number),number:p.number,name:p.vi,direction:p.direction,element:p.element,
      heavenStems:(p.heavenStems||[]).map(stem),earthStem:stem(p.earthStem),star:entity(p.star),door:entity(p.door),spirit:entity(p.spirit),
      carriesQin:p.carriesQin===true,void:p.voided===true,horse:p.horse===true,isDutyStar:p.isDutyStar===true,isDutyDoor:p.isDutyDoor===true})),
  };
}
function luckPhaseWindows(luck){
  if(!luck)return null;const start=luck.ageStart;
  return [
    {ageStart:start,ageEnd:start+4,layer:'NINE_STAR'},
    {ageStart:start+5,ageEnd:start+9,layer:'EIGHT_DOOR'},
    {ageStart:start+10,ageEnd:luck.ageEnd,layer:'TEN_STEM_KE_YING_AND_PALACE_STATE'},
  ];
}
function compactTimePlace(timePlace){
  if(!timePlace)return null;
  return {
    version:timePlace.version||'KM-TIMEPLACE-2.0',mode:timePlace.mode||null,civilTimeBasis:timePlace.civilTimeBasis||null,
    effectiveOffsetHours:timePlace.effectiveOffsetHours??null,timeZone:timePlace.timeZone||null,coordinates:timePlace.coordinates||null,
    solar:timePlace.solar?{
      application:timePlace.solar.application,
      apparentSolarCorrectionMinutes:timePlace.solar.apparentSolarCorrectionMinutes,
      warning:timePlace.solar.warning,
    }:null,
  };
}
function compactAnalysisLayers(result,claimSupport){
  const layers=result.analysisLayers;if(!layers)return null;
  const relevant=new Set(claimSupport.flatMap(x=>x.palaces).map(value=>typeof value==='number'?value:Number(String(value||'').match(/(\d+)$/)?.[1]||0)).filter(Boolean));
  const byPalace=Object.fromEntries(Object.entries(layers.byPalace||{}).filter(([number])=>relevant.has(Number(number))).map(([number,row])=>[
    number,{
      strength:{
        star:{level:row.strength.star.level,status:row.strength.star.status},
        door:row.strength.door?{level:row.strength.door.level,status:row.strength.door.status}:null,
        palace:{level:row.strength.palace.level,status:row.strength.palace.status},
        stems:row.strength.stems.map(x=>({stem:x.stem,carried:x.carried,level:x.capacityWeight>=.8?'mạnh':x.capacityWeight>=.6?'khá mạnh':x.capacityWeight>=.4?'trung bình':x.capacityWeight>=.2?'yếu':'rất yếu',longevity:x.longevity?.vi||null,meaning:x.longevity?.meaning||null})),
      },
      structure:{
        doorRelation:row.structure.doorRelation?.label||null,
        fourHarms:row.structure.fourHarms.map(x=>({code:x.code,stem:x.stem||null,carried:x.carried===true,actorIds:[...(x.actorIds||[])]})),
        stemResponses:row.structure.stemResponses.filter(x=>x.actorIds?.length).map(x=>({pair:x.pair,tone:x.tone,plainMeaning:x.plainMeaning,actorIds:[...x.actorIds],carried:x.carried===true})),
        patterns:row.structure.patterns.map(x=>({id:x.id,tone:x.tone,qualified:x.qualified,plainMeaning:x.plainMeaning})),
      },
    }
  ]));
  return {
    version:layers.version,
    strengthProfile:layers.strengthProfile,
    structureProfile:{version:layers.structureProfile.version,profile:layers.structureProfile.profile,limitations:layers.structureProfile.limitations},
    byPalace,
    roles:(layers.roles||[]).filter(r=>relevant.has(r.palace)).map(r=>({
      id:r.id,label:r.label,palace:r.palace,tier:r.yongshenTier,
      strength:{kind:r.strength.kind,level:r.strength.level,status:r.strength.status,band:r.strength.band,meaning:r.strength.meaning},
      fourHarms:r.fourHarms.map(x=>({code:x.code,stem:x.stem||null,carried:x.carried===true})),
      stemResponses:r.stemResponses.map(x=>({pair:x.pair,tone:x.tone,plainMeaning:x.plainMeaning,carried:x.carried===true})),
    })),
    meaning:layers.meaning,
  };
}
function compactRectification(rectification){
  if(!rectification)return null;
  return {
    version:rectification.version,status:rectification.status,validationStatus:rectification.validationStatus,
    validationCaseCount:rectification.validationCaseCount,accuracyClaimAllowed:false,autoSelectedBirthHour:null,
    annualResolutionOnly:rectification.annualResolutionOnly===true,majorityVoteAllowed:false,
    eventCount:rectification.eventCount,distinctDomains:rectification.distinctDomains,candidateCount:rectification.candidateCount,minimumGate:rectification.minimumGate,
    leadingCandidateId:rectification.leadingCandidateId,runnerUpId:rectification.runnerUpId,
    ranked:(rectification.ranked||[]).slice(0,3).map(r=>({id:r.id,family:r.family,time:r.time,rank:r.rank,supportedEvents:r.supportedEvents,primaryHits:r.primaryHits,secondaryHits:r.secondaryHits})),
    note:rectification.note,
  };
}

export function buildMenhWriterContext(result,{birthTimeMode='KNOWN',stability=null,timePlace=null,rectification=null}={}){
  validateMenhResult(result);
  const claims=result.claims.map(c=>({
    claimId:c.claimId,type:c.type,domain:c.domain,text:c.text,ruleIds:[...c.ruleIds],evidenceIds:[...c.evidenceIds],
  }));
  const evidenceIds=[...new Set(claims.flatMap(c=>c.evidenceIds))];
  const visibleEvidence=(result.evidence||[]).filter(e=>evidenceIds.includes(e.evidenceId));
  const globalHardEvidence=visibleEvidence.filter(e=>e.priorityClass==='GLOBAL_HARD_STRUCTURE');
  const globalClaim=claims.find(c=>c.claimId==='GLOBAL_STRUCTURE')||null;
  const affectedDomains=[...new Set(globalHardEvidence.flatMap(e=>e.affectedDomains||[]))];
  const evidenceById=new Map(visibleEvidence.map(e=>[e.evidenceId,e]));
  const claimSupport=claims.map(c=>{
    const linked=c.evidenceIds.map(id=>evidenceById.get(id)).filter(Boolean);
    const palaces=new Set();
    for(const e of linked){
      if(e.palace&&e.palace!=='GLOBAL')palaces.add(e.palace);
      if(e.metadata?.gengPalace)palaces.add(e.metadata.gengPalace);
    }
    return {claimId:c.claimId,palaces:[...palaces],evidenceIds:[...c.evidenceIds]};
  });
  const natalBoard=result.natal?.baseBoard||null;
  const palaceNumber=value=>typeof value==='number'?value:Number(String(value||'').match(/(\d+)$/)?.[1]||0);
  const semanticClaims=claims.map(claim=>{
    const support=claimSupport.find(x=>x.claimId===claim.claimId),domainId=semanticDomainForMenh(claim.domain);
    const palaceNumbers=[...new Set((support?.palaces||[]).map(palaceNumber).filter(Boolean))];
    const palaces=natalBoard?semanticGuideForBoard(natalBoard,{mode:'destiny',domainId,palaceNumbers}).map(p=>({palace:p.palace,keywords:p.keywords,summary:p.summary,items:p.items.map(i=>({layer:i.layer,name:i.name,tags:i.tags,meaning:i.meaning})),states:p.states.map(s=>({id:s.id,rule:s.rule}))})):[];
    return {claimId:claim.claimId,domainId,palaces};
  });
  const domainIds=[...new Set(semanticClaims.map(x=>x.domainId))],semanticDomains=Object.fromEntries(domainIds.map(id=>[id,semanticDomainVocabulary(id)]));
  const semanticMatrix={version:SEMANTIC_MATRIX_VERSION,mode:'destiny',assemblyRules:semanticAssemblyRules(),domains:semanticDomains,claims:semanticClaims};
  const caseProfile=retrieveCases(natalCaseTarget(result),{limit:4});
  return freeze({
    protocol:MENH_PROTOCOL,
    ruleVersion:MENH_RULE_VERSION,
    runtimeVersion:result.runtimeVersion||MENH_RULE_VERSION,
    specVersion:result.specVersion,
    profileId:result.profileId,
    birthTimeMode,
    natalMeta:{
      sourceEngineVersion:result.natal?.sourceEngineVersion||null,
      center5Lodging:result.natal?.center5Lodging||null,
    },
    domains:result.domains,
    luck:result.luck,
    luckPhaseWindows:luckPhaseWindows(result.luck),
    annual:result.annual,
    outputMode:'COMPREHENSIVE_ONE_SHOT',
    boardFacts:boardFacts(result,birthTimeMode),
    claims,
    claimSupport,
    analysisLayers:birthTimeMode==='KNOWN'?compactAnalysisLayers(result,claimSupport):null,
    timePlace:compactTimePlace(timePlace),
    rectification:birthTimeMode==='UNKNOWN'?compactRectification(rectification):null,
    semanticMatrix,
    caseGuidance:writerCaseGuidance(caseProfile),
    evidence:visibleEvidence.map(e=>({
      evidenceId:e.evidenceId,ruleId:e.ruleId,domain:e.domain,palace:e.palace,mechanism:e.mechanism,effectTag:e.effectTag,
      severity:e.severity,priorityClass:e.priorityClass,affectedDomains:[...(e.affectedDomains||[])],summary:e.metadata?.summary||null,relation:e.relation||null,
      detail:{
        palaceNumber:e.metadata?.palaceNumber??null,
        vertical:e.metadata?.vertical||null,
        gengPalace:e.metadata?.gengPalace||null,
        period:e.metadata?.period||null,
        roles:e.metadata?.roles||null,
      },
    })),
    globalStructure:Object.freeze({
      active:globalHardEvidence.length>0,
      claimId:globalClaim?.claimId||null,
      evidenceIds:Object.freeze(globalHardEvidence.map(e=>e.evidenceId)),
      mechanisms:Object.freeze(globalHardEvidence.map(e=>e.mechanism)),
      affectedDomains:Object.freeze(affectedDomains),
      favorableLocalSignalsMayBeCapped:globalHardEvidence.length>0,
      automaticBadFateVeto:false,
    }),
    allowedClaimIds:claims.map(c=>c.claimId),
    allowedEvidenceIds:evidenceIds,
    stability:birthTimeMode==='UNKNOWN'?stability:null,
    sourceTrace:[...(result.sourceTrace||[])],
    restrictions:Object.freeze({
      rebuildChart:false,
      inventRule:false,
      promoteOptionalTransmission:false,
      alterProfile:false,
      alterEvidence:false,
      overallScore:false,
      probability:false,
      deterministicEventClaims:false,
      solarBoardRewrite:false,
      rectificationAccuracyClaim:false,
      autoSelectBirthHour:false,
    }),
  });
}
