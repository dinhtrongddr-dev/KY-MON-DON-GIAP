import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SEMANTIC_MATRIX_VERSION,semanticAssemblyRules,semanticBundle,semanticDomainForMenh,semanticDomainForTopic,semanticDomainVocabulary} from '../dist/qimen/semantic/matrix.mjs';
import {classifyTopics} from '../dist/qimen/ai/classifier.mjs';

const source10=JSON.parse(readFileSync(new URL('../docs/semantic/KM_SEMANTIC_MATRIX_1.0.json',import.meta.url),'utf8'));
const public10=JSON.parse(readFileSync(new URL('../dist/qimen/semantic/KM_SEMANTIC_MATRIX_1.0.json',import.meta.url),'utf8'));
const source=JSON.parse(readFileSync(new URL('../docs/semantic/KM_SEMANTIC_MATRIX_1.1.json',import.meta.url),'utf8'));
const publicCopy=JSON.parse(readFileSync(new URL('../dist/qimen/semantic/KM_SEMANTIC_MATRIX_1.1.json',import.meta.url),'utf8'));
const stem=vi=>({vi});
const palace={number:4,door:{vi:'Khai Môn'},star:{vi:'Thiên Phụ'},spirit:{vi:'Thái Âm'},heavenStems:[stem('Giáp')],earthStem:stem('Ất'),voided:true,horse:false};

test('KM Semantic Matrix 1.1 keeps the 1.0 artifact and provides the full 44-symbol / 12-domain contract',()=>{
  assert.deepEqual(public10,source10);assert.equal(source10.version,'KM-SEMANTIC-MATRIX-1.0');
  assert.deepEqual(publicCopy,source);assert.equal(source.version,'KM-SEMANTIC-MATRIX-1.1');assert.equal(SEMANTIC_MATRIX_VERSION,source.version);
  assert.equal(Object.values(source.symbols).reduce((n,list)=>n+list.length,0),44);assert.equal(Object.keys(source.domains).length,12);
  assert.match(semanticAssemblyRules().role_layer,/Dụng Thần\/chủ thể trước/);
});

test('all 44 symbols have rich 1.1 semantics, associations, provenance and all 12 domain translations',()=>{
  const domainIds=Object.keys(source.domains),all=Object.values(source.symbols).flat();
  for(const item of all){
    assert.ok(item.core_meaning?.length>10,item.name+' core');
    assert.ok(item.keywords.length>=8&&item.keywords.length<=15,item.name+' keywords');
    assert.ok(item.light&&item.shadow,item.name+' light/shadow');
    for(const key of ['people','matters','objects','places'])assert.ok(Array.isArray(item.associations?.[key])&&item.associations[key].length,item.name+' '+key);
    assert.deepEqual(Object.keys(item.domain_meanings).sort(),[...domainIds].sort(),item.name+' domains');
    for(const id of domainIds){const d=item.domain_meanings[id];assert.ok(d.focus&&d.light&&d.shadow,item.name+' '+id);}
    assert.ok(item.sources?.modernized===true&&item.sources.classical?.length,item.name+' sources');
  }
});

test('stem metadata distinguishes Three Wonders, Six Instruments and hidden Jia leader',()=>{
  const groups=Object.fromEntries(source.symbols.stems.map(x=>[x.name,x.group]));
  for(const name of ['Ất','Bính','Đinh'])assert.equal(groups[name],'three_wonders');
  for(const name of ['Mậu','Kỷ','Canh','Tân','Nhâm','Quý'])assert.equal(groups[name],'six_instruments');
  assert.equal(groups['Giáp'],'jia_hidden_leader');
});

test('semantic domain mapping remains separate from role resolution and symbol domain meaning is primary',()=>{
  assert.equal(semanticDomainForTopic('love'),'love_relationship');assert.equal(semanticDomainForTopic('property'),'real_estate');assert.equal(semanticDomainForMenh('WEALTH'),'investment_finance');
  assert.equal(semanticDomainVocabulary('career').overrides.growth,'cơ hội phát triển/thăng tiến');
  const value=semanticBundle({...palace,voided:false},{mode:'event',domainId:'business',board:{patterns:{}}});
  assert.equal(value.action_channel.domain_meaning.source,'symbol_domain');
  assert.match(value.action_channel.meaning,/Kênh hành động trong kinh doanh/i);
  assert.equal(Object.hasOwn(value,'role'),false);assert.equal(Object.hasOwn(value,'subject'),false);
});

test('primary and secondary domains coexist without changing roles',()=>{
  const topics=classifyTopics('Vợ tôi ở nhà chăm con, tôi có đủ tiền và thu nhập không?');
  assert.deepEqual(topics.filter(x=>['family','money'].includes(x)),['family','money']);
  const primary=semanticDomainForTopic('family'),secondary=semanticDomainForTopic('money'),value=semanticBundle(palace,{mode:'event',domainId:primary,secondaryDomainId:secondary,board:{patterns:{}}});
  assert.equal(value.domainId,'children_parenting');assert.equal(value.secondaryDomainId,'investment_finance');
  assert.equal(value.domain_translation.secondary.id,'investment_finance');assert.ok(value.items.every(x=>x.secondary_domain_meaning?.source==='symbol_domain'));
});

