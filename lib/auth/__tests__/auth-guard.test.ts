import { describe, it, expect } from 'vitest';
import { authenticateRequest, requireAuth } from '../auth-guard';
import { NextRequest } from 'next/server';

describe('Auth Guard & RBAC', () => {
  it('should reject unauthenticated request when requireAuth is invoked', async () => {
    const req = new NextRequest('http://localhost:3000/api/database/tables');
    const result = await requireAuth(req);
    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
    }
  });

  it('should securely hash and verify passwords using scrypt', async () => {
    const { hashPassword, verifyPassword } = await import('../auth-guard');
    const pwd = 'SuperSecretPassword2026!';
    const hash = hashPassword(pwd);

    expect(hash).toContain(':');
    expect(hash.length).toBeGreaterThan(64);

    expect(verifyPassword(pwd, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
    expect(verifyPassword(pwd, 'invalid:hash')).toBe(false);
  });
});
