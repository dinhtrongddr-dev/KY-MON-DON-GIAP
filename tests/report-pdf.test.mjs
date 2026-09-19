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

test('browser UI exposes one PDF export/share button for both Hỏi việc and Mệnh',()=>{
  const question=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),menh=readFileSync(new URL('../dist/menh.html',import.meta.url),'utf8'),client=readFileSync(new URL('../dist/report-export.mjs',import.meta.url),'utf8'),server=readFileSync(new URL('../local/server.mjs',import.meta.url),'utf8');
  assert.match(question,/id="report-pdf"[^>]*>Xuất \/ chia sẻ PDF</);assert.match(menh,/id="menh-report-pdf"[^>]*>Xuất \/ chia sẻ PDF</);
  assert.match(client,/title:'Kỳ Môn Bàn'/);assert.match(client,/ky-mon-ban-hoi-viec/);assert.match(client,/ky-mon-ban-menh/);
  assert.match(client,/richParagraph/);assert.match(client,/menh-ai-focus/);assert.match(client,/isMobileShareDevice/);assert.match(client,/canMobileShare=isMobileShareDevice\(\)&&navigator\.share/);assert.match(client,/Đã tải file PDF về máy/);assert.match(client,/toDataURL\('image\/jpeg'/);assert.match(client,/details,button,\.ai-trace,\.ai-evidence/);
  assert.match(server,/['\"]\/question-report\.mjs['\"]/);assert.doesNotMatch(client,/api\/export\/pdf/);
});

const {writeQuestionPdf,extractReadingBlocks}=await import('../dist/question-report.mjs');
const {initPdfExport}=await import('../dist/report-export.mjs');

test('question click passes the exact retained prepared object and never prepares again',async t=>{
  const previous=globalThis.document;t.after(()=>{globalThis.document=previous;});
  let click,captured,prepares=0;
  const button={addEventListener(name,handler){click=handler;}},status={};
  globalThis.document={getElementById:id=>id==='button'?button:status};
  const pdf=initPdfExport({kind:'question',buttonId:'button',statusId:'status',prepare(){prepares++;throw Error('must not prepare');},captureReportVisual(prepared){captured=prepared;throw Error('capture reached');}});
  const exact={request:{question:'Câu hỏi'},chart:{},analysis:{},context:{}};
  pdf.setModel({label:'Model',effort:'high'},exact);await click();
  assert.strictEqual(captured,exact);assert.equal(prepares,0);assert.equal(status.textContent,'capture reached');
  pdf.clear();captured=null;await click();assert.equal(captured,null);assert.equal(button.hidden,true);
  const ai=readFileSync(new URL('../dist/ai-local.mjs',import.meta.url),'utf8');
  assert.match(ai,/const prepared=await buildReadingRequest\(body\)/);assert.match(ai,/pdf\.setModel\(data\.modelUsed,prepared\)/);
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

test('question visuals use native fixed-width DOM capture and resolved role clones',()=>{
  const code=readFileSync(new URL('../dist/question-report.mjs',import.meta.url),'utf8'),app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
  for(const pattern of [/foreignObject/,/WIDTH=1160/,/position:fixed;left:-20000px/,/document\.fonts\.ready/,/cssRules/,/requestAnimationFrame.*requestAnimationFrame/,/snapshot\.header/,/snapshot\.elements/,/snapshot\.roles/,/delete diagram\.dataset\.active/,/animation:none!important;transition:none!important/])assert.match(code,pattern);
  assert.match(app,/id==='self'/);assert.match(app,/id==='topic_0'/);assert.match(app,/topicRole\?\.palace!=null\?topicRole:.*id==='event'/);
  assert.match(app,/NGƯỜI HỎI · NHẬT CAN/);assert.match(app,/SỰ VIỆC · DỤNG THẦN/);assert.match(app,/SỰ VIỆC · THỜI CAN/);assert.match(app,/node\.open=true/);
  assert.doesNotMatch(code,/pdfkit|\.ttf|\.woff|api\/export/);
});

const fakeGlyph=()=>({advance:520,width:8,height:8,x:0,y:-200,w:520,h:1000,mask:new Uint8Array(8).fill(255)});
test('hybrid PDF uses text operators, separate Type3 variants, Unicode maps and valid byte offsets',async()=>{
  const alphabet=Array.from({length:450},(_,i)=>String.fromCodePoint(0x400+i)).join('');
  const blocks=[{kind:'paragraph',runs:[{text:'Tiếng Việt 😀 ',bold:false},{text:'đậm',bold:true},{text:alphabet}]},...Array.from({length:150},()=>({kind:'paragraph',runs:[{text:'Một dòng dài để kiểm tra phân trang. '.repeat(4)}]})),{kind:'paragraph',runs:[{text:'KẾT THÚC'}]}];
  const blob=writeQuestionPdf({pages:[{url:'data:image/jpeg;base64,/9j/2Q==',width:1160,height:900}],blocks,glyphFactory:fakeGlyph});
  const bytes=new Uint8Array(await blob.arrayBuffer()),pdf=new TextDecoder().decode(bytes);
  assert.equal(pdf.slice(0,8),'%PDF-1.4');assert.match(pdf,/\/Subtype \/Type3/);assert.match(pdf,/\/ToUnicode \d+ 0 R/);assert.match(pdf,/BT \/F\d+ 11 Tf .* Tm <[0-9A-F]+> Tj ET/);
  assert.match(pdf,/<D83DDE00>/);assert.match(pdf,/<1EBF>/);assert.match(pdf,/\/MediaBox \[0 0 1191 842\]/);assert.match(pdf,/\/MediaBox \[0 0 595 842\]/);
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
