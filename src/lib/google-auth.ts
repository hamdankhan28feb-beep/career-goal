export const GOOGLE_OAUTH_STATE_COOKIE = 'fp_oauth_state';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/**
 * Reads Google OAuth credentials from the environment.
 * `requestOrigin` is used to build a default redirect URI when
 * GOOGLE_REDIRECT_URI is not set explicitly.
 */
export function isGoogleOAuthConfigured(requestOrigin?: string): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? (requestOrigin ? `${requestOrigin}/api/auth/google/callback` : '');
  return Boolean(clientId && clientSecret && redirectUri);
}

export function getGoogleOAuthConfig(requestOrigin?: string): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? (requestOrigin ? `${requestOrigin}/api/auth/google/callback` : '');

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED');
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(config: GoogleOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    include_granted_scopes: 'true',
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleTokenResult = {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export async function exchangeCodeForTokens(config: GoogleOAuthConfig, code: string): Promise<GoogleTokenResult> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');
  }

  const data = (await res.json()) as GoogleTokenResult & { error?: string };
  if (data.error || !data.access_token) {
    throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  };
}

export type GoogleUserProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('GOOGLE_USERINFO_FAILED');
  }

  return (await res.json()) as GoogleUserProfile;
}
