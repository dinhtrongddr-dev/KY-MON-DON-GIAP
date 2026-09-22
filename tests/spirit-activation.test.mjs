import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
globalThis.Solar=createRequire(import.meta.url)('../dist/vendor/lunar.js').Solar;

const {generateQimen,toQimenBoard}=await import('../dist/qimen/core/board.mjs');
const {analyzeBoard}=await import('../dist/qimen/analysis/index.mjs');
const {getBackingDirection,evaluateSpiritActivation,natalSpiritProfile,ACTIVATION_GOALS}=await import('../dist/qimen/analysis/spiritActivation.mjs');
const {SEMANTIC_MATRIX}=await import('../dist/qimen/semantic/matrix-data.mjs');
const {prepareReading,validateReading}=await import('../dist/reading-core.mjs');
const {buildWriterContext}=await import('../dist/qimen/ai/writerContext.mjs');
const {readingFixture}=await import('./reading-fixture.mjs');
const {createActivationSessionStore}=await import('../dist/spirit-activation-ui.mjs');

const input=(hour=10)=>({year:2026,month:9,day:22,hour,minute:0,tzOffset:7});
const boardAt=hour=>toQimenBoard(generateQimen(input(hour),'chaibu'));

test('back-facing helper maps all eight palaces to exact opposite facing directions',()=>{
  const expected={
    1:['Bắc','Nam'],8:['Đông Bắc','Tây Nam'],3:['Đông','Tây'],4:['Đông Nam','Tây Bắc'],
    9:['Nam','Bắc'],2:['Tây Nam','Đông Bắc'],7:['Tây','Đông'],6:['Tây Bắc','Đông Nam']
  };
  for(const [palace,[back,face]] of Object.entries(expected)){
    const row=getBackingDirection(Number(palace));
    assert.equal(row.sourceDirection,back,palace);
    assert.equal(row.facingDirection,face,palace);
    assert.match(row.instruction,new RegExp(back));
    assert.match(row.instruction,new RegExp(face));
  }
  assert.throws(()=>getBackingDirection(5),/8 cung phương vị/);
});

test('all eight deity semantic entries contain activation and practice fields without a second dictionary',()=>{
  const required=['coreMeaning','modernMeaning','strengths','risks','bestFor','avoidFor','meditationTheme','activationTheme','practiceInstruction','keywords','relatedLifeAreas','activation_affinity'];
  assert.equal(SEMANTIC_MATRIX.symbols.deities.length,8);
  for(const deity of SEMANTIC_MATRIX.symbols.deities)for(const key of required){
    assert.ok(Object.hasOwn(deity,key),deity.name+' missing '+key);
    assert.notEqual(deity[key],null,deity.name+' '+key);
  }
});

test('hourly Bát Thần positions really move when the time board changes',()=>{
  const a=boardAt(8),b=boardAt(14);
  const map=board=>Object.fromEntries(board.palaces.filter(p=>p.number!==5).map(p=>[p.number,p.spirit.id]));
  const one=map(a),two=map(b);
  assert.notDeepEqual(one,two);
  assert.ok(Object.keys(one).some(n=>one[n]!==two[n]));
});

test('activation engine evaluates every palace for all requested goal families',()=>{
  const board=boardAt(10);
  const goals=['love','investment','work','study','property','negotiation','meditation'];
  for(const goal of goals){
    const analysis=analyzeBoard(board,{topic:goal==='love'?'love':goal==='investment'?'investment':goal==='work'?'work':goal==='study'?'study':goal==='property'?'property':goal==='negotiation'?'contract':'general'});
    const result=evaluateSpiritActivation(board,goal,{analysis});
    assert.equal(result.candidates.length,8,goal);
    assert.equal(result.goal.id,goal,goal);
    assert.ok(result.candidates.every(x=>x.backDirection&&x.faceDirection&&x.activationLevel),goal);
    assert.ok(result.candidates.every(x=>!String(x.activationLevel).includes('score')),goal);
  }
  assert.ok(ACTIVATION_GOALS.length>=16);
});

test('a favorable spirit is downgraded when its whole palace has severe blockers',()=>{
  const board=structuredClone(boardAt(10));
  const harmony=board.palaces.find(p=>p.spirit.id==='harmony');
  harmony.voided=true;
  harmony.conditions={...(harmony.conditions||{}),doorPressure:true,punishment:['forced'],stemTombs:['forced']};
  const analysis={
    roles:[],
    structures:{byPalace:Object.fromEntries(board.palaces.filter(p=>p.number!==5).map(p=>[p.number,{doorRelation:{doorControlsPalace:p.number===harmony.number},fourHarms:[],stemResponses:[]}]))},
    formations:{byPalace:{}}
  };
  const result=evaluateSpiritActivation(board,'love',{analysis});
  const row=result.candidates.find(x=>x.palace===harmony.number);
  assert.equal(row.spirit.name,'Lục Hợp');
  assert.equal(row.activationLevel,'Không nên kích hoạt lúc này');
  assert.ok(row.warnings.length>=3);
  assert.notEqual(result.recommendedPalace,harmony.number);
});

