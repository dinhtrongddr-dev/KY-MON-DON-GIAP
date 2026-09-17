export function element(doc,tag,text,parent,className) {
  const el=doc.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;
}
export function resultTabs(root,customEntries=null) {
  const doc=root.ownerDocument||document,node=(tag,text,parent,cls)=>element(doc,tag,text,parent,cls);
  const bar=node('div','',root,'ai-tabs');bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Các phần của lời luận');
  const entries=customEntries?.length?customEntries:[['quick','Kết luận nhanh'],['story','Diễn biến thực tế'],['technical','Phân tích Kỳ Môn'],['actions','Chiến lược đề xuất'],['timing','Ứng kỳ']];
  const buttons=[],panels={};
  const select=index=>entries.forEach(([id],i)=>{buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;panels[id].hidden=i!==index;});
  entries.forEach(([id,label],i)=>{
    const b=node('button',label,bar);b.type='button';b.id=`reading-tab-${id}`;b.setAttribute('role','tab');b.setAttribute('aria-controls',`reading-panel-${id}`);buttons.push(b);
    const p=node('section','',root,'ai-tabpanel');p.id=`reading-panel-${id}`;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.tabIndex=0;panels[id]=p;
    b.addEventListener('click',()=>select(i));
    b.addEventListener('keydown',e=>{
      const target=e.key==='ArrowRight'?(i+1)%entries.length:e.key==='ArrowLeft'?(i+entries.length-1)%entries.length:e.key==='Home'?0:e.key==='End'?entries.length-1:null;
      if(target!==null){e.preventDefault();select(target);buttons[target].focus();}
    });
  });
  select(0);return panels;
}
export function renderTechnical(root,prepared,{includeJson=true,expanded=false}={}) {
  const doc=root.ownerDocument||document,node=(tag,text,parent,cls)=>element(doc,tag,text,parent,cls);
  const c=prepared.context.allInOne;
  node('h3',`${c.plan.label} · dữ liệu đã tính`,root);
  node('p',c.classification.reason,root);
  node('p',`${c.coverage.resolvedActors}/${c.coverage.totalActors} đại diện có cung theo quy ước hoặc khai báo. Đây không phải độ chính xác dự báo.`,root,'ai-note');
  const roles=node('div','',root,'rule-actors');
  for(const r of c.graph.nodes){const item=node('div','',roles);node('strong',r.label,item);node('span',r.palace?`Cung ${r.palace} · ${r.status==='proxy'?'biểu tượng tham khảo':r.status==='user_supplied'?'người dùng khai báo':'quy ước'}`:'Chưa xác định đại diện',item);node('p',`${r.selectionRule.id} · ${r.selectionRule.verification}. Nguồn: ${r.selectionRule.source}. ${r.limitations.join(' ')}`,item,'ai-note');}
  const links=node(expanded?'section':'details','',root);node(expanded?'h4':'summary','Mạng quan hệ giữa các đối tượng',links);
  node('p',c.graph.meaning,links,'ai-note');
  const ul=node('ul','',links);
  for(const edge of c.graph.relations)node('li',prepared.facts[edge.id],ul);
  const flags=node(expanded?'section':'details','',root);node(expanded?'h4':'summary','Vượng suy, điều kiện và mâu thuẫn cần đối chiếu',flags);
  for(const n of c.relevantPalaces){node('p',prepared.facts[`strength_${n}`],flags);node('p',prepared.facts[`c${n}`],flags);}
  for(const conflict of c.analysis.contradictions.filter(x=>c.relevantPalaces.includes(x.palace)))node('p',conflict.text,flags);
  node('p',prepared.facts.special,flags);
  for(const [id,value] of Object.entries(prepared.facts).filter(([id])=>/^special_/.test(id)))node('p',value,flags);
  const scope=node(expanded?'section':'details','',root);node(expanded?'h4':'summary','Quy tắc đã hỗ trợ và giới hạn',scope);
  node('p','Đã tính: '+c.analysis.coverage.computed.join('; ')+'.',scope);
  node('p','Chưa hỗ trợ: '+c.analysis.coverage.unsupported.join('; ')+'.',scope);
  if(includeJson){const details=node('details','',root);node('summary','QimenBoard JSON · dữ liệu bàn chuẩn hóa',details);node('pre',JSON.stringify(c.board,null,2),details,'qimen-json');}
}
export function renderComparison(root,prepared) {
  const c=prepared.context.allInOne,doc=root.ownerDocument||document,node=(tag,text,parent,cls)=>element(doc,tag,text,parent,cls);
  const comparison=c.comparison;
  const rows=comparison?.ranking||c.plan.computed.ranking;
  if(!rows?.length)return;
  node('h3',comparison?'So sánh các thời điểm đã nhập':'So sánh tám phương vị',root);
  node('p',comparison?.convention||c.plan.computed.convention,root,'ai-note');
  if(c.questionContext.direction)node('p',`Điểm quy chiếu: ${c.questionContext.direction.origin}. Cách dùng: ${{movement:'hướng di chuyển',seating:'hướng ngồi (phía lưng/tựa)',facing:'hướng nhìn'}[c.questionContext.direction.kind]}. Áp dụng tại thời điểm lập bàn.`,root);
  const grid=node('div','',root,'comparison-grid');
  for(const item of rows){
    const section=node('section','',grid,'comparison-item');node('h4',`Nhóm ${item.rank} · ${item.label}`,section);
    node('p',`Điều kiện cần kiểm tra: ${item.blockers.length}; điểm phù hợp mục tiêu: ${item.fit}.`,section);
    if(item.blockers.length)node('p',item.blockers.join(' · '),section);
    if(item.supports.length)node('p',item.supports.join(' · '),section);
    if(item.note)node('p',item.note,section,'ai-note');
    const candidate=comparison?.candidates.find(c=>c.id===item.id);
    if(candidate){const detail=node('details','',section);node('summary','Đối chiếu bàn của thời điểm này',detail);node('pre',JSON.stringify({board:candidate.board,roles:candidate.rolePalaces,conditions:candidate.details},null,2),detail,'qimen-json');}
  }
}
