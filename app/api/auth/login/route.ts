import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/auth-guard';

const LoginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function POST(req: NextRequest) {
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
    let foundUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!foundUser) {
      // Si el email está en la lista permitida de administradores, crearlo de forma segura
      const allowedEmails = (process.env.ALLOWED_EMAILS || 'snadales@gmail.com')
        .split(',')
        .map((e) => e.trim().toLowerCase());

      if (allowedEmails.includes(normalizedEmail)) {
        const [newUser] = await db
          .insert(users)
          .values({
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0],
            passwordHash: hashPassword(password),
            role: 'superadmin',
            isActive: true,
          })
          .returning();
        foundUser = newUser;
      } else {
        return NextResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o acceso no autorizado' },
          { status: 401 }
        );
      }
    } else {
      // Si el usuario existe pero no tiene contraseña establecida aún (cuenta creada por OAuth o seed)
      if (!foundUser.passwordHash) {
        const updatedHash = hashPassword(password);
        await db.update(users).set({ passwordHash: updatedHash }).where(eq(users.id, foundUser.id));
      } else {
        const isPasswordValid = verifyPassword(password, foundUser.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o contraseña incorrecta' },
            { status: 401 }
          );
        }
      }
    }

    if (!foundUser.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_DISABLED', message: 'Esta cuenta ha sido desactivada' },
        { status: 403 }
      );
    }

    // Crear sesión persistente de 7 días
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
    response.cookies.set('fluxtable_session', sessionToken, {
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