test('natal spirit is read only from the natal self palace and is separate from a later hourly board',()=>{
  const natalBoard=boardAt(8),natalAnalysis=analyzeBoard(natalBoard,{topic:'general'});
  const self=natalAnalysis.roles.find(r=>r.id==='self');
  const profile=natalSpiritProfile(natalBoard,self.palace);
  assert.equal(profile.chartType,'destiny');
  assert.equal(profile.palace,self.palace);
  assert.equal(profile.spirit.name,natalBoard.palaces.find(p=>p.number===self.palace).spirit.vi);
  const later=boardAt(14);
  assert.notDeepEqual(
    natalBoard.palaces.filter(p=>p.number!==5).map(p=>p.spirit.id),
    later.palaces.filter(p=>p.number!==5).map(p=>p.spirit.id)
  );
});

test('AI receives deterministic activation data without raw score and validator blocks a different spirit/direction',()=>{
  const body={
    question:'Tôi nên dùng Thần nào và đặt phương vị nào sau lưng để hỗ trợ việc đàm phán hợp đồng này?',
    topic:'contract',mode:'strategy',method:'chaibu',input:input(10)
  };
  const p=prepareReading(body),activation=p.context.allInOne.spiritActivation;
  assert.equal(activation.requested,true);
  assert.ok(activation.recommended);
  assert.ok(p.facts.spirit_activation.includes(activation.recommended.spirit.name));
  const writer=buildWriterContext(p.context);
  assert.deepEqual(writer.readingGraph.spiritActivation,activation);
  assert.doesNotMatch(JSON.stringify(writer.readingGraph.spiritActivation),/"score"/);

  const good=readingFixture(p),r=activation.recommended;
  good.summary.text+=` Với thực hành Bát Thần, ${r.spirit.name} tại ${r.palaceName} được ưu tiên: đặt ${r.backDirection} phía sau lưng, mặt hướng ${r.faceDirection}; mức ${r.activationLevel}.`;
  assert.doesNotThrow(()=>validateReading(good,p.facts,'contract',p.context));

  const wrong=structuredClone(good),other=activation.candidates.find(x=>x.spirit.name!==r.spirit.name);
  wrong.summary.text=wrong.summary.text.replace(r.spirit.name,other.spirit.name);
  assert.throws(()=>validateReading(wrong,p.facts,'contract',p.context),/Bát Thần|deterministic|Sai vị trí/);
});

test('activation session storage keeps minimal session metadata and never persists an original question field',()=>{
  const memory=new Map();
  const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const store=createActivationSessionStore({storage,now:()=>123456});
  assert.equal(store.save({chartType:'hourly',goalCategory:'work',palace:3,spirit:'Cửu Thiên',door:'Khai Môn',star:'Thiên Xung',stem:'Mậu',
    backDirection:'Đông',facingDirection:'Tây',duration:420,question:'Nội dung nhạy cảm không được lưu',notes:{noticed:'A',meaning:'B',verification:'C'}}),true);
  const rows=store.list();assert.equal(rows.length,1);
  assert.equal(rows[0].goalCategory,'work');assert.equal(rows[0].notes.verification,'C');
  assert.equal(Object.hasOwn(rows[0],'question'),false);
  assert.doesNotMatch(JSON.stringify(rows),/Nội dung nhạy cảm/);
});

test('Hỏi Việc and Mệnh pages are wired to the shared activation renderer',async()=>{
  const {readFile}=await import('node:fs/promises');
  const [html,app,menh,css]=await Promise.all([
    readFile(new URL('../dist/index.html',import.meta.url),'utf8'),
    readFile(new URL('../dist/app.mjs',import.meta.url),'utf8'),
    readFile(new URL('../dist/menh-view.mjs',import.meta.url),'utf8'),
    readFile(new URL('../dist/styles.css',import.meta.url),'utf8')
  ]);
  assert.match(html,/id="spirit-activation"/);
  assert.match(app,/renderHourlySpiritActivation\(spiritActivationPanel/);
  assert.match(menh,/renderNatalSpiritActivation\(spiritPanel/);
  assert.match(css,/KM-SPIRIT-ACTIVATION-1\.1/);
  assert.doesNotMatch(css,/QMDJ_SPIRIT_ACTIVATION_SCORE|BACK_DIRECTION/);
});
test('spirit activation UI explains purpose, keeps sitting instructions inside practice, and makes intention concrete',async()=>{
  const {readFile}=await import('node:fs/promises');
  const ui=await readFile(new URL('../dist/spirit-activation-ui.mjs',import.meta.url),'utf8');
  assert.match(ui,/Dùng phần này khi nào\?/);
  assert.match(ui,/Chọn trạng thái và phương vị hỗ trợ trước khi hành động/);
  assert.match(ui,/Đặt ý niệm — làm đúng như sau/);
  assert.match(ui,/Đọc thầm câu dưới đây đúng 1 lần/);
  assert.match(ui,/Điểm hai bên có thể cùng chấp nhận/);
  assert.match(ui,/Xem .* lựa chọn còn lại/);
  const hourly=ui.slice(ui.indexOf('function hourlyCard'),ui.indexOf('function introCallout'));
  assert.doesNotMatch(hourly,/directionDiagram|phía sau lưng|Mặt hướng/);
  const practice=ui.slice(ui.indexOf('function practicePanel'),ui.indexOf('function openPractice'));
  assert.match(practice,/directionDiagram\(data\)/);
});
