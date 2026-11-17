'use client';

import React, { useState } from 'react';
import { 
  Folder, BarChart2, Table as TableIcon, LayoutDashboard, ArrowUpRight, 
  TrendingUp, TrendingDown, Minus, Plus, Search, Filter, ShieldCheck, 
  CheckCircle2, Clock, ExternalLink, RefreshCw, Layers, Edit3, Eye
} from 'lucide-react';
import { FluxTableLogo } from '@/components/brand/yarken-logo';

export interface IndicatorItem {
  id: string;
  code: string;
  name: string;
  displayValue?: string;
  growth?: number;
  subtitle?: string;
  sourceTable?: { code: string; name: string; tableId: string };
  dashboardId: string;
  dashboardCode: string;
  dashboardName: string;
}

export interface ChartItem {
  id: string;
  code: string;
  name: string;
  chartType: string;
  sourceTable?: { code: string; name: string; tableId: string };
  dashboardId: string;
  dashboardCode: string;
  dashboardName: string;
}

export interface TableItem {
  id: string;
  legacyId?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface DashboardItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
}

interface AssetCatalogViewProps {
  moduleName: string;
  workspaceName: string;
  activeTab?: 'indicators' | 'charts' | 'tables' | 'dashboards';
  indicators: IndicatorItem[];
  charts: ChartItem[];
  tables: TableItem[];
  dashboards: DashboardItem[];
  onOpenTable: (tableIdentifier: string) => void;
  onOpenDashboard: (dashboardIdOrCode: string) => void;
  onBackToWorkspace: () => void;
  onInspectKpi?: (kpiCode: string) => void;
}

