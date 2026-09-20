import {buildPresentationProfile} from './presentation.mjs';
import {SEMANTIC_MATRIX_VERSION,semanticAssemblyRules,semanticDomainForTopic,semanticDomainVocabulary,semanticGuideForBoard} from '../semantic/matrix.mjs';
import {classifyTopics} from './classifier.mjs';

export function buildWriterContext(context) {
  const c=context.allInOne,g=c.reasoning,q=c.questionContext;
  const wantedEdges=new Set([...g.likelyScenario.stages.flatMap(s=>s.relationshipIds),...g.likelyScenario.agency.map(i=>i.edgeId)]);
  const ids=new Set(g.claims.flatMap(x=>x.evidenceIds));
  for(const id of ['patterns','duty','day','hour','relation','time','method','boundary'])if(context.facts[id])ids.add(id);
  const evidence=Object.fromEntries([...ids].filter(id=>context.facts[id]).map(id=>[id,context.facts[id]]));
  const relationships=g.relationships.filter(e=>wantedEdges.has(e.id));
  const actors=new Set([...g.evidenceBundles.flatMap(b=>b.actorIds),...relationships.flatMap(e=>[e.from,e.to])]);
  const readingGraph={schemaVersion:g.schemaVersion,
    questionContext:{domain:q.domain,domainLabel:q.domainLabel,questionType:q.questionType,intent:q.intent,desiredOutcome:q.desiredOutcome,outcomeTarget:q.outcomeTarget,
      subject:{kind:q.subject.kind,text:q.subject.text,status:q.subject.status},stage:q.stage,timeHorizon:q.timeHorizon,
      constraints:q.constraints,userStatements:q.userStatements,options:q.options,stakeholders:q.stakeholders,direction:q.direction,
      clarificationQuestions:q.clarificationQuestions,vocabulary:q.vocabulary,needsClarification:q.needsClarification},
    mode:g.mode,usefulGodProfile:g.usefulGodProfile,strengthProfile:g.strengthProfile,structureProfile:g.structureProfile,nodes:g.nodes.filter(n=>actors.has(n.id)||n.status==='unresolved').map(n=>({id:n.id,actorId:n.actorId,role:n.semanticRole,source:n.source,evidenceIds:n.evidenceIds,relevance:n.relevance,confidenceLevel:n.confidenceLevel,palace:n.palace,stem:n.stem||null,status:n.status,
      element:n.element,door:n.door,star:n.star,deity:n.deity,strength:n.strength,specialStates:n.specialStates,selectionRule:n.selectionRule,limitations:n.limitations,
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
      doorRelation:b.doorRelation,structurePriority:b.structurePriority,specialPatterns:b.specialPatterns})),
    claims:g.claims.map(claim=>({...claim,realWorldManifestation:{status:claim.realWorldManifestation.status,concepts:claim.realWorldManifestation.concepts}})),
    rules:g.rules,outcomeDimensions:g.outcomeDimensions,eventStages:g.eventStages,primaryJudgment:g.primaryJudgment,timing:g.timing,
    likelyScenario:g.likelyScenario,recommendations:g.recommendations,unresolved:g.unresolved,coverage:g.coverage};
  const comparisons=(c.comparison?.ranking||c.plan.computed.ranking||[]).map(row=>({id:row.id,label:row.label,rank:row.rank,blockers:row.blockers,supports:row.supports,fit:row.fit,note:row.note}));
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
  const semanticPalaces=semanticGuideForBoard(c.board,{mode:'event',domainId:semanticDomainId,secondaryDomainId,palaceNumbers:[...new Set(g.evidenceBundles.map(b=>b.palace))]}).map(p=>({palace:p.palace,keywords:p.keywords,summary:p.summary,items:p.items.map(i=>({layer:i.layer,name:i.name,tags:i.tags,meaning:i.meaning})),states:p.states.map(s=>({id:s.id,rule:s.rule}))}));
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
    readingGraph,evidence,comparisons,comparisonConvention:c.comparison?.convention||c.plan.computed.convention||null,
    semanticMatrix,warnings:context.warnings,unsupported:context.unsupported,presentation,
    layout:concise?'concise':'full',
    coverage:{required:[...(coverageByMode[c.classification.mode]||[]),...(deep?['role_specific_modifiers','directed_relationships','counterfactual_check','action_provenance']:[])]},
    length:{depth:q.depth,target:deep?deepTarget[c.classification.mode]||'600–1100':targetByMode[c.classification.mode]||'350–750',
      minWords:concise?70:180,maxWords:deep?1800:1000,
      counting:'Số đơn vị cách nhau bởi khoảng trắng trong phần văn luận; không tính căn cứ kỹ thuật và bảng so sánh.'}};
}
