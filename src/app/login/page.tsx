"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Credentials are validated server-side — nothing sensitive lives in this bundle
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Email atau kata sandi salah.');
        return;
      }

      // Store non-sensitive session info in localStorage for sidebar/role-gating.
      // Actual authoritative checks happen server-side on each API call.
      localStorage.setItem('banksumut_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Tidak dapat terhubung ke server. Coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003366] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-200 flex items-center justify-center text-white font-bold text-2xl">
              BS
            </div>
            <h1 className="text-2xl font-bold text-[#003366]">Bank <span className="text-orange-500">Sumut</span></h1>
            <p className="text-gray-400 text-sm">Sistem Informasi Inventaris</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: adminsumut@gmail.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-900 transition-all group disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a href="#" className="text-sm text-gray-400 hover:text-blue-600 block">Lupa kata sandi?</a>
            <div>
              <span className="text-sm text-gray-400">Belum punya akun? </span>
              <a href="/register" className="text-sm text-blue-600 font-bold hover:underline">Daftar di sini</a>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 text-center text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-100">
          PT Bank Pembangunan Daerah Sumatera Utara
        </div>
      </div>
    </div>
  );
}
