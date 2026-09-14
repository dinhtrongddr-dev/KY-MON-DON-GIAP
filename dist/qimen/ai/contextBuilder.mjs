import {toQimenBoard} from '../core/board.mjs';
import {analyzeBoard} from '../analysis/index.mjs';
import {normalizeActors} from '../analysis/usefulGod.mjs';
import {relationGraph} from '../analysis/relationGraph.mjs';
import {analyzeMode} from '../modes/index.mjs';
import {classifyTopic} from './classifier.mjs';
import {normalizeAction} from '../modes/actionRules.mjs';
import {compareTimes} from './timingComparison.mjs';
import {buildQuestionContext} from './questionContext.mjs';
import {domainSemantics} from '../modes/semantics.mjs';
import {buildReadingEvidenceGraph} from './reasoningPlanner.mjs';
export {buildReadingEvidenceGraph} from './reasoningPlanner.mjs';
export function buildAnalysisContext(chart,body,facts) {
  const questionContext=buildQuestionContext(body.question,{mode:body.mode??'auto',topic:body.topic,depth:body.depth??'standard'});
  const classification=questionContext.classification,actors=normalizeActors(body.actors??{});
  const resolvedTopic=body.topic==='general'?classifyTopic(body.question):body.topic;
  const board=toQimenBoard(chart),analysis=analyzeBoard(board,{topic:resolvedTopic,actors,questionContext});
  const action=normalizeAction(['timing','direction'].includes(classification.mode)?body.action??'general':'general');
  const plan=analyzeMode(classification.mode,analysis,{action});
  const comparison=classification.mode==='timing'?compareTimes(board,body.candidates,{action,topic:resolvedTopic,actors}):null;
  const graph=relationGraph(analysis,[...new Set([...plan.roleIds,...domainSemantics(questionContext.domain).roles,...analysis.roles.filter(r=>r.id.startsWith('topic_')||r.status==='user_supplied').map(r=>r.id)])]);
  for(const role of analysis.roles)facts[role.evidenceId]=`${role.label}: ${role.palace===null?'chưa xác định cung':`cung ${role.palace}`}; ${role.status}; căn cứ ${role.basis}. Đại diện là quy ước hoặc thông tin người dùng, không xác minh danh tính/tâm ý thực tế.`;
  for(const p of analysis.palaces)facts[`strength_${p.number}`]=`Cung ${p.number}: ${p.star.vi} ${p.strength.star.status} theo tháng ${board.pillars.month.vi} (${p.strength.monthElement}). ${p.strength.convention}`;
  facts.special=`Ngũ bất ngộ thời: ${analysis.patterns.wuBuYuShi?'có':'không'} (Thời can khắc Nhật can cùng âm/dương). ${analysis.patterns.coverage}`;
  for(const [i,p] of analysis.patterns.matches.entries())facts[`special_${i}`]=`${p.name} tại cung ${p.palace}: ${p.heavenStem} trên ${p.earthStem}${p.carried?', xét can ký':''}. Chỉ là tổ hợp, không kết luận thành/bại.`;
  for(const c of analysis.contradictions)facts[c.id]=`Cung ${c.palace}: ${c.text}`;
  for(const edge of graph.relations)facts[edge.id]=`${graph.nodes.find(n=>n.id===edge.from).label} (cung ${edge.fromPalace}) → ${graph.nodes.find(n=>n.id===edge.to).label} (cung ${edge.toPalace}): ${edge.text}; ${edge.samePalace?'đồng cung':'khác cung'}. Không suy chiều thời gian từ cạnh này.`;
  for(const step of plan.chain)facts[step.id]=`${plan.label} / ${step.title}: ${step.focus} Đại diện cần nối: ${step.roleIds.join(', ')}. Đây là khâu phân tích, không phải sự kiện đã xảy ra.`;
  for(const row of comparison?.ranking||plan.computed.ranking||[])facts[row.id]=`${row.label}: nhóm ${row.rank}, ${row.blockers.length} điều kiện cản; ${row.fit} dấu hiệu hợp mục tiêu theo bộ lọc app. ${row.blockers.join('; ')}. ${row.supports.join('; ')}. ${row.note} Không phải xác suất thành công.`;
  const relevantPalaces=classification.mode==='direction'?analysis.palaces.map(p=>p.number):[...new Set(graph.nodes.map(n=>n.palace).filter(Boolean))];
  const known=graph.nodes.filter(n=>n.status!=='unresolved').length;
  const reasoning=buildReadingEvidenceGraph(analysis,questionContext,plan,graph);
  return {board,analysis,plan,graph,classification,actors,resolvedTopic,relevantPalaces,action,comparison,questionContext,reasoning,
    coverage:{resolvedActors:known,totalActors:graph.nodes.length,confidence:null,
      meaning:'Độ đủ đại diện chỉ mô tả dữ liệu; chưa có xác suất dự báo được hiệu chuẩn.'}};
}
