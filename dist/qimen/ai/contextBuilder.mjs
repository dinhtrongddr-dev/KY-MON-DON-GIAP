import {toQimenBoard} from '../core/board.mjs';
import {analyzeBoard} from '../analysis/index.mjs';
import {normalizeActors} from '../analysis/usefulGod.mjs';
import {relationGraph} from '../analysis/relationGraph.mjs';
import {analyzeMode} from '../modes/index.mjs';
import {classifyTopic} from './classifier.mjs';
import {normalizeAction} from '../modes/actionRules.mjs';
import {compareTimes} from './timingComparison.mjs';
import {buildQuestionContext} from './questionContext.mjs';
import {buildReadingEvidenceGraph} from './reasoningPlanner.mjs';
import {pillarFromGanzhi} from '../core/calendar.mjs';
import {relevantActorIds} from '../analysis/actorRelevance.mjs';
import {normalizeNianmingInput} from '../analysis/nianmingEngine.mjs';
export {buildReadingEvidenceGraph} from './reasoningPlanner.mjs';
export function buildAnalysisContext(chart,body,facts) {
  const questionContext=buildQuestionContext(body.question,{mode:body.mode??'auto',topic:body.topic,depth:body.depth??'deep',direction:body.direction??null,subject:body.subject??null});
  const classification=questionContext.classification,actors=normalizeActors(body.actors??{}),nianmingInput=normalizeNianmingInput(body.nianming??{});
  const resolvedTopic=questionContext.resolvedTopic;
  const board=toQimenBoard(chart),selfPillar=questionContext.subject.mapping?pillarFromGanzhi(questionContext.subject.mapping.pillar):board.pillars.day;
  if(questionContext.subject.mapping)questionContext.subject.mapping.pillar=selfPillar.han;
  const analysis=analyzeBoard(board,{topic:resolvedTopic,actors,questionContext,selfPillar,nianming:nianmingInput});
  const action=normalizeAction(['timing','direction'].includes(classification.mode)?body.action??'general':'general');
  const plan=analyzeMode(classification.mode,analysis,{action,direction:questionContext.direction});
  const comparison=classification.mode==='timing'?compareTimes(board,body.candidates,{action,topic:resolvedTopic,actors,selfPillar,timePlace:body.timePlace??null}):null;
  const roleIds=relevantActorIds(questionContext,analysis.roles,plan);
  const graph=relationGraph(analysis,[...new Set(['event','self',...roleIds])]);
  for(const role of analysis.roles){
    const tier=role.yongshenTier?`; Dụng Thần ${role.yongshenTier}${role.yongshenPurpose?` — ${role.yongshenPurpose}`:''}`:'';
    facts[role.evidenceId]=`${role.label}: ${role.palace===null?'chưa xác định cung':`cung ${role.palace}`}; ${role.status}; căn cứ ${role.basis}${tier}. Đại diện là quy ước hoặc thông tin người dùng, không xác minh danh tính/tâm ý thực tế.`;
  }
  for(const p of analysis.palaces){
    const stemStrength=p.strength.stems.map(s=>`${s.stem}: ${s.capacityWeight>=0.8?'mạnh':s.capacityWeight>=0.6?'khá mạnh':s.capacityWeight>=0.4?'trung bình':s.capacityWeight>=0.2?'yếu':'rất yếu'}${s.carried?' (can ký)':''} — ${s.longevity.meaning}`).join(' | ');
    facts[`strength_${p.number}`]=`Cung ${p.number}: Cửu Tinh ${p.star.vi} ${p.strength.star.level}; Bát Môn ${p.door.vi} ${p.strength.door.level}; môi trường cung ${p.strength.palace.level}; Can: ${stemStrength}. Tháng ${board.pillars.month.vi} (${p.strength.monthElement}). KM-STRENGTH-2.0 dùng mô hình riêng cho Tinh/Môn/Can/Cung; các mức này là lực biểu tượng, không phải xác suất.`;
    const s=analysis.structures.byPalace[p.number];
    const roleResponses=s.stemResponses.filter(x=>x.actorIds.length).map(x=>`${x.pair}: ${x.plainMeaning}${x.carried?' (can ký)':''}`);
    const harms=s.fourHarms.map(x=>x.code+(x.stem?`:${x.stem}`:''));
    const patterns=s.patterns.map(x=>x.plainMeaning);
    facts[`structure_${p.number}`]=`Cung ${p.number}: ${s.doorRelation.label}. Tứ hại: ${harms.length?harms.join(', '):'không có trên vai đang xét'}. Thập Can Khắc Ứng liên quan: ${roleResponses.length?roleResponses.join(' | '):'không có can đại diện cần ưu tiên'}. Cách cục: ${patterns.length?patterns.join(' | '):'không có cách cục ưu tiên'}. Đây là điều kiện cấu trúc, không phải xác suất hoặc sự kiện đã xảy ra.`;
    const k=analysis.keying.byPalace[p.number];
    const roleDoorStem=k.doorStems.filter(x=>x.actorIds.length).map(x=>`${x.doorVi}+${x.stem}: ${x.plainMeaning}${x.carried?' (can ký)':''}`);
    const roleWonders=k.wonders.filter(x=>x.actorIds.length).map(x=>`${x.stem} Kỳ đáo cung: ${x.plainMeaning}${x.carried?' (can ký)':''}`);
    facts[`keying_${p.number}`]=`Cung ${p.number}: Môn×Môn ${k.doorDoor.heavenDoorVi}+${k.doorDoor.earthDoorVi}: ${k.doorDoor.plainMeaning} Môn–Cung: ${k.doorPalace.classicalLabel} — ${k.doorPalace.plainMeaning} ${roleDoorStem.length?`Môn×Can gắn vai: ${roleDoorStem.join(' | ')} `:''}${roleWonders.length?`Tam Kỳ đáo cung gắn vai: ${roleWonders.join(' | ')} `:''}Cửu Tinh trị thời: ${k.starHour.starVi} giờ ${k.starHour.branchVi}, chỉ mục cổ điển để audit, chưa dùng chốt kết quả hiện đại. KM-KEYING-3.0 không cộng các lớp này như nhiều phiếu độc lập.`;
    const f=analysis.formations.byPalace[p.number],portal=analysis.formations.directional.byPalace[p.number];
    const fm=f.matches.map(x=>`${x.name}${x.qualified?'':x.qualificationStatus==='partial_tomb_coverage'?' (khớp cách cục, kiểm tra Mộ chưa đầy đủ)':x.blockers.length?' (bị hạ bởi '+x.blockers.join(', ')+')':' (chưa đủ điều kiện)'}: ${x.plainMeaning}`);
    const hg=portal.heavenGates.map(x=>`Thiên Môn ${x.name}→${x.landingBranchVi}/${x.direction}`),ed=portal.earthDoors.map(x=>`Địa Hộ ${x.name}→${x.landingBranchVi}/${x.direction}`);
    facts[`formation_${p.number}`]=`Cung ${p.number}: ${fm.length?fm.join(' | '):'không có Tam Trá/Ngũ Giả/Cửu Độn khớp.'} ${[...hg,...ed].length?`Phương vị chạm cung: ${[...hg,...ed].join(' | ')}. `:''}KM-FORMATION-3.0 chỉ mô tả kiểu hành động/phương vị truyền thống; không đổi kết luận hoặc thứ hạng.`;
  }
  for(const person of analysis.nianming.people){
    const state=person.status==='resolved'
      ?`niên trụ ${person.yearPillar.vi}; can năm ${person.yearStem}${person.hiddenJia?` quy nghi ẩn ${person.effectiveStem}`:` → ${person.effectiveStem}`} tại cung ${person.palace}`
      :`chưa xác định vì ${person.limitations.join(' ')}`;
    const linked=person.linkedRoleId?` Vai chính liên kết: ${person.linkedRoleId}${person.linkedRoleStatus?` (${person.linkedRoleStatus})`:''}.`:'';
    facts[person.evidenceId]=`KM-NIANMING-1.0 · ${person.label}: ${state}.${linked} Niên Mệnh chỉ là lớp đối chiếu; không thay Nhật can, Dụng Thần chính, primary judgment hoặc xác suất.`;
  }
  const rf=analysis.roleProfile.hostGuest;
  facts.role_frame=`KM-ROLE-2.0: tư thế câu hỏi ${rf.questionPosture}; thiên hướng theo can giờ ${rf.timeBias}; vai người hỏi ${rf.selfRole}; phía đối ứng ${rf.counterpartRole}. ${rf.actionBias} Chủ–Khách là tư thế theo việc, không phải bên thắng/thua.`;
  facts.special=`Ngũ bất ngộ thời: ${analysis.patterns.wuBuYuShi?'có':'không'} (Thời can khắc Nhật can cùng âm/dương). ${analysis.patterns.coverage} KM-STRUCTURE-2.0: ${analysis.structures.coverage.tenStemResponses}/81 Thập Can Khắc Ứng. KM-KEYING-3.0: ${analysis.keying.coverage.doorDoor} Môn×Môn, ${analysis.keying.coverage.doorStem} Môn×Kỳ/Nghi, ${analysis.keying.coverage.threeWonderPalace} Tam Kỳ đáo cung, ${analysis.keying.coverage.starHourIndex} chỉ mục Cửu Tinh trị thời. KM-FORMATION-3.0: Tam Trá ${analysis.formations.coverage.threeDeceptions.length}, Ngũ Giả ${analysis.formations.coverage.fiveFakes.length}, Cửu Độn ${analysis.formations.coverage.nineEscapes.length}, Thiên Tam Môn ${analysis.formations.coverage.heavenThreeGates}, Địa Tứ Hộ ${analysis.formations.coverage.earthFourDoors}. KM-DIRECTION-4.0: Địa Tư Môn ${analysis.directions.coverage.earthPrivateDoors}, Đình Đình/Bạch Gian, Thiên Mã/Thiên Cương, Tam Thắng ${analysis.directions.coverage.threeVictories}, Ngũ Bất Kích ${analysis.directions.coverage.fiveNoStrike}. KM-NIANMING-1.0: ${analysis.nianming.resolvedCount}/${analysis.nianming.inputCount} Niên Mệnh đã resolve; chỉ corroborator, không đổi Dụng Thần chính.`;
  for(const [i,p] of analysis.patterns.matches.entries())facts[`special_${i}`]=`${p.name} tại cung ${p.palace}: ${p.heavenStem} trên ${p.earthStem}${p.carried?', xét can ký':''}. Chỉ là tổ hợp, không kết luận thành/bại.`;
  for(const c of analysis.contradictions)facts[c.id]=`Cung ${c.palace}: ${c.text}`;
  for(const edge of graph.relations)facts[edge.id]=`${graph.nodes.find(n=>n.id===edge.from).label} (cung ${edge.fromPalace}) → ${graph.nodes.find(n=>n.id===edge.to).label} (cung ${edge.toPalace}): ${edge.text}; ${edge.samePalace?'đồng cung':'khác cung'}. Không suy chiều thời gian từ cạnh này.`;
  for(const step of plan.chain)facts[step.id]=`${plan.label} / ${step.title}: ${step.focus} Đại diện cần nối: ${step.roleIds.join(', ')}. Đây là khâu phân tích, không phải sự kiện đã xảy ra.`;
  for(const row of comparison?.ranking||plan.computed.ranking||[])facts[row.id]=`${row.label}: nhóm ${row.rank}, ${row.blockers.length} điều kiện cản; ${row.fit} dấu hiệu hợp mục tiêu theo bộ lọc app. ${row.blockers.join('; ')}. ${row.supports.join('; ')}. ${row.directionMarkers?.length?`Đối chiếu KM-DIRECTION-4.0: ${row.directionMarkers.map(x=>x.name).join(', ')}; marker không đổi rank. `:''}${row.note} Không phải xác suất thành công.`;
  const relevantPalaces=classification.mode==='direction'?analysis.palaces.map(p=>p.number):[...new Set(graph.nodes.map(n=>n.palace).filter(Boolean))];
  const known=graph.nodes.filter(n=>n.status!=='unresolved').length;
  const reasoning=buildReadingEvidenceGraph(analysis,questionContext,plan,graph,board);
  return {board,analysis,plan,graph,classification,actors,nianmingInput,resolvedTopic,relevantPalaces,action,comparison,questionContext,reasoning,
    coverage:{resolvedActors:known,totalActors:graph.nodes.length,confidence:null,
      meaning:'Độ đủ đại diện chỉ mô tả dữ liệu; chưa có xác suất dự báo được hiệu chuẩn.'}};
}
