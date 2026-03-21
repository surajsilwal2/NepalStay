"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft, CheckCircle, XCircle, Printer, BedDouble,
  MapPin, Calendar, Users, CreditCard, FileText, Shield,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useCalendar } from "@/components/providers/CalendarContext";
import { adToBS, formatBS } from "@/lib/nepali-date";

type Booking = {
  id: string; status: string; checkIn: string; checkOut: string;
  nights: number; totalPrice: number; adults: number; children: number;
  notes: string | null; paymentStatus: string; paymentMethod: string;
  invoiceNumber: string | null; invoiceIssuedAt: string | null;
  creditNoteRef: string | null; refundStatus: string;
  refundAmount: number | null; refundPercent: number | null;
  paidAt: string | null; createdAt: string;
  guestNationality: string | null; passportNumber: string | null;
  purposeOfVisit: string | null;
  user:  { name: string; email: string; phone: string | null };
  hotel: { name: string; city: string; address: string; images: string[]; contactPhone: string | null; contactEmail: string | null };
  room:  { name: string; type: string; floor: number; pricePerNight: number };
};

const STATUS_CFG: Record<string, { cls: string; label: string; icon: any }> = {
  PENDING:     { cls: "bg-yellow-50 text-yellow-800 border-yellow-200",  label: "Pending Confirmation", icon: Calendar },
  CONFIRMED:   { cls: "bg-blue-50 text-blue-800 border-blue-200",        label: "Confirmed",             icon: CheckCircle },
  CHECKED_IN:  { cls: "bg-green-50 text-green-800 border-green-200",     label: "Currently Checked In",  icon: CheckCircle },
  CHECKED_OUT: { cls: "bg-slate-50 text-slate-700 border-slate-200",     label: "Stay Completed",        icon: CheckCircle },
  CANCELLED:   { cls: "bg-red-50 text-red-700 border-red-200",           label: "Cancelled",             icon: XCircle },
};

export default function BookingReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { isBS } = useCalendar();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setBooking(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"/>
          <div className="bg-white rounded-2xl h-64 border border-slate-100"/>
          <div className="bg-white rounded-2xl h-48 border border-slate-100"/>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-24">
          <p className="text-slate-500">Booking not found.</p>
          <Link href="/customer/bookings" className="text-amber-600 hover:underline mt-2 inline-block">← My Bookings</Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.PENDING;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 print:px-0 print:py-0">
        {/* Back link + print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/customer/bookings" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
            <ArrowLeft className="w-4 h-4" />My Bookings
          </Link>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Printer className="w-4 h-4" />Print Receipt
          </button>
        </div>

        {/* Receipt card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 print:bg-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">Nepal<span className="text-amber-400">Stay</span></p>
                <p className="text-slate-400 text-xs">Booking Confirmation</p>
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.cls}`}>
              <cfg.icon className="w-3.5 h-3.5" />
              {cfg.label}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking ID + Invoice */}
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Booking Reference</p>
                <p className="font-mono text-sm font-bold text-slate-800">{booking.id.slice(-12).toUpperCase()}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Booked on {isBS ? formatBS(adToBS(new Date(booking.createdAt))) : format(new Date(booking.createdAt), "dd MMM yyyy")}
                </p>
              </div>
              {booking.invoiceNumber && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Invoice Number</p>
                  <p className="font-mono text-sm font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    {booking.invoiceNumber}
                  </p>
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Hotel + Room */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Property</p>
              <p className="font-bold text-slate-800 text-lg">{booking.hotel.name}</p>
              <p className="flex items-center gap-1 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />{booking.hotel.address}, {booking.hotel.city}
              </p>
              {booking.hotel.contactPhone && (
                <p className="text-xs text-slate-400 mt-0.5">{booking.hotel.contactPhone}</p>
              )}
              <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                <p className="font-semibold text-slate-700 text-sm">{booking.room.name}</p>
                <p className="text-xs text-slate-400">{booking.room.type} · Floor {booking.room.floor} · NPR {booking.room.pricePerNight.toLocaleString()}/night</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Check-in</p>
                <BsDateDisplay date={booking.checkIn} showBoth className="text-sm font-semibold text-slate-800 block" />
                <p className="text-xs text-slate-400">from 14:00</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Check-out</p>
                <BsDateDisplay date={booking.checkOut} showBoth className="text-sm font-semibold text-slate-800 block" />
                <p className="text-xs text-slate-400">by 11:00</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Duration</p>
                <p className="text-sm font-semibold text-slate-800">{booking.nights} night{booking.nights !== 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-400">
                  {booking.adults} adult{booking.adults > 1 ? "s" : ""}
                  {booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
                </p>
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex justify-between text-sm text-slate-600 mb-1.5">
                <span>NPR {booking.room.pricePerNight.toLocaleString()} × {booking.nights} night{booking.nights !== 1 ? "s" : ""}</span>
                <span>NPR {booking.totalPrice.toLocaleString()}</span>
              </div>
              <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-800">
                <span>Total Amount</span>
                <span>NPR {booking.totalPrice.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {booking.paidAt ? (
                  <span className="flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />Paid via {booking.paymentMethod}
                  </span>
                ) : (
                  <span className="text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                    Payment pending — pay at hotel
                  </span>
                )}
              </div>
            </div>

            {/* Refund info if cancelled */}
            {booking.status === "CANCELLED" && booking.creditNoteRef && (
              <div className={`p-4 rounded-xl border ${
                booking.refundStatus === "COMPLETED" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
              }`}>
                <p className="font-semibold text-sm text-slate-800 mb-1">Cancellation Details</p>
                <p className="text-xs font-mono text-slate-600">{booking.creditNoteRef}</p>
                {(booking.refundAmount ?? 0) > 0 && (
                  <p className="text-sm mt-1">
                    Refund: <strong>NPR {booking.refundAmount?.toLocaleString()}</strong> ({booking.refundPercent}%)
                    {" — "}{booking.refundStatus === "COMPLETED" ? "processed" : "being processed (3–5 business days)"}
                  </p>
                )}
              </div>
            )}

            {/* Special requests */}
            {booking.notes && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Special Requests</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{booking.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              This booking is protected by the NepalStay guarantee. For support, contact {booking.hotel.contactEmail ?? "the hotel directly"}.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3 print:hidden">
          <Link href={`/hotels/${booking.hotel.name}`}
            className="flex-1 text-center py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            View Hotel
          </Link>
          <Link href="/customer/bookings"
            className="flex-1 text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">
            All Bookings
          </Link>
        </div>
      </main>
    </div>
  );
}
