import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, tables } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get('tableId');
    const recordId = searchParams.get('recordId');
    const action = searchParams.get('action');
    const actor = searchParams.get('actor');
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitParam, 1), 200);

    const conditions = [];

    if (tableId) {
      conditions.push(eq(auditLogs.tableId, tableId as any));
    }
    if (recordId) {
      conditions.push(eq(auditLogs.recordId, recordId as any));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action as any));
    }
    if (actor) {
      conditions.push(sql`${auditLogs.actorId} ILIKE ${'%' + actor + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db.query.auditLogs.findMany({
      where: whereClause,
      orderBy: [desc(auditLogs.createdAt)],
      limit,
    });

    return NextResponse.json({
      count: logs.length,
      logs: logs.map((log) => ({
        id: log.id,
        workspaceId: log.workspaceId,
        tableId: log.tableId,
        recordId: log.recordId,
        action: log.action,
        actorType: log.actorType,
        actorId: log.actorId,
        actorEmail: log.actorEmail,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        changedFields: log.changedFields,
        createdAt: log.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Error consultando audit logs:', err);
    return NextResponse.json(
      { error: 'ERROR_FETCHING_AUDIT_LOGS', message: err.message },
      { status: 500 }
    );
  }
}
