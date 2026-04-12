import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/src/server/auth/session-token";

const protectedPrefixes = ["/dashboard", "/briefs", "/reports", "/operations", "/platform", "/access", "/console", "/settings"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = readSessionToken(token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/briefs/:path*", "/reports/:path*", "/operations/:path*", "/platform/:path*", "/access/:path*", "/console/:path*", "/settings/:path*"],
};