test('assembler keeps Cung, Môn, Tinh, Thần, all heavenly stems and earth stem in distinct roles',()=>{
  const multi={...palace,voided:false,heavenStems:[stem('Giáp'),stem('Đinh'),stem('Mậu')]};
  const value=semanticBundle(multi,{mode:'event',domainId:'business',board:{patterns:{}}});
  assert.equal(value.palace_context.role,'palace_context');assert.equal(value.action_channel.role,'action_channel');
  assert.equal(value.operating_style.role,'operating_style');assert.equal(value.hidden_factor.role,'hidden_factor');
  assert.equal(value.heaven_stem_expression.primary.name,'Giáp');
  assert.deepEqual(value.heaven_stem_expression.secondary.map(x=>x.name),['Đinh','Mậu']);
  assert.equal(value.earth_stem_foundation.name,'Ất');
  assert.equal(value.items.filter(x=>x.role==='heaven_stem_expression').length,3);
});

test('different actual palace symbols do not collapse to the same summary just because tags overlap',()=>{
  const base={door:{vi:'Khai Môn'},star:{vi:'Thiên Tâm'},spirit:{vi:'Trực Phù'},heavenStems:[stem('Mậu')],earthStem:stem('Kỷ'),voided:false,horse:false};
  const qian=semanticBundle({...base,number:6},{domainId:'business',board:{patterns:{}}});
  const center=semanticBundle({...base,number:5},{domainId:'business',board:{patterns:{}}});
  assert.notEqual(qian.summary,center.summary);assert.match(qian.summary,/lãnh đạo/i);assert.match(center.summary,/trung tâm/i);
});

test('actual strength and all supported structural states are applied after domain translation',()=>{
  const strong={star:{level:'mạnh'},door:{level:'khá mạnh'},palace:{level:'mạnh'},stems:[]};
  const conditions={stemTombs:['Giáp'],wonderTombs:[],punishment:['Giáp']};
  const value=semanticBundle({...palace,voided:true,horse:true},{domainId:'business',board:{fuYin:true,fanYin:true,patterns:{}},conditions,strength:strong});
  for(const id of ['strong_supported','void','tomb','punishment','horse','fan_yin','fu_yin'])assert.ok(value.states.some(x=>x.id===id),id);
  assert.equal(value.strength_expression.description,'biểu hiện rõ hơn');
  assert.ok(value.items.every(x=>x.domain_meaning.source==='symbol_domain'));
  const weak={star:{level:'yếu'},door:{level:'rất yếu'},palace:{level:'yếu'},stems:[]};
  const weakValue=semanticBundle({...palace,voided:false},{domainId:'business',board:{patterns:{}},strength:weak});
  assert.ok(weakValue.states.some(x=>x.id==='weak_trapped'));assert.equal(weakValue.strength_expression.description,'khó phát huy trọn vẹn');
});

test('UI remains concise and does not render internal state ids while AI contexts bind structured 1.1 semantics',()=>{
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8'),menhView=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  const eventWriter=readFileSync(new URL('../dist/qimen/ai/writerContext.mjs',import.meta.url),'utf8'),menhWriter=readFileSync(new URL('../dist/qimen/menh/ai/writer-context.mjs',import.meta.url),'utf8');
  const eventPrompt=readFileSync(new URL('../dist/qimen/ai/prompts.mjs',import.meta.url),'utf8'),menhPrompt=readFileSync(new URL('../dist/qimen/menh/ai/prompts.mjs',import.meta.url),'utf8');
  assert.match(app,/keywords\.slice\(0,3\)/);assert.match(menhView,/keywords\.slice\(0,3\)/);
  for(const ui of [app,menhView]){assert.doesNotMatch(ui,/semantic\.states\.map\(x=>x\.id/);assert.doesNotMatch(ui,/ZHANG_ADVANCED_CLASS_LIFETIME/);}
  for(const writer of [eventWriter,menhWriter]){assert.match(writer,/palaceContext/);assert.match(writer,/heavenStemExpression/);assert.match(writer,/strengthExpression/);}
  for(const prompt of [eventPrompt,menhPrompt]){assert.match(prompt,/SURFACE_WRITER_INSTRUCTIONS/);assert.doesNotMatch(prompt,/palaceContext|strengthProfile|semanticMatrix/);}
});

test('palace bundle exposes at most three UI keywords and natural state wording without assigning a role',()=>{
  const value=semanticBundle(palace,{mode:'event',domainId:'business',board:{patterns:{}},conditions:null});
  assert.ok(value.keywords.length<=3);assert.equal(value.domainId,'business');assert.ok(value.states.some(x=>x.id==='void'));
  assert.match(value.summary,/chưa thành hình|thiếu lực|chậm|thay đổi/i);
  assert.equal(Object.hasOwn(value,'role'),false);assert.equal(Object.hasOwn(value,'subject'),false);
});
