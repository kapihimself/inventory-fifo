"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, ArrowUpRight, ArrowDownRight, Search, Bell, FileText, X, Printer, AlertTriangle, Truck, ClipboardList, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Distribution {
  id: string;
  suratJalanNumber: string;
  branch: string;
  itemCount: number;
  status: string;
  createdAt: string;
  items: { nama: string; unit: string; qty: number; harga: number }[];
}

interface Stats {
  totalATK: number;
  totalForm: number;
  pendingRequests: number;
  inTransit: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalItems: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [selectedSJ, setSelectedSJ] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const formatRp = (v: number) =>
    "Rp " + v.toLocaleString("id-ID");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, distRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/distributions?limit=10"),
      ]);
      const statsData = await statsRes.json();
      const distData = await distRes.json();
      setStats(statsData);
      setDistributions(distData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const printSJ = () => {
    if (!selectedSJ) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const total = selectedSJ.items.reduce((s, i) => s + i.qty * i.harga, 0);
    const tgl = new Date(selectedSJ.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
    });
    printWin.document.write(`<html><head><title>Surat Jalan ${selectedSJ.suratJalanNumber}</title>
    <style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #333;padding:8px;font-size:12px}th{background:#eee}.header{text-align:center;margin-bottom:30px}.sig{display:flex;justify-content:space-between;margin-top:60px;text-align:center;font-size:11px}</style>
    </head><body>`);
    printWin.document.write(`<div class="header"><h2>SURAT JALAN</h2><h3>PT Bank Pembangunan Daerah Sumatera Utara</h3><p>No: ${selectedSJ.suratJalanNumber} | Tanggal: ${tgl}</p><p>Kepada: ${selectedSJ.branch}</p></div>`);
    printWin.document.write(`<table><thead><tr><th>No</th><th>Nama Barang</th><th>Satuan</th><th>Qty</th><th>Harga Satuan</th><th>Jumlah</th></tr></thead><tbody>`);
    selectedSJ.items.forEach((item, i) => {
      printWin.document.write(`<tr><td style="text-align:center">${i + 1}</td><td>${item.nama}</td><td style="text-align:center">${item.unit}</td><td style="text-align:right">${item.qty}</td><td style="text-align:right">${formatRp(item.harga)}</td><td style="text-align:right;font-weight:bold">${formatRp(item.qty * item.harga)}</td></tr>`);
    });
    printWin.document.write(`<tr><td colspan="5" style="text-align:right;font-weight:bold">TOTAL</td><td style="text-align:right;font-weight:bold">${formatRp(total)}</td></tr></tbody></table>`);
    printWin.document.write(`<div class="sig"><div><p>Disiapkan Oleh,</p><br/><br/><br/><p>( _____________ )</p><p>Logistik Kantor Pusat</p></div><div><p>Diterima Oleh,</p><br/><br/><br/><p>( _____________ )</p><p>${selectedSJ.branch}</p></div></div></body></html>`);
    printWin.document.close();
    printWin.print();
  };

  const filtered = distributions.filter((d) =>
    d.suratJalanNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.branch.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = stats
    ? [
        {
          label: "Total Stok ATK",
          value: stats.totalATK.toLocaleString("id-ID"),
          sub: `${stats.totalItems} jenis barang`,
          icon: <Package size={20} className="text-blue-600" />,
          bg: "bg-blue-50",
          link: "/inventory",
        },
        {
          label: "Total Stok Form",
          value: stats.totalForm.toLocaleString("id-ID"),
          sub: "Form & dokumen perbankan",
          icon: <FileText size={20} className="text-purple-600" />,
          bg: "bg-purple-50",
          link: "/inventory",
        },
        {
          label: "Permintaan Pending",
          value: stats.pendingRequests.toString(),
          sub: "Menunggu diproses",
          icon: <ClipboardList size={20} className="text-orange-600" />,
          bg: "bg-orange-50",
          link: "/dashboard/requests",
        },
        {
          label: "Dalam Pengiriman",
          value: stats.inTransit.toString(),
          sub: `${stats.lowStockItems} item hampir habis`,
          icon: <Truck size={20} className="text-green-600" />,
          bg: "bg-green-50",
          link: "/dashboard/batch",
        },
      ]
    : [];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">Ringkasan Inventaris</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari surat jalan / cabang..."
                className="pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              />
            </div>
            <button
              onClick={fetchData}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <Bell size={18} />
              {stats && stats.pendingRequests > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Alert: stok habis */}
          {stats && (stats.outOfStockItems > 0 || stats.lowStockItems > 0) && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-amber-800 text-sm">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <span>
                <strong>{stats.outOfStockItems} barang habis</strong> dan{" "}
                <strong>{stats.lowStockItems} barang hampir habis</strong> — segera lakukan restock.
              </span>
              <a href="/inventory" className="ml-auto text-amber-700 font-bold hover:underline shrink-0">
                Lihat Detail
              </a>
            </div>
          )}

          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, i) => (
                <a
                  key={i}
                  href={stat.link}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    {stat.icon}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
                </a>
              ))}
            </div>
          )}

          {/* Recent Distributions Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Distribusi Terbaru</h2>
              <a href="/dashboard/batch" className="text-blue-600 text-sm font-semibold hover:underline">
                Proses Distribusi →
              </a>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Memuat data...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {search ? "Tidak ada hasil pencarian." : "Belum ada distribusi."}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">No. Surat Jalan</th>
                    <th className="px-6 py-4">Cabang Tujuan</th>
                    <th className="px-6 py-4">Jenis Barang</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedSJ(row)}
                          className="font-mono text-xs text-blue-600 font-bold hover:underline"
                        >
                          {row.suratJalanNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.branch}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.itemCount} jenis</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                        {new Date(row.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            row.status === "SHIPPED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {row.status === "SHIPPED" ? "Dikirim" : "Diterima"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedSJ(row)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 font-bold text-xs"
                        >
                          <Printer size={13} /> CETAK SJ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Surat Jalan Detail */}
      {selectedSJ && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSJ(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Detail Surat Jalan</h2>
                <p className="text-xs text-gray-400 font-mono">{selectedSJ.suratJalanNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printSJ}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold hover:bg-blue-900"
                >
                  <Printer size={16} /> Cetak Surat Jalan
                </button>
                <button onClick={() => setSelectedSJ(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 text-xs">Cabang Tujuan</span>
                  <div className="font-bold text-gray-900">{selectedSJ.branch}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 text-xs">Tanggal</span>
                  <div className="font-bold text-gray-900">
                    {new Date(selectedSJ.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 text-xs">Status</span>
                  <div className={`font-bold ${selectedSJ.status === "SHIPPED" ? "text-blue-600" : "text-green-600"}`}>
                    {selectedSJ.status === "SHIPPED" ? "Dikirim" : "Diterima"}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 text-xs">Total Jenis Barang</span>
                  <div className="font-bold text-gray-900">{selectedSJ.items.length} jenis</div>
                </div>
              </div>

              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-center w-8">No</th>
                    <th className="border border-gray-300 px-3 py-2">Nama Barang</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Satuan</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Harga Satuan</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSJ.items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-center">{i + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 font-medium">{item.nama}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{item.unit}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold">{item.qty}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{formatRp(item.harga)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                        {formatRp(item.qty * item.harga)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={5} className="border border-gray-300 px-3 py-2 text-right">TOTAL</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-blue-900">
                      {formatRp(selectedSJ.items.reduce((s, i) => s + i.qty * i.harga, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
