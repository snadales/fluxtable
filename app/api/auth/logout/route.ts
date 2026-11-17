import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('fluxtable_session')?.value;

    if (sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken)).catch(() => {});
    }

    const response = NextResponse.json({ success: true, message: 'Sesión cerrada exitosamente' });

    // Purgar cookie de sesión
    response.cookies.set('fluxtable_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'LOGOUT_FAILED', message: err.message || 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
