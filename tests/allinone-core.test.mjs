import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {generateQimen,toQimenBoard,createQimenBoard} from '../dist/qimen/core/board.mjs';
import {analyzeBoard} from '../dist/qimen/analysis/index.mjs';
import {seasonalStrength} from '../dist/qimen/analysis/strength.mjs';
import {specialPatterns} from '../dist/qimen/core/patterns.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const input={year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7};
test('480 legacy boards retain the pre-refactor SHA-256 across both methods and boundaries',()=>{
  const hash=createHash('sha256');let count=0;
  for(const method of ['chaibu','maoshan'])for(const year of [1900,2024,2026,2100])for(let month=1;month<=12;month++)
    for(const [day,hour,minute,tzOffset] of [[1,0,0,7],[6,22,59,8],[15,23,0,-5],[21,12,0,5.5],[28,23,59,0]]) {
      const chart=generateQimen({year,month,day,hour,minute,tzOffset},method),json=JSON.stringify(chart);
      const board=toQimenBoard(chart);analyzeBoard(board);assert.equal(JSON.stringify(chart),json);hash.update(json);count++;
    }
  assert.equal(count,480);assert.equal(hash.digest('hex'),'d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea');
});
test('board is JSON-safe, immutable, and analysis does not invent unresolved actors',()=>{
  const b=createQimenBoard(input),a=analyzeBoard(b,{topic:'contract'});
  assert.deepEqual(JSON.parse(JSON.stringify(b)),b);assert.equal(b.palaces.length,9);assert.equal(a.relations.length,64);
  assert.throws(()=>b.palaces[0].number=99,TypeError);
  for(const id of ['customer','competitor','decisionMaker'])assert.equal(a.roles.find(r=>r.id===id).status,'unresolved');
  assert.equal(analyzeBoard(b,{actors:{customer:'甲子'}}).roles.find(r=>r.id==='customer').status,'user_supplied');
  assert.throws(()=>analyzeBoard(b,{actors:{customer:'甲丑'}}));
});
test('star strength uses the named star method, not ordinary element 旺相休囚死',()=>{
  const b=createQimenBoard(input),p={...b.palaces[0],star:{element:'Thủy'}};
  const status=(branch)=>seasonalStrength({...b,pillars:{month:{branch:{han:branch}}}},p).star.status;
  assert.equal(status('寅'),'vượng');assert.equal(status('子'),'tướng');assert.equal(status('申'),'phế');assert.equal(status('午'),'hưu');assert.equal(status('辰'),'tù');
});
test('Ngũ bất ngộ thời requires actual hour-over-day control with the same polarity',()=>{
  const b=createQimenBoard(input);
  assert.equal(specialPatterns({...b,dayGan:'甲',hourGan:'庚'}).wuBuYuShi,true);
  assert.equal(specialPatterns({...b,dayGan:'甲',hourGan:'辛'}).wuBuYuShi,false);
  assert.equal(specialPatterns({...b,dayGan:'庚',hourGan:'甲'}).wuBuYuShi,false);
  assert.equal(specialPatterns({...b,dayGan:'乙',hourGan:'辛'}).wuBuYuShi,true);
});
test('bounded special combinations distinguish main and carried stems without changing the board',()=>{
  const b=createQimenBoard(input),base=b.palaces.find(p=>p.number!==5);
  const variant=(stem,earth,door,spirit)=>({...b,palaces:[{...base,heavenStems:[{han:'壬'},{han:stem}],earthStem:{han:earth},door:{id:door},spirit:{id:spirit}}]});
  for(const [stem,earth,door,spirit,id] of [['丙','丁','sheng','tiger','tian_dun'],['乙','己','kai','chief','di_dun'],['丁','戊','xiu','moon','ren_dun']]) {
    const found=specialPatterns(variant(stem,earth,door,spirit)).matches.find(x=>x.id===id);assert.ok(found);assert.equal(found.carried,true);
  }
  assert.ok(!specialPatterns(variant('丙','丁','kai','tiger')).matches.some(x=>x.id==='tian_dun'));
});
