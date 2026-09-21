import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {rankCandidates} from '../dist/qimen/modes/actionRules.mjs';
import {
  FORMATION_VERSION,FORMATION_PROFILE,monthGeneralForTerm,heavenThreeGates,earthFourDoors,analyzeFormations
} from '../dist/qimen/analysis/formationEngine.mjs';

const dirs={1:'Bắc',2:'Tây Nam',3:'Đông',4:'Đông Nam',6:'Tây Bắc',7:'Tây',8:'Đông Bắc',9:'Nam'};
const palacesForDirection=Object.entries(dirs).map(([number,direction])=>({number:Number(number),direction}));
const stem=han=>({han});
const palace=({number=3,door='kai',spirit='chief',heaven=['乙'],earth='戊',pressure=false,tomb=false,punishment=false,direction=dirs[number]||'Đông'})=>({
  number,direction,door:{id:door},spirit:{id:spirit},earthStem:{han:earth},
  heavenStems:heaven.map(stem),conditions:{doorPressure:pressure},
  stemPairs:heaven.map((han,i)=>({heaven:{han},earth:{han:earth},carried:i>0,wonderTomb:tomb&&i===0&&['乙','丙','丁'].includes(han),tomb:tomb&&i===0,punishment:punishment&&i===0}))
});
const boardFor=({term='bailu',hour='辰',month='酉'}={})=>({
  term:{id:term},pillars:{hour:{branch:{han:hour}},month:{branch:{han:month}}},palaces:palacesForDirection
});
const analyzeOne=p=>analyzeFormations(boardFor(),[p],[]).matches;

test('KM-FORMATION-3.0 declares bounded strategic families and portal coverage',()=>{
  const a=analyzeFormations(boardFor(),palacesForDirection.map(p=>palace({number:p.number,direction:p.direction,door:'fear',spirit:'chief',heaven:['戊']})),[]);
  assert.equal(FORMATION_VERSION,'KM-FORMATION-3.0');
  assert.equal(FORMATION_PROFILE,'QIMEN_FAQIAO_STRATEGIC_BOUNDED');
  assert.equal(a.coverage.threeDeceptions.length,3);
  assert.equal(a.coverage.fiveFakes.length,5);
  assert.equal(a.coverage.nineEscapes.length,9);
  assert.equal(a.coverage.heavenThreeGates,3);
  assert.equal(a.coverage.earthFourDoors,4);
  assert.deepEqual(a.coverage.fiveFakeVariants.earth_fake,['earth9','moon','harmony']);
  assert.equal(a.coverage.qualificationCoverage.otherStemTomb,'complete_for_戊己庚辛壬癸_via_KM_TIMING_3_0');
  assert.equal(a.provenance.variantPolicy,'single_profile_variants_are_metadata_not_votes');
});

test('Three Deceptions resolve True, Heavy and Rest profiles without becoming verdict votes',()=>{
  const specs=[['moon','true_deception'],['earth9','heavy_deception'],['harmony','rest_deception']];
  for(const [spirit,id] of specs){
    const row=analyzeOne(palace({door:'kai',spirit,heaven:['乙']})).find(x=>x.id===id);
    assert.ok(row,id);assert.equal(row.family,'three_deceptions');assert.equal(row.verdictEligible,false);assert.equal(row.rankingEligible,false);
  }
});

test('Five Fakes use exactly five families while Earth-Fake spirit variants stay within one family',()=>{
  const fixtures=[
    [palace({door:'jing',spirit:'heaven9',heaven:['乙']}),'heaven_fake'],
    [palace({door:'du',spirit:'earth9',heaven:['丁']}),'earth_fake'],
    [palace({door:'shang',spirit:'harmony',heaven:['己']}),'object_fake'],
    [palace({door:'si',spirit:'earth9',heaven:['癸']}),'ghost_fake'],
    [palace({door:'fear',spirit:'heaven9',heaven:['壬']}),'human_fake']
  ];
  const ids=[];
  for(const [p,id] of fixtures){const row=analyzeOne(p).find(x=>x.id===id);assert.ok(row,id);ids.push(row.id);assert.equal(row.family,'five_fakes');}
  assert.equal(new Set(ids).size,5);
  const ghost=analyzeOne(fixtures[3][0]).find(x=>x.id==='ghost_fake');
  assert.match(ghost.variant,/shen_jia/);
  const moon=analyzeOne(palace({door:'du',spirit:'moon',heaven:['丁']})).find(x=>x.id==='earth_fake');
  const harmony=analyzeOne(palace({door:'du',spirit:'harmony',heaven:['丁']})).find(x=>x.id==='earth_fake');
  assert.match(moon.variant,/variant_moon/);assert.match(moon.plainMeaning,/dò hỏi kín/i);
  assert.match(harmony.variant,/variant_harmony/);assert.match(harmony.plainMeaning,/rút lui an toàn/i);
});

