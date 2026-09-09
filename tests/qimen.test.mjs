import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
globalThis.Solar = require("../dist/vendor/lunar.js").Solar;

const { generateQimen, formatInstantAtOffset } = await import("../dist/qimen.mjs");

const chart = (year, month, day, hour, minute, tzOffset = 7, method = "chaibu") =>
  generateQimen({ year, month, day, hour, minute, tzOffset }, method);

{
  const value = chart(2024, 5, 10, 14, 30);
  assert.deepEqual(
    Object.fromEntries(Object.entries(value.pillars).map(([key, pillar]) => [key, pillar.han])),
    { year: "甲辰", month: "己巳", day: "甲戌", hour: "辛未" },
  );
  assert.equal(value.term.vi, "Lập Hạ");
  assert.equal(value.dun.label, "Dương Độn");
  assert.equal(value.dun.yuan, "Hạ nguyên");
  assert.equal(value.dun.ju, 7);
}

{
  const before = chart(2024, 2, 4, 16, 20, 8);
  const after = chart(2024, 2, 4, 16, 30, 8);
  assert.equal(before.term.vi, "Đại Hàn");
  assert.equal(after.term.vi, "Lập Xuân");
  assert.equal(after.pillars.year.han, "甲辰");
  assert.equal(formatInstantAtOffset(after.term.utcMs, 8, true), "04/02/2024 · 16:27");
}

{
  const vietnam = chart(2024, 2, 4, 15, 30, 7);
  const china = chart(2024, 2, 4, 16, 30, 8);
  assert.equal(vietnam.utcMs, china.utcMs);
  assert.equal(vietnam.term.id, china.term.id);
  assert.equal(vietnam.pillars.year.han, china.pillars.year.han);
  assert.equal(vietnam.pillars.month.han, china.pillars.month.han);
}

{
  const maoShan = chart(2024, 1, 15, 10, 0, 8, "maoshan");
  assert.equal(maoShan.term.vi, "Tiểu Hàn");
  assert.equal(maoShan.dun.yuan, "Trung nguyên");
  assert.equal(maoShan.dun.ju, 8);
  assert.equal(formatInstantAtOffset(maoShan.term.utcMs, 8, true), "06/01/2024 · 04:49");
}

{
  const early = chart(2024, 3, 15, 22, 59);
  const late = chart(2024, 3, 15, 23, 0);
  assert.notEqual(early.pillars.day.han, late.pillars.day.han);
  assert.equal(late.pillars.hour.branch.han, "子");
}

{
  const yin = chart(2024, 7, 8, 14, 0, 8, "maoshan");
  assert.equal(yin.term.vi, "Tiểu Thử");
  assert.equal(yin.dun.label, "Âm Độn");
}

for (const value of [
  chart(2024, 5, 10, 14, 30),
  chart(2024, 7, 8, 14, 0, 8),
  chart(2026, 9, 9, 13, 0),
]) {
  const outer = value.palaces.filter((palace) => palace.number !== 5);
  assert.equal(new Set(Object.values(value.earth).map((stem) => stem.han)).size, 9);
  assert.equal(new Set(outer.map((palace) => palace.star.id)).size, 8);
  assert.equal(new Set(outer.map((palace) => palace.door.id)).size, 8);
  assert.equal(new Set(outer.map((palace) => palace.spirit.id)).size, 8);
  assert.equal(outer.filter((palace) => palace.carriesQin).length, 1);
  assert.equal(outer.filter((palace) => palace.isDutyStar).length, 1);
  assert.equal(outer.filter((palace) => palace.isDutyDoor).length, 1);
}

console.log("Qimen engine: all checks passed");
