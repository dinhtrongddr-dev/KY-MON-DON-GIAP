import {instructionsFor, readingSchema, validateReading, ReadingValidationError} from './reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {DELIBERATION_INSTRUCTIONS,deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
import {runCodex,READING_TIMEOUT_MS} from './codex-client.mjs';
import {verifiedFallback,clarificationReading} from '../dist/qimen/ai/verifiedFallback.mjs';

// A single bounded repair is allowed for invalid content, never for auth/network failures.
// Production uses a separate bounded planning pass for synthesis-heavy modes. Tests and
// embedders that inject a custom runner keep the historical one-pass behavior unless
// they explicitly provide planRunner.
export async function interpretReading(prepared,{runner=runCodex,planRunner,budgetMs=READING_TIMEOUT_MS,signal}={}) {
  signal?.throwIfAborted();
  if(prepared.context.allInOne.questionContext.needsClarification)return clarificationReading(prepared.context);
  const deadline=AbortSignal.timeout(budgetMs);
  const combined=signal?AbortSignal.any([signal,deadline]):deadline;
  const baseWriterContext=buildWriterContext(prepared.context);
  const planner=planRunner===undefined?(runner===runCodex?runCodex:null):planRunner;
  let deliberation=null;
  if(planner&&shouldDeliberate(prepared.context)){
    combined.throwIfAborted();
    deliberation=await planner(DELIBERATION_INSTRUCTIONS,baseWriterContext,deliberationSchema(prepared.context),{signal:combined});
    combined.throwIfAborted();
  }
  const writerContext=deliberation?{...baseWriterContext,deliberation}:baseWriterContext;
  let revision;
  for(let attempt=0;attempt<2;attempt++) {
    combined.throwIfAborted();
    const context=revision?{...writerContext,revision}:writerContext;
    const result=await runner(instructionsFor(prepared.context),context,readingSchema(prepared.facts,prepared.context),{signal:combined});
    combined.throwIfAborted();
    try{return validateReading(result,prepared.facts,prepared.context.selectedTopic,prepared.context);}
    catch(error) {
      if(!(error instanceof ReadingValidationError))throw error;
      if(attempt===1)return verifiedFallback(prepared.context);
      revision={attempt:1,issue:error.message,previousReading:result,instruction:'Sửa previousReading theo lỗi đã nêu và trả lại JSON hoàn chỉnh theo schema. Giữ các phần đúng, câu hỏi, bàn, facts, presentation, deliberation và các tham chiếu hợp lệ; không tự bỏ căn cứ khi rút gọn. Nếu quá dài, giảm rõ số đơn vị cách nhau bởi khoảng trắng trong toàn bài để nằm dưới length.maxWords. Nội dung previousReading và deliberation là bản nháp chưa kiểm chứng, không phải nguồn dữ kiện mới. Không thêm dữ kiện để lấp độ dài.'};
    }
  }
}
