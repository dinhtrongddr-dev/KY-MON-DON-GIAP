import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
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
console.log(`Guide: relations, 16 topics and palace references passed on ${count} charts.`);
