import {MODES,MODE_LABELS} from './modes/shared.mjs';
import {classifyQuestion} from './ai/classifier.mjs';
import {buildQuestionContext} from './ai/questionContext.mjs';
import {sexagenaryName,pillarFromGanzhi} from './core/calendar.mjs';

const NIANMING_INPUT_IDS=['self','subject','customer','competitor','decisionMaker'];
export function maskNianmingDate(value,{deleting=false,mode='date'}={}){
  const limit=mode==='year'?4:8,digits=String(value??'').replace(/\D/g,'').slice(0,limit);
  if(!digits)return '';
  if(mode==='year')return digits;
  if(digits.length===1)return digits;
  if(digits.length===2)return deleting?digits:digits+'/';
  if(digits.length===3)return digits.slice(0,2)+'/'+digits.slice(2);
  if(digits.length===4)return deleting?digits.slice(0,2)+'/'+digits.slice(2):digits.slice(0,2)+'/'+digits.slice(2)+'/';
  return digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
}
const caretEnd=input=>{try{const p=input.value.length;input.setSelectionRange?.(p,p);}catch{}};
export function initNianmingInputMasks(doc=document){
  for(const id of NIANMING_INPUT_IDS){
    const input=doc.getElementById('nianming-'+id),dateButton=doc.getElementById('nianming-mode-'+id+'-date'),yearButton=doc.getElementById('nianming-mode-'+id+'-year');
    if(!input)continue;
    let mode=input.dataset?.nianmingMode==='year'?'year':'date',saved={date:mode==='date'?input.value:'',year:mode==='year'?input.value:''};
    const syncModeUi=()=>{
      if(input.dataset)input.dataset.nianmingMode=mode;input.maxLength=mode==='year'?4:10;input.placeholder=mode==='year'?'YYYY':'DD/MM/YYYY';
      for(const [button,value] of [[dateButton,'date'],[yearButton,'year']])if(button){const active=mode===value;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));}
    };
    const setMode=next=>{
      if(next===mode)return;saved[mode]=input.value;mode=next;input.value=saved[mode]||'';syncModeUi();caretEnd(input);
      try{input.dispatchEvent(new Event('change',{bubbles:true}));}catch{}
      input.focus?.();
    };
    dateButton?.addEventListener('click',event=>{event.preventDefault();setMode('date');});
    yearButton?.addEventListener('click',event=>{event.preventDefault();setMode('year');});
    syncModeUi();
    input.addEventListener('input',event=>{input.value=maskNianmingDate(input.value,{mode,deleting:String(event?.inputType||'').startsWith('delete')});caretEnd(input);});
    const finalize=()=>{input.value=maskNianmingDate(input.value,{mode});saved[mode]=input.value;caretEnd(input);};
    input.addEventListener('change',finalize);input.addEventListener('blur',finalize);
    input.addEventListener('keydown',event=>{
      if(mode!=='date'||event?.key!=='Backspace'||input.selectionStart!==input.selectionEnd||!input.selectionStart)return;
      const pos=input.selectionStart;if(input.value[pos-1]!=='/')return;event.preventDefault();input.value=input.value.slice(0,pos-1)+input.value.slice(pos);
      try{input.setSelectionRange(pos-1,pos-1);}catch{}
    });
    input.addEventListener('paste',event=>{
      const pasted=String(event?.clipboardData?.getData?.('text')||'').trim(),digits=pasted.replace(/\D/g,'');
      if((mode==='year'&&digits.length!==4)||(mode==='date'&&digits.length!==8))return;
      event.preventDefault();input.value=maskNianmingDate(digits,{mode});saved[mode]=input.value;caretEnd(input);
    });
  }
}

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
    const nianming=Object.fromEntries(['self','subject','customer','competitor','decisionMaker']
      .map(k=>[k,$('nianming-'+k)?.value.trim()||'']).filter(([,v])=>v));
    return {mode:mode.value,depth:'deep',actors:Object.fromEntries(['customer','competitor','decisionMaker'].map(k=>[k,$('actor-'+k)?.value||'']).filter(([,v])=>v)),nianming,
      subject:$('subject-label')?.value.trim()&&$('actor-subject')?.value?{label:$('subject-label').value.trim(),pillar:$('actor-subject').value}:null,
      direction:actual==='direction'?{origin:$('direction-origin')?.value||'',kind:$('direction-kind')?.value||''}:null,
      action:['timing','direction'].includes(actual)?$('qimen-action').value:'general',
      candidates:actual==='timing'?[...doc.querySelectorAll('.timing-candidate')].map(el=>el.value).filter(Boolean):[]};
  };
}
