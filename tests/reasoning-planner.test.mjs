import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
import * as builder from '../dist/qimen/ai/contextBuilder.mjs';
import {relationGraph} from '../dist/qimen/analysis/relationGraph.mjs';
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
