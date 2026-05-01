"use client";
import { useState } from 'react';
import { CheckCircle, Truck, MapPin, Signature, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ConfirmationPage() {
  const [receivedItems, setReceivedItems] = useState<{ id: string, name: string, qtyShipped: number, qtyReceived: number, note?: string }[]>([
    { id: '1', name: 'Kertas A4 80gr', qtyShipped: 10, qtyReceived: 10 },
    { id: '2', name: 'Pulpen Pilot Blue', qtyShipped: 5, qtyReceived: 5 },
  ]);

  const updateReceivedQty = (id: string, qty: number) => {
    setReceivedItems(prev => prev.map(item => item.id === id ? { ...item, qtyReceived: qty } : item));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pb-10">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
           <a href="/dashboard" className="p-2 bg-white rounded-full shadow-sm">
             <ArrowLeft size={20} className="text-gray-600" />
           </a>
           <h1 className="font-bold text-gray-800">Kembali ke Beranda</h1>
        </div>

        {/* Surat Jalan Header */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Truck size={28} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Konfirmasi Penerimaan</h1>
              <p className="text-xs text-gray-400 font-mono">SJ-20260430-001 • 30 Apr 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <MapPin size={18} className="text-blue-600" /> 
            <div>
               <div className="font-bold">Cabang Medan Utama</div>
               <div className="text-[10px] text-gray-400 uppercase">Lokasi Tujuan</div>
            </div>
          </div>
        </div>

        {/* Item Checklist */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Detail Barang Kiriman</h2>
          {receivedItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="font-bold text-gray-800">{item.name}</div>
                <div className="text-[10px] px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">DIKIRIM: {item.qtyShipped}</div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-gray-400 block mb-1 uppercase tracking-tighter">JUMLAH DITERIMA</label>
                  <input 
                    type="number" 
                    value={item.qtyReceived}
                    onChange={(e) => updateReceivedQty(item.id, parseInt(e.target.value))}
                    className="w-full bg-transparent text-xl font-black text-blue-900 outline-none"
                  />
                </div>
                {item.qtyReceived !== item.qtyShipped && (
                  <div className="text-orange-500 animate-bounce">
                    <AlertTriangle size={24} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Signature & Submit */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl text-center space-y-6">
          <div className="space-y-2">
             <h3 className="font-bold text-gray-800 text-sm">Verifikasi Penerima</h3>
             <p className="text-xs text-gray-400">Silakan bubuhkan tanda tangan digital Anda di bawah ini.</p>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-[2rem] h-48 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
            <Signature size={48} className="mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Tanda Tangan Digital</p>
          </div>
          <button className="w-full bg-blue-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 active:scale-95 transition-all">
            <CheckCircle size={24} /> Selesaikan Konfirmasi
          </button>
          <p className="text-[10px] text-gray-400 leading-relaxed italic">
            "Dengan menekan tombol di atas, Anda menyatakan bahwa barang telah diterima dalam kondisi baik sesuai jumlah yang diinput."
          </p>
        </div>
      </div>
    </div>
  );
}
