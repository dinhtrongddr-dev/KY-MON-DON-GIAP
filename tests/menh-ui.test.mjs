import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../dist/menh.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/menh-app.mjs',import.meta.url),'utf8');
const core=readFileSync(new URL('../dist/menh-reading-core.mjs',import.meta.url),'utf8');
const main=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const styles=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');

test('Mệnh UI exposes exactly known time input plus Không nhớ giờ sinh checkbox',()=>{
  assert.match(html,/id="birth-date"/);
  assert.match(html,/id="birth-time"/);
  assert.match(html,/id="birth-time-unknown"/);
  assert.match(html,/>Không nhớ giờ sinh</);
  assert.doesNotMatch(html,/birth-time-range|RANGE/);
});
test('Mệnh UI never submits a hidden remembered time in UNKNOWN mode',()=>{
  assert.match(app,/birthTimeMode:unknown\.checked\?'UNKNOWN':'KNOWN'/);
  assert.match(app,/birthTimeLocal:unknown\.checked\?null:parseBirthTime\(time\.value\)/);
  assert.match(app,/time\.value='';hour\.value='';minute\.value='';hour\.disabled=true;minute\.disabled=true/);
});
test('question and natal products link to each other without replacing the question form',()=>{
  assert.match(main,/href="\.\/index\.html" aria-current="page">Kỳ Môn Hỏi Việc/);assert.match(main,/href="\.\/menh\.html">Kỳ Môn Mệnh/);
  assert.match(html,/href="\.\/index\.html">Kỳ Môn Hỏi Việc/);
  assert.match(main,/id="chart-form"/);
  assert.match(html,/id="menh-form"/);
});
test('PC Mệnh form uses aligned four-column fields with Vietnamese date and 24-hour time entry',()=>{
  assert.match(html,/id="birth-date" type="text"[^>]*placeholder="DD\/MM\/YYYY"/);
  assert.match(html,/id="birth-date-picker"[^>]*>Lịch</);
  assert.match(html,/id="birth-date-native"[^>]*type="date"/);
  assert.match(html,/id="birth-hour"[^>]*><option value="">Giờ<\/option>/);assert.match(html,/id="birth-minute"[^>]*><option value="">Phút<\/option>/);assert.match(html,/id="birth-time" type="hidden"/);
  assert.match(app,/parseBirthDate\(date\.value\)/);assert.match(app,/parseBirthTime\(time\.value\)/);assert.match(app,/populateTimeSelectors/);assert.match(app,/syncTimeValueFromSelectors/);assert.match(app,/digits\.length===2.*digits\+'\/'/);assert.match(app,/digits\.length===4.*digits\.slice\(0,2\).*'\/'/);
  assert.match(app,/showPicker/);assert.match(styles,/\.menh-input-grid>\.field\{grid-template-rows:18px 48px minmax\(34px,auto\)/);
});

test('primary Kỳ Môn product switch is centered on desktop and fully named',()=>{
  assert.match(styles,/grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/);
  assert.match(styles,/\.topbar>\.product-nav\{grid-column:2;justify-self:center\}/);
  assert.match(main,/Kỳ Môn Hỏi Việc/);assert.match(html,/Kỳ Môn Hỏi Việc/);
});

test('Mệnh page loads calendar before the Mệnh app module',()=>{
  assert.ok(html.indexOf('./vendor/lunar.js')<html.indexOf('./menh-app.mjs'));
});


test('Mệnh UI renders the exact natal QimenBoard already used by KM-MENH instead of generating another board',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/prepared\.result\?\.natal\?\.baseBoard/);
  assert.match(view,/Mệnh bàn Kỳ Môn/);
  assert.doesNotMatch(view,/Mệnh bàn Kỳ Môn 3×3/);
  assert.match(view,/BẢN MỆNH · BẠN Ở ĐÂY/);
  assert.match(view,/Trực Phù/);
  assert.match(view,/Trực Sử/);
  assert.match(view,/Không Vong/);
  assert.match(view,/Mã tinh/);
  assert.match(view,/Phục Ngâm/);
  assert.match(view,/Phản Ngâm/);
  assert.doesNotMatch(view,/generateQimen|createQimenBoard/);
});

