import {BRANCHES,PALACES} from '../../qimen.mjs';
import {INNER_PALACES} from '../analysis/roleEngine.mjs';

export const TIMING_VERSION='KM-TIMING-4.0';
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

// ---------------------------------------------------------------------------
// KM-TIMING-4.0 (TG-CB-7.0 P5): multi-layer ứng kỳ. Each row carries its rule,
// basis (source), confidence and a civil date at the board's UTC offset, so the
// writer may cite it and the date gate can whitelist it. Rows are windows to
// watch, never guaranteed events.
const LAYER_SOURCES=Object.freeze({
  void_fill:'奇門旨歸·應期: 空亡逢填實', void_clash:'奇門旨歸·應期: 沖空則實',
  tomb_clash:'奇門旨歸·應期: 入墓逢沖', horse:'張志春: 驛馬主動，逢沖則發',
  combine_clash:'御定奇門寶鑑: 逢合待沖，逢沖待合', xun_exit:'旬空出旬則實',
  palace_number:'劉廣斌《奇門預測學》: 以落宮數定應期 (thang đo theo vượng suy)',
  term_support:'劉廣斌: 用神休囚待令月生扶', hour:'時應 (khung 2 giờ)'
});
const STEM_ELEMENT=Object.freeze({'甲':'Mộc','乙':'Mộc','丙':'Hỏa','丁':'Hỏa','戊':'Thổ','己':'Thổ','庚':'Kim','辛':'Kim','壬':'Thủy','癸':'Thủy'});
const BRANCH_ELEMENT=Object.freeze({'子':'Thủy','丑':'Thổ','寅':'Mộc','卯':'Mộc','辰':'Thổ','巳':'Hỏa','午':'Hỏa','未':'Thổ','申':'Kim','酉':'Kim','戌':'Thổ','亥':'Thủy'});
const GENERATES=Object.freeze({'Mộc':'Hỏa','Hỏa':'Thổ','Thổ':'Kim','Kim':'Thủy','Thủy':'Mộc'});
const CONFIDENCE_RANK={high:0,medium:1,low:2};
const TIER_RANK={primary:0,secondary:1,counterpart:2,corroborator:3,operational:4};

