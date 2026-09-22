import {ACTIVATION_GOALS,activationGoalForTopic,evaluateSpiritActivation,natalSpiritProfile,SPIRIT_ACTIVATION_VERSION} from './qimen/analysis/spiritActivation.mjs';

const STORAGE_KEY='qimen.spirit.activation.sessions.v1';
const MAX_SESSIONS=100;
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=String(text);return node;};
const safe=(value,max=1200)=>String(value??'').trim().slice(0,max);
const two=value=>String(value).padStart(2,'0');
const formatTimer=seconds=>`${two(Math.floor(seconds/60))}:${two(seconds%60)}`;

export function createActivationSessionStore({storage,now=()=>Date.now()}={}){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  const read=()=>{
    if(!storage)return [];
    try{const parsed=JSON.parse(storage.getItem(STORAGE_KEY)||'{}');return Array.isArray(parsed.sessions)?parsed.sessions.slice(-MAX_SESSIONS):[];}catch{return []}
  };
  const save=session=>{
    if(!storage)return false;
    const clean={
      id:safe(session.id||`activation-${now()}`,80),version:SPIRIT_ACTIVATION_VERSION,createdAt:Number(session.createdAt)||now(),
      chartType:session.chartType==='destiny'?'destiny':'hourly',goalCategory:safe(session.goalCategory,64),
      palace:Number(session.palace)||null,spirit:safe(session.spirit,48),door:safe(session.door,48),star:safe(session.star,48),stem:safe(session.stem,80),
      backDirection:safe(session.backDirection,32),facingDirection:safe(session.facingDirection,32),duration:Number(session.duration)||0,
      notes:{
        noticed:safe(session.notes?.noticed,1200),meaning:safe(session.notes?.meaning,1200),verification:safe(session.notes?.verification,1200)
      }
    };
    try{const sessions=[...read(),clean].slice(-MAX_SESSIONS);storage.setItem(STORAGE_KEY,JSON.stringify({version:1,sessions}));return true}catch{return false}
  };
  return {save,list:read};
}

