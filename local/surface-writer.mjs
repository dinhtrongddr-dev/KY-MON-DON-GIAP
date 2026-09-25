import {runAI,READING_TIMEOUT_MS,attachAiRoute,aiRouteOf} from './ai-client.mjs';
import {generateText} from './provider-client.mjs';
import {parseStructuredText} from './codex-client.mjs';
import {recordAiDiagnostic} from './ai-diagnostics.mjs';
import {surfacePayload} from '../dist/qimen/ai/narrativePrimitives.mjs';
import {SURFACE_WRITER_INSTRUCTIONS} from '../dist/qimen/ai/surfacePrompt.mjs';
import {surfaceSchema,validateSurfaceDraft,hydrateSurfaceReading,naturalSurfaceFallback,auditSurfaceStyle,FIDELITY_INSTRUCTIONS,fidelitySchema,validateFidelityReport,SurfaceValidationError} from '../dist/qimen/ai/surfaceReading.mjs';

export async function runSurfaceText(instructions,input,_schema,{signal,routeStartIndex=0}={}){
  const generated=await generateText(instructions,input,{signal,routeStartIndex});
  let draft;
  try{draft=parseStructuredText(generated.text);}
  catch{draft={sections:null};}
  return attachAiRoute(draft,aiRouteOf(generated));
}

// Writer uses the natural-text provider path. Planner/reviewer remain structured so
// exact JSON contracts stay on the provider path designed for structured output.
export async function writeSurface(contract,{runner=runSurfaceText,reviewer=runAI,validate,planning=null,signal,budgetMs=READING_TIMEOUT_MS,diagnostics=recordAiDiagnostic}={}){
  if(typeof reviewer!=='function')throw new Error('Semantic fidelity reviewer is required.');
  const deadline=AbortSignal.timeout(budgetMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
  const payload=surfacePayload(contract);
  let revision,routeStartIndex=0,lastRoute;
  for(let attempt=0;attempt<2;attempt++){
    combined.throwIfAborted();
    const options=runner===runSurfaceText?{signal:combined,routeStartIndex}:{signal:combined};
    const draft=await runner(SURFACE_WRITER_INSTRUCTIONS,revision?{...payload,revision}:payload,surfaceSchema(contract),options);
    combined.throwIfAborted();lastRoute=aiRouteOf(draft);
    try{
      validateSurfaceDraft(draft,contract);
      const reading=hydrateSurfaceReading(draft,contract,{planning});
      validate?.(reading);
      const report=await reviewer(FIDELITY_INSTRUCTIONS,{contract:payload,draft},fidelitySchema(),{signal:combined});
      combined.throwIfAborted();validateFidelityReport(report);
      const style=auditSurfaceStyle(draft);
      if(style.length&&runner===runSurfaceText)diagnostics?.({
        type:'quality_report',flow:contract.kind,stage:'surface_style',attempt:attempt+1,
        route:lastRoute?.id||'',model:lastRoute?.modelId||'',code:'SURFACE_STYLE',
        fallbackAllowed:false,message:style.map(x=>x.code).join(',')
      });
      return attachAiRoute(reading,lastRoute);
    }catch(error){
      if(!(error instanceof SurfaceValidationError)&&!['ReadingValidationError','MenhReadingValidationError'].includes(error.name))throw error;
      const violations=error.violations||[{code:'INTEGRITY',unitId:'',sentence:'',reason:error.message}];
      if(runner===runSurfaceText)diagnostics?.({type:'validation_failure',flow:contract.kind,stage:'surface_audit',attempt:attempt+1,route:lastRoute?.id||'',model:lastRoute?.modelId||'',code:'SURFACE_CONTRACT',fallbackAllowed:false,message:error.message});
      if(attempt===1){
        const fallback=naturalSurfaceFallback(contract,planning);validate?.(fallback);
        return attachAiRoute(fallback,lastRoute);
      }
      if(runner===runSurfaceText&&Number.isInteger(lastRoute?.fallbackIndex))routeStartIndex=lastRoute.fallbackIndex;
      revision={violations,previousReading:draft,
        instruction:'Sửa đúng section bị vi phạm chỉ bằng allowedMeaning đã cấp. Giữ phần đúng; không thêm dữ kiện hoặc metadata. Nếu chỉ sai độ chắc chắn, sửa tối thiểu trong câu gốc. Trả lại đầy đủ mảng sections với đúng id.'};
    }
  }
}
