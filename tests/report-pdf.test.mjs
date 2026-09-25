import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildImagePdf,canvasReport} from '../dist/report-export.mjs';

class FakeContext{
  constructor(){this.font='';this.fillStyle='';this.strokeStyle='';this.lineWidth=1;this.ops=[];}
  measureText(text){const size=Number((this.font.match(/(\d+)px/)||[])[1]||16);return {width:String(text).length*size*.52};}
  fillText(text,x,y){this.ops.push({op:'text',text:String(text),x,y,font:this.font,fillStyle:this.fillStyle});}
  fillRect(x,y,w,h){this.ops.push({op:'fillRect',x,y,w,h,fillStyle:this.fillStyle});}
  strokeRect(x,y,w,h){this.ops.push({op:'strokeRect',x,y,w,h,lineWidth:this.lineWidth,strokeStyle:this.strokeStyle});}
  beginPath(){} moveTo(){} lineTo(){} stroke(){this.ops.push({op:'stroke',lineWidth:this.lineWidth,strokeStyle:this.strokeStyle});}
}
function fakePage(){const ctx=new FakeContext();return {canvas:{width:1240,height:1754,ctx,toDataURL(){return 'data:image/jpeg;base64,/9j/2Q==';}},ctx,y:82};}
function palace(number,element='wood',self=false){return {number,title:`☷ Cung ${number}`,subtitle:'Hướng · Ngũ hành',element,self,markers:number===6?['Không']:[],spirit:{vi:'Bát thần mẫu'},star:{vi:'Cửu tinh mẫu',duty:number===2?'Trực Phù':''},heaven:{vi:'Giáp'},door:{vi:'Khai Môn',duty:number===1?'Trực Sử':''},earth:{vi:'Mậu'},centerNote:number===5?'Thiên Cầm theo Nhuế · cung 2':''};}
const long=(label,count=520)=>`${label} `+Array.from({length:count},(_,i)=>`nội-dung-${i}`).join(' ')+` ${label}-KẾT-THÚC`;

function sampleReport(){return {
  title:'Kỳ Môn Bàn',reportType:'Mệnh',generatedAt:'19/09/2026 11:30',model:'GPT-5.6 Sol / xhigh',
  inputFields:[{label:'Họ và tên',value:'NGUYỄN ĐÌNH TRỌNG'},{label:'Ngày sinh',value:'17/07/1994'},{label:'Giờ sinh',value:'07:30'}],
  board:{palaces:[palace(1,'water',true),palace(2,'earth'),palace(3,'wood'),palace(4,'wood'),palace(5,'earth'),palace(6,'metal'),palace(7,'metal'),palace(8,'earth'),palace(9,'fire')],flags:['Trực Phù: Thiên Cầm · cung 2','Trực Sử: Tử Môn · cung 1','Phục Ngâm']},
  analysisSections:[{title:'Bản thân & tổng thể',paragraphs:[[{text:'Luận giải tổng quan.',bold:false}]]}],
  aiSections:[
    {title:'Tổng thể',paragraphs:[[{text:'Trọng tâm cần đọc trước.',bold:true},{text:' Phần giải thích đi sau.',bold:false}]]},
    {title:'Hôn nhân',paragraphs:[[{text:'Điểm trọng tâm hôn nhân.',bold:true},{text:' '+long('HON-NHAN'),bold:false}]]},
    {title:'Sự nghiệp',paragraphs:[[{text:long('SU-NGHIEP'),bold:false}]]},
    {title:'Tài vận',paragraphs:[[{text:'Điểm trọng tâm tài vận.',bold:true},{text:' '+long('TAI-VAN'),bold:false}]]},
    {title:'Đại vận',paragraphs:[[{text:long('DAI-VAN',260),bold:false}]]},
    {title:'Lưu niên',paragraphs:[[{text:long('LUU-NIEN',260),bold:false}]]},
  ]
};}

test('client-side PDF builder creates a PDF without adding runtime dependencies',async()=>{
  const fakeCanvas={width:2,height:2,toDataURL(){return 'data:image/jpeg;base64,/9j/2Q==';}};
  const pdf=buildImagePdf([fakeCanvas]),bytes=new Uint8Array(await pdf.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.subarray(0,8)),'%PDF-1.4');
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));assert.equal(Object.keys(pkg.dependencies||{}).length,0);
});

