"use client";
import { useState, useEffect, useCallback } from "react";
import { Save, Plus, Trash2, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface InventoryItem { id: string; name: string; unit: string; totalStock: number; category: string; }
interface Branch { id: string; name: string; }
interface RequestRow { itemId: string; name: string; unit: string; qty: number; stok: number; }

export default function InventoryRequestPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedNomor, setSavedNomor] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [invRes, branchRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/branches"),
      ]);
      setInventoryItems(await invRes.json());
      const branchData = await branchRes.json();
      setBranches(branchData);
      if (branchData.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchData[1]?.id || branchData[0].id);
      }
    } catch (e) { console.error(e); }
  }, [selectedBranchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addRow = () => {
    if (!selectedItemId || !qty || Number(qty) <= 0) {
      setError("Pilih barang dan isi jumlah yang valid.");
      return;
    }
    const item = inventoryItems.find((i) => i.id === selectedItemId);
    if (!item) return;
    if (rows.find((r) => r.itemId === selectedItemId)) {
      setError("Barang ini sudah ada dalam daftar permintaan.");
      return;
    }
    setError("");
    setRows((prev) => [
      ...prev,
      { itemId: item.id, name: item.name, unit: item.unit, qty: Number(qty), stok: item.totalStock },
    ]);
    setSelectedItemId("");
    setQty("");
  };

  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!selectedBranchId) { setError("Pilih cabang terlebih dahulu."); return; }
    if (rows.length === 0) { setError("Tambahkan minimal 1 barang."); return; }
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranchId,
          items: rows.map((r) => ({ itemId: r.itemId, quantityRequested: r.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      setSavedNomor(data.nomorPermintaan ?? data.id);
      setSaved(true);
      setRows([]);
      setTimeout(() => setSaved(false), 7000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-sm overflow-hidden rounded">
        <div className="bg-[#003366] text-white px-6 py-3 text-base font-semibold">
          Formulir Permintaan Barang Inventori
        </div>

        <div className="p-6 space-y-6">
          {saved && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm">
              <CheckCircle size={18} />
              <div>
                <strong>Permintaan berhasil dikirim!</strong>
                <div className="text-xs font-mono mt-0.5">
                  No. Permintaan: <span className="font-bold text-green-800">{savedNomor}</span> — menunggu diproses oleh Logistik Kantor Pusat.
                </div>
              </div>
              <a href="/dashboard/requests" className="ml-auto text-green-700 font-bold text-xs underline shrink-0">
                Lihat Status
              </a>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Info section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-28 shrink-0">Dari Cabang</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0">Tanggal</label>
              <div className="flex-1 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 text-sm text-gray-500">
                {today}
              </div>
            </div>
          </div>

          {/* Add item form */}
          <div className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="col-span-7">
              <label className="text-xs font-medium text-gray-500 block mb-1">Nama Barang</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Pilih barang...</option>
                {inventoryItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.category}] {i.name} ({i.totalStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="text-xs font-medium text-gray-500 block mb-1">Jumlah Diminta</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min={1}
                placeholder="0"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 font-bold"
                onKeyDown={(e) => e.key === "Enter" && addRow()}
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={addRow}
                className="w-full bg-[#003366] text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-blue-900 flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Tambah
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="border-r border-gray-200 px-3 py-2 text-center w-8">No.</th>
                  <th className="border-r border-gray-200 px-3 py-2">Nama Barang</th>
                  <th className="border-r border-gray-200 px-3 py-2 text-center">Satuan</th>
                  <th className="border-r border-gray-200 px-3 py-2 text-center">Diminta</th>
                  <th className="border-r border-gray-200 px-3 py-2 text-center">Stok Gudang</th>
                  <th className="px-3 py-2 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, i) => (
                    <tr key={row.itemId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-400">{i + 1}</td>
                      <td className="border-r border-gray-200 px-3 py-2 font-medium">{row.name}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-500">{row.unit}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-center font-bold text-blue-700">{row.qty}</td>
                      <td className={`border-r border-gray-200 px-3 py-2 text-center font-bold ${row.stok >= row.qty ? "text-green-600" : "text-red-500"}`}>
                        {row.stok}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-300 italic text-xs">
                      Belum ada item yang ditambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || rows.length === 0}
              className="bg-[#003366] text-white px-8 py-2 rounded text-sm font-medium hover:bg-blue-900 flex items-center gap-2 disabled:opacity-40"
            >
              <Save size={15} />
              {saving ? "Mengirim..." : "Kirim Permintaan"}
            </button>
            <a href="/dashboard" className="bg-gray-500 text-white px-8 py-2 rounded text-sm font-medium hover:bg-gray-600">
              Kembali
            </a>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
