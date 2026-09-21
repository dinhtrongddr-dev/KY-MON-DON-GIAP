import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareReading} from '../local/reading.mjs';
import {ATTENTION_VERSION,buildAttentionProfile} from '../dist/qimen/analysis/attentionUi.mjs';
import {analyzeBoard} from '../dist/qimen/analysis/index.mjs';
import {toQimenBoard} from '../dist/qimen/core/board.mjs';

const q='Trong tuần này tôi có khoản tiền vào được phát sinh không?';
const prep=(day,hour)=>prepareReading({question:q,topic:'general',mode:'auto',method:'chaibu',input:{year:2026,month:9,day,hour,minute:0,tzOffset:7}});

test('attention UI is presentation-only and exposes no numeric/probability verdict',()=>{
  const p=prep(1,17),before=JSON.stringify(p.context.allInOne.reasoning.primaryJudgment);
  const a=buildAttentionProfile(p.analysis);
  assert.equal(a.version,ATTENTION_VERSION);
  assert.equal(a.policy.numericScore,false);
  assert.equal(a.policy.probability,false);
  assert.equal(a.policy.verdictOverride,false);
  assert.equal(a.policy.sevenStarsPath,false);
  assert.equal(JSON.stringify(p.context.allInOne.reasoning.primaryJudgment),before);
  assert.ok(Object.values(a.byPalace).every(x=>!Object.hasOwn(x,'score')&&!Object.hasOwn(x,'probability')));
});

test('Green Dragon Returns is highlighted as strong support without claiming certainty',()=>{
  const a=buildAttentionProfile(prep(1,17).analysis),x=a.byPalace[9];
  assert.equal(x.kind,'strong_support');
  assert.equal(x.label,'Thuận mạnh');
  assert.ok(x.supports.some(s=>s.code==='green_dragon_returns'));
  assert.equal(x.warningBand,0);
  assert.match(x.meaning,/không phải xác suất/i);
});

test('Three-Wonder Tomb is highlighted as a strong warning',()=>{
  const a=buildAttentionProfile(prep(1,1).analysis),x=a.byPalace[6];
  assert.equal(x.kind,'danger');
  assert.equal(x.label,'Cảnh báo mạnh');
  assert.ok(x.warnings.some(w=>w.code==='wonder_tomb'&&/Bính/.test(w.detail)));
});

test('strong favorable and strong adverse signals do not cancel each other',()=>{
  const a=buildAttentionProfile(prep(2,3).analysis),x=a.byPalace[3];
  assert.equal(x.kind,'conflict');
  assert.equal(x.label,'Xung đột mạnh');
  assert.ok(x.supports.some(s=>s.code==='green_dragon_returns'));
  assert.ok(x.warnings.some(w=>w.code==='punishment'));
  assert.equal(x.supportBand,2);
  assert.equal(x.warningBand,2);
});

test('attention colors are structural and do not change with the selected topic',()=>{
  const p=prep(2,3),board=toQimenBoard(p.chart);
  const general=buildAttentionProfile(analyzeBoard(board,{topic:'general'}));
  const finance=buildAttentionProfile(analyzeBoard(board,{topic:'finance'}));
  const relationship=buildAttentionProfile(analyzeBoard(board,{topic:'relationship'}));
  const shape=x=>Object.fromEntries(Object.entries(x.byPalace).map(([n,v])=>[n,[v.kind,v.supportBand,v.warningBand]]));
  assert.deepEqual(shape(general),shape(finance));
  assert.deepEqual(shape(general),shape(relationship));
});

test('board UI contains visible attention legend, palace badges and detail card',()=>{
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.match(app,/buildAttentionProfile/);
  assert.match(app,/attention-badge/);
  assert.match(app,/Mức độ đáng chú ý/);
  assert.match(html,/attention-key-support/);
  assert.match(html,/Thuận mạnh/);
  assert.match(html,/Cảnh báo mạnh/);
  assert.match(css,/\.attention-card-danger/);
  assert.match(css,/\.attention-palace-conflict/);
});
