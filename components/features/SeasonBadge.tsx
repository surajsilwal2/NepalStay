"use client";
import { getSeasonInfo, getDynamicPrice } from "@/lib/dynamic-pricing";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { useState } from "react";

interface Props {
  basePrice: number;
  checkInDate?: Date;
  showPriceDiff?: boolean;
  compact?: boolean;
}

export default function SeasonBadge({
  basePrice,
  checkInDate,
  showPriceDiff = true,
  compact = false,
}: Props) {
  const [showTip, setShowTip] = useState(false);
  const date = checkInDate || new Date();
  const info = getSeasonInfo(date);
  const priceInfo = getDynamicPrice(basePrice, date);

  if (!info.badge) {
    // Normal season — show subtle "good availability" badge
    return compact ? null : (
      <span className="text-xs text-green-600 flex items-center gap-1">
        ✓ Good availability
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Season badge */}
      <div className="relative">
        <span
          onClick={() => setShowTip(!showTip)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer flex items-center gap-1 ${info.badgeColor}`}
        >
          {info.badge}
          <Info className="w-3 h-3 opacity-60" />
        </span>

        {/* Tooltip */}
        {showTip && (
          <div className="absolute bottom-full left-0 mb-2 bg-slate-800 text-white text-xs rounded-xl p-3 w-52 z-20 shadow-lg">
            <p className="font-semibold mb-1">{info.label}</p>
            <p className="text-slate-300">{info.tip}</p>
            <div className="absolute bottom-0 left-4 translate-y-full border-4 border-transparent border-t-slate-800" />
          </div>
        )}
      </div>

      {/* Price difference badge */}
      {showPriceDiff && priceInfo.isSurge && (
        <span className="text-xs flex items-center gap-1 text-orange-600 font-medium">
          <TrendingUp className="w-3 h-3" />+
          {Math.round((info.multiplier - 1) * 100)}% peak price
        </span>
      )}

      {showPriceDiff && priceInfo.isDiscount && (
        <span className="text-xs flex items-center gap-1 text-green-600 font-medium">
          <TrendingDown className="w-3 h-3" />
          {Math.round((1 - info.multiplier) * 100)}% off-season discount
        </span>
      )}
    </div>
  );
}
