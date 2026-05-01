# Bank Sumut Inventory System

Sistem manajemen inventaris ATK (Alat Tulis Kantor) dan Form untuk PT Bank Pembangunan Daerah Sumatera Utara. Mengelola stok dengan logika FIFO, alur permintaan cabang, distribusi batch, dan laporan neraca stok real-time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 5.21 |
| Styling | Tailwind CSS 3 |
| PDF | @react-pdf/renderer |
| Excel export | xlsx |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- Git

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd banksumut
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres
```

Get these from Supabase Dashboard → Project → Settings → Database → Connection string (Transaction mode for `DATABASE_URL`, Session mode or Direct for `DIRECT_URL`).

### 3. Push schema and seed

```bash
npx prisma db push
npx prisma db seed
```

> **Note:** Supabase free-tier projects auto-pause after inactivity. If `db push` hangs, open the Supabase dashboard and wake the project first (click "Restore project").

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin Pusat | adminsumut@gmail.com | SUMUT123 |
| Karyawan Umum | karyawansumut@gmail.com | SUMUT123 |
| Staff Logistik | gudangsumut@gmail.com | SUMUT123 |

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add the environment variables in Vercel Dashboard → Project → Settings → Environment Variables:
- `DATABASE_URL`
- `DIRECT_URL`

The `vercel.json` at the root runs `prisma generate && next build` automatically.

---

## Project Structure

```
banksumut/
├── docs/                        # Architecture, API, and Auth docs
├── prisma/
│   ├── schema.prisma            # 11-table database schema
│   └── seed.ts                  # Realistic Bank Sumut ATK seed data
├── src/
│   ├── app/
│   │   ├── api/                 # All REST API route handlers
│   │   │   ├── auth/login       # POST — credential validation
│   │   │   ├── auth/logout      # POST — clear session cookie
│   │   │   ├── branches         # GET — branch list for dropdowns
│   │   │   ├── dashboard/stats  # GET — live stat card data
│   │   │   ├── distribution     # POST — process FIFO distribution
│   │   │   ├── distributions    # GET — distribution history list
│   │   │   ├── inventory        # GET list / POST create
│   │   │   ├── inventory/[id]   # PUT update / DELETE
│   │   │   ├── inventory/[id]/history    # GET transaction timeline
│   │   │   ├── inventory/[id]/restock   # POST add stock batch
│   │   │   ├── reports/procurement      # GET stock-in records
│   │   │   └── requests         # GET list / POST create
│   │   │       └── [id]         # PATCH cancel / DELETE
│   │   ├── branch/request       # Mobile-friendly branch order form
│   │   ├── confirm              # Receipt confirmation (stub)
│   │   ├── dashboard            # Main dashboard + stats cards
│   │   │   ├── batch            # Batch distribution processing
│   │   │   └── requests         # Request management queue
│   │   ├── inventory            # Inventory list + history modal
│   │   │   ├── new              # Add new item form
│   │   │   └── restock          # Add stock batch form
│   │   ├── login                # Login page
│   │   ├── register             # Register page (UI stub)
│   │   ├── reports              # Reports: Pengadaan / Permintaan / Stok
│   │   ├── settings             # Profile settings
│   │   └── transactions/
│   │       ├── issuance         # Goods issuance form (UI stub)
│   │       ├── procurement      # Procurement entry form
│   │       └── request          # Branch supply request form
│   ├── components/
│   │   ├── InventoryReportPDF.tsx   # PDF report generator
│   │   ├── Sidebar.tsx              # Role-gated navigation sidebar
│   │   └── SuratJalanPDF.tsx        # Delivery order PDF
│   ├── lib/
│   │   ├── prisma.ts            # Prisma singleton + env guard
│   │   └── validate.ts          # Input validation helpers
│   └── middleware.ts            # Auth guard — redirects to /login
├── .env.example                 # Safe env template
├── vercel.json                  # Vercel deployment config
└── next.config.ts               # Security headers, TS/ESLint config
```

---

## Database

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full schema diagram and data flow.

## API Reference

See [docs/API.md](docs/API.md) for all endpoints, request/response shapes, and error codes.

## Authentication & Roles

See [docs/AUTH.md](docs/AUTH.md) for the auth flow, session model, and role permissions.
