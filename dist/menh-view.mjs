const DOMAIN_LABEL=Object.freeze({
  SELF:'Bản thân & tổng thể',FAMILY:'Gia đình & cha mẹ',CHILDREN:'Con cái',
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
  details.append(el('summary','Căn cứ kỹ thuật · '+items.length));
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
function renderKnown(root,prepared){
  const result=prepared.result,grid=el('div','menh-claim-grid');
  for(const claim of result.claims)grid.append(claimCard(claim,result));
  root.append(grid);
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
  const header=el('div','menh-result-head');
  const title=el('div');
  title.append(el('p','eyebrow','KM-MENH-1.0 · Zhang Advanced-Class'),el('h2','',prepared.input.birthTimeMode==='KNOWN'?'Mệnh bàn theo giờ sinh':'Phân tích khi không nhớ giờ sinh'));
  header.append(title);
  header.append(el('span','menh-mode-badge',prepared.input.birthTimeMode==='KNOWN'?'Biết giờ sinh':'Không nhớ giờ sinh'));
  container.append(header);
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
  container.append(meta);
  const body=el('div','menh-deterministic-body');
  prepared.input.birthTimeMode==='KNOWN'?renderKnown(body,prepared):renderUnknown(body,prepared);
  container.append(body);
}
export function renderMenhAi(container,reading){
  container.replaceChildren();
  const grid=el('div','menh-ai-grid');
  for(const key of Object.keys(SECTION_LABEL)){
    const section=reading[key];if(!section?.text?.trim())continue;
    const card=el('section','menh-ai-section'+(key==='birthTimeNote'?' menh-ai-note':''));
    card.append(el('h3','',SECTION_LABEL[key]),el('p','',section.text));
    grid.append(card);
  }
  container.append(grid);
}
