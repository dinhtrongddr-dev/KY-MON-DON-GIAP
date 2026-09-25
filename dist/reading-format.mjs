export const plainReadingText=text=>text.replace(/\*\*([^*]+)\*\*/g,'$1');
const TECHNICAL_BOLD=/\b(?:cung\s*\d+|(?:khảm|khôn|chấn|tốn|trung|càn|đoài|cấn|ly)\s*[1-9]?|niên can|nhật can|thời can|thiên can|địa can|thiên bàn|địa bàn|bát môn|cửu tinh|bát thần|trực phù|trực sử|phục ngâm|phản ngâm|không vong|tuần không|mã tinh|nhập mộ|kích hình|tứ hại|môn\s*(?:bức|chế|hòa|nghĩa)|hưu môn|sinh môn|thương môn|đỗ môn|cảnh môn|tử môn|kinh môn|khai môn|thiên bồng|thiên nhậm|thiên xung|thiên phụ|thiên anh|thiên nhuế|thiên trụ|thiên tâm|thiên cầm|đằng xà|thái âm|lục hợp|bạch hổ|huyền vũ|cửu địa|cửu thiên|can\s+(?:giáp|ất|bính|đinh|mậu|kỷ|canh|tân|nhâm|quý))\b/iu;
export function formatError(text,{allowComparisonEmphasis=false}={}) {
  if((text.match(/\*\*/g)||[]).length%2||/\*{3,}/.test(text))return 'Dấu tô đậm chưa cân bằng.';
  for(const paragraph of text.split(/\n\s*\n/)){
    const matches=[...paragraph.matchAll(/\*\*([^*]+)\*\*/g)];
    if(matches.some(m=>TECHNICAL_BOLD.test(m[1])))return 'Chỉ tô đậm câu dịch nghĩa tự nhiên; không tô đậm căn cứ kỹ thuật Kỳ Môn.';
    if(matches.length>(allowComparisonEmphasis?3:2)||matches.some(m=>m[1].length>240))return allowComparisonEmphasis?'Chỉ nhấn tối đa ba cụm ngắn trong đoạn so sánh.':'Chỉ nhấn một đến hai cụm ngắn trong mỗi đoạn.';
    if(matches.some(m=>{
      if(/^(?:chắc chắn|đảm bảo)\b/iu.test(m[1]))return true;
      const conditional=/\b(?:Nếu|Có thể|Chưa|Không đủ|Chỉ khi)\b[^.!?]*$/u.test(paragraph.slice(0,m.index));
      if(!conditional||/^(?:Nếu|Có thể|Chưa|Không|Chỉ khi)/u.test(m[1]))return false;
      if(allowComparisonEmphasis&&/\b(?:hạng|xếp|phù hợp|ưu tiên|đồng hạng|ngang nhau)\b/iu.test(m[1]))return false;
      return true;
    }))return 'Phần nhấn cần giữ cả điều kiện và mức chưa chắc chắn.';
  }
  return null;
}
export function formatParts(text,{automatic=true}={}) {
  const parts=[],matches=[...text.matchAll(/\*\*([^*]+)\*\*/g)];
  let end=0;
  if(matches.length){
    for(const m of matches){if(m.index>end)parts.push({text:text.slice(end,m.index),strong:false});parts.push({text:m[1],strong:true});end=m.index+m[0].length;}
  }else if(automatic){
    // Emphasize an intact existing sentence, including its condition; never rewrite it.
    const sentences=[...text.matchAll(/[^.!?\n]+[.!?]?/g)];
    const chosen=sentences.filter(m=>m[0].trim().length>=25&&m[0].trim().length<=220&&/^(?:Chưa|Không đủ|Nếu|Chỉ khi|Cần|Hãy|Bước tiếp|Có thể)/u.test(m[0].trim())&&!TECHNICAL_BOLD.test(m[0])).slice(0,2);
    for(const m of chosen){const start=m.index+m[0].length-m[0].trimStart().length;if(start>end)parts.push({text:text.slice(end,start),strong:false});parts.push({text:m[0].trimStart(),strong:true});end=m.index+m[0].length;}
  }
  if(end<text.length)parts.push({text:text.slice(end),strong:false});
  return parts;
}
export function renderProse(text,parent,doc=parent.ownerDocument||document) {
  const append=(tag,value,root)=>{const node=doc.createElement(tag);node.textContent=value;root.append(node);return node;};
  const inline=(value,node)=>{
    const parts=formatParts(value);
    if(parts.every(p=>!p.strong)){node.textContent=value;return;}
    for(const part of parts){
      const child=append(part.strong?'strong':'span',part.text,node);
      // Emphasis is formatting only; it never classifies evidence.
    }
  };
  for(const block of text.split(/\n\s*\n/)){
    if(!block.trim())continue;
    const lines=block.split('\n');
    const separator=lines.findIndex(line=>/^\s*\|?\s*:?-{3,}:?\s*\|[\s|:\-]*$/.test(line));
    if(separator===1){
      const wrap=append('div','',parent);wrap.className='ai-table-wrap';const table=append('table','',wrap);table.className='ai-prose-table';
      for(const [i,line] of lines.entries()){
        if(i===separator)continue;
        const row=append('tr','',table);
        for(const cell of line.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|'))inline(cell.trim(),append(i===0?'th':'td','',row));
      }
    }else{const p=append('p','',parent);p.className='ai-prose';inline(block,p);}
  }
}

export function mountAiTechnicalToggle(container,doc=container.ownerDocument||document){
  container.classList?.toggle('ai-show-technical',false);
  const bar=doc.createElement('div');bar.className='ai-technical-controls';
  const button=doc.createElement('button');button.type='button';button.className='ai-technical-toggle';
  let shown=false;
  const sync=show=>{
    shown=!!show;
    container.classList?.toggle('ai-show-technical',shown);
    for(const block of container.querySelectorAll?.('.ai-technical-evidence')||[])block.hidden=!shown;
    button.textContent=shown?'Ẩn căn cứ Kỳ Môn':'Hiện căn cứ Kỳ Môn';
    button.setAttribute('aria-pressed',String(shown));
    button.setAttribute('aria-label',shown?'Ẩn các câu thuật ngữ Kỳ Môn trong bài luận':'Hiện các câu thuật ngữ Kỳ Môn trong bài luận');
  };
  sync(false);
  button.addEventListener('click',()=>sync(!shown));
  bar.append(button);container.append(bar);return button;
}

export function renderSurfaceReading(container,reading,{modelUsed}={}){
  const doc=container.ownerDocument||document;
  container.replaceChildren();
  const node=(tag,text,parent,className)=>{
    const e=doc.createElement(tag);e.textContent=text;if(className)e.className=className;parent.append(e);return e;
  };
  if(modelUsed)node('p','Model: '+modelUsed.label+' / '+modelUsed.effort,container,'ai-model-used');
  mountAiTechnicalToggle(container,doc);
  if(reading.status==='verified_fallback')node('p','Phần diễn giải AI chưa đạt kiểm tra. Đây là bản tóm tắt các nhận định đã được xác thực.',container,'ai-fallback-notice');
  const article=node('article','',container,'ai-surface-reading');
  for(const [id,section] of Object.entries(reading.sections)){
    const card=node('section','',article,'ai-surface-section');
    card.dataset.unitId=id;
    node('h3',section.label,card);
    for(const paragraph of section.paragraphs){
      renderProse(paragraph.meaning,card,doc);
      if(paragraph.technicalEvidence){
        const technical=node('div','',card,'ai-technical-evidence');
        technical.hidden=true;
        technical.setAttribute('aria-label','Căn cứ Kỳ Môn cho nhận định này');
        renderProse(paragraph.technicalEvidence,technical,doc);
        // Machine trace stays attached to structured data; not copied into prose.
      }
    }
  }
  node('p',reading.note,container,'ai-note');
}
