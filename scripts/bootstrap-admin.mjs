#!/usr/bin/env node
/**
 * One-off admin bootstrap. Reads ADMIN_EMAIL and ADMIN_PASSWORD from the
 * environment (never hardcoded). Creates the user only when you run it.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... DATABASE_URL=... node scripts/bootstrap-admin.mjs
 *
 * Does nothing unless all three are set. Does not print the password or the
 * database URL.
 */
import { hash } from 'bcryptjs';

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const databaseUrl = process.env.DATABASE_URL || '';

if (!email || !password || !databaseUrl) {
  console.error('Refusing to run. Set ADMIN_EMAIL, ADMIN_PASSWORD and DATABASE_URL in the environment. Nothing was written.');
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('ADMIN_EMAIL is not a usable email address. Nothing was written.');
  process.exit(1);
}
if (password.length < 12 || password.length > 128) {
  console.error('ADMIN_PASSWORD must be 12–128 characters. Nothing was written.');
  process.exit(1);
}

const { default: pg } = await import('pg');
const pool = new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
const passwordHash = await hash(password, 12);
const client = await pool.connect();
try {
  const existing = await client.query('SELECT id, role FROM users WHERE email = $1', [email]);
  if (existing.rowCount) {
    await client.query(
      `UPDATE users SET password_hash = $2, role = 'admin', is_active = true, updated_at = NOW() WHERE email = $1`,
      [email, passwordHash],
    );
    console.log('Updated existing user to admin. Password was taken from the environment and is not printed.');
  } else {
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'admin', true)`,
      [email.split('@')[0], email, passwordHash],
    );
    console.log('Created admin user. Password was taken from the environment and is not printed.');
  }
} catch (err) {
  console.error('Admin bootstrap failed:', err instanceof Error ? err.message : 'unknown error');
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
