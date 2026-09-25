import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading,validateReading} from '../local/reading.mjs';
import {interpretReading} from '../local/interpret.mjs';
import {readingFixture} from './reading-fixture.mjs';
import {prepareMenhReading,writerContextForPrepared} from '../dist/menh-reading-core.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {MENH_READING_SECTIONS} from '../dist/qimen/menh/ai/schema.mjs';
import {auditSynthesis} from '../dist/qimen/ai/synthesisAudit.mjs';

const body={question:'Tôi phải làm gì để giành hợp đồng trong 1 tháng tới?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
function structuredReading(p){
  const r=readingFixture(p);
  for(const s of [r.summary,r.situation,...r.development,r.bottleneck,r.alternative,r.timing]){
    s.meaning=s.text;s.technicalEvidence=[];delete s.text;
  }
  return r;
}
test('structured question readings validate both meaning and hidden evidence without changing their shape',()=>{
  const p=prepareReading(body),r=structuredReading(p);
  assert.equal(validateReading(r,p.facts,'general',p.context),r);
  for(const technical of ['Khách sẽ thanh toán 850 triệu đồng.','Kim sinh Mộc.','Bạn chắc chắn sẽ nhận hợp đồng.']){
    const bad=structuredClone(r);bad.summary.technicalEvidence=[technical];
    assert.throws(()=>validateReading(bad,p.facts,'general',p.context),undefined,technical);
  }
  for(const mutate of [s=>s.technicalEvidence='hidden',s=>s.technicalEvidence=[null],s=>s.meaning=null,s=>s.text='unvalidated alias',s=>s.technicalEvidence=[''],s=>s.claim_ids=['invented']]){
    const bad=structuredClone(r);mutate(bad.summary);
    assert.throws(()=>validateReading(bad,p.facts,'general',p.context));
  }
});
test('certainty repair updates structured meaning while preserving its original evidence',async()=>{
  const p=prepareReading(body),base=structuredReading(p);let calls=0;
  base.summary.meaning+=' Công ty chắc chắn sẽ nhận hợp đồng.';
  base.summary.technicalEvidence=['Kim sinh Thủy.'];
  const result=await interpretReading(p,{runner:async()=>{calls++;return structuredClone(base);}});
  assert.equal(calls,2);assert.equal(result.status,'reading');
  assert.doesNotMatch(result.summary.meaning,/chắc chắn sẽ/);
  assert.match(result.summary.meaning,/có khả năng/);
  assert.deepEqual(result.summary.technicalEvidence,base.summary.technicalEvidence);
  assert.equal(result.summary.text,undefined);
});

test('timing audit distinguishes Vietnamese ngay from ngày and preserves user-provided durations during repair',async()=>{
  const p=prepareReading({...body,question:'Tôi có nên nghỉ một năm và cần quyết định cuối tháng 10?'});
  const ids=p.context.allInOne.reasoning.primaryJudgment.claimIds;
  const text='Một phương án nhỏ phù hợp hơn việc nghỉ trọn một năm ngay từ đầu.';
  assert.deepEqual(auditSynthesis([{slot:'situation',text,claimIds:ids}],p.context),[]);
  assert.ok(auditSynthesis([{slot:'situation',text:'Sự việc sẽ xảy ra sau năm ngày.',claimIds:ids}],p.context).some(x=>/Mốc ứng kỳ/.test(x)));
  const base=structuredReading(p);base.situation.meaning+=' '+text;base.timing.meaning+=' Có thể ứng vào thứ ba tuần tới.';
  const result=await interpretReading(p,{runner:async()=>structuredClone(base)});
  assert.equal(result.status,'reading');
  assert.match(result.situation.meaning,/một năm ngay từ đầu/);
  assert.doesNotMatch(result.timing.meaning,/thứ ba tuần tới/);
});
test('Mệnh structured reading keeps global mechanism technical and audits prohibited content in either field',()=>{
  const prepared=prepareMenhReading({birthDateLocal:'1970-01-03',birthTimeMode:'KNOWN',birthTimeLocal:'22:00',tzOffset:7,age:57,annualYear:2026});
  const ctx=writerContextForPrepared(prepared);
  const r={status:'reading',specVersion:ctx.specVersion,profileId:ctx.profileId};
  for(const key of MENH_READING_SECTIONS)r[key]={meaning:'',technicalEvidence:[],claim_ids:[]};
  r.overview={meaning:'Cần xét trước xu hướng chậm và giữ nếp cũ vì nó có thể giới hạn lợi thế riêng. Điều này không phải phán quyết xấu tuyệt đối.',technicalEvidence:['Toàn bàn có Phục Ngâm.'],claim_ids:['GLOBAL_STRUCTURE']};
  assert.equal(validateMenhReading(r,ctx),r);
  for(const field of ['meaning','technicalEvidence']){
    const bad=structuredClone(r);bad.birthTimeNote[field]=null;
    assert.throws(()=>validateMenhReading(bad,ctx),/section/);
  }
  for(const field of ['meaning','technicalEvidence']){
    const bad=structuredClone(r);
    if(field==='meaning')bad.overview.meaning+=' Bạn sẽ có 3 con.';
    else bad.overview.technicalEvidence.push('Bạn sẽ có 3 con.');
    assert.throws(()=>validateMenhReading(bad,ctx),/số con/);
  }
  const missing=structuredClone(r);missing.overview.technicalEvidence=[];
  assert.throws(()=>validateMenhReading(missing,ctx),/Phục Ngâm/);
  const noMeaning=structuredClone(r);noMeaning.overview.meaning='';
  assert.throws(()=>validateMenhReading(noMeaning,ctx));
  const falseRelation=structuredClone(r);falseRelation.overview.technicalEvidence.push('Kim sinh Mộc.');
  assert.throws(()=>validateMenhReading(falseRelation,ctx),/ngũ hành/);
  const quoted=structuredClone(r);quoted.overview.meaning+=' Khi bạn hỏi về "Không Vong", hãy xem đó như lời nhắc kiểm tra điều kiện còn thiếu.';
  assert.equal(validateMenhReading(quoted,ctx),quoted);
});

test('Mệnh hidden evidence must match both the natal board and the cited palace support',()=>{
  const p=prepareMenhReading({birthDateLocal:'1994-04-23',birthTimeMode:'KNOWN',birthTimeLocal:'05:20',tzOffset:7,age:33,annualYear:2026});
  const ctx=writerContextForPrepared(p),r={status:'reading',specVersion:ctx.specVersion,profileId:ctx.profileId};
  for(const key of MENH_READING_SECTIONS)r[key]={meaning:'',technicalEvidence:[],claim_ids:[]};
  r.overview={meaning:'Cần xét trước xu hướng chậm và đổi chiều vì có thể giới hạn lợi thế riêng. Không phải phán quyết xấu tuyệt đối.',technicalEvidence:['Toàn bàn có Phục Ngâm và Phản Ngâm.'],claim_ids:['GLOBAL_STRUCTURE']};
  r.self={meaning:'Bạn có thể làm việc tỉ mỉ nhưng cần điều kiện phù hợp để duy trì nhịp làm.',technicalEvidence:['Thiên Tâm ở cung Càn 6.'],claim_ids:['SELF_CORE','GLOBAL_STRUCTURE']};
  assert.equal(validateMenhReading(r,ctx),r);
  const misplaced=structuredClone(r);misplaced.self.technicalEvidence=['Thiên Tâm ở cung Khảm 1.'];
  assert.throws(()=>validateMenhReading(misplaced,ctx),/vị trí/);
  const unlinked=structuredClone(r);unlinked.self.claim_ids=['WEALTH_CORE','GLOBAL_STRUCTURE'];
  assert.throws(()=>validateMenhReading(unlinked,ctx),/claim.*cung/);
});
