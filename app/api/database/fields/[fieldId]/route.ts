import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ fieldId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { fieldId } = await context.params;
    const field = await db.query.fields.findFirst({
      where: and(eq(schema.fields.id, fieldId), isNull(schema.fields.deletedAt)),
    });

    if (!field) {
      return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(field);
  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { fieldId } = await context.params;
    const body = await req.json();
    const { name, type, options, width, order } = body;

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (options !== undefined) updates.options = options;
    if (width !== undefined) updates.width = width;
    if (order !== undefined) updates.order = order;

    const [updated] = await db
      .update(schema.fields)
      .set(updates)
      .where(eq(schema.fields.id, fieldId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error actualizando campo:', err);
    return NextResponse.json({ error: 'Error interno actualizando campo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { fieldId } = await context.params;

    const [deleted] = await db
      .update(schema.fields)
      .set({ deletedAt: new Date() })
      .where(eq(schema.fields.id, fieldId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Campo eliminado' });
  } catch (err: any) {
    console.error('Error eliminando campo:', err);
    return NextResponse.json({ error: 'Error interno eliminando campo' }, { status: 500 });
  }
}
