"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BedDouble, RefreshCw, Users, CheckCircle, Sparkles, Wrench,
  X, Calendar, Phone, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/providers/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

type PmsRoom = {
  id: string; name: string; type: string; status: RoomStatus;
  floor: number; capacity: number; pricePerNight: number; hotelName: string;
  currentGuest: string | null; nextGuest: string | null;
  lastStatusChange: string | null; upcomingBookings: number;
};

type FloorEntry = {
  floor: number;
  rooms: { id: string; name: string; type: string; status: RoomStatus }[];
};

type TimelineDay = {
  date: string; day: string; isToday: boolean;
  booking: {
    id: string; guestName?: string | null;
    status: string; isCheckIn: boolean; isCheckOut: boolean;
  } | null;
};

type Timeline = {
  roomId: string; roomName: string; roomType: string; floor: number;
  days: TimelineDay[];
};

type Arrival = {
  bookingId: string; guestName?: string | null; guestPhone?: string | null;
  guestAvatar?: string | null; roomName: string; roomType: string; roomFloor: number;
  checkIn: string; checkOut: string; nights: number; status: string;
  totalPrice: number; invoiceNumber?: string | null;
};

type PmsData = {
  rooms: PmsRoom[];
  floorMap: FloorEntry[];
  timeline: Timeline[];
  todayArrivals: Arrival[];
  todayDepartures: Arrival[];
  currentOccupancy: number;
  statusCounts: Record<string, number>;
  totalRooms: number;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<RoomStatus, { bg: string; text: string; border: string; dot: string; icon: React.ElementType; label: string }> = {
  AVAILABLE:   { bg: "bg-green-400",  text: "text-green-800",  border: "border-green-300",  dot: "bg-green-500",  icon: CheckCircle, label: "Available" },
  OCCUPIED:    { bg: "bg-blue-400",   text: "text-blue-800",   border: "border-blue-300",   dot: "bg-blue-500",   icon: Users,       label: "Occupied" },
  CLEANING:    { bg: "bg-yellow-400", text: "text-yellow-800", border: "border-yellow-300", dot: "bg-yellow-500", icon: Sparkles,    label: "Cleaning" },
  MAINTENANCE: { bg: "bg-red-400",    text: "text-red-800",    border: "border-red-300",    dot: "bg-red-500",    icon: Wrench,      label: "Maintenance" },
};

const GANTT_CFG: Record<string, string> = {
  CONFIRMED:   "bg-blue-400",
  CHECKED_IN:  "bg-green-500",
  PENDING:     "bg-yellow-400",
};

// ─── Room Tile ────────────────────────────────────────────────────────────────

function RoomTile({
  room, onClick,
}: {
  room: { id: string; name: string; type: string; status: RoomStatus };
  onClick: () => void;
}) {
  const cfg = STATUS_CFG[room.status];
  return (
    <button
      onClick={onClick}
      title={`${room.name} — ${cfg.label}`}
      className={`relative w-20 h-20 rounded-xl ${cfg.bg} flex flex-col items-center justify-center gap-0.5 border-2 ${cfg.border} hover:scale-105 hover:shadow-md transition-all active:scale-95 cursor-pointer`}
    >
      <span className="text-white text-xs font-bold leading-tight text-center px-1 leading-tight">{room.name}</span>
      <span className="text-white/80 text-[10px] leading-none capitalize">{room.type.toLowerCase()}</span>
    </button>
  );
}

// ─── Room Detail Panel ────────────────────────────────────────────────────────

function RoomDetailPanel({
  room, onClose,
}: {
  room: PmsRoom; onClose: () => void;
}) {
  const cfg = STATUS_CFG[room.status];
  const Icon = cfg.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
              <h3 className="text-lg font-bold text-slate-800">{room.name}</h3>
            </div>
            <p className="text-sm text-slate-500">{room.type} · Floor {room.floor} · {room.capacity} guests</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-4 ${cfg.text} ${cfg.border} bg-opacity-20`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold">{cfg.label}</span>
        </div>

        {/* Details grid */}
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Price</span>
            <span className="font-semibold text-slate-800">NPR {room.pricePerNight.toLocaleString()}/night</span>
          </div>
          {room.currentGuest && (
            <div className="flex justify-between">
              <span className="text-slate-500">Current Guest</span>
              <span className="font-semibold text-slate-800">{room.currentGuest}</span>
            </div>
          )}
          {room.nextGuest && (
            <div className="flex justify-between">
              <span className="text-slate-500">Next Guest</span>
              <span className="font-semibold text-slate-800">{room.nextGuest}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Upcoming Bookings</span>
            <span className="font-semibold text-slate-800">{room.upcomingBookings}</span>
          </div>
          {room.lastStatusChange && (
            <div className="flex justify-between">
              <span className="text-slate-500">Last Status Change</span>
              <span className="text-slate-600 text-xs">
                {new Date(room.lastStatusChange).toLocaleString("en-NP", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Gantt Timeline ───────────────────────────────────────────────────────────

function GanttChart({ timeline }: { timeline: Timeline[] }) {
  if (!timeline.length) return null;
  const days = timeline[0]?.days ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2.5 bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold w-28 sticky left-0">
              Room
            </th>
            {days.map(d => (
              <th
                key={d.date}
                className={`px-2 py-2.5 text-center border-b border-slate-100 font-semibold min-w-[70px] ${
                  d.isToday ? "bg-amber-50 text-amber-700 border-b-amber-300" : "bg-slate-50 text-slate-500"
                }`}
              >
                <div>{d.day}</div>
                <div className="font-normal text-[10px] text-slate-400">
                  {new Date(d.date).getDate()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeline.map((row) => (
            <tr key={row.roomId} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 border-b border-slate-50 sticky left-0 bg-white font-medium text-slate-700 whitespace-nowrap">
                {row.roomName}
                <div className="text-[10px] text-slate-400">{row.roomType.toLowerCase()}</div>
              </td>
              {row.days.map(d => (
                <td key={d.date} className={`px-1 py-1.5 border-b border-slate-50 text-center ${d.isToday ? "bg-amber-50/50" : ""}`}>
                  {d.booking ? (
                    <div className={`rounded px-1 py-1 text-white text-[10px] font-medium ${GANTT_CFG[d.booking.status] ?? "bg-slate-400"}`}>
                      {d.booking.isCheckIn && "→"}
                      {d.booking.isCheckOut && "←"}
                      {!d.booking.isCheckIn && !d.booking.isCheckOut && "●"}
                    </div>
                  ) : (
                    <div className="w-full h-6" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-2 px-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Confirmed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Checked In</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Pending</span>
        <span className="ml-2 flex items-center gap-1">→ Check-in · ← Check-out · ● Staying</span>
      </div>
    </div>
  );
}

// ─── Arrival/Departure row ────────────────────────────────────────────────────

function GuestRow({ arrival, type }: { arrival: Arrival; type: "arrival" | "departure" }) {
  const time = type === "arrival" ? arrival.checkIn : arrival.checkOut;
  const statusCls: Record<string, string> = {
    CONFIRMED:   "bg-blue-100 text-blue-700",
    CHECKED_IN:  "bg-green-100 text-green-700",
    CHECKED_OUT: "bg-slate-100 text-slate-600",
    PENDING:     "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 flex-shrink-0">
        {(arrival.guestName ?? "?")[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{arrival.guestName ?? "Unknown Guest"}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <span>{arrival.roomName}</span>
          <span>·</span>
          <span>{arrival.nights} nights</span>
          {arrival.guestPhone && (
            <>
              <span>·</span>
              <Phone className="w-3 h-3" />
              <span>{arrival.guestPhone}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls[arrival.status] ?? "bg-slate-100 text-slate-600"}`}>
          {arrival.status.replace("_", " ")}
        </span>
        <p className="text-xs text-slate-400 mt-1">
          NPR {arrival.totalPrice.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white h-20 rounded-2xl border border-slate-100" />)}
        </div>
        <div className="bg-white rounded-2xl h-64 border border-slate-100" />
        <div className="bg-white rounded-2xl h-48 border border-slate-100" />
      </main>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export default function PMSBoard() {
  const { error: toastError } = useToast();
  const [data, setData]             = useState<PmsData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState<"arrivals" | "departures">("arrivals");
  const [selectedRoom, setSelectedRoom] = useState<PmsRoom | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res  = await fetch("/api/pms");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        toastError(json.error || "Failed to load PMS data");
      }
    } catch {
      toastError("Network error loading PMS data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Skeleton />;

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <BedDouble className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No PMS data available</h2>
          <p className="text-slate-500 text-sm">Ensure your hotel has rooms and you are assigned to a hotel.</p>
        </div>
      </div>
    );
  }

  const { floorMap, rooms, timeline, todayArrivals, todayDepartures, currentOccupancy, statusCounts, totalRooms } = data;

  // Build quick lookup for full room data by id
  const roomById: Record<string, PmsRoom> = {};
  rooms.forEach(r => { roomById[r.id] = r; });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">PMS — Room Map</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {totalRooms} rooms · {currentOccupancy}% occupied
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Status summary ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"] as RoomStatus[]).map(s => {
            const cfg = STATUS_CFG[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className={`rounded-2xl p-4 flex items-center gap-3 border ${cfg.text} ${cfg.border} bg-white`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg} bg-opacity-20`}>
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statusCounts[s] ?? 0}</p>
                  <p className="text-xs font-medium opacity-70">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Room Grid by Floor ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800">Room Map</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"] as RoomStatus[]).map(s => (
                <span key={s} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded ${STATUS_CFG[s].bg}`} />
                  {STATUS_CFG[s].label}
                </span>
              ))}
            </div>
          </div>

          {floorMap.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BedDouble className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No rooms found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {floorMap.map(floorEntry => (
                <div key={floorEntry.floor}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
                      Floor {floorEntry.floor}
                    </div>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {floorEntry.rooms.map(r => (
                      <RoomTile
                        key={r.id}
                        room={r}
                        onClick={() => setSelectedRoom(roomById[r.id] ?? null)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 7-Day Gantt Timeline ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-800">7-Day Booking Timeline</h2>
          </div>
          {timeline.length > 0
            ? <GanttChart timeline={timeline} />
            : <p className="text-slate-400 text-sm text-center py-8">No bookings in the next 7 days</p>
          }
        </div>

        {/* ── Arrivals / Departures ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {([
              { id: "arrivals",   label: "Today's Arrivals",   count: todayArrivals.length },
              { id: "departures", label: "Today's Departures",  count: todayDepartures.length },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-amber-500 text-amber-700 bg-amber-50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    activeTab === tab.id ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "arrivals" ? (
            todayArrivals.length > 0 ? (
              todayArrivals.map(a => (
                <GuestRow key={a.bookingId} arrival={a} type="arrival" />
              ))
            ) : (
              <div className="py-14 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No arrivals today</p>
              </div>
            )
          ) : (
            todayDepartures.length > 0 ? (
              todayDepartures.map(d => (
                <GuestRow key={d.bookingId} arrival={d} type="departure" />
              ))
            ) : (
              <div className="py-14 text-center text-slate-400">
                <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No departures today</p>
              </div>
            )
          )}
        </div>
      </main>

      {/* ── Room detail modal ── */}
      {selectedRoom && (
        <RoomDetailPanel
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
