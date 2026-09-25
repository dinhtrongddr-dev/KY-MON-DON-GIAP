import {SHARE_ORIGIN} from './site-config.mjs';
import {capturePcReportPages,extractReadingBlocks,writeQuestionPdf} from './question-report.mjs';
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const selectedText=id=>{const el=document.getElementById(id);return clean(el?.selectedOptions?.[0]?.textContent||el?.value);};
const PAGE_W=1240,PAGE_H=1754,MARGIN=82,CONTENT_W=PAGE_W-MARGIN*2,PAGE_BOTTOM=PAGE_H-96;
const COLORS={ink:'#202923',jade:'#173f32',jade2:'#2c6a53',muted:'#647169',line:'#b9c6bf',paper:'#ffffff',wood:'#eaf5ed',fire:'#fff0eb',earth:'#f6f0df',metal:'#f7f4df',water:'#edf4fa',center:'#f2f3ef',gold:'#d5b45c'};
const ELEMENT_BG={wood:COLORS.wood,fire:COLORS.fire,earth:COLORS.earth,metal:COLORS.metal,water:COLORS.water};
function localStamp(){const d=new Date(),two=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}`;}
function slug(value){return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);}
function displayDate(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));return m?`${m[3]}/${m[2]}/${m[1]}`:clean(value);}
function entityByLabel(cell,label){for(const entity of cell.querySelectorAll('.entity')){if(clean(entity.querySelector('.entity-label')?.textContent)===label){const vi=clean(entity.querySelector('.vi')?.textContent),han=clean(entity.querySelector('.han')?.textContent),duty=clean([...entity.querySelectorAll('.duty-badge,.qin-tag')].map(x=>x.textContent).join(' · '));return {vi,han,duty};}}return null;}
function extractBoard(selector){
  const root=document.querySelector(selector);if(!root)return {palaces:[],flags:[]};
  const palaces=[...root.querySelectorAll('.palace')].map(cell=>{
    const number=Number(cell.dataset.palace||cell.querySelector('.palace-number')?.textContent||0),head=cell.querySelector('.palace-head');
    const headStrong=head?.querySelector('strong'),title=clean(headStrong?.textContent)||`Cung ${number}`,subtitle=clean(head?.querySelector(':scope > span:not(.menh-self-badge)')?.textContent);
    const markerText=[...cell.querySelectorAll('.markers .marker')].map(x=>clean(x.textContent)).filter(Boolean);
    const spirit=entityByLabel(cell,'Bát thần'),star=entityByLabel(cell,'Cửu tinh'),heaven=entityByLabel(cell,'Thiên bàn');
    const doorNode=cell.querySelector('.door-token'),earthNode=cell.querySelector('.earth-stem');
    const door=doorNode?{vi:clean(doorNode.querySelector('.vi')?.textContent||doorNode.textContent),han:clean(doorNode.querySelector('.han')?.textContent),duty:clean(doorNode.querySelector('.duty-badge')?.textContent)}:null;
    const earth=earthNode?{vi:clean(earthNode.querySelector('.vi')?.textContent||earthNode.textContent),han:clean(earthNode.querySelector('.han')?.textContent)}:null;
    const centerNote=clean(cell.querySelector('.center-note')?.textContent);
    return {number,title,subtitle,element:cell.dataset.element||'',self:cell.classList.contains('menh-self-palace'),markers:markerText,spirit,star,heaven,door,earth,centerNote};
  }).filter(x=>x.number>=1&&x.number<=9);
  const section=root.closest('.menh-board-section,.board-column,.workspace')||document;
  const flags=[...section.querySelectorAll('.board-flags .flag')].map(x=>clean(x.textContent)).filter(Boolean);
  return {palaces,flags};
}
function textWithoutTechnical(node){const clone=node.cloneNode(true);clone.querySelectorAll('details,button,.ai-trace,.ai-evidence,.ai-model-used,.ai-note,.qimen-json,.ai-tabs').forEach(x=>x.remove());return clean(clone.textContent);}
function richParagraph(node){
  const runs=[];
  for(const child of node.childNodes){const text=child.nodeType===3?child.textContent:child.textContent;if(!text)continue;runs.push({text, bold:child.nodeType===1&&(child.tagName==='STRONG'||child.classList?.contains('menh-ai-focus'))});}
  return runs.length?runs:[{text:clean(node.textContent),bold:false}];
}
export function extractAiSections(kind,doc=document){
  const surface=[...doc.querySelectorAll((kind==='menh'?'#menh-ai-answer ':'#ai-answer ')+'.ai-surface-section')];
  if(surface.length)return surface.map(section=>{
    const copy=section.cloneNode(true);
    copy.querySelectorAll('.ai-technical-evidence[hidden]').forEach(x=>x.remove());
    return {title:clean(copy.querySelector('h3')?.textContent),paragraphs:[...copy.querySelectorAll('p')].map(richParagraph).filter(r=>r.some(x=>clean(x.text)))};
  }).filter(x=>x.paragraphs.length);
  if(kind==='menh')return [...doc.querySelectorAll('#menh-ai-answer .menh-ai-section')].map(s=>({title:clean(s.querySelector('h3')?.textContent),paragraphs:[...s.querySelectorAll('p')].map(richParagraph).filter(r=>r.some(x=>clean(x.text)))})).filter(x=>x.paragraphs.length);
  const labels={quick:'Bài luận',story:'Diễn biến',actions:'Điều cần làm',timing:'Ứng kỳ'};
  return Object.entries(labels).map(([id,title])=>{const node=doc.getElementById(`reading-panel-${id}`);if(!node)return null;const clone=node.cloneNode(true);clone.querySelectorAll('details,button,.ai-trace,.ai-evidence,.ai-model-used,.ai-note,.qimen-json,.ai-tabs').forEach(x=>x.remove());const blocks=[...clone.querySelectorAll('p,li')],paragraphs=(blocks.length?blocks:[clone]).map(richParagraph).filter(r=>r.some(x=>clean(x.text)));return paragraphs.length?{title,paragraphs}:null;}).filter(Boolean);
}
function extractAnalysisSections(kind){if(kind!=='menh')return [];return [...document.querySelectorAll('#menh-deterministic .menh-claim')].map(card=>({title:clean(card.querySelector('.eyebrow')?.textContent),paragraphs:[[{text:clean(card.querySelector('.menh-claim-text')?.textContent),bold:false}]]})).filter(x=>x.paragraphs[0][0].text);}
function inputFields(kind,body){
  if(kind==='menh'){
    const fields=[];if(body.fullName)fields.push({label:'Họ và tên',value:body.fullName});if(body.birthPlace)fields.push({label:'Nơi sinh',value:body.birthPlace});
    fields.push({label:'Ngày sinh',value:displayDate(body.birthDateLocal)});fields.push({label:'Giờ sinh',value:body.birthTimeMode==='KNOWN'?(body.birthTimeLocal||'Không rõ'):'Không nhớ giờ sinh'});fields.push({label:'Múi giờ',value:body.timePlace?.mode==='iana_civil'?(body.timePlace.timeZone||'IANA'):selectedText('menh-timezone')});if(body.timePlace?.longitude!=null)fields.push({label:'Kinh độ',value:String(body.timePlace.longitude)});if(body.timePlace?.latitude!=null)fields.push({label:'Vĩ độ',value:String(body.timePlace.latitude)});
    if(body.sexMetadata)fields.push({label:'Giới tính',value:selectedText('menh-sex')});if(body.age!=null)fields.push({label:'Tuổi đang xét',value:String(body.age)});if(body.annualYear!=null)fields.push({label:'Năm lưu niên',value:String(body.annualYear)});return fields;
  }
  const zone=body.timePlace?.mode==='iana_civil'?body.timePlace.timeZone:selectedText('timezone');
  return [{label:'Sự việc cần hỏi',value:body.question},{label:'Nhóm sự việc',value:selectedText('topic')},{label:'Chế độ luận',value:selectedText('qimen-mode')},{label:'Thời điểm lập bàn',value:clean(document.getElementById('datetime')?.value)},{label:'Múi giờ',value:zone},{label:'Kinh độ',value:body.timePlace?.longitude!=null?String(body.timePlace.longitude):''},{label:'Vĩ độ',value:body.timePlace?.latitude!=null?String(body.timePlace.latitude):''},{label:'Pháp định cục',value:selectedText('method')}].filter(x=>x.value);
}
function filenameBase(kind,body){return kind==='menh'?`ky-mon-ban-menh-${slug(body.fullName||body.birthDateLocal||'bao-cao')}-${localStamp()}`:`ky-mon-ban-hoi-viec-${localStamp()}`;}
function captureMenhVisual(){
  const root=document.getElementById('menh-deterministic'),workspace=root?.querySelector('.menh-workspace'),chartMeta=root?.querySelector('.menh-chart-meta');
  if(!root||!workspace||!chartMeta)throw new Error('Chưa có Mệnh bàn để xuất PDF.');
  const selected=workspace.querySelector('.palace.is-selected'),self=workspace.querySelector('.palace.menh-self-palace'),clone=node=>node?.cloneNode(true);
  try{
    if(self&&self!==selected)self.click();
    const resultHead=clone(root.querySelector('.menh-result-head')),profile=document.createElement('p');
    profile.className='question-summary';
    const name=clean(document.getElementById('birth-name')?.value),place=clean(document.getElementById('birth-place')?.value),date=clean(document.getElementById('birth-date')?.value),time=clean(document.getElementById('birth-time')?.value);
    profile.textContent=['Hồ sơ Mệnh'+(name?' · '+name:''),place,date+(time?' · '+time:'')].filter(Boolean).join(' · ');
    resultHead?.append(profile);
    const inspector=clone(workspace.querySelector('.menh-inspector'));if(!inspector)throw new Error('Thiếu phần luận tượng cung Mệnh.');
    inspector.classList.add('export-role');inspector.querySelectorAll('details').forEach(node=>node.open=true);
    const basis=document.createElement('article');basis.className='export-role';const heading=document.createElement('h2');heading.textContent='CĂN CỨ MỆNH · PHƯƠNG PHÁP';basis.append(heading);
    const method=clone(root.querySelector('.menh-method-details'));if(method){method.open=true;basis.append(method);}
    const basisDetails=clone(root.querySelector('.menh-basis-details'));if(basisDetails){basisDetails.open=false;basis.append(basisDetails);}
    const snapshot={header:clone(document.querySelector('.topbar')),question:resultHead,pillars:clone(chartMeta.querySelector('.pillars')),summary:clone(chartMeta.querySelector('.calculation-summary')),board:clone(workspace.querySelector('.menh-board-section')),elements:clone(workspace.querySelector(':scope > .element-panel')),roles:[inspector,basis]};
    if(!snapshot.question||!snapshot.pillars||!snapshot.summary||!snapshot.board||!snapshot.elements)throw new Error('Thiếu thành phần Mệnh bàn để xuất PDF.');
    return snapshot;
  }finally{if(selected&&self&&self!==selected)selected.click();}
}
function pdfReport(kind,body,model,boardSelector){return {title:'Kỳ Môn Bàn',reportType:kind==='menh'?'Mệnh':'Hỏi việc',generatedAt:new Date().toLocaleString('vi-VN'),filenameBase:filenameBase(kind,body),model,inputFields:inputFields(kind,body),board:extractBoard(boardSelector),analysisSections:extractAnalysisSections(kind),aiSections:extractAiSections(kind)};}
function extractContextSections(kind){
  const rows=[];
  const add=(title,node)=>{if(!node)return;const value=textWithoutTechnical(node);if(value)rows.push({title,text:value});};
  if(kind==='menh'){
    add('Luận tượng cung bản mệnh',document.querySelector('#menh-deterministic .menh-inspector'));
    add('Quan hệ Ngũ hành',document.querySelector('#menh-deterministic .element-panel'));
    const method=document.querySelector('#menh-deterministic .menh-method-details');if(method){const value=clean(method.textContent);if(value)rows.push({title:'Quy tắc và thời điểm sinh',text:value});}
  }else{
    add('Luận tượng cung đang xem',document.querySelector('#result .inspector'));
    add('Quan hệ Ngũ hành',document.querySelector('#result .element-panel'));
  }
  return rows;
}

function captureAppSnapshot(kind){
  const root=document.querySelector(kind==='menh'?'#menh-result':'#result');
  if(!root)throw new Error('Chưa có kết quả để chia sẻ.');
  const clone=root.cloneNode(true);
  clone.querySelectorAll('.local-controls,.local-preference,.ai-feedback,.activity-summary,.activity-history,#local-setup,#rule-analyze,#rule-preview,.report-pdf-button,.share-result-link').forEach(node=>node.remove());
  clone.querySelectorAll('script').forEach(node=>node.remove());
  clone.querySelectorAll('*').forEach(node=>{
    for(const attr of [...node.attributes]){
      const name=attr.name.toLowerCase(),value=String(attr.value||'').trim().toLowerCase();
      if(name.startsWith('on')||(name==='href'&&value.startsWith('javascript:'))||(name==='src'&&value.startsWith('javascript:')))node.removeAttribute(attr.name);
    }
  });
  return {version:1,className:root.className,html:clone.innerHTML};
}
export function buildSharePayload(kind,body,model,boardSelector){
  const report=pdfReport(kind,body,model,boardSelector);
  report.contextSections=extractContextSections(kind);
  return {schemaVersion:'QimenShare/1',kind,report,snapshot:captureAppSnapshot(kind)};
}
function shareApiEndpoint(){
  const host=String(globalThis.location?.hostname||'').toLowerCase();
  if(host==='127.0.0.1'||host==='localhost'||host.endsWith('.trycloudflare.com'))return (globalThis.location?.origin||'')+'/api/share';
  return SHARE_ORIGIN+'/api/share';
}
async function requestShare(payload,token){
  if(!token)throw new Error('Nhập mã kết nối AI trước khi tạo link chia sẻ.');
  const response=await fetch(shareApiEndpoint(),{method:'POST',headers:{'Content-Type':'application/json','X-Qimen-Token':token},body:JSON.stringify(payload),credentials:'omit',cache:'no-store'});
  let data;try{data=await response.json();}catch{throw new Error('Máy chủ chia sẻ trả dữ liệu không đọc được.');}
  if(!response.ok||!data?.url)throw new Error(data?.error||'Không tạo được link chia sẻ.');
  return data;
}
function makeCanvas(){const canvas=document.createElement('canvas');canvas.width=PAGE_W;canvas.height=PAGE_H;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,PAGE_W,PAGE_H);ctx.textBaseline='top';return {canvas,ctx,y:MARGIN};}
function font(ctx,size,weight=400){ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif`;}
function setFont(ctx,size,bold){font(ctx,size,bold?750:400);}
function wordsFromRuns(runs){const out=[];for(const run of runs||[]){for(const part of String(run.text||'').split(/(\s+)/)){if(!part)continue;out.push({text:part,bold:Boolean(run.bold),space:/^\s+$/.test(part)});}}return out;}
export function canvasReport(report,{createPage=makeCanvas}={}){
  const pages=[];let page=createPage();
  const finishPage=()=>{font(page.ctx,18,500);page.ctx.fillStyle='#718079';page.ctx.fillText(`Kỳ Môn Bàn · trang ${pages.length+1}`,MARGIN,PAGE_H-48);pages.push(page.canvas);};
  const nextPage=()=>{finishPage();page=createPage();};
  const need=h=>{if(page.y+h>PAGE_BOTTOM)nextPage();};
  const drawPlain=(text,opt={})=>drawRich([{text:String(text??''),bold:Boolean(opt.weight&&opt.weight>=650)}],opt);
  const drawRich=(runs,{size=25,color=COLORS.ink,gap=12,indent=0,maxWidth=CONTENT_W,lineHeight=Math.round(size*1.42)}={})=>{
    const tokens=wordsFromRuns(runs),left=MARGIN+indent,width=maxWidth-indent;let line=[],lineW=0;
    const tokenW=t=>{setFont(page.ctx,size,t.bold);return page.ctx.measureText(t.text).width;};
    const flush=()=>{if(!line.length)return;need(lineHeight);let x=left;for(const t of line){setFont(page.ctx,size,t.bold);page.ctx.fillStyle=color;page.ctx.fillText(t.text,x,page.y);x+=tokenW(t);}page.y+=lineHeight;line=[];lineW=0;};
    for(const token of tokens){const w=tokenW(token);if(!token.space&&line.length&&lineW+w>width)flush();if(token.space&&!line.length)continue;line.push(token);lineW+=w;}
    flush();page.y+=gap;
  };
  const heading=text=>{need(82);drawPlain(text,{size:29,weight:750,color:COLORS.jade,gap:6});page.ctx.strokeStyle='#cbd6d0';page.ctx.lineWidth=1;page.ctx.beginPath();page.ctx.moveTo(MARGIN,page.y);page.ctx.lineTo(PAGE_W-MARGIN,page.y);page.ctx.stroke();page.y+=18;};
  const sectionTitle=text=>{need(92);drawPlain(text,{size:25,weight:750,color:COLORS.jade,gap:7});};
  const drawParagraphs=(paragraphs,{size=21,gap=16}={})=>{for(const runs of paragraphs||[])drawRich(runs,{size,gap});};

  font(page.ctx,46,750);page.ctx.fillStyle=COLORS.jade;page.ctx.fillText(report.title,MARGIN,page.y);page.y+=62;drawPlain(`${report.reportType} · ${report.generatedAt}`,{size:23,color:COLORS.muted,gap:18});
  heading('Thông tin nhập vào');for(const item of report.inputFields)drawRich([{text:`${item.label}: `,bold:true},{text:String(item.value),bold:false}],{size:22,gap:8});

  heading('Bàn Kỳ Môn');
  const order=[4,9,2,3,5,7,8,1,6],byNumber=new Map((report.board.palaces||[]).map(x=>[Number(x.number),x])),cellW=CONTENT_W/3,cellH=238,boardH=cellH*3;need(boardH+64);const top=page.y;
  const drawMini=(ctx,label,value,x,y,w,{bold=false,color=COLORS.ink}={})=>{if(!value)return y;font(ctx,13,700);ctx.fillStyle=COLORS.muted;ctx.fillText(label,x,y);font(ctx,16,bold?750:500);ctx.fillStyle=color;const lines=[];let cur='';for(const word of String(value).split(/\s+/)){const next=cur?cur+' '+word:word;if(ctx.measureText(next).width<=w)cur=next;else{if(cur)lines.push(cur);cur=word;}}if(cur)lines.push(cur);ctx.fillText(lines[0]||'',x,y+17);return y+39;};
  for(let i=0;i<9;i++){
    const n=order[i],item=byNumber.get(n)||{number:n,title:`Cung ${n}`,subtitle:'',element:'',markers:[]},col=i%3,row=Math.floor(i/3),x=MARGIN+col*cellW,y=top+row*cellH,bg=item.number===5?COLORS.center:(ELEMENT_BG[item.element]||'#f7f9f7');
    page.ctx.fillStyle=bg;page.ctx.fillRect(x,y,cellW,cellH);page.ctx.strokeStyle=item.self?COLORS.jade:'#9eaaa4';page.ctx.lineWidth=item.self?6:2;page.ctx.strokeRect(x+1,y+1,cellW-2,cellH-2);
    page.ctx.fillStyle=item.self?COLORS.jade:'rgba(23,63,50,.08)';page.ctx.fillRect(x+2,y+2,cellW-4,38);
    font(page.ctx,19,800);page.ctx.fillStyle=item.self?'#fff':COLORS.jade;page.ctx.fillText(item.title,x+10,y+9);
    font(page.ctx,13,600);page.ctx.fillStyle=COLORS.muted;page.ctx.fillText(item.subtitle||'',x+10,y+46);
    if(item.markers?.length){font(page.ctx,12,750);page.ctx.fillStyle='#8a641c';page.ctx.fillText(item.markers.join(' · '),x+10,y+65);}
    if(item.number===5){font(page.ctx,31,800);page.ctx.fillStyle=COLORS.jade;page.ctx.fillText('奇 門',x+cellW/2-37,y+100);font(page.ctx,14,600);page.ctx.fillStyle=COLORS.muted;page.ctx.fillText(item.centerNote||'Trung tâm Mệnh bàn',x+12,y+148);if(item.earth?.vi)drawMini(page.ctx,'Địa bàn',item.earth.vi,x+12,y+177,cellW-24,{bold:true});}
    else{
      let yy=y+86;yy=drawMini(page.ctx,'Bát thần',item.spirit?.vi,x+12,yy,cellW-24);yy=drawMini(page.ctx,'Cửu tinh',`${item.star?.vi||''}${item.star?.duty?' · '+item.star.duty:''}`,x+12,yy,cellW-24,{bold:Boolean(item.star?.duty),color:item.star?.duty?COLORS.jade:COLORS.ink});yy=drawMini(page.ctx,'Thiên bàn',item.heaven?.vi,x+12,yy,cellW-24);
      const footY=y+cellH-50;font(page.ctx,13,700);page.ctx.fillStyle=COLORS.muted;page.ctx.fillText('Bát môn',x+12,footY);page.ctx.fillText('Địa bàn',x+cellW*.62,footY);font(page.ctx,16,item.door?.duty?800:650);page.ctx.fillStyle=item.door?.duty?COLORS.jade:COLORS.ink;page.ctx.fillText(`${item.door?.vi||'—'}${item.door?.duty?' ★':''}`,x+12,footY+17);font(page.ctx,16,650);page.ctx.fillStyle=COLORS.ink;page.ctx.fillText(item.earth?.vi||'—',x+cellW*.62,footY+17);
    }
    if(item.self){page.ctx.fillStyle=COLORS.jade;page.ctx.fillRect(x+2,y+cellH-26,cellW-4,24);font(page.ctx,12,800);page.ctx.fillStyle='#fff';page.ctx.fillText('BẢN MỆNH · BẠN Ở ĐÂY',x+10,y+cellH-22);}
  }
  page.y=top+boardH+16;
  if(report.board.flags?.length){font(page.ctx,16,650);let x=MARGIN;for(const flag of report.board.flags){const w=page.ctx.measureText(flag).width+24;if(x+w>PAGE_W-MARGIN){page.y+=30;x=MARGIN;}page.ctx.fillStyle='#f4f7f4';page.ctx.fillRect(x,page.y,w,25);page.ctx.strokeStyle=COLORS.line;page.ctx.strokeRect(x,page.y,w,25);page.ctx.fillStyle=COLORS.jade;page.ctx.fillText(flag,x+10,page.y+4);x+=w+8;}page.y+=39;}

  if(report.analysisSections.length){heading('Luận giải');for(const section of report.analysisSections){sectionTitle(section.title);drawParagraphs(section.paragraphs,{size:20,gap:15});}}
  if(report.aiSections.length){heading('Bài luận AI');if(report.model)drawRich([{text:'Model: ',bold:true},{text:report.model,bold:true}],{size:20,color:'#325244',gap:14});for(const section of report.aiSections){sectionTitle(section.title);drawParagraphs(section.paragraphs,{size:21,gap:18});}}
  drawPlain('Nội dung dùng để tham khảo và đối chiếu; không thay thế tư vấn chuyên môn trong các lĩnh vực cần chuyên gia.',{size:17,color:'#6f7a75',gap:0});finishPage();return pages;
}
function bytesFromDataUrl(url){const binary=atob(url.split(',')[1]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function ascii(value){return new TextEncoder().encode(value);}
function concat(parts){const length=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(length);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
export function buildImagePdf(canvases){
  const images=canvases.map(canvas=>({bytes:bytesFromDataUrl(canvas.toDataURL('image/jpeg',.92)),width:canvas.width,height:canvas.height}));
  const objects=[null],pageIds=[],contentIds=[],imageIds=[];let next=3;
  for(let i=0;i<images.length;i++){pageIds.push(next++);contentIds.push(next++);imageIds.push(next++);}objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');objects[2]=ascii(`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`);
  images.forEach((img,i)=>{const p=pageIds[i],c=contentIds[i],im=imageIds[i],stream=`q 595 0 0 842 0 0 cm /Im${i+1} Do Q`;objects[p]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i+1} ${im} 0 R >> >> /Contents ${c} 0 R >>`);objects[c]=ascii(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);objects[im]=concat([ascii(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`),img.bytes,ascii('\nendstream')]);});
  const parts=[ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offsets=[0];let offset=parts[0].length;for(let id=1;id<objects.length;id++){offsets[id]=offset;const part=concat([ascii(`${id} 0 obj\n`),objects[id],ascii('\nendobj\n')]);parts.push(part);offset+=part.length;}const xref=offset;let table=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)table+=`${String(offsets[id]).padStart(10,'0')} 00000 n \n`;table+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(ascii(table));return new Blob(parts,{type:'application/pdf'});
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);}
export function initPdfExport({kind,buttonId,statusId,prepare,boardSelector,captureReportVisual}){
  const button=document.getElementById(buttonId),status=document.getElementById(statusId);let model='',preparedContext=null;
  if(!button)return {setModel(){},clear(){}};
  const shareLink=document.createElement('a');shareLink.className='share-result-link';shareLink.hidden=true;shareLink.target='_blank';shareLink.rel='noopener noreferrer';shareLink.textContent='Mở link chia sẻ';button.insertAdjacentElement('afterend',shareLink);
  const clear=()=>{model='';preparedContext=null;button.hidden=true;shareLink.hidden=true;shareLink.removeAttribute('href');};
  const setModel=(modelUsed,prepared)=>{model=modelUsed?(modelUsed.label+' / '+modelUsed.effort):'';preparedContext=prepared;button.hidden=false;};
  button.addEventListener('click',async()=>{
    let body;const exactPrepared=preparedContext;
    try{
      if(kind==='question'){if(!exactPrepared)throw new Error('Hãy luận bằng AI trước khi chia sẻ.');body=exactPrepared.request;}
      else body=prepare();
    }catch(e){status.textContent=e.message;return;}
    const token=clean(document.getElementById('local-token')?.value);
    button.disabled=true;const before=status.textContent;status.textContent='Đang tạo link chia sẻ…';
    try{
      const data=await requestShare(buildSharePayload(kind,body,model,boardSelector),token);
      shareLink.href=data.url;shareLink.hidden=false;
      if(navigator.share){
        try{await navigator.share({title:'Kỳ Môn Bàn',text:'Xem kết quả Kỳ Môn đã chia sẻ',url:data.url});status.textContent='Đã mở bảng chia sẻ link.';}
        catch(e){status.textContent='Link đã tạo. Bấm Mở link chia sẻ để xem.';}
      }else{
        let copied=false;try{await navigator.clipboard?.writeText(data.url);copied=true;}catch{}
        status.textContent=copied?'Đã sao chép link chia sẻ.':'Link đã tạo. Bấm Mở link chia sẻ để xem.';
      }
    }catch(e){status.textContent=e.message||'Không tạo được link chia sẻ.';shareLink.hidden=true;}
    finally{button.disabled=false;if(!status.textContent)status.textContent=before;}
  });
  return {setModel,clear};
}

