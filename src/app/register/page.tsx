"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, User, Building, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !branch) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    // Simpan user baru ke localStorage (simulasi)
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newUser = {
      name,
      email,
      role: 'KARYAWAN_UMUM',
      branch,
      initials,
    };

    // Simpan daftar users
    const existingUsers = JSON.parse(localStorage.getItem('banksumut_users') || '[]');
    const duplicate = existingUsers.find((u: any) => u.email === email);
    if (duplicate) {
      setError('Email sudah terdaftar. Gunakan email lain.');
      return;
    }

    existingUsers.push({ ...newUser, password });
    localStorage.setItem('banksumut_users', JSON.stringify(existingUsers));

    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-[#003366] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-200 flex items-center justify-center text-white font-bold text-2xl">
              BS
            </div>
            <h1 className="text-2xl font-bold text-[#003366]">Daftar <span className="text-orange-500">Akun Baru</span></h1>
            <p className="text-gray-400 text-sm mt-1">Sistem Informasi Inventaris Bank Sumut</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-2xl text-sm font-medium">
              <CheckCircle size={18} /> Akun berhasil dibuat! Mengalihkan ke halaman login...
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Ahmad Faisal"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contoh@banksumut.co.id"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Cabang</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={branch} onChange={e => setBranch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none appearance-none" required>
                  <option value="">Pilih Cabang...</option>
                  <option>Kantor Pusat Medan</option>
                  <option>Cabang Binjai</option>
                  <option>Cabang Tebing Tinggi</option>
                  <option>Cabang Pematang Siantar</option>
                  <option>Cabang Rantau Prapat</option>
                  <option>Cabang Padang Sidempuan</option>
                  <option>Cabang Kisaran</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <button type="submit" disabled={success}
              className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-900 transition-all group disabled:opacity-50">
              Daftar Sekarang <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-400">Sudah punya akun? </span>
            <a href="/login" className="text-sm text-blue-600 font-bold hover:underline">Masuk di sini</a>
          </div>
        </div>

        <div className="bg-gray-50 p-6 text-center text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-100">
          PT Bank Pembangunan Daerah Sumatera Utara
        </div>
      </div>
    </div>
  );
}
