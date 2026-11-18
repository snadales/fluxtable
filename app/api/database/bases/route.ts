import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bases, workspaces } from '@/db/schema';
import { isNull, desc, eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    let queryWhere = isNull(bases.deletedAt);
    if (workspaceId) {
      queryWhere = eq(bases.workspaceId, workspaceId as any);
    }

    const allBases = await db.query.bases.findMany({
      where: queryWhere,
      orderBy: [asc(bases.order), desc(bases.createdAt)],
    });

    return NextResponse.json(allBases);
  } catch (error: any) {
    console.error('Error listando bases/módulos:', error);
    return NextResponse.json({ error: 'Error al listar módulos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, name, description, category, color, icon } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del módulo es requerido' }, { status: 400 });
    }

    let targetWsId = workspaceId;
    if (!targetWsId) {
      const firstWs = await db.query.workspaces.findFirst({
        where: isNull(workspaces.deletedAt),
      });
      if (!firstWs) {
        return NextResponse.json({ error: 'No se encontró un workspace activo' }, { status: 400 });
      }
      targetWsId = firstWs.id;
    }

    const [created] = await db
      .insert(bases)
      .values({
        workspaceId: targetWsId,
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || 'Operaciones',
        color: color || 'blue',
        icon: icon || 'folder',
        order: 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creando base/módulo:', error);
    return NextResponse.json({ error: 'Error interno al crear módulo' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { name, description, category, color, icon, order } = body;

    const targetId = id || body.id;
    if (!targetId) {
      return NextResponse.json({ error: 'ID del módulo requerido' }, { status: 400 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category?.trim() || 'Operaciones';
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (order !== undefined) updateData.order = order;

    const [updated] = await db
      .update(bases)
      .set(updateData)
      .where(eq(bases.id, targetId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del módulo requerido' }, { status: 400 });
    }

    const [deleted] = await db
      .update(bases)
      .set({ deletedAt: new Date() })
      .where(eq(bases.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
