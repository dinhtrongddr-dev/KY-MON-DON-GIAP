import test from 'node:test';
import assert from 'node:assert/strict';
import {TEN_STEM_RESPONSES,tenStemResponse,analyzeStructures} from '../dist/qimen/analysis/structureEngine.mjs';
import {resolveContradictions} from '../dist/qimen/analysis/contradictions.mjs';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {buildOutcomeDimensions} from '../dist/qimen/ai/outcomeDimensions.mjs';

test('KM-STRUCTURE-2.0 covers all 81 visible Three-Wonders/Six-Registers stem responses',()=>{
  assert.equal(Object.keys(TEN_STEM_RESPONSES).length,81);
  const all=Object.values(TEN_STEM_RESPONSES);
  assert.equal(all.filter(r=>r.plainMeaning?.length>20).length,81);
  assert.equal(new Set(all.map(r=>r.plainMeaning)).size,81,'each pair needs its own modern interpretation, not only a good/bad template');
  const known=[
    ['戊','丙','青龍返首','strong_favorable'],
    ['丙','戊','飛鳥跌穴','strong_favorable'],
    ['乙','辛','青龍逃走','severe_adverse'],
    ['辛','乙','白虎猖狂','severe_adverse'],
    ['丁','癸','朱雀投江','severe_adverse'],
    ['癸','丁','螣蛇夭矯','severe_adverse'],
    ['庚','癸','大格','severe_adverse'],
  ];
  for(const [h,e,name,tone] of known){
    const r=tenStemResponse(h,e);
    assert.equal(r.name,name);assert.equal(r.tone,tone);assert.ok(r.plainMeaning.length>20);
  }
});

const palace=({number=3,element='Mộc',doorElement='Kim',heaven='乙',earth='辛',voided=false,punishment=false,tomb=false,spirit='earth9'}={})=>({
  number,element,voided,door:{id:'kai',element:doorElement},spirit:{id:spirit},
  conditions:{doorPressure:({Kim:'Mộc',Mộc:'Thổ',Thổ:'Thủy',Thủy:'Hỏa',Hỏa:'Kim'}[doorElement]===element),punishment:[],wonderTombs:[]},
  stemPairs:[{heaven:{han:heaven},earth:{han:earth},carried:false,punishment,wonderTomb:tomb}],
  heavenStems:[{han:heaven}],earthStem:{han:earth}
});

test('door/palace directions are stored explicitly instead of relying on disputed pressure labels',()=>{
  const roles=[{id:'event',palace:3,stem:'乙',yongshenTier:'primary'}];
  const a=analyzeStructures({zhiShi:{palace:7}},[palace()],roles).byPalace[3];
  assert.equal(a.doorRelation.code,'door_controls_palace');
  assert.equal(a.doorRelation.doorControlsPalace,true);
  const b=analyzeStructures({zhiShi:{palace:7}},[palace({element:'Hỏa',doorElement:'Kim'})],roles).byPalace[3];
  assert.equal(b.doorRelation.code,'palace_controls_door');
  assert.equal(b.doorRelation.palaceControlsDoor,true);
  assert.match(b.doorRelation.namingNote,/dị bản/i);
});
test('four harms and stem responses stay actor-specific, including carried stems',()=>{
  const p={
    ...palace({heaven:'乙',earth:'辛',voided:true,punishment:true}),
    heavenStems:[{han:'乙'},{han:'丁'}],
    stemPairs:[
      {heaven:{han:'乙'},earth:{han:'辛'},carried:false,punishment:true,wonderTomb:false},
      {heaven:{han:'丁'},earth:{han:'癸'},carried:true,punishment:false,wonderTomb:true},
    ]
  };
  const roles=[
    {id:'event',palace:3,stem:'乙',yongshenTier:'primary'},
    {id:'money',palace:3,stem:'丁',yongshenTier:'secondary'},
  ];
  const s=analyzeStructures({zhiShi:{palace:7}},[p],roles).byPalace[3];
  assert.ok(s.fourHarms.some(x=>x.code==='void'&&x.actorIds.includes('event')));
  assert.ok(s.fourHarms.some(x=>x.code==='punishment'&&x.stem==='乙'&&x.actorIds.includes('event')));
  const carried=s.stemResponses.find(x=>x.pair==='丁癸');
  assert.equal(carried.carried,true);assert.deepEqual(carried.actorIds,['money']);
  assert.equal(carried.tone,'severe_adverse');
});
test('severe adverse response on a primary useful god becomes a primary structure condition',()=>{
  const bundle={
    id:'bundle_3',palace:3,actorIds:['event'],
    roles:[{id:'event',yongshenTier:'primary'}],
    states:[],symbols:{door:{id:'du'},star:{id:'fu'},deity:{id:'earth9'}},relationshipIds:[],
    stemResponses:[{pair:'乙辛',tone:'severe_adverse',weight:-1,plainMeaning:'cấu trúc cản mạnh; cần xử lý trước',actorIds:['event']}],
  };
  const context={domain:'general',outcomeTarget:{stageAsked:'formation'}};
  const conflicts=resolveContradictions(bundle,context);
  const c=conflicts.find(x=>x.code==='stem_response_adverse');
  assert.ok(c);assert.equal(c.dominant,'primary_structure_condition');assert.equal(c.severity,'high');
  assert.deepEqual(c.actorIds,['event']);
});

