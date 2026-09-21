import {BRANCHES,PALACES} from '../../qimen.mjs';
import {INNER_PALACES} from '../analysis/roleEngine.mjs';

export const TIMING_VERSION='KM-TIMING-3.0';
const DAY_MS=86400000;
export const TOMB_BRANCH_BY_STEM=Object.freeze({
  '乙':'未','丙':'戌','丁':'丑','戊':'戌','己':'丑','庚':'丑','辛':'辰','壬':'辰','癸':'未'
});
export const INSTRUMENT_BRANCH_BY_STEM=Object.freeze({'戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅'});
const SIX_HARMONY=Object.freeze({'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'});
const TRIGGER_PRIORITY=Object.freeze(['void_release','punishment_response','horse_activation','tomb_release','instrument_branch_response']);
const iso=date=>date.toISOString().slice(0,10);
const display=date=>{const [y,m,d]=iso(date).split('-');return `${d}/${m}/${y}`;};
const mod=(n,m)=>((n%m)+m)%m;
const branchIndex=han=>BRANCHES.findIndex(b=>b.han===han);
const branchHan=index=>BRANCHES[mod(index,12)]?.han||null;
const utcDate=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
const dateFromIso=value=>{const [y,m,d]=value.split('-').map(Number);return utcDate(y,m,d);};
const clashBranch=han=>{const i=branchIndex(han);return i<0?null:branchHan(i+6);};
const harmonyBranch=han=>SIX_HARMONY[han]||null;

function timingPace(board,selected=[]) {
  const inner=INNER_PALACES[board?.dun];
  if(!inner)return {tendency:'unknown',confidence:'low',fastWeight:0,slowWeight:0,signals:[],
    note:'Chưa đủ dữ kiện để phân loại nhịp ứng kỳ.'};
  const focus=selected.filter(b=>b?.actorIds?.some(id=>id==='event'||id==='self'));
  const bundles=focus.length?focus:selected.slice(0,2);
  let fastWeight=0,slowWeight=0;
  const signals=[];
  for(const bundle of bundles){
    const roles=bundle.actorIds||[];
    const weight=(roles.includes('event')?2:0)+(roles.includes('self')?1:0)||0.5;
    const isInner=inner.has(bundle.palace);
    if(isInner)fastWeight+=weight;else slowWeight+=weight;
    signals.push({code:isInner?'inner_plate':'outer_plate',palace:bundle.palace,
      actorIds:roles.filter(id=>id==='event'||id==='self'),effect:isInner?'faster':'slower',weight});
  }
  if(board.fanYin){fastWeight+=2;signals.push({code:'fan_yin',effect:'faster_reversing',weight:2,dateRuleImplemented:false});}
  if(board.fuYin){slowWeight+=2;signals.push({code:'fu_yin',effect:'slower_repeating',weight:2,dateRuleImplemented:false});}
  const delta=fastWeight-slowWeight;
  const tendency=Math.abs(delta)<0.75?'mixed':delta>0?'fast':'slow';
  const confidence=Math.abs(delta)>=2?'medium':'low';
  return {tendency,confidence,fastWeight,slowWeight,signals,
    convention:'Nội bàn thiên về gần/nhanh; ngoại bàn thiên về xa/chậm; Phản ngâm tăng động/đảo chiều, Phục ngâm tăng lặp/chậm.',
    note:'Đây là phân loại nhịp để chọn cách đọc cửa sổ thời gian, không phải xác suất và không tự tạo ngày xảy ra.'};
}

