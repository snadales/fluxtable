/**
 * Accesos por dashboard (#54).
 *   GET    → lista de accesos (requiere poder compartir).
 *   POST   → { email, role } alta o cambio de rol; si el correo no existe se crea el usuario con rol
 *            global `shared` (solo ve lo compartido). Un `pending` existente pasa a `shared`.
 *   DELETE → ?email=... (o { email } en el cuerpo) quita el acceso.
 */
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { dashboardShares, users } from '@/db/schema';
import { actorOf, authorizeDashboard, countOwners } from '@/lib/auth/dashboard-access';
import {
  SHARED_GLOBAL_ROLE,
  ShareRole,
  normalizeEmail,
  validateShareDelete,
  validateShareUpsert,
} from '@/lib/auth/dashboard-permissions';

type Params = { params: Promise<{ id: string }> };

function deny(check: { status: number; error: string; message: string }) {
  return NextResponse.json({ error: check.error, message: check.message }, { status: check.status });
}

async function listShares(dashboardId: string) {
  const rows = await db
    .select({
      id: dashboardShares.id,
      email: dashboardShares.email,
      role: dashboardShares.role,
      createdBy: dashboardShares.createdBy,
      createdAt: dashboardShares.createdAt,
      name: users.name,
      userRole: users.role,
      isActive: users.isActive,
    })
    .from(dashboardShares)
    .leftJoin(users, eq(users.email, dashboardShares.email))
    .where(eq(dashboardShares.dashboardId, dashboardId))
    .orderBy(asc(dashboardShares.createdAt));
  return rows;
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;
  try {
    const { id } = await params;
    const access = await authorizeDashboard(actorOf(auth.user), id, 'share');
    if (!access.ok) return access.response;
    const shares = await listShares(access.dashboard.id);
    return NextResponse.json({
      dashboard: { id: access.dashboard.id, code: access.dashboard.code, name: access.dashboard.name },
      access: access.caps,
      shares,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'GET_SHARES_ERROR', message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;
  try {
    const { id } = await params;
    const actor = actorOf(auth.user);
    const access = await authorizeDashboard(actor, id, 'share');
    if (!access.ok) return access.response;
    const dashboardId = access.dashboard.id;

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email ?? '');
    const role = body?.role;

    const existing = email
      ? await db.query.dashboardShares.findFirst({
          where: and(eq(dashboardShares.dashboardId, dashboardId), eq(dashboardShares.email, email)),
        })
      : undefined;
    const check = validateShareUpsert({
      actor,
      caps: access.caps,
      targetEmail: email,
      role,
      existingRole: (existing?.role as ShareRole) ?? null,
      ownerCount: await countOwners(dashboardId),
    });
    if (!check.ok) return deny(check);

    const createdBy = actor.isApiToken ? null : actor.id;
    const result = await db.transaction(async (tx) => {
      // Usuario: si no existe, alta con rol limitado `shared`; un `pending` pasa a `shared`.
      // member/superadmin/shared existentes no cambian; un usuario inactivo no se reactiva.
      const user = await tx.query.users.findFirst({ where: eq(users.email, email) });
      let userStatus: 'created' | 'promoted' | 'existing' = 'existing';
      if (!user) {
        await tx.insert(users).values({
          email,
          name: email.split('@')[0],
          role: SHARED_GLOBAL_ROLE,
          isActive: true,
        });
        userStatus = 'created';
      } else if (user.role === 'pending') {
        await tx.update(users).set({ role: SHARED_GLOBAL_ROLE, updatedAt: new Date() }).where(eq(users.id, user.id));
        userStatus = 'promoted';
      }

      const [share] = await tx
        .insert(dashboardShares)
        .values({ dashboardId, email, role: role as ShareRole, createdBy })
        .onConflictDoUpdate({
          target: [dashboardShares.dashboardId, dashboardShares.email],
          set: { role: role as ShareRole },
        })
        .returning();
      return { share, userStatus, userActive: user ? user.isActive : true };
    });

    return NextResponse.json(
      {
        share: result.share,
        user: { email, status: result.userStatus, isActive: result.userActive },
        shares: await listShares(dashboardId),
      },
      { status: existing ? 200 : 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'UPSERT_SHARE_ERROR', message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;
  try {
    const { id } = await params;
    const actor = actorOf(auth.user);
    const access = await authorizeDashboard(actor, id, 'share');
    if (!access.ok) return access.response;
    const dashboardId = access.dashboard.id;

    const fromQuery = new URL(req.url).searchParams.get('email');
    const body = fromQuery ? {} : await req.json().catch(() => ({}));
    const email = normalizeEmail(fromQuery ?? body?.email ?? '');

    const existing = email
      ? await db.query.dashboardShares.findFirst({
          where: and(eq(dashboardShares.dashboardId, dashboardId), eq(dashboardShares.email, email)),
        })
      : undefined;
    const check = validateShareDelete({
      actor,
      caps: access.caps,
      existing: existing ? { role: existing.role as ShareRole, createdBy: existing.createdBy } : null,
      ownerCount: await countOwners(dashboardId),
    });
    if (!check.ok) return deny(check);

    // El usuario `shared` se conserva (puede tener otros dashboards); sin shares no ve nada.
    await db.delete(dashboardShares).where(eq(dashboardShares.id, existing!.id));
    return NextResponse.json({ success: true, shares: await listShares(dashboardId) });
  } catch (err: any) {
    return NextResponse.json({ error: 'DELETE_SHARE_ERROR', message: err.message }, { status: 500 });
  }
}
