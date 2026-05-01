import { NextRequest, NextResponse } from "next/server";

export function getSessionRole(req: NextRequest): string | null {
  return req.cookies.get("banksumut_session")?.value ?? null;
}

export function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): NextResponse | null {
  const role = getSessionRole(req);
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Akses ditolak. Peran Anda tidak memiliki izin untuk tindakan ini." },
      { status: 403 }
    );
  }
  return null;
}
