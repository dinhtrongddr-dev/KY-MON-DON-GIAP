import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';

const empty=()=>({text:'',claim_ids:[]});

function z18Context(){
  const prepared=prepareMenhReading({
    birthDateLocal:'1970-01-03',birthTimeMode:'KNOWN',birthTimeLocal:'22:00',
    tzOffset:7,age:57,annualYear:2026,sexMetadata:null
  });
  return {prepared,context:buildMenhWriterContext(prepared.result,{birthTimeMode:'KNOWN'})};
}

function validGlobalReading(ctx){
  const global='GLOBAL_STRUCTURE';
  return {
    status:'reading',specVersion:ctx.specVersion,profileId:ctx.profileId,
    overview:{
      text:'Toàn bàn có Phục Ngâm. Đây là cấu trúc ưu tiên phải xét trước và có thể giới hạn/cap các tín hiệu thuận cục bộ, nhưng không phải veto xấu tuyệt đối.',
      claim_ids:[global,'SELF_CORE','CAREER_CORE','WEALTH_CORE']
    },
    self:{text:'Bản thân có các tín hiệu cục bộ rõ, nhưng phải đặt dưới bối cảnh Phục Ngâm nên mặt thuận có thể bị giới hạn.',claim_ids:['SELF_CORE',global]},
    family:{text:'Gia đình phải đọc dưới bối cảnh Phục Ngâm; đây không phải phán quyết xấu tuyệt đối.',claim_ids:['FAMILY_PARENTS','CHILDREN_CORE',global]},
    marriage:{text:'Hôn nhân dùng nhiều resolver và vẫn chịu bối cảnh Phục Ngâm toàn cục.',claim_ids:['MARRIAGE_CORE',global]},
    career:{text:'Khai Môn là tín hiệu thuận cục bộ, nhưng Phục Ngâm là lớp ưu tiên có thể cap mức thuận này.',claim_ids:['CAREER_CORE',global]},
    wealth:{text:'Sinh Môn có thể hỗ trợ cục bộ nhưng phải đặt dưới Phục Ngâm, không được đọc thành bảo đảm.',claim_ids:['WEALTH_CORE',global]},
    luck:{text:'Đại vận là nền kích hoạt theo kỳ, không tự tạo sự kiện.',claim_ids:['LUCK_CURRENT']},
    annual:{text:'Lưu niên là lớp kích hoạt, không phải bằng chứng sự kiện chắc chắn.',claim_ids:['ANNUAL_CURRENT']},
    birthTimeNote:empty(),
  };
}

test('Z18 exposes GLOBAL_STRUCTURE with DIRECT_ZHANG FuYin evidence before local claims',()=>{
  const {prepared,context}=z18Context();
  assert.equal(prepared.result.claims[0].claimId,'GLOBAL_STRUCTURE');
  assert.deepEqual(prepared.result.claims[0].evidenceIds,['GLOBAL_FU_YIN']);
  const e=prepared.result.evidence.find(x=>x.evidenceId==='GLOBAL_FU_YIN');
  assert.equal(e.priorityClass,'GLOBAL_HARD_STRUCTURE');
  assert.equal(e.provenance,'DIRECT_ZHANG');
  assert.equal(e.severity,'HIGH');
  assert.equal(context.globalStructure.active,true);
  assert.equal(context.globalStructure.claimId,'GLOBAL_STRUCTURE');
  assert.deepEqual(context.globalStructure.mechanisms,['FU_YIN']);
  assert.ok(context.allowedEvidenceIds.includes('GLOBAL_FU_YIN'));
  assert.ok(context.evidence.some(x=>x.evidenceId==='GLOBAL_FU_YIN'));
});

test('LWF05 exposes FanYin as a global hard structure claim',()=>{
  const prepared=prepareMenhReading({
    birthDateLocal:'1964-08-19',birthTimeMode:'KNOWN',birthTimeLocal:'19:40',
    tzOffset:7,age:63,annualYear:2026,sexMetadata:null
  });
  const context=buildMenhWriterContext(prepared.result,{birthTimeMode:'KNOWN'});
  assert.equal(prepared.result.claims[0].claimId,'GLOBAL_STRUCTURE');
  assert.deepEqual(prepared.result.claims[0].evidenceIds,['GLOBAL_FAN_YIN']);
  assert.deepEqual(context.globalStructure.mechanisms,['FAN_YIN']);
});

test('global-structure audit requires precedence, explicit mechanism and claim trace in affected sections',()=>{
  const {context}=z18Context();
  const good=validGlobalReading(context);
  assert.equal(validateMenhReading(good,context),good);

  const missingOverviewClaim=structuredClone(good);
  missingOverviewClaim.overview.claim_ids=missingOverviewClaim.overview.claim_ids.filter(x=>x!=='GLOBAL_STRUCTURE');
  assert.throws(()=>validateMenhReading(missingOverviewClaim,context),/overview phải gắn GLOBAL_STRUCTURE/);

  const missingMechanism=structuredClone(good);
  missingMechanism.overview.text='Đây là cấu trúc ưu tiên phải xét trước và có thể giới hạn tín hiệu thuận cục bộ, nhưng không phải veto xấu tuyệt đối.';
  assert.throws(()=>validateMenhReading(missingMechanism,context),/Phục Ngâm/);

  const missingPrecedence=structuredClone(good);
  missingPrecedence.overview.text='Toàn bàn có Phục Ngâm nhưng không phải veto xấu tuyệt đối.';
  assert.throws(()=>validateMenhReading(missingPrecedence,context),/precedence\/cap/);

  const missingCareerTrace=structuredClone(good);
  missingCareerTrace.career.claim_ids=['CAREER_CORE'];
  assert.throws(()=>validateMenhReading(missingCareerTrace,context),/career: phải gắn GLOBAL_STRUCTURE/);
});