function focusBundle(selected){
  const ranked=[...selected].filter(b=>b?.palace).sort((a,b)=>{
    const rank=x=>Math.min(9,...(x.roles||[]).map(r=>TIER_RANK[r.yongshenTier]??9),x.actorIds?.includes('event')?0.5:9);
    return rank(a)-rank(b);
  });
  return ranked[0]||null;
}
function strengthScale(bundle){
  const band=bundle?.capacityStrength?.band||(['vượng','tướng'].includes(bundle?.strength?.status)?'strong':['tù','tử','phế'].includes(bundle?.strength?.status)?'weak':'usable');
  return band==='strong'?{band,unit:'day',days:1,label:'vượng: ứng gần (giờ/ngày)'}:
    band==='weak'?{band,unit:'month',days:30,label:'suy: ứng xa (tháng/tiết khí)'}:{band,unit:'week',days:7,label:'bình: ứng theo tuần'};
}
export function dayVoidBranches(dayPillarHan){
  const stem='甲乙丙丁戊己庚辛壬癸'.indexOf(dayPillarHan?.[0]),branch=branchIndex(dayPillarHan?.[1]);
  if(stem<0||branch<0)return [];
  const head=mod(branch-stem,12);
  return [branchHan(head+10),branchHan(head+11)];
}
function defaultWindow(board,pace,scale){
  const input=board.input,anchor=utcDate(input.year,input.month,input.day),end=new Date(anchor);
  const days=scale.unit==='month'||pace.tendency==='slow'?90:scale.unit==='day'||pace.tendency==='fast'?14:45;
  end.setUTCDate(end.getUTCDate()+days);
  return {start:iso(anchor),end:iso(end),tzOffset:input.tzOffset,purpose:'default_scope',scanUnit:'day',
    convention:'Câu hỏi không nêu thời hạn: phạm vi mặc định theo nhịp và vượng suy của Dụng Thần.'};
}
function addRow(rows,row){
  const key=row.layer+'|'+row.date+'|'+(row.slot||'')+'|'+row.rule;
  if(!rows.some(r=>r.key===key))rows.push({...row,key});
}
function nextTerms(board,limit){
  const Solar=globalThis.Solar,out=[];
  if(!Solar||!board?.nextTerm?.utcMs)return out;
  let ms=board.nextTerm.utcMs;
  for(let i=0;i<limit;i+=1){
    const civil=new Date(ms+board.input.tzOffset*3600000);
    out.push({utcMs:ms,id:null,date:civil});
    const bj=new Date(ms+8*3600000+3600000);
    try{
      const next=Solar.fromYmdHms(bj.getUTCFullYear(),bj.getUTCMonth()+1,bj.getUTCDate(),bj.getUTCHours(),bj.getUTCMinutes(),0).getLunar().getNextJieQi(false);
      const sol=next.getSolar();
      out[out.length-1].name=out[out.length-1].name||null;
      ms=Date.UTC(sol.getYear(),sol.getMonth()-1,sol.getDay(),sol.getHour(),sol.getMinute(),sol.getSecond())-8*3600000;
    }catch{break;}
  }
  return out;
}
export function buildTimingLayers(board,selected,window,pace){
  const rows=[];
  if(!board?.input||!board?.pillars?.day?.branch)return {rows,focus:null,scale:null,window};
  const focus=focusBundle(selected),scale=strengthScale(focus);
  const scope=window||defaultWindow(board,pace,scale);
  const anchor=utcDate(board.input.year,board.input.month,board.input.day);
  const startMs=Math.max(anchor.getTime(),dateFromIso(scope.start).getTime()),endMs=dateFromIso(scope.end).getTime();
  const current=branchIndex(board.pillars.day.branch.han);
  const relevant=selected.filter(b=>b?.palace&&Array.isArray(b.states));
  const isFocus=b=>focus&&b.palace===focus.palace;
  const conf=(b,base)=>isFocus(b)?base:base==='high'?'medium':'low';
  const dayVoid=dayVoidBranches(board.pillars.day.han).map(branchIndex);
  // Day layer: every rule (not only the highest-priority one).
  for(let ms=startMs;ms<=endMs;ms+=DAY_MS){
    const date=new Date(ms),idx=mod(current+Math.round((ms-anchor.getTime())/DAY_MS),12);
    const base={layer:'day',date:iso(date),display:display(date),branch:BRANCHES[idx].han,branchVi:BRANCHES[idx].vi};
    for(const b of relevant){
      const pb=PALACES[b.palace]?.branches||[],ev=(b.evidenceIds||[]).filter(id=>/^p\d+$|^c\d+$|^structure_\d+$/.test(id));
      const voided=b.states.some(st=>st.code==='void')||pb.some(x=>dayVoid.includes(x));
      if(voided&&pb.includes(idx))addRow(rows,{...base,rule:'void_fill',confidence:conf(b,'high'),palace:b.palace,evidenceIds:ev,reason:`Điền thực Không Vong tại cung ${b.palace} (ngày ${BRANCHES[idx].vi})`});
      if(voided&&pb.some(x=>mod(x+6,12)===idx))addRow(rows,{...base,rule:'void_clash',confidence:conf(b,'medium'),palace:b.palace,evidenceIds:ev,reason:`Xung Không tại cung ${b.palace} (ngày ${BRANCHES[idx].vi})`});
      for(const st of b.states.filter(x=>x.code==='tomb'&&TOMB_BRANCH_BY_STEM[x.detail])){
        const tomb=branchIndex(TOMB_BRANCH_BY_STEM[st.detail]);
        if(idx===mod(tomb+6,12))addRow(rows,{...base,rule:'tomb_clash',confidence:conf(b,'medium'),palace:b.palace,evidenceIds:ev,reason:`Xung Mộ của ${st.detail} (ngày ${BRANCHES[idx].vi})`});
      }
      if(b.states.some(x=>x.code==='horse')){
        const horse=branchIndex(board.horseBranch?.han);
        if(horse>=0&&(idx===horse||idx===mod(horse+6,12)))addRow(rows,{...base,rule:'horse',confidence:conf(b,'medium'),palace:b.palace,evidenceIds:ev,reason:idx===horse?`Mã tinh lâm ${BRANCHES[idx].vi}`:`Xung Mã tinh bằng ${BRANCHES[idx].vi}`});
      }
      for(const rel of instrumentRelations(b))if(idx===branchIndex(rel.targetBranch))addRow(rows,{...base,rule:'combine_clash',confidence:conf(b,'low'),palace:b.palace,evidenceIds:ev,
        reason:rel.relation==='clash'?`${rel.stem} gặp xung, chờ ngày hợp ${BRANCHES[idx].vi}`:`${rel.stem} gặp hợp, chờ ngày xung ${BRANCHES[idx].vi}`});
    }
  }
  // Xun layer: a voided branch stops being void when the next 甲 day opens a new xun.
  if(focus&&(focus.states||[]).some(st=>st.code==='void')){
    const dayIdx=sexIndex(board.pillars.day.han);
    if(dayIdx>=0){
      const toNext=10-(dayIdx%10),date=new Date(anchor.getTime()+toNext*DAY_MS);
      if(date.getTime()<=endMs)addRow(rows,{layer:'xun',date:iso(date),display:display(date),rule:'xun_exit',confidence:'medium',palace:focus.palace,
        evidenceIds:[`p${focus.palace}`],reason:`Sang tuần Giáp mới từ ${display(date)}: cung ${focus.palace} ra khỏi Không Vong`});
    }
  }
  // Palace-number layer (Lạc Thư), scaled by the focus Dụng Thần's strength.
  if(focus){
    const date=new Date(anchor.getTime()+focus.palace*scale.days*DAY_MS);
    if(date.getTime()<=endMs)addRow(rows,{layer:scale.unit,date:iso(date),display:display(date),rule:'palace_number',confidence:'low',palace:focus.palace,
      evidenceIds:[`p${focus.palace}`,`strength_${focus.palace}`],reason:`Số cung ${focus.palace} × đơn vị ${scale.unit==='day'?'ngày':scale.unit==='week'?'tuần':'tháng'} (${scale.label})`});
  }
  // Solar-term layer: a weak Dụng Thần answers when the month branch generates or matches it.
  const focusStem=focus?.roles?.find(r=>STEM_ELEMENT[r.stem])?.stem,focusElement=STEM_ELEMENT[focusStem]||PALACES[focus?.palace]?.element;
  if(focus&&scale.band!=='strong'&&focusElement){
    for(const t of nextTerms(board,8)){
      if(t.utcMs>endMs+DAY_MS)break;
      const civil=t.date,y=civil.getUTCFullYear(),m=civil.getUTCMonth()+1,d=civil.getUTCDate();
      let monthBranch=null;
      try{monthBranch=globalThis.Solar.fromYmdHms(y,m,d,12,0,0).getLunar().getMonthZhiExact();}catch{}
      const el=BRANCH_ELEMENT[monthBranch];
      if(!el)continue;
      if(el===focusElement||GENERATES[el]===focusElement){
        const date=utcDate(y,m,d);
        addRow(rows,{layer:'term',date:iso(date),display:display(date),rule:'term_support',confidence:'low',palace:focus.palace,evidenceIds:[`strength_${focus.palace}`],
          reason:`Giao tiết sang tháng ${monthBranch} (${el}) ${el===focusElement?'đồng hành':'sinh'} cho Dụng Thần (${focusElement})`});
        break;
      }
    }
  }
  // Hour layer: only for today/tomorrow-scale questions; 2-hour slots in the next 24h.
  if(board.pillars?.hour?.branch&&((window?.end&&dateFromIso(window.end).getTime()-anchor.getTime()<=DAY_MS)||pace.tendency==='fast')){
    const hourBranch=branchIndex(board.pillars.hour.branch.han),triggers=new Set();
    if(focus)for(const st of focus.states||[]){
      const pb=PALACES[focus.palace]?.branches||[];
      if(st.code==='void')pb.forEach(x=>triggers.add(x));
      if(st.code==='horse'){const h=branchIndex(board.horseBranch?.han);if(h>=0)triggers.add(mod(h+6,12));}
    }
    for(let step=1;step<=12;step+=1){
      const idx=mod(hourBranch+step,12);
      if(!triggers.has(idx))continue;
      const startHour=mod(idx*2-1,24),local=new Date(Date.UTC(board.input.year,board.input.month-1,board.input.day,board.input.hour)+step*2*3600000);
      local.setUTCHours(startHour);
      const slot=`${String(startHour).padStart(2,'0')}:00–${String((startHour+1)%24).padStart(2,'0')}:59`;
      addRow(rows,{layer:'hour',date:iso(local),display:display(local),slot,rule:'hour',confidence:'low',palace:focus.palace,evidenceIds:[`p${focus.palace}`],
        reason:`Giờ ${BRANCHES[idx].vi} (${slot}) chạm chi của Dụng Thần`});
    }
  }
  rows.sort((a,b)=>CONFIDENCE_RANK[a.confidence]-CONFIDENCE_RANK[b.confidence]||a.date.localeCompare(b.date));
  return {rows:rows.slice(0,12).map(({key,...r})=>({...r,source:LAYER_SOURCES[r.rule]||null})),focus:focus?{palace:focus.palace,actorIds:focus.actorIds||[]}:null,
    scale,window:scope,dayVoid:dayVoidBranches(board.pillars.day.han)};
}
function sexIndex(han){
  const stem='甲乙丙丁戊己庚辛壬癸'.indexOf(han?.[0]),branch=branchIndex(han?.[1]);
  if(stem<0||branch<0)return -1;
  for(let i=0;i<60;i+=1)if(i%10===stem&&i%12===branch)return i;
  return -1;
}
export function allowedTimingDates(timing){
  const out=new Set();
  for(const row of [...(timing?.candidates||[]),...(timing?.layers?.rows||[])]){
    if(row.display){out.add(row.display);out.add(row.display.replace(/\/\d{4}$/,''));}
    if(row.date)out.add(row.date);
  }
  for(const key of ['start','end'])if(timing?.window?.[key]){const [y,m,d]=timing.window[key].split('-');out.add(`${d}/${m}/${y}`);out.add(`${d}/${m}`);}
  return [...out];
}

