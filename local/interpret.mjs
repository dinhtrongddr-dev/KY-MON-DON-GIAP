import {validateReading} from './reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {DELIBERATION_INSTRUCTIONS,buildPlannerContext,deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
import {buildQuestionNarrativeContract,validateDeliberation} from '../dist/qimen/ai/narrativeContract.mjs';
import {READING_TIMEOUT_MS} from './ai-client.mjs';
import {generateStructured} from './provider-client.mjs';
import {clarificationReading} from '../dist/qimen/ai/verifiedFallback.mjs';
import {writeSurface,runSurfaceText} from './surface-writer.mjs';

export async function interpretReading(prepared,{runner=runSurfaceText,planRunner,reviewer=generateStructured,budgetMs=READING_TIMEOUT_MS,signal,diagnostics}={}){
  signal?.throwIfAborted();
  if(prepared.context.allInOne.questionContext.needsClarification)return clarificationReading(prepared.context);
  const deadline=AbortSignal.timeout(budgetMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
  const planner=planRunner===undefined?(runner===runSurfaceText?generateStructured:null):planRunner;
  let planning=null;
  if(planner&&shouldDeliberate(prepared.context)){
    combined.throwIfAborted();
    // Planner output is advisory only. A malformed structured turn must not
    // block the actual Writer; transport/auth/timeout failures still propagate.
    try{
      const draft=await planner(DELIBERATION_INSTRUCTIONS,buildPlannerContext(buildWriterContext(prepared.context)),deliberationSchema(prepared.context),{signal:combined});
      combined.throwIfAborted();
      try{planning=validateDeliberation(draft,prepared.context);}catch{planning=null;}
    }catch(error){
      if(!/AI trả kết quả chưa hợp lệ|JSON/i.test(String(error?.message||'')))throw error;
      planning=null;
    }
  }
  const contract=buildQuestionNarrativeContract(prepared.context,{deliberation:planning});
  return writeSurface(contract,{runner,reviewer,planning,signal:combined,budgetMs,diagnostics,
    validate:reading=>validateReading(reading,prepared.facts,prepared.context.selectedTopic,prepared.context)});
}
