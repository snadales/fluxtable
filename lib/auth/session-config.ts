/**
 * Configuración de sesiones parametrizable
 * Alineado con el Estándar de Servicio Yarken (v2): SEG-21 / D9
 *
 * Exigencias normativas:
 * - Expiración absoluta: máximo 7 días (SEG-21: <= 7 días).
 * - Parametrizable mediante variables de entorno o tabla de parámetros sin recompilación.
 */

export interface SessionConfig {
  maxAgeDays: number;
  maxAgeMs: number;
  cookieName: string;
}

export function getSessionConfig(): SessionConfig {
  const parsedDays = Number(process.env.SESSION_MAX_AGE_DAYS);
  // Cumplimiento estricto SEG-21: tope máximo de 7 días
  const maxAgeDays = !isNaN(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, 7) : 7;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return {
    maxAgeDays,
    maxAgeMs,
    cookieName: process.env.SESSION_COOKIE_NAME || 'fluxtable_session',
  };
}

export function calculateSessionExpiry(): Date {
  const config = getSessionConfig();
  return new Date(Date.now() + config.maxAgeMs);
}
