import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {buildMenhNarrativeFromContext} from '../dist/qimen/menh/ai/narrative-contract.mjs';
import {validateMenhReading} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {runAI,READING_TIMEOUT_MS} from './ai-client.mjs';
import {writeSurface,runSurfaceText} from './surface-writer.mjs';

export async function interpretMenhReading(prepared,{runner=runSurfaceText,reviewer=runAI,budgetMs=READING_TIMEOUT_MS,signal,diagnostics}={}){
  const context=buildMenhWriterContext(prepared.result,{
    birthTimeMode:prepared.input.birthTimeMode,stability:prepared.result.stability||null,
    timePlace:prepared.technical?.timePlace||null,rectification:prepared.rectification||null
  });
  const contract=buildMenhNarrativeFromContext(context);
  return writeSurface(contract,{runner,reviewer,budgetMs,signal,diagnostics,
    validate:reading=>validateMenhReading(reading,context)});
}
