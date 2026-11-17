import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

// GET: Listar webhooks de la tabla
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json({ error: 'TABLE_NOT_FOUND' }, { status: 404 });
    }

    const tableWebhooks = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.tableId, tableId as any))
      .orderBy(schema.webhooks.createdAt);

    return NextResponse.json(tableWebhooks);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Crear nuevo webhook para la tabla
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json({ error: 'TABLE_NOT_FOUND' }, { status: 404 });
    }

    const body = await req.json();
    const { name, url, events, headers, requestType } = body;

    if (!url || !name) {
      return NextResponse.json(
        { error: 'INVALID_WEBHOOK', message: 'Nombre y URL son requeridos' },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(schema.webhooks)
      .values({
        tableId: tableId as any,
        name,
        url,
        events: events || ['rows.created', 'rows.updated', 'rows.deleted'],
        requestType: requestType || 'POST',
        headers: headers || {},
        isActive: true,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
