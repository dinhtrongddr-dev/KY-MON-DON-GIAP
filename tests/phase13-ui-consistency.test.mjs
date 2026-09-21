import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {prepareReading} from '../dist/reading-core.mjs';
import {actionMetrics} from '../dist/qimen/modes/actionRules.mjs';
import {roleState} from '../dist/qimen/modes/shared.mjs';
import {semanticBundle} from '../dist/qimen/semantic/matrix.mjs';

globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;

test('Phase 13 Hỏi Việc facts expose Six-Register Tomb instead of the old Three-Wonder-only limitation',()=>{
  const p=prepareReading({
    question:'Việc này có tiến triển không?',topic:'general',mode:'prediction',method:'chaibu',
    input:{year:2026,month:9,day:1,hour:0,minute:0,tzOffset:7}
  });
  assert.match(p.facts.c4,/Nhập mộ trên thiên bàn: Tân/);
  assert.match(p.facts.c4,/Lục Nghi: Tân/);
  assert.doesNotMatch(JSON.stringify(p.context),/Không bao hàm nhập mộ các can ngoài Tam kỳ|Ứng kỳ v2/);
  assert.ok(p.context.conventions.some(x=>/KM-TIMING-3\.0.*9 can hiện bàn/.test(x)));
});
test('Timing/Direction action ranking counts a Six-Register Tomb as a blocker',()=>{
  const palace={
    number:4,door:{id:'kai',vi:'Khai Môn'},voided:false,horse:false,
    conditions:{doorPressure:false},
    stemPairs:[{heaven:{han:'辛',vi:'Tân'},carried:false,punishment:false,wonderTomb:false,tomb:true}],
    spirit:{id:'earth9'},star:{vi:'Thiên Phụ'},strength:{star:{status:'vượng'}},
  };
  const row=actionMetrics(palace,'general');
  assert.ok(row.blockers.some(x=>/Tân.*Lục nghi nhập mộ/i.test(x)));
});

test('Mode role state keeps Six-Register Tomb friction on the actual located stem',()=>{
  const analysis={
    roles:[{id:'event',label:'Sự việc',palace:4,status:'resolved',stem:'辛',evidenceId:'role_event'}],
    palaces:[{number:4,door:{id:'kai'},voided:false,horse:false,conditions:{doorPressure:false},
      stemPairs:[{heaven:{han:'辛'},punishment:false,wonderTomb:false,tomb:true}],strength:{star:{status:'vượng'}}}],
    patterns:{layers:{starFanYin:false,doorFanYin:false,starFuYin:false,doorFuYin:false}},
  };
  const state=roleState(analysis,'event');
  assert.ok(state.friction.some(x=>/Lục nghi.*nhập mộ/i.test(x)));
});
test('Semantic state modifier applies Nhập Mộ to Six-Register tombs, not only Three Wonders',()=>{
  const palace={number:4,door:{vi:'Khai Môn'},star:{vi:'Thiên Phụ'},spirit:{vi:'Thái Âm'},
    heavenStems:[{vi:'Tân'}],earthStem:{vi:'Ất'},voided:false,horse:false};
  const value=semanticBundle(palace,{mode:'event',domainId:'business',board:{patterns:{}},
    conditions:{wonderTombs:[],stemTombs:['Tân'],punishment:[]}});
  assert.ok(value.states.some(x=>x.id==='tomb'));
  assert.match(value.summary,/bị giữ|đóng|cất|hạn chế/i);
});

test('Visible Hỏi Việc copy and palace detail no longer contradict KM-TIMING-3.0',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(html,/Chưa hỗ trợ nhập mộ ngoài Tam kỳ/);
  assert.match(html,/KM-TIMING-3\.0/);
  assert.match(app,/Lục nghi nhập mộ/);
  assert.match(app,/KM-TIMING-3\.0 đã phủ cả Tam Kỳ và Lục Nghi/);
});