export const AssetCatalogView: React.FC<AssetCatalogViewProps> = ({
  moduleName,
  workspaceName,
  activeTab: initialTab = 'indicators',
  indicators,
  charts,
  tables,
  dashboards,
  onOpenTable,
  onOpenDashboard,
  onBackToWorkspace,
  onInspectKpi,
}) => {
  const [currentTab, setCurrentTab] = useState<'indicators' | 'charts' | 'tables' | 'dashboards'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIndicators = indicators.filter(
    (k) =>
      !searchQuery ||
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCharts = charts.filter(
    (g) =>
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTables = tables.filter(
    (t) =>
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.legacyId && String(t.legacyId).includes(searchQuery))
  );

  const filteredDashboards = dashboards.filter(
    (d) =>
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* 1. Header con Taxonomía Yarken / Metabase §1b */}
      <header className="border-b border-line bg-white dark:bg-slate-900 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-3 font-medium mb-1">
              <button
                type="button"
                onClick={onBackToWorkspace}
                className="hover:text-accent transition-colors"
              >
                {workspaceName}
              </button>
              <span>/</span>
              <span className="text-ink font-semibold">{moduleName}</span>
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2.5">
              <Folder className="w-5 h-5 text-accent" />
              <span>{moduleName}</span>
            </h1>
            <p className="text-xs text-ink-3 mt-1 max-w-2xl">
              Catálogo estructurado bajo el Framework Yarken / Metabase. Gestiona de forma centralizada indicadores (K), gráficos (G), tablas fuente (T) y tableros ejecutivos (D).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-3 py-1.5 rounded-xl border border-line text-xs font-semibold text-ink-2 hover:bg-surface-sunken transition-colors"
            >
              Volver a Workspaces
            </button>
          </div>
        </div>

        {/* 2. Pestañas de Subcarpetas Estándar (01 Indicadores, 02 Gráficos, 03 Tablas, 05 Dashboards) */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line/60">
          <button
            type="button"
            onClick={() => setCurrentTab('indicators')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'indicators'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-2 hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <span>📁 01 Indicadores</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${currentTab === 'indicators' ? 'bg-white/20 text-white' : 'bg-surface-sunken text-ink-3'}`}>
              {indicators.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('charts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'charts'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-2 hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <span>📁 02 Gráficos</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${currentTab === 'charts' ? 'bg-white/20 text-white' : 'bg-surface-sunken text-ink-3'}`}>
              {charts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('tables')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'tables'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-2 hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <span>📁 03 Tablas</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${currentTab === 'tables' ? 'bg-white/20 text-white' : 'bg-surface-sunken text-ink-3'}`}>
              {tables.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('dashboards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'dashboards'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-2 hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <span>📊 05 Dashboards</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${currentTab === 'dashboards' ? 'bg-white/20 text-white' : 'bg-surface-sunken text-ink-3'}`}>
              {dashboards.length}
            </span>
          </button>

          {/* Buscador Rápido */}
          <div className="ml-auto relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar activo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-line bg-surface focus:outline-none focus:border-accent text-ink"
            />
          </div>
        </div>
      </header>

      {/* 3. Contenido Principal según Pestaña Activa */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* PESTAÑA 1: 01 INDICADORES (K...) */}
        {currentTab === 'indicators' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span>Indicadores Clave de Rendimiento (K001 - K999)</span>
                </h2>
                <p className="text-xs text-ink-3">
                  Métricas numéricas y benchmarks operacionales del área.
                </p>
              </div>
            </div>

            {filteredIndicators.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-line p-6">
                <BarChart2 className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-ink-3">No hay indicadores registrados en este módulo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIndicators.map((kpi) => {
                  const isPositive = (kpi.growth ?? 0) >= 0;
                  return (
                    <div
                      key={kpi.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-line p-5 shadow-2xs hover:shadow-md hover:border-accent transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => onInspectKpi ? onInspectKpi(kpi.code) : null}
                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1"
                            title="Ver Receta Técnica de Construcción (SQL y Umbrales)"
                          >
                            <span>{kpi.code}</span>
                            <span className="text-[9px] opacity-70">🔍</span>
                          </button>
                          {kpi.dashboardCode && (
                            <button
                              type="button"
                              onClick={() => onOpenDashboard(kpi.dashboardId || kpi.dashboardCode)}
                              className="text-[10px] font-mono text-ink-3 hover:text-accent flex items-center gap-1 transition-colors"
                              title={`Abrir dashboard ${kpi.dashboardCode}`}
                            >
                              <span>{kpi.dashboardCode}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-ink mb-1.5">{kpi.name}</h3>
                        {kpi.subtitle && (
                          <p className="text-[11px] text-ink-3 mb-3">{kpi.subtitle}</p>
                        )}

                        <div className="flex items-baseline gap-3 my-2">
                          <span className="text-2xl font-bold font-mono tracking-tight text-ink">
                            {kpi.displayValue || '—'}
                          </span>
                          {kpi.growth !== undefined && (
                            <div
                              className={`flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                                isPositive
                                  ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400'
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>
                                {isPositive ? '+' : ''}
                                {kpi.growth}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer con Tabla Origen y Acciones */}
                      <div className="pt-3 border-t border-line/60 flex items-center justify-between gap-2 mt-2">
                        {kpi.sourceTable ? (
                          <button
                            type="button"
                            onClick={() => onOpenTable(kpi.sourceTable!.tableId || kpi.sourceTable!.code)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono font-medium bg-surface-sunken hover:bg-blue-50 hover:text-blue-700 text-ink-2 border border-line transition-all group/tbl"
                            title={`Ir a tabla origen ${kpi.sourceTable.name}`}
                          >
                            <TableIcon className="w-3 h-3 text-accent shrink-0" />
                            <span className="font-bold">{kpi.sourceTable.code}</span>
                            <span className="truncate max-w-[120px]">· {kpi.sourceTable.name}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 text-ink-3 group-hover/tbl:text-accent" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-ink-3 italic">Sin tabla asignada</span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onInspectKpi ? onInspectKpi(kpi.code) : null}
                            className="px-2 py-1 rounded text-[11px] font-semibold text-[#1D5BD8] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                            title="Inspeccionar Receta de Construcción"
                          >
                            <span>🔍 Receta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDashboard(kpi.dashboardId || kpi.dashboardCode)}
                            className="p-1 rounded text-ink-3 hover:text-accent hover:bg-surface-sunken transition-colors"
                            title="Ver en Dashboard"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: 02 GRÁFICOS (G...) */}
        {currentTab === 'charts' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink">Catálogo de Gráficos Analíticos (G001 - G999)</h2>
            {filteredCharts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-line p-6">
                <BarChart2 className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-ink-3">No hay gráficos registrados en este módulo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCharts.map((ch) => (
                  <div
                    key={ch.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-line p-5 shadow-2xs hover:shadow-md hover:border-accent transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300">
                          {ch.code}
                        </span>
                        <span className="text-[10px] font-mono text-ink-3 uppercase">
                          {ch.chartType}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-ink mb-2">{ch.name}</h3>
                    </div>

                    <div className="pt-3 border-t border-line/60 flex items-center justify-between gap-2 mt-4">
                      {ch.sourceTable ? (
                        <button
                          type="button"
                          onClick={() => onOpenTable(ch.sourceTable!.tableId || ch.sourceTable!.code)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono font-medium bg-surface-sunken hover:bg-blue-50 hover:text-blue-700 text-ink-2 border border-line transition-all group/tbl"
                        >
                          <TableIcon className="w-3 h-3 text-accent shrink-0" />
                          <span className="font-bold">{ch.sourceTable.code}</span>
                          <span className="truncate max-w-[120px]">· {ch.sourceTable.name}</span>
                          <ArrowUpRight className="w-2.5 h-2.5 text-ink-3 group-hover/tbl:text-accent" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink-3 italic">Dataset agregado</span>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenDashboard(ch.dashboardId || ch.dashboardCode)}
                        className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>Ver en {ch.dashboardCode}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: 03 TABLAS (T...) */}
        {currentTab === 'tables' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink">Tablas de Datos Fuente (T001 - T999)</h2>
            {filteredTables.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-line p-6">
                <TableIcon className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-ink-3">No hay tablas registradas en este módulo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTables.map((tbl) => {
                  const tableIdentifier = tbl.legacyId ? String(tbl.legacyId) : tbl.id;
                  const displayCode = tbl.legacyId ? `T0${tbl.legacyId}`.slice(-4) : 'Txxx';
                  return (
                    <div
                      key={tbl.id}
                      onClick={() => onOpenTable(tableIdentifier)}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-line p-5 shadow-2xs hover:shadow-md hover:border-accent cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200">
                            {displayCode}
                          </span>
                          <TableIcon className="w-4 h-4 text-accent opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-xs font-bold text-ink group-hover:text-accent transition-colors mb-1">
                          {tbl.name}
                        </h3>
                        {tbl.description && (
                          <p className="text-[11px] text-ink-3 line-clamp-2">{tbl.description}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-ink-3 mt-4">
                        <span className="font-mono text-[11px]">Abrir tabla</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-accent" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: 05 DASHBOARDS (D...) */}
        {currentTab === 'dashboards' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink">Tableros Ejecutivos Consolidados (D001 - D999)</h2>
            {filteredDashboards.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-line p-6">
                <LayoutDashboard className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-ink-3">No hay dashboards vinculados a este módulo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDashboards.map((dash) => (
                  <div
                    key={dash.id}
                    onClick={() => onOpenDashboard(dash.id || dash.code)}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-line p-5 shadow-2xs hover:shadow-md hover:border-accent cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200">
                          {dash.code}
                        </span>
                        <LayoutDashboard className="w-4 h-4 text-rose-600 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-xs font-bold text-ink group-hover:text-accent transition-colors mb-1">
                        {dash.name}
                      </h3>
                      {dash.description && (
                        <p className="text-[11px] text-ink-3 line-clamp-2">{dash.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-ink-3 mt-4">
                      <span className="font-mono text-[11px]">Abrir dashboard</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-accent" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
