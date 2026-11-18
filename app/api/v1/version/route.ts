import { NextResponse } from 'next/server';

/**
 * Endpoint de Versión Oficial (Estándar Yarken OBS-05 / API-08)
 * - GET /api/v1/version (abierto sin autenticación)
 * - Expone versión, commit/hash y runtime
 */
export async function GET() {
  return NextResponse.json(
    {
      servicio: 'fluxtable',
      version: process.env.npm_package_version || '1.0.0',
      entorno: process.env.NODE_ENV || 'production',
      framework: 'Next.js 15 (React 19)',
      runtime: 'Node.js',
      nodo: process.env.HOSTNAME || 'zbook',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
