import { Package, Truck, ClipboardList, CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-blue-800 dark:text-blue-400 mb-4">
          Sistem Inventaris Bank Sumut
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Manajemen profesional untuk ATK dan Form dengan logika FIFO dan Distribusi Cabang.
        </p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <Package size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Kontrol Stok</h2>
          <p className="text-gray-500 text-sm">Pantau stok ATK dan Form dengan logika FIFO untuk laporan yang akurat.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
            <ClipboardList size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Permintaan Cabang</h2>
          <p className="text-gray-500 text-sm">Kelola permintaan supply dari berbagai cabang secara real-time.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
            <Truck size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Distribusi</h2>
          <p className="text-gray-500 text-sm">Dukungan distribusi batch dan parsial dengan sistem Surat Jalan terintegrasi.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
            <CheckCircle size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Konfirmasi Terima</h2>
          <p className="text-gray-500 text-sm">Konfirmasi pengiriman dan jaga jejak audit lengkap dari penerimaan barang.</p>
        </div>
      </main>

      <div className="max-w-7xl mx-auto mt-12 text-center">
        <a href="/login" className="inline-flex items-center gap-2 bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-xl shadow-blue-200">
          Masuk ke Sistem <ArrowRight size={20} />
        </a>
      </div>

      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-400 text-sm">
        &copy; 2026 PT Bank Pembangunan Daerah Sumatera Utara
      </footer>
    </div>
  );
}
