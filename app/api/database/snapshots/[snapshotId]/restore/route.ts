import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ snapshotId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { snapshotId } = await context.params;
    const snapshot = await db.query.snapshots.findFirst({
      where: eq(schema.snapshots.id, snapshotId as any),
    });

    if (!snapshot || !snapshot.data) {
      return NextResponse.json({ error: 'SNAPSHOT_NOT_FOUND' }, { status: 404 });
    }

    const { table, records: savedRecords } = snapshot.data;
    const tableId = snapshot.tableId || table?.id;

    if (!tableId) {
      return NextResponse.json({ error: 'INVALID_SNAPSHOT_DATA', message: 'No hay tableId asociado' }, { status: 400 });
    }

    // 1. Soft-delete de los registros actuales
    await db
      .update(schema.records)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.records.tableId, tableId as any), isNull(schema.records.deletedAt)));

    // 2. Restaurar registros del snapshot
    let restoredCount = 0;
    if (Array.isArray(savedRecords) && savedRecords.length > 0) {
      const recordsToInsert = savedRecords.map((r: any) => ({
        tableId: tableId as any,
        order: r.order || 1,
        version: (r.version || 1) + 1,
        data: r.data || {},
      }));

      await db.insert(schema.records).values(recordsToInsert);
      restoredCount = recordsToInsert.length;
    }

    return NextResponse.json({
      success: true,
      message: `Tabla restaurada exitosamente desde '${snapshot.name}'`,
      restoredCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
