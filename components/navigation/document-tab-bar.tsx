'use client';

import React from 'react';
import { 
  Table as TableIcon, BarChart2, Folder, LayoutDashboard, 
  X, Plus, ChevronRight, Layers, Sparkles
} from 'lucide-react';

export interface DocumentTab {
  id: string;
  title: string;
  type: 'workspaces' | 'table' | 'dashboard' | 'catalog';
  iconType?: 'workspaces' | 'table' | 'dashboard' | 'catalog';
  code?: string;
  closable: boolean;
  params?: {
    tableId?: string;
    dashboardId?: string;
    base?: any;
    defaultCatalogTab?: 'indicators' | 'charts' | 'tables' | 'dashboards';
  };
}

interface DocumentTabBarProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export const DocumentTabBar: React.FC<DocumentTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}) => {
  const renderIcon = (type: DocumentTab['type']) => {
    switch (type) {
      case 'workspaces':
        return <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'dashboard':
        return <BarChart2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'catalog':
        return <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="h-10 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-2 gap-1 overflow-x-auto no-scrollbar shrink-0 select-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 h-8 text-xs font-medium rounded-t-md transition-all cursor-pointer shrink-0 border-t border-x ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 border-b-transparent shadow-xs -mb-[1px] z-10'
                : 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900'
            }`}
          >
            {renderIcon(tab.type)}

            {tab.code && (
              <span className={`px-1 py-0.2 rounded text-[10px] font-mono font-bold ${
                tab.type === 'dashboard' 
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              }`}>
                {tab.code}
              </span>
            )}

            <span className="truncate max-w-[160px]">{tab.title}</span>

            {tab.closable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 opacity-60 group-hover:opacity-100 transition-opacity"
                title="Cerrar pestaña"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Active highlight line at top */}
            {isActive && (
              <span className="absolute top-0 left-0 right-0 h-0.5 bg-[#1D5BD8] rounded-t" />
            )}
          </div>
        );
      })}
    </div>
  );
};
