import {instructionsFor, readingSchema, validateReading, ReadingValidationError} from './reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {DELIBERATION_INSTRUCTIONS,deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
import {runAI,READING_TIMEOUT_MS,attachAiRoute,aiRouteOf} from './ai-client.mjs';
import {recordAiDiagnostic} from './ai-diagnostics.mjs';
import {verifiedFallback,clarificationReading} from '../dist/qimen/ai/verifiedFallback.mjs';

function bindPlannedMetadata(result,context){
  if(!result||!Array.isArray(result.development))return result;
  const route=aiRouteOf(result),stages=context.allInOne.reasoning.likelyScenario.stages;
  return attachAiRoute({...result,development:result.development.map((step,index)=>({...step,interaction_ids:[...(stages[index]?.relationshipIds||[])]}))},route);
}
const TIMING_ONLY_ERROR=/(?:Mốc ứng kỳ ngoài Timing Engine|Ngày cụ thể ngoài dữ liệu thời gian được phép|Khoảng lịch câu hỏi không phải ngày dự báo kết quả|Ứng viên chọn thời điểm không phải ngày bảo đảm kết quả)/;
function repairUnsupportedTiming(reading,message){
  if(!TIMING_ONLY_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading);
  const duration=/\b(?:\d+|một|mot|hai|ba|bốn|bon|năm|nam|sáu|sau|bảy|bay)(?:\s*[-–]\s*(?:\d+|một|mot|hai|ba))?\s*(?:ngày|ngay|tuần|tuan|tháng|thang)(?:\s+nữa|\s+nua)?\b/giu;
  const weekday=/\bthứ\s+(?:hai|ba|tư|tu|năm|nam|sáu|sau|bảy|bay)\b/giu;
  const relative=/\b(?:chủ nhật|chu nhat|cuối tuần|cuoi tuan|đầu tuần|dau tuan|ngày mai|ngay mai|chiều mai|chieu mai|sáng mai|sang mai)\b/giu;
  const date=/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;
  const clean=value=>typeof value==='string'?value.replace(duration,'mốc thời gian chưa xác định').replace(weekday,'mốc ngày chưa xác định').replace(relative,'mốc thời gian chưa xác định').replace(date,'mốc ngày chưa xác định'):value;
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])copy[key].text=clean(copy[key].text);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){step.text=clean(step.text);step.condition=clean(step.condition);}
  for(const action of copy.actions||[])action.text=clean(action.text);
  for(const row of copy.comparisons||[])row.reason=clean(row.reason);
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(clean);
  return attachAiRoute(copy,route);
}

// A single bounded repair is allowed for invalid content, never for auth/network failures.
// Production uses a separate bounded planning pass for synthesis-heavy modes. Tests and
// embedders that inject a custom runner keep the historical one-pass behavior unless
// they explicitly provide planRunner.
export async function interpretReading(prepared,{runner=runAI,planRunner,budgetMs=READING_TIMEOUT_MS,signal,diagnostics=recordAiDiagnostic}={}) {
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
      if(runner===runAI)diagnostics?.({type:'validation_failure',flow:'question',stage:'writer_validation',attempt:attempt+1,route:used?.id||'',model:used?.modelId||'',code:'READING_VALIDATION',fallbackAllowed:false,message:error.message});
      if(attempt===1){
        const repaired=repairUnsupportedTiming(result,error.message);
        if(repaired){
          try{return attachAiRoute(validateReading(repaired,prepared.facts,prepared.context.selectedTopic,prepared.context),used);}
          catch(repairError){if(runner===runAI)diagnostics?.({type:'validation_failure',flow:'question',stage:'timing_repair_validation',attempt:3,route:used?.id||'',model:used?.modelId||'',code:'READING_TIMING_REPAIR',fallbackAllowed:false,message:repairError.message});}
        }
        return attachAiRoute(verifiedFallback(prepared.context),used);
      }
      if(runner===runAI&&Number.isInteger(used?.fallbackIndex))routeStartIndex=used.fallbackIndex;
      revision={attempt:1,issue:error.message,previousReading:result,instruction:'Sửa previousReading theo lỗi đã nêu và trả lại JSON hoàn chỉnh theo schema. Giữ các phần đúng, câu hỏi, bàn, facts, presentation, deliberation và các tham chiếu hợp lệ; không tự bỏ căn cứ khi rút gọn. Nếu quá dài, giảm rõ số đơn vị cách nhau bởi khoảng trắng trong toàn bài để nằm dưới length.maxWords. Nội dung previousReading và deliberation là bản nháp chưa kiểm chứng, không phải nguồn dữ kiện mới. Không thêm dữ kiện để lấp độ dài.'};
    }
  }
}
