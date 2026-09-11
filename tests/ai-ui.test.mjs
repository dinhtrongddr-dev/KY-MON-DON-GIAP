// DOM doubles exercise the actual event handlers without an external browser or AI call.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {initLocalAi} from '../dist/ai-local.mjs';
import {buildReadingRequest,RULE_VERSION,READING_PROTOCOL} from '../dist/reading-core.mjs';
import {readingFixture,clarificationFixture} from './reading-fixture.mjs';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const payload={question:'Tôi cần chuẩn bị gì cho hợp đồng A trong tháng này?',topic:'contract',method:'chaibu',input:{year:2026,month:9,day:10,hour:10,minute:0,tzOffset:7}};
class Element {
  constructor(){this.listeners={};this.hidden=true;this.disabled=false;this.value='test-token';this.textContent='';this.children=[];}
  addEventListener(event,fn){(this.listeners[event]??=[]).push(fn);}
  fire(event){return Promise.all((this.listeners[event]??[]).map(fn=>fn()));}
  append(el){this.children.push(el);}
  replaceChildren(){this.children=[];}
}
function setup(t,fetcher){
  const original={document:globalThis.document,fetch:globalThis.fetch};
  const ids=Object.fromEntries(['local-token','ai-status','ai-answer','ai-read','ai-cancel','local-check','chart-form'].map(id=>[id,new Element()]));
  const doc=new Element();doc.getElementById=id=>ids[id];doc.createElement=()=>new Element();
  globalThis.document=doc;globalThis.fetch=fetcher;
  t.after(()=>Object.assign(globalThis,original));
  initLocalAi({prepare:()=>structuredClone(payload)});
  return {ids,doc};
}
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const health={rules:RULE_VERSION,protocol:READING_PROTOCOL};

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
  release(response({malformed:'must never render'}));await work;
  assert.equal(ids['ai-answer'].hidden,true);assert.equal(ids['ai-read'].disabled,false);assert.equal(ids['ai-cancel'].hidden,true);
  assert.doesNotMatch(ids['ai-status'].textContent,/Đã nhận/);
});

test('non-JSON upstream errors are explained, not rendered or thrown uncaught',async t=>{
  const {ids}=setup(t,async()=>new Response('<html>Error</html>',{status:502}));
  await ids['local-check'].fire('click');assert.match(ids['ai-status'].textContent,/không đọc được/);
  assert.equal(ids['ai-answer'].hidden,true);
});

test('valid clarification renders text safely; no model HTML is interpreted',async t=>{
  const p=await buildReadingRequest(payload);
  const reading={...clarificationFixture(),summary:'<script>alert(1)</script>'};
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  await ids['ai-read'].fire('click');
  assert.equal(ids['ai-answer'].hidden,false);
  assert.equal(ids['ai-answer'].children[1].children[0].textContent,'<script>alert(1)</script>');
});

test('deep reading renders all three linked stages and alternatives without truncation',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);
  const {ids,doc}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  let selected;doc.querySelector=selector=>({click(){selected=selector;},scrollIntoView(){}});
  await ids['ai-read'].fire('click');
  assert.equal(ids['ai-answer'].hidden,false);
  const all=[];const walk=el=>{all.push(el);el.children.forEach(walk);};walk(ids['ai-answer']);
  for(const part of [...reading.assessments.map(a=>a.interpretation),...reading.development.map(s=>s.description),reading.alternatives[0].description])assert.ok(all.some(n=>n.textContent===part));
  assert.equal(all.filter(n=>n.className==='ai-stage-label').length,3);
  const button=all.find(n=>n.className==='jump-cung');await button.fire('click');assert.match(selected,/data-palace/);
});

test('underdeveloped content is rejected instead of looking like a completed reading',async t=>{
  const p=await buildReadingRequest(payload),reading=readingFixture(p);reading.development=[];
  const {ids}=setup(t,async url=>response(url.endsWith('/api/status')?health:{...health,chartFingerprint:p.chartFingerprint,requestFingerprint:p.requestFingerprint,facts:p.facts,reading}));
  await ids['ai-read'].fire('click');assert.equal(ids['ai-answer'].hidden,true);assert.match(ids['ai-status'].textContent,/ba chặng/);
});