function levelClass(level){return 'activation-level-'+({
  'Rất phù hợp':'great','Có thể sử dụng':'usable','Trung tính':'neutral','Không ưu tiên':'low','Không nên kích hoạt lúc này':'avoid'
}[level]||'neutral');}
function chips(items,max=5){
  const wrap=el('div','spirit-chips');
  for(const item of (items||[]).slice(0,max))wrap.append(el('span','spirit-chip',item));
  return wrap;
}
function directionDiagram(data){
  const box=el('div','spirit-direction-diagram');
  box.append(el('strong','','Đặt '+data.backDirection+' phía sau lưng'),el('span','spirit-arrow','↓'),el('span','spirit-person','[ SAU LƯNG ]  👤  [ MẶT NHÌN ]'),el('span','spirit-arrow','↓'),el('strong','','Mặt hướng '+data.faceDirection));
  return box;
}
function detailList(title,items,className=''){
  if(!items?.length)return null;
  const block=el('div','spirit-detail-block'+(className?' '+className:''));block.append(el('h4','',title));
  const list=el('ul');for(const item of items)list.append(el('li','',item));block.append(list);return block;
}
function practicePanel(data,{chartType='hourly',goalCategory='decision'}={}){
  const panel=el('section','spirit-practice-card');panel.dataset.state='ready';
  const head=el('div','spirit-practice-head'),title=el('div');
  title.append(el('p','eyebrow','Hướng dẫn thực hành'),el('h3','','Thực hành với '+data.spirit.name));
  const close=el('button','spirit-practice-close','×');close.type='button';close.setAttribute('aria-label','Đóng hướng dẫn thực hành');
  head.append(title,close);panel.append(head);
  const intro=el('p','spirit-practice-intro','Thực hành kết nối với biểu tượng/phẩm chất của Bát Thần trong hệ Kỳ Môn. Trải nghiệm khi tĩnh tâm mang tính cá nhân; hãy đối chiếu với thực tế trước quyết định quan trọng.');
  panel.append(intro,directionDiagram(data));

  const steps=el('div','spirit-practice-steps');
  const rows=[
    ['1 · Chọn mục tiêu','Giữ một việc duy nhất trong đầu; không đặt nhiều câu hỏi cùng lúc.'],
    ['2 · Đặt phương vị',data.instruction],
    ['3 · Ổn định','Ngồi thoải mái và thở chậm 6–9 nhịp. Không cần tụng chú hoặc cố tưởng tượng một thực thể xuất hiện.'],
    ['4 · Đặt ý niệm',data.practice?.intention||data.semantic?.activationTheme||'Quan sát điều quan trọng nhất của mục tiêu này.'],
    ['5 · Tĩnh tâm',`Quan sát trong khoảng ${data.practice?.durationMinutes||10} phút. Không ép phải có “tín hiệu”.`],
    ['6 · Đối chiếu','Sau phiên, ghi điều nhận thấy và một việc có thể kiểm chứng trong thực tế.']
  ];
  for(const [name,copy] of rows){const row=el('div','spirit-practice-step');row.append(el('strong','',name),el('p','',copy));steps.append(row);}
  panel.append(steps);

  const duration=Math.max(5,Math.min(15,Number(data.practice?.durationMinutes)||10)),timer=el('div','spirit-timer',formatTimer(duration*60));
  const actions=el('div','spirit-practice-actions'),start=el('button','button button-primary','Bắt đầu'),finish=el('button','button','Kết thúc');
  start.type=finish.type='button';finish.disabled=true;actions.append(start,finish);panel.append(timer,actions);

  const notes=el('div','spirit-practice-notes');
  const fields=[['noticed','Tôi nhận thấy gì?'],['meaning','Tôi nghĩ điều đó gợi ý gì?'],['verification','Điều gì có thể kiểm chứng trong thực tế?']];
  const areas={};
  for(const [id,label] of fields){const wrap=el('label','field spirit-note-field');wrap.append(el('span','',label));const area=el('textarea');area.rows=3;area.maxLength=1200;area.placeholder='Ghi ngắn gọn nếu bạn muốn lưu phiên này.';wrap.append(area);notes.append(wrap);areas[id]=area;}
  const save=el('button','button','Lưu phiên thực hành'),status=el('p','spirit-save-status','Chỉ lưu trên trình duyệt này; không lưu câu hỏi gốc.');
  save.type='button';notes.append(save,status);panel.append(notes);

  let remaining=duration*60,interval=null,startedAt=null;
  const stop=()=>{if(interval){clearInterval(interval);interval=null;}finish.disabled=true;start.disabled=false;panel.dataset.state='finished';};
  start.addEventListener('click',()=>{
    if(interval)return;startedAt=Date.now();remaining=duration*60;timer.textContent=formatTimer(remaining);start.disabled=true;finish.disabled=false;panel.dataset.state='running';
    interval=setInterval(()=>{remaining=Math.max(0,remaining-1);timer.textContent=formatTimer(remaining);if(!remaining)stop();},1000);
  });
  finish.addEventListener('click',stop);
  close.addEventListener('click',()=>{stop();panel.remove();});
  save.addEventListener('click',()=>{
    const elapsed=startedAt?Math.max(1,Math.round((Date.now()-startedAt)/1000)):0;
    const ok=createActivationSessionStore().save({
      chartType,goalCategory,palace:data.palace,spirit:data.spirit.name,door:data.door.name,star:data.star.name,stem:data.stem,
      backDirection:data.backDirection,facingDirection:data.faceDirection,duration:elapsed,
      notes:{noticed:areas.noticed.value,meaning:areas.meaning.value,verification:areas.verification.value}
    });
    status.textContent=ok?'Đã lưu phiên thực hành trên trình duyệt này.':'Trình duyệt không cho phép lưu phiên; ghi chú vẫn còn trên màn hình.';
  });
  return panel;
}
function openPractice(root,data,options){
  root.querySelector('.spirit-practice-card')?.remove();
  const panel=practicePanel(data,options);root.append(panel);panel.scrollIntoView?.({behavior:'smooth',block:'nearest'});
}
function researchDetails(data){
  const details=el('details','spirit-research-details'),summary=el('summary','','Xem cấu trúc đang xét');details.append(summary);
  const grid=el('div','spirit-structure-grid');
  const rows=[['Cung',data.palaceName+' · '+data.direction],['Thần',data.spirit.name],['Tinh',data.star.name],['Môn',data.door.name],['Thiên can',data.stem||'—']];
  for(const [label,value] of rows){const box=el('div');box.append(el('small','',label),el('strong','',value));grid.append(box);}
  details.append(grid);
  const reasons=detailList('Vì sao được xếp mức này',data.reasons);if(reasons)details.append(reasons);
  const warnings=detailList('Điều kiện cần lưu ý',data.warnings,'spirit-warning-block');if(warnings)details.append(warnings);
  return details;
}
function hourlyCard(root,data,recommended,goalId){
  const card=el('article','spirit-card'+(recommended?' is-recommended':'')+' '+levelClass(data.activationLevel));
  const head=el('div','spirit-card-head'),title=el('div');title.append(el('strong','spirit-name',data.spirit.name),el('span','',data.palaceName+' · '+data.direction));
  head.append(title);if(recommended)head.append(el('span','spirit-recommend-badge','Ưu tiên'));card.append(head);
  card.append(chips(data.semantic.keywords,4),el('p','spirit-modern-meaning',data.semantic.modernMeaning||data.semantic.coreMeaning));
  const level=el('p','spirit-activation-level');level.append(el('small','','Mức phù hợp lúc này'),el('strong','',data.activationLevel));card.append(level);
  const details=el('details','spirit-use-details'),summary=el('summary','','Xem cách sử dụng');details.append(summary);
  const best=detailList('Hiện tại phù hợp cho',data.semantic.bestFor);if(best)details.append(best);
  const sitting=el('div','spirit-sitting');sitting.append(el('h4','','Cách ngồi'),el('p','','Đặt '+data.backDirection+' phía sau lưng.'),el('p','','Mặt hướng '+data.faceDirection+'.'),directionDiagram(data));details.append(sitting,researchDetails(data));
  const practice=el('button','button spirit-practice-open','Thực hành ngay');practice.type='button';practice.addEventListener('click',()=>openPractice(root,data,{chartType:'hourly',goalCategory:goalId}));details.append(practice);card.append(details);
  return card;
}

