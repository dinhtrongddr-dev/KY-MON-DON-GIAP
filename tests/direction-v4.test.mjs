import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {rankCandidates} from '../dist/qimen/modes/actionRules.mjs';
import {
  DIRECTION_VERSION,DIRECTION_PROFILE,earthPrivateDoors,tingTingBaiJian,heavenHorseAndGang,
  threeVictoriesFiveNoStrike,analyzeStrategicDirections,directionMarkersForPalace
} from '../dist/qimen/analysis/directionEngine.mjs';

const dirs={1:'Bắc',2:'Tây Nam',3:'Đông',4:'Đông Nam',6:'Tây Bắc',7:'Tây',8:'Đông Bắc',9:'Nam'};
const basePalaces=()=>Object.entries(dirs).map(([n,direction])=>({number:Number(n),direction,door:{id:'kai'},spirit:{id:'chief'},heavenStems:[{han:'戊'}]}));
const sourceBoard=hour=>({term:{id:'yushui'},pillars:{day:{stem:{han:'甲'}},hour:{branch:{han:hour}}},palaces:basePalaces()});

test('KM-DIRECTION-4.0 declares bounded directional coverage',()=>{
  const a=analyzeStrategicDirections(sourceBoard('午'),basePalaces());
  assert.equal(a.version,DIRECTION_VERSION);
  assert.equal(a.profile,DIRECTION_PROFILE);
  assert.deepEqual(a.coverage,{earthPrivateDoors:3,tingTing:1,baiJian:1,heavenHorse:1,heavenGang:1,threeVictories:3,fiveNoStrike:5});
  assert.match(a.provenance.variantPolicy,/canonical/);
});

test('Earth Private Doors reproduce the Qimen Fa Qiao Mao-hour example',()=>{
  const x=earthPrivateDoors(sourceBoard('卯'),basePalaces());
  assert.equal(x.guiMode,'mu_gui');
  assert.equal(x.guiSkyBranch,'未');
  assert.equal(x.guiLandingBranch,'亥');
  assert.equal(x.rotation,'forward');
  const by=Object.fromEntries(x.doors.map(d=>[d.id,d.landingBranch]));
  assert.deepEqual(by,{liuhe:'寅',taichang:'未',taiyin:'酉'});
});

test('Earth Private Doors reproduce the Qimen Fa Qiao Wu-hour example',()=>{
  const x=earthPrivateDoors(sourceBoard('午'),basePalaces());
  assert.equal(x.guiMode,'dan_gui');
  assert.equal(x.guiSkyBranch,'丑');
  assert.equal(x.guiLandingBranch,'申');
  assert.equal(x.rotation,'reverse');
  const by=Object.fromEntries(x.doors.map(d=>[d.id,d.landingBranch]));
  assert.deepEqual(by,{liuhe:'巳',taichang:'子',taiyin:'戌'});
});

test('Tingting and Baijian reproduce the Rain-Water examples under the canonical Baojian rule',()=>{
  const mao=tingTingBaiJian(sourceBoard('卯'),basePalaces());
  assert.equal(mao.status,'ok');
  assert.equal(mao.tingTing.landingBranch,'辰');
  assert.equal(mao.baiJian.landingBranch,'寅');
  assert.equal(mao.candidateCount,1);
  const wu=tingTingBaiJian(sourceBoard('午'),basePalaces());
  assert.equal(wu.tingTing.landingBranch,'未');
  assert.equal(wu.baiJian.landingBranch,'巳');
  assert.match(wu.variantNote,/variant|Dị bản/i);
});

test('Heaven Horse and Heaven Gang reuse the same month-general overlay',()=>{
  const x=heavenHorseAndGang(sourceBoard('午'),basePalaces());
  assert.equal(x.heavenHorse.skyBranch,'卯');
  assert.equal(x.heavenHorse.landingBranch,'戌');
  assert.equal(x.heavenGang.skyBranch,'辰');
  assert.equal(x.heavenGang.landingBranch,'亥');
  assert.ok(!x.heavenHorse.rankingEligible&&!x.heavenGang.rankingEligible);
});

function strategicPalaces(){
  return [
    {number:1,direction:'Bắc',door:{id:'xiu'},spirit:{id:'chief'},heavenStems:[{han:'戊'}]},
    {number:2,direction:'Tây Nam',door:{id:'du'},spirit:{id:'earth9'},heavenStems:[{han:'己'}]},
    {number:3,direction:'Đông',door:{id:'sheng'},spirit:{id:'harmony'},heavenStems:[{han:'乙'}]},
    {number:4,direction:'Đông Nam',door:{id:'shang'},spirit:{id:'heaven9'},heavenStems:[{han:'庚'}]},
    {number:6,direction:'Tây Bắc',door:{id:'jing'},spirit:{id:'moon'},heavenStems:[{han:'辛'}]},
    {number:7,direction:'Tây',door:{id:'si'},spirit:{id:'snake'},heavenStems:[{han:'壬'}]},
    {number:8,direction:'Đông Bắc',door:{id:'fear'},spirit:{id:'tiger'},heavenStems:[{han:'癸'}]},
    {number:9,direction:'Nam',door:{id:'kai'},spirit:{id:'tortoise'},heavenStems:[{han:'丙'}]}
  ];
}
const strategicBoard=dun=>({dun,term:{id:'yushui'},pillars:{day:{stem:{han:'甲'}},hour:{branch:{han:'午'}}},
  zhiFu:{palace:9},zhiShi:{palace:8},xun:{instrumentPalace:6},palaces:strategicPalaces()});

