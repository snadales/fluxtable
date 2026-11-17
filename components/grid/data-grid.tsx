'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ChevronDown, Plus, Hash, Type, DollarSign, Calendar, Star, BarChart2, CheckSquare } from 'lucide-react';

export interface ColumnDef {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'select' | 'rating' | 'progress' | 'formula';
  width: number;
  isPrimary?: boolean;
  options?: any;
}

export interface RowData {
  id: string;
  order: number;
  version: number;
  data: Record<string, any>;
  content?: string;
}

interface DataGridProps {
  columns: ColumnDef[];
  rows: RowData[];
  onCellChange?: (rowId: string, columnId: string, newValue: any) => void;
  onRowSelect?: (row: RowData) => void;
  onAddRow?: () => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  columns,
  rows,
  onCellChange,
  onRowSelect,
  onAddRow,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colIdx: number } | null>({
    rowIdx: 0,
    colIdx: 0,
  });
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Manejo de Navegación por Teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    const { rowIdx, colIdx } = selectedCell;

    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        if (rowIdx < rows.length - 1) {
          setSelectedCell({ rowIdx: rowIdx + 1, colIdx });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        if (colIdx < columns.length - 1) {
          setSelectedCell({ rowIdx, colIdx: colIdx + 1 });
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIdx > 0) setSelectedCell({ rowIdx: rowIdx - 1, colIdx });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIdx < rows.length - 1) setSelectedCell({ rowIdx: rowIdx + 1, colIdx });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIdx > 0) setSelectedCell({ rowIdx, colIdx: colIdx - 1 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIdx < columns.length - 1) setSelectedCell({ rowIdx, colIdx: colIdx + 1 });
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIdx > 0) setSelectedCell({ rowIdx, colIdx: colIdx - 1 });
        } else {
          if (colIdx < columns.length - 1) setSelectedCell({ rowIdx, colIdx: colIdx + 1 });
        }
        break;
      case 'Enter':
        e.preventDefault();
        startEdit(rowIdx, colIdx);
        break;
      case ' ':
        e.preventDefault();
        // Toggle booleano o abrir modal de detalle
        const col = columns[colIdx];
        if (col.type === 'boolean') {
          const row = rows[rowIdx];
          const curr = row.data[col.id];
          onCellChange?.(row.id, col.id, !curr);
        } else {
          onRowSelect?.(rows[rowIdx]);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        const activeRow = rows[rowIdx];
        const activeCol = columns[colIdx];
        onCellChange?.(activeRow.id, activeCol.id, null);
        break;
    }
  };

  const startEdit = (rowIdx: number, colIdx: number) => {
    const col = columns[colIdx];
    if (col.type === 'formula') return; // Read-only
    const row = rows[rowIdx];
    setSelectedCell({ rowIdx, colIdx });
    setEditingCell({ rowIdx, colIdx });
    setEditValue(row.data[col.id] ?? '');
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { rowIdx, colIdx } = editingCell;
    const row = rows[rowIdx];
    const col = columns[colIdx];

    let finalVal = editValue;
    if (col.type === 'number' || col.type === 'currency' || col.type === 'progress') {
      finalVal = editValue === '' ? null : Number(editValue);
    }

    onCellChange?.(row.id, col.id, finalVal);
    setEditingCell(null);
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-3.5 h-3.5 text-gray-500" />;
      case 'number': return <Hash className="w-3.5 h-3.5 text-gray-500" />;
      case 'currency': return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'date': return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
      case 'rating': return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'progress': return <BarChart2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'boolean': return <CheckSquare className="w-3.5 h-3.5 text-gray-500" />;
      default: return <Hash className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const renderCellContent = (row: RowData, col: ColumnDef, isEditing: boolean) => {
    const rawValue = row.data[col.id];

    if (isEditing) {
      if (col.type === 'select') {
        const opts = col.options?.options || [];
        return (
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              onCellChange?.(row.id, col.id, e.target.value);
              setEditingCell(null);
            }}
            onBlur={() => setEditingCell(null)}
            autoFocus
            className="w-full h-full text-xs px-2 bg-white border-none outline-none ring-2 ring-blue-500"
          >
            <option value="">(Sin Asignar)</option>
            {opts.map((o: any) => (
              <option key={o.id} value={o.id}>{o.value}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={inputRef}
          type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
          value={editValue ?? ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          className="w-full h-full text-xs px-2.5 py-1 bg-white border-none outline-none ring-2 ring-blue-500"
        />
      );
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>;
    }

    switch (col.type) {
      case 'currency': {
        const { formattedText, isNegative } = formatCurrency(rawValue, col.options);
        return (
          <span className={`text-xs font-mono font-medium ${isNegative ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
            {formattedText}
          </span>
        );
      }
      case 'date':
        return <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">{formatDate(rawValue, col.options?.dateFormat)}</span>;
      case 'select': {
        const opts = col.options?.options || [];
        const opt = opts.find((o: any) => o.id === rawValue || o.value === rawValue);
        return opt ? <Badge label={opt.value} colorId={opt.color} /> : <span className="text-xs">{String(rawValue)}</span>;
      }
      case 'progress':
        return <ProgressBar value={Number(rawValue)} />;
      case 'rating':
        return (
          <Rating
            value={Number(rawValue)}
            onChange={(val) => onCellChange?.(row.id, col.id, val)}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(rawValue)}
            onChange={(e) => onCellChange?.(row.id, col.id, e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
        );
      default:
        return <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{String(rawValue)}</span>;
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 shadow-sm overflow-hidden outline-none select-none"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Header */}
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-medium">
              <th className="w-12 px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-800 font-mono text-[11px] text-gray-400">
                #
              </th>
              {columns.map((col, idx) => (
                <th
                  key={col.id}
                  style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                  className={`px-3 py-2.5 border-r border-gray-200 dark:border-gray-800 ${
                    col.isPrimary ? 'sticky left-0 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white z-10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {getColumnIcon(col.type)}
                      <span className="truncate">{col.name}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400 opacity-60 hover:opacity-100 cursor-pointer" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-sans">
            {rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                onDoubleClick={() => onRowSelect?.(row)}
                className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
              >
                <td className="w-12 px-2 py-2 text-center text-gray-400 font-mono text-[11px] border-r border-gray-100 dark:border-gray-800">
                  {rowIdx + 1}
                </td>
                {columns.map((col, colIdx) => {
                  const isSelected = selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === colIdx;
                  const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx;

                  return (
                    <td
                      key={col.id}
                      onClick={() => setSelectedCell({ rowIdx, colIdx })}
                      onDoubleClick={() => startEdit(rowIdx, colIdx)}
                      style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                      className={`px-3 py-2 border-r border-gray-100 dark:border-gray-800 transition-all ${
                        col.isPrimary ? 'sticky left-0 bg-white dark:bg-gray-900 z-10' : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-blue-500 z-20 bg-blue-50/20 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      {renderCellContent(row, col, isEditing)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* Footer Summary Row */}
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 font-mono text-[11px] text-gray-500">
              <td className="px-2 py-2 text-center font-bold">{rows.length}</td>
              {columns.map((col) => {
                let summary = '';
                if (col.type === 'currency' || col.type === 'number') {
                  const sum = rows.reduce((acc, r) => acc + (Number(r.data[col.id]) || 0), 0);
                  if (col.type === 'currency') {
                    summary = formatCurrency(sum, col.options).formattedText;
                  } else {
                    summary = `Σ ${sum.toLocaleString()}`;
                  }
                } else if (col.isPrimary) {
                  summary = `${rows.length} registros`;
                }

                return (
                  <td key={col.id} className="px-3 py-2 border-r border-gray-200 dark:border-gray-800 font-semibold truncate">
                    {summary}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Botón Nueva Fila */}
      {onAddRow && (
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 transition-colors w-full text-left"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir fila...</span>
        </button>
      )}
    </div>
  );
};
