const mod = (value, size) => ((value % size) + size) % size;
const wrapPalace = (value) => mod(value - 1, 9) + 1;
export const ENGINE_VERSION = 'TG-ROTATING-2.0';

export const ELEMENTS = {
  "Mộc": { slug: "wood", color: "#08783c" },
  "Hỏa": { slug: "fire", color: "#ce202c" },
  "Thổ": { slug: "earth", color: "#86411e" },
  "Kim": { slug: "metal", color: "#775600" },
  "Thủy": { slug: "water", color: "#1557cc" },
};

export const STEMS = [
  { han: "甲", vi: "Giáp", element: "Mộc" },
  { han: "乙", vi: "Ất", element: "Mộc" },
  { han: "丙", vi: "Bính", element: "Hỏa" },
  { han: "丁", vi: "Đinh", element: "Hỏa" },
  { han: "戊", vi: "Mậu", element: "Thổ" },
  { han: "己", vi: "Kỷ", element: "Thổ" },
  { han: "庚", vi: "Canh", element: "Kim" },
  { han: "辛", vi: "Tân", element: "Kim" },
  { han: "壬", vi: "Nhâm", element: "Thủy" },
  { han: "癸", vi: "Quý", element: "Thủy" },
];

export const BRANCHES = [
  { han: "子", vi: "Tý" }, { han: "丑", vi: "Sửu" },
  { han: "寅", vi: "Dần" }, { han: "卯", vi: "Mão" },
  { han: "辰", vi: "Thìn" }, { han: "巳", vi: "Tỵ" },
  { han: "午", vi: "Ngọ" }, { han: "未", vi: "Mùi" },
  { han: "申", vi: "Thân" }, { han: "酉", vi: "Dậu" },
  { han: "戌", vi: "Tuất" }, { han: "亥", vi: "Hợi" },
];

export const PALACES = {
  1: { number: 1, han: "坎", trigram: "☵", vi: "Khảm", direction: "Bắc", element: "Thủy", branches: [0], image: "Nước · trung nam · hiểm sâu · trí mưu" },
  2: { number: 2, han: "坤", trigram: "☷", vi: "Khôn", direction: "Tây Nam", element: "Thổ", branches: [7, 8], image: "Đất · mẹ · dung nạp · hậu cần" },
  3: { number: 3, han: "震", trigram: "☳", vi: "Chấn", direction: "Đông", element: "Mộc", branches: [3], image: "Sấm · trưởng nam · khởi động · hành động" },
  4: { number: 4, han: "巽", trigram: "☴", vi: "Tốn", direction: "Đông Nam", element: "Mộc", branches: [4, 5], image: "Gió · trưởng nữ · lan tỏa · văn thư" },
  5: { number: 5, han: "中", trigram: "", vi: "Trung Ngũ", direction: "Trung tâm", element: "Thổ", branches: [], image: "Trung tâm · điều phối · điểm quy tụ" },
  6: { number: 6, han: "乾", trigram: "☰", vi: "Càn", direction: "Tây Bắc", element: "Kim", branches: [10, 11], image: "Trời · cha · quyền lực · lãnh đạo" },
  7: { number: 7, han: "兌", trigram: "☱", vi: "Đoài", direction: "Tây", element: "Kim", branches: [9], image: "Đầm hồ · thiếu nữ · giao dịch · khẩu thiệt" },
  8: { number: 8, han: "艮", trigram: "☶", vi: "Cấn", direction: "Đông Bắc", element: "Thổ", branches: [1, 2], image: "Núi · thiếu nam · dừng lại · ranh giới" },
  9: { number: 9, han: "離", trigram: "☲", vi: "Ly", direction: "Nam", element: "Hỏa", branches: [6], image: "Lửa · trung nữ · ánh sáng · danh tiếng" },
};

