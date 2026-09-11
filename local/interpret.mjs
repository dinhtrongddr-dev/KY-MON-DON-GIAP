import {INSTRUCTIONS, readingSchema, validateReading, ReadingValidationError} from './reading.mjs';
import {runCodex} from './codex-client.mjs';

// A single bounded repair is allowed for invalid content, never for auth/network failures.
export async function interpretReading(prepared,{runner=runCodex,signal,budgetMs=180000}={}) {
  const deadline=AbortSignal.timeout(budgetMs);
  const combined=signal?AbortSignal.any([signal,deadline]):deadline;
  let revision;
  for(let attempt=0;attempt<2;attempt++) {
    combined.throwIfAborted();
    const context=revision?{...prepared.context,revision}:prepared.context;
    const result=await runner(INSTRUCTIONS,context,readingSchema(prepared.facts),{signal:combined});
    combined.throwIfAborted();
    try{return validateReading(result,prepared.facts,prepared.context.selectedTopic,prepared.context);}
    catch(error) {
      if(!(error instanceof ReadingValidationError))throw error;
      if(attempt===1)throw new Error('AI chưa hoàn tất bài luận đủ căn cứ sau một lượt bổ sung. Hãy thử lại; chưa hiển thị lời luận thiếu kiểm chứng.');
      revision={attempt:1,issue:error.message,instruction:'Viết lại kết quả hoàn chỉnh theo schema; giữ nguyên câu hỏi, bàn và facts. Không thêm dữ kiện để lấp độ dài.'};
    }
  }
}
