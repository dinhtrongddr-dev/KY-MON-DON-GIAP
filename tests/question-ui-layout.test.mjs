import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');

test('desktop result order puts AI before the board and keeps Five Elements below the board workspace',()=>{
  const ai=html.indexOf('class="learning-panel ai-panel"');
  const workspace=html.indexOf('class="workspace"');
  assert.ok(ai>0&&workspace>ai,'AI panel must appear before the board workspace');
  assert.match(css,/grid-template-columns:\s*minmax\(620px,\s*1\.65fr\)\s*minmax\(360px,\s*0\.85fr\)/);
  assert.match(css,/\.workspace\s*>\s*\.element-panel\s*\{\s*grid-column:1\s*\/\s*-1;\s*grid-row:2;/);
  assert.match(css,/align-items:\s*start/);
  assert.match(html,/element-panel-visual/);
  assert.match(html,/element-panel-guide/);
});

test('floating result navigation is persistent and AI jump starts disabled',()=>{
  assert.match(html,/class="floating-result-nav"/);
  assert.match(html,/id="float-board"[^>]*>Xem bàn<\/button>/);
  assert.match(html,/id="float-ai"[^>]*disabled[^>]*aria-disabled="true"[^>]*>Xem luận AI<\/button>/);
  assert.match(css,/\.floating-result-nav\s*\{[\s\S]*position:fixed/);
  assert.match(css,/\.floating-result-button:disabled/);
  assert.match(app,/floatBoard\?\.addEventListener\('click',[\s\S]*board-column[\s\S]*scrollIntoView/);
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