export const STARS = [
  { id: "peng", han: "蓬", vi: "Thiên Bồng", element: "Thủy", meaning: "Mưu lược, lưu động, việc kín; tốt xấu tùy môn và cung phối hợp." },
  { id: "ren", han: "任", vi: "Thiên Nhậm", element: "Thổ", meaning: "Ổn định, gánh vác, điền sản, việc bền lâu." },
  { id: "chong", han: "沖", vi: "Thiên Xung", element: "Mộc", meaning: "Nhanh, chủ động, đột phá; dễ nóng vội." },
  { id: "fu", han: "輔", vi: "Thiên Phụ", element: "Mộc", meaning: "Học hành, văn thư, trợ lực, danh tiếng mềm." },
  { id: "ying", han: "英", vi: "Thiên Anh", element: "Hỏa", meaning: "Hình ảnh, danh tiếng, văn minh; cũng chủ nóng và phô bày." },
  { id: "rui", han: "芮", vi: "Thiên Nhuế", element: "Thổ", meaning: "Bệnh, vấn đề cũ, đất đai; cũng chỉ học hỏi và chỉnh sửa." },
  { id: "zhu", han: "柱", vi: "Thiên Trụ", element: "Kim", meaning: "Khẩu thiệt, phá cũ, chống đối, âm thanh." },
  { id: "xin", han: "心", vi: "Thiên Tâm", element: "Kim", meaning: "Hoạch định, y dược, quản trị, khả năng xử lý." },
];

export const STAR_QIN = { id: "qin", han: "禽", vi: "Thiên Cầm", element: "Thổ", meaning: "Trung chính, điều phối và quyền uy; chuyển bàn thường ký cùng Thiên Nhuế." };

export const DOORS = [
  { id: "xiu", han: "休", vi: "Hưu Môn", element: "Thủy", quality: "cát", meaning: "Nghỉ ngơi, quan hệ, cầu người, hòa giải." },
  { id: "sheng", han: "生", vi: "Sinh Môn", element: "Thổ", quality: "đại cát", meaning: "Tài lộc, sinh trưởng, kinh doanh, hồi phục." },
  { id: "shang", han: "傷", vi: "Thương Môn", element: "Mộc", quality: "hung", meaning: "Tổn thương, cạnh tranh, vận động, đòi hỏi quyết liệt." },
  { id: "du", han: "杜", vi: "Đỗ Môn", element: "Mộc", quality: "bình", meaning: "Kín đáo, kỹ thuật, giữ bí mật; cũng chỉ bế tắc." },
  { id: "jing", han: "景", vi: "Cảnh Môn", element: "Hỏa", quality: "bình · tùy việc", meaning: "Danh tiếng, văn thư, truyền thông, hình ảnh; không thuộc ba cát môn Khai–Hưu–Sinh, cần xét việc cụ thể." },
  { id: "si", han: "死", vi: "Tử Môn", element: "Thổ", quality: "hung", meaning: "Kết thúc, đình trệ, bất động, thu hồi việc cũ." },
  { id: "fear", han: "驚", vi: "Kinh Môn", element: "Kim", quality: "hung", meaning: "Bất ngờ, lo lắng, kiện tụng, thị phi." },
  { id: "kai", han: "開", vi: "Khai Môn", element: "Kim", quality: "đại cát", meaning: "Công việc, khai trương, cơ hội, gặp người có quyền." },
];

export const SPIRITS = [
  { id: "chief", han: "符", vi: "Trực Phù", meaning: "Quý nhân, chủ sự, chính danh, lực nâng đỡ." },
  { id: "snake", han: "蛇", vi: "Đằng Xà", meaning: "Hư ảo, vòng vèo, lo nghĩ, biến động khó lường." },
  { id: "moon", han: "陰", vi: "Thái Âm", meaning: "Âm thầm trợ giúp, tinh tế, kế hoạch kín." },
  { id: "harmony", han: "合", vi: "Lục Hợp", meaning: "Hợp tác, giao dịch, mai mối, nhiều mối liên hệ." },
  { id: "tiger", han: "虎", vi: "Bạch Hổ", meaning: "Quyết liệt, áp lực, thương tổn, sức mạnh cưỡng chế." },
  { id: "tortoise", han: "武", vi: "Huyền Vũ", meaning: "Ẩn giấu, thông tin, nghi ngờ, thất thoát hoặc mưu trí." },
  { id: "earth9", han: "地", vi: "Cửu Địa", meaning: "Thấp, chậm, bền, giữ vững và tích lũy." },
  { id: "heaven9", han: "天", vi: "Cửu Thiên", meaning: "Cao, nhanh, khuếch trương, hành động quy mô lớn." },
];

