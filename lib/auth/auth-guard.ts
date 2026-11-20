import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiTokens, users, sessions } from '@/db/schema';
import { eq, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { getSessionConfig } from '@/lib/auth/session-config';
import { checkCfAccessPerimeter } from '@/lib/auth/cf-access';
import { isApiPathAllowedForShared, SHARED_GLOBAL_ROLE } from './dashboard-permissions';

export interface AuthContext {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    isApiToken: boolean;
    workspaceId?: string;
  };
  error?: string;
}

/**
 * Capa 1: JWT de Cloudflare Access (perímetro, si la petición llega por Cloudflare).
 * Capa 2: Cookie de sesión (login con Google en la app) o API Token (SHA-256) para scripts.
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthContext> {
  // 0. Capa 1 (perímetro): si la petición llega por Cloudflare debe traer un JWT de Access válido.
  //    En LAN (sin cabeceras de Cloudflare) este paso no aplica y solo valen sesión o API Token.
  const perimeter = await checkCfAccessPerimeter(req.headers, req.cookies.get('CF_Authorization')?.value);
  if (!perimeter.ok) {
    return { authenticated: false, error: perimeter.error };
  }

  // 1. Revisar Cookie de Sesión parametrizable (SEG-21 / D9)
  const cookieName = getSessionConfig().cookieName;
  const sessionCookie = req.cookies.get(cookieName)?.value || req.cookies.get('fluxtable_session')?.value;
  if (sessionCookie) {
    try {
      const activeSession = await db.query.sessions.findFirst({
        where: eq(sessions.sessionToken, sessionCookie),
      });

      if (activeSession && new Date(activeSession.expiresAt) > new Date()) {
        const foundUser = await db.query.users.findFirst({
          where: eq(users.id, activeSession.userId),
        });

        if (foundUser && foundUser.isActive) {
          return {
            authenticated: true,
            user: {
              id: foundUser.id,
              email: foundUser.email,
              name: foundUser.name || foundUser.email.split('@')[0],
              role: foundUser.role,
              isApiToken: false,
            },
          };
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[auth-guard] Error verificando cookie de sesión:', err);
      }
    }
  }

  // 2. Revisar Authorization Header (Token <key> o Bearer <key>)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && (parts[0].toLowerCase() === 'token' || parts[0].toLowerCase() === 'bearer')) {
      const rawToken = parts[1].trim();
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      try {
        const foundToken = await db.query.apiTokens.findFirst({
          where: eq(apiTokens.tokenHash, tokenHash),
        });

        if (foundToken) {
          // Actualizar lastUsedAt de forma no bloqueante
          db.update(apiTokens)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiTokens.id, foundToken.id))
            .catch(() => {});

          return {
            authenticated: true,
            user: {
              id: foundToken.id,
              email: `token:${foundToken.name}`,
              role: 'api_token',
              isApiToken: true,
              workspaceId: foundToken.workspaceId,
            },
          };
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[auth-guard] Error consultando apiTokens:', err);
        }
      }
    }
  }

  return {
    authenticated: false,
    error: 'UNAUTHORIZED: Credenciales de acceso requeridas (Sesión de Google o API Token)',
  };
}

/** Rutas de API abiertas (health checks); todo lo demás exige autenticación. */
export const PUBLIC_API_PATHS = ['/api/health', '/api/v1/salud', '/api/v1/version'];

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.includes(pathname.replace(/\/+$/, ''));
}

/**
 * Helper para proteger un Route Handler exigiendo autenticación válida
 */
export async function requireAuth(req: NextRequest): Promise<
  | { authenticated: true; user: NonNullable<AuthContext['user']> }
  | { authenticated: false; response: NextResponse }
> {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated || !auth.user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'UNAUTHORIZED', message: auth.error || 'Acceso no autorizado' },
        { status: 401 }
      ),
    };
  }
  if (auth.user.role === 'pending') {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'PENDING_APPROVAL', message: 'Tu cuenta espera que un administrador te asigne acceso' },
        { status: 403 }
      ),
    };
  }
  // #54: defensa en profundidad (además del middleware): un invitado solo usa la API de dashboards.
  const pathname = req.nextUrl?.pathname ?? new URL(req.url).pathname;
  if (auth.user.role === SHARED_GLOBAL_ROLE && !isApiPathAllowedForShared(pathname, req.method)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Tu acceso de invitado solo permite ver dashboards compartidos' },
        { status: 403 }
      ),
    };
  }
  return { authenticated: true, user: auth.user };
}

/**
 * Exige un usuario humano con rol superadmin (no tokens API).
 */
export async function requireSuperadmin(req: NextRequest): Promise<
  | { authenticated: true; user: NonNullable<AuthContext['user']> }
  | { authenticated: false; response: NextResponse }
> {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth;
  if (auth.user.role !== 'superadmin' || auth.user.isApiToken) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Se requiere rol de administrador' },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/**
 * Funciones Criptográficas Seguras para Hash de Contraseñas (scrypt + salt)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  } catch {
    return false;
  }
}
