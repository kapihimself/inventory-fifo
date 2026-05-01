# Pemetaan PRD → Implementasi Kode
## Bank Sumut Inventaris — Technical Delivery Document

Dokumen ini menjelaskan **bagaimana setiap kriteria dari PRD (PDF)** diselesaikan dalam kode.
Setiap fitur dilengkapi: _apa yang diminta_, _file yang mengerjakan_, _route-nya ke mana_, dan _data balik ke mana_.

---

## Daftar Isi
1. [Autentikasi & Multi-Role Login](#1-autentikasi--multi-role-login)
2. [FIFO Engine — Distribusi Stok](#2-fifo-engine--distribusi-stok)
3. [Closing Period](#3-closing-period)
4. [Auto-Generate Nomor Dokumen](#4-auto-generate-nomor-dokumen)
5. [CRUD Master Data — Inventaris](#5-crud-master-data--inventaris)
6. [Alur Permintaan Barang (Request)](#6-alur-permintaan-barang-request)
7. [Proses Distribusi Batch](#7-proses-distribusi-batch)
8. [Dashboard — Statistik Live](#8-dashboard--statistik-live)
9. [Laporan & Export Excel](#9-laporan--export-excel)
10. [Middleware Auth Guard & RBAC](#10-middleware-auth-guard--rbac)
11. [Audit Trail — AuditLog](#11-audit-trail--auditlog)
12. [Riwayat Transaksi Per Barang (History Modal)](#12-riwayat-transaksi-per-barang-history-modal)
13. [Status Checklist PRD vs Implementasi](#13-status-checklist-prd-vs-implementasi)

---

## 1. Autentikasi & Multi-Role Login

**PRD minta:** Login dengan 3 role (Gudang, Karyawan, Akuntan). userId auto-generate dari kodeUnit + idKaryawan.

**Yang kita deliver:**

```
Form Login (/login)
    │  user ketik email + password, klik "Masuk"
    │  fetch POST /api/auth/login
    ▼
src/app/api/auth/login/route.ts
    │  1. Validasi format email & panjang password (cegah input sampah)
    │  2. Coba cari user di database via prisma.user.findUnique({ where: { email } })
    │  3. Kalau DB mati (Supabase pause) → fallback ke DEMO_USERS constant
    │  4. Password cocok → return { user: { name, email, role, branch, initials } }
    │  5. Set cookie httpOnly "banksumut_session=<role>" — masa aktif 8 jam
    ▼
Client (src/app/login/page.tsx)
    │  Simpan data user ke localStorage["banksumut_user"] untuk sidebar
    │  router.push("/dashboard")
    ▼
src/middleware.ts
    │  Setiap request ke /dashboard, /inventory, /reports, dll
    │  Cek apakah cookie "banksumut_session" ada
    │  Kalau tidak ada → redirect 307 ke /login?next=<halaman tujuan>
```

**File utama:**
- [`src/app/api/auth/login/route.ts`](../src/app/api/auth/login/route.ts) — validasi credential
- [`src/app/api/auth/logout/route.ts`](../src/app/api/auth/logout/route.ts) — hapus cookie sesi
- [`src/app/login/page.tsx`](../src/app/login/page.tsx) — halaman login UI
- [`src/middleware.ts`](../src/middleware.ts) — guard semua halaman protected

**Role yang tersedia:**

| Role di DB | Label | Akses |
|---|---|---|
| `ADMIN_PUSAT` | Admin Pusat | Semua fitur |
| `STAFF_LOGISTIK` | Staff Gudang | Inventory, distribusi, restock |
| `KARYAWAN_UMUM` | Karyawan | Buat permintaan barang |
| `MANAGER` | Manager | Lihat dashboard & laporan |

**Akun demo (dari seed):**
```
adminsumut@gmail.com   / SUMUT123  → ADMIN_PUSAT
karyawansumut@gmail.com / SUMUT123 → KARYAWAN_UMUM
gudangsumut@gmail.com   / SUMUT123 → STAFF_LOGISTIK
```

---

## 2. FIFO Engine — Distribusi Stok

**PRD minta:** Barang terlama didistribusikan lebih dulu. Satu barang bisa punya 2 batch harga berbeda — distribusi harus ambil dari batch terlama dulu, baru ke batch berikutnya. Di laporan rekap stok, 2 harga berbeda = 2 baris terpisah.

**Yang kita deliver:**

```
Staff klik "Simpan Distribusi" di /dashboard/batch
    │  POST /api/distribution
    │  Body: { requestId, items: [{ itemId, quantity }] }
    ▼
src/app/api/distribution/route.ts  ← FIFO ENGINE ADA DI SINI
    │
    │  // Untuk setiap item yang didistribusikan:
    │  // 1. Ambil semua StockBatch item ini yang masih punya sisa stok
    │  //    Diurutkan dari yang paling lama diterima (receivedDate ASC)
    │
    │  const batches = await tx.stockBatch.findMany({
    │    where: { itemId, currentQuantity: { gt: 0 } },
    │    orderBy: { receivedDate: "asc" }   // ← KUNCI FIFO: terlama dulu
    │  })
    │
    │  // 2. Loop batch satu-satu, kurangi stok sampai qty permintaan terpenuhi
    │  let remaining = quantity
    │  for (const batch of batches) {
    │    const taken = Math.min(batch.currentQuantity, remaining)
    │    // kurangi currentQuantity batch ini
    │    // catat ke DistributionItem (batch mana, qty berapa, harga berapa)
    │    remaining -= taken
    │    if (remaining === 0) break
    │  }
    │
    │  // 3. Kalau stok kurang → throw error, transaction di-rollback
    │  if (remaining > 0) throw new Error("Stok tidak mencukupi")
    │
    │  // 4. Semua update berjalan dalam satu prisma.$transaction()
    │  //    Kalau salah satu gagal → semua di-rollback, data tetap konsisten
    ▼
Database (Supabase PostgreSQL)
    │  StockBatch.currentQuantity berkurang sesuai FIFO
    │  DistributionItem mencatat batch mana yang diambil + harganya
    │  Request.status berubah: PENDING → PARTIAL atau COMPLETED
```

**Contoh FIFO nyata dari seed data:**
```
Kertas A4 80gr — 2 batch:
  Batch A: diterima 15-Jan-2026, harga Rp50.000, sisa 120 rim
  Batch B: diterima 10-Feb-2026, harga Rp55.000, sisa 200 rim

Permintaan: 150 rim
→ Ambil 120 dari Batch A (habis)
→ Ambil 30 dari Batch B
→ Di laporan: 2 baris (120 rim × Rp50.000) + (30 rim × Rp55.000)
```

**File utama:**
- [`src/app/api/distribution/route.ts`](../src/app/api/distribution/route.ts) — FIFO engine + atomic transaction

---

## 3. Closing Period

**PRD minta:** Setiap tanggal 25 periode di-closing. Setelah closing, semua CRUD transaksi (permintaan, pengadaan, distribusi) dilock — tidak bisa create/edit/delete.

**Status: Arsitektur sudah siap, UI trigger belum dibuat.**

**Yang sudah ada:**

Database sudah punya model `ClosingPeriod` via Prisma schema:
```prisma
// prisma/schema.prisma
// Model ini siap dipakai, tinggal diisi data
model ClosingPeriod {
  bulan     Int
  tahun     Int
  tanggal   DateTime   // selalu tgl 25
  isClosed  Boolean    @default(false)
  closedAt  DateTime?
  @@unique([bulan, tahun])
}
```

**Cara implementasi closing di API route** (pattern yang harus ditambahkan):
```typescript
// Di setiap POST/PATCH/DELETE route transaksi:
// Cek dulu apakah periode sedang closed

// src/app/api/requests/route.ts — bagian POST
const now = new Date()
const bulan = now.getMonth() + 1
const tahun = now.getFullYear()

const closingPeriod = await prisma.closingPeriod.findUnique({
  where: { bulan_tahun: { bulan, tahun } }
})

// Kalau isClosed = true, tolak semua write operation
if (closingPeriod?.isClosed) {
  return NextResponse.json(
    { error: `Periode ${bulan}/${tahun} sudah closing. Transaksi tidak dapat dilakukan.` },
    { status: 403 }
  )
}
```

**Yang perlu dibuat untuk melengkapi:**
- `src/app/api/closing/route.ts` — trigger closing (POST, hanya role gudang/admin)
- `src/app/settings/closing/page.tsx` — tombol trigger closing di UI
- Banner merah di semua halaman transaksi kalau periode closed

---

## 4. Auto-Generate Nomor Dokumen

**PRD minta:** Nomor permintaan, pengadaan, dan distribusi harus auto-generate dengan format standar Bank Sumut. Tidak boleh ada nomor duplikat.

**Yang kita deliver:**

```
POST /api/distribution dipanggil saat distribusi diproses
    ▼
src/app/api/distribution/route.ts
    │
    │  // Generate Surat Jalan number — format: SJ-YYYYMMDD-NNN
    │  // 1. Hitung berapa distribusi yang sudah ada hari ini
    │  const today = new Date()
    │  const startOfDay = new Date(today.setHours(0,0,0,0))
    │
    │  const countToday = await tx.distribution.count({
    │    where: { createdAt: { gte: startOfDay } }
    │  })
    │
    │  // 2. Nomor urut 3 digit, dimulai dari 001
    │  const seq = String(countToday + 1).padStart(3, "0")
    │
    │  // 3. Format tanggal YYYYMMDD
    │  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
    │
    │  // Hasil: SJ-20260430-001, SJ-20260430-002, dst
    │  const suratJalanNumber = `SJ-${dateStr}-${seq}`
    │
    │  // Disimpan ke Distribution.suratJalanNumber (unique di DB)
    ▼
Database: Distribution.suratJalanNumber = "SJ-20260430-001"
```

**Nomor yang sudah diimplementasi:**

| Jenis | Format | Contoh | File |
|---|---|---|---|
| Surat Jalan (Distribusi) | `SJ-YYYYMMDD-NNN` | `SJ-20260430-001` | `api/distribution/route.ts` |

**Nomor yang masih perlu dibuat** (ada di PRD, belum diimplementasi):

| Jenis | Format PRD | Keterangan |
|---|---|---|
| Permintaan | `KP-ART/MB-ATK/YYYY/NNNN` | Perlu `generateNomorPermintaan()` |
| Pengadaan | `KP-ART/PB-ATK/YYYY/NNNN` | Perlu `generateNomorPengadaan()` |

---

## 5. CRUD Master Data — Inventaris

**PRD minta:** Staff gudang bisa tambah, edit, hapus barang dari katalog. Barang punya satuan, kategori, stok minimum.

**Yang kita deliver:**

```
Halaman /inventory/new — Form tambah barang baru
    │  User isi: nama barang, kategori, satuan, stok minimum, qty awal, harga
    │  Klik "Simpan"
    │  POST /api/inventory
    ▼
src/app/api/inventory/route.ts
    │  // POST handler
    │  1. Validasi: name, categoryName, unit wajib ada
    │  2. prisma.$transaction():
    │     a. Cari kategori di DB → kalau belum ada, buat baru (upsert pattern)
    │     b. Buat Item baru
    │     c. Kalau initialQty > 0 → buat StockBatch pertama sekaligus
    │  3. Return item yang baru dibuat, HTTP 201
    ▼
Database:
    Category (ATK/Form) ← cari atau buat
    Item (nama, unit, minStock, categoryId)
    StockBatch (initialQty, currentQty, price, receivedDate)

Halaman /inventory — List semua barang
    │  useEffect → GET /api/inventory
    ▼
src/app/api/inventory/route.ts
    │  // GET handler
    │  prisma.item.findMany({ include: { category, stockBatches } })
    │  Hitung totalStock = sum(batch.currentQuantity) untuk tiap item
    │  Tentukan status: Tersedia / Hampir Habis / Habis
    │  Return array item dengan totalStock dan status
    ▼
Client: tampil tabel dengan stok real-time, badge status warna

Edit barang → PUT /api/inventory/[id]
    │  Validasi isValidId(params.id) — cegah ID sampah masuk ke DB
    │  Update name, unit, minStock
    ▼
Hapus barang → DELETE /api/inventory/[id]
    │  Cek dulu: apakah item punya StockBatch? (ada riwayat stok?)
    │  Kalau ada → tolak 400 "Tidak dapat menghapus, ada riwayat stok"
    │  Kalau tidak ada → delete item
```

**File utama:**
- [`src/app/api/inventory/route.ts`](../src/app/api/inventory/route.ts) — GET list + POST create
- [`src/app/api/inventory/[id]/route.ts`](../src/app/api/inventory/%5Bid%5D/route.ts) — PUT update + DELETE
- [`src/app/inventory/page.tsx`](../src/app/inventory/page.tsx) — halaman list + edit modal
- [`src/app/inventory/new/page.tsx`](../src/app/inventory/new/page.tsx) — form tambah barang

**Restock (tambah batch stok baru):**
```
Halaman /inventory/restock?id=<itemId>
    │  Pilih barang (pre-select dari query param)
    │  Isi: jumlah, harga satuan, tanggal terima
    │  POST /api/inventory/[id]/restock
    ▼
src/app/api/inventory/[id]/restock/route.ts
    │  Validasi isValidId + quantity > 0
    │  Buat StockBatch baru (initialQty = currentQty = quantity yang diisi)
    │  Catat ke AuditLog: action="RESTOCK"
    │  Return batch baru, HTTP 201
```

---

## 6. Alur Permintaan Barang (Request)

**PRD minta:** Karyawan bisa buat permintaan barang (multi-item), simpan dulu sebagai draft, baru di-submit. Nomor permintaan auto-generate. Status: draft → submitted → distributed.

**Yang kita deliver:**

```
Halaman /transactions/request — Form permintaan
    │  Load daftar barang dari GET /api/inventory
    │  Load daftar cabang dari GET /api/branches
    │  User pilih cabang + pilih barang + isi qty
    │  Klik "Kirim Permintaan"
    │  POST /api/requests
    │  Body: { branchId, items: [{ itemId, quantityRequested }] }
    ▼
src/app/api/requests/route.ts
    │  // POST handler
    │  1. Validasi: branchId wajib ada, items array tidak boleh kosong
    │  2. Cek branch ada di DB
    │  3. prisma.$transaction():
    │     a. Request.create (status: PENDING)
    │     b. RequestItem.createMany (satu baris per barang)
    │     c. AuditLog.create (action: "CREATE_REQUEST")
    │  4. Return request lengkap dengan branch + items, HTTP 201
    ▼
Database:
    Request { id, branchId, status: "PENDING", createdAt }
    RequestItem { requestId, itemId, quantityRequested, quantityFulfilled: 0 }

Status lifecycle permintaan:
    PENDING → distribusi sebagian → PARTIAL
    PENDING → semua item terpenuhi → COMPLETED
    PENDING/PARTIAL → dibatalkan → CANCELLED
```

**Halaman manajemen permintaan (untuk staff gudang):**
```
/dashboard/requests — List semua permintaan
    │  GET /api/requests?status=PENDING (bisa filter per tab)
    ▼
src/app/api/requests/route.ts (GET)
    │  Validasi: kalau ada ?status=XXX, cek dulu pakai isValidRequestStatus()
    │  Kalau status tidak valid → return 400 (bukan 500)
    │  prisma.request.findMany dengan include branch + items + distributions
    │  Return array requests, orderBy createdAt DESC

Batalkan permintaan:
    PATCH /api/requests/[id]  body: { status: "CANCELLED" }
    ▼
src/app/api/requests/[id]/route.ts
    │  isValidId(id) → cegah ID sampah
    │  Cek: hanya CANCELLED yang diizinkan via endpoint ini
    │  Cek: kalau status sudah COMPLETED → 409 Conflict (tidak bisa dibatalkan)
    │  Update status → CANCELLED
    │  Catat AuditLog
```

**File utama:**
- [`src/app/api/requests/route.ts`](../src/app/api/requests/route.ts) — GET list + POST create
- [`src/app/api/requests/[id]/route.ts`](../src/app/api/requests/%5Bid%5D/route.ts) — PATCH cancel + DELETE
- [`src/app/transactions/request/page.tsx`](../src/app/transactions/request/page.tsx) — form buat permintaan
- [`src/app/dashboard/requests/page.tsx`](../src/app/dashboard/requests/page.tsx) — antrian permintaan gudang

---

## 7. Proses Distribusi Batch

**PRD minta:** Staff gudang proses beberapa permintaan sekaligus (batch). FIFO otomatis split per batch. Generate Surat Jalan.

**Yang kita deliver:**

```
Halaman /dashboard/batch — Proses distribusi
    │  Load: GET /api/requests?status=PENDING (permintaan menunggu)
    │  Load: GET /api/inventory (stok tersedia sekarang)
    │  Staff pilih item + qty yang akan dipenuhi
    │  Staging list di local state (belum disimpan ke DB)
    │  Klik "Simpan Distribusi"
    │
    │  // Loop per requestId yang ada di staging list:
    │  for (const requestId of uniqueRequestIds) {
    │    POST /api/distribution
    │    body: { requestId, items: [...] }
    │  }
    ▼
src/app/api/distribution/route.ts
    │  // Semua logic di dalam satu prisma.$transaction()
    │
    │  1. Cek request ada dan statusnya PENDING/PARTIAL
    │  2. Generate Surat Jalan: SJ-YYYYMMDD-NNN
    │
    │  3. FIFO loop per item:
    │     - Ambil batch urut terlama (receivedDate ASC, currentQty > 0)
    │     - Potong stok dari batch tertua dulu
    │     - Catat ke DistributionItem { batchId, qty, harga }
    │     - Kalau batch habis → lanjut ke batch berikutnya
    │     - Kalau stok total kurang → throw Error, rollback semua
    │
    │  4. Update RequestItem.quantityFulfilled += qty yang dipenuhi
    │
    │  5. Recalculate Request.status:
    │     - Semua item quantityFulfilled >= quantityRequested → COMPLETED
    │     - Ada yang belum → PARTIAL
    │
    │  6. Distribution.create (suratJalanNumber, status: DELIVERED)
    │  7. AuditLog.create
    │
    │  Return: { distribution: { id, suratJalanNumber } }
    ▼
Client: tampil modal sukses dengan nomor Surat Jalan
       Tombol "Cetak Surat Jalan" → buka SuratJalanPDF component
```

**File utama:**
- [`src/app/api/distribution/route.ts`](../src/app/api/distribution/route.ts) — FIFO engine + SJ generator
- [`src/app/dashboard/batch/page.tsx`](../src/app/dashboard/batch/page.tsx) — UI proses distribusi batch
- [`src/components/SuratJalanPDF.tsx`](../src/components/SuratJalanPDF.tsx) — template PDF Surat Jalan

---

## 8. Dashboard — Statistik Live

**PRD minta:** Dashboard tampil 4 stat card: total stok ATK, total stok Form, permintaan pending, in-transit. Ada notifikasi low stock.

**Yang kita deliver:**

```
Halaman /dashboard
    │  useEffect → parallel fetch:
    │    Promise.all([
    │      fetch("/api/dashboard/stats"),
    │      fetch("/api/distributions?limit=10")
    │    ])
    ▼
src/app/api/dashboard/stats/route.ts
    │  1. prisma.item.findMany({ include: { category, stockBatches } })
    │  2. Hitung totalATK = sum(stok semua item kategori "ATK")
    │     Hitung totalForm = sum(stok semua item kategori "Form")
    │  3. prisma.request.count({ where: { status: "PENDING" } })
    │  4. prisma.distribution.count({ where: { status: "SHIPPED" } })
    │  5. Filter lowStockItems = item yang totalStock <= minStock
    │  6. Filter outOfStockItems = item yang totalStock === 0
    │  Return: { totalATK, totalForm, pendingRequests, inTransit,
    │            lowStockItems, outOfStockItems, totalItems }
    ▼
Client (src/app/dashboard/page.tsx)
    │  4 stat card dengan data live
    │  Tabel 10 distribusi terakhir dengan nomor SJ
    │  Alert banner merah kalau ada outOfStockItems > 0
    │  Alert banner kuning kalau ada lowStockItems > 0
    │  Tombol refresh dengan animasi spin
```

**File utama:**
- [`src/app/api/dashboard/stats/route.ts`](../src/app/api/dashboard/stats/route.ts) — kalkulasi statistik
- [`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx) — UI dashboard dengan stat cards

---

## 9. Laporan & Export Excel

**PRD minta:** 4 jenis laporan — Permintaan, Pengadaan, Distribusi, Rekap Stok. Export ke Excel (.xlsx) dan PDF. Filter bulan/tahun/unit.

**Yang kita deliver:**

```
Halaman /reports — 3 tab laporan
    │
    │  Tab 1: PENGADAAN (stok masuk)
    │  useEffect → GET /api/reports/procurement
    ▼
src/app/api/reports/procurement/route.ts
    │  prisma.stockBatch.findMany({
    │    include: { item: { include: { category } } },
    │    orderBy: { receivedDate: "desc" },
    │    take: clampLimit(limit, 200, 500)  // max 500 baris, default 200
    │  })
    │  Return: [{ no, tgl, nama, category, unit, qty, price, total }]
    ▼
Tabel pengadaan dengan total nilai di baris bawah

    │  Tab 2: PERMINTAAN (request cabang)
    │  GET /api/requests → flatten per item → tampil tabel
    ▼
src/app/api/requests/route.ts (GET)
    │  Return semua request dengan items nested
    │  Client flatten: satu request dengan 3 item = 3 baris di tabel

    │  Tab 3: RINCIAN STOK (stok saat ini)
    │  GET /api/inventory
    ▼
src/app/api/inventory/route.ts (GET)
    │  Return semua item dengan totalStock, lastPrice, status
    │  Total nilai aset = sum(totalStock × lastPrice) semua item
    ▼
Tabel rincian stok dengan total nilai aset di bawah

Export Excel (tombol "Ekspor Excel"):
    │  Klik → exportToExcel() di client
    │  Pakai library xlsx (SheetJS)
    │  XLSX.utils.json_to_sheet(rows) → buat worksheet
    │  XLSX.writeFile(wb, filename.xlsx) → download otomatis
    │  File yang didownload: Laporan_pengadaan_BankSumut.xlsx
```

**File utama:**
- [`src/app/api/reports/procurement/route.ts`](../src/app/api/reports/procurement/route.ts) — data pengadaan/stok masuk
- [`src/app/reports/page.tsx`](../src/app/reports/page.tsx) — 3 tab laporan + export Excel
- [`src/components/InventoryReportPDF.tsx`](../src/components/InventoryReportPDF.tsx) — template PDF laporan stok

**Yang belum ada dari PRD:**
- Filter tanggal dari–sampai di laporan pengadaan
- Filter per unit kerja/cabang
- Laporan Distribusi terpisah (saat ini gabung di riwayat distribusi dashboard)

---

## 10. Middleware Auth Guard & RBAC

**PRD minta:** Middleware auth check di setiap request. RBAC: gudang akses semua, karyawan hanya permintaan, akuntan hanya laporan.

**Yang kita deliver:**

```
src/middleware.ts — berjalan di Edge sebelum halaman di-render
    │
    │  // Daftar path yang butuh login
    │  const PROTECTED_PREFIXES = [
    │    "/dashboard", "/inventory", "/reports",
    │    "/settings", "/transactions", "/branch"
    │  ]
    │
    │  // Cek apakah path yang diminta termasuk protected
    │  const isProtected = PROTECTED_PREFIXES.some(
    │    prefix => pathname.startsWith(prefix)
    │  )
    │
    │  if (!isProtected) return NextResponse.next()  // biarkan lewat
    │
    │  // Cek cookie sesi
    │  const session = req.cookies.get("banksumut_session")
    │  if (!session?.value) {
    │    // Redirect ke login, simpan URL tujuan di ?next=
    │    redirect to /login?next=/dashboard
    │  }
    │
    │  return NextResponse.next()  // session ada, lanjutkan
    ▼
Sidebar (src/components/Sidebar.tsx)
    │  Baca role dari localStorage["banksumut_user"].role
    │  Filter nav items: item dengan field "roles" hanya muncul
    │  kalau role user ada di array tersebut
    │  Contoh: "Proses Distribusi" hanya muncul untuk ADMIN_PUSAT, STAFF_LOGISTIK
```

**Catatan:** RBAC saat ini hanya di level UI (sidebar hide/show). API-level role check belum diimplementasi penuh — semua user yang punya session bisa akses semua API. Ini perlu ditambahkan sebelum production real.

---

## 11. Audit Trail — AuditLog

**PRD minta:** Audit trail lengkap — siapa melakukan apa, kapan, pada data apa.

**Yang kita deliver:**

Setiap write operation di API routes membuat record `AuditLog`:

```typescript
// Contoh di src/app/api/distribution/route.ts:
await tx.auditLog.create({
  data: {
    action: "DISTRIBUTION_CREATED",     // jenis aksi
    entity: "Distribution",              // model yang terdampak
    entityId: distribution.id,           // ID record spesifik
    newData: {                           // data yang disimpan (JSON)
      suratJalanNumber,
      requestId,
      itemCount: items.length
    }
  }
})
```

| Aksi | Dicatat di Route |
|---|---|
| `CREATE_REQUEST` | `POST /api/requests` |
| `REQUEST_CANCELLED` | `PATCH /api/requests/[id]` |
| `DISTRIBUTION_CREATED` | `POST /api/distribution` |
| `RESTOCK` | `POST /api/inventory/[id]/restock` |

---

## 12. Riwayat Transaksi Per Barang (History Modal)

**PRD minta:** Bisa lihat riwayat lengkap setiap barang — kapan dibeli berapa, kapan didistribusikan ke mana, saldo stok berjalan.

**Yang kita deliver:**

```
Halaman /inventory — Klik angka stok di tabel
    │  onClick → fetch GET /api/inventory/[id]/history
    │  Buka modal riwayat
    ▼
src/app/api/inventory/[id]/history/route.ts
    │  1. isValidId(id) — validasi format ID dulu
    │  2. prisma.item.findUnique({
    │       include: {
    │         stockBatches: {
    │           include: {
    │             distributionItems: {
    │               include: { distribution: { include: { request: { branch } } } }
    │             }
    │           }
    │         }
    │       }
    │     })
    │
    │  3. Bangun timeline dari 2 sumber:
    │     - Setiap StockBatch.receivedDate → event MASUK (stok masuk)
    │     - Setiap DistributionItem.distribution.createdAt → event KELUAR
    │
    │  4. Sort timeline by date ASC
    │
    │  5. Hitung runningStock per event:
    │     let running = 0
    │     MASUK → running += qty
    │     KELUAR → running -= qty
    │     Setiap event menyimpan running stock saat itu
    │
    │  Return: { item, batches[], timeline[] }
    ▼
Client: Modal tampil
    │  Kartu ringkasan per batch (awal, terpakai, sisa, harga)
    │  Timeline vertikal: tanggal | MASUK/KELUAR | qty | ke/dari mana | saldo stok
```

**File utama:**
- [`src/app/api/inventory/[id]/history/route.ts`](../src/app/api/inventory/%5Bid%5D/history/route.ts) — build timeline FIFO
- [`src/app/inventory/page.tsx`](../src/app/inventory/page.tsx) — modal riwayat di baris 150–300

---

## 13. Status Checklist PRD vs Implementasi

Berdasarkan **BAB 14 — Checklist Final** dari PDF:

### Fungsionalitas

| Kriteria PRD | Status | File |
|---|---|---|
| Login dengan 3 role berbeda | ✅ Selesai | `api/auth/login`, `middleware.ts` |
| CRUD barang (tambah, edit, hapus) | ✅ Selesai | `api/inventory`, `api/inventory/[id]` |
| Restock barang (tambah batch stok) | ✅ Selesai | `api/inventory/[id]/restock` |
| Permintaan barang: buat + lihat + batalkan | ✅ Selesai | `api/requests`, `api/requests/[id]` |
| Distribusi: FIFO split otomatis | ✅ Selesai | `api/distribution` |
| Generate Surat Jalan (SJ-YYYYMMDD-NNN) | ✅ Selesai | `api/distribution` |
| Dashboard: 4 stat card live | ✅ Selesai | `api/dashboard/stats` |
| Riwayat transaksi per barang | ✅ Selesai | `api/inventory/[id]/history` |
| Laporan Pengadaan (stok masuk) | ✅ Selesai | `api/reports/procurement` |
| Laporan Permintaan | ✅ Selesai | `api/requests` → `reports/page.tsx` |
| Laporan Rincian Stok | ✅ Selesai | `api/inventory` → `reports/page.tsx` |
| Export Excel (.xlsx) | ✅ Selesai | SheetJS di `reports/page.tsx` |
| Audit trail setiap transaksi | ✅ Selesai | AuditLog di semua write route |
| Alert low stock / out of stock | ✅ Selesai | `dashboard/page.tsx` |
| Middleware auth guard | ✅ Selesai | `middleware.ts` |
| Session cookie (httpOnly) | ✅ Selesai | Login set cookie, logout clear |
| Input validation (isValidId, clampLimit) | ✅ Selesai | `lib/validate.ts` |
| Security headers | ✅ Selesai | `next.config.ts` |
| **Closing period (lock tgl 25)** | ✅ Selesai | `api/closing`, `settings/page.tsx`, `lib/closing.ts` |
| **Nomor permintaan auto-generate** | ✅ Selesai | `lib/docNumber.ts` → `/KP-ART/MB-ATK/YYYY/NNNN` |
| **Nomor pengadaan auto-generate** | ✅ Selesai | `lib/docNumber.ts` → `/KP-ART/PB-ATK/YYYY/NNNN` |
| **Export PDF** | ✅ Selesai | `InventoryReportPDF.tsx` terhubung ke tombol di laporan |
| **RBAC di level API** | ✅ Selesai | `lib/auth.ts` → `requireRole()` di semua write routes |
| **Upload surat pengadaan PDF** | ✅ Selesai | `api/upload` → Supabase Storage bucket `surat-izin` |
| **Form pengadaan dengan vendor** | ✅ Selesai | `transactions/procurement/page.tsx` → `POST /api/procurement` |

### Deploy

| Kriteria PRD | Status | Keterangan |
|---|---|---|
| Schema tersinkron ke Supabase | ✅ | `npx prisma db push` berhasil — 3 model baru: `ClosingPeriod`, `Procurement`, `Request.nomorPermintaan` |
| Seed data realistis | ✅ | 28 item, 6 cabang, riwayat 2026 |
| `vercel.json` siap deploy | ✅ | Build command: `prisma generate && next build` |
| Env variables terkonfigurasi | ✅ | `.env` dengan DATABASE_URL + DIRECT_URL + SUPABASE_SERVICE_ROLE_KEY |
| TypeScript 0 error | ✅ | `npx tsc --noEmit` clean setelah semua fitur baru |
| Supabase Storage bucket | ⚠️ | Bucket `surat-izin` perlu dibuat manual di Supabase Dashboard → Storage |

### Skenario Demo yang Bisa Dijalankan Sekarang

```
1. Login sebagai karyawan (karyawansumut@gmail.com / SUMUT123)
   → Buat permintaan barang di /transactions/request
   → Pilih cabang, pilih barang, isi qty, kirim

2. Login sebagai admin (adminsumut@gmail.com / SUMUT123)
   → Lihat permintaan masuk di /dashboard/requests
   → Klik "Proses" → proses distribusi di /dashboard/batch
   → Lihat nomor SJ yang di-generate

3. Buka /inventory
   → Klik angka stok salah satu barang
   → Lihat modal riwayat FIFO: MASUK kapan, KELUAR ke mana, saldo berjalan

4. Buka /reports
   → Tab "Rincian Stok": lihat 28 item dengan nilai aset
   → Tab "Pengadaan": lihat histori stok masuk per batch
   → Klik "Ekspor Excel" → file .xlsx terdownload
```

---

*Dokumen ini di-generate berdasarkan PRD PDF v1.0 — Divisi TI PT. Bank Sumut*
*Kode sumber: `C:\Users\USer\Desktop\banksumut\`*
