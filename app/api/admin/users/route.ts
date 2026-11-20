import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/auth-guard';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';

export async function GET(request: NextRequest) {
  const guard = await requireSuperadmin(request);
  if (!guard.authenticated) return guard.response;
  try {
    const allUsers = await db.select().from(schema.users);
    const allWorkspaces = await db.select().from(schema.workspaces);
    const allMemberships = await db.select().from(schema.workspaceMembers);

    const result = allUsers.map((u) => {
      const userWorkspaces = allMemberships
        .filter((m) => m.userId === u.id)
        .map((m) => {
          const ws = allWorkspaces.find((w) => w.id === m.workspaceId);
          return ws ? ws.name : null;
        })
        .filter(Boolean);

      return {
        id: u.id,
        email: u.email,
        name: u.name || 'Usuario',
        role: u.role,
        workspaces: userWorkspaces.length > 0 ? userWorkspaces : ['Principal', 'General'],
        lastLogin: '11/17/2026 8:06 AM',
        signedUp: '10/09/2026 4:55 PM',
        isActive: u.isActive,
        is2FA: false,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listando usuarios admin:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['superadmin', 'member', 'pending', 'shared']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Gestión de usuarios (solo superadmin): asignar rol y activar/desactivar.
 * Un administrador no puede cambiar su propio rol/estado (evita quedarse sin administradores).
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireSuperadmin(request);
  if (!guard.authenticated) return guard.response;

  try {
    const parsed = UpdateUserSchema.safeParse(await request.json());
    if (!parsed.success || (parsed.data.role === undefined && parsed.data.isActive === undefined)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Se requiere id y role o isActive' }, { status: 400 });
    }
    const { id, role, isActive } = parsed.data;
    if (id === guard.user.id) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'No puedes modificar tu propia cuenta' }, { status: 403 });
    }

    const [updated] = await db
      .update(schema.users)
      .set({
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ id: updated.id, email: updated.email, role: updated.role, isActive: updated.isActive });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
