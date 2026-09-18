import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMenhDeterministicResult,createMenhNatal,MENH_PROTOCOL,MENH_RULE_VERSION,prepareUnknownBirthTimeCandidates} from '../dist/menh-core.mjs';
import {createClaim} from '../dist/qimen/menh/audit.mjs';

const stem=(han,element='Thổ')=>({han,vi:han,element});
function board(){
  const heavens={1:'戊',2:'己',3:'丁',4:'乙',6:'丙',7:'辛',8:'庚',9:'壬'};
  return {
    schemaVersion:'QimenBoard/1',engineVersion:'TG-ROTATING-2.0',utcMs:1,dun:'yang',ju:1,
    pillars:{day:{han:'丁酉'},hour:{han:'甲辰'}},
    palaces:Array.from({length:9},(_,i)=>{
      const number=i+1,base={number,element:number===1?'Thủy':number===3||number===4?'Mộc':number===6||number===7?'Kim':number===9?'Hỏa':'Thổ',
        earthStem:stem('戊'),heavenStems:number===5?[]:[stem(heavens[number]||'癸')]};
      return number===5?base:{...base,door:{id:'xiu',vi:'Hưu',element:'Thủy'},star:{id:'ren',vi:'Thiên Nhậm',element:'Thổ'},spirit:{id:'chief',vi:'Trực Phù'}};
    })
  };
}
test('P8: public deterministic API composes natal + luck + annual without mutating source board',()=>{
  const source=board(),before=JSON.stringify(source),natal=createMenhNatal(source);
  const claim=createClaim({claimId:'SELF_1',type:'NATAL_TENDENCY',text:'structured',ruleIds:['KMZ-SELF-001'],evidenceIds:['SELF_DAY_STEM'],domain:'SELF'});
  const result=buildMenhDeterministicResult(natal,{birthYearBranch:'HAI',age:16,annualPillar:'DING_HAI',dayStem:'DING',claims:[claim],sourceTrace:['Z16']});
  assert.equal(JSON.stringify(source),before);
  assert.equal(result.protocol,MENH_PROTOCOL);
  assert.equal(result.ruleVersion,MENH_RULE_VERSION);
  assert.equal(result.profileId,'ZHANG_ADVANCED_CLASS_LIFETIME');
  assert.equal(result.luck.palace,'KAN_1');
  assert.equal(result.annual.annualStemPalace,'ZHEN_3');
  assert.equal(result.annual.annualStemLayerAuthority,'TRANSMISSION_CORROBORATED');
  assert.equal(result.domains.marriage.fiveCombinationCounterpart,'REN');
  assert.equal(result.claims[0].ruleIds[0],'KMZ-SELF-001');
  assert.ok(Object.isFrozen(result));
});
test('P8: UNKNOWN public entrypoint returns 12 families / 13 executable candidates and no selected hour',()=>{
  const r=prepareUnknownBirthTimeCandidates({birthDateLocal:'2000-01-01',timezone:'Asia/Ho_Chi_Minh'});
  assert.equal(r.familyCount,12);
  assert.equal(r.executableCandidateCount,13);
  assert.equal(r.birthTimeMode,'UNKNOWN');
  assert.equal(r.candidates.filter(x=>x.family==='ZI').length,2);
});
test('P8: deterministic result fails closed on prohibited output tags',()=>{
  const natal=createMenhNatal(board());
  assert.throws(()=>buildMenhDeterministicResult(natal,{outputTags:['OVERALL_DESTINY_SCORE']}),/output bị cấm/);
});