export function renderHourlySpiritActivation(container,{board,analysis=null,goal=null}={}){
  if(!container||!board)return null;
  const previous=container.querySelector('select')?.value;
  const resolved=goal||previous||activationGoalForTopic(analysis?.topic||'general').id;
  const result=evaluateSpiritActivation(board,resolved,{analysis});
  container.replaceChildren();container.dataset.version=result.version;
  const head=el('div','spirit-panel-head'),title=el('div');title.append(el('p','eyebrow','Bát Thần & phương vị'),el('h2','','Phương vị hỗ trợ hiện tại'));
  head.append(title,el('span','semantic-version',result.version));container.append(head);
  container.append(el('p','spirit-panel-copy','Bát Thần chỉ là một lớp. Mức khuyến nghị dưới đây đã xét cùng Môn, Tinh, Can, lực cung và các trạng thái đang có.'));
  const controls=el('div','spirit-goal-controls'),label=el('label','field');label.append(el('span','','Tôi muốn làm gì?'));
  const select=el('select');for(const option of ACTIVATION_GOALS){const o=el('option','',option.label);o.value=option.id;if(option.id===result.goal.id)o.selected=true;select.append(o);}label.append(select);controls.append(label);container.append(controls);
  const recommendation=el('div','spirit-recommendation');
  if(result.recommended)recommendation.append(el('strong','','Gợi ý hiện tại: '+result.recommended.spirit.name+' · '+result.recommended.palaceName+' · '+result.recommended.direction),el('p','',`Đặt ${result.recommended.backDirection} sau lưng, mặt hướng ${result.recommended.faceDirection}. Mức: ${result.recommended.activationLevel}.`));
  else recommendation.append(el('strong','','Chưa có phương vị đủ mạnh để ưu tiên'),el('p','','Có thể dùng phần này như hướng quan sát; không cần cố kích hoạt một phương vị.'));
  container.append(recommendation);
  const grid=el('div','spirit-card-grid');for(const row of result.candidates)grid.append(hourlyCard(container,row,row.palace===result.recommendedPalace,result.goal.id));container.append(grid);
  if(result.warnings.length){const warn=detailList('Lưu ý chung',result.warnings,'spirit-warning-block');if(warn)container.append(warn);}
  const method=el('details','spirit-method-note'),methodSummary=el('summary','','Giới thiệu phương pháp');
  method.append(methodSummary,el('p','','Back-facing nghĩa là đặt phương vị của cung ở phía sau lưng; mặt nhìn về hướng đối diện. Không cần tạo cảm giác phải chính xác tuyệt đối từng độ.'),el('p','','Đây là phương pháp thực hành theo hệ biểu tượng và phương vị của Kỳ Môn Độn Giáp. Trải nghiệm khi tĩnh tâm mang tính cá nhân; nên đối chiếu với thông tin và thực tế trước quyết định quan trọng.'));
  container.append(method);
  select.addEventListener('change',()=>renderHourlySpiritActivation(container,{board,analysis,goal:select.value}));
  return result;
}

