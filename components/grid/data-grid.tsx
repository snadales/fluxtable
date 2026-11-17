'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  ChevronDown, ChevronRight, Plus, Hash, Type, DollarSign, Calendar, Star, 
  BarChart2, CheckSquare, Filter, ArrowUp, ArrowDown, EyeOff, Edit3, Copy, 
  Trash2, Layers, Check, Calculator, MoreHorizontal
} from 'lucide-react';

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

export type RowHeight = 'compact' | 'medium' | 'tall';
export type AggregationType = 'none' | 'sum' | 'avg' | 'min' | 'max' | 'count' | 'empty' | 'not_empty';

interface DataGridProps {
  columns: ColumnDef[];
  rows: RowData[];
  onCellChange?: (rowId: string, columnId: string, newValue: any) => void;
  onRowSelect?: (row: RowData) => void;
  onAddRow?: () => void;
  highlightRules?: boolean;
  zebraStriping?: boolean;
  rowHeight?: RowHeight;
  groupByColumnId?: string | null;
  onFilterByColumn?: (columnId: string) => void;
  onSortByColumn?: (columnId: string, direction: 'asc' | 'desc') => void;
  onHideColumn?: (columnId: string) => void;
  onEditColumn?: (column: ColumnDef) => void;
  onDuplicateColumn?: (column: ColumnDef) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  columns,
  rows,
  onCellChange,
  onRowSelect,
  onAddRow,
  highlightRules = true,
  zebraStriping = false,
  rowHeight = 'medium',
  groupByColumnId = null,
  onFilterByColumn,
  onSortByColumn,
  onHideColumn,
  onEditColumn,
  onDuplicateColumn,
  onDeleteColumn,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colIdx: number } | null>({
    rowIdx: 0,
    colIdx: 0,
  });
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Menús interactivos
  const [activeHeaderColId, setActiveHeaderColId] = useState<string | null>(null);
  const [activeFooterColId, setActiveFooterColId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Agregaciones personalizadas por columna
  const [aggregations, setAggregations] = useState<Record<string, AggregationType>>(() => {
    const initial: Record<string, AggregationType> = {};
    columns.forEach((col) => {
      if (col.type === 'currency' || col.type === 'number') {
        initial[col.id] = 'sum';
      } else if (col.isPrimary) {
        initial[col.id] = 'count';
      } else {
        initial[col.id] = 'none';
      }
    });
    return initial;
  });

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveHeaderColId(null);
      setActiveFooterColId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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
        const col = columns[colIdx];
        if (col && col.type === 'boolean') {
          const row = rows[rowIdx];
          if (row) {
            const curr = row.data[col.id];
            onCellChange?.(row.id, col.id, !curr);
          }
        } else if (rows[rowIdx]) {
          onRowSelect?.(rows[rowIdx]);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (rows[rowIdx] && columns[colIdx]) {
          const activeRow = rows[rowIdx];
          const activeCol = columns[colIdx];
          onCellChange?.(activeRow.id, activeCol.id, null);
        }
        break;
    }
  };

  const startEdit = (rowIdx: number, colIdx: number) => {
    const col = columns[colIdx];
    if (!col || col.type === 'formula') return;
    const row = rows[rowIdx];
    if (!row) return;
    setSelectedCell({ rowIdx, colIdx });
    setEditingCell({ rowIdx, colIdx });
    setEditValue(row.data[col.id] ?? '');
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { rowIdx, colIdx } = editingCell;
    const row = rows[rowIdx];
    const col = columns[colIdx];
    if (!row || !col) return;

    let finalVal = editValue;
    if (col.type === 'number' || col.type === 'currency' || col.type === 'progress') {
      finalVal = editValue === '' ? null : Number(editValue);
    }

    onCellChange?.(row.id, col.id, finalVal);
    setEditingCell(null);
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-3.5 h-3.5 text-ink-3" />;
      case 'number': return <Hash className="w-3.5 h-3.5 text-ink-3" />;
      case 'currency': return <DollarSign className="w-3.5 h-3.5 text-ok" />;
      case 'date': return <Calendar className="w-3.5 h-3.5 text-accent" />;
      case 'rating': return <Star className="w-3.5 h-3.5 text-warn" />;
      case 'progress': return <BarChart2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'boolean': return <CheckSquare className="w-3.5 h-3.5 text-ink-3" />;
      default: return <Hash className="w-3.5 h-3.5 text-ink-3" />;
    }
  };

  // Clases según altura de fila
  const getRowHeightClasses = () => {
    switch (rowHeight) {
      case 'compact':
        return { cell: 'py-1 px-2.5 text-[11px] h-7', row: 'h-7' };
      case 'tall':
        return { cell: 'py-3.5 px-3 text-xs h-14', row: 'h-14' };
      case 'medium':
      default:
        return { cell: 'py-2 px-3 text-xs h-9', row: 'h-9' };
    }
  };

  const heightStyles = getRowHeightClasses();

  // Agrupación de filas (Group By)
  const groupedData = useMemo(() => {
    if (!groupByColumnId) return null;
    const groups: Record<string, RowData[]> = {};
    rows.forEach((r) => {
      const keyVal = r.data[groupByColumnId];
      const key = keyVal === undefined || keyVal === null || keyVal === '' ? '(Sin valor)' : String(keyVal);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [rows, groupByColumnId]);

  // Cálculo de agregación de footer
  const calculateAggregation = (col: ColumnDef, type: AggregationType, dataset: RowData[]): string => {
    if (type === 'none') return '';
    if (type === 'count') return `${dataset.length}`;

    const values = dataset.map((r) => r.data[col.id]);
    const numValues = values
      .map((v) => Number(v))
      .filter((v) => !isNaN(v) && v !== null && v !== undefined);

    if (type === 'empty') {
      const emptyCount = values.filter((v) => v === null || v === undefined || v === '').length;
      return `${emptyCount} vacíos`;
    }

    if (type === 'not_empty') {
      const notEmptyCount = values.filter((v) => v !== null && v !== undefined && v !== '').length;
      return `${notEmptyCount} llenos`;
    }

    if (numValues.length === 0) return '-';

    switch (type) {
      case 'sum': {
        const sum = numValues.reduce((a, b) => a + b, 0);
        return col.type === 'currency'
          ? formatCurrency(sum, col.options).formattedText
          : `Σ ${sum.toLocaleString()}`;
      }
      case 'avg': {
        const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
        return col.type === 'currency'
          ? formatCurrency(avg, col.options).formattedText
          : `μ ${avg.toFixed(2)}`;
      }
      case 'min': {
        const min = Math.min(...numValues);
        return col.type === 'currency'
          ? formatCurrency(min, col.options).formattedText
          : `Min ${min.toLocaleString()}`;
      }
      case 'max': {
        const max = Math.max(...numValues);
        return col.type === 'currency'
          ? formatCurrency(max, col.options).formattedText
          : `Max ${max.toLocaleString()}`;
      }
      default:
        return '';
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
            className="w-full h-full text-xs px-2 bg-surface border-none outline-none ring-2 ring-accent text-ink"
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
          className="w-full h-full text-xs px-2.5 py-1 bg-surface border-none outline-none ring-2 ring-accent text-ink"
        />
      );
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return <span className="text-ink-3 text-xs">-</span>;
    }

    switch (col.type) {
      case 'currency': {
        const { formattedText, isNegative } = formatCurrency(rawValue, col.options);
        return (
          <span className={`font-mono font-medium ${isNegative ? 'text-danger' : 'text-ink'}`}>
            {formattedText}
          </span>
        );
      }
      case 'date':
        return <span className="text-ink font-mono">{formatDate(rawValue, col.options?.dateFormat)}</span>;
      case 'select': {
        const opts = col.options?.options || [];
        const opt = opts.find((o: any) => o.id === rawValue || o.value === rawValue);
        return opt ? <Badge label={opt.value} colorId={opt.color} /> : <span>{String(rawValue)}</span>;
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
            className="w-4 h-4 rounded text-accent focus:ring-accent"
          />
        );
      default:
        return <span className="text-ink truncate">{String(rawValue)}</span>;
    }
  };

  const renderRow = (row: RowData, rowIdx: number) => {
    // Reglas de formato condicional
    const isDelivered = row.data['Estado Embarque'] === 'opt_bodega';
    const isLagging = Number(row.data['Avance Logístico']) < 40 && !isDelivered;

    let rowTint = '';
    if (highlightRules) {
      if (isDelivered) rowTint = 'bg-ok-tint/40 dark:bg-ok-tint/20';
      else if (isLagging) rowTint = 'bg-warn-tint/40 dark:bg-warn-tint/20';
    }

    if (zebraStriping && !rowTint && rowIdx % 2 === 1) {
      rowTint = 'bg-surface-sunken/40';
    }

    return (
      <tr
        key={row.id}
        onDoubleClick={() => onRowSelect?.(row)}
        className={`hover:bg-accent/5 transition-colors ${rowTint} ${heightStyles.row}`}
      >
        <td className={`w-12 px-2 text-center text-ink-3 font-mono text-[11px] border-r border-line ${heightStyles.cell}`}>
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
              className={`border-r border-line transition-all ${heightStyles.cell} ${
                col.isPrimary ? 'sticky left-0 bg-surface z-10' : ''
              } ${
                isSelected
                  ? 'ring-2 ring-accent z-20 bg-accent/5'
                  : ''
              }`}
            >
              {renderCellContent(row, col, isEditing)}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col border border-line rounded-xl bg-surface shadow-2xs overflow-hidden outline-none select-none"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Header */}
          <thead>
            <tr className="bg-surface-sunken/80 border-b border-line text-ink-2 font-semibold">
              <th className="w-12 px-3 py-2 text-center border-r border-line font-mono text-[11px] text-ink-3">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                  className={`px-3 py-2 border-r border-line relative ${
                    col.isPrimary ? 'sticky left-0 bg-surface-sunken font-bold text-ink z-10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {getColumnIcon(col.type)}
                      <span className="truncate">{col.name}</span>
                    </div>

                    {/* Botón de flecha que abre el menú contextual (Issue #26) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHeaderColId(activeHeaderColId === col.id ? null : col.id);
                        setActiveFooterColId(null);
                      }}
                      className="p-0.5 rounded text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
                      title="Acciones de columna"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Menú Contextual de Columna (Issue #26) */}
                  {activeHeaderColId === col.id && (
                    <div
                      className="absolute left-0 top-full mt-1 w-52 bg-surface border border-line rounded-xl shadow-xl py-1.5 z-50 text-xs font-medium text-ink"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-1 text-[10px] font-bold text-ink-3 border-b border-line uppercase tracking-wider truncate">
                        Columna: {col.name}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderColId(null);
                          onFilterByColumn?.(col.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                      >
                        <Filter className="w-3.5 h-3.5 text-ink-2" />
                        <span>Filtrar por esta columna</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderColId(null);
                          onSortByColumn?.(col.id, 'asc');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-ink-2" />
                        <span>Ordenar ascendente (A → Z)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderColId(null);
                          onSortByColumn?.(col.id, 'desc');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-ink-2" />
                        <span>Ordenar descendente (Z → A)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderColId(null);
                          onHideColumn?.(col.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-ink-2" />
                        <span>Ocultar campo</span>
                      </button>

                      <div className="h-px bg-line my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderColId(null);
                          onEditColumn?.(col);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-ink-2" />
                        <span>Editar campo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderColId(null);
                          onDuplicateColumn?.(col);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-sunken text-left"
                      >
                        <Copy className="w-3.5 h-3.5 text-ink-2" />
                        <span>Duplicar campo</span>
                      </button>

                      {!col.isPrimary && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveHeaderColId(null);
                            onDeleteColumn?.(col.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-danger-tint text-danger text-left font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar campo</span>
                        </button>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-line/70 font-sans">
            {groupedData ? (
              // Renderizado con Agrupación (Group By)
              Object.entries(groupedData).map(([groupKey, groupRows]) => {
                const isCollapsed = !!collapsedGroups[groupKey];
                return (
                  <React.Fragment key={groupKey}>
                    {/* Header de Grupo */}
                    <tr className="bg-surface-sunken/90 border-y border-line font-bold text-xs text-ink">
                      <td colSpan={columns.length + 1} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedGroups((prev) => ({
                                ...prev,
                                [groupKey]: !prev[groupKey],
                              }))
                            }
                            className="p-1 rounded text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-semibold text-ink-2">Grupo:</span>
                          <span className="text-accent">{groupKey}</span>
                          <span className="text-[11px] font-mono font-medium text-ink-3 bg-surface px-2 py-0.5 rounded-full border border-line">
                            {groupRows.length} registros
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Filas del grupo si no está colapsado */}
                    {!isCollapsed &&
                      groupRows.map((row, idx) => renderRow(row, idx))}
                  </React.Fragment>
                );
              })
            ) : (
              // Renderizado Normal sin Agrupación
              rows.map((row, rowIdx) => renderRow(row, rowIdx))
            )}
          </tbody>

          {/* Fila Inferior de Resúmenes y Agregaciones (Summarizer Footer) */}
          <tfoot>
            <tr className="bg-surface-sunken/80 border-t border-line font-mono text-[11px] text-ink-2">
              <td className="px-2 py-2 text-center font-bold">{rows.length}</td>
              {columns.map((col) => {
                const currentAgg = aggregations[col.id] || 'none';
                const summaryValue = calculateAggregation(col, currentAgg, rows);

                return (
                  <td
                    key={col.id}
                    className="px-3 py-2 border-r border-line font-semibold truncate relative group cursor-pointer hover:bg-surface transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFooterColId(activeFooterColId === col.id ? null : col.id);
                      setActiveHeaderColId(null);
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{summaryValue || '-'}</span>
                      <Calculator className="w-3 h-3 text-ink-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Popover de selección de Agregación */}
                    {activeFooterColId === col.id && (
                      <div
                        className="absolute left-0 bottom-full mb-1 w-44 bg-surface border border-line rounded-xl shadow-xl py-1 z-50 text-xs font-medium text-ink"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1 text-[10px] font-bold text-ink-3 border-b border-line uppercase tracking-wider">
                          Agregación
                        </div>

                        {[
                          { id: 'none', label: 'Ninguno' },
                          { id: 'count', label: 'Conteo (Count)' },
                          { id: 'sum', label: 'Suma (Sum - Σ)' },
                          { id: 'avg', label: 'Promedio (Avg - μ)' },
                          { id: 'min', label: 'Mínimo (Min)' },
                          { id: 'max', label: 'Máximo (Max)' },
                          { id: 'empty', label: 'Vacíos' },
                          { id: 'not_empty', label: 'No vacíos' },
                        ].map((agg) => (
                          <button
                            key={agg.id}
                            type="button"
                            onClick={() => {
                              setAggregations((prev) => ({
                                ...prev,
                                [col.id]: agg.id as AggregationType,
                              }));
                              setActiveFooterColId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-sunken text-left ${
                              currentAgg === agg.id ? 'font-bold text-accent bg-accent/5' : ''
                            }`}
                          >
                            <span>{agg.label}</span>
                            {currentAgg === agg.id && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
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
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-ink-3 hover:text-accent hover:bg-surface-sunken border-t border-line transition-colors w-full text-left font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir fila...</span>
        </button>
      )}
    </div>
  );
};
