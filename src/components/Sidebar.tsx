"use client";
import { useEffect, useState } from "react";
import { Package, ArrowUpRight, ArrowDownRight, FileText, BarChart3, Settings, LogOut, Users, LayoutDashboard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const allMenus = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", group: "Utama", roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK', 'KARYAWAN_UMUM'] },
  { href: "/inventory", icon: Package, label: "Inventaris", group: "Utama", roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK'] },
  { href: "/transactions/request", icon: FileText, label: "Permintaan", group: "Transaksi", roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK', 'KARYAWAN_UMUM'] },
  { href: "/transactions/issuance", icon: ArrowUpRight, label: "Pengeluaran", group: "Transaksi", roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK'] },
  { href: "/transactions/procurement", icon: ArrowDownRight, label: "Pengadaan", group: "Transaksi", roles: ['ADMIN_PUSAT'] },
  { href: "/dashboard/batch", icon: Users, label: "Distribusi", group: "Logistik", roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK'] },
  { href: "/reports", icon: BarChart3, label: "Laporan", group: "Logistik", roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(() => {
    // Lazy init: read synchronously on first render (client-only, no SSR risk in "use client")
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("banksumut_user");
      if (stored) {
        try {
          const p = JSON.parse(stored);
          return { name: p.name ?? "...", branch: p.branch ?? "", role: p.role ?? "KARYAWAN_UMUM", initials: p.initials ?? ".." };
        } catch { /* ignore */ }
      }
    }
    return { name: "Loading...", branch: "", role: "KARYAWAN_UMUM", initials: ".." };
  });

  useEffect(() => {
    const stored = localStorage.getItem("banksumut_user");
    if (stored) {
      const p = JSON.parse(stored);
      setUser({ name: p.name, branch: p.branch, role: p.role, initials: p.initials });
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('banksumut_user');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const roleLabel: Record<string, string> = {
    ADMIN_PUSAT: 'Admin Pusat',
    STAFF_LOGISTIK: 'Staff Gudang',
    KARYAWAN_UMUM: 'Karyawan Umum',
  };

  const roleBadgeColor: Record<string, string> = {
    ADMIN_PUSAT: 'bg-red-500/20 text-red-400',
    STAFF_LOGISTIK: 'bg-yellow-500/20 text-yellow-400',
    KARYAWAN_UMUM: 'bg-green-500/20 text-green-400',
  };

  // Filter menus based on user role
  const visibleMenus = allMenus.filter(m => m.roles.includes(user.role));
  const groups = [...new Set(visibleMenus.map(m => m.group))];

  return (
    <aside className="w-64 bg-[#003366] text-white flex flex-col p-6 shrink-0 shadow-2xl min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg text-white">B</div>
        <div>
          <h1 className="text-lg font-bold leading-none text-white">Bank <span className="text-orange-500">SUMUT</span></h1>
          <p className="text-[8px] uppercase tracking-[0.2em] opacity-60 font-bold mt-1 text-white">Inventory System</p>
        </div>
      </div>

      {/* Mini Profile */}
      <div className="mb-6 px-3 py-4 bg-blue-800/40 rounded-[1.5rem] border border-blue-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center font-bold text-base shadow-lg text-white shrink-0">
            {user.initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white truncate">{user.name}</div>
            <div className="text-[10px] text-blue-300 font-medium truncate">{user.branch}</div>
            <div className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase ${roleBadgeColor[user.role] || 'bg-green-500/20 text-green-400'}`}>
              {roleLabel[user.role] || user.role}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - filtered by role */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <div className="text-[9px] uppercase font-bold text-blue-400 mb-2 px-3 tracking-widest">{group}</div>
            {visibleMenus.filter(m => m.group === group).map((item) => {
              const isActive = pathname === item.href;
              return (
                <a key={item.href} href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${isActive ? "bg-orange-500 text-white font-bold shadow-lg shadow-orange-900/30" : "hover:bg-blue-800/60 text-blue-100"}`}>
                  <item.icon size={18} /> {item.label}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-5 mt-4 border-t border-blue-800 space-y-2">
        {(user.role === 'ADMIN_PUSAT' || user.role === 'STAFF_LOGISTIK') && (
          <a href="/settings" className="flex items-center gap-3 p-3 hover:bg-blue-800/60 rounded-xl transition-all text-sm text-blue-300 hover:text-white">
            <Settings size={16} /> Pengaturan
          </a>
        )}
        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-900/30 rounded-xl transition-all text-sm text-red-400 hover:text-red-300">
          <LogOut size={16} /> Keluar Sistem
        </button>
      </div>
    </aside>
  );
}
