import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading,buildReadingRequest,validateReading,validateReadingResponse} from '../local/reading.mjs';
import {buildQuestionContext} from '../dist/qimen/ai/questionContext.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {readingFixture} from './reading-fixture.mjs';
import {auditTechnicalText} from '../dist/qimen/ai/technicalAudit.mjs';
const body={question:'Tôi cần chuẩn bị gì cho hợp đồng A trong tháng này?',topic:'contract',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};

test('contract noun does not override response, profit, or negotiation intent',()=>{
  for(const [question,intent] of [['Tôi có nhận được hợp đồng không?','contract'],['Bao giờ có phản hồi về hợp đồng?','reply'],['Hợp đồng này có lợi nhuận không?','profit'],['Tôi nên thương lượng hợp đồng thế nào?','negotiation']])
    assert.equal(buildQuestionContext(question).intent,intent,question);
});

test('business direction as a metaphor is not treated as a geographic bearing',()=>{
  const q=buildQuestionContext('Tôi cần phương hướng kinh doanh để tăng lợi nhuận.');
  assert.equal(q.mode,'strategy');assert.equal(q.direction,null);
});

test('direction requires a reference point and use, and preserves chart identity',async()=>{
  const a=await buildReadingRequest({...body,mode:'direction'});
  assert.equal(a.context.allInOne.questionContext.needsClarification,true);
  assert.deepEqual(a.context.allInOne.plan.computed.ranking,[]);
  const b=await buildReadingRequest({...body,mode:'direction',direction:{origin:'Cửa chính văn phòng',kind:'movement'}});
  assert.equal(b.context.allInOne.questionContext.needsClarification,false);
  assert.equal(b.context.allInOne.plan.computed.ranking.length,8);
  assert.equal(a.chartFingerprint,b.chartFingerprint);
  assert.notEqual(a.requestFingerprint,b.requestFingerprint);
  assert.equal((await buildReadingRequest(b.request)).requestFingerprint,b.requestFingerprint);
});

test('missing direction input is clarified without spending a model call',async()=>{
  const p=prepareReading({...body,mode:'direction'});
  const result=await interpretReading(p,{runner:async()=>{assert.fail('Missing material input should be handled before the model');}});
  assert.equal(result.status,'needs_clarification');
  assert.ok(result.questions.some(q=>q.includes('quy chiếu')));
  assert.doesNotThrow(()=>validateReading(result,p.facts,body.topic,p.context));
});

test('role selections and claims expose rule provenance and limits',()=>{
  const p=prepareReading(body),g=p.context.allInOne.reasoning;
  assert.ok(p.analysis.roles.every(r=>r.selectionRule?.id&&r.selectionRule.verification&&r.limitations.length));
  assert.ok(g.claims.every(c=>c.ruleIds.length&&c.limitations.length&&Array.isArray(c.counterEvidenceIds)));
});

test('a narrow response question can use a short functional reading without invented stages',()=>{
  const p=prepareReading({...body,question:'Bao giờ có phản hồi về hợp đồng?'}),r=readingFixture(p);
  r.summary.text='**Chưa đủ căn cứ xác định lúc có phản hồi.** Cần kiểm tra điều kiện chuyển bước trước khi gắn một thời điểm cụ thể.';
  r.situation={text:'',claim_ids:[]};r.development=[];r.alternative={text:'',claim_ids:[],id:''};r.timing={text:'',claim_ids:[]};
  r.bottleneck.text='Điều kiện còn chưa được xác nhận nên **chưa thể ấn định thời điểm phản hồi**.';
  r.bottleneck.resolution='Xác nhận với đầu mối rằng câu hỏi đã đến đúng người và cần bổ sung gì.';
  r.actions=r.actions.slice(0,1);r.actions[0].text='**Hỏi đầu mối đã nhận thông tin chưa và dự kiến phản hồi khi nào**; nếu chưa có lịch, thống nhất mốc liên hệ lại.';
  assert.doesNotThrow(()=>validateReading(r,p.facts,'contract',p.context));
});

test('confirmed asked-on-behalf mapping changes representative but never recalculates the board',async()=>{
  const request={...body,question:'Tôi hỏi thay em trai, có nhận được công việc không?'};
  const a=await buildReadingRequest(request),b=await buildReadingRequest({...request,subject:{label:'Em trai',pillar:'甲子'}});
  assert.equal(a.analysis.roles.find(r=>r.id==='self').palace,null);
  assert.equal(a.context.allInOne.questionContext.needsClarification,true);
  assert.equal(b.context.allInOne.questionContext.needsClarification,false);
  assert.equal(b.analysis.roles.find(r=>r.id==='self').status,'user_supplied');
  assert.equal(a.chartFingerprint,b.chartFingerprint);assert.notEqual(a.requestFingerprint,b.requestFingerprint);
  assert.equal((await buildReadingRequest(b.request)).requestFingerprint,b.requestFingerprint);
});

test('timing candidates retain the explicitly confirmed on-behalf representative',()=>{
  const p=prepareReading({...body,question:'Hỏi thay em trai nên ký hợp đồng ngày nào?',mode:'timing',subject:{label:'Em trai',pillar:'甲子'},candidates:['2026-09-10T10:00','2026-09-11T10:00']});
  for(const row of p.context.allInOne.comparison.candidates)assert.equal(row.rolePalaces.find(r=>r.id==='self').basis,'甲子');
});

