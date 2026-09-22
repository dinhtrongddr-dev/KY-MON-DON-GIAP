import {ACTIVATION_GOALS,activationGoalForTopic,evaluateSpiritActivation,natalSpiritProfile,SPIRIT_ACTIVATION_VERSION} from './qimen/analysis/spiritActivation.mjs';

const STORAGE_KEY='qimen.spirit.activation.sessions.v1';
const MAX_SESSIONS=100;
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=String(text);return node;};
const safe=(value,max=1200)=>String(value??'').trim().slice(0,max);
const two=value=>String(value).padStart(2,'0');
const formatTimer=seconds=>`${two(Math.floor(seconds/60))}:${two(seconds%60)}`;
const displaySpiritName=name=>/^Thần\s+/i.test(String(name||''))?String(name):`Thần ${name}`;
const goalById=id=>ACTIVATION_GOALS.find(x=>x.id===id)||ACTIVATION_GOALS.find(x=>x.id==='decision');

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
      notes:{noticed:safe(session.notes?.noticed,1200),meaning:safe(session.notes?.meaning,1200),verification:safe(session.notes?.verification,1200)}
    };
    try{const sessions=[...read(),clean].slice(-MAX_SESSIONS);storage.setItem(STORAGE_KEY,JSON.stringify({version:1,sessions}));return true}catch{return false}
  };
  return {save,list:read};
}

