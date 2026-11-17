import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biDashboards, biDashboardTabs, workspaces } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const dashboards = await db.query.biDashboards.findMany({
      orderBy: [asc(biDashboards.code)],
    });

    const tabs = await db.query.biDashboardTabs.findMany({
      orderBy: [asc(biDashboardTabs.order)],
    });

    const dashboardsWithTabs = dashboards.map((d) => ({
      ...d,
      tabs: tabs.filter((t) => t.dashboardId === d.id),
    }));

    return NextResponse.json({ dashboards: dashboardsWithTabs });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'GET_DASHBOARDS_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    let workspaceId = body.workspaceId;

    if (!workspaceId) {
      const ws = await db.query.workspaces.findFirst();
      if (!ws) {
        return NextResponse.json(
          { error: 'NO_WORKSPACE', message: 'No hay workspace configurado' },
          { status: 400 }
        );
      }
      workspaceId = ws.id;
    }

    // Generar código único correlativo (D001, D002...)
    let code = body.code;
    if (!code) {
      const existing = await db.query.biDashboards.findMany({
        orderBy: [desc(biDashboards.createdAt)],
      });
      const count = existing.length + 1;
      code = `D${String(count).padStart(3, '0')}`;
    }

    const [created] = await db
      .insert(biDashboards)
      .values({
        code,
        workspaceId,
        folderId: body.folderId || null,
        name: body.name || 'Nuevo Dashboard',
        description: body.description || '',
        icon: body.icon || 'layout-dashboard',
        isFavorite: Boolean(body.isFavorite),
        autoRefreshInterval: body.autoRefreshInterval || 0,
        layoutJson: body.layoutJson || [],
        tags: body.tags || [],
        createdById: auth.user.id.startsWith('usr_') ? null : auth.user.id,
      })
      .returning();

    // Crear pestaña por defecto "Resumen"
    const [defaultTab] = await db
      .insert(biDashboardTabs)
      .values({
        dashboardId: created.id,
        name: 'Resumen Principal',
        order: 0,
      })
      .returning();

    return NextResponse.json(
      { dashboard: { ...created, tabs: [defaultTab] } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'CREATE_DASHBOARD_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
