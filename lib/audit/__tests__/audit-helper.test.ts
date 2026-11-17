import { describe, it, expect } from 'vitest';
import { buildActorLineage, ResolvedActor } from '../audit-helper';

describe('Actor Attribution & Lineage Tracking', () => {
  const n8nActor: ResolvedActor = {
    actorType: 'api_token',
    actorId: 'tok_n8n_test',
    actorName: 'Workflow Facturación',
    agentClient: 'n8n',
  };

  const claudeActor: ResolvedActor = {
    actorType: 'api_token',
    actorId: 'tok_claude_test',
    actorName: 'Claude Code',
    agentClient: 'claude',
  };

  const antigravityActor: ResolvedActor = {
    actorType: 'api_token',
    actorId: 'tok_agy_test',
    actorName: 'Antigravity Research',
    agentClient: 'antigravity',
  };

  it('debe registrar el actor creador en la creación del registro', () => {
    const lineage = buildActorLineage({}, 'create', n8nActor);
    expect(lineage.createdBy).toBeDefined();
    expect(lineage.createdBy?.actor).toBe('n8n');
    expect(lineage.createdBy?.name).toBe('Workflow Facturación');
    expect(lineage.createdBy?.timestamp).toBeDefined();
  });

  it('debe registrar la modificación preservando el creador original', () => {
    const initialLineage = buildActorLineage({}, 'create', n8nActor);
    const updatedLineage = buildActorLineage(initialLineage, 'update', claudeActor);

    expect(updatedLineage.createdBy?.actor).toBe('n8n');
    expect(updatedLineage.updatedBy).toBeDefined();
    expect(updatedLineage.updatedBy?.actor).toBe('claude');
    expect(updatedLineage.updatedBy?.name).toBe('Claude Code');
  });

  it('debe registrar lecturas concurrentes de agentes', () => {
    let lineage = buildActorLineage({}, 'create', n8nActor);
    lineage = buildActorLineage(lineage, 'read', antigravityActor);

    expect(lineage.readBy).toHaveLength(1);
    expect(lineage.readBy?.[0].actor).toBe('antigravity');
    expect(lineage.readBy?.[0].name).toBe('Antigravity Research');
  });
});
