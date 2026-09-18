import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateCompiledFixtureCorpus} from '../dist/qimen/menh/source-validation.mjs';

const compiled=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const yaml=readFileSync(new URL('../docs/km-menh/KM-MENH-1.0-GOLDEN-FIXTURES.yaml',import.meta.url));

test('KM-MENH compiled corpus is checksum-linked to the frozen YAML',()=>{
  validateCompiledFixtureCorpus(compiled);
  assert.equal(createHash('sha256').update(yaml).digest('hex'),compiled.metadata.sourceYamlSha256);
  assert.equal(compiled.metadata.fixtureCount,41);
  assert.equal(compiled.metadata.sourceFixtureCount,15);
  assert.equal(new Set(compiled.fixtures.map(f=>f.id)).size,41);
});
test('KM-MENH P0/P1 does not replace the existing Qimen frozen-core baseline',()=>{
  const baseline=JSON.parse(readFileSync(new URL('../docs/releases/core-baseline.json',import.meta.url),'utf8'));
  assert.equal(baseline.engineVersion,'TG-ROTATING-2.0');
  assert.equal(baseline.goldenBoards.count,480);
  assert.equal(baseline.goldenBoards.sha256,'d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea');
  assert.deepEqual(Object.keys(baseline.files).sort(),[
    'dist/qimen.mjs',
    'dist/qimen/core/board.mjs',
    'dist/qimen/core/calendar.mjs',
    'dist/qimen/core/palace.mjs',
    'dist/qimen/core/patterns.mjs',
    'dist/vendor/lunar.js',
  ].sort());
});
