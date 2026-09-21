// DOM doubles exercise the actual event handlers without an external browser or AI call.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {initLocalAi} from '../dist/ai-local.mjs';
import {buildReadingRequest,RULE_VERSION,READING_PROTOCOL,NIANMING_VERSION} from '../dist/reading-core.mjs';
import {readingFixture,clarificationFixture} from './reading-fixture.mjs';
import {verifiedFallback} from '../dist/qimen/ai/verifiedFallback.mjs';
import {CASE_ENGINE_VERSION} from '../dist/qimen/case/engine.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const payload={question:'Tôi cần chuẩn bị gì cho hợp đồng A trong tháng này?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
class Element {
  constructor(tag='div'){this.tag=tag;this.listeners={};this.hidden=false;this.disabled=false;this.checked=false;this.value='test-token';this.textContent='';this.children=[];this.classes=new Set();this.classList={toggle:(name,force)=>{if(force===undefined)force=!this.classes.has(name);if(force)this.classes.add(name);else this.classes.delete(name);return force;}};}
  get childElementCount(){return this.children.length;}
  addEventListener(event,fn){(this.listeners[event]??=[]).push(fn);}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return (this._text||'')+(this.children||[]).map(n=>n.textContent).join('');}
  fire(event){return Promise.all((this.listeners[event]??[]).map(fn=>fn()));}
  append(el){this.children.push(el);}
  replaceChildren(){this.children=[];}
  setAttribute(name,value){(this.attributes??={})[name]=value;}
  focus(){this.focused=true;}
  scrollIntoView(options){this.scrolled=options;}
}
class MemoryStorage {
  constructor(){this.values=new Map();}
  getItem(key){return this.values.get(key)??null;}
  setItem(key,value){this.values.set(key,String(value));}
  removeItem(key){this.values.delete(key);}
}
function setup(t,fetcher,{storage=new MemoryStorage(),prepare=()=>structuredClone(payload),activity=null}={}){
  const original={document:globalThis.document,fetch:globalThis.fetch,localStorage:globalThis.localStorage};
  globalThis.fetch=fetcher;globalThis.localStorage=storage;
  t.after(()=>Object.assign(globalThis,original));
  const mount=()=>{
    const ids=Object.fromEntries(['local-token','local-remember','local-remember-hint','ai-progress','ai-elapsed','ai-status','ai-answer','ai-read','ai-cancel','local-check','chart-form','float-ai'].map(id=>[id,new Element()]));
    ids['ai-answer'].hidden=true;ids['ai-cancel'].hidden=true;ids['ai-progress'].hidden=true;
    ids['ai-read'].textContent='Luận bằng AI';
    const doc=new Element();doc.getElementById=id=>ids[id];doc.createElement=tag=>new Element(tag);
    globalThis.document=doc;
    initLocalAi({prepare,activity});
    return {ids,doc};
  };
  return {...mount(),storage,reload:mount};
}
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const health={rules:RULE_VERSION,protocol:READING_PROTOCOL,caseRules:CASE_ENGINE_VERSION,nianmingRules:NIANMING_VERSION};

test('old AI rules are rejected before sending the question',async t=>{
  const paths=[];const {ids}=setup(t,async(url,options)=>{paths.push(new URL(url).pathname);assert.equal(options.credentials,'omit');assert.equal(options.headers['X-Qimen-Token'],'test-token');return response({rules:'TG-CB-1.0'});});
  await ids['ai-read'].fire('click');
  assert.deepEqual(paths,['/api/status']);assert.match(ids['ai-status'].textContent,/cập nhật/i);
  assert.equal(ids['ai-answer'].hidden,true);assert.equal(ids['ai-read'].disabled,false);
});

for(const event of ['cancel','question','chart','token']) test(`${event} change discards an in-flight response even when transport ignores abort`,async t=>{
  let release,ready;const started=new Promise(resolve=>ready=resolve);
  const {ids,doc}=setup(t,async(url,options)=>{
    if(url.endsWith('/api/status'))return response(health);
    ready(options.signal);
    return new Promise(resolve=>release=resolve);
  });
  const work=ids['ai-read'].fire('click'),signal=await started;
  if(event==='cancel')await ids['ai-cancel'].fire('click');
  if(event==='question')await ids['chart-form'].fire('input');
  if(event==='chart')await doc.fire('qimen-chart');
  if(event==='token')await ids['local-token'].fire('input');
  assert.equal(signal.aborted,true);
  assert.equal(ids['ai-progress'].hidden,true);
  release(response({malformed:'must never render'}));await work;
  assert.equal(ids['ai-answer'].hidden,true);assert.equal(ids['ai-read'].disabled,false);assert.equal(ids['ai-cancel'].hidden,true);
  assert.doesNotMatch(ids['ai-status'].textContent,/Đã nhận/);
});

