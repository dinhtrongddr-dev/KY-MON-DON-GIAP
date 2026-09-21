import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');

test('desktop workspace prioritizes board + selected-palace reading and moves Five Elements below',()=>{
  assert.match(css,/grid-template-columns:\s*minmax\(620px,\s*1\.65fr\)\s*minmax\(360px,\s*0\.85fr\)/);
  assert.match(css,/\.workspace\s*>\s*\.element-panel\s*\{\s*grid-column:1\s*\/\s*-1;\s*grid-row:2;/);
  assert.match(css,/align-items:\s*start/);
  assert.match(html,/element-panel-visual/);
  assert.match(html,/element-panel-guide/);
});

test('selected palace separates modern translation from traditional gloss without duplicate semantic dictionary',()=>{
  assert.match(app,/Dịch tân thời/);
  assert.match(app,/Dịch cổ ngữ/);
  assert.match(app,/data-detail-tab="modern"/);
  assert.match(app,/data-detail-tab="classical"/);
  assert.match(app,/Nghĩa tượng truyền thống của Cung · Thần · Tinh · Môn · Can/);
  assert.doesNotMatch(app,/Xem nghĩa từng thành phần/);
  assert.match(app,/detailItem\("palace"/);
});

test('palace translation tabs are keyboard navigable and Five Elements guidance remains interactive',()=>{
  assert.match(app,/ArrowLeft/);
  assert.match(app,/ArrowRight/);
  assert.match(app,/bindDetailTabs\(detail\)/);
  assert.match(html,/id="element-diagram"/);
  assert.match(html,/id="element-reading"/);
});