test('wrong technical facts are rejected even when valid claim ids accompany them',()=>{
  const p=prepareReading(body);
  const invalid=['Sinh Môn nằm ở cung 5.','Thiên Nhậm ở cung 5.','Thần Trực Phù ở cung 5.','Thiên can Mậu ở cung 5.','Áp dụng rule_invented để kết luận.','Khách hàng là Thời can.'];
  for(const text of invalid){const r=readingFixture(p);r.summary.text+=' '+text;assert.throws(()=>validateReading(r,p.facts,'contract',p.context),undefined,text);}
  const palace=p.analysis.palaces.find(p=>!p.voided),r=readingFixture(p);
  r.summary.text+=` Cung ${palace.number} có Tuần Không.`;
  assert.throws(()=>validateReading(r,p.facts,'contract',p.context));
});

test('known location is accepted only with evidence that supports that location',()=>{
  const p=prepareReading(body),g=p.context.allInOne.reasoning,claim=g.claims[0],palace=p.analysis.palaces.find(x=>`claim_${x.number}`===claim.id);
  const r=readingFixture(p);r.summary.text+=` ${palace.door.vi} nằm ở cung ${palace.number}.`;
  r.summary.claim_ids=[...new Set([...r.summary.claim_ids,claim.id])];
  assert.doesNotThrow(()=>validateReading(r,p.facts,'contract',p.context));
  const unsupported=p.analysis.palaces.find(x=>!r.summary.claim_ids.includes(`claim_${x.number}`));
  assert.ok(unsupported);
  r.summary.text+=` ${unsupported.door.vi} nằm ở cung ${unsupported.number}.`;
  assert.throws(()=>validateReading(r,p.facts,'contract',p.context));
});

test('invented hidden motives and event assertions are blocked',()=>{
  const p=prepareReading(body);
  for(const text of ['Khách hàng đang chờ giám đốc ký.','Đối thủ bí mật mua chuộc người duyệt.','Công ty đang thiếu vốn.','Bạn chắc chắn thành công.']){
    const r=readingFixture(p);r.summary.text+=' '+text;assert.throws(()=>validateReading(r,p.facts,'contract',p.context),undefined,text);
  }
  const r=readingFixture(p);r.summary.text+=' Có thể cần chờ phê duyệt; hãy xác nhận với đầu mối đang trao đổi.';
  assert.doesNotThrow(()=>validateReading(r,p.facts,'contract',p.context));
});

test('Cấn and Càn remain distinct and reverse state assertions use real palace data',()=>{
  const p=prepareReading(body),palace=p.analysis.palaces.find(p=>p.number===8);
  const errors=auditTechnicalText(`${palace.door.vi} ở cung Cấn 8.`,p.context.allInOne.reasoning.claims.map(c=>c.id),p.context);
  assert.ok(!errors.some(s=>s.includes('Sai vị trí')),errors.join(' '));
  const clear=p.analysis.palaces.find(p=>!p.voided),r=readingFixture(p);
  r.summary.text+=` Tuần Không ở cung ${clear.number}.`;
  assert.throws(()=>validateReading(r,p.facts,body.topic,p.context));
});

test('comparison prose rejects false technical facts and invented events in both ranking modes',()=>{
  for(const mode of ['timing','direction']){
    const p=prepareReading({...body,mode,candidates:['2026-09-10T10:00','2026-09-11T10:00'],direction:{origin:'Cửa chính văn phòng',kind:'movement'}});
    assert.doesNotThrow(()=>validateReading(readingFixture(p),p.facts,body.topic,p.context));
    for(const text of ['Sinh Môn nằm ở cung 5.','Áp dụng rule_invented để chọn ứng viên.','Khách hàng đang chờ giám đốc ký.']){
      const r=readingFixture(p);r.comparisons[0].reason+=' '+text;
      assert.throws(()=>validateReading(r,p.facts,body.topic,p.context),undefined,mode+': '+text);
    }
  }
});

test('timing comparison facts use the candidate board instead of the question board',()=>{
  const p=prepareReading({...body,mode:'timing',candidates:['2026-09-10T10:00','2026-09-11T14:00']});
  const c=p.context.allInOne,candidate=c.comparison.candidates.find(row=>row.details.some(d=>row.board.palaces.find(p=>p.number===d.number).door!==c.board.palaces.find(p=>p.number===d.number).door.vi));
  assert.ok(candidate,'Fixture must contain a candidate whose relevant door moves');
  const n=candidate.details.find(d=>candidate.board.palaces.find(p=>p.number===d.number).door!==c.board.palaces.find(p=>p.number===d.number).door.vi).number;
  const r=readingFixture(p),row=r.comparisons.find(row=>row.id===candidate.id),original=row.reason;
  row.reason+=` ${candidate.board.palaces.find(p=>p.number===n).door} nằm ở cung ${n}.`;
  assert.doesNotThrow(()=>validateReading(r,p.facts,body.topic,p.context));
  row.reason=original+` ${c.board.palaces.find(p=>p.number===n).door.vi} nằm ở cung ${n}.`;
  assert.throws(()=>validateReading(r,p.facts,body.topic,p.context));
});

test('after one unsuccessful repair return only independently recomputable verified content',async()=>{
  const p=await buildReadingRequest(body);let count=0;
  const reading=await interpretReading(p,{runner:async()=>{count++;return {invented:'Khách hàng chắc chắn ký.'};}});
  assert.equal(count,2);assert.equal(reading.status,'verified_fallback');
  const data={rules:p.context.rules,protocol:p.request.protocol,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading};
  assert.doesNotThrow(()=>validateReadingResponse(data,p));
  assert.ok(!JSON.stringify(reading).includes('Khách hàng chắc chắn ký'));
  reading.summary.text+=' Bịa thêm nội dung.';
  assert.throws(()=>validateReadingResponse(data,p));
});
