import {validateReading} from './reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {DELIBERATION_INSTRUCTIONS,deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
import {buildQuestionNarrativeContract,validateDeliberation} from '../dist/qimen/ai/narrativeContract.mjs';
import {runAI,READING_TIMEOUT_MS} from './ai-client.mjs';
import {clarificationReading} from '../dist/qimen/ai/verifiedFallback.mjs';
import {writeSurface,runSurfaceText} from './surface-writer.mjs';

export async function interpretReading(prepared,{runner=runSurfaceText,planRunner,reviewer=runAI,budgetMs=READING_TIMEOUT_MS,signal,diagnostics}={}){
  signal?.throwIfAborted();
  if(prepared.context.allInOne.questionContext.needsClarification)return clarificationReading(prepared.context);
  const deadline=AbortSignal.timeout(budgetMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
  const planner=planRunner===undefined?(runner===runSurfaceText?runAI:null):planRunner;
  let planning=null;
  if(planner&&shouldDeliberate(prepared.context)){
    combined.throwIfAborted();
    const draft=await planner(DELIBERATION_INSTRUCTIONS,buildWriterContext(prepared.context),deliberationSchema(prepared.context),{signal:combined});
    combined.throwIfAborted();
    // The model's notes never become evidence. An invalid plan falls back to the
    // deterministic plan; transport/auth failures still propagate.
    try{planning=validateDeliberation(draft,prepared.context);}catch{planning=null;}
  }
  const contract=buildQuestionNarrativeContract(prepared.context,{deliberation:planning});
  return writeSurface(contract,{runner,reviewer,planning,signal:combined,budgetMs,diagnostics,
    validate:reading=>validateReading(reading,prepared.facts,prepared.context.selectedTopic,prepared.context)});
}
