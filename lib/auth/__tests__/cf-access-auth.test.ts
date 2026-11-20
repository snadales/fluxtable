import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

// --- Mock de BD: sesiones, usuarios y tokens API ---
const state = {
  tokens: [] as any[],
  sessions: [] as any[],
  users: [] as any[],
};
vi.mock('@/db', () => ({
  db: {
    query: {
      apiTokens: { findFirst: vi.fn(async () => state.tokens[0]) },
      sessions: { findFirst: vi.fn(async () => state.sessions[0]) },
      users: { findFirst: vi.fn(async () => state.users[0]) },
    },
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
}));

import { authenticateRequest, requireAuth, requireSuperadmin } from '../auth-guard';
import { verifyCfAccessJwt, resetCfAccessCache } from '../cf-access';
import { decideGoogleLogin } from '../google-policy';

const TEAM = 'equipo.cloudflareaccess.com';
const AUD = 'aud-fluxtable-de-prueba';
const KID = 'kid-1';

let privateKey: crypto.KeyObject;
let otherPrivateKey: crypto.KeyObject;
let jwks: { keys: any[] };

function b64u(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(claims: Record<string, unknown>, key = privateKey, kid = KID) {
  const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }));
  const p = b64u(JSON.stringify(claims));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), key);
  return `${h}.${p}.${b64u(sig)}`;
}

function validClaims(over: Record<string, unknown> = {}) {
  return {
    iss: `https://${TEAM}`,
    aud: [AUD],
    email: 'snadales@gmail.com',
    exp: Math.floor(Date.now() / 1000) + 600,
    iat: Math.floor(Date.now() / 1000),
    ...over,
  };
}

const cfHeaders = (jwt?: string): Record<string, string> => ({
  'cf-ray': 'abc123',
  ...(jwt ? { 'cf-access-jwt-assertion': jwt } : {}),
});

const req = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/database/tables', { headers });

beforeAll(() => {
  const a = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const b = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  privateKey = a.privateKey;
  otherPrivateKey = b.privateKey;
  jwks = { keys: [{ ...a.publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }] };
});