test('non-JSON upstream errors are explained, not rendered or thrown uncaught',async t=>{
  const {ids}=setup(t,async()=>new Response('<html>Error</html>',{status:502}));
  await ids['local-check'].fire('click');assert.match(ids['ai-status'].textContent,/không đọc được/);
  assert.equal(ids['ai-answer'].hidden,true);
});

for(const status of [200,502]) test(`AI errors remain visible when the response status is ${status}`,async t=>{
  const error='Provider usage limit reached.';
  const {ids}=setup(t,async url=>url.endsWith('/api/status')?response(health):new Response(' '.repeat(2048)+JSON.stringify({error}),{status,headers:{'Content-Type':'application/json'}}));
  await ids['ai-read'].fire('click');
  assert.equal(ids['ai-status'].textContent,error);
  assert.equal(ids['ai-answer'].hidden,true);
  assert.equal(ids['ai-read'].disabled,false);
  assert.equal(ids['ai-cancel'].hidden,true);
  assert.equal(ids['ai-progress'].hidden,true);
});

test('valid clarification renders text safely; no model HTML is interpreted',async t=>{
  const p=await buildReadingRequest(payload);
  const reading={...clarificationFixture(p),summary:{text:'<script>alert(1)</script>',claim_ids:[]}};
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  await ids['ai-read'].fire('click');
  assert.equal(ids['ai-answer'].hidden,false);
  assert.equal(ids['ai-progress'].hidden,true);
  assert.equal(ids['float-ai'].disabled,true);
  assert.equal(ids['ai-answer'].children[1].children[0].textContent,'<script>alert(1)</script>');
});

test('successful AI reading is recorded without passing the question to activity history',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);
  const modelUsed={id:'gpt-5.6-sol',label:'GPT-5.6 Sol',provider:'9router/codex',routeLabel:'9router · ChatGPT',effort:'xhigh',fallbackIndex:0};
  const calls=[];const activity={startReading(...args){calls.push(['start',args]);return 'r1';},finishReading(...args){calls.push(['finish',args]);}};
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading,modelUsed}),{activity});
  await ids['ai-read'].fire('click');
  assert.deepEqual(calls[0],['start',[]]);
  assert.equal(calls[1][0],'finish');assert.equal(calls[1][1][0],'r1');assert.equal(calls[1][1][1].status,'completed');assert.equal(calls[1][1][1].modelUsed.label,'GPT-5.6 Sol');
  assert.equal(JSON.stringify(calls).includes(payload.question),false);
  assert.equal(ids['float-ai'].disabled,false);
  assert.equal(ids['float-ai'].attributes['aria-disabled'],'false');
  assert.deepEqual(ids['ai-answer'].scrolled,{behavior:'smooth',block:'start'});
  ids['ai-answer'].scrolled=null;await ids['float-ai'].fire('click');
  assert.deepEqual(ids['ai-answer'].scrolled,{behavior:'smooth',block:'start'});
  await ids['chart-form'].fire('input');
  assert.equal(ids['float-ai'].disabled,true);
});

test('deep reading renders all three linked stages, alternatives and the actual model used',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);
  const modelUsed={id:'gpt-6-astra',label:'GPT-6 Astra',provider:'prism',routeLabel:'Prism fallback',effort:'xhigh',fallbackIndex:2};
  const {ids,doc}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading,modelUsed}));
  let selected;doc.querySelector=selector=>({click(){selected=selector;},scrollIntoView(){}});
  await ids['ai-read'].fire('click');
  assert.equal(ids['ai-answer'].hidden,false);
  const all=[];const walk=el=>{all.push(el);el.children.forEach(walk);};walk(ids['ai-answer']);
  for(const part of [reading.situation.text,...reading.development.map(s=>s.text),reading.alternative.text])assert.ok(all.some(n=>n.textContent===part));
  assert.equal(all.filter(n=>n.className==='ai-stage-label').length,3);
  const badge=all.find(n=>n.className==='ai-model-used');assert.ok(badge);assert.match(badge.textContent,/GPT-6 Astra.*xhigh/);assert.doesNotMatch(badge.textContent,/Prism fallback|fallback 2/);
  const button=all.find(n=>n.className==='jump-cung');await button.fire('click');assert.match(selected,/data-palace/);
});

