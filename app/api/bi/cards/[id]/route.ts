import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biCards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(biCards)
      .set({
        name: body.name,
        description: body.description,
        chartType: body.chartType,
        sourceType: body.sourceType,
        queryConfigJson: body.queryConfigJson,
        visualConfigJson: body.visualConfigJson,
        gridPosJson: body.gridPosJson,
        tabId: body.tabId,
        order: body.order,
        updatedAt: new Date(),
      })
      .where(eq(biCards.id, id))
      .returning();

    return NextResponse.json({ card: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'UPDATE_CARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    await db.delete(biCards).where(eq(biCards.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DELETE_CARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
