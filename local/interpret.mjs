import {instructionsFor, readingSchema, validateReading, ReadingValidationError} from './reading.mjs';
import {buildWriterContext} from '../dist/qimen/ai/writerContext.mjs';
import {DELIBERATION_INSTRUCTIONS,deliberationSchema,shouldDeliberate} from '../dist/qimen/ai/deliberation.mjs';
import {runAI,READING_TIMEOUT_MS,attachAiRoute,aiRouteOf} from './ai-client.mjs';
import {recordAiDiagnostic} from './ai-diagnostics.mjs';
import {verifiedFallback,clarificationReading} from '../dist/qimen/ai/verifiedFallback.mjs';
import {normalizeQuestion} from '../dist/qimen/ai/classifier.mjs';

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
const EVENT_ASSERTION_ERROR=/Bài luận tự khẳng định sự kiện ngoài điều người dùng đã kể/;
const EVENT_ASSERTION_PATTERN=/\b(?:khach hang|doi tac|khoan thu|hop dong(?: moi)?|tien|ban)\s+(?:da|dang|se)\s+(?:duoc )?(?:dong y|chuyen tien|nhan|xac nhan|ky|thanh toan|phe duyet|vao tai khoan)\b/;
function repairUnsupportedEvents(reading,message){
  if(!EVENT_ASSERTION_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading);
  const safe={summary:'Kết luận chỉ phản ánh xu hướng của bàn; sự kiện ngoài đời ở bước này vẫn cần được xác nhận.',situation:'Phần này mô tả điều kiện biểu tượng đang có, không xác nhận một sự kiện ngoài đời đã xảy ra.',development:'Ở chặng này chỉ nên theo dõi dấu hiệu thực tế tương ứng; chưa coi phản hồi, ký kết hay tiền về là sự kiện đã xảy ra.',bottleneck:'Nút thắt cần được kiểm tra bằng dữ liệu thực tế trước khi nâng thành kết quả.',alternative:'Nhánh khác chỉ là khả năng có điều kiện, chưa phải sự kiện thực tế.',timing:'Mốc này chỉ là cửa sổ kiểm chứng; không khẳng định sự kiện đã xảy ra.',resolution:'Cần xác minh điều kiện thực tế trước khi coi nút thắt đã được tháo.',action:'Hãy dùng bước này để kiểm chứng phản hồi thực tế thay vì giả định kết quả đã xảy ra.',comparison:'Đây chỉ là so sánh tương đối giữa các lựa chọn, không xác nhận sự kiện.',question:'Cần xác nhận thêm dữ kiện thực tế trước khi kết luận.'};
  const clean=(value,slot)=>{
    if(typeof value!=='string')return value;
    return value.split(/(?<=[.!?])\s+/).map(sentence=>EVENT_ASSERTION_PATTERN.test(normalizeQuestion(sentence))?safe[slot]:sentence).join(' ');
  };
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])copy[key].text=clean(copy[key].text,key);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution,'resolution');
  for(const step of copy.development||[]){step.text=clean(step.text,'development');step.condition=clean(step.condition,'development');}
  for(const action of copy.actions||[])action.text=clean(action.text,'action');
  for(const row of copy.comparisons||[])row.reason=clean(row.reason,'comparison');
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(value=>clean(value,'question'));
  return attachAiRoute(copy,route);
}

