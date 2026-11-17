import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tables, bases, workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tableId: tableParam } = await context.params;
    const tableId = await resolveTableId(tableParam);

    if (!tableId) {
      return NextResponse.json({ error: 'Tabla no encontrada' }, { status: 404 });
    }

    const table = await db.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });

    if (!table) {
      return NextResponse.json({ error: 'Tabla no encontrada' }, { status: 404 });
    }

    const base = await db.query.bases.findFirst({
      where: eq(bases.id, table.baseId),
    });

    return NextResponse.json({
      id: table.id,
      legacyId: table.legacyId,
      name: table.name,
      description: table.description || '',
      icon: table.icon || 'table',
      color: table.color || 'blue',
      tags: table.tags || [],
      base: base ? {
        id: base.id,
        name: base.name,
        description: base.description || '',
        category: base.category || 'Operaciones',
        icon: base.icon || 'package',
        color: base.color || 'blue',
        tags: base.tags || [],
      } : null,
    });
  } catch (error: any) {
    console.error('Error obteniendo metadatos de tabla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { tableId: tableParam } = await context.params;
    const tableId = await resolveTableId(tableParam);

    if (!tableId) {
      return NextResponse.json({ error: 'Tabla no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, description, icon, color, tags: tableTags,
      baseName, baseDescription, baseCategory, baseIcon, baseColor, baseTags
    } = body;

    // Actualizar tabla
    const tableUpdates: any = { updatedAt: new Date() };
    if (name !== undefined) tableUpdates.name = name;
    if (description !== undefined) tableUpdates.description = description;
    if (icon !== undefined) tableUpdates.icon = icon;
    if (color !== undefined) tableUpdates.color = color;
    if (tableTags !== undefined) tableUpdates.tags = tableTags;

    await db.update(tables).set(tableUpdates).where(eq(tables.id, tableId));

    // Si se enviaron metadatos de la base, actualizarlos
    if (baseName !== undefined || baseDescription !== undefined || baseCategory !== undefined || baseIcon !== undefined || baseColor !== undefined || baseTags !== undefined) {
      const currentTable = await db.query.tables.findFirst({ where: eq(tables.id, tableId) });
      if (currentTable) {
        const baseUpdates: any = { updatedAt: new Date() };
        if (baseName !== undefined) baseUpdates.name = baseName;
        if (baseDescription !== undefined) baseUpdates.description = baseDescription;
        if (baseCategory !== undefined) baseUpdates.category = baseCategory;
        if (baseIcon !== undefined) baseUpdates.icon = baseIcon;
        if (baseColor !== undefined) baseUpdates.color = baseColor;
        if (baseTags !== undefined) baseUpdates.tags = baseTags;

        await db.update(bases).set(baseUpdates).where(eq(bases.id, currentTable.baseId));
      }
    }

    return NextResponse.json({ success: true, message: 'Metadatos actualizados correctamente' });
  } catch (error: any) {
    console.error('Error actualizando metadatos de tabla:', error);
    return NextResponse.json({ error: 'Error interno al actualizar' }, { status: 500 });
  }
}
