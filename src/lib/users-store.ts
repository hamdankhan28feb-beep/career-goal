import { query } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';

// Helper to ensure the users table exists.
async function ensureUsersTableExists() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      city TEXT,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getRegisteredUsers(): Promise<SessionUser[]> {
  try {
    await ensureUsersTableExists();
    const res = await query('SELECT id, name, email, role, city FROM users');
    return res.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      city: row.city || undefined
    }));
  } catch (err) {
    console.error('Failed to get registered users:', err);
    return [];
  }
}

export async function getRegisteredPassword(email: string): Promise<string | null> {
  try {
    await ensureUsersTableExists();
    const res = await query('SELECT password FROM users WHERE LOWER(email) = $1', [email.toLowerCase()]);
    if (res.rows.length === 0) return null;
    return res.rows[0].password;
  } catch (err) {
    console.error('Failed to get registered password:', err);
    return null;
  }
}

export async function registerUser(
  user: SessionUser, 
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  try {
    await ensureUsersTableExists();
    const email = user.email.toLowerCase();

    // Check if user already exists
    const checkRes = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
    if (checkRes.rows.length > 0) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const saved = { ...user, email };
    await query(
      `INSERT INTO users (id, name, email, role, city, password) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        saved.id,
        saved.name,
        saved.email,
        saved.role,
        saved.city || null,
        password
      ]
    );

    return { ok: true, user: saved };
  } catch (err: any) {
    console.error('Failed to register user:', err);
    return { ok: false, error: err.message || 'Registration failed.' };
  }
}
