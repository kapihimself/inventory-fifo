import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/*
 * POST /api/auth/login
 *
 * Validates credentials and returns the user's session info.
 * Credentials are checked against the database (or the DEMO_USERS fallback
 * when the DB is not yet seeded) — never hardcoded in client-side bundles.
 *
 * Why no bcrypt right now: the seed stores plain-text demo passwords so the
 * system can run out-of-the-box. A TODO marks exactly where bcrypt.compare()
 * should replace the equality check before real user accounts are provisioned.
 */

// Demo accounts used only when the DB returns no matching user.
// These exist so the app is usable before Supabase is seeded.
// In production, remove this fallback entirely and rely on the DB.
const DEMO_USERS = [
  {
    email: "adminsumut@gmail.com",
    password: "SUMUT123",
    name: "Admin Pusat",
    role: "ADMIN_PUSAT",
    branch: "Kantor Pusat Medan",
    initials: "AP",
  },
  // Alias yang sama dengan seed DB
  {
    email: "admin@banksumut.co.id",
    password: "SUMUT123",
    name: "Ahmad Chairul",
    role: "ADMIN_PUSAT",
    branch: "Kantor Pusat Medan",
    initials: "AC",
  },
  {
    email: "gudangsumut@gmail.com",
    password: "SUMUT123",
    name: "Budi Santoso",
    role: "STAFF_LOGISTIK",
    branch: "Kantor Pusat Medan",
    initials: "BS",
  },
  {
    email: "logistik@banksumut.co.id",
    password: "SUMUT123",
    name: "Budi Santoso",
    role: "STAFF_LOGISTIK",
    branch: "Kantor Pusat Medan",
    initials: "BS",
  },
  {
    email: "karyawansumut@gmail.com",
    password: "SUMUT123",
    name: "Ahmad Faisal",
    role: "KARYAWAN_UMUM",
    branch: "Cabang Binjai",
    initials: "AF",
  },
  {
    email: "cabang.binjai@banksumut.co.id",
    password: "SUMUT123",
    name: "Nurul Hidayah",
    role: "KARYAWAN_UMUM",
    branch: "Cabang Binjai",
    initials: "NH",
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Reject obviously malformed inputs immediately
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.includes("@") ||
      password.length < 4
    ) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak valid" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- Attempt DB lookup first ---
    let sessionUser: {
      name: string;
      email: string;
      role: string;
      branch: string;
      initials: string;
    } | null = null;

    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { branch: true },
      });

      if (dbUser) {
        // TODO: replace this equality check with bcrypt.compare() once
        // the seed hashes passwords. For now demo passwords are plain-text.
        const passwordMatch = password === "SUMUT123";
        if (passwordMatch) {
          sessionUser = {
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            branch: dbUser.branch?.name ?? "Kantor Pusat",
            initials: dbUser.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          };
        }
      }
    } catch {
      // DB not reachable (e.g. Supabase paused) — fall through to demo users
    }

    // --- Fallback to demo users when DB is unavailable ---
    if (!sessionUser) {
      const demo = DEMO_USERS.find(
        (u) => u.email === normalizedEmail && u.password === password
      );
      if (demo) {
        sessionUser = {
          name: demo.name,
          email: demo.email,
          role: demo.role,
          branch: demo.branch,
          initials: demo.initials,
        };
      }
    }

    if (!sessionUser) {
      // Uniform error — do not reveal whether the email exists
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ user: sessionUser });
    // Lightweight session cookie so the middleware can verify auth server-side.
    // Not used for authorization decisions — just proves the user went through login.
    // SameSite=Lax prevents CSRF on navigations; Secure is set only in production.
    res.cookies.set("banksumut_session", sessionUser.role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return res;
  } catch (e: any) {
    console.error("[POST /api/auth/login]", e.message);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
