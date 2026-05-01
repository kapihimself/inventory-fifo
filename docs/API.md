# API Reference

All endpoints live under `/api/`. They accept and return `application/json`. All write operations are wrapped in `prisma.$transaction()` for atomicity.

---

## Auth

### `POST /api/auth/login`

Validates credentials. Tries the database first; falls back to demo accounts if Supabase is paused.

**Request body**
```json
{ "email": "adminsumut@gmail.com", "password": "SUMUT123" }
```

**Success — 200**
```json
{
  "user": {
    "name": "Admin Pusat",
    "email": "adminsumut@gmail.com",
    "role": "ADMIN_PUSAT",
    "branch": "Kantor Pusat Medan",
    "initials": "AP"
  }
}
```
Also sets httpOnly cookie `banksumut_session=<role>` (max-age 8h).

**Errors**
| Status | Condition |
|---|---|
| 400 | Email format invalid or password < 4 chars |
| 401 | Credentials not found (uniform message — never reveals whether email exists) |
| 500 | Server error |

---

### `POST /api/auth/logout`

Clears the session cookie.

**Success — 200** `{ "ok": true }`

---

## Inventory

### `GET /api/inventory`

Returns all catalog items with current stock totals.

**Response — 200**
```json
[
  {
    "id": "clx...",
    "name": "Kertas HVS A4 80gr",
    "category": "ATK",
    "unit": "Rim",
    "minStock": 50,
    "totalStock": 320,
    "lastReceivedDate": "2026-03-20T00:00:00.000Z",
    "lastPrice": 55000,
    "status": "Tersedia"   // "Tersedia" | "Hampir Habis" | "Habis"
  }
]
```

`status` is computed:
- `Habis` — totalStock === 0
- `Hampir Habis` — 0 < totalStock ≤ minStock
- `Tersedia` — totalStock > minStock

---

### `POST /api/inventory`

Creates a new catalog item with an optional initial stock batch.

**Request body**
```json
{
  "name": "Toner HP 85A",
  "categoryName": "ATK",
  "unit": "Pcs",
  "minStock": 5,
  "initialQty": 10,
  "price": 850000
}
```

**Success — 201** — the created `Item` row.

**Errors** — 400 if `name`, `categoryName`, or `unit` missing.

---

### `PUT /api/inventory/[id]`

Updates item metadata (name, unit, minStock). Does not touch stock levels.

**Request body** — any subset of `{ name, unit, minStock }`.

**Errors** — 400 for invalid id format.

---

### `DELETE /api/inventory/[id]`

Deletes an item. Blocked (400) if any `StockBatch` rows exist for the item — items with stock history cannot be deleted to preserve audit trail.

---

### `GET /api/inventory/[id]/history`

Returns the complete FIFO transaction timeline for one item.

**Response — 200**
```json
{
  "item": { "id": "clx...", "name": "Kertas HVS A4 80gr", "category": "ATK", "unit": "Rim", "minStock": 50, "totalStock": 320 },
  "batches": [
    { "id": "clx...", "receivedDate": "2026-01-15T...", "initialQuantity": 200, "currentQuantity": 0, "price": 50000, "used": 200 }
  ],
  "timeline": [
    { "type": "MASUK", "date": "2026-01-15T...", "qty": 200, "price": 50000, "batchId": "clx...", "batchInitial": 200, "description": "Penerimaan Stok", "runningStock": 200 },
    { "type": "KELUAR", "date": "2026-02-03T...", "qty": 50, "price": 50000, "batchId": "clx...", "batchInitial": 200, "description": "Distribusi ke Cabang Binjai", "suratJalan": "SJ-20260203-001", "branch": "Cabang Binjai", "runningStock": 150 }
  ]
}
```

`timeline` is sorted by date ascending with a computed `runningStock` at each event.

---

### `POST /api/inventory/[id]/restock`

Adds a new stock batch to an existing item.

**Request body**
```json
{ "quantity": 100, "price": 55000, "receivedDate": "2026-04-30" }
```

**Success — 201** — the created `StockBatch` row.

**Errors** — 400 for invalid id or quantity ≤ 0; 404 if item not found.

---

## Requests

### `GET /api/requests`

Returns all supply requests, optionally filtered by status.

