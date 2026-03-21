/**
 * Bikram Sambat (BS) ↔ Gregorian (AD) Date Converter
 * Nepal uses BS for government documents, IRD filings, and hotel registrations.
 */

export const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
];

export const BS_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "श्रावण",
  "भाद्र", "आश्विन", "कार्तिक", "मंसिर",
  "पुष", "माघ", "फाल्गुन", "चैत्र",
];

const BS_MONTH_DAYS: Record<number, number[]> = {
  2070: [31,32,31,32,31,30,30,30,29,29,30,30],
  2071: [31,31,32,31,31,31,30,29,30,29,30,30],
  2072: [31,32,31,32,31,30,30,30,29,30,30,30],
  2073: [31,31,31,32,31,30,30,30,29,29,30,30],
  2074: [31,32,31,31,31,30,30,30,29,30,29,31],
  2075: [31,32,31,32,30,31,30,29,30,29,30,30],
  2076: [31,31,32,31,31,30,30,30,29,29,30,30],
  2077: [31,32,31,32,31,30,30,29,30,29,30,30],
  2078: [31,31,32,31,31,31,30,29,30,29,30,30],
  2079: [31,31,32,31,31,31,30,29,30,29,30,30],
  2080: [31,32,31,32,30,31,30,29,30,29,30,30],
  2081: [31,31,32,31,31,30,30,30,29,29,30,30],
  2082: [31,32,31,32,31,30,30,29,30,29,30,30],
  2083: [31,31,32,31,31,31,30,29,30,29,30,30],
  2084: [31,32,31,31,31,30,30,30,29,29,30,30],
  2085: [31,32,31,32,31,30,30,29,30,29,30,30],
  2086: [31,31,32,31,31,30,30,30,29,29,30,30],
  2087: [31,32,31,32,31,30,30,29,30,29,30,30],
  2088: [31,32,31,32,31,30,30,29,30,29,30,30],
  2089: [31,31,32,31,31,31,30,29,30,29,30,30],
  2090: [31,31,32,31,31,30,30,30,29,29,30,30],
  2091: [31,31,32,31,31,30,30,30,29,30,30,30],
  2092: [31,32,31,32,30,31,30,29,30,29,30,30],
  2093: [31,31,32,31,31,31,30,29,30,29,30,30],
  2094: [31,31,32,31,31,31,30,29,30,29,30,30],
  2095: [31,32,31,32,31,30,30,29,30,29,30,30],
};

const BS_EPOCH_YEAR  = 1970;
const AD_EPOCH_YEAR  = 1913;
const AD_EPOCH_MONTH = 4;
const AD_EPOCH_DAY   = 13;

export interface BSDate {
  year: number;
  month: number;
  day: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInBSMonth(year: number, month: number): number {
  return BS_MONTH_DAYS[year]?.[month - 1] ?? [31,32,31,32,31,30,30,30,29,29,30,30][month - 1];
}

export function adToBS(date: Date): BSDate {
  const adYear = date.getFullYear(), adMonth = date.getMonth() + 1, adDay = date.getDate();
  let totalDays = 0;
  for (let y = AD_EPOCH_YEAR; y < adYear; y++) totalDays += isLeapYear(y) ? 366 : 365;
  const adMonthDays = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  if (isLeapYear(adYear)) adMonthDays[2] = 29;
  for (let m = 1; m < adMonth; m++) totalDays += adMonthDays[m];
  totalDays += adDay - AD_EPOCH_DAY;

  let bsYear = BS_EPOCH_YEAR, bsMonth = 1, bsDay = 1;
  while (totalDays > 0) {
    const days = getDaysInBSMonth(bsYear, bsMonth);
    if (totalDays < days) { bsDay += totalDays; totalDays = 0; }
    else { totalDays -= days; bsMonth++; if (bsMonth > 12) { bsMonth = 1; bsYear++; } }
  }
  return { year: bsYear, month: bsMonth, day: bsDay };
}

export function bsToAD(bsYear: number, bsMonth: number, bsDay: number): Date {
  let totalDays = 0;
  for (let y = BS_EPOCH_YEAR; y < bsYear; y++)
    for (let m = 1; m <= 12; m++) totalDays += getDaysInBSMonth(y, m);
  for (let m = 1; m < bsMonth; m++) totalDays += getDaysInBSMonth(bsYear, m);
  totalDays += bsDay - 1;
  const epoch = new Date(AD_EPOCH_YEAR, AD_EPOCH_MONTH - 1, AD_EPOCH_DAY);
  epoch.setDate(epoch.getDate() + totalDays);
  return epoch;
}

export function formatBS(bs: BSDate, lang: "en" | "np" = "en"): string {
  const months = lang === "np" ? BS_MONTHS_NP : BS_MONTHS;
  return `${bs.day} ${months[bs.month - 1]} ${bs.year}`;
}

export function formatBSShort(bs: BSDate): string {
  return `${bs.year}/${String(bs.month).padStart(2,"0")}/${String(bs.day).padStart(2,"0")}`;
}

export function getBSDaysInMonth(year: number, month: number): number {
  return getDaysInBSMonth(year, month);
}

export function getBSYearRange() {
  const years = Object.keys(BS_MONTH_DAYS).map(Number);
  return { min: Math.min(...years), max: Math.max(...years) };
}

export function todayBS(): BSDate { return adToBS(new Date()); }

export function getNepalisFiscalYear(date: Date): string {
  const bs = adToBS(date);
  return bs.month >= 4
    ? `FY ${bs.year}/${String(bs.year + 1).slice(-2)}`
    : `FY ${bs.year - 1}/${String(bs.year).slice(-2)}`;
}
