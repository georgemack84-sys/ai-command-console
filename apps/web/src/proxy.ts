import { NextResponse, type NextRequest } from 'next/server';

import { environment } from '@/config/environment';
import { resolveSafeReturnPath } from '@/lib/auth/return-path';
import {
  sessionCookieContract,
  sessionCookieName,
} from '@/lib/auth/session-cookie-contract';

/** Admission only: opaque cookie presence and bounded length, never authentication. */
export function proxy(request: NextRequest): NextResponse {
  const value = request.cookies.get(
    sessionCookieName(environment.NEXT_PUBLIC_ENVIRONMENT),
  )?.value;
  if (value && value.length <= sessionCookieContract.maximumLength)
    return NextResponse.next();
  const login = new URL('/login', request.url);
  login.searchParams.set(
    'returnTo',
    resolveSafeReturnPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ),
  );
  return NextResponse.redirect(login);
}
export const config = {
  matcher: ['/dashboard/:path*', '/components/:path*', '/shell-states/:path*'],
};
