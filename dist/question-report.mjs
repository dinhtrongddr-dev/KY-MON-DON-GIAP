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

const PC_CAPTURE_WIDTH=1440,PC_CAPTURE_SLICE=2000;
const PC_CAPTURE_REMOVE=[
  '#local-setup','.local-controls','.local-preference','.ai-feedback','.activity-summary','.activity-history',
  '#rule-analyze','#rule-preview','.report-pdf-button','.ai-trace','.ai-evidence','.ai-note',
  '.menh-scope','.reading-strip'
].join(',');

function captureCssText(){
  return [...document.styleSheets]
    .filter(sheet=>!sheet.href||new URL(sheet.href).origin===location.origin)
    .map(sheet=>[...sheet.cssRules].map(rule=>rule.cssText).join('\n'))
    .join('\n');
}

function cleanupPcReport(root,kind){
  root.hidden=false;root.removeAttribute('hidden');
  root.querySelectorAll(PC_CAPTURE_REMOVE).forEach(node=>node.remove());
  if(kind==='question'){
    const basics=root.querySelector('#basics-title')?.closest('.learning-panel');if(basics)basics.remove();
    const answer=root.querySelector('#ai-answer');if(answer){answer.hidden=false;answer.removeAttribute('hidden');}
  }else{
    const answer=root.querySelector('#menh-ai-answer');if(answer){answer.hidden=false;answer.removeAttribute('hidden');}
  }
  root.querySelectorAll('[hidden]').forEach(node=>{
    if(node.matches('#ai-answer,#menh-ai-answer'))node.removeAttribute('hidden');
  });
  root.querySelectorAll('details').forEach(node=>node.open=true);
  for(const img of root.querySelectorAll('img.taiji-ink')){const taiji=root.ownerDocument.createElement('span');taiji.className='taiji-export';taiji.textContent='☯';img.replaceWith(taiji);}
  root.querySelectorAll('button').forEach(node=>{
    if(node.closest('.element-diagram,.qimen-board,.menh-board-section')){node.tabIndex=-1;return;}
    if(node.closest('#ai-answer,#menh-ai-answer'))node.remove();
  });
  return root;
}

function reportSource(kind){
  const source=document.getElementById(kind==='menh'?'menh-result':'result');
  if(!source)throw new Error(kind==='menh'?'Chưa có Mệnh bàn để xuất PDF.':'Chưa có bàn Hỏi việc để xuất PDF.');
  return source;
}

function createPcShell(doc,kind){
  const shell=doc.createElement('div');shell.className='page-shell pdf-pc-capture';
  const topbar=document.querySelector('.topbar');if(topbar)shell.append(doc.importNode(topbar,true));
  const main=doc.createElement('main');
  const result=cleanupPcReport(doc.importNode(reportSource(kind),true),kind);
  main.append(result);shell.append(main);doc.body.append(shell);return shell;
}

function relativeBox(root,node){
  const rr=root.getBoundingClientRect(),r=node.getBoundingClientRect();
  return {top:Math.max(0,r.top-rr.top),bottom:Math.min(rr.height,r.bottom-rr.top),height:r.height};
}

function pcPageSlices(root){
  const total=Math.ceil(root.getBoundingClientRect().height);
  if(total<=PC_CAPTURE_SLICE)return [{top:0,height:total}];
  const keep=[...root.querySelectorAll('.chart-meta,.workspace,.menh-chart-meta,.menh-workspace,.qimen-board,.menh-board-section,.element-panel,.menh-claim,.menh-ai-section,.ai-narrative-block,.ai-actions>li')]
    .map(node=>relativeBox(root,node)).filter(r=>r.height>40&&r.height<PC_CAPTURE_SLICE-100);
  const points=[...root.querySelectorAll('h2,h3,h4,p,li,.chart-meta,.workspace,.menh-chart-meta,.menh-workspace,.element-panel,.menh-claim,.menh-ai-section,.ai-narrative-block')]
    .flatMap(node=>{const r=relativeBox(root,node);return [r.top,r.bottom];})
    .filter(y=>Number.isFinite(y)&&y>0&&y<total).sort((a,b)=>a-b);
  const insideKeep=y=>keep.some(r=>y>r.top+8&&y<r.bottom-8);
  const slices=[];let top=0;
  while(top<total-1){
    let bottom=Math.min(total,top+PC_CAPTURE_SLICE);
    if(bottom<total){
      const crossing=keep.filter(r=>r.top<bottom-8&&r.bottom>bottom+8).sort((a,b)=>b.height-a.height)[0];
      if(crossing&&crossing.top-top>=1050)bottom=Math.floor(crossing.top);
      else if(crossing&&crossing.bottom-top<=PC_CAPTURE_SLICE)bottom=Math.ceil(crossing.bottom);
      else{
        const candidates=points.filter(y=>y>=top+1200&&y<=bottom&&!insideKeep(y));
        if(candidates.length)bottom=Math.floor(candidates[candidates.length-1]);
      }
    }
    if(bottom<=top+300)bottom=Math.min(total,top+PC_CAPTURE_SLICE);
    slices.push({top,height:Math.ceil(bottom-top)});top=bottom;
  }
  return slices;
}

