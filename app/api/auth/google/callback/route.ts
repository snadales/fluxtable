import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSessionExpiry, getSessionConfig } from '@/lib/auth/session-config';
import { getBaseUrl } from '@/lib/brand-config';
import { decideGoogleLogin } from '@/lib/auth/google-policy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = getBaseUrl();

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error)}`);
  }

  const cookieState = req.cookies.get('google_oauth_state')?.value;
  if (!state || state !== cookieState) {
    return NextResponse.redirect(`${baseUrl}/login?error=INVALID_STATE`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=CONFIG_ERROR`);
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // Intercambiar código por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=TOKEN_EXCHANGE_FAILED`);
    }

    // Obtener perfil de Google
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoRes.json();
    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=NO_EMAIL_PROVIDED`);
    }

    if (profile.email_verified === false || profile.email_verified === 'false') {
      return NextResponse.redirect(`${baseUrl}/login?error=EMAIL_NOT_VERIFIED`);
    }

    const email = profile.email.toLowerCase().trim();
    const decision = decideGoogleLogin(email);

    // Buscar usuario existente (los usuarios ya creados entran siempre que estén activos)
    let foundUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!foundUser) {
      // Alta en el primer login: solo si el email está permitido (lista o dominio)
      if (!decision.allowed) {
        return NextResponse.redirect(`${baseUrl}/login?error=UNAUTHORIZED_EMAIL`);
      }
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: profile.name || email.split('@')[0],
          googleId: profile.sub || null,
          avatarUrl: profile.picture || null,
          role: decision.role,
          isActive: true,
        })
        .returning();
      foundUser = newUser;
    } else if (!foundUser.isActive) {
      return NextResponse.redirect(`${baseUrl}/login?error=ACCOUNT_DISABLED`);
    }

    // Rol mínimo: sin acceso (ni sesión) hasta que un administrador lo asigne
    if (foundUser.role === 'pending') {
      return NextResponse.redirect(`${baseUrl}/login?error=PENDING_APPROVAL`);
    }

    // Crear sesión de usuario
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = calculateSessionExpiry();
    const sessionConfig = getSessionConfig();
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    await db.insert(sessions).values({
      userId: foundUser.id,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
    });

    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set(sessionConfig.cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    response.cookies.delete('google_oauth_state');
    return response;
  } catch (err: any) {
    console.error('Google OAuth callback fatal error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=AUTH_CALLBACK_FAILED`);
  }
}
