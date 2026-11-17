'use client';

import React, { useState } from 'react';
import { 
  Database, LayoutDashboard, Plus, Search, ChevronDown, MoreHorizontal, 
  Settings, Users, Trash2, Clock, FileText, ChevronRight, Check,
  Folder, ShieldCheck, BarChart3, Edit3, Copy, Camera, Download, Upload, LogOut, X,
  Layers, Lock
} from 'lucide-react';
import { FluxTableLogo, YarkenSymbol } from '@/components/brand/yarken-logo';

export interface BaseItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  tablesCount?: number;
  type?: 'database' | 'dashboard';
  viewedAt?: string;
  tables?: Array<{ id: string; name: string; icon?: string }>;
}

export interface WorkspaceGroup {
  id: string;
  name: string;
  slug: string;
  role: string;
  membersCount: number;
  itemsCount: number;
  bases: BaseItem[];
}

interface WorkspacesDashboardProps {
  workspaces: WorkspaceGroup[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  onOpenDatabase: (baseId: string) => void;
  onCreateWorkspace: () => void;
  onCreateDatabase: (workspaceId: string) => void;
  onOpenTrash: () => void;
  onOpenAnalytics?: () => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
  onOpenUserMenu: () => void;
  onOpenApiTokens?: () => void;
  onOpenSnapshots?: (tableOrBaseId?: string) => void;
}

export const WorkspacesDashboard: React.FC<WorkspacesDashboardProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenDatabase,
  onCreateWorkspace,
  onCreateDatabase,
  onOpenTrash,
  onOpenAnalytics,
  user,
  onOpenUserMenu,
  onOpenApiTokens,
  onOpenSnapshots,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'database' | 'dashboard'>('all');
  const [sidebarTab, setSidebarTab] = useState<'all' | 'recent' | 'templates' | 'trash'>('all');
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Record<string, boolean>>({});
  
  // Menús de 3 puntos interactivos
  const [activeBaseMenuId, setActiveBaseMenuId] = useState<string | null>(null);
  const [activeWorkspaceMenuId, setActiveWorkspaceMenuId] = useState<string | null>(null);
  const [expandedBasesInSidebar, setExpandedBasesInSidebar] = useState<Record<string, boolean>>({});

  // Modales interactivos
  const [activeModal, setActiveModal] = useState<'members' | 'settings' | 'rename' | 'apiDocs' | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<{ id: string; name: string; type: 'workspace' | 'base' } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Filtrado de workspaces y bases
  const visibleWorkspaces = workspaces.filter((ws) => {
    if (activeWorkspaceId && ws.id !== activeWorkspaceId) return false;
    return true;
  });

  const toggleCollapse = (wsId: string) => {
    setCollapsedWorkspaces((prev) => ({
      ...prev,
      [wsId]: !prev[wsId],
    }));
  };

  const toggleBaseInSidebar = (baseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBasesInSidebar((prev) => ({
      ...prev,
      [baseId]: !prev[baseId],
    }));
  };

