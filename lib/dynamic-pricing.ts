/**
 * Nepal Peak Season Detector + Dynamic Pricing
 *
 * Nepal has very defined tourism seasons:
 * - Spring (March–May): Trekking, Everest climbs
 * - Autumn (Oct–Nov): Best weather, peak tourist season
 * - Dashain (Oct): Biggest festival, hotels fully booked
 * - Tihar (Oct-Nov): Second biggest festival
 * - New Year (April 13–14, Baisakh 1): Nepali New Year
 * - Christmas/Western New Year (Dec 25–Jan 1)
 */

export interface SeasonInfo {
  label: string;
  type: "PEAK" | "HIGH" | "NORMAL" | "LOW";
  multiplier: number;
  badge: string | null;
  badgeColor: string;
  tip: string;
}

export function getSeasonInfo(date: Date = new Date()): SeasonInfo {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Dashain window (roughly Oct 1–15 every year)
  const isDashain = month === 10 && day <= 20;

  // Tihar window (roughly Oct 20–Nov 5)
  const isTihar = (month === 10 && day >= 20) || (month === 11 && day <= 5);

  // Nepal New Year (April 13-14 → Baisakh 1)
  const isNepaliNewYear = month === 4 && (day === 13 || day === 14);

  // Christmas/Western New Year
  const isWesternHoliday =
    (month === 12 && day >= 20) || (month === 1 && day <= 5);

  // Autumn peak — best trekking weather
  const isAutumnPeak = month === 10 || month === 11;

  // Spring trekking season
  const isSpringPeak = month === 3 || month === 4 || month === 5;

  // Monsoon — low season
  const isMonsoon = month >= 6 && month <= 9;

  // Winter — slower but Christmas saves Dec
  const isWinter = month === 12 || month === 1 || month === 2;

  if (isDashain || isTihar) {
    return {
      label: "Dashain/Tihar Festival",
      type: "PEAK",
      multiplier: 1.35,
      badge: "🎉 Festival Season",
      badgeColor: "bg-red-100 text-red-700 border-red-200",
      tip: "Festival season — hotels fill up fast. Book early!",
    };
  }

  if (isNepaliNewYear) {
    return {
      label: "Nepali New Year",
      type: "PEAK",
      multiplier: 1.25,
      badge: "🎊 New Year",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      tip: "Nepali New Year (Baisakh 1) — very popular weekend.",
    };
  }

  if (isWesternHoliday) {
    return {
      label: "Christmas & New Year",
      type: "HIGH",
      multiplier: 1.2,
      badge: "🎄 Holiday Season",
      badgeColor: "bg-green-100 text-green-700 border-green-200",
      tip: "Holiday season popular with international tourists.",
    };
  }

  if (isAutumnPeak) {
    return {
      label: "Autumn Peak Season",
      type: "PEAK",
      multiplier: 1.3,
      badge: "🍂 Peak Season",
      badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
      tip: "October–November is Nepal's busiest trekking season.",
    };
  }

  if (isSpringPeak) {
    return {
      label: "Spring Trekking Season",
      type: "HIGH",
      multiplier: 1.2,
      badge: "🌸 Trekking Season",
      badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
      tip: "Spring is Everest season — rooms fill quickly.",
    };
  }

  if (isMonsoon) {
    return {
      label: "Monsoon Season",
      type: "LOW",
      multiplier: 0.85,
      badge: "💚 Great Deal",
      badgeColor: "bg-green-100 text-green-700 border-green-200",
      tip: "Monsoon season — fewer crowds, lower prices, lush green scenery.",
    };
  }

  return {
    label: "Off-Peak Season",
    type: "NORMAL",
    multiplier: 1.0,
    badge: null,
    badgeColor: "",
    tip: "Normal season — good availability and standard prices.",
  };
}

export function getDynamicPrice(
  basePrice: number,
  date: Date = new Date(),
  roomMultiplier: number = 1.0,
): {
  price: number;
  originalPrice: number;
  seasonInfo: SeasonInfo;
  isSurge: boolean;
  isDiscount: boolean;
} {
  const seasonInfo = getSeasonInfo(date);
  const combined = seasonInfo.multiplier * roomMultiplier;
  const price = Math.round(basePrice * combined);

  return {
    price,
    originalPrice: basePrice,
    seasonInfo,
    isSurge: combined > 1.0,
    isDiscount: combined < 1.0,
  };
}
