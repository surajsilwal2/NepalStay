"use client";
import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, RefreshCw, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type Booking = {
  id: string; status: string; checkIn: string; checkOut: string;
  nights: number; totalPrice: number; paymentStatus: string;
  invoiceNumber: string | null; paidAt: string | null; createdAt: string;
  user:  { name: string; email: string; phone: string | null };
  hotel: { name: string };
  room:  { name: string; type: string };
};

const STATUS_CLS: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-800",
  CONFIRMED:   "bg-blue-100 text-blue-800",
  CHECKED_IN:  "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
  CANCELLED:   "bg-red-100 text-red-800",
  NO_SHOW:     "bg-orange-100 text-orange-800",
};

function RowSkeleton() {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      {[1,2,3,4,5,6,7].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20"/></td>
      ))}
    </tr>
  );
}

export default function VendorBookingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [bookings, setBookings]  = useState<Booking[]>([]);
  const [loading, setLoading]    = useState(true);
  const [filter, setFilter]      = useState("ALL");
  const [working, setWorking]    = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const url  = filter !== "ALL" ? `/api/bookings?status=${filter}&limit=100` : "/api/bookings?limit=100";
    const res  = await fetch(url);
    const data = await res.json();
    if (data.success) setBookings(data.data);
    else toastError("Failed to load bookings");
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    setWorking(id);
    const res  = await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setWorking(null);
    if (data.success) {
      toastSuccess(`Booking ${status.replace("_"," ").toLowerCase()}`);
      fetchBookings();
    } else toastError(data.error);
  };

  const counts = {
    ALL:         bookings.length,
    PENDING:     bookings.filter(b => b.status === "PENDING").length,
    CONFIRMED:   bookings.filter(b => b.status === "CONFIRMED").length,
    CHECKED_IN:  bookings.filter(b => b.status === "CHECKED_IN").length,
    CHECKED_OUT: bookings.filter(b => b.status === "CHECKED_OUT").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
            <p className="text-slate-500 mt-1 text-sm">{bookings.length} total bookings for your hotel</p>
          </div>
          <button onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL","PENDING","CONFIRMED","CHECKED_IN","CHECKED_OUT"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === s ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}>
              {s === "ALL" ? "All" : s.replace("_"," ")} ({counts[s as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Guest","Room","Check-in","Check-out","Total","Status","Payment","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading
                  ? [1,2,3,4,5].map(i => <RowSkeleton key={i} />)
                  : bookings.length === 0
                  ? (
                    <tr><td colSpan={8} className="text-center py-14 text-slate-400">
                      <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No bookings found.
                    </td></tr>
                  )
                  : bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{b.user?.name}</p>
                        <p className="text-xs text-slate-400">{b.user?.email}</p>
                        {b.user?.phone && <p className="text-xs text-slate-400">{b.user.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {b.room?.name}<br/>
                        <span className="text-slate-400">{b.room?.type}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BsDateDisplay date={b.checkIn} className="text-xs" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BsDateDisplay date={b.checkOut} className="text-xs" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        NPR {b.totalPrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[b.status]}`}>
                          {b.status.replace("_"," ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.paidAt ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3 h-3" />Paid
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Unpaid</span>
                        )}
                        {b.invoiceNumber && (
                          <p className="text-xs font-mono text-green-700 mt-0.5">{b.invoiceNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {b.status === "PENDING" && (
                            <button onClick={() => updateStatus(b.id, "CONFIRMED")} disabled={working === b.id}
                              className="text-xs px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 whitespace-nowrap">
                              {working === b.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null} Confirm
                            </button>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button onClick={() => updateStatus(b.id, "CHECKED_IN")} disabled={working === b.id}
                              className="text-xs px-2.5 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 whitespace-nowrap">
                              Check In
                            </button>
                          )}
                          {b.status === "CHECKED_IN" && (
                            <button onClick={() => updateStatus(b.id, "CHECKED_OUT")} disabled={working === b.id}
                              className="text-xs px-2.5 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium disabled:opacity-50 whitespace-nowrap">
                              Check Out
                            </button>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button onClick={() => updateStatus(b.id, "NO_SHOW")} disabled={working === b.id}
                              className="text-xs px-2.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 font-medium disabled:opacity-50 whitespace-nowrap">
                              No Show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
