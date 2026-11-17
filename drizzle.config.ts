import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://baserow_user:baserow_pass@localhost:5432/baserow_lite',
  },
  verbose: true,
  strict: true,
});
