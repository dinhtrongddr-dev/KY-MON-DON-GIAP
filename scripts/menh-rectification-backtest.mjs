import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const {prepareMenhReading}=await import('../dist/menh-reading-core.mjs');
const fixture=JSON.parse(readFileSync(new URL('../tests/fixtures/menh-rectification-blind.json',import.meta.url)));
let top1=0,top3=0;
for(const c of fixture.cases){
  const {knownBirthTimeLocal,...input}=c;
  const p=prepareMenhReading({...input,birthTimeMode:'UNKNOWN'}),r=p.rectification.ranked;
  const expected=p.candidates.find(x=>x.time===knownBirthTimeLocal)?.family;
  const rank=r.findIndex(x=>x.family===expected)+1;
  if(rank===1)top1++; if(rank>0&&rank<=3)top3++;
  console.log(`${c.id}: expected=${expected} rank=${rank||'MISS'} status=${p.rectification.status}; ${r.map(x=>`${x.family}:${x.points}`).join(' ')}`);
}
console.log(`BACKTEST n=${fixture.cases.length} top1=${top1}/${fixture.cases.length} top3=${top3}/${fixture.cases.length}`);
if(fixture.cases.length<20) console.log('GATE: DATASET_TOO_SMALL — research only; do not claim rectification accuracy.');