test('long Mệnh PDF sections paginate without clipping Hôn nhân or Tài vận',()=>{
  const pages=canvasReport(sampleReport(),{createPage:fakePage});
  assert.ok(pages.length>=5,'long report should span several pages');
  const text=pages.flatMap(p=>p.ctx.ops.filter(x=>x.op==='text').map(x=>x.text)).join(' ').replace(/\s+/g,' ');
  for(const required of ['Hôn nhân','HON-NHAN-KẾT-THÚC','Sự nghiệp','SU-NGHIEP-KẾT-THÚC','Tài vận','TAI-VAN-KẾT-THÚC','Đại vận','DAI-VAN-KẾT-THÚC','Lưu niên','LUU-NIEN-KẾT-THÚC'])assert.ok(text.includes(required),`missing ${required}`);
});

test('PDF preserves emphasized AI phrases as bold and renders an app-like colored self palace',()=>{
  const pages=canvasReport(sampleReport(),{createPage:fakePage}),ops=pages.flatMap(p=>p.ctx.ops);
  const boldWords=ops.filter(x=>x.op==='text'&&['Điểm','trọng','tâm','hôn','nhân.'].includes(x.text));
  assert.ok(boldWords.length>=5);assert.ok(boldWords.every(x=>/750/.test(x.font)));
  assert.ok(ops.some(x=>x.op==='fillRect'&&x.fillStyle==='#edf4fa'),'water palace background should be tinted');
  assert.ok(ops.some(x=>x.op==='strokeRect'&&x.lineWidth===6&&x.strokeStyle==='#173f32'),'self palace should have a strong jade outline');
  assert.ok(ops.some(x=>x.op==='text'&&x.text.includes('BẢN MỆNH · BẠN Ở ĐÂY')));
});

