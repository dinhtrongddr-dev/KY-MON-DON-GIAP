import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SEMANTIC_MATRIX_VERSION,semanticAssemblyRules,semanticBundle,semanticDomainForMenh,semanticDomainForTopic,semanticDomainVocabulary} from '../dist/qimen/semantic/matrix.mjs';
import {classifyTopics} from '../dist/qimen/ai/classifier.mjs';

const source=JSON.parse(readFileSync(new URL('../docs/semantic/KM_SEMANTIC_MATRIX_1.0.json',import.meta.url),'utf8'));
const publicCopy=JSON.parse(readFileSync(new URL('../dist/qimen/semantic/KM_SEMANTIC_MATRIX_1.0.json',import.meta.url),'utf8'));
const stem=(vi)=>({vi});
const palace={number:4,door:{vi:'Khai Môn'},star:{vi:'Thiên Phụ'},spirit:{vi:'Thái Âm'},heavenStems:[stem('Giáp')],earthStem:stem('Ất'),voided:true,horse:false};

test('KM Semantic Matrix 1.0 source is copied exactly and retains the full 44-symbol / 12-domain contract',()=>{
  assert.deepEqual(publicCopy,source);assert.equal(source.version,'KM-SEMANTIC-MATRIX-1.0');assert.equal(SEMANTIC_MATRIX_VERSION,source.version);
  assert.equal(Object.values(source.symbols).reduce((n,list)=>n+list.length,0),44);assert.equal(Object.keys(source.domains).length,12);
  assert.deepEqual(Object.keys(source.assembly_rules),['classification','role_layer','palace_sentence','dynamic_sentence','stem_sentence','convergence','contrast','state_application','ui_output']);
});

test('semantic domain mapping keeps role resolution separate while changing vocabulary by context',()=>{
  assert.equal(semanticDomainForTopic('love'),'love_relationship');assert.equal(semanticDomainForTopic('property'),'real_estate');assert.equal(semanticDomainForMenh('WEALTH'),'investment_finance');
  assert.equal(semanticDomainVocabulary('career').overrides.growth,'cơ hội phát triển/thăng tiến');
  assert.match(semanticAssemblyRules().role_layer,/Chọn Dụng Thần\/chủ thể trước/);
});

test('semantic classification can keep a primary and one secondary domain without changing roles',()=>{
  const topics=classifyTopics('Vợ tôi ở nhà chăm con, tôi có đủ tiền và thu nhập không?');
  assert.deepEqual(topics.filter(x=>['family','money'].includes(x)),['family','money']);
  const primary=semanticDomainForTopic('family'),secondary=semanticDomainForTopic('money'),value=semanticBundle(palace,{mode:'event',domainId:primary,secondaryDomainId:secondary,board:{patterns:{}}});
  assert.equal(value.domainId,'children_parenting');assert.equal(value.secondaryDomainId,'investment_finance');assert.match(value.summary,/lớp phụ/i);
});

test('both AI prompts and UIs bind to the shared matrix and natural-language-only bold rule',()=>{
  const questionPrompt=readFileSync(new URL('../dist/qimen/ai/prompts.mjs',import.meta.url),'utf8'),menhPrompt=readFileSync(new URL('../dist/qimen/menh/ai/prompts.mjs',import.meta.url),'utf8');
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8'),menhView=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  for(const prompt of [questionPrompt,menhPrompt]){assert.match(prompt,/semanticMatrix/);assert.match(prompt,/DỊCH LUẬN NGHĨA TỰ NHIÊN/);assert.match(prompt,/Niên can Giáp tại Tốn 4/);}
  assert.match(app,/semanticCard/);assert.match(app,/semanticDomainForTopic/);assert.match(menhView,/renderMenhSemanticGuide/);assert.match(menhView,/automatic:false/);
});

test('palace bundle uses at most three keywords, domain overrides and state modifiers without assigning a role',()=>{
  const value=semanticBundle(palace,{mode:'event',domainId:'business',board:{patterns:{}},conditions:null});
  assert.ok(value.keywords.length<=3);assert.equal(value.domainId,'business');assert.match(value.summary,/bán hàng|quyền quản trị|đối tác|thị trường|vận hành|cơ hội/i);
  assert.ok(value.states.some(x=>x.id==='void'));assert.ok(value.items.some(x=>x.layer==='Môn'&&x.name==='Khai Môn'));
  assert.equal(Object.hasOwn(value,'role'),false);assert.equal(Object.hasOwn(value,'subject'),false);
});
