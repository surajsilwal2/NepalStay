"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  BS_MONTHS, getBSDaysInMonth, bsToAD, adToBS, getBSYearRange,
} from "@/lib/nepali-date";
import { format } from "date-fns";

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
}

export default function NepaliDatePicker({ label, value, onChange, minDate, maxDate, required }: Props) {
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const todayBS = adToBS(today);
  const { min: MIN_YEAR, max: MAX_YEAR } = getBSYearRange();

  const initBS = value ? adToBS(value) : todayBS;
  const [year, setYear]   = useState(initBS.year);
  const [month, setMonth] = useState(initBS.month);
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const daysInMonth = getBSDaysInMonth(year, month);
  const minBS = minDate ? adToBS(minDate) : null;
  const maxBS = maxDate ? adToBS(maxDate) : null;

  const isDisabled = (d: number) => {
    if (minBS) {
      if (year < minBS.year) return true;
      if (year === minBS.year && month < minBS.month) return true;
      if (year === minBS.year && month === minBS.month && d < minBS.day) return true;
    }
    if (maxBS) {
      if (year > maxBS.year) return true;
      if (year === maxBS.year && month > maxBS.month) return true;
      if (year === maxBS.year && month === maxBS.month && d > maxBS.day) return true;
    }
    return false;
  };

  const isSelected = (d: number) => {
    if (!value) return false;
    const sel = adToBS(value);
    return sel.year === year && sel.month === month && sel.day === d;
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const selectDay = (d: number) => {
    if (isDisabled(d)) return;
    onChange(bsToAD(year, month, d));
    setOpen(false);
  };

  const displayValue = value
    ? `${adToBS(value).day} ${BS_MONTHS[adToBS(value).month - 1]} ${adToBS(value).year} BS (${format(value, "dd MMM yyyy")})`
    : "";

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        <Calendar className="w-3 h-3 inline mr-1" />{label}{required && " *"}
      </label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
        {displayValue || <span className="text-slate-400">Select date (BS)…</span>}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} disabled={year <= MIN_YEAR && month <= 1}
              className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer">
                {BS_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer">
                {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={nextMonth} disabled={year >= MAX_YEAR && month >= 12}
              className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-1">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const disabled = isDisabled(d);
              const selected = isSelected(d);
              return (
                <button key={d} type="button" onClick={() => selectDay(d)} disabled={disabled}
                  className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                    selected
                      ? "bg-amber-500 text-white font-bold"
                      : disabled
                      ? "text-slate-300 cursor-not-allowed"
                      : "hover:bg-amber-50 text-slate-700 hover:text-amber-700"
                  }`}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
