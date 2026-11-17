import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Detectar si viene por Cloudflare Access
  const cfEmail = request.headers.get('cf-access-authenticated-user-email');
  const email = cfEmail || 'snadales@gmail.com';
  const name = email === 'snadales@gmail.com' ? 'Sebastián Nadales' : email.split('@')[0];

  return NextResponse.json({
    id: 'usr_superadmin',
    email,
    name,
    role: 'superadmin',
    avatarInitials: 'SN',
    isZeroTrust: Boolean(cfEmail),
    permissions: ['all'],
  });
}
