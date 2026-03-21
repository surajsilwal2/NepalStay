"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Building2, CheckCircle, XCircle, Pause, RefreshCw, Loader2,
  MapPin, Star, Phone, Mail,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type Hotel = {
  id: string; name: string; slug: string; city: string; address: string;
  starRating: number; propertyType: string; status: string;
  images: string[]; amenities: string[]; createdAt: string;
  rejectionReason: string | null;
  vendor: { name: string; email: string; phone: string | null };
  _count: { rooms: number; bookings: number; reviews: number };
};

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  PENDING:   { cls: "bg-yellow-100 text-yellow-800", label: "Pending" },
  APPROVED:  { cls: "bg-green-100 text-green-800",   label: "Approved" },
  REJECTED:  { cls: "bg-red-100 text-red-800",       label: "Rejected" },
  SUSPENDED: { cls: "bg-orange-100 text-orange-800", label: "Suspended" },
};

export default function AdminHotelsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [hotels, setHotels]   = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");
  const [working, setWorking] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchHotels = async () => {
    setLoading(true);
    const url  = filter !== "ALL" ? `/api/admin/hotels?status=${filter}` : "/api/admin/hotels";
    const res  = await fetch(url);
    const data = await res.json();
    if (data.success) setHotels(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchHotels(); }, [filter]);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    setWorking(id);
    const res  = await fetch(`/api/admin/hotels/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason: reason }),
    });
    const data = await res.json();
    setWorking(null);
    if (data.success) {
      toastSuccess(`Hotel ${status.toLowerCase()}`);
      fetchHotels();
    } else toastError(data.error);
  };

  const filtered = filter === "ALL" ? hotels : hotels.filter(h => h.status === filter);
  const counts   = { ALL: hotels.length, PENDING: hotels.filter(h=>h.status==="PENDING").length,
    APPROVED: hotels.filter(h=>h.status==="APPROVED").length, REJECTED: hotels.filter(h=>h.status==="REJECTED").length };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Hotel Management</h1>
            <p className="text-slate-500 mt-1 text-sm">{hotels.length} total listings</p>
          </div>
          <button onClick={fetchHotels}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL","PENDING","APPROVED","REJECTED"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === s ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}>
              {s === "ALL" ? "All" : s} ({counts[s] ?? hotels.filter(h=>h.status===s).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl h-40 border border-slate-100"/>)}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(hotel => (
              <div key={hotel.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-5 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {hotel.images?.[0] ? (
                      <Image src={hotel.images[0]} alt={hotel.name} width={96} height={96} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-slate-800">{hotel.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CFG[hotel.status]?.cls}`}>
                            {STATUS_CFG[hotel.status]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />{hotel.city} · {hotel.propertyType} ·{" "}
                          {"★".repeat(hotel.starRating)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">Submitted</p>
                        <BsDateDisplay date={hotel.createdAt} className="text-xs text-slate-600" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{hotel._count.rooms} rooms</span>
                      <span>{hotel._count.bookings} bookings</span>
                      <span>{hotel._count.reviews} reviews</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{hotel.vendor.email}</span>
                      {hotel.vendor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{hotel.vendor.phone}</span>}
                    </div>

                    {hotel.rejectionReason && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                        Rejection reason: {hotel.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
                  {hotel.status === "PENDING" && (
                    <>
                      <button onClick={() => updateStatus(hotel.id, "APPROVED")} disabled={working === hotel.id}
                        className="flex items-center gap-1.5 text-xs px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50">
                        {working === hotel.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      {rejectId === hotel.id ? (
                        <div className="flex items-center gap-2">
                          <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection…" maxLength={200}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-red-400" />
                          <button onClick={() => { updateStatus(hotel.id, "REJECTED", rejectReason); setRejectId(null); setRejectReason(""); }}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                            Confirm
                          </button>
                          <button onClick={() => { setRejectId(null); setRejectReason(""); }}
                            className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setRejectId(hotel.id)}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium">
                          <XCircle className="w-3.5 h-3.5" />Reject
                        </button>
                      )}
                    </>
                  )}
                  {hotel.status === "APPROVED" && (
                    <button onClick={() => updateStatus(hotel.id, "SUSPENDED")} disabled={working === hotel.id}
                      className="flex items-center gap-1.5 text-xs px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 font-medium">
                      <Pause className="w-3.5 h-3.5" />Suspend
                    </button>
                  )}
                  {(hotel.status === "REJECTED" || hotel.status === "SUSPENDED") && (
                    <button onClick={() => updateStatus(hotel.id, "APPROVED")} disabled={working === hotel.id}
                      className="flex items-center gap-1.5 text-xs px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />Re-approve
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No hotels in this category.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
