import {buildMenhWriterContext} from '../dist/qimen/menh/ai/writer-context.mjs';
import {menhWriterInstructions} from '../dist/qimen/menh/ai/prompts.mjs';
import {validateMenhReading,MenhReadingValidationError} from '../dist/qimen/menh/ai/reading-audit.mjs';
import {menhReadingSchema,MENH_READING_SECTIONS} from '../dist/qimen/menh/ai/schema.mjs';
import {runAI,READING_TIMEOUT_MS,attachAiRoute,aiRouteOf} from './ai-client.mjs';
import {recordAiDiagnostic} from './ai-diagnostics.mjs';

function empty(){return {text:'',claim_ids:[]};}
function fallback(context){
  const out={status:'reading',specVersion:context.specVersion,profileId:context.profileId};
  for(const key of MENH_READING_SECTIONS)out[key]=empty();
  const map={SELF:'self',FAMILY:'family',CHILDREN:'family',MARRIAGE:'marriage',CAREER:'career',WEALTH:'wealth'};
  for(const claim of context.claims){
    const key=claim.claimId==='LUCK_CURRENT'?'luck':claim.claimId==='ANNUAL_CURRENT'?'annual':map[claim.domain];
    if(!key)continue;
    if(out[key].text)out[key].text+=' ';
    out[key].text+=claim.text;
    out[key].claim_ids.push(claim.claimId);
  }
  const first=context.claims[0];
  if(first)out.overview={text:`Kết quả deterministic hiện có: ${first.text}`,claim_ids:[first.claimId]};
  if(context.globalStructure?.active&&context.globalStructure.claimId){
    const globalId=context.globalStructure.claimId;
    const labels=(context.globalStructure.mechanisms||[]).map(x=>x==='FU_YIN'?'Phục Ngâm':x==='FAN_YIN'?'Phản Ngâm':x).join(' + ');
    const sectionByDomain={SELF:'self',FAMILY:'family',CHILDREN:'family',MARRIAGE:'marriage',CAREER:'career',WEALTH:'wealth'};
    const sections=new Set((context.globalStructure.affectedDomains||[]).map(x=>sectionByDomain[x]).filter(Boolean));
    for(const key of sections)if(out[key].text){
      if(!out[key].claim_ids.includes(globalId))out[key].claim_ids.push(globalId);
      out[key].text+=` Bối cảnh ${labels} phải được xét trước; tín hiệu thuận cục bộ có thể bị giới hạn/cap nhưng đây không phải veto xấu tuyệt đối.`;
    }
  }
  if(context.birthTimeMode==='UNKNOWN')out.birthTimeNote={text:'Không nhớ giờ sinh: chỉ các kết luận ổn định qua toàn bộ ứng viên giờ sinh được hiển thị; các phần còn lại phụ thuộc giờ sinh và không được bỏ phiếu đa số.',claim_ids:[]};
  return out;
}
export async function interpretMenhReading(prepared,{runner=runAI,budgetMs=READING_TIMEOUT_MS,signal,diagnostics=recordAiDiagnostic}={}){
  const context=buildMenhWriterContext(prepared.result,{birthTimeMode:prepared.input.birthTimeMode,stability:prepared.result.stability||null});
  const deadline=AbortSignal.timeout(budgetMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
  let revision,routeStartIndex=0;
  for(let attempt=0;attempt<2;attempt++){
    combined.throwIfAborted();
    const input=revision?{...context,revision}:context;
    const options=runner===runAI?{signal:combined,routeStartIndex}:{signal:combined};
    const result=await runner(menhWriterInstructions(),input,menhReadingSchema(context),options);
    combined.throwIfAborted();
    try{return attachAiRoute(validateMenhReading(result,context,{enforceLongForm:runner===runAI}),aiRouteOf(result));}
    catch(error){
      if(!(error instanceof MenhReadingValidationError))throw error;
      const used=aiRouteOf(result);
      if(runner===runAI)diagnostics?.({type:'validation_failure',flow:'menh',stage:'writer_validation',attempt:attempt+1,route:used?.id||'',model:used?.modelId||'',code:'MENH_READING_VALIDATION',fallbackAllowed:false,message:error.message});
      if(attempt===1)return attachAiRoute(validateMenhReading(fallback(context),context),used);
      if(runner===runAI&&Number.isInteger(used?.fallbackIndex))routeStartIndex=used.fallbackIndex;
      revision={attempt:1,issue:error.message,previousReading:result,instruction:'Sửa đúng lỗi contract KM-MENH. Chỉ dùng claims/evidence/boardFacts trong context; boardFacts chỉ làm sâu các claim đã có, không tạo claim mới. Không thêm rule, giờ sinh, xác suất, điểm số hoặc sự kiện tất định. Nếu globalStructure.active, phải nêu đúng Phục Ngâm/Phản Ngâm ở overview, thể hiện precedence/cap trước tín hiệu cục bộ và gắn GLOBAL_STRUCTURE vào các section bị ảnh hưởng. Nếu lỗi là bài quá ngắn, hãy viết lại đầy đủ theo COMPREHENSIVE_ONE_SHOT, phát triển cơ chế → biểu hiện có điều kiện, không lặp câu để lấy độ dài. Trả lại JSON đầy đủ theo schema.'};
    }
  }
}
