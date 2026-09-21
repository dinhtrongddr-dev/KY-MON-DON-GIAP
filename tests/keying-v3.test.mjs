import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {
  KEYING_VERSION,KEYING_PROFILE,STAR_HOUR_INDEX,
  doorDoorResponse,doorStemResponse,threeWonderPalaceResponse,doorPalaceClass,
  analyzeKeying
} from '../dist/qimen/analysis/keyingEngine.mjs';

const DOORS=['kai','xiu','sheng','shang','du','jing','si','fear'];
const STEMS=['戊','乙','丙','丁','己','庚','辛','壬','癸'];
const STARS=['peng','rui','chong','fu','qin','xin','zhu','ren','ying'];
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const baseBody={question:'Trong tuần này tôi có khoản tiền vào được phát sinh không?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7}};

test('KM-KEYING-3.0 declares the expected classical corpus coverage',()=>{
  assert.equal(KEYING_VERSION,'KM-KEYING-3.0');
  assert.equal(KEYING_PROFILE,'CLASSIC_KEYING_ROLE_BOUNDED');
  assert.equal(DOORS.flatMap(a=>DOORS.map(b=>doorDoorResponse(a,b))).filter(Boolean).length,64);
  assert.equal(DOORS.flatMap(d=>STEMS.map(s=>doorStemResponse(d,s))).filter(Boolean).length,72);
  assert.equal(['乙','丙','丁'].flatMap(s=>[1,2,3,4,6,7,8,9].map(p=>threeWonderPalaceResponse(s,p))).filter(Boolean).length,24);
  assert.equal(Object.keys(STAR_HOUR_INDEX).length,108);
});

test('every Eight-Door response is conditional and never verdict-eligible',()=>{
  for(const a of DOORS)for(const b of DOORS){
    const row=doorDoorResponse(a,b);
    assert.ok(row);
    assert.equal(row.verdictEligible,false);
    assert.ok(['strong_favorable','favorable','contextual','mixed','hold','adverse','severe_adverse'].includes(row.tone));
    assert.ok(row.plainMeaning.length>20);
  }
});

test('every Door × Qimen visible stem response is present and bounded',()=>{
  for(const door of DOORS)for(const stem of STEMS){
    const row=doorStemResponse(door,stem);
    assert.ok(row,door+' '+stem);
    assert.equal(row.verdictEligible,false);
    assert.ok(Number.isFinite(row.weight));
    assert.match(row.meaning,/bổ sung|vai\/cung/i);
  }
});

test('Three-Wonder-to-palace covers all 24 combinations with bounded modern meanings',()=>{
  for(const stem of ['乙','丙','丁'])for(const palace of [1,2,3,4,6,7,8,9]){
    const row=threeWonderPalaceResponse(stem,palace);
    assert.ok(row,stem+' '+palace);
    assert.equal(row.verdictEligible,false);
    assert.match(row.meaning,/không dùng riêng/i);
  }
  assert.equal(threeWonderPalaceResponse('丁',4).tone,'severe_adverse');
  assert.equal(threeWonderPalaceResponse('丁',1).tone,'strong_favorable');
  assert.match(threeWonderPalaceResponse('丁',4).plainMeaning,/không suy tai họa cụ thể/i);
});

test('Door–Palace classical labels follow element direction, not naming variants',()=>{
  assert.equal(doorPalaceClass('Mộc','Mộc').classicalLabel,'Tỷ hòa');
  const he=doorPalaceClass('Mộc','Hỏa');
  assert.equal(he.code,'he');assert.equal(he.classicalLabel,'Hòa');assert.equal(he.relation,'generates');
  const yi=doorPalaceClass('Mộc','Thủy');
  assert.equal(yi.code,'yi');assert.equal(yi.classicalLabel,'Nghĩa');assert.equal(yi.relation,'generated_by');
  const press=doorPalaceClass('Kim','Mộc');
  assert.equal(press.code,'door_controls_palace');assert.equal(press.classicalLabel,'Bức/迫');assert.equal(press.relation,'controls');
  const control=doorPalaceClass('Mộc','Kim');
  assert.equal(control.code,'palace_controls_door');assert.equal(control.classicalLabel,'Chế/制');assert.equal(control.relation,'controlled_by');
  assert.match(control.namingNote,/chiều ngũ hành làm chuẩn/i);
});

test('Nine-Star × hour-branch corpus is fully indexed but has zero verdict weight',()=>{
  for(const star of STARS)for(const branch of BRANCHES){
    const row=STAR_HOUR_INDEX[star+'_'+branch];
    assert.ok(row,star+' '+branch);
    assert.equal(row.scope,'classical_context_only');
    assert.equal(row.weight,0);
    assert.equal(row.verdictEligible,false);
    assert.match(row.plainMeaning,/không chuyển trực tiếp/i);
  }
});

test('Door × stem and Wonder responses attach only to roles represented by that stem',()=>{
  const board={pillars:{hour:{branch:{han:'辰'}}}};
  const palace={
    number:3,element:'Mộc',door:{id:'sheng',element:'Thổ'},star:{id:'chong'},
    heavenStems:[{han:'乙'},{han:'戊'}]
  };
  const roles=[
    {id:'role_yi',palace:3,stem:'乙'},
    {id:'role_wu',palace:3,stem:'戊'},
    {id:'role_no_stem',palace:3,stem:null}
  ];
  const result=analyzeKeying(board,[palace],roles).byPalace[3];
  const yi=result.doorStems.find(x=>x.stem==='乙'),wu=result.doorStems.find(x=>x.stem==='戊');
  assert.deepEqual(yi.actorIds,['role_yi']);
  assert.deepEqual(wu.actorIds,['role_wu']);
  assert.deepEqual(result.wonders[0].actorIds,['role_yi']);
  assert.ok(!yi.actorIds.includes('role_no_stem'));
});

test('carried heavenly stems remain distinct in role-attached Keying',()=>{
  const board={pillars:{hour:{branch:{han:'午'}}}};
  const palace={
    number:2,element:'Thổ',door:{id:'kai',element:'Kim'},star:{id:'rui'},
    heavenStems:[{han:'己'},{han:'丁'}]
  };
  const roles=[{id:'role_ding',palace:2,stem:'丁'}];
  const row=analyzeKeying(board,[palace],roles).byPalace[2];
  const doorStem=row.doorStems.find(x=>x.stem==='丁'),wonder=row.wonders.find(x=>x.stem==='丁');
  assert.equal(doorStem.carried,true);
  assert.deepEqual(doorStem.actorIds,['role_ding']);
  assert.equal(wonder.carried,true);
  assert.deepEqual(wonder.actorIds,['role_ding']);
});

test('real reading exposes Keying only as a conditional layer and preserves the finance-stage verdict',()=>{
  const p=prepareReading(baseBody),g=p.context.allInOne.reasoning;
  assert.equal(p.analysis.keying.version,'KM-KEYING-3.0');
  assert.equal(g.keyingProfile.version,'KM-KEYING-3.0');
  assert.equal(g.primaryJudgment.answerClass,'conditional_positive');
  assert.equal(g.primaryJudgment.stageAsked,'emergence');
  assert.equal(g.outcomeDimensions.income_emergence.status,'positive');
  assert.ok(['conditional','unresolved'].includes(g.outcomeDimensions.cash_realization.status));
  assert.ok(g.claims.every(c=>c.ruleIds.includes('rule_keying_v3')));
});

test('evidence scoring does not use Keying as an extra vote',()=>{
  const p=prepareReading(baseBody),selected=p.context.allInOne.reasoning.evidenceBundles;
  for(const b of selected){
    assert.ok(b.keying);
    assert.equal(Object.hasOwn(b.relevance,'keyingImportance'),false);
    assert.equal(Object.hasOwn(b.relevance,'keyingScore'),false);
    assert.match(b.keying.meaning,/không phải phiếu độc lập/i);
  }
});

test('writer context strips Keying source refs and weights while retaining bounded plain meanings',()=>{
  const p=prepareReading(baseBody),w=buildWriterContext(p.context),serialized=JSON.stringify(w.readingGraph.evidenceBundles.map(b=>b.keying));
  assert.equal(w.readingGraph.keyingProfile.version,'KM-KEYING-3.0');
  assert.doesNotMatch(serialized,/source|奇門|遁甲演義|weight|verdictEligible/);
  assert.match(serialized,/classical_context_only/);
  assert.match(serialized,/không chuyển trực tiếp ứng tượng/i);
});

test('technical facts expose Keying for relevant palaces without claiming probability',()=>{
  const p=prepareReading(baseBody),palace=p.context.allInOne.reasoning.evidenceBundles[0].palace;
  const fact=p.facts['keying_'+palace];
  assert.ok(fact);
  assert.match(fact,/Môn×Môn/);
  assert.match(fact,/Môn–Cung/);
  assert.match(fact,/Cửu Tinh trị thời/);
  assert.match(fact,/không cộng các lớp này như nhiều phiếu độc lập/i);
});
