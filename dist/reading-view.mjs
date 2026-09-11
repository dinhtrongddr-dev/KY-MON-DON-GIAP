// Render only validated structured data. Model text never becomes HTML or a URL.
export function renderReading(answer,data,prepared) {
  const r=data.reading,doc=answer.ownerDocument||document;
  const node=(tag,text,parent,className)=>{const el=doc.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;};
  const prose=(text,parent)=>{for(const paragraph of text.split(/\n\s*\n/).filter(s=>s.trim()))node('p',paragraph.trim(),parent);};
  const list=(title,items)=>{if(!items.length)return;node('h3',title,answer);const ul=node('ul','',answer);for(const s of items)node('li',s,ul);};
  const topic=prepared.context.topics.find(t=>t.id===r.topic_id);
  const palaces=ids=>[...new Set(ids.flatMap(id=>{
    const p=id.match(/^(?:p|c|mix)([1-9])$/);if(p)return [Number(p[1])];
    const role=topic?.focus.roles.find(a=>a.evidenceId===id);if(role)return [role.palace];
    const link=topic?.focus.links.find(a=>a.id===id);return link?[link.fromPalace,link.toPalace]:[];
  }))];
  const evidence=(ids,parent)=>{
    const buttons=node('div','',parent,'ai-evidence-links');
    for(const n of palaces(ids)){
      const button=node('button',`Đối chiếu cung ${n}`,buttons,'jump-cung');button.type='button';
      button.addEventListener('click',()=>{const p=doc.querySelector(`[data-palace="${n}"]`);p?.click();p?.scrollIntoView({block:'center',behavior:'smooth'});});
    }
    const details=node('details','',parent,'ai-evidence');node('summary','Dữ kiện dùng trong đoạn này',details);
    for(const id of ids)node('p',data.facts[id],details);
  };
  answer.replaceChildren();
  node('h3',r.status==='needs_clarification'?'Cần làm rõ trước khi luận':'Nhận định cho sự việc này',answer);
  const opening=node('div','',answer,'ai-opening');prose(r.summary,opening);
  const scope=node('dl','',answer,'ai-scope');
  for(const [key,label] of [['subject','Người và việc'],['objective','Điều cần biết'],['stage','Giai đoạn hiện tại'],['timeframe','Phạm vi thời gian']]){
    const item=node('div','',scope);node('dt',label,item);node('dd',r.scope[key],item);
  }
  list('Phạm vi đang xét',r.assumptions);
  for(const item of r.assessments){
    const section=node('section','',answer,'ai-assessment');node('h3',item.title,section);prose(item.interpretation,section);
    evidence(item.evidence_ids,section);
  }
  if(r.development.length){
    const section=node('section','',answer,'ai-development');node('h3','Diễn biến có thể hình thành',section);
    node('p','Ba chặng dưới đây là giả thuyết có điều kiện từ các tượng đã luận, không phải lịch hẹn xảy ra.',section,'ai-note');
    const stages=node('ol','',section,'ai-stages');
    const stageLabels={current:'Hiện tại',next:'Chuyển biến cần theo dõi',outcome:'Kết quả có điều kiện'};
    for(const step of r.development){
      const item=node('li','',stages);node('span',stageLabels[step.stage],item,'ai-stage-label');node('h4',step.title,item);prose(step.description,item);
      node('p',`Dấu hiệu để đối chiếu: ${step.condition}`,item,'ai-condition');
      node('p','Nối từ: '+step.based_on.map(a=>r.assessments.find(x=>x.aspect===a).title).join(' · '),item,'ai-thread');
      evidence(step.evidence_ids,item);
    }
  }
  if(r.alternatives.length){
    const section=node('section','',answer,'ai-alternatives');node('h3','Khi nào cần đổi cách hiểu?',section);
    for(const alt of r.alternatives){prose(alt.description,section);node('p',`Điều kiện chuyển hướng: ${alt.condition}`,section,'ai-condition');evidence(alt.evidence_ids,section);}
  }
  list('Điều cần làm rõ',r.questions);list('Việc nên kiểm tra tiếp',r.next_steps);
  node('p',`AI · ${data.rules} · Căn cứ khớp bàn; lời diễn giải cần đối chiếu thực tế.`,answer,'ai-note');
  answer.hidden=false;
}