const TERM_DEFINITIONS = [
  ["lichun", "立春", "Lập Xuân", [8, 5, 2], true],
  ["yushui", "雨水", "Vũ Thủy", [9, 6, 3], true],
  ["jingzhe", "驚蟄", "Kinh Trập", [1, 7, 4], true],
  ["chunfen", "春分", "Xuân Phân", [3, 9, 6], true],
  ["qingming", "清明", "Thanh Minh", [4, 1, 7], true],
  ["guyu", "穀雨", "Cốc Vũ", [5, 2, 8], true],
  ["lixia", "立夏", "Lập Hạ", [4, 1, 7], true],
  ["xiaoman", "小滿", "Tiểu Mãn", [5, 2, 8], true],
  ["mangzhong", "芒種", "Mang Chủng", [6, 3, 9], true],
  ["xiazhi", "夏至", "Hạ Chí", [9, 3, 6], false],
  ["xiaoshu", "小暑", "Tiểu Thử", [8, 2, 5], false],
  ["dashu", "大暑", "Đại Thử", [7, 1, 4], false],
  ["liqiu", "立秋", "Lập Thu", [2, 5, 8], false],
  ["chushu", "處暑", "Xử Thử", [1, 4, 7], false],
  ["bailu", "白露", "Bạch Lộ", [9, 3, 6], false],
  ["qiufen", "秋分", "Thu Phân", [7, 1, 4], false],
  ["hanlu", "寒露", "Hàn Lộ", [6, 9, 3], false],
  ["shuangjiang", "霜降", "Sương Giáng", [5, 8, 2], false],
  ["lidong", "立冬", "Lập Đông", [6, 9, 3], false],
  ["xiaoxue", "小雪", "Tiểu Tuyết", [5, 8, 2], false],
  ["daxue", "大雪", "Đại Tuyết", [4, 7, 1], false],
  ["dongzhi", "冬至", "Đông Chí", [1, 7, 4], true],
  ["xiaohan", "小寒", "Tiểu Hàn", [2, 8, 5], true],
  ["dahan", "大寒", "Đại Hàn", [3, 9, 6], true],
];

export const TERMS = Object.fromEntries(TERM_DEFINITIONS.map(([id, han, vi, ju, isYang]) => [id, { id, han, vi, ju, isYang }]));

const TERM_ALIASES = {
  "立春": "lichun", "LI_CHUN": "lichun", "雨水": "yushui", "YU_SHUI": "yushui",
  "惊蛰": "jingzhe", "驚蟄": "jingzhe", "JING_ZHE": "jingzhe",
  "春分": "chunfen", "CHUN_FEN": "chunfen", "清明": "qingming", "QING_MING": "qingming",
  "谷雨": "guyu", "穀雨": "guyu", "GU_YU": "guyu", "立夏": "lixia", "LI_XIA": "lixia",
  "小满": "xiaoman", "小滿": "xiaoman", "XIAO_MAN": "xiaoman",
  "芒种": "mangzhong", "芒種": "mangzhong", "MANG_ZHONG": "mangzhong",
  "夏至": "xiazhi", "XIA_ZHI": "xiazhi", "小暑": "xiaoshu", "XIAO_SHU": "xiaoshu",
  "大暑": "dashu", "DA_SHU": "dashu", "立秋": "liqiu", "LI_QIU": "liqiu",
  "处暑": "chushu", "處暑": "chushu", "CHU_SHU": "chushu", "白露": "bailu", "BAI_LU": "bailu",
  "秋分": "qiufen", "QIU_FEN": "qiufen", "寒露": "hanlu", "HAN_LU": "hanlu",
  "霜降": "shuangjiang", "SHUANG_JIANG": "shuangjiang", "立冬": "lidong", "LI_DONG": "lidong",
  "小雪": "xiaoxue", "XIAO_XUE": "xiaoxue", "大雪": "daxue", "DA_XUE": "daxue",
  "冬至": "dongzhi", "DONG_ZHI": "dongzhi", "小寒": "xiaohan", "XIAO_HAN": "xiaohan",
  "大寒": "dahan", "DA_HAN": "dahan",
};