test('verified fallback still shows which model produced the rejected AI draft',async t=>{
  const p=await buildReadingRequest(payload),reading=verifiedFallback(p.context);
  const modelUsed={id:'gpt-5.6-sol',label:'GPT-5.6 Sol',provider:'9router/codex',routeLabel:'9router · ChatGPT',effort:'xhigh',fallbackIndex:0};
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading,modelUsed}));
  await ids['ai-read'].fire('click');
  const all=[];const walk=el=>{all.push(el);el.children.forEach(walk);};walk(ids['ai-answer']);
  assert.ok(all.some(n=>n.className==='ai-model-used'&&/GPT-5.6 Sol.*xhigh/.test(n.textContent)));
  assert.match(ids['ai-status'].textContent,/GPT-5.6 Sol.*xhigh/);
  assert.match(ids['ai-status'].textContent,/còn cần đối chiếu thêm/i);
});

test('timing fallback keeps the deterministic comparison instead of looking empty',async t=>{
  const timingPayload={question:'Ngày nào nên gửi báo giá?',topic:'contract',mode:'timing',action:'quote',method:'chaibu',input:{year:2026,month:9,day:18,hour:10,minute:0,tzOffset:7},candidates:['2026-09-19T09:00','2026-09-20T10:00','2026-09-21T14:00']};
  const p=await buildReadingRequest(timingPayload),reading=verifiedFallback(p.context);
  const modelUsed={id:'gpt-5.6-sol',label:'GPT-5.6 Sol',provider:'9router/codex',routeLabel:'9router · ChatGPT',effort:'xhigh',fallbackIndex:0};
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading,modelUsed}),{prepare:()=>structuredClone(timingPayload)});
  await ids['ai-read'].fire('click');
  const all=[];const walk=el=>{all.push(el);el.children.forEach(walk);};walk(ids['ai-answer']);
  const visible=all.map(n=>n.textContent||'').join(' ');
  assert.match(visible,/AI chưa hoàn tất phần diễn giải chọn thời điểm/);
  assert.match(visible,/So sánh các thời điểm đã nhập/);
  for(const row of p.context.allInOne.comparison.ranking)assert.match(visible,new RegExp(row.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('underdeveloped content is rejected instead of looking like a completed reading',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);reading.development=[];
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  await ids['ai-read'].fire('click');assert.equal(ids['ai-answer'].hidden,true);assert.match(ids['ai-status'].textContent,/ba chặng/);
});
test('five result tabs preserve full text, support keyboard navigation and show only the selected panel',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  await ids['ai-read'].fire('click');
  const all=[];const walk=el=>{all.push(el);el.children.forEach(walk);};walk(ids['ai-answer']);
  assert.equal(ids['ai-answer'].hidden,false);
  const buttons=all.filter(n=>n.attributes?.role==='tab'),panels=all.filter(n=>n.attributes?.role==='tabpanel');
  assert.equal(buttons.length,5);assert.equal(panels.filter(n=>!n.hidden).length,1);
  await buttons[1].fire('click');assert.equal(panels[1].hidden,false);assert.equal(panels[0].hidden,true);
  let prevented=false;buttons[1].listeners.keydown[0]({key:'End',preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(buttons[4].focused,true);assert.equal(panels[4].hidden,false);
  assert.equal(panels.filter(n=>!n.hidden).length,1);
});

test('Niên Mệnh corroboration renders evidence without requiring an evidence bundle',async t=>{
  const nianmingPayload={...payload,nianming:{self:'17/07/1994'}};
  const p=await buildReadingRequest(nianmingPayload),reading=readingFixture(p);
  assert.ok(p.context.allInOne.reasoning.claims.some(c=>c.id==='claim_nianming_self'&&c.bundleId===null));
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}),{prepare:()=>structuredClone(nianmingPayload)});
  await ids['ai-read'].fire('click');
  assert.equal(ids['ai-answer'].hidden,false);
  const all=[];const walk=e=>{all.push(e);e.children.forEach(walk);};walk(ids['ai-answer']);
  assert.ok(all.some(n=>/^Niên Mệnh ·/.test(n.textContent)));
  assert.doesNotMatch(ids['ai-status'].textContent,/undefined|bundle\.roles/i);
});

