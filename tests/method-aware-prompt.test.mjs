import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {METHOD_AWARE_READING_INSTRUCTIONS,GLOBAL_STRUCTURE_INSTRUCTIONS,MODE_SYNTHESIS_INSTRUCTIONS} from '../dist/qimen/ai/methodPrompt.mjs';
import {SURFACE_WRITER_INSTRUCTIONS} from '../dist/qimen/ai/surfacePrompt.mjs';
import {DELIBERATION_INSTRUCTIONS} from '../dist/qimen/ai/deliberation.mjs';

test('shared method prompt is available to every non-whole-chart writer layer',()=>{
  for (const text of [SURFACE_WRITER_INSTRUCTIONS,DELIBERATION_INSTRUCTIONS]) {
    assert.match(text,/Âm Độn|Dương Độn/);
    assert.match(text,/Thanh Long phản thủ/);
    assert.match(text,/Tam Kỳ nhập mộ/);
    assert.match(text,/Môn bức/);
    assert.match(text,/Hỏi Việc/);
    assert.match(text,/Mệnh/);
  }
  assert.match(METHOD_AWARE_READING_INSTRUCTIONS,/Tháo bổ · Phù đầu/);
  assert.match(GLOBAL_STRUCTURE_INSTRUCTIONS,/Chỉ sử dụng một tên cách cục/);
  assert.match(MODE_SYNTHESIS_INSTRUCTIONS,/phép chia minh họa bằng số/);
});

test('whole chart imports shared facts-only instructions without the old planner path',()=>{
  const source=fs.readFileSync(new URL('../local/whole-chart.mjs',import.meta.url),'utf8');
  assert.match(source,/methodPrompt\.mjs/);
  assert.match(source,/interpretWholeChart/);
  assert.doesNotMatch(source,/reasoningPlanner\s*\(/);
});
