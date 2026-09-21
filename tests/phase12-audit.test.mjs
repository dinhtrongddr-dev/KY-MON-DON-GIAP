import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const text=async path=>readFile(new URL(path,import.meta.url),'utf8');

test('Phase 12 audit publicly states validation boundaries without probability or Case promotion',async()=>{
  const audit=await text('../dist/audit.html');
  assert.match(audit,/KM-VALIDATION-1\.0 \+ KM-OUTCOME-REGISTRY-1\.0/);
  assert.match(audit,/Chỉ prospective mới được benchmark/);
  assert.match(audit,/Unresolved là abstention/);
  assert.match(audit,/Một outcome unit chỉ có một snapshot/);
  assert.match(audit,/Không ăn điểm sớm/);
  assert.match(audit,/probability calibration = false/);
  assert.match(audit,/Outcome Registry không có quyền tự sửa <code>CASE_LIBRARY<\/code>/);
});

test('Rule Coverage documents Phase 12 as evaluation-only and keeps the frozen board baseline',async()=>{
  const coverage=await text('../docs/releases/RULE-COVERAGE.md');
  assert.match(coverage,/KM-VALIDATION-1\.0 \+ KM-OUTCOME-REGISTRY-1\.0/);
  assert.match(coverage,/normal `\/api\/read` does not auto-register/);
  assert.match(coverage,/no Brier\/log-loss\/probability calibration/);
  assert.match(coverage,/d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea/);
});

test('Phase 12 release docs explicitly separate outcome evaluation from divination validity',async()=>{
  const [validation,registry]=await Promise.all([
    text('../docs/releases/KM-VALIDATION-1.0.md'),
    text('../docs/releases/KM-OUTCOME-REGISTRY-1.0.md')
  ]);
  assert.match(validation,/does not make Kỳ Môn scientifically validated/);
  assert.match(validation,/predictiveValidityClaimAllowed=false/);
  assert.match(validation,/does not automatically register normal readings/);
  assert.match(registry,/never mutates CASE_LIBRARY/);
  assert.match(registry,/storesQuestionText=false/);
});
