'use client';

import React, { useState } from 'react';
import { 
  Search, Check, Plus, Settings, User, LogOut, ShieldCheck, ChevronRight
} from 'lucide-react';

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  membersCount: number;
  itemsCount: number;
}

interface WorkspaceUserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  onOpenNewWorkspace: () => void;
  onOpenAdminTools: () => void;
  onOpenMySettings: () => void;
  user: {
    name: string;
    email: string;
    role: string;
    isZeroTrust?: boolean;
  };
}

export const WorkspaceUserMenu: React.FC<WorkspaceUserMenuProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenNewWorkspace,
  onOpenAdminTools,
  onOpenMySettings,
  user,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitialColor = (name: string) => {
    const char = name.trim().charAt(0).toUpperCase();
    switch (char) {
      case 'L': return 'bg-blue-600 text-white';
      case 'N': return 'bg-blue-600 text-white';
      case 'Y': return 'bg-blue-600 text-white';
      case 'S': return 'bg-blue-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />

      {/* Flyout Menu (Print 1) */}
      <div className="absolute left-3 top-12 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-xs flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Search */}
        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none w-full text-slate-800 dark:text-white placeholder:text-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Workspaces List */}
        <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
          {/* Opción Todos los Workspaces */}
          <button
            type="button"
            onClick={() => {
              onSelectWorkspace(null);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
              activeWorkspaceId === null
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                ★
              </div>
              <span className="truncate">Todos los Workspaces</span>
            </div>
            {activeWorkspaceId === null && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
          </button>

          {filteredWorkspaces.map((w) => {
            const isSelected = activeWorkspaceId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  onSelectWorkspace(w.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`w-6 h-6 rounded-md ${getInitialColor(w.name)} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{w.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewWorkspace();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-left font-medium"
          >
            <div className="w-6 h-6 rounded-md border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Add new workspace</span>
          </button>
        </div>

        {/* User & Links Footer (Print 1) */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
          <div className="px-2 py-1 flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[170px]">
              {user.email}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {user.role || 'Admin'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdminTools();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Admin tools</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMySettings();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>My settings</span>
          </button>

          <a
            href="/login"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </a>
        </div>
      </div>
    </>
  );
};
