import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tables, bases, fields } from '@/db/schema';
import { isNull, desc, eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseId = searchParams.get('base_id');

    let queryWhere = isNull(tables.deletedAt);
    if (baseId) {
      queryWhere = and(isNull(tables.deletedAt), eq(tables.baseId, baseId as any)) as any;
    }

    const allTables = await db.query.tables.findMany({
      where: queryWhere,
      orderBy: [tables.order, desc(tables.createdAt)],
    });

    return NextResponse.json(allTables.map(t => ({
      id: t.id,
      legacyId: t.legacyId,
      baseId: t.baseId,
      name: t.name,
      description: t.description || '',
      icon: t.icon || 'table',
      color: t.color || 'blue',
      tags: t.tags || [],
      order: t.order,
      createdAt: t.createdAt,
    })));
  } catch (error: any) {
    console.error('Error listando tablas:', error);
    return NextResponse.json({ error: 'Error interno al listar tablas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      baseId: customBaseId,
      description = '', 
      icon = 'table', 
      color = 'blue', 
      tags = [] 
    } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre de la tabla es obligatorio' }, { status: 400 });
    }

    let targetBaseId = customBaseId;
    if (!targetBaseId) {
      const firstBase = await db.query.bases.findFirst({
        where: isNull(bases.deletedAt),
      });
      if (!firstBase) {
        return NextResponse.json({ error: 'No existe ninguna base activa' }, { status: 404 });
      }
      targetBaseId = firstBase.id;
    }

    // Insertar nueva tabla
    const [newTable] = await db
      .insert(tables)
      .values({
        baseId: targetBaseId,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || 'table',
        color: color || 'blue',
        tags: Array.isArray(tags) ? tags : [],
      })
      .returning();

    // Crear columna primaria por defecto: "Nombre"
    const [primaryField] = await db
      .insert(fields)
      .values({
        tableId: newTable.id,
        name: 'Nombre',
        type: 'text',
        isPrimary: true,
        width: 200,
        order: 1,
      })
      .returning();

    // Actualizar primaryFieldId de la tabla
    await db
      .update(tables)
      .set({ primaryFieldId: primaryField.id })
      .where(eq(tables.id, newTable.id));

    return NextResponse.json({
      id: newTable.id,
      name: newTable.name,
      description: newTable.description || '',
      icon: newTable.icon,
      color: newTable.color,
      tags: newTable.tags || [],
      baseId: newTable.baseId,
      primaryFieldId: primaryField.id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creando tabla:', error);
    return NextResponse.json({ error: 'Error interno al crear tabla' }, { status: 500 });
  }
}
