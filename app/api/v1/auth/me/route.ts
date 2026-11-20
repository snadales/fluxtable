import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/auth-guard';
import { isViaCloudflare } from '@/lib/auth/cf-access';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error || 'Sesión no válida o no autenticada' },
      { status: 401 }
    );
  }

  const { id, email, name, role, isApiToken } = auth.user;

  return NextResponse.json({
    id,
    email,
    name: name || email.split('@')[0],
    role,
    avatarInitials: (name || email).slice(0, 2).toUpperCase(),
    isZeroTrust: isViaCloudflare(request.headers),
    isApiToken,
    permissions: role === 'superadmin' ? ['all'] : role === 'shared' ? ['read'] : ['read', 'write'],
  });
}
