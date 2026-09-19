const WIDTH=900,SCALE=2;
const EXCLUDED='button,.ai-trace,.ai-evidence,.ai-model-used,.ai-note,.qimen-json,.ai-tabs,#reading-panel-technical';

// Read only already-validated rendered prose; never parse model HTML or broaden bold rules.
export function extractReadingBlocks(answer){
  if(!answer)throw new Error('Không tìm thấy bài luận AI.');
  const root=answer.cloneNode(true);root.querySelectorAll(EXCLUDED).forEach(node=>node.remove());
  const blocks=[];
  const inline=(node,bold=false)=>{
    if(node.nodeType===3)return [{text:node.textContent,bold}];
    if(node.tagName==='BR')return [{text:'\n',bold}];
    return [...node.childNodes].flatMap(child=>inline(child,bold||node.tagName==='STRONG'));
  };
  const visit=node=>{
    const tag=node.tagName;
    if(/^H[1-6]$/.test(tag)||tag==='P'){
      blocks.push({kind:tag==='P'?'paragraph':'heading',runs:inline(node)});return;
    }
    if(tag==='LI'){
      const index=[...node.parentNode.children].indexOf(node)+1;
      let block={kind:'bullet',runs:[{text:node.parentNode.tagName==='OL'?`${index}. `:'• ',bold:false}]};
      blocks.push(block);
      for(const child of node.childNodes){
        if(child.nodeType===1&&['UL','OL'].includes(child.tagName)){visit(child);block=null;continue;}
        const runs=inline(child);
        if(!block){block={kind:'paragraph',runs:[]};blocks.push(block);}
        block.runs.push(...runs);
      }
      return;
    }
    for(const child of node.children||[])visit(child);
  };
  visit(root);return blocks.filter(block=>block.runs.some(run=>run.text.trim()));
}

const EXPORT_CSS=`
html,body{margin:0!important;padding:0!important;width:${WIDTH}px!important;background:white!important}
*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
.export-page{width:${WIDTH}px;padding:28px;background:var(--paper);box-sizing:border-box;overflow:hidden}
.export-page .topbar{min-height:80px;margin:0;padding:0 0 16px}
.export-page .product-nav{display:none}
.export-page .chart-meta{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:16px;margin:16px 0}
.export-page .pillars{display:grid;grid-template-columns:repeat(4,1fr)}
.export-page .calculation-summary{display:grid;grid-template-columns:repeat(3,1fr)}
.export-page .workspace{display:grid;grid-template-columns:minmax(0,600px) minmax(0,1fr);gap:14px;align-items:start}
.export-page .board-column{width:100%;grid-column:auto;grid-row:auto}
.export-page .element-panel{grid-column:auto;grid-row:auto;width:100%;height:auto}
.export-roles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.export-role{position:static;height:auto;min-width:0;padding:16px;overflow:visible}
.export-role>h2{font-size:22px;line-height:1.4}
.export-role>p{font-size:14px;overflow-wrap:anywhere}
.export-role .palace-detail{padding:0;display:block}
.export-role .semantic-components{display:block}
.export-role details.semantic-components>summary{display:none}
.export-role details.semantic-components>ul{display:grid!important}
.export-role details[open]>summary~*{display:block}
.export-page .menh-result-head{margin:0 0 12px}
.export-page .menh-workspace>.menh-inspector{display:none}
.export-page .menh-workspace>.element-panel{grid-column:2;grid-row:1}
.export-page .menh-board-section{min-width:0;width:100%}
.export-page .menh-method-details{margin-top:10px}
.export-page .menh-method-details[open] .method-copy{display:block}
.export-page .menh-basis-details{margin-top:12px}
.export-page .taiji-export{display:grid;place-items:center;width:100%;height:100%;font:700 82px/1 Georgia,serif;color:#18231f;text-shadow:0 3px 7px rgba(20,25,22,.13)}
`;

async function fetchOk(url){const response=await fetch(url);if(!response.ok)throw new Error(`Không tải được tài nguyên PDF: ${url}`);return response;}
function asDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}

export async function waitForExportLayout(doc){
  await doc.fonts.ready;
  await Promise.all([...doc.images].map(async img=>{
    if(img.decode)await img.decode();
    else if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});
    if(!img.naturalWidth)throw new Error('Không tải được hình trong báo cáo.');
  }));
  // Two frames allow SVG geometry and grid layout to settle after fonts and images.
  await new Promise(resolve=>doc.defaultView.requestAnimationFrame(()=>doc.defaultView.requestAnimationFrame(resolve)));
}

