"use client";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, DollarSign, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type RefundRecord = {
  id: string;
  invoiceNumber: string | null;
  totalPrice: number;
  refundAmount: number | null;
  refundPercent: number | null;
  refundStatus: string;
  refundedAt: string | null;
  user: { name: string; email: string };
  hotel: { name: string };
};

type Stats = {
  totalCancellations: number;
  completedRefunds: number;
  pendingRefunds: number;
};

function RowSkeleton() {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
      ))}
    </tr>
  );
}

export default function AdminRefundsPage() {
  const { error: toastError } = useToast();
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refunds");
      const data = await res.json();
      if (data.success) {
        setRefunds(data.data.refunds || []);
        setStats(data.data.stats);
      } else {
        toastError("Failed to load refunds");
      }
    } catch {
      toastError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRefunds(); }, []);

  const filtered = filter === "ALL" 
    ? refunds 
    : refunds.filter(r => r.refundStatus === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Refund Monitoring</h1>
            <p className="text-slate-500 mt-1 text-sm">Track all booking refunds and cancellations</p>
          </div>
          <button
            onClick={fetchRefunds}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Cancellations</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCancellations}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Completed Refunds</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.completedRefunds}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-50">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Pending Refunds</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.pendingRefunds}</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "PENDING", "COMPLETED"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === s
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {s === "ALL" ? "All Refunds" : s === "PENDING" ? "Pending" : "Completed"}
            </button>
          ))}
        </div>

        {/* Refunds table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Guest", "Hotel", "Original", "Refund Amt", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading
                  ? [1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} />)
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No refunds found
                      </td>
                    </tr>
                  )
                  : filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{r.user?.name}</p>
                        <p className="text-xs text-slate-400">{r.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.hotel?.name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">NPR {r.totalPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">NPR {r.refundAmount?.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{r.refundPercent}%</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.refundStatus === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : r.refundStatus === "PENDING"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.refundStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {r.refundedAt ? <BsDateDisplay date={r.refundedAt} /> : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
