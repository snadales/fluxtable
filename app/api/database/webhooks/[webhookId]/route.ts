import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ webhookId: string }>;
}

// GET: Obtener webhook individual
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { webhookId } = await context.params;
    const webhook = await db.query.webhooks.findFirst({
      where: eq(schema.webhooks.id, webhookId as any),
    });

    if (!webhook) {
      return NextResponse.json({ error: 'WEBHOOK_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(webhook);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Actualizar webhook
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { webhookId } = await context.params;
    const body = await req.json();

    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateFields.name = body.name;
    if (body.url !== undefined) updateFields.url = body.url;
    if (body.events !== undefined) updateFields.events = body.events;
    if (body.headers !== undefined) updateFields.headers = body.headers;
    if (body.isActive !== undefined) updateFields.isActive = body.isActive;

    const [updated] = await db
      .update(schema.webhooks)
      .set(updateFields)
      .where(eq(schema.webhooks.id, webhookId as any))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'WEBHOOK_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Eliminar webhook
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { webhookId } = await context.params;

    await db.delete(schema.webhooks).where(eq(schema.webhooks.id, webhookId as any));

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
