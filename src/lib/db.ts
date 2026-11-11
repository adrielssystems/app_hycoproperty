import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows;
}

