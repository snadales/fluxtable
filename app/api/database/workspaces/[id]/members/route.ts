import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;

    const members = await db
      .select({
        id: schema.workspaceMembers.id,
        workspaceId: schema.workspaceMembers.workspaceId,
        userId: schema.workspaceMembers.userId,
        role: schema.workspaceMembers.role,
        createdAt: schema.workspaceMembers.createdAt,
        userEmail: schema.users.email,
        userName: schema.users.name,
      })
      .from(schema.workspaceMembers)
      .leftJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
      .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

    return NextResponse.json({ ok: true, members });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const body = await request.json();
    const { email, role = 'editor' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'Correo electrónico requerido' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Buscar o crear usuario
    let existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, cleanEmail),
    });

    if (!existingUser) {
      const [newUser] = await db
        .insert(schema.users)
        .values({
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: 'member',
        })
        .returning();
      existingUser = newUser;
    }

    // Verificar si ya es miembro
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, existingUser.id)
      ),
    });

    if (existingMember) {
      // Actualizar rol
      const [updated] = await db
        .update(schema.workspaceMembers)
        .set({ role })
        .where(eq(schema.workspaceMembers.id, existingMember.id))
        .returning();
      return NextResponse.json({ ok: true, member: updated, updated: true });
    }

    // Insertar nuevo miembro
    const [newMember] = await db
      .insert(schema.workspaceMembers)
      .values({
        workspaceId,
        userId: existingUser.id,
        role,
      })
      .returning();

    return NextResponse.json({ ok: true, member: newMember });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ ok: false, error: 'ID de miembro requerido' }, { status: 400 });
    }

    // Verificar conteo para no dejar el workspace sin administradores
    const allMembers = await db
      .select()
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

    if (allMembers.length <= 1) {
      return NextResponse.json(
        { ok: false, error: 'No se puede eliminar el único miembro del espacio de trabajo' },
        { status: 400 }
      );
    }

    await db
      .delete(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.id, memberId),
          eq(schema.workspaceMembers.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