beforeEach(() => {
  resetCfAccessCache();
  state.tokens = [];
  state.sessions = [];
  state.users = [];
  process.env.CF_ACCESS_TEAM_DOMAIN = TEAM;
  process.env.CF_ACCESS_AUD = AUD;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(jwks), { status: 200 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CF_ACCESS_TEAM_DOMAIN;
  delete process.env.CF_ACCESS_AUD;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ALLOWED_EMAILS;
  delete process.env.ALLOWED_EMAIL_DOMAINS;
});

describe('Capa 1: JWT de Cloudflare Access', () => {
  it('acepta un JWT válido', async () => {
    const id = await verifyCfAccessJwt(sign(validClaims()));
    expect(id?.email).toBe('snadales@gmail.com');
  });

  it('rechaza JWT ausente', async () => {
    expect(await verifyCfAccessJwt(undefined)).toBeNull();
    expect(await verifyCfAccessJwt('')).toBeNull();
  });

  it('rechaza JWT expirado', async () => {
    const jwt = sign(validClaims({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    expect(await verifyCfAccessJwt(jwt)).toBeNull();
  });

  it('rechaza AUD incorrecto', async () => {
    const jwt = sign(validClaims({ aud: ['otra-aplicacion'] }));
    expect(await verifyCfAccessJwt(jwt)).toBeNull();
  });

  it('rechaza emisor (iss) incorrecto', async () => {
    const jwt = sign(validClaims({ iss: 'https://otro.cloudflareaccess.com' }));
    expect(await verifyCfAccessJwt(jwt)).toBeNull();
  });

  it('rechaza firma de otra clave', async () => {
    const jwt = sign(validClaims(), otherPrivateKey);
    expect(await verifyCfAccessJwt(jwt)).toBeNull();
  });

  it('rechaza alg none / sin firma', async () => {
    const h = b64u(JSON.stringify({ alg: 'none', kid: KID }));
    const p = b64u(JSON.stringify(validClaims()));
    expect(await verifyCfAccessJwt(`${h}.${p}.`)).toBeNull();
  });

  it('falla cerrado si faltan CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD', async () => {
    delete process.env.CF_ACCESS_AUD;
    expect(await verifyCfAccessJwt(sign(validClaims()))).toBeNull();
  });
});

describe('authenticateRequest (capas 1 y 2)', () => {
  it('rechaza petición sin credenciales (sin modo soberano)', async () => {
    state.users = [{ id: 'u1', email: 'snadales@gmail.com', role: 'superadmin', isActive: true }];
    const auth = await authenticateRequest(req());
    expect(auth.authenticated).toBe(false);
    const guard = await requireAuth(req());
    expect(guard.authenticated).toBe(false);
  });

  it('no confía en la cabecera cf-access-authenticated-user-email', async () => {
    state.users = [{ id: 'u1', email: 'snadales@gmail.com', role: 'superadmin', isActive: true }];
    const auth = await authenticateRequest(req({ 'cf-access-authenticated-user-email': 'snadales@gmail.com' }));
    expect(auth.authenticated).toBe(false);
  });

  it('vía Cloudflare sin JWT: rechaza aunque haya sesión válida', async () => {
    state.sessions = [{ userId: 'u1', expiresAt: new Date(Date.now() + 60_000) }];
    state.users = [{ id: 'u1', email: 'snadales@gmail.com', role: 'superadmin', isActive: true }];
    const auth = await authenticateRequest(req({ ...cfHeaders(), cookie: 'fluxtable_session=tok' }));
    expect(auth.authenticated).toBe(false);
  });

  it('vía Cloudflare con JWT válido + sesión de Google: autentica', async () => {
    state.sessions = [{ userId: 'u1', expiresAt: new Date(Date.now() + 60_000) }];
    state.users = [{ id: 'u1', email: 'snadales@gmail.com', role: 'superadmin', isActive: true }];
    const auth = await authenticateRequest(req({ ...cfHeaders(sign(validClaims())), cookie: 'fluxtable_session=tok' }));
    expect(auth.authenticated).toBe(true);
    expect(auth.user?.role).toBe('superadmin');
  });

  it('vía Cloudflare con JWT válido pero sin sesión ni token: rechaza', async () => {
    const auth = await authenticateRequest(req(cfHeaders(sign(validClaims()))));
    expect(auth.authenticated).toBe(false);
  });

  it('vía Cloudflare con JWT expirado o AUD incorrecto: rechaza', async () => {
    state.tokens = [{ id: 't1', name: 'n8n', workspaceId: 'w1' }];
    const expired = sign(validClaims({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    const badAud = sign(validClaims({ aud: ['x'] }));
    for (const jwt of [expired, badAud]) {
      const auth = await authenticateRequest(req({ ...cfHeaders(jwt), authorization: 'Token abc' }));
      expect(auth.authenticated).toBe(false);
    }
  });

  it('LAN con Authorization: Token válido: autentica como api_token', async () => {
    state.tokens = [{ id: 't1', name: 'n8n', workspaceId: 'w1' }];
    const auth = await authenticateRequest(req({ authorization: 'Token abc' }));
    expect(auth.authenticated).toBe(true);
    expect(auth.user?.isApiToken).toBe(true);
  });

  it('Token inexistente: rechaza', async () => {
    const auth = await authenticateRequest(req({ authorization: 'Token inexistente' }));
    expect(auth.authenticated).toBe(false);
  });

  it('requireSuperadmin: un token API recibe 403 y un member también', async () => {
    state.tokens = [{ id: 't1', name: 'n8n', workspaceId: 'w1' }];
    const r1 = await requireSuperadmin(req({ authorization: 'Token abc' }));
    expect(r1.authenticated).toBe(false);
    if (!r1.authenticated) expect(r1.response.status).toBe(403);

    state.tokens = [];
    state.sessions = [{ userId: 'u2', expiresAt: new Date(Date.now() + 60_000) }];
    state.users = [{ id: 'u2', email: 'otro@x.cl', role: 'member', isActive: true }];
    const r2 = await requireSuperadmin(req({ cookie: 'fluxtable_session=tok' }));
    expect(r2.authenticated).toBe(false);
  });

  it('usuario con rol pending no pasa requireAuth', async () => {
    state.sessions = [{ userId: 'u3', expiresAt: new Date(Date.now() + 60_000) }];
    state.users = [{ id: 'u3', email: 'nuevo@x.cl', role: 'pending', isActive: true }];
    const r = await requireAuth(req({ cookie: 'fluxtable_session=tok' }));
    expect(r.authenticated).toBe(false);
    if (!r.authenticated) expect(r.response.status).toBe(403);
  });
});

describe('Política de alta con Google (capa 2)', () => {
  it('snadales@gmail.com = superadmin; ADMIN_EMAIL configurable', () => {
    expect(decideGoogleLogin('SNadales@gmail.com')).toEqual({ allowed: true, role: 'superadmin' });
    process.env.ADMIN_EMAIL = 'otro@yarken.cl';
    expect(decideGoogleLogin('otro@yarken.cl')).toEqual({ allowed: true, role: 'superadmin' });
  });

  it('lista o dominio permitido => rol mínimo pending; resto no se crea', () => {
    process.env.ALLOWED_EMAILS = 'a@x.cl, b@y.cl';
    process.env.ALLOWED_EMAIL_DOMAINS = 'bambu.cl';
    expect(decideGoogleLogin('a@x.cl')).toEqual({ allowed: true, role: 'pending' });
    expect(decideGoogleLogin('alguien@bambu.cl')).toEqual({ allowed: true, role: 'pending' });
    expect(decideGoogleLogin('intruso@gmail.com')).toEqual({ allowed: false });
  });
});
