import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { apiTokens, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ResolvedActor {
  actorType: 'user' | 'api_token' | 'system';
  actorId: string;
  actorName: string;
  actorEmail?: string;
  agentClient: 'n8n' | 'antigravity' | 'claude' | 'external_script' | 'human' | 'system';
}

export async function resolveActor(req: NextRequest): Promise<ResolvedActor> {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const agentHeader = req.headers.get('x-agent-client')?.toLowerCase();
    const agentNameHeader = req.headers.get('x-agent-name') || '';

    // 1. Validar si viene Authorization Bearer / Token
    let rawToken = '';
    if (authHeader.startsWith('Token ')) {
      rawToken = authHeader.substring(6).trim();
    } else if (authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.substring(7).trim();
    }

    if (rawToken && rawToken.startsWith('brl_')) {
      const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenRecord = await db.query.apiTokens.findFirst({
        where: eq(apiTokens.tokenHash, hash),
      });

      if (tokenRecord) {
        // Actualizar lastUsedAt en background
        db.update(apiTokens)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiTokens.id, tokenRecord.id))
          .catch(() => {});

        return {
          actorType: 'api_token',
          actorId: tokenRecord.id,
          actorName: tokenRecord.name,
          agentClient: (tokenRecord.agentClient as any) || 'external_script',
        };
      }
    }

    // 2. Si viene cabecera explícita de agente
    if (agentHeader && ['n8n', 'antigravity', 'claude'].includes(agentHeader)) {
      return {
        actorType: 'api_token',
        actorId: `agent_${agentHeader}`,
        actorName: agentNameHeader || (agentHeader === 'n8n' ? 'n8n Workflow' : agentHeader === 'antigravity' ? 'Antigravity Agent' : 'Claude Code'),
        agentClient: agentHeader as any,
      };
    }

    // 3. Usuario en sesión (Cookie fluxtable_session)
    const sessionCookie = req.cookies.get('fluxtable_session')?.value;
    if (sessionCookie) {
      return {
        actorType: 'user',
        actorId: 'usr_snadales',
        actorName: 'Sebastián Nadales',
        actorEmail: 'snadales@gmail.com',
        agentClient: 'human',
      };
    }

    // 4. Default / Sistema
    return {
      actorType: 'system',
      actorId: 'system_core',
      actorName: 'FluxTable Engine',
      agentClient: 'system',
    };
  } catch (err) {
    return {
      actorType: 'system',
      actorId: 'system_core',
      actorName: 'FluxTable Engine',
      agentClient: 'system',
    };
  }
}

export async function logAuditAction(params: {
  workspaceId: string;
  tableId: string;
  recordId: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  actor: ResolvedActor;
  changedFields?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      workspaceId: params.workspaceId as any,
      tableId: params.tableId as any,
      recordId: params.recordId as any,
      action: params.action,
      actorType: params.actor.actorType,
      actorId: `${params.actor.agentClient}:${params.actor.actorName}`,
      actorEmail: params.actor.actorEmail,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent,
      changedFields: params.changedFields,
    });
  } catch (err) {
    console.error('Error registrando auditoría:', err);
  }
}

export function buildActorLineage(
  existingLineage: any = {},
  action: 'create' | 'update' | 'read',
  actor: ResolvedActor
) {
  const lineage = { ...(existingLineage || {}) };
  const stamp = {
    actor: actor.agentClient,
    name: actor.actorName,
    timestamp: new Date().toISOString(),
  };

  if (action === 'create' || !lineage.createdBy) {
    lineage.createdBy = stamp;
  }
  
  if (action === 'update') {
    lineage.updatedBy = stamp;
  }

  if (action === 'read') {
    if (!lineage.readBy) lineage.readBy = [];
    // Mantener solo los últimos 5 accesos
    lineage.readBy.push(stamp);
    if (lineage.readBy.length > 5) {
      lineage.readBy = lineage.readBy.slice(-5);
    }
  }

  return lineage;
}
