import {MODES,MODE_LABELS} from './modes/shared.mjs';
import {classifyQuestion} from './ai/classifier.mjs';
import {buildQuestionContext} from './ai/questionContext.mjs';
import {sexagenaryName,pillarFromGanzhi} from './core/calendar.mjs';
export function initModeControls(doc=document) {
  const $=id=>doc.getElementById(id),mode=$('qimen-mode'),question=$('question');
  for(const id of MODES){const option=doc.createElement('option');option.value=id;option.textContent=MODE_LABELS[id];mode.append(option);}
  for(const id of ['customer','competitor','decisionMaker','subject']) {
    const select=$('actor-'+id);
    if(!select)continue;
    for(let i=0;i<60;i++){const p=pillarFromGanzhi(sexagenaryName(i)),option=doc.createElement('option');option.value=p.han;option.textContent=p.vi;select.append(option);}
  }
  const update=()=>{
    const q=buildQuestionContext(question.value,{mode:mode.value,topic:$('topic')?.value||'general'}),c=q.classification;
    $('mode-explanation').textContent=`${q.domainLabel} · ${MODE_LABELS[c.mode]} · ${c.reason}`+(c.ambiguous?' Ý định còn mơ hồ; hãy kiểm tra chế độ đã chọn hoặc chọn lại.':'');
    $('timing-options').hidden=c.mode!=='timing';$('action-options').hidden=!['timing','direction'].includes(c.mode);
    if($('direction-options'))$('direction-options').hidden=c.mode!=='direction';
  };
  $('topic')?.addEventListener('change',update);mode.addEventListener('change',update);question.addEventListener('input',update);
  $('add-candidate').addEventListener('click',()=>{
    const list=$('timing-candidates');if(list.children.length>=12)return;
    const row=doc.createElement('div');row.className='candidate-row';
    const label=doc.createElement('label');label.className='field';const title=doc.createElement('span');title.textContent='Thời điểm bổ sung';
    const input=doc.createElement('input');input.type='datetime-local';input.min='1900-01-01T00:00';input.max='2100-12-31T23:59';input.className='timing-candidate';label.append(title,input);
    const remove=doc.createElement('button');remove.type='button';remove.className='button button-quiet';remove.textContent='Bỏ';remove.addEventListener('click',()=>{row.remove();$('chart-form').dispatchEvent(new Event('change',{bubbles:true}));});
    row.append(label,remove);list.append(row);input.focus();
  });
  update();
  return ()=>{
    const actual=classifyQuestion(question.value,mode.value).mode;
    return {mode:mode.value,depth:'deep',actors:Object.fromEntries(['customer','competitor','decisionMaker'].map(k=>[k,$('actor-'+k).value]).filter(([,v])=>v)),
      subject:$('subject-label')?.value.trim()&&$('actor-subject')?.value?{label:$('subject-label').value.trim(),pillar:$('actor-subject').value}:null,
      direction:actual==='direction'?{origin:$('direction-origin')?.value||'',kind:$('direction-kind')?.value||''}:null,
      action:['timing','direction'].includes(actual)?$('qimen-action').value:'general',
      candidates:actual==='timing'?[...doc.querySelectorAll('.timing-candidate')].map(el=>el.value).filter(Boolean):[]};
  };
}
