import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string; rowId: string }> }
) {
  try {
    const { tableId, rowId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const userFieldNames = searchParams.get('user_field_names') === 'true';

    const [record] = await db
      .select()
      .from(schema.records)
      .where(and(eq(schema.records.id, rowId as any), isNull(schema.records.deletedAt)));

    if (!record) {
      return NextResponse.json({ error: 'ERROR_RECORD_NOT_FOUND' }, { status: 404 });
    }

    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const result: Record<string, any> = {
      id: record.id,
      order: `${record.order}.00000000000000000000`,
    };

    for (const [k, v] of Object.entries(record.data)) {
      const fieldName = userFieldNames ? (tableFields.find(f => f.id === k)?.name || k) : k;
      result[fieldName] = v;
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string; rowId: string }> }
) {
  try {
    const { tableId, rowId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const userFieldNames = searchParams.get('user_field_names') === 'true';
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(schema.records)
      .where(and(eq(schema.records.id, rowId as any), isNull(schema.records.deletedAt)));

    if (!existing) {
      return NextResponse.json({ error: 'ERROR_RECORD_NOT_FOUND' }, { status: 404 });
    }

    // Mapear campos si es necesario
    const tableFields = await db
      .select()
      .from(schema.fields)
      .where(and(eq(schema.fields.tableId, tableId as any), isNull(schema.fields.deletedAt)));

    const nameToIdMap: Record<string, string> = {};
    for (const f of tableFields) {
      nameToIdMap[f.name] = f.id;
    }

    const updatedData = { ...existing.data };
    for (const [k, v] of Object.entries(body)) {
      if (k === 'id' || k === 'order') continue;
      const targetId = userFieldNames ? (nameToIdMap[k] || k) : k;
      updatedData[targetId] = v;
    }

    const [updated] = await db
      .update(schema.records)
      .set({
        data: updatedData,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.records.id, rowId as any))
      .returning();

    const responseResult: Record<string, any> = {
      id: updated.id,
      order: `${updated.order}.00000000000000000000`,
    };

    for (const [k, v] of Object.entries(updated.data)) {
      const fieldName = userFieldNames ? (tableFields.find(f => f.id === k)?.name || k) : k;
      responseResult[fieldName] = v;
    }

    return NextResponse.json(responseResult);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string; rowId: string }> }
) {
  try {
    const { rowId } = await params;

    // Soft delete
    await db
      .update(schema.records)
      .set({ deletedAt: new Date() })
      .where(eq(schema.records.id, rowId as any));

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
