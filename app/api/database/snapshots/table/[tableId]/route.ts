import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

// GET: Listar snapshots de una tabla
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json({ error: 'TABLE_NOT_FOUND' }, { status: 404 });
    }

    const tableSnapshots = await db
      .select({
        id: schema.snapshots.id,
        name: schema.snapshots.name,
        tableId: schema.snapshots.tableId,
        createdAt: schema.snapshots.createdAt,
      })
      .from(schema.snapshots)
      .where(eq(schema.snapshots.tableId, tableId as any))
      .orderBy(schema.snapshots.createdAt);

    return NextResponse.json(tableSnapshots);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Crear snapshot de la tabla
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json({ error: 'TABLE_NOT_FOUND' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const snapshotName = body.name || `Snapshot ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`;

    // 1. Obtener metadata de la tabla
    const table = await db.query.tables.findFirst({
      where: eq(schema.tables.id, tableId as any),
    });

    if (!table) {
      return NextResponse.json({ error: 'TABLE_NOT_FOUND' }, { status: 404 });
    }

    // 2. Obtener campos
    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    // 3. Obtener vistas
    const tableViews = await db
      .select()
      .from(schema.views)
      .where(eq(schema.views.tableId, tableId as any));

    // 4. Obtener registros actuales
    const tableRecords = await db
      .select()
      .from(schema.records)
      .where(and(eq(schema.records.tableId, tableId as any), isNull(schema.records.deletedAt)));

    // 5. Guardar snapshot
    const [created] = await db
      .insert(schema.snapshots)
      .values({
        tableId: tableId as any,
        name: snapshotName,
        data: {
          table,
          fields: tableFields,
          views: tableViews,
          records: tableRecords,
        },
      })
      .returning();

    return NextResponse.json({
      id: created.id,
      name: created.name,
      tableId: created.tableId,
      recordCount: tableRecords.length,
      createdAt: created.createdAt,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
