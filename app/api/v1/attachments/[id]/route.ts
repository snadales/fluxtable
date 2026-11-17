import { NextRequest, NextResponse } from 'next/server';
import { defaultStorage } from '@/lib/storage';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let storagePath = '';
    let filename = 'file';
    let mimeType = 'application/octet-stream';

    // 1. Buscar en BD si es UUID
    if (id.includes('-') && id.length === 36) {
      const [attachment] = await db
        .select()
        .from(schema.recordAttachments)
        .where(eq(schema.recordAttachments.id, id as any));

      if (attachment) {
        storagePath = attachment.storagePath;
        filename = attachment.filename;
        mimeType = attachment.mimeType;
      }
    }

    // 2. Si no es UUID o no se encontró en BD, buscar directamente por nombre en disco
    if (!storagePath) {
      const basePath = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data', 'uploads');
      storagePath = path.join(basePath, id);
      filename = id;
    }

    const fileBuffer = await defaultStorage.read(storagePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'FILE_NOT_FOUND', message: err.message },
      { status: 404 }
    );
  }
}
