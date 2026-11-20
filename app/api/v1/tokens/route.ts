import { requireSuperadmin } from '@/lib/auth/auth-guard';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiTokens, workspaces } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const guard = await requireSuperadmin(request);
  if (!guard.authenticated) return guard.response;
  try {
    const tokens = await db.query.apiTokens.findMany({
      orderBy: desc(apiTokens.createdAt),
    });

    return NextResponse.json({
      tokens: tokens.map((t) => ({
        id: t.id,
        name: t.name,
        prefix: t.prefix,
        agentClient: t.agentClient || 'external_script',
        permissions: t.permissions,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
      })),
    });
  } catch (error: any) {
    console.error('Error listando tokens:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperadmin(request);
  if (!guard.authenticated) return guard.response;
  try {
    const body = await request.json();
    const { name, agentClient = 'external_script', permissions = { tables: 'all', mode: 'read_write' } } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre del token es requerido' }, { status: 400 });
    }

    // Obtener primer workspace
    const ws = await db.query.workspaces.findFirst();
    if (!ws) {
      return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 500 });
    }

    // Generar token aleatorio criptográfico seguro
    const rawToken = `brl_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = rawToken.slice(0, 8);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const [newToken] = await db.insert(apiTokens).values({
      workspaceId: ws.id,
      name,
      prefix,
      tokenHash,
      agentClient: ['n8n', 'antigravity', 'claude', 'external_script', 'human'].includes(agentClient) ? agentClient : 'external_script',
      permissions,
    }).returning();

    return NextResponse.json({
      success: true,
      token: rawToken, // Se devuelve en texto plano solo una vez al crear
      id: newToken.id,
      name: newToken.name,
      agentClient: newToken.agentClient,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creando token:', error);
    return NextResponse.json({ error: 'Error interno creando token' }, { status: 500 });
  }
}
