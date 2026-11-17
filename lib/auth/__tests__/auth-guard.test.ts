import { describe, it, expect } from 'vitest';
import { authenticateRequest, requireAuth } from '../auth-guard';
import { NextRequest } from 'next/server';

describe('Auth Guard & RBAC', () => {
  it('should reject unauthenticated request when requireAuth is invoked', async () => {
    const req = new NextRequest('http://localhost:3000/api/database/tables');
    const result = await requireAuth(req);
    expect(result.authenticated).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it('should authenticate valid Cloudflare Access header with matching user in allowed list', async () => {
    // Save original ALLOWED_EMAILS
    const originalAllowed = process.env.ALLOWED_EMAILS;
    process.env.ALLOWED_EMAILS = 'admin@yarken.cl,snadales@gmail.com';

    const req = new NextRequest('http://localhost:3000/api/database/tables', {
      headers: {
        'cf-access-authenticated-user-email': 'snadales@gmail.com',
      },
    });

    const auth = await authenticateRequest(req);
    expect(auth.authenticated).toBe(true);
    expect(auth.user?.email).toBe('snadales@gmail.com');
    expect(auth.user?.role).toBe('superadmin');

    // Restore
    process.env.ALLOWED_EMAILS = originalAllowed;
  });

  it('should reject Cloudflare Access header if email is not allowed', async () => {
    const originalAllowed = process.env.ALLOWED_EMAILS;
    process.env.ALLOWED_EMAILS = 'admin@yarken.cl';

    const req = new NextRequest('http://localhost:3000/api/database/tables', {
      headers: {
        'cf-access-authenticated-user-email': 'hacker@malicious.com',
      },
    });

    const auth = await authenticateRequest(req);
    expect(auth.authenticated).toBe(false);
    expect(auth.user).toBeUndefined();

    // Restore
    process.env.ALLOWED_EMAILS = originalAllowed;
  });
});