const QI_YI_SEQUENCE = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const RING = [1, 8, 3, 4, 9, 2, 7, 6];
const GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const XUN_HEADS = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
const XUN_INSTRUMENTS = ["戊", "己", "庚", "辛", "壬", "癸"];

const stemByHan = (han) => STEMS.find((item) => item.han === han);
const branchByHan = (han) => BRANCHES.find((item) => item.han === han);

export function sexagenaryIndex(ganzhi) {
  for (let index = 0; index < 60; index += 1) {
    if (`${STEMS[index % 10].han}${BRANCHES[index % 12].han}` === ganzhi) return index;
  }
  throw new Error(`Can Chi không hợp lệ: ${ganzhi}`);
}

export function sexagenaryName(index) {
  if (!Number.isInteger(index)) throw new Error('Chỉ số Can Chi phải là số nguyên.');
  const normalized = mod(index, 60);
  return `${STEMS[normalized % 10].han}${BRANCHES[normalized % 12].han}`;
}

export function pillarFromGanzhi(ganzhi) {
  sexagenaryIndex(ganzhi);
  const stem = stemByHan(ganzhi[0]);
  const branch = branchByHan(ganzhi[1]);
  if (!stem || !branch) throw new Error(`Không đọc được Can Chi: ${ganzhi}`);
  return { han: ganzhi, vi: `${stem.vi} ${branch.vi}`, stem, branch };
}

function requireCalendar() {
  if (!globalThis.Solar) throw new Error("Bộ lịch Can Chi chưa tải xong. Vui lòng tải lại trang.");
  return globalThis.Solar;
}

function civilAtOffset(utcMs, offsetHours) {
  const shifted = new Date(utcMs + offsetHours * 3_600_000);
  return {
    year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes(), second: shifted.getUTCSeconds(),
  };
}

function solarToUtcMs(solar, sourceOffset = 8) {
  return Date.UTC(
    solar.getYear(), solar.getMonth() - 1, solar.getDay(),
    solar.getHour(), solar.getMinute(), solar.getSecond(),
  ) - sourceOffset * 3_600_000;
}

function normalizeTerm(rawName) {
  const id = TERM_ALIASES[rawName];
  if (!id || !TERMS[id]) throw new Error(`Tiết khí chưa được nhận diện: ${rawName}`);
  return TERMS[id];
}

function findEarthPalace(earth, stemHan) {
  for (let palace = 1; palace <= 9; palace += 1) {
    if (earth[palace]?.han === stemHan) return palace;
  }
  throw new Error(`Không tìm thấy ${stemHan} trên địa bàn.`);
}

export function yuanByFuHead(dayIndex) {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 59) throw new Error('Chỉ số ngày phải nằm trong 0–59.');
  const fuHeadIndex = Math.floor(dayIndex / 5) * 5;
  const branchIndex = fuHeadIndex % 12;
  let yuanIndex;
  if ([0, 3, 6, 9].includes(branchIndex)) yuanIndex = 0;
  else if ([2, 5, 8, 11].includes(branchIndex)) yuanIndex = 1;
  else yuanIndex = 2;
  return { yuanIndex, fuHead: sexagenaryName(fuHeadIndex) };
}

