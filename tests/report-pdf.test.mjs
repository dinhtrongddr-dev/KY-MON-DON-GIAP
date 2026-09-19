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
  const question=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),menh=readFileSync(new URL('../dist/menh.html',import.meta.url),'utf8'),client=readFileSync(new URL('../dist/report-export.mjs',import.meta.url),'utf8');
  assert.match(question,/id="report-pdf"[^>]*>Xuất \/ chia sẻ PDF</);assert.match(menh,/id="menh-report-pdf"[^>]*>Xuất \/ chia sẻ PDF</);
  assert.match(client,/title:'Kỳ Môn Bàn'/);assert.match(client,/ky-mon-ban-hoi-viec/);assert.match(client,/ky-mon-ban-menh/);
  assert.match(client,/richParagraph/);assert.match(client,/menh-ai-focus/);assert.match(client,/isMobileShareDevice/);assert.match(client,/canMobileShare=isMobileShareDevice\(\)&&navigator\.share/);assert.match(client,/Đã tải file PDF về máy/);assert.match(client,/toDataURL\('image\/jpeg'/);assert.match(client,/details,button,\.ai-trace,\.ai-evidence/);
  assert.doesNotMatch(client,/api\/export\/pdf/);
});
