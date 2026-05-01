"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, PlusCircle, ArrowLeft, Calendar, Tag, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface InventoryItem { id: string; name: string; unit: string; totalStock: number; category: string; }

export default function RestockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data);

      // Pre-select from query param ?id=
      const urlParams = new URLSearchParams(window.location.search);
      const preId = urlParams.get("id");
      if (preId) setSelectedId(preId);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const selectedItem = items.find((i) => i.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) { setError("Pilih barang terlebih dahulu."); return; }
    if (!qty || Number(qty) <= 0) { setError("Jumlah stok harus lebih dari 0."); return; }
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/inventory/${selectedId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(qty),
          price: price ? Number(price) : undefined,
          receivedDate: date || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      setSaved(true);
      setQty("");
      setPrice("");
      setDate(new Date().toISOString().slice(0, 10));
      await fetchItems();
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
              <h1 className="text-xl font-bold">Tambah Stok (Restock)</h1>
            </div>
            <Package size={24} className="opacity-50" />
          </header>

          {saved && (
            <div className="mx-8 mt-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-2xl font-medium text-sm">
              <CheckCircle size={18} />
              Stok berhasil ditambahkan!{" "}
              {selectedItem && (
                <span className="font-normal">
                  {selectedItem.name} — stok baru tercatat.
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div className="p-8 space-y-6">
            {/* Pilih Barang */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Pilih Barang *</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">— Pilih barang —</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.category}] {item.name} (stok: {item.totalStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedItem && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm">
                <div className="font-bold text-blue-800">{selectedItem.name}</div>
                <div className="text-blue-600 mt-1">
                  Stok saat ini: <strong>{selectedItem.totalStock} {selectedItem.unit}</strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Jumlah Masuk *</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  min={1}
                  className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Harga Satuan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Tanggal Terima</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {qty && selectedItem && (
              <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Stok sekarang</span>
                  <span className="font-bold">{selectedItem.totalStock} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Ditambah</span>
                  <span className="font-bold">+{qty} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between text-blue-700 border-t pt-2 font-bold">
                  <span>Stok setelah restock</span>
                  <span>{selectedItem.totalStock + Number(qty)} {selectedItem.unit}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-100"
            >
              <PlusCircle size={20} />
              {saving ? "Menyimpan..." : "Simpan ke Inventaris"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
