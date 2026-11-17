'use client';

import React from 'react';
import { ColumnDef } from './data-grid';
import { X, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';

interface FieldsPopoverProps {
  columns: ColumnDef[];
  hiddenFieldIds: string[];
  onToggleHidden: (fieldId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onClose: () => void;
}

export const FieldsPopover: React.FC<FieldsPopoverProps> = ({
  columns,
  hiddenFieldIds,
  onToggleHidden,
  onShowAll,
  onHideAll,
  onClose,
}) => {
  const visibleCount = columns.length - hiddenFieldIds.length;

  return (
    <div className="absolute top-12 left-56 z-40 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="font-semibold text-slate-800 dark:text-white">
            Campos Visibles
          </span>
          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
            ({visibleCount}/{columns.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lista de columnas con toggles */}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {columns.map((col) => {
          const isHidden = hiddenFieldIds.includes(col.id);
          const isPrimary = col.isPrimary;

          return (
            <div
              key={col.id}
              onClick={() => !isPrimary && onToggleHidden(col.id)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                isHidden
                  ? 'bg-slate-50 dark:bg-slate-800/30 text-slate-400'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isHidden ? (
                  <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                ) : (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span className="font-medium">{col.name}</span>
                {isPrimary && (
                  <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                    Clave
                  </span>
                )}
              </div>

              {isHidden ? (
                <EyeOff className="w-3 h-3 text-slate-400" />
              ) : (
                <Eye className="w-3 h-3 text-slate-400" />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
        <button
          type="button"
          onClick={onShowAll}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          Mostrar todos
        </button>
        <button
          type="button"
          onClick={onHideAll}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          Ocultar todos
        </button>
      </div>
    </div>
  );
};
