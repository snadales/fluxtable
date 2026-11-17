import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

/**
 * Resuelve un ID de tabla recibido en los endpoints de API:
 * - Si es numérico (ej. "865", "1030"), busca por legacy_id.
 * - Si es UUID, valida y retorna el UUID directo.
 */
export async function resolveTableId(param: string): Promise<string | null> {
  if (!param) return null;

  // 1. Si es numérico legacy
  if (/^\d+$/.test(param)) {
    const legacyNum = parseInt(param, 10);
    const tbl = await db.query.tables.findFirst({
      where: eq(schema.tables.legacyId, legacyNum),
    });
    return tbl ? tbl.id : null;
  }

  // 2. Si es formato UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
  if (isUuid) {
    return param;
  }

  return null;
}
