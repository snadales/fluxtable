import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biFolders, workspaces } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const folders = await db.query.biFolders.findMany({
      orderBy: [asc(biFolders.order), asc(biFolders.name)],
    });

    return NextResponse.json({ folders });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'GET_FOLDERS_ERROR', message: err.message },
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

    const [created] = await db
      .insert(biFolders)
      .values({
        workspaceId,
        name: body.name || 'Nueva Carpeta',
        parentId: body.parentId || null,
        order: body.order || 0,
      })
      .returning();

    return NextResponse.json({ folder: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'CREATE_FOLDER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
