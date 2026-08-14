import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'fp_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type UserRole = 'user' | 'admin';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_JWT_SECRET must be set to a random value of at least 32 characters.');
  }

  return new TextEncoder().encode(secret);
}

export function isAdmin(user: SessionUser | null): user is SessionUser & { role: 'admin' } {
  return user?.role === 'admin';
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    city: user.city,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .setIssuer('futurepath')
    .setAudience('futurepath-web')
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: 'futurepath',
      audience: 'futurepath-web',
    });

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.role !== 'user' && payload.role !== 'admin')
    ) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      city: typeof payload.city === 'string' ? payload.city : undefined,
    };
  } catch {
    return null;
  }
}