test('all Nine Escapes primary formulas are recognized, with Tiger alternate kept as a variant and Heaven-Escape kept on canonical Life Door',()=>{
  const fixtures=[
    [palace({number:6,door:'sheng',heaven:['丙'],earth:'丁'}),'heaven_escape'],
    [palace({number:6,door:'kai',heaven:['乙'],earth:'己'}),'earth_escape'],
    [palace({number:6,door:'xiu',spirit:'moon',heaven:['丁']}),'human_escape'],
    [palace({number:6,door:'sheng',spirit:'heaven9',heaven:['丙']}),'spirit_escape'],
    [palace({number:6,door:'du',spirit:'earth9',heaven:['乙']}),'ghost_escape'],
    [palace({number:4,door:'xiu',heaven:['乙']}),'wind_escape'],
    [palace({number:6,door:'kai',heaven:['乙'],earth:'辛'}),'cloud_escape'],
    [palace({number:1,door:'sheng',heaven:['乙']}),'dragon_escape'],
    [palace({number:8,door:'xiu',heaven:['乙'],earth:'辛'}),'tiger_escape']
  ];
  for(const [p,id] of fixtures){const row=analyzeOne(p).find(x=>x.id===id);assert.ok(row,id);assert.equal(row.family,'nine_escapes');assert.ok(['primary','qimen_faqiao_primary'].includes(row.variant),row.variant);}
  const alt=analyzeOne(palace({number:2,door:'sheng',heaven:['丙'],earth:'辛'})).find(x=>x.id==='tiger_escape');
  assert.ok(alt);assert.equal(alt.variant,'qimen_faqiao_alternate');
  assert.equal(analyzeOne(palace({number:6,door:'kai',heaven:['丙'],earth:'丁'})).some(x=>x.id==='heaven_escape'),false);
});

test('Nine Escapes are disqualified by Wonder tomb, punishment or Door pressure; Five Fakes by supported tomb/pressure',()=>{
  for(const change of [{tomb:true},{punishment:true},{pressure:true}]){
    const row=analyzeOne(palace({door:'sheng',heaven:['丙'],earth:'丁',...change})).find(x=>x.id==='heaven_escape');
    assert.ok(row);assert.equal(row.qualified,false);assert.ok(row.blockers.length);assert.equal(row.qualificationStatus,'complete');
  }
  for(const change of [{tomb:true},{pressure:true}]){
    const row=analyzeOne(palace({door:'jing',spirit:'heaven9',heaven:['丁'],...change})).find(x=>x.id==='heaven_fake');
    assert.ok(row);assert.equal(row.qualified,false);assert.equal(row.qualificationStatus,'complete');
  }
});

test('Five Fakes using Ji/Gui/Ren now have complete tomb qualification under Phase 13',()=>{
  const clear=[
    analyzeOne(palace({door:'shang',spirit:'harmony',heaven:['己']})).find(x=>x.id==='object_fake'),
    analyzeOne(palace({door:'si',spirit:'earth9',heaven:['癸']})).find(x=>x.id==='ghost_fake'),
    analyzeOne(palace({door:'fear',spirit:'heaven9',heaven:['壬']})).find(x=>x.id==='human_fake')
  ];
  for(const row of clear){
    assert.ok(row);assert.equal(row.qualified,true);assert.equal(row.qualificationStatus,'complete');
    assert.ok(row.qualificationCandidates.every(x=>x.tombCoverage==='known'));
  }
  const blocked=analyzeOne(palace({door:'shang',spirit:'harmony',heaven:['己'],tomb:true})).find(x=>x.id==='object_fake');
  assert.ok(blocked);assert.equal(blocked.qualified,false);assert.ok(blocked.blockers.includes('stem_tomb'));
});

test('a fully checked Ding candidate can qualify a Five-Fake even when an unchecked instrument is carried beside it',()=>{
  const clear=analyzeOne(palace({door:'shang',spirit:'harmony',heaven:['丁','己']})).find(x=>x.id==='object_fake');
  assert.ok(clear);assert.equal(clear.qualified,true);assert.equal(clear.qualificationStatus,'complete');
  const dingBlockedButJiClear=analyzeOne(palace({door:'shang',spirit:'harmony',heaven:['丁','己'],tomb:true})).find(x=>x.id==='object_fake');
  assert.ok(dingBlockedButJiClear);assert.equal(dingBlockedButJiClear.qualified,true);assert.equal(dingBlockedButJiClear.qualificationStatus,'complete');
});

