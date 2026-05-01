# Authentication & Authorization

## Login Flow

```
1. User submits email + password to the login form (/login)
2. Client POSTs { email, password } to POST /api/auth/login
3. Server-side route handler (never runs in the browser):
   a. Validates input format (email contains "@", password >= 4 chars)
   b. Normalizes email to lowercase
   c. Tries prisma.user.findUnique({ where: { email } })
      - If DB is unreachable (Supabase paused), catches the error and falls through
      - If found: checks password (currently plain-text equality; TODO: bcrypt.compare)
   d. Falls back to DEMO_USERS constant if DB returned nothing
   e. Returns uniform 401 for wrong credentials (never reveals whether email exists)
4. On success:
   a. Returns { user: { name, email, role, branch, initials } } — no password ever sent
   b. Sets httpOnly cookie: banksumut_session=<role>  (8h, SameSite=Lax, Secure in prod)
5. Client stores the user object in localStorage (for sidebar display / role gating)
6. Client navigates to /dashboard
```

---

## Session Model

Two stores run in parallel:

| Store | What it holds | Used by |
|---|---|---|
| `localStorage["banksumut_user"]` | `{ name, email, role, branch, initials }` | Sidebar (display), client-side role gating, settings form pre-population |
| `banksumut_session` cookie (httpOnly) | `<role>` string | `src/middleware.ts` — server-side auth guard |

The localStorage value is read-only by JavaScript; it's there for UI convenience. The httpOnly cookie cannot be read by JavaScript — it's exclusively for the server middleware to perform the redirect check.

---

## Middleware Auth Guard

`src/middleware.ts` runs on the Edge before any page is rendered.

**Protected paths** — any route starting with:
- `/dashboard`
- `/inventory`
- `/reports`
- `/settings`
- `/transactions`
- `/branch`

**Logic:**
1. Check if the request path starts with a protected prefix
2. If not protected: pass through (`NextResponse.next()`)
3. If protected and cookie `banksumut_session` is absent or empty: redirect 307 to `/login?next=<original-path>`
4. If protected and cookie is present: pass through

The middleware does **not** validate the cookie value against the database. It only checks presence. This is an intentional tradeoff — full JWT validation on every page request would add DB round-trips on every navigation. The cookie is httpOnly and SameSite=Lax, so CSRF is mitigated. For a higher-security environment, replace the cookie value with a signed JWT and verify the signature in middleware.

---

## Logout Flow

```
1. User clicks "Keluar" in the Sidebar
2. Client POSTs to POST /api/auth/logout
3. Server sets banksumut_session cookie with maxAge=0 (immediate expiry)
4. Client removes "banksumut_user" from localStorage
5. Client navigates to /login
```

---

## Roles

Four roles are defined in `prisma/schema.prisma`:

| Role | Indonesian Label | What they can do |
|---|---|---|
| `ADMIN_PUSAT` | Admin Pusat | All operations: inventory CRUD, process distributions, manage requests, view all reports |
| `STAFF_LOGISTIK` | Staff Gudang | Manage inventory, process distributions, restock |
| `MANAGER` | Manager | View dashboard and reports; approve requests |
| `KARYAWAN_UMUM` | Karyawan Umum | Submit requests from their branch; view status |

Role values are stored in the session cookie and in `localStorage["banksumut_user"].role`. The `Sidebar` component reads the role from localStorage and conditionally renders nav items:

```typescript
// Sidebar.tsx — items with "roles" only appear for those roles
{ href: '/dashboard/batch', label: 'Proses Distribusi', roles: ['ADMIN_PUSAT', 'STAFF_LOGISTIK'] }
```

**Important:** Client-side role gating (hiding menu items) is a UX convenience — it is **not** a security boundary. All server-side API routes should perform their own authorization checks if sensitive operations need to be role-restricted (currently not implemented; all authenticated users can call any API).

---

## Demo Accounts

Defined in `src/app/api/auth/login/route.ts` as a compile-time constant. They exist so the app runs out of the box before Supabase is seeded, and are only used when the DB lookup returns nothing.

```typescript
const DEMO_USERS = [
  { email: "adminsumut@gmail.com",   password: "SUMUT123", role: "ADMIN_PUSAT", ... },
  { email: "karyawansumut@gmail.com", password: "SUMUT123", role: "KARYAWAN_UMUM", ... },
  { email: "gudangsumut@gmail.com",  password: "SUMUT123", role: "STAFF_LOGISTIK", ... },
];
```

**Before going to production:** Remove the `DEMO_USERS` fallback entirely and implement `bcrypt.compare()` for password verification. The comment `// TODO: replace with bcrypt.compare()` marks the exact line in the login route.

---

## Password Security Status

| Item | Current State | Production Recommendation |
|---|---|---|
| Credential validation | Plain-text equality (demo passwords) | `bcrypt.compare()` against hashed passwords |
| Password storage in DB | Plain-text `SUMUT123` in seed | Hash with `bcrypt.hash(pw, 12)` before storing |
| Session | httpOnly cookie (role value) | Signed JWT or server-side session store |
| DEMO_USERS fallback | Present | Remove before provisioning real user accounts |
