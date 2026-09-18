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