export function initPdfDownload({kind,buttonId,statusId,captureReportVisual,capturePages=capturePcReportPages,extractBlocks=extractReadingBlocks,writePdf=writeQuestionPdf,downloadFile=download}){
  const button=document.getElementById(buttonId),status=document.getElementById(statusId);let model='',preparedContext=null,generation=0;
  if(!button)return {setModel(){},clear(){}};
  const setStatus=value=>{if(status)status.textContent=value;};
  const clear=()=>{generation++;model='';preparedContext=null;button.hidden=true;};
  const setModel=(modelUsed,prepared)=>{generation++;model=modelUsed?`${modelUsed.label} / ${modelUsed.effort}`:'';preparedContext=prepared;button.hidden=false;};
  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    const exactPrepared=preparedContext,exactModel=model,version=generation;
    if(!exactPrepared){setStatus('Hãy luận bằng AI trước khi xuất PDF.');return;}
    const answer=document.getElementById(kind==='menh'?'menh-ai-answer':'ai-answer');
    if(!answer){setStatus('Chưa có bài luận AI để xuất PDF.');return;}
    button.disabled=true;const before=status?.textContent||'';setStatus('Đang tạo file PDF…');
    try{
      const blocks=extractBlocks(answer);
      const source=document.getElementById(kind==='menh'?'menh-result':'result')?.cloneNode?.(true);
      const visual=captureReportVisual?.(exactPrepared);
      const pages=await capturePages(kind,{includeReading:false,...(source?{source}:{}),...(visual?{visual}:{})});
      if(version!==generation)return;
      const blob=await writePdf({pages,blocks,model:exactModel,prepared:exactPrepared});
      if(version!==generation)return;
      const name=`ky-mon-ban-${kind==='menh'?'menh':'hoi-viec'}.pdf`;
      downloadFile(blob,name);setStatus('Đã tải file PDF về máy.');
    }catch(error){if(version===generation)setStatus(error?.message||'Không tạo được PDF.');}
    finally{button.disabled=false;if(version===generation&&!status?.textContent)setStatus(before);}
  });
  return {setModel,clear};
}