export function renderNatalSpiritActivation(container,{board,selfPalaceNumber,analysisLayers=null}={}){
  if(!container||!board||!selfPalaceNumber)return null;
  const data=natalSpiritProfile(board,selfPalaceNumber,{analysisLayers});container.replaceChildren();container.dataset.version=data.version;
  const head=el('div','spirit-panel-head'),title=el('div');title.append(el('p','eyebrow','Thần bản mệnh'),el('h2','','Thần bản mệnh của bạn'));head.append(title,el('span','semantic-version',data.version));container.append(head);
  container.append(el('p','spirit-panel-copy','Được lấy từ cung đại diện bản thân trong Mệnh bàn sinh. Đây không phải Bát Thần đang chạy của thời bàn hiện tại.'));
  const hero=el('article','spirit-natal-hero'),top=el('div','spirit-card-head'),name=el('div');name.append(el('strong','spirit-name',data.spirit.name),el('span','',data.palaceName+' · '+data.direction));top.append(name);hero.append(top);
  hero.append(chips(data.semantic.keywords,5),el('p','spirit-modern-meaning',data.semantic.modernMeaning||data.semantic.coreMeaning));
  const strengths=detailList('Thế mạnh',data.semantic.strengths);if(strengths)hero.append(strengths);
  const risks=detailList('Mặt cần thận trọng',data.semantic.risks,'spirit-warning-block');if(risks)hero.append(risks);
  const sitting=el('div','spirit-sitting');sitting.append(el('h4','','Hướng thực hành'),el('p','','Đặt '+data.backDirection+' phía sau lưng.'),el('p','','Mặt hướng '+data.faceDirection+'.'),el('p','',`Thời lượng gợi ý: ${data.practice.durationMinutes} phút.`),directionDiagram(data));hero.append(sitting,researchDetails({...data,reasons:[],activationLevel:'',warnings:data.warnings||[]}));
  const practice=el('button','button button-primary spirit-practice-open','Thực hành với Thần bản mệnh');practice.type='button';practice.addEventListener('click',()=>openPractice(container,data,{chartType:'destiny',goalCategory:'natal'}));hero.append(practice);container.append(hero);
  const compare=el('div','spirit-natal-vs-hourly');compare.append(el('strong','','Phân biệt nhanh'),el('p','','Thần bản mệnh: lấy từ Mệnh bàn sinh để hiểu phẩm chất và cách thực hành cá nhân.'),el('p','','Thần thời bàn: thay đổi theo thời điểm, dùng khi chọn phương vị hoặc cách hành động cho một việc cụ thể.'));
  container.append(compare);return data;
}
