import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const allUsers = await db.select().from(schema.users);
    const allWorkspaces = await db.select().from(schema.workspaces);
    const allMemberships = await db.select().from(schema.workspaceMembers);

    const result = allUsers.map((u) => {
      const userWorkspaces = allMemberships
        .filter((m) => m.userId === u.id)
        .map((m) => {
          const ws = allWorkspaces.find((w) => w.id === m.workspaceId);
          return ws ? ws.name : null;
        })
        .filter(Boolean);

      return {
        id: u.id,
        email: u.email,
        name: u.name || 'Usuario',
        role: u.role,
        workspaces: userWorkspaces.length > 0 ? userWorkspaces : ['Principal', 'General'],
        lastLogin: '11/17/2026 8:06 AM',
        signedUp: '10/09/2026 4:55 PM',
        isActive: u.isActive,
        is2FA: false,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listando usuarios admin:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
