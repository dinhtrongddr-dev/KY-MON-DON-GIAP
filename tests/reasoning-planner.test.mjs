import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
import * as builder from '../dist/qimen/ai/contextBuilder.mjs';
import {relationGraph} from '../dist/qimen/analysis/relationGraph.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {buildQuestionContext} from '../dist/qimen/ai/questionContext.mjs';
import {translateToRealWorld} from '../dist/qimen/ai/realWorld.mjs';
const body={question:'Tôi phải làm gì để giành hợp đồng?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
function bundleFixture(voided=true){
  const p=prepareReading(body),a=structuredClone(p.analysis),self=a.roles.find(r=>r.id==='self');
  const palace=a.palaces.find(p=>p.number===self.palace);
  // Deliberately synthetic analysis-level conjunction; never a replacement board.
  Object.assign(palace,{door:{id:'kai',vi:'Khai Môn',element:'Kim'},star:{id:'fu',vi:'Thiên Phụ',element:'Mộc'},spirit:{id:'chief',vi:'Trực Phù'},voided,horse:false});
  palace.conditions={doorPressure:false,punishment:[],wonderTombs:[]};
  palace.stemPairs=palace.stemPairs.map(s=>({...s,punishment:false,wonderTomb:false}));
  a.patterns.layers={starFanYin:false,doorFanYin:false,starFuYin:false,doorFuYin:false};
  return {p,a,palace};
}
function runFixture(f){
  assert.equal(typeof builder.buildReadingEvidenceGraph,'function','deterministic evidence planner is required');
  return builder.buildReadingEvidenceGraph(f.a,f.p.context.allInOne.questionContext,f.p.context.allInOne.plan,relationGraph(f.a,f.a.roles.map(r=>r.id)));
}
test('Khai plus Void is one conditional bundle with dominance and a realization condition',()=>{
  const f=bundleFixture(),g=runFixture(f),b=g.evidenceBundles.find(b=>b.palace===f.palace.number);
  assert.ok(b.actorIds.includes('self'));assert.equal(b.symbols.door.id,'kai');assert.equal(b.symbols.star.id,'fu');
  const conflict=b.conflicts.find(c=>c.code==='opening_unrealized');assert.ok(conflict);
  assert.equal(conflict.dominant,'realization_condition');assert.ok(conflict.resolution.length>20);
  assert.equal(b.translation.mechanism,'conditional_access');
  const without=runFixture(bundleFixture(false)).evidenceBundles.find(b=>b.palace===f.palace.number);
  assert.ok(!without.conflicts.some(c=>c.code==='opening_unrealized'));
});
test('the same Khai bundle gets four different practical objectives across domains',()=>{
  const f=bundleFixture(false),bundle=runFixture(f).evidenceBundles.find(b=>b.palace===f.palace.number);
  const examples=[['Tôi có ký được hợp đồng không?','giao dịch'],['Tình cảm của tôi sẽ ra sao?','đối thoại'],
    ['Công việc của tôi sẽ ra sao?','công việc'],['Tôi cần tìm người thân thất lạc ở đâu?','tìm kiếm']];
  const meanings=examples.map(([question,expected])=>{
    const result=translateToRealWorld(bundle,buildQuestionContext(question));
    assert.ok(result.objective.includes(expected),`${question}: ${result.objective}`);
    assert.equal(result.mechanism,'access');return result.objective;
  });
  assert.equal(new Set(meanings).size,4);
});
test('planner selects distinct mechanisms, maps every claim to evidence, and leaves people unresolved',()=>{
  const p=prepareReading(body),g=p.context.allInOne.reasoning;assert.ok(g,'deterministic evidence planner is required');
  assert.ok(g.claims.length>=3&&g.claims.length<=6);
  assert.equal(new Set(g.claims.map(c=>c.bundleId)).size,g.claims.length);
  for(const c of g.claims){assert.ok(c.evidenceIds.length>=2);assert.ok(c.evidenceIds.every(id=>Object.hasOwn(p.facts,id)));}
  assert.equal(g.nodes.find(n=>n.id==='customer').palace,null);
  assert.ok(g.relationships.every(e=>!['customer','competitor'].includes(e.from)&&!['customer','competitor'].includes(e.to)));
  for(const r of g.recommendations)assert.ok(g.claims.some(c=>c.id===r.claimId));
});
test('prediction and strategy have different scenario decisions before the writer runs',()=>{
  const a=prepareReading({...body,question:'Tôi có nhận được hợp đồng không?'}),b=prepareReading(body);
  assert.ok(a.context.allInOne.reasoning,'deterministic evidence planner is required');
  const x=a.context.allInOne.reasoning.likelyScenario,y=b.context.allInOne.reasoning.likelyScenario;
  assert.notEqual(x.objective,y.objective);assert.notEqual(x.stages[1].operation,y.stages[1].operation);
  assert.deepEqual(x.stages.map(s=>s.stage),['current','next','outcome']);
  assert.equal(y.stages[1].dependsOn,'current');assert.equal(y.stages[2].dependsOn,'next');
  assert.deepEqual(a.chart,b.chart);
});
test('a carried stem tomb is not attributed to the self representative',()=>{
  const f=bundleFixture(false),self=f.a.roles.find(r=>r.id==='self');
  f.palace.stemPairs=[{heaven:{han:self.stem},punishment:false,wonderTomb:false},{heaven:{han:self.stem==='丁'?'乙':'丁'},punishment:false,wonderTomb:true,carried:true}];
  const g=runFixture(f),b=g.evidenceBundles.find(b=>b.palace===self.palace);
  assert.ok(!b.states.some(s=>s.code==='tomb'&&s.actorIds.includes('self')));
});
test('directional graph analysis changes agency and required checks instead of treating links as decorations',()=>{
  const f=bundleFixture(false);
  assert.equal(typeof builder.buildReadingEvidenceGraph,'function');
  const graph=relationGraph(f.a,f.a.roles.map(r=>r.id)),edge=graph.relations.find(e=>e.from==='self'&&e.to==='event');
  const evaluate=type=>builder.buildReadingEvidenceGraph(f.a,f.p.context.allInOne.questionContext,f.p.context.allInOne.plan,
    {...graph,relations:graph.relations.map(e=>e.id===edge.id?{...e,type,samePalace:false}:e)});
  const fed=evaluate('generate'),pressed=evaluate('controlled_by');
  assert.ok(fed.interactions,'relationships must affect the programmatic interpretation');
  assert.equal(fed.interactions.find(i=>i.edgeId===edge.id).mechanism,'resource_commitment');
  assert.equal(pressed.interactions.find(i=>i.edgeId===edge.id).mechanism,'external_condition');
  assert.notDeepEqual(fed.likelyScenario.agency,pressed.likelyScenario.agency);
});
test('explicit business and negotiation modes choose different operations before any AI prompt',()=>{
  const business=prepareReading({...body,mode:'business'}).context.allInOne.reasoning;
  const negotiation=prepareReading({...body,mode:'negotiation'}).context.allInOne.reasoning;
  assert.ok(business.likelyScenario.modeDecision,'mode engine decisions must reach the scenario');
  assert.notEqual(business.likelyScenario.modeDecision.operation,negotiation.likelyScenario.modeDecision.operation);
  assert.ok(business.likelyScenario.modeDecision.inputs.closing);
  assert.ok(negotiation.likelyScenario.modeDecision.inputs.concessions);
});
test('supplied decision makers survive bundle ranking and writer graph edges have both endpoints',()=>{
  for(const mode of ['business','prediction']) {
    const p=prepareReading({...body,mode,actors:{decisionMaker:'乙丑',customer:'壬子',competitor:'丁卯'}});
    const g=p.context.allInOne.reasoning,w=buildWriterContext(p.context).readingGraph;
    for(const id of ['self','event','decisionMaker','customer','competitor']) {
      const role=p.analysis.roles.find(r=>r.id===id),bundle=g.evidenceBundles.find(b=>b.actorIds.includes(id));
      assert.ok(bundle,`${id} must not disappear during ranking`);assert.equal(bundle.palace,role.palace);
      const node=w.nodes.find(n=>n.id===id);assert.ok(node);assert.equal(node.stem,role.stem);
      assert.deepEqual(node.specialStates,g.nodes.find(n=>n.id===id).specialStates);
    }
    assert.ok(g.evidenceBundles.length<=6);
    assert.ok(w.relationships.every(e=>w.nodes.some(n=>n.id===e.from)&&w.nodes.some(n=>n.id===e.to)));
    assert.ok(g.evidenceBundles.some(b=>b.actorIds.includes('service'))||mode!=='business');
  }
});
test('a goal-critical opening in Void can govern the scenario even outside self and event',()=>{
  const p=prepareReading({...body,question:'Tôi có nhận được hợp đồng không?',mode:'prediction',input:{...body.input,day:1,hour:12}});
  const g=p.context.allInOne.reasoning,s=g.likelyScenario;
  const opportunity=g.evidenceBundles.find(b=>b.actorIds.includes('opportunity'));
  assert.equal(opportunity.palace,1);assert.ok(opportunity.conflicts.some(c=>c.code==='opening_unrealized'));
  assert.ok(g.evidenceBundles.filter(b=>b.actorIds.includes('self')||b.actorIds.includes('event')).every(b=>b.palace===6));
  assert.equal(s.mainConflict?.claimId,`claim_${opportunity.palace}`);
  assert.equal(s.mainConflict.code,'opening_unrealized');assert.equal(s.primaryJudgment.stance,'requires_realization');
  assert.ok(s.primaryJudgment.claimIds.includes(s.mainConflict.claimId));
  assert.ok(s.stages[2].claimIds.includes(s.mainConflict.claimId));
  assert.ok(g.recommendations.some(r=>r.claimId===s.mainConflict.claimId));
});
test('the first action preserves the dominant resolution when its bundle has several conflicts',()=>{
  const p=prepareReading({...body,mode:'business',input:{...body.input,day:1,hour:4}});
  const g=p.context.allInOne.reasoning,conflict=g.likelyScenario.mainConflict;
  assert.equal(conflict.code,'movement_held');assert.equal(g.recommendations[0].claimId,conflict.claimId);
  assert.equal(g.recommendations[0].requires,conflict.resolution);
});
