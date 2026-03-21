"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BedDouble, CheckCircle, Sparkles, Wrench, RefreshCw, CalendarCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type Room = {
  id: string; name: string; type: string;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  floor: number; pricePerNight: number; hotelId: string;
};
type Booking = {
  id: string; status: string; checkIn: string; checkOut: string; totalPrice: number;
  user: { name: string; email: string }; room: { name: string; type: string; floor: number };
};

const STATUS_CFG = {
  AVAILABLE:   { color: "bg-green-100 text-green-800 border-green-200",  dot: "bg-green-500",  icon: BedDouble },
  OCCUPIED:    { color: "bg-blue-100 text-blue-800 border-blue-200",     dot: "bg-blue-500",   icon: CheckCircle },
  CLEANING:    { color: "bg-yellow-100 text-yellow-800 border-yellow-200",dot: "bg-yellow-400",icon: Sparkles },
  MAINTENANCE: { color: "bg-red-100 text-red-800 border-red-200",        dot: "bg-red-500",    icon: Wrench },
};

const BOOKING_CLS: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-800",
  CONFIRMED:   "bg-blue-100 text-blue-800",
  CHECKED_IN:  "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
};

function RoomSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div className="flex justify-between">
        <div className="h-5 bg-slate-200 rounded w-20" />
        <div className="h-5 bg-slate-100 rounded w-24" />
      </div>
      <div className="h-4 bg-slate-100 rounded w-28" />
      <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i=><div key={i} className="h-8 bg-slate-100 rounded-lg"/>)}</div>
    </div>
  );
}

export default function StaffPanel() {
  const { success, error: toastError } = useToast();
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"rooms" | "checkins">("rooms");
  const [optimistic, setOptimistic] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [rRes, bRes] = await Promise.all([
        fetch("/api/staff/rooms").then(r => r.json()),
        fetch("/api/bookings?status=CONFIRMED&limit=50").then(r => r.json()),
      ]);
      if (rRes.success)  setRooms(rRes.data);
      if (bRes.success)  setBookings(bRes.data);
    } catch { toastError("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      success(`Room marked as ${newStatus.toLowerCase()}`);
    } catch (e: any) {
      toastError(e.message || "Failed to update");
      setRooms(prev => [...prev]); // trigger re-render to revert
    } finally {
      setOptimistic(p => { const n = {...p}; delete n[roomId]; return n; });
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    try {
      const res  = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      success(`Booking ${newStatus.replace("_"," ").toLowerCase()}`);
    } catch (e: any) {
      toastError(e.message || "Failed to update booking");
      fetchData();
    }
  };

  const statusCounts = rooms.reduce((acc, r) => {
    const s = optimistic[r.id] ?? r.status;
    acc[s] = (acc[s] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const todayCheckIns = bookings.filter(b => {
    const ci = new Date(b.checkIn);
    return ci >= today && ci < tomorrow;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Operations Panel</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage rooms and check-ins for your hotel</p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["AVAILABLE","OCCUPIED","CLEANING","MAINTENANCE"] as const).map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <div key={s} className={`rounded-xl p-4 flex items-center gap-3 border ${cfg.color}`}>
                <cfg.icon className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts[s] ?? 0}</p>
                  <p className="text-xs font-medium opacity-70 capitalize">{s.toLowerCase()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "rooms",    label: "Room Status",        icon: BedDouble,     count: rooms.length },
            { id: "checkins", label: "Today's Check-ins",  icon: CalendarCheck, count: todayCheckIns.length },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i=><RoomSkeleton key={i}/>)}
          </div>
        ) : tab === "rooms" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map(room => {
              const cur = (optimistic[room.id] as Room["status"]) ?? room.status;
              const cfg = STATUS_CFG[cur];
              const isUpdating = !!optimistic[room.id];
              return (
                <div key={room.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-800">{room.name}</p>
                      <p className="text-xs text-slate-400">{room.type} · Floor {room.floor}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isUpdating ? "animate-pulse bg-amber-400" : cfg.dot}`} />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {isUpdating ? "…" : cur}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">NPR {room.pricePerNight.toLocaleString()}/night</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["AVAILABLE","CLEANING","MAINTENANCE","OCCUPIED"] as const)
                      .filter(s => s !== cur)
                      .map(s => (
                        <button key={s} onClick={() => updateRoomStatus(room.id, s)}
                          disabled={isUpdating}
                          className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 capitalize">
                          {s.toLowerCase()}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
                No rooms assigned to your hotel.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {todayCheckIns.length === 0 ? (
              <div className="text-center py-16">
                <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No check-ins scheduled for today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Guest","Room","Check-in","Check-out","Status","Action"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todayCheckIns.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{b.user?.name}</p>
                          <p className="text-xs text-slate-400">{b.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {b.room?.name}<br/>
                          <span className="text-xs text-slate-400">{b.room?.type}</span>
                        </td>
                        <td className="px-4 py-3"><BsDateDisplay date={b.checkIn} showBoth /></td>
                        <td className="px-4 py-3"><BsDateDisplay date={b.checkOut} showBoth /></td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BOOKING_CLS[b.status]}`}>
                            {b.status.replace("_"," ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === "CONFIRMED" && (
                            <button onClick={() => updateBookingStatus(b.id, "CHECKED_IN")}
                              className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
                              Check In
                            </button>
                          )}
                          {b.status === "CHECKED_IN" && (
                            <button onClick={() => updateBookingStatus(b.id, "CHECKED_OUT")}
                              className="text-xs px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium">
                              Check Out
                            </button>
                          )}
                          {b.status === "CHECKED_OUT" && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />Done
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
