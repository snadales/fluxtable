import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { isNull, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    // 1. Obtener Workspaces
    const allWorkspaces = await db
      .select()
      .from(schema.workspaces)
      .where(isNull(schema.workspaces.deletedAt))
      .orderBy(schema.workspaces.createdAt);

    // 2. Obtener Bases
    const allBases = await db
      .select()
      .from(schema.bases)
      .where(isNull(schema.bases.deletedAt))
      .orderBy(schema.bases.order, schema.bases.createdAt);

    // 3. Obtener Tablas
    const allTables = await db
      .select()
      .from(schema.tables)
      .where(isNull(schema.tables.deletedAt))
      .orderBy(schema.tables.order);

    // 4. Obtener Dashboards
    const allDashboards = await db
      .select()
      .from(schema.biDashboards)
      .orderBy(schema.biDashboards.createdAt);

    // 5. Obtener Tarjetas BI (KPIs y Gráficos)
    const allCards = await db
      .select()
      .from(schema.biCards)
      .orderBy(schema.biCards.order);

    // Mapa de Dashboard a su código/nombre
    const dashMap = new Map<string, { code: string; name: string; workspaceId: string }>();
    allDashboards.forEach((d) => {
      dashMap.set(d.id, { code: d.code, name: d.name, workspaceId: d.workspaceId });
    });

    // Mapa de Tabla a Base
    const tableIdToBaseId = new Map<string, string>();
    const tableLegacyToBaseId = new Map<number, string>();
    allTables.forEach((t) => {
      tableIdToBaseId.set(t.id, t.baseId);
      if (t.legacyId) tableLegacyToBaseId.set(t.legacyId, t.baseId);
    });

    // Construir Catálogo agrupado por Workspace -> Base / Módulo de Negocio
    const result = allWorkspaces
      .filter((w) => !workspaceId || w.id === workspaceId)
      .map((w) => {
        const wBases = allBases.filter((b) => b.workspaceId === w.id);
        const wDashboards = allDashboards.filter((d) => d.workspaceId === w.id);

        const modules = wBases.map((b) => {
          const bTables = allTables.filter((t) => t.baseId === b.id);
          const tableIds = new Set(bTables.map((t) => t.id));
          const tableLegacies = new Set(bTables.map((t) => t.legacyId).filter(Boolean));

          // Encontrar tarjetas asociadas a esta base (a través de sourceTable o pertenencia de dashboard)
          const bIndicators: any[] = [];
          const bCharts: any[] = [];

          allCards.forEach((c) => {
            const vConf = (c.visualConfigJson as any) || {};
            const qConf = (c.queryConfigJson as any) || {};
            const sTable = vConf.sourceTable || qConf.sourceTable;
            const targetTableId = sTable?.tableId;

            const isRelatedTable =
              targetTableId &&
              (tableIds.has(targetTableId) ||
                tableLegacies.has(Number(targetTableId)) ||
                bTables.some((t) => t.name === sTable?.name));

            const dashInfo = c.dashboardId ? dashMap.get(c.dashboardId) : undefined;

            if (isRelatedTable || (!targetTableId && dashInfo?.workspaceId === w.id && b.name.includes(c.name.slice(0, 4)))) {
              const cardItem = {
                id: c.id,
                code: c.code,
                name: c.name,
                chartType: c.chartType,
                displayValue: vConf.displayValue,
                growth: vConf.growth,
                subtitle: vConf.subtitle,
                sourceTable: sTable,
                dashboardId: c.dashboardId,
                dashboardCode: dashInfo?.code || 'Dxxx',
                dashboardName: dashInfo?.name || 'Dashboard',
              };

              if (c.chartType === 'kpi') {
                bIndicators.push(cardItem);
              } else {
                bCharts.push(cardItem);
              }
            }
          });

          // Dashboards asociados a esta base
          const relatedDashboards = wDashboards.filter(
            (d) =>
              d.name.toLowerCase().includes(b.name.toLowerCase().split('·')[0].trim()) ||
              bIndicators.some((k) => k.dashboardId === d.id) ||
              bCharts.some((g) => g.dashboardId === d.id)
          );

          return {
            id: b.id,
            name: b.name,
            description: b.description || '',
            category: b.category || 'Negocio',
            icon: b.icon || 'folder',
            color: b.color || 'blue',
            subfolders: {
              indicators: bIndicators,
              charts: bCharts,
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
          modules,
          globalDashboards: wDashboards.map((d) => ({
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
    console.error('Error en catálogo de negocio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
