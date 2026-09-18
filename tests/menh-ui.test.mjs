import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../dist/menh.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/menh-app.mjs',import.meta.url),'utf8');
const main=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');

test('Mệnh UI exposes exactly known time input plus Không nhớ giờ sinh checkbox',()=>{
  assert.match(html,/id="birth-date"/);
  assert.match(html,/id="birth-time"/);
  assert.match(html,/id="birth-time-unknown"/);
  assert.match(html,/>Không nhớ giờ sinh</);
  assert.doesNotMatch(html,/birth-time-range|RANGE/);
});
test('Mệnh UI never submits a hidden remembered time in UNKNOWN mode',()=>{
  assert.match(app,/birthTimeMode:unknown\.checked\?'UNKNOWN':'KNOWN'/);
  assert.match(app,/birthTimeLocal:unknown\.checked\?null:time\.value/);
  assert.match(app,/time\.value='';time\.disabled=true;time\.required=false/);
});
test('question and natal products link to each other without replacing the question form',()=>{
  assert.match(main,/href="\.\/menh\.html">Kỳ Môn Mệnh/);
  assert.match(html,/href="\.\/index\.html">Hỏi việc/);
  assert.match(main,/id="chart-form"/);
  assert.match(html,/id="menh-form"/);
});
test('Mệnh page loads calendar before the Mệnh app module',()=>{
  assert.ok(html.indexOf('./vendor/lunar.js')<html.indexOf('./menh-app.mjs'));
});


test('Mệnh UI renders the exact natal QimenBoard already used by KM-MENH instead of generating another board',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/prepared\.result\?\.natal\?\.baseBoard/);
  assert.match(view,/Mệnh bàn Kỳ Môn/);
  assert.doesNotMatch(view,/Mệnh bàn Kỳ Môn 3×3/);
  assert.match(view,/BẢN MỆNH · BẠN Ở ĐÂY/);
  assert.match(view,/Trực Phù/);
  assert.match(view,/Trực Sử/);
  assert.match(view,/Không Vong/);
  assert.match(view,/Mã tinh/);
  assert.match(view,/Phục Ngâm/);
  assert.match(view,/Phản Ngâm/);
  assert.doesNotMatch(view,/generateQimen|createQimenBoard/);
});
test('Mệnh UI does not present a fake representative board when birth time is unknown',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/Chưa thể xác định một Mệnh bàn duy nhất/);
  assert.match(view,/không bỏ phiếu đa số/);
  assert.match(view,/không dựng một bàn đại diện giả/);
});
test('Mệnh AI long-form renderer preserves paragraph breaks',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/appendAiParagraphs/);
  assert.match(view,/split\(\/\\n\{2,\}\//);
});

test('Mệnh profile accepts and displays full name and birthplace without changing the natal board method',()=>{
  const core=readFileSync(new URL('../dist/menh-reading-core.mjs',import.meta.url),'utf8');
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(html,/id="birth-name"/);assert.match(html,/id="birth-place"/);
  assert.match(app,/fullName:name\.value\.trim\(\)/);assert.match(app,/birthPlace:place\.value\.trim\(\)/);
  assert.match(core,/fullName/);assert.match(core,/birthPlace/);
  assert.match(view,/Họ và tên/);assert.match(view,/Nơi sinh/);
});
test('Mệnh long-form reading visually emphasizes fast-scan translated takeaways without HTML injection',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/FOCUS_PATTERNS/);assert.match(view,/menh-ai-focus/);
  assert.match(view,/document\.createTextNode/);assert.doesNotMatch(view,/innerHTML/);
});
