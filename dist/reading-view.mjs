import {resultTabs,renderTechnical,renderComparison} from './qimen/ui-results.mjs';
import {renderProse} from './reading-format.mjs';
// Emphasis uses created DOM nodes; model HTML is always literal text.
export function renderReading(answer,data,prepared) {
  const r=data.reading,doc=answer.ownerDocument||document,g=prepared.context.allInOne.reasoning;
  const node=(tag,text,parent,className)=>{const el=doc.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;};
  const prose=(text,parent)=>renderProse(text,parent,doc);
  const evidence=(claimIds,parent,id='')=>{
    if(!claimIds.length)return;
    const details=node('details','',parent,'ai-evidence');details.open=false;if(id)details.id=id;details.tabIndex=-1;
    node('summary','Xem toàn bộ căn cứ của phần này',details);
    const shown=new Set();
    for(const id of claimIds){
      const claim=g.claims.find(c=>c.id===id),bundle=g.evidenceBundles.find(b=>b.id===claim.bundleId);
      node('h4',bundle.roles.map(r=>r.meaning).join(' · ')+` — cung ${bundle.palace}`,details);
      for(const factId of [`p${bundle.palace}`,`c${bundle.palace}`])if(!shown.has(factId)){node('p',data.facts[factId],details);shown.add(factId);}
      const relationId=claim.evidenceIds.find(id=>id.startsWith('graph_'));
      if(relationId&&!shown.has(relationId)){node('p',data.facts[relationId],details);shown.add(relationId);}
      for(const ruleId of claim.ruleIds||[]){
        if(shown.has(ruleId))continue;const rule=g.rules[ruleId];shown.add(ruleId);
        node('p',`${rule.id} · ${rule.verification} · Nguồn: ${rule.source}. ${rule.conditions}`,details,'ai-note');
      }
      if(claim.conflicts.length)node('p','Dấu hiệu hạn chế: '+claim.conflicts.map(c=>c.resolution||c.text||c.code).join(' '),details);
      const button=node('button',`Đối chiếu cung ${bundle.palace}`,details,'jump-cung');button.type='button';
      button.addEventListener('click',()=>{const palace=doc.querySelector(`[data-palace="${bundle.palace}"]`);palace?.click();palace?.scrollIntoView({block:'center',behavior:'smooth'});});
    }
    return details;
  };
  const collections=new Map();
  const trace=(ids,parent,panel)=>{
    if(!ids.length)return;
    const item=collections.get(panel)||{ids:new Set(),buttons:[],id:`reading-evidence-${collections.size}`};
    ids.forEach(id=>item.ids.add(id));
    const button=node('button',`${ids.length} căn cứ`,parent,'ai-trace');button.type='button';
    button.setAttribute('aria-controls',item.id);button.setAttribute('aria-label','Xem căn cứ cho nhận định này');
    item.buttons.push(button);collections.set(panel,item);
  };
  const finishEvidence=()=>{
    for(const [panel,item] of collections){
      const details=evidence([...item.ids],panel,item.id);
      for(const button of item.buttons)button.addEventListener('click',()=>{details.open=true;details.focus();details.scrollIntoView?.({block:'nearest',behavior:'smooth'});});
    }
  };
  const section=(title,value,parent)=>{if(!value.text)return null;const el=node('section','',parent,'ai-assessment');if(title)node('h3',title,el);prose(value.text,el);trace(value.claim_ids,el,parent);return el;};
  answer.replaceChildren();node('h3',r.status==='needs_clarification'?'Cần làm rõ trước khi luận':'Nhận định cho sự việc này',answer);
  if(r.status==='needs_clarification'){
    const opening=node('div','',answer,'ai-opening');prose(r.summary.text,opening);
    const list=node('ul','',answer);for(const question of r.questions)node('li',question,list);
    answer.hidden=false;return;
  }
  if(r.status==='verified_fallback'){
    prose(r.summary.text,answer);trace(r.summary.claim_ids,answer,answer);
    section(r.status==='verified_fallback'?'Dữ kiện đã tính':'Căn cứ quyết định',r.situation,answer);
    const obstacle=section('Điều kiện cần xác minh',r.bottleneck,answer);if(obstacle&&r.bottleneck.resolution)prose(r.bottleneck.resolution,obstacle);
    for(const action of r.actions){prose(action.text,answer);trace([g.recommendations.find(a=>a.id===action.recommendation_id).claimId],answer,answer);}
    section('',r.alternative,answer);section('',r.timing,answer);
    if(r.status==='verified_fallback'){const details=node('details','',answer);node('summary','Đối chiếu dữ kiện và giới hạn',details);renderTechnical(details,prepared);}
    if(r.questions.length){const list=node('ul','',answer);for(const q of r.questions)node('li',q,list);}
    finishEvidence();answer.hidden=false;return;
  }
  const tabs=resultTabs(answer),opening=node('div','',tabs.quick,'ai-opening');prose(r.summary.text,opening);trace(r.summary.claim_ids,opening,tabs.quick);
  section('Cụm tượng quyết định',r.situation,tabs.technical);
  const bottleneck=section('Điểm mấu chốt',r.bottleneck,tabs.quick);prose(r.bottleneck.resolution,bottleneck);
  const stages=node('ol','',tabs.story,'ai-stages');
  const labels={current:'Hiện tại',next:'Chuyển biến',outcome:'Kết quả có điều kiện'};
  for(const step of r.development){const item=node('li','',stages);node('span',labels[step.stage],item,'ai-stage-label');prose(step.text,item);prose(step.condition,item);trace(step.claim_ids,item,tabs.story);}
  if(!r.development.length&&g.eventStages){
    node('p','Chuỗi điều kiện do bộ luận tổng hợp; đây không phải các sự kiện đã xảy ra.',tabs.story,'ai-note');
    for(const step of g.eventStages.stages.filter(s=>['EMERGENCE','FORMATION','EXECUTION','REALIZATION'].includes(s.stage))){
      const item=node('li','',stages);node('span',step.label,item,'ai-stage-label');
      const meaning={positive:'Có cụm tượng hỗ trợ',conditional:'Phụ thuộc điều kiện chuyển bước',uncertain:'Chưa có hỗ trợ đủ rõ',unresolved:'Chưa xác định'};
      prose(meaning[step.status]+(step.conditions[0]?': '+step.conditions[0]:'.'),item);
      const ids=g.claims.filter(c=>c.evidenceIds.some(e=>step.supportingEvidenceIds.includes(e)||step.limitingEvidenceIds.includes(e))).map(c=>c.id);trace(ids,item,tabs.story);
    }
  }
  section('Khi nào cần đổi cách hiểu?',r.alternative,tabs.story);
  node('h3',r.questionType==='strategy'?'Thứ tự hành động':'Bước tiếp theo',tabs.actions);
  const actions=node('ol','',tabs.actions,'ai-actions');
  for(const action of r.actions){const item=node('li','',actions);prose(action.text,item);const planned=g.recommendations.find(a=>a.id===action.recommendation_id);trace([planned.claimId],item,tabs.actions);}
  section('Phạm vi thời gian',r.timing,tabs.timing);
  if(!r.timing.text)prose(g.timing?.limit||g.likelyScenario.timing.limit,tabs.timing);
  if(g.timing?.window)node('p',`Khoảng hỏi: ${g.timing.window.start} đến ${g.timing.window.end} (UTC${g.timing.window.tzOffset>=0?'+':''}${g.timing.window.tzOffset}). Đây là phạm vi lịch, không phải ngày dự báo.`,tabs.timing,'ai-note');
  renderComparison(tabs.timing,prepared);
  const rows=prepared.context.allInOne.comparison?.ranking||prepared.context.allInOne.plan.computed.ranking||[];
  for(const item of r.comparisons){node('h4',rows.find(row=>row.id===item.id).label,tabs.timing);prose(item.reason,tabs.timing);}
  node('h3','Căn cứ của các nhận định chính',tabs.technical);
  node('p','Mở từng cụm để đối chiếu tượng trên bàn. Đây là dữ kiện và quy ước diễn giải, không phải bằng chứng về việc đã xảy ra.',tabs.technical,'ai-note');
  trace(g.claims.map(c=>c.id),tabs.technical,tabs.technical);
  renderTechnical(tabs.technical,prepared,{includeJson:false,expanded:true});
  if(r.questions.length){const questions=node('ul','',tabs.quick);for(const q of r.questions)node('li',q,questions);}
  finishEvidence();
  node('p',`AI · ${data.rules} · Căn cứ khớp bàn; diễn giải cần đối chiếu thực tế.`,answer,'ai-note');answer.hidden=false;
}
