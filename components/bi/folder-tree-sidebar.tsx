'use client';

import React, { useState, useMemo } from 'react';
import { 
  Folder, FolderOpen, LayoutDashboard, ChevronRight, ChevronDown, 
  Search, Plus, Star, StarOff, Layers, BarChart3
} from 'lucide-react';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';

interface FolderTreeSidebarProps {
  onNewDashboard?: () => void;
  onNewFolder?: () => void;
}

export function FolderTreeSidebar({ onNewDashboard, onNewFolder }: FolderTreeSidebarProps) {
  const { 
    dashboards, folders, activeDashboard, selectDashboard, 
    searchQuery, setSearchQuery 
  } = useDashboardStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const filteredDashboards = useMemo(() => {
    if (!searchQuery.trim()) return dashboards;
    const q = searchQuery.toLowerCase();
    return dashboards.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [dashboards, searchQuery]);

  // Dashboards sin carpeta (raíz)
  const rootDashboards = filteredDashboards.filter((d) => !d.folderId);

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full select-none">
      {/* Encabezado */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1D5BD8]" />
            <h2 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Dashboards & Analítica
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNewDashboard}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded transition-colors"
              title="Nuevo Dashboard"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar reporte (D001...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Carpetas y Dashboards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Carpetas */}
        {folders.map((folder) => {
          const isExpanded = expandedFolders[folder.id] ?? true;
          const folderDashes = filteredDashboards.filter((d) => d.folderId === folder.id);

          return (
            <div key={folder.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md transition-colors group"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="font-medium truncate flex-1 text-left">{folder.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {folderDashes.length}
                </span>
              </button>

              {/* Sub-dashboards de la carpeta */}
              {isExpanded && (
                <div className="pl-6 space-y-0.5 border-l border-slate-200 ml-3">
                  {folderDashes.map((d) => {
                    const isActive = activeDashboard?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectDashboard(d.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors text-left ${
                          isActive
                            ? 'bg-blue-100/70 text-blue-800 font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="font-mono text-[10px] px-1 py-0.2 bg-white/80 border border-slate-200 rounded text-slate-500">
                          {d.code}
                        </span>
                        <span className="truncate flex-1">{d.name}</span>
                        {d.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                  {folderDashes.length === 0 && (
                    <div className="px-2 py-1 text-[11px] text-slate-400 italic">
                      Vacía
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Dashboards Raíz (sin carpeta) */}
        {rootDashboards.length > 0 && (
          <div className="pt-2">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Generales
            </div>
            {rootDashboards.map((d) => {
              const isActive = activeDashboard?.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDashboard(d.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors text-left ${
                    isActive
                      ? 'bg-blue-100/70 text-blue-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="font-mono text-[10px] px-1 py-0.2 bg-white/80 border border-slate-200 rounded text-slate-500">
                    {d.code}
                  </span>
                  <span className="truncate flex-1">{d.name}</span>
                  {d.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {dashboards.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            No hay dashboards creados.
          </div>
        )}
      </div>
    </aside>
  );
}
