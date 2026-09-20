import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonalStrength,stemLongevity,roleStrength,aggregateRoleStrength} from '../dist/qimen/analysis/strength.mjs';
import {buildOutcomeDimensions} from '../dist/qimen/ai/outcomeDimensions.mjs';
import {prepareReading} from '../local/reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';

const board=branch=>({pillars:{month:{branch:{han:branch},vi:'tháng thử'}}});
const palace=({element='Mộc',starElement='Mộc',doorElement='Mộc',stem='甲'}={})=>({
  element,star:{element:starElement},door:{element:doorElement},heavenStems:[{han:stem,element:{甲:'Mộc',乙:'Mộc',丙:'Hỏa',丁:'Hỏa',戊:'Thổ',己:'Thổ',庚:'Kim',辛:'Kim',壬:'Thủy',癸:'Thủy'}[stem]}]
});

test('KM-STRENGTH-2.0 Ten-Stem life cycle uses the ten classical starts and yang-forward/yin-reverse',()=>{
  const starts={甲:'亥',乙:'午',丙:'寅',丁:'酉',戊:'寅',己:'酉',庚:'巳',辛:'子',壬:'申',癸:'卯'};
  for(const [stem,branch] of Object.entries(starts)){
    const r=stemLongevity(stem,branch);
    assert.equal(r.vi,'Trường Sinh',stem);
    assert.equal(r.direction,['甲','丙','戊','庚','壬'].includes(stem)?'thuận':'nghịch');
  }
  assert.equal(stemLongevity('甲','子').vi,'Mộc Dục');
  assert.equal(stemLongevity('乙','巳').vi,'Mộc Dục');
  assert.equal(stemLongevity('甲','寅').vi,'Lâm Quan');
  assert.equal(stemLongevity('乙','卯').vi,'Lâm Quan');
  assert.equal(stemLongevity('戊','戌').vi,'Mộ');
});

test('Nine-Star and Eight-Door seasonal strength remain separate formulas',()=>{
  const same=seasonalStrength(board('寅'),palace());
  assert.equal(same.star.status,'tướng');
  assert.equal(same.door.status,'vượng');
  assert.notEqual(same.star.status,same.door.status);

  const water=seasonalStrength(board('寅'),palace({starElement:'Thủy',doorElement:'Thủy'}));
  assert.equal(water.star.status,'vượng');
  assert.equal(water.door.status,'tướng');
  assert.match(water.star.convention,/Cửu Tinh/);
  assert.match(water.door.convention,/Bát Môn/);
});

test('role strength follows the actual Useful-God type instead of reusing star strength',()=>{
  const s=seasonalStrength(board('申'),palace({element:'Thổ',starElement:'Hỏa',doorElement:'Mộc',stem:'戊'}));
  const money=roleStrength({id:'money',basis:'proxy'},s);
  const capital=roleStrength({id:'capital',stem:'戊',basis:'KM-YONGSHEN-2.0:stem:戊'},s);
  assert.equal(money.kind,'door');
  assert.equal(money.status,s.door.status);
  assert.equal(capital.kind,'stem');
  assert.equal(capital.status,s.stems[0].longevity.vi);
  assert.notEqual(money.kind,capital.kind);

  const agg=aggregateRoleStrength([
    {id:'money',basis:'proxy',yongshenTier:'primary'},
    {id:'capital',stem:'戊',basis:'KM-YONGSHEN-2.0:stem:戊',yongshenTier:'corroborator'}
  ],s);
  assert.equal(agg.basis,'primary_yongshen_strength');
  assert.equal(agg.roles.find(r=>r.roleId==='money').kind,'door');
});

test('a favorable symbol with weak role strength is conditional rather than automatically positive',()=>{
  const selected=[{
    palace:3,actorIds:['event'],evidenceIds:['p3','strength_3'],
    symbols:{door:{id:'kai',vi:'Khai Môn'},star:{id:'fu',vi:'Thiên Phụ'},deity:{id:'earth9',vi:'Cửu Địa'}},
    strength:{status:'vượng'},
    capacityStrength:{band:'weak',roles:[{roleId:'event',kind:'stem',band:'weak',status:'Tuyệt',meaning:'khí rất thấp'}]},
    stemResponses:[],conflicts:[]
  }];
  const context={domain:'general',intent:'understand_event',outcomeTarget:{stageAsked:'formation'}};
  const dims=buildOutcomeDimensions(selected,context,[]);
  assert.equal(dims.formation.status,'conditional');
  assert.ok(dims.formation.conditions.some(x=>/lực yếu/i.test(x)));
});

test('real reading exports KM-STRENGTH-2.0 and writer sees bands/statuses without numeric strength weights',()=>{
  const p=prepareReading({question:'Công việc của tôi tháng này có tiến triển không?',topic:'general',mode:'auto',method:'chaibu',
    input:{year:2026,month:9,day:21,hour:6,minute:23,tzOffset:7}});
  const g=p.context.allInOne.reasoning,w=buildWriterContext(p.context).readingGraph;
  assert.equal(p.analysis.palaces[0].strength.version,'KM-STRENGTH-2.0');
  assert.equal(g.strengthProfile.version,'KM-STRENGTH-2.0');
  assert.equal(w.strengthProfile.version,'KM-STRENGTH-2.0');
  for(const b of w.evidenceBundles){
    assert.ok(['strong','usable','weak'].includes(b.strength.capacityBand));
    assert.equal(Object.hasOwn(b.strength,'weight'),false);
    assert.ok(b.strength.roles.every(r=>!Object.hasOwn(r,'weight')));
  }
  assert.ok(Object.values(p.facts).some(v=>typeof v==='string'&&v.includes('KM-STRENGTH-2.0')));
});

test('finance reading keeps Sheng-Door money strength separate from Wu-stem capital strength',()=>{
  const p=prepareReading({question:'Dòng tiền kinh doanh tháng này có đủ để duy trì hoạt động không?',topic:'money',mode:'auto',method:'chaibu',
    input:{year:2026,month:9,day:21,hour:6,minute:23,tzOffset:7}});
  const bundles=p.context.allInOne.reasoning.evidenceBundles;
  const money=bundles.flatMap(b=>b.capacityStrength.roles).find(r=>r.roleId==='money');
  const capital=bundles.flatMap(b=>b.capacityStrength.roles).find(r=>r.roleId==='capital');
  assert.ok(money);assert.equal(money.kind,'door');
  assert.ok(capital);assert.equal(capital.kind,'stem');
});
