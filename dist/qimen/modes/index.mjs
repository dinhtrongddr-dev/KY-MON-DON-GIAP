import {prediction} from './prediction.mjs';
import {strategy} from './strategy.mjs';
import {business} from './business.mjs';
import {negotiation} from './negotiation.mjs';
import {timing} from './timing.mjs';
import {direction} from './direction.mjs';
export {MODES,MODE_LABELS} from './shared.mjs';
const engines={prediction,strategy,business,negotiation,timing,direction};
export function analyzeMode(mode,analysis,options={}) {
  if(!engines[mode])throw new Error('Chế độ luận chưa được hỗ trợ.');
  return engines[mode](analysis,options);
}
