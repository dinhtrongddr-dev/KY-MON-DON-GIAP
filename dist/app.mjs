import {
  BRANCHES, STAR_QIN, elementSlug, formatInstantAtOffset, formatOffset, generateQimen,
} from "./qimen.mjs";
import {TOPICS, GENERATES, CONTROLS, relation, locateStem, locateRef} from './guide.mjs';
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
  const labels = [["Năm", chart.pillars.year], ["Tháng", chart.pillars.month], ["Ngày", chart.pillars.day], ["Giờ", chart.pillars.hour]];
  pillars.innerHTML = labels.map(([label, pillar]) => `
    <div class="pillar">
      <small>${label}</small>
      <span class="han" style="color:var(--${elementSlug(pillar.stem.element)})">${pillar.han}</span>
      <span class="vi">${pillar.vi}<br><span style="color:var(--muted);font-weight:500">${pillar.stem.element}</span></span>
    </div>
  `).join("");
}

function renderSummary(chart) {
  const offset = chart.input.tzOffset;
  summary.innerHTML = `
    <div class="summary-item dun">
      <small>Độn · cục</small>
      <strong>${chart.dun.label} ${chart.dun.ju} cục</strong>
      <em>${chart.dun.yuan}</em>
    </div>
    <div class="summary-item">
      <small>Tiết khí hiện hành</small>
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
  if (palace.number === 5) return `${palace.vi}, cung 5, địa bàn ${palace.earthStem.vi}, Thiên Cầm ký Khôn 2`;
  const heaven = palace.heavenStems.map((stem) => stem.vi).join(" và ");
  return `${palace.vi} cung ${palace.number}, ${palace.spirit.vi}, ${palace.star.vi}, ${palace.door.vi}, thiên bàn ${heaven}, địa bàn ${palace.earthStem.vi}`;
}

function renderPalace(palace, chart) {
  const palaceElement = elementSlug(palace.element);
  const selected = palace.number === selectedPalace ? " is-selected" : "";
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
            <span class="center-note">Thiên Cầm ký Khôn 2</span>
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
        <span class="palace-number">${palace.number}</span>
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
  const markerHtml = [
    palace.isDutyStar ? `<span class="detail-marker">Trực Phù: ${chart.duty.star.vi}</span>` : "",
    palace.isDutyDoor ? `<span class="detail-marker">Trực Sử: ${chart.duty.door.vi}</span>` : "",
    palace.voided ? '<span class="detail-marker">Lâm Tuần Không</span>' : "",
    palace.horse ? '<span class="detail-marker">Lâm Dịch Mã</span>' : "",
  ].join("");
  detail.innerHTML = `${title}
    <div class="detail-list">
      ${detailItem("spirit", "Bát thần", `${palace.spirit.han} · ${palace.spirit.vi}`, "thần", palace.spirit.meaning)}
      ${detailItem("star", "Cửu tinh", `${palace.star.han} · ${palace.star.vi}`, palace.star.element, `${palace.star.meaning}${carries}`)}
      ${detailItem("door", "Bát môn", `${palace.door.han} · ${palace.door.vi}`, palace.door.quality, palace.door.meaning)}
      ${detailItem("stem", "Thiên–Địa bàn", `${heavenText} / ${palace.earthStem.han} ${palace.earthStem.vi}`, "chủ–khách", `Thiên bàn mang ${heavenText}; địa bàn là ${palace.earthStem.han} ${palace.earthStem.vi}. Cần xét sinh–khắc, nhập mộ và hoàn cảnh hỏi quẻ trước khi kết luận.`)}
    </div>
    <div class="detail-markers">${markerHtml || '<span class="detail-marker">Không có Không/Mã tại cung</span>'}</div>
  `;
}

function renderMethod(chart) {
  const offset = chart.input.tzOffset;
  const methodExplanation = chart.method === "chaibu"
    ? `Nhật trụ ${chart.pillars.day.han} có Phù đầu ${chart.fuHead.han} (${chart.fuHead.vi}), quy về <strong>${chart.dun.yuan}</strong>. Đây là lối Tháo bổ theo Phù đầu Can Chi.`
    : `Đã qua ${chart.term.elapsedDays.toFixed(2)} ngày kể từ lúc giao tiết, quy về <strong>${chart.dun.yuan}</strong>. Mao Sơn chia mỗi nguyên đúng 5 ngày tính từ giờ giao tiết.`;
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
  renderGuide(chart);
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

function jumpButton(palace, text) {
  return palace ? `<button type="button" class="jump-cung" data-jump="${palace.number}" data-element="${elementSlug(palace.element)}">${text} → ${palace.vi} ${palace.number} · ${palace.element}</button>` : '<span>Chưa tìm thấy cung</span>';
}

function renderGuide(chart) {
  const topic = TOPICS.find(t=>t.id===topicInput.value) || TOPICS[0];
  const day = locateStem(chart,chart.pillars.day);
  const hour = locateStem(chart,chart.pillars.hour);
  document.querySelector('#question-summary').textContent = currentQuestion ? `Câu hỏi của bàn: ${currentQuestion}` : 'Chưa ghi câu hỏi. Bạn vẫn có thể học cách đọc bàn này.';
  const label = (p,found)=>`${p.stem.han} · ${p.stem.vi}${p.stem.han==='甲'?` (ẩn dưới ${found.effective} theo tuần của trụ này)`:''}`;
  const refs = topic.refs.map(ref=> {
    const p = locateRef(chart,ref);
    const title = ref[0]==='stem' ? `Can ${ref[1]}` : ref[0]==='horse' ? 'Dịch Mã' : p?.[ref[0]]?.vi;
    return jumpButton(p,title || ref[1]);
  }).join('');
  document.querySelector('#live-guide').innerHTML = `
    <p>Chủ đề: <strong>${topic.name}</strong>. Đổi nhóm sự việc ở ô phía trên để đọc hướng dẫn khác. Đây là hướng dẫn theo mẫu và dữ liệu bàn, không phải AI phân tích nội dung câu hỏi.</p>
    <div class="locator-grid"><div><strong>1 · Người hỏi — Nhật can</strong><p>${label(chart.pillars.day,day)}</p>${jumpButton(day.palace,'Xem cung người')}</div><div><strong>2 · Sự việc — Thời can</strong><p>${label(chart.pillars.hour,hour)}</p>${jumpButton(hour.palace,'Xem cung việc')}</div></div>
    <p class="relation-banner"><strong>So hành cung:</strong> ${day.palace.element} / ${hour.palace.element} → ${relation(day.palace.element,hour.palace.element)}${day.palace.number===hour.palace.number?' · người và việc cùng cung':''}. Chỉ là một lớp tham khảo, không phải kết quả thành/bại.</p>
    <h3>3 · Xem thêm các điểm đại diện</h3><div class="guide-links">${refs || 'Chưa chọn dụng thần phụ; bắt đầu từ hai cung người và việc.'}</div>
    <p>${topic.read}</p><p><strong>Câu hỏi mẫu:</strong> ${topic.example}</p>
    <p class="reality-check"><strong>Đối chiếu thực tế:</strong> ${topic.check}</p>
    <details><summary>4 · Ghi nhận xét thử, không vội kết luận</summary><p>Ví dụ giả định: cung người thuộc Mộc, cung việc thuộc Thủy → việc sinh người, có tượng trợ lực. Nếu điểm đại diện việc lại lâm Không thì ghi “có tượng hỗ trợ nhưng điều kiện có thể chưa rõ”, rồi kiểm tra thông tin thực tế. Đây không phải lời luận của bàn hiện tại.</p><p>Mẫu ghi: Tôi hỏi… trước ngày…; người ở cung…; việc ở cung…; quan hệ hai cung…; yếu tố thuận…; yếu tố cần kiểm tra…; hành động thực tế tiếp theo…</p></details>`;
  document.querySelectorAll('[data-jump]').forEach(button=>button.addEventListener('click',()=>{
    selectedPalace=Number(button.dataset.jump);
    renderBoard(chart); renderDetail(chart);
    const target=board.querySelector(`[data-palace="${selectedPalace}"]`);
    target?.focus({preventScroll:true}); target?.scrollIntoView({block:'center',behavior:'smooth'});
  }));
}

function initElementDiagram() {
  const diagram=document.querySelector('#element-diagram');
  const reading=document.querySelector('#element-reading');
  const elements=Object.keys(GENERATES);
  const giver=(map,element)=>elements.find(item=>map[item]===element);
  const select=(element)=>{
    diagram.dataset.active=element;
    diagram.querySelectorAll('.element-orb').forEach(button=>{
      const active=button.dataset.elementChoice===element;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    diagram.querySelectorAll('.element-routes path').forEach(path=>path.classList.toggle('is-related',path.dataset.from===element||path.dataset.to===element));
    reading.innerHTML=`<h3>${element} trong bốn chiều quan hệ</h3><div class="relation-cards">
      <p><span class="relation-label relation-generate">Sinh ra</span><strong>${element} → ${GENERATES[element]}</strong><small>${element} nuôi dưỡng ${GENERATES[element]}</small></p>
      <p><span class="relation-label relation-generate">Được sinh</span><strong>${giver(GENERATES,element)} → ${element}</strong><small>${element} nhận sự nâng đỡ từ ${giver(GENERATES,element)}</small></p>
      <p><span class="relation-label relation-control">Khắc</span><strong>${element} → ${CONTROLS[element]}</strong><small>${element} chế ước ${CONTROLS[element]}</small></p>
      <p><span class="relation-label relation-control">Bị khắc</span><strong>${giver(CONTROLS,element)} → ${element}</strong><small>${element} chịu sự chế ước của ${giver(CONTROLS,element)}</small></p>
    </div>`;
  };
  diagram.querySelectorAll('.element-orb').forEach(button=>button.addEventListener('click',()=>select(button.dataset.elementChoice)));
  select('Mộc');
}

topicInput.addEventListener('change',()=>{if(currentChart)renderGuide(currentChart);});
questionInput.addEventListener('input',()=>{
  document.querySelector('#question-summary').textContent = questionInput.value.trim()===currentQuestion ? (currentQuestion?`Câu hỏi của bàn: ${currentQuestion}`:'Chưa ghi câu hỏi.') : 'Bạn đang sửa câu hỏi. Bấm Lập bàn để gắn câu hỏi mới với ngày giờ đã chọn.';
});

initLocalAi({prepare(){
  generateAndRender();
  if(!errorBox.hidden)throw new Error(errorBox.textContent);
  return {question:questionInput.value.trim(),topic:topicInput.value,method:methodInput.value,input:{...currentChart.input}};
}});
initElementDiagram();
