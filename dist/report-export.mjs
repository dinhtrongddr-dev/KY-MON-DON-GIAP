const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const selectedText=id=>{const el=document.getElementById(id);return clean(el?.selectedOptions?.[0]?.textContent||el?.value);};
const PAGE_W=1240,PAGE_H=1754,MARGIN=82,CONTENT_W=PAGE_W-MARGIN*2;
function localStamp(){const d=new Date(),two=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}`;}
function slug(value){return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);}
function stripHan(value){return clean(value).replace(/[\u3400-\u9fff]/g,'').replace(/\s*·\s*·/g,' · ').replace(/^\s*·|·\s*$/g,'').trim();}
function extractBoard(selector){
  const root=document.querySelector(selector);if(!root)return {palaces:[],flags:[]};
  const palaces=[...root.querySelectorAll('.palace')].map(cell=>{
    const number=Number(cell.dataset.palace||cell.querySelector('.palace-number')?.textContent||0),head=cell.querySelector('.palace-head');
    const title=stripHan(head?.querySelector('strong')?.textContent)||`Cung ${number}`,subtitle=stripHan(head?.querySelector('span:last-child')?.textContent),lines=[];
    const markers=clean([...cell.querySelectorAll('.marker,.menh-self-badge,.role-symbol')].map(x=>x.textContent).join(' · '));if(markers)lines.push(markers);
    for(const entity of cell.querySelectorAll('.entity')){
      const label=clean(entity.querySelector('.entity-label')?.textContent),vi=clean(entity.querySelector('.vi')?.textContent);if(vi)lines.push(label?`${label}: ${vi}`:vi);
    }
    const door=cell.querySelector('.door-token .vi')||cell.querySelector('.door-token');if(door)lines.push(`Bát môn: ${stripHan(door.textContent)}`);
    const earth=cell.querySelector('.earth-stem .vi')||cell.querySelector('.earth-stem');if(earth)lines.push(`Địa bàn: ${stripHan(earth.textContent)}`);
    if(number===5&&!lines.length)lines.push('Trung tâm Mệnh bàn');
    return {number,title,subtitle,lines:[...new Set(lines)].filter(Boolean)};
  }).filter(x=>x.number>=1&&x.number<=9);
  const section=root.closest('.menh-board-section,.board-column,.workspace')||document;
  const flags=[...section.querySelectorAll('.board-flags .flag')].map(x=>clean(x.textContent)).filter(Boolean);
  return {palaces,flags};
}
function textWithoutTechnical(node){
  const clone=node.cloneNode(true);
  clone.querySelectorAll('details,button,.ai-trace,.ai-evidence,.ai-model-used,.ai-note,.qimen-json,.ai-tabs').forEach(x=>x.remove());
  return clean(clone.textContent);
}
function extractAiSections(kind){
  if(kind==='menh')return [...document.querySelectorAll('#menh-ai-answer .menh-ai-section')].map(s=>({title:clean(s.querySelector('h3')?.textContent),text:clean([...s.querySelectorAll('p')].map(x=>x.textContent).join('\n\n'))})).filter(x=>x.text);
  const labels={quick:'Bài luận',story:'Diễn biến',actions:'Điều cần làm',timing:'Ứng kỳ'};
  return Object.entries(labels).map(([id,title])=>{const node=document.getElementById(`reading-panel-${id}`);return node?{title,text:textWithoutTechnical(node)}:null;}).filter(x=>x?.text);
}
function extractAnalysisSections(kind){
  if(kind!=='menh')return [];
  return [...document.querySelectorAll('#menh-deterministic .menh-claim')].map(card=>({title:clean(card.querySelector('.eyebrow')?.textContent),text:clean(card.querySelector('.menh-claim-text')?.textContent)})).filter(x=>x.text);
}
function inputFields(kind,body){
  if(kind==='menh'){
    const fields=[];if(body.fullName)fields.push({label:'Họ và tên',value:body.fullName});if(body.birthPlace)fields.push({label:'Nơi sinh',value:body.birthPlace});
    fields.push({label:'Ngày sinh',value:body.birthDateLocal});fields.push({label:'Giờ sinh',value:body.birthTimeMode==='KNOWN'?(body.birthTimeLocal||'Không rõ'):'Không nhớ giờ sinh'});fields.push({label:'Múi giờ',value:selectedText('menh-timezone')});
    if(body.sexMetadata)fields.push({label:'Giới tính',value:selectedText('menh-sex')});if(body.age!=null)fields.push({label:'Tuổi đang xét',value:String(body.age)});if(body.annualYear!=null)fields.push({label:'Năm lưu niên',value:String(body.annualYear)});return fields;
  }
  return [{label:'Sự việc cần hỏi',value:body.question},{label:'Nhóm sự việc',value:selectedText('topic')},{label:'Chế độ luận',value:selectedText('qimen-mode')},{label:'Thời điểm lập bàn',value:clean(document.getElementById('datetime')?.value)},{label:'Múi giờ',value:selectedText('timezone')},{label:'Pháp định cục',value:selectedText('method')}].filter(x=>x.value);
}
function filenameBase(kind,body){return kind==='menh'?`ky-mon-ban-menh-${slug(body.fullName||body.birthDateLocal||'bao-cao')}-${localStamp()}`:`ky-mon-ban-hoi-viec-${localStamp()}`;}
function pdfReport(kind,body,model,boardSelector){return {title:'Kỳ Môn Bàn',reportType:kind==='menh'?'Mệnh':'Hỏi việc',generatedAt:new Date().toLocaleString('vi-VN'),filenameBase:filenameBase(kind,body),model,inputFields:inputFields(kind,body),board:extractBoard(boardSelector),analysisSections:extractAnalysisSections(kind),aiSections:extractAiSections(kind)};}
function makeCanvas(){const canvas=document.createElement('canvas');canvas.width=PAGE_W;canvas.height=PAGE_H;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,PAGE_W,PAGE_H);ctx.textBaseline='top';return {canvas,ctx,y:MARGIN};}
function font(ctx,size,weight=400){ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif`;}
function wrappedLines(ctx,text,maxWidth){
  const lines=[];for(const paragraph of String(text||'').split(/\n+/)){const words=paragraph.split(/\s+/).filter(Boolean);if(!words.length){lines.push('');continue;}let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width<=maxWidth)line=next;else{if(line)lines.push(line);line=word;}}if(line)lines.push(line);}return lines;
}
function canvasReport(report){
  const pages=[];let page=makeCanvas();
  const finishPage=()=>{font(page.ctx,18,500);page.ctx.fillStyle='#718079';page.ctx.fillText(`Kỳ Môn Bàn · trang ${pages.length+1}`,MARGIN,PAGE_H-48);pages.push(page.canvas);};
  const nextPage=()=>{finishPage();page=makeCanvas();};
  const need=h=>{if(page.y+h>PAGE_H-95)nextPage();};
  const drawText=(text,{size=25,weight=400,color='#202923',gap=12,indent=0,maxWidth=CONTENT_W}={})=>{font(page.ctx,size,weight);page.ctx.fillStyle=color;const lines=wrappedLines(page.ctx,text,maxWidth-indent),lineHeight=Math.round(size*1.42);need(lines.length*lineHeight+gap);for(const line of lines){page.ctx.fillText(line,MARGIN+indent,page.y);page.y+=lineHeight;}page.y+=gap;};
  const heading=text=>{need(55);drawText(text,{size:29,weight:700,color:'#173f32',gap:6});page.ctx.strokeStyle='#cbd6d0';page.ctx.beginPath();page.ctx.moveTo(MARGIN,page.y);page.ctx.lineTo(PAGE_W-MARGIN,page.y);page.ctx.stroke();page.y+=18;};
  font(page.ctx,46,750);page.ctx.fillStyle='#173f32';page.ctx.fillText(report.title,MARGIN,page.y);page.y+=62;drawText(`${report.reportType} · ${report.generatedAt}`,{size:23,color:'#607069',gap:18});
  heading('Thông tin nhập vào');for(const item of report.inputFields){drawText(`${item.label}: ${item.value}`,{size:22,weight:item.label==='Sự việc cần hỏi'?600:400,gap:8});}
  heading('Bàn Kỳ Môn');
  const order=[4,9,2,3,5,7,8,1,6],byNumber=new Map(report.board.palaces.map(x=>[Number(x.number),x])),cellW=CONTENT_W/3,cellH=210,boardH=cellH*3;need(boardH+45);const top=page.y;
  for(let i=0;i<9;i++){
    const n=order[i],item=byNumber.get(n)||{number:n,title:`Cung ${n}`,subtitle:'',lines:[]},col=i%3,row=Math.floor(i/3),x=MARGIN+col*cellW,y=top+row*cellH;
    page.ctx.strokeStyle='#9ca9a2';page.ctx.lineWidth=2;page.ctx.strokeRect(x,y,cellW,cellH);font(page.ctx,20,700);page.ctx.fillStyle='#173f32';page.ctx.fillText(item.title,x+12,y+10);font(page.ctx,16,500);page.ctx.fillStyle='#647169';page.ctx.fillText(item.subtitle,x+12,y+38);
    font(page.ctx,16,400);page.ctx.fillStyle='#222b26';let yy=y+68;for(const raw of item.lines.slice(0,6)){for(const line of wrappedLines(page.ctx,raw,cellW-24).slice(0,2)){page.ctx.fillText(line,x+12,yy);yy+=21;if(yy>y+cellH-20)break;}if(yy>y+cellH-20)break;}
  }
  page.y=top+boardH+18;if(report.board.flags?.length)drawText(report.board.flags.join(' · '),{size:19,color:'#56645d',gap:14});
  if(report.analysisSections.length){heading('Luận giải');for(const section of report.analysisSections){if(section.title)drawText(section.title,{size:24,weight:700,color:'#173f32',gap:4});drawText(section.text,{size:21,gap:16});}}
  if(report.aiSections.length){heading('Bài luận AI');if(report.model)drawText(`Model: ${report.model}`,{size:20,weight:650,color:'#325244',gap:14});for(const section of report.aiSections){if(section.title)drawText(section.title,{size:25,weight:700,color:'#173f32',gap:5});drawText(section.text,{size:21,gap:18});}}
  drawText('Nội dung dùng để tham khảo và đối chiếu; không thay thế tư vấn chuyên môn trong các lĩnh vực cần chuyên gia.',{size:17,color:'#6f7a75',gap:0});finishPage();return pages;
}
function bytesFromDataUrl(url){const binary=atob(url.split(',')[1]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function ascii(value){return new TextEncoder().encode(value);}
function concat(parts){const length=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(length);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
export function buildImagePdf(canvases){
  const images=canvases.map(canvas=>({bytes:bytesFromDataUrl(canvas.toDataURL('image/jpeg',.9)),width:canvas.width,height:canvas.height}));
  const objects=[null],pageIds=[],contentIds=[],imageIds=[];let next=3;
  for(let i=0;i<images.length;i++){pageIds.push(next++);contentIds.push(next++);imageIds.push(next++);}objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');objects[2]=ascii(`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`);
  images.forEach((img,i)=>{
    const p=pageIds[i],c=contentIds[i],im=imageIds[i],stream=`q 595 0 0 842 0 0 cm /Im${i+1} Do Q`;
    objects[p]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i+1} ${im} 0 R >> >> /Contents ${c} 0 R >>`);
    objects[c]=ascii(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects[im]=concat([ascii(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`),img.bytes,ascii('\nendstream')]);
  });
  const parts=[ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offsets=[0];let offset=parts[0].length;
  for(let id=1;id<objects.length;id++){offsets[id]=offset;const part=concat([ascii(`${id} 0 obj\n`),objects[id],ascii('\nendobj\n')]);parts.push(part);offset+=part.length;}
  const xref=offset;let table=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)table+=`${String(offsets[id]).padStart(10,'0')} 00000 n \n`;table+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  parts.push(ascii(table));return new Blob(parts,{type:'application/pdf'});
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
export function initPdfExport({kind,buttonId,statusId,prepare,boardSelector}){
  const button=document.getElementById(buttonId),status=document.getElementById(statusId);let model='';if(!button)return {setModel(){},clear(){}};
  const clear=()=>{model='';button.hidden=true;},setModel=modelUsed=>{model=modelUsed?`${modelUsed.label} / ${modelUsed.effort}`:'';button.hidden=false;};
  button.addEventListener('click',async()=>{let body;try{body=prepare();}catch(e){status.textContent=e.message;return;}button.disabled=true;const before=status.textContent;status.textContent='Đang tạo file PDF…';
    try{const report=pdfReport(kind,body,model,boardSelector),blob=buildImagePdf(canvasReport(report)),name=report.filenameBase+'.pdf',file=new File([blob],name,{type:'application/pdf'});
      if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:'Kỳ Môn Bàn',text:'Báo cáo Kỳ Môn Bàn',files:[file]});status.textContent='Đã mở bảng chia sẻ PDF.';}catch(e){if(e.name==='AbortError')status.textContent=before;else{download(blob,name);status.textContent='Đã tạo và tải file PDF.';}}}
      else{download(blob,name);status.textContent='Đã tạo và tải file PDF.';}
    }catch(e){status.textContent=e.message||'Không tạo được PDF.';}finally{button.disabled=false;}});
  return {setModel,clear};
}
