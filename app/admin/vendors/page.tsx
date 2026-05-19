"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Store, RefreshCw, Building2, BedDouble, CalendarCheck,
  TrendingUp, Mail, Phone, Loader2, CheckCircle, Pause,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type VendorHotel = {
  id: string;
  name: string;
  status: string;
  city: string;
  starRating: number;
  propertyType: string;
  rooms: number;
  bookings: number;
  revenue: number;
};

type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  hotel: VendorHotel | null;
};

const HOTEL_STATUS_CFG: Record<string, { cls: string; label: string }> = {
  PENDING:   { cls: "bg-yellow-100 text-yellow-800", label: "Pending" },
  APPROVED:  { cls: "bg-green-100 text-green-800",   label: "Approved" },
  REJECTED:  { cls: "bg-red-100 text-red-800",       label: "Rejected" },
  SUSPENDED: { cls: "bg-orange-100 text-orange-800", label: "Suspended" },
};

function VendorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-40" />
              <div className="h-3 bg-slate-100 rounded w-56" />
            </div>
          </div>
          <div className="h-16 bg-slate-50 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function AdminVendorsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [vendors, setVendors]   = useState<Vendor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [working, setWorking]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "NO_HOTEL">("ALL");

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/vendors");
      const data = await res.json();
      if (data.success) setVendors(data.data);
      else toastError("Failed to load vendors");
    } catch {
      toastError("Network error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const toggleVendorStatus = async (v: Vendor) => {
    setWorking(v.id);
    const res  = await fetch(`/api/admin/users/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    const data = await res.json();
    setWorking(null);
    if (data.success) {
      toastSuccess(v.isActive ? `${v.name} account suspended` : `${v.name} account reactivated`);
      fetchVendors();
    } else {
      toastError(data.error || "Update failed");
    }
  };

  const filtered = vendors.filter(v => {
    if (filter === "ACTIVE")    return v.isActive;
    if (filter === "SUSPENDED") return !v.isActive;
    if (filter === "NO_HOTEL")  return !v.hotel;
    return true;
  });

  const counts = {
    ALL:       vendors.length,
    ACTIVE:    vendors.filter(v => v.isActive).length,
    SUSPENDED: vendors.filter(v => !v.isActive).length,
    NO_HOTEL:  vendors.filter(v => !v.hotel).length,
  };

  const totalRevenue = vendors.reduce((sum, v) => sum + (v.hotel?.revenue ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Vendor Management</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {vendors.length} registered hotel owners · NPR {totalRevenue.toLocaleString()} total platform revenue
            </p>
          </div>
          <button
            onClick={fetchVendors}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL", "ACTIVE", "SUSPENDED", "NO_HOTEL"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {f === "NO_HOTEL" ? "No Hotel" : f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}{" "}
              ({counts[f]})
            </button>
          ))}
        </div>

        {/* Alert for suspended vendors */}
        {counts.SUSPENDED > 0 && filter === "ALL" && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-800">
              {counts.SUSPENDED} vendor account{counts.SUSPENDED > 1 ? "s are" : " is"} currently suspended.
            </p>
          </div>
        )}

        {/* Vendor list */}
        {loading ? (
          <VendorSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No vendors in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(vendor => (
              <div
                key={vendor.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
                  vendor.isActive ? "border-slate-100" : "border-orange-200 opacity-75"
                }`}
              >
                <div className="p-5">
                  {/* Vendor identity row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-700 font-bold text-lg">
                      {vendor.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800">{vendor.name}</h3>
                        {!vendor.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                            Account Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />{vendor.email}
                        </span>
                        {vendor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{vendor.phone}
                          </span>
                        )}
                        <span>
                          Joined <BsDateDisplay date={vendor.createdAt} className="inline" />
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleVendorStatus(vendor)}
                        disabled={working === vendor.id}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-medium transition-colors disabled:opacity-50 ${
                          vendor.isActive
                            ? "border-orange-200 text-orange-700 hover:bg-orange-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {working === vendor.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : vendor.isActive ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {vendor.isActive ? "Suspend" : "Reactivate"}
                      </button>
                    </div>
                  </div>

                  {/* Hotel info */}
                  {vendor.hotel ? (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm">{vendor.hotel.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HOTEL_STATUS_CFG[vendor.hotel.status]?.cls}`}>
                              {HOTEL_STATUS_CFG[vendor.hotel.status]?.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {vendor.hotel.city} · {vendor.hotel.propertyType} ·{" "}
                            {"★".repeat(vendor.hotel.starRating)}
                          </p>
                        </div>
                        <Link
                          href={`/admin/hotels?status=${vendor.hotel.status}`}
                          className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-slate-400 rounded-lg font-medium whitespace-nowrap flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3" />View Hotel
                        </Link>
                      </div>
                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                            <BedDouble className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-xl font-bold text-slate-800">{vendor.hotel.rooms}</p>
                          <p className="text-xs text-slate-400">Rooms</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                          <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-xl font-bold text-slate-800">{vendor.hotel.bookings}</p>
                          <p className="text-xs text-slate-400">Bookings</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-base font-bold text-slate-800">
                            {vendor.hotel.revenue > 0
                              ? `NPR ${vendor.hotel.revenue.toLocaleString()}`
                              : "—"}
                          </p>
                          <p className="text-xs text-slate-400">Revenue</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      <p className="text-sm text-slate-400 italic">No hotel registered yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
