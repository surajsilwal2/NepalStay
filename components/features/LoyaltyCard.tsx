"use client";
import { useEffect, useState } from "react";
import { Award, TrendingUp, Gift, Zap } from "lucide-react";

interface LoyaltyData {
  points: number;
  tier: string;
  tierInfo: { label: string; color: string; perks: string };
  nextTier: { label: string; pointsNeeded: number } | null;
  progressPct: number;
  discountValue: number;
  multiplier: number;
}

const TIER_GRADIENTS: Record<string, string> = {
  BRONZE: "from-amber-700 to-orange-500",
  SILVER: "from-slate-400 to-slate-600",
  GOLD: "from-yellow-400 to-amber-500",
  PLATINUM: "from-slate-300 to-blue-400",
};

const TIER_BG: Record<string, string> = {
  BRONZE: "bg-orange-50 border-orange-200",
  SILVER: "bg-slate-50 border-slate-200",
  GOLD: "bg-yellow-50 border-yellow-200",
  PLATINUM: "bg-blue-50 border-blue-200",
};

export default function LoyaltyCard() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loyalty")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border p-5 animate-pulse bg-white">
        <div className="h-6 bg-slate-200 rounded w-32 mb-3" />
        <div className="h-10 bg-slate-100 rounded mb-2" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
      </div>
    );
  }

  if (!data) return null;

  const gradient = TIER_GRADIENTS[data.tier] || TIER_GRADIENTS.BRONZE;
  const bgCls = TIER_BG[data.tier] || TIER_BG.BRONZE;

  return (
    <div className={`rounded-2xl border ${bgCls} overflow-hidden`}>
      {/* Header gradient strip */}
      <div className={`bg-gradient-to-r ${gradient} p-5 text-white`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wide">
              NepalStay {data.tierInfo.label}
            </span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {data.multiplier}x Points
          </span>
        </div>
        <p className="text-3xl font-bold">{data.points.toLocaleString()}</p>
        <p className="text-xs text-white/80 mt-0.5">Loyalty Points</p>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Progress to next tier */}
        {data.nextTier && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>{data.tierInfo.label}</span>
              <span className="font-medium">
                {data.nextTier.pointsNeeded} pts to {data.nextTier.label}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                style={{ width: `${data.progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
            <Gift className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">
              NPR {data.discountValue.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">Redeemable Value</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
            <Zap className="w-4 h-4 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">
              {data.multiplier}x
            </p>
            <p className="text-xs text-slate-400">Points Multiplier</p>
          </div>
        </div>

        {/* Perks */}
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Your {data.tierInfo.label} Perks
          </p>
          <p className="text-sm text-slate-600">{data.tierInfo.perks}</p>
        </div>

        {/* How to earn */}
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Earn {data.multiplier} pt per NPR 100 spent · 100 pts = NPR 50 off
        </div>
      </div>
    </div>
  );
}
