import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
const body={question:'Trong tuần này tôi có khoản tiền vào được phát sinh không?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7}};
const load=async()=>import('../dist/qimen/ai/synthesisAudit.mjs');
const section=(text,slot='situation',ids=['claim_3'])=>({text,slot,claimIds:ids});
test('unsupported actors, actual events, amounts and timing are rejected in every prose slot',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading(body);
  for(const text of ['Khách hàng sẽ chuyển tiền.','Người trả tiền đang xử lý hồ sơ.','Người có quyền phê duyệt sẽ đồng ý.',
    'Bạn nhận 50 triệu đồng.','Khoản thu đã được xác nhận.','Tiền sẽ về sau 2–3 ngày.','Bạn sẽ nhận vào thứ Sáu.','Cuối tuần có khoản thu.','Hợp đồng mới đã được ký.']){
    for(const slot of ['summary','situation','condition','resolution','action','timing','comparison','question'])assert.ok(auditSynthesis([section(text,slot)],p.context).length,`${slot}: ${text}`);
  }
  assert.deepEqual(auditSynthesis([section('Chưa có mốc ứng kỳ đủ rõ; trong tuần này chỉ là phạm vi câu hỏi.','timing')],p.context),[]);
});
test('primary judgment cannot be reversed or collapse emergence into received cash',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading(body);
  for(const text of ['Không có tiền phát sinh vì người hỏi gặp Không.','Chắc chắn tiền vào tài khoản trong tuần này.','Không biết có phát sinh hay không, chỉ cần xác minh.'])
    assert.ok(auditSynthesis([section(text,'summary')],p.context).length,text);
  assert.deepEqual(auditSynthesis([section('Có tín hiệu phát sinh khoản thu, nhưng phát sinh khác với tiền thực nhận.','summary')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('Không thể kết luận rằng không có tiền phát sinh chỉ vì có Tuần Không.')],p.context),[]);
});
test('semantic repetition rejects three paraphrased warnings and accepts different evidence mechanisms',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading({...body,question:'Khách hàng có đồng ý thanh toán không?'});
  const repetitive=[section('Cần xác minh cam kết.','summary'),section('Phải kiểm tra điều kiện thanh toán.','situation'),section('Cần phản hồi xác nhận.','resolution')];
  assert.ok(auditSynthesis(repetitive,p.context).some(e=>e.includes('lặp ý')));
  assert.ok(auditSynthesis([section(repetitive.map(p=>p.text).join('\n\n'))],p.context).some(e=>e.includes('lặp ý')));
  const distinct=[section('Sinh Môn cùng Thiên Nhậm hỗ trợ khả năng phát sinh khoản thu.','summary'),section('Quan hệ Mộc khắc Thổ tạo yêu cầu từ sự việc lên người hỏi.','situation',['claim_3','claim_8']),section('Nguồn lực ở Tuần Không còn giới hạn tầng thực nhận.','resolution',['claim_1'])];
  assert.deepEqual(auditSynthesis(distinct,p.context),[]);
});
test('conditional examples and actual user-reported facts are not fabricated events',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading({...body,question:'Khách hàng đã đồng ý thanh toán. Tiền có vào tài khoản không?'});
  assert.deepEqual(auditSynthesis([section('Khách hàng đã đồng ý thanh toán; điều này chưa chứng minh tiền đã thực nhận.')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('Nếu khoản thu được xác nhận thì mới chuyển sang xử lý.')],p.context),[]);
  assert.ok(auditSynthesis([section('Khách hàng đã chuyển tiền thành công.')],p.context).length);
});

test('a quoted horizon is never permission to predict inside that window',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading({...body,question:'Trong 3 ngày tới tôi có khoản thu mới phát sinh không?'});
  for(const text of ['Tiền sẽ về trong 3 ngày.','Khoản thu xảy ra ngày 2026-09-18.','Tiền về ngày 18 tháng 9.'])assert.ok(auditSynthesis([section(text,'timing')],p.context).length,text);
  assert.deepEqual(auditSynthesis([section('Khoảng hỏi là 3 ngày; chưa có mốc ứng kỳ đủ rõ.','timing')],p.context),[]);
});

test('deterministic debug is opt-in and does not collect auth or arbitrary context fields',async()=>{
  const {reasoningDebugSnapshot}=await import('../scripts/debug-reasoning.mjs');
  const p=prepareReading(body);p.context.pairingToken='must-never-appear';p.context.apiKey='must-never-appear';
  assert.equal(reasoningDebugSnapshot(p),null);
  const snapshot=reasoningDebugSnapshot(p,{enabled:true});
  assert.ok(snapshot.finalWriterPayload);assert.ok(snapshot.primaryJudgment);assert.ok(!JSON.stringify(snapshot).includes('must-never-appear'));
});

test('computed timing candidates may be named for comparison, never as promised outcome dates',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading({...body,question:'Chọn ngày nào ký hợp đồng?',mode:'timing',candidates:['2026-09-17T10:00','2026-09-18T10:00']});
  assert.deepEqual(auditSynthesis([section('Ứng viên 2026-09-17 có điều kiện cản, so riêng với bàn ngày 2026-09-18.','comparison')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('Hai mốc 10:00 và 14:00 đồng hạng theo bộ tiêu chí đã tính.','summary')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('Mốc thứ ba có nhiều điều kiện cản hơn nên xếp sau.','summary')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('19/09 xếp thứ hai trong ba ứng viên đã nhập.','summary')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('Thứ tự phù hợp là 17/09 rồi 18/09.','timing')],p.context),[]);
  assert.ok(auditSynthesis([section('Thứ Tư sẽ có kết quả.','timing')],p.context).length);
  assert.ok(auditSynthesis([section('Ứng viên 2026-09-19 thuận lợi hơn.','comparison')],p.context).length);
  assert.ok(auditSynthesis([section('Ngày 2026-09-17 hợp đồng chắc chắn được ký.','timing')],p.context).length);
  assert.deepEqual(auditSynthesis([section('17/09/2026 sẽ phù hợp hơn để thực hiện hành động, nhưng đây chỉ là xếp hạng tương đối.','summary')],p.context),[]);
  assert.deepEqual(auditSynthesis([section('17/09 và 18/09 là hai ứng viên đã nhập; đây không phải ngày chắc chắn có kết quả.','timing')],p.context),[]);
  assert.ok(auditSynthesis([section('17/09/2026 sẽ ký được hợp đồng.','summary')],p.context).length);
});

test('stage guards also reject invented completion and categorical success outside finance',async()=>{
  const {auditSynthesis}=await load(),p=prepareReading({...body,question:'Tôi có ký được hợp đồng không?'});
  for(const text of ['Bạn đã đạt mục tiêu ký kết.','Thỏa thuận đã hoàn tất.','Bạn chắc chắn đạt được mục tiêu.','Mọi điều kiện đã được đáp ứng.'])assert.ok(auditSynthesis([section(text,'summary')],p.context).length,text);
  assert.deepEqual(auditSynthesis([section('Nếu mọi điều kiện đã được đáp ứng thì mới xét kết quả cuối.','situation')],p.context),[]);
});