function levelClass(level){return 'activation-level-'+({
  'Rất phù hợp':'great','Có thể sử dụng':'usable','Trung tính':'neutral','Không ưu tiên':'low','Không nên kích hoạt lúc này':'avoid'
}[level]||'neutral');}
function chips(items,max=5,className=''){
  const wrap=el('div','spirit-chips'+(className?' '+className:''));
  for(const item of (items||[]).slice(0,max))wrap.append(el('span','spirit-chip',item));
  return wrap;
}
function meditatingFigure(data){
  const img=el('img','meditation-figure-pro');
  img.src='./assets/meditating-side.png';
  img.alt='Người ngồi thiền nhìn nghiêng theo trục '+data.backDirection+' – '+data.faceDirection;
  img.loading='lazy';img.decoding='async';img.width=512;img.height=360;
  return img;
}
function directionSide(kind,label,direction,spiritName){
  const side=el('div','spirit-orientation-side spirit-orientation-side-'+kind);
  side.append(el('span','spirit-orientation-axis',label),el('strong','spirit-orientation-direction',direction));
  if(kind==='back')side.append(el('span','spirit-orientation-spirit',displaySpiritName(spiritName)));
  return side;
}
function directionDiagram(data){
  const box=el('div','spirit-orientation'),visual=el('div','spirit-orientation-visual');
  const figure=el('div','spirit-orientation-figure');
  figure.append(el('span','spirit-orientation-arrow spirit-orientation-arrow-back','←'),meditatingFigure(data),el('span','spirit-orientation-arrow spirit-orientation-arrow-face','→'));
  visual.append(
    directionSide('back','LƯNG',data.backDirection,data.spirit.name),
    figure,
    directionSide('face','MẶT',data.faceDirection,data.spirit.name)
  );
  box.append(visual);return box;
}
function detailList(title,items,className=''){
  if(!items?.length)return null;
  const block=el('div','spirit-detail-block'+(className?' '+className:''));block.append(el('h4','',title));
  const list=el('ul');for(const item of items)list.append(el('li','',item));block.append(list);return block;
}
function goalIntention(goalId,spiritName){
  const map={
    work:'Tôi muốn nhìn rõ việc cần ưu tiên, người hoặc cửa cần kết nối, và một bước có thể làm ngay.',
    money:'Tôi muốn nhìn rõ chỗ tiền đang vào hoặc ra, điều kiện cần giữ, và một việc cần kiểm chứng trước khi hành động.',
    investment:'Tôi muốn nhìn rõ điều kiện tạo lợi thế, rủi ro chưa kiểm chứng, và giới hạn tôi không nên vượt.',
    business:'Tôi muốn nhìn rõ điểm tạo giá trị, nút thắt của giao dịch, và bước tiếp theo có thể đo bằng phản hồi thật.',
    love:'Tôi muốn nhìn rõ nhu cầu thật của mình, điều cần nói thẳng, và ranh giới cần giữ trong mối quan hệ.',
    family:'Tôi muốn nhìn rõ điều gia đình thực sự cần, phần mình có thể chủ động, và một việc nên làm sau phiên này.',
    negotiation:'Tôi muốn nhìn rõ điểm hai bên có thể cùng chấp nhận, điều tôi không nên nhượng, và nội dung cần nói rõ ở bước tiếp theo.',
    study:'Tôi muốn nhìn rõ phần cần học trước, chỗ đang vướng, và bài tập cụ thể cần làm sau phiên này.',
    creativity:'Tôi muốn mở ra vài hướng ý tưởng, nhưng chỉ giữ lại hướng có thể biến thành một thử nghiệm hoặc sản phẩm cụ thể.',
    meditation:'Tôi chỉ quan sát hơi thở và trạng thái hiện tại; tôi không tìm “dấu hiệu”, chỉ nhận ra điều mình đang né hoặc trộn lẫn.',
    decision:'Tôi muốn nhìn rõ tiêu chí quan trọng nhất, điểm chưa biết, và việc cần kiểm chứng trước khi quyết định.',
    support:'Tôi muốn nhìn rõ mình cần loại hỗ trợ nào, ai có đúng vai trò, và cách đề nghị cụ thể nhất.',
    travel:'Tôi muốn nhìn rõ mục đích chuyến đi, điều kiện cần chuẩn bị, và rủi ro thực tế cần kiểm tra trước khi đi.',
    property:'Tôi muốn nhìn rõ tiêu chí nền tảng, điều kiện tài chính, và điểm pháp lý hoặc thực tế cần kiểm chứng.',
    dispute:'Tôi muốn nhìn rõ ranh giới cần bảo vệ, điểm có thể hạ nhiệt, và bước xử lý không làm xung đột tăng thêm.',
    other:'Tôi muốn nhìn rõ điều quan trọng nhất của việc này, điểm chưa rõ, và một bước thực tế cần làm tiếp.'
  };
  return `Trong phiên này, tôi dùng phẩm chất của ${spiritName} để giữ đúng trạng thái. ${map[goalId]||map.decision}`;
}
function observationPrompts(goalId){
  const base={
    negotiation:['Điểm hai bên có thể cùng chấp nhận','Điều không nên nhượng','Câu hoặc bước cần nói rõ tiếp theo'],
    investment:['Rủi ro chưa kiểm chứng','Điều kiện phải đúng thì mới làm','Giới hạn dừng hoặc giảm quy mô'],
    love:['Nhu cầu thật của mình','Điều cần nói rõ','Ranh giới cần giữ'],
    family:['Điều gia đình đang cần','Phần mình chủ động được','Việc nhỏ có thể làm ngay'],
    work:['Việc quan trọng nhất','Người/cửa cần kết nối','Bước có thể làm ngay'],
    study:['Phần đang yếu','Kiến thức cần học trước','Bài tập cần làm sau phiên'],
    meditation:['Cảm giác nổi bật','Ý nghĩ lặp lại','Điều có thể kiểm chứng sau khi bình tâm']
  };
  return base[goalId]||['Điểm vướng nổi bật','Điều cần làm rõ','Một bước có thể kiểm chứng trong thực tế'];
}
function practicePanel(data,{chartType='hourly',goalCategory='decision'}={}){
  const goal=goalById(goalCategory),panel=el('section','spirit-practice-card');panel.dataset.state='ready';
  const head=el('div','spirit-practice-head'),title=el('div');
  title.append(el('p','eyebrow','THỰC HÀNH'),el('h3','','Thực hành với '+displaySpiritName(data.spirit.name)));
  const close=el('button','spirit-practice-close','×');close.type='button';close.setAttribute('aria-label','Đóng hướng dẫn thực hành');
  head.append(title,close);panel.append(head);

  const summary=el('div','spirit-practice-summary');
  summary.append(el('span','spirit-practice-goal',goalCategory==='natal'?'Hiểu phẩm chất bản mệnh':goal.label),el('strong','',data.palaceName+' · '+data.direction),el('span','',`${data.practice?.durationMinutes||10} phút`));
  panel.append(summary);

  const orientation=el('section','spirit-practice-block spirit-practice-orientation');
  orientation.append(el('span','spirit-step-number','1'),el('div','spirit-practice-block-body'));
  const orientationBody=orientation.lastChild;
  orientationBody.append(
    el('h4','','Đặt đúng phương vị'),
    el('p','spirit-orientation-note','Ngồi thoải mái, xoay người đúng trục hướng. Không cần căn chính xác từng độ.'),
    directionDiagram(data)
  );
  panel.append(orientation);

  const settle=el('section','spirit-practice-block');
  settle.append(el('span','spirit-step-number','2'),el('div','spirit-practice-block-body'));
  settle.lastChild.append(el('h4','','Ổn định 30–60 giây'),el('p','','Thả lỏng vai, thở chậm 6–9 nhịp. Không tụng chú, không cố tưởng tượng Bát Thần xuất hiện, không cố tạo cảm giác đặc biệt.'));
  panel.append(settle);

  const intention=el('section','spirit-practice-block spirit-intention-block');
  intention.append(el('span','spirit-step-number','3'),el('div','spirit-practice-block-body'));
  const body=intention.lastChild;body.append(el('h4','','Đặt ý niệm — làm đúng như sau'),el('p','spirit-intention-instruction','Đọc thầm câu dưới đây đúng 1 lần, sau đó thôi nhắc lại:'));
  const script=el('blockquote','spirit-intention-script','“'+(goalCategory==='natal'
    ?`Trong phiên này, tôi quan sát phẩm chất của ${displaySpiritName(data.spirit.name)} trong cách mình suy nghĩ và hành động. Tôi muốn nhận ra một thế mạnh đang dùng tốt, một điểm cần tiết chế, và một việc thực tế có thể điều chỉnh.`
    :goalIntention(goalCategory,displaySpiritName(data.spirit.name)))+'”');
  body.append(script,el('p','spirit-intention-instruction','Trong lúc tĩnh, nếu có ý nghĩ xuất hiện thì chỉ ghi nhận 3 nhóm sau:'));
  body.append(chips(observationPrompts(goalCategory),3,'spirit-observation-chips'));panel.append(intention);

  const observe=el('section','spirit-practice-block');
  observe.append(el('span','spirit-step-number','4'),el('div','spirit-practice-block-body'));
  observe.lastChild.append(el('h4','','Tĩnh và đối chiếu'),el('p','',`Quan sát trong khoảng ${data.practice?.durationMinutes||10} phút. Không cố tìm “tín hiệu”. Kết thúc phiên, chọn đúng 1 điều có thể kiểm chứng hoặc hành động trong thực tế.`));
  panel.append(observe);

  const duration=Math.max(5,Math.min(15,Number(data.practice?.durationMinutes)||10)),timerWrap=el('div','spirit-timer-wrap'),timer=el('div','spirit-timer',formatTimer(duration*60));
  timerWrap.append(el('small','','THỜI GIAN'),timer);
  const actions=el('div','spirit-practice-actions'),start=el('button','button button-primary','Bắt đầu phiên'),finish=el('button','button','Kết thúc');
  start.type=finish.type='button';finish.disabled=true;actions.append(start,finish);panel.append(timerWrap,actions);

  const notesTitle=el('div','spirit-notes-head');notesTitle.append(el('strong','','Ghi nhận sau phiên'),el('span','','Tách cảm nhận khỏi điều có thể kiểm chứng.'));
  const notes=el('div','spirit-practice-notes');panel.append(notesTitle,notes);
  const fields=[
    ['noticed','1. Tôi nhận thấy gì?','Chỉ ghi điều bạn thực sự nhận thấy: ý nghĩ, cảm xúc, điểm vướng, ý tưởng.'],
    ['meaning','2. Tôi nghĩ điều đó gợi ý gì?','Viết cách bạn đang hiểu nó, nhưng chưa coi đây là sự thật.'],
    ['verification','3. Tôi sẽ kiểm chứng gì?','Ghi một hành động hoặc dữ kiện thực tế có thể kiểm tra sau phiên.']
  ];
  const areas={};
  for(const [id,label,placeholder] of fields){const wrap=el('label','field spirit-note-field');wrap.append(el('span','',label));const area=el('textarea');area.rows=3;area.maxLength=1200;area.placeholder=placeholder;wrap.append(area);notes.append(wrap);areas[id]=area;}
  const save=el('button','button','Lưu phiên thực hành'),status=el('p','spirit-save-status','Chỉ lưu trên trình duyệt này; không lưu câu hỏi gốc.');
  save.type='button';notes.append(save,status);

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
  const rows=[['Cung',data.palaceName+' · '+data.direction],['Bát Thần',displaySpiritName(data.spirit.name)],['Tinh',data.star.name],['Môn',data.door.name],['Thiên can',data.stem||'—']];
  for(const [label,value] of rows){const box=el('div');box.append(el('small','',label),el('strong','',value));grid.append(box);}
  details.append(grid);
  const reasons=detailList('Vì sao được xếp mức này',data.reasons);if(reasons)details.append(reasons);
  const warnings=detailList('Điều kiện cần lưu ý',data.warnings,'spirit-warning-block');if(warnings)details.append(warnings);
  return details;
}
function hourlyCard(root,data,recommended,goalId){
  const card=el('details','spirit-card'+(recommended?' is-recommended':'')+' '+levelClass(data.activationLevel));
  const summary=el('summary','spirit-card-summary');
  const top=el('div','spirit-card-top');
  const identity=el('div','spirit-card-identity');
  identity.append(el('strong','spirit-name',displaySpiritName(data.spirit.name)),el('span','spirit-location',data.palaceName+' · '+data.direction));
  const badges=el('div','spirit-card-badges');
  if(recommended)badges.append(el('span','spirit-priority-badge','Ưu tiên'));
  badges.append(el('span','spirit-level-badge',data.activationLevel));
  top.append(identity,badges);

  const meaning=el('p','spirit-modern-meaning',data.semantic.modernMeaning||data.semantic.coreMeaning);
  const footer=el('div','spirit-card-footer');
  const meta=el('div','spirit-card-meta');
  meta.append(el('span','spirit-meta-pill','Môn · '+data.door.name),el('span','spirit-meta-pill','Tinh · '+data.star.name));
  footer.append(meta,el('span','spirit-card-toggle',''));
  summary.append(top,meaning,footer);card.append(summary);

  const body=el('div','spirit-card-details');
  if(data.semantic.keywords?.length){body.append(el('h4','','Từ khóa'),chips(data.semantic.keywords,4,'spirit-keyword-row'));}
  if(data.semantic.bestFor?.length){body.append(el('h4','','Phù hợp cho'),chips(data.semantic.bestFor,4,'spirit-bestfor-chips'));}
  const risks=detailList('Mặt cần thận trọng',data.semantic.risks?.slice(0,3),'spirit-warning-block');if(risks)body.append(risks);
  body.append(researchDetails(data));
  const practice=el('button',recommended?'button button-primary spirit-practice-open':'button spirit-practice-open','Thực hành với '+displaySpiritName(data.spirit.name));
  practice.type='button';practice.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openPractice(root,data,{chartType:'hourly',goalCategory:goalId});});body.append(practice);
  card.append(body);return card;
}
function introCallout(){
  const intro=el('div','spirit-intro-callout'),copy=el('div');
  copy.append(el('strong','','Dùng phần này khi nào?'),el('p','','Khi bạn đã có một việc cụ thể và muốn chọn phương vị + trạng thái phù hợp để chuẩn bị trước khi hành động — như đàm phán, làm việc, đầu tư, học tập, quan hệ hoặc tĩnh tâm.'));
  intro.append(copy,chips(['Chọn trạng thái','Chọn phương vị','Chuẩn bị trước hành động'],3,'spirit-purpose-chips'));
  const note=el('p','spirit-intro-note','Không dùng để thay thế quyết định thực tế: hệ thống chỉ gợi ý cách “đặt mình” trước khi làm việc, còn kết quả vẫn cần kiểm chứng bằng phản hồi và dữ kiện.');
  intro.append(note);return intro;
}

