import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSurfaceReading} from '../dist/reading-format.mjs';
import {extractAiSections} from '../dist/report-export.mjs';
class Element {
  constructor(tag,doc){this.tag=tag;this.tagName=tag.toUpperCase();this.nodeType=1;this.ownerDocument=doc;this.children=[];this.value='';this.hidden=false;this.dataset={};this.attrs={};this.handlers={};this.classList={toggle(){},contains:cls=>(this.className||'').split(' ').includes(cls)};}
  append(...xs){xs.forEach(x=>x.parent=this);this.children.push(...xs);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
  get childNodes(){return [...(this.value?[{nodeType:3,textContent:this.value}]:[]),...this.children];}
  cloneNode(deep){const copy=new Element(this.tag,this.ownerDocument);copy.value=this.value;copy.className=this.className;copy.hidden=this.hidden;if(deep)copy.append(...this.children.map(x=>x.cloneNode(true)));return copy;}
  replaceChildren(){this.children=[];this.value='';}
  set textContent(v){this.value=v;this.children=[];}
  get textContent(){return this.value+this.children.map(x=>x.textContent).join('');}
  get visibleText(){return this.hidden?'':this.value+this.children.map(x=>x.visibleText).join('');}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){const found=[],hidden=selector.endsWith('[hidden]'),base=selector.replace('[hidden]','');for(const x of this.children){if((base.startsWith('.')?x.classList.contains(base.slice(1)):x.tag===base)&&(!hidden||x.hidden))found.push(x);found.push(...x.querySelectorAll(selector));}return found;}
}
const doc={createElement:tag=>new Element(tag,doc)};
function reading(){return {status:'reading',sections:{self:{label:'Bản thân',paragraphs:[{
  meaning:'Bạn thường suy nghĩ kỹ trước khi quyết định. **Nên tự đặt thời hạn để chốt việc.**',
  technicalEvidence:'Nhật can Kỷ tại Càn 6, Thiên Tâm, Đỗ Môn, Thái Âm.',claim_ids:['SELF_CORE']
}]}},note:'Một ghi chú chung.'};}
test('technical toggle hides entire evidence fields and never cuts words out of meaning',()=>{
  const root=new Element('div',doc),r=reading();renderSurfaceReading(root,r);
  const before=root.visibleText,button=root.querySelectorAll('.ai-technical-toggle')[0];
  assert.match(before,/Bạn thường suy nghĩ kỹ trước khi quyết định/);
  assert.doesNotMatch(before,/Nhật can|Kỷ|Càn 6|Thiên Tâm|SELF_CORE/);
  assert.equal(button.attrs['aria-pressed'],'false');assert.equal(button.textContent,'Hiện căn cứ Kỳ Môn');
  button.handlers.click();assert.match(root.visibleText,/Nhật can Kỷ tại Càn 6/);assert.equal(button.attrs['aria-pressed'],'true');
  button.handlers.click();assert.equal(root.visibleText,before);
});
test('evidence classification depends solely on fields, including ordinary Vietnamese evidence',()=>{
  const r=reading();r.sections.self.paragraphs[0].technicalEvidence='Một câu không chứa thuật ngữ nào.';
  r.sections.self.paragraphs[0].meaning='Tại Càn 6 là ví dụ cho phép trong bản thử; cả câu phải còn nguyên.';
  const root=new Element('div',doc);renderSurfaceReading(root,r);
  assert.ok(root.visibleText.includes(r.sections.self.paragraphs[0].meaning));
  assert.doesNotMatch(root.visibleText,/Một câu không chứa/);
});
test('model HTML is rendered as text and a new reading resets the hidden state',()=>{
  const root=new Element('div',doc),r=reading();r.sections.self.paragraphs[0].meaning='<img src=x onerror=alert(1)> Nội dung.';
  renderSurfaceReading(root,r);root.querySelectorAll('.ai-technical-toggle')[0].handlers.click();
  renderSurfaceReading(root,r);assert.ok(root.visibleText.includes('<img src=x onerror=alert(1)>'));
  const visit=n=>[n,...n.children.flatMap(visit)];assert.ok(!visit(root).some(n=>n.tag==='img'));
  assert.ok(root.querySelectorAll('.ai-technical-evidence').every(e=>e.hidden));
});
test('both export flows retain new-schema prose and respect the technical toggle without mutating the reading',()=>{
  for(const kind of ['question','menh']){
    const root=new Element('div',doc),r=reading();renderSurfaceReading(root,r);
    const rootId=kind==='menh'?'#menh-ai-answer':'#ai-answer';
    const exportDoc={querySelectorAll:selector=>selector.startsWith(rootId+' ')?root.querySelectorAll(selector.slice(rootId.length+1)):[],getElementById:()=>null};
    const hidden=extractAiSections(kind,exportDoc),before=root.visibleText;
    assert.equal(hidden.length,1);assert.equal(hidden[0].title,'Bản thân');
    assert.match(JSON.stringify(hidden),/Bạn thường suy nghĩ kỹ/);
    assert.ok(hidden[0].paragraphs.flat().some(r=>r.bold&&r.text.includes('Nên tự đặt')));
    assert.doesNotMatch(JSON.stringify(hidden),/Nhật can/);
    root.querySelectorAll('.ai-technical-toggle')[0].handlers.click();
    assert.match(JSON.stringify(extractAiSections(kind,exportDoc)),/Nhật can Kỷ tại Càn 6/);
    root.querySelectorAll('.ai-technical-toggle')[0].handlers.click();
    assert.equal(root.visibleText,before);
  }
});
