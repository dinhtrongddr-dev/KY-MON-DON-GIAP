import {buildPresentationProfile} from './presentation.mjs';
import {SEMANTIC_MATRIX_VERSION,semanticAssemblyRules,semanticDomainForTopic,semanticDomainVocabulary,semanticGuideForBoard} from '../semantic/matrix.mjs';
import {classifyTopics} from './classifier.mjs';
import {writerCaseGuidance} from '../case/engine.mjs';
import {buildNarrativeContract} from './narrativeContract.mjs';

export function buildWriterContext(context) {
  const c=context.allInOne,g=c.reasoning,q=c.questionContext;
  const wantedEdges=new Set([...g.likelyScenario.stages.flatMap(s=>s.relationshipIds),...g.likelyScenario.agency.map(i=>i.edgeId)]);
  const ids=new Set(g.claims.flatMap(x=>x.evidenceIds));
  for(const id of ['patterns','duty','day','hour','relation','time','timeplace','method','boundary','role_frame','spirit_activation'])if(context.facts[id])ids.add(id);
  const evidence=Object.fromEntries([...ids].filter(id=>context.facts[id]).map(id=>[id,context.facts[id]]));
  const relationships=g.relationships.filter(e=>wantedEdges.has(e.id));
  const actors=new Set([...g.evidenceBundles.flatMap(b=>b.actorIds),...relationships.flatMap(e=>[e.from,e.to])]);
  const readingGraph={schemaVersion:g.schemaVersion,
    questionContext:{domain:q.domain,domainLabel:q.domainLabel,questionType:q.questionType,intent:q.intent,desiredOutcome:q.desiredOutcome,outcomeTarget:q.outcomeTarget,
      subject:{kind:q.subject.kind,text:q.subject.text,status:q.subject.status},stage:q.stage,timeHorizon:q.timeHorizon,
      constraints:q.constraints,userStatements:q.userStatements,options:q.options,stakeholders:q.stakeholders,direction:q.direction,
      clarificationQuestions:q.clarificationQuestions,vocabulary:q.vocabulary,needsClarification:q.needsClarification},
    mode:g.mode,spiritActivation:c.spiritActivation||null,timePlace:context.timePlace?{version:context.timePlace.version,mode:context.timePlace.metadata.mode,civilTimeBasis:context.timePlace.metadata.civilTimeBasis,
      effectiveOffsetHours:context.timePlace.metadata.effectiveOffsetHours,timeZone:context.timePlace.metadata.iana?.timeZone||null,
      ianaStatus:context.timePlace.metadata.iana?.status||null,coordinates:context.timePlace.metadata.coordinates,
      solar:context.timePlace.metadata.solar?{application:context.timePlace.metadata.solar.application,apparentSolarCorrectionMinutes:context.timePlace.metadata.solar.apparentSolarCorrectionMinutes,warning:context.timePlace.metadata.solar.warning}:null}:null,
    usefulGodProfile:g.usefulGodProfile,
    roleProfile:{version:g.roleProfile.version,profile:g.roleProfile.profile,hostGuest:g.roleProfile.hostGuest,innerOuter:g.roleProfile.innerOuter,
      roles:g.roleProfile.roles.filter(r=>actors.has(r.id)||r.status==='unresolved'),
      sharedPalaceClusters:g.roleProfile.sharedPalaceClusters.filter(c=>c.roleIds.some(id=>actors.has(id))),
      influences:g.roleProfile.influences.filter(i=>actors.has(i.from)&&actors.has(i.to)),multiActor:g.roleProfile.multiActor,limitations:g.roleProfile.limitations},
    strengthProfile:g.strengthProfile,structureProfile:g.structureProfile,keyingProfile:g.keyingProfile,
    formationProfile:{version:g.formationProfile.version,profile:g.formationProfile.profile,coverage:g.formationProfile.coverage,limitations:g.formationProfile.limitations.slice(1),
      directional:{heavenThreeGates:{status:g.formationProfile.directional.heavenThreeGates.status,termId:g.formationProfile.directional.heavenThreeGates.termId,monthGeneral:g.formationProfile.directional.heavenThreeGates.monthGeneral,hourBranch:g.formationProfile.directional.heavenThreeGates.hourBranch,
        gates:g.formationProfile.directional.heavenThreeGates.gates.map(x=>({id:x.id,name:x.name,landingBranch:x.landingBranch,landingBranchVi:x.landingBranchVi,palace:x.palace,direction:x.direction}))},
        earthFourDoors:{status:g.formationProfile.directional.earthFourDoors.status,hourBranch:g.formationProfile.directional.earthFourDoors.hourBranch,
        doors:g.formationProfile.directional.earthFourDoors.doors.map(x=>({id:x.id,name:x.name,landingBranch:x.landingBranch,landingBranchVi:x.landingBranchVi,palace:x.palace,direction:x.direction}))}}},
    directionProfile:{version:g.directionProfile.version,profile:g.directionProfile.profile,coverage:g.directionProfile.coverage,
      limitations:[g.directionProfile.limitations[0],g.directionProfile.limitations[3],g.directionProfile.limitations[4]]},
    nianmingProfile:{version:g.nianmingProfile.version,profile:g.nianmingProfile.profile,policy:g.nianmingProfile.policy,
      people:g.nianmingProfile.people.map(p=>({id:p.id,label:p.label,status:p.status,active:p.active,inputPrecision:p.inputPrecision,
        yearPillar:p.yearPillar,yearStem:p.yearStem,effectiveStem:p.effectiveStem,hiddenJia:p.hiddenJia??false,palace:p.palace,
        branchReference:p.branchReference,linkedRoleId:p.linkedRoleId,linkedRoleStatus:p.linkedRoleStatus??null,
        linkedRoleRelation:p.linkedRoleRelation,eventRelation:p.eventRelation,snapshot:p.snapshot,evidenceId:p.evidenceId,
        corroboratorOnly:p.corroboratorOnly,limitations:p.limitations}))},nodes:g.nodes.filter(n=>actors.has(n.id)||n.status==='unresolved').map(n=>({id:n.id,actorId:n.actorId,role:n.semanticRole,source:n.source,evidenceIds:n.evidenceIds,relevance:n.relevance,confidenceLevel:n.confidenceLevel,palace:n.palace,stem:n.stem||null,status:n.status,
      element:n.element,door:n.door,star:n.star,deity:n.deity,strength:n.strength,specialStates:n.specialStates,selectionRule:n.selectionRule,limitations:n.limitations,
      party:n.party,zone:n.zone,hostGuest:n.hostGuest,agencyBand:n.agencyBand,agencyMeaning:n.agencyMeaning,evidenceIndependence:n.evidenceIndependence,
      yongshenTier:n.yongshenTier||null,yongshenOrder:n.yongshenOrder||null,yongshenPurpose:n.yongshenPurpose||null,yongshenDomain:n.yongshenDomain||null})),
    relationships,interactions:g.interactions.filter(i=>wantedEdges.has(i.edgeId)),
    evidenceBundles:g.evidenceBundles.map(b=>({id:b.id,palace:b.palace,actorIds:b.actorIds,roles:b.roles,symbols:b.symbols,
      strength:{starLevel:b.strengthProfile.star.level,doorLevel:b.strengthProfile.door?.level||null,palaceLevel:b.strengthProfile.palace.level,
        capacityLevel:b.capacityStrength.level,capacityBand:b.capacityStrength.band,capacityBasis:b.capacityStrength.basis,
        roles:b.capacityStrength.roles.map(r=>({roleId:r.roleId,kind:r.kind,level:r.level,band:r.band,meaning:r.meaning,stem:r.stem||null,
          longevity:r.longevity?{meaning:r.longevity.meaning,direction:r.longevity.direction}:null}))},
      states:b.states,fourHarms:b.fourHarms,
      stemResponses:b.stemResponses.map(r=>({id:r.id,pair:r.pair,tone:r.tone,weight:r.weight,plainMeaning:r.plainMeaning,actorIds:r.actorIds,roleTiers:r.roleTiers,carried:r.carried})),
      structurePatterns:b.structurePatterns.map(r=>({id:r.id,tone:r.tone,qualified:r.qualified??null,plainMeaning:r.plainMeaning,pair:r.pair||null})),
      doorRelation:b.doorRelation,structurePriority:b.structurePriority,
      keying:b.keying?{
        doorDoor:{tone:b.keying.doorDoor.tone,plainMeaning:b.keying.doorDoor.plainMeaning,actorIds:b.keying.doorDoor.actorIds},
        doorStems:b.keying.doorStems.map(x=>({stem:x.stem,tone:x.tone,plainMeaning:x.plainMeaning,actorIds:x.actorIds,carried:x.carried})),
        wonders:b.keying.wonders.map(x=>({stem:x.stem,tone:x.tone,plainMeaning:x.plainMeaning,actorIds:x.actorIds,carried:x.carried})),
        doorPalace:{code:b.keying.doorPalace.code,classicalLabel:b.keying.doorPalace.classicalLabel,plainMeaning:b.keying.doorPalace.plainMeaning},
        starHour:{starVi:b.keying.starHour.starVi,branchVi:b.keying.starHour.branchVi,scope:b.keying.starHour.scope,plainMeaning:b.keying.starHour.plainMeaning},
        meaning:b.keying.meaning
      }:null,
      formation:b.formation?{
        matches:b.formation.matches.map(x=>({id:x.id,name:x.name,family:x.family,qualified:x.qualified,qualificationStatus:x.qualificationStatus,qualificationLimitations:x.qualificationLimitations,qualificationCandidates:x.qualificationCandidates||null,blockers:x.blockers,plainMeaning:x.plainMeaning,uses:x.uses,variant:x.variant,heavenStems:x.heavenStems,earthStem:x.earthStem,actorIds:x.actorIds,stemActorIds:x.stemActorIds})),
        heavenGates:b.formation.heavenGates.map(x=>({id:x.id,name:x.name,landingBranch:x.landingBranch,landingBranchVi:x.landingBranchVi,palace:x.palace,direction:x.direction})),
        earthDoors:b.formation.earthDoors.map(x=>({id:x.id,name:x.name,landingBranch:x.landingBranch,landingBranchVi:x.landingBranchVi,palace:x.palace,direction:x.direction})),
        meaning:b.formation.meaning
      }:null,specialPatterns:b.specialPatterns})),
    claims:g.claims.map(claim=>({...claim,realWorldManifestation:{status:claim.realWorldManifestation.status,concepts:claim.realWorldManifestation.concepts}})),
    rules:g.rules,outcomeDimensions:g.outcomeDimensions,eventStages:g.eventStages,primaryJudgment:g.primaryJudgment,timing:g.timing,
    likelyScenario:g.likelyScenario,recommendations:g.recommendations,unresolved:g.unresolved,coverage:g.coverage};
  const formationMarkersFor=row=>{
    if(Array.isArray(row.formationMarkers))return row.formationMarkers;
    const m=/^direction_(\d+)$/.exec(row.id||'');if(!m)return [];
    const d=g.formationProfile.directional.byPalace?.[Number(m[1])];if(!d)return [];
    return [...(d.heavenGates||[]).map(x=>({id:`heaven_gate_${x.id}`,name:`Thiên Môn ${x.name}`,family:'heaven_three_gates',palace:x.palace,plainMeaning:`Hướng ${x.direction} qua chi ${x.landingBranchVi} là một Thiên Môn truyền thống; chỉ là lớp phương vị bổ sung.`,uses:['directional_overlay']})),
      ...(d.earthDoors||[]).map(x=>({id:`earth_door_${x.id}`,name:`Địa Hộ ${x.name}`,family:'earth_four_doors',palace:x.palace,plainMeaning:`Hướng ${x.direction} qua chi ${x.landingBranchVi} là một Địa Hộ truyền thống; chỉ là lớp phương vị bổ sung.`,uses:['directional_overlay']}))];
  };
  const comparisons=(c.comparison?.ranking||c.plan.computed.ranking||[]).map(row=>({id:row.id,label:row.label,rank:row.rank,blockers:row.blockers,supports:row.supports,fit:row.fit,note:row.note,
    formationMarkers:formationMarkersFor(row).map(x=>({id:x.id,name:x.name,family:x.family,palace:x.palace,plainMeaning:x.plainMeaning,uses:x.uses})),
    directionMarkers:(row.directionMarkers||[]).map(x=>({id:x.id,name:x.name,family:x.family,palace:x.palace,plainMeaning:x.plainMeaning,uses:x.uses})),
    timePlace:row.timePlace?{mode:row.timePlace.mode,effectiveOffsetHours:row.timePlace.effectiveOffsetHours,timeZone:row.timePlace.iana?.timeZone||null}:null}));
  const presentation=buildPresentationProfile(context);
  const concise=presentation.layout==='focused';
  const deep=q.depth==='deep';
  const targetByMode={
    prediction:concise?'180–420':'350–750',
    strategy:'450–850',
    business:'500–900',
    negotiation:'450–850',
    timing:'300–650',
    direction:'300–650'
  };
  const deepTarget={prediction:'600–1100',strategy:'700–1250',business:'750–1350',negotiation:'650–1200',timing:'450–850',direction:'450–850'};
  const semanticDomainId=semanticDomainForTopic(c.resolvedTopic),secondaryDomainId=classifyTopics(context.question).map(semanticDomainForTopic).find(id=>id!==semanticDomainId)||null;
  const compactSemanticRole=x=>x?{name:x.name,meaning:x.meaning,light:x.light,shadow:x.shadow,strength:x.strength}:null;
  const semanticPalaces=semanticGuideForBoard(c.board,{mode:'event',domainId:semanticDomainId,secondaryDomainId,palaceNumbers:[...new Set(g.evidenceBundles.map(b=>b.palace))],analysisPalaces:c.analysis?.palaces||[]}).map(p=>({
    palace:p.palace,keywords:p.keywords,summary:p.summary,states:p.states.map(s=>({id:s.id,rule:s.rule})),strengthExpression:p.strength_expression,
    palaceContext:compactSemanticRole(p.palace_context),actionChannel:compactSemanticRole(p.action_channel),operatingStyle:compactSemanticRole(p.operating_style),hiddenFactor:compactSemanticRole(p.hidden_factor),
    heavenStemExpression:{primary:compactSemanticRole(p.heaven_stem_expression.primary),secondary:p.heaven_stem_expression.secondary.map(compactSemanticRole)},
    earthStemFoundation:compactSemanticRole(p.earth_stem_foundation),domainTranslation:p.domain_translation,associations:p.associations,
    items:p.items.map(i=>({layer:i.layer,role:i.role,name:i.name,meaning:i.meaning,primary:i.primary}))
  }));
  const semanticMatrix={version:SEMANTIC_MATRIX_VERSION,mode:'event',domain:semanticDomainVocabulary(semanticDomainId),secondaryDomain:secondaryDomainId?semanticDomainVocabulary(secondaryDomainId):null,assemblyRules:semanticAssemblyRules(),palaces:semanticPalaces};
  const coverageByMode={
    prediction:['answer_stage','decisive_evidence','counterevidence','outcome_condition'],
    strategy:['current_position','bottleneck','reversible_step','response_signal','stop_or_escalate'],
    business:['commercial_stage','stakeholder_gate','scope_or_price','approval_or_contract','execution_or_cash_distinction'],
    negotiation:['positions','leverage','changeable_condition','concession_limit','next_exchange'],
    timing:['all_candidates','candidate_specific_blockers','relative_fit','no_outcome_date_claim'],
    direction:['origin_and_use','at_least_two_directions','field_constraints','relative_fit']
  };
  return {rules:context.rules,question:context.question,topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:q.questionType,
    readingGraph,evidence,comparisons,narrativeContract:buildNarrativeContract(context),comparisonConvention:c.comparison?.convention||c.plan.computed.convention||null,
    semanticMatrix,caseGuidance:writerCaseGuidance(g.caseProfile),warnings:context.warnings,unsupported:context.unsupported,presentation,
    layout:concise?'concise':'full',
    coverage:{required:[...(coverageByMode[c.classification.mode]||[]),...(deep?['role_specific_modifiers','directed_relationships','counterfactual_check','action_provenance']:[])]},
    length:{depth:q.depth,target:deep?deepTarget[c.classification.mode]||'600–1100':targetByMode[c.classification.mode]||'350–750',
      minWords:concise?70:180,maxWords:deep?1800:1000,
      counting:'Số đơn vị cách nhau bởi khoảng trắng trong phần văn luận; không tính căn cứ kỹ thuật và bảng so sánh.'}};
}
