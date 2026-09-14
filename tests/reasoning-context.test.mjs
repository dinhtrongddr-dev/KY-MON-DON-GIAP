import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
const base={topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
const prepare=question=>prepareReading({...base,question});
test('intent and commercial domain remain independent on the same unchanged board',()=>{
  const prediction=prepare('Tôi có nhận được hợp đồng không?'),strategy=prepare('Tôi phải làm gì để giành hợp đồng?');
  assert.ok(prediction.context.allInOne.questionContext,'structured question context is required');
  assert.equal(prediction.context.allInOne.questionContext.questionType,'prediction');
  assert.equal(strategy.context.allInOne.questionContext.questionType,'strategy');
  assert.equal(strategy.context.allInOne.questionContext.domain,'business');
  assert.equal(prediction.context.allInOne.questionContext.domain,'business');
  assert.deepEqual(prediction.chart,strategy.chart);
});
test('context retains the source question, company, horizon and relevant industry vocabulary',()=>{
  const question='Công ty tôi làm vệ sinh công nghiệp và tạp vụ, làm cách nào để trong 1 tháng tới ký được hợp đồng?';
  const c=prepare(question).context.allInOne.questionContext;
  assert.ok(c,'structured question context is required');
  assert.equal(c.question,question);assert.equal(c.questionType,'strategy');
  assert.equal(c.subject.kind,'self_company');assert.equal(c.timeHorizon.amount,1);assert.equal(c.timeHorizon.unit,'month');
  assert.ok(c.vocabulary.includes('khảo sát'));assert.ok(c.vocabulary.includes('định biên nhân sự'));
  assert.equal(c.stakeholders.find(s=>s.role==='decisionMaker').status,'possible');
  assert.ok(!JSON.stringify(c).includes('Mowi'));
});
test('domain roles differ without inventing a known counterparty palace',()=>{
  const love=prepare('Tình cảm của tôi và người yêu sẽ diễn biến ra sao?');
  const business=prepare('Tôi phải làm gì để giành hợp đồng?');
  const lost=prepare('Tôi cần tìm người thân thất lạc, nên bắt đầu tìm ở đâu?');
  assert.ok(love.context.allInOne.questionContext,'structured question context is required');
  assert.equal(love.context.allInOne.questionContext.domain,'relationship');
  assert.equal(lost.context.allInOne.questionContext.domain,'search');
  const lr=love.analysis.roles.find(r=>r.id==='opportunity'),br=business.analysis.roles.find(r=>r.id==='opportunity');
  assert.notEqual(lr.semanticRole,br.semanticRole);
  assert.equal(business.analysis.roles.find(r=>r.id==='customer').palace,null);
});
test('explicit business mode still distinguishes a request for strategy from a prediction',()=>{
  const strategy=prepareReading({...base,mode:'business',question:'Tôi phải làm gì để giành hợp đồng?'});
  const prediction=prepareReading({...base,mode:'business',question:'Tôi có nhận được hợp đồng không?'});
  assert.equal(strategy.context.allInOne.questionContext.questionType,'strategy');
  assert.equal(prediction.context.allInOne.questionContext.questionType,'prediction');
});