**Query params** — `?status=PENDING` (valid values: `PENDING`, `PARTIAL`, `COMPLETED`, `CANCELLED`)

**Response — 200** — array of `Request` objects including `branch`, nested `items` (with `item` details), and `distributions`.

**Errors** — 400 if `status` is not a valid enum value.

---

### `POST /api/requests`

Creates a supply request from a branch.

**Request body**
```json
{
  "branchId": "clx...",
  "items": [
    { "itemId": "clx...", "quantityRequested": 5 },
    { "itemId": "clx...", "quantityRequested": 20 }
  ]
}
```

**Success — 201** — the created `Request` with all nested relations.

**Errors** — 400 if `branchId` or `items` missing; 404 if branch not found.

---

### `PATCH /api/requests/[id]`

Cancels a request. Only `{ "status": "CANCELLED" }` is accepted — other status transitions happen via the distribution endpoint.

**Request body** `{ "status": "CANCELLED" }`

**Errors**
| Status | Condition |
|---|---|
| 400 | Invalid id format or status != CANCELLED |
| 404 | Request not found |
| 409 | Request is already COMPLETED |

---

### `DELETE /api/requests/[id]`

Soft-cancels a request (sets status to CANCELLED). Only works when the request is currently PENDING.

**Errors** — 404 not found; 409 if status is not PENDING.

---

## Distributions

### `GET /api/distributions`

Returns distribution records with item details.

**Query params** — `?limit=N` (clamped to max 100, default 50).

**Response — 200**
```json
[
  {
    "id": "clx...",
    "suratJalanNumber": "SJ-20260402-001",
    "status": "DELIVERED",
    "createdAt": "2026-04-02T...",
    "request": { "id": "clx...", "branch": { "name": "Cabang Binjai" } },
    "items": [
      { "id": "clx...", "quantity": 5, "nama": "Kertas HVS A4 80gr", "unit": "Rim", "harga": 55000 }
    ]
  }
]
```

---

### `POST /api/distribution`

Processes a distribution — deducts stock FIFO and generates a Surat Jalan number.

**Request body**
```json
{
  "requestId": "clx...",
  "items": [
    { "itemId": "clx...", "quantity": 5 }
  ]
}
```

**Success — 201**
```json
{ "distribution": { "id": "clx...", "suratJalanNumber": "SJ-20260430-003" } }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing requestId/items |
| 404 | Request not found |
| 409 | Requested quantity exceeds available stock |

**Side effects** (all inside `$transaction`):
- Deducts `StockBatch.currentQuantity` FIFO
- Creates `DistributionItem` rows linking each deduction to a batch
- Increments `RequestItem.quantityFulfilled`
- Updates `Request.status` (PARTIAL or COMPLETED)
- Creates `AuditLog` record

---

## Dashboard

### `GET /api/dashboard/stats`

Returns aggregate numbers for the four stat cards.

**Response — 200**
```json
{
  "totalATK": 1840,
  "totalForm": 560,
  "pendingRequests": 4,
  "inTransit": 0,
  "lowStockItems": 3,
  "outOfStockItems": 1,
  "totalItems": 28
}
```

---

## Branches

### `GET /api/branches`

Returns all branches sorted by name.

**Response — 200**
```json
[
  { "id": "clx...", "name": "Cabang Binjai", "code": "BNJ", "createdAt": "..." }
]
```

---

## Reports

### `GET /api/reports/procurement`

Returns all stock-in (StockBatch) records for the procurement report tab.

**Query params** — `?limit=N` (max 500, default 200).

**Response — 200**
```json
[
  {
    "no": 1,
    "tgl": "2026-01-15",
    "batchId": "clx...",
    "itemId": "clx...",
    "nama": "Kertas HVS A4 80gr",
    "unit": "Rim",
    "category": "ATK",
    "qty": 200,
    "price": 50000,
    "total": 10000000
  }
]
```

---

## Common Error Shape

All error responses use this shape:
```json
{ "error": "Human-readable error message in Bahasa Indonesia" }
```

HTTP status codes used:
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request (validation failed) |
| 401 | Authentication failed |
| 404 | Resource not found |
| 409 | Conflict (state violation) |
| 500 | Internal server error |
