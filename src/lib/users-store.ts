import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';

import type { SessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin';
  city: string | null;
  password_hash: string;
  is_active: boolean;
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  city?: string;
  passwordHash: string;
  isActive: boolean;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  city?: string;
};

function toStoredUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name ?? 'FuturePath User',
    email: row.email,
    role: row.role,
    city: row.city ?? undefined,
    passwordHash: row.password_hash,
    isActive: row.is_active,
  };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const result = await query(
    `SELECT id, name, email, role, city, password_hash, is_active
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  const row = result.rows[0] as UserRow | undefined;

  return row ? toStoredUser(row) : null;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

/**
 * Finds a user by email, or creates one from a verified Google profile.
 * OAuth users get an unguessable placeholder password hash so they can
 * never sign in with a password. Existing users keep their role.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<StoredUser> {
  const email = profile.email.trim().toLowerCase();
  const name = profile.name?.trim() || email.split('@')[0] || 'FuturePath User';
  const passwordHash = `__GOOGLE_OAUTH__${randomUUID()}`;

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'user')
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
     RETURNING id, name, email, role, city, password_hash, is_active`,
    [name, email, passwordHash],
  );

  return toStoredUser(result.rows[0] as UserRow);
}

export async function registerUser(input: CreateUserInput): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hash(input.password, 12);

  try {
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, city)
       VALUES ($1, $2, $3, 'user', $4)
       RETURNING id, name, email, role, city, password_hash, is_active`,
      [input.name.trim(), email, passwordHash, input.city?.trim() || null],
    );
    const user = toStoredUser(result.rows[0] as UserRow);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
    };
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    throw error;
  }
}
