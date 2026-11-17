import { NextRequest, NextResponse } from 'next/server';
import { defaultStorage } from '@/lib/storage';
import { db, schema } from '@/db';
import { requireAuth } from '@/lib/auth/auth-guard';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB límite

// Extensiones prohibidas de alto riesgo (ejecutables, scripts de servidor, macros)
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.sh', '.bash', '.php', '.py', '.bat', '.cmd', '.html', '.htm',
  '.js', '.mjs', '.vbs', '.ps1', '.jar', '.com', '.msi', '.scr', '.pif',
  '.hta', '.cpl', '.inf', '.reg', '.dll', '.so', '.dylib', '.apk'
]);

/**
 * Validador de Magic Bytes para verificar el tipo real de archivo en binario
 */
function isValidMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  // PNG: 89 50 4E 47
  if (ext === '.png' && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }
  // JPEG: FF D8 FF
  if (['.jpg', '.jpeg'].includes(ext) && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }
  // GIF: 47 49 46 38 ('GIF8')
  if (ext === '.gif' && buffer.toString('ascii', 0, 4) === 'GIF8') {
    return true;
  }
  // PDF: 25 50 44 46 ('%PDF')
  if (ext === '.pdf' && buffer.toString('ascii', 0, 4) === '%PDF') {
    return true;
  }
  // WEBP: starts with 'RIFF' and offset 8 is 'WEBP'
  if (ext === '.webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return true;
  }
  // ZIP / XLSX / DOCX: 50 4B 03 04 ('PK..')
  if (['.zip', '.xlsx', '.docx'].includes(ext) && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return true;
  }
  // CSV / TXT / JSON: formato texto sin bytes nulos sospechosos en los primeros 1024 bytes
  if (['.csv', '.txt', '.json', '.tsv', '.md'].includes(ext)) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
    return !sample.includes(0x00);
  }

  // Si es otra extensión permitida (ej: audio/video básico), validar que no tenga encabezado PE/ELF/Mach-O
  const isExecutable =
    (buffer[0] === 0x4D && buffer[1] === 0x5A) || // 'MZ' Windows PE
    (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) || // ELF Linux
    (buffer[0] === 0xFE && buffer[1] === 0xED && buffer[2] === 0xFA); // Mach-O macOS

  return !isExecutable;
}

export async function POST(req: NextRequest) {
  // 1. Control de Acceso: requerir autenticación
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const recordId = formData.get('recordId') as string | null;
    const fieldId = formData.get('fieldId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'NO_FILE_PROVIDED', message: 'No se adjuntó ningún archivo' }, { status: 400 });
    }

    // 2. Límite de Tamaño (10 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: 'El archivo excede el tamaño máximo permitido de 10 MB' },
        { status: 413 }
      );
    }

    // 3. Inspección y Rechazo de Extensiones Peligrosas
    const ext = path.extname(file.name).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'FORBIDDEN_FILE_TYPE', message: `La extensión ${ext} está bloqueada por políticas de seguridad` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Verificación de Magic Bytes
    if (!isValidMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { error: 'INVALID_FILE_SIGNATURE', message: 'La firma binaria del archivo no coincide con su extensión declarada o contiene código binario sospechoso' },
        { status: 400 }
      );
    }

    const isImage = file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);

    // 5. Guardar con hash SHA-256 (inmune a path traversal)
    const uploaded = await defaultStorage.upload(buffer, file.name, file.type);

    let attachmentRecordId = null;
    if (recordId && fieldId) {
      const [created] = await db
        .insert(schema.recordAttachments)
        .values({
          recordId: recordId as any,
          fieldId: fieldId as any,
          filename: file.name,
          safeFilename: uploaded.safeFilename,
          mimeType: file.type || 'application/octet-stream',
          fileSize: uploaded.fileSize,
          storagePath: uploaded.storagePath,
          isImage,
        })
        .returning();
      attachmentRecordId = created.id;
    }

    return NextResponse.json(
      {
        id: attachmentRecordId || uploaded.hash,
        filename: file.name,
        safeFilename: uploaded.safeFilename,
        fileSize: uploaded.fileSize,
        mimeType: file.type,
        isImage,
        url: `/api/v1/attachments/${attachmentRecordId || uploaded.safeFilename}`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'UPLOAD_FAILED', message: err.message || 'Error al procesar la carga del archivo' },
      { status: 500 }
    );
  }
}
