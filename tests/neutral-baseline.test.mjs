import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareReading} from '../local/reading.mjs';
import {prepareMenhReading} from '../local/menh-reading.mjs';
import {buildNeutralBaselineInput,inspectNeutralBaselineInput,NEUTRAL_BASELINE_INSTRUCTIONS} from '../local/neutral-baseline.mjs';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/ai-reading-v2-eval.json',import.meta.url)));

test('neutral question baseline contains board and method but no app conclusion or gate',()=>{
 const c=fixture.cases.find(x=>x.id==='Q06_BUSINESS_MARGIN');
 const payload=buildNeutralBaselineInput(c,prepareReading(c.input));
 const audit=inspectNeutralBaselineInput(payload),serialized=JSON.stringify(payload);
 assert.equal(audit.palaces,9);assert.ok(audit.bytes>1000);
 assert.equal(payload.question,c.input.question);assert.ok(payload.roleMap.length>0);
 for(const term of ['allInOne','reasoning','primaryJudgment','likelyScenario','recommendations','allowedMeaning','forbiddenImplications'])
  assert.equal(serialized.includes(term),false,term);
 assert.match(NEUTRAL_BASELINE_INSTRUCTIONS,/tự phân tích từ đầu/);
 assert.doesNotMatch(NEUTRAL_BASELINE_INSTRUCTIONS,/Planner|Narrative Contract|gate/i);
});

test('neutral Mệnh baseline uses fixed natal board without syntheses or claims',()=>{
 const c=fixture.cases.find(x=>x.id==='M01_CASE_A');
 const payload=buildNeutralBaselineInput(c,prepareMenhReading(c.input));
 const serialized=JSON.stringify(payload);
 assert.equal(inspectNeutralBaselineInput(payload).palaces,9);
 assert.equal(payload.board.method,'chaibu');
 assert.equal(serialized.includes('syntheses'),false);
 assert.equal(serialized.includes('claims'),false);
 assert.equal(serialized.includes('outputTags'),false);
});
