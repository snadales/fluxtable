/**
 * Integración de compartir dashboards (#54) contra Postgres en memoria (PGlite):
 * rutas reales, BD real con el esquema de Drizzle, autenticación simulada.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';

const state = vi.hoisted(() => ({ user: null as any, testDb: null as any }));

vi.mock('@/db', async () => {
  const { createTestDb } = await import('./pglite-db');
  const schema = await import('@/db/schema');
  state.testDb = await createTestDb();
  return { db: state.testDb.db, schema };
});

vi.mock('@/lib/auth/auth-guard', () => ({
  requireAuth: async () => {
    if (!state.user) {
      const { NextResponse } = await import('next/server');
      return { authenticated: false, response: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
    }
    return { authenticated: true, user: state.user };
  },
}));

import * as schema from '@/db/schema';
import { db } from '@/db';
import * as dashboardsRoute from '@/app/api/bi/dashboards/route';
import * as dashboardRoute from '@/app/api/bi/dashboards/[id]/route';
import * as sharesRoute from '@/app/api/bi/dashboards/[id]/shares/route';
import * as cardsRoute from '@/app/api/bi/cards/route';
import * as cardRoute from '@/app/api/bi/cards/[id]/route';
import * as queryRoute from '@/app/api/bi/query/route';
import * as foldersRoute from '@/app/api/bi/folders/route';

const U = {
  seba: { email: 'snadales@gmail.com', role: 'superadmin' },
  agente: { email: 'agente-optimizador@yarken.cl', role: 'member' },
  dhayis: { email: 'dhayis27@gmail.com', role: 'shared' },
  lector: { email: 'lector@ejemplo.cl', role: 'shared' },
  extrano: { email: 'extrano@ejemplo.cl', role: 'shared' },
} as const;
const ids: Record<string, string> = {};
let d3: { id: string; code: string };
let d4: { id: string; code: string };
let cardD3: string;
let cardD4: string;

function as(key: keyof typeof U | 'token') {
  state.user =
    key === 'token'
      ? { id: 'tok_1', email: 'token:ci', role: 'api_token', name: 'ci', isApiToken: true }
      : { id: ids[key], email: U[key].email, role: U[key].role, name: key, isApiToken: false };
}

function req(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const p = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(async () => {
  for (const [k, u] of Object.entries(U)) {
    const [row] = await db.insert(schema.users).values({ email: u.email, name: k, role: u.role as any }).returning();
    ids[k] = row.id;
  }
  const [ws] = await db.insert(schema.workspaces).values({ name: 'WS', slug: 'ws' }).returning();
  const [f1] = await db.insert(schema.biFolders).values({ workspaceId: ws.id, name: 'Raíz' }).returning();
  const [f2] = await db.insert(schema.biFolders).values({ workspaceId: ws.id, name: 'Ventas', parentId: f1.id }).returning();
  await db.insert(schema.biFolders).values({ workspaceId: ws.id, name: 'Privada' });
  [d3] = await db.insert(schema.biDashboards).values({ code: 'D003', workspaceId: ws.id, name: 'Ventas', folderId: f2.id }).returning();
  [d4] = await db.insert(schema.biDashboards).values({ code: 'D004', workspaceId: ws.id, name: 'Privado' }).returning();

  await state.testDb.client.exec(`
    CREATE TABLE ventas (canal text, monto int, fecha timestamptz default now());
    INSERT INTO ventas VALUES ('ML', 100), ('ML', 50), ('Paris', 70);
    CREATE TABLE secreta (x int); INSERT INTO secreta VALUES (42);
  `);
  const qc = { tableOrView: 'ventas', metrics: [{ field: 'monto', aggregation: 'sum', alias: 'total' }] };
  [{ id: cardD3 }] = await db.insert(schema.biCards).values({ code: 'K001', dashboardId: d3.id, name: 'Total', chartType: 'kpi', sourceType: 'local_baserow', queryConfigJson: qc }).returning();
  [{ id: cardD4 }] = await db.insert(schema.biCards).values({ code: 'K001', dashboardId: d4.id, name: 'Secreta', chartType: 'kpi', sourceType: 'local_baserow', queryConfigJson: qc }).returning();

  // Seed D003 tal como lo aplicará Seba (mismo SQL).
  const seed = fs.readFileSync(path.resolve(__dirname, '../../../scripts/seed_dashboard_shares_d003.sql'), 'utf8');
  await state.testDb.client.exec(seed);
  await state.testDb.client.exec(seed); // idempotente
  await db.insert(schema.dashboardShares).values({ dashboardId: d3.id, email: U.lector.email, role: 'lector' });
});

describe('seed D003', () => {
  it('deja a Seba propietario y a dhayis27 colaborador, sin duplicar', async () => {
    const rows = await db.query.dashboardShares.findMany({ where: eq(schema.dashboardShares.dashboardId, d3.id) });
    const map = Object.fromEntries(rows.map((r) => [r.email, r.role]));
    expect(map).toMatchObject({ 'snadales@gmail.com': 'propietario', 'dhayis27@gmail.com': 'colaborador' });
    expect(rows.filter((r) => r.email === 'dhayis27@gmail.com')).toHaveLength(1);
  });
});

describe('listado y detalle', () => {
  it('superadmin, member y token ven todos los dashboards (sin cambios)', async () => {
    for (const who of ['seba', 'agente', 'token'] as const) {
      as(who);
      const json = await (await dashboardsRoute.GET(req('/api/bi/dashboards'))).json();
      expect(json.dashboards.map((d: any) => d.code)).toEqual(['D003', 'D004']);
    }
  });

  it('un invitado solo ve lo compartido', async () => {
    as('dhayis');
    const json = await (await dashboardsRoute.GET(req('/api/bi/dashboards'))).json();
    expect(json.dashboards.map((d: any) => d.code)).toEqual(['D003']);
    as('extrano');
    const none = await (await dashboardsRoute.GET(req('/api/bi/dashboards'))).json();
    expect(none.dashboards).toEqual([]);
  });

  it('detalle sin acceso responde 404; con acceso incluye capacidades', async () => {
    as('dhayis');
    expect((await dashboardRoute.GET(req('/api/bi/dashboards/D004'), p('D004'))).status).toBe(404);
    expect((await dashboardRoute.GET(req(`/api/bi/dashboards/${d4.id}`), p(d4.id))).status).toBe(404);
    const ok = await (await dashboardRoute.GET(req('/api/bi/dashboards/D003'), p('D003'))).json();
    expect(ok.dashboard.access).toMatchObject({ effectiveRole: 'colaborador', canEdit: false, canShare: true });
    as('agente');
    const m = await (await dashboardRoute.GET(req('/api/bi/dashboards/D004'), p('D004'))).json();
    expect(m.dashboard.access).toMatchObject({ canEdit: true, canShare: false });
  });

  it('carpetas: el invitado ve solo las de sus dashboards y sus ancestros', async () => {
    as('dhayis');
    const json = await (await foldersRoute.GET(req('/api/bi/folders'))).json();
    expect(json.folders.map((f: any) => f.name).sort()).toEqual(['Raíz', 'Ventas']);
    expect((await foldersRoute.POST(req('/api/bi/folders', 'POST', { name: 'x' }))).status).toBe(403);
  });
});

describe('escritura', () => {
  it('lector y colaborador no editan ni borran (403); invitados no crean', async () => {
    for (const who of ['lector', 'dhayis'] as const) {
      as(who);
      expect((await dashboardRoute.PATCH(req('/api/bi/dashboards/D003', 'PATCH', { name: 'x' }), p('D003'))).status).toBe(403);
      expect((await dashboardRoute.DELETE(req('/api/bi/dashboards/D003', 'DELETE'), p('D003'))).status).toBe(403);
      expect((await cardRoute.PATCH(req(`/api/bi/cards/${cardD3}`, 'PATCH', { name: 'x' }), p(cardD3))).status).toBe(403);
      expect((await cardRoute.DELETE(req(`/api/bi/cards/${cardD3}`, 'DELETE'), p(cardD3))).status).toBe(403);
      expect((await cardsRoute.POST(req('/api/bi/cards', 'POST', { dashboardId: d3.id, name: 'x', chartType: 'kpi' }))).status).toBe(403);
      expect((await dashboardsRoute.POST(req('/api/bi/dashboards', 'POST', { name: 'x' }))).status).toBe(403);
    }
  });

  it('una tarjeta de un dashboard ajeno responde 404', async () => {
    as('dhayis');
    expect((await cardRoute.PATCH(req(`/api/bi/cards/${cardD4}`, 'PATCH', { name: 'x' }), p(cardD4))).status).toBe(404);
  });

  it('member sigue editando y creando como hoy', async () => {
    as('agente');
    expect((await dashboardRoute.PATCH(req(`/api/bi/dashboards/${d4.id}`, 'PATCH', { name: 'Privado 2' }), p(d4.id))).status).toBe(200);
    expect((await cardsRoute.POST(req('/api/bi/cards', 'POST', { dashboardId: d4.id, name: 'n', chartType: 'kpi' }))).status).toBe(201);
  });

  it('invitado propietario edita presentación pero no la consulta ni borra', async () => {
    as('seba');
    await sharesRoute.POST(req('/api/bi/dashboards/D003/shares', 'POST', { email: U.extrano.email, role: 'propietario' }), p('D003'));
    as('extrano');
    expect((await dashboardRoute.PATCH(req('/api/bi/dashboards/D003', 'PATCH', { name: 'Ventas' }), p('D003'))).status).toBe(200);
    expect((await cardRoute.PATCH(req(`/api/bi/cards/${cardD3}`, 'PATCH', { name: 'Total ventas' }), p(cardD3))).status).toBe(200);
    expect((await cardRoute.PATCH(req(`/api/bi/cards/${cardD3}`, 'PATCH', { queryConfigJson: { tableOrView: 'secreta' } }), p(cardD3))).status).toBe(403);
    expect((await dashboardRoute.DELETE(req('/api/bi/dashboards/D003', 'DELETE'), p('D003'))).status).toBe(403);
    as('seba');
    await sharesRoute.DELETE(req(`/api/bi/dashboards/D003/shares?email=${U.extrano.email}`, 'DELETE'), p('D003'));
  });
});

describe('consultas', () => {
  it('invitado: sin cardId o con rawSql → 403', async () => {
    as('lector');
    expect((await queryRoute.POST(req('/api/bi/query', 'POST', { queryConfig: { tableOrView: 'secreta', metrics: [{ aggregation: 'count' }] } }))).status).toBe(403);
    expect((await queryRoute.POST(req('/api/bi/query', 'POST', { cardId: cardD3, rawSql: 'select * from secreta' }))).status).toBe(403);
  });

  it('invitado: ejecuta la consulta guardada aunque envíe otra tabla', async () => {
    as('lector');
    const res = await queryRoute.POST(
      req('/api/bi/query', 'POST', { cardId: cardD3, useCache: false, queryConfig: { tableOrView: 'secreta', metrics: [], filters: [{ field: 'canal', operator: 'eq', value: 'ML' }] } })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Number(json.data[0].total)).toBe(150);
  });

  it('invitado: tarjeta de un dashboard no compartido → 404', async () => {
    as('lector');
    expect((await queryRoute.POST(req('/api/bi/query', 'POST', { cardId: cardD4 }))).status).toBe(404);
  });

  it('member conserva consultas libres', async () => {
    as('agente');
    const res = await queryRoute.POST(req('/api/bi/query', 'POST', { useCache: false, queryConfig: { tableOrView: 'secreta', metrics: [{ field: 'x', aggregation: 'sum', alias: 's' }] } }));
    expect(res.status).toBe(200);
  });
});

describe('accesos (shares)', () => {
  const url = '/api/bi/dashboards/D003/shares';

  it('lector no ve ni administra accesos', async () => {
    as('lector');
    expect((await sharesRoute.GET(req(url), p('D003'))).status).toBe(403);
    expect((await sharesRoute.POST(req(url, 'POST', { email: 'a@b.cl', role: 'lector' }), p('D003'))).status).toBe(403);
  });

  it('sin acceso al dashboard → 404', async () => {
    as('dhayis');
    expect((await sharesRoute.GET(req('/api/bi/dashboards/D004/shares'), p('D004'))).status).toBe(404);
  });

  it('member sin share no administra accesos', async () => {
    as('agente');
    expect((await sharesRoute.GET(req(url), p('D003'))).status).toBe(403);
  });

  it('colaborador invita como lector y crea al usuario como shared', async () => {
    as('dhayis');
    const res = await sharesRoute.POST(req(url, 'POST', { email: ' Nueva@Ejemplo.CL ', role: 'lector' }), p('D003'));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user).toMatchObject({ email: 'nueva@ejemplo.cl', status: 'created' });
    const u = await db.query.users.findFirst({ where: eq(schema.users.email, 'nueva@ejemplo.cl') });
    expect(u?.role).toBe('shared');
    // No puede otorgar colaborador ni quitar lectores que no otorgó.
    expect((await sharesRoute.POST(req(url, 'POST', { email: 'otra@ejemplo.cl', role: 'colaborador' }), p('D003'))).status).toBe(403);
    expect((await sharesRoute.DELETE(req(`${url}?email=${U.lector.email}`, 'DELETE'), p('D003'))).status).toBe(403);
    // Sí quita el que otorgó.
    expect((await sharesRoute.DELETE(req(`${url}?email=nueva@ejemplo.cl`, 'DELETE'), p('D003'))).status).toBe(200);
  });

  it('compartir con un pending lo pasa a shared; un member conserva su rol', async () => {
    await db.insert(schema.users).values({ email: 'pend@ejemplo.cl', role: 'pending' });
    as('seba');
    await sharesRoute.POST(req(url, 'POST', { email: 'pend@ejemplo.cl', role: 'lector' }), p('D003'));
    await sharesRoute.POST(req(url, 'POST', { email: U.agente.email, role: 'lector' }), p('D003'));
    const pend = await db.query.users.findFirst({ where: eq(schema.users.email, 'pend@ejemplo.cl') });
    const ag = await db.query.users.findFirst({ where: eq(schema.users.email, U.agente.email) });
    expect(pend?.role).toBe('shared');
    expect(ag?.role).toBe('member');
  });

  it('no se quita ni degrada al último propietario', async () => {
    as('seba');
    expect((await sharesRoute.DELETE(req(`${url}?email=snadales@gmail.com`, 'DELETE'), p('D003'))).status).toBe(409);
  });

  it('propietario lista accesos con nombre y rol', async () => {
    as('seba');
    const json = await (await sharesRoute.GET(req(url), p('D003'))).json();
    expect(json.shares.map((s: any) => s.email)).toEqual(expect.arrayContaining(['snadales@gmail.com', 'dhayis27@gmail.com']));
  });
});
