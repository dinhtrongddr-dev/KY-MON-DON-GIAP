import {runCodex,MODEL as CODEX_MODEL,REASONING_EFFORT as CODEX_REASONING_EFFORT,ROUTING_MODE as CODEX_ROUTING_MODE,READING_TIMEOUT_MS} from './codex-client.mjs';
import {runPrism,PRISM_MODEL,PRISM_REASONING_EFFORT} from './prism-client.mjs';

const requested=(process.env.QIMEN_AI_ROUTER||'').trim().toLowerCase();
const prism=requested==='prism';

export const ROUTING_MODE=prism?'prism':CODEX_ROUTING_MODE;
export const MODEL=prism?PRISM_MODEL:CODEX_MODEL;
export const REASONING_EFFORT=prism?PRISM_REASONING_EFFORT:CODEX_REASONING_EFFORT;
export const runAI=prism?runPrism:runCodex;
export {READING_TIMEOUT_MS};