test('evidence is collapsed and every displayed basis comes from the verified planner',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  await ids['ai-read'].fire('click');
  const all=[];const walk=e=>{all.push(e);e.children.forEach(walk);};walk(ids['ai-answer']);
  const evidence=all.filter(n=>n.tag==='details'&&n.className==='ai-evidence');
  assert.ok(evidence.length>=3);assert.ok(evidence.every(n=>n.open===false));
  assert.ok(all.some(n=>n.textContent===p.facts[p.context.allInOne.reasoning.claims[0].evidenceIds[0]]));
  const visibleText=all.map(n=>n.textContent||'').join(' ');
  assert.doesNotMatch(visibleText,/rule_[a-z0-9_]+|Nguồn:/i);
  assert.ok(all.some(n=>n.textContent==='Căn cứ Kỳ Môn của bài luận'));
  for(const panel of all.filter(n=>n.attributes?.role==='tabpanel')){
    const descendants=[];const visit=n=>{descendants.push(n);n.children.forEach(visit);};visit(panel);
    assert.ok(descendants.filter(n=>n.tag==='details'&&n.className==='ai-evidence').length<=1);
  }
  const traces=all.filter(n=>n.className==='ai-trace');assert.ok(traces.length);
  await traces[0].fire('click');
  assert.ok(evidence.some(n=>n.open===true));
  assert.ok(evidence.some(n=>n.id===traces[0].attributes['aria-controls']));
});

test('reading shows elapsed progress, then clears it when a validated answer arrives',async t=>{
  t.mock.timers.enable({apis:['Date','setInterval'],now:1000});
  const prepared=await buildReadingRequest(payload);
  let release,ready;const started=new Promise(resolve=>ready=resolve);
  const {ids}=setup(t,async url=>{
    if(url.endsWith('/api/status'))return response(health);
    ready();return new Promise(resolve=>release=resolve);
  });
  const work=ids['ai-read'].fire('click');await started;
  try{
    assert.equal(ids['ai-progress'].hidden,false);
    assert.equal(ids['ai-answer'].attributes['aria-busy'],'true');
    assert.equal(ids['ai-read'].disabled,true);
    assert.equal(ids['local-check'].disabled,true);
    assert.equal(ids['ai-cancel'].hidden,false);
    assert.match(ids['ai-read'].textContent,/Đang/);
    assert.match(ids['ai-elapsed'].textContent,/0 giây/);
    t.mock.timers.tick(3000);
    assert.match(ids['ai-elapsed'].textContent,/3 giây/);
  }finally{
    release(response({...health,chartFingerprint:prepared.chartFingerprint,requestFingerprint:prepared.requestFingerprint,facts:prepared.facts,reading:clarificationFixture(prepared)}));
    await work;
  }
  assert.equal(ids['ai-progress'].hidden,true);
  assert.equal(ids['ai-answer'].attributes['aria-busy'],'false');
  assert.equal(ids['ai-read'].textContent,'Luận bằng AI');
  assert.equal(ids['local-check'].disabled,false);
  const elapsed=ids['ai-elapsed'].textContent;t.mock.timers.tick(5000);
  assert.equal(ids['ai-elapsed'].textContent,elapsed);
});

test('cancel hides progress immediately and a late reply cannot stop the next reading',async t=>{
  const releases=[];let ready;let started=new Promise(resolve=>ready=resolve);
  const {ids}=setup(t,async url=>{
    if(url.endsWith('/api/status'))return response(health);
    ready();return new Promise(resolve=>releases.push(resolve));
  });
  const first=ids['ai-read'].fire('click');await started;
  await ids['ai-cancel'].fire('click');
  assert.equal(ids['ai-progress'].hidden,true);
  started=new Promise(resolve=>ready=resolve);
  const second=ids['ai-read'].fire('click');await started;
  try{
    releases[0](response({error:'Old request'}));await first;
    assert.equal(ids['ai-progress'].hidden,false);
    assert.equal(ids['ai-read'].disabled,true);
    assert.doesNotMatch(ids['ai-status'].textContent,/Old request/);
  }finally{releases[1](response({error:'Current request'}));await second;}
  assert.equal(ids['ai-progress'].hidden,true);
  assert.equal(ids['ai-status'].textContent,'Current request');
});

test('connection check shows progress and can be cancelled without a late success message',async t=>{
  let release;const {ids}=setup(t,async()=>new Promise(resolve=>release=resolve));
  const work=ids['local-check'].fire('click');
  try{
    assert.equal(ids['ai-progress'].hidden,false);
    assert.equal(ids['local-check'].disabled,true);
    await ids['ai-cancel'].fire('click');
    assert.equal(ids['ai-progress'].hidden,true);
  }finally{release(response(health));await work;}
  assert.equal(ids['local-check'].disabled,false);
  assert.doesNotMatch(ids['ai-status'].textContent,/sẵn sàng/);
});

