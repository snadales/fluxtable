import crypto from 'crypto';

/**
 * Validación del JWT de Cloudflare Access (Google SSO).
 *
 * - Firma RS256 verificada contra el JWKS del team: https://<CF_ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs
 * - Se comprueban iss, aud (CF_ACCESS_AUD), exp y nbf.
 * - Falla cerrado: sin CF_ACCESS_TEAM_DOMAIN o CF_ACCESS_AUD no se acepta ningún JWT.
 */

export interface CfAccessIdentity {
  email: string;
  sub?: string;
  name?: string;
}

interface Jwk {
  kid?: string;
  kty: string;
  n?: string;
  e?: string;
  [k: string]: unknown;
}

interface JwksCache {
  url: string;
  keys: Jwk[];
  fetchedAt: number;
}

const JWKS_TTL_MS = 10 * 60 * 1000;
const JWKS_MIN_REFETCH_MS = 30 * 1000;
const CLOCK_SKEW_S = 30;

let jwksCache: JwksCache | null = null;

export function resetCfAccessCache() {
  jwksCache = null;
}

export function getCfAccessConfig(): { teamDomain: string; aud: string } | null {
  const teamDomain = (process.env.CF_ACCESS_TEAM_DOMAIN || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  const aud = (process.env.CF_ACCESS_AUD || '').trim();
  if (!teamDomain || !aud) return null;
  return { teamDomain, aud };
}

function b64urlToBuffer(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function loadKeys(teamDomain: string, forceRefresh: boolean): Promise<Jwk[]> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const now = Date.now();
  if (jwksCache && jwksCache.url === url) {
    const age = now - jwksCache.fetchedAt;
    if (!forceRefresh && age < JWKS_TTL_MS) return jwksCache.keys;
    if (forceRefresh && age < JWKS_MIN_REFETCH_MS) return jwksCache.keys;
  }
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`JWKS HTTP ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  jwksCache = { url, keys, fetchedAt: now };
  return keys;
}

/**
 * Devuelve la identidad si el JWT es válido; null en cualquier otro caso.
 */
export async function verifyCfAccessJwt(token: string | null | undefined): Promise<CfAccessIdentity | null> {
  if (!token) return null;
  const cfg = getCfAccessConfig();
  if (!cfg) return null;

  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const header = JSON.parse(b64urlToBuffer(h).toString('utf8'));
    const claims = JSON.parse(b64urlToBuffer(p).toString('utf8'));
    if (header.alg !== 'RS256' || !header.kid) return null;

    let keys = await loadKeys(cfg.teamDomain, false);
    let jwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) {
      keys = await loadKeys(cfg.teamDomain, true);
      jwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
    }
    if (!jwk) return null;

    const publicKey = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: 'jwk' });
    const valid = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${h}.${p}`),
      publicKey,
      b64urlToBuffer(s)
    );
    if (!valid) return null;

    const nowS = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_S < nowS) return null;
    if (typeof claims.nbf === 'number' && claims.nbf - CLOCK_SKEW_S > nowS) return null;

    const iss = String(claims.iss || '').replace(/\/+$/, '');
    if (iss !== `https://${cfg.teamDomain}`) return null;

    const audList: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audList.includes(cfg.aud)) return null;

    const email = String(claims.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return null;

    return { email, sub: claims.sub, name: claims.name };
  } catch {
    return null;
  }
}

/** ¿La petición pasó por la red de Cloudflare (túnel / proxy)? */
export function isViaCloudflare(headers: Headers): boolean {
  return Boolean(headers.get('cf-ray') || headers.get('cf-connecting-ip') || headers.get('cf-access-jwt-assertion'));
}

/**
 * Capa 1 (perímetro). Si la petición llegó por Cloudflare exige un JWT de Access válido
 * (falla cerrado también si CF_ACCESS_* no están configuradas). Sin cabeceras de Cloudflare
 * (LAN) no aplica.
 */
export async function checkCfAccessPerimeter(
  headers: Headers,
  cookieJwt?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isViaCloudflare(headers)) return { ok: true };
  if (!getCfAccessConfig()) {
    return { ok: false, error: 'UNAUTHORIZED: Cloudflare Access no está configurado en el servidor (CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD)' };
  }
  const identity = await verifyCfAccessJwt(headers.get('cf-access-jwt-assertion') || cookieJwt);
  if (!identity) {
    return { ok: false, error: 'UNAUTHORIZED: JWT de Cloudflare Access ausente, inválido o expirado' };
  }
  return { ok: true };
}
