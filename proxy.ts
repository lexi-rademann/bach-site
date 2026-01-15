import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "bach_access";

export function proxy(req: NextRequest) {
  // Bypass auth entirely in local dev when DEV_BYPASS_AUTH is set
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // Allow these without being "unlocked"
  if (
    pathname.startsWith("/unlock") ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check cookie
  const hasAccess = req.cookies.get(COOKIE_NAME)?.value === "1";
  if (!hasAccess) {
    const url = req.nextUrl.clone();
    url.pathname = "/unlock";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
