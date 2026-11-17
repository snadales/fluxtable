import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ snapshotId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { snapshotId } = await context.params;
    const snapshot = await db.query.snapshots.findFirst({
      where: eq(schema.snapshots.id, snapshotId as any),
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'SNAPSHOT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { snapshotId } = await context.params;
    await db.delete(schema.snapshots).where(eq(schema.snapshots.id, snapshotId as any));
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
