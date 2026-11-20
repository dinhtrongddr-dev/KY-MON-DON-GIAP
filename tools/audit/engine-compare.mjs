// Compare dist/qimen.mjs against tools/audit/qimen-reference.mjs.
// Usage: node tools/audit/engine-compare.mjs [count] [out.json]
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {generateQimen} from '../../dist/qimen.mjs';
import {referenceBoard} from './qimen-reference.mjs';

globalThis.Solar = createRequire(import.meta.url)('../../dist/vendor/lunar.js').Solar;

// Precision margin for the Meeus term times (low-accuracy series). Cases closer than this
// to a term boundary are compared on everything except the term/ju, and the term side is
// checked against lunar-javascript's own term instant instead.
const TERM_MARGIN_MS = 45 * 60000;

function lcg(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 2 ** 32; }; }

const inputAt = (utcMs, tzOffset) => {
  const d = new Date(utcMs + tzOffset * 3600000);
  return {year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), tzOffset};
};

export function buildCases(count = 240, seed = 20261120) {
  const rnd = lcg(seed);
  const offsets = [-12, -8, -5, -3.5, 0, 1, 3, 5.5, 5.75, 7, 8, 9, 9.5, 12.75, 14];
  const cases = [];
  const lo = Date.UTC(1901, 0, 1); const hi = Date.UTC(2099, 11, 31);
  for (let i = 0; i < count; i += 1) {
    const utc = Math.floor(lo + rnd() * (hi - lo)); const tz = offsets[Math.floor(rnd() * offsets.length)];
    cases.push({kind: 'random', input: inputAt(Math.floor(utc / 60000) * 60000, tz)});
  }
  // Edge: every hour boundary of a day incl. 23:00 / 23:59 / 00:00 at several offsets.
  for (const tz of [7, 8, -5, 0]) for (const [h, m] of [[22, 59], [23, 0], [23, 30], [23, 59], [0, 0], [0, 59], [1, 0], [11, 0], [12, 59], [13, 0]]) {
    cases.push({kind: 'hour-edge', input: {year: 2026, month: 2, day: 28, hour: h, minute: m, tzOffset: tz}});
  }
  // Edge: leap days and year boundaries.
  for (const [y, mo, d] of [[2024, 2, 29], [2000, 2, 29], [1904, 2, 29], [2096, 2, 29], [2025, 12, 31], [2026, 1, 1]]) {
    cases.push({kind: 'calendar-edge', input: {year: y, month: mo, day: d, hour: 23, minute: 15, tzOffset: 7}});
  }
  // Edge: ±1 minute around lunar-javascript term instants for all 24 terms of 2026 at UTC+7.
  const probe = generateQimen({year: 2026, month: 1, day: 1, hour: 12, minute: 0, tzOffset: 0});
  let t = probe.nextTerm.utcMs;
  for (let i = 0; i < 24; i += 1) {
    for (const delta of [-60000, 60000]) cases.push({kind: 'term-edge', input: inputAt(Math.floor((t + delta) / 60000) * 60000 + (delta > 0 ? 60000 : 0), 7)});
    t = generateQimen(inputAt(t + 3600000, 0)).nextTerm.utcMs;
  }
  return cases;
}

export function compareCase(input) {
  const app = generateQimen(input, 'chaibu');
  const ref = referenceBoard(input);
  const diffs = [];
  const near = Math.abs(ref.utcMs - ref.termUtcMs) < TERM_MARGIN_MS || Math.abs(app.term.utcMs - app.utcMs) < TERM_MARGIN_MS
    || Math.abs(app.nextTerm.utcMs - app.utcMs) < TERM_MARGIN_MS;
  const eq = (label, a, b) => { if (a !== b) diffs.push({field: label, app: a, ref: b}); };
  eq('dayPillar', app.pillars.day.han, ref.dayPillar);
  eq('hourPillar', app.pillars.hour.han, ref.hourPillar);
  if (!near) {
    eq('term', app.term.id, ref.termId);
    eq('ju', `${app.dun.isYang ? 'Y' : 'A'}${app.dun.ju}`, `${ref.yang ? 'Y' : 'A'}${ref.ju}`);
  }
  // Plate comparison is only meaningful when both sides use the same ju.
  if (app.dun.ju === ref.ju && app.dun.isYang === ref.yang) {
    for (const n of [1, 2, 3, 4, 6, 7, 8, 9]) {
      const pa = app.palaces.find((x) => x.number === n); const pr = ref.palaces[n];
      eq(`p${n}.earth`, pa.earthStem.han, ref.earth[n]);
      eq(`p${n}.star`, pa.star.han, pr.star);
      eq(`p${n}.door`, pa.door.han, pr.door);
      eq(`p${n}.spirit`, pa.spirit.han, pr.spirit);
      eq(`p${n}.heaven`, pa.heavenStems.map((s) => s.han).join(''), pr.heaven);
      eq(`p${n}.void`, pa.voided, pr.voided);
      eq(`p${n}.horse`, pa.horse, pr.horse);
    }
  }
  return {input, near, termDeltaMin: Math.round((app.term.utcMs - ref.termUtcMs) / 60000), diffs};
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('engine-compare.mjs')) {
  const count = Number(process.argv[2] || 240);
  const results = buildCases(count).map((c) => ({kind: c.kind, ...compareCase(c.input)}));
  const failing = results.filter((r) => r.diffs.length);
  const deltas = results.filter((r) => !r.near).map((r) => Math.abs(r.termDeltaMin));
  const summary = {
    cases: results.length, failing: failing.length, nearTermBoundary: results.filter((r) => r.near).length,
    maxTermDeltaMinutes: Math.max(...deltas), byKind: Object.fromEntries([...new Set(results.map((r) => r.kind))].map((k) => [k, results.filter((r) => r.kind === k).length])),
  };
  console.log(JSON.stringify(summary));
  for (const f of failing.slice(0, 15)) console.log(JSON.stringify({kind: f.kind, input: f.input, diffs: f.diffs.slice(0, 6)}));
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify({summary, failing}, null, 2));
}
