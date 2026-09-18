export const plainReadingText=text=>text.replace(/\*\*([^*]+)\*\*/g,'$1');
export function formatError(text,{allowComparisonEmphasis=false}={}) {
  if((text.match(/\*\*/g)||[]).length%2||/\*{3,}/.test(text))return 'Dấu tô đậm chưa cân bằng.';
  for(const paragraph of text.split(/\n\s*\n/)){
    const matches=[...paragraph.matchAll(/\*\*([^*]+)\*\*/g)];
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
    const chosen=sentences.filter(m=>m[0].trim().length>=25&&m[0].trim().length<=220&&/^(?:Chưa|Không đủ|Nếu|Chỉ khi|Cần|Hãy|Bước tiếp|Có thể)/u.test(m[0].trim())).slice(0,2);
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
    for(const part of parts)append(part.strong?'strong':'span',part.text,node);
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
