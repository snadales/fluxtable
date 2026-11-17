import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';
import { triggerTableWebhooks } from '@/lib/webhook-dispatcher';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId: rawTableId } = await params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: `No se encontró la tabla '${rawTableId}'` },
        { status: 404 }
      );
    }
    const searchParams = req.nextUrl.searchParams;
    const userFieldNames = searchParams.get('user_field_names') === 'true';

    // 1. Obtener la tabla y sus campos
    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const fieldMap: Record<string, string> = {};
    for (const f of tableFields) {
      fieldMap[f.id] = f.name;
    }

    // 2. Obtener los registros
    const recordsList = await db
      .select()
      .from(schema.records)
      .where(and(eq(schema.records.tableId, tableId as any), isNull(schema.records.deletedAt)))
      .orderBy(schema.records.order);

    // 3. Formatear según user_field_names (Estilo Baserow API v2)
    const results = recordsList.map((rec) => {
      const rowResult: Record<string, any> = {
        id: rec.id,
        order: `${rec.order}.00000000000000000000`,
      };

      for (const [key, val] of Object.entries(rec.data)) {
        const fieldName = userFieldNames ? (fieldMap[key] || key) : key;
        rowResult[fieldName] = val;
      }

      return rowResult;
    });

    return NextResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'ERROR_DATABASE_QUERY', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId: rawTableId } = await params;
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

    // Obtener campos de la tabla para mapear nombres a IDs si user_field_names es true
    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const nameToIdMap: Record<string, string> = {};
    for (const f of tableFields) {
      nameToIdMap[f.name] = f.id;
    }

    const rowData: Record<string, any> = {};
    for (const [key, val] of Object.entries(body)) {
      if (key === 'id' || key === 'order') continue;
      const targetId = userFieldNames ? (nameToIdMap[key] || key) : key;
      rowData[targetId] = val;
    }

    // Insertar registro
    const [created] = await db
      .insert(schema.records)
      .values({
        tableId: tableId as any,
        version: 1,
        data: rowData,
      })
      .returning();

    // Respuesta en formato Baserow
    const responseResult: Record<string, any> = {
      id: created.id,
      order: `${created.order}.00000000000000000000`,
    };

    for (const [k, v] of Object.entries(created.data)) {
      const fieldName = userFieldNames ? (tableFields.find(f => f.id === k)?.name || k) : k;
      responseResult[fieldName] = v;
    }

    // Disparar Webhooks salientes de forma asíncrona
    triggerTableWebhooks(tableId, 'rows.created', [responseResult]);

    return NextResponse.json(responseResult, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'ERROR_RECORD_CREATION', message: err.message },
      { status: 500 }
    );
  }
}
