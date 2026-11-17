import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json({ error: 'Tabla no encontrada' }, { status: 404 });
    }

    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)))
      .orderBy(schema.fields.order);

    return NextResponse.json(tableFields);
  } catch (err: any) {
    console.error('Error listando campos:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json({ error: 'Tabla no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const { name, type = 'text', options = {}, width = 180, isPrimary = false } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre del campo es requerido' }, { status: 400 });
    }

    // Calcular el siguiente orden
    const existing = await db
      .select({ order: schema.fields.order })
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const maxOrder = existing.reduce((max, f) => Math.max(max, f.order), 0);

    const [createdField] = await db
      .insert(schema.fields)
      .values({
        tableId: tableId as any,
        name: name.trim(),
        type: type as any,
        options,
        width,
        order: maxOrder + 1,
        isPrimary,
      })
      .returning();

    return NextResponse.json(createdField, { status: 201 });
  } catch (err: any) {
    console.error('Error creando campo:', err);
    return NextResponse.json({ error: 'Error interno creando campo' }, { status: 500 });
  }
}
