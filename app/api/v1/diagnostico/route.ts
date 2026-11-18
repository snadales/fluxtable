import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaces, tables, users } from '@/db/schema';
import { count } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/auth-guard';

/**
 * Endpoint de Diagnóstico Oficial (Estándar Yarken OBS-05 / API-08)
 * - GET /api/v1/diagnostico
 * - Requiere autenticación de usuario o token de administración
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json(
      {
        tipo: 'https://problemas.yarken.cl/autenticacion-requerida',
        titulo: 'No autorizado',
        codigo: 'NO_AUTORIZADO',
        detalle: 'Se requiere sesión activa o token para acceder al diagnóstico',
      },
      { status: 401 }
    );
  }

  try {
    const [workspaceCount] = await db.select({ value: count() }).from(workspaces);
    const [tableCount] = await db.select({ value: count() }).from(tables);
    const [userCount] = await db.select({ value: count() }).from(users);

    const memUsage = process.memoryUsage();

    return NextResponse.json(
      {
        servicio: 'fluxtable',
        version: process.env.npm_package_version || '1.0.0',
        solicitante: {
          id: auth.user.id,
          email: auth.user.email,
          rol: auth.user.role,
        },
        uptime_segundos: Math.floor(process.uptime()),
        memoria: {
          rss_mb: Math.round(memUsage.rss / 1024 / 1024),
          heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        inventario: {
          workspaces_total: workspaceCount?.value || 0,
          tablas_total: tableCount?.value || 0,
          usuarios_total: userCount?.value || 0,
        },
        timestamp: new Date().toISOString(),
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
        tipo: 'https://problemas.yarken.cl/error-diagnostico',
        titulo: 'Error obteniendo diagnóstico',
        codigo: 'ERROR_DIAGNOSTICO',
        detalle: err.message,
      },
      { status: 500 }
    );
  }
}
