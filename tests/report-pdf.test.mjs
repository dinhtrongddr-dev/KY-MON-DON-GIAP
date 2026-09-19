import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildImagePdf} from '../dist/report-export.mjs';

test('client-side PDF builder creates a PDF without adding runtime dependencies',async()=>{
  const fakeCanvas={width:2,height:2,toDataURL(){return 'data:image/jpeg;base64,/9j/2Q==';}};
  const pdf=buildImagePdf([fakeCanvas]),bytes=new Uint8Array(await pdf.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.subarray(0,8)),'%PDF-1.4');
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));assert.equal(Object.keys(pkg.dependencies||{}).length,0);
});

test('browser UI exposes one PDF export/share button for both Hỏi việc and Mệnh',()=>{
  const question=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),menh=readFileSync(new URL('../dist/menh.html',import.meta.url),'utf8'),client=readFileSync(new URL('../dist/report-export.mjs',import.meta.url),'utf8');
  assert.match(question,/id="report-pdf"[^>]*>Xuất \/ chia sẻ PDF</);assert.match(menh,/id="menh-report-pdf"[^>]*>Xuất \/ chia sẻ PDF</);
  assert.match(client,/title:'Kỳ Môn Bàn'/);assert.match(client,/ky-mon-ban-hoi-viec/);assert.match(client,/ky-mon-ban-menh/);
  assert.match(client,/isMobileShareDevice/);assert.match(client,/canMobileShare=isMobileShareDevice\(\)&&navigator\.share/);assert.match(client,/Đã tải file PDF về máy/);assert.match(client,/toDataURL\('image\/jpeg'/);assert.match(client,/details,button,\.ai-trace,\.ai-evidence/);
  assert.doesNotMatch(client,/api\/export\/pdf/);
});