test('Three Victories use heavenly Zhi Fu in Yang Dun and earth instrument in Yin Dun',()=>{
  const yang=threeVictoriesFiveNoStrike(strategicBoard('yang'),strategicPalaces());
  const yin=threeVictoriesFiveNoStrike(strategicBoard('yin'),strategicPalaces());
  assert.equal(yang.tianYiPalace,9);
  assert.equal(yang.victories.find(x=>x.id==='victory_tianyi').basis,'heavenly_zhi_fu');
  assert.equal(yin.tianYiPalace,6);
  assert.equal(yin.victories.find(x=>x.id==='victory_tianyi').basis,'earth_instrument');
});

test('third Victory requires Life Door together with a Three Wonder',()=>{
  const good=threeVictoriesFiveNoStrike(strategicBoard('yang'),strategicPalaces());
  const third=good.victories.find(x=>x.id==='victory_life_door');
  assert.equal(third.qualified,true);assert.equal(third.wonder,'乙');
  const pal=strategicPalaces().map(p=>p.number===3?{...p,heavenStems:[{han:'戊'}]}:p);
  const weak=threeVictoriesFiveNoStrike({...strategicBoard('yang'),palaces:pal},pal);
  assert.equal(weak.victories.find(x=>x.id==='victory_life_door').qualified,false);
});

test('Five No-Strike emits exactly five rule reasons and never ranking/verdict eligibility',()=>{
  const x=threeVictoriesFiveNoStrike(strategicBoard('yang'),strategicPalaces());
  assert.equal(x.noStrike.length,5);
  assert.deepEqual(x.noStrike.map(r=>r.id),['no_strike_tianyi','no_strike_nine_heaven','no_strike_life_door','no_strike_nine_earth','no_strike_duty_door']);
  assert.ok(x.noStrike.every(r=>r.verdictEligible===false&&r.rankingEligible===false));
  assert.ok(x.noStrike.every(r=>/không nên đối đầu trực diện/i.test(r.plainMeaning)));
});

test('direction marker registry modernizes martial wording and remains annotation-only',()=>{
  const a=analyzeStrategicDirections(strategicBoard('yang'),strategicPalaces());
  const markers=Object.keys(a.byPalace).flatMap(n=>directionMarkersForPalace(a,Number(n)));
  assert.ok(markers.some(x=>x.family==='earth_private_doors'));
  assert.ok(markers.some(x=>x.family==='three_victories'));
  assert.ok(markers.some(x=>x.family==='five_no_strike'));
  assert.ok(markers.every(x=>!Object.hasOwn(x,'score')&&!Object.hasOwn(x,'probability')));
  assert.doesNotMatch(markers.map(x=>x.plainMeaning).join(' '),/百戰百勝|tấn công/i);
});

test('real Direction reading exposes KM-DIRECTION-4.0 but preserves the pre-existing rank algorithm',()=>{
  const body={question:'Hướng nào phù hợp để đi gặp khách?',mode:'direction',action:'meet',topic:'contract',method:'chaibu',
    input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7},direction:{origin:'Văn phòng',kind:'movement'}};
  const p=prepareReading(body),rows=p.context.allInOne.plan.computed.ranking;
  const reranked=rankCandidates(rows.map(({rank,directionMarkers,...rest})=>rest));
  assert.equal(p.analysis.directions.version,'KM-DIRECTION-4.0');
  assert.deepEqual(rows.map(x=>[x.id,x.rank]),reranked.map(x=>[x.id,x.rank]));
  assert.ok(rows.some(x=>x.directionMarkers.length));
});

test('writer receives sanitized Direction markers without classical source refs or military victory text',()=>{
  const body={question:'Hướng nào phù hợp để đi gặp khách?',mode:'direction',action:'meet',topic:'contract',method:'chaibu',
    input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7},direction:{origin:'Văn phòng',kind:'movement'}};
  const w=buildWriterContext(prepareReading(body).context),s=JSON.stringify({profile:w.readingGraph.directionProfile,rows:w.comparisons.map(x=>x.directionMarkers)});
  assert.equal(w.readingGraph.directionProfile.version,'KM-DIRECTION-4.0');
  assert.doesNotMatch(s,/奇門|遁甲|百戰百勝|https?:|source/);
  assert.match(s,/tránh đối đầu trực diện|phương vị|hướng/i);
});

test('Phase 11 UI explicitly shows directional overlays without changing rank language',()=>{
  const ui=readFileSync(new URL('../dist/qimen/ui-results.mjs',import.meta.url),'utf8');
  const prompt=readFileSync(new URL('../dist/qimen/ai/prompts.mjs',import.meta.url),'utf8');
  assert.match(ui,/Phương vị cổ điển/);
  assert.match(ui,/không đổi thứ hạng/);
  assert.match(prompt,/KM-DIRECTION-4\.0/);
  assert.match(prompt,/tránh đối đầu trực diện/);
});
