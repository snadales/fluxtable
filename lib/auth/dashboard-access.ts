/**
 * Acceso a dashboards con BD (#54): resuelve el dashboard, el share del actor y sus capacidades.
 * Las reglas viven en `dashboard-permissions.ts` (puras).
 */
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { biDashboards, biCards, dashboardShares } from '@/db/schema';
import {
  Actor,
  DashboardCapabilities,
  ShareRole,
  computeCapabilities,
  normalizeEmail,
  seesAllDashboards,
} from './dashboard-permissions';

export type DashboardRow = typeof biDashboards.$inferSelect;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Busca por UUID o por código (D001). Un valor que no es ninguno de los dos devuelve null sin consultar. */
export async function findDashboard(idOrCode: string): Promise<DashboardRow | null> {
  const key = String(idOrCode || '').trim();
  if (!key) return null;
  const where = UUID_RE.test(key) ? eq(biDashboards.id, key) : eq(biDashboards.code, key);
  const found = await db.query.biDashboards.findFirst({ where });
  return found ?? null;
}

export async function getShareRole(dashboardId: string, email: string): Promise<ShareRole | null> {
  const e = normalizeEmail(email);
  if (!e || e.startsWith('token:')) return null;
  const share = await db.query.dashboardShares.findFirst({
    where: and(eq(dashboardShares.dashboardId, dashboardId), eq(dashboardShares.email, e)),
  });
  return (share?.role as ShareRole) ?? null;
}

export async function getCapabilities(actor: Actor, dashboardId: string): Promise<DashboardCapabilities> {
  const shareRole = actor.isApiToken ? null : await getShareRole(dashboardId, actor.email);
  return computeCapabilities(actor, shareRole);
}

/**
 * IDs de dashboards visibles para el actor. `null` = todos (superadmin, member, token API).
 */
export async function visibleDashboardIds(actor: Actor): Promise<string[] | null> {
  if (seesAllDashboards(actor)) return null;
  if (actor.role !== 'shared') return [];
  const rows = await db
    .select({ dashboardId: dashboardShares.dashboardId })
    .from(dashboardShares)
    .where(eq(dashboardShares.email, normalizeEmail(actor.email)));
  return rows.map((r) => r.dashboardId);
}

export function notFound() {
  // 404 (no 403) para no revelar que el dashboard existe.
  return NextResponse.json({ error: 'NOT_FOUND', message: 'Dashboard no encontrado' }, { status: 404 });
}

export function forbidden(message = 'No tienes permiso para esta acción') {
  return NextResponse.json({ error: 'FORBIDDEN', message }, { status: 403 });
}

/**
 * Carga dashboard + capacidades y exige una capacidad. Sin `canView` responde 404.
 */
export async function authorizeDashboard(
  actor: Actor,
  idOrCode: string,
  need: 'view' | 'edit' | 'delete' | 'share'
): Promise<
  | { ok: true; dashboard: DashboardRow; caps: DashboardCapabilities }
  | { ok: false; response: NextResponse }
> {
  const dashboard = await findDashboard(idOrCode);
  if (!dashboard) return { ok: false, response: notFound() };
  const caps = await getCapabilities(actor, dashboard.id);
  if (!caps.canView) return { ok: false, response: notFound() };
  const allowed =
    need === 'view' ||
    (need === 'edit' && caps.canEdit) ||
    (need === 'delete' && caps.canDelete) ||
    (need === 'share' && caps.canShare);
  if (!allowed) {
    const messages = {
      edit: 'Tu acceso a este dashboard es de solo lectura',
      delete: 'No puedes borrar este dashboard',
      share: 'No puedes compartir este dashboard',
    } as const;
    return { ok: false, response: forbidden(messages[need as keyof typeof messages]) };
  }
  return { ok: true, dashboard, caps };
}

/** Igual que `authorizeDashboard` pero a partir de una tarjeta. Tarjetas sin dashboard: solo roles globales. */
export async function authorizeCard(actor: Actor, cardId: string, need: 'view' | 'edit') {
  const card = UUID_RE.test(String(cardId || ''))
    ? await db.query.biCards.findFirst({ where: eq(biCards.id, cardId) })
    : undefined;
  if (!card) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'NOT_FOUND', message: 'Tarjeta no encontrada' }, { status: 404 }),
    };
  }
  if (!card.dashboardId) {
    if (!seesAllDashboards(actor)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: 'NOT_FOUND', message: 'Tarjeta no encontrada' }, { status: 404 }),
      };
    }
    return { ok: true as const, card };
  }
  const auth = await authorizeDashboard(actor, card.dashboardId, need);
  if (!auth.ok) {
    if (auth.response.status === 404) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: 'NOT_FOUND', message: 'Tarjeta no encontrada' }, { status: 404 }),
      };
    }
    return auth;
  }
  return { ok: true as const, card, caps: auth.caps };
}

export async function countOwners(dashboardId: string): Promise<number> {
  const rows = await db
    .select({ id: dashboardShares.id })
    .from(dashboardShares)
    .where(and(eq(dashboardShares.dashboardId, dashboardId), eq(dashboardShares.role, 'propietario')));
  return rows.length;
}

export async function dashboardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.query.biDashboards.findMany({ where: inArray(biDashboards.id, ids) });
}

/** Convierte el usuario autenticado (auth-guard) en el actor que usan las reglas de permisos. */
export function actorOf(user: { id: string; email: string; role: string; isApiToken?: boolean }): Actor {
  return { id: user.id, email: user.email, role: user.role, isApiToken: Boolean(user.isApiToken) };
}
