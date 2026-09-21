import {initSharedView} from './share-view.mjs';
import {BRANCHES, STAR_QIN, elementSlug} from './qimen/core/palace.mjs';
import {formatInstantAtOffset, formatOffset} from './qimen/core/calendar.mjs';
import {generateQimen,toQimenBoard} from './qimen/core/board.mjs';
import {resolveTimePlace,localInputValueAtZone} from './qimen/timePlace.mjs';
import {TOPICS, GENERATES, CONTROLS, locateStem, palaceConditions} from './guide.mjs';
import {initLocalAi} from './ai-local.mjs';
import {initModeControls,initNianmingInputMasks} from './qimen/ui-controls.mjs';
import {createActivityLog} from './activity-log.mjs';
import {semanticBundle,semanticDomainForTopic} from './qimen/semantic/matrix.mjs';
import {classifyTopics} from './qimen/ai/classifier.mjs';
import {analyzeBoard} from './qimen/analysis/index.mjs';
import {buildAttentionProfile} from './qimen/analysis/attentionUi.mjs';

const form = document.querySelector("#chart-form");
const datetimeInput = document.querySelector("#datetime");
const timezoneInput = document.querySelector("#timezone");
const timezoneModeInput=document.querySelector('#timezone-mode');
const ianaTimezoneInput=document.querySelector('#iana-timezone');
const dstDisambiguationInput=document.querySelector('#dst-disambiguation');
const longitudeInput=document.querySelector('#longitude');
const latitudeInput=document.querySelector('#latitude');
const methodInput = document.querySelector("#method");
const methodNote = document.querySelector("#method-note");
const errorBox = document.querySelector("#form-error");
const resultSection = document.querySelector("#result");
const board = document.querySelector("#qimen-board");
const pillars = document.querySelector("#pillars");
const summary = document.querySelector("#calculation-summary");
const flags = document.querySelector("#board-flags");
const detail = document.querySelector("#palace-detail");
const inspectorTitle = document.querySelector("#inspector-title");
const methodCopy = document.querySelector("#method-copy");
const workspace = document.querySelector(".workspace");
const elementPanel = document.querySelector(".element-panel");
if (workspace && elementPanel) workspace.append(elementPanel);
const activity=createActivityLog();

