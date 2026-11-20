import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biCards, biDashboardTabs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { actorOf, authorizeCard, forbidden } from '@/lib/auth/dashboard-access';

/** Campos que un invitado propietario puede cambiar: presentación, no la consulta ni el origen. */
const SHARED_EDITABLE = ['name', 'description', 'visualConfigJson', 'gridPosJson', 'tabId', 'order'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const actor = actorOf(auth.user);
    const access = await authorizeCard(actor, id, 'edit');
    if (!access.ok) return access.response;
    const body = await req.json();

    if (actor.role === 'shared') {
      const blocked = Object.keys(body ?? {}).filter(
        (k) => body[k] !== undefined && !(SHARED_EDITABLE as readonly string[]).includes(k)
      );
      if (blocked.length > 0) {
        return forbidden(`Un invitado no puede cambiar: ${blocked.join(', ')}`);
      }
    }

    // La pestaña destino debe ser del mismo dashboard.
    if (body.tabId) {
      const tab = await db.query.biDashboardTabs.findFirst({ where: eq(biDashboardTabs.id, body.tabId) });
      if (!tab || tab.dashboardId !== access.card.dashboardId) {
        return NextResponse.json(
          { error: 'BAD_REQUEST', message: 'La pestaña no pertenece al dashboard de la tarjeta' },
          { status: 400 }
        );
      }
    }

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
      .where(eq(biCards.id, access.card.id))
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
    const access = await authorizeCard(actorOf(auth.user), id, 'edit');
    if (!access.ok) return access.response;
    await db.delete(biCards).where(eq(biCards.id, access.card.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DELETE_CARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