export function renderHourlySpiritActivation(container,{board,analysis=null,goal=null}={}){
  if(!container||!board)return null;
  const previous=container.querySelector('select')?.value;
  const resolved=goal||previous||activationGoalForTopic(analysis?.topic||'general').id;
  const result=evaluateSpiritActivation(board,resolved,{analysis});
  container.replaceChildren();container.dataset.version=result.version;

  const head=el('div','spirit-panel-head'),title=el('div');
  title.append(el('p','eyebrow','BÁT THẦN & PHƯƠNG VỊ'),el('h2','','Chọn trạng thái và phương vị hỗ trợ trước khi hành động'));
  head.append(title);container.append(head,introCallout());

  const toolbar=el('div','spirit-toolbar'),label=el('label','field spirit-goal-field');
  label.append(el('span','','Mục tiêu hiện tại'));
  const select=el('select');for(const option of ACTIVATION_GOALS){const o=el('option','',option.label);o.value=option.id;if(option.id===result.goal.id)o.selected=true;select.append(o);}label.append(select);toolbar.append(label);container.append(toolbar);

  if(result.recommended)container.append(hourlyCard(container,result.recommended,true,result.goal.id));
  else{
    const none=el('div','spirit-no-recommendation');
    none.append(el('strong','','Chưa có phương vị đủ mạnh để ưu tiên'),el('p','','Hãy xem phần này như một lớp quan sát; không cần cố chọn một phương vị để thực hành.'));
    container.append(none);
  }
  const alternatives=result.candidates.filter(row=>row.palace!==result.recommendedPalace);
  if(alternatives.length){
    const alt=el('details','spirit-alternatives'),sum=el('summary','','Xem '+alternatives.length+' lựa chọn còn lại');
    alt.append(sum);const grid=el('div','spirit-card-grid spirit-alternative-grid');for(const row of alternatives)grid.append(hourlyCard(container,row,false,result.goal.id));alt.append(grid);container.append(alt);
  }
  if(result.warnings.length){const warn=detailList('Lưu ý chung',result.warnings,'spirit-warning-block');if(warn)container.append(warn);}
  const method=el('details','spirit-method-note'),methodSummary=el('summary','','Hiểu nhanh cách hệ thống chọn phương vị');
  method.append(methodSummary,el('p','','Bát Thần không được xét riêng. Hệ thống ghép Thần với Môn, Tinh, Can, lực cung và các trạng thái đang có rồi mới xếp mức phù hợp. Vì vậy một Thần “hợp mục tiêu” vẫn có thể bị hạ mức nếu cung đang có cấu trúc bất lợi.'),el('p','','Cách đặt hướng sau lưng và mặt nhìn chỉ xuất hiện khi bạn bấm “Thực hành”, để màn hình chính gọn và tránh nhầm phần giải thích với thao tác.'));
  container.append(method);
  select.addEventListener('change',()=>renderHourlySpiritActivation(container,{board,analysis,goal:select.value}));
  return result;
}

