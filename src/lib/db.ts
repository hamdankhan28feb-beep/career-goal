import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === 'production') {
  console.warn('Warning: DATABASE_URL is not set. Database connections may fail.');
}

export const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/career_goal',
  max: 20,
  idleTimeoutMillis: 30000,
  // Generous connect timeout: on a cold start the pool opens many clients at
  // once (getUniversities fires 20 parallel queries) and Windows auth/TLS
  // handshakes can take several seconds. 2s caused spurious timeouts.
  connectionTimeoutMillis: 10000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}
