// Independent reference implementation of the rotating board (转盘, 拆补 / 符头定元).
// Purpose: cross-check dist/qimen.mjs. It deliberately does NOT import lunar-javascript
// or dist/qimen.mjs: day pillar comes from the Julian Day Number, hour stem from the
// Five Rats rule (五鼠遁), solar terms from a Meeus low-precision solar longitude
// (accuracy about 0.01°, i.e. roughly ±15 minutes), and the plates are built by walking
// palaces instead of shifting indices.

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const CLOCKWISE = [1, 8, 3, 4, 9, 2, 7, 6]; // Khảm → Cấn → Chấn → Tốn → Ly → Khôn → Đoài → Càn
const HOME_STAR = {1: '蓬', 8: '任', 3: '沖', 4: '輔', 9: '英', 2: '芮', 7: '柱', 6: '心'};
const HOME_DOOR = {1: '休', 8: '生', 3: '傷', 4: '杜', 9: '景', 2: '死', 7: '驚', 6: '開'};
const SPIRIT_ORDER = ['符', '蛇', '陰', '合', '虎', '武', '地', '天'];
const QIYI = '戊己庚辛壬癸丁丙乙';
const PALACE_BRANCHES = {1: [0], 8: [1, 2], 3: [3], 4: [4, 5], 9: [6], 2: [7, 8], 7: [9], 6: [10, 11]};

// Solar terms indexed by k = floor(apparent longitude / 15). k=0 is 春分 (0°).
// Each entry: [engine id, yang?, [upper, middle, lower] ju]  (烟波钓叟歌 table).
const TERM_BY_K = [
  ['chunfen', true, [3, 9, 6]], ['qingming', true, [4, 1, 7]], ['guyu', true, [5, 2, 8]],
  ['lixia', true, [4, 1, 7]], ['xiaoman', true, [5, 2, 8]], ['mangzhong', true, [6, 3, 9]],
  ['xiazhi', false, [9, 3, 6]], ['xiaoshu', false, [8, 2, 5]], ['dashu', false, [7, 1, 4]],
  ['liqiu', false, [2, 5, 8]], ['chushu', false, [1, 4, 7]], ['bailu', false, [9, 3, 6]],
  ['qiufen', false, [7, 1, 4]], ['hanlu', false, [6, 9, 3]], ['shuangjiang', false, [5, 8, 2]],
  ['lidong', false, [6, 9, 3]], ['xiaoxue', false, [5, 8, 2]], ['daxue', false, [4, 7, 1]],
  ['dongzhi', true, [1, 7, 4]], ['xiaohan', true, [2, 8, 5]], ['dahan', true, [3, 9, 6]],
  ['lichun', true, [8, 5, 2]], ['yushui', true, [9, 6, 3]], ['jingzhe', true, [1, 7, 4]],
];

const rad = (d) => (d * Math.PI) / 180;
const norm360 = (x) => ((x % 360) + 360) % 360;

// Meeus, Astronomical Algorithms ch. 25 (low accuracy), apparent longitude.
// Input in Terrestrial Time approximated by UT + ΔT (simple polynomial, adequate 1900–2100).
function deltaTSeconds(year) {
  const t = year - 2000;
  if (year < 1986) { const u = (year - 1950); return 29.07 + 0.407 * u - u * u / 233 + u ** 3 / 2547; }
  if (year < 2005) return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3;
  if (year < 2050) return 62.92 + 0.32217 * t + 0.005589 * t * t;
  return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
}

export function solarLongitude(utcMs) {
  const year = new Date(utcMs).getUTCFullYear();
  const jd = utcMs / 86400000 + 2440587.5 + deltaTSeconds(year) / 86400;
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(M))
    + (0.019993 - 0.000101 * T) * Math.sin(rad(2 * M)) + 0.000289 * Math.sin(rad(3 * M));
  const omega = 125.04 - 1934.136 * T;
  return norm360(L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega)));
}

// Time (UTC ms) when the sun last reached longitude 15·k before utcMs.
export function previousTermTime(utcMs) {
  const k = Math.floor(solarLongitude(utcMs) / 15);
  const target = k * 15;
  let hi = utcMs; let lo = utcMs - 17 * 86400000;
  const past = (t) => norm360(solarLongitude(t) - target) < 180;
  for (let i = 0; i < 60; i += 1) { const mid = (lo + hi) / 2; if (past(mid)) hi = mid; else lo = mid; }
  return {k, utcMs: hi};
}

function julianDayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12); const yy = y + 4800 - a; const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

