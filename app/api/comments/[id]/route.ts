import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateCommentSchema = z.object({
  resolved: z.boolean().optional(),
  content: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateCommentSchema.parse(body);

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (validated.resolved !== undefined) {
      updateData.resolved = validated.resolved;
    }
    if (validated.content !== undefined) {
      updateData.content = validated.content;
    }

    const [updated] = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Error actualizando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno al actualizar comentario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error eliminando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno al eliminar comentario' },
      { status: 500 }
    );
  }
}