test('real reading exposes structure profile while writer receives modern meanings instead of archaic response names',()=>{
  const p=prepareReading({question:'Công việc của tôi tháng này có tiến triển không?',topic:'general',mode:'auto',method:'chaibu',
    input:{year:2026,month:9,day:21,hour:6,minute:23,tzOffset:7}});
  const a=p.analysis,g=p.context.allInOne.reasoning,w=buildWriterContext(p.context).readingGraph;
  assert.equal(a.structures.version,'KM-STRUCTURE-2.0');
  assert.equal(a.structures.coverage.tenStemResponses,81);
  assert.equal(g.structureProfile.version,'KM-STRUCTURE-2.0');
  assert.ok(g.claims.every(c=>c.ruleIds.includes('rule_structure_v2')));
  for(const b of w.evidenceBundles)for(const r of b.stemResponses){
    assert.ok(r.plainMeaning);assert.equal(Object.hasOwn(r,'name'),false);
  }
  assert.ok(Object.keys(p.facts).some(k=>/^structure_\d+$/.test(k)));
});

test('favorable stem structure can support a stage but cannot erase a direct limiting condition',()=>{
  const selected=[{
    palace:3,actorIds:['event'],evidenceIds:['p3','c3','structure_3'],
    symbols:{door:{id:'du',vi:'Đỗ Môn'},star:{id:'fu',vi:'Thiên Phụ'},deity:{id:'earth9',vi:'Cửu Địa'}},
    strength:{status:'vượng'},
    stemResponses:[{pair:'丙戊',name:'飛鳥跌穴',weight:1,actorIds:['event']}],
    conflicts:[{affectedDimensions:['formation'],effect:'obstruction',actorIds:['event'],evidenceIds:['c3'],resolution:'Cần xử lý điều kiện cản trước.'}],
  }];
  const context={domain:'general',intent:'understand_event',outcomeTarget:{stageAsked:'formation'}};
  const dims=buildOutcomeDimensions(selected,context,[]);
  assert.equal(dims.formation.status,'conditional');
  assert.ok(dims.formation.supportingEvidenceIds.includes('p3'));
  assert.ok(dims.formation.limitingEvidenceIds.includes('c3'));
});

test('classic pattern fixtures distinguish Tian/Di/Ren Dun, Jade Woman and blemished Three-Wonders gain-use',()=>{
  const mk=(heaven,earth,doorId,doorElement='Kim',spirit='earth9',number=3)=>({
    ...palace({number,element:'Mộc',doorElement,heaven,earth,spirit}),
    door:{id:doorId,element:doorElement},
    spirit:{id:spirit},
    heavenStems:[{han:heaven}],
    stemPairs:[{heaven:{han:heaven},earth:{han:earth},carried:false,punishment:false,wonderTomb:false}],
  });
  const tian=analyzeStructures({zhiShi:{palace:7}},[mk('丙','丁','sheng','Thổ')],[]).byPalace[3];
  assert.ok(tian.patterns.some(x=>x.id==='tian_dun'));
  const di=analyzeStructures({zhiShi:{palace:7}},[mk('乙','己','kai','Kim')],[]).byPalace[3];
  assert.ok(di.patterns.some(x=>x.id==='di_dun'));
  const ren=analyzeStructures({zhiShi:{palace:7}},[mk('丁','戊','xiu','Thủy','moon')],[]).byPalace[3];
  assert.ok(ren.patterns.some(x=>x.id==='ren_dun'));

  const jade=analyzeStructures({zhiShi:{palace:3}},[mk('丁','戊','du','Mộc','earth9')],[]).byPalace[3];
  assert.ok(jade.patterns.some(x=>x.id==='jade_woman_guards_door'));

  const blemished=analyzeStructures({zhiShi:{palace:7}},[mk('乙','辛','du','Mộc','earth9')],[]).byPalace[3]
    .patterns.find(x=>x.id==='three_wonders_gain_use');
  assert.ok(blemished);assert.equal(blemished.qualified,false);assert.equal(blemished.tone,'mixed');
  const chief=analyzeStructures({zhiShi:{palace:7}},[mk('乙','辛','du','Mộc','chief')],[]).byPalace[3]
    .patterns.find(x=>x.id==='three_wonders_gain_use');
  assert.equal(chief.qualified,true);assert.equal(chief.tone,'favorable');
});
