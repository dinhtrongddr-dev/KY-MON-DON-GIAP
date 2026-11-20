import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCases, compareCase} from '../tools/audit/engine-compare.mjs';

// P2 (TG-CB-7.0): the frozen rotating engine must agree, palace by palace, with an
// independent re-implementation (JDN day pillar, Five Rats hour stem, Meeus solar terms).
test('engine matches independent reference on 200+ random instants and edge cases', () => {
  const cases = buildCases(220);
  assert.ok(cases.length >= 300);
  const failing = cases.map((c) => ({kind: c.kind, ...compareCase(c.input)})).filter((r) => r.diffs.length);
  assert.deepEqual(failing.slice(0, 3), []);
});
