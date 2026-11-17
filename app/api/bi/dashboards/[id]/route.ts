import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biDashboards, biDashboardTabs, biCards, biThresholds } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    // Buscar por ID o por Código (ej. D001)
    const dashboard = await db.query.biDashboards.findFirst({
      where: id.startsWith('D') && id.length <= 6
        ? eq(biDashboards.code, id)
        : eq(biDashboards.id, id),
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Dashboard no encontrado' },
        { status: 404 }
      );
    }

    const tabs = await db.query.biDashboardTabs.findMany({
      where: eq(biDashboardTabs.dashboardId, dashboard.id),
      orderBy: [asc(biDashboardTabs.order)],
    });

    const cards = await db.query.biCards.findMany({
      where: eq(biCards.dashboardId, dashboard.id),
      orderBy: [asc(biCards.order)],
    });

    const thresholds = await db.query.biThresholds.findMany();

    const cardsWithThresholds = cards.map((c) => ({
      ...c,
      thresholds: thresholds.filter((t) => t.cardId === c.id),
    }));

    return NextResponse.json({
      dashboard: {
        ...dashboard,
        tabs,
        cards: cardsWithThresholds,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'GET_DASHBOARD_DETAIL_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

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
      .update(biDashboards)
      .set({
        name: body.name,
        description: body.description,
        icon: body.icon,
        folderId: body.folderId,
        isFavorite: body.isFavorite,
        autoRefreshInterval: body.autoRefreshInterval,
        layoutJson: body.layoutJson,
        tags: body.tags,
        updatedAt: new Date(),
      })
      .where(eq(biDashboards.id, id))
      .returning();

    return NextResponse.json({ dashboard: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'UPDATE_DASHBOARD_ERROR', message: err.message },
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
    await db.delete(biDashboards).where(eq(biDashboards.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DELETE_DASHBOARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
