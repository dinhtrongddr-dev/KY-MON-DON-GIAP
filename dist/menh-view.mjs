import {STAR_QIN,elementSlug} from './qimen/core/palace.mjs';
import {formatInstantAtOffset,formatOffset} from './qimen/core/calendar.mjs';
import {CONTROLS,GENERATES,palaceConditions} from './guide.mjs';
import {semanticBundle} from './qimen/semantic/matrix.mjs';
import {formatParts} from './reading-format.mjs';

const DOMAIN_LABEL=Object.freeze({
  GLOBAL:'Cấu trúc toàn cục',SELF:'Bản thân & tổng thể',FAMILY:'Gia đình & cha mẹ',CHILDREN:'Con cái',
  MARRIAGE:'Hôn nhân',CAREER:'Sự nghiệp',WEALTH:'Tài vận',
});
const SECTION_LABEL=Object.freeze({
  overview:'Tổng thể',self:'Bản thân',family:'Gia đình',marriage:'Hôn nhân',
  career:'Sự nghiệp',wealth:'Tài vận',luck:'Đại vận',annual:'Lưu niên',birthTimeNote:'Giờ sinh',
});
const el=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!=null)node.textContent=String(text);
  return node;
};
const PALACE_VI=Object.freeze({KAN_1:'Khảm 1',KUN_2:'Khôn 2',ZHEN_3:'Chấn 3',XUN_4:'Tốn 4',CENTER_5:'Trung 5',QIAN_6:'Càn 6',DUI_7:'Đoài 7',GEN_8:'Cấn 8',LI_9:'Ly 9'});
const UI_TERM=Object.freeze({
  FATHER:'cha',MOTHER:'mẹ',YANG:'dương',YIN:'âm',PRESSURE:'chịu áp lực/kiểm soát',
  NINE_STAR:'Cửu tinh',EIGHT_DOOR:'Bát môn',TEN_STEM_KE_YING_AND_PALACE_STATE:'thiên can và trạng thái cung',
  LOCAL_OR_ANCESTRAL_BASE_MORE_SUPPORTIVE:'nguồn lực tại chỗ hoặc nền tảng gia đình có xu hướng hỗ trợ hơn',
  CONTEXT_REQUIRED:'cần xem trong bối cảnh tổng thể',
  ANCESTRAL_LOCAL_ASSETS_HARDER_TO_RETAIN:'nguồn lực hoặc tài sản sẵn có từ gia đình, quê nhà thường cần quản lý chặt hơn để giữ bền',
  DEVELOPMENT_AWAY_FROM_ORIGIN:'dễ phát triển khi mở rộng ra ngoài môi trường quen thuộc',
  DEVELOPMENT_OR_ENTERPRISE_AWAY_FROM_ORIGIN:'có xu hướng phát triển tốt hơn khi mở rộng hoạt động ra bên ngoài',
  SUPPORT:'được hỗ trợ',ALIGNMENT:'khá đồng thuận',INPUT_COST:'cần đầu tư công sức hoặc nguồn lực',
  INNER:'phạm vi gần / bên trong',OUTER:'phạm vi mở rộng / bên ngoài',
  SELF_GENERATES_CAREER:'bản thân phải chủ động tạo và nuôi cơ hội nghề nghiệp',
  CAREER_GENERATES_SELF:'môi trường nghề nghiệp có xu hướng hỗ trợ bản thân',
  CAREER_CONTROLS_SELF:'công việc tạo áp lực lên bản thân',SELF_CONTROLS_CAREER:'bản thân có xu hướng chủ động kiểm soát công việc',
});
function friendlyText(value){
  let s=String(value??'');
  for(const [code,label] of Object.entries(PALACE_VI))s=s.replaceAll(code,label);
  for(const [code,label] of Object.entries(UI_TERM))s=s.replaceAll(code,label);
  s=s.replace(/\bnatal\b/gi,'Mệnh bàn').replace(/\bcorroborator\b/gi,'lớp đối chiếu bổ sung').replace(/\bbundle\b/gi,'nhóm dấu hiệu').replace(/\bdeterministic\b/gi,'đã tính từ bàn').replace(/\bcontext\s+required\b/gi,'cần xem trong bối cảnh tổng thể').replace(/\bPRIMARY\b/g,'chính').replace(/\bSECONDARY\b/g,'phụ');
  s=s.replace(/\b([A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+)\b/g,(_,code)=>code.toLowerCase().replaceAll('_',' '));
  return s;
}
function evidenceDetails(claim,result){
  const ids=new Set(claim.evidenceIds),items=(result.evidence||[]).filter(e=>ids.has(e.evidenceId));
  if(!items.length)return null;
  const details=el('details','menh-evidence');
  details.append(el('summary','','Xem căn cứ · '+items.length));
  const list=el('ul','menh-evidence-list');
  for(const item of items){
    const li=el('li');
    li.append(el('span','',friendlyText(item.metadata?.summary||item.effectTag)));
    list.append(li);
  }
  details.append(list);return details;
}
function claimCard(claim,result){
  const card=el('article','menh-claim');
  card.append(el('p','eyebrow',DOMAIN_LABEL[claim.domain]||friendlyText(claim.domain)));
  card.append(el('p','menh-claim-text',friendlyText(claim.text)));
  const details=evidenceDetails(claim,result);if(details)card.append(details);
  return card;
}
function stemToken(stem){
  const token=el('span','stem-token');
  token.dataset.element=elementSlug(stem.element);
  token.title=stem.vi+' · '+stem.element;
  token.append(el('span','han',stem.han),el('span','vi',stem.vi));
  return token;
}
function marker(text,className,title){
  const node=el('span','marker '+className,text);node.title=title;return node;
}
function dutyBadge(text){
  return el('span','duty-badge',text);
}
function makeEntity(className,label,item){
  const node=el('span','entity '+className);
  if(item?.element)node.dataset.element=elementSlug(item.element);
  node.append(el('span','entity-label',label),el('span','han',item?.han||'—'),el('span','vi',item?.vi||'—'));
  return node;
}
function natalPalaceNode(palace,board,selfPalaceNumber,{interactive=false}={}){
  const isSelf=palace.number===selfPalaceNumber;
  const node=el(interactive?'button':'div',(palace.number===5?'palace palace-center':'palace')+(isSelf?' menh-self-palace':''));
  if(interactive){node.type='button';node.setAttribute('aria-pressed','false');}
  node.dataset.palace=String(palace.number);
  node.dataset.element=elementSlug(palace.element);
  node.setAttribute('role',interactive?'button':'group');
  node.setAttribute('aria-label',palace.vi+' cung '+palace.number);

  const head=el('span','palace-head');
  const strong=el('strong');
  if(palace.number===5)strong.textContent='中 · Trung Ngũ';
  else strong.append(el('span','trigram',palace.trigram),document.createTextNode(palace.vi+' · '+palace.han));
  head.append(strong,el('span','',palace.number===5?'Thổ · trung tâm':palace.direction+' · '+palace.element));
  if(isSelf)head.append(el('span','menh-self-badge','BẢN MỆNH · BẠN Ở ĐÂY'));
  node.append(head);

  if(palace.number===5){
    const body=el('span','palace-body'),wrap=el('span');
    wrap.append(el('span','center-seal','奇門'));
    const qinPalace=board.palaces.find(p=>p.carriesQin)?.number??'—';
    wrap.append(el('span','center-note','Thiên Cầm theo Nhuế · cung '+qinPalace));
    body.append(wrap);node.append(body);
    const foot=el('span','palace-foot');
    foot.append(el('span','palace-number','5'),el('span'));
    const earth=el('span','earth-stem');earth.dataset.element=elementSlug(palace.earthStem.element);
    earth.append(el('span','han',palace.earthStem.han),el('span','vi',palace.earthStem.vi));
    foot.append(earth);node.append(foot);return node;
  }

  const markers=el('span','markers');
  if(palace.voided)markers.append(marker('Không','marker-void','Tuần không'));
  if(palace.horse)markers.append(marker('Mã','marker-horse','Dịch mã'));
  node.append(markers);

  const body=el('span','palace-body');
  body.append(makeEntity('spirit','Bát thần',palace.spirit));
  const star=makeEntity('star-stack','Cửu tinh',palace.star);
  if(palace.carriesQin)star.append(el('span','qin-tag','禽 · Thiên Cầm'));
  if(palace.isDutyStar)star.append(dutyBadge('Trực Phù'));
  body.append(star);
  const heaven=el('span','entity');heaven.dataset.element=elementSlug(palace.heavenStems[0].element);
  heaven.append(el('span','entity-label','Thiên bàn'));
  const pair=el('span','stem-pair');for(const stem of palace.heavenStems)pair.append(stemToken(stem));
  heaven.append(pair);body.append(heaven);node.append(body);

  const foot=el('span','palace-foot');
  const num=el('span','palace-number-wrap');num.append(el('span','palace-number',palace.number));foot.append(num);
  const door=el('span','door-token');door.dataset.element=elementSlug(palace.door.element);
  door.append(el('span','han',palace.door.han),el('span','vi',palace.door.vi));
  if(palace.isDutyDoor)door.append(dutyBadge('Trực Sử'));
  foot.append(door);
  const earth=el('span','earth-stem');earth.dataset.element=elementSlug(palace.earthStem.element);
  earth.append(el('span','han',palace.earthStem.han),el('span','vi',palace.earthStem.vi));
  foot.append(earth);node.append(foot);
  return node;
}
function addFlag(root,text,primary=false){
  root.append(el('span',primary?'flag flag-primary':'flag',text));
}
function detailItemNode(type,layer,title,subtitle,copy){
  const item=el('div','detail-item item-'+type),top=el('div','detail-item-top');
  top.append(el('strong','',title),el('small','',layer+(subtitle?' · '+subtitle:'')));
  item.append(top,el('p','',copy));return item;
}
function semanticCardNode(palace,board,conditions=null){
  const semantic=semanticBundle(palace,{mode:'destiny',domainId:'general_decision',board,conditions});
  const section=el('section','semantic-card');section.setAttribute('aria-label','Dịch nghĩa nhanh theo Mệnh bàn');
  const head=el('div','semantic-card-head'),eyebrow=el('p','eyebrow','Dịch nghĩa nhanh · '+semantic.domainLabel);
  head.append(eyebrow,el('span','semantic-version',semantic.version));section.append(head);
  const chips=el('div','semantic-keywords');for(const word of semantic.keywords)chips.append(el('span','',word));section.append(chips);
  section.append(el('p','semantic-summary',semantic.summary));
  if(semantic.states.length)section.append(el('p','semantic-state',semantic.states.map(x=>x.rule).join(' ')));
  const details=el('details','semantic-components'),summary=el('summary','','Xem nghĩa từng thành phần'),list=el('ul');
  for(const item of semantic.items){const li=el('li');li.append(el('strong','',item.layer+' · '+item.name),el('span','',item.meaning));list.append(li);}
  details.append(summary,list);section.append(details);return section;
}
function strengthStructureCard(layer){
  if(!layer)return null;
  const section=el('section','semantic-card menh-layer-card'),head=el('div','semantic-card-head');
  head.append(el('p','eyebrow','Lực & điều kiện'),el('span','semantic-version','Mệnh 1.1'));section.append(head);
  const strength=layer.strength;
  section.append(el('p','semantic-summary','Cửu Tinh '+strength.star.level+' ('+strength.star.status+') · Bát Môn '+(strength.door?strength.door.level+' ('+strength.door.status+')':'không có')+' · môi trường cung '+strength.palace.level+' ('+strength.palace.status+').'));
  const conditions=[];
  if(layer.structure.doorRelation&&layer.structure.doorRelation!=='Môn–Cung không tương khắc')conditions.push(layer.structure.doorRelation);
  for(const harm of layer.structure.fourHarms){
    if(harm.code==='void')conditions.push('Tuần Không');
    else if(harm.code==='door_pressure')conditions.push('Môn khắc Cung');
    else if(harm.code==='punishment')conditions.push((harm.stem||'Can')+' kích hình');
    else if(harm.code==='tomb')conditions.push((harm.stem||'Tam Kỳ')+' nhập mộ');
  }
  const modern=layer.structure.stemResponses.filter(x=>x.actorIds?.length).map(x=>x.plainMeaning);
  const patterns=layer.structure.patterns.filter(x=>x.plainMeaning).map(x=>x.plainMeaning);
  if(conditions.length)section.append(el('p','semantic-state','Điều kiện cần lưu ý: '+[...new Set(conditions)].join(' · ')+'.'));
  for(const text of [...new Set([...modern,...patterns])].slice(0,3))section.append(el('p','',text));
  section.append(el('p','ai-note','Mức lực và cấu trúc chỉ điều chỉnh cách phát huy của cung; không phải xác suất và không tự tạo sự kiện ngoài đời.'));
  return section;
}
function renderMenhPalaceDetail(detail,titleNode,palace,board,analysisLayers=null){
  titleNode.textContent=palace.vi+' '+palace.number+' cung';
  detail.replaceChildren();
  const conditions=palaceConditions(palace),title=el('div','detail-title');title.dataset.element=elementSlug(palace.element);
  const main=el('div','detail-title-main'),name=el('span');
  name.append(el('strong','',palace.vi+' · '+palace.han),el('small','',(palace.direction||'Trung tâm')+' · cung '+palace.number));
  main.append(el('span','detail-gua',palace.trigram||'中'),name);title.append(main,el('span','element-chip',palace.element));
  detail.append(title,el('p','detail-image',palace.image||''));
  detail.append(semanticCardNode(palace,board,conditions));
  const layerCard=strengthStructureCard(analysisLayers?.byPalace?.[palace.number]||null);if(layerCard)detail.append(layerCard);
  const list=el('div','detail-list');
  if(palace.number===5){
    list.append(
      detailItemNode('star','Cửu tinh',STAR_QIN.han+' · '+STAR_QIN.vi,STAR_QIN.element,STAR_QIN.meaning+' Trung Ngũ không tham gia vòng chuyển; Thiên Cầm ký cùng Thiên Nhuế tại cung đang mang nó.'),
      detailItemNode('stem','Địa bàn',palace.earthStem.han+' · '+palace.earthStem.vi,palace.earthStem.element,'Can của Trung Ngũ được mang theo Thiên Cầm và ký sang cung có Thiên Nhuế khi chuyển bàn.')
    );
    detail.append(list);return;
  }
  const heavenText=palace.heavenStems.map(stem=>stem.han+' '+stem.vi).join(' + ');
  const carries=palace.carriesQin?' Cung này đồng thời mang '+STAR_QIN.vi+': '+STAR_QIN.meaning:'';
  list.append(
    detailItemNode('spirit','Bát thần',palace.spirit.han+' · '+palace.spirit.vi,'thần',palace.spirit.meaning),
    detailItemNode('star','Cửu tinh',palace.star.han+' · '+palace.star.vi,palace.star.element,palace.star.meaning+carries),
    detailItemNode('door','Bát môn',palace.door.han+' · '+palace.door.vi,palace.door.quality,palace.door.meaning),
    detailItemNode('stem','Thiên–Địa bàn',heavenText+' / '+palace.earthStem.han+' '+palace.earthStem.vi,'chủ–khách','Thiên bàn mang '+heavenText+'; địa bàn là '+palace.earthStem.han+' '+palace.earthStem.vi+'. Cần xét sinh–khắc, nhập mộ và bối cảnh Mệnh trước khi kết luận.')
  );
  detail.append(list);
  const markers=el('div','detail-markers');
  const values=[
    palace.isDutyStar?'Trực Phù: '+board.zhiFu.star.vi:null,
    palace.isDutyDoor?'Trực Sử: '+board.zhiShi.door.vi:null,
    palace.voided?'Lâm Tuần Không':null,
    palace.horse?'Lâm Dịch Mã':null,
    conditions.doorPressure?'Môn bức cung':null,
    conditions.punishment.length?'Kích hình: '+conditions.punishment.join(', '):null,
    conditions.wonderTombs.length?'Tam kỳ nhập mộ: '+conditions.wonderTombs.join(', '):null,
  ].filter(Boolean);
  for(const value of values.length?values:['Không có dấu bổ sung trong phạm vi đã tính'])markers.append(el('span','detail-marker',value));
  detail.append(markers,el('p','detail-image','Các dấu hiệu chỉ là lớp hiệu chỉnh của cung; không tự quyết định tốt/xấu khi đứng riêng.'));
}
function cloneMenhElementPanel(){
  const template=document.getElementById('menh-element-panel-template');
  if(!template?.content?.firstElementChild)throw new Error('Thiếu mẫu sơ đồ Ngũ hành.');
  return template.content.firstElementChild.cloneNode(true);
}
function initMenhElementPanel(panel){
  const diagram=panel.querySelector('.element-diagram'),reading=panel.querySelector('.element-reading'),elements=Object.keys(GENERATES);
  const giver=(map,element)=>elements.find(item=>map[item]===element);
  const reset=()=>{
    delete diagram.dataset.active;
    diagram.querySelectorAll('.element-orb').forEach(button=>{button.classList.remove('is-active');button.setAttribute('aria-pressed','false');});
    diagram.querySelectorAll('.element-routes path').forEach(path=>path.classList.remove('is-related'));
    reading.replaceChildren();reading.hidden=true;
  };
  const relation=(root,label,className,strong,small)=>{
    const p=el('p'),tag=el('span','relation-label '+className,label);p.append(tag,el('strong','',strong),el('small','',small));root.append(p);
  };
  const select=element=>{
    diagram.dataset.active=element;
    diagram.querySelectorAll('.element-orb').forEach(button=>{const active=button.dataset.elementChoice===element;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    diagram.querySelectorAll('.element-routes path').forEach(path=>path.classList.toggle('is-related',path.dataset.from===element||path.dataset.to===element));
    reading.hidden=false;reading.replaceChildren();
    const head=el('div','element-reading-head');head.append(el('h3','',element+' trong bốn chiều quan hệ'));
    const resetButton=el('button','reading-reset','Xem toàn bộ sơ đồ');resetButton.type='button';resetButton.addEventListener('click',reset);head.append(resetButton);reading.append(head);
    const cards=el('div','relation-cards');
    relation(cards,'Sinh ra','relation-generate',element+' → '+GENERATES[element],element+' nuôi dưỡng '+GENERATES[element]);
    relation(cards,'Được sinh','relation-generate',giver(GENERATES,element)+' → '+element,element+' nhận sự nâng đỡ từ '+giver(GENERATES,element));
    relation(cards,'Khắc','relation-control',element+' → '+CONTROLS[element],element+' chế ước '+CONTROLS[element]);
    relation(cards,'Bị khắc','relation-control',giver(CONTROLS,element)+' → '+element,element+' chịu sự chế ước của '+giver(CONTROLS,element));
    reading.append(cards);
  };
  diagram.querySelectorAll('.element-orb').forEach(button=>button.addEventListener('click',()=>{const element=button.dataset.elementChoice;diagram.dataset.active===element?reset():select(element);}));
  reset();
}
function renderMenhChartMeta(board){
  const root=el('div','chart-meta menh-chart-meta'),pillars=el('div','pillars'),summary=el('div','calculation-summary');
  const input=board.input,two=value=>String(value).padStart(2,'0'),weekdays=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  const weekday=weekdays[new Date(Date.UTC(input.year,input.month-1,input.day)).getUTCDay()];
  const labels=[['Năm',board.pillars.year,String(input.year)],['Tháng',board.pillars.month,'Tháng '+two(input.month)],['Ngày',board.pillars.day,weekday+' · '+two(input.day)+'/'+two(input.month)],['Giờ',board.pillars.hour,two(input.hour)+':'+two(input.minute)]];
  for(const [label,pillar,calendar] of labels){
    const box=el('div','pillar'),small=el('small'),han=el('span','han'),vi=el('span','vi');
    small.append(el('span','',label),el('b','',calendar));han.textContent=pillar.han;han.style.color='var(--'+elementSlug(pillar.stem.element)+')';
    vi.append(document.createTextNode(pillar.vi),el('br'),el('span','menh-pillar-element',pillar.stem.element));box.append(small,han,vi);pillars.append(box);
  }
  const item=(label,strongText,sub,className='')=>{const box=el('div','summary-item'+(className?' '+className:''));box.append(el('small','',label),el('strong','',strongText),el('em','',sub));summary.append(box);};
  const instant=two(input.day)+'/'+two(input.month)+'/'+input.year+' · '+two(input.hour)+':'+two(input.minute),offset=input.tzOffset;
  item('Độn · cục',(board.dun==='yang'?'Dương Độn':'Âm Độn')+' '+board.ju+' cục',board.yuan||'','dun');
  item('Tiết khí tại '+instant,(board.term?.han||'')+' · '+(board.term?.vi||''),'Từ '+formatInstantAtOffset(board.term.utcMs,offset,true));
  item('Tuần thủ · lục nghi ẩn Giáp',(board.xun?.head?.han||'—')+' · '+(board.xun?.instrument?.han||'—'),(board.xun?.head?.vi||'—')+' ẩn '+(board.xun?.instrument?.vi||'—'));
  root.append(pillars,summary);return root;
}
function renderMenhMethodDetails(board,timePlace=null){
  const details=el('details','method-details menh-method-details'),copy=el('div','method-copy'),offset=board.input.tzOffset;
  details.append(el('summary','','Quy tắc đang dùng và cách đối chiếu thời điểm sinh'));
  const p1=el('p');p1.append(el('strong','','Định cục. '),document.createTextNode('Thời gia Kỳ Môn · Chuyển bàn · Tháo Bổ; '+(board.dun==='yang'?'Dương':'Âm')+' độn '+board.ju+' cục · '+(board.yuan||'')+'.'));
  const p2=el('p');p2.append(el('strong','','Giao tiết. '),document.createTextNode((board.term?.vi||'Tiết khí')+' bắt đầu '+formatInstantAtOffset(board.term.utcMs,offset,true)+(board.nextTerm?' ; tiết kế '+board.nextTerm.vi+' lúc '+formatInstantAtOffset(board.nextTerm.utcMs,offset,true):'')+'.'));
  const basis=timePlace?.mode==='iana_civil'
    ?'Dùng giờ dân dụng theo IANA '+timePlace.timeZone+'; offset lịch sử tại thời điểm sinh là '+formatOffset(timePlace.effectiveOffsetHours)+'.'
    :'Dùng giờ sinh đã nhập theo UTC offset cố định '+formatOffset(offset)+'; tương thích Mệnh 1.0.';
  const p3=el('p');p3.append(el('strong','','Thời gian đầu vào. '),document.createTextNode(basis));
  const solar=timePlace?.solar;
  const p4=solar?el('p'):null;
  if(p4)p4.append(el('strong','','Đối chiếu Mặt Trời. '),document.createTextNode('Kinh độ được dùng để tính chênh lệch khoảng '+Number(solar.apparentSolarCorrectionMinutes).toFixed(2)+' phút; đây chỉ là metadata đối chiếu và KHÔNG thay giờ lập Mệnh bàn.'));
  copy.append(p1,p2,p3);if(p4)copy.append(p4);details.append(copy);return details;
}
function appendPatternFlags(root,board){
  const p=board.patterns||{};let fu=false,fan=false;
  if(p.starFuYin){addFlag(root,'Cửu Tinh Phục Ngâm',true);fu=true;}
  if(p.doorFuYin){addFlag(root,'Bát Môn Phục Ngâm',true);fu=true;}
  if(p.starFanYin){addFlag(root,'Cửu Tinh Phản Ngâm',true);fan=true;}
  if(p.doorFanYin){addFlag(root,'Bát Môn Phản Ngâm',true);fan=true;}
  if(board.fuYin&&!fu)addFlag(root,'Phục Ngâm',true);
  if(board.fanYin&&!fan)addFlag(root,'Phản Ngâm',true);
}
function renderNatalBoard(board,selfPalaceNumber=null,{interactive=false}={}){
  const section=el('section',(interactive?'board-column ':'')+'menh-board-section');
  const toolbar=el('div','board-toolbar menh-board-toolbar'),title=el('div');
  title.append(el('p','eyebrow','Mệnh bàn theo giờ sinh'),el('h2','','Mệnh bàn Kỳ Môn'));
  const selfPalace=board.palaces.find(p=>p.number===selfPalaceNumber)||board.palaces.find(p=>(p.heavenStems||[]).some(s=>s.han===board.pillars.day.stem.han))||null;
  const key=el('div','board-key'),selfKey=el('span','role-key role-key-person','◉ Bản mệnh · Nhật can '+board.pillars.day.stem.vi+(selfPalace?' · '+selfPalace.vi+' '+selfPalace.number:''));
  key.append(selfKey);
  for(const [slug,label] of [['wood','Mộc · xanh lá'],['fire','Hỏa · đỏ'],['earth','Thổ · nâu'],['metal','Kim · vàng'],['water','Thủy · xanh dương']]){const chip=el('span','element-chip',label);chip.dataset.element=slug;key.append(chip);}
  toolbar.append(title,key);section.append(toolbar);
  const frame=el('div','board-frame menh-board-frame'),grid=el('div','qimen-board menh-qimen-board');
  grid.setAttribute('role','group');grid.setAttribute('aria-label','Mệnh bàn Kỳ Môn chín cung theo giờ sinh');
  for(const palace of board.palaces)grid.append(natalPalaceNode(palace,board,selfPalace?.number??null,{interactive}));
  frame.append(grid);section.append(frame);
  const flags=el('div','board-flags menh-board-flags');
  const voidPalaces=board.palaces.filter(p=>p.voided).map(p=>p.number).join(', ')||'—',horsePalace=board.palaces.find(p=>p.horse)?.number??'—';
  addFlag(flags,'Trực Phù: '+(board.zhiFu?.star?.vi||'—')+' · cung '+(board.zhiFu?.palace??'—'),true);
  addFlag(flags,'Trực Sử: '+(board.zhiShi?.door?.vi||'—')+' · cung '+(board.zhiShi?.palace??'—'));
  addFlag(flags,'Không Vong: '+((board.voidBranches||[]).map(branch=>branch.vi).join('–')||'—')+' · cung '+voidPalaces);
  addFlag(flags,'Mã tinh: '+(board.horseBranch?.vi||'—')+' · cung '+horsePalace);
  appendPatternFlags(flags,board);section.append(flags);return section;
}
function renderMenhWorkspace(board,selfPalaceNumber=null,analysisLayers=null){
  const workspace=el('div','workspace menh-workspace'),boardColumn=renderNatalBoard(board,selfPalaceNumber,{interactive:true});
  const inspector=el('aside','inspector menh-inspector'),head=el('div','inspector-head'),title=el('h2','','Chọn một cung trên bàn'),detail=el('div','palace-detail');
  head.append(el('div','menh-inspector-title-wrap'));head.firstChild.append(el('p','eyebrow','Luận tượng từng cung'),title);inspector.append(head,detail);
  const elements=cloneMenhElementPanel();workspace.append(boardColumn,inspector,elements);
  const buttons=[...boardColumn.querySelectorAll('.palace')];
  const select=number=>{
    const palace=board.palaces.find(item=>item.number===number)||board.palaces.find(item=>item.number===selfPalaceNumber)||board.palaces[0];
    for(const button of buttons){const active=Number(button.dataset.palace)===palace.number;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));}
    renderMenhPalaceDetail(detail,title,palace,board,analysisLayers);
  };
  for(const button of buttons)button.addEventListener('click',()=>select(Number(button.dataset.palace)));
  const fallback=board.palaces.find(p=>p.number===selfPalaceNumber)?.number??board.palaces.find(p=>p.number!==5)?.number??board.palaces[0].number;
  select(fallback);initMenhElementPanel(elements);return workspace;
}
const HOUR_FAMILY_VI=Object.freeze({ZI:'Tý',CHOU:'Sửu',YIN:'Dần',MAO:'Mão',CHEN:'Thìn',SI:'Tỵ',WU:'Ngọ',WEI:'Mùi',SHEN:'Thân',YOU:'Dậu',XU:'Tuất',HAI:'Hợi'});
function candidateSelfPalace(candidate){
  const e=(candidate.evidence||[]).find(x=>x.evidenceId==='SELF_DAY_STEM');
  return Number(String(e?.palace||'').match(/_(\d+)$/)?.[1]||0)||null;
}
function renderUnknownBoardNotice(prepared){
  const section=el('section','menh-board-section menh-board-unknown');
  const toolbar=el('div','board-toolbar menh-board-toolbar'),title=el('div');
  title.append(el('p','eyebrow','Đối chiếu giờ sinh'),el('h2','','Các Mệnh bàn có thể'));
  toolbar.append(title);section.append(toolbar);
  const rect=prepared.rectification;
  const note=el('div','menh-unknown-board-placeholder');
  if(rect?.eventCount){
    const best=rect.ranked?.[0],second=rect.ranked?.[1];
    const state=rect.status==='RESEARCH_LEADING'?'Một ứng viên đang dẫn trong phép đối chiếu nghiên cứu':rect.status==='RESEARCH_TIED'?'Chưa phân biệt được: các ứng viên đầu đang ngang nhau':rect.status==='RESEARCH_INSUFFICIENT'?'Chưa đủ số mốc/nhóm độc lập để lọc giờ sinh':'Chưa đủ dữ kiện để lọc giờ sinh';
    note.append(el('strong','',state+' · '+rect.eventCount+' mốc · '+rect.distinctDomains+' nhóm sự việc.'));
    if(best)note.append(el('p','','Đang dẫn trong phép đối chiếu: giờ '+(HOUR_FAMILY_VI[best.family]||best.family)+' (bàn mẫu '+best.time+') · '+best.supportedEvents+'/'+rect.eventCount+' mốc có kích hoạt lưu niên.'+(second?' Ứng viên kế: '+(HOUR_FAMILY_VI[second.family]||second.family)+' · '+second.supportedEvents+'/'+rect.eventCount+' mốc có kích hoạt.':'')));
  }else{
    note.append(el('strong','','Chưa có mốc cuộc đời để lọc giờ sinh.'));
    note.append(el('p','','Nhập các năm có bước ngoặt rõ ở phần trên để hệ thống so sánh các khung giờ.'));
  }
  note.append(el('p','','Rectification 1.0 đang ở trạng thái NGHIÊN CỨU, hiện chỉ đối chiếu theo năm lưu niên. Xếp hạng không phải xác suất/độ chính xác và không chứng minh giờ sinh thật.'));
  section.append(note);
  const fallbackCandidates=rect?.candidateIds?.length?prepared.candidates.filter(c=>rect.candidateIds.includes(c.id)):prepared.candidates;
  const ranked=(rect?.ranked?.length?rect.ranked:fallbackCandidates).slice(0,rect?.eventCount?5:fallbackCandidates.length);
  const chooser=el('div','menh-candidate-list');
  for(const c of ranked){
    const details=el('details','menh-candidate');
    const label='Giờ '+(HOUR_FAMILY_VI[c.family]||c.family)+' · '+c.time+(c.supportUnits!=null?' · '+c.supportedEvents+'/'+rect.eventCount+' mốc có kích hoạt':'');
    const card=el('div','menh-candidate-card');
    details.append(el('summary','',label));
    details.append(renderNatalBoard(c.board,candidateSelfPalace(c)));
    const use=el('button','button button-primary menh-use-candidate','Dùng ứng viên này để xem thử · Giờ '+(HOUR_FAMILY_VI[c.family]||c.family));
    use.type='button';use.dataset.candidateTime=c.time;use.dataset.candidateFamily=c.family;
    card.append(details,use);chooser.append(card);
  }
  section.append(chooser);return section;
}
function renderKnown(root,prepared){
  const result=prepared.result,details=el('details','menh-basis-details'),section=el('section','menh-domain-section'),head=el('div','menh-section-heading');
  details.open=false;
  details.append(el('summary','','Căn cứ Kỳ Môn của bài luận · '+result.claims.length+' mục'));
  head.append(el('p','eyebrow','Nội dung từ Mệnh bàn'),el('h2','','Các trục luận Mệnh'));section.append(head);
  const grid=el('div','menh-claim-grid');for(const claim of result.claims)grid.append(claimCard(claim,result));
  section.append(grid);details.append(section);root.append(details);
}
function renderUnknown(root,prepared){
  const s=prepared.result.stability;
  const notice=el('div','menh-unknown-note');
  notice.append(el('strong','','Không nhớ giờ sinh · '+s.candidateCount+' bàn ứng viên'));
  notice.append(el('p','','Chỉ giữ phần ổn định qua toàn bộ ứng viên. '+s.timeSensitiveFindings.length+' nhóm kết luận thay đổi theo giờ sinh và không được bỏ phiếu đa số.'));
  root.append(notice);
  const stable=el('section','menh-stability-section');
  stable.append(el('h3','','Ổn định dù không nhớ giờ sinh · '+s.stableFindings.length));
  const stableGrid=el('div','menh-claim-grid');
  for(const finding of s.stableFindings){
    const claim=prepared.result.claims.find(c=>c.claimId===finding.claimId);
    if(claim)stableGrid.append(claimCard(claim,prepared.result));
  }
  if(!s.stableFindings.length)stableGrid.append(el('p','menh-empty','Không có kết luận domain nào đủ ổn định qua toàn bộ ứng viên.'));
  stable.append(stableGrid);root.append(stable);
  const sensitive=el('section','menh-stability-section menh-sensitive');
  sensitive.append(el('h3','','Phụ thuộc giờ sinh · '+s.timeSensitiveFindings.length));
  const grid=el('div','menh-sensitive-grid');
  for(const finding of s.timeSensitiveFindings){
    const card=el('article','menh-sensitive-card');
    card.append(el('strong','',DOMAIN_LABEL[finding.domain]||finding.domain));
    card.append(el('span','',finding.variantCount+' biến thể qua các giờ sinh'));
    if(finding.samples?.[0])card.append(el('p','',finding.samples[0]));
    grid.append(card);
  }
  sensitive.append(grid);root.append(sensitive);
}
export function renderMenhDeterministic(container,prepared){
  const aiPanel=document.querySelector('.menh-ai-panel');
  container.replaceChildren();
  const header=el('div','menh-result-head'),title=el('div');
  title.append(el('p','eyebrow','Kỳ Môn Mệnh'),el('h2','',prepared.input.birthTimeMode==='KNOWN'?'Mệnh bàn theo giờ sinh':'Phân tích khi không nhớ giờ sinh'));
  header.append(title);
  header.append(el('span','menh-mode-badge',prepared.input.birthTimeMode==='KNOWN'?'Biết giờ sinh':'Không nhớ giờ sinh'));
  container.append(header);
  const profile=el('div','menh-result-profile');
  const identity=el('div','menh-result-identity');
  identity.append(el('span','menh-result-profile-label','Đương số'),el('strong','menh-result-name',prepared.input.fullName||'Chưa nhập'));
  const sexLabel=prepared.input.sexMetadata==='MALE'?'Nam':prepared.input.sexMetadata==='FEMALE'?'Nữ':'Không khai báo';
  profile.append(identity,el('span','menh-result-sex',sexLabel));
  container.append(profile);
  if(prepared.input.birthTimeMode==='KNOWN'){
    const board=prepared.result?.natal?.baseBoard;
    if(!board)throw new Error('Thiếu Mệnh bàn đã dùng để luận.');
    const selfEvidence=(prepared.result.evidence||[]).find(e=>e.evidenceId==='SELF_DAY_STEM');
    const selfPalaceNumber=Number(String(selfEvidence?.palace||'').match(/_(\d+)$/)?.[1]||0)||null;
    container.append(renderMenhChartMeta(board));
    container.append(renderMenhWorkspace(board,selfPalaceNumber,prepared.result.analysisLayers));
    if(aiPanel)container.append(aiPanel);
    container.append(renderMenhMethodDetails(board,prepared.technical?.timePlace||null));
  }else{
    container.append(renderUnknownBoardNotice(prepared));
    if(aiPanel)container.append(aiPanel);
  }
  const body=el('div','menh-deterministic-body');
  prepared.input.birthTimeMode==='KNOWN'?renderKnown(body,prepared):renderUnknown(body,prepared);
  container.append(body);
}
function focusParagraph(text){
  const p=el('p');
  for(const part of formatParts(String(text||''),{automatic:false})){
    if(part.strong)p.append(el('strong','menh-ai-focus',part.text));
    else p.append(document.createTextNode(part.text));
  }
  return p;
}
function appendAiParagraphs(card,value){
  const parts=String(value||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  for(const part of parts)card.append(focusParagraph(part));
}
export function renderMenhAi(container,reading){
  container.replaceChildren();
  const grid=el('div','menh-ai-grid');
  for(const key of Object.keys(SECTION_LABEL)){
    const section=reading[key];if(!section?.text?.trim())continue;
    const card=el('section','menh-ai-section'+(key==='birthTimeNote'?' menh-ai-note':''));
    card.append(el('h3','',SECTION_LABEL[key]));appendAiParagraphs(card,section.text);grid.append(card);
  }
  container.append(grid);
}
