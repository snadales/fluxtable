import { db, schema } from '@/db';
import { eq, and } from 'drizzle-orm';

export type WebhookEventType = 'rows.created' | 'rows.updated' | 'rows.deleted';

export interface WebhookPayload {
  event_id: string;
  event_type: WebhookEventType;
  table_id: string | number;
  items: any[];
  timestamp: string;
}

/**
 * Despacha notificaciones webhook de forma asíncrona a todos los endpoints activos
 * suscritos al evento de la tabla especificada. No bloquea la respuesta HTTP.
 */
export async function triggerTableWebhooks(
  tableId: string,
  eventType: WebhookEventType,
  items: any[]
): Promise<void> {
  if (!items || items.length === 0) return;

  // Ejecución en segundo plano segura
  (async () => {
    try {
      // Buscar webhooks activos asociados a esta tabla
      const activeWebhooks = await db
        .select()
        .from(schema.webhooks)
        .where(and(eq(schema.webhooks.tableId, tableId as any), eq(schema.webhooks.isActive, true)));

      if (!activeWebhooks.length) return;

      const payload: WebhookPayload = {
        event_id: crypto.randomUUID(),
        event_type: eventType,
        table_id: tableId,
        items,
        timestamp: new Date().toISOString(),
      };

      for (const hook of activeWebhooks) {
        // Verificar si está suscrito al evento
        const subscribedEvents = hook.events as string[];
        if (subscribedEvents && !subscribedEvents.includes(eventType) && !subscribedEvents.includes('*')) {
          continue;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'BaserowLite-Webhook/1.0',
          'X-BaserowLite-Event': eventType,
          'X-BaserowLite-Event-Id': payload.event_id,
          ...((hook.headers as Record<string, string>) || {}),
        };

        // Enviar POST con timeout de 5 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        fetch(hook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
          .then((res) => {
            clearTimeout(timeoutId);
            if (!res.ok) {
              console.warn(`[Webhook] ${hook.name} (${hook.url}) respondió ${res.status}`);
            }
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            console.error(`[Webhook Error] Fallo al entregar a ${hook.url}:`, err.message);
          });
      }
    } catch (err: any) {
      console.error('[Webhook Dispatcher Error]:', err.message);
    }
  })();
}

/**
 * Envía un ping de prueba a un webhook específico para verificar conectividad
 */
export async function testWebhook(webhookId: string): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const hook = await db.query.webhooks.findFirst({
      where: eq(schema.webhooks.id, webhookId as any),
    });

    if (!hook) {
      return { success: false, error: 'WEBHOOK_NOT_FOUND' };
    }

    const testPayload = {
      event_id: crypto.randomUUID(),
      event_type: 'test.ping',
      table_id: hook.tableId,
      items: [{ id: 'test-1', sample_field: 'BaserowLite Test Ping', note: 'Prueba de conectividad con n8n exitosa' }],
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BaserowLite-Webhook/1.0',
      'X-BaserowLite-Event': 'test.ping',
      ...((hook.headers as Record<string, string>) || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(hook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return { success: res.ok, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
