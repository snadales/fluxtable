import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biDashboards, biDashboardTabs, biCards, biThresholds } from '@/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { actorOf, authorizeDashboard } from '@/lib/auth/dashboard-access';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    // Buscar por ID o por Código (ej. D001). Sin acceso responde 404 (#54).
    const access = await authorizeDashboard(actorOf(auth.user), id, 'view');
    if (!access.ok) return access.response;
    const { dashboard, caps } = access;

    const tabs = await db.query.biDashboardTabs.findMany({
      where: eq(biDashboardTabs.dashboardId, dashboard.id),
      orderBy: [asc(biDashboardTabs.order)],
    });

    const cards = await db.query.biCards.findMany({
      where: eq(biCards.dashboardId, dashboard.id),
      orderBy: [asc(biCards.order)],
    });

    const cardIds = cards.map((c) => c.id);
    const thresholds = cardIds.length
      ? await db.query.biThresholds.findMany({ where: inArray(biThresholds.cardId, cardIds) })
      : [];

    const cardsWithThresholds = cards.map((c) => ({
      ...c,
      thresholds: thresholds.filter((t) => t.cardId === c.id),
    }));

    return NextResponse.json({
      dashboard: {
        ...dashboard,
        tabs,
        cards: cardsWithThresholds,
        // Capacidades del usuario actual sobre este dashboard: la UI oculta controles según esto.
        access: caps,
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
    const actor = actorOf(auth.user);
    const access = await authorizeDashboard(actor, id, 'edit');
    if (!access.ok) return access.response;
    const body = await req.json();

    const [updated] = await db
      .update(biDashboards)
      .set({
        name: body.name,
        description: body.description,
        icon: body.icon,
        // Un invitado no ve el árbol de carpetas: no puede mover el dashboard.
        folderId: actor.role === 'shared' ? undefined : body.folderId,
        isFavorite: body.isFavorite,
        autoRefreshInterval: body.autoRefreshInterval,
        layoutJson: body.layoutJson,
        tags: body.tags,
        updatedAt: new Date(),
      })
      .where(eq(biDashboards.id, access.dashboard.id))
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
    const access = await authorizeDashboard(actorOf(auth.user), id, 'delete');
    if (!access.ok) return access.response;
    await db.delete(biDashboards).where(eq(biDashboards.id, access.dashboard.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DELETE_DASHBOARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
