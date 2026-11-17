import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiTokens, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

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
 * Valida autenticación por API Token (SHA-256) o Cloudflare Zero Trust
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthContext> {
  // 1. Revisar Authorization Header (Token <key> o Bearer <key>)
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

  // 2. Revisar cabecera Cloudflare Access
  const cfEmail = req.headers.get('cf-access-authenticated-user-email');
  if (cfEmail) {
    try {
      const foundUser = await db.query.users.findFirst({
        where: eq(users.email, cfEmail.toLowerCase().trim()),
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
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[auth-guard] Error consultando users para Cloudflare Access:', err);
      }
    }

    // Si viene por Cloudflare pero no está en BD o BD inaccesible, verificar lista de emails permitidos
    const allowed = (process.env.ALLOWED_EMAILS || 'snadales@gmail.com')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    if (allowed.includes(cfEmail.toLowerCase().trim())) {
      return {
        authenticated: true,
        user: {
          id: 'usr_cf_allowed',
          email: cfEmail,
          name: cfEmail.split('@')[0],
          role: 'superadmin',
          isApiToken: false,
        },
      };
    }
  }

  // 3. En entorno de desarrollo explícito (nunca en test ni production), permitir bypass local
  const isDev = process.env.NODE_ENV === 'development';
  const isBypassAllowed = process.env.ALLOW_DEV_AUTH_BYPASS === 'true';
  if (isDev && isBypassAllowed) {
    return {
      authenticated: true,
      user: {
        id: 'usr_dev_local',
        email: 'snadales@gmail.com',
        name: 'Sebastián Nadales',
        role: 'superadmin',
        isApiToken: false,
      },
    };
  }

  return {
    authenticated: false,
    error: 'UNAUTHORIZED: Credenciales de acceso requeridas (API Token o Cloudflare Access)',
  };
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
  return { authenticated: true, user: auth.user };
}
