"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

type Alert = {
  hotelId: string;
  hotelName: string;
  city: string;
  totalRooms: number;
  occupancyPct: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  peakDates: string[];
  recommendation: string;
};

const RISK_CFG = {
  HIGH: {
    cls: "bg-red-50 border-red-200",
    icon: AlertTriangle,
    iconCls: "text-red-500",
    label: "High Risk",
    bar: "bg-red-500",
  },
  MEDIUM: {
    cls: "bg-amber-50 border-amber-200",
    icon: TrendingUp,
    iconCls: "text-amber-500",
    label: "Medium",
    bar: "bg-amber-400",
  },
  LOW: {
    cls: "bg-green-50 border-green-200",
    icon: CheckCircle,
    iconCls: "text-green-500",
    label: "Low Risk",
    bar: "bg-green-400",
  },
};

export default function OverbookingAlert() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/overbooking")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAlerts(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-40 mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const highRisk = alerts.filter((a) => a.riskLevel === "HIGH").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-5 h-5 ${highRisk > 0 ? "text-red-500" : "text-amber-500"}`}
          />
          <h3 className="font-bold text-slate-800">
            Occupancy Risk — Next 30 Days
          </h3>
          {highRisk > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
              {highRisk} high risk
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            No occupancy concerns for the next 30 days
          </div>
        ) : (
          alerts.map((alert) => {
            const cfg = RISK_CFG[alert.riskLevel];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.hotelId}
                className={`rounded-xl border p-4 ${cfg.cls}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.iconCls}`} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {alert.hotelName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {alert.city} · {alert.totalRooms} rooms
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${alert.riskLevel === "HIGH" ? "text-red-600" : alert.riskLevel === "MEDIUM" ? "text-amber-600" : "text-green-600"}`}
                  >
                    {alert.occupancyPct}%
                  </span>
                </div>

                {/* Occupancy bar */}
                <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${cfg.bar}`}
                    style={{ width: `${Math.min(100, alert.occupancyPct)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 mb-1">
                  {alert.recommendation}
                </p>

                {alert.peakDates.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-slate-400">Peak dates:</span>
                    {alert.peakDates.map((d) => (
                      <span
                        key={d}
                        className="text-xs bg-white/70 text-slate-600 px-2 py-0.5 rounded-md font-mono"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
