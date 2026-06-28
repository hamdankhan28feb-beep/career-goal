// ─── Lightweight session management (cookie-based, no next-auth needed) ───────
// Edge-safe utilities — no Node.js fs imports (used by middleware).

export const SESSION_COOKIE = 'fp_session';

export type UserRole = 'student' | 'admin' | 'parent' | 'counselor';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
};

/** Check if a user has admin privileges */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

/** Generates a simple session token string (demo only — not cryptographically secure) */
export function createSessionToken(user: SessionUser): string {
  const payload = { ...user, iat: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/** Decodes a session token (demo only — no signature verification) */
export function decodeSessionToken(token: string): SessionUser | null {
  try {
    const json =
      typeof atob === 'function'
        ? atob(token)
        : Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as SessionUser & { iat: number };
    const { iat: _iat, ...user } = payload;
    return user as SessionUser;
  } catch {
    return null;
  }
}
