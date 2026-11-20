import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createQimenBoard} from '../dist/qimen/core/board.mjs';
import {analyzeBoard} from '../dist/qimen/analysis/index.mjs';

globalThis.Solar = createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;

function boards(n = 120) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(Date.UTC(2026, 0, 1) + i * 37 * 3600000);
    out.push(createQimenBoard({year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: 10, tzOffset: 7}));
  }
  return out;
}

test('P3: Canh over a pillar stem yields the matching 岁/月/日/时格 pattern', () => {
  let seen = 0;
  for (const board of boards()) {
    const analysis = analyzeBoard(board, {topic: 'business'});
    for (const p of board.palaces.filter((x) => x.number !== 5)) {
      if (!p.heavenStems.some((s) => s.han === '庚')) continue;
      for (const [pillar, id] of [['day', 'day_structure'], ['hour', 'hour_structure']]) {
        const stem = board.pillars[pillar].stem.han;
        if (stem === '甲' || stem === '庚' || p.earthStem.han !== stem) continue;
        seen += 1;
        assert.ok(analysis.structures.patterns.some((m) => m.id === id && m.palace === p.number), `${id} missing at ${p.number}`);
      }
    }
  }
  assert.ok(seen > 0, 'sample must contain at least one Canh-over-pillar case');
});

test('P3: Tam Kỳ thăng điện and Tiểu cách are detected', () => {
  let ascends = 0; let small = 0;
  for (const board of boards()) {
    const patterns = analyzeBoard(board, {topic: 'general'}).structures.patterns;
    for (const p of board.palaces.filter((x) => x.number !== 5)) {
      const stems = p.heavenStems.map((s) => s.han);
      if ((stems.includes('乙') && p.number === 3) || (stems.includes('丙') && p.number === 9) || (stems.includes('丁') && p.number === 7)) {
        ascends += 1; assert.ok(patterns.some((m) => m.id === 'wonder_ascends_hall' && m.palace === p.number));
      }
      if (stems.includes('庚') && p.earthStem.han === '壬') { small += 1; assert.ok(patterns.some((m) => m.id === 'small_structure' && m.palace === p.number)); }
    }
  }
  assert.ok(ascends > 0 && small > 0);
});

test('P3: business questions carry Canh as the market rival symbol', () => {
  const board = boards(1)[0];
  const roles = analyzeBoard(board, {topic: 'contract'}).roles || [];
  assert.ok(roles.some((r) => r.id === 'market_rival' && r.stem === '庚'), JSON.stringify(roles.map((r) => r.id)));
});