test('pairing code remains unsaved until remembering is selected',async t=>{
  const {ids,storage}=setup(t,async()=>response(health));
  ids['local-token'].value='session-only';await ids['local-token'].fire('input');
  await ids['local-check'].fire('click');
  assert.equal(ids['local-remember'].checked,false);
  assert.equal(storage.values.size,0);
});

test('remembered code survives reload, tracks edits and is forgotten immediately when unchecked',async t=>{
  const {ids,storage,reload}=setup(t,async()=>response(health));
  storage.setItem('unrelated-setting','keep');
  ids['local-token'].value='  first-code  ';ids['local-remember'].checked=true;
  await ids['local-remember'].fire('change');
  let next=reload().ids;
  assert.equal(next['local-token'].value,'first-code');
  assert.equal(next['local-remember'].checked,true);
  next['local-token'].value='updated-code';await next['local-token'].fire('input');
  next=reload().ids;assert.equal(next['local-token'].value,'updated-code');
  next['local-remember'].checked=false;await next['local-remember'].fire('change');
  assert.equal(next['local-token'].value,'updated-code');
  assert.deepEqual([...storage.values],[['unrelated-setting','keep']]);
  next=reload().ids;
  assert.equal(next['local-remember'].checked,false);
  assert.notEqual(next['local-token'].value,'updated-code');
});

test('clearing a remembered code removes the previous code from storage',async t=>{
  const {ids,storage,reload}=setup(t,async()=>response(health));
  ids['local-remember'].checked=true;await ids['local-remember'].fire('change');
  assert.equal(storage.values.size,1);
  ids['local-token'].value='   ';await ids['local-token'].fire('input');
  assert.equal(storage.values.size,0);
  assert.equal(reload().ids['local-remember'].checked,false);
});

test('blocked browser storage leaves manual pairing usable and explains the failed save',async t=>{
  const blocked=()=>{throw new DOMException('Storage blocked','SecurityError');};
  const {ids}=setup(t,async()=>response(health),{storage:{getItem:blocked,setItem:blocked,removeItem:blocked}});
  ids['local-remember'].checked=true;await ids['local-remember'].fire('change');
  assert.equal(ids['local-remember'].checked,false);
  assert.match(ids['local-remember-hint'].textContent,/không thể|không cho phép/i);
  await ids['local-check'].fire('click');
  assert.match(ids['ai-status'].textContent,/sẵn sàng/);
  assert.equal(ids['local-token'].value,'test-token');
});

test('a failed save removes the old code so reload cannot restore an outdated connection',async t=>{
  const {ids,storage,reload}=setup(t,async()=>response(health));
  ids['local-remember'].checked=true;await ids['local-remember'].fire('change');
  storage.setItem=()=>{throw new DOMException('Storage full','QuotaExceededError');};
  ids['local-token'].value='replacement-code';await ids['local-token'].fire('input');
  assert.equal(ids['local-remember'].checked,false);
  assert.equal(ids['local-token'].value,'replacement-code');
  assert.equal(storage.values.size,0);
  assert.equal(reload().ids['local-remember'].checked,false);
});

for(const kind of ['reading','connection']) test(`${kind} timeout clears progress and enables retry`,async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout','setInterval']});
  let ready;const started=new Promise(resolve=>ready=resolve);
  const {ids}=setup(t,async(url,{signal})=>{
    if(kind==='reading'&&url.endsWith('/api/status'))return response(health);
    return new Promise((resolve,reject)=>{
      signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
      ready(signal);
    });
  });
  const work=ids[kind==='reading'?'ai-read':'local-check'].fire('click'),signal=await started;
  if(kind==='reading'){
    t.mock.timers.tick(600000);
    assert.equal(signal.aborted,false);
    assert.equal(ids['ai-read'].disabled,true);
    assert.equal(ids['ai-progress'].hidden,false);
  }
  t.mock.timers.tick(kind==='reading'?10000:8000);await work;
  assert.match(ids['ai-status'].textContent,/hết thời gian/i);
  assert.equal(ids['ai-progress'].hidden,true);
  assert.equal(ids['ai-elapsed'].hidden,true);
  assert.equal(ids['ai-answer'].attributes['aria-busy'],'false');
  assert.equal(ids['ai-read'].disabled,false);
  assert.equal(ids['local-check'].disabled,false);
});
