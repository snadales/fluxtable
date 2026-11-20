import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isPublicApiPath } from '@/lib/auth/auth-guard';
import { isApiPathAllowedForShared, SHARED_GLOBAL_ROLE } from '@/lib/auth/dashboard-permissions';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Almacén en memoria para rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpieza periódica para evitar fugas de memoria
let lastCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup > 60000) {
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    });
    lastCleanup = now;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignorar archivos estáticos, chunks de Next.js e imágenes de favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg'
  ) {
    return NextResponse.next();
  }

  // 1. Obtener identificador del cliente (IP real tras Cloudflare / proxy)
  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  cleanupRateLimitMap();

  // 2. Definir límites de peticiones según la sensibilidad de la ruta
  let limit = 300; // General API: 300 req/min
  let windowMs = 60000;

  if (pathname.startsWith('/api/auth')) {
    limit = 15; // Auth endpoints: 15 req/min (Anti-Brute-Force)
  } else if (pathname.includes('/batch')) {
    limit = 1200; // Batch operations (Migración de datos masiva y ETL)
  } else if (pathname === '/api/bi/query') {
    limit = 600; // BI queries: 600 req/min (Soporta múltiples tableros en concurrencia)
  } else if (pathname.startsWith('/api/v1/attachments/upload')) {
    limit = 60; // Uploads: 60 req/min
  }

  // Si no es ruta de API, continuar
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const rateKey = `${clientIp}:${pathname.split('/')[2] || 'api'}`;
  const now = Date.now();
  const currentRecord = rateLimitMap.get(rateKey);

  if (!currentRecord || now > currentRecord.resetAt) {
    rateLimitMap.set(rateKey, { count: 1, resetAt: now + windowMs });
  } else {
    currentRecord.count += 1;
    if (currentRecord.count > limit) {
      const retryAfterSeconds = Math.ceil((currentRecord.resetAt - now) / 1000);
      return new NextResponse(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Límite de peticiones excedido. Por favor intente más tarde.',
          retryAfter: retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(currentRecord.resetAt / 1000)),
          },
        }
      );
    }
  }

  // 3. Deny-by-default: toda ruta /api exige autenticación salvo health checks y endpoints de login
  const isAuthEndpoint = pathname.startsWith('/api/auth/');
  if (!isAuthEndpoint && !isPublicApiPath(pathname)) {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      const forbidden = Boolean(auth.error?.startsWith('FORBIDDEN'));
      return NextResponse.json(
        {
          error: forbidden ? 'FORBIDDEN' : 'UNAUTHORIZED',
          message: auth.error || 'Acceso no autorizado',
        },
        { status: forbidden ? 403 : 401 }
      );
    } else if (auth.user?.role === 'pending' && pathname !== '/api/v1/auth/me') {
      return NextResponse.json(
        { error: 'PENDING_APPROVAL', message: 'Tu cuenta espera que un administrador te asigne acceso' },
        { status: 403 }
      );
    } else if (
      auth.user?.role === SHARED_GLOBAL_ROLE &&
      !isApiPathAllowedForShared(pathname, req.method)
    ) {
      // #54: un invitado solo usa la API de dashboards compartidos; tablas, bases y admin quedan fuera.
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Tu acceso de invitado solo permite ver dashboards compartidos' },
        { status: 403 }
      );
    }
  }

  const remaining = currentRecord ? Math.max(0, limit - currentRecord.count) : limit - 1;
  const response = NextResponse.next();

  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));

  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/api/:path*'],
};
