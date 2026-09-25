import {buildNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {timingMentions} from '../dist/qimen/ai/timingText.mjs';
import {mapSectionContent} from '../dist/reading-format.mjs';
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
  const date=/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;
  const named=[...message.matchAll(/Mốc ứng kỳ ngoài Timing Engine: ([^;]+);/g)].map(m=>m[1]);
  const clean=value=>{
    if(typeof value!=='string')return value;
    if(!named.length)return value.replace(date,'mốc ngày chưa xác định');
    for(const mention of timingMentions(value).reverse())if(named.includes(mention.normalized))
      value=value.slice(0,mention.index)+'mốc thời gian chưa xác định'+value.slice(mention.index+mention.text.length);
    return value;
  };
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])mapSectionContent(copy[key],clean);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){mapSectionContent(step,clean);step.condition=clean(step.condition);}
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
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])mapSectionContent(copy[key],value=>clean(value,key));
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution,'resolution');
  for(const step of copy.development||[]){mapSectionContent(step,value=>clean(value,'development'));step.condition=clean(step.condition,'development');}
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
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])mapSectionContent(copy[key],clean);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){mapSectionContent(step,clean);step.condition=clean(step.condition);}
  for(const action of copy.actions||[])action.text=clean(action.text);
  for(const row of copy.comparisons||[])row.reason=clean(row.reason);
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(clean);
  return attachAiRoute(copy,route);
}
const CERTAINTY_ERROR=/Không được tạo xác suất hoặc kết quả chắc chắn từ tượng/;
const CERTAINTY_PATTERN=/\b(?:chac chan (?:se|thang|trung|ky duoc|thanh cong|that bai|co loi|nhan duoc)|dam bao (?:thang|loi nhuan|thanh cong)|nhat dinh (?:thang|thanh cong)|ty le (?:thanh cong|thang)|xac suat|\d+(?:[.,]\d+)?\s*%\s*(?:thanh cong|chien thang))\b/;
function softenCertaintySentence(sentence){
  if(typeof sentence!=='string'||!CERTAINTY_PATTERN.test(normalizeQuestion(sentence)))return sentence;
  let out=sentence;
  out=out
    .replace(/\b(?:xác suất|xac suat)\b([^.!?]{0,50}?)(?:\s+(?:là|la)|\s*:)?\s*\d+(?:[.,]\d+)?\s*%?/giu,(_m,middle)=>`mức hỗ trợ tương đối${middle||''}`)
    .replace(/\b(?:tỷ lệ|ty le)\s+(?:thành công|thanh cong|thắng|thang)\b([^.!?]{0,30}?)(?:\s+(?:là|la)|\s*:)?\s*\d+(?:[.,]\d+)?\s*%?/giu,(_m,middle)=>`mức hỗ trợ tương đối cho kết quả thuận${middle||''}`)
    .replace(/\b\d+(?:[.,]\d+)?\s*%\s*(?:thành công|thanh cong|chiến thắng|chien thang)\b/giu,'mức hỗ trợ tương đối cho kết quả thuận')
    .replace(/\bchắc chắn\s+sẽ\s+/giu,'có khả năng ')
    .replace(/\bchac chan\s+se\s+/giu,'có khả năng ')
    .replace(/\bchắc chắn\s+ký được\b/giu,'có khả năng ký được')
    .replace(/\bchac chan\s+ky duoc\b/giu,'có khả năng ký được')
    .replace(/\bchắc chắn\s+nhận được\b/giu,'có khả năng nhận được')
    .replace(/\bchac chan\s+nhan duoc\b/giu,'có khả năng nhận được')
    .replace(/\bchắc chắn\s+thành công\b/giu,'nghiêng về khả năng thành công')
    .replace(/\bchac chan\s+thanh cong\b/giu,'nghiêng về khả năng thành công')
    .replace(/\bchắc chắn\s+thắng\b/giu,'nghiêng về khả năng đạt kết quả thuận')
    .replace(/\bchac chan\s+thang\b/giu,'nghiêng về khả năng đạt kết quả thuận')
    .replace(/\bchắc chắn\s+trúng\b/giu,'có khả năng đạt kết quả thuận')
    .replace(/\bchac chan\s+trung\b/giu,'có khả năng đạt kết quả thuận')
    .replace(/\bchắc chắn\s+thất bại\b/giu,'có nguy cơ thất bại')
    .replace(/\bchac chan\s+that bai\b/giu,'có nguy cơ thất bại')
    .replace(/\bchắc chắn\s+có lợi\b/giu,'nghiêng về hướng có lợi')
    .replace(/\bchac chan\s+co loi\b/giu,'nghiêng về hướng có lợi')
    .replace(/\bđảm bảo\s+thành công\b/giu,'hỗ trợ khả năng thành công')
    .replace(/\bdam bao\s+thanh cong\b/giu,'hỗ trợ khả năng thành công')
    .replace(/\bđảm bảo\s+thắng\b/giu,'hỗ trợ khả năng đạt kết quả thuận')
    .replace(/\bdam bao\s+thang\b/giu,'hỗ trợ khả năng đạt kết quả thuận')
    .replace(/\bđảm bảo\s+lợi nhuận\b/giu,'hỗ trợ triển vọng lợi nhuận')
    .replace(/\bdam bao\s+loi nhuan\b/giu,'hỗ trợ triển vọng lợi nhuận')
    .replace(/\bnhất định\s+thành công\b/giu,'nghiêng về khả năng thành công')
    .replace(/\bnhat dinh\s+thanh cong\b/giu,'nghiêng về khả năng thành công')
    .replace(/\bnhất định\s+thắng\b/giu,'nghiêng về khả năng đạt kết quả thuận')
    .replace(/\bnhat dinh\s+thang\b/giu,'nghiêng về khả năng đạt kết quả thuận')
    .replace(/mức hỗ trợ tương đối\s+(?:cho\s+)?thành công/giu,'mức hỗ trợ tương đối cho khả năng thành công')
    .replace(/\s{2,}/g,' ');
  return out;
}
function repairCertainty(reading,message){
  if(!CERTAINTY_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading);
  const clean=value=>typeof value==='string'
    ?value.split(/(?<=[.!?])\s+/).map(softenCertaintySentence).join(' ')
    :value;
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])mapSectionContent(copy[key],clean);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){mapSectionContent(step,clean);step.condition=clean(step.condition);}
  for(const action of copy.actions||[])action.text=clean(action.text);
  for(const row of copy.comparisons||[])row.reason=clean(row.reason);
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(clean);
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
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])mapSectionContent(copy[key],value=>clean(value,key));
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution,'resolution');
  for(const step of copy.development||[]){mapSectionContent(step,value=>clean(value,'development'));step.condition=clean(step.condition,'development');}
  for(const action of copy.actions||[])action.text=clean(action.text,'action');
  for(const row of copy.comparisons||[])row.reason=clean(row.reason,'comparison');
  if(Array.isArray(copy.questions))copy.questions=copy.questions.map(value=>clean(value,'question'));
  return attachAiRoute(copy,route);
}
const EMPHASIS_ERROR=/(?:Dấu tô đậm chưa cân bằng|Chỉ nhấn |Chỉ tô đậm |Phần nhấn cần giữ)/;
function repairEmphasis(reading,message){
  if(!EMPHASIS_ERROR.test(message)||!reading||typeof reading!=='object')return null;
  const route=aiRouteOf(reading),copy=structuredClone(reading),clean=value=>typeof value==='string'?value.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*\*/g,''):value;
  for(const key of ['summary','situation','bottleneck','alternative','timing'])if(copy[key])mapSectionContent(copy[key],clean);
  if(copy.bottleneck)copy.bottleneck.resolution=clean(copy.bottleneck.resolution);
  for(const step of copy.development||[]){mapSectionContent(step,clean);step.condition=clean(step.condition);}
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
  const writerContext=deliberation?{...baseWriterContext,deliberation,narrativeContract:buildNarrativeContract(prepared.context,deliberation)}:baseWriterContext;
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
      const certaintyInstruction=CERTAINTY_ERROR.test(error.message)?' Nếu lỗi là chắc chắn/xác suất: GIỮ NGUYÊN chủ thể, cơ chế, điều kiện, nút thắt và hành động của câu gốc; chỉ hạ mức chắc chắn ngay trong chính câu đó. Bỏ phần trăm và các từ “chắc chắn”, “đảm bảo”, “nhất định”; thay bằng “có khả năng”, “nghiêng về”, “hỗ trợ khả năng” hoặc “độ phù hợp tương đối” tùy ngữ cảnh. Không thay cả câu bằng một cảnh báo chung kiểu “không thể quy đổi thành xác suất”. Tuyệt đối không lượng hóa xác suất từ tượng.':'';
      const stageInstruction=STAGE_OVERCLAIM_ERROR.test(error.message)?' Nếu lỗi là tự nâng giai đoạn: tuyệt đối không viết “đã đạt mục tiêu”, “đã hoàn tất/hoàn thành/thành công” hoặc “chắc chắn đạt”. Giữ đúng stageAsked và primaryJudgment của planner; diễn đạt thành điều kiện chuyển bước, dấu hiệu cần xuất hiện hoặc trạng thái chưa hoàn tất.':'';
      revision={attempt:1,issue:error.message,previousReading:result,instruction:'Sửa previousReading theo lỗi đã nêu và trả lại JSON hoàn chỉnh theo schema. Giữ các phần đúng, câu hỏi, bàn, facts, presentation, deliberation và các tham chiếu hợp lệ; không tự bỏ căn cứ khi rút gọn. Nếu quá dài, giảm rõ số đơn vị cách nhau bởi khoảng trắng trong toàn bài để nằm dưới length.maxWords. Nội dung previousReading và deliberation là bản nháp chưa kiểm chứng, không phải nguồn dữ kiện mới. Không thêm dữ kiện để lấp độ dài.'+repetitionInstruction+certaintyInstruction+stageInstruction};
    }
  }
}
