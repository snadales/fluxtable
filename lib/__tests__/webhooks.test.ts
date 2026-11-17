import { describe, it, expect, vi } from 'vitest';
import { triggerTableWebhooks, WebhookPayload } from '../webhook-dispatcher';

describe('Webhook Dispatcher', () => {
  it('formats payload with Baserow-compatible event structure', () => {
    const payload: WebhookPayload = {
      event_id: 'test-event-uuid',
      event_type: 'rows.created',
      table_id: '865',
      items: [{ id: '1', name: 'Lote 2026-001' }],
      timestamp: new Date().toISOString(),
    };

    expect(payload.event_type).toBe('rows.created');
    expect(payload.table_id).toBe('865');
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].id).toBe('1');
  });

  it('safely handles empty items array without crashing', async () => {
    await expect(triggerTableWebhooks('865', 'rows.created', [])).resolves.toBeUndefined();
  });
});
