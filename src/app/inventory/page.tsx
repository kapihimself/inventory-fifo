"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, FileText, Table as TableIcon, X, ArrowDownCircle, ArrowUpCircle, RefreshCw, History, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import Sidebar from "@/components/Sidebar";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  totalStock: number;
  lastReceivedDate: string | null;
  lastPrice: number | null;
  status: "Tersedia" | "Hampir Habis" | "Habis";
}

interface BatchInfo {
  id: string;
  receivedDate: string;
  initialQuantity: number;
  currentQuantity: number;
  price: number | null;
  used: number;
}

interface TimelineEntry {
  type: "MASUK" | "KELUAR";
  date: string;
  qty: number;
  price: number | null;
  batchId: string;
  batchInitial: number;
  description: string;
  suratJalan?: string;
  branch?: string;
  runningStock: number;
}

interface ItemHistory {
  item: {
    id: string;
    name: string;
    category: string;
    unit: string;
    minStock: number;
    totalStock: number;
  };
  batches: BatchInfo[];
  timeline: TimelineEntry[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterStock, setFilterStock] = useState("Semua");

  // History modal
  const [historyItem, setHistoryItem] = useState<ItemHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit modal
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinStock, setEditMinStock] = useState(0);
  const [editUnit, setEditUnit] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const formatRp = (v: number) => "Rp " + v.toLocaleString("id-ID");
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openHistory = async (item: InventoryItem) => {
    setHistoryLoading(true);
    setHistoryItem(null);
    try {
      const res = await fetch(`/api/inventory/${item.id}/history`);
      const data = await res.json();
      setHistoryItem(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditMinStock(item.minStock);
    setEditUnit(item.unit);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/inventory/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, minStock: editMinStock, unit: editUnit }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditItem(null);
      await fetchItems();
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const deleteItem = async (item: InventoryItem) => {
    if (!confirm(`Hapus barang "${item.name}"? Ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      await fetchItems();
    } catch (e: any) {
      alert("Gagal menghapus: " + e.message);
    }
  };

  const filteredData = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "Semua" || item.category === filterCategory;
    const matchStock = filterStock === "Semua" || item.status === filterStock;
    return matchSearch && matchCat && matchStock;
  });

  const exportExcel = () => {
    const rows = filteredData.map((i) => ({
      "Nama Barang": i.name,
      Kategori: i.category,
      Satuan: i.unit,
      "Stok Saat Ini": i.totalStock,
      "Stok Minimum": i.minStock,
      Status: i.status,
      "Terima Terakhir": i.lastReceivedDate ? formatDate(i.lastReceivedDate) : "-",
      "Harga Terakhir": i.lastPrice ?? "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventaris");
    XLSX.writeFile(wb, `Inventaris_BankSumut_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">Manajemen Inventaris</h1>
          <div className="flex gap-2">
            <a
              href="/inventory/new"
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50"
            >
              <Plus size={16} /> Barang Baru
            </a>
            <a
              href="/inventory/restock"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
            >
              <Plus size={16} /> Tambah Stok
            </a>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm font-bold hover:bg-green-50"
            >
              <TableIcon size={16} /> Excel
            </button>
            <button
              onClick={fetchItems}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama barang..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="ATK">ATK</option>
              <option value="Form">Form</option>
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Hampir Habis">Hampir Habis</option>
              <option value="Habis">Habis</option>
            </select>
            <div className="text-xs text-gray-400">{filteredData.length} item</div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Memuat data inventaris...</div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Tidak ada barang ditemukan.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-4">Nama Barang</th>
                    <th className="px-5 py-4">Kategori</th>
                    <th className="px-5 py-4 text-center">Terima Terakhir</th>
                    <th className="px-5 py-4 text-center">
                      <span title="Klik angka stok untuk lihat riwayat">Stok ▸ Riwayat</span>
                    </th>
                    <th className="px-5 py-4 text-center">Satuan</th>
                    <th className="px-5 py-4 text-center">Min</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.category === "ATK" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-gray-400 text-xs font-mono">
                        {item.lastReceivedDate ? formatDate(item.lastReceivedDate) : "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => openHistory(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm transition-colors group"
                          title="Klik untuk lihat riwayat transaksi"
                        >
                          <History size={14} className="group-hover:rotate-12 transition-transform" />
                          {item.totalStock.toLocaleString("id-ID")}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-center text-gray-500">{item.unit}</td>
                      <td className="px-5 py-4 text-center text-gray-400">{item.minStock}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          item.status === "Tersedia"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Hampir Habis"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit barang"
                          >
                            <Pencil size={14} />
                          </button>
                          <a
                            href={`/inventory/restock?id=${item.id}`}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Tambah stok"
                          >
                            <Plus size={14} />
                          </a>
                          <button
                            onClick={() => deleteItem(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus barang"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ── MODAL: Riwayat Transaksi ── */}
      {(historyLoading || historyItem) && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setHistoryItem(null); setHistoryLoading(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {historyLoading ? (
              <div className="p-12 text-center text-gray-400">Memuat riwayat...</div>
            ) : historyItem ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{historyItem.item.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{historyItem.item.category} • {historyItem.item.unit}</span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Stok saat ini: {historyItem.item.totalStock.toLocaleString("id-ID")} {historyItem.item.unit}
                      </span>
                      {historyItem.item.totalStock <= historyItem.item.minStock && (
                        <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                          ⚠ Di bawah minimum ({historyItem.item.minStock})
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setHistoryItem(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Ringkasan Batch */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Rincian Batch Stok</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {historyItem.batches.map((b, i) => (
                        <div key={b.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-700">Batch #{i + 1}</span>
                            <span className="text-xs font-mono text-gray-400">{formatDate(b.receivedDate)}</span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Diterima:</span>
                              <span className="font-bold text-green-600">+{b.initialQuantity.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Terpakai:</span>
                              <span className="font-bold text-red-500">-{b.used.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 mt-1">
                              <span>Sisa:</span>
                              <span className={`font-bold ${b.currentQuantity > 0 ? "text-blue-600" : "text-gray-400"}`}>
                                {b.currentQuantity.toLocaleString("id-ID")} {b.currentQuantity === 0 ? "(Habis)" : ""}
                              </span>
                            </div>
                            {b.price && (
                              <div className="flex justify-between text-gray-400">
                                <span>Harga beli:</span>
                                <span>{formatRp(b.price)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Transaksi */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">
                      Riwayat Transaksi ({historyItem.timeline.length} transaksi)
                    </h3>
                    {historyItem.timeline.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Belum ada transaksi.</p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase">
                            <tr>
                              <th className="px-4 py-3 text-center w-20">Tipe</th>
                              <th className="px-4 py-3">Tanggal</th>
                              <th className="px-4 py-3">Keterangan</th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3 text-center">Stok Berjalan</th>
                              <th className="px-4 py-3 text-right">Harga/Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyItem.timeline.map((t, i) => (
                              <tr
                                key={i}
                                className={`${t.type === "MASUK" ? "bg-green-50/40" : "bg-red-50/30"} hover:bg-gray-50`}
                              >
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] ${
                                    t.type === "MASUK"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}>
                                    {t.type === "MASUK"
                                      ? <ArrowDownCircle size={10} />
                                      : <ArrowUpCircle size={10} />}
                                    {t.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-500">
                                  {formatDate(t.date)}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  <div>{t.description}</div>
                                  {t.suratJalan && (
                                    <div className="text-gray-400 font-mono text-[10px]">{t.suratJalan}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-bold">
                                  <span className={t.type === "MASUK" ? "text-green-600" : "text-red-600"}>
                                    {t.type === "MASUK" ? "+" : "-"}{t.qty.toLocaleString("id-ID")}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gray-700">
                                  {t.runningStock.toLocaleString("id-ID")}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-400">
                                  {t.price ? formatRp(t.price) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Barang ── */}
      {editItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Edit Barang</h2>
              <button onClick={() => setEditItem(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nama Barang</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Satuan</label>
                <input
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Stok Minimum</label>
                <input
                  type="number"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button
                onClick={() => setEditItem(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
