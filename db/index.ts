import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

const globalForDb = globalThis as unknown as {
  conn: pg.Pool | undefined;
};

const pool =
  globalForDb.conn ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://baserow_user:baserow_pass@localhost:5432/baserow_lite',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.conn = pool;

export const db = drizzle(pool, { schema });
export { schema };
