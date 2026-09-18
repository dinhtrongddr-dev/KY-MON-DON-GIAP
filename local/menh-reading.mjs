import {createRequire} from 'node:module';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;
export * from '../dist/menh-reading-core.mjs';
