import {
  BRANCHES, STAR_QIN, elementSlug, formatInstantAtOffset, formatOffset, generateQimen,
} from "./qimen.mjs";
import {TOPICS, GENERATES, CONTROLS, locateStem, palaceConditions} from './guide.mjs';
import {initLocalAi} from './ai-local.mjs';

const form = document.querySelector("#chart-form");
const datetimeInput = document.querySelector("#datetime");
const timezoneInput = document.querySelector("#timezone");
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

let currentChart = null;
let selectedPalace = null;
const questionInput = document.querySelector('#question');
const topicInput = document.querySelector('#topic');
topicInput.innerHTML = TOPICS.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
let currentQuestion = '';

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

function palaceRoleMarkers(palace, chart) {
  const dayPalace = locateStem(chart, chart.pillars.day).palace;
  const hourPalace = locateStem(chart, chart.pillars.hour).palace;
  return [
    dayPalace?.number === palace.number
      ? `<span class="role-symbol role-person" title="Người hỏi · Nhật can ${chart.pillars.day.stem.vi}" aria-label="Người hỏi · Nhật can">◉</span>`
      : "",
    hourPalace?.number === palace.number
      ? `<span class="role-symbol role-event" title="Sự việc · Thời can ${chart.pillars.hour.stem.vi}" aria-label="Sự việc · Thời can">◆</span>`
      : "",
  ].join("");
}

function renderPalace(palace, chart) {
  const palaceElement = elementSlug(palace.element);
  const selected = palace.number === selectedPalace ? " is-selected" : "";
  const roleMarkers = palaceRoleMarkers(palace, chart);
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
    <button class="palace${selected}" type="button" data-palace="${palace.number}" data-element="${palaceElement}" aria-label="${palaceAria(palace)}" aria-pressed="${palace.number === selectedPalace}">
      <span class="palace-head">
        <strong><span class="trigram">${palace.trigram}</span>${palace.vi} · ${palace.han}</strong>
        <span>${palace.direction} · ${palace.element}</span>
      </span>
      <span class="markers">${markers}</span>
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

function renderBoard(chart) {
  board.innerHTML = chart.palaces.map((palace) => renderPalace(palace, chart)).join("");
  board.querySelectorAll(".palace").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPalace = Number(button.dataset.palace);
      renderBoard(currentChart);
      renderDetail(currentChart);
    });
  });
}

