import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {menhWriterInstructions} from '../dist/qimen/menh/ai/prompts.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {buildMenhDeterministicResult,createMenhNatal} from '../dist/menh-core.mjs';
import {createClaim} from '../dist/qimen/menh/audit.mjs';

const stem=(han,element='Thổ')=>({han,vi:han,element});
function board(){
  const heavens={1:'戊',2:'己',3:'丁',4:'乙',6:'丙',7:'辛',8:'庚',9:'壬'};
  return {schemaVersion:'QimenBoard/1',engineVersion:'TG-ROTATING-2.0',utcMs:1,dun:'yang',ju:1,
    pillars:{day:{han:'丁酉'},hour:{han:'甲辰'}},
    palaces:Array.from({length:9},(_,i)=>{const number=i+1,base={number,element:number===1?'Thủy':number===3||number===4?'Mộc':number===6||number===7?'Kim':number===9?'Hỏa':'Thổ',earthStem:stem('戊'),heavenStems:number===5?[]:[stem(heavens[number]||'癸')]};return number===5?base:{...base,door:{id:'xiu',vi:'Hưu',element:'Thủy'},star:{id:'ren',vi:'Thiên Nhậm',element:'Thổ'},spirit:{id:'chief',vi:'Trực Phù'}};})
  };
}
function context(){
  const natal=createMenhNatal(board());
  const claims=[
    createClaim({claimId:'SELF_1',type:'NATAL_TENDENCY',text:'Bản thân',ruleIds:['KMZ-SELF-001'],evidenceIds:['E_SELF'],domain:'SELF'}),
    createClaim({claimId:'CAREER_1',type:'NATAL_TENDENCY',text:'Sự nghiệp',ruleIds:['KMZ-CAREER-002'],evidenceIds:['E_CAREER'],domain:'CAREER'}),
  ];
  return buildMenhWriterContext(buildMenhDeterministicResult(natal,{claims,dayStem:'DING'}));
}
function validReading(ctx){
  const empty=()=>({text:'',claim_ids:[]});
  return {status:'reading',specVersion:ctx.specVersion,profileId:ctx.profileId,
    overview:{text:'Bàn cho thấy các xu hướng cần đọc có điều kiện từ cấu trúc đã tính.',claim_ids:['SELF_1']},
    self:{text:'Phần bản thân được diễn giải như xu hướng biểu tượng, không phải sự kiện chắc chắn.',claim_ids:['SELF_1']},
    family:empty(),marriage:empty(),
    career:{text:'Sự nghiệp cần đối chiếu cơ hội và điều kiện thực tế, không dùng điểm số.',claim_ids:['CAREER_1']},
    wealth:empty(),luck:empty(),annual:empty(),birthTimeNote:empty()};
}
test('P9 writer context contains only prepared deterministic claims and locks mutation powers',()=>{
  const ctx=context();
  assert.deepEqual(ctx.allowedClaimIds,['SELF_1','CAREER_1']);
  assert.equal(ctx.restrictions.rebuildChart,false);
  assert.equal(ctx.restrictions.alterProfile,false);
  assert.equal(ctx.restrictions.probability,false);
  assert.equal(ctx.semanticMatrix.version,'KM-SEMANTIC-MATRIX-1.0');
  assert.ok(ctx.semanticMatrix.claims.some(x=>x.claimId==='CAREER_1'&&x.domainId==='career'));
  assert.equal(ctx.semanticMatrix.domains.career.id,'career');
  assert.ok(Object.isFrozen(ctx));
});
test('P9 prompt explicitly forbids chart rebuild, scores, probabilities and deterministic prohibited claims',()=>{
  const p=menhWriterInstructions().toLowerCase();
  for(const token of ['không tự lập lại bàn','không cho điểm tổng mệnh','xác suất thành công','không đoán giờ sinh đúng'])assert.ok(p.includes(token));
});
test('KM-MENH production writer is explicitly one-shot long-form and guards modern extrapolation',()=>{
  const p=menhWriterInstructions().toLowerCase();
  for(const token of ['một lần','8.000–14.000','comprehensive_one_shot','không double-count','boardfacts','ví dụ hiện đại'])assert.ok(p.includes(token),token);
});
test('P9 reading audit accepts claim-bound prose and rejects fabricated claim ids',()=>{
  const ctx=context(),r=validReading(ctx);
  assert.equal(validateMenhReading(r,ctx),r);
  const bad=structuredClone(r);bad.career.claim_ids=['MADE_UP'];
  assert.throws(()=>validateMenhReading(bad,ctx),/ngoài deterministic context/);
});
test('Mệnh AI rejects bold technical basis but accepts bold natural translated meaning',()=>{
  const ctx=context(),bad=validReading(ctx);
  bad.self.text='Cha mẹ và **gia đình gốc trước hết lấy Niên can Giáp tại Tốn 4 hành Mộc làm trục tổng hợp**.';
  assert.throws(()=>validateMenhReading(bad,ctx),/dịch nghĩa tự nhiên.*căn cứ kỹ thuật/i);
  const good=validReading(ctx);good.self.text='Niên can Giáp tại Tốn 4 là căn cứ kỹ thuật của đoạn này. **Nền gia đình thiên về kết nối và thích nghi, nhưng cần tránh để môi trường chi phối quá mạnh.**';
  assert.equal(validateMenhReading(good,ctx),good);
});
test('P9 reading audit rejects changed profile and numeric destiny probability',()=>{
  const ctx=context(),r=validReading(ctx);
  const wrong=structuredClone(r);wrong.profileId='OTHER';
  assert.throws(()=>validateMenhReading(wrong,ctx),/đổi spec\/profile/);
  const probability=structuredClone(r);probability.overview.text='Xác suất thành công 80%.';probability.overview.claim_ids=['SELF_1'];
  assert.throws(()=>validateMenhReading(probability,ctx),/xác suất hoặc điểm tổng mệnh/);
});
test('P9 reading audit rejects deterministic death/children/marriage claims',()=>{
  const ctx=context();
  for(const text of ['Bạn sẽ chết 72 tuổi.','Bạn sẽ có 3 con.','Bạn sẽ kết hôn 2 lần.']){
    const r=validReading(ctx);r.overview.text=text;r.overview.claim_ids=['SELF_1'];
    assert.throws(()=>validateMenhReading(r,ctx));
  }
});
test('P9 UNKNOWN reading must disclose uncertainty and cannot select an exact birth hour',()=>{
  const base=context();
  const unknown=Object.freeze({...base,birthTimeMode:'UNKNOWN',stability:{classification:'TIME_SENSITIVE'}});
  const r=validReading(unknown);
  r.birthTimeNote={text:'Không nhớ giờ sinh nên phần này phụ thuộc giờ sinh; chỉ phần ổn định mới nên dùng.',claim_ids:[]};
  assert.equal(validateMenhReading(r,unknown),r);
  const bad=structuredClone(r);bad.birthTimeNote.text='Giờ sinh chính xác là 09:00.';
  assert.throws(()=>validateMenhReading(bad,unknown));
});
test('writer context exposes deterministic palace facts only for KNOWN mode',()=>{
  const ctx=context();
  assert.equal(ctx.outputMode,'COMPREHENSIVE_ONE_SHOT');
  assert.equal(ctx.boardFacts.palaces.length,9);
  assert.ok(ctx.boardFacts.palaces.every(p=>p.code&&p.element));
  assert.ok(ctx.claimSupport.every(x=>ctx.allowedClaimIds.includes(x.claimId)));
  const unknown=buildMenhWriterContext(buildMenhDeterministicResult(createMenhNatal(board()),{claims:[]}),{birthTimeMode:'UNKNOWN',stability:{}});
  assert.equal(unknown.boardFacts,null);
});
test('production long-form audit rejects a structurally valid but shallow draft',()=>{
  const ctx=context(),r=validReading(ctx);
  assert.throws(()=>validateMenhReading(r,ctx,{enforceLongForm:true}),/quá ngắn|chưa đủ độ sâu/);
});
