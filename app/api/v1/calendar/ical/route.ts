import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { records, tables } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { resolveTableId } from '@/lib/table-resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableParam = searchParams.get('tableId') || '865';
    const dateFieldParam = searchParams.get('dateField') || 'Fecha Estimada Arribo';

    const tableId = await resolveTableId(tableParam);
    if (!tableId) {
      return new NextResponse('Tabla no encontrada', { status: 404 });
    }

    // Obtener información de la tabla
    const tableInfo = await db.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });

    const tableName = tableInfo?.name || 'BaserowLite';

    // Obtener registros activos
    const rows = await db.query.records.findMany({
      where: and(eq(records.tableId, tableId), isNull(records.deletedAt)),
    });

    // Construir VCALENDAR
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FluxTable//Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${tableName} · Arribos`,
      `X-WR-TIMEZONE:${process.env.TIMEZONE || 'America/Santiago'}`,
      'X-PUBLISHED-TTL:PT1H',
    ];

    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    for (const r of rows) {
      const data = r.data as Record<string, any>;
      const rawDate = data[dateFieldParam];
      if (!rawDate) continue;

      let dateClean = '';
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        dateClean = rawDate.slice(0, 10).replace(/-/g, '');
      }

      if (!dateClean) continue;

      // Calcular día siguiente para evento de día completo
      const d = new Date(rawDate.slice(0, 10) + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      const nextDayClean = d.toISOString().slice(0, 10).replace(/-/g, '');

      const containerCode = data['Código Contenedor'] || `Registro #${r.id}`;
      const status = data['Estado Embarque'] || 'Sin estado';
      const fob = data['Inversión FOB'] ? `US$ ${data['Inversión FOB']}` : 'N/A';
      const progress = data['Avance Logístico'] ? `${data['Avance Logístico']}%` : 'N/A';

      lines.push('BEGIN:VEVENT');
      const host = request.headers.get('host') || 'fluxtable.local';
      lines.push(`UID:${r.id}@${host}`);
      lines.push(`DTSTAMP:${nowStr}`);
      lines.push(`DTSTART;VALUE=DATE:${dateClean}`);
      lines.push(`DTEND;VALUE=DATE:${nextDayClean}`);
      lines.push(`SUMMARY:${containerCode} (${status})`);
      lines.push(
        `DESCRIPTION:Lote: ${containerCode}\\nEstado: ${status}\\nFOB: ${fob}\\nAvance Logístico: ${progress}`
      );
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    const icsContent = lines.join('\r\n') + '\r\n';

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="baserow_${tableParam}_calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generando iCal feed:', error);
    return new NextResponse('Error interno al generar iCal', { status: 500 });
  }
}