export function buildTiming(context,board,selected=[]) {
  const h=context.timeHorizon;
  const {window}=timingWindow(context,board);
  const pace=timingPace(board,selected);
  const scanned=responseCandidates(board,selected,window);
  const layers=buildTimingLayers(board,selected,window,pace);
  // Back-compat: when the strict priority scan finds nothing, surface the strongest
  // layered rows (day/xun layers only) as candidates so writer and UI get dated windows.
  const candidates=scanned.length||!window?scanned:layers.rows.filter(r=>['day','xun'].includes(r.layer)&&r.confidence!=='low').slice(0,3)
    .map(r=>({date:r.date,display:r.display,branch:r.branch||null,branchVi:r.branchVi||null,rule:r.rule,priority:null,reasons:[r.reason],evidenceIds:r.evidenceIds,confidence:r.confidence,layer:r.layer}));
  const instrumentResponses=selected.flatMap(b=>instrumentRelations(b).map(r=>({...r,palace:b.palace,actorIds:b.actorIds||[]})));
  const milestoneLimit=h.status==='explicit_milestone'
    ?`Đã nhận mốc “${h.text}” như giới hạn quyết định, nhưng chưa có tuổi hiện tại hoặc ngày sinh để quy đổi thành khoảng lịch. Đây không phải ứng kỳ đã tính.`
    :candidates.length
      ?'Các mốc dưới đây là cửa sổ kích hoạt/đáng kiểm chứng theo KM-TIMING-3.0 trong đúng phạm vi người dùng đã nêu; không phải ngày bảo đảm sự việc xảy ra.'
      :'Chưa có mốc ứng kỳ đủ rõ trong phạm vi câu hỏi. Phản/Phục ngâm vẫn chỉ điều chỉnh nhịp; engine không tự bịa ngày từ một ký hiệu đơn lẻ.';
  return {version:TIMING_VERSION,horizon:h,window,pace,
    basis:candidates.length?'deterministic_response_scan_v3':'question_horizon_only',
    timingConfidence:candidates.length?'medium':'low',
    triggerPriority:TRIGGER_PRIORITY,allowedPredictions:candidates.flatMap(c=>[c.display,c.date]),candidates,instrumentResponses,layers,
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
      'Phản/Phục ngâm tự định ngày (chỉ điều chỉnh nhịp)',
      'Tinh–Môn sinh/khắc tự định một ngày khi chưa xác định được một can-chi đơn trị',
      'Geng-pattern tự định ngày'
    ],
    limit:milestoneLimit};
}


