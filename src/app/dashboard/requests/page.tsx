"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, Package, RefreshCw, Search, ChevronDown, ChevronUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface RequestItem {
  id: string;
  itemId: string;
  quantityRequested: number;
  quantityFulfilled: number;
  item: { id: string; name: string; unit: string; category: { name: string } };
}

interface Request {
  id: string;
  status: string;
  createdAt: string;
  branch: { id: string; name: string };
  items: RequestItem[];
  distributions: { id: string; suratJalanNumber: string; status: string }[];
}

const statusLabel: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "bg-orange-100 text-orange-700" },
  PARTIAL: { label: "Sebagian", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

export default function RequestApprovalPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "SEMUA" ? "/api/requests" : `/api/requests?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const cancelRequest = async (id: string) => {
    if (!confirm("Batalkan permintaan ini?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal membatalkan");
        return;
      }
      await fetchRequests();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const filtered = requests.filter(
    (r) =>
      r.branch.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permintaan Barang</h1>
              <p className="text-gray-500 text-sm mt-1">
                Tinjau permintaan barang dari seluruh kantor cabang.
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari cabang / ID..."
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {["PENDING", "PARTIAL", "COMPLETED", "CANCELLED", "SEMUA"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === s
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s === "SEMUA" ? "Semua" : statusLabel[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Memuat permintaan...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {search ? "Tidak ada hasil." : `Tidak ada permintaan ${filter === "SEMUA" ? "" : filter}.`}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => {
                const st = statusLabel[req.status] ?? { label: req.status, color: "bg-gray-100 text-gray-600" };
                const isExpanded = expanded === req.id;
                const isPending = req.status === "PENDING";

                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Row header */}
                    <div className="flex items-center gap-4 px-6 py-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isPending ? "bg-orange-50" : req.status === "COMPLETED" ? "bg-green-50" : req.status === "PARTIAL" ? "bg-blue-50" : "bg-red-50"
                      }`}>
                        {isPending ? <Clock size={18} className="text-orange-500" />
                          : req.status === "COMPLETED" ? <CheckCircle size={18} className="text-green-500" />
                          : req.status === "PARTIAL" ? <Package size={18} className="text-blue-500" />
                          : <XCircle size={18} className="text-red-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 truncate">{req.branch.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">
                          {req.id} • {formatDate(req.createdAt)} • {req.items.length} jenis barang
                        </div>
                      </div>

                      {/* Distribusi links */}
                      {req.distributions.length > 0 && (
                        <div className="hidden md:flex items-center gap-1">
                          {req.distributions.map((d) => (
                            <span key={d.id} className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                              {d.suratJalanNumber}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <a
                              href="/dashboard/batch"
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                            >
                              <Package size={12} /> Proses
                            </a>
                            <button
                              onClick={() => cancelRequest(req.id)}
                              disabled={processing === req.id}
                              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle size={12} /> Batalkan
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpanded(isExpanded ? null : req.id)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-6 py-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 uppercase">
                              <th className="pb-2 text-left">Nama Barang</th>
                              <th className="pb-2 text-center">Diminta</th>
                              <th className="pb-2 text-center">Dipenuhi</th>
                              <th className="pb-2 text-center">Sisa</th>
                              <th className="pb-2 text-center">Kategori</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {req.items.map((ri) => (
                              <tr key={ri.id} className="hover:bg-gray-50">
                                <td className="py-2 font-medium text-gray-800">{ri.item.name}</td>
                                <td className="py-2 text-center font-bold">
                                  {ri.quantityRequested} {ri.item.unit}
                                </td>
                                <td className="py-2 text-center text-green-600 font-bold">
                                  {ri.quantityFulfilled}
                                </td>
                                <td className={`py-2 text-center font-bold ${
                                  ri.quantityRequested - ri.quantityFulfilled > 0 ? "text-red-500" : "text-gray-400"
                                }`}>
                                  {ri.quantityRequested - ri.quantityFulfilled}
                                </td>
                                <td className="py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    ri.item.category.name === "ATK"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}>
                                    {ri.item.category.name}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
