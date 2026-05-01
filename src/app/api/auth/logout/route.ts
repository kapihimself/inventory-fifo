import { NextResponse } from "next/server";

// POST /api/auth/logout — clears the session cookie and returns a redirect hint
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("banksumut_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return res;
}
