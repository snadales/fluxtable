'use client';

import React, { useEffect, useState } from 'react';
import { 
  Printer, Maximize2, Minimize2, Clock, Filter, X, Plus, 
  RotateCcw, Sparkles, AlertCircle, LayoutDashboard, Share2, Link2, Check
} from 'lucide-react';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';
import { TimeRangePicker } from './time-range-picker';
import { BiCardRenderer } from './bi-card-renderer';
import { ShareDashboardDialog } from './share-dashboard-dialog';
import {
  DashboardCapabilities,
  SHARE_ROLE_LABELS,
  buildDashboardLink,
  isShareRole,
} from '@/lib/auth/dashboard-permissions';

// Si el servidor no envía capacidades (versión anterior de la API), se asume el comportamiento de siempre.
const LEGACY_ACCESS: DashboardCapabilities = {
  effectiveRole: 'miembro',
  shareRole: null,
  canView: true,
  canEdit: true,
  canDelete: true,
  canShare: false,
  canManageShares: false,
  grantableRoles: [],
};

interface DashboardViewProps {
  onNewCard?: () => void;
  onNavigateToTable?: (tableId: string) => void;
  onInspectKpi?: (kpiCode: string) => void;
  currentUser?: { id?: string; email?: string } | null;
}

export function DashboardView({ onNewCard, onNavigateToTable, onInspectKpi, currentUser }: DashboardViewProps) {
  const {
    activeDashboard,
    activeTabId,
    setActiveTab,
    activeTimeRange,
    setTimeRange,
    crossFilters,
    clearCrossFilter,
    clearAllCrossFilters,
    isKioskMode,
    toggleKioskMode,
    autoRefreshSeconds,
    setAutoRefresh,
    refreshActiveDashboard,
    isLoading,
  } = useDashboardStore();

  const [countdown, setCountdown] = useState(autoRefreshSeconds);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Auto-refresco periódico
  useEffect(() => {
    if (autoRefreshSeconds <= 0) return;
    setCountdown(autoRefreshSeconds);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshActiveDashboard();
          return autoRefreshSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshSeconds, activeDashboard?.id]);

  if (!activeDashboard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <LayoutDashboard className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-semibold text-slate-700">Ningún Dashboard Seleccionado</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Selecciona un dashboard en la barra lateral o crea uno nuevo para visualizar KPIs y reportes analíticos.
        </p>
      </div>
    );
  }

  const access: DashboardCapabilities = { ...LEGACY_ACCESS, ...(activeDashboard.access || {}) };
  const canEdit = access.canEdit !== false;
  const addCard = canEdit ? onNewCard : undefined;
  const roleBadge = isShareRole(access.effectiveRole) ? SHARE_ROLE_LABELS[access.effectiveRole] : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildDashboardLink(window.location.origin, activeDashboard.code));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* sin portapapeles: no se muestra confirmación */
    }
  };

  // Filtrar tarjetas por pestaña activa si hay pestañas definidas
  const visibleCards = (activeDashboard.cards || []).filter((c: any) => {
    if (!activeTabId) return true;
    return !c.tabId || c.tabId === activeTabId;
  });

  const crossFilterEntries = Object.entries(crossFilters);

  return (
    <div className={`flex-1 flex flex-col h-full bg-slate-100/60 dark:bg-slate-950 overflow-hidden ${
      isKioskMode ? 'fixed inset-0 z-50 bg-white' : ''
    }`}>
      {/* 1. Barra de Herramientas Superior */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
            {activeDashboard.code}
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-2 flex-wrap">
              {activeDashboard.name}
              {roleBadge && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {roleBadge}
                </span>
              )}
            </h1>
            {activeDashboard.description && (
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {activeDashboard.description}
              </p>
            )}
          </div>
        </div>

        {/* Acciones y Controles Globales */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Rango Temporal */}
          <TimeRangePicker value={activeTimeRange} onChange={setTimeRange} />

          {/* Auto-Refresh Timer Selector */}
          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={autoRefreshSeconds}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={0}>Auto-refresh: Off</option>
              <option value={30}>Auto-refresh: 30s</option>
              <option value={60}>Auto-refresh: 1m</option>
              <option value={300}>Auto-refresh: 5m</option>
            </select>
            {autoRefreshSeconds > 0 && (
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1 rounded">
                {countdown}s
              </span>
            )}
          </div>

          {/* Botón Imprimir / Exportar PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="Exportar a PDF (Imprimir)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Modo Kiosko / Pantalla Completa */}
          <button
            type="button"
            onClick={toggleKioskMode}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title={isKioskMode ? 'Salir de modo kiosko' : 'Modo Kiosko pantalla completa'}
          >
            {isKioskMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Compartir (#54) o, si no puede compartir, solo copiar el enlace */}
          {access.canShare ? (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="dialog"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Compartir</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Link2 className="w-3.5 h-3.5" aria-hidden="true" />}
              <span aria-live="polite">{linkCopied ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </button>
          )}

          {/* Nueva Tarjeta (oculta a lectores y colaboradores) */}
          {addCard && (
            <button
              type="button"
              onClick={addCard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Tarjeta</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Barra de Pestañas y Filtros Cruzados Activos */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Pestañas (Tabs) */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {activeDashboard.tabs && activeDashboard.tabs.length > 0 && (
            activeDashboard.tabs.map((tab: any) => {
              const isSelected = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.name}
                </button>
              );
            })
          )}
        </div>

        {/* Badges de Filtros Cruzados Activos */}
        {crossFilterEntries.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-600" />
              Filtrado por:
            </span>
            {crossFilterEntries.map(([key, filter]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                <span>{filter.label}</span>
                <button
                  type="button"
                  onClick={() => clearCrossFilter(key)}
                  className="hover:text-blue-900 focus:outline-none"
                  title="Quitar filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllCrossFilters}
              className="text-[11px] text-slate-500 hover:text-slate-700 underline ml-1"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* 3. Rejilla de Tarjetas (Cards Grid) */}
      <main className="flex-1 overflow-y-auto p-4">
        {visibleCards.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 dark:border-slate-700 rounded-xl border border-dashed border-slate-300 p-6">
            <Sparkles className="w-8 h-8 text-blue-500 mb-2" />
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Esta pestaña no tiene tarjetas</h4>
            {addCard && (
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Agrega una tarjeta KPI, gráfico o tabla para visualizar métricas en tiempo real.
              </p>
            )}
            {addCard && (
              <button
                type="button"
                onClick={addCard}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                + Crear primera tarjeta
              </button>
            )}
          </div>
        )}

        {visibleCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {visibleCards.map((card: any) => {
              const width = card.gridPosJson?.w || 6;
              let colSpan = 'lg:col-span-6';
              if (width >= 12) colSpan = 'lg:col-span-12';
              else if (width >= 8) colSpan = 'lg:col-span-8';
              else if (width === 4) colSpan = 'lg:col-span-4';
              else if (width <= 3) colSpan = 'lg:col-span-3';

              return (
                <div key={card.id} className={`${colSpan} min-h-[220px]`}>
                  <BiCardRenderer 
                    card={card} 
                    onNavigateToTable={onNavigateToTable} 
                    onInspectKpi={onInspectKpi}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {access.canShare && (
        <ShareDashboardDialog
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          dashboard={{ id: activeDashboard.id, code: activeDashboard.code, name: activeDashboard.name }}
          access={access}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
