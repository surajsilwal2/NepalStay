"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, TrendingUp, TrendingDown, BedDouble, CalendarCheck,
  Star, Users, AlertCircle, CheckCircle, Clock, Building2, Plus, ArrowRight,
  Globe, RefreshCw, Wrench, Sparkles, AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/providers/ToastContext";
import OverbookingAlert from "@/components/features/OverbookingAlert";

type Stats = {
  hotelStatus:         string;
  staffEnabled:        boolean;
  hotelSize:           string;
  fnmisPending:        number;
  totalBookings:       number;
  pendingBookings:     number;
  activeGuests:        number;
  revenueThisMonth:    number;
  revenueLastMonth:    number;
  revenueGrowth:       number;
  totalReviews:        number;
  rooms: {
    total: number;
    AVAILABLE?: number;
    OCCUPIED?: number;
    CLEANING?: number;
    MAINTENANCE?: number;
  };
};

type Room = {
  id: string; name: string; type: string; floor: number;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  pricePerNight: number;
};

const ROOM_STATUS_CFG = {
  AVAILABLE:   { color: "bg-green-100 text-green-800 border-green-200",  dot: "bg-green-500" },
  OCCUPIED:    { color: "bg-blue-100 text-blue-800 border-blue-200",     dot: "bg-blue-500" },
  CLEANING:    { color: "bg-yellow-100 text-yellow-800 border-yellow-200",dot: "bg-yellow-400" },
  MAINTENANCE: { color: "bg-red-100 text-red-800 border-red-200",        dot: "bg-red-500" },
};