function renderFlags(chart) {
  const patternFlags = [];
  if (chart.patterns.starFuYin) patternFlags.push('<span class="flag flag-primary">Cửu Tinh phục ngâm</span>');
  if (chart.patterns.starFanYin) patternFlags.push('<span class="flag flag-primary">Cửu Tinh phản ngâm</span>');
  if (chart.patterns.doorFuYin) patternFlags.push('<span class="flag">Bát Môn phục ngâm</span>');
  if (chart.patterns.doorFanYin) patternFlags.push('<span class="flag">Bát Môn phản ngâm</span>');
  flags.innerHTML = `
    <span class="flag flag-primary">Trực Phù: ${chart.duty.star.vi} · cung ${chart.duty.starPalace}</span>
    <span class="flag">Trực Sử: ${chart.duty.door.vi} · cung ${chart.duty.doorPalace}</span>
    <span class="flag">Tuần không: ${chart.voidBranchData.map((branch) => branch.vi).join("–")}</span>
    <span class="flag">Dịch mã: ${chart.horseBranchData.vi} · cung ${chart.horsePalace}</span>
    ${patternFlags.join("")}
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

function renderDetail(chart) {
  const palace = chart.palaces.find((item) => item.number === selectedPalace) || chart.palaces[0];
  inspectorTitle.textContent = `${palace.vi} ${palace.number} cung`;
  const palaceElement = elementSlug(palace.element);
  const title = `
    <div class="detail-title" data-element="${palaceElement}">
      <div class="detail-title-main"><span class="detail-gua">${palace.trigram || "中"}</span><span><strong>${palace.vi} · ${palace.han}</strong><small>${palace.direction} · cung ${palace.number}</small></span></div>
      <span class="element-chip">${palace.element}</span>
    </div>
    <p class="detail-image">${palace.image}</p>
  `;

  if (palace.number === 5) {
    detail.innerHTML = `${title}<div class="detail-list">
      ${detailItem("star", "Cửu tinh", STAR_QIN.vi, STAR_QIN.element, `${STAR_QIN.meaning} Trung Ngũ không tham gia vòng chuyển; Thiên Cầm ký cùng Thiên Nhuế tại cung đang mang nó.`)}
      ${detailItem("stem", "Địa bàn", `${palace.earthStem.han} · ${palace.earthStem.vi}`, palace.earthStem.element, "Can của Trung Ngũ được mang theo Thiên Cầm và ký sang cung có Thiên Nhuế khi chuyển bàn.")}
    </div>`;
    return;
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
  ].join("");
  detail.innerHTML = `${title}
    <div class="detail-list">
      ${detailItem("spirit", "Bát thần", `${palace.spirit.han} · ${palace.spirit.vi}`, "thần", palace.spirit.meaning)}
      ${detailItem("star", "Cửu tinh", `${palace.star.han} · ${palace.star.vi}`, palace.star.element, `${palace.star.meaning}${carries}`)}
      ${detailItem("door", "Bát môn", `${palace.door.han} · ${palace.door.vi}`, palace.door.quality, palace.door.meaning)}
      ${detailItem("stem", "Thiên–Địa bàn", `${heavenText} / ${palace.earthStem.han} ${palace.earthStem.vi}`, "chủ–khách", `Thiên bàn mang ${heavenText}; địa bàn là ${palace.earthStem.han} ${palace.earthStem.vi}. Cần xét sinh–khắc, nhập mộ và hoàn cảnh hỏi quẻ trước khi kết luận.`)}
    </div>
    <div class="detail-markers">${markerHtml || '<span class="detail-marker">Không có dấu bổ sung trong phạm vi đã tính</span>'}</div>
    <p class="detail-image">Kích hình/nhập mộ chỉ xét can được nêu, kể cả can ký. Chưa bao quát mọi cách cục; không có dấu không đồng nghĩa chắc thuận.</p>
  `;
}

function renderMethod(chart) {
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
  if (!chart.palaces.some((palace) => palace.number === selectedPalace)) selectedPalace = chart.duty.starPalace;
  if (selectedPalace === null) selectedPalace = chart.duty.starPalace;
  renderPillars(chart);
  renderSummary(chart);
  renderBoard(chart);
  renderFlags(chart);
  renderDetail(chart);
  renderMethod(chart);
  document.querySelector('#question-summary').textContent = currentQuestion ? `Câu hỏi của bàn: ${currentQuestion}` : 'Chưa ghi câu hỏi.';
  document.dispatchEvent(new Event('qimen-chart'));
}

function generateAndRender({ scroll = false } = {}) {
  resultSection.setAttribute("aria-busy", "true");
  try {
    const chart = generateQimen(parseInputValue(), methodInput.value);
    currentQuestion = questionInput.value.trim();
    errorBox.hidden = true;
    errorBox.textContent = "";
    renderChart(chart);
    if (scroll && window.matchMedia("(max-width: 680px)").matches) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : "Không thể lập bàn cho thời điểm này.";
    errorBox.hidden = false;
  } finally {
    resultSection.setAttribute("aria-busy", "false");
  }
}

function setNow() {
  datetimeInput.value = inputValueAtOffset(Date.now(), Number(timezoneInput.value));
  selectedPalace = null;
  generateAndRender();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  selectedPalace = null;
  generateAndRender({ scroll: true });
});

document.querySelector("#now-button").addEventListener("click", setNow);

timezoneInput.addEventListener("change", () => {
  selectedPalace = null;
  generateAndRender();
});

methodInput.addEventListener("change", () => {
  methodNote.textContent = methodInput.value === "chaibu"
    ? "Lấy nguyên theo Phù đầu của nhật Can Chi"
    : "Tính mỗi nguyên đúng 5 ngày từ giờ giao tiết";
  selectedPalace = null;
  generateAndRender();
});

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

initLocalAi({prepare(){
  generateAndRender();
  if(!errorBox.hidden)throw new Error(errorBox.textContent);
  return {question:questionInput.value.trim(),topic:topicInput.value,method:methodInput.value,input:{...currentChart.input}};
}});
initElementDiagram();
