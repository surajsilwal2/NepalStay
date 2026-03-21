"use client";
import { useEffect, useState } from "react";
import { Users, RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type User = {
  id: string; name: string; email: string; role: string;
  phone: string | null; isActive: boolean; createdAt: string;
  _count: { bookings: number };
};

const ROLE_CLS: Record<string, string> = {
  CUSTOMER: "bg-green-100 text-green-700",
  VENDOR:   "bg-purple-100 text-purple-700",
  STAFF:    "bg-blue-100 text-blue-700",
  ADMIN:    "bg-amber-100 text-amber-700",
};

function RowSkeleton() {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-24"/></td>
      ))}
    </tr>
  );
}

export default function AdminUsersPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const url  = filter !== "ALL" ? `/api/admin/users?role=${filter}` : "/api/admin/users";
    const res  = await fetch(url);
    const data = await res.json();
    if (data.success) setUsers(data.data);
    else toastError("Failed to load users");
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const updateUser = async (id: string, data: { role?: string; isActive?: boolean }, label: string) => {
    setUpdating(id);
    const res  = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setUpdating(null);
    if (json.success) { toastSuccess(label); fetchUsers(); }
    else toastError(json.error);
  };

  const counts = { ALL: users.length, CUSTOMER: 0, VENDOR: 0, STAFF: 0, ADMIN: 0 };
  users.forEach(u => { if (counts[u.role as keyof typeof counts] !== undefined) counts[u.role as keyof typeof counts]++; });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-slate-500 mt-1 text-sm">{users.length} registered accounts</p>
          </div>
          <button onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Stats + filter */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(["ALL","CUSTOMER","VENDOR","STAFF","ADMIN"] as const).map(r => (
            <button key={r} onClick={() => setFilter(r)}
              className={`rounded-2xl p-4 text-left border transition-all ${
                filter === r ? "border-amber-400 bg-amber-50 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"
              }`}>
              <p className="text-2xl font-bold text-slate-800">{counts[r]}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5 capitalize">{r === "ALL" ? "Total" : r.toLowerCase()+"s"}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["User","Email","Role","Bookings","Joined","Status","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading
                  ? [1,2,3,4,5].map(i => <RowSkeleton key={i} />)
                  : users.length === 0
                  ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No users found.</td></tr>
                  : users.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-50/50 ${!u.isActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{u.name}</p>
                        {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <select value={u.role}
                          onChange={e => updateUser(u.id, { role: e.target.value }, `${u.name} is now ${e.target.value}`)}
                          disabled={updating === u.id}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${ROLE_CLS[u.role]}`}>
                          {["CUSTOMER","VENDOR","STAFF","ADMIN"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {updating === u.id && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-slate-400" />}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u._count.bookings}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BsDateDisplay date={u.createdAt} className="text-xs text-slate-500" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateUser(u.id, { isActive: !u.isActive }, u.isActive ? `${u.name} suspended` : `${u.name} reactivated`)}
                          disabled={updating === u.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
                            u.isActive
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}>
                          {u.isActive ? "Suspend" : "Reactivate"}
                        </button>
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