export async function captureQuestionPages(snapshot,{secondTitle='Đối chiếu đại diện trong bài luận'}={}){
  await document.fonts.ready;
  const css=[...document.styleSheets].filter(sheet=>!sheet.href||new URL(sheet.href).origin===location.origin).map(sheet=>[...sheet.cssRules].map(rule=>rule.cssText).join('\n')).join('\n');
  const frame=document.createElement('iframe');frame.title='Bản xuất PDF';frame.setAttribute('aria-hidden','true');
  frame.style.cssText=`position:fixed;left:-20000px;top:0;width:${WIDTH}px;height:1800px;border:0;pointer-events:none;`;
  document.body.append(frame);
  try{
    const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="vi"><head></head><body></body></html>');doc.close();
    const style=doc.createElement('style');style.textContent=css+'\n'+EXPORT_CSS;doc.head.append(style);
    const section=()=>{const node=doc.createElement('section');node.className='export-page';doc.body.append(node);return node;};
    const first=section(),second=section();
    const adopt=node=>doc.importNode(node,true);
    if(snapshot.header)first.append(adopt(snapshot.header));
    first.append(adopt(snapshot.question));
    const meta=doc.createElement('div');meta.className='chart-meta';meta.append(adopt(snapshot.pillars),adopt(snapshot.summary));first.append(meta);
    const workspace=doc.createElement('div');workspace.className='workspace';workspace.append(adopt(snapshot.board),adopt(snapshot.elements));first.append(workspace);
    workspace.querySelectorAll('.is-selected,.is-active,.is-related').forEach(node=>node.classList.remove('is-selected','is-active','is-related'));
    workspace.querySelectorAll('[aria-pressed]').forEach(node=>node.setAttribute('aria-pressed','false'));
    const diagram=workspace.querySelector('#element-diagram');if(diagram)delete diagram.dataset.active;
    const reading=workspace.querySelector('#element-reading');if(reading)reading.remove();
    const title=doc.createElement('h2');title.textContent=secondTitle;second.append(title);
    const roles=doc.createElement('div');roles.className='export-roles';roles.append(...snapshot.roles.map(adopt));second.append(roles);
    roles.querySelectorAll('details').forEach(node=>node.open=true);
    // Firefox can reject a raster image nested inside an SVG foreignObject under a page CSP.
    // Keep the live app image unchanged; use a vector/text taiji only in the PDF clone.
    for(const img of doc.querySelectorAll('img.taiji-ink')){const taiji=doc.createElement('span');taiji.className='taiji-export';taiji.textContent='☯';img.replaceWith(taiji);}
    // Inline any other same-origin images before serialization.
    await Promise.all([...doc.images].map(async img=>{
      const url=new URL(img.getAttribute('src'),document.baseURI);
      if(url.protocol!=='data:'){
        if(url.origin!==location.origin)throw new Error('Hình xuất PDF phải cùng nguồn.');
        img.src=await asDataUrl(await (await fetchOk(url)).blob());
      }
      img.removeAttribute('srcset');
    }));
    await waitForExportLayout(doc);
    const pages=[];
    for(const page of [first,second]){
      const height=Math.ceil(page.getBoundingClientRect().height);
      const container=doc.createElement('body');container.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
      container.append(style.cloneNode(true),page.cloneNode(true));
      const markup=new XMLSerializer().serializeToString(container);
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
      const image=new Image();image.src=await asDataUrl(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));await image.decode();
      const canvas=document.createElement('canvas');canvas.width=WIDTH*SCALE;canvas.height=height*SCALE;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
      pages.push({url:canvas.toDataURL('image/jpeg',.95),width:canvas.width,height:canvas.height});
    }
    return pages;
  }finally{frame.remove();}
}


export async function captureReadingPages(answer){
  if(!answer)throw new Error('Không tìm thấy bài luận AI.');
  await document.fonts.ready;
  const css=[...document.styleSheets].filter(sheet=>!sheet.href||new URL(sheet.href).origin===location.origin).map(sheet=>[...sheet.cssRules].map(rule=>rule.cssText).join('\n')).join('\n');
  const frame=document.createElement('iframe');frame.title='Bài luận xuất PDF';frame.setAttribute('aria-hidden','true');frame.style.cssText=`position:fixed;left:-20000px;top:0;width:${WIDTH}px;height:1800px;border:0;pointer-events:none;`;document.body.append(frame);
  try{
    const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="vi"><head></head><body></body></html>');doc.close();
    const style=doc.createElement('style');style.textContent=css+'\n'+EXPORT_CSS+'\n.export-reading{width:'+WIDTH+'px;padding:34px 42px;background:var(--paper);box-sizing:border-box}.export-reading .ai-answer{display:block!important}.export-reading details{display:block}.export-reading details>summary{display:none}.export-reading details>*{display:block!important}';doc.head.append(style);
    const root=doc.createElement('section');root.className='export-page export-reading';const title=doc.createElement('h2');title.textContent='Bài luận AI';root.append(title);
    const reading=doc.importNode(answer,true);reading.hidden=false;reading.removeAttribute('hidden');reading.querySelectorAll(EXCLUDED).forEach(node=>node.remove());reading.querySelectorAll('details').forEach(node=>node.open=true);root.append(reading);doc.body.append(root);
    await waitForExportLayout(doc);
    const total=Math.ceil(root.getBoundingClientRect().height),slice=1180,pages=[];
    for(let top=0;top<total;top+=slice){
      const height=Math.min(slice,total-top),wrap=doc.createElement('body');wrap.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
      const viewport=doc.createElement('div');viewport.style.cssText=`position:relative;width:${WIDTH}px;height:${height}px;overflow:hidden;background:white`;const shifted=root.cloneNode(true);shifted.style.transform=`translateY(-${top}px)`;shifted.style.transformOrigin='top left';viewport.append(shifted);wrap.append(style.cloneNode(true),viewport);
      const markup=new XMLSerializer().serializeToString(wrap),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
      const image=new Image();image.src=await asDataUrl(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));await image.decode();const canvas=document.createElement('canvas');canvas.width=WIDTH*SCALE;canvas.height=height*SCALE;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);pages.push({url:canvas.toDataURL('image/jpeg',.95),width:canvas.width,height:canvas.height});
    }
    return pages;
  }finally{frame.remove();}
}

