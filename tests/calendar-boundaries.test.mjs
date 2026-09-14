import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateQimen, sexagenaryName} from '../dist/qimen.mjs';

globalThis.Solar = createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
const inputAt = (utcMs, tzOffset) => {
  const date = new Date(utcMs + tzOffset * 3600000);
  return {year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
    hour: date.getUTCHours(), minute: date.getUTCMinutes(), tzOffset};
};

test('all twelve jie change the month pillar; only Li Chun changes the year across fixed offsets', () => {
  const terms = ['xiaohan', 'lichun', 'jingzhe', 'qingming', 'lixia', 'mangzhong',
    'xiaoshu', 'liqiu', 'bailu', 'hanlu', 'lidong', 'daxue'];
  let count = 0;
  for (const [index, id] of terms.entries()) {
    const current = generateQimen({year: 2024, month: index + 1, day: 10, hour: 12, minute: 0, tzOffset: 8});
    assert.equal(current.term.id, id);
    // Independent Five Tigers sequence: Jia/ Ji years begin Bing Yin;
    // Jan 2024 is Yi Chou of the preceding Gui Mao year.
    for (const offset of [-12, -3.5, 0, 5.75, 7, 8, 12.75, 14]) {
      for (const method of ['chaibu', 'maoshan']) {
        const before = generateQimen(inputAt(current.term.utcMs - 60000, offset), method);
        const after = generateQimen(inputAt(current.term.utcMs + 60000, offset), method);
        assert.equal(before.pillars.month.han, sexagenaryName(index));
        assert.equal(after.pillars.month.han, sexagenaryName(index + 1));
        assert.equal(before.pillars.year.han, sexagenaryName(index <= 1 ? 39 : 40));
        assert.equal(after.pillars.year.han, sexagenaryName(index === 0 ? 39 : 40));
        assert.notEqual(before.term.id, id);
        assert.equal(after.term.id, id);
        count++;
      }
    }
  }
  assert.equal(count, 192);
});