export function yuanByTermElapsed(elapsedDays) {
  if (!Number.isFinite(elapsedDays) || elapsedDays < 0) throw new Error('Số ngày từ giao tiết không hợp lệ.');
  if (elapsedDays < 5) return 0;
  if (elapsedDays < 10) return 1;
  return 2;
}

function horseBranchIndex(hourBranchIndex) {
  if ([2, 6, 10].includes(hourBranchIndex)) return 8;
  if ([5, 9, 1].includes(hourBranchIndex)) return 11;
  if ([8, 0, 4].includes(hourBranchIndex)) return 2;
  return 5;
}

function hostPalace(palace) {
  return palace === 5 ? 2 : palace;
}

export function buildEarthPlate(ju, isYang) {
  if (!Number.isInteger(ju) || ju < 1 || ju > 9 || typeof isYang !== 'boolean') throw new Error('Độn/cục không hợp lệ.');
  const earth = {};
  const direction = isYang ? 1 : -1;
  QI_YI_SEQUENCE.forEach((stemHan, index) => {
    const palace = wrapPalace(ju + direction * index);
    earth[palace] = stemByHan(stemHan);
  });
  return earth;
}

export function buildRotatingLayers(earth, hourPillar, isYang) {
  if (typeof isYang !== 'boolean') throw new Error('Âm/Dương Độn không hợp lệ.');
  if (Object.keys(earth).length !== 9 || new Set(Object.values(earth).map(s => s?.han)).size !== 9 ||
      Array.from({length:9}, (_, i) => i + 1).some(n => !QI_YI_SEQUENCE.includes(earth[n]?.han))) throw new Error('Địa bàn phải đủ chín can không trùng.');
  hourPillar = pillarFromGanzhi(hourPillar?.han);
  const hourIndex = sexagenaryIndex(hourPillar.han);
  const xunNumber = Math.floor(hourIndex / 10);
  const hourOffset = hourIndex % 10;
  const xunHead = XUN_HEADS[xunNumber];
  const instrumentHan = XUN_INSTRUMENTS[xunNumber];
  const instrumentPalace = findEarthPalace(earth, instrumentHan);

  const hourAnchorHan = hourPillar.stem.han === "甲" ? instrumentHan : hourPillar.stem.han;
  const rawStarTarget = findEarthPalace(earth, hourAnchorHan);
  const starTargetPalace = hostPalace(rawStarTarget);
  const starTargetIndex = RING.indexOf(starTargetPalace);
  const starOriginIndex = RING.indexOf(hostPalace(instrumentPalace));
  const starShift = mod(starTargetIndex - starOriginIndex, 8);

  const stars = {};
  const heavenStems = {};
  STARS.forEach((star, sourceIndex) => {
    const destination = RING[mod(sourceIndex + starShift, 8)];
    const sourcePalace = RING[sourceIndex];
    stars[destination] = { primary: star, carriesQin: sourcePalace === 2 };
    heavenStems[destination] = [earth[sourcePalace]];
    if (sourcePalace === 2) heavenStems[destination].push(earth[5]);
  });

  const dutyStar = instrumentPalace === 5 ? STAR_QIN : STARS[starOriginIndex];

  const dutyDoorSourceIndex = instrumentPalace === 5 ? 5 : RING.indexOf(instrumentPalace);
  const dutyDoor = DOORS[dutyDoorSourceIndex];
  const rawDoorTarget = wrapPalace(instrumentPalace + (isYang ? 1 : -1) * hourOffset);
  const doorTargetPalace = hostPalace(rawDoorTarget);
  const doorTargetIndex = RING.indexOf(doorTargetPalace);
  const doorShift = mod(doorTargetIndex - dutyDoorSourceIndex, 8);
  const doors = {};
  DOORS.forEach((door, sourceIndex) => {
    doors[RING[mod(sourceIndex + doorShift, 8)]] = door;
  });

  const spirits = {};
  SPIRITS.forEach((spirit, index) => {
    const destinationIndex = mod(starTargetIndex + (isYang ? index : -index), 8);
    spirits[RING[destinationIndex]] = spirit;
  });

  const voidBranches = [
    (XUN_HEADS[xunNumber] === "甲子" ? 0 : BRANCHES.findIndex((b) => b.han === XUN_HEADS[xunNumber][1])) + 10,
    (XUN_HEADS[xunNumber] === "甲子" ? 0 : BRANCHES.findIndex((b) => b.han === XUN_HEADS[xunNumber][1])) + 11,
  ].map((index) => mod(index, 12));
  const horseBranch = horseBranchIndex(BRANCHES.findIndex((b) => b.han === hourPillar.branch.han));
  const horsePalace = Object.values(PALACES).find((palace) => palace.branches.includes(horseBranch))?.number;

  return {
    xun: { head: pillarFromGanzhi(xunHead), instrument: stemByHan(instrumentHan), instrumentPalace, hourOffset },
    duty: { star: dutyStar, door: dutyDoor, starPalace: starTargetPalace, doorPalace: doorTargetPalace, rawStarPalace: rawStarTarget, rawDoorPalace: rawDoorTarget },
    stars, heavenStems, doors, spirits,
    voidBranches, horseBranch, horsePalace,
    patterns: {
      starFuYin: starShift === 0,
      starFanYin: starShift === 4,
      doorFuYin: doorShift === 0,
      doorFanYin: doorShift === 4,
    },
  };
}

