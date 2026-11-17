'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  ArrowUpRight, ArrowDownRight, Minus, AlertCircle, RefreshCw, 
  HelpCircle, ChevronRight, Filter
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
}

export function BiCardRenderer({ card }: BiCardRendererProps) {
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

    const option: any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          const val = typeof item.value === 'number' ? item.value.toLocaleString() : item.value;
          return `<b>${item.name}</b><br/>${metricField}: ${val}`;
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
        : { type: 'value' },
      dataZoom: isLine && categories.length > 5
        ? [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 5 }]
        : undefined,
      series: [
        {
          name: metricField,
          type: isLine ? 'line' : 'bar',
          data: values,
          smooth: isLine,
          itemStyle: {
            color: card.visualConfigJson?.color || (isLine ? '#1D5BD8' : '#1D5BD8'),
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

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      {/* Cabecera de la Tarjeta */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200/60 shrink-0">
            {card.code}
          </span>
          <h3 className="text-xs font-semibold text-slate-800 truncate" title={card.name}>
            {card.name}
          </h3>
          {card.description && (
            <span title={card.description} className="text-slate-400 hover:text-slate-600 cursor-help">
              <HelpCircle className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
                {data.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    {columns.map((col) => {
                      const cellVal = row[col];
                      const displayVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : '-';
                      return (
                        <td key={col} className="p-2 truncate font-mono text-slate-700 max-w-[200px]">
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