function roleInstrumentStems(bundle){
  const rows=(bundle.roles||[])
    .filter(r=>INSTRUMENT_BRANCH_BY_STEM[r.stem])
    .sort((a,b)=>({primary:0,secondary:1,counterpart:2,corroborator:3,operational:4}[a.yongshenTier]??9)-({primary:0,secondary:1,counterpart:2,corroborator:3,operational:4}[b.yongshenTier]??9));
  return [...new Set(rows.map(r=>r.stem))];
}
function instrumentRelations(bundle){
  const palaceBranches=(PALACES[bundle.palace]?.branches||[]).map(branchHan).filter(Boolean);
  const out=[];
  for(const stem of roleInstrumentStems(bundle)){
    const carried=INSTRUMENT_BRANCH_BY_STEM[stem],clash=clashBranch(carried),harmony=harmonyBranch(carried);
    if(palaceBranches.includes(clash))out.push({stem,carriedBranch:carried,palaceBranches,relation:'clash',targetBranch:harmony,
      source:'奇門法竅·論應期/論沖合斷法',rule:'逢沖決其合日定支'});
    else if(palaceBranches.includes(harmony))out.push({stem,carriedBranch:carried,palaceBranches,relation:'combine',targetBranch:clash,
      source:'奇門法竅·論應期/論沖合斷法',rule:'逢合決其沖日定支'});
  }
  return out;
}
function triggerBundles(selected=[]){
  const relevant=selected.filter(b=>b?.palace&&Array.isArray(b.states));
  const groups={
    void_release:relevant.filter(b=>b.states.some(s=>s.code==='void')),
    punishment_response:relevant.filter(b=>b.states.some(s=>s.code==='punishment'&&INSTRUMENT_BRANCH_BY_STEM[s.detail])),
    horse_activation:relevant.filter(b=>b.states.some(s=>s.code==='horse')),
    tomb_release:relevant.filter(b=>b.states.some(s=>s.code==='tomb'&&TOMB_BRANCH_BY_STEM[s.detail])),
    instrument_branch_response:relevant.filter(b=>instrumentRelations(b).length),
  };
  const rule=TRIGGER_PRIORITY.find(id=>groups[id].length);
  return {rule:rule||null,bundles:rule?groups[rule]:[]};
}
function responseCandidates(board,selected,window){
  if(!window||!board?.input||!board?.pillars?.day?.branch)return [];
  const anchor=utcDate(board.input.year,board.input.month,board.input.day);
  const startMs=Math.max(anchor.getTime(),dateFromIso(window.start).getTime());
  const endMs=dateFromIso(window.end).getTime();
  if(startMs>endMs)return [];
  const current=branchIndex(board.pillars.day.branch.han);
  if(current<0)return [];
  const {rule,bundles}=triggerBundles(selected);
  if(!rule)return [];
  const rows=[];
  for(let ms=startMs;ms<=endMs&&rows.length<6;ms+=DAY_MS){
    const date=new Date(ms),offset=Math.round((ms-anchor.getTime())/DAY_MS);
    const idx=mod(current+offset,12),reasons=[],evidenceIds=[];
    for(const bundle of bundles){
      const palaceBranches=PALACES[bundle.palace]?.branches||[];
      const localReasons=[];
      if(rule==='void_release'){
        if(palaceBranches.includes(idx))localReasons.push(`Điền thực Không vong tại cung ${bundle.palace}`);
        if(palaceBranches.some(v=>mod(v+6,12)===idx))localReasons.push(`Xung Không tại cung ${bundle.palace}`);
      }else if(rule==='punishment_response'){
        for(const state of bundle.states.filter(s=>s.code==='punishment')){
          const carried=INSTRUMENT_BRANCH_BY_STEM[state.detail],target=harmonyBranch(carried);
          if(target&&idx===branchIndex(target))localReasons.push(`Kích Hình của ${state.detail}: lấy ngày ${BRANCHES[idx].vi} theo lục hợp của chi ẩn ${BRANCHES[branchIndex(carried)].vi}`);
        }
      }else if(rule==='horse_activation'){
        const horse=branchIndex(board.horseBranch?.han);
        if(horse>=0&&idx===horse)localReasons.push(`Mã tinh lâm ${BRANCHES[idx].vi}`);
        if(horse>=0&&idx===mod(horse+6,12))localReasons.push(`Xung Mã tinh bằng ${BRANCHES[idx].vi}`);
      }else if(rule==='tomb_release'){
        for(const state of bundle.states.filter(s=>s.code==='tomb')){
          const tomb=branchIndex(TOMB_BRANCH_BY_STEM[state.detail]);
          if(tomb<0)continue;
          if(idx===tomb)localReasons.push(`${state.detail} đến chi Mộ ${BRANCHES[idx].vi}`);
          if(idx===mod(tomb+6,12))localReasons.push(`Xung Mộ của ${state.detail} bằng ${BRANCHES[idx].vi}`);
        }
      }else if(rule==='instrument_branch_response'){
        for(const relation of instrumentRelations(bundle)){
          if(idx!==branchIndex(relation.targetBranch))continue;
          localReasons.push(relation.relation==='clash'
            ?`${relation.stem} mang chi ẩn ${BRANCHES[branchIndex(relation.carriedBranch)].vi} gặp xung; lấy ${BRANCHES[idx].vi} là chi lục hợp để kiểm chứng`
            :`${relation.stem} mang chi ẩn ${BRANCHES[branchIndex(relation.carriedBranch)].vi} gặp hợp; lấy ${BRANCHES[idx].vi} là chi xung để kiểm chứng`);
        }
      }
      if(localReasons.length){
        reasons.push(...localReasons);
        evidenceIds.push(...(bundle.evidenceIds||[]).filter(id=>/^p\d+$|^c\d+$|^structure_\d+$/.test(id)));
      }
    }
    if(reasons.length)rows.push({date:iso(date),display:display(date),branch:BRANCHES[idx].han,
      branchVi:BRANCHES[idx].vi,rule,priority:TRIGGER_PRIORITY.indexOf(rule)+1,
      reasons:[...new Set(reasons)],evidenceIds:[...new Set(evidenceIds)]});
  }
  return rows;
}
function timingWindow(context,board){
  const h=context.timeHorizon,input=board?.input;
  if(!input)return {window:null,windowable:false};
  const anchor=utcDate(input.year,input.month,input.day),start=new Date(anchor),end=new Date(anchor);
  let windowable=false;
  switch(h.code){
    case 'this_week':case 'next_week':
      start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7)+(h.code==='next_week'?7:0));
      end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+6);windowable=true;break;
    case 'this_month':case 'next_month':
      start.setUTCDate(1);if(h.code==='next_month')start.setUTCMonth(start.getUTCMonth()+1);
      end.setTime(start.getTime());end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);windowable=true;break;
    case 'tomorrow':start.setUTCDate(start.getUTCDate()+1);end.setTime(start.getTime());windowable=true;break;
    case 'today':windowable=true;break;
    case 'duration':
      if(!Number.isSafeInteger(h.amount)||h.amount<1||h.amount>365)break;
      if(h.unit==='day'||h.unit==='week')end.setUTCDate(end.getUTCDate()+h.amount*(h.unit==='week'?7:1));
      else {
        const day=end.getUTCDate();end.setUTCDate(1);
        end.setUTCMonth(end.getUTCMonth()+h.amount*(h.unit==='year'?12:1));
        const last=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();
        end.setUTCDate(Math.min(day,last));
      }
      windowable=true;break;
    case 'milestone_age':break;
    default:break;
  }
  return {window:windowable?{start:iso(start),end:iso(end),tzOffset:input.tzOffset,
    purpose:'question_scope_only',scanUnit:'day',
    convention:'Tuần từ thứ Hai đến Chủ nhật; lịch dân dụng tại UTC offset của bàn.'}:null,windowable};
}
export function buildTiming(context,board,selected=[]) {
  const h=context.timeHorizon;
  const {window}=timingWindow(context,board);
  const pace=timingPace(board,selected);
  const candidates=responseCandidates(board,selected,window);
  const instrumentResponses=selected.flatMap(b=>instrumentRelations(b).map(r=>({...r,palace:b.palace,actorIds:b.actorIds||[]})));
  const milestoneLimit=h.status==='explicit_milestone'
    ?`Đã nhận mốc “${h.text}” như giới hạn quyết định, nhưng chưa có tuổi hiện tại hoặc ngày sinh để quy đổi thành khoảng lịch. Đây không phải ứng kỳ đã tính.`
    :candidates.length
      ?'Các mốc dưới đây là cửa sổ kích hoạt/đáng kiểm chứng theo KM-TIMING-3.0 trong đúng phạm vi người dùng đã nêu; không phải ngày bảo đảm sự việc xảy ra.'
      :'Chưa có mốc ứng kỳ đủ rõ trong phạm vi câu hỏi. Phản/Phục ngâm vẫn chỉ điều chỉnh nhịp; engine không tự bịa ngày từ một ký hiệu đơn lẻ.';
  return {version:TIMING_VERSION,horizon:h,window,pace,
    basis:candidates.length?'deterministic_response_scan_v3':'question_horizon_only',
    timingConfidence:candidates.length?'medium':'low',
    triggerPriority:TRIGGER_PRIORITY,allowedPredictions:candidates.flatMap(c=>[c.display,c.date]),candidates,instrumentResponses,
    signals:selected.flatMap(b=>b.states.filter(s=>['void','horse','fan_yin','fu_yin','tomb','punishment'].includes(s.code))
      .map(s=>({code:s.code,detail:s.detail??null,evidenceIds:[`p${b.palace}`,`c${b.palace}`],
        dateRuleImplemented:['void','horse'].includes(s.code)||
          (s.code==='tomb'&&!!TOMB_BRANCH_BY_STEM[s.detail])||
          (s.code==='punishment'&&!!INSTRUMENT_BRANCH_BY_STEM[s.detail])}))),
    sourceProfile:{
      primary:['奇門法竅·論應期','奇門法竅·論沖合斷法','奇門法竅·論三盤入墓'],
      compatibility:'KM-YINGQI-2.0 Void/Horse/Tam-Kỳ behavior retained unless a higher-priority newly supported direct condition applies.'
    },
    unsupportedRules:[
      'Phản/Phục ngâm tự định ngày',
      'Tinh–Môn sinh/khắc tự định một ngày khi chưa xác định được một can-chi đơn trị',
      'Geng-pattern tự định ngày',
      'Tự quét cấp giờ từ câu hỏi chỉ nêu ngày/tháng'
    ],
    limit:milestoneLimit};
}
