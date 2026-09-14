import {resultTabs,renderTechnical,renderComparison} from './qimen/ui-results.mjs';
// Validated model text is always textContent, never HTML, URLs or executable markup.
export function renderReading(answer,data,prepared) {
  const r=data.reading,doc=answer.ownerDocument||document,g=prepared.context.allInOne.reasoning;
  const node=(tag,text,parent,className)=>{const el=doc.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;};
  const prose=(text,parent)=>{for(const paragraph of text.split(/\n\s*\n/).filter(s=>s.trim()))node('p',paragraph.trim(),parent);};
  const evidence=(claimIds,parent)=>{
    if(!claimIds.length)return;
    const details=node('details','',parent,'ai-evidence');details.open=false;
    node('summary','Vì sao AI kết luận như vậy? · Căn cứ Kỳ Môn',details);
    const shown=new Set();
    for(const id of claimIds){
      const claim=g.claims.find(c=>c.id===id),bundle=g.evidenceBundles.find(b=>b.id===claim.bundleId);
      node('h4',bundle.roles.map(r=>r.meaning).join(' · ')+` — cung ${bundle.palace}`,details);
      for(const factId of [`p${bundle.palace}`,`c${bundle.palace}`])if(!shown.has(factId)){node('p',data.facts[factId],details);shown.add(factId);}
      const relationId=claim.evidenceIds.find(id=>id.startsWith('graph_'));
      if(relationId&&!shown.has(relationId)){node('p',data.facts[relationId],details);shown.add(relationId);}
      const button=node('button',`Đối chiếu cung ${bundle.palace}`,details,'jump-cung');button.type='button';
      button.addEventListener('click',()=>{const palace=doc.querySelector(`[data-palace="${bundle.palace}"]`);palace?.click();palace?.scrollIntoView({block:'center',behavior:'smooth'});});
    }
  };
  const section=(title,value,parent)=>{const el=node('section','',parent,'ai-assessment');if(title)node('h3',title,el);prose(value.text,el);evidence(value.claim_ids,el);return el;};
  answer.replaceChildren();node('h3',r.status==='needs_clarification'?'Cần làm rõ trước khi luận':'Nhận định cho sự việc này',answer);
  if(r.status==='needs_clarification'){
    const opening=node('div','',answer,'ai-opening');prose(r.summary.text,opening);
    const list=node('ul','',answer);for(const question of r.questions)node('li',question,list);
    answer.hidden=false;return;
  }
  const tabs=resultTabs(answer),opening=node('div','',tabs.quick,'ai-opening');prose(r.summary.text,opening);evidence(r.summary.claim_ids,opening);
  section('Thế của sự việc',r.situation,tabs.quick);
  const bottleneck=section('Điểm mấu chốt',r.bottleneck,tabs.quick);node('p',r.bottleneck.resolution,bottleneck,'ai-condition');
  const stages=node('ol','',tabs.story,'ai-stages');
  const labels={current:'Hiện tại',next:'Chuyển biến',outcome:'Kết quả có điều kiện'};
  for(const step of r.development){const item=node('li','',stages);node('span',labels[step.stage],item,'ai-stage-label');prose(step.text,item);node('p',step.condition,item,'ai-condition');evidence(step.claim_ids,item);}
  section('Khi nào cần đổi cách hiểu?',r.alternative,tabs.story);
  node('h3',r.questionType==='strategy'?'Thứ tự hành động':'Bước tiếp theo',tabs.actions);
  const actions=node('ol','',tabs.actions,'ai-actions');
  for(const action of r.actions){const item=node('li','',actions);prose(action.text,item);const planned=g.recommendations.find(a=>a.id===action.recommendation_id);evidence([planned.claimId],item);}
  section('Phạm vi thời gian',r.timing,tabs.timing);renderComparison(tabs.timing,prepared);
  const rows=prepared.context.allInOne.comparison?.ranking||prepared.context.allInOne.plan.computed.ranking||[];
  for(const item of r.comparisons){node('h4',rows.find(row=>row.id===item.id).label,tabs.timing);prose(item.reason,tabs.timing);}
  node('h3','Căn cứ của các nhận định chính',tabs.technical);
  node('p','Mở từng cụm để đối chiếu tượng trên bàn. Đây là dữ kiện và quy ước diễn giải, không phải bằng chứng về việc đã xảy ra.',tabs.technical,'ai-note');
  for(const claim of g.claims)evidence([claim.id],tabs.technical);
  const technical=node('details','',tabs.technical);technical.open=false;node('summary','Xem dữ liệu kỹ thuật của bàn',technical);renderTechnical(technical,prepared);
  if(r.questions.length){const questions=node('ul','',tabs.quick);for(const q of r.questions)node('li',q,questions);}
  node('p',`AI · ${data.rules} · Căn cứ khớp bàn; diễn giải cần đối chiếu thực tế.`,answer,'ai-note');answer.hidden=false;
}
