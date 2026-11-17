import { NextRequest, NextResponse } from 'next/server';
import { testWebhook } from '@/lib/webhook-dispatcher';

interface RouteContext {
  params: Promise<{ webhookId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { webhookId } = await context.params;
    const result = await testWebhook(webhookId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'TEST_WEBHOOK_FAILED', message: result.error || 'Fallo al contactar el endpoint' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, status: result.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
