"use client";
import { useState } from "react";
import { Leaf, TreePine, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  nights: number;
  propertyType: string;
  city: string;
  guestCount?: number;
}

// kg CO2 per room per night by property type (from hospitality research)
const CO2_PER_NIGHT: Record<string, number> = {
  Hotel: 18.5,
  Resort: 25.0,
  Guesthouse: 8.0,
  Hostel: 4.5,
  Lodge: 10.0,
  "Boutique Hotel": 15.0,
  default: 15.0,
};

// Trees needed to offset 1 year of CO2 absorption (~21kg/year per tree)
const KG_PER_TREE_YEAR = 21;

export default function CarbonFootprint({
  nights,
  propertyType,
  city,
  guestCount = 2,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const kgPerNight = CO2_PER_NIGHT[propertyType] ?? CO2_PER_NIGHT.default;
  const totalKg = Math.round(kgPerNight * nights * 10) / 10;
  const perPersonKg = Math.round((totalKg / Math.max(1, guestCount)) * 10) / 10;
  const treesNeeded = Math.ceil(totalKg / KG_PER_TREE_YEAR);

  // Compare to common activities
  const flightKgKTMPokhara = 45; // ~45 kg CO2 for KTM-PKR flight
  const carDriveKm = Math.round(totalKg / 0.21); // avg car 0.21 kg/km
  const burgers = Math.round(totalKg / 2.5); // avg burger 2.5 kg CO2

  const footprintLevel =
    totalKg < 20
      ? {
          label: "Low",
          color: "text-green-600",
          bg: "bg-green-50  border-green-200",
          icon: "🌱",
        }
      : totalKg < 50
        ? {
            label: "Medium",
            color: "text-amber-600",
            bg: "bg-amber-50  border-amber-200",
            icon: "🌿",
          }
        : totalKg < 100
          ? {
              label: "High",
              color: "text-orange-600",
              bg: "bg-orange-50 border-orange-200",
              icon: "🌳",
            }
          : {
              label: "Very High",
              color: "text-red-600",
              bg: "bg-red-50 border-red-200",
              icon: "⚠️",
            };

  return (
    <div className={`rounded-2xl border ${footprintLevel.bg} overflow-hidden`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:brightness-95 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              Carbon Footprint
            </p>
            <p className="text-xs text-slate-500">
              <span className={`font-bold ${footprintLevel.color}`}>
                {totalKg} kg CO₂
              </span>{" "}
              for {nights} night{nights !== 1 ? "s" : ""} ·{" "}
              {footprintLevel.icon} {footprintLevel.label}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/50">
          {/* Per-person stat */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            {[
              { val: `${totalKg} kg`, label: "Total CO₂", sub: "this stay" },
              {
                val: `${perPersonKg} kg`,
                label: "Per Person",
                sub: `${guestCount} guests`,
              },
              {
                val: `${treesNeeded}`,
                label: "Trees to Offset",
                sub: "for 1 year",
              },
            ].map(({ val, label, sub }) => (
              <div key={label} className="bg-white rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${footprintLevel.color}`}>
                  {val}
                </p>
                <p className="text-xs font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* Comparisons */}
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              That&apos;s roughly equivalent to:
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>✈️</span>
                <span>
                  {(totalKg / flightKgKTMPokhara).toFixed(1)}× flights Kathmandu
                  → Pokhara
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚗</span>
                <span>Driving {carDriveKm} km by car</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🍔</span>
                <span>Producing {burgers} beef burgers</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
            <TreePine className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-green-800">
                Offset your footprint
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Plant {treesNeeded} tree{treesNeeded !== 1 ? "s" : ""} through
                Nepal reforestation programs. Organizations like{" "}
                <span className="font-semibold">ICIMOD Nepal</span> and{" "}
                <span className="font-semibold">Green Himalaya</span> accept
                donations from NPR 100/tree.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            * Estimates based on average hospitality industry CO₂ data for{" "}
            {city}, Nepal. Actual emissions vary by hotel energy source and
            practices.
          </p>
        </div>
      )}
    </div>
  );
}