export async function buildScreenshotPdf({snapshot,answer,secondTitle}){
  const visual=await captureQuestionPages(snapshot,{secondTitle});const reading=await captureReadingPages(answer);return writeQuestionPdf({pages:[...visual,...reading],blocks:[]});
}

const encode=value=>new TextEncoder().encode(value);
const hex=value=>value.toString(16).padStart(2,'0').toUpperCase();
const unicodeHex=text=>Array.from({length:text.length},(_,i)=>text.charCodeAt(i).toString(16).padStart(4,'0')).join('').toUpperCase();
function joinBytes(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length;}return out;}

// Rasterize only glyph shapes. The PDF itself positions encoded Unicode text with Tj.
export function canvasGlyph(character,bold){
  const size=96,pad=4,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const font=`${bold?700:400} ${size}px sans-serif`;ctx.font=font;
  const m=ctx.measureText(character),left=Math.ceil(Math.max(0,m.actualBoundingBoxLeft||0))+pad;
  const ascent=Math.ceil(m.actualBoundingBoxAscent||size),descent=Math.ceil(m.actualBoundingBoxDescent||size*.3);
  canvas.width=Math.max(1,Math.ceil(left+Math.max(m.width,m.actualBoundingBoxRight||0)+pad));canvas.height=ascent+descent+pad*2;
  ctx.font=font;ctx.fillStyle='#000';ctx.fillText(character,left,ascent+pad);
  const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data,stride=Math.ceil(canvas.width/8),mask=new Uint8Array(stride*canvas.height);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(rgba[(y*canvas.width+x)*4+3]>=64)mask[y*stride+(x>>3)]|=128>>(x%8);
  return {advance:m.width/size*1000,width:canvas.width,height:canvas.height,x:-left/size*1000,y:-(descent+pad)/size*1000,w:canvas.width/size*1000,h:canvas.height/size*1000,mask};
}

