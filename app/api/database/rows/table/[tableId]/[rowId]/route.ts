import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, isNull } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';
import { triggerTableWebhooks } from '@/lib/webhook-dispatcher';
import { resolveActor, logAuditAction, buildActorLineage } from '@/lib/audit/audit-helper';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string; rowId: string }> }
) {
  try {
    const { tableId: rawTableId, rowId } = await params;
    const tableId = await resolveTableId(rawTableId);
    if (!tableId) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: `No se encontró la tabla '${rawTableId}'` },
        { status: 404 }
      );
    }
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
      _actor_lineage: record.actorLineage || {},
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
    const { tableId: rawTableId, rowId } = await params;
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
      if (k === 'id' || k === 'order' || k === 'version' || k === 'expected_version') continue;
      const targetId = userFieldNames ? (nameToIdMap[k] || k) : k;
      updatedData[targetId] = v;
    }

    // Control de concurrencia optimista
    const expectedVersion = body.version !== undefined 
      ? Number(body.version) 
      : (body.expected_version !== undefined ? Number(body.expected_version) : undefined);

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return NextResponse.json(
        { 
          error: 'CONFLICT_OPTIMISTIC_LOCK', 
          message: `El registro fue modificado concurrentemente (versión actual: ${existing.version}, esperada: ${expectedVersion})`,
          currentVersion: existing.version 
        }, 
        { status: 409 }
      );
    }

    // Resolver actor y auditoría
    const actor = await resolveActor(req);
    const actorLineage = buildActorLineage(existing.actorLineage, 'update', actor);

    // Calcular diferencias de campos
    const changedFields: Record<string, { old: any; new: any }> = {};
    for (const [k, v] of Object.entries(updatedData)) {
      if (JSON.stringify(existing.data[k]) !== JSON.stringify(v)) {
        changedFields[k] = { old: existing.data[k] ?? null, new: v };
      }
    }

    const [updated] = await db
      .update(schema.records)
      .set({
        data: updatedData,
        version: existing.version + 1,
        updatedBy: `${actor.agentClient}:${actor.actorName}`,
        actorLineage,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.records.id, rowId as any), eq(schema.records.version, existing.version)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'CONFLICT_CONCURRENT_UPDATE', message: 'Conflicto de concurrencia detectado en PostgreSQL' },
        { status: 409 }
      );
    }

    // Registrar auditoría de actualización
    logAuditAction({
      workspaceId: tableId as any,
      tableId: tableId as any,
      recordId: updated.id,
      action: 'update',
      actor,
      changedFields,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const responseResult: Record<string, any> = {
      id: updated.id,
      order: `${updated.order}.00000000000000000000`,
      _actor_lineage: actorLineage,
    };

    for (const [k, v] of Object.entries(updated.data)) {
      const fieldName = userFieldNames ? (tableFields.find(f => f.id === k)?.name || k) : k;
      responseResult[fieldName] = v;
    }

    // Disparar Webhooks salientes para fila actualizada
    triggerTableWebhooks(tableId, 'rows.updated', [responseResult]);

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
    const { tableId: rawTableId, rowId } = await params;
    const tableId = await resolveTableId(rawTableId);

    // Soft delete
    const [deleted] = await db
      .update(schema.records)
      .set({ deletedAt: new Date() })
      .where(eq(schema.records.id, rowId as any))
      .returning();

    // Resolver actor y registrar auditoría
    const actor = await resolveActor(req);
    logAuditAction({
      workspaceId: tableId as any,
      tableId: tableId as any,
      recordId: rowId,
      action: 'delete',
      actor,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    if (tableId) {
      triggerTableWebhooks(tableId, 'rows.deleted', [{ id: rowId }]);
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
