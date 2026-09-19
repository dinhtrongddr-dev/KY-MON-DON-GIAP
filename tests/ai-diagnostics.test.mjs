import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {recordAiDiagnostic} from '../local/ai-diagnostics.mjs';

test('AI diagnostics stores only compact technical failure metadata',t=>{
  const dir=mkdtempSync(join(tmpdir(),'qimen-ai-log-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const file=join(dir,'ai-errors.jsonl');
  recordAiDiagnostic({type:'validation_failure',flow:'menh',stage:'writer_validation',attempt:1,route:'sol',model:'gpt-5.6-sol',code:'MENH_READING_VALIDATION',fallbackAllowed:false,message:'Thiếu overview',question:'bí mật người dùng',input:{secret:'x'}},{filePath:file});
  const row=JSON.parse(readFileSync(file,'utf8').trim());
  assert.equal(row.type,'validation_failure');assert.equal(row.model,'gpt-5.6-sol');assert.equal(row.message,'Thiếu overview');
  assert.equal(Object.hasOwn(row,'question'),false);assert.equal(Object.hasOwn(row,'input'),false);
});
