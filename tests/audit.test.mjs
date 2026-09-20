import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateQimen, buildEarthPlate, buildRotatingLayers, pillarFromGanzhi, sexagenaryName, sexagenaryIndex, yuanByFuHead, yuanByTermElapsed, TERMS, PALACES, STEMS} from '../dist/qimen.mjs';
import {relation,locateStem,palaceConditions,CONTROLS,TOPICS} from '../dist/guide.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const base={year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7};
const ring=[1,8,3,4,9,2,7,6], wrap=n=>((n-1)%9+9)%9+1;
const fromInstant=(ms,tzOffset=8)=>{const d=new Date(ms+tzOffset*3600000);return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),tzOffset};};

test('reject malformed dates, fractional clock fields, empty/coerced inputs and impossible pillars',()=>{
  for(const field of Object.keys(base)) for(const bad of [null,undefined,'',false,NaN,Infinity,[],{}]) assert.throws(()=>generateQimen({...base,[field]:bad}),`${field}=${bad}`);
  for(const field of ['year','month','day','hour','minute']) assert.throws(()=>generateQimen({...base,[field]:base[field]+0.5}));
  for(const bad of [{month:0},{month:13},{day:0},{day:31},{month:2,day:29,year:1900},{month:2,day:29,year:2100},{hour:24},{minute:60},{year:1899},{year:2101},{tzOffset:14.1},{tzOffset:5.123}]) assert.throws(()=>generateQimen({...base,...bad}));
  for(const tzOffset of [-12,-3.5,0,5.5,5.75,7,8,12.75,14]) assert.doesNotThrow(()=>generateQimen({...base,tzOffset}));
  assert.doesNotThrow(()=>generateQimen({...base,year:2000,month:2,day:29}));
  for(const invalid of ['甲丑','甲子子','甲','',null]) assert.throws(()=>pillarFromGanzhi(invalid));
  for(let i=0;i<60;i++) assert.equal(sexagenaryIndex(pillarFromGanzhi(sexagenaryName(i)).han),i);
  assert.throws(()=>sexagenaryName(0.5));
  assert.throws(()=>relation('sai','sai'));assert.throws(()=>relation('Kim',undefined));
  const chart=generateQimen(base);
  assert.throws(()=>locateStem(chart,'甲'));
  for(const jia of ['甲子','甲戌','甲申','甲午','甲辰','甲寅']) assert.equal(locateStem(chart,jia).effective,['戊','己','庚','辛','壬','癸'][Math.floor(sexagenaryIndex(jia)/10)]);
});

test('all 1080 rotating configurations: 2 dun × 9 ju × 60 hours, with independent invariants',()=>{
  let count=0,centreHeads=0,centreTargets=0;
  const instruments=['戊','己','庚','辛','壬','癸'];
  const voids=[[10,11],[8,9],[6,7],[4,5],[2,3],[0,1]];
  for(const yang of [true,false]) for(let ju=1;ju<=9;ju++) for(let h=0;h<60;h++) {
    const earth=buildEarthPlate(ju,yang),p=buildRotatingLayers(earth,pillarFromGanzhi(sexagenaryName(h)),yang);
    assert.equal(earth[ju].han,'戊');
    const seq=['戊','己','庚','辛','壬','癸','丁','丙','乙'];
    for(let n=1;n<=9;n++) assert.equal(earth[wrap(n+(yang?1:-1))].han,seq[(seq.indexOf(earth[n].han)+1)%9]);
    const head=+Object.keys(earth).find(n=>earth[n].han===instruments[Math.floor(h/10)]);
    const target=+Object.keys(earth).find(n=>earth[n].han===(h%10===0?instruments[Math.floor(h/10)]:STEMS[h%10].han));
    assert.equal(p.xun.instrumentPalace,head);
    assert.equal(p.duty.rawStarPalace,target);assert.equal(p.duty.starPalace,target===5?2:target);
    let walked=head;for(let t=0;t<h%10;t++)walked=wrap(walked+(yang?1:-1));
    assert.equal(p.duty.rawDoorPalace,walked);assert.equal(p.duty.doorPalace,walked===5?2:walked);
    assert.equal(new Set(Object.values(p.stars).map(s=>s.primary.id)).size,8);
    assert.equal(new Set(Object.values(p.doors).map(s=>s.id)).size,8);
    assert.equal(new Set(Object.values(p.spirits).map(s=>s.id)).size,8);
    assert.equal(new Set(Object.values(p.heavenStems).flat().map(s=>s.han)).size,9);
    const qin=ring.find(n=>p.stars[n].carriesQin);
    assert.equal(p.stars[qin].primary.id,'rui');
    assert.deepEqual(p.heavenStems[qin].map(s=>s.han),[earth[2].han,earth[5].han]);
    assert.equal(p.duty.star.id,head===5?'qin':buildRotatingLayers(earth,pillarFromGanzhi(sexagenaryName(Math.floor(h/10)*10)),yang).stars[head].primary.id);
    assert.equal(p.doors[p.duty.doorPalace].id,p.duty.door.id);
    assert.equal(p.spirits[p.duty.starPalace].id,'chief');
    const expectedSpirits=['chief','snake','moon','harmony','tiger','tortoise','earth9','heaven9'];
    const start=ring.indexOf(p.duty.starPalace);
    expectedSpirits.forEach((id,i)=>assert.equal(p.spirits[ring[(start+(yang?i:-i)+8)%8]].id,id));
    assert.deepEqual(p.voidBranches,voids[Math.floor(h/10)]);
    const hb=h%12;
    const horse=[8,11,2,5][[2,6,10].includes(hb)?0:[5,9,1].includes(hb)?1:[8,0,4].includes(hb)?2:3];
    assert.equal(p.horseBranch,horse);assert.ok(PALACES[p.horsePalace].branches.includes(horse));
    const originals=['peng','ren','chong','fu','ying','rui','zhu','xin'];
    assert.equal(p.patterns.starFuYin,ring.every((n,i)=>p.stars[n].primary.id===originals[i]));
    assert.equal(p.patterns.starFanYin,ring.every((n,i)=>p.stars[10-n].primary.id===originals[i]));
    const doors=['xiu','sheng','shang','du','jing','si','fear','kai'];
    assert.equal(p.patterns.doorFuYin,ring.every((n,i)=>p.doors[n].id===doors[i]));
    assert.equal(p.patterns.doorFanYin,ring.every((n,i)=>p.doors[10-n].id===doors[i]));
    if(head===5){centreHeads++;assert.equal(p.duty.door.id,'si');}
    if(target===5)centreTargets++;
    count++;
  }
  assert.equal(count,1080);assert.equal(centreHeads,120);assert.equal(centreTargets,120);
});

