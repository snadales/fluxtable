import { db } from '@/db';
import { tables, fields } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export interface ViewGenerationResult {
  tableId: string;
  tableName: string;
  viewName: string;
  sql: string;
  fieldsCount: number;
}

export class BiViewsGenerator {
  /**
   * Sanitiza un nombre para ser un identificador SQL seguro sin espacios ni caracteres extraños
   */
  public static sanitizeIdentifier(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50);
  }

  /**
   * Genera la sentencia SQL de creación de vista tipada para una tabla de Baserow
   */
  public static generateViewSql(
    tableId: string,
    tableName: string,
    tableFields: Array<{ id: string; name: string; type: string }>
  ): { viewName: string; createSql: string } {
    const safeTableId = tableId.replace(/-/g, '_');
    const sanitizedName = this.sanitizeIdentifier(tableName) || `table_${safeTableId}`;
    const viewName = `tbl_${sanitizedName}`;

    const columnExpressions: string[] = [
      `id AS row_id`,
      `order AS row_order`,
      `version AS row_version`,
      `created_at AS row_created_at`,
      `updated_at AS row_updated_at`,
    ];

    for (const f of tableFields) {
      const colAlias = this.sanitizeIdentifier(f.name) || `field_${f.id.replace(/-/g, '_')}`;
      const jsonAccessor = `(data->>'${f.id}')`;

      switch (f.type) {
        case 'number':
        case 'currency':
        case 'rating':
        case 'percentage':
          columnExpressions.push(`public.safe_numeric(${jsonAccessor}) AS "${colAlias}"`);
          break;

        case 'date':
        case 'created_at':
        case 'last_modified_at':
          columnExpressions.push(`public.safe_timestamptz(${jsonAccessor}) AS "${colAlias}"`);
          break;

        case 'boolean':
          columnExpressions.push(`CASE WHEN ${jsonAccessor} = 'true' THEN TRUE WHEN ${jsonAccessor} = 'false' THEN FALSE ELSE NULL END AS "${colAlias}"`);
          break;

        case 'json':
        case 'multiple_select':
        case 'link_row':
        case 'file':
          columnExpressions.push(`(data->'${f.id}') AS "${colAlias}"`);
          break;

        default:
          columnExpressions.push(`${jsonAccessor} AS "${colAlias}"`);
          break;
      }
    }

    const createSql = `
CREATE OR REPLACE VIEW bi_views."${viewName}" AS
SELECT
  ${columnExpressions.join(',\n  ')}
FROM public.records
WHERE deleted_at IS NULL AND table_id = '${tableId}';
    `.trim();

    return { viewName, createSql };
  }

  /**
   * Sincroniza la vista en base de datos para una tabla específica
   */
  public static async syncTableView(tableId: string): Promise<ViewGenerationResult> {
    const table = await db.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });

    if (!table) {
      throw new Error(`Tabla con ID ${tableId} no encontrada`);
    }

    const tableFields = await db.query.fields.findMany({
      where: eq(fields.tableId, tableId),
    });

    const { viewName, createSql } = this.generateViewSql(tableId, table.name, tableFields);

    // Asegurar esquema bi_views
    await db.execute(sql.raw('CREATE SCHEMA IF NOT EXISTS bi_views;'));

    // Ejecutar creación de vista
    await db.execute(sql.raw(createSql));

    return {
      tableId,
      tableName: table.name,
      viewName,
      sql: createSql,
      fieldsCount: tableFields.length,
    };
  }

  /**
   * Sincroniza todas las vistas de todas las tablas activas en BaserowLite
   */
  public static async syncAllViews(): Promise<ViewGenerationResult[]> {
    const allTables = await db.query.tables.findMany({
      where: isNull(tables.deletedAt),
    });

    const results: ViewGenerationResult[] = [];
    for (const t of allTables) {
      try {
        const res = await this.syncTableView(t.id);
        results.push(res);
      } catch (err) {
        console.warn(`[bi-views] Error generando vista para tabla ${t.id} (${t.name}):`, err);
      }
    }
    return results;
  }
}
