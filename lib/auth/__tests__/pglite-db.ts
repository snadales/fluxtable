/**
 * BD Postgres en memoria (PGlite) con el esquema actual de Drizzle, para pruebas de integración
 * de rutas (#54). No toca ninguna BD real.
 */
import { createRequire } from 'module';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';

export async function createTestDb() {
  const client = new PGlite();
  // La versión ESM de drizzle-kit/api no carga en vitest; se usa la CJS.
  const { generateDrizzleJson, generateMigration } = createRequire(import.meta.url)('drizzle-kit/api');
  const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema as any));
  for (const stmt of statements) await client.exec(stmt);
  const db = drizzle(client, { schema });
  return { client, db };
}