// Primary-source worked examples, not generated snapshots:
// https://zh.wikisource.org/wiki/遁甲演義_(四庫全書本)/卷2
test('eight classical worked configurations: Tian/Di/Ren Dun, flying bird and returning dragon',()=>{
  const fixtures=[
    [4,true,'乙酉','xin',3,'kai',7,1,'丙','丁','sheng'],
    [6,false,'庚申','peng',4,'xiu',4,9,'丙','丁','sheng'],
    [1,true,'辛卯','chong',4,'shang',1,2,'乙','己','kai'],
    [9,false,'丙寅','ying',2,'jing',7,8,'乙','己','kai'],
    [7,true,'丙子','ren',2,'sheng',1,6,'丁','乙','xiu'],
    [1,true,'丙寅','peng',8,'xiu',3,8,'戊','丙','kai'],
    [9,true,'辛未','ying',3,'jing',7,9,'丙','戊',null],
    [3,true,'丁卯','chong',9,'shang',6,3,'丙','戊',null],
  ];
  for(const [ju,yang,hour,star,starPalace,door,doorPalace,n,heaven,ground,m] of fixtures){
    const earth=buildEarthPlate(ju,yang),layers=buildRotatingLayers(earth,pillarFromGanzhi(hour),yang);
    assert.equal(layers.duty.star.id,star,`${ju}/${hour}`);assert.equal(layers.duty.starPalace,starPalace);
    assert.equal(layers.duty.door.id,door);assert.equal(layers.duty.doorPalace,doorPalace);
    assert.ok(layers.heavenStems[n].some(s=>s.han===heaven));assert.equal(earth[n].han,ground);
    if(m)assert.equal(layers.doors[n].id,m);
  }
  const yin=buildRotatingLayers(buildEarthPlate(9,false),pillarFromGanzhi('丙寅'),false);
  assert.equal(yin.spirits[4].id,'moon');assert.equal(yin.spirits[3].id,'harmony');assert.equal(yin.spirits[7].id,'heaven9');assert.equal(yin.spirits[6].id,'earth9');
});

// HKO publishes minute-rounded instants; allow 90 seconds, not exact-minute equality.
// https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf
test('twelve 2024 major terms against Hong Kong Observatory, and both sides of each boundary',()=>{
  const refs=[[1,20,22,7,'dahan'],[2,19,12,13,'yushui'],[3,20,11,6,'chunfen'],[4,19,22,0,'guyu'],[5,20,21,0,'xiaoman'],[6,21,4,51,'xiazhi'],[7,22,15,44,'dashu'],[8,22,22,55,'chushu'],[9,22,20,44,'qiufen'],[10,23,6,15,'shuangjiang'],[11,22,3,56,'xiaoxue'],[12,21,17,21,'dongzhi']];
  for(const [month,day,hour,minute,id] of refs) {
    const published=Date.UTC(2024,month-1,day,hour,minute)-8*3600000;
    const current=generateQimen(fromInstant(published+5*60000));
    assert.equal(current.term.id,id);
    assert.ok(Math.abs(current.term.utcMs-published)<=90000,`${id} differs ${Math.abs(current.term.utcMs-published)/1000}s`);
    for(const method of ['chaibu','maoshan']) for(const offset of [-12,0,5.75,7,8,14]) {
      const before=generateQimen(fromInstant(current.term.utcMs-60000,offset),method);
      const after=generateQimen(fromInstant(current.term.utcMs+60000,offset),method);
      assert.notEqual(before.term.id,id);assert.equal(after.term.id,id);
      assert.equal(after.dun.isYang,TERMS[id].isYang);
      if(method==='maoshan')assert.equal(after.dun.yuanIndex,0);
    }
  }
});

