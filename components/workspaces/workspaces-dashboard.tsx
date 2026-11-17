'use client';

import React, { useState } from 'react';
import { 
  Database, LayoutDashboard, Plus, Search, ChevronDown, MoreHorizontal, 
  Settings, Users, Trash2, Clock, FileText, ChevronRight, Check,
  Folder, ShieldCheck, BarChart3
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'database' | 'dashboard'>('all');
  const [sidebarTab, setSidebarTab] = useState<'all' | 'recent' | 'templates' | 'trash'>('all');
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Record<string, boolean>>({});

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

  const getWorkspaceInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || 'W';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* 1. Left Sidebar (Print 7) */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 shadow-2xs select-none">
        <div>
          {/* User selector Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenUserMenu}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  SN
                </div>
                <div className="truncate">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {user.name}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
            </button>
          </div>

          {/* Navigation Items (Print 7) */}
          <div className="p-3 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setSidebarTab('all');
                onSelectWorkspace(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                sidebarTab === 'all' && activeWorkspaceId === null
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-slate-400" />
                <span>All workspaces</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {workspaces.length}
              </span>
            </button>

            {onOpenAnalytics && (
              <button
                type="button"
                onClick={onOpenAnalytics}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 font-semibold border border-blue-200/50"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Dashboards BI</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">
                  NUEVO
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSidebarTab('recent')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                sidebarTab === 'recent'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recently viewed</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('templates')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                sidebarTab === 'templates'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Templates</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSidebarTab('trash');
                onOpenTrash();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                sidebarTab === 'trash'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Trash</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Brand con Sistema Yarken */}
        <div className="p-3 border-t border-line flex items-center justify-between text-xs bg-surface-sunken/40">
          <FluxTableLogo size={22} showWordmark={true} />
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Action Bar (Print 7) */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Your workspaces
          </h1>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-60">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All items</option>
              <option value="database">Databases</option>
              <option value="dashboard">Dashboards</option>
            </select>

            {/* Create Workspace Button (Print 7) */}
            <button
              type="button"
              onClick={onCreateWorkspace}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create workspace</span>
            </button>
          </div>
        </header>

        {/* Workspaces Scrollable List (Print 7) */}
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
                className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
              >
                {/* Workspace Header Banner (Print 7) */}
                <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {getWorkspaceInitial(ws.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {ws.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {ws.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ws.membersCount} member{ws.membersCount !== 1 ? 's' : ''} • {ws.bases.length} items
                      </div>
                    </div>
                  </div>

                  {/* Actions Right (Print 7) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCreateDatabase(ws.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create</span>
                    </button>

                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-2xs"
                    >
                      Members
                    </button>

                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-2xs"
                    >
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCollapse(ws.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Databases Grid Inside Workspace (Print 7) */}
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
                              className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-500/80 hover:shadow-md cursor-pointer transition-all flex items-start justify-between gap-3 relative"
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
                                  <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                                    {b.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {isDashboard ? 'Dashboard' : 'Database'} • {b.viewedAt || 'Reciente'}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
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
    </div>
  );
};
