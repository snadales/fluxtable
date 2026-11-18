import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { isNull, desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allWorkspaces = await db
      .select()
      .from(schema.workspaces)
      .where(isNull(schema.workspaces.deletedAt))
      .orderBy(schema.workspaces.createdAt);

    // Obtener todas las bases
    const allBases = await db
      .select()
      .from(schema.bases)
      .where(isNull(schema.bases.deletedAt))
      .orderBy(schema.bases.order, schema.bases.createdAt);

    // Obtener todas las tablas activas para contar tablas por base
    const allTables = await db
      .select({
        id: schema.tables.id,
        baseId: schema.tables.baseId,
        name: schema.tables.name,
        legacyId: schema.tables.legacyId,
        description: schema.tables.description,
        icon: schema.tables.icon,
        color: schema.tables.color,
      })
      .from(schema.tables)
      .where(isNull(schema.tables.deletedAt));

    // Obtener miembros de workspaces
    const allMembers = await db
      .select({
        id: schema.workspaceMembers.id,
        workspaceId: schema.workspaceMembers.workspaceId,
        userId: schema.workspaceMembers.userId,
        role: schema.workspaceMembers.role,
        userEmail: schema.users.email,
        userName: schema.users.name,
      })
      .from(schema.workspaceMembers)
      .leftJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id));

    // Obtener todos los dashboards de BI para unificación conceptual por workspace
    const allDashboards = await db
      .select({
        id: schema.biDashboards.id,
        code: schema.biDashboards.code,
        name: schema.biDashboards.name,
        description: schema.biDashboards.description,
        workspaceId: schema.biDashboards.workspaceId,
        icon: schema.biDashboards.icon,
      })
      .from(schema.biDashboards);

    // Obtener todas las tarjetas para mapear Indicadores (K) y Gráficos (G)
    const allCards = await db
      .select({
        id: schema.biCards.id,
        code: schema.biCards.code,
        name: schema.biCards.name,
        chartType: schema.biCards.chartType,
        dashboardId: schema.biCards.dashboardId,
        visualConfigJson: schema.biCards.visualConfigJson,
      })
      .from(schema.biCards);

    // Si no hay workspaces creados aún, devolver fallback
    if (allWorkspaces.length === 0) {
      return NextResponse.json([]);
    }

    const result = allWorkspaces.map((w) => {
      const wMembers = allMembers.filter((m) => m.workspaceId === w.id);
      const wDashboards = allDashboards.filter((d) => d.workspaceId === w.id);

      const wBases = allBases
        .filter((b) => b.workspaceId === w.id && !b.name.startsWith('D00') && !b.name.includes('Panel LinkedIn'))
        .map((b) => {
          const bTables = allTables.filter((t) => t.baseId === b.id);
          const tableIds = new Set(bTables.map((t) => t.id));
          const tableLegacies = new Set(bTables.map((t) => t.legacyId).filter(Boolean));

          // Mapear tarjetas vinculadas a esta base
          const bCards = allCards.filter((c) => {
            const v = (c.visualConfigJson as any) || {};
            const sTable = v.sourceTable;
            const targetTableId = sTable?.tableId;
            return targetTableId && (tableIds.has(targetTableId) || tableLegacies.has(Number(targetTableId)));
          });

          const indicators = bCards
            .filter((c) => c.chartType === 'kpi')
            .map((k) => ({
              id: k.id,
              code: k.code,
              name: k.name,
              displayValue: (k.visualConfigJson as any)?.displayValue,
              growth: (k.visualConfigJson as any)?.growth,
              subtitle: (k.visualConfigJson as any)?.subtitle,
              sourceTable: (k.visualConfigJson as any)?.sourceTable,
              dashboardId: k.dashboardId,
            }));

          const charts = bCards
            .filter((c) => c.chartType !== 'kpi')
            .map((g) => ({
              id: g.id,
              code: g.code,
              name: g.name,
              chartType: g.chartType,
              sourceTable: (g.visualConfigJson as any)?.sourceTable,
              dashboardId: g.dashboardId,
            }));

          const relatedDashboards = wDashboards.filter(
            (d) =>
              indicators.some((k) => k.dashboardId === d.id) ||
              charts.some((g) => g.dashboardId === d.id) ||
              d.name.toLowerCase().includes(b.name.toLowerCase().split('·')[0].trim())
          );

          return {
            id: b.id,
            name: b.name,
            description: b.description || '',
            category: b.category || 'Operaciones',
            icon: b.icon || 'database',
            color: b.color || 'blue',
            tags: b.tags || [],
            tablesCount: bTables.length,
            type: 'database' as const,
            viewedAt: 'Reciente',
            tables: bTables.map((t) => ({
              id: t.id,
              legacyId: t.legacyId,
              name: t.name,
              icon: t.icon || 'table',
            })),
            subfolders: {
              indicators,
              charts,
              tables: bTables.map((t) => ({
                id: t.id,
                legacyId: t.legacyId,
                name: t.name,
                description: t.description || '',
                icon: t.icon || 'table',
                color: t.color || 'blue',
              })),
              dashboards: relatedDashboards.map((d) => ({
                id: d.id,
                code: d.code,
                name: d.name,
                description: d.description || '',
                icon: d.icon || 'layout-dashboard',
              })),
            },
          };
        });

      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: 'Admin',
        members: wMembers.map((m) => ({
          email: m.userEmail || 'usuario@fluxtable.local',
          name: m.userName || 'Usuario',
          role: m.role || 'admin',
        })),
        membersCount: Math.max(wMembers.length, 1),
        itemsCount: wBases.length,
        bases: wBases,
        dashboards: wDashboards.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description || '',
          icon: d.icon || 'layout-dashboard',
        })),
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listando workspaces:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `ws-${Date.now()}`;

    const [created] = await db
      .insert(schema.workspaces)
      .values({
        name: name.trim(),
        slug,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creando workspace:', error);
    return NextResponse.json({ error: 'Error interno al crear workspace' }, { status: 500 });
  }
}
