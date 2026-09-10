import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
globalThis.Solar = createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const {generateQimen} = await import('../dist/qimen.mjs');
const {GENERATES, CONTROLS, TOPICS, relation, locateStem, locateRef} = await import('../dist/guide.mjs');

assert.equal(TOPICS.length, 16);
assert.equal(new Set(TOPICS.map(t=>t.id)).size, 16);
const elements=['Mộc','Hỏa','Thổ','Kim','Thủy'];
for (let i=0;i<5;i++) {
  assert.equal(GENERATES[elements[i]], elements[(i+1)%5]);
  assert.equal(CONTROLS[elements[i]], elements[(i+2)%5]);
  const results=elements.map(e=>relation(elements[i],e));
  assert.equal(new Set(results).size,5);
}
let count=0;
for (const method of ['chaibu','maoshan']) {
  for (let month=1;month<=12;month++) {
    for (const day of [1,10,20]) {
      for (const hour of [0,5,12,19,23]) {
        const chart=generateQimen({year:2026,month,day,hour,minute:30,tzOffset:7},method);
        for (const key of ['day','hour']) {
          const found=locateStem(chart,chart.pillars[key]);
          assert.ok(found.palace, `${key} ${month}/${day} ${hour}`);
          assert.notEqual(found.palace.number,5);
          assert.ok(found.palace.heavenStems.some(s=>s.han===found.effective));
        }
        for (const topic of TOPICS) for (const ref of topic.refs) assert.ok(locateRef(chart,ref), `${topic.id}: ${ref}`);
        count++;
      }
    }
  }
}
const jia=generateQimen({year:2024,month:5,day:10,hour:14,minute:30,tzOffset:7});
assert.equal(jia.pillars.day.han,'甲戌');
assert.equal(locateStem(jia,jia.pillars.day).effective,'己');
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../dist/styles.css',import.meta.url),'utf8');
const aiUi=await readFile(new URL('../dist/ai-local.mjs',import.meta.url),'utf8');
const visibleText=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ');
assert.doesNotMatch(visibleText,/Codex|máy tính|GPT-5|\bSol\b|server local|Kỳ Môn Local/i);
assert.doesNotMatch(aiUi,/Codex|máy tính|GPT-5|\bSol\b|server local|Kỳ Môn Local/i);
assert.match(html,/class="field submit-field"/);
assert.match(css,/\.entity \.vi, \.door-token \.vi, \.earth-stem \.vi \{[^}]*white-space: normal/);
assert.match(css,/\.qimen-board \{ aspect-ratio: auto; grid-template-rows: repeat\(3, minmax\(185px, auto\)\); \}/);
const diagram=html.match(/<div class="element-diagram"[\s\S]*?<\/div>\s*<div class="diagram-legend"/)?.[0]||'';
assert.equal((diagram.match(/class="generate-routes"/g)||[]).length,1);
assert.equal((diagram.match(/class="control-routes"/g)||[]).length,1);
for(const [from,to] of Object.entries(GENERATES)) assert.match(diagram,new RegExp(`data-from="${from}" data-to="${to}"`));
for(const [from,to] of Object.entries(CONTROLS)) assert.match(diagram,new RegExp(`data-from="${from}" data-to="${to}"`));
for(const element of elements) assert.match(diagram,new RegExp(`data-element-choice="${element}"`));
assert.equal((diagram.match(/class="element-icon"/g)||[]).length,5);
assert.match(diagram,/class="taiji-ink" src="\.\/assets\/taiji-ink\.png"/);
assert.equal((diagram.match(/class="bagua-trigram/g)||[]).length,0);
assert.equal((diagram.match(/A220 220 0 0 1/g)||[]).length,5);
assert.match(diagram,/viewBox="0 0 600 600"/);
assert.match(diagram,/markerUnits="userSpaceOnUse"/);
assert.doesNotMatch(css,/\.element-diagram\[data-active\][^{]+\{[^}]*stroke-width/);
assert.doesNotMatch(css,/\.element-routes path\.is-related\s*\{[^}]*stroke-width/);
assert.doesNotMatch(diagram,/[火土金水木五行]/);
assert.match(html,/id="element-reading"[^>]*hidden/);
assert.doesNotMatch(html,/id="elements-table"/);
console.log(`Guide: relations, 16 topics and palace references passed on ${count} charts.`);