// Fact-only timing index for the direct Whole Chart path.
// It reuses deterministic timing rules without constructing the legacy
// evidence graph, semantic plan, or writer conclusion.
export function buildWholeChartTimingFacts(context,board,analysis) {
  const safeContext={
    ...(context||{}),
    timeHorizon:context?.timeHorizon||{code:'unspecified',status:'unspecified',text:''}
  };
  const roles=Array.isArray(analysis?.roles)?analysis.roles:[];
  const byPalace=new Map();
  for(const role of roles){
    if(!Number.isInteger(role?.palace))continue;
    const row=byPalace.get(role.palace)||{palace:role.palace,actorIds:[],roles:[],states:[],evidenceIds:[]};
    row.actorIds.push(role.id);
    row.roles.push({id:role.id,label:role.label||role.id,stem:role.stem||null,status:role.status||null});
    row.evidenceIds.push('p'+role.palace,'c'+role.palace);
    byPalace.set(role.palace,row);
  }
  for(const row of byPalace.values()){
    const palace=analysis.palaces?.find(p=>p.number===row.palace);
    if(!palace)continue;
    if(palace.voided)row.states.push({code:'void',detail:null});
    if(palace.horse)row.states.push({code:'horse',detail:null});
    for(const pair of palace.stemPairs||[]){
      const stem=pair.heaven?.han||pair.heaven?.vi||null;
      if(pair.punishment)row.states.push({code:'punishment',detail:stem});
      if(pair.tomb||pair.wonderTomb)row.states.push({code:'tomb',detail:stem});
    }
    row.states=[...new Map(row.states.map(state=>[state.code+':'+(state.detail||''),state])).values()];
    row.evidenceIds=[...new Set(row.evidenceIds)];
  }
  const selected=[...byPalace.values()].filter(row=>row.states.length||row.actorIds.some(id=>id==='self'||id==='event'));
  const timing=buildTiming(safeContext,board,selected);
  return {
    kind:'FACT_ONLY_TIMING_INDEX',
    version:timing.version,
    horizon:timing.horizon,
    window:timing.window,
    pace:timing.pace,
    basis:timing.basis,
    timingConfidence:timing.timingConfidence,
    triggerPriority:timing.triggerPriority,
    allowedPredictions:timing.allowedPredictions,
    candidates:timing.candidates,
    instrumentResponses:timing.instrumentResponses,
    signals:timing.signals,
    sourceProfile:timing.sourceProfile,
    unsupportedRules:timing.unsupportedRules,
    layers:timing.layers,
    limit:timing.limit,
    bundles:selected.map(row=>({
      palace:row.palace,actorIds:row.actorIds,roles:row.roles,states:row.states,evidenceIds:row.evidenceIds
    }))
  };
}