  const getWorkspaceInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || 'W';
  };

  const handleOpenRename = (id: string, name: string, type: 'workspace' | 'base', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTarget({ id, name, type });
    setRenameValue(name);
    setActiveModal('rename');
    setActiveBaseMenuId(null);
    setActiveWorkspaceMenuId(null);
  };

  const handleOpenMembers = (id: string, name: string, type: 'workspace' | 'base', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTarget({ id, name, type });
    setActiveModal('members');
    setActiveBaseMenuId(null);
    setActiveWorkspaceMenuId(null);
  };

  const handleOpenSettings = (id: string, name: string, type: 'workspace' | 'base', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTarget({ id, name, type });
    setActiveModal('settings');
    setActiveBaseMenuId(null);
    setActiveWorkspaceMenuId(null);
  };

  const handleOpenApiDocs = (base: BaseItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTarget({ id: base.id, name: base.name, type: 'base' });
    setActiveBaseMenuId(null);
    if (onOpenApiTokens) {
      onOpenApiTokens();
    } else {
      setActiveModal('apiDocs');
    }
  };

  return (
    <div 
      className="flex h-screen overflow-hidden bg-bg text-ink"
      onClick={() => {
        if (activeBaseMenuId) setActiveBaseMenuId(null);
        if (activeWorkspaceMenuId) setActiveWorkspaceMenuId(null);
      }}
    >
      {/* 1. Left Sidebar Jerárquico en Árbol */}
      <aside className="w-64 border-r border-line bg-surface flex flex-col justify-between shrink-0 shadow-2xs select-none">
        <div className="flex flex-col h-full overflow-hidden">
          {/* User selector Header */}
          <div className="p-3 border-b border-line shrink-0">
            <button
              type="button"
              onClick={onOpenUserMenu}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-sunken transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-xs text-ink truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-ink-3 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-3 group-hover:text-ink shrink-0" />
            </button>
          </div>

          {/* Navigation Items & Explorador en Árbol */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {/* Secciones Globales */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('all');
                  onSelectWorkspace(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                  sidebarTab === 'all' && activeWorkspaceId === null
                    ? 'bg-surface-sunken text-ink font-semibold'
                    : 'text-ink-2 hover:bg-surface-sunken/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-ink-3" />
                  <span>Todos los Workspaces</span>
                </div>
                <span className="text-[10px] font-mono text-ink-3">
                  {workspaces.length}
                </span>
              </button>

              {onOpenAnalytics && (
                <button
                  type="button"
                  onClick={onOpenAnalytics}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left text-accent bg-accent-tint hover:bg-accent-tint/80 font-semibold border border-accent/20"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    <span>Dashboards & Analítica</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-accent text-white rounded">
                    NUEVO
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSidebarTab('recent')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                  sidebarTab === 'recent'
                    ? 'bg-surface-sunken text-ink font-semibold'
                    : 'text-ink-2 hover:bg-surface-sunken/60'
                }`}
              >
                <Clock className="w-4 h-4 text-ink-3" />
                <span>Recientes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab('trash');
                  onOpenTrash();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                  sidebarTab === 'trash'
                    ? 'bg-surface-sunken text-ink font-semibold'
                    : 'text-ink-2 hover:bg-surface-sunken/60'
                }`}
              >
                <Trash2 className="w-4 h-4 text-ink-3" />
                <span>Papelera</span>
              </button>
            </div>

            {/* Árbol Jerárquico de Bases de Datos */}
            <div className="pt-2 border-t border-line space-y-2">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <span>Bases de datos</span>
                <button
                  type="button"
                  onClick={() => {
                    const firstWs = workspaces[0];
                    if (firstWs) onCreateDatabase(firstWs.id);
                  }}
                  className="p-1 rounded hover:bg-surface-sunken text-ink-3 hover:text-ink"
                  title="Nueva base de datos"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                {workspaces.flatMap((w) => w.bases).map((b) => {
                  const isExpanded = !!expandedBasesInSidebar[b.id];
                  return (
                    <div key={b.id} className="space-y-0.5">
                      <div
                        onClick={() => onOpenDatabase(b.id)}
                        className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-sunken cursor-pointer transition-colors text-ink-2 hover:text-ink"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            type="button"
                            onClick={(e) => toggleBaseInSidebar(b.id, e)}
                            className="p-0.5 rounded text-ink-3 hover:text-ink"
                          >
                            <ChevronRight
                              className={`w-3 h-3 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          <Database className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate font-medium">{b.name}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBaseMenuId(activeBaseMenuId === b.id ? null : b.id);
                          }}
                          className="p-1 rounded text-ink-3 opacity-0 group-hover:opacity-100 hover:bg-line transition-all"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sub-ramas del árbol: Tablas */}
                      {isExpanded && (
                        <div className="pl-6 pr-2 py-1 space-y-0.5 border-l border-line ml-3">
                          <div
                            onClick={() => onOpenDatabase(b.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-ink-3 hover:text-ink hover:bg-surface-sunken cursor-pointer font-medium"
                          >
                            <Layers className="w-3 h-3 text-ink-3" />
                            <span>Ver todas las tablas</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer Brand con Sistema Yarken */}
          <div className="p-3 border-t border-line flex items-center justify-between text-xs bg-surface-sunken/40 shrink-0">
            <FluxTableLogo size={22} showWordmark={true} />
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Action Bar */}
        <header className="h-16 border-b border-line bg-surface px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-ink">
              Espacios de Trabajo
            </h1>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-surface-sunken text-ink-2 border border-line">
              {visibleWorkspaces.length} activos
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs w-60">
              <Search className="w-3.5 h-3.5 text-ink-3" />
              <input
                type="text"
                placeholder="Buscar base o tabla..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-ink placeholder:text-ink-3"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-ink outline-none"
            >
              <option value="all">Todos los elementos</option>
              <option value="database">Bases de datos</option>
              <option value="dashboard">Dashboards & Analítica</option>
            </select>

            {/* Create Workspace Button */}
            <button
              type="button"
              onClick={onCreateWorkspace}
              className="px-3 py-1.5 bg-accent hover:bg-accent-strong text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear workspace</span>
            </button>
          </div>
        </header>

        {/* Workspaces Scrollable List */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {visibleWorkspaces.map((ws) => {
            const isCollapsed = !!collapsedWorkspaces[ws.id];
            const filteredBases = ws.bases.filter((b) => {
              const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesType =
                filterType === 'all' ||
                (filterType === 'database' && b.type !== 'dashboard') ||
                (filterType === 'dashboard' && b.type === 'dashboard');
              return matchesSearch && matchesType;
            });

            return (
              <div
                key={ws.id}
                className="border border-line rounded-2xl bg-surface shadow-2xs overflow-hidden"
              >
                {/* Workspace Header Banner */}
                <div className="p-4 px-6 border-b border-line flex items-center justify-between bg-surface-sunken/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {getWorkspaceInitial(ws.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">
                          {ws.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface text-ink-2 border border-line">
                          {ws.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-3">
                        {ws.membersCount} miembro{ws.membersCount !== 1 ? 's' : ''} • {ws.bases.length} bases
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 relative">
                    <button
                      type="button"
                      onClick={() => onCreateDatabase(ws.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface border border-line text-ink hover:bg-surface-sunken flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenMembers(ws.id, ws.name, 'workspace', e)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface border border-line text-ink hover:bg-surface-sunken shadow-2xs transition-colors"
                    >
                      Miembros
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenSettings(ws.id, ws.name, 'workspace', e)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface border border-line text-ink hover:bg-surface-sunken shadow-2xs transition-colors"
                    >
                      Ajustes
                    </button>

                    {/* Menú de 3 puntos del Workspace (Print 8) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWorkspaceMenuId(activeWorkspaceMenuId === ws.id ? null : ws.id);
                      }}
                      className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeWorkspaceMenuId === ws.id && (
                      <div 
                        className="absolute right-8 top-8 w-56 bg-surface border border-line rounded-xl shadow-lg z-50 py-1.5 text-xs text-ink animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1 font-semibold text-ink-3 text-[10px] uppercase tracking-wider border-b border-line mb-1">
                          {ws.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Exportando esquema y datos del workspace a JSON...');
                            setActiveWorkspaceMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                        >
                          <Download className="w-3.5 h-3.5 text-ink-3" />
                          <span>Exportar datos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Seleccione archivo JSON/CSV para importar...');
                            setActiveWorkspaceMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                        >
                          <Upload className="w-3.5 h-3.5 text-ink-3" />
                          <span>Importar datos</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenRename(ws.id, ws.name, 'workspace', e)}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-ink-3" />
                          <span>Renombrar espacio</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenSettings(ws.id, ws.name, 'workspace', e)}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                        >
                          <Settings className="w-3.5 h-3.5 text-ink-3" />
                          <span>Ajustes</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenMembers(ws.id, ws.name, 'workspace', e)}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                        >
                          <Users className="w-3.5 h-3.5 text-ink-3" />
                          <span>Miembros</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenTrash();
                            setActiveWorkspaceMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left border-t border-line mt-1 pt-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-ink-3" />
                          <span>Ver papelera</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleCollapse(ws.id)}
                      className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Databases Grid Inside Workspace */}
                {!isCollapsed && (
                  <div className="p-6">
                    {filteredBases.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBases.map((b) => {
                          const isDashboard = b.type === 'dashboard';
                          return (
                            <div
                              key={b.id}
                              onClick={() => onOpenDatabase(b.id)}
                              className="group p-4 rounded-xl border border-line bg-surface hover:border-accent hover:shadow-md cursor-pointer transition-all flex items-start justify-between gap-3 relative"
                            >
                              <div className="flex items-start gap-3 truncate">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                    isDashboard
                                      ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-900'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900'
                                  }`}
                                >
                                  {isDashboard ? (
                                    <LayoutDashboard className="w-5 h-5" />
                                  ) : (
                                    <Database className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="font-semibold text-xs text-ink group-hover:text-accent transition-colors truncate">
                                    {b.name}
                                  </div>
                                  <div className="text-[11px] text-ink-3 truncate">
                                    {isDashboard ? 'Dashboard' : 'Base de datos'} • {b.viewedAt || 'Reciente'}
                                  </div>
                                </div>
                              </div>

                              {/* Botón de 3 puntos en Base (Print 3) */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveBaseMenuId(activeBaseMenuId === b.id ? null : b.id);
                                  }}
                                  className="text-ink-3 hover:text-ink p-1 opacity-0 group-hover:opacity-100 hover:bg-surface-sunken rounded-lg transition-all"
                                  title="Opciones de la base"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {activeBaseMenuId === b.id && (
                                  <div 
                                    className="absolute right-0 top-6 w-52 bg-surface border border-line rounded-xl shadow-xl z-50 py-1.5 text-xs text-ink animate-in fade-in zoom-in-95 duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="px-3 py-1 font-semibold text-ink-3 text-[10px] uppercase tracking-wider border-b border-line mb-1 truncate">
                                      {b.name}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenMembers(b.id, b.name, 'base', e)}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                                    >
                                      <Users className="w-3.5 h-3.5 text-ink-3" />
                                      <span>Gestionar miembros</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenApiDocs(b, e)}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-ink-3" />
                                      <span>Ver documentos API</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenRename(b.id, b.name, 'base', e)}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-ink-3" />
                                      <span>Renombrar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert(`Base "${b.name}" duplicada exitosamente.`);
                                        setActiveBaseMenuId(null);
                                      }}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-ink-3" />
                                      <span>Duplicar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveBaseMenuId(null);
                                        if (onOpenSnapshots) onOpenSnapshots(b.id);
                                      }}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-ink-3" />
                                      <span>Instantáneas</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenTrash();
                                        setActiveBaseMenuId(null);
                                      }}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-surface-sunken text-left border-t border-line mt-1 pt-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-ink-3" />
                                      <span>Ver basura</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`¿Estás seguro de que deseas borrar "${b.name}"?`)) {
                                          alert('Base de datos enviada a la papelera.');
                                        }
                                        setActiveBaseMenuId(null);
                                      }}
                                      className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-error-tint text-error text-left"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-error" />
                                      <span>Borrar</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-ink-3 text-xs">
                        No hay aplicaciones creadas en este workspace todavía.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal Genérico de Miembros */}
      {activeModal === 'members' && selectedTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm text-ink">
                  Miembros de {selectedTarget.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-sunken">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent text-white font-bold flex items-center justify-center">
                    SN
                  </div>
                  <div>
                    <div className="font-semibold text-ink">Sebastián Nadales (Tú)</div>
                    <div className="text-[11px] text-ink-3">snadales@gmail.com</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ok-tint text-ok border border-ok/20">
                  Superadmin
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-surface-sunken hover:bg-line text-xs font-semibold text-ink"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renombrar */}
      {activeModal === 'rename' && selectedTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-bold text-sm text-ink">
                Renombrar {selectedTarget.type === 'workspace' ? 'Espacio' : 'Base de datos'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                Nuevo nombre
              </label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface-sunken text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-ink-2 hover:bg-surface-sunken"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  selectedTarget.name = renameValue;
                  setActiveModal(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-semibold shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajustes (Settings) */}
      {activeModal === 'settings' && selectedTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm text-ink">
                  Ajustes de {selectedTarget.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-xl border border-line bg-surface-sunken/40 space-y-2">
                <div className="font-bold text-ink">Proveedores de IA (AI Providers)</div>
                <p className="text-ink-2 text-[11px]">
                  Configura el modelo predeterminado para las funciones de asistencia y análisis:
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-ink">Proxy Local LiteLLM (zbook)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ok-tint text-ok border border-ok/20">
                    Activo · local-fast
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-surface-sunken/40 space-y-2">
                <div className="font-bold text-ink">Zona Horaria y Moneda</div>
                <div className="grid grid-cols-2 gap-3 text-ink-2">
                  <div>
                    <span className="block text-[11px] text-ink-3">Zona Horaria</span>
                    <span className="font-medium text-ink">America/Santiago (UTC-3)</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-3">Moneda Predeterminada</span>
                    <span className="font-medium text-ink">CLP ($)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-strong text-xs font-semibold text-white shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
