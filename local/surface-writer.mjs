import {READING_TIMEOUT_MS,attachAiRoute,aiRouteOf,auxEffort} from './ai-client.mjs';
import {generateText,generateStructured} from './provider-client.mjs';
import {parseStructuredText} from './codex-client.mjs';
import {recordAiDiagnostic} from './ai-diagnostics.mjs';
import {surfacePayload} from '../dist/qimen/ai/narrativePrimitives.mjs';
import {SURFACE_WRITER_INSTRUCTIONS} from '../dist/qimen/ai/surfacePrompt.mjs';
import {surfaceSchema,validateSurfaceDraft,hydrateSurfaceReading,naturalSurfaceFallback,auditSurfaceStyle,auditVerdictSoftening,FIDELITY_INSTRUCTIONS,fidelitySchema,validateFidelityReport,SurfaceValidationError} from '../dist/qimen/ai/surfaceReading.mjs';

export async function runSurfaceText(instructions,input,_schema,{signal,effort}={}){
  const generated=await generateText(instructions,input,{signal,effort});
  let draft;
  try{draft=parseStructuredText(generated.text);}
  catch{draft={sections:null};}
  return attachAiRoute(draft,aiRouteOf(generated));
}

// TG-CB-7.0 (P4/P8): a failed check repairs only the flagged sections instead of
// rewriting the whole reading. Budget: 1 writer call + 1 fidelity review + at most
// QIMEN_MAX_REPAIRS (default 1) sentence-level repair calls at auxiliary effort.
export const REPAIR_INSTRUCTIONS='Bạn sửa tối thiểu một bài luận Kỳ Môn đã viết. Input có violations (mã lỗi, câu lỗi, lý do) và sections cần sửa. Chỉ sửa đúng các câu bị nêu, giữ nguyên mọi câu khác, giữ giọng văn, không thêm dữ kiện, người, ngày, tiền mới. Ngày cụ thể chỉ lấy từ allowedTimingWindows. Nếu kết luận là negative/conditional_negative thì nói thẳng không thành / bất lợi. Trả về JSON {"sections":[{"id","text"}]} chỉ gồm các section đã nhận.';
const maxRepairs=env=>{const n=Number(env?.QIMEN_MAX_REPAIRS??1);return Number.isInteger(n)&&n>=0&&n<=3?n:1;};
function locateViolations(violations,draft){
  const rows=Array.isArray(draft?.sections)?draft.sections:[];
  return violations.map(v=>{
    if(v.unitId&&rows.some(r=>r.id===v.unitId))return v;
    const hit=v.sentence&&rows.find(r=>String(r.text).includes(String(v.sentence).slice(0,80)));
    return hit?{...v,unitId:hit.id}:v;
  });
}
function dropSentences(draft,violations){
  const rows=draft.sections.map(r=>({...r}));let changed=false;
  for(const v of violations){
    if(!v.sentence)continue;
    const row=rows.find(r=>r.id===v.unitId)||rows.find(r=>r.text.includes(v.sentence));
    if(!row||!row.text.includes(v.sentence))continue;
    const next=row.text.replace(v.sentence,'').replace(/\s{2,}/g,' ').trim();
    if(next){row.text=next;changed=true;}
  }
  return changed?{sections:rows}:null;
}
export async function writeSurface(contract,{runner=runSurfaceText,reviewer=generateStructured,repairRunner,validate,planning=null,signal,budgetMs=READING_TIMEOUT_MS,diagnostics=recordAiDiagnostic,env=process.env}={}){
  if(typeof reviewer!=='function')throw new Error('Semantic fidelity reviewer is required.');
  const deadline=AbortSignal.timeout(budgetMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
  const payload=surfacePayload(contract),aux=auxEffort(env),repair=repairRunner||runner;
  const report=(type,stage,attempt,code,message)=>{if(runner===runSurfaceText)diagnostics?.({type,flow:contract.kind,stage,attempt,route:lastRoute?.id||'',model:lastRoute?.modelId||'',code,fallbackAllowed:false,message});};
  let lastRoute=null;
  const deterministic=draft=>{
    validateSurfaceDraft(draft,contract);
    const soft=auditVerdictSoftening(draft,contract);
    if(soft.length)throw new SurfaceValidationError(soft);
    const reading=hydrateSurfaceReading(draft,contract,{planning});
    validate?.(reading);
    return reading;
  };
  const violationsOf=error=>{
    if(!(error instanceof SurfaceValidationError)&&!['ReadingValidationError','MenhReadingValidationError'].includes(error?.name))throw error;
    return error.violations||[{code:'INTEGRITY',unitId:'',sentence:'',reason:error.message}];
  };
  combined.throwIfAborted();
  let draft=await runner(SURFACE_WRITER_INSTRUCTIONS,payload,surfaceSchema(contract),{signal:combined});
  combined.throwIfAborted();lastRoute=aiRouteOf(draft);
  let reviewed=false,repairs=0,flagged=[];
  // A sentence the reviewer flagged must not survive verbatim: the repaired draft is
  // not re-reviewed (saves a model turn), so this deterministic check closes the gap.
  const stillFlagged=d=>flagged.filter(v=>v.sentence&&(Array.isArray(d?.sections)?d.sections:[]).some(r=>String(r.text).includes(v.sentence)));
  for(;;){
    let violations=null,reading=null;
    try{
      reading=deterministic(draft);
      const left=stillFlagged(draft);
      if(left.length){violations=left;reading=null;}
    }
    catch(error){violations=violationsOf(error);report('validation_failure','surface_audit',repairs+1,'SURFACE_CONTRACT',violations.map(v=>v.code).join(','));}
    if(reading&&!reviewed){
      reviewed=true;
      // Fidelity review is a guard, not a second Writer. A malformed structured
      // response keeps the validated draft; transport/auth failures still propagate.
      try{
        const result=await reviewer(FIDELITY_INSTRUCTIONS,{contract:payload,draft},fidelitySchema(),{signal:combined,effort:aux});
        combined.throwIfAborted();validateFidelityReport(result);
      }catch(error){
        if(/AI trả kết quả chưa hợp lệ|JSON/i.test(String(error?.message||''))&&!(error instanceof SurfaceValidationError)){/* keep draft */}
        else {violations=violationsOf(error);reading=null;flagged=violations.filter(v=>typeof v.sentence==='string'&&v.sentence.trim().length>=8);report('validation_failure','fidelity_review',repairs+1,'FIDELITY',violations.map(v=>v.code).join(','));}
      }
    }
    if(reading){
      const style=auditSurfaceStyle(draft);
      if(style.length)report('quality_report','surface_style',repairs+1,'SURFACE_STYLE',style.map(x=>x.code).join(','));
      return attachAiRoute(reading,lastRoute);
    }
    violations=locateViolations(violations,draft);
    if(repairs<maxRepairs(env)){
      repairs+=1;
      const ids=new Set(violations.map(v=>v.unitId).filter(Boolean));
      const whole=!ids.size||violations.some(v=>['SCHEMA','MISSING_SECTION','UNKNOWN_SECTION','SECTION_SCHEMA'].includes(v.code));
      const sections=(Array.isArray(draft?.sections)?draft.sections:[]).filter(r=>whole||ids.has(r.id));
      try{
        const patch=whole
          ?await runner(SURFACE_WRITER_INSTRUCTIONS,{...payload,revision:{violations,previousReading:draft,instruction:'Sửa tối thiểu lỗi đã nêu; giữ phần đúng; trả đủ sections.'}},surfaceSchema(contract),{signal:combined})
          :await repair(REPAIR_INSTRUCTIONS,{question:payload.question,primaryConclusion:payload.primaryConclusion,allowedTimingWindows:payload.allowedTimingWindows,
              units:payload.units.filter(u=>ids.has(u.id)),violations,sections},surfaceSchema(contract),{signal:combined,effort:aux});
        combined.throwIfAborted();
        const patched=Array.isArray(patch?.sections)?patch.sections:[];
        draft=whole?patch:{sections:draft.sections.map(r=>{const p=patched.find(x=>x?.id===r.id&&typeof x.text==='string'&&x.text.trim());return p?{id:r.id,text:p.text}:r;})};
        lastRoute=aiRouteOf(patch)||lastRoute;
        continue;
      }catch(error){
        if(combined.aborted||!/AI trả kết quả chưa hợp lệ|JSON/i.test(String(error?.message||'')))throw error;
      }
    }
    // Last resort before the verified fallback: drop only the offending sentences.
    const trimmed=Array.isArray(draft?.sections)?dropSentences(draft,violations):null;
    if(trimmed){try{const reading=deterministic(trimmed);if(!stillFlagged(trimmed).length)return attachAiRoute(reading,lastRoute);}catch(error){violationsOf(error);}}
    const fallback=naturalSurfaceFallback(contract,planning);validate?.(fallback);
    return attachAiRoute(fallback,lastRoute);
  }
}
