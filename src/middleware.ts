import { NextRequest, NextResponse } from "next/server";

// Routes that require a valid session cookie
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inventory",
  "/reports",
  "/settings",
  "/transactions",
  "/branch",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("banksumut_session");
  if (!session?.value) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all app routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
