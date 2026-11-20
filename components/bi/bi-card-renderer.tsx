'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  ArrowUpRight, ArrowDownRight, Minus, AlertCircle, RefreshCw, 
  HelpCircle, ChevronRight, Filter, Table as TableIcon
} from 'lucide-react';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';
import { formatCurrency } from '@/lib/formatters';

interface BiCardRendererProps {
  card: {
    id: string;
    code: string;
    name: string;
    description?: string;
    chartType: 'kpi' | 'line' | 'bar' | 'horizontal_bar' | 'table' | 'markdown';
    sourceType: 'local_baserow' | 'odoo_ro' | 'voz_ro' | 'pimcore_ro';
    queryConfigJson: any;
    visualConfigJson: any;
    gridPosJson?: { x: number; y: number; w: number; h: number };
    thresholds?: Array<{
      metricKey: string;
      warningValue: string;
      criticalValue: string;
      direction: 'above' | 'below';
      colorScheme: string;
    }>;
  };
  onNavigateToTable?: (tableIdentifier: string) => void;
  onInspectKpi?: (kpiCode: string) => void;
}

export function BiCardRenderer({ card, onNavigateToTable, onInspectKpi }: BiCardRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const { activeTimeRange, crossFilters, setCrossFilter } = useDashboardStore();

  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  // Ejecutar consulta analítica combinando config de la tarjeta con filtros globales
  const fetchCardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si la tarjeta incluye datos precargados de demostración (Issue #30)
      if (card.visualConfigJson?.staticData) {
        setData(card.visualConfigJson.staticData.data || []);
        setColumns(card.visualConfigJson.staticData.columns || Object.keys(card.visualConfigJson.staticData.data?.[0] || {}));
        setDurationMs(1);
        setIsCached(true);
        setLoading(false);
        setError(null);
        return;
      }

      // Si es una tarjeta KPI con valor fijo o sin tabla configurada (Issue #31)
      if (card.chartType === 'kpi' && (card.visualConfigJson?.displayValue || !card.queryConfigJson?.tableOrView)) {
        setData(card.visualConfigJson?.displayValue ? [{ valor: card.visualConfigJson.displayValue }] : [{}]);
        setColumns(['valor']);
        setDurationMs(1);
        setIsCached(true);
        setLoading(false);
        setError(null);
        return;
      }

      // Si no hay tabla o vista especificada, no intentar consulta SQL inválida
      if (!card.queryConfigJson?.tableOrView) {
        setData([]);
        setColumns([]);
        setDurationMs(0);
        setIsCached(false);
        setLoading(false);
        setError(null);
        return;
      }

      const baseConfig = card.queryConfigJson || {};
      
      // Incorporar rango temporal si la tarjeta tiene fecha configurada
      const dateRange = baseConfig.dateRange || (activeTimeRange.field ? activeTimeRange : undefined);

      // Incorporar filtros cruzados como filtros directos
      const mergedFilters = [...(baseConfig.filters || [])];
      for (const [dimKey, cf] of Object.entries(crossFilters)) {
        // No auto-filtrar la tarjeta si la dimensión origen es de la propia tarjeta
        if (baseConfig.dimensions?.some((d: any) => d.field === cf.field)) {
          continue;
        }
        mergedFilters.push({
          field: cf.field,
          operator: 'eq',
          value: cf.value,
        });
      }

      const queryConfig = {
        ...baseConfig,
        dateRange,
        filters: mergedFilters,
      };

      const res = await fetch('/api/bi/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: card.sourceType || 'local_baserow',
          queryConfig,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error al ejecutar consulta');
      }

      setData(json.data || []);
      setColumns(json.columns || []);
      setDurationMs(json.meta?.durationMs ?? null);
      setIsCached(Boolean(json.meta?.cached));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, [card.id, activeTimeRange, crossFilters]);

  // Renderizar gráfico ECharts para line, bar, horizontal_bar
  useEffect(() => {
    if (loading || error || !chartRef.current) return;
    if (!['line', 'bar', 'horizontal_bar'].includes(card.chartType)) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;
    const isHorizontal = card.chartType === 'horizontal_bar';
    const isLine = card.chartType === 'line';

    const dimField = card.queryConfigJson?.dimensions?.[0]?.alias || card.queryConfigJson?.dimensions?.[0]?.field || columns[0] || 'x';
    const metricField = card.queryConfigJson?.metrics?.[0]?.alias || columns[1] || 'y';

    const categories = data.map((d) => String(d[dimField] ?? ''));
    const values = data.map((d) => Number(d[metricField]) || 0);

    // Formato es-CL: miles con punto, CLP sin decimales ('clp' antepone $), 'int' entero, 'pct' 1 decimal
    const valueFormat: string = card.visualConfigJson?.valueFormat || '';
    const fmtVal = (n: number, key?: string) => {
      const isPct = valueFormat === 'pct';
      const txt = isPct
        ? n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
        : Math.round(n).toLocaleString('es-CL');
      const isMain = !key || key === metricField;
      return valueFormat === 'clp' && isMain ? `$${txt}` : txt;
    };
    // Tooltip con todas las métricas listadas (p. ej. venta bruta + órdenes)
    const tooltipKeys: string[] = card.visualConfigJson?.tooltipMetrics?.length
      ? card.visualConfigJson.tooltipMetrics
      : [metricField];
    // Colores por categoría (paleta fija por sociedad/canal)
    const colorMap: Record<string, string> | undefined = card.visualConfigJson?.colorMap;
    const baseColor = card.visualConfigJson?.color || '#1D5BD8';
    const barData = values.map((v, i) => ({
      value: v,
      itemStyle: colorMap && colorMap[categories[i]] ? { color: colorMap[categories[i]] } : undefined,
    }));

    const option: any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          const row = data[item.dataIndex] || {};
          const lines = tooltipKeys.map((k) => {
            const label = k.replace(/_/g, ' ');
            return `${label}: <b>${fmtVal(Number(row[k]) || 0, k)}</b>`;
          });
          return `<b>${item.name}</b><br/>${lines.join('<br/>')}`;
        },
      },
      grid: {
        top: 25,
        right: 20,
        bottom: isLine ? 55 : 30,
        left: isHorizontal ? 90 : 50,
      },
      xAxis: isHorizontal
        ? { type: 'value' }
        : { 
            type: 'category', 
            data: categories,
            axisLabel: {
              rotate: categories.length > 6 ? 30 : 0,
              fontSize: 10,
            }
          },
      yAxis: isHorizontal
        ? { 
            type: 'category', 
            data: categories,
            axisLabel: { fontSize: 10 }
          }
        : {
            type: 'value',
            name: card.visualConfigJson?.yAxisName || '',
            nameTextStyle: { fontSize: 10, align: 'left' },
            axisLabel: { fontSize: 10, formatter: (v: number) => v.toLocaleString('es-CL') },
          },
      dataZoom: isLine && categories.length > 5
        ? [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 5 }]
        : undefined,
      series: [
        {
          name: metricField,
          type: isLine ? 'line' : 'bar',
          data: isLine ? values : barData,
          smooth: isLine,
          label: {
            show: true,
            position: isHorizontal ? 'right' : (isLine ? 'top' : 'top'),
            fontSize: 10,
            fontWeight: 'bold',
            color: '#334155',
            formatter: (p: any) => (typeof p.value === 'number' ? fmtVal(p.value) : p.value),
          },
          itemStyle: {
            color: baseColor,
            borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          },
          areaStyle: isLine
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(29, 91, 216, 0.35)' },
                  { offset: 1, color: 'rgba(29, 91, 216, 0.0)' },
                ]),
              }
            : undefined,
        },
      ],
    };

    chart.setOption(option, true);

    // Evento de Cross-Filtering al hacer clic en un elemento del gráfico
    chart.off('click');
    chart.on('click', (params: any) => {
      const clickedDimValue = params.name;
      setCrossFilter(dimField, {
        field: dimField,
        value: clickedDimValue,
        label: `${dimField}: ${clickedDimValue}`,
      });
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading, error, card.chartType]);

  // Limpiar instancia de chart en unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  const sourceTable = card.visualConfigJson?.sourceTable || 
    (card.queryConfigJson?.tableOrView ? { 
      code: card.queryConfigJson.tableCode || 'Txxx', 
      name: card.queryConfigJson.tableName || card.queryConfigJson.tableOrView,
      tableId: card.queryConfigJson.tableId || card.queryConfigJson.tableOrView 
    } : null);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      {/* Cabecera de la Tarjeta */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onInspectKpi) onInspectKpi(card.code);
            }}
            className="font-mono text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 rounded border border-blue-200/60 hover:border-blue-300 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            title="Inspeccionar Receta de Construcción (SQL, Fórmula y Umbrales)"
          >
            <span>{card.code}</span>
            <span className="text-[9px] opacity-70">🔍</span>
          </button>
          <h3 className="text-xs font-semibold text-slate-800 truncate" title={card.name}>
            {card.name}
          </h3>
          {card.description && (
            <span title={card.description} className="text-slate-400 hover:text-slate-600 cursor-help shrink-0">
              <HelpCircle className="w-3 h-3" />
            </span>
          )}

          {/* Badge de Trazabilidad hacia la Tabla Origen (Concepto de Negocio) */}
          {sourceTable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToTable) {
                  onNavigateToTable(sourceTable.tableId || sourceTable.code || sourceTable.name);
                }
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group/tbl ml-2 shrink-0 shadow-2xs"
              title={`Ver datos en tabla origen: ${sourceTable.code ? sourceTable.code + ' · ' : ''}${sourceTable.name}`}
            >
              <TableIcon className="w-2.5 h-2.5 text-blue-600 shrink-0" />
              <span className="font-bold text-blue-700">{sourceTable.code || 'Txxx'}</span>
              <span className="text-slate-500 group-hover/tbl:text-blue-600 max-w-[120px] truncate hidden md:inline">
                · {sourceTable.name}
              </span>
              <ArrowUpRight className="w-2.5 h-2.5 text-slate-400 group-hover/tbl:text-blue-600 transition-colors" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCached && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-600 rounded border border-emerald-200">
              Caché 1ms
            </span>
          )}
          {durationMs !== null && !isCached && (
            <span className="text-[9px] font-mono text-slate-400">
              {durationMs}ms
            </span>
          )}
          <button
            type="button"
            onClick={fetchCardData}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            title="Refrescar tarjeta"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenido / Cuerpo */}
      <div className="flex-1 p-3 flex flex-col min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-red-500">
            <AlertCircle className="w-5 h-5 mb-1" />
            <p className="text-xs font-medium">Error al cargar datos</p>
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{error}</p>
          </div>
        )}

        {!error && !loading && data.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">
            Sin datos en el rango seleccionado
          </div>
        )}

        {/* 1. Tarjeta KPI */}
        {!error && card.chartType === 'kpi' && (data.length > 0 || card.visualConfigJson?.displayValue) && (() => {
          const row = data[0] || {};
          const metricKeys = Object.keys(row);
          const primaryKey = metricKeys[0] || 'valor';
          const val = Number(row[primaryKey]) || 0;
          
          const prefix = card.visualConfigJson?.prefix || '';
          const suffix = card.visualConfigJson?.suffix || '';
          const formattedVal = card.visualConfigJson?.displayValue || `${prefix}${val.toLocaleString('es-CL')}${suffix}`;

          // Buscar variación porcentual si existe
          const growthKey = metricKeys.find((k) => k.endsWith('_growth_pct'));
          const growthVal = card.visualConfigJson?.growth !== undefined 
            ? card.visualConfigJson.growth 
            : (growthKey ? Number(row[growthKey]) : null);

          return (
            <div className="flex-1 flex flex-col justify-center items-center py-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {formattedVal}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                {card.visualConfigJson?.subtitle || primaryKey.replace(/_/g, ' ')}
              </span>

              {growthVal !== null && !isNaN(growthVal) && (
                <div className={`mt-2 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  growthVal > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : growthVal < 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {growthVal > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                  {growthVal < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                  {growthVal === 0 && <Minus className="w-3.5 h-3.5" />}
                  <span>{growthVal > 0 ? `+${growthVal}%` : `${growthVal}%`} MoM</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* 2. Gráficos ECharts (line, bar, horizontal_bar) */}
        {!error && ['line', 'bar', 'horizontal_bar'].includes(card.chartType) && (
          <div ref={chartRef} className="w-full h-full min-h-[180px]" />
        )}

        {/* 3. Tabla de Datos */}
        {!error && card.chartType === 'table' && data.length > 0 && (
          <div className="flex-1 overflow-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="p-2 font-semibold truncate capitalize">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => {
                  const totalLabel: string | undefined = card.visualConfigJson?.totalsRow;
                  const isTotal = !!totalLabel && columns.some((c) => row[c] === totalLabel);
                  const metricAliases: string[] = (card.queryConfigJson?.metrics || []).map((m: any) => m.alias || m.field);
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-50/40 transition-colors ${isTotal ? 'bg-slate-50 font-bold border-t-2 border-slate-300' : ''}`}
                    >
                      {columns.map((col) => {
                        const cellVal = row[col];
                        let displayVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : '-';
                        const isNum = metricAliases.includes(col) && cellVal !== null && cellVal !== '' && !isNaN(Number(cellVal));
                        // es-CL: miles con punto, sin decimales
                        if (isNum) displayVal = Math.round(Number(cellVal)).toLocaleString('es-CL');
                        return (
                          <td
                            key={col}
                            className={`p-2 truncate font-mono text-slate-700 max-w-[260px] ${isNum ? 'text-right tabular-nums' : ''}`}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Markdown Banner */}
        {!error && card.chartType === 'markdown' && (
          <div className="flex-1 text-xs text-slate-700 leading-relaxed overflow-y-auto">
            {card.description || 'Tarjeta informativa sin contenido'}
          </div>
        )}
      </div>
    </div>
  );
}
