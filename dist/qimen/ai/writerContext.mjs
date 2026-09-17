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
    mode:g.mode,nodes:g.nodes.filter(n=>actors.has(n.id)||n.status==='unresolved').map(n=>({id:n.id,actorId:n.actorId,role:n.semanticRole,source:n.source,evidenceIds:n.evidenceIds,relevance:n.relevance,confidenceLevel:n.confidenceLevel,palace:n.palace,stem:n.stem||null,status:n.status,
      element:n.element,door:n.door,star:n.star,deity:n.deity,strength:n.strength,specialStates:n.specialStates,selectionRule:n.selectionRule,limitations:n.limitations})),
    relationships,interactions:g.interactions.filter(i=>wantedEdges.has(i.edgeId)),
    evidenceBundles:g.evidenceBundles.map(b=>({id:b.id,palace:b.palace,actorIds:b.actorIds,symbols:b.symbols,strength:b.strength,states:b.states,specialPatterns:b.specialPatterns})),
    claims:g.claims.map(claim=>({...claim,realWorldManifestation:{status:claim.realWorldManifestation.status,concepts:claim.realWorldManifestation.concepts}})),
    rules:g.rules,outcomeDimensions:g.outcomeDimensions,eventStages:g.eventStages,primaryJudgment:g.primaryJudgment,timing:g.timing,
    likelyScenario:g.likelyScenario,recommendations:g.recommendations,unresolved:g.unresolved,coverage:g.coverage};
  const comparisons=(c.comparison?.ranking||c.plan.computed.ranking||[]).map(row=>({id:row.id,label:row.label,rank:row.rank,blockers:row.blockers,supports:row.supports,fit:row.fit,note:row.note}));
  const simple=context.question.length<90&&!['timing','direction','business','negotiation'].includes(c.classification.mode);
  const concise=q.depth==='standard'&&context.question.length<=180&&['prediction','diagnosis'].includes(q.questionType)&&!['timing','direction'].includes(c.classification.mode)&&!q.options?.length;
  return {rules:context.rules,question:context.question,topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:q.questionType,
    readingGraph,evidence,comparisons,comparisonConvention:c.comparison?.convention||c.plan.computed.convention||null,
    warnings:context.warnings,unsupported:context.unsupported,
    layout:concise?'concise':'full',
    coverage:{required: q.depth==='deep'?['goal_evidence','counterevidence','role_specific_modifiers','directed_relationships','all_event_stages','action_provenance']:['goal_evidence','stage_distinction','decisive_condition']},
    length:{depth:q.depth,target:q.depth==='deep'?'Theo số cụm và mâu thuẫn, thường 500–1000':concise?'120–300':simple?'ngắn gọn theo độ phức tạp':'400–700',
      minWords:concise?40:180,maxWords:q.depth==='deep'?1400:800,
      counting:'Số đơn vị cách nhau bởi khoảng trắng trong phần văn luận; không tính căn cứ kỹ thuật và bảng so sánh.'}};
}
