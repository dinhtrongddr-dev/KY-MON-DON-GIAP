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
