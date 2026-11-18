import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Endpoint de Salud Oficial (Estándar Yarken OBS-05 / API-08)
 * - GET /api/v1/salud (abierto en red interna)
 * - Retorna 200 OK si la aplicación y dependencias críticas (PostgreSQL) están sanas
 * - Retorna 503 Service Unavailable si la base de datos no responde
 */
export async function GET() {
  const startTime = Date.now();
  try {
    // Verificación activa de PostgreSQL (SELECT 1)
    await db.execute(sql`SELECT 1`);
    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        estado: 'ok',
        servicio: 'fluxtable',
        version: process.env.npm_package_version || '1.0.0',
        entorno: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        chequeos: {
          base_datos: {
            estado: 'ok',
            tipo: 'postgresql',
            latencia_ms: dbLatencyMs,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        estado: 'error',
        servicio: 'fluxtable',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        chequeos: {
          base_datos: {
            estado: 'caida',
            tipo: 'postgresql',
            error: err.message || 'Error de conexión a PostgreSQL',
          },
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
