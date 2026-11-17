'use client';

import React, { useState } from 'react';
import { X, BarChart3, Plus, Sparkles } from 'lucide-react';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';

interface NewBiCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewBiCardModal({ isOpen, onClose }: NewBiCardModalProps) {
  const { activeDashboard, activeTabId, refreshActiveDashboard } = useDashboardStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<'kpi' | 'line' | 'bar' | 'horizontal_bar' | 'table' | 'markdown'>('bar');
  const [sourceType, setSourceType] = useState('local_baserow');
  const [tableOrView, setTableOrView] = useState('bi_views."tbl_lotes_de_importacion_900c336b"');
  const [dimensionField, setDimensionField] = useState('estado_embarque');
  const [metricField, setMetricField] = useState('inversion_fob');
  const [aggregation, setAggregation] = useState('sum');
  const [timeIntelligence, setTimeIntelligence] = useState('none');
  const [gridWidth, setGridWidth] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activeDashboard) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const queryConfigJson: any = {
        tableOrView,
        metrics: [
          {
            field: metricField,
            aggregation,
            alias: metricField ? `${metricField}_${aggregation}` : 'total_count',
            timeIntelligence: timeIntelligence !== 'none' ? timeIntelligence : undefined,
          },
        ],
      };

      if (dimensionField && chartType !== 'kpi') {
        queryConfigJson.dimensions = [
          {
            field: dimensionField,
            alias: dimensionField,
            dateTrunc: chartType === 'line' ? 'month' : undefined,
          },
        ];
      }

      const res = await fetch('/api/bi/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId: activeDashboard.id,
          tabId: activeTabId,
          name: name.trim(),
          description: description.trim(),
          chartType,
          sourceType,
          queryConfigJson,
          visualConfigJson: {},
          gridPosJson: { x: 0, y: 0, w: Number(gridWidth), h: 4 },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error al crear tarjeta');
      }

      await refreshActiveDashboard();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Nueva Tarjeta / Reporte</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título de la Tarjeta *
            </label>
            <input
              type="text"
              required
              placeholder="ej. Inversión FOB por Estado de Embarque"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Visualización
              </label>
              <select
                value={chartType}
                onChange={(e: any) => setChartType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="kpi">💎 KPI Card (Cifra Grande)</option>
                <option value="bar">📊 Gráfico de Barras</option>
                <option value="horizontal_bar">📋 Barras Horizontales</option>
                <option value="line">📈 Línea / Tendencia Temporal</option>
                <option value="table">📑 Tabla de Datos</option>
                <option value="markdown">📝 Markdown / Banner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ancho en Grilla
              </label>
              <select
                value={gridWidth}
                onChange={(e) => setGridWidth(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value={3}>1/4 Pantalla (3 cols)</option>
                <option value={4}>1/3 Pantalla (4 cols)</option>
                <option value={6}>Media Pantalla (6 cols)</option>
                <option value={12}>Ancho Completo (12 cols)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuente de Datos
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="local_baserow">BaserowLite (Local PG)</option>
                <option value="odoo_ro">Odoo 20 (RO Pool)</option>
                <option value="voz_ro">Voz Service (RO Pool)</option>
                <option value="pimcore_ro">Pimcore PIM (MariaDB)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tabla o Vista SQL
              </label>
              <input
                type="text"
                value={tableOrView}
                onChange={(e) => setTableOrView(e.target.value)}
                placeholder='bi_views."tbl_..."'
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {chartType !== 'kpi' && chartType !== 'markdown' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campo Dimensión (Eje X / Agrupación)
              </label>
              <input
                type="text"
                placeholder="ej. estado_embarque o fecha_estimada_arribo"
                value={dimensionField}
                onChange={(e) => setDimensionField(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {chartType !== 'markdown' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campo Métrica (Valor)
                </label>
                <input
                  type="text"
                  placeholder="ej. inversion_fob"
                  value={metricField}
                  onChange={(e) => setMetricField(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Función de Agregación
                </label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="sum">SUM (Suma)</option>
                  <option value="avg">AVG (Promedio)</option>
                  <option value="count">COUNT (Conteo)</option>
                  <option value="p50">PERCENTILE p50 (Mediana)</option>
                  <option value="p90">PERCENTILE p90</option>
                  <option value="min">MIN (Mínimo)</option>
                  <option value="max">MAX (Máximo)</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Time Intelligence (Power BI Style)
            </label>
            <select
              value={timeIntelligence}
              onChange={(e) => setTimeIntelligence(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="none">Ninguno (Estándar)</option>
              <option value="mom">MoM (Mes contra Mes con % crecimiento)</option>
              <option value="yoy">YoY (Año contra Año)</option>
              <option value="ytd">YTD (Acumulado en el Año)</option>
              <option value="rolling_7d">Media Móvil 7 días</option>
              <option value="rolling_30d">Media Móvil 30 días</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Tarjeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
