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

    // Validación Anti-Path-Traversal estricta
    const cleanId = path.basename(id);
    if (!cleanId || cleanId !== id || cleanId.includes('..') || cleanId.includes('/') || cleanId.includes('\\')) {
      return NextResponse.json(
        { error: 'INVALID_IDENTIFIER', message: 'Identificador de archivo no válido' },
        { status: 400 }
      );
    }

    let storagePath = '';
    let filename = 'file';
    let mimeType = 'application/octet-stream';

    // 1. Buscar en BD si es formato UUID
    if (cleanId.includes('-') && cleanId.length === 36) {
      const [attachment] = await db
        .select()
        .from(schema.recordAttachments)
        .where(eq(schema.recordAttachments.id, cleanId as any));

      if (attachment) {
        storagePath = attachment.storagePath;
        filename = attachment.filename;
        mimeType = attachment.mimeType;
      }
    }

    // 2. Si no es UUID o no se encontró en BD, resolver en directorio base de uploads
    if (!storagePath) {
      const basePath = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data', 'uploads');
      const resolvedPath = path.resolve(basePath, cleanId);

      // Verificar que la ruta resuelta permanezca estrictamente dentro del basePath
      if (!resolvedPath.startsWith(path.resolve(basePath))) {
        return NextResponse.json(
          { error: 'ACCESS_DENIED', message: 'Acceso no permitido fuera del directorio de almacenamiento' },
          { status: 403 }
        );
      }

      storagePath = resolvedPath;
      filename = cleanId;
    }

    const fileBuffer = await defaultStorage.read(storagePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'FILE_NOT_FOUND', message: 'El archivo solicitado no existe' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'RETRIEVAL_FAILED', message: err.message || 'Error al obtener el archivo' },
      { status: 500 }
    );
  }
}