function validateInput(input) {
  const fields = ["year", "month", "day", "hour", "minute", "tzOffset"];
  fields.forEach((field) => {
    if (typeof input?.[field] !== 'number' || !Number.isFinite(input[field])) throw new Error(`Dữ liệu ${field} phải là số hợp lệ.`);
    if (field !== 'tzOffset' && !Number.isInteger(input[field])) throw new Error('Năm, tháng, ngày, giờ và phút phải là số nguyên.');
  });
  const normalized = Object.fromEntries(fields.map((field) => [field, input[field]]));
  if (normalized.year < 1900 || normalized.year > 2100) throw new Error("App hỗ trợ năm 1900–2100.");
  const check = new Date(Date.UTC(normalized.year, normalized.month - 1, normalized.day));
  if (check.getUTCFullYear() !== normalized.year || check.getUTCMonth() + 1 !== normalized.month || check.getUTCDate() !== normalized.day) {
    throw new Error("Ngày dương lịch không hợp lệ.");
  }
  if (normalized.hour < 0 || normalized.hour > 23 || normalized.minute < 0 || normalized.minute > 59) throw new Error("Giờ hoặc phút không hợp lệ.");
  if (normalized.tzOffset < -12 || normalized.tzOffset > 14) throw new Error("Múi giờ phải nằm trong UTC−12 đến UTC+14.");
  if (Math.abs(normalized.tzOffset * 60 - Math.round(normalized.tzOffset * 60)) > 1e-8) throw new Error('Múi giờ phải tương ứng số phút nguyên.');
  return normalized;
}

