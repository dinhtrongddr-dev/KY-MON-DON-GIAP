import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStructuredText} from '../local/codex-client.mjs';

test('Web JSON transport marker is accepted without changing the reading',()=>{
 const draft={sections:[{id:'answer',text:'Cơ hội có điều kiện; không phải kết quả chắc chắn.'}]};
 const json=JSON.stringify(draft);
 for(const value of ['<escape>'+json,'<escape>\n'+json+'\n</escape>','<escape>\n```json\n'+json+'\n```\n</escape>'])
  assert.deepEqual(parseStructuredText(value),draft);
});

test('transport cleanup preserves literal markers and rejects incomplete or mixed output',()=>{
 const json=JSON.stringify({text:'Giữ nguyên <escape> và </escape> trong chuỗi.'});
 assert.deepEqual(parseStructuredText('<escape>'+json),JSON.parse(json));
 for(const value of ['<escape>{"sections":[','<escape>{"answer":"ok"} trailing','Kết quả: <escape>{"answer":"ok"}','{"answer":"ok"}</escape>'])
  assert.throws(()=>parseStructuredText(value),/chưa hợp lệ/);
});

import {buildReadingRequest,validateReadingResponse} from '../local/reading.mjs';
import {interpretWholeChart} from '../local/whole-chart.mjs';

test('Web-wrapped Whole Chart passes browser audit when a palace is described as đồng thời',async()=>{
 const prepared=await buildReadingRequest({
  question:'Tôi có nhận được công việc đang theo đuổi không?',topic:'contract',
  method:'chaibu',reasoningMode:'whole_chart',mode:'prediction',
  input:{year:2026,month:10,day:23,hour:20,minute:48,tzOffset:7}
 });
 const reading=await interpretWholeChart(prepared,{runner:async(_instructions,input)=>({
  text:'<escape>'+JSON.stringify({sections:input.surface.units.map(u=>({
   id:u.id,text:'Nên làm rõ cơ hội và khả năng đáp ứng trước khi cam kết nhận thêm công việc.'
  }))})+'</escape>'
 })});
 reading.sections.answer.paragraphs[0].meaning='Cung 4 đồng thời đại diện cho cơ hội và khâu thực hiện; nên làm rõ khả năng đáp ứng trước khi cam kết.';
 const data={
  rules:prepared.context.rules,protocol:prepared.request.protocol,
  caseRules:prepared.request.caseRules,nianmingRules:prepared.request.nianmingRules,
  chartFingerprint:prepared.chartFingerprint,requestFingerprint:prepared.requestFingerprint,
  facts:prepared.facts,reading
 };
 assert.doesNotThrow(()=>validateReadingResponse(data,prepared));
 const invented=structuredClone(data);
 invented.reading.sections.answer.paragraphs[0].meaning='Chi phí là 4 đồng.';
 assert.throws(()=>validateReadingResponse(invented,prepared),/số tiền/);
});
