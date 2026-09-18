import {elementSlug} from './qimen/core/palace.mjs';

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
function addMeta(grid,label,value){
  const box=el('div','menh-meta-item');
  box.append(el('span','',label),el('strong','',value==null?'—':value));grid.append(box);
}
function evidenceDetails(claim,result){
  const ids=new Set(claim.evidenceIds),items=(result.evidence||[]).filter(e=>ids.has(e.evidenceId));
  if(!items.length)return null;
  const details=el('details','menh-evidence');
  details.append(el('summary','','Căn cứ kỹ thuật · '+items.length));
  const list=el('ul','menh-evidence-list');
  for(const item of items){
    const li=el('li');
    li.append(el('strong','',(item.palace||'')+' · '+item.mechanism));
    li.append(el('span','',item.metadata?.summary||item.effectTag));
    list.append(li);
  }
  details.append(list);return details;
}
function claimCard(claim,result){
  const card=el('article','menh-claim');
  card.append(el('p','eyebrow',DOMAIN_LABEL[claim.domain]||claim.domain));
  card.append(el('p','menh-claim-text',claim.text));
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
function natalPalaceNode(palace,board){
  const node=el('div',palace.number===5?'palace palace-center':'palace');
  node.dataset.element=elementSlug(palace.element);
  node.setAttribute('role','group');
  node.setAttribute('aria-label',palace.vi+' cung '+palace.number);

  const head=el('span','palace-head');
  const strong=el('strong');
  if(palace.number===5)strong.textContent='中 · Trung Ngũ';
  else strong.append(el('span','trigram',palace.trigram),document.createTextNode(palace.vi+' · '+palace.han));
  head.append(strong,el('span','',palace.number===5?'Thổ · trung tâm':palace.direction+' · '+palace.element));
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
function appendPatternFlags(root,board){
  const p=board.patterns||{};let fu=false,fan=false;
  if(p.starFuYin){addFlag(root,'Cửu Tinh Phục Ngâm',true);fu=true;}
  if(p.doorFuYin){addFlag(root,'Bát Môn Phục Ngâm',true);fu=true;}
  if(p.starFanYin){addFlag(root,'Cửu Tinh Phản Ngâm',true);fan=true;}
  if(p.doorFanYin){addFlag(root,'Bát Môn Phản Ngâm',true);fan=true;}
  if(board.fuYin&&!fu)addFlag(root,'Phục Ngâm',true);
  if(board.fanYin&&!fan)addFlag(root,'Phản Ngâm',true);
}
function renderNatalBoard(board){
  const section=el('section','menh-board-section');
  const toolbar=el('div','board-toolbar menh-board-toolbar'),title=el('div');
  title.append(el('p','eyebrow','Mệnh bàn Kỳ Môn · natal cố định'),el('h2','','Mệnh bàn Kỳ Môn 3×3'));
  const key=el('div','board-key');
  key.append(el('span','menh-board-key-self','Nhật can = Bản thân · '+board.pillars.day.vi));
  key.append(el('span','','Thời Gia · Chuyển Bàn · Tháo bổ'));
  toolbar.append(title,key);section.append(toolbar);

  const frame=el('div','board-frame menh-board-frame'),grid=el('div','qimen-board menh-qimen-board');
  grid.setAttribute('role','group');grid.setAttribute('aria-label','Mệnh bàn Kỳ Môn chín cung theo giờ sinh');
  for(const palace of board.palaces)grid.append(natalPalaceNode(palace,board));
  frame.append(grid);section.append(frame);

  const flags=el('div','board-flags menh-board-flags');
  const voidPalaces=board.palaces.filter(p=>p.voided).map(p=>p.number).join(', ')||'—';
  const horsePalace=board.palaces.find(p=>p.horse)?.number??'—';
  addFlag(flags,'Trực Phù: '+(board.zhiFu?.star?.vi||'—')+' · cung '+(board.zhiFu?.palace??'—'),true);
  addFlag(flags,'Trực Sử: '+(board.zhiShi?.door?.vi||'—')+' · cung '+(board.zhiShi?.palace??'—'));
  addFlag(flags,'Không Vong: '+((board.voidBranches||[]).map(branch=>branch.vi).join('–')||'—')+' · cung '+voidPalaces);
  addFlag(flags,'Mã tinh: '+(board.horseBranch?.vi||'—')+' · cung '+horsePalace);
  appendPatternFlags(flags,board);section.append(flags);return section;
}
function renderUnknownBoardNotice(prepared){
  const section=el('section','menh-board-section menh-board-unknown');
  const toolbar=el('div','board-toolbar menh-board-toolbar'),title=el('div');
  title.append(el('p','eyebrow','Mệnh bàn Kỳ Môn · giờ sinh chưa xác định'),el('h2','','Không có một bàn 3×3 duy nhất'));
  toolbar.append(title);section.append(toolbar);
  const note=el('div','menh-unknown-board-placeholder');
  note.append(el('strong','','Engine đang đối chiếu '+prepared.candidateCount+' Mệnh bàn ứng viên deterministic.'));
  note.append(el('p','','Không chọn tự động một giờ, không bỏ phiếu đa số và không dựng một bàn đại diện giả. Các kết luận bên dưới chỉ giữ phần ổn định qua toàn bộ ứng viên.'));
  section.append(note);return section;
}
function renderTechnical(prepared){
  const section=el('section','menh-technical-section'),head=el('div','menh-section-heading');
  head.append(el('p','eyebrow','Dữ liệu deterministic'),el('h2','','Thông tin kỹ thuật'));section.append(head);
  const meta=el('div','menh-meta-grid');
  addMeta(meta,'Profile',prepared.result.profileId);
  addMeta(meta,'Giờ sinh',prepared.input.birthTimeMode==='KNOWN'?prepared.input.birthTimeLocal:'Không xác định');
  addMeta(meta,'Ứng viên',prepared.candidateCount);
  if(prepared.input.birthTimeMode==='KNOWN'){
    addMeta(meta,'Tứ trụ',Object.values(prepared.technical.pillars).join(' · '));
    addMeta(meta,'Độn · cục',(prepared.technical.dun==='yang'?'Dương':'Âm')+' độn '+prepared.technical.ju+' cục');
  }else{
    addMeta(meta,'Nhật trụ có thể có',prepared.technical.dayPillars.join(' · '));
    addMeta(meta,'Biên 23:00',prepared.technical.dayBoundaryVariants.join(' · '));
  }
  if(prepared.input.age!=null)addMeta(meta,'Tuổi đang xét',prepared.input.age);
  if(prepared.input.annualYear!=null)addMeta(meta,'Lưu niên',prepared.input.annualYear+' · '+prepared.annualPillar);
  section.append(meta);return section;
}
function renderKnown(root,prepared){
  const result=prepared.result,section=el('section','menh-domain-section'),head=el('div','menh-section-heading');
  head.append(el('p','eyebrow','Claims & evidence KM-MENH-1.0'),el('h2','','Các trục luận Mệnh'));section.append(head);
  const grid=el('div','menh-claim-grid');for(const claim of result.claims)grid.append(claimCard(claim,result));
  section.append(grid);root.append(section);
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
  container.replaceChildren();
  const header=el('div','menh-result-head'),title=el('div');
  title.append(el('p','eyebrow','KM-MENH-1.0 · Zhang Advanced-Class'),el('h2','',prepared.input.birthTimeMode==='KNOWN'?'Mệnh bàn theo giờ sinh':'Phân tích khi không nhớ giờ sinh'));
  header.append(title);
  header.append(el('span','menh-mode-badge',prepared.input.birthTimeMode==='KNOWN'?'Biết giờ sinh':'Không nhớ giờ sinh'));
  container.append(header);
  if(prepared.input.birthTimeMode==='KNOWN'){
    const board=prepared.result?.natal?.baseBoard;
    if(!board)throw new Error('KM-MENH: thiếu QimenBoard natal đã dùng để luận.');
    container.append(renderNatalBoard(board));
  }else container.append(renderUnknownBoardNotice(prepared));
  container.append(renderTechnical(prepared));
  const body=el('div','menh-deterministic-body');
  prepared.input.birthTimeMode==='KNOWN'?renderKnown(body,prepared):renderUnknown(body,prepared);
  container.append(body);
}
function appendAiParagraphs(card,value){
  const parts=String(value||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  for(const part of parts)card.append(el('p','',part));
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
