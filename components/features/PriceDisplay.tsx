"use client";
import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

interface CurrencyData {
  npr: number;
  usd: number;
  eur: number;
  inr: number;
  gbp: number;
  cny: number;
  aud: number;
  jpy: number;
  source: string;
}

interface Props {
  amountNPR: number;
  className?: string;
  showToggle?: boolean;
}

const CURRENCIES = [
  { key: "npr", symbol: "NPR", flag: "🇳🇵", label: "Nepali Rupee" },
  { key: "usd", symbol: "USD", flag: "🇺🇸", label: "US Dollar" },
  { key: "eur", symbol: "EUR", flag: "🇪🇺", label: "Euro" },
  { key: "inr", symbol: "INR", flag: "🇮🇳", label: "Indian Rupee" },
  { key: "gbp", symbol: "GBP", flag: "🇬🇧", label: "British Pound" },
  { key: "cny", symbol: "CNY", flag: "🇨🇳", label: "Chinese Yuan" },
  { key: "aud", symbol: "AUD", flag: "🇦🇺", label: "Australian Dollar" },
  { key: "jpy", symbol: "JPY", flag: "🇯🇵", label: "Japanese Yen" },
] as const;

// Simple cache to avoid repeated API calls
const rateCache: Map<number, { data: CurrencyData; ts: number }> = new Map();

export default function PriceDisplay({
  amountNPR,
  className = "",
  showToggle = true,
}: Props) {
  const [rates, setRates] = useState<CurrencyData | null>(null);
  const [selected, setSelected] = useState<string>("npr");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Round to nearest 100 for cache efficiency
    const rounded = Math.round(amountNPR / 100) * 100;
    const cached = rateCache.get(rounded);

    if (cached && Date.now() - cached.ts < 3600000) {
      setRates(cached.data);
      return;
    }

    setLoading(true);
    fetch(`/api/currency?amount=${amountNPR}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRates(d.data);
          rateCache.set(rounded, { data: d.data, ts: Date.now() });
        }
      })
      .finally(() => setLoading(false));
  }, [amountNPR]);

  const currentCurrency =
    CURRENCIES.find((c) => c.key === selected) || CURRENCIES[0];
  const displayAmount = rates ? (rates as any)[selected] : amountNPR;

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "jpy") return Math.round(amount).toLocaleString();
    if (["npr", "inr"].includes(currency))
      return Math.round(amount).toLocaleString();
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Primary price */}
        <span className="font-bold text-slate-800">
          {currentCurrency.flag} {currentCurrency.symbol}{" "}
          {loading ? "..." : formatAmount(displayAmount, selected)}
        </span>
        <span className="text-slate-400 text-xs">/night</span>

        {/* Currency toggle button */}
        {showToggle && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors"
            title="Change currency"
          >
            <Globe className="w-3 h-3" />
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showPicker ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Secondary: always show NPR if different currency selected */}
      {selected !== "npr" && rates && (
        <p className="text-xs text-slate-400 mt-0.5">
          ≈ NPR {Math.round(rates.npr).toLocaleString()}
        </p>
      )}

      {/* Currency picker dropdown */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 w-56">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide px-2 py-1 mb-1">
            Select Currency
          </p>
          {CURRENCIES.map(({ key, symbol, flag, label }) => (
            <button
              key={key}
              onClick={() => {
                setSelected(key);
                setShowPicker(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm transition-colors ${
                selected === key
                  ? "bg-amber-50 text-amber-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{flag}</span>
              <span className="font-medium">{symbol}</span>
              <span className="text-xs text-slate-400 ml-auto">
                {rates ? formatAmount((rates as any)[key], key) : "..."}
              </span>
            </button>
          ))}
          {rates && (
            <p className="text-xs text-slate-300 text-center pt-2 border-t border-slate-50 mt-1">
              {rates.source === "live"
                ? "🟢 Live rates"
                : "🟡 Approximate rates"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