test('all 24 term tables and all 60 Fu-head days; Mao Shan exact 120/240h boundaries',()=>{
  const expected={dongzhi:[1,7,4],xiaohan:[2,8,5],dahan:[3,9,6],lichun:[8,5,2],yushui:[9,6,3],jingzhe:[1,7,4],chunfen:[3,9,6],qingming:[4,1,7],guyu:[5,2,8],lixia:[4,1,7],xiaoman:[5,2,8],mangzhong:[6,3,9],xiazhi:[9,3,6],xiaoshu:[8,2,5],dashu:[7,1,4],liqiu:[2,5,8],chushu:[1,4,7],bailu:[9,3,6],qiufen:[7,1,4],hanlu:[6,9,3],shuangjiang:[5,8,2],lidong:[6,9,3],xiaoxue:[5,8,2],daxue:[4,7,1]};
  for(const [id,ju] of Object.entries(expected))assert.deepEqual(TERMS[id].ju,ju);
  for(let i=0;i<60;i++) {
    let head=i;while(head%10!==0 && head%10!==5)head--;
    const branch=sexagenaryName(head)[1];
    assert.equal(yuanByFuHead(i).fuHead,sexagenaryName(head));
    assert.equal(yuanByFuHead(i).yuanIndex,'子午卯酉'.includes(branch)?0:'寅申巳亥'.includes(branch)?1:2);
  }
  for(const [days,yuan] of [[0,0],[4.999999,0],[5,1],[9.999999,1],[10,2],[15.7,2]]) assert.equal(yuanByTermElapsed(days),yuan);
  const origin=generateQimen({...base,year:2024,month:1,day:8}).term.utcMs;
  for(const days of [5,10]){
    assert.equal(generateQimen(fromInstant(origin+days*86400000-60000),'maoshan').dun.yuanIndex,days===5?0:1);
    assert.equal(generateQimen(fromInstant(origin+days*86400000+60000),'maoshan').dun.yuanIndex,days===5?1:2);
  }
});

test('civil-day/hour formulas independent of lunar library across 1900–2100, leap/year ends and UTC extremes',()=>{
  let count=0;
  // 2000-01-07 is a Jia Zi day; the equivalent continuous Julian-day rule is (JDN + 49) mod 60.
  const epoch=Date.UTC(2000,0,7);
  for(const year of [1900,1901,1950,1999,2000,2024,2026,2099,2100]) for(const [month,day] of [[1,1],[2,28],[3,1],[6,21],[12,31]]) for(const hour of [0,1,12,22,23]) for(const tzOffset of [-12,7,14]) {
    const input={year,month,day,hour,minute:hour===22?59:0,tzOffset};
    const c=generateQimen(input), index=((Math.round((Date.UTC(year,month-1,day)-epoch)/86400000)+(hour===23?1:0))%60+60)%60;
    assert.equal(c.pillars.day.han,sexagenaryName(index));
    const branch=Math.floor((hour+1)/2)%12, stem=((index%10)%5*2+branch)%10;
    assert.equal(c.pillars.hour.stem.han,STEMS[stem].han);assert.equal(sexagenaryIndex(c.pillars.hour.han)%12,branch);
    assert.ok(c.term.utcMs<=c.utcMs&&c.nextTerm.utcMs>c.utcMs);count++;
  }
  assert.equal(count,675);
});

test('all six punishments, three wonder tombs and direction of door pressure, including carried stems',()=>{
  const punish={'戊':3,'己':2,'庚':8,'辛':9,'壬':4,'癸':4},tombs={'乙':2,'丙':6,'丁':8};
  for(const number of ring) for(const stem of STEMS.slice(1)) {
    const p={...PALACES[number],heavenStems:[stem],door:{element:'Mộc'}};
    const c=palaceConditions(p);
    assert.deepEqual(c.punishment,punish[stem.han]===number?[stem.vi]:[]);
    assert.deepEqual(c.wonderTombs,tombs[stem.han]===number?[stem.vi]:[]);
    assert.equal(c.doorPressure,CONTROLS.Mộc===p.element);
  }
  const carried={...PALACES[6],heavenStems:[STEMS[4],STEMS[2]],door:{element:'Thổ'}};
  assert.deepEqual(palaceConditions(carried).wonderTombs,['Bính']);
  assert.deepEqual(palaceConditions({...carried,number:5}),{doorPressure:false,punishment:[],wonderTombs:[]});
});
