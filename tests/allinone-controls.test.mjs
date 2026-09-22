import test from 'node:test';import assert from 'node:assert/strict';
import {initModeControls,initNianmingInputMasks,maskNianmingDate} from '../dist/qimen/ui-controls.mjs';
class Element {
  constructor(tag='div'){this.tag=tag;this.value='';this.children=[];this.listeners={};this.hidden=false;this.dataset={};this.attributes={};this.className='';this.classList={toggle:(name,on)=>{const set=new Set(this.className.split(/\s+/).filter(Boolean));on?set.add(name):set.delete(name);this.className=[...set].join(' ');}};}
  append(...elements){for(const el of elements){el.parent=this;this.children.push(el);if(this.tag==='select'&&this.children.length===1)this.value=el.value;}}
  addEventListener(name,handler){(this.listeners[name]??=[]).push(handler);}
  fire(name,event={preventDefault(){}}){for(const fn of this.listeners[name]||[])fn(event);}
  dispatchEvent(event){this.fire(event.type,event);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  remove(){this.parent.children=this.parent.children.filter(el=>el!==this);}
  focus(){this.focused=true;}
}
function setup(){
  const ids=Object.fromEntries(['qimen-mode','question','mode-explanation','timing-options','direction-options','direction-origin','direction-kind','subject-label','actor-subject','action-options','qimen-action','add-candidate','timing-candidates','chart-form','actor-customer','actor-competitor','actor-decisionMaker'].map(id=>[id,new Element()]));
ids['qimen-mode'].tag='select';ids['qimen-action'].value='general';
  for(const id of ['customer','competitor','decisionMaker']){const el=ids['actor-'+id];el.tag='select';el.append(new Element('option'));}
  for(let i=0;i<2;i++){const input=new Element('input');input.className='timing-candidate';ids['timing-candidates'].append(input);}
  const inputs=()=>{const out=[];const visit=el=>{if(el.className==='timing-candidate')out.push(el);el.children.forEach(visit);};visit(ids['timing-candidates']);return out;};
  const doc={getElementById:id=>ids[id],createElement:tag=>new Element(tag),querySelectorAll:()=>inputs()};
  return {ids,inputs,options:initModeControls(doc)};
}
test('Niên Mệnh date/year modes keep their own compact numeric formats',()=>{
  assert.equal(maskNianmingDate('1'),'1');
  assert.equal(maskNianmingDate('17'),'17/');
  assert.equal(maskNianmingDate('170'),'17/0');
  assert.equal(maskNianmingDate('1707'),'17/07/');
  assert.equal(maskNianmingDate('17071994'),'17/07/1994');
  assert.equal(maskNianmingDate('17/07/1994'),'17/07/1994');
  assert.equal(maskNianmingDate('1707',{deleting:true}),'17/07');
  assert.equal(maskNianmingDate('1994',{mode:'year'}),'1994');
  assert.equal(maskNianmingDate('19945',{mode:'year'}),'1994');
});

test('Niên Mệnh entry switch changes placeholder and restores each mode value',()=>{
  const input=new Element('input'),date=new Element('button'),year=new Element('button');
  input.value='17/07/1994';input.dataset.nianmingMode='date';
  const ids={'nianming-self':input,'nianming-mode-self-date':date,'nianming-mode-self-year':year};
  initNianmingInputMasks({getElementById:id=>ids[id]||null});
  assert.equal(input.placeholder,'DD/MM/YYYY');assert.equal(input.maxLength,10);
  year.fire('click');assert.equal(input.placeholder,'YYYY');assert.equal(input.maxLength,4);assert.equal(input.value,'');
  input.value='1994';input.fire('input',{inputType:'insertText'});assert.equal(input.value,'1994');
  date.fire('click');assert.equal(input.value,'17/07/1994');assert.equal(input.placeholder,'DD/MM/YYYY');
});

test('mode controls start on Auto and show timing inputs only for timing intent',()=>{
  const {ids,inputs,options}=setup();
  assert.equal(options().mode,'auto');assert.equal(ids['qimen-mode'].children.length,7);assert.deepEqual(options().actors,{});
  ids.question.value='Ngày nào nên gửi báo giá?';ids.question.fire('input');
  assert.equal(ids['timing-options'].hidden,false);assert.equal(ids['action-options'].hidden,false);
  inputs()[0].value='2026-09-14T09:00';inputs()[1].value='2026-09-15T10:00';assert.equal(options().candidates.length,2);
  ids['qimen-mode'].value='business';ids['qimen-mode'].fire('change');assert.equal(ids['timing-options'].hidden,true);assert.deepEqual(options().candidates,[]);
  ids['actor-customer'].value='甲子';assert.deepEqual(options().actors,{customer:'甲子'});
});
test('additional timing rows are bounded, removable and changes invalidate previous data',()=>{
  const {ids,inputs}=setup();let changes=0;ids['chart-form'].addEventListener('change',()=>changes++);
  for(let i=0;i<20;i++)ids['add-candidate'].fire('click');assert.equal(inputs().length,12);
  ids['timing-candidates'].children[2].children[1].fire('click');assert.equal(inputs().length,11);assert.equal(changes,1);
});

test('reading options are always deep without a depth selector',()=>{const {options}=setup();assert.equal(options().depth,'deep');});

test('direction and confirmed subject inputs are carried into requests and hidden outside direction mode',()=>{
  const {ids,options}=setup();ids['qimen-mode'].value='direction';ids['qimen-mode'].fire('change');
  assert.equal(ids['direction-options'].hidden,false);
  ids['direction-origin'].value='Cửa chính';ids['direction-kind'].value='facing';
  ids['subject-label'].value='Em trai';ids['actor-subject'].value='甲子';
  assert.deepEqual(options().direction,{origin:'Cửa chính',kind:'facing'});
  assert.deepEqual(options().subject,{label:'Em trai',pillar:'甲子'});
  ids['qimen-mode'].value='prediction';ids['qimen-mode'].fire('change');
  assert.equal(ids['direction-options'].hidden,true);assert.equal(options().direction,null);
});
