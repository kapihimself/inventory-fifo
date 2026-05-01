"use client";
import { useState, useEffect } from "react";
import { User, Lock, Mail, Save, ArrowLeft, ShieldCheck, CheckCircle, Calendar, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

type ClosingStatus = { year: number; month: number; isClosed: boolean; closedAt: string | null };

const MONTH_NAMES = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Closing period state
  const [closingStatus, setClosingStatus] = useState<ClosingStatus | null>(null);
  const [closingLoading, setClosingLoading] = useState(true);
  const [closingError, setClosingError] = useState("");
  const [closingSuccess, setClosingSuccess] = useState("");

  // Pre-populate from the session stored at login
  useEffect(() => {
    const raw = localStorage.getItem("banksumut_user");
    if (raw) {
      const u = JSON.parse(raw);
      setName(u.name ?? "");
      setEmail(u.email ?? "");
      setRole(u.role ?? "");
    }
    fetchClosingStatus();
  }, []);

  const fetchClosingStatus = async () => {
    setClosingLoading(true);
    try {
      const res = await fetch("/api/closing");
      const data = await res.json();
      setClosingStatus(data);
    } catch {
      // silent — closing status is non-critical
    } finally {
      setClosingLoading(false);
    }
  };

  const handleToggleClosing = async () => {
    setClosingError("");
    setClosingSuccess("");
    setClosingLoading(true);
    try {
      const res = await fetch("/api/closing", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setClosingError(data.error ?? "Gagal mengubah status periode.");
        return;
      }
      setClosingStatus(data);
      setClosingSuccess(
        data.isClosed
          ? `Periode ${MONTH_NAMES[data.month]} ${data.year} berhasil ditutup.`
          : `Periode ${MONTH_NAMES[data.month]} ${data.year} berhasil dibuka kembali.`
      );
      setTimeout(() => setClosingSuccess(""), 4000);
    } catch {
      setClosingError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setClosingLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    // Update the localStorage session so the sidebar reflects changes instantly
    const raw = localStorage.getItem("banksumut_user");
    if (raw) {
      const u = JSON.parse(raw);
      localStorage.setItem(
        "banksumut_user",
        JSON.stringify({ ...u, name, email })
      );
    }

    setSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex items-start justify-center p-8">
        <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-2xl overflow-hidden">
          <header className="bg-[#003366] text-white p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="p-2 hover:bg-blue-800 rounded-full transition-all">
                <ArrowLeft size={20} />
              </a>
              <h1 className="text-xl font-bold">Pengaturan Profil</h1>
            </div>
            <ShieldCheck size={24} className="opacity-50" />
          </header>

          {saved && (
            <div className="mx-8 mt-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-2xl text-sm font-medium">
              <CheckCircle size={18} /> Perubahan berhasil disimpan.
            </div>
          )}
          {error && (
            <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="p-8 space-y-8">
            <div className="space-y-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
                Informasi Akun
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Pengguna</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
                Keamanan
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Biarkan kosong jika tidak diubah"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-900 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              <Save size={20} /> Simpan Perubahan
            </button>
          </form>

          {/* Closing Period — hanya tampil untuk ADMIN_PUSAT dan STAFF_LOGISTIK */}
          {(role === "ADMIN_PUSAT" || role === "STAFF_LOGISTIK") && (
            <div className="mx-8 mb-8 border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <Calendar size={18} className="text-gray-500" />
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Penutupan Periode
                </h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                {closingLoading && !closingStatus ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin" /> Memuat status...
                  </div>
                ) : closingStatus ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Periode: <span className="font-bold">{MONTH_NAMES[closingStatus.month]} {closingStatus.year}</span>
                        </p>
                        {closingStatus.closedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Ditutup pada: {new Date(closingStatus.closedAt).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          closingStatus.isClosed
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {closingStatus.isClosed ? "Ditutup" : "Terbuka"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleClosing}
                      disabled={closingLoading}
                      className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${
                        closingStatus.isClosed
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {closingLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Calendar size={16} />
                      )}
                      {closingStatus.isClosed ? "Buka Kembali Periode" : "Tutup Periode Bulan Ini"}
                    </button>
                    <p className="text-[11px] text-gray-400">
                      Penutupan periode hanya dapat dilakukan mulai tanggal 25. Setelah ditutup, semua transaksi (permintaan, distribusi, restock) tidak dapat dilakukan.
                    </p>
                  </>
                ) : null}

                {closingError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl">
                    {closingError}
                  </div>
                )}
                {closingSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-xl flex items-center gap-2">
                    <CheckCircle size={14} /> {closingSuccess}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
