import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { buildGoogleAuthUrl, getGoogleOAuthConfig, GOOGLE_OAUTH_STATE_COOKIE } from '@/lib/google-auth';
import { sanitizeRedirectPath } from '@/lib/utils';

const STATE_MAX_AGE_SECONDS = 60 * 10;

// Starts the Google OAuth flow: stores a short-lived state cookie (which also
// carries the post-login redirect target) and bounces the user to Google.
export async function GET(request: NextRequest) {
  let config;
  try {
    config = getGoogleOAuthConfig(new URL(request.url).origin);
  } catch {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'google_not_configured');
    return NextResponse.redirect(loginUrl);
  }

  const state = randomUUID();
  const redirect = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirect')) ?? '/';

  const response = NextResponse.redirect(buildGoogleAuthUrl(config, state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, JSON.stringify({ state, redirect }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_MAX_AGE_SECONDS,
  });

  return response;
}