const REPETITION_ERROR=/Các phần lặp ý (?:payment_)?verification từ ba lần/;
const VERIFY_IMPERATIVE=/(?:cần|phải|hãy|nên)[^.!?]{0,50}?(?:xác minh|kiểm tra|xác nhận|làm rõ)/iu;
const PAYMENT_CONTEXT=/\b(?:thanh toán|cam kết|phản hồi|quyền|phê duyệt)\b/iu;
function repairRepeatedVerification(reading,message){
  if(!REPETITION_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading),seen={verification:0,payment_verification:0};
  const clean=value=>{
    if(typeof value!=='string')return value;
    return value.split(/(?<=[.!?])\s+/).map(sentence=>{
      if(!VERIFY_IMPERATIVE.test(sentence))return sentence;
      const tag=PAYMENT_CONTEXT.test(sentence)?'payment_verification':'verification';
      seen[tag]++;if(seen[tag]<=2)return sentence;
      return sentence.replace(VERIFY_IMPERATIVE,'đối chiếu');
    }).join(' ');
  };
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])copy[key].text=clean(copy[key].text);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){step.text=clean(step.text);step.condition=clean(step.condition);}
  for(const action of copy.actions||[])action.text=clean(action.text);
  for(const row of copy.comparisons||[])row.reason=clean(row.reason);
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(clean);
  return attachAiRoute(copy,route);
}
const CERTAINTY_ERROR=/Không được tạo xác suất hoặc kết quả chắc chắn từ tượng/;
const CERTAINTY_PATTERN=/\b(?:chac chan (?:se|thang|trung|ky duoc|thanh cong|that bai|co loi|nhan duoc)|dam bao (?:thang|loi nhuan|thanh cong)|nhat dinh (?:thang|thanh cong)|ty le (?:thanh cong|thang)|xac suat|\d+(?:[.,]\d+)?\s*%\s*(?:thanh cong|chien thang))\b/;
function repairCertainty(reading,message){
  if(!CERTAINTY_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading);
  const safe={
    summary:'Kết luận chỉ mô tả xu hướng có điều kiện; không quy đổi thành xác suất hoặc kết quả chắc chắn.',
    situation:'Dữ kiện này chỉ cho biết điều kiện đang nghiêng theo một hướng, không bảo đảm kết quả.',
    development:'Chặng này là dấu hiệu chuyển bước có điều kiện, không phải xác suất hay bảo đảm hoàn tất.',
    bottleneck:'Nút thắt này làm thay đổi mức thuận/nghịch của quá trình, không tạo kết quả chắc chắn.',
    alternative:'Nhánh này chỉ là khả năng có điều kiện, không phải xác suất được định lượng.',
    timing:'Mốc này chỉ là cửa sổ hành động/kiểm chứng, không bảo đảm kết quả.',
    resolution:'Chỉ dùng điều kiện thực tế để xác nhận bước tiếp theo; không suy xác suất từ tượng.',
    action:'Thực hiện bước này để kiểm chứng phản hồi thực tế, không coi là bảo đảm thành công.',
    comparison:'So sánh này chỉ thể hiện độ phù hợp tương đối, không phải xác suất thành công.',
    question:'Không thể lượng hóa xác suất từ bàn; cần thêm dữ kiện thực tế.'
  };
  const clean=(value,slot)=>{
    if(typeof value!=='string')return value;
    return value.split(/(?<=[.!?])\s+/).map(sentence=>CERTAINTY_PATTERN.test(normalizeQuestion(sentence))?safe[slot]:sentence).join(' ');
  };
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])copy[key].text=clean(copy[key].text,key);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution,'resolution');
  for(const step of copy.development||[]){step.text=clean(step.text,'development');step.condition=clean(step.condition,'development');}
  for(const action of copy.actions||[])action.text=clean(action.text,'action');
  for(const row of copy.comparisons||[])row.reason=clean(row.reason,'comparison');
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(value=>clean(value,'question'));
  return attachAiRoute(copy,route);
}
const STAGE_OVERCLAIM_ERROR=/Tự nâng giai đoạn thành đạt mục tiêu\/hoàn tất/;
const STAGE_OVERCLAIM_PATTERN=/\b(?:ban da dat muc tieu|(?:thoa thuan|hop dong|du an|cong viec) da (?:hoan tat|hoan thanh|thanh cong)|moi dieu kien da (?:duoc )?dap ung|(?:ban |su viec |du an )?chac chan (?:dat|thanh cong|hoan tat|hoan thanh))\b/;
function repairStageOverclaim(reading,message){
  if(!STAGE_OVERCLAIM_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading);
  const safe={
    summary:'Kết quả hiện chỉ là xu hướng có điều kiện; chưa được coi là đã đạt mục tiêu hoặc hoàn tất.',
    situation:'Trạng thái hiện tại chưa đủ để nâng thành kết quả đã hoàn tất.',
    development:'Chặng này mới là điều kiện trung gian; chỉ chuyển bước khi có dấu hiệu thực tế tương ứng.',
    bottleneck:'Nút thắt này quyết định việc có thể tiến sang bước tiếp theo, chưa phải kết quả hoàn tất.',
    alternative:'Nhánh này chỉ là phương án có điều kiện, không phải kết quả đã xảy ra.',
    timing:'Thời điểm này chỉ là cửa sổ hành động hoặc kiểm chứng, không xác nhận mục tiêu đã hoàn tất.',
    resolution:'Chỉ coi nút thắt được tháo khi điều kiện thực tế tương ứng đã xuất hiện.',
    action:'Thực hiện bước này để kiểm chứng điều kiện tiếp theo, không giả định mục tiêu đã hoàn tất.',
    comparison:'Đây là so sánh tương đối giữa các lựa chọn, không phải xác nhận kết quả đã đạt.',
    question:'Cần thêm dữ kiện thực tế trước khi coi mục tiêu đã hoàn tất.'
  };
  const clean=(value,slot)=>{
    if(typeof value!=='string')return value;
    return value.split(/(?<=[.!?])\s+/).map(sentence=>STAGE_OVERCLAIM_PATTERN.test(normalizeQuestion(sentence))?safe[slot]:sentence).join(' ');
  };
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])copy[key].text=clean(copy[key].text,key);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution,'resolution');
  for(const step of copy.development||[]){step.text=clean(step.text,'development');step.condition=clean(step.condition,'development');}
  for(const action of copy.actions||[])action.text=clean(action.text,'action');
  for(const row of copy.comparisons||[])row.reason=clean(row.reason,'comparison');
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(value=>clean(value,'question'));
  return attachAiRoute(copy,route);
}
const EMPHASIS_ERROR=/(?:Dấu tô đậm chưa cân bằng|Chỉ nhấn |Chỉ tô đậm |Phần nhấn cần giữ)/;
function repairEmphasis(reading,message){
  if(!EMPHASIS_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading),clean=value=>typeof value==='string'?value.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*\*/g,''):value;
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])copy[key].text=clean(copy[key].text);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){step.text=clean(step.text);step.condition=clean(step.condition);}
  for(const action of copy.actions||[])action.text=clean(action.text);
  for(const row of copy.comparisons||[])row.reason=clean(row.reason);
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(clean);
  return attachAiRoute(copy,route);
}
function repairForValidation(reading,message){
  let current=reading,changed=false;
  for(const fn of [repairUnsupportedTiming,repairUnsupportedEvents,repairCertainty,repairStageOverclaim,repairRepeatedVerification,repairEmphasis]){
    const next=fn(current,message);if(next){current=next;changed=true;}
  }
  return changed?current:null;
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
        let repairInput=result,repairMessage=error.message;
        for(let repairAttempt=0;repairAttempt<4;repairAttempt++){
          const repaired=repairForValidation(repairInput,repairMessage);
          if(!repaired)break;
          try{return attachAiRoute(validateReading(repaired,prepared.facts,prepared.context.selectedTopic,prepared.context),used);}
          catch(repairError){
            if(runner===runAI)diagnostics?.({type:'validation_failure',flow:'question',stage:'content_repair_validation',attempt:3+repairAttempt,route:used?.id||'',model:used?.modelId||'',code:'READING_CONTENT_REPAIR',fallbackAllowed:false,message:repairError.message});
            repairInput=repaired;repairMessage=repairError.message;
          }
        }
        return attachAiRoute(verifiedFallback(prepared.context),used);
      }
      if(runner===runAI&&Number.isInteger(used?.fallbackIndex))routeStartIndex=used.fallbackIndex;
      const repetitionInstruction=REPETITION_ERROR.test(error.message)?' Nếu lỗi là lặp ý verification/payment_verification: chỉ giữ lời nhắc xác minh/kiểm tra tập trung tại một bottleneck và tối đa một action. Ở summary, situation và các development còn lại, không dùng lại cấu trúc cần/phải/hãy/nên + xác minh/kiểm tra/xác nhận/làm rõ; thay bằng cơ chế, gate, đòn bẩy, điều kiện hoặc dấu hiệu quan sát riêng đã có claim/evidence. Mỗi phần phải thêm một insight khác nhau thay vì đổi câu chữ cho cùng cảnh báo.':'';
      const certaintyInstruction=CERTAINTY_ERROR.test(error.message)?' Nếu lỗi là chắc chắn/xác suất: bỏ mọi phần trăm, “chắc chắn”, “đảm bảo”, “nhất định” gắn với kết quả. Chỉ dùng xu hướng có điều kiện, độ phù hợp tương đối hoặc điều kiện chuyển bước; tuyệt đối không lượng hóa xác suất từ tượng.':'';
      const stageInstruction=STAGE_OVERCLAIM_ERROR.test(error.message)?' Nếu lỗi là tự nâng giai đoạn: tuyệt đối không viết “đã đạt mục tiêu”, “đã hoàn tất/hoàn thành/thành công” hoặc “chắc chắn đạt”. Giữ đúng stageAsked và primaryJudgment của planner; diễn đạt thành điều kiện chuyển bước, dấu hiệu cần xuất hiện hoặc trạng thái chưa hoàn tất.':'';
      revision={attempt:1,issue:error.message,previousReading:result,instruction:'Sửa previousReading theo lỗi đã nêu và trả lại JSON hoàn chỉnh theo schema. Giữ các phần đúng, câu hỏi, bàn, facts, presentation, deliberation và các tham chiếu hợp lệ; không tự bỏ căn cứ khi rút gọn. Nếu quá dài, giảm rõ số đơn vị cách nhau bởi khoảng trắng trong toàn bài để nằm dưới length.maxWords. Nội dung previousReading và deliberation là bản nháp chưa kiểm chứng, không phải nguồn dữ kiện mới. Không thêm dữ kiện để lấp độ dài.'+repetitionInstruction+certaintyInstruction+stageInstruction};
    }
  }
}
