import test from 'node:test';import assert from 'node:assert/strict';
import {classifyQuestion,classifyTopics} from '../dist/qimen/ai/classifier.mjs';
import {prepareReading,buildReadingRequest,readingIdentity,validateReading,assertCompatible,instructionsFor} from '../local/reading.mjs';
import {readingFixture} from './reading-fixture.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';
const body={question:'Báo giá dự án cần chuẩn bị gì?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
test('auto classifies the requested examples and preserves explicit choices',()=>{
  for(const [q,m] of [['Tuần sau tôi có nhận được dự án không?','prediction'],['Tôi phải làm gì để lấy được dự án?','strategy'],
    ['Đối thủ hiện có lợi thế hơn tôi không?','business'],['Tôi nên nói gì và nhượng đến đâu khi gặp khách?','negotiation'],
    ['Ngày nào nên gửi báo giá?','timing'],['Tôi nên đi hướng nào để gặp khách?','direction']]) {
    assert.equal(classifyQuestion(q).mode,m);assert.equal(classifyQuestion(q.normalize('NFD')).mode,m);
    assert.equal(classifyQuestion(q,'strategy').mode,'strategy');
  }
  assert.equal(classifyQuestion('Khi nào có kết quả?').mode,'prediction');assert.throws(()=>classifyQuestion('x','not-mode'));
});
test('domain classifier does not confuse tiến/tiên with tiền after accent normalization',()=>{
  for(const q of ['Việc này có tiến triển không?','Tôi sẽ tiến hành ký hồ sơ.','Tiến độ hiện tại thế nào?','Tôi nên ưu tiên phương án nào?','Tôi muốn thăng tiến trong công việc.']){
    const topics=classifyTopics(q);assert.equal(topics.includes('money'),false,q);
  }
  assert.ok(classifyTopics('Tôi có đủ tiền và thu nhập để nghỉ việc không?').includes('money'));
  assert.ok(classifyTopics('Dong tien kinh doanh co du duy tri khong?').includes('money'));
});
test('graph edges have correct endpoints and unresolved actors never acquire invented edges',()=>{
  const p=prepareReading({...body,mode:'business'}),c=p.context.allInOne;
  assert.ok(c.graph.nodes.find(n=>n.id==='customer').palace===null);
  for(const e of c.graph.relations){
    assert.ok(p.facts[e.id]);assert.notEqual(c.graph.nodes.find(n=>n.id===e.from).palace,null);
    const actual=c.analysis.relations.find(r=>r.from===e.fromPalace&&r.to===e.toPalace);assert.equal(e.text,actual.text);
  }
  assert.ok(!c.graph.relations.some(e=>[e.from,e.to].includes('competitor')));
});
test('four modes bind different plans/prompts to the same board and produce validated complete chains',async()=>{
  const readings=await Promise.all(['prediction','strategy','business','negotiation'].map(mode=>buildReadingRequest({...body,mode})));
  assert.equal(new Set(readings.map(p=>p.chartFingerprint)).size,1);assert.equal(new Set(readings.map(p=>p.requestFingerprint)).size,4);
  assert.equal(new Set(readings.map(p=>instructionsFor(p.context))).size,4);
  for(const p of readings){const r=readingFixture(p);assert.equal(validateReading(r,p.facts,'contract',p.context),r);}
  const changed=structuredClone(readings[0]);changed.context.allInOne.graph.relations[0].type='forged';
  assert.notEqual((await readingIdentity(changed)).requestFingerprint,readings[0].requestFingerprint);
  assert.throws(()=>assertCompatible({rules:'TG-CB-3.0',protocol:3,caseRules:CASE_ENGINE_VERSION}));
  assert.throws(()=>assertCompatible({rules:'TG-CB-6.3',protocol:5}));
});
test('wrong mode, reordered steps, unrelated evidence and invented graph links fail closed',()=>{
  const p=prepareReading({...body,mode:'business'});
  for(const mutate of [r=>r.mode='strategy',r=>r.development.reverse(),r=>r.development.pop(),
    r=>r.development[0].interaction_ids=['graph_customer_competitor'],r=>r.summary.claim_ids=['time'],
    r=>r.confidence=99]) {
    const r=readingFixture(p);mutate(r);assert.throws(()=>validateReading(r,p.facts,'contract',p.context));
  }
});
