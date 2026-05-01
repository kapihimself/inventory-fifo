"use client";
import { useState, useEffect } from "react";
import { Download, Printer, FileText, ClipboardList, BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import * as XLSX from "xlsx";
import { pdf } from "@react-pdf/renderer";
import { InventoryReportPDF } from "@/components/InventoryReportPDF";
import { ProcurementReportPDF } from "@/components/ProcurementReportPDF";
import { RequestReportPDF } from "@/components/RequestReportPDF";

type ProcurementRow = {
  no: number; tgl: string; batchId: string; itemId: string;
  nama: string; unit: string; category: string; qty: number; price: number; total: number;
};
type RequestRow = {
  id: string; nomorPermintaan: string | null; createdAt: string; branch: { name: string };
  status: string;
  items: { item: { name: string; unit: string }; quantityRequested: number; quantityFulfilled: number }[];
};
type InventoryRow = {
  id: string; name: string; category: string; unit: string;
  totalStock: number; minStock: number; lastPrice: number | null; lastReceivedDate: string | null; status: string;
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("pengadaan");
  const [procurement, setProcurement] = useState<ProcurementRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Month/Year filter — default = current month
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const monthLabel = new Date(filterYear, filterMonth - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const MONTHS = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const formatRp = (v: number) =>
    v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const fetchAll = async (month = filterMonth, year = filterYear) => {
    setLoading(true);
    setError("");
    try {
      const qs = `month=${month}&year=${year}`;
      const [procRes, reqRes, invRes] = await Promise.all([
        fetch(`/api/reports/procurement?${qs}`),
        fetch(`/api/requests?month=${month}&year=${year}`),
        fetch("/api/inventory"),
      ]);
      if (!procRes.ok || !reqRes.ok || !invRes.ok) throw new Error("Gagal memuat data laporan.");
      const [procData, reqData, invData] = await Promise.all([
        procRes.json(),
        reqRes.json(),
        invRes.json(),
      ]);
      setProcurement(procData);
      setRequests(reqData);
      setInventory(invData);
    } catch (e: any) {
      setError(e.message ?? "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  // Refetch when month/year changes
  useEffect(() => { fetchAll(filterMonth, filterYear); }, [filterMonth, filterYear]);

  // Flatten requests into per-item rows for the permintaan table
  const requestRows = requests.flatMap((r, ri) =>
    r.items.map((it, ii) => ({
      no: ri + 1,
      tgl: formatDate(r.createdAt),
      reqId: r.nomorPermintaan ?? r.id.slice(0, 12).toUpperCase(),
      nama: it.item.name,
      unit: it.item.unit,
      by: r.branch.name,
      status: r.status,
      req: it.quantityRequested,
      given: it.quantityFulfilled,
    }))
  );

  const totalStockValue = inventory.reduce((s, i) => s + i.totalStock * (i.lastPrice ?? 0), 0);
  const totalStockQty = inventory.reduce((s, i) => s + i.totalStock, 0);
  const totalProcValue = procurement.reduce((s, r) => s + r.total, 0);

  const exportToPDF = async () => {
    let blob: Blob;
    let filename: string;

    if (activeTab === "pengadaan") {
      const pdfData = procurement.map((r) => ({
        no: r.no, tgl: r.tgl, nama: r.nama, category: r.category,
        unit: r.unit, qty: r.qty, price: r.price, total: r.total,
      }));
      blob = await pdf(<ProcurementReportPDF data={pdfData} />).toBlob();
      filename = `Laporan_Pengadaan_BankSumut_${new Date().toISOString().slice(0, 10)}.pdf`;
    } else if (activeTab === "permintaan") {
      const pdfData = requestRows.map((r, i) => ({
        no: i + 1, tgl: r.tgl, reqId: r.reqId, nama: r.nama,
        unit: r.unit, by: r.by, req: r.req, given: r.given, status: r.status,
      }));
      blob = await pdf(<RequestReportPDF data={pdfData} />).toBlob();
      filename = `Laporan_Permintaan_BankSumut_${new Date().toISOString().slice(0, 10)}.pdf`;
    } else {
      const pdfData = inventory.map((r) => ({
        name: r.name, category: r.category, stock: r.totalStock, unit: r.unit,
        lastReceived: r.lastReceivedDate
          ? new Date(r.lastReceivedDate as string).toLocaleDateString("id-ID")
          : "-",
      }));
      blob = await pdf(<InventoryReportPDF data={pdfData} />).toBlob();
      filename = `Laporan_Inventori_BankSumut_${new Date().toISOString().slice(0, 10)}.pdf`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    let rows: any[] = [];
    let filename = `Laporan_${activeTab}_BankSumut.xlsx`;

    if (activeTab === "pengadaan") {
      rows = procurement.map((r) => ({
        No: r.no, Tanggal: r.tgl, "Nama Barang": r.nama, Kategori: r.category,
        Satuan: r.unit, Qty: r.qty, "Harga (Rp)": r.price, "Jumlah (Rp)": r.total,
      }));
    } else if (activeTab === "permintaan") {
      rows = requestRows.map((r) => ({
        No: r.no, Tanggal: r.tgl, "No. Permintaan": r.reqId, "Nama Barang": r.nama,
        Satuan: r.unit, "Diminta Oleh": r.by, "Jml Diminta": r.req, "Jml Diberikan": r.given,
        Status: r.status,
      }));
    } else {
      rows = inventory.map((r, i) => ({
        No: i + 1, Kategori: r.category, "Nama Barang": r.name, Satuan: r.unit,
        "Stok Saat Ini": r.totalStock, "Stok Minimum": r.minStock,
        "Harga Terakhir (Rp)": r.lastPrice ?? 0, "Nilai Aset (Rp)": r.totalStock * (r.lastPrice ?? 0),
        Status: r.status,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, filename);
  };

  const tabs = [
    { id: "pengadaan", label: "Pengadaan", icon: ClipboardList },
    { id: "permintaan", label: "Permintaan", icon: FileText },
    { id: "rincian", label: "Rincian Stok", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 pt-6 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Laporan Bulanan Inventori</h1>
              <p className="text-xs text-gray-400">Data real-time dari database — periode: <span className="font-semibold text-[#003366]">{monthLabel}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Month/Year Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="text-sm font-semibold text-gray-700 bg-transparent outline-none cursor-pointer"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="text-sm font-semibold text-gray-700 bg-transparent outline-none cursor-pointer"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <Printer size={16} /> Cetak
              </button>
              <button
                onClick={exportToExcel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 disabled:opacity-50"
              >
                <Download size={16} /> Ekspor Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-100 disabled:opacity-50"
              >
                <FileText size={16} /> Ekspor PDF
              </button>
            </div>
          </div>
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#003366] text-[#003366]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 flex-1">
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-8">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold text-gray-900 uppercase">
                Laporan {tabs.find((t) => t.id === activeTab)?.label} Inventori
              </h2>
              <h3 className="text-sm font-bold text-gray-700">PT Bank Pembangunan Daerah Sumatera Utara</h3>
              <p className="text-xs text-gray-500 mt-1">
                Dicetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
                <p className="text-sm">Memuat data dari database...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* ===== PENGADAAN TAB ===== */}
                {activeTab === "pengadaan" && (
                  <>
                    <table className="w-full text-[11px] border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          {["No", "Tanggal", "Nama Barang", "Kategori", "Satuan", "Qty", "Harga (Rp)", "Jumlah (Rp)"].map((h) => (
                            <th key={h} className="border border-gray-300 p-2 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {procurement.length === 0 ? (
                          <tr><td colSpan={8} className="border p-8 text-center text-gray-400">Belum ada data pengadaan.</td></tr>
                        ) : (
                          procurement.map((r) => (
                            <tr key={r.batchId} className="hover:bg-gray-50">
                              <td className="border p-2 text-center">{r.no}</td>
                              <td className="border p-2">{formatDate(r.tgl)}</td>
                              <td className="border p-2 font-medium">{r.nama}</td>
                              <td className="border p-2 text-gray-500">{r.category}</td>
                              <td className="border p-2 text-center">{r.unit}</td>
                              <td className="border p-2 text-right font-bold">{r.qty.toLocaleString("id-ID")}</td>
                              <td className="border p-2 text-right">{r.price > 0 ? formatRp(r.price) : "-"}</td>
                              <td className="border p-2 text-right font-bold text-blue-900">{r.total > 0 ? formatRp(r.total) : "-"}</td>
                            </tr>
                          ))
                        )}
                        {procurement.length > 0 && (
                          <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                            <td colSpan={5} className="border border-gray-300 p-3 text-right text-blue-800 uppercase tracking-wide">
                              Total Nilai Pengadaan
                            </td>
                            <td className="border border-gray-300 p-3 text-right">
                              {procurement.reduce((s, r) => s + r.qty, 0).toLocaleString("id-ID")}
                            </td>
                            <td className="border border-gray-300 p-3" />
                            <td className="border border-gray-300 p-3 text-right text-blue-900">
                              Rp {formatRp(totalProcValue)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}

                {/* ===== PERMINTAAN TAB ===== */}
                {activeTab === "permintaan" && (
                  <table className="w-full text-[11px] border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {["No", "Tanggal", "No. Permintaan", "Nama Barang", "Satuan", "Diminta Oleh", "Jml Diminta", "Jml Dipenuhi", "Status"].map((h) => (
                          <th key={h} className="border border-gray-300 p-2 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requestRows.length === 0 ? (
                        <tr><td colSpan={9} className="border p-8 text-center text-gray-400">Belum ada data permintaan.</td></tr>
                      ) : (
                        requestRows.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border p-2 text-center">{r.no}</td>
                            <td className="border p-2">{r.tgl}</td>
                            <td className="border p-2 font-mono text-xs">{r.reqId}</td>
                            <td className="border p-2 font-medium">{r.nama}</td>
                            <td className="border p-2 text-center">{r.unit}</td>
                            <td className="border p-2 text-gray-600">{r.by}</td>
                            <td className="border p-2 text-right">{r.req}</td>
                            <td className="border p-2 text-right font-bold">{r.given}</td>
                            <td className="border p-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                r.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                r.status === "PARTIAL" ? "bg-blue-100 text-blue-700" :
                                "bg-red-100 text-red-600"
                              }`}>{r.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* ===== RINCIAN STOK TAB ===== */}
                {activeTab === "rincian" && (
                  <table className="w-full text-[11px] border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {["No", "Kategori", "Nama Barang", "Satuan", "Stok Saat Ini", "Stok Min", "Harga Terakhir (Rp)", "Nilai Aset (Rp)", "Status"].map((h) => (
                          <th key={h} className="border border-gray-300 p-2 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.length === 0 ? (
                        <tr><td colSpan={9} className="border p-8 text-center text-gray-400">Belum ada data inventori.</td></tr>
                      ) : (
                        inventory.map((r, i) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="border p-2 text-center">{i + 1}</td>
                            <td className="border p-2 font-bold text-blue-700">{r.category}</td>
                            <td className="border p-2 font-medium">{r.name}</td>
                            <td className="border p-2 text-center">{r.unit}</td>
                            <td className="border p-2 text-right font-bold">{r.totalStock.toLocaleString("id-ID")}</td>
                            <td className="border p-2 text-right text-gray-500">{r.minStock}</td>
                            <td className="border p-2 text-right">{r.lastPrice ? formatRp(r.lastPrice) : "-"}</td>
                            <td className="border p-2 text-right font-bold text-blue-900">
                              {r.lastPrice ? formatRp(r.totalStock * r.lastPrice) : "-"}
                            </td>
                            <td className="border p-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === "Tersedia" ? "bg-green-100 text-green-700" :
                                r.status === "Hampir Habis" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-600"
                              }`}>{r.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                      {inventory.length > 0 && (
                        <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                          <td colSpan={4} className="border border-gray-300 p-3 text-right text-blue-800 uppercase tracking-wide">
                            Total Nilai Aset Inventori
                          </td>
                          <td className="border border-gray-300 p-3 text-right text-blue-900">
                            {totalStockQty.toLocaleString("id-ID")}
                          </td>
                          <td className="border border-gray-300 p-3" />
                          <td className="border border-gray-300 p-3" />
                          <td className="border border-gray-300 p-3 text-right text-blue-900">
                            Rp {formatRp(totalStockValue)}
                          </td>
                          <td className="border border-gray-300 p-3" />
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Signature block */}
            {!loading && (
              <div className="flex justify-between mt-16 px-10 print:mt-24">
                <div className="text-center text-[10px] space-y-12">
                  <div>Mengetahui,<br /><span className="font-bold">PIMPINAN DIVISI UMUM</span></div>
                  <div className="border-t border-black pt-1 px-8">( ________________________ )</div>
                </div>
                <div className="text-center text-[10px] space-y-12">
                  <div>Dibuat oleh,<br /><span className="font-bold">STAF LOGISTIK</span></div>
                  <div className="border-t border-black pt-1 px-8">( ________________________ )</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