const gz = (i) => STEMS[((i % 10) + 10) % 10] + BRANCHES[((i % 12) + 12) % 12];
const gzIndex = (s, b) => { for (let i = 0; i < 60; i += 1) if (i % 10 === s && i % 12 === b) return i; return -1; };

export function referenceBoard({year, month, day, hour, minute, tzOffset}) {
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffset * 3600000;
  // Day changes at 23:00 local (早子时 counts as the next day, same convention as the app).
  let jdn = julianDayNumber(year, month, day);
  if (hour === 23) jdn += 1;
  const dayIndex = (((jdn + 49) % 60) + 60) % 60;
  const hourBranch = Math.floor((hour + 1) / 2) % 12;
  const hourStem = ((dayIndex % 10) % 5 * 2 + hourBranch) % 10; // 五鼠遁: 甲己 → 甲子 ...
  const hourIndex = gzIndex(hourStem, hourBranch);

  const term = previousTermTime(utcMs);
  const [termId, yang, juTable] = TERM_BY_K[term.k];
  const fuHead = Math.floor(dayIndex / 5) * 5;
  const fb = fuHead % 12;
  const yuan = [0, 3, 6, 9].includes(fb) ? 0 : [2, 5, 8, 11].includes(fb) ? 1 : 2;
  const ju = juTable[yuan];

  // Earth plate: 戊 at ju palace, then 九宫 order forward (yang) or backward (yin).
  const earth = {};
  let p = ju;
  for (const s of QIYI) { earth[p] = s; p = yang ? (p % 9) + 1 : ((p + 7) % 9) + 1; }
  const where = (s) => Number(Object.keys(earth).find((k) => earth[k] === s));
  const lodge = (n) => (n === 5 ? 2 : n);

  const xun = Math.floor(hourIndex / 10);
  const instrument = '戊己庚辛壬癸'[xun];
  const instrumentPalace = where(instrument);
  const anchor = STEMS[hourStem] === '甲' ? instrument : STEMS[hourStem];
  const starTo = lodge(where(anchor));
  const starFrom = lodge(instrumentPalace);

  // Walk clockwise: every star moves the same number of ring steps as the duty star.
  const steps = (from, to) => { let n = 0; let i = CLOCKWISE.indexOf(from); while (CLOCKWISE[i] !== to) { i = (i + 1) % 8; n += 1; } return n; };
  const starSteps = steps(starFrom, starTo);
  const palaces = {};
  for (const home of CLOCKWISE) {
    const dest = CLOCKWISE[(CLOCKWISE.indexOf(home) + starSteps) % 8];
    palaces[dest] = {star: HOME_STAR[home], heaven: earth[home] + (home === 2 ? earth[5] : '')};
  }
  // Duty door walks hourOffset palaces in 九宫 numeric order.
  let doorAt = instrumentPalace;
  for (let i = 0; i < hourIndex % 10; i += 1) doorAt = yang ? (doorAt % 9) + 1 : ((doorAt + 7) % 9) + 1;
  const doorSteps = steps(starFrom, lodge(doorAt));
  for (const home of CLOCKWISE) palaces[CLOCKWISE[(CLOCKWISE.indexOf(home) + doorSteps) % 8]].door = HOME_DOOR[home];
  // Spirits start with 值符 where the duty star landed; yang clockwise, yin counter-clockwise.
  SPIRIT_ORDER.forEach((s, i) => {
    const idx = (CLOCKWISE.indexOf(starTo) + (yang ? i : -i) + 80) % 8;
    palaces[CLOCKWISE[idx]].spirit = s;
  });
  // Void (旬空) of the hour xun; horse (驿马) of the hour branch.
  const headBranch = (xun * 10) % 12;
  const voids = [(headBranch + 10) % 12, (headBranch + 11) % 12];
  const horse = {0: 2, 4: 2, 8: 2, 2: 8, 6: 8, 10: 8, 5: 11, 9: 11, 1: 11, 3: 5, 7: 5, 11: 5}[hourBranch];
  for (const [n, list] of Object.entries(PALACE_BRANCHES)) {
    palaces[n].voided = list.some((b) => voids.includes(b));
    palaces[n].horse = list.includes(horse);
  }
  return {
    utcMs, dayPillar: gz(dayIndex), hourPillar: gz(hourIndex), termId, termUtcMs: term.utcMs,
    yang, ju, yuan, earth, palaces, voidBranches: voids.map((b) => BRANCHES[b]), horseBranch: BRANCHES[horse],
  };
}
