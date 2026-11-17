'use client';

import React from 'react';
import { ColumnDef } from './data-grid';
import { Plus, Trash2, X, ArrowDownAZ, ArrowUpZA } from 'lucide-react';

export interface SortCondition {
  id: string;
  fieldId: string;
  direction: 'asc' | 'desc';
}

interface SortPopoverProps {
  columns: ColumnDef[];
  sorts: SortCondition[];
  onSortsChange: (sorts: SortCondition[]) => void;
  onClose: () => void;
}

export const SortPopover: React.FC<SortPopoverProps> = ({
  columns,
  sorts,
  onSortsChange,
  onClose,
}) => {
  const addSort = () => {
    // Escoger el primer campo que no esté ya en sorts
    const existingFieldIds = new Set(sorts.map((s) => s.fieldId));
    const nextCol = columns.find((c) => !existingFieldIds.has(c.id)) || columns[0];

    const newSort: SortCondition = {
      id: `sort_${Date.now()}`,
      fieldId: nextCol?.id || '',
      direction: 'asc',
    };
    onSortsChange([...sorts, newSort]);
  };

  const removeSort = (id: string) => {
    onSortsChange(sorts.filter((s) => s.id !== id));
  };

  const updateSort = (id: string, updates: Partial<SortCondition>) => {
    onSortsChange(sorts.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <div className="absolute top-12 left-28 z-40 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="font-semibold text-slate-800 dark:text-white">
          Orden de Filas ({sorts.length})
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {sorts.length === 0 ? (
        <div className="py-4 text-center text-slate-400">
          No hay ordenamientos activos. Añade uno para clasificar las filas.
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {sorts.map((st, idx) => (
            <div
              key={st.id}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg"
            >
              <span className="text-[10px] font-mono text-slate-400 w-12 shrink-0">
                {idx === 0 ? 'Ordenar por' : 'Luego por'}
              </span>

              {/* Selector de Campo */}
              <select
                value={st.fieldId}
                onChange={(e) => updateSort(st.id, { fieldId: e.target.value })}
                className="flex-1 py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[11px]"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Selector de Dirección */}
              <button
                type="button"
                onClick={() =>
                  updateSort(st.id, {
                    direction: st.direction === 'asc' ? 'desc' : 'asc',
                  })
                }
                className="flex items-center gap-1 py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {st.direction === 'asc' ? (
                  <>
                    <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
                    <span>A → Z</span>
                  </>
                ) : (
                  <>
                    <ArrowUpZA className="w-3.5 h-3.5 text-blue-600" />
                    <span>Z → A</span>
                  </>
                )}
              </button>

              {/* Borrar Sort */}
              <button
                type="button"
                onClick={() => removeSort(st.id)}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <button
          type="button"
          onClick={addSort}
          className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir ordenamiento</span>
        </button>

        {sorts.length > 0 && (
          <button
            type="button"
            onClick={() => onSortsChange([])}
            className="text-slate-400 hover:text-slate-600 text-[11px]"
          >
            Restablecer
          </button>
        )}
      </div>
    </div>
  );
};
