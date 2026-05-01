# Architecture

## System Layers

```
Browser (React / "use client")
        │  fetch()
        ▼
Next.js Route Handlers  (src/app/api/**/route.ts)
        │  prisma.*
        ▼
Prisma ORM  (src/lib/prisma.ts singleton)
        │  SQL over TLS
        ▼
Supabase PostgreSQL (cloud-hosted)
```

The app has no separate backend server. Every API call goes through Next.js Route Handlers running as serverless functions (on Vercel) or as a Node.js server (local dev). There is no Express, no separate service layer.

---

## Database Schema

11 tables. All primary keys are Prisma cuid (`String @id @default(cuid())`).

```
Branch          — bank branches (6 seeded)
User            — staff accounts, one branch each, one role
Category        — item categories (ATK, Form, SB, dll)
Item            — catalog entries (name unique, unit, minStock)
StockBatch      — one row per purchase/receipt; FIFO deduction via oldest-first ordering
Request         — a branch's supply request (PENDING→PARTIAL→COMPLETED or CANCELLED)
RequestItem     — line items inside a request (itemId, quantityRequested, quantityFulfilled)
Distribution    — fulfillment event; generates a Surat Jalan number (SJ-YYYYMMDD-NNN)
DistributionItem— line items deducted from specific StockBatches during distribution
Receipt         — acknowledgement of delivery by the receiving branch
AuditLog        — append-only log of every write operation (action, entity, entityId, newData)
```

### FIFO Stock Model

Each purchase creates a `StockBatch` row with `initialQuantity` and `currentQuantity`. When a distribution is processed, the API orders batches by `receivedDate ASC` and deducts from the oldest batch first. If a batch is exhausted before the requested quantity is met, it moves to the next batch.

```
StockBatch rows for "Kertas A4 80gr":
  batch A  receivedDate=2026-01-15  initialQty=200  currentQty=0   (exhausted)
  batch B  receivedDate=2026-02-10  initialQty=200  currentQty=120 (partly used)
  batch C  receivedDate=2026-03-20  initialQty=200  currentQty=200 (untouched)

Distribution request: 50 units
→ batch A already 0, skip
→ deduct 50 from batch B → currentQty becomes 70
```

### Request Lifecycle

```
PENDING ──► PARTIAL   (some items fulfilled, not all)
        └─► COMPLETED (all requestItems fully fulfilled)
        └─► CANCELLED (manual cancel, only from PENDING or PARTIAL)
```

`RequestItem.quantityFulfilled` is incremented each time a distribution covers that item. The parent `Request.status` is recalculated after each distribution commit:
- All items fully fulfilled → COMPLETED
- At least one item partially fulfilled → PARTIAL

---

## Request / Response Data Flow

### Example: Branch submits a supply request

```
1. User fills form at /transactions/request
2. POST /api/requests  { branchId, items: [{ itemId, quantityRequested }] }
3. Route handler validates branchId exists in DB
4. $transaction:
     a. request.create  (status: PENDING)
     b. requestItem.createMany  (one per item)
     c. auditLog.create
5. Returns { id, branch, items, ... }  HTTP 201
6. Client shows success banner with request ID
```

### Example: Staff processes batch distribution

```
1. Staff opens /dashboard/batch
2. Page fetches /api/requests?status=PENDING and /api/inventory in parallel
3. Staff selects items and quantities to fulfill
4. For each requestId in selection:
   POST /api/distribution  { requestId, items: [{ itemId, quantity }] }
5. Route handler (inside $transaction):
     a. Generates SJ number: SJ-YYYYMMDD-NNN (padded sequence per day)
     b. FIFO deduction loop: orders StockBatch by receivedDate ASC
        - deducts from oldest batch until quantity met
        - updates StockBatch.currentQuantity
        - creates DistributionItem linking batch + quantity
     c. Increments RequestItem.quantityFulfilled
     d. Recalculates Request.status → PARTIAL or COMPLETED
     e. distribution.create  (suratJalanNumber, status: DELIVERED)
     f. auditLog.create
6. Returns { distribution: { id, suratJalanNumber } }
7. Client shows SJ number in success modal
```

---

## Security Headers

Set in `next.config.ts` for all routes:

| Header | Value |
|---|---|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() |
| Strict-Transport-Security | max-age=63072000 (production only) |

---

## Middleware Auth Guard

`src/middleware.ts` intercepts every request to protected paths (`/dashboard`, `/inventory`, `/reports`, `/settings`, `/transactions`, `/branch`). If the `banksumut_session` httpOnly cookie is absent, it performs a 307 redirect to `/login?next=<original-path>`. The cookie is set by `POST /api/auth/login` and cleared by `POST /api/auth/logout`.

---

## Prisma Singleton

Next.js hot-reload in dev mode re-evaluates modules on each file change, which would create a new `PrismaClient` instance per reload — exhausting the connection pool in minutes. `src/lib/prisma.ts` uses the `globalThis` trick:

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

In production, module caching handles it naturally; in dev, we store the instance on `globalThis` so it survives hot-reloads.
