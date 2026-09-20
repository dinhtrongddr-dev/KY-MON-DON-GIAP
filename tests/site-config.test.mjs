import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_RELAY_ORIGIN,relayOriginFor} from '../dist/site-config.mjs';

test('production and local clients use the fixed AI origin while develop quick tunnel uses same-origin API',()=>{
  assert.equal(AI_RELAY_ORIGIN,'https://ai-origin.kymon.pp.ua');
  assert.equal(relayOriginFor({hostname:'kymon.pp.ua',origin:'https://kymon.pp.ua'}),'https://ai-origin.kymon.pp.ua');
  assert.equal(relayOriginFor({hostname:'127.0.0.1',origin:'http://127.0.0.1:8766'}),'https://ai-origin.kymon.pp.ua');
  assert.equal(relayOriginFor({hostname:'evaluation-qui-schedule-nato.trycloudflare.com',origin:'https://evaluation-qui-schedule-nato.trycloudflare.com'}),'https://evaluation-qui-schedule-nato.trycloudflare.com');
});
