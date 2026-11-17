import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { db } from '@/db';
import { biAlerts, biCards, biThresholds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ThresholdChecker, ThresholdRule } from '@/lib/bi/alerts/threshold-checker';
import { BiQueryBuilder } from '@/lib/bi/analytics/query-builder';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) return auth.response;

  try {
    const activeAlerts = await db.query.biAlerts.findMany({
      where: eq(biAlerts.isActive, true),
    });

    const results: any[] = [];
    let triggeredCount = 0;

    for (const alert of activeAlerts) {
      const card = await db.query.biCards.findFirst({
        where: eq(biCards.id, alert.cardId),
      });

      if (!card || !card.queryConfigJson?.tableOrView) continue;

      const thresholds = await db.query.biThresholds.findMany({
        where: eq(biThresholds.cardId, card.id),
      });

      if (thresholds.length === 0) continue;

      // Ejecutar consulta para obtener el valor más reciente
      try {
        const built = BiQueryBuilder.buildQuery(card.queryConfigJson as any);
        const queryRes: any = await db.execute(sql.raw(built.sql));
        const rows = queryRes.rows || queryRes;

        if (rows && rows.length > 0) {
          const firstRow = rows[0];

          for (const t of thresholds) {
            const rawVal = firstRow[t.metricKey] || Object.values(firstRow)[0];
            const numVal = Number(rawVal) || 0;

            const rule: ThresholdRule = {
              metricKey: t.metricKey,
              warningValue: Number(t.warningValue),
              criticalValue: Number(t.criticalValue),
              direction: t.direction as any,
            };

            const evaluation = ThresholdChecker.evaluate(numVal, rule);

            if (evaluation.status !== 'normal') {
              triggeredCount++;

              // Despacho de Webhook a n8n o yarken-comms
              const targetWebhook = alert.webhookUrl || process.env.BI_ALERT_WEBHOOK_URL;
              if (targetWebhook) {
                fetch(targetWebhook, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'bi.alert.triggered',
                    cardCode: card.code,
                    cardName: card.name,
                    evaluation,
                    timestamp: new Date().toISOString(),
                  }),
                }).catch(() => {});
              }

              // Actualizar fecha de último disparo
              await db
                .update(biAlerts)
                .set({ lastTriggeredAt: new Date() })
                .where(eq(biAlerts.id, alert.id));
            }

            results.push({
              alertId: alert.id,
              cardCode: card.code,
              cardName: card.name,
              evaluation,
            });
          }
        }
      } catch (err: any) {
        console.warn(`[bi-alerts] Error evaluando alerta ${alert.id}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      evaluatedCount: activeAlerts.length,
      triggeredCount,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'EVALUATE_ALERTS_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
