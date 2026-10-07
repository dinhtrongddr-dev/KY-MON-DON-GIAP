import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveReasoningMode,buildCanonicalChartPacket,interpretWholeChart,WHOLE_CHART_PACKET_VERSION} from '../local/whole-chart.mjs';
import {prepareReading} from '../local/reading.mjs';
import {classifyQuestion} from '../dist/qimen/ai/classifier.mjs';

const CASE={
  question:'Trong 30 ngày tới công ty Greencore của tôi có phát sinh đơn hàng cung cấp tạp vụ cho công ty nào không?',
  topic:'contract',
  method:'chaibu',
  input:{year:2026,month:9,day:22,hour:11,minute:28,tzOffset:7}
};

test('reasoning mode defaults to standard and rejects invalid values',()=>{
  assert.equal(resolveReasoningMode(undefined),'standard');
  assert.equal(resolveReasoningMode('whole_chart'),'whole_chart');
  assert.throws(()=>resolveReasoningMode('legacy'));
  assert.throws(()=>resolveReasoningMode(null));
});

test('whole chart packet preserves the supplied deterministic board and roles',()=>{
  const body={question:'Công việc sắp tới thế nào?',topic:'work',method:'chaibu',input:{year:2026,month:9,day:22,hour:11,minute:28,tzOffset:7}};
  const chart={method:'chaibu',dun:{ju:1},pillars:{day:{vi:'Giáp'},hour:{vi:'Bính'}},input:{tzOffset:7},palaces:[{number:2,element:'Thổ',door:{vi:'Sinh Môn'},star:{vi:'Thiên Tâm'},spirit:{vi:'Lục Hợp'},heavenStems:[{vi:'Kỷ'}],earthStem:{vi:'Mậu'},voided:true,horse:false}],patterns:{starFuYin:true}};
  const packet=buildCanonicalChartPacket({chart,context:{question:body.question,selectedTopic:body.topic,topics:[]},analysis:{roles:[]},board:{id:'original'},facts:{}});
  assert.equal(packet.palaces[0].door,'Sinh Môn');
  assert.equal(packet.palaces[0].void,true);
  assert.equal(packet.globalStructure.patterns.starFuYin,true);
  assert.equal(packet.chartMeta.method,'chaibu');
  assert.equal(packet.question.text,body.question);
});

test('canonical packet contains the complete chart contract for a real reading',()=>{
  const prepared=prepareReading(CASE);
  const packet=buildCanonicalChartPacket(prepared);
  assert.equal(packet.schemaVersion,WHOLE_CHART_PACKET_VERSION);
  assert.equal(packet.palaces.length,9);
  assert.deepEqual(packet.palaces.map(p=>p.palace).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9]);
  assert.ok(packet.roles.deterministic.length>=1);
  assert.ok(packet.roles.relationships.length>=1);
  assert.equal(packet.question.mode,'prediction');
  assert.equal(packet.safeguards.noRecalculation,true);
  assert.ok(packet.palaces.filter(p=>p.palace!==5).every(p=>p.star&&p.door));
  assert.equal(packet.deterministic.reasoning,undefined);
  assert.equal(packet.salienceIndex.kind,'FACT_ONLY_SALIENCE_INDEX');
  assert.ok(packet.salienceIndex.salientPalaces.length>=1);
  assert.ok(!Object.hasOwn(packet.salienceIndex,'semantic_frame'));
  assert.ok(!Object.hasOwn(packet.salienceIndex,'action_chain'));
});

test('whole chart uses one direct writer call, with repair only after a failed draft',async()=>{
  const prepared=prepareReading(CASE);
  let calls=0;
  let firstInput=null;
  const runner=async(_instructions,input)=>{
    calls++;if(!firstInput)firstInput=input;
    const sections=input.surface.units.map(u=>({
      id:u.id,
      text:calls===1
        ?(u.id==='answer'?'Khách hàng sẽ ký hợp đồng ngay.':undefined)
        :'Tự tổng hợp các cung và cấu trúc liên quan trong đúng mục '+u.label+'; nêu cơ chế, điều kiện chuyển bước và dấu hiệu cần theo dõi.'
    }));
    return {text:JSON.stringify({sections})};
  };
  const reading=await interpretWholeChart(prepared,{runner});
  assert.equal(calls,2);
  assert.equal(reading.status,'reading');
  assert.ok(Object.hasOwn(reading.sections,'answer'));
  assert.ok(Object.hasOwn(reading.sections,'action_1'));
  assert.ok(Object.keys(reading.sections).length>=3);
  assert.equal(reading.sections.answer.paragraphs.length,1);
  assert.equal(firstInput.planning,undefined);
  assert.equal(firstInput.packet.deterministic.reasoning,undefined);
  assert.equal(firstInput.packet.salienceIndex.kind,'FACT_ONLY_SALIENCE_INDEX');
});

test('strategy wording routes the business case to strategy before Whole Chart runs',()=>{
  const result=classifyQuestion('Tôi cần làm gì để phát triển công ty và xây dựng đội ngũ 20 tạp vụ cung cấp cho doanh nghiệp?','auto');
  assert.equal(result.mode,'strategy');
});
