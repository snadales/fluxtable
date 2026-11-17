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
  BarChart3,
  Layers,
  FileCode,
  Edit3,
  Copy,
  Camera,
  Lock,
  X
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
  tablesList: Array<{ id: string; name: string; icon?: string; legacyId?: number | null }>;
  rowCount: number;
  onSelectWorkspace: (wsId: string) => void;
  onSelectBase: (baseId: string) => void;
  onSelectTable: (tableId: string) => void;
  onSelectDashboard?: (dashboardCodeOrId: string) => void;
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
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onToggle,
  workspaces,
  currentWorkspaceId,
  currentBaseId,
  currentTableId,
  tablesList,
  rowCount,
  onSelectWorkspace,
  onSelectBase,
  onSelectTable,
  onSelectDashboard,
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
      {/* 1. Header con Selector de Workspace y Botón Colapsar */}
      <div className="h-12 border-b border-line px-3 flex items-center justify-between shrink-0 bg-surface">
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
          onClick={onOpenAnalytics}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-accent transition-colors text-left font-semibold border border-blue-200/60"
          title="Ver Dashboards & Analítica de Negocios y Homelab"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-accent" />
            <span>Dashboards & Analítica</span>
          </div>
          <span className="text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            BI
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenWorkspaces}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-sunken hover:text-ink transition-colors text-left"
        >
          <Clock className="w-3.5 h-3.5 text-ink-3" />
          <span>Recents</span>
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

      {/* 4. Sección de Bases de Datos con Árbol Expandible */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">
          <span>Bases de datos</span>
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
                  {/* Nodo Padre: Base de Datos */}
                  <div
                    className={`group relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isCurrentBase
                        ? 'bg-accent/10 text-accent font-bold'
                        : 'text-ink hover:bg-surface-sunken'
                    }`}
                    onClick={() => onSelectBase(b.id)}
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
                      <Database className="w-3.5 h-3.5 text-ink-2 shrink-0" />
                      <span className="truncate">{b.name}</span>
                    </div>

                    {/* Botón 3 puntos de la Base */}
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

                  {/* Hijos de la Base: Tablas si está expandida */}
                  {isExpanded && (
                    <div className="pl-6 space-y-0.5 border-l border-line/60 ml-3">
                      {isCurrentBase && tablesList.length > 0 ? (
                        tablesList.map((t) => {
                          const tableIdentifier = t.legacyId ? String(t.legacyId) : t.id;
                          const isTableActive = currentTableId === tableIdentifier || currentTableId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onSelectTable(tableIdentifier)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                                isTableActive
                                  ? 'bg-surface-sunken font-bold text-accent'
                                  : 'text-ink-2 hover:text-ink hover:bg-surface-sunken/60 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <TableIcon className="w-3 h-3 text-ink-3 shrink-0" />
                                <span className="truncate">{t.name}</span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-2 py-1 text-[11px] text-ink-3 italic">
                          Sin tablas cargadas
                        </div>
                      )}

                      {/* Botón "+ Nueva mesa" (Print 4) */}
                      {isCurrentBase && (
                        <button
                          type="button"
                          onClick={onCreateTable}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-ink-3 hover:text-accent hover:bg-surface-sunken transition-colors text-left font-medium"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nueva mesa</span>
                        </button>
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
