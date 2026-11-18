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