export function writeQuestionPdf({pages=[],blocks=[],model='',glyphFactory=canvasGlyph}){
  const objects=[null,null,null],pageIds=[];
  const add=value=>{objects.push(typeof value==='string'?encode(value):value);return objects.length-1;};
  const stream=(data,attrs='')=>{const bytes=typeof data==='string'?encode(data):data;return add(joinBytes([encode(`<< ${attrs} /Length ${bytes.length} >>\nstream\n`),bytes,encode('\nendstream')]));};
  const fonts=[],glyphs=new Map();
  const glyph=(character,bold)=>{
    const key=`${bold?1:0}:${character}`;if(glyphs.has(key))return glyphs.get(key);
    let font=fonts.findLast(f=>f.bold===bold&&f.chars.length<220);
    if(!font){font={bold,chars:[],name:`F${fonts.length+1}`};fonts.push(font);}
    const shape=glyphFactory(character,bold),entry={...shape,character,font,code:font.chars.length+1};font.chars.push(entry);glyphs.set(key,entry);return entry;
  };
  const addPage=(width,height,content,resources)=>{
    const contents=stream(content);pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources ${resources} /Contents ${contents} 0 R >>`));
  };
  for(const page of pages){
    const binary=atob(page.url.split(',')[1]),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    const image=stream(bytes,`/Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`);
    const width=595,height=842,scale=Math.min((width-40)/page.width,(height-40)/page.height),w=page.width*scale,h=page.height*scale;
    addPage(width,height,`q ${w} 0 0 ${h} ${(width-w)/2} ${(height-h)/2} cm /Visual Do Q`,`<< /XObject << /Visual ${image} 0 R >> >>`);
  }
  const textPages=[];let commands=[],y=800;
  const nextPage=()=>{if(commands.length)textPages.push(commands.join('\n'));commands=[];y=800;};
  const allBlocks=[{kind:'heading',runs:[{text:'Bài luận AI'}]},...blocks];
  for(const block of allBlocks){
    const heading=block.kind==='heading',size=heading?15:11,lineHeight=heading?22:17,left=42,width=511;
    if(heading&&y<42+lineHeight*3)nextPage();
    let line=[],lineWidth=0;
    const flush=()=>{
      if(!line.length)return;
      if(y-lineHeight<42)nextPage();
      let x=left;
      for(const entry of line){commands.push(`BT /${entry.g.font.name} ${size} Tf 1 0 0 1 ${x.toFixed(3)} ${y} Tm <${hex(entry.g.code)}> Tj ET`);x+=entry.width;}
      y-=lineHeight;line=[];lineWidth=0;
    };
    for(const run of block.runs){
      const bold=heading||Boolean(run.bold);
      for(const token of String(run.text).split(/(\n|[^\S\n]+)/u).filter(Boolean)){
        if(token==='\n'){flush();continue;}
        const entries=[...token].map(character=>{const g=glyph(character,bold);return {g,width:g.advance*size/1000};});
        const tokenWidth=entries.reduce((n,e)=>n+e.width,0);
        if(lineWidth+tokenWidth>width)flush();
        if(!line.length&&/^\s+$/u.test(token))continue;
        for(const entry of entries){if(lineWidth+entry.width>width&&line.length)flush();line.push(entry);lineWidth+=entry.width;}
      }
    }
    flush();y-=heading?8:10;
  }
  nextPage();
  for(const font of fonts){
    const procs=[],widths=[],mapping=[];let minX=0,minY=0,maxX=0,maxY=0;
    for(const g of font.chars){
      const mask=stream(g.mask,`/Type /XObject /Subtype /Image /Width ${g.width} /Height ${g.height} /ImageMask true /BitsPerComponent 1 /Decode [1 0]`);
      const proc=stream(`${g.advance} 0 d0\nq ${g.w} 0 0 ${g.h} ${g.x} ${g.y} cm /G${g.code} Do Q`);
      procs.push({code:g.code,proc,mask});widths.push(g.advance);mapping.push(`<${hex(g.code)}> <${unicodeHex(g.character)}>`);
      minX=Math.min(minX,g.x);minY=Math.min(minY,g.y);maxX=Math.max(maxX,g.x+g.w);maxY=Math.max(maxY,g.y+g.h);
    }
    const chunks=[];for(let i=0;i<mapping.length;i+=100){const chunk=mapping.slice(i,i+100);chunks.push(`${chunk.length} beginbfchar\n${chunk.join('\n')}\nendbfchar`);}
    const cmap=stream(`/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /${font.name}Unicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n${chunks.join('\n')}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`);
    font.id=add(`<< /Type /Font /Subtype /Type3 /Name /${font.name} /FontBBox [${minX} ${minY} ${maxX} ${maxY}] /FontMatrix [.001 0 0 .001 0 0] /CharProcs << ${procs.map(p=>`/g${p.code} ${p.proc} 0 R`).join(' ')} >> /Encoding << /Type /Encoding /Differences [1 ${procs.map(p=>`/g${p.code}`).join(' ')}] >> /FirstChar 1 /LastChar ${widths.length} /Widths [${widths.join(' ')}] /Resources << /XObject << ${procs.map(p=>`/G${p.code} ${p.mask} 0 R`).join(' ')} >> >> /ToUnicode ${cmap} 0 R >>`);
  }
  const resources=`<< /Font << ${fonts.map(f=>`/${f.name} ${f.id} 0 R`).join(' ')} >> >>`;
  for(const content of textPages)addPage(595,842,content,resources);
  objects[1]=encode('<< /Type /Catalog /Pages 2 0 R >>');objects[2]=encode(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`);
  const parts=[encode('%PDF-1.4\n')],offsets=[0];let offset=parts[0].length;
  for(let id=1;id<objects.length;id++){offsets.push(offset);const part=joinBytes([encode(`${id} 0 obj\n`),objects[id],encode('\nendobj\n')]);parts.push(part);offset+=part.length;}
  parts.push(encode(`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`));
  return new Blob(parts,{type:'application/pdf'});
}

export async function buildQuestionPdf({snapshot,blocks,model}){
  const pages=await captureQuestionPages(snapshot);
  return writeQuestionPdf({pages,blocks,model});
}

export async function buildMenhPdf({snapshot,blocks,model}){
  const pages=await captureQuestionPages(snapshot,{secondTitle:'Bản mệnh · đối chiếu cung và căn cứ'});
  return writeQuestionPdf({pages,blocks,model});
}
