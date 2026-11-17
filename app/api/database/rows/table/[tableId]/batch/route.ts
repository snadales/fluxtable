import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

// 1. Batch Create Rows (POST)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: `No se encontró la tabla '${rawTableId}'` },
        { status: 404 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const userFieldNames = searchParams.get('user_field_names') === 'true';
    const body = await req.json();
    const items: any[] = body.items || (Array.isArray(body) ? body : []);

    if (!items.length) {
      return NextResponse.json({ error: 'INVALID_BATCH', message: 'La lista items no puede estar vacía' }, { status: 400 });
    }

    // Obtener campos de la tabla para mapeo
    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const nameToIdMap: Record<string, string> = {};
    for (const f of tableFields) {
      nameToIdMap[f.name] = f.id;
    }

    // Preparar registros
    const recordsToInsert = items.map((item, idx) => {
      const rowData: Record<string, any> = {};
      for (const [key, val] of Object.entries(item)) {
        if (key === 'id' || key === 'order') continue;
        const targetId = userFieldNames ? (nameToIdMap[key] || key) : key;
        rowData[targetId] = val;
      }
      return {
        tableId: tableId as any,
        order: idx + 1,
        version: 1,
        data: rowData,
      };
    });

    // Inserción en lote en PostgreSQL
    const insertedRecords = await db.insert(schema.records).values(recordsToInsert).returning();

    // Mapeo de respuesta estilo Baserow API
    const results = insertedRecords.map((created) => {
      const rowResult: Record<string, any> = {
        id: created.id,
        order: `${created.order}.00000000000000000000`,
      };
      for (const [k, v] of Object.entries(created.data)) {
        const fieldName = userFieldNames ? (tableFields.find((f) => f.id === k)?.name || k) : k;
        rowResult[fieldName] = v;
      }
      return rowResult;
    });

    return NextResponse.json({ items: results }, { status: 201 });
  } catch (err: any) {
    console.error('Error en batch insert:', err);
    return NextResponse.json({ error: 'ERROR_BATCH_CREATION', message: err.message }, { status: 500 });
  }
}

// 2. Batch Update Rows (PATCH)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: `No se encontró la tabla '${rawTableId}'` },
        { status: 404 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const userFieldNames = searchParams.get('user_field_names') === 'true';
    const body = await req.json();
    const items: any[] = body.items || (Array.isArray(body) ? body : []);

    if (!items.length) {
      return NextResponse.json({ error: 'INVALID_BATCH', message: 'La lista items no puede estar vacía' }, { status: 400 });
    }

    // Obtener campos de la tabla para mapeo
    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const nameToIdMap: Record<string, string> = {};
    for (const f of tableFields) {
      nameToIdMap[f.name] = f.id;
    }

    const updatedResults: any[] = [];

    // Actualizar cada registro dentro de una transacción o iteración
    for (const item of items) {
      const rowId = item.id;
      if (!rowId) continue;

      const currentRecord = await db.query.records.findFirst({
        where: and(eq(schema.records.id, String(rowId)), isNull(schema.records.deletedAt)),
      });

      if (!currentRecord) continue;

      const mergedData = { ...(currentRecord.data as Record<string, any>) };
      for (const [key, val] of Object.entries(item)) {
        if (key === 'id' || key === 'order') continue;
        const targetId = userFieldNames ? (nameToIdMap[key] || key) : key;
        mergedData[targetId] = val;
      }

      const [updated] = await db
        .update(schema.records)
        .set({
          data: mergedData,
          version: (currentRecord.version || 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.records.id, currentRecord.id))
        .returning();

      const rowResult: Record<string, any> = {
        id: updated.id,
        order: `${updated.order}.00000000000000000000`,
      };
      for (const [k, v] of Object.entries(updated.data)) {
        const fieldName = userFieldNames ? (tableFields.find((f) => f.id === k)?.name || k) : k;
        rowResult[fieldName] = v;
      }
      updatedResults.push(rowResult);
    }

    return NextResponse.json({ items: updatedResults });
  } catch (err: any) {
    console.error('Error en batch update:', err);
    return NextResponse.json({ error: 'ERROR_BATCH_UPDATE', message: err.message }, { status: 500 });
  }
}

// 3. Batch Delete Rows (DELETE)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { tableId: rawTableId } = await context.params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: `No se encontró la tabla '${rawTableId}'` },
        { status: 404 }
      );
    }

    const body = await req.json();
    const items: (string | number)[] = body.items || (Array.isArray(body) ? body : []);

    if (!items.length) {
      return NextResponse.json({ error: 'INVALID_BATCH', message: 'La lista items no puede estar vacía' }, { status: 400 });
    }

    const stringIds = items.map(String);

    // Soft delete masivo
    await db
      .update(schema.records)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.records.tableId, tableId as any), inArray(schema.records.id, stringIds)));

    return NextResponse.json({ success: true, deletedCount: stringIds.length });
  } catch (err: any) {
    console.error('Error en batch delete:', err);
    return NextResponse.json({ error: 'ERROR_BATCH_DELETE', message: err.message }, { status: 500 });
  }
}
