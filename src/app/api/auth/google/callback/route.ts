import { NextRequest, NextResponse } from 'next/server';

import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';
import {
  exchangeCodeForTokens,
  fetchGoogleUserProfile,
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
} from '@/lib/google-auth';
import { findOrCreateGoogleUser } from '@/lib/users-store';
import { sanitizeRedirectPath } from '@/lib/utils';

type StoredOAuthState = { state: string; redirect?: string };

function redirectToLogin(request: NextRequest, error: string): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('error', error);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}

// Completes the Google OAuth flow: validates the state, exchanges the code for
// tokens, resolves the Google profile to a local user, and issues a session.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get('error')) {
    return redirectToLogin(request, 'google_denied');
  }

  const code = params.get('code');
  const stateParam = params.get('state');

  let stored: StoredOAuthState | null = null;
  const raw = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  try {
    stored = raw ? (JSON.parse(raw) as StoredOAuthState) : null;
  } catch {
    stored = null;
  }

  if (!code || !stateParam || !stored || stored.state !== stateParam) {
    return redirectToLogin(request, 'invalid_oauth');
  }

  let config;
  try {
    config = getGoogleOAuthConfig(new URL(request.url).origin);
  } catch {
    return redirectToLogin(request, 'google_not_configured');
  }

  try {
    const tokens = await exchangeCodeForTokens(config, code);
    const profile = await fetchGoogleUserProfile(tokens.access_token);

    if (!profile.email || profile.email_verified !== true) {
      return redirectToLogin(request, 'email_not_verified');
    }

    const user = await findOrCreateGoogleUser(profile);
    const sessionToken = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
    });

    const redirect =
      sanitizeRedirectPath(stored.redirect) ?? (user.role === 'admin' ? '/admin' : '/dashboard');

    const response = NextResponse.redirect(new URL(redirect, request.url));
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      priority: 'high',
    });
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);

    return response;
  } catch {
    return redirectToLogin(request, 'oauth_failed');
  }
}