test('Mệnh known-time result mirrors Hỏi Việc chart meta, inspector, five elements and method details without recomputing a board',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/prepared\.result\?\.natal\?\.baseBoard/);
  assert.match(view,/chart-meta menh-chart-meta/);
  assert.match(view,/className='pillars'|el\('div','pillars'\)/);
  assert.match(view,/calculation-summary/);
  assert.match(view,/Tiết khí tại/);
  assert.match(view,/formatInstantAtOffset\(board\.term\.utcMs/);
  assert.match(view,/Tuần thủ · lục nghi ẩn Giáp/);
  assert.match(view,/workspace menh-workspace/);
  assert.match(view,/inspector menh-inspector/);
  assert.match(view,/Luận tượng từng cung/);
  assert.match(view,/mode:'destiny',domainId:'general_decision'/);
  assert.match(view,/menh-element-panel-template/);
  assert.match(view,/initMenhElementPanel/);
  assert.match(view,/select\(fallback\)/);
  assert.match(view,/renderMenhMethodDetails/);
  assert.doesNotMatch(view,/generateQimen|createQimenBoard/);
});
test('Mệnh element diagram template is the same visual system as Hỏi Việc and UNKNOWN mode does not fabricate one fixed chart-meta',()=>{
  assert.match(html,/id="menh-element-panel-template"/);
  for(const text of ['Ngũ hành tương sinh · tương khắc','data-element-choice="Hỏa"','data-element-choice="Thổ"','data-element-choice="Kim"','data-element-choice="Thủy"','data-element-choice="Mộc"','Tương sinh','Tương khắc'])assert.ok(html.includes(text));
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/if\(prepared\.input\.birthTimeMode==='KNOWN'\)/);
  assert.match(view,/else\{\s*container\.append\(renderUnknownBoardNotice\(prepared\)\)/);
});

test('Mệnh UI shows candidate boards for unknown birth time without pretending the leader is certain',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/Các Mệnh bàn có thể/);
  assert.match(view,/Đang dẫn đầu/);
  assert.match(view,/không thay thế giấy tờ hoặc ký ức về giờ sinh/);
  assert.match(view,/renderNatalBoard\(c\.board/);
});
test('Mệnh AI long-form renderer preserves paragraph breaks',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/appendAiParagraphs/);
  assert.match(view,/split\(\/\\n\{2,\}\//);
});

test('Mệnh profile accepts identity inputs without duplicating a technical-information card in the result',()=>{
  const core=readFileSync(new URL('../dist/menh-reading-core.mjs',import.meta.url),'utf8');
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(html,/id="birth-name"/);assert.match(html,/id="birth-place"/);
  assert.match(app,/fullName:name\.value\.trim\(\)/);assert.match(app,/birthPlace:place\.value\.trim\(\)/);
  assert.match(core,/fullName/);assert.match(core,/birthPlace/);
  assert.doesNotMatch(view,/Thông tin kỹ thuật|Dữ liệu lập bàn|renderTechnical/);
});
test('Mệnh deterministic basis is collapsed by default like Hỏi Việc evidence',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  const styles=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.match(view,/el\('details','menh-basis-details'\)/);
  assert.match(view,/details\.open=false/);
  assert.match(view,/Căn cứ Kỳ Môn của bài luận/);
  assert.match(view,/Các trục luận Mệnh/);
  assert.match(styles,/\.menh-basis-details>summary/);
});
test('Mệnh long-form reading visually emphasizes fast-scan translated takeaways without HTML injection',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(view,/FOCUS_PATTERNS/);assert.match(view,/formatParts/);assert.match(view,/automatic:false/);assert.match(view,/menh-ai-focus/);assert.match(view,/semanticCardNode/);
  assert.match(view,/document\.createTextNode/);assert.doesNotMatch(view,/innerHTML/);
  assert.match(view,/renderMenhPalaceDetail/);
});

test('unknown birth-time rectification uses remembered window and dated event precision instead of year buckets',()=>{
  assert.match(html,/id="rect-time-window"/);
  assert.match(html,/id="rect-add-event"/);
  assert.match(app,/collectRectEvents/);
  assert.match(app,/precision:'DAY'/);
  assert.match(core,/PRECISION_WEIGHT/);
  assert.match(core,/WINDOW_FAMILIES/);
  assert.match(core,/confidence=!minEvidence/);
  assert.doesNotMatch(html,/rect-marriage-years/);
});

test('unknown candidate can be explicitly promoted to the known board used by AI',()=>{
  const view=readFileSync(new URL('../dist/menh-view.mjs',import.meta.url),'utf8');
  assert.match(view,/menh-use-candidate/);
  assert.match(view,/Chọn bàn này để AI luận/);
  assert.match(app,/button\.dataset\.candidateTime/);
  assert.match(app,/unknown\.checked=false/);
  assert.match(app,/form\.requestSubmit\(\)/);
});

test('rectification accepts comma-separated dates and ignores whitespace',()=>{
  assert.match(app,/split\(\/\[,;\\n\]\+\//);
  assert.match(app,/replace\(\/\\s\+\/g,''\)/);
  assert.match(html,/Khoảng trắng không ảnh hưởng/);
});
