"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, CalendarCheck,
  Users, Star, BedDouble, BarChart2, RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/providers/ToastContext";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type KPI = {
  totalRevenue: number; thisMonthRevenue: number; lastMonthRevenue: number;
  revenueGrowth: number; totalBookings: number; occupancyRate: number;
  avgBookingValue: number; avgNightsPerBooking: number;
  nepaliGuests: number; foreignGuests: number; totalReviews: number;
  overallRating: number | null;
};
type RevenueByMonth = { month: string; revenue: number; bookings: number };
type BookingByDay   = { date: string; bookings: number; revenue: number };
type RoomPerf       = { name: string; type: string; revenue: number; bookings: number };
type GuestNat       = { nationality: string; count: number; pct: number };
type PaymentMethod  = { method: string; count: number; pct: number };
type PeakDay        = { day: string; count: number; isPeak: boolean };

type AnalyticsData = {
  hotel: { name: string; city: string; starRating: number; totalRooms: number };
  kpi: KPI;
  revenueByMonth: RevenueByMonth[];
  bookingsByDay: BookingByDay[];
  roomPerformance: RoomPerf[];
  guestNationality: GuestNat[];
  paymentMethods: PaymentMethod[];
  peakDays: PeakDay[];
};

// ─── Chart colors ─────────────────────────────────────────────────────────────

const AMBER   = "#f59e0b";
const AMBER2  = "#fcd34d";
const SLATE   = "#64748b";
const SLATE2  = "#cbd5e1";
const PIE_COLORS = ["#f59e0b", "#fb923c", "#a78bfa", "#34d399", "#60a5fa", "#f472b6"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, trend, icon: Icon, color = "amber",
}: {
  label: string; value: string | number; sub?: string;
  trend?: number; icon: React.ElementType; color?: string;
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
            {trend >= 0
              ? <TrendingUp className="w-3.5 h-3.5" />
              : <TrendingDown className="w-3.5 h-3.5" />}
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

function ChartCard({ title, children, className = "" }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency = false }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="font-medium">{p.name}:</span>
          {currency ? `NPR ${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-5 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-32 border border-slate-100" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-32 border border-slate-100" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl h-72 border border-slate-100" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-64 border border-slate-100" />)}
        </div>
      </main>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { error: toastError } = useToast();
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/vendor/analytics");
      const json = await res.json();
      if (json.success && json.data) setData(json.data);
      else toastError(json.error || "Failed to load analytics");
    } catch {
      toastError("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Skeleton />;
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <BarChart2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No analytics data yet</h2>
          <p className="text-slate-500 text-sm">Create your hotel listing and receive bookings to see analytics.</p>
        </div>
      </div>
    );
  }

  const { hotel, kpi, revenueByMonth, bookingsByDay, roomPerformance, guestNationality, paymentMethods, peakDays } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Revenue Analytics</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {hotel.name} · {hotel.city} · {hotel.starRating}★ · {hotel.totalRooms} rooms
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

        {/* ── KPI Row 1 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={`NPR ${kpi.totalRevenue.toLocaleString()}`}
            sub={`${kpi.totalBookings} total bookings`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            label="This Month Revenue"
            value={`NPR ${kpi.thisMonthRevenue.toLocaleString()}`}
            sub={`Last month: NPR ${kpi.lastMonthRevenue.toLocaleString()}`}
            trend={kpi.revenueGrowth}
            icon={TrendingUp}
            color="amber"
          />
          <StatCard
            label="Occupancy Rate"
            value={`${kpi.occupancyRate}%`}
            sub="Current month"
            icon={BedDouble}
            color="blue"
          />
          <StatCard
            label="Avg Booking Value"
            value={`NPR ${kpi.avgBookingValue.toLocaleString()}`}
            sub={`Avg ${kpi.avgNightsPerBooking} nights/booking`}
            icon={CalendarCheck}
            color="purple"
          />
        </div>

        {/* ── KPI Row 2 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Bookings" value={kpi.totalBookings} icon={CalendarCheck} color="blue" />
          <StatCard
            label="Overall Rating"
            value={kpi.overallRating != null ? `${kpi.overallRating}/5` : "—"}
            sub={`${kpi.totalReviews} reviews`}
            icon={Star}
            color="amber"
          />
          <StatCard
            label="Nepali Guests"
            value={kpi.nepaliGuests}
            sub={`${kpi.foreignGuests} foreign`}
            icon={Users}
            color="green"
          />
          <StatCard
            label="Avg Nights / Booking"
            value={kpi.avgNightsPerBooking}
            icon={BedDouble}
            color="purple"
          />
        </div>

        {/* ── Row 1: Line + Bar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Revenue by Month — Line chart */}
          <ChartCard title="Revenue by Month (Last 12 Months)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueByMonth} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip currency />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="revenue" name="Revenue (NPR)" stroke={AMBER}
                  strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: AMBER }} />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke={SLATE}
                  strokeWidth={2} dot={false} activeDot={{ r: 4, fill: SLATE }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bookings by Day — Bar chart */}
          <ChartCard title="Peak Booking Days (by Day of Week)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakDays} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" name="Bookings" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {peakDays.map((entry, i) => (
                  <Cell key={i} fill={AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-1 align-middle" />
            Peak day highlighted in amber
          </p>
        </ChartCard>
        </div>

        {/* ── Row 2: Horizontal Bar + Pie + Donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Room Performance — Horizontal Bar */}
          <ChartCard title="Room Performance" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                layout="vertical"
                data={roomPerformance}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip currency />} />
                <Bar dataKey="revenue" name="Revenue (NPR)" fill={AMBER} radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Guest Nationality — Pie */}
          <ChartCard title="Guest Nationality">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={guestNationality}
                  dataKey="count"
                  nameKey="nationality"
                  cx="50%" cy="50%"
                  outerRadius={88}
                  paddingAngle={2}
                  label={({ nationality, pct }) => `${nationality} ${pct}%`}
                  labelLine={false}
                >
                  {guestNationality.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any, name: any) => [val, name]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Payment Methods — Donut */}
          <ChartCard title="Payment Methods">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="count"
                  nameKey="method"
                  cx="50%" cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {paymentMethods.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any, name: any) => [`${val} bookings`, name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Row 3: Peak Days ── */}
        <ChartCard title="Peak Booking Days (by Day of Week)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakDays} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Bookings" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {peakDays.map((entry, i) => (
                  <Cell key={i} fill={entry.isPeak ? AMBER : SLATE2} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-1 align-middle" />
            Peak day highlighted in amber
          </p>
        </ChartCard>

      </main>
    </div>
  );
}
