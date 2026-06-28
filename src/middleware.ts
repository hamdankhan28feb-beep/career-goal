import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { decodeSessionToken, SESSION_COOKIE } from '@/lib/auth';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const user = token ? decodeSessionToken(token) : null;

    if (!user || user.role !== 'admin') {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
