'use client';

import React from 'react';
import { ColumnDef } from './data-grid';
import { Plus, Trash2, X } from 'lucide-react';

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: 'equal' | 'not_equal' | 'contains' | 'not_contains' | 'greater' | 'less' | 'empty' | 'not_empty';
  value: string;
}

interface FilterPopoverProps {
  columns: ColumnDef[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onClose: () => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  columns,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `flt_${Date.now()}`,
      fieldId: columns[0]?.id || '',
      operator: 'contains',
      value: '',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  return (
    <div className="absolute top-12 left-4 z-40 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="font-semibold text-slate-800 dark:text-white">
          Filtros de Vista ({filters.length})
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="py-4 text-center text-slate-400">
          No hay filtros activos. Añade uno para segmentar los datos.
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filters.map((flt, idx) => (
            <div key={flt.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] font-mono text-slate-400 w-8 shrink-0">
                {idx === 0 ? 'Donde' : 'Y'}
              </span>

              {/* Selector de Campo */}
              <select
                value={flt.fieldId}
                onChange={(e) => updateFilter(flt.id, { fieldId: e.target.value })}
                className="flex-1 py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[11px]"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Selector de Operador */}
              <select
                value={flt.operator}
                onChange={(e) => updateFilter(flt.id, { operator: e.target.value as any })}
                className="py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[11px]"
              >
                <option value="contains">contiene</option>
                <option value="equal">es igual a</option>
                <option value="not_equal">no es igual a</option>
                <option value="greater">mayor que</option>
                <option value="less">menor que</option>
                <option value="empty">está vacío</option>
                <option value="not_empty">no está vacío</option>
              </select>

              {/* Input de Valor */}
              {flt.operator !== 'empty' && flt.operator !== 'not_empty' && (
                <input
                  type="text"
                  value={flt.value}
                  onChange={(e) => updateFilter(flt.id, { value: e.target.value })}
                  placeholder="Valor..."
                  className="w-24 py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[11px]"
                />
              )}

              {/* Borrar Filtro */}
              <button
                type="button"
                onClick={() => removeFilter(flt.id)}
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
          onClick={addFilter}
          className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir condición</span>
        </button>

        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => onFiltersChange([])}
            className="text-slate-400 hover:text-slate-600 text-[11px]"
          >
            Limpiar todo
          </button>
        )}
      </div>
    </div>
  );
};