test('browser UI exposes a cross-device web-link share action for Hỏi việc and Mệnh',()=>{
  const question=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),menh=readFileSync(new URL('../dist/menh.html',import.meta.url),'utf8'),client=readFileSync(new URL('../dist/report-export.mjs',import.meta.url),'utf8'),server=readFileSync(new URL('../local/server.mjs',import.meta.url),'utf8');
  assert.match(question,/id="report-download-pdf"[^>]*>Xuất PDF<\/button>/);assert.match(menh,/id="menh-report-download-pdf"[^>]*>Xuất PDF<\/button>/);
  assert.match(question,/id="report-pdf"[^>]*>Chia sẻ link kết quả</);assert.match(menh,/id="menh-report-pdf"[^>]*>Chia sẻ link kết quả</);
  assert.match(client,/schemaVersion:'QimenShare\/1'/);assert.match(client,/SHARE_ORIGIN/);assert.match(client,/\/api\/share/);assert.match(client,/navigator\.share\(\{title:'Kỳ Môn Bàn'.*url:data\.url/);
  assert.match(client,/navigator\.clipboard\?\.writeText\(data\.url\)/);assert.match(client,/Mở link chia sẻ/);assert.doesNotMatch(client,/buildScreenshotPdf/);
  assert.match(server,/path==='\/api\/share'/);assert.match(server,/\/s\//);assert.match(server,/X-Robots-Tag/);
});

const {writeQuestionPdf,extractReadingBlocks,pcPageSlices}=await import('../dist/question-report.mjs');
const {initPdfExport,initPdfDownload}=await import('../dist/report-export.mjs');

test('native capture moves a complete diagram to the next page even when it leaves whitespace',()=>{
  const node=(top,bottom)=>({getBoundingClientRect(){return {top,bottom,height:bottom-top};}});
  const diagram=node(950,2450);
  const root={getBoundingClientRect(){return {top:0,bottom:3300,height:3300};},querySelectorAll(){return [diagram];}};
  const slices=pcPageSlices(root);
  assert.equal(slices[0].height,950);
  assert.ok(slices.some(s=>s.top<=950&&s.top+s.height>=2450),'diagram must stay intact');
  assert.equal(slices.reduce((sum,s)=>sum+s.height,0),3300);
  assert.ok(slices.every(s=>s.height>0&&s.height<=2000));
});

test('question link sharing uses the exact retained AI request and never prepares again',async t=>{
  const saved={document:globalThis.document,fetch:globalThis.fetch,location:globalThis.location,navigator:globalThis.navigator};
  t.after(()=>{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});}});
  let click,prepares=0,captureCalls=0,fetchBody,linkNode;
  const button={hidden:true,disabled:false,addEventListener(name,handler){click=handler;},insertAdjacentElement(where,node){linkNode=node;}},status={textContent:''};
  const token={value:'share-token'},blank={value:'',selectedOptions:[]};
  const snapshotClone={innerHTML:'<div class="qimen-board">Bàn Kỳ Môn</div>',querySelectorAll(){return [];}};
  const snapshotRoot={className:'result',cloneNode(){return snapshotClone;}};
  const doc={
    getElementById(id){return id==='button'?button:id==='status'?status:id==='local-token'?token:null;},
    querySelector(selector){return selector==='#result'?snapshotRoot:null;},
    querySelectorAll(){return [];},
    createElement(){return {hidden:false,className:'',target:'',rel:'',textContent:'',href:'',removeAttribute(name){delete this[name];}};}
  };
  Object.defineProperty(globalThis,'document',{value:doc,writable:true,configurable:true});
  Object.defineProperty(globalThis,'location',{value:{hostname:'localhost',origin:'http://localhost:8765'},writable:true,configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:{clipboard:{async writeText(){}}},writable:true,configurable:true});
  globalThis.fetch=async(url,options)=>{fetchBody=JSON.parse(options.body);return {ok:true,async json(){return {url:'http://localhost:8765/s/abcdefghijklmnopqrstuvwx'};}};};
  const share=initPdfExport({kind:'question',buttonId:'button',statusId:'status',prepare(){prepares++;throw Error('must not prepare');},boardSelector:'#qimen-board',captureReportVisual(){captureCalls++;}});
  const exact={request:{question:'Câu hỏi chính xác'},chart:{},analysis:{},context:{}};
  share.setModel({label:'Model',effort:'high'},exact);await click();
  assert.equal(prepares,0);assert.equal(captureCalls,0);assert.equal(fetchBody.kind,'question');assert.equal(fetchBody.report.inputFields[0].value,'Câu hỏi chính xác');
  assert.equal(fetchBody.shareToken,undefined);assert.equal(linkNode.href,'http://localhost:8765/s/abcdefghijklmnopqrstuvwx');assert.equal(linkNode.hidden,false);
  share.clear();assert.equal(button.hidden,true);assert.equal(linkNode.hidden,true);
  const ai=readFileSync(new URL('../dist/ai-local.mjs',import.meta.url),'utf8');
  assert.match(ai,/const prepared=await buildReadingRequest\(body\)/);assert.match(ai,/pdf\.setModel\(data\.modelUsed,prepared\)/);
});

test('PDF download captures the native UI and keeps AI prose as a text layer',async t=>{
  const saved={document:globalThis.document};
  t.after(()=>{if(saved.document===undefined)delete globalThis.document;else Object.defineProperty(globalThis,'document',{value:saved.document,writable:true,configurable:true});});
  let click,prepareCalls=0,captureOptions,writerOptions,downloaded;
  const button={hidden:true,disabled:false,addEventListener(name,handler){click=handler;}};
  const answer={};
  const doc={getElementById(id){return id==='pdf-download'?button:id==='ai-answer'?answer:null;}};
  Object.defineProperty(globalThis,'document',{value:doc,writable:true,configurable:true});
  const prepared={request:{question:'Câu hỏi đã gắn với bàn'},input:{question:'Câu hỏi đã gắn với bàn'}};
  const pdf=initPdfDownload({
    kind:'question',buttonId:'pdf-download',statusId:'status',
    prepare(){prepareCalls++;throw Error('không được lập lại bàn');},
    capturePages:async(_kind,options)=>{captureOptions=options;return [{url:'data:image/jpeg;base64,/9j/2Q==',width:1440,height:500}]},
    extractBlocks:node=>{assert.equal(node,answer);return [{kind:'paragraph',runs:[{text:'Kết luận thật',bold:false}]}]},
    writePdf:async options=>{writerOptions=options;return new Blob(['pdf'],{type:'application/pdf'});},
    downloadFile:(blob,name)=>{downloaded={blob,name};}
  });
  pdf.setModel({label:'Model',effort:'high'},prepared);await click();
  assert.equal(prepareCalls,0);assert.deepEqual(captureOptions,{includeReading:false});
  assert.equal(writerOptions.prepared,prepared);assert.equal(writerOptions.model,'Model / high');
  assert.equal(writerOptions.blocks[0].runs[0].text,'Kết luận thật');assert.equal(downloaded.name,'ky-mon-ban-hoi-viec.pdf');
});

