import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { calculateSessionExpiry, getSessionConfig } from '@/lib/auth/session-config';
import { verifyPassword } from '@/lib/auth/auth-guard';

const LoginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function POST(req: NextRequest) {
  // Login por contraseña deshabilitado por defecto: la identidad es Google (Cloudflare Access + OAuth).
  if (process.env.PASSWORD_LOGIN_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'PASSWORD_LOGIN_DISABLED', message: 'El acceso con contraseña está deshabilitado. Usa «Continuar con Google».' },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario en base de datos
    const foundUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    // Nunca se crean usuarios ni se fija contraseña por esta vía: solo cuentas con contraseña ya establecida.
    if (!foundUser || !foundUser.passwordHash || !verifyPassword(password, foundUser.passwordHash)) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o acceso no autorizado' },
        { status: 401 }
      );
    }

    if (foundUser.role === 'pending') {
      return NextResponse.json(
        { error: 'PENDING_APPROVAL', message: 'Tu cuenta espera que un administrador te asigne acceso' },
        { status: 403 }
      );
    }

    if (!foundUser.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_DISABLED', message: 'Esta cuenta ha sido desactivada' },
        { status: 403 }
      );
    }

    // Crear sesión persistente parametrizable (SEG-21 / D9)
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      },
    });

    // Fijar cookie segura HTTP-Only
    response.cookies.set(sessionConfig.cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'LOGIN_FAILED', message: err.message || 'Error interno durante el inicio de sesión' },
      { status: 500 }
    );
  }
}
