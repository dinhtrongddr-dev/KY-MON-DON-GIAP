import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');

test('desktop result order puts compact AI before the board and keeps Five Elements below the board workspace',()=>{
  const ai=html.indexOf('class="learning-panel ai-panel');
  const workspace=html.indexOf('class="workspace"');
  assert.ok(ai>0&&workspace>ai,'AI panel must appear before the board workspace');
  assert.match(css,/grid-template-columns:\s*minmax\(620px,\s*1\.65fr\)\s*minmax\(360px,\s*0\.85fr\)/);
  assert.match(css,/\.workspace\s*>\s*\.element-panel\s*\{\s*grid-column:1\s*\/\s*-1;\s*grid-row:2;/);
  assert.match(css,/align-items:\s*start/);
  assert.match(html,/element-panel-visual/);
  assert.doesNotMatch(html,/element-panel-guide/);
});

test('floating result navigation is one persistent switch and AI sits before Tứ Trụ',()=>{
  assert.match(html,/class="floating-result-nav"/);
  assert.match(html,/id="result-switch"[^>]*data-target="board"[^>]*>Xem bàn<\/button>/);
  assert.doesNotMatch(html,/id="float-board"|id="float-ai"/);
  assert.match(css,/\.floating-result-nav\s*\{[\s\S]*position:fixed/);
  const ai=html.indexOf('class="learning-panel ai-panel'),meta=html.indexOf('class="chart-meta"');
  assert.ok(ai>0&&meta>ai,'AI panel must appear before Tứ Trụ/chart meta');
  for(const label of ['Mộc · xanh lá','Hỏa · đỏ','Thổ · nâu','Kim · vàng','Thủy · xanh dương','Màu dùng để nhận diện hành'])assert.equal(html.includes(label),false);
});

test('selected palace separates modern translation from traditional gloss and keeps the full modern Cung-Thần-Tinh-Môn-Can breakdown',()=>{
  assert.match(app,/Dịch tân thời/);
  assert.match(app,/Dịch cổ ngữ/);
  assert.match(app,/data-detail-tab="modern"/);
  assert.match(app,/data-detail-tab="classical"/);
  assert.match(app,/Nghĩa tượng truyền thống của Cung · Thần · Tinh · Môn · Can/);
  assert.match(app,/semantic-modern-list/);
  assert.match(app,/aria-label="Cung Thần Tinh Môn Can"/);
  assert.match(app,/['"]Cung['"]:\s*0/);
  assert.match(app,/['"]Thần['"]:\s*1/);
  assert.match(app,/['"]Tinh['"]:\s*2/);
  assert.match(app,/['"]Môn['"]:\s*3/);
  assert.match(app,/['"]Thiên can['"]:\s*4/);
  assert.match(app,/['"]Địa can['"]:\s*5/);
  assert.match(app,/detailItem\("palace"/);
});

test('palace translation tabs are keyboard navigable and Five Elements guidance remains interactive',()=>{
  assert.match(app,/ArrowLeft/);
  assert.match(app,/ArrowRight/);
  assert.match(app,/bindDetailTabs\(detail\)/);
  assert.match(html,/id="element-diagram"/);
  assert.match(html,/id="element-reading"/);
});
