"use client";
import { useState, useEffect, useCallback } from "react";
import { Save, Trash2, Plus, ChevronDown, RefreshCw, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface RequestItemAPI {
  id: string;
  itemId: string;
  quantityRequested: number;
  quantityFulfilled: number;
  item: {
    id: string;
    name: string;
    unit: string;
    totalStock?: number;
    stockBatches?: { currentQuantity: number }[];
  };
}

interface PendingRequest {
  id: string;
  status: string;
  createdAt: string;
  branch: { id: string; name: string };
  items: RequestItemAPI[];
}

interface DistribItem {
  requestId: string;
  requestBranch: string;
  itemId: string;
  nama: string;
  unit: string;
  qty: number;
  qtyMax: number;
  harga: number;
  jumlah: number;
}

export default function BatchDistributionPage() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [distributed, setDistributed] = useState<DistribItem[]>([]);
  const [qtyInputs, setQtyInputs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSJ, setSavedSJ] = useState<string | null>(null);
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, invRes] = await Promise.all([
        fetch("/api/requests?status=PENDING"),
        fetch("/api/inventory"),
      ]);
      const reqs = await reqRes.json();
      const inv = await invRes.json();

      setPendingRequests(reqs);

      const map: Record<string, number> = {};
      for (const item of inv) map[item.id] = item.totalStock;
      setInventoryMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedReq = pendingRequests.find((r) => r.id === selectedReqId);

  const addToDistribution = () => {
    if (!selectedReq) return;

    const newItems: DistribItem[] = selectedReq.items
      .map((ri) => {
        const qty = qtyInputs[ri.id] ?? 0;
        if (qty <= 0) return null;
        const stokAda = inventoryMap[ri.item.id] ?? 0;
        return {
          requestId: selectedReqId,
          requestBranch: selectedReq.branch.name,
          itemId: ri.item.id,
          nama: ri.item.name,
          unit: ri.item.unit,
          qty,
          qtyMax: Math.min(ri.quantityRequested - ri.quantityFulfilled, stokAda),
          harga: 0,
          jumlah: 0,
        };
      })
      .filter(Boolean) as DistribItem[];

    if (newItems.length === 0) {
      alert("Isi jumlah dikeluarkan minimal 1 item.");
      return;
    }

    setDistributed((prev) => [...prev, ...newItems]);
    setQtyInputs({});
    setSelectedReqId("");
  };

  const removeDistribItem = (index: number) => {
    setDistributed((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (distributed.length === 0) {
      alert("Tambahkan item distribusi terlebih dahulu.");
      return;
    }

    // Group by requestId
    const grouped: Record<string, { itemId: string; quantity: number }[]> = {};
    for (const d of distributed) {
      if (!grouped[d.requestId]) grouped[d.requestId] = [];
      grouped[d.requestId].push({ itemId: d.itemId, quantity: d.qty });
    }

    setSaving(true);
    try {
      const sjNumbers: string[] = [];

      for (const [requestId, items] of Object.entries(grouped)) {
        const res = await fetch("/api/distribution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, items }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menyimpan distribusi");
        sjNumbers.push(data.distribution.suratJalanNumber);
      }

      setSavedSJ(sjNumbers.join(", "));
      setDistributed([]);
      setSelectedReqId("");
      await fetchData();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const formatRp = (val: number) => "Rp " + val.toLocaleString("id-ID");
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto bg-white border border-gray-300 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#003366] text-white px-6 py-3 flex items-center justify-between">
              <span className="text-base font-semibold">Pengeluaran Barang — Kantor Pusat Bank Sumut</span>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="w-32 text-sm font-medium shrink-0">Tanggal</label>
                  <div className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-gray-50 text-sm text-gray-600">
                    {today}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-32 text-sm font-medium shrink-0">Permintaan Pending</label>
                  <div className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-blue-50 text-sm font-bold text-blue-700">
                    {loading ? "..." : `${pendingRequests.length} permintaan`}
                  </div>
                </div>
              </div>

              {/* Select request */}
              <div className="flex items-center gap-3">
                <label className="w-32 text-sm font-medium shrink-0">No. Permintaan</label>
                <div className="flex-1 relative">
                  <select
                    value={selectedReqId}
                    onChange={(e) => {
                      setSelectedReqId(e.target.value);
                      setQtyInputs({});
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 bg-white appearance-none focus:ring-1 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Pilih permintaan cabang...</option>
                    {pendingRequests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {r.branch.name} (
                        {new Date(r.createdAt).toLocaleDateString("id-ID")})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              {selectedReq && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm font-medium text-blue-800">
                    Kepada: {selectedReq.branch.name}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-right text-gray-500">
                    Tanggal Permintaan:{" "}
                    {new Date(selectedReq.createdAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              )}

              {/* Table 1: Items from selected request */}
              <div className="border border-gray-300 overflow-x-auto rounded">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="border-r border-gray-300 px-3 py-2 w-8 text-center">No.</th>
                      <th className="border-r border-gray-300 px-3 py-2">Nama Barang</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-center">Satuan</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-center">Diminta</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-center">Stok Gudang</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-center">Dikeluarkan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReq ? (
                      selectedReq.items.map((ri, i) => {
                        const stokAda = inventoryMap[ri.item.id] ?? 0;
                        const belumTerpenuhi = ri.quantityRequested - ri.quantityFulfilled;
                        const maxBisa = Math.min(belumTerpenuhi, stokAda);
                        const qty = qtyInputs[ri.id] ?? 0;
                        return (
                          <tr key={ri.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-400">{i + 1}</td>
                            <td className="border-r border-gray-200 px-3 py-2 font-medium">{ri.item.name}</td>
                            <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-500">{ri.item.unit}</td>
                            <td className="border-r border-gray-200 px-3 py-2 text-center font-bold">
                              {belumTerpenuhi}
                              {ri.quantityFulfilled > 0 && (
                                <div className="text-[10px] text-gray-400">(sudah: {ri.quantityFulfilled})</div>
                              )}
                            </td>
                            <td className={`border-r border-gray-200 px-3 py-2 text-center font-bold ${stokAda >= belumTerpenuhi ? "text-green-600" : "text-red-500"}`}>
                              {stokAda.toLocaleString("id-ID")}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-1 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxBisa}
                                value={qty || ""}
                                onChange={(e) =>
                                  setQtyInputs((prev) => ({
                                    ...prev,
                                    [ri.id]: Math.min(
                                      Math.max(0, parseInt(e.target.value) || 0),
                                      maxBisa
                                    ),
                                  }))
                                }
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-center font-bold focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                              {maxBisa === 0 && (
                                <div className="text-[10px] text-red-400">Stok kosong</div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-gray-300 italic text-xs"
                        >
                          Pilih nomor permintaan untuk melihat item yang diminta.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addToDistribution}
                disabled={!selectedReq}
                className="bg-[#003366] text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-900 flex items-center gap-2 disabled:opacity-40"
              >
                <Plus size={16} /> Tambah ke Distribusi
              </button>

              {/* Table 2: Distribution summary */}
              <div className="border border-gray-300 overflow-x-auto rounded">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="border-r border-gray-300 px-3 py-2 w-8 text-center">No.</th>
                      <th className="border-r border-gray-300 px-3 py-2">Cabang</th>
                      <th className="border-r border-gray-300 px-3 py-2">Nama Barang</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-center">Qty</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-center">Satuan</th>
                      <th className="px-3 py-2 text-center">Batal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributed.length > 0 ? (
                      distributed.map((item, i) => (
                        <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-400">{i + 1}</td>
                          <td className="border-r border-gray-200 px-3 py-2 text-xs text-blue-700 font-medium">
                            {item.requestBranch}
                          </td>
                          <td className="border-r border-gray-200 px-3 py-2 font-medium">{item.nama}</td>
                          <td className="border-r border-gray-200 px-3 py-2 text-center font-bold text-blue-700">
                            {item.qty.toLocaleString("id-ID")}
                          </td>
                          <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-500">
                            {item.unit}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeDistribItem(i)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-gray-300 italic text-xs"
                        >
                          Belum ada item distribusi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Success notification */}
              {savedSJ && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm">
                  <CheckCircle size={18} />
                  <div>
                    <strong>Distribusi berhasil disimpan!</strong>
                    <div className="text-xs mt-0.5 font-mono">No. Surat Jalan: {savedSJ}</div>
                    <div className="text-xs text-green-600">Stok gudang telah dikurangi secara otomatis (FIFO).</div>
                  </div>
                  <button
                    onClick={() => setSavedSJ(null)}
                    className="ml-auto text-green-500 hover:text-green-700"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving || distributed.length === 0}
                  className="bg-green-600 text-white px-8 py-2 rounded text-sm font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-40 shadow-sm"
                >
                  <Save size={16} />
                  {saving ? "Menyimpan..." : "Simpan & Proses Distribusi"}
                </button>
                <a
                  href="/dashboard"
                  className="bg-gray-600 text-white px-8 py-2 rounded text-sm font-medium hover:bg-gray-700"
                >
                  Kembali
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
