"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  totalStock: number;
};

type ProcurementRow = {
  no: number;
  itemId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
};

const VENDORS = [
  "PT. Gramedia Medan",
  "Toko Buku & ATK \"Medan Jaya\"",
  "CV. Bersama Logistik ATK Medan",
  "Global Stationery Medan",
];

export default function ProcurementPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<InventoryItem[]>([]);
  const [rows, setRows] = useState<ProcurementRow[]>([]);

  // form entry state
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  // footer form state
  const [vendor, setVendor] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [includePPN, setIncludePPN] = useState(false);
  const [suratIzinFile, setSuratIzinFile] = useState<File | null>(null);
  const [suratIzinUrl, setSuratIzinUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // save state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successNomor, setSuccessNomor] = useState("");

  // Generated number display
  const nomorDisplay = successNomor || "(otomatis)";
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data: InventoryItem[]) => setCatalog(data))
      .catch(() => {});
  }, []);

  // Role guard: only ADMIN_PUSAT and STAFF_LOGISTIK may access this page
  useEffect(() => {
    const raw = localStorage.getItem("banksumut_user");
    if (!raw) { router.replace("/dashboard"); return; }
    const u = JSON.parse(raw);
    if (u.role !== "ADMIN_PUSAT" && u.role !== "STAFF_LOGISTIK") {
      router.replace("/dashboard");
    }
  }, [router]);

  const selectedItem = catalog.find((i) => i.id === selectedItemId);

  const addRow = () => {
    if (!selectedItemId || !qty || !price) return;
    const qtyNum = parseInt(qty, 10);
    const priceNum = parseFloat(price);
    if (!selectedItem || qtyNum <= 0 || priceNum < 0) return;

    const newRow: ProcurementRow = {
      no: rows.length + 1,
      itemId: selectedItemId,
      name: selectedItem.name,
      unit: selectedItem.unit,
      qty: qtyNum,
      price: priceNum,
      total: qtyNum * priceNum,
    };
    setRows([...rows, newRow]);
    setSelectedItemId("");
    setQty("");
    setPrice("");
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 })));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSuratIzinFile(file);
    setSuratIzinUrl("");
    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah file.");
      setSuratIzinUrl(data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Gagal mengunggah file.");
      setSuratIzinFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    if (rows.length === 0) {
      setError("Tambah minimal 1 item sebelum menyimpan.");
      return;
    }
    if (!vendor) {
      setError("Nama vendor wajib dipilih.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        vendor,
        items: rows.map((r) => ({
          itemId: r.itemId,
          nama: r.name,
          qty: r.qty,
          price: r.price,
          unit: r.unit,
        })),
        includePPN,
        keterangan: keterangan.trim() || undefined,
        suratIzinUrl: suratIzinUrl || undefined,
      };

      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan pengadaan.");
        return;
      }

      setSuccessNomor(data.nomorPengadaan);
      setRows([]);
      setVendor("");
      setKeterangan("");
      setIncludePPN(false);
      setSuratIzinFile(null);
      setSuratIzinUrl("");
      alert(`Pengadaan berhasil disimpan dengan No. ${data.nomorPengadaan}`);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white border border-gray-300 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#4a86e8] text-white px-4 py-2 text-lg font-medium border-b border-gray-400">
          Pengadaan Barang Inventori
        </div>

        <div className="p-6 space-y-6">
          {/* Entry Form */}
          <div className="space-y-4 border-b pb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-2 text-sm font-medium">Nama Barang *</label>
              <div className="md:col-span-10 relative">
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-white appearance-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pilih Barang...</option>
                  {catalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-2 text-sm font-medium">Quantity *</label>
              <div className="md:col-span-4">
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-6">
                <div className="bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-gray-500">
                  {selectedItem?.unit ?? "Satuan *"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-2 text-sm font-medium">Harga Satuan *</label>
              <div className="md:col-span-10 flex">
                <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l px-3 py-1.5 text-gray-500">
                  Rp.
                </span>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-r px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={addRow}
                className="bg-[#4a86e8] text-white px-6 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors active:scale-95"
              >
                Tambah
              </button>
              <span className="text-xs text-gray-500 italic">* Data tidak boleh kosong</span>
            </div>
          </div>

          {/* Info Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50 p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">No. Pengadaan *</label>
              <input
                type="text"
                value={nomorDisplay}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-100 text-gray-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={today}
                readOnly
                className="w-40 border border-gray-300 rounded px-3 py-1.5 bg-gray-100 text-gray-600 text-center"
              />
              <label className="text-sm font-medium">* Tanggal</label>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-300 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 border-r border-gray-300 w-12 text-center">No.</th>
                  <th className="px-4 py-2 border-r border-gray-300">Nama Barang</th>
                  <th className="px-4 py-2 border-r border-gray-300 w-20 text-center">Satuan</th>
                  <th className="px-4 py-2 border-r border-gray-300 w-24 text-center">Quantity</th>
                  <th className="px-4 py-2 border-r border-gray-300 w-32 text-center">Harga</th>
                  <th className="px-4 py-2 border-r border-gray-300 w-32 text-center">Jumlah</th>
                  <th className="px-4 py-2 text-center w-20">Hapus</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-300">
                      <td className="px-4 py-2 border-r border-gray-300 text-center">{row.no}</td>
                      <td className="px-4 py-2 border-r border-gray-300">{row.name}</td>
                      <td className="px-4 py-2 border-r border-gray-300 text-center">{row.unit}</td>
                      <td className="px-4 py-2 border-r border-gray-300 text-center">{row.qty}</td>
                      <td className="px-4 py-2 border-r border-gray-300 text-right">
                        Rp. {row.price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-300 text-right font-bold">
                        Rp. {row.total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeRow(i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="h-10 border-b border-gray-300">
                    <td colSpan={7} className="text-center text-gray-300 italic text-xs">
                      Belum ada item pengadaan.
                    </td>
                  </tr>
                )}
                <tr className="border-b border-gray-300 h-10 bg-gray-50">
                  <td colSpan={5} className="px-4 py-2 border-r border-gray-300 text-right font-bold">
                    Total
                  </td>
                  <td className="px-4 py-2 border-r border-gray-300 text-right font-bold text-blue-700">
                    Rp. {grandTotal.toLocaleString("id-ID")}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="w-32 text-sm font-medium">Vendor *</label>
                <div className="flex-1 relative">
                  <select
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 appearance-none bg-white"
                  >
                    <option value="">Pilih Vendor...</option>
                    {VENDORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <label className="w-32 text-sm font-medium pt-1">Keterangan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 h-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="w-32 text-sm font-medium">Include PPN *</label>
                <div className="flex-1 relative">
                  <select
                    value={includePPN ? "Ya" : "Tidak"}
                    onChange={(e) => setIncludePPN(e.target.value === "Ya")}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 appearance-none"
                  >
                    <option>Tidak</option>
                    <option>Ya</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded p-1 overflow-hidden">
                  <label className="px-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                    Surat Izin Pengadaan BBC / SB ***
                  </label>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-xs cursor-pointer transition-colors"
                    >
                      {uploading ? "Uploading..." : "Browse..."}
                    </label>
                    <span className="text-xs truncate max-w-[150px]">
                      {uploading ? (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Loader2 size={12} className="animate-spin" /> Mengunggah...
                        </span>
                      ) : suratIzinFile ? (
                        <span className="text-blue-600 font-medium">{suratIzinFile.name}</span>
                      ) : (
                        <span className="text-gray-400">No file selected.</span>
                      )}
                    </span>
                  </div>
                  <span className="px-3 text-[10px] text-gray-400">File PDF, Max 50 MB</span>
                </div>
                {uploadError && (
                  <p className="text-red-500 text-xs mt-1">{uploadError}</p>
                )}
                {suratIzinUrl && !uploadError && (
                  <p className="text-green-600 text-xs mt-1">File berhasil diunggah.</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4a86e8] text-white px-8 py-2 rounded text-sm font-medium shadow-sm hover:bg-blue-600 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <a
              href="/dashboard"
              className="bg-[#d9534f] text-white px-8 py-2 rounded text-sm font-medium shadow-sm hover:bg-red-600 transition-all"
            >
              Kembali
            </a>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
