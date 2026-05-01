"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight, ClipboardList, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface PendingRequest {
  id: string;
  nomorPermintaan: string | null;
  createdAt: string;
  branch: { name: string };
  items: { id: string; quantityRequested: number; quantityFulfilled: number; item: { name: string; unit: string } }[];
}

export default function GoodsIssuancePage() {
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests?status=PENDING");
      const data = await res.json();
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Page Header */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#003366] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">Pengeluaran Barang — Kantor Pusat</h1>
                <p className="text-blue-200 text-xs mt-0.5">{today}</p>
              </div>
              <button
                onClick={fetchPending}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-4 p-5 bg-blue-50 border-b border-blue-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  Proses pengeluaran barang dilakukan melalui halaman Distribusi
                </p>
                <p className="text-xs text-blue-600">
                  Halaman ini menampilkan daftar permintaan pending dari cabang. Untuk memproses dan mengeluarkan barang,
                  gunakan tombol <strong>"Proses di Distribusi"</strong> atau buka halaman Distribusi.
                </p>
              </div>
              <a
                href="/dashboard/batch"
                className="ml-auto flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shrink-0"
              >
                <ArrowRight size={15} /> Buka Distribusi
              </a>
            </div>
          </div>

          {/* Pending Requests Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList size={18} className="text-orange-500" />
                <h2 className="font-bold text-gray-800">Permintaan Menunggu Diproses</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${pendingRequests.length > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                {loading ? "..." : `${pendingRequests.length} permintaan`}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Memuat data permintaan...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={40} className="text-green-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Semua permintaan sudah diproses</p>
                <p className="text-gray-300 text-xs mt-1">Tidak ada permintaan yang menunggu pengeluaran barang</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingRequests.map((req) => {
                  const totalItems = req.items.length;
                  const partialItems = req.items.filter(i => i.quantityFulfilled > 0).length;
                  const tgl = new Date(req.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit", month: "short", year: "numeric"
                  });
                  return (
                    <div key={req.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Header permintaan */}
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                              {req.nomorPermintaan ?? req.id.slice(0, 12) + "..."}
                            </span>
                            <span className="text-xs text-gray-400">{tgl}</span>
                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {req.branch.name}
                            </span>
                            {partialItems > 0 && (
                              <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                                Parsial ({partialItems}/{totalItems})
                              </span>
                            )}
                          </div>

                          {/* Items list */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {req.items.map((item) => {
                              const sisa = item.quantityRequested - item.quantityFulfilled;
                              return (
                                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                                  <span className="text-gray-700 font-medium truncate mr-2">{item.item.name}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {item.quantityFulfilled > 0 && (
                                      <span className="text-green-600 font-bold">✓{item.quantityFulfilled}</span>
                                    )}
                                    <span className={`font-bold ${sisa > 0 ? "text-orange-600" : "text-green-600"}`}>
                                      {sisa > 0 ? `sisa ${sisa}` : "✓ Lunas"} {item.item.unit}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action */}
                        <a
                          href="/dashboard/batch"
                          className="flex items-center gap-1.5 bg-[#003366] text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors shrink-0"
                          title="Proses pengeluaran barang untuk permintaan ini"
                        >
                          <ExternalLink size={12} />
                          Proses
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Summary */}
          {!loading && pendingRequests.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-800">
                  {pendingRequests.length} permintaan cabang menunggu dikeluarkan
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  Proses semua sekaligus di halaman Distribusi dengan fitur batch processing
                </p>
              </div>
              <a
                href="/dashboard/batch"
                className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors"
              >
                Proses Sekarang <ArrowRight size={16} />
              </a>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
