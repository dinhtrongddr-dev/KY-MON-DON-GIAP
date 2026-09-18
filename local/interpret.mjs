import {instructionsFor, readingSchema, validateReading, ReadingValidationError} from './reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {DELIBERATION_INSTRUCTIONS,deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
import {runAI,READING_TIMEOUT_MS,attachAiRoute,aiRouteOf,AI_ROUTES} from './ai-client.mjs';
import {verifiedFallback,clarificationReading} from '../dist/qimen/ai/verifiedFallback.mjs';

function bindPlannedMetadata(result,context){
  if(!result||!Array.isArray(result.development))return result;
  const route=aiRouteOf(result),stages=context.allInOne.reasoning.likelyScenario.stages;
  return attachAiRoute({...result,development:result.development.map((step,index)=>({...step,interaction_ids:[...(stages[index]?.relationshipIds||[])]}))},route);
}

// A single bounded repair is allowed for invalid content, never for auth/network failures.
// Production uses a separate bounded planning pass for synthesis-heavy modes. Tests and
// embedders that inject a custom runner keep the historical one-pass behavior unless
// they explicitly provide planRunner.
export async function interpretReading(prepared,{runner=runAI,planRunner,budgetMs=READING_TIMEOUT_MS,signal}={}) {
  signal?.throwIfAborted();
  if(prepared.context.allInOne.questionContext.needsClarification)return clarificationReading(prepared.context);
  const deadline=AbortSignal.timeout(budgetMs);
  const combined=signal?AbortSignal.any([signal,deadline]):deadline;
  const baseWriterContext=buildWriterContext(prepared.context);
  const planner=planRunner===undefined?(runner===runAI?runAI:null):planRunner;
  let deliberation=null;
  if(planner&&shouldDeliberate(prepared.context)){
    combined.throwIfAborted();
    deliberation=await planner(DELIBERATION_INSTRUCTIONS,baseWriterContext,deliberationSchema(prepared.context),{signal:combined});
    combined.throwIfAborted();
  }
  const writerContext=deliberation?{...baseWriterContext,deliberation}:baseWriterContext;
  let revision,routeStartIndex=0;
  for(let attempt=0;attempt<2;attempt++) {
    combined.throwIfAborted();
    const context=revision?{...writerContext,revision}:writerContext;
    const options=runner===runAI?{signal:combined,routeStartIndex}:{signal:combined};
    const result=bindPlannedMetadata(await runner(instructionsFor(prepared.context),context,readingSchema(prepared.facts,prepared.context),options),prepared.context);
    combined.throwIfAborted();
    try{return attachAiRoute(validateReading(result,prepared.facts,prepared.context.selectedTopic,prepared.context),aiRouteOf(result));}
    catch(error) {
      if(!(error instanceof ReadingValidationError))throw error;
      const used=aiRouteOf(result);
      if(attempt===1)return attachAiRoute(verifiedFallback(prepared.context),used);
      if(runner===runAI&&Number.isInteger(used?.fallbackIndex))routeStartIndex=Math.min(used.fallbackIndex+1,AI_ROUTES.length-1);
      revision={attempt:1,issue:error.message,previousReading:result,instruction:'Sửa previousReading theo lỗi đã nêu và trả lại JSON hoàn chỉnh theo schema. Giữ các phần đúng, câu hỏi, bàn, facts, presentation, deliberation và các tham chiếu hợp lệ; không tự bỏ căn cứ khi rút gọn. Nếu quá dài, giảm rõ số đơn vị cách nhau bởi khoảng trắng trong toàn bài để nằm dưới length.maxWords. Nội dung previousReading và deliberation là bản nháp chưa kiểm chứng, không phải nguồn dữ kiện mới. Không thêm dữ kiện để lấp độ dài.'};
    }
  }
}