export function renderNatalSpiritActivation(container,{board,selfPalaceNumber,analysisLayers=null}={}){
  if(!container||!board||!selfPalaceNumber)return null;
  const data=natalSpiritProfile(board,selfPalaceNumber,{analysisLayers});container.replaceChildren();container.dataset.version=data.version;
  const head=el('div','spirit-panel-head'),title=el('div');title.append(el('p','eyebrow','THẦN BẢN MỆNH'),el('h2','','Phẩm chất Bát Thần nổi bật trong Mệnh bàn của bạn'));head.append(title);container.append(head);
  const intro=el('div','spirit-intro-callout spirit-natal-intro');
  intro.append(el('strong','','Dùng phần này để làm gì?'),el('p','','Để hiểu kiểu trạng thái bạn dễ phát huy tự nhiên, điểm mạnh nên tận dụng và mặt cần tiết chế khi tự quan sát hoặc chuẩn bị cho một việc quan trọng.'));
  container.append(intro);

  const hero=el('article','spirit-natal-hero'),top=el('div','spirit-card-head'),name=el('div');name.append(el('strong','spirit-name',displaySpiritName(data.spirit.name)),el('span','spirit-location',data.palaceName+' · '+data.direction));top.append(name);hero.append(top);
  hero.append(el('p','spirit-modern-meaning',data.semantic.modernMeaning||data.semantic.coreMeaning),chips(data.semantic.keywords,4,'spirit-keyword-row'));
  const twoCol=el('div','spirit-natal-traits');
  const strengths=detailList('Thế mạnh',data.semantic.strengths?.slice(0,4));if(strengths)twoCol.append(strengths);
  const risks=detailList('Cần tiết chế',data.semantic.risks?.slice(0,4),'spirit-warning-block');if(risks)twoCol.append(risks);
  hero.append(twoCol,researchDetails({...data,reasons:[],activationLevel:'',warnings:data.warnings||[]}));
  const practice=el('button','button button-primary spirit-practice-open','Thực hành với '+displaySpiritName(data.spirit.name));practice.type='button';practice.addEventListener('click',()=>openPractice(container,data,{chartType:'destiny',goalCategory:'natal'}));hero.append(practice);container.append(hero);
  const compare=el('div','spirit-natal-vs-hourly');compare.append(el('strong','','Phân biệt nhanh'),el('span','','Bản mệnh = phẩm chất cá nhân tương đối ổn định · Thời bàn = phương vị/trạng thái thay đổi theo từng thời điểm.'));
  container.append(compare);return data;
}