export function generateQimen(rawInput, method = "chaibu") {
  const input = validateInput(rawInput);
  if (!["chaibu", "maoshan"].includes(method)) throw new Error("Pháp định cục không hợp lệ.");
  const Solar = requireCalendar();
  const utcMs = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute) - input.tzOffset * 3_600_000;

  const localSolar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
  const localLunar = localSolar.getLunar();
  const beijing = civilAtOffset(utcMs, 8);
  const beijingSolar = Solar.fromYmdHms(beijing.year, beijing.month, beijing.day, beijing.hour, beijing.minute, beijing.second);
  const beijingLunar = beijingSolar.getLunar();

  const pillars = {
    year: pillarFromGanzhi(beijingLunar.getYearInGanZhiExact()),
    month: pillarFromGanzhi(beijingLunar.getMonthInGanZhiExact()),
    day: pillarFromGanzhi(localLunar.getDayInGanZhiExact()),
    hour: pillarFromGanzhi(localLunar.getTimeInGanZhi()),
  };

  const previous = beijingLunar.getPrevJieQi(false);
  const next = beijingLunar.getNextJieQi(false);
  if (!previous || !next) throw new Error("Không tìm được tiết khí cho thời điểm này.");
  const currentTerm = normalizeTerm(previous.getName());
  const nextTerm = normalizeTerm(next.getName());
  const currentTermUtcMs = solarToUtcMs(previous.getSolar(), 8);
  const nextTermUtcMs = solarToUtcMs(next.getSolar(), 8);
  if (!(currentTermUtcMs <= utcMs && utcMs < nextTermUtcMs)) throw new Error('Khoảng tiết khí không nhất quán; chưa thể lập bàn.');
  const elapsedDays = (utcMs - currentTermUtcMs) / 86_400_000;

  const dayIndex = sexagenaryIndex(pillars.day.han);
  const fu = yuanByFuHead(dayIndex);
  const yuanIndex = method === "chaibu" ? fu.yuanIndex : yuanByTermElapsed(elapsedDays);
  const yuanNames = ["Thượng nguyên", "Trung nguyên", "Hạ nguyên"];
  const ju = currentTerm.ju[yuanIndex];
  const isYang = currentTerm.isYang;
  const earth = buildEarthPlate(ju, isYang);
  const layers = buildRotatingLayers(earth, pillars.hour, isYang);

  const palaceResults = GRID.map((number) => {
    const base = PALACES[number];
    const voided = base.branches.some((branch) => layers.voidBranches.includes(branch));
    if (number === 5) {
      return {
        ...base, earthStem: earth[5], heavenStems: [], star: STAR_QIN, carriesQin: false,
        door: null, spirit: null, voided: false, horse: false,
        isDutyStar: layers.duty.starPalace === 5, isDutyDoor: false,
      };
    }
    return {
      ...base,
      earthStem: earth[number],
      heavenStems: layers.heavenStems[number],
      star: layers.stars[number].primary,
      carriesQin: layers.stars[number].carriesQin,
      door: layers.doors[number],
      spirit: layers.spirits[number],
      voided,
      horse: layers.horsePalace === number,
      isDutyStar: layers.duty.starPalace === number,
      isDutyDoor: layers.duty.doorPalace === number,
    };
  });

  return {
    engineVersion: ENGINE_VERSION, input, utcMs, method,
    methodLabel: method === "chaibu" ? "Tháo bổ · Phù đầu" : "Mao Sơn · 5 ngày/nguyên",
    pillars,
    term: { ...currentTerm, utcMs: currentTermUtcMs, elapsedDays },
    nextTerm: { ...nextTerm, utcMs: nextTermUtcMs },
    dun: { isYang, label: isYang ? "Dương Độn" : "Âm Độn", ju, yuanIndex, yuan: yuanNames[yuanIndex] },
    fuHead: pillarFromGanzhi(fu.fuHead),
    earth,
    ...layers,
    voidBranchData: layers.voidBranches.map((index) => BRANCHES[index]),
    horseBranchData: BRANCHES[layers.horseBranch],
    palaces: palaceResults,
  };
}

export function elementSlug(element) {
  return ELEMENTS[element]?.slug || "neutral";
}

export function formatOffset(offset) {
  const sign = offset >= 0 ? "+" : "−";
  const absolute = Math.abs(offset);
  const hours = Math.floor(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatInstantAtOffset(utcMs, offset, includeYear = false) {
  const civil = civilAtOffset(utcMs, offset);
  const two = (value) => String(value).padStart(2, "0");
  const date = `${two(civil.day)}/${two(civil.month)}${includeYear ? `/${civil.year}` : ""}`;
  return `${date} · ${two(civil.hour)}:${two(civil.minute)}`;
}