async function inlinePcImages(doc){
  await Promise.all([...doc.images].map(async img=>{
    const src=img.getAttribute('src');if(!src)return;
    const url=new URL(src,document.baseURI);
    if(url.protocol!=='data:'){
      if(url.origin!==location.origin)throw new Error('Hình xuất PDF phải cùng nguồn.');
      img.src=await asDataUrl(await (await fetchOk(url)).blob());
    }
    img.removeAttribute('srcset');
  }));
}

async function rasterPcSlice(doc,root,style,{top,height}){
  const body=doc.createElement('body');body.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
  const viewport=doc.createElement('div');viewport.className='pdf-slice-viewport';viewport.style.height=`${height}px`;
  const shifted=root.cloneNode(true);shifted.style.transform=`translateY(-${top}px)`;shifted.style.transformOrigin='top left';
  viewport.append(shifted);body.append(style.cloneNode(true),viewport);
  const markup=new XMLSerializer().serializeToString(body);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${PC_CAPTURE_WIDTH}" height="${height}" viewBox="0 0 ${PC_CAPTURE_WIDTH} ${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
  const image=new Image();image.src=await asDataUrl(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));await image.decode();
  const canvas=document.createElement('canvas');canvas.width=PC_CAPTURE_WIDTH;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);
  return {url:canvas.toDataURL('image/jpeg',.9),width:canvas.width,height:canvas.height};
}

export async function capturePcReportPages(kind='question'){
  await document.fonts.ready;
  const frame=document.createElement('iframe');frame.title='Ảnh chụp PDF giao diện PC';frame.setAttribute('aria-hidden','true');
  frame.style.cssText=`position:fixed;left:-30000px;top:0;width:${PC_CAPTURE_WIDTH}px;height:1200px;border:0;pointer-events:none;visibility:hidden`;
  document.body.append(frame);
  try{
    const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="vi"><head></head><body></body></html>');doc.close();
    const style=doc.createElement('style');
    style.textContent=captureCssText()+`
      html,body{margin:0!important;padding:0!important;width:${PC_CAPTURE_WIDTH}px!important;min-width:${PC_CAPTURE_WIDTH}px!important;max-width:none!important;background:#fff!important}
      *,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
      .pdf-pc-capture{width:${PC_CAPTURE_WIDTH}px!important;max-width:none!important;margin:0!important;padding:0 54px 34px!important;box-sizing:border-box!important}
      .pdf-pc-capture main{padding-top:24px!important}
      .pdf-pc-capture .report-pdf-button{display:none!important}
      .pdf-pc-capture .taiji-export{display:grid;place-items:center;width:100%;height:100%;font:700 92px/1 Georgia,serif;color:#18231f;text-shadow:0 3px 7px rgba(20,25,22,.13)}
      .pdf-slice-viewport{position:relative;width:${PC_CAPTURE_WIDTH}px;overflow:hidden;background:#fff}
    `;doc.head.append(style);
    const root=createPcShell(doc,kind);await inlinePcImages(doc);await waitForExportLayout(doc);
    const slices=pcPageSlices(root),pages=[];
    for(const slice of slices)pages.push(await rasterPcSlice(doc,root,style,slice));
    return pages;
  }finally{frame.remove();}
}

export async function buildScreenshotPdf({kind='question'}={}){
  return writeQuestionPdf({pages:await capturePcReportPages(kind),blocks:[]});
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
  const allBlocks=blocks.length?[{kind:'heading',runs:[{text:'Bài luận AI'}]},...blocks]:[];
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
