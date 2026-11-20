import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReading,validateReading} from '../local/reading.mjs';
import {writeSurface} from '../local/surface-writer.mjs';
import {buildQuestionNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {fallbackDraft,hydrateSurfaceReading,auditVerdictSoftening} from '../dist/qimen/ai/surfaceReading.mjs';
import {allowedTimingDates,dayVoidBranches} from '../dist/qimen/ai/timingEngine.mjs';

const contractQ = (day, hour, question = 'Trong 30 ngày tới, tôi có ký được hợp đồng A không?') =>
  prepareReading({input: {year: 2026, month: 9, day, hour, minute: 0, tzOffset: 7}, question, topic: 'contract', mode: 'auto', method: 'chaibu'});

// ---- P4: balanced verdicts ----
test('P4: classic adverse boards (Dụng Thần void + tomb, contract under Thương Môn + 乙辛) give a negative verdict', () => {
  for (const [day, hour] of [[21, 10], [21, 0], [23, 12], [21, 16]]) {
    const p = contractQ(day, hour);
    const j = p.context.allInOne.reasoning.primaryJudgment;
    assert.equal(j.answerClass, 'negative', `${day}/${hour}`);
    assert.match(j.main, /không thành/);
    assert.ok(j.forbiddenClaims.some((x) => /không làm mềm/i.test(x)));
  }
});

test('P4: verdicts are not one-sided across a day sample (negative and non-negative both occur)', () => {
  const classes = new Set();
  for (let h = 0; h < 24; h += 2) classes.add(contractQ(22, h).context.allInOne.reasoning.primaryJudgment.answerClass);
  assert.ok(classes.has('negative') || classes.has('conditional_negative'));
  assert.ok(classes.has('conditional') || classes.has('unresolved') || classes.has('conditional_positive'));
});

test('P4: negative verdict is a hard lock in the first unit and the softening gate enforces it', () => {
  const p = contractQ(21, 10), c = buildQuestionNarrativeContract(p.context);
  assert.equal(c.primaryConclusion.conclusion, 'negative');
  assert.ok(c.units[0].atoms.some((a) => a.id === 'verdict_negative' && a.kind === 'hard_verdict'));
  const good = fallbackDraft(c);
  assert.deepEqual(auditVerdictSoftening(good, c), []);
  const soft = {sections: good.sections.map((s) => ({id: s.id, text: s.id === c.units[0].id ? 'Nhìn chung vẫn có cơ hội tốt, triển vọng tốt.' : s.text.replace(/không thành|bất lợi|không nên|nên bỏ/gi, 'đáng chú ý')}))};
  const issues = auditVerdictSoftening(soft, c);
  assert.ok(issues.length >= 1 && issues.every((x) => x.code === 'VERDICT_SOFTENED'));
});

// ---- P4/P5: date gate uses every engine-derived date; unknown dates are reported per sentence ----
test('P5: layered timing gives dated windows with rule, source and confidence', () => {
  const p = contractQ(21, 10), t = p.context.allInOne.reasoning.timing;
  assert.equal(t.version, 'KM-TIMING-4.0');
  assert.ok(t.layers.rows.length > 0);
  for (const r of t.layers.rows) {
    assert.match(r.display, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.ok(['high', 'medium', 'low'].includes(r.confidence));
    assert.ok(r.rule && r.reason && r.source);
  }
  assert.ok(t.layers.scale && ['day', 'week', 'month'].includes(t.layers.scale.unit));
  assert.equal(dayVoidBranches('甲子').join(''), '戌亥');
  assert.equal(dayVoidBranches('丙寅').join(''), '戌亥');
  assert.equal(dayVoidBranches('甲戌').join(''), '申酉');
});

test('P4: a date derived by the timing engine passes the gate; an invented one fails with the sentence', () => {
  const p = contractQ(21, 10), c = buildQuestionNarrativeContract(p.context);
  const allowed = allowedTimingDates(p.context.allInOne.reasoning.timing).filter((x) => /^\d{2}\/\d{2}\/\d{4}$/.test(x));
  assert.ok(allowed.length > 0);
  const draft = fallbackDraft(c);
  draft.sections[1].text += ` Mốc nên theo dõi là ${allowed.at(-1)}.`;
  assert.doesNotThrow(() => validateReading(hydrateSurfaceReading(draft, c), p.facts, 'contract', p.context));
  const bad = fallbackDraft(c);
  bad.sections[1].text += ' Ký kết vào 29/02/2027.';
  try { validateReading(hydrateSurfaceReading(bad, c), p.facts, 'contract', p.context); assert.fail('must reject'); }
  catch (error) {
    assert.equal(error.name, 'ReadingValidationError');
    assert.equal(error.violations[0].code, 'INVENTED_TIME');
    assert.match(error.violations[0].sentence, /29\/02\/2027/);
  }
});

// ---- P8: targeted repair ----
test('P8: a flagged sentence is repaired in its own section only, at auxiliary effort, without a second review', async () => {
  const p = contractQ(21, 10), c = buildQuestionNarrativeContract(p.context);
  const calls = []; let reviews = 0;
  const runner = async (_i, input, _s, options) => {
    calls.push({repair: !!input.violations && !input.units?.every?.((u) => u.atoms), sections: input.sections?.map((s) => s.id) || null, effort: options.effort || null});
    if (calls.length === 1) { const d = fallbackDraft(c); d.sections[2].text += ' Ngày 30/02 sẽ ký.'; return d; }
    return {sections: input.sections.map((s) => ({id: s.id, text: s.text.replace(' Ngày 30/02 sẽ ký.', ' Nên chờ thêm tín hiệu.')}))};
  };
  const reviewer = async () => { reviews += 1; return {violations: []}; };
  const reading = await writeSurface(c, {runner, reviewer, env: {}, validate: (r) => validateReading(r, p.facts, 'contract', p.context)});
  assert.equal(reading.status, 'reading');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].sections, [c.units[2].id]);
  assert.equal(calls[1].effort, 'high');
  assert.equal(reviews, 1);
});
