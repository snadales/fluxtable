import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [restored] = await db
      .update(schema.records)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(schema.records.id, id as any))
      .returning();

    if (!restored) {
      return NextResponse.json({ error: 'ELEMENTO_NO_ENCONTRADO' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Registro restaurado con éxito',
      record: restored,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
