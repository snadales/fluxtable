import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { BiQueryBuilder, BiQueryConfig } from '@/lib/bi/analytics/query-builder';
import { biCacheManager } from '@/lib/bi/analytics/cache-manager';
import { biPoolManager, BiSourceType } from '@/lib/bi/connectors/pool-manager';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const sourceType: BiSourceType = body.sourceType || 'local_baserow';
    const useCache: boolean = body.useCache !== false;
    const cacheTtlMs: number = body.cacheTtlMs || 60 * 1000;

    let targetSql = '';
    let targetParams: any[] = [];

    if (body.queryConfig) {
      const built = BiQueryBuilder.buildQuery(body.queryConfig as BiQueryConfig);
      targetSql = built.sql;
      targetParams = built.params;
    } else if (body.rawSql) {
      targetSql = body.rawSql.trim();
      targetParams = body.params || [];
    } else {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Se requiere queryConfig o rawSql' },
        { status: 400 }
      );
    }

    // 0. Blindaje Defensivo Global: Solo lectura estricta para todo tipo de fuente
    const forbiddenMutation = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|CREATE|REPLACE)\b/i;
    if (forbiddenMutation.test(targetSql)) {
      return NextResponse.json(
        { error: 'FORBIDDEN_MUTATION', message: 'CONSULTA_BLOQUEADA: Solo se permiten consultas SELECT de lectura analítica' },
        { status: 403 }
      );
    }

    // 1. Revisar Caché
    const cacheKey = biCacheManager.generateKey(sourceType, targetSql, targetParams, body.filters);
    if (useCache) {
      const cached = biCacheManager.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          data: cached.data,
          columns: cached.columns,
          meta: {
            durationMs: 1,
            cached: true,
            rowCount: cached.data.length,
            source: sourceType,
          },
        });
      }
    }

    // 2. Ejecución
    const start = Date.now();
    let rows: any[] = [];
    let columns: string[] = [];

    if (sourceType === 'local_baserow') {
      // Reemplazar $1, $2 por parámetros sanitizados si se usa raw query o drizzle execute
      if (targetParams.length > 0) {
        let parameterizedSql = targetSql;
        targetParams.forEach((val, idx) => {
          const placeholder = `$${idx + 1}`;
          const safeVal = typeof val === 'number' ? val : `'${String(val).replace(/'/g, "''")}'`;
          parameterizedSql = parameterizedSql.replace(placeholder, String(safeVal));
        });
        const result: any = await db.execute(sql.raw(parameterizedSql));
        rows = result.rows || result;
      } else {
        const result: any = await db.execute(sql.raw(targetSql));
        rows = result.rows || result;
      }

      if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      }
    } else {
      const res = await biPoolManager.executeQuery(sourceType, targetSql, targetParams);
      rows = res.rows;
      if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      }
    }

    const durationMs = Date.now() - start;

    // 3. Guardar en Caché
    if (useCache) {
      biCacheManager.set(cacheKey, { data: rows, columns, durationMs }, cacheTtlMs);
    }

    return NextResponse.json({
      data: rows,
      columns,
      meta: {
        durationMs,
        cached: false,
        rowCount: rows.length,
        source: sourceType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'QUERY_EXECUTION_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
