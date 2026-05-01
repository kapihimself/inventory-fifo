"use client";
import { useState } from "react";
import { Package, Save, ArrowLeft, Layers, Ruler, AlertCircle, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function NewItemPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ATK");
  const [unit, setUnit] = useState("Pcs");
  const [minStock, setMinStock] = useState("");
  const [initialQty, setInitialQty] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !unit.trim()) {
      setError("Nama barang dan satuan wajib diisi.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryName: category,
          unit: unit.trim(),
          minStock: Number(minStock) || 0,
          initialQty: initialQty ? Number(initialQty) : undefined,
          price: price ? Number(price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      setSaved(true);
      setName("");
      setUnit("Pcs");
      setMinStock("");
      setInitialQty("");
      setPrice("");
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex items-start justify-center p-8">
        <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-2xl overflow-hidden">
          <header className="bg-[#003366] text-white p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/inventory" className="p-2 hover:bg-blue-800 rounded-full transition-all">
                <ArrowLeft size={20} />
              </a>
              <h1 className="text-xl font-bold">Daftarkan Barang Baru</h1>
            </div>
            <Package size={24} className="opacity-50" />
          </header>

          {saved && (
            <div className="mx-8 mt-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-2xl font-medium text-sm">
              <CheckCircle size={18} /> Barang berhasil didaftarkan!{" "}
              <a href="/inventory" className="ml-auto font-bold underline">Lihat Inventaris</a>
            </div>
          )}

          {error && (
            <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Nama Barang / Formulir *</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth: Kertas A4 80gr Sinar Dunia"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Kategori</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="ATK">ATK</option>
                    <option value="Form">Form</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Satuan *</label>
                <div className="relative">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    {["Pcs", "Rim", "Lusin", "Kotak", "Pack", "Roll", "Botol", "Lembar", "Buku", "Pad", "Set"].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Stok Minimum (batas peringatan)</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-600 mb-4">Stok Awal (opsional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Jumlah Stok Awal</label>
                  <input
                    type="number"
                    value={initialQty}
                    onChange={(e) => setInitialQty(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Harga Beli / Satuan (Rp)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-100"
            >
              <Save size={20} />
              {saving ? "Menyimpan..." : "Simpan Data Barang"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
