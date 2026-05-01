"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Send, Package, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

type Item = { id: string; name: string; unit: string; totalStock: number; status: string };
type CartItem = { id: string; name: string; unit: string; qty: number };

export default function BranchRequestPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("Cabang");

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("banksumut_user") ?? "{}");
    const storedBranchName: string = session.branch ?? "";
    setBranchName(storedBranchName);

    // Resolve branchId by name from the branches API
    const init = async () => {
      try {
        const [invRes, branchRes] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/branches"),
        ]);
        if (!invRes.ok || !branchRes.ok) throw new Error("Gagal memuat data.");
        const invData: Item[] = await invRes.json();
        const branches: { id: string; name: string }[] = await branchRes.json();

        setItems(invData.filter((i) => i.totalStock > 0));

        const matched = branches.find(
          (b) => b.name.toLowerCase() === storedBranchName.toLowerCase()
        );
        if (matched) setBranchId(matched.id);
      } catch (e: any) {
        setError(e.message ?? "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: item.id, name: item.name, unit: item.unit, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter((i) => i.qty > 0)
    );
  };

  const handleSubmit = async () => {
    if (!branchId) {
      setError("Cabang Anda tidak ditemukan di database. Hubungi administrator.");
      return;
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          items: cart.map((i) => ({ itemId: i.id, quantityRequested: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Permintaan gagal dikirim.");
      setSuccessId(data.id);
      setCart([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-xl">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Permintaan Terkirim!</h2>
          <p className="text-sm text-gray-500 mb-1">No. Permintaan:</p>
          <p className="font-mono text-xs bg-gray-100 rounded-xl px-4 py-2 mb-6 break-all">{successId}</p>
          <p className="text-xs text-gray-400 mb-6">
            Permintaan Anda akan diproses oleh staf logistik kantor pusat.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSuccessId("")}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Buat Baru
            </button>
            <a
              href="/dashboard"
              className="flex-1 bg-[#003366] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center hover:bg-blue-900 transition-all"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-[#003366] text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="p-2 hover:bg-blue-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </a>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package size={24} /> Permintaan Barang
            </h1>
            <p className="text-blue-200 text-xs">{branchName}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Katalog Barang Tersedia</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <RefreshCw size={20} className="animate-spin" />
              <span className="text-sm">Memuat katalog...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Tidak ada barang yang tersedia saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Satuan: {item.unit} &middot; Stok: {item.totalStock.toLocaleString("id-ID")}
                      </div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-6 text-center">{inCart.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg border border-blue-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Floating cart summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 shadow-2xl rounded-t-[2.5rem] max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <ShoppingCart size={20} className="text-blue-600" /> Ringkasan ({cart.length} jenis)
            </h3>
            <button className="text-xs text-red-500 font-bold uppercase tracking-widest" onClick={() => setCart([])}>
              Bersihkan
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto mb-5 space-y-2 px-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                <span className="flex-1 font-medium truncate">
                  {item.name} <span className="text-gray-400 font-normal">({item.unit})</span>
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Minus size={14} />
                  </button>
                  <span className="font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {submitting ? (
              <><RefreshCw size={18} className="animate-spin" /> Mengirim...</>
            ) : (
              <><Send size={18} /> Kirim Permintaan Sekarang</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
