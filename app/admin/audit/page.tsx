"use client";
import { useEffect, useState } from "react";
import { FileText, TrendingUp, TrendingDown, RefreshCw, Printer } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useCalendar } from "@/components/providers/CalendarContext";
import { useToast } from "@/components/providers/ToastContext";
import { adToBS, formatBSShort } from "@/lib/nepali-date";

type AuditData = {
  period:   { from: string; to: string; fromBS: string; toBS: string; fiscalYear: string };
  summary:  { grossRevenue: number; totalRefunds: number; netRevenue: number; invoiceCount: number; refundCount: number };
  invoices: any[];
  creditNotes: any[];
};

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl h-24 border border-slate-100"/>)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 h-64"/>
    </div>
  );
}

export default function AdminAuditPage() {
  const { isBS } = useCalendar();
  const { error: toastError } = useToast();
  const [data, setData]     = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return format(d, "yyyy-MM-dd");
  });
  const [toDate, setToDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/audit?from=${fromDate}&to=${toDate}`);
      const json = await res.json();
      if (json.success) setData(json);
      else toastError("Failed to generate audit report");
    } catch { toastError("Network error"); }
    setLoading(false);
  };

  useEffect(() => { fetchAudit(); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 print:px-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Audit Report</h1>
            <p className="text-slate-500 mt-1 text-sm">IRD-compliant revenue and invoice summary</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Printer className="w-4 h-4" />Print
            </button>
          </div>
        </div>

        {/* Date range picker */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-wrap gap-3 items-center print:hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">From:</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">To:</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <button onClick={fetchAudit}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Generate Report
          </button>
        </div>

        {loading ? <Skeleton /> : data && (
          <>
            {/* Period header */}
            <div className="mb-4 text-sm text-slate-500">
              <p>
                Period: <strong>
                  {isBS ? data.period.fromBS : format(new Date(data.period.from), "dd MMM yyyy")}
                </strong> → <strong>
                  {isBS ? data.period.toBS : format(new Date(data.period.to), "dd MMM yyyy")}
                </strong>
                {" · "}{data.period.fiscalYear}
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Gross Revenue",  val: data.summary.grossRevenue,  cls: "text-slate-800",  sub: `${data.summary.invoiceCount} invoices` },
                { label: "Total Refunds",  val: data.summary.totalRefunds,  cls: "text-red-600",    sub: `${data.summary.refundCount} credit notes` },
                { label: "Net Revenue",    val: data.summary.netRevenue,    cls: "text-green-700",  sub: "After refunds" },
              ].map(({ label, val, cls, sub }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${cls}`}>NPR {val.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Invoice table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Invoices ({data.summary.invoiceCount})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Invoice #","Date (BS)","Date (AD)","Guest","Hotel","Room","Amount","Status"].map(h=>(
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-green-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-xs text-amber-600 font-medium">{inv.invoiceDateBS}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {inv.invoiceIssuedAt ? format(new Date(inv.invoiceIssuedAt), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-700">{inv.user?.name}</p>
                          <p className="text-xs text-slate-400">{inv.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{inv.hotel?.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{inv.room?.name}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          NPR {inv.totalPrice?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inv.creditNoteRef
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {inv.creditNoteRef ? "Refunded" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.invoices.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-8 text-slate-400">No invoices in this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit notes */}
            {data.creditNotes.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800">Credit Notes ({data.creditNotes.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Credit Note #","Original Invoice","Guest","Hotel","Refund Amount","Policy","Issued"].map(h=>(
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.creditNotes.map(cn => (
                        <tr key={cn.id}>
                          <td className="px-4 py-3 font-mono text-xs text-red-600">{cn.creditNoteNumber}</td>
                          <td className="px-4 py-3 font-mono text-xs text-green-600">{cn.originalInvoice}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{cn.guestName}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{cn.hotelName}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">NPR {cn.refundAmount.toLocaleString()} ({cn.refundPercent}%)</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{cn.cancellationPolicy}</td>
                          <td className="px-4 py-3"><BsDateDisplay date={cn.issuedAt} className="text-xs text-slate-500" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
