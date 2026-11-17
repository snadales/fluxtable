import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { isNotNull } from 'drizzle-orm';

export async function GET() {
  try {
    const deletedRecords = await db
      .select()
      .from(schema.records)
      .where(isNotNull(schema.records.deletedAt))
      .orderBy(schema.records.deletedAt);

    return NextResponse.json({
      count: deletedRecords.length,
      trash: deletedRecords,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