test('PDF export freezes prose before capture and discards a download invalidated by a new chart',async t=>{
  const before=globalThis.document;t.after(()=>{globalThis.document=before;});
  let click,release,text='Bài cũ',downloads=0,seen;
  const button={hidden:true,disabled:false,addEventListener(_,handler){click=handler;}},status={textContent:''};
  globalThis.document={getElementById:id=>id==='pdf'?button:id==='status'?status:{}};
  const pdf=initPdfDownload({kind:'question',buttonId:'pdf',statusId:'status',
    capturePages:()=>new Promise(resolve=>{release=resolve;}),extractBlocks:()=>[{runs:[{text}]}],
    writePdf:options=>{seen=options;return new Blob(['pdf']);},downloadFile:()=>downloads++});
  pdf.setModel({label:'old',effort:'high'},{});
  let pending=click();text='Bài mới';release([]);await pending;
  assert.equal(seen.blocks[0].runs[0].text,'Bài cũ');
  pending=click();pdf.clear();status.textContent='Đã đổi bàn';release([]);await pending;
  assert.equal(downloads,1);assert.equal(status.textContent,'Đã đổi bàn');
  assert.equal(button.disabled,false);assert.equal(button.hidden,true);
});
function element(tag,...children){
  const node={nodeType:1,tagName:tag,childNodes:children.map(c=>typeof c==='string'?{nodeType:3,textContent:c}:c),querySelectorAll(){return [];},cloneNode(){return this;}};
  node.children=node.childNodes.filter(c=>c.nodeType===1);for(const child of node.childNodes)child.parentNode=node;return node;
}
test('reading extraction keeps inline strong emphasis in paragraphs and single bullets',()=>{
  const root=element('DIV',element('H3','Kết luận'),element('P','Trước ',element('STRONG',element('SPAN','điểm chính')),' sau.'),element('UL',element('LI','Nên ',element('STRONG','chờ'),' thêm.')));
  const blocks=extractReadingBlocks(root);
  assert.deepEqual(blocks.map(b=>b.kind),['heading','paragraph','bullet']);
  assert.equal(blocks[1].runs.find(r=>r.bold).text,'điểm chính');
  assert.equal(blocks[2].runs.map(r=>r.text).join(''),'• Nên chờ thêm.');
  assert.equal(blocks[2].runs.find(r=>r.bold).text,'chờ');
});

test('question and Mệnh visuals rasterize the native 1440px desktop result without export reflow',()=>{
  const code=readFileSync(new URL('../dist/question-report.mjs',import.meta.url),'utf8');
  for(const pattern of [/foreignObject/,/PC_CAPTURE_WIDTH=1440/,/position:fixed;left:-30000px/,/document\.fonts\.ready/,/cssRules/,/requestAnimationFrame.*requestAnimationFrame/,/capturePcReportPages/,/reportSource\(kind\)/,/doc\.importNode\(options.source\|\|reportSource\(kind\),true\)/,/export-role-pair/,/animation:none!important;transition:none!important/])assert.match(code,pattern);
  assert.match(code,/kind==='menh'\?'menh-result':'result'/);
  assert.match(code,/main\.append\(result\);shell\.append\(main\)/);
  assert.doesNotMatch(code,/WIDTH=900|snapshot\.elements|snapshot\.roles|workspace\.append\(adopt/);
  assert.doesNotMatch(code,/pdfkit|\.ttf|\.woff|api\/export/);
});

test('screenshot-only PDF emits exactly its image pages with no synthetic reading page',async()=>{
  const image={url:'data:image/jpeg;base64,/9j/2Q==',width:1440,height:1800};
  const blob=writeQuestionPdf({pages:[image,image],blocks:[]});
  const pdf=new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()));
  assert.equal([...pdf.matchAll(/\/Type \/Page /g)].length,2);
  assert.doesNotMatch(pdf,/\/Subtype \/Type3/);
});

