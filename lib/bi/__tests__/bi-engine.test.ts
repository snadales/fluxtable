import { describe, it, expect } from 'vitest';
import { BiViewsGenerator } from '../generators/views-generator';
import { biPoolManager } from '../connectors/pool-manager';

describe('BI & Analytics Engine - Fase 1', () => {
  describe('BiViewsGenerator', () => {
    it('debe sanitizar identificadores eliminando tildes y caracteres especiales', () => {
      expect(BiViewsGenerator.sanitizeIdentifier('Ingresos & Gastos (CLP)')).toBe('ingresos_gastos_clp');
      expect(BiViewsGenerator.sanitizeIdentifier('Facturas Año 2026')).toBe('facturas_ano_2026');
      expect(BiViewsGenerator.sanitizeIdentifier('   Duración p90 [ms]   ')).toBe('duracion_p90_ms');
    });

    it('debe generar SQL tipado con safe_numeric y safe_timestamptz para vistas analíticas', () => {
      const tableId = '900c336b-5d73-4a2d-b29b-6c3af0343bb6';
      const tableName = 'Balance Negocios';
      const sampleFields = [
        { id: 'fld_monto', name: 'Monto Total', type: 'currency' },
        { id: 'fld_fecha', name: 'Fecha Pago', type: 'date' },
        { id: 'fld_activo', name: 'Es Vigente', type: 'boolean' },
        { id: 'fld_cliente', name: 'Nombre Cliente', type: 'text' },
        { id: 'fld_tags', name: 'Etiquetas', type: 'multiple_select' },
      ];

      const { viewName, createSql } = BiViewsGenerator.generateViewSql(tableId, tableName, sampleFields);

      expect(viewName).toBe('tbl_balance_negocios');
      expect(createSql).toContain('CREATE OR REPLACE VIEW bi_views."tbl_balance_negocios"');
      expect(createSql).toContain('public.safe_numeric((data->>\'fld_monto\')) AS "monto_total"');
      expect(createSql).toContain('public.safe_timestamptz((data->>\'fld_fecha\')) AS "fecha_pago"');
      expect(createSql).toContain('CASE WHEN (data->>\'fld_activo\') = \'true\' THEN TRUE');
      expect(createSql).toContain('(data->>\'fld_cliente\') AS "nombre_cliente"');
      expect(createSql).toContain('(data->\'fld_tags\') AS "etiquetas"');
      expect(createSql).toContain(`table_id = '${tableId}'`);
    });
  });

  describe('BiPoolManager Read-Only Guard', () => {
    it('debe bloquear sentencias de escritura prohibidas', async () => {
      const dangerousQueries = [
        'INSERT INTO records (data) VALUES (\'{}\');',
        'UPDATE records SET data = \'{}\';',
        'DELETE FROM records WHERE id = 1;',
        'DROP TABLE bi_cards;',
        'ALTER TABLE records ADD COLUMN test text;',
        'TRUNCATE TABLE audit_logs;',
      ];

      for (const q of dangerousQueries) {
        await expect(biPoolManager.executeQuery('odoo_ro', q)).rejects.toThrow(
          'CONSULTA_BLOQUEADA: Solo se permiten consultas SELECT de lectura analítica'
        );
      }
    });

    it('debe reportar estado de pools en checkHealth', async () => {
      const health = await biPoolManager.checkHealth();
      expect(health.local_baserow.status).toBe('ok');
      expect(['ok', 'disabled', 'error']).toContain(health.odoo_ro.status);
    });
  });
});
