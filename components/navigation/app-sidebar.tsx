'use client';

import React, { useState } from 'react';
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Clock,
  Bell,
  Users,
  UserPlus,
  HelpCircle,
  ShieldCheck,
  Trash2,
  Plus,
  Table as TableIcon,
  RotateCcw,
  RotateCw,
  Folder,
  FolderPlus,
  BarChart3,
  Layers,
  FileCode,
  Edit3,
  Copy,
  Camera,
  Lock,
  X,
  ArrowUpRight
} from 'lucide-react';
import { FluxTableLogo, YarkenSymbol } from '@/components/brand/yarken-logo';
import { WorkspaceGroup, BaseItem } from '@/components/workspaces/workspaces-dashboard';

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  workspaces: WorkspaceGroup[];
  currentWorkspaceId?: string;
  currentBaseId?: string;
  currentTableId?: string;
  currentViewMode?: 'workspaces' | 'database' | 'analytics' | 'catalog';
  tablesList: Array<{ id: string; name: string; icon?: string; legacyId?: number | null }>;
  rowCount: number;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onOpenUserMenu?: () => void;
  onSelectWorkspace: (wsId: string) => void;
  onSelectBase: (baseId: string) => void;
  onSelectTable: (tableId: string) => void;
  onSelectDashboard?: (dashboardCodeOrId: string) => void;
  onOpenCatalog?: (base: BaseItem, defaultTab?: 'indicators' | 'charts' | 'tables' | 'dashboards') => void;
  onInspectKpi?: (kpiCode: string) => void;
  onOpenWorkspaces: () => void;
  onOpenAnalytics: () => void;
  onOpenTrash: () => void;
  onOpenAudit: () => void;
  onOpenMembers: () => void;
  onOpenApiDocs?: (baseId: string) => void;
  onOpenSnapshots?: (baseId: string) => void;
  onRenameBase?: (baseId: string, currentName: string) => void;
  onDuplicateBase?: (baseId: string) => void;
  onDeleteBase?: (baseId: string) => void;
  onCreateTable: () => void;
  onCreateBase: () => void;
  onCreateSubfolder?: (baseId: string, baseName: string, parentFolderId?: string | null) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onToggle,
  workspaces,
  currentWorkspaceId,
  currentBaseId,
  currentTableId,
  currentViewMode,
  tablesList,
  rowCount,
  user,
  onOpenUserMenu,
  onSelectWorkspace,
  onSelectBase,
  onSelectTable,
  onSelectDashboard,
  onOpenCatalog,
  onInspectKpi,
  onOpenWorkspaces,
  onOpenAnalytics,
  onOpenTrash,
  onOpenAudit,
  onOpenMembers,
  onOpenApiDocs,
  onOpenSnapshots,
  onRenameBase,
  onDuplicateBase,
  onDeleteBase,
  onCreateTable,
  onCreateBase,
  onCreateSubfolder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBases, setExpandedBases] = useState<Record<string, boolean>>({
    [currentBaseId || '']: true,
  });
  const [activeMenuBaseId, setActiveMenuBaseId] = useState<string | null>(null);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  // Determinar workspace actual
  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];

  const toggleBaseExpand = (baseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBases((prev) => ({
      ...prev,
      [baseId]: !prev[baseId],
    }));
  };

  if (!isOpen) {
    return (
      <aside className="w-12 border-r border-line bg-surface flex flex-col items-center py-3 justify-between shrink-0 select-none transition-all duration-200">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
            title="Expandir barra lateral"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenWorkspaces}
            className="w-7 h-7 rounded-lg bg-accent text-white font-bold text-xs flex items-center justify-center hover:opacity-90 shadow-2xs"
            title="Ir a Workspaces"
          >
            {currentWorkspace?.name ? currentWorkspace.name.slice(0, 1).toUpperCase() : 'Y'}
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="p-1.5 rounded-lg text-ink-3 hover:text-accent hover:bg-surface-sunken transition-colors"
            title="Dashboards & Analítica"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-line bg-surface flex flex-col h-full shrink-0 select-none transition-all duration-200 z-20">
      {/* 1. Header con Selector de Workspace, Usuario y Botón Colapsar */}
      <div className="border-b border-line p-2.5 space-y-2 shrink-0 bg-surface">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 mr-2">
            <button
              type="button"
              onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-sunken transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {currentWorkspace?.name ? currentWorkspace.name.slice(0, 1).toUpperCase() : 'N'}
                </div>
                <span className="font-bold text-xs text-ink truncate">
                  {currentWorkspace?.name || 'Negocios'}
                </span>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-ink-3 shrink-0" />
            </button>

            {/* Menú Dropdown de Workspaces */}
            {isWorkspaceDropdownOpen && (
              <div className="absolute top-11 left-0 w-64 bg-surface border border-line rounded-2xl shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-ink-3">
                  Espacios de trabajo
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-surface-sunken transition-colors ${
                      ws.id === currentWorkspace?.id ? 'font-bold text-accent bg-accent/5' : 'text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded-md bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center">
                        {ws.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    <span className="text-[10px] text-ink-3 font-mono">
                      {ws.itemsCount || ws.bases?.length || 0}
                    </span>
                  </button>
                ))}
                <div className="h-px bg-line my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceDropdownOpen(false);
                    onOpenWorkspaces();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-surface-sunken text-left"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Ver todos los espacios</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
            title="Ocultar barra lateral"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* User selector Header integrado */}
        {user && (
          <button
            type="button"
            onClick={onOpenUserMenu}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-surface-sunken transition-colors text-left group border border-line/50 bg-surface-sunken/30"
            title="Menú y configuración de usuario"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-lg bg-accent text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate min-w-0">
                <div className="font-semibold text-xs text-ink truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-ink-3 truncate leading-tight">
                  {user.email}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-3 group-hover:text-ink shrink-0" />
          </button>
        )}
      </div>

      {/* 2. Barra de Búsqueda Rápida */}
      <div className="p-2.5 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-8 pr-9 py-1.5 rounded-xl border border-line bg-surface-sunken/60 text-xs font-medium text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:bg-surface transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-ink-3 px-1 py-0.5 rounded border border-line bg-surface">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 3. Navegación del Sistema (Print 4) */}
      <div className="px-2 py-1 space-y-0.5 shrink-0 text-xs text-ink-2 font-medium">
        <button
          type="button"
          onClick={onOpenWorkspaces}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left font-semibold ${
            currentViewMode === 'workspaces'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 text-accent border border-blue-200/70 shadow-2xs'
              : 'hover:bg-surface-sunken hover:text-ink'
          }`}
          title="Ver todos los Espacios de Trabajo"
        >
          <div className="flex items-center gap-2">
            <Folder className={`w-3.5 h-3.5 ${currentViewMode === 'workspaces' ? 'text-accent' : 'text-ink-3'}`} />
            <span>Espacios de Trabajo</span>
          </div>
          <span className={`text-[10px] font-mono font-bold ${currentViewMode === 'workspaces' ? 'text-accent' : 'text-ink-3'}`}>
            {workspaces.length}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenWorkspaces}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
        >
          <Clock className="w-3.5 h-3.5 text-ink-3" />
          <span>Recientes</span>
        </button>

        <button
          type="button"
          onClick={() => {}}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-ink-3" />
            <span>Notificaciones</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenMembers}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-ink-3" />
            <span>Miembros</span>
          </div>
          <span className="text-[10px] font-mono text-ink-3 bg-surface-sunken px-1.5 py-0.2 rounded-full">
            {currentWorkspace?.membersCount || 2}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenMembers}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
        >
          <UserPlus className="w-3.5 h-3.5 text-ink-3" />
          <span>Invitar a otros</span>
        </button>

        <button
          type="button"
          onClick={onOpenAudit}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
          title="Ver registro de auditoría de agentes y usuarios"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-ink-3" />
          <span>Registro de auditoría</span>
        </button>

        <button
          type="button"
          onClick={onOpenTrash}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
        >
          <Trash2 className="w-3.5 h-3.5 text-ink-3" />
          <span>Papelera</span>
        </button>
      </div>

      <div className="h-px bg-line mx-3 my-2" />

      {/* 4. Sección de Carpetas y Módulos de Negocio con Árbol Expandible */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">
          <span>Carpetas y Módulos</span>
          <button
            type="button"
            onClick={onCreateBase}
            className="p-1 rounded-md hover:bg-surface-sunken text-ink-3 hover:text-accent transition-colors"
            title="Crear nueva base de datos"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista en Árbol */}
        {currentWorkspace?.bases && currentWorkspace.bases.length > 0 ? (
          currentWorkspace.bases
            .filter((b) => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((b) => {
              const isDashboard = b.type === 'dashboard' || b.icon === 'chart' || b.name.startsWith('D00');
              const isCurrentBase = b.id === currentBaseId;
              const isExpanded = !!expandedBases[b.id] || isCurrentBase;

              if (isDashboard) {
                return (
                  <div
                    key={b.id}
                    className="group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all text-ink hover:bg-surface-sunken"
                    onClick={() => {
                      if (onSelectDashboard) onSelectDashboard(b.id);
                      else onOpenAnalytics();
                    }}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      <BarChart3 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{b.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                      Dashboard
                    </span>
                  </div>
                );
              }

              return (
                <div key={b.id} className="space-y-0.5">
                  {/* Nodo Padre: Base de Datos / Módulo */}
                  <div
                    className={`group relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isCurrentBase
                        ? 'bg-accent/10 text-accent font-bold'
                        : 'text-ink hover:bg-surface-sunken'
                    }`}
                    onClick={() => {
                      if (onOpenCatalog && b.subfolders) {
                        onOpenCatalog(b, 'tables');
                      } else {
                        onSelectBase(b.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => toggleBaseExpand(b.id, e)}
                        className="p-0.5 rounded text-ink-3 hover:text-ink transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      <Folder className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{b.name}</span>
                    </div>

                    {/* Botón 3 puntos del Módulo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuBaseId(activeMenuBaseId === b.id ? null : b.id);
                      }}
                      className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-sunken opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* Menú Contextual de 3 puntos (Print 2) */}
                    {activeMenuBaseId === b.id && (
                      <div
                        className="absolute right-0 top-8 w-56 bg-surface border border-line rounded-2xl shadow-xl py-2 z-50 text-xs font-medium text-ink"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1.5 text-[11px] font-bold text-ink-3 border-b border-line truncate">
                          {b.name} ({b.tablesCount || tablesList.length || 0})
                        </div>

                        {/* Acción para crear Subcarpeta en este módulo */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onCreateSubfolder?.(b.id, b.name);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left text-accent font-semibold"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-accent" />
                          <span>+ Nueva Subcarpeta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onOpenMembers();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-sunken text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-ink-2" />
                            <span>Gestionar miembros</span>
                          </div>
                          <Lock className="w-3 h-3 text-accent" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onOpenApiDocs?.(b.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                        >
                          <FileCode className="w-3.5 h-3.5 text-ink-2" />
                          <span>Ver documentos API</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onRenameBase?.(b.id, b.name);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-ink-2" />
                          <span>Renombrar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onDuplicateBase?.(b.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                        >
                          <Copy className="w-3.5 h-3.5 text-ink-2" />
                          <span>Duplicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onOpenSnapshots?.(b.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                        >
                          <Camera className="w-3.5 h-3.5 text-ink-2" />
                          <span>Instantáneas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onOpenTrash();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-ink-2" />
                          <span>Ver basura</span>
                        </button>

                        <div className="h-px bg-line my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuBaseId(null);
                            onDeleteBase?.(b.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-danger-tint text-danger text-left font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hijos de la Base: Subcarpetas Estándar Metabase §1b */}
                  {isExpanded && (
                    <div className="pl-5 space-y-1.5 border-l border-line/60 ml-3 py-1">
                      {/* Subcarpeta 01 Indicadores (K...) */}
                      {b.subfolders?.indicators && b.subfolders.indicators.length > 0 && (
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => onOpenCatalog ? onOpenCatalog(b, 'indicators') : null}
                            className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-ink-2 hover:text-accent hover:bg-surface-sunken transition-colors font-semibold"
                            title="Explorar Indicadores (K)"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Folder className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate">01 Indicadores</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              {b.subfolders.indicators.length}
                            </span>
                          </button>
                          <div className="pl-3 space-y-0.5">
                            {b.subfolders.indicators.map((k: any) => (
                              <button
                                key={k.id}
                                type="button"
                                onClick={() => onInspectKpi ? onInspectKpi(k.code) : onOpenCatalog ? onOpenCatalog(b, 'indicators') : null}
                                className="w-full flex items-center justify-between px-2 py-0.5 rounded text-[10px] text-ink-3 hover:text-ink hover:bg-surface-sunken/60 truncate cursor-pointer group/k"
                                title={`Ver Receta Técnica de Construcción de ${k.code} (SQL, Umbrales y Linaje)`}
                              >
                                <span className="font-mono text-blue-700 font-bold group-hover/k:underline">{k.code}</span>
                                <span className="truncate max-w-[100px] text-left">{k.name}</span>
                                <span className="font-mono font-semibold text-ink">{k.displayValue}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subcarpeta 02 Gráficos (G...) */}
                      {b.subfolders?.charts && b.subfolders.charts.length > 0 && (
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => onOpenCatalog ? onOpenCatalog(b, 'charts') : null}
                            className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-ink-2 hover:text-accent hover:bg-surface-sunken transition-colors font-semibold"
                            title="Explorar Gráficos (G)"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Folder className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">02 Gráficos</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.subfolders.charts.length}
                            </span>
                          </button>
                          <div className="pl-3 space-y-0.5">
                            {b.subfolders.charts.map((g: any) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => onOpenCatalog ? onOpenCatalog(b, 'charts') : null}
                                className="w-full flex items-center justify-between px-2 py-0.5 rounded text-[10px] text-ink-3 hover:text-ink hover:bg-surface-sunken/60 truncate"
                              >
                                <span className="font-mono text-emerald-700 font-bold">{g.code}</span>
                                <span className="truncate max-w-[120px] text-left">{g.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subcarpeta 03 Tablas (T...) */}
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => onOpenCatalog ? onOpenCatalog(b, 'tables') : null}
                          className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-ink-2 hover:text-accent hover:bg-surface-sunken transition-colors font-semibold"
                          title="Explorar Tablas (T)"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Folder className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">03 Tablas</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                            {b.subfolders?.tables?.length || (isCurrentBase ? tablesList.length : 0)}
                          </span>
                        </button>
                        <div className="pl-3 space-y-0.5">
                          {(b.subfolders?.tables || (isCurrentBase ? tablesList : [])).map((t: any) => {
                            const tableIdentifier = t.legacyId ? String(t.legacyId) : t.id;
                            const isTableActive = currentTableId === tableIdentifier || currentTableId === t.id;
                            const displayCode = t.legacyId ? `T0${t.legacyId}`.slice(-4) : 'Txxx';
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => onSelectTable(tableIdentifier)}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors text-left ${
                                  isTableActive
                                    ? 'bg-surface-sunken font-bold text-accent'
                                    : 'text-ink-2 hover:text-ink hover:bg-surface-sunken/60 font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-mono text-[9px] text-blue-700 font-bold shrink-0">{displayCode}</span>
                                  <span className="truncate">{t.name}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subcarpeta 05 Dashboards (D...) */}
                      {b.subfolders?.dashboards && b.subfolders.dashboards.length > 0 && (
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => onOpenCatalog ? onOpenCatalog(b, 'dashboards') : null}
                            className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-ink-2 hover:text-accent hover:bg-surface-sunken transition-colors font-semibold"
                            title="Explorar Dashboards (D)"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <BarChart3 className="w-3 h-3 text-rose-600 shrink-0" />
                              <span className="truncate">05 Dashboards</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-50 text-rose-700 border border-rose-200">
                              {b.subfolders.dashboards.length}
                            </span>
                          </button>
                          <div className="pl-3 space-y-0.5">
                            {b.subfolders.dashboards.map((d: any) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => onSelectDashboard ? onSelectDashboard(d.id || d.code) : onOpenAnalytics()}
                                className="w-full flex items-center justify-between px-2 py-0.5 rounded text-[11px] text-rose-700 hover:bg-rose-50/60 font-semibold truncate transition-colors"
                              >
                                <span className="font-mono text-[9px] shrink-0">{d.code}</span>
                                <span className="truncate max-w-[110px] text-left">{d.name}</span>
                                <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botones de acción dentro del módulo */}
                      {isCurrentBase && (
                        <div className="pt-1.5 space-y-1">
                          <button
                            type="button"
                            onClick={onCreateTable}
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-ink-3 hover:text-accent hover:bg-surface-sunken transition-colors text-left font-medium"
                          >
                            <Plus className="w-3 h-3 text-accent" />
                            <span>+ Nueva Tabla</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCreateSubfolder?.(b.id, b.name)}
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-ink-3 hover:text-accent hover:bg-surface-sunken transition-colors text-left font-medium"
                          >
                            <FolderPlus className="w-3 h-3 text-accent" />
                            <span>+ Nueva Subcarpeta</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <div className="px-3 py-2 text-xs text-ink-3 italic">
            No hay bases creadas
          </div>
        )}

        {/* Botón "+ Añadir nuevo..." al final */}
        <button
          type="button"
          onClick={onCreateBase}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-ink-3 hover:text-accent hover:bg-surface-sunken transition-colors text-left mt-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir nuevo...</span>
        </button>
      </div>

      {/* 5. Footer con Logo, Deshacer/Rehacer y Contador de Filas (Print 4) */}
      <div className="h-11 border-t border-line px-3 flex items-center justify-between shrink-0 bg-surface text-xs text-ink-3">
        <div className="flex items-center gap-2">
          <YarkenSymbol size={18} variant="tile" />
          <span className="font-bold text-ink text-[11px] tracking-tight">FluxTable</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded text-ink-3 hover:text-ink hover:bg-surface-sunken"
              title="Deshacer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded text-ink-3 hover:text-ink hover:bg-surface-sunken"
              title="Rehacer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="font-mono text-[11px] font-semibold text-ink-2">
            {rowCount} filas
          </span>
        </div>
      </div>
    </aside>
  );
};
