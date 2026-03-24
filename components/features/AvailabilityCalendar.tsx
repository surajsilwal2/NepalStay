"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  roomId: string;
  roomName?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function AvailabilityCalendar({ roomId, roomName }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/availability?roomId=${roomId}&months=4`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBooked(new Set(d.data.bookedDates));
      })
      .finally(() => setLoading(false));
  }, [roomId]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // Disable going back before current month
  const canGoPrev = !(
    year === today.getFullYear() && month === today.getMonth()
  );

  // Days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();

  const getDayStatus = (day: number) => {
    const date = new Date(year, month, day);
    const key = date.toISOString().split("T")[0];
    if (date < today) return "past";
    if (booked.has(key)) return "booked";
    return "available";
  };

  const dayCls = {
    past: "text-slate-300 cursor-not-allowed",
    booked: "bg-red-100 text-red-700 font-semibold cursor-not-allowed relative",
    available:
      "bg-green-50 text-green-700 hover:bg-green-100 font-medium cursor-pointer",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <p className="text-sm text-slate-500">Loading availability…</p>
        </div>
        <div className="grid grid-cols-7 gap-1 animate-pulse">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm">
          Availability {roomName ? `— ${roomName}` : ""}
        </h3>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 inline-block" />
              Booked
            </span>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <p className="font-semibold text-slate-800 text-sm">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells for first day offset */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMon }, (_, i) => i + 1).map((day) => {
          const status = getDayStatus(day);
          return (
            <div
              key={day}
              className={`text-center text-xs py-2 rounded-lg transition-colors ${dayCls[status]}`}
            >
              {day}
              {status === "booked" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Occupancy summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          {booked.size} day{booked.size !== 1 ? "s" : ""} booked in next 3
          months
        </span>
        <span
          className={
            booked.size > 20 ? "text-red-600 font-semibold" : "text-green-600"
          }
        >
          {booked.size > 20 ? "High demand" : "Good availability"}
        </span>
      </div>
    </div>
  );
}