let currentChart = null;
let currentAnalysis=null;
let currentAttention=null;
let currentTimePlace=null;
let selectedPalace = null;
const questionInput = document.querySelector('#question');
const topicInput = document.querySelector('#topic');
topicInput.innerHTML = TOPICS.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
let currentQuestion = '';
const nianmingInputIds=['self','subject','customer','competitor','decisionMaker'];
initNianmingInputMasks(document);
function currentNianmingInput(){return Object.fromEntries(nianmingInputIds.map(id=>[id,document.querySelector('#nianming-'+id)?.value.trim()||'']).filter(([,value])=>value));}

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function inputValueAtOffset(utcMs, offset) {
  const date = new Date(utcMs + offset * 3_600_000);
  const two = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${two(date.getUTCMonth() + 1)}-${two(date.getUTCDate())}T${two(date.getUTCHours())}:${two(date.getUTCMinutes())}`;
}

function parseInputValue() {
  const match = datetimeInput.value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Vui lòng nhập đủ ngày, giờ và phút.");
  return {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(match[4]), minute: Number(match[5]), tzOffset: Number(timezoneInput.value),
  };
}

function timePlacePolicy(){
  const mode=timezoneModeInput.value;
  const policy={mode};
  if(mode==='iana_civil'){policy.timeZone=ianaTimezoneInput.value.trim();policy.disambiguation=dstDisambiguationInput.value;}
  if(longitudeInput.value.trim()!=='')policy.longitude=Number(longitudeInput.value);
  if(latitudeInput.value.trim()!=='')policy.latitude=Number(latitudeInput.value);
  return policy;
}
function resolveFormTimePlace(){return resolveTimePlace(parseInputValue(),timePlacePolicy());}
function syncTimePlaceControls(){
  const iana=timezoneModeInput.value==='iana_civil';
  timezoneInput.disabled=iana;ianaTimezoneInput.disabled=!iana;dstDisambiguationInput.disabled=!iana;
  document.querySelector('#timezone-help').textContent=iana?'IANA sẽ quyết định UTC offset lịch sử/DST; ô UTC cố định tạm không dùng.':'UTC offset cố định · hành vi tương thích cũ.';
}

function renderPillars(chart) {
  const two = (value) => String(value).padStart(2, "0");
  const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const weekday = weekdays[new Date(Date.UTC(chart.input.year, chart.input.month - 1, chart.input.day)).getUTCDay()];
  const labels = [
    ["Năm", chart.pillars.year, String(chart.input.year)],
    ["Tháng", chart.pillars.month, `Tháng ${two(chart.input.month)}`],
    ["Ngày", chart.pillars.day, `${weekday} · ${two(chart.input.day)}/${two(chart.input.month)}`],
    ["Giờ", chart.pillars.hour, `${two(chart.input.hour)}:${two(chart.input.minute)}`],
  ];
  pillars.innerHTML = labels.map(([label, pillar, calendar]) => `
    <div class="pillar">
      <small><span>${label}</span><b>${calendar}</b></small>
      <span class="han" style="color:var(--${elementSlug(pillar.stem.element)})">${pillar.han}</span>
      <span class="vi">${pillar.vi}<br><span style="color:var(--muted);font-weight:500">${pillar.stem.element}</span></span>
    </div>
  `).join("");
}

function renderSummary(chart) {
  const offset = chart.input.tzOffset;
  const two = (value) => String(value).padStart(2, "0");
  const instant = `${two(chart.input.day)}/${two(chart.input.month)}/${chart.input.year} · ${two(chart.input.hour)}:${two(chart.input.minute)}`;
  summary.innerHTML = `
    <div class="summary-item dun">
      <small>Độn · cục</small>
      <strong>${chart.dun.label} ${chart.dun.ju} cục</strong>
      <em>${chart.dun.yuan}</em>
    </div>
    <div class="summary-item">
      <small>Tiết khí tại ${instant}</small>
      <strong>${chart.term.han} · ${chart.term.vi}</strong>
      <em>Từ ${formatInstantAtOffset(chart.term.utcMs, offset, true)}</em>
    </div>
    <div class="summary-item">
      <small>Tuần thủ · lục nghi ẩn Giáp</small>
      <strong>${chart.xun.head.han} · ${chart.xun.instrument.han}</strong>
      <em>${chart.xun.head.vi} ẩn ${chart.xun.instrument.vi}</em>
    </div>
  `;
}

function stemHtml(stem) {
  return `<span class="stem-token" data-element="${elementSlug(stem.element)}" title="${stem.vi} · ${stem.element}"><span class="han">${stem.han}</span><span class="vi">${stem.vi}</span></span>`;
}

function palaceAria(palace) {
  if (palace.number === 5) return `${palace.vi}, cung 5, địa bàn ${palace.earthStem.vi}, gốc Thiên Cầm; khi chuyển theo Thiên Nhuế`;
  const heaven = palace.heavenStems.map((stem) => stem.vi).join(" và ");
  return `${palace.vi} cung ${palace.number}, ${palace.spirit.vi}, ${palace.star.vi}, ${palace.door.vi}, thiên bàn ${heaven}, địa bàn ${palace.earthStem.vi}`;
}

function palaceRoleMarkers(palace, chart,analysisProfile=currentAnalysis) {
  const dayPalace = locateStem(chart, chart.pillars.day).palace;
  const hourPalace = locateStem(chart, chart.pillars.hour).palace;
  const nianming=(analysisProfile?.nianming?.byPalace?.[palace.number]||[]).map(person=>{
    const pillar=person.yearPillar?.vi||person.yearPillar?.han||'';
    return `<span class="role-symbol role-nianming" title="Niên Mệnh · ${escapeHtml(person.label)}${pillar?` · ${escapeHtml(pillar)}`:''} · chỉ đối chiếu" aria-label="Niên Mệnh ${escapeHtml(person.label)}">◇</span>`;
  }).join('');
  return [
    dayPalace?.number === palace.number
      ? `<span class="role-symbol role-person" title="Người hỏi · Nhật can ${chart.pillars.day.stem.vi}" aria-label="Người hỏi · Nhật can">◉</span>`
      : "",
    hourPalace?.number === palace.number
      ? `<span class="role-symbol role-event" title="Sự việc · Thời can ${chart.pillars.hour.stem.vi}" aria-label="Sự việc · Thời can">◆</span>`
      : "",
    nianming,
  ].join("");
}

function renderPalace(palace, chart,attentionProfile=currentAttention,analysisProfile=currentAnalysis) {
  const palaceElement = elementSlug(palace.element);
  const selected = palace.number === selectedPalace ? " is-selected" : "";
  const roleMarkers = palaceRoleMarkers(palace, chart,analysisProfile);
  const attention=attentionProfile?.byPalace?.[palace.number]||null;
  const attentionBadge=attention&&attention.kind!=='neutral'
    ? `<span class="attention-badge attention-${attention.kind}" title="${escapeHtml(attention.label)} · ${escapeHtml(attention.meaning)}">${escapeHtml(attention.shortLabel)}</span>`:'';
  const attentionClass=attention&&attention.kind!=='neutral'?` attention-palace-${attention.kind}`:'';
  const attentionAria=attention&&attention.kind!=='neutral'?`, mức độ đáng chú ý: ${attention.label}`:'';
  const markers = [
    palace.voided ? '<span class="marker marker-void" title="Tuần không">Không</span>' : "",
    palace.horse ? '<span class="marker marker-horse" title="Dịch mã">Mã</span>' : "",
  ].join("");

  if (palace.number === 5) {
    return `
      <button class="palace palace-center${selected}" type="button" data-palace="5" data-element="earth" aria-label="${palaceAria(palace)}" aria-pressed="${palace.number === selectedPalace}">
        <span class="palace-head"><strong>中 · Trung Ngũ</strong><span>Thổ · trung tâm</span></span>
        <span class="palace-body">
          <span>
            <span class="center-seal">奇門</span>
            <span class="center-note">Thiên Cầm theo Nhuế · cung ${chart.palaces.find(p=>p.carriesQin).number}</span>
          </span>
        </span>
        <span class="palace-foot">
          <span class="palace-number">5</span><span></span>
          <span class="earth-stem" data-element="${elementSlug(palace.earthStem.element)}"><span class="han">${palace.earthStem.han}</span><span class="vi">${palace.earthStem.vi}</span></span>
        </span>
      </button>
    `;
  }

  const dutyStarBadge = palace.isDutyStar && chart.duty.star.id !== "qin" ? '<span class="duty-badge">Trực Phù</span>' : "";
  const qinTag = palace.carriesQin
    ? `<span class="qin-tag">禽 · Thiên Cầm</span>${palace.isDutyStar && chart.duty.star.id === "qin" ? '<span class="duty-badge">Trực Phù</span>' : ""}`
    : "";
  const dutyDoorBadge = palace.isDutyDoor ? '<span class="duty-badge">Trực Sử</span>' : "";

  return `
    <button class="palace${selected}${attentionClass}" type="button" data-palace="${palace.number}" data-element="${palaceElement}" aria-label="${palaceAria(palace)}${attentionAria}" aria-pressed="${palace.number === selectedPalace}">
      <span class="palace-head">
        <strong><span class="trigram">${palace.trigram}</span>${palace.vi} · ${palace.han}</strong>
        <span>${palace.direction} · ${palace.element}</span>
      </span>
      <span class="markers">${attentionBadge}${markers}</span>
      <span class="palace-body">
        <span class="entity spirit">
          <span class="entity-label">Bát thần</span><span class="han">${palace.spirit.han}</span><span class="vi">${palace.spirit.vi}</span>
        </span>
        <span class="entity star-stack" data-element="${elementSlug(palace.star.element)}">
          <span class="entity-label">Cửu tinh</span><span class="han">${palace.star.han}</span><span class="vi">${palace.star.vi}</span>${qinTag}${dutyStarBadge}
        </span>
        <span class="entity" data-element="${elementSlug(palace.heavenStems[0].element)}">
          <span class="entity-label">Thiên bàn</span><span class="stem-pair">${palace.heavenStems.map(stemHtml).join("")}</span>
        </span>
      </span>
      <span class="palace-foot">
        <span class="palace-number-wrap"><span class="palace-number">${palace.number}</span><span class="role-symbols">${roleMarkers}</span></span>
        <span class="door-token" data-element="${elementSlug(palace.door.element)}">
          <span class="han">${palace.door.han}</span><span class="vi">${palace.door.vi}</span>${dutyDoorBadge}
        </span>
        <span class="earth-stem" data-element="${elementSlug(palace.earthStem.element)}"><span class="han">${palace.earthStem.han}</span><span class="vi">${palace.earthStem.vi}</span></span>
      </span>
    </button>
  `;
}

function renderBoard(chart,attentionProfile=currentAttention,analysisProfile=currentAnalysis) {
  board.innerHTML = chart.palaces.map((palace) => renderPalace(palace, chart,attentionProfile,analysisProfile)).join("");
  board.querySelectorAll(".palace").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPalace = Number(button.dataset.palace);
      renderBoard(currentChart,currentAttention);
      renderDetail(currentChart,null,currentAttention);
    });
  });
}

function renderFlags(chart,attentionProfile=currentAttention) {
  const patternFlags = [];
  if (chart.patterns.starFuYin) patternFlags.push('<span class="flag flag-hold">Cửu Tinh phục ngâm</span>');
  if (chart.patterns.starFanYin) patternFlags.push('<span class="flag flag-warning">Cửu Tinh phản ngâm</span>');
  if (chart.patterns.doorFuYin) patternFlags.push('<span class="flag flag-hold">Bát Môn phục ngâm</span>');
  if (chart.patterns.doorFanYin) patternFlags.push('<span class="flag flag-warning">Bát Môn phản ngâm</span>');
  flags.innerHTML = `
    <span class="flag flag-primary">Trực Phù: ${chart.duty.star.vi} · cung ${chart.duty.starPalace}</span>
    <span class="flag">Trực Sử: ${chart.duty.door.vi} · cung ${chart.duty.doorPalace}</span>
    <span class="flag">Tuần không: ${chart.voidBranchData.map((branch) => branch.vi).join("–")}</span>
    <span class="flag">Dịch mã: ${chart.horseBranchData.vi} · cung ${chart.horsePalace}</span>
    ${patternFlags.join("")}
    <span class="flag flag-attention-note">Màu = ưu tiên đọc · không phải xác suất</span>
  `;
}

function detailItem(type, layer, title, subtitle, copy) {
  return `
    <div class="detail-item item-${type}">
      <div class="detail-item-top"><strong>${title}</strong><small>${layer}${subtitle ? ` · ${subtitle}` : ""}</small></div>
      <p>${copy}</p>
    </div>
  `;
}
function semanticCard(palace,chart,conditions=null,prepared=null){
  const domainId=semanticDomainForTopic(prepared?.context.allInOne.resolvedTopic||topicInput.value),secondaryDomainId=classifyTopics(prepared?.context.question||currentQuestion).map(semanticDomainForTopic).find(id=>id!==domainId)||null,semantic=semanticBundle(palace,{mode:'event',domainId,secondaryDomainId,board:chart,conditions});
  const chips=semantic.keywords.map(word=>`<span>${escapeHtml(word)}</span>`).join('');
  const states=semantic.states.length?`<p class="semantic-state">${escapeHtml(semantic.states.map(x=>x.rule).join(' '))}</p>`:'';
  const domainLabel=semantic.secondaryDomainLabel?`${semantic.domainLabel} · phụ: ${semantic.secondaryDomainLabel}`:semantic.domainLabel;
  const layerOrder={'Cung':0,'Thần':1,'Tinh':2,'Môn':3,'Thiên can':4,'Địa can':5};
  const layerLabel={'Thiên can':'Can · Thiên','Địa can':'Can · Địa'};
  const components=[...semantic.items].sort((a,b)=>(layerOrder[a.layer]??9)-(layerOrder[b.layer]??9)).map(item=>`
    <div class="semantic-modern-item">
      <strong>${escapeHtml(layerLabel[item.layer]||item.layer)} · ${escapeHtml(item.name)}</strong>
      <p>${escapeHtml(item.meaning)}</p>
    </div>`).join('');
  return `<section class="semantic-card semantic-modern" aria-label="Dịch tân thời theo ngữ cảnh">
    <div class="semantic-card-head"><span><p class="eyebrow">Dịch tân thời</p><small>${escapeHtml(domainLabel)}</small></span><span class="semantic-version">${escapeHtml(semantic.version)}</span></div>
    <div class="semantic-keywords">${chips}</div>
    <p class="semantic-summary">${escapeHtml(semantic.summary)}</p>
    ${states}
    <div class="semantic-modern-list" aria-label="Cung Thần Tinh Môn Can">
      ${components}
    </div>
  </section>`;
}

function detailTabs(palaceNumber,modernHtml,classicalHtml){
  const modernId=`palace-modern-${palaceNumber}`,classicalId=`palace-classical-${palaceNumber}`;
  return `<div class="detail-tabs" role="tablist" aria-label="Cách diễn giải cung">
    <button class="detail-tab" type="button" role="tab" aria-selected="true" aria-controls="${modernId}" data-detail-tab="modern"><strong>Dịch tân thời</strong><span>Dễ liên hệ việc đang hỏi</span></button>
    <button class="detail-tab" type="button" role="tab" aria-selected="false" aria-controls="${classicalId}" data-detail-tab="classical"><strong>Dịch cổ ngữ</strong><span>Nghĩa tượng truyền thống</span></button>
  </div>
  <section id="${modernId}" class="detail-panel" role="tabpanel" data-detail-panel="modern">${modernHtml}</section>
  <section id="${classicalId}" class="detail-panel detail-panel-classical" role="tabpanel" data-detail-panel="classical" hidden>${classicalHtml}</section>`;
}
function bindDetailTabs(root=detail){
  const tabs=[...root.querySelectorAll('[data-detail-tab]')];
  if(!tabs.length)return;
  const panels=[...root.querySelectorAll('[data-detail-panel]')];
  const activate=(key,focus=false)=>{
    tabs.forEach(tab=>{const active=tab.dataset.detailTab===key;tab.setAttribute('aria-selected',String(active));if(active&&focus)tab.focus();});
    panels.forEach(panel=>{panel.hidden=panel.dataset.detailPanel!==key;});
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab.dataset.detailTab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key==='ArrowRight'?(index+1)%tabs.length:(index-1+tabs.length)%tabs.length;
      activate(tabs[next].dataset.detailTab,true);
    });
  });
}
function classicalIntro(){
  return `<div class="classical-heading"><p class="eyebrow">Dịch cổ ngữ</p><p>Nghĩa tượng truyền thống của Cung · Thần · Tinh · Môn · Can. Phần này giữ cách gọi cổ để đối chiếu, không tự đổi thành kết luận cho sự việc hiện tại.</p></div>`;
}

function renderDetail(chart,prepared=null,attentionProfile=currentAttention) {
  const palace = chart.palaces.find((item) => item.number === selectedPalace) || chart.palaces[0];
  inspectorTitle.textContent = `${palace.vi} ${palace.number} cung`;
  const palaceElement = elementSlug(palace.element);
  const attention=attentionProfile?.byPalace?.[palace.number]||null;
  const nianmingRows=(prepared?.analysis?.nianming||currentAnalysis?.nianming)?.byPalace?.[palace.number]||[];
  const nianmingHtml=nianmingRows.length?`<section class="nianming-card" aria-label="Niên Mệnh đối chiếu">
    <div class="nianming-card-head"><span aria-hidden="true">◇</span><span><small>Niên Mệnh · đối chiếu</small><strong>${nianmingRows.length} người tại cung này</strong></span></div>
    <ul>${nianmingRows.map(person=>`<li><strong>${escapeHtml(person.label)}</strong><span>${escapeHtml(person.yearPillar?.vi||person.yearPillar?.han||'Chưa xác định')} · can ${escapeHtml(person.yearStem||'')} ${person.hiddenJia?`→ nghi ẩn ${escapeHtml(person.effectiveStem||'')}`:`→ ${escapeHtml(person.effectiveStem||'')}`}</span><small>${person.linkedRoleRelation?.text?`So với vai chính: ${escapeHtml(person.linkedRoleRelation.text)}. `:''}${person.eventRelation?.text?`So với cung sự việc: ${escapeHtml(person.eventRelation.text)}. `:''}Chỉ dùng để kiểm chứng chéo.</small></li>`).join('')}</ul>
    <p>Niên Mệnh không đổi Nhật can, Dụng Thần chính, màu cảnh báo hoặc kết luận của bàn.</p>
  </section>`:'';
  const attentionHtml=attention&&palace.number!==5?`<section class="attention-card attention-card-${attention.kind}" aria-label="Mức độ đáng chú ý">
    <div class="attention-card-head"><span class="attention-icon" aria-hidden="true"></span><span><small>Mức độ đáng chú ý</small><strong>${escapeHtml(attention.label)}</strong></span></div>
    <div class="attention-columns">
      <div><b>Hỗ trợ</b>${attention.supports.length?`<ul>${attention.supports.slice(0,4).map(x=>`<li><strong>${escapeHtml(x.label)}</strong><span>${escapeHtml(x.detail)}</span></li>`).join('')}</ul>`:'<p>Không có cát cách mạnh cần tô nổi.</p>'}</div>
      <div><b>Cảnh báo</b>${attention.warnings.length?`<ul>${attention.warnings.slice(0,4).map(x=>`<li><strong>${escapeHtml(x.label)}</strong><span>${escapeHtml(x.detail)}</span></li>`).join('')}</ul>`:'<p>Không có cảnh báo mạnh trong phạm vi đã tính.</p>'}</div>
    </div>
    <p class="attention-note">Màu chỉ giúp ưu tiên đọc; không phải xác suất hay phán quyết tốt/xấu tuyệt đối.</p>
  </section>`:'';
  const title = `<div class="detail-title" data-element="${palaceElement}">
    <div class="detail-title-main"><span class="detail-gua">${palace.trigram || "中"}</span><span><strong>${palace.vi} · ${palace.han}</strong><small>${palace.direction} · cung ${palace.number}</small></span></div>
    <span class="element-chip">${palace.element}</span>
  </div>`;

  if (palace.number === 5) {
    const modern=`${semanticCard(palace,chart,null,prepared)}${nianmingHtml}`;
    const classical=`${classicalIntro()}<div class="detail-list">
      ${detailItem("palace", "Cung", `${palace.han} · ${palace.vi}`, palace.element, palace.image)}
      ${detailItem("star", "Cửu tinh", `${STAR_QIN.han} · ${STAR_QIN.vi}`, STAR_QIN.element, `${STAR_QIN.meaning} Trung Ngũ không tham gia vòng chuyển; Thiên Cầm ký cùng Thiên Nhuế tại cung đang mang nó.`)}
      ${detailItem("stem", "Địa bàn", `${palace.earthStem.han} · ${palace.earthStem.vi}`, palace.earthStem.element, "Can của Trung Ngũ được mang theo Thiên Cầm và ký sang cung có Thiên Nhuế khi chuyển bàn.")}
    </div>`;
    detail.innerHTML = `${title}${detailTabs(palace.number,modern,classical)}`;
    bindDetailTabs(detail);return;
  }

  const heavenText = palace.heavenStems.map((stem) => `${stem.han} ${stem.vi}`).join(" + ");
  const carries = palace.carriesQin ? ` Cung này đồng thời mang ${STAR_QIN.vi}: ${STAR_QIN.meaning}` : "";
  const conditions = palaceConditions(palace);
  const markerHtml = [
    palace.isDutyStar ? `<span class="detail-marker">Trực Phù: ${chart.duty.star.vi}</span>` : "",
    palace.isDutyDoor ? `<span class="detail-marker">Trực Sử: ${chart.duty.door.vi}</span>` : "",
    palace.voided ? '<span class="detail-marker">Lâm Tuần Không</span>' : "",
    palace.horse ? '<span class="detail-marker">Lâm Dịch Mã</span>' : "",
    conditions.doorPressure ? '<span class="detail-marker">Môn bức cung</span>' : '',
    conditions.punishment.length ? `<span class="detail-marker">Kích hình: ${conditions.punishment.join(', ')}</span>` : '',
    conditions.wonderTombs.length ? `<span class="detail-marker">Tam kỳ nhập mộ: ${conditions.wonderTombs.join(', ')}</span>` : '',
    (conditions.stemTombs||[]).some(x=>!conditions.wonderTombs.includes(x)) ? `<span class="detail-marker">Lục nghi nhập mộ: ${(conditions.stemTombs||[]).filter(x=>!conditions.wonderTombs.includes(x)).join(', ')}</span>` : '',
  ].join("");
  const modern=`${semanticCard(palace,chart,conditions,prepared)}${attentionHtml}${nianmingHtml}`;
  const classical=`${classicalIntro()}<div class="detail-list">
    ${detailItem("palace", "Cung", `${palace.trigram} ${palace.han} · ${palace.vi}`, palace.element, palace.image)}
    ${detailItem("spirit", "Bát thần", `${palace.spirit.han} · ${palace.spirit.vi}`, "thần", palace.spirit.meaning)}
    ${detailItem("star", "Cửu tinh", `${palace.star.han} · ${palace.star.vi}`, palace.star.element, `${palace.star.meaning}${carries}`)}
    ${detailItem("door", "Bát môn", `${palace.door.han} · ${palace.door.vi}`, palace.door.quality, palace.door.meaning)}
    ${detailItem("stem", "Thiên–Địa bàn", `${heavenText} / ${palace.earthStem.han} ${palace.earthStem.vi}`, "chủ–khách", `Thiên bàn mang ${heavenText}; địa bàn là ${palace.earthStem.han} ${palace.earthStem.vi}. Cần xét sinh–khắc, nhập mộ và hoàn cảnh hỏi quẻ trước khi kết luận.`)}
  </div>
  <div class="detail-markers">${markerHtml || '<span class="detail-marker">Không có dấu bổ sung trong phạm vi đã tính</span>'}</div>
  <p class="classical-note">Kích hình và Nhập Mộ xét riêng can được nêu, kể cả can ký; KM-TIMING-3.0 đã phủ cả Tam Kỳ và Lục Nghi hiện trên bàn. Không có dấu không đồng nghĩa chắc thuận.</p>`;
  detail.innerHTML = `${title}${detailTabs(palace.number,modern,classical)}`;
  bindDetailTabs(detail);
}

function renderMethod(chart) {
  if(!methodCopy)return;
  const offset = chart.input.tzOffset;
  const methodExplanation = chart.method === "chaibu"
    ? `Nhật trụ ${chart.pillars.day.han} có Phù đầu ${chart.fuHead.han} (${chart.fuHead.vi}), quy về <strong>${chart.dun.yuan}</strong>. Đây là lối Tháo bổ theo Phù đầu Can Chi.`
    : `Đã qua ${chart.term.elapsedDays.toFixed(2)} ngày kể từ lúc giao tiết, quy về <strong>${chart.dun.yuan}</strong>. Quy ước Mao Sơn của app: đổi nguyên sau đúng 120 và 240 giờ từ giao tiết; Hạ nguyên giữ đến tiết kế tiếp, không tự lặp sau ngày thứ 15.`;
  methodCopy.innerHTML = `
    <p><strong>Định cục.</strong> ${methodExplanation} ${chart.term.vi} ${chart.dun.yuan.toLowerCase()} tra được ${chart.dun.ju} cục.</p>
    <p><strong>Giao tiết.</strong> Tính theo thời khắc thiên văn: ${chart.term.vi} bắt đầu ${formatInstantAtOffset(chart.term.utcMs, offset, true)}; tiết kế là ${chart.nextTerm.vi} lúc ${formatInstantAtOffset(chart.nextTerm.utcMs, offset, true)} (${formatOffset(offset)}).</p>
    <p><strong>Quy ước chuyển bàn.</strong> 23:00 đổi nhật trụ; Trung Ngũ ký Khôn 2; Thiên Cầm đi cùng Thiên Nhuế. Khi đối chiếu app khác, cần đặt cùng múi giờ, pháp định cục và quy ước giờ Tý.</p>
  `;
}

function renderChart(chart) {
  currentChart = chart;
  currentAnalysis=analyzeBoard(toQimenBoard(chart),{topic:topicInput.value||'general',nianming:currentNianmingInput()});
  currentAttention=buildAttentionProfile(currentAnalysis);
  if (!chart.palaces.some((palace) => palace.number === selectedPalace)) selectedPalace = chart.duty.starPalace;
  if (selectedPalace === null) selectedPalace = chart.duty.starPalace;
  renderPillars(chart);
  renderSummary(chart);
  renderBoard(chart,currentAttention);
  renderFlags(chart,currentAttention);
  renderDetail(chart,null,currentAttention);
  renderMethod(chart);
  document.querySelector('#question-summary').textContent = currentQuestion ? `Câu hỏi của bàn: ${currentQuestion}` : 'Chưa ghi câu hỏi.';
  document.dispatchEvent(new Event('qimen-chart'));
}

function generateAndRender({ scroll = false } = {}) {
  resultSection.setAttribute("aria-busy", "true");
  try {
    const timePlace=resolveFormTimePlace();
    const chart = generateQimen(timePlace.boardInput, methodInput.value);
    currentTimePlace=timePlace;
    currentQuestion = questionInput.value.trim();
    errorBox.hidden = true;
    errorBox.textContent = "";
    renderChart(chart);
    if (scroll && window.matchMedia("(max-width: 680px)").matches) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    return chart;
  } catch (error) {
    currentTimePlace=null;
    errorBox.textContent = error instanceof Error ? error.message : "Không thể lập bàn cho thời điểm này.";
    errorBox.hidden = false;
    return null;
  } finally {
    resultSection.setAttribute("aria-busy", "false");
  }
}

function setNow() {
  try{
    datetimeInput.value = timezoneModeInput.value==='iana_civil'?localInputValueAtZone(Date.now(),ianaTimezoneInput.value.trim()):inputValueAtOffset(Date.now(), Number(timezoneInput.value));
    selectedPalace = null;generateAndRender();
  }catch(error){errorBox.textContent=error instanceof Error?error.message:'Không xác định được thời gian hiện tại theo múi giờ đã nhập.';errorBox.hidden=false;}
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  selectedPalace = null;
  if(generateAndRender({ scroll: true }))activity.recordChart();
});

document.querySelector("#now-button").addEventListener("click", setNow);

timezoneInput.addEventListener("change", () => {
  selectedPalace = null;
  generateAndRender();
});
for(const control of [timezoneModeInput,ianaTimezoneInput,dstDisambiguationInput,longitudeInput,latitudeInput])control.addEventListener('change',()=>{
  syncTimePlaceControls();selectedPalace=null;generateAndRender();
});
for(const id of nianmingInputIds)document.querySelector('#nianming-'+id)?.addEventListener('change',()=>{selectedPalace=null;generateAndRender();});
timezoneModeInput.addEventListener('change',syncTimePlaceControls);

methodInput.addEventListener("change", () => {
  methodNote.textContent = methodInput.value === "chaibu"
    ? "Lấy nguyên theo Phù đầu của nhật Can Chi"
    : "Tính mỗi nguyên đúng 5 ngày từ giờ giao tiết";
  selectedPalace = null;
  generateAndRender();
});

syncTimePlaceControls();
datetimeInput.value = inputValueAtOffset(Date.now(), Number(timezoneInput.value));
generateAndRender();

function initElementDiagram() {
  const diagram=document.querySelector('#element-diagram');
  const reading=document.querySelector('#element-reading');
  const elements=Object.keys(GENERATES);
  const giver=(map,element)=>elements.find(item=>map[item]===element);
  const reset=()=>{
    delete diagram.dataset.active;
    diagram.querySelectorAll('.element-orb').forEach(button=>{
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed','false');
    });
    diagram.querySelectorAll('.element-routes path').forEach(path=>path.classList.remove('is-related'));
    reading.replaceChildren();
    reading.hidden=true;
  };
  const select=(element)=>{
    diagram.dataset.active=element;
    diagram.querySelectorAll('.element-orb').forEach(button=>{
      const active=button.dataset.elementChoice===element;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    diagram.querySelectorAll('.element-routes path').forEach(path=>path.classList.toggle('is-related',path.dataset.from===element||path.dataset.to===element));
    reading.hidden=false;
    reading.innerHTML=`<div class="element-reading-head"><h3>${element} trong bốn chiều quan hệ</h3><button class="reading-reset" type="button">Xem toàn bộ sơ đồ</button></div><div class="relation-cards">
      <p><span class="relation-label relation-generate">Sinh ra</span><strong>${element} → ${GENERATES[element]}</strong><small>${element} nuôi dưỡng ${GENERATES[element]}</small></p>
      <p><span class="relation-label relation-generate">Được sinh</span><strong>${giver(GENERATES,element)} → ${element}</strong><small>${element} nhận sự nâng đỡ từ ${giver(GENERATES,element)}</small></p>
      <p><span class="relation-label relation-control">Khắc</span><strong>${element} → ${CONTROLS[element]}</strong><small>${element} chế ước ${CONTROLS[element]}</small></p>
      <p><span class="relation-label relation-control">Bị khắc</span><strong>${giver(CONTROLS,element)} → ${element}</strong><small>${element} chịu sự chế ước của ${giver(CONTROLS,element)}</small></p>
    </div>`;
    reading.querySelector('.reading-reset').addEventListener('click',reset);
  };
  diagram.querySelectorAll('.element-orb').forEach(button=>button.addEventListener('click',()=>{
    const element=button.dataset.elementChoice;
    diagram.dataset.active===element ? reset() : select(element);
  }));
  reset();
}

questionInput.addEventListener('input',()=>{
  document.querySelector('#question-summary').textContent = questionInput.value.trim()===currentQuestion ? (currentQuestion?`Câu hỏi của bàn: ${currentQuestion}`:'Chưa ghi câu hỏi.') : 'Bạn đang sửa câu hỏi. Bấm Lập bàn để gắn câu hỏi mới với ngày giờ đã chọn.';
});

const readingOptions=initModeControls();
function prepareAiInput(){
  generateAndRender();
  if(!errorBox.hidden)throw new Error(errorBox.textContent);
  if(!currentTimePlace)throw new Error('Chưa có dữ liệu thời gian/địa điểm hợp lệ.');
  return {question:questionInput.value.trim(),topic:topicInput.value,method:methodInput.value,input:{...currentTimePlace.originalInput},timePlace:{...currentTimePlace.request},...readingOptions()};
}
// Render with the same components and exact AI chart, then restore live nodes and selection.
function captureReportVisual(prepared){
  const targets=[pillars,summary,board,flags,detail,inspectorTitle];
  const saved=targets.map(node=>[node,[...node.childNodes]]),selection=selectedPalace;
  const clone=selector=>document.querySelector(selector).cloneNode(true);
  try{
    const reportAttention=buildAttentionProfile(prepared.analysis);
    renderPillars(prepared.chart);renderSummary(prepared.chart);renderBoard(prepared.chart,reportAttention,prepared.analysis);renderFlags(prepared.chart,reportAttention);
    const topicRole=prepared.analysis.roles.find(item=>item.id==='topic_0');
    const subject=topicRole?.palace!=null?topicRole:prepared.analysis.roles.find(item=>item.id==='event');
    const roles=[prepared.analysis.roles.find(item=>item.id==='self'),subject].map((role,index)=>{
      if(!role)throw new Error('Thiếu đại diện trong dữ liệu AI.');
      const id=role.id;
      const card=document.createElement('article');card.className='inspector export-role';card.dataset.role=id;
      const heading=document.createElement('h2');heading.textContent=index===0?'NGƯỜI HỎI · NHẬT CAN':id==='topic_0'?'SỰ VIỆC · DỤNG THẦN':'SỰ VIỆC · THỜI CAN';card.append(heading);
      const basis=document.createElement('p');basis.textContent=`${role.label} · ${role.basis} · ${role.status}`;card.append(basis);
      if(role.palace==null){const note=document.createElement('p');note.textContent='Chưa xác định cung đại diện.';card.append(note);}
      else{selectedPalace=role.palace;renderDetail(prepared.chart,prepared,reportAttention);card.append(detail.cloneNode(true));}
      card.querySelectorAll('details').forEach(node=>node.open=true);
      return card;
    });
    const question=clone('#question-summary');question.textContent=`Câu hỏi của bàn: ${prepared.context.question}`;
    return {header:clone('.topbar'),question,pillars:clone('#pillars'),summary:clone('#calculation-summary'),board:clone('.board-column'),elements:clone('.element-panel'),roles};
  }finally{selectedPalace=selection;for(const [node,children] of saved)node.replaceChildren(...children);}
}
initLocalAi({prepare:prepareAiInput,activity,captureReportVisual});
initElementDiagram();
initSharedView({kind:'question',resultSelector:'#result'});
