import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSessionConfig, calculateSessionExpiry } from '../session-config';

describe('Session Config (SEG-21 / D9)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('debe devolver 7 días por defecto conforme al límite máximo de SEG-21', () => {
    delete process.env.SESSION_MAX_AGE_DAYS;
    const config = getSessionConfig();
    expect(config.maxAgeDays).toBe(7);
    expect(config.maxAgeMs).toBe(7 * 24 * 60 * 60 * 1000);
    expect(config.cookieName).toBe('fluxtable_session');
  });

  it('debe respetar el valor configurado si es menor a 7 días', () => {
    process.env.SESSION_MAX_AGE_DAYS = '3';
    const config = getSessionConfig();
    expect(config.maxAgeDays).toBe(3);
    expect(config.maxAgeMs).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it('debe acotar a 7 días si se configura un valor mayor (cumplimiento estricto SEG-21)', () => {
    process.env.SESSION_MAX_AGE_DAYS = '30';
    const config = getSessionConfig();
    expect(config.maxAgeDays).toBe(7);
  });

  it('debe calcular una fecha futura coherente con maxAgeMs', () => {
    process.env.SESSION_MAX_AGE_DAYS = '2';
    const now = Date.now();
    const expiry = calculateSessionExpiry();
    const diffMs = expiry.getTime() - now;
    expect(diffMs).toBeGreaterThanOrEqual(2 * 24 * 60 * 60 * 1000 - 1000);
    expect(diffMs).toBeLessThanOrEqual(2 * 24 * 60 * 60 * 1000 + 1000);
  });
});
