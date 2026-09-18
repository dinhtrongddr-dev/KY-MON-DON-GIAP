import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createActivityStore} from '../local/activity-store.mjs';

test('server activity store persists counts and reading metadata without question text',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'kymon-activity-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const file=join(dir,'activity.json');let now=Date.UTC(2026,8,18,5,0,0);
  const store=createActivityStore({filePath:file,now:()=>now});
  store.recordChart();store.recordChart();
  const id=store.startReading();store.finishReading(id,{status:'completed',modelUsed:{label:'GPT-5.6 Sol',routeLabel:'9router · ChatGPT',effort:'xhigh'}});
  const s=store.summary(7);assert.equal(s.date,'2026-09-18');assert.equal(s.chartCount,2);assert.equal(s.readingCount,1);
  assert.equal(s.recentReadings[0].model,'GPT-5.6 Sol');
  const raw=await readFile(file,'utf8');assert.doesNotMatch(raw,/question|câu hỏi|hop dong/i);
  const reload=createActivityStore({filePath:file,now:()=>now});assert.equal(reload.summary(7).readingCount,1);
});

test('server activity store uses requested timezone for today and interrupts stale running reads on restart',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'kymon-activity-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const file=join(dir,'activity.json');let now=Date.UTC(2026,8,18,17,30,0);
  const first=createActivityStore({filePath:file,now:()=>now});first.recordChart();first.startReading();
  assert.equal(first.summary(7).date,'2026-09-19');assert.equal(first.summary(0).date,'2026-09-18');
  now+=1000;const reload=createActivityStore({filePath:file,now:()=>now});
  assert.equal(reload.summary(7).recentReadings[0].status,'interrupted');
});