const fakeGlyph=()=>({advance:520,width:8,height:8,x:0,y:-200,w:520,h:1000,mask:new Uint8Array(8).fill(255)});
test('hybrid PDF uses text operators, separate Type3 variants, Unicode maps and valid byte offsets',async()=>{
  const alphabet=Array.from({length:450},(_,i)=>String.fromCodePoint(0x400+i)).join('');
  const blocks=[{kind:'paragraph',runs:[{text:'Tiếng Việt 😀 ',bold:false},{text:'đậm',bold:true},{text:alphabet}]},...Array.from({length:150},()=>({kind:'paragraph',runs:[{text:'Một dòng dài để kiểm tra phân trang. '.repeat(4)}]})),{kind:'paragraph',runs:[{text:'KẾT THÚC'}]}];
  const blob=writeQuestionPdf({pages:[{url:'data:image/jpeg;base64,/9j/2Q==',width:1160,height:900}],blocks,glyphFactory:fakeGlyph});
  const bytes=new Uint8Array(await blob.arrayBuffer()),pdf=new TextDecoder().decode(bytes);
  assert.equal(pdf.slice(0,8),'%PDF-1.4');assert.match(pdf,/\/Subtype \/Type3/);assert.match(pdf,/\/ToUnicode \d+ 0 R/);assert.match(pdf,/BT \/F\d+ 11 Tf .* Tm <[0-9A-F]+> Tj ET/);
  assert.match(pdf,/<D83DDE00>/);assert.match(pdf,/<1EBF>/);assert.match(pdf,/\/MediaBox \[0 0 595 842\]/);assert.doesNotMatch(pdf,/\/MediaBox \[0 0 1191 842\]/);
  const sizes=[...pdf.matchAll(/\/LastChar (\d+)/g)].map(m=>Number(m[1]));assert.ok(sizes.length>=4);assert.ok(sizes.every(n=>n<=220));
  const maps=new Map();
  for(const match of pdf.matchAll(/\/Subtype \/Type3 \/Name \/(F\d+)[\s\S]*?\/ToUnicode (\d+) 0 R/g)){
    const cmap=pdf.match(new RegExp(`(?:^|\\n)${match[2]} 0 obj\\n[\\s\\S]*?stream\\n([\\s\\S]*?)\\nendstream`))[1];
    const map=new Map();
    for(const pair of cmap.matchAll(/<([0-9A-F]{2})> <([0-9A-F]{4,})>/g))map.set(pair[1],pair[2].match(/.{4}/g).map(unit=>String.fromCharCode(parseInt(unit,16))).join(''));
    maps.set(match[1],map);
  }
  const extracted=[...pdf.matchAll(/BT \/(F\d+) [^\n]*? <([0-9A-F]{2})> Tj ET/g)].map(m=>maps.get(m[1]).get(m[2])).join('');
  assert.ok(extracted.includes('Tiếng Việt 😀 đậm'+alphabet));assert.ok(extracted.endsWith('KẾT THÚC'));
  assert.ok([...pdf.matchAll(/\/Type \/Page /g)].length>5);
  for(const match of pdf.matchAll(/Tf 1 0 0 1 ([\d.]+) (\d+) Tm/g)){assert.ok(Number(match[1])<553);assert.ok(Number(match[2])>=42&&Number(match[2])<=800);}
  const xref=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(bytes.slice(xref,xref+4)),'xref');
  const table=new TextDecoder().decode(bytes.slice(xref)).split('\n'),count=Number(table[1].split(' ')[1]);
  for(let id=1;id<count;id++){const offset=Number(table[id+2].slice(0,10));assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+`${id} 0 obj`.length)),`${id} 0 obj`);}
});
