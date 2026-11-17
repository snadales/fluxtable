export interface DimensionConfig {
  field: string;
  alias?: string;
  dateTrunc?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface MetricConfig {
  field?: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'p50' | 'p90' | 'stddev';
  alias?: string;
  timeIntelligence?: 'none' | 'mom' | 'yoy' | 'ytd' | 'rolling_7d' | 'rolling_30d';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'like';
  value: any;
}

export interface DateRangeConfig {
  field: string;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface BiQueryConfig {
  tableOrView: string;
  dimensions?: DimensionConfig[];
  metrics: MetricConfig[];
  filters?: FilterConfig[];
  dateRange?: DateRangeConfig;
  sort?: SortConfig[];
  limit?: number;
  offset?: number;
}

export class BiQueryBuilder {
  /**
   * Genera una sentencia SQL analítica completa con soporte de Time Intelligence
   */
  public static buildQuery(config: BiQueryConfig): { sql: string; params: any[] } {
    if (!config.tableOrView || typeof config.tableOrView !== 'string' || !config.tableOrView.trim()) {
      throw new Error('CONFIG_ERROR: tableOrView es requerido para construir la consulta analítica');
    }

    const params: any[] = [];
    const whereClauses: string[] = [];

    // 1. Manejo de Rango de Fechas
    if (config.dateRange) {
      const { field, preset, startDate, endDate } = config.dateRange;
      const safeField = `"${field.replace(/"/g, '')}"`;

      switch (preset) {
        case 'today':
          whereClauses.push(`${safeField} >= CURRENT_DATE AND ${safeField} < CURRENT_DATE + INTERVAL '1 day'`);
          break;
        case 'yesterday':
          whereClauses.push(`${safeField} >= CURRENT_DATE - INTERVAL '1 day' AND ${safeField} < CURRENT_DATE`);
          break;
        case 'last_7_days':
          whereClauses.push(`${safeField} >= NOW() - INTERVAL '7 days'`);
          break;
        case 'last_30_days':
          whereClauses.push(`${safeField} >= NOW() - INTERVAL '30 days'`);
          break;
        case 'this_month':
          whereClauses.push(`${safeField} >= date_trunc('month', CURRENT_DATE)`);
          break;
        case 'last_month':
          whereClauses.push(`${safeField} >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND ${safeField} < date_trunc('month', CURRENT_DATE)`);
          break;
        case 'this_year':
          whereClauses.push(`${safeField} >= date_trunc('year', CURRENT_DATE)`);
          break;
        case 'custom':
          if (startDate && endDate) {
            params.push(startDate);
            const pStart = `$${params.length}`;
            params.push(endDate);
            const pEnd = `$${params.length}`;
            whereClauses.push(`${safeField} >= ${pStart}::timestamptz AND ${safeField} <= ${pEnd}::timestamptz`);
          } else if (startDate) {
            params.push(startDate);
            whereClauses.push(`${safeField} >= $${params.length}::timestamptz`);
          } else if (endDate) {
            params.push(endDate);
            whereClauses.push(`${safeField} <= $${params.length}::timestamptz`);
          }
          break;
      }
    }

    // 2. Manejo de Filtros
    if (config.filters && config.filters.length > 0) {
      for (const f of config.filters) {
        const rawField = f.field || (f as any).column || '';
        if (!rawField) continue;
        const safeField = `"${rawField.replace(/"/g, '')}"`;
        const op = (f.operator as string) === 'equals' ? 'eq' : f.operator;
        switch (op) {
          case 'eq':
            params.push(f.value);
            whereClauses.push(`${safeField} = $${params.length}`);
            break;
          case 'neq':
            params.push(f.value);
            whereClauses.push(`${safeField} != $${params.length}`);
            break;
          case 'gt':
            params.push(f.value);
            whereClauses.push(`${safeField} > $${params.length}`);
            break;
          case 'gte':
            params.push(f.value);
            whereClauses.push(`${safeField} >= $${params.length}`);
            break;
          case 'lt':
            params.push(f.value);
            whereClauses.push(`${safeField} < $${params.length}`);
            break;
          case 'lte':
            params.push(f.value);
            whereClauses.push(`${safeField} <= $${params.length}`);
            break;
          case 'like':
            params.push(`%${f.value}%`);
            whereClauses.push(`${safeField} ILIKE $${params.length}`);
            break;
          case 'in':
            if (Array.isArray(f.value) && f.value.length > 0) {
              const placeholders = f.value.map((v) => {
                params.push(v);
                return `$${params.length}`;
              });
              whereClauses.push(`${safeField} IN (${placeholders.join(', ')})`);
            }
            break;
          case 'nin':
            if (Array.isArray(f.value) && f.value.length > 0) {
              const placeholders = f.value.map((v) => {
                params.push(v);
                return `$${params.length}`;
              });
              whereClauses.push(`${safeField} NOT IN (${placeholders.join(', ')})`);
            }
            break;
          case 'between':
            if (Array.isArray(f.value) && f.value.length === 2) {
              params.push(f.value[0]);
              const p1 = `$${params.length}`;
              params.push(f.value[1]);
              const p2 = `$${params.length}`;
              whereClauses.push(`${safeField} BETWEEN ${p1} AND ${p2}`);
            }
            break;
        }
      }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 3. Proyecciones y Agregaciones Base
    const dimensionSelects: string[] = [];
    const groupByIndices: number[] = [];

    if (config.dimensions && config.dimensions.length > 0) {
      config.dimensions.forEach((d, idx) => {
        const safeField = `"${d.field.replace(/"/g, '')}"`;
        const alias = d.alias || d.field;
        if (d.dateTrunc) {
          dimensionSelects.push(`date_trunc('${d.dateTrunc}', ${safeField}) AS "${alias}"`);
        } else {
          dimensionSelects.push(`${safeField} AS "${alias}"`);
        }
        groupByIndices.push(idx + 1);
      });
    }

    const baseMetricSelects: string[] = [];
    let hasTimeIntelligence = false;

    // Normalización defensiva de métricas si se usa formato simplificado
    const legacyMetric = (config as any).metricColumn;
    const legacyAgg = (config as any).aggregation || 'sum';
    const effectiveMetrics: MetricConfig[] = (config.metrics && config.metrics.length > 0)
      ? config.metrics
      : legacyMetric
        ? [{
            field: legacyMetric,
            aggregation: legacyAgg,
            alias: 'metric',
            timeIntelligence: 'none',
          }]
        : [{
            field: '*',
            aggregation: 'count',
            alias: 'metric',
            timeIntelligence: 'none',
          }];

    effectiveMetrics.forEach((m, idx) => {
      const alias = m.alias || `metric_${idx + 1}`;
      const safeField = m.field ? `"${m.field.replace(/"/g, '')}"` : '*';

      if (m.timeIntelligence && m.timeIntelligence !== 'none') {
        hasTimeIntelligence = true;
      }

      switch (m.aggregation) {
        case 'count':
          baseMetricSelects.push(`COUNT(${safeField}) AS "${alias}"`);
          break;
        case 'sum':
          baseMetricSelects.push(`COALESCE(SUM(${safeField}), 0) AS "${alias}"`);
          break;
        case 'avg':
          baseMetricSelects.push(`COALESCE(AVG(${safeField}), 0) AS "${alias}"`);
          break;
        case 'min':
          baseMetricSelects.push(`MIN(${safeField}) AS "${alias}"`);
          break;
        case 'max':
          baseMetricSelects.push(`MAX(${safeField}) AS "${alias}"`);
          break;
        case 'p50':
          baseMetricSelects.push(`PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${safeField}) AS "${alias}"`);
          break;
        case 'p90':
          baseMetricSelects.push(`PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ${safeField}) AS "${alias}"`);
          break;
        case 'stddev':
          baseMetricSelects.push(`COALESCE(STDDEV(${safeField}), 0) AS "${alias}"`);
          break;
      }
    });

    const baseSelects = [...dimensionSelects, ...baseMetricSelects].join(', ');
    const groupByClause = groupByIndices.length > 0 ? `GROUP BY ${groupByIndices.join(', ')}` : '';

    // Si NO hay funciones de Time Intelligence, construimos la consulta plana
    if (!hasTimeIntelligence) {
      const sortClauses: string[] = [];
      if (config.sort && config.sort.length > 0) {
        config.sort.forEach((s) => {
          sortClauses.push(`"${s.field.replace(/"/g, '')}" ${s.direction.toUpperCase()}`);
        });
      }
      const sortString = sortClauses.length > 0 ? `ORDER BY ${sortClauses.join(', ')}` : '';
      const limitString = config.limit ? `LIMIT ${Number(config.limit)}` : '';
      const offsetString = config.offset ? `OFFSET ${Number(config.offset)}` : '';

      const sql = `
SELECT ${baseSelects}
FROM ${config.tableOrView}
${whereString}
${groupByClause}
${sortString}
${limitString}
${offsetString};
      `.trim();

      return { sql, params };
    }

    // Si HAY Time Intelligence, generamos un CTE para aplicar Window Functions
    const primaryDimension = config.dimensions && config.dimensions.length > 0 ? `"${(config.dimensions[0].alias || config.dimensions[0].field).replace(/"/g, '')}"` : '1';

    const outerSelects: string[] = [];
    if (config.dimensions) {
      config.dimensions.forEach((d) => {
        const alias = d.alias || d.field;
        outerSelects.push(`"${alias}"`);
      });
    }

    effectiveMetrics.forEach((m, idx) => {
      const alias = m.alias || `metric_${idx + 1}`;
      outerSelects.push(`"${alias}"`);

      if (m.timeIntelligence === 'mom' || m.timeIntelligence === 'yoy') {
        const lagVal = `LAG("${alias}", 1) OVER (ORDER BY ${primaryDimension})`;
        outerSelects.push(`${lagVal} AS "${alias}_prev"`);
        outerSelects.push(
          `ROUND((("${alias}" - ${lagVal}) / NULLIF(${lagVal}, 0) * 100)::numeric, 2) AS "${alias}_growth_pct"`
        );
      } else if (m.timeIntelligence === 'ytd') {
        outerSelects.push(
          `SUM("${alias}") OVER (PARTITION BY EXTRACT(YEAR FROM ${primaryDimension}) ORDER BY ${primaryDimension}) AS "${alias}_ytd"`
        );
      } else if (m.timeIntelligence === 'rolling_7d') {
        outerSelects.push(
          `ROUND(AVG("${alias}") OVER (ORDER BY ${primaryDimension} ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::numeric, 2) AS "${alias}_rolling_7d"`
        );
      } else if (m.timeIntelligence === 'rolling_30d') {
        outerSelects.push(
          `ROUND(AVG("${alias}") OVER (ORDER BY ${primaryDimension} ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)::numeric, 2) AS "${alias}_rolling_30d"`
        );
      }
    });

    const sortClauses: string[] = [];
    if (config.sort && config.sort.length > 0) {
      config.sort.forEach((s) => {
        sortClauses.push(`"${s.field.replace(/"/g, '')}" ${s.direction.toUpperCase()}`);
      });
    } else {
      sortClauses.push(`${primaryDimension} ASC`);
    }

    const sortString = `ORDER BY ${sortClauses.join(', ')}`;
    const limitString = config.limit ? `LIMIT ${Number(config.limit)}` : '';
    const offsetString = config.offset ? `OFFSET ${Number(config.offset)}` : '';

    const sql = `
WITH base_summary AS (
  SELECT ${baseSelects}
  FROM ${config.tableOrView}
  ${whereString}
  ${groupByClause}
)
SELECT ${outerSelects.join(', ')}
FROM base_summary
${sortString}
${limitString}
${offsetString};
    `.trim();

    return { sql, params };
  }
}