function StatCard({ label, value, sub, trend, icon: Icon, color = "amber" }: {
  label: string; value: string | number; sub?: string; trend?: number; icon: any; color?: string;
}) {
  const colorMap: Record<string, string> = {
    amber:  "bg-amber-50 text-amber-600",
    green:  "bg-green-50 text-green-600",
    blue:   "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function VendorDashboard() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [rooms, setRooms]           = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [optimistic, setOptimistic] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/vendor/stats").then(r => r.json()).then(s => {
      if (s.success) setStats(s.data);
      else toastError("Failed to load dashboard");
    }).finally(() => setLoading(false));
  }, []);

  // For small hotels: load rooms for inline status management
  useEffect(() => {
    if (stats && !stats.staffEnabled) {
      setRoomsLoading(true);
      fetch("/api/vendor/rooms").then(r => r.json()).then(d => {
        if (d.success) setRooms(d.data);
      }).finally(() => setRoomsLoading(false));
    }
  }, [stats?.staffEnabled]);

  const updateRoomStatus = async (roomId: string, newStatus: Room["status"]) => {
    setOptimistic(p => ({ ...p, [roomId]: newStatus }));
    try {
      const res  = await fetch(`/api/staff/rooms/${roomId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
      toastSuccess(`Room marked as ${newStatus.toLowerCase()}`);
    } catch (e: any) {
      toastError(e.message || "Failed to update status");
      setRooms(prev => [...prev]);
    } finally {
      setOptimistic(p => { const n = { ...p }; delete n[roomId]; return n; });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i=><div key={i} className="bg-white rounded-2xl h-32 border border-slate-100"/>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2].map(i=><div key={i} className="bg-white rounded-2xl h-48 border border-slate-100"/>)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No hotel listing yet</h2>
          <p className="text-slate-500 mb-6">Create your hotel listing to start accepting bookings.</p>
          <Link href="/vendor/hotel"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" />Create Hotel Listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Vendor Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {stats.hotelSize === "SMALL" ? "Self-managed" : "Staff-managed"} ·{" "}
              {stats.staffEnabled ? "Staff enabled" : "Direct management"}
            </p>
          </div>
          {stats.hotelStatus === "PENDING" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <Clock className="w-4 h-4" />Awaiting admin approval
            </div>
          )}
          {stats.hotelStatus === "APPROVED" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />Hotel is live
            </div>
          )}
          {stats.hotelStatus === "REJECTED" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />Listing rejected — check your email
            </div>
          )}
        </div>

        {/* FNMIS Alert */}
        {stats.fnmisPending > 0 && (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  {stats.fnmisPending} foreign guest{stats.fnmisPending > 1 ? "s" : ""} pending FNMIS report
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Report within 24 hours of check-in to comply with tourist regulations.
                </p>
              </div>
            </div>
            <Link href="/vendor/fnmis"
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0">
              <Globe className="w-3.5 h-3.5" />Report Now
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Revenue This Month"
            value={`NPR ${stats.revenueThisMonth.toLocaleString()}`}
            sub={`Last month: NPR ${stats.revenueLastMonth.toLocaleString()}`}
            trend={stats.revenueGrowth}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Total Bookings"
            value={stats.totalBookings}
            sub={`${stats.pendingBookings} pending`}
            icon={CalendarCheck}
            color="blue"
          />
          <StatCard
            label="Guests In-House"
            value={stats.activeGuests}
            sub="Currently checked in"
            icon={Users}
            color="purple"
          />
          <StatCard
            label="Total Reviews"
            value={stats.totalReviews}
            icon={Star}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Room status overview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Room Status</h2>
              <Link href="/vendor/rooms"
                className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Available",    val: stats.rooms.AVAILABLE ?? 0,    cls: "bg-green-50 text-green-700 border-green-200" },
                { label: "Occupied",     val: stats.rooms.OCCUPIED ?? 0,     cls: "bg-blue-50 text-blue-700 border-blue-200" },
                { label: "Cleaning",     val: stats.rooms.CLEANING ?? 0,     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                { label: "Maintenance",  val: stats.rooms.MAINTENANCE ?? 0,  cls: "bg-red-50 text-red-700 border-red-200" },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`rounded-xl border p-3 ${cls}`}>
                  <p className="text-2xl font-bold">{val}</p>
                  <p className="text-xs font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {([
                { href: "/vendor/hotel",    icon: Building2,     label: "Edit Hotel Listing",    sub: "Update description, amenities, photos" },
                { href: "/vendor/rooms",    icon: BedDouble,     label: "Manage Rooms",          sub: "Add, edit, update room status" },
                { href: "/vendor/bookings", icon: CalendarCheck, label: "View Bookings",          sub: "Confirm, check-in, check-out, refunds" },
                { href: "/vendor/fnmis",    icon: Globe,         label: "FNMIS Reporting",       sub: "Report foreign guests to Tourist Police",
                  badge: stats.fnmisPending > 0 ? stats.fnmisPending : undefined },
                { href: "/vendor/reviews",  icon: Star,          label: "Guest Reviews",         sub: "See what guests are saying" },
              ] as const).map(({ href, icon: Icon, label, sub, badge }: any) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{label}</p>
                      {badge && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded-full font-bold">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Small hotel room status management (inline) */}
        {!stats.staffEnabled && stats.hotelStatus === "APPROVED" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800">Room Status Board</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  You manage room status directly — update as guests check in/out
                </p>
              </div>
              <Link href="/vendor/rooms" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                Full View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {roomsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rooms added yet.</p>
                <Link href="/vendor/rooms" className="text-xs text-amber-600 hover:underline mt-1 inline-block">
                  Add rooms →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {rooms.map(room => {
                  const cur = (optimistic[room.id] as Room["status"]) ?? room.status;
                  const cfg = ROOM_STATUS_CFG[cur];
                  const isUpdating = !!optimistic[room.id];
                  return (
                    <div key={room.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-700 truncate">{room.name}</p>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isUpdating ? "animate-pulse bg-amber-400" : cfg.dot}`} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">Floor {room.floor}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border block text-center mb-2 ${cfg.color}`}>
                        {isUpdating ? "…" : cur}
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {(["AVAILABLE","CLEANING","MAINTENANCE","OCCUPIED"] as const)
                          .filter(s => s !== cur)
                          .slice(0, 2)
                          .map(s => (
                            <button key={s} onClick={() => updateRoomStatus(room.id, s)}
                              disabled={isUpdating}
                              className="text-xs py-1 px-1 rounded border border-slate-200 text-slate-500 hover:bg-white transition-colors disabled:opacity-40 truncate">
                              {s === "AVAILABLE" ? "Free" : s === "CLEANING" ? "Clean" : s === "MAINTENANCE" ? "Maint." : "Occ."}
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Staff info for large hotels */}
        {stats.staffEnabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Staff management enabled</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Your staff can log in and manage room status and check-ins from the staff panel.
              </p>
            </div>
          </div>
        )}

        {/* Overbooking risk alert */}
        <OverbookingAlert />
      </main>
    </div>
  );
}
