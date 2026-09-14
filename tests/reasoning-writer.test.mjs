import test from 'node:test';import assert from 'node:assert/strict';
import {prepareReading,buildReadingRequest,validateReading} from '../local/reading.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {readingFixture,clarificationFixture} from './reading-fixture.mjs';
const body={question:'Tôi phải làm gì để giành hợp đồng trong 1 tháng tới?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
test('writer contract accepts linked sections with planner claims and rejects fabricated references',()=>{
  const p=prepareReading(body),r=readingFixture(p);assert.equal(validateReading(r,p.facts,'general',p.context),r);
  for(const mutate of [r=>r.summary.claim_ids=['claim_99'],r=>r.actions[0].recommendation_id='action_99',r=>r.development.reverse(),r=>r.questionType='prediction',r=>r.bottleneck.resolution='',r=>r.comparisons=[{id:'timing_99',reason:'Không có ứng viên này.'}]]){
    const invalid=structuredClone(r);mutate(invalid);assert.throws(()=>validateReading(invalid,p.facts,'general',p.context));
  }
});
test('relevance audit blocks repeated passages and invented numerical certainty',()=>{
  const p=prepareReading(body);
  assert.doesNotThrow(()=>validateReading(readingFixture(p),p.facts,'general',p.context));
  for(const mutate of [r=>r.development[1].text=r.development[0].text,r=>r.summary.text='Bạn chắc chắn có tỷ lệ thành công 95%.',r=>r.situation.text+=' Khách sẽ trả 850 triệu đồng.',r=>r.actions[0].text='Hãy cố gắng.',r=>r.summary.text='rất tốt '.repeat(1000)]){
    const r=readingFixture(p);mutate(r);assert.throws(()=>validateReading(r,p.facts,'general',p.context));
  }
});
test('every rendered condition, resolution, comparison and clarification is checked for invented claims',()=>{
  for(const mode of ['auto','direction']) {
    const p=prepareReading({...body,mode});
    assert.doesNotThrow(()=>validateReading(readingFixture(p),p.facts,'general',p.context));
    const slots=[r=>r.development[1],r=>r.bottleneck,...(mode==='direction'?[r=>r.comparisons[0]]:[])];
    const keys=['condition','resolution',...(mode==='direction'?['reason']:[])];
    for(const [i,slot] of slots.entries())for(const claim of ['Khách sẽ thanh toán 850 triệu đồng sau khi các bên xác nhận đầy đủ điều kiện.',
      'Hai bên sẽ ký kết vào 30/12/2027 sau khi thống nhất các đầu mục.',
      'Khả năng chốt thành công có xác suất 99% khi điều kiện được đáp ứng.']) {
      const r=readingFixture(p);slot(r)[keys[i]]=claim;
      assert.throws(()=>validateReading(r,p.facts,'general',p.context),undefined,`${mode}: ${keys[i]} must be audited`);
    }
    for(const field of ['summary','questions']) {
      const r=clarificationFixture(p),claim='Khách sẽ trả 850 triệu đồng; bạn đang hỏi cho ai?';
      if(field==='summary')r.summary.text=claim;else r.questions[0]=claim;
      assert.throws(()=>validateReading(r,p.facts,'general',p.context));
    }
  }
});
test('writer receives a compact planner and one repair preserves its facts, identity and cancellation budget',async()=>{
  const p=prepareReading(body),seen=[];
  const result=await interpretReading(p,{runner:async(_instructions,context,_schema,{signal})=>{
    seen.push(context);assert.equal(signal.aborted,false);
    const r=readingFixture(p);if(seen.length===1)r.summary.claim_ids=['invented'];return r;
  }});
  assert.equal(result.status,'reading');assert.equal(seen.length,2);
  assert.ok(seen[0].readingGraph);assert.equal(seen[0].allInOne,undefined);assert.equal(seen[0].board,undefined);
  assert.deepEqual(seen[0].readingGraph,seen[1].readingGraph);assert.equal(seen[0].question,p.context.question);
  assert.ok(JSON.stringify(seen[0]).length<JSON.stringify(p.context).length/2);
});
test('depth changes reading identity while preserving the board; clarification stays short',async()=>{
  const a=await buildReadingRequest(body),b=await buildReadingRequest({...body,depth:'deep'});
  assert.equal(a.chartFingerprint,b.chartFingerprint);assert.notEqual(a.requestFingerprint,b.requestFingerprint);
  assert.equal(b.request.depth,'deep');assert.equal((await buildReadingRequest(b.request)).requestFingerprint,b.requestFingerprint);
  const r=clarificationFixture(a);assert.equal(validateReading(r,a.facts,'general',a.context),r);
});
