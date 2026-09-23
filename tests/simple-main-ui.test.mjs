import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const main=read('index.html'),menh=read('menh.html'),guide=read('guide.html'),server=read('server.html'),info=read('info.html'),infoJs=read('info.mjs'),app=read('app.mjs'),css=read('styles.css');

test('primary pages place three text utilities in the top-left header without changing the product switch',()=>{
  for(const html of [main,menh]){
    const headerStart=html.indexOf('<header class="topbar">'),headerEnd=html.indexOf('</header>',headerStart);
    const utility=html.indexOf('class="utility-index utility-topbar"',headerStart);
    assert.ok(utility>headerStart&&utility<headerEnd,'utility nav must live inside topbar');
    for(const label of ['Hướng dẫn','Thông tin','Kết nối'])assert.ok(html.slice(headerStart,headerEnd).includes('>'+label+'</a>'));
    for(const href of ['./guide.html','./server.html','./info.html'])assert.ok(html.includes('href="'+href+'"'));
    assert.match(html,/Kỳ Môn Hỏi Việc/);assert.match(html,/Kỳ Môn Mệnh/);
  }
});

test('Hỏi Việc main keeps only the primary workflow and removes secondary teaching/admin clutter',()=>{
  for(const id of ['chart-form','ai-title','pillars','qimen-board','palace-detail','element-diagram'])assert.ok(main.includes('id="'+id+'"'));
  for(const removed of ['id="local-setup"','class="activity-summary"','id="rule-analyze"','id="basics-title"','class="reading-strip"','class="method-details"'])assert.equal(main.includes(removed),false,removed);
  assert.match(main,/id="ai-token-shell"[^>]*data-state="disconnected"/);
  assert.match(main,/id="ai-connection-icon"[^>]*>×<\/span>/);
  assert.match(main,/id="local-check"[^>]*>[\s\S]*↵[\s\S]*<\/button>/);
});

test('Mệnh main uses the same compact AI connection and removes activity/scope clutter',()=>{
  for(const id of ['menh-form','menh-ai-title','menh-deterministic','menh-ai-token-shell','menh-ai-connection-icon'])assert.ok(menh.includes('id="'+id+'"'));
  assert.equal(menh.includes('class="activity-summary"'),false);
  assert.equal(menh.includes('menh-scope'),false);
  assert.match(menh,/id="menh-ai-connection-icon"[^>]*>×<\/span>/);
  assert.match(menh,/id="menh-local-check"[^>]*>[\s\S]*↵[\s\S]*<\/button>/);
});

test('primary inputs hide advanced time/place controls and verbose mode explanation while keeping the selects',()=>{
  assert.match(main,/Nhóm sự việc<\/span><select id="topic"/);
  assert.match(main,/id="qimen-mode"/);
  assert.match(main,/id="mode-explanation"[^>]*hidden/);
  assert.match(main,/class="timeplace-details" hidden/);
  assert.match(menh,/class="timeplace-details menh-timeplace-details" hidden/);
  assert.match(css,/\.mode-controls\{padding:0;border:0/);
  assert.match(css,/\.timeplace-details\[hidden\]\{display:none!important\}/);
});

test('supplemental information derives Niên Can Chi from birth data without manual representative selectors',()=>{
  assert.match(main,/class="related-people-options"/);
  assert.match(main,/\+ Bổ sung thông tin · Thêm căn cứ luận bàn/);
  assert.doesNotMatch(main,/class="actor-options"|class="nianming-options"|Can Chi đại diện|id="actor-/);
  for(const id of ['nianming-self','nianming-subject','nianming-customer','nianming-competitor','nianming-decisionMaker']){
    assert.equal((main.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
    assert.equal((main.match(new RegExp('id="nianming-mode-'+id.replace('nianming-','')+'-date"','g'))||[]).length,1,id+' date mode');
    assert.equal((main.match(new RegExp('id="nianming-mode-'+id.replace('nianming-','')+'-year"','g'))||[]).length,1,id+' year mode');
  }
  assert.match(main,/Chọn ngày sinh/);assert.match(main,/Chọn năm sinh/);assert.match(css,/\.nianming-mode-link/);
  for(const role of ['Người hỏi','Người được hỏi thay','Khách hàng / đối phương','Đối thủ / bên cạnh tranh','Người có quyền duyệt'])assert.ok(main.includes(role));
  assert.match(main,/app tự tính <strong>Niên Can Chi<\/strong>/);
  assert.match(css,/\.related-people-list/);
});

test('product profile is fixed to Tháo Bổ and the method selector is removed',()=>{
  for(const html of [main,menh])assert.match(html,/Thời Gia · Chuyển Bàn · Tháo Bổ/);
  assert.doesNotMatch(main,/id="method"|Mao Sơn · 5 ngày\/nguyên/);
  assert.match(app,/const QIMEN_METHOD = 'chaibu'/);
  assert.match(app,/generateQimen\(timePlace\.boardInput, QIMEN_METHOD\)/);
  assert.match(app,/method:QIMEN_METHOD/);
  assert.match(info,/chốt dùng Tháo Bổ theo Phù đầu/);
});

test('board legend visibly explains dot, triangle and role symbols',()=>{
  for(const label of ['◉','◆','◇','●','▲','Người hỏi','Sự việc','Niên Mệnh','Thuận mạnh','Cảnh báo mạnh','Xung đột'])assert.ok(main.includes(label),label);
  assert.match(main,/class="board-key[^"]*board-key-explained"/);
  assert.match(css,/\.board-key-explained em/);
});

test('Guide covers modes, AI wait expectation, Mệnh use and beginner board reading',()=>{
  for(const label of ['Tự động','Dự đoán','Chiến lược','Thương chiến','Đàm phán','Chọn thời điểm','Chọn phương hướng'])assert.ok(guide.includes(label));
  assert.match(guide,/2–4 phút/);
  for(const layer of ['Cung','Thần','Tinh','Môn','Can'])assert.ok(guide.includes('<strong>'+layer+'</strong>'));
  assert.match(guide,/Không nhớ giờ sinh/);
  assert.match(guide,/Xem AI/);
});

test('Server page contains VPS setup while info page owns activity and system detail',()=>{
  assert.match(server,/VPS/);assert.match(server,/systemd/i);assert.match(server,/install-vps-autostart\.sh/);assert.match(server,/QIMEN_PAIRING_TOKEN/);
  assert.match(info,/id="activity-chart-count"/);assert.match(info,/id="activity-reading-count"/);assert.match(info,/id="activity-reading-list"/);
  assert.match(infoJs,/createActivityLog/);assert.match(infoJs,/api\/status/);
  assert.match(info,/TG-CB-6\.3/);assert.match(info,/KM-MENH-1\.1/);
});

test('new compact UI styles status symbols and mobile controls without textual color legends',()=>{
  assert.match(css,/\.ai-token-shell/);assert.match(css,/data-state="connected"/);assert.match(css,/\.utility-index/);
  for(const html of [main,menh])for(const phrase of ['Mộc · xanh lá','Hỏa · đỏ','Thổ · nâu','Kim · vàng','Thủy · xanh dương','Màu dùng để nhận diện hành'])assert.equal(html.includes(phrase),false);
});
