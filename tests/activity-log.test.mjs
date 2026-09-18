import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivityLog,summarizeActivity} from '../dist/activity-log.mjs';

class MemoryStorage {
  constructor(){this.values=new Map();}
  getItem(key){return this.values.get(key)??null;}
  setItem(key,value){this.values.set(key,String(value));}
}
test('activity log counts explicit charts and AI attempts for the current local day',()=>{
  const storage=new MemoryStorage();let now=new Date(2026,8,18,10,0,0).getTime();
  const log=createActivityLog({storage,document:null,now:()=>now});
  log.recordChart();log.recordChart();
  const id=log.startReading();log.finishReading(id,{status:'completed',modelUsed:{label:'GPT-5.6 Sol',routeLabel:'9router · ChatGPT',effort:'xhigh'}});
  assert.equal(log.snapshot().chartCount,2);assert.equal(log.snapshot().readingCount,1);
  now=new Date(2026,8,19,0,1,0).getTime();
  assert.equal(log.render().chartCount,0);assert.equal(log.snapshot().readingCount,0);
});
test('activity persistence stores metadata only and never a question',()=>{
  const storage=new MemoryStorage(),now=new Date(2026,8,18,11,0,0).getTime();
  const log=createActivityLog({storage,document:null,now:()=>now});
  const id=log.startReading();log.finishReading(id,{status:'fallback',modelUsed:{label:'GPT-5.6 Sol',provider:'9router/codex',effort:'xhigh'}});
  const raw=storage.getItem('qimen.activity.v1');
  assert.match(raw,/GPT-5.6 Sol/);assert.doesNotMatch(raw,/question|câu hỏi|hop dong/i);
  const reload=createActivityLog({storage,document:null,now:()=>now});
  assert.equal(reload.snapshot().recentReadings[0].status,'fallback');
});
test('a reading left running before reload is marked interrupted',()=>{
  const storage=new MemoryStorage(),now=new Date(2026,8,18,12,0,0).getTime();
  createActivityLog({storage,document:null,now:()=>now}).startReading();
  const reload=createActivityLog({storage,document:null,now:()=>now+1000});
  assert.equal(reload.snapshot().recentReadings[0].status,'interrupted');
});
test('summary counts only events on today while retaining recent reading history',()=>{
  const now=new Date(2026,8,18,12,0,0).getTime(),yesterday=new Date(2026,8,17,23,0,0).getTime();
  const summary=summarizeActivity([
    {id:'c1',type:'chart',at:yesterday},{id:'r1',type:'reading',at:yesterday,status:'completed'},
    {id:'c2',type:'chart',at:now},{id:'r2',type:'reading',at:now,status:'completed'}
  ],now);
  assert.equal(summary.chartCount,1);assert.equal(summary.readingCount,1);assert.equal(summary.recentReadings.length,2);
});

class ViewElement {
  constructor(){this.textContent='';this.children=[];this.className='';}
  replaceChildren(){this.children=[];}
  append(...nodes){this.children.push(...nodes);}
}
test('browser activity view prefers shared server totals and sends chart increments without a pairing token',async()=>{
  const ids=Object.fromEntries(['activity-chart-count','activity-reading-count','activity-reading-list','activity-storage-note'].map(id=>[id,new ViewElement()]));
  const document={getElementById:id=>ids[id]||null,createElement:()=>new ViewElement()};
  const calls=[],server={chartCount:12,readingCount:4,recentReadings:[{at:Date.now(),status:'completed',model:'GPT-5.6 Sol',route:'9router · ChatGPT',effort:'xhigh'}]};
  const fetcher=async(url,options={})=>{
    calls.push({url:String(url),options});
    if(options.method==='POST')server.chartCount++;
    return new Response(JSON.stringify({activity:server}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const log=createActivityLog({storage:new MemoryStorage(),document,fetcher,endpoint:'https://relay.example',pollMs:0});
  await log.refresh();
  assert.equal(ids['activity-chart-count'].textContent,'12');assert.equal(ids['activity-reading-count'].textContent,'4');
  assert.match(ids['activity-storage-note'].textContent,/bộ kết nối chung/i);
  log.recordChart();await new Promise(resolve=>setImmediate(resolve));
  const post=calls.find(call=>call.options.method==='POST');assert.ok(post);assert.match(post.url,/\/api\/activity\/chart/);
  assert.equal(post.options.headers?.['X-Qimen-Token'],undefined);
  assert.equal(ids['activity-chart-count'].textContent,'13');
});
