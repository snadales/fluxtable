import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

const createCommentSchema = z.object({
  targetType: z.enum(['row', 'table', 'dashboard', 'card']),
  targetId: z.string().min(1),
  authorName: z.string().min(1).default('Sebastián Nadales'),
  authorEmail: z.string().email().optional().nullable(),
  content: z.string().min(1, 'El comentario no puede estar vacío'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: 'targetType y targetId son requeridos' },
        { status: 400 }
      );
    }

    const results = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.targetType, targetType as any),
          eq(comments.targetId, targetId)
        )
      )
      .orderBy(asc(comments.createdAt));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error listando comentarios:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar comentarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    const [created] = await db
      .insert(comments)
      .values({
        targetType: validated.targetType,
        targetId: validated.targetId,
        authorName: validated.authorName,
        authorEmail: validated.authorEmail || null,
        content: validated.content,
        resolved: false,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Error creando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno al crear comentario' },
      { status: 500 }
    );
  }
}
