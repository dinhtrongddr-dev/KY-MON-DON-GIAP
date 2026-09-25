import {buildQuestionNarrativeContract} from '../dist/qimen/ai/narrativeContract.mjs';
import {buildMenhNarrativeContract} from '../dist/qimen/menh/ai/narrative-contract.mjs';
import {fallbackDraft,hydrateSurfaceReading,surfaceParagraphs} from '../dist/qimen/ai/surfaceReading.mjs';
// Only tests inject this reviewer. Production always performs a separate call.
export const acceptFidelity=async()=>({violations:[]});
export const draftFor=payload=>{
  if(payload?.units?.[0]?.atoms)return fallbackDraft(payload);
  return {sections:(payload?.units||[]).map(u=>{
    const allowed=Array.isArray(u.allowedMeaning)?u.allowedMeaning:[];
    const required=allowed.filter(x=>x.required),chosen=required.length?required:allowed.slice(0,2);
    return {id:u.id,text:chosen.map(x=>String(x.meaning||'').trim()).filter(Boolean).join(' ')||u.label||u.id};
  })};
};
export const questionContract=p=>buildQuestionNarrativeContract(p.context);
export const menhContract=p=>buildMenhNarrativeContract(p.result,{birthTimeMode:p.input.birthTimeMode});
export const questionDraft=p=>draftFor(questionContract(p));
export const questionReading=p=>hydrateSurfaceReading(questionDraft(p),questionContract(p));
export const meaningOf=r=>surfaceParagraphs(r).map(p=>p.meaning).join('\n\n');
export const firstParagraph=r=>{
  if(Array.isArray(r?.sections)){
    const row=r.sections[0];
    return Object.defineProperties({},{
      meaning:{get:()=>row.text,set:value=>{row.text=value;},enumerable:true},
      text:{get:()=>row.text,set:value=>{row.text=value;},enumerable:true}
    });
  }
  return Object.values(r.sections)[0].paragraphs[0];
};
