import { describe, it, expect } from 'vitest';
import { BiQueryBuilder, BiQueryConfig } from '../analytics/query-builder';
import { biCacheManager } from '../analytics/cache-manager';

describe('BI Query Builder & Time Intelligence', () => {
  it('debe generar consulta de agregación simple con p50 y p90', () => {
    const config: BiQueryConfig = {
      tableOrView: 'bi_views.tbl_lotes_de_importacion_900c336b',
      dimensions: [{ field: 'estado_embarque' }],
      metrics: [
        { field: 'inversion_fob', aggregation: 'sum', alias: 'total_fob' },
        { field: 'inversion_fob', aggregation: 'p50', alias: 'fob_p50' },
        { field: 'inversion_fob', aggregation: 'p90', alias: 'fob_p90' },
      ],
      filters: [{ field: 'estado_embarque', operator: 'eq', value: 'opt_transito' }],
    };

    const { sql, params } = BiQueryBuilder.buildQuery(config);

    expect(sql).toContain('SELECT "estado_embarque" AS "estado_embarque", COALESCE(SUM("inversion_fob"), 0) AS "total_fob"');
    expect(sql).toContain('PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "inversion_fob") AS "fob_p50"');
    expect(sql).toContain('PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "inversion_fob") AS "fob_p90"');
    expect(sql).toContain('"estado_embarque" = $1');
    expect(sql).toContain('GROUP BY 1');
    expect(params).toEqual(['opt_transito']);
  });

  it('debe generar CTE con Time Intelligence MoM (Month-over-Month)', () => {
    const config: BiQueryConfig = {
      tableOrView: 'bi_views.tbl_balance_negocios',
      dimensions: [{ field: 'fecha', alias: 'mes', dateTrunc: 'month' }],
      metrics: [
        { field: 'monto', aggregation: 'sum', alias: 'ingresos', timeIntelligence: 'mom' },
      ],
      dateRange: { field: 'fecha', preset: 'last_30_days' },
    };

    const { sql } = BiQueryBuilder.buildQuery(config);

    expect(sql).toContain('WITH base_summary AS (');
    expect(sql).toContain('date_trunc(\'month\', "fecha") AS "mes"');
    expect(sql).toContain('"fecha" >= NOW() - INTERVAL \'30 days\'');
    expect(sql).toContain('LAG("ingresos", 1) OVER (ORDER BY "mes") AS "ingresos_prev"');
    expect(sql).toContain('ROUND((("ingresos" - LAG("ingresos", 1) OVER (ORDER BY "mes")) / NULLIF(LAG("ingresos", 1) OVER (ORDER BY "mes"), 0) * 100)::numeric, 2) AS "ingresos_growth_pct"');
  });

  it('debe generar CTE con Time Intelligence YTD (Year-to-Date)', () => {
    const config: BiQueryConfig = {
      tableOrView: 'bi_views.tbl_balance_negocios',
      dimensions: [{ field: 'fecha', alias: 'dia', dateTrunc: 'day' }],
      metrics: [
        { field: 'monto', aggregation: 'sum', alias: 'ventas', timeIntelligence: 'ytd' },
      ],
    };

    const { sql } = BiQueryBuilder.buildQuery(config);

    expect(sql).toContain('SUM("ventas") OVER (PARTITION BY EXTRACT(YEAR FROM "dia") ORDER BY "dia") AS "ventas_ytd"');
  });

  it('debe generar media móvil rolling de 7 días', () => {
    const config: BiQueryConfig = {
      tableOrView: 'bi_views.tbl_operaciones',
      dimensions: [{ field: 'fecha', alias: 'dia', dateTrunc: 'day' }],
      metrics: [
        { field: 'tiempo_ms', aggregation: 'avg', alias: 'duracion_promedio', timeIntelligence: 'rolling_7d' },
      ],
    };

    const { sql } = BiQueryBuilder.buildQuery(config);

    expect(sql).toContain('ROUND(AVG("duracion_promedio") OVER (ORDER BY "dia" ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::numeric, 2) AS "duracion_promedio_rolling_7d"');
  });
});

describe('BI Cache Manager', () => {
  it('debe cachear resultados y respetar keys deterministas', () => {
    biCacheManager.clear();
    const key1 = biCacheManager.generateKey('local_baserow', 'SELECT 1', [], {});
    const key2 = biCacheManager.generateKey('local_baserow', 'SELECT 1', [], {});
    const key3 = biCacheManager.generateKey('local_baserow', 'SELECT 2', [], {});

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);

    biCacheManager.set(key1, { data: [{ test: 123 }], columns: ['test'], durationMs: 15 });

    const cached = biCacheManager.get(key1);
    expect(cached).toBeDefined();
    expect(cached?.data[0].test).toBe(123);
    expect(cached?.durationMs).toBe(15);
  });
});
