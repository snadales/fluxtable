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

    // Si no hay workspaces creados aún, devolver fallback
    if (allWorkspaces.length === 0) {
      return NextResponse.json([]);
    }

    const result = allWorkspaces.map((w) => {
      const wMembers = allMembers.filter((m) => m.workspaceId === w.id);
      const wBases = allBases
        .filter((b) => b.workspaceId === w.id)
        .map((b) => {
          const bTables = allTables.filter((t) => t.baseId === b.id);
          const isDashboard = b.icon === 'chart' || b.name.toLowerCase().includes('panel') || b.name.startsWith('D00');
          return {
            id: b.id,
            name: b.name,
            description: b.description || '',
            category: b.category || 'Operaciones',
            icon: b.icon || (isDashboard ? 'chart' : 'database'),
            color: b.color || 'blue',
            tags: b.tags || [],
            tablesCount: bTables.length,
            type: isDashboard ? 'dashboard' : 'database',
            viewedAt: 'Reciente',
          };
        });

      // Incorporar Dashboards de BI pertenecientes al Workspace (Unificación por Negocio)
      const wDashboards = allDashboards
        .filter((d) => d.workspaceId === w.id)
        .map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description || '',
          category: 'Dashboards & KPIs',
          icon: 'chart',
          color: 'rose',
          tags: ['dashboard', 'bi', d.code.toLowerCase()],
          tablesCount: 0,
          type: 'dashboard' as const,
          viewedAt: 'Reciente',
        }));

      // Evitar duplicar elementos si ya existía una base con el mismo nombre
      const baseNames = new Set(wBases.map((b) => b.name.toLowerCase()));
      const filteredDashboards = wDashboards.filter((d) => !baseNames.has(d.name.toLowerCase()));
      const allItems = [...wBases, ...filteredDashboards];

      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: 'Admin',
        members: wMembers.map((m) => ({
          email: m.userEmail || 'usuario@yarken.cl',
          name: m.userName || 'Usuario',
          role: m.role || 'admin',
        })),
        membersCount: Math.max(wMembers.length, 1),
        itemsCount: allItems.length,
        bases: allItems,
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
