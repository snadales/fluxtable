import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biCards } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();

    if (!body.dashboardId || !body.name || !body.chartType) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'dashboardId, name y chartType son requeridos' },
        { status: 400 }
      );
    }

    // Código correlativo K001, G001, T001
    let prefix = 'G';
    if (body.chartType === 'kpi') prefix = 'K';
    else if (body.chartType === 'table') prefix = 'T';
    else if (body.chartType === 'markdown') prefix = 'M';

    const existingCards = await db.query.biCards.findMany({
      where: eq(biCards.dashboardId, body.dashboardId),
    });
    const code = `${prefix}${String(existingCards.length + 1).padStart(3, '0')}`;

    const [created] = await db
      .insert(biCards)
      .values({
        code,
        dashboardId: body.dashboardId,
        tabId: body.tabId || null,
        name: body.name,
        description: body.description || '',
        chartType: body.chartType,
        sourceType: body.sourceType || 'local_baserow',
        queryConfigJson: body.queryConfigJson || {},
        visualConfigJson: body.visualConfigJson || {},
        gridPosJson: body.gridPosJson || { x: 0, y: 0, w: 6, h: 4 },
        order: body.order || existingCards.length,
      })
      .returning();

    return NextResponse.json({ card: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'CREATE_CARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