test('Heaven Three Gates reproduces the classical Yushui + Wu-hour example',()=>{
  const g=heavenThreeGates(boardFor({term:'yushui',hour:'午',month:'寅'}),palacesForDirection);
  assert.equal(g.monthGeneral,'亥');
  assert.deepEqual(g.gates.map(x=>x.landingBranch),['戌','寅','辰']);
  assert.deepEqual(g.gates.map(x=>x.palace),[6,8,4]);
  assert.ok(g.gates.every(x=>!x.verdictEligible&&!x.rankingEligible));
});

test('Earth Four Doors follow Jian-Chu offsets from the hour branch',()=>{
  const d=earthFourDoors(boardFor({term:'yushui',hour:'午',month:'寅'}),palacesForDirection);
  assert.equal(d.monthBranch,'寅');
  assert.deepEqual(d.doors.map(x=>x.name),['Trừ','Định','Nguy','Khai']);
  assert.deepEqual(d.doors.map(x=>x.landingBranch),['未','戌','丑','辰']);
  assert.deepEqual(d.doors.map(x=>x.palace),[2,6,8,4]);
});

test('Heaven month-general changes at the twelve middle qi and remains stable across adjacent jie',()=>{
  const pairs={
    dahan:'子',lichun:'子',yushui:'亥',jingzhe:'亥',chunfen:'戌',qingming:'戌',guyu:'酉',lixia:'酉',
    xiaoman:'申',mangzhong:'申',xiazhi:'未',xiaoshu:'未',dashu:'午',liqiu:'午',chushu:'巳',bailu:'巳',
    qiufen:'辰',hanlu:'辰',shuangjiang:'卯',lidong:'卯',xiaoxue:'寅',daxue:'寅',dongzhi:'丑',xiaohan:'丑'
  };
  for(const [term,branch] of Object.entries(pairs))assert.equal(monthGeneralForTerm(term),branch,term);
  assert.equal(monthGeneralForTerm('unknown'),null);
});

test('real finance reading preserves primary judgment and evidence scoring while exposing Formation',()=>{
  const body={question:'Trong tuần này tôi có khoản tiền vào được phát sinh không?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7}};
  const p=prepareReading(body),g=p.context.allInOne.reasoning;
  assert.equal(g.primaryJudgment.answerClass,'conditional_positive');
  assert.equal(g.primaryJudgment.stageAsked,'emergence');
  assert.equal(g.formationProfile.version,'KM-FORMATION-3.0');
  assert.ok(g.claims.every(c=>c.ruleIds.includes('rule_formation_v3')));
  for(const b of g.evidenceBundles){
    assert.ok(b.formation);
    assert.equal(Object.hasOwn(b.relevance,'formationScore'),false);
    assert.equal(Object.hasOwn(b.relevance,'formationImportance'),false);
  }
});

test('writer receives modern Formation guidance without source provenance or internal vote flags',()=>{
  const body={question:'Trong tuần này tôi có khoản tiền vào được phát sinh không?',topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day:16,hour:7,minute:46,tzOffset:7}};
  const w=buildWriterContext(prepareReading(body).context),s=JSON.stringify({profile:w.readingGraph.formationProfile,bundles:w.readingGraph.evidenceBundles.map(b=>b.formation)});
  assert.equal(w.readingGraph.formationProfile.version,'KM-FORMATION-3.0');
  assert.doesNotMatch(s,/奇門|遁甲演義|source|verdictEligible|rankingEligible/);
  assert.match(s,/không phải|không đổi|phương vị|hành động/i);
});

test('Timing Formation markers do not alter the existing candidate ranking',()=>{
  const body={question:'Ngày nào nên gửi báo giá?',mode:'timing',action:'quote',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7},candidates:['2026-09-14T09:00','2026-09-15T14:00','2026-09-16T10:30']};
  const p=prepareReading(body),rows=p.context.allInOne.comparison.ranking;
  const reranked=rankCandidates(rows.map(({rank,formationMarkers,...rest})=>rest));
  assert.deepEqual(rows.map(x=>[x.id,x.rank]),reranked.map(x=>[x.id,x.rank]));
  assert.ok(rows.every(x=>Array.isArray(x.formationMarkers)));
});

test('Direction writer annotates Heaven Gates/Earth Doors but preserves computed ranks',()=>{
  const body={question:'Hướng nào phù hợp để đi gặp khách?',mode:'direction',action:'meet',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7},direction:{origin:'Văn phòng',kind:'movement'}};
  const p=prepareReading(body),raw=p.context.allInOne.plan.computed.ranking,w=buildWriterContext(p.context);
  assert.deepEqual(w.comparisons.map(x=>[x.id,x.rank]),raw.map(x=>[x.id,x.rank]));
  assert.ok(w.comparisons.some(x=>x.formationMarkers.length));
  assert.ok(w.comparisons.flatMap(x=>x.formationMarkers).every(x=>['heaven_three_gates','earth_four_doors'].includes(x.family)));
});
