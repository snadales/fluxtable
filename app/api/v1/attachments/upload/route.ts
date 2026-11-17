import { NextRequest, NextResponse } from 'next/server';
import { defaultStorage } from '@/lib/storage';
import { db, schema } from '@/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const recordId = formData.get('recordId') as string | null;
    const fieldId = formData.get('fieldId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'NO_FILE_PROVIDED' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith('image/');

    // Guardar en almacenamiento seguro con hash SHA-256
    const uploaded = await defaultStorage.upload(buffer, file.name, file.type);

    // Si viene recordId y fieldId, persistir en record_attachments
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
      { error: 'UPLOAD_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
