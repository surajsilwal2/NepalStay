"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  X, Calendar, Users, BedDouble, Loader2, CheckCircle,
  AlertCircle, Globe, CreditCard,
} from "lucide-react";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import { adToBS, formatBS } from "@/lib/nepali-date";
import { useCalendar } from "@/components/providers/CalendarContext";
import { useToast } from "@/components/providers/ToastContext";
import NepaliDatePicker from "@/components/NepaliDatePicker";
import KhaltiButton from "@/components/KhaltiButton";

type Room = {
  id: string; name: string; type: string; pricePerNight: number;
  floor: number; capacity: number; amenities: string[];
};

interface Props {
  room: Room;
  hotel: { id: string; name: string; slug: string };
  onClose: () => void;
  onSuccess: () => void;
}

const NATIONALITIES = [
  "Nepali", "Indian", "Chinese", "American", "British", "German",
  "French", "Japanese", "Australian", "Canadian", "Korean", "Other",
];
const PURPOSE_OPTIONS = ["Tourism", "Business", "Trekking", "Medical", "Education", "Transit"];

export default function BookingModal({ room, hotel, onClose, onSuccess }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isBS } = useCalendar();
  const { error: toastError } = useToast();

  const [checkInDate,  setCheckInDate]  = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [adults, setAdults]     = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes]       = useState("");
  const [nationality, setNationality]       = useState("Nepali");
  const [passportNumber, setPassportNumber] = useState("");
  const [purposeOfVisit, setPurposeOfVisit] = useState("Tourism");

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [bookingId, setBookingId] = useState("");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nights = checkInDate && checkOutDate
    ? differenceInCalendarDays(checkOutDate, checkInDate) : 0;
  const totalPrice  = nights > 0 ? nights * room.pricePerNight : 0;
  const isForeigner = nationality !== "Nepali";

  const toInputVal = (d: Date | null) => d ? format(d, "yyyy-MM-dd") : "";

  const handleSubmit = async () => {
    setError("");
    if (!session) { router.push("/login"); return; }
    if (!checkInDate || !checkOutDate) { setError("Please select check-in and check-out dates."); return; }
    if (nights <= 0) { setError("Check-out must be after check-in."); return; }
    if (adults + children > room.capacity) {
      setError(`Max capacity is ${room.capacity} guests.`); return;
    }
    if (isForeigner && !passportNumber.trim()) {
      setError("Passport number is required for foreign guests (FNMIS)."); return;
    }

    setLoading(true);
    const res  = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: hotel.id, roomId: room.id,
        checkIn:  checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        adults, children, notes,
        guestNationality: nationality,
        passportNumber:   passportNumber || null,
        purposeOfVisit,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error); toastError(data.error); return; }
    setBookingId(data.data.id);
    setSuccess(true);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{room.name}</p>
              <p className="text-xs text-slate-500">{hotel.name} · {room.type} · Floor {room.floor}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Booking Submitted!</h3>
                <p className="text-slate-500 text-sm mt-1">Your reservation is pending confirmation.</p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600 mb-3 font-medium">Pay now to confirm instantly:</p>
                <KhaltiButton bookingId={bookingId} amount={totalPrice} onSuccess={onSuccess} />
                <button onClick={onSuccess}
                  className="mt-2 w-full text-sm text-slate-500 hover:text-slate-700 py-2">
                  Pay later at hotel →
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}

              {/* Calendar mode indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Entering dates in{" "}
                <span className={`font-semibold px-1.5 py-0.5 rounded ${isBS ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {isBS ? "Bikram Sambat (BS)" : "Gregorian (AD)"}
                </span>
                — toggle in navbar
              </div>

              {/* Dates */}
              {isBS ? (
                <div className="space-y-4">
                  <NepaliDatePicker label="Check-in (BS)" required value={checkInDate}
                    minDate={today}
                    onChange={(d) => { setCheckInDate(d); if (checkOutDate && d >= checkOutDate) setCheckOutDate(null); }} />
                  <NepaliDatePicker label="Check-out (BS)" required value={checkOutDate}
                    minDate={checkInDate ? addDays(checkInDate, 1) : addDays(today, 1)}
                    onChange={setCheckOutDate} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Check-in
                    </label>
                    <input type="date" min={format(today, "yyyy-MM-dd")}
                      value={toInputVal(checkInDate)}
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value) : null;
                        setCheckInDate(d);
                        if (checkOutDate && d && d >= checkOutDate) setCheckOutDate(null);
                      }}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Check-out
                    </label>
                    <input type="date"
                      min={checkInDate ? format(addDays(checkInDate, 1), "yyyy-MM-dd") : format(addDays(today, 1), "yyyy-MM-dd")}
                      value={toInputVal(checkOutDate)}
                      onChange={(e) => setCheckOutDate(e.target.value ? new Date(e.target.value) : null)}
                      className={inputCls} />
                  </div>
                </div>
              )}

              {/* Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Users className="w-3 h-3 inline mr-1" />Adults
                  </label>
                  <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className={inputCls}>
                    {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Children
                  </label>
                  <select value={children} onChange={(e) => setChildren(Number(e.target.value))} className={inputCls}>
                    {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Globe className="w-3 h-3 inline mr-1" />Nationality
                </label>
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputCls}>
                  {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* FNMIS */}
              {isForeigner && (
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                    <Globe className="w-3.5 h-3.5" />Foreign Guest — FNMIS Required
                  </div>
                  <p className="text-xs text-blue-600">
                    Nepal law requires hotels to report foreign guest details to Tourist Police within 24 hours.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">Passport / Citizenship Number *</label>
                    <input type="text" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="e.g. A1234567"
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">Purpose of Visit</label>
                    <select value={purposeOfVisit} onChange={(e) => setPurposeOfVisit(e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {PURPOSE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Special requests */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Special Requests (optional)
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Early check-in, extra pillow, ground floor…"
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Price summary */}
              {nights > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>NPR {room.pricePerNight.toLocaleString()} × {nights} night{nights > 1 ? "s" : ""}</span>
                    <span>NPR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-800">
                    <span>Total</span>
                    <span>NPR {totalPrice.toLocaleString()}</span>
                  </div>
                  {isBS && checkInDate && checkOutDate && (
                    <p className="text-xs text-amber-700 pt-0.5">
                      {formatBS(adToBS(checkInDate))} → {formatBS(adToBS(checkOutDate))} BS
                    </p>
                  )}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {session ? "Reserve Room" : "Sign in to Book"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
