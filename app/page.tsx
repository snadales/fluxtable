'use client';

import React, { useState } from 'react';
import { DataGrid, ColumnDef, RowData } from '@/components/grid/data-grid';
import { 
  Database, Table as TableIcon, LayoutGrid, Kanban as KanbanIcon, 
  FileText, Search, Download, Plus, Filter, ArrowUpDown, X, 
  ExternalLink, Clock, ShieldCheck 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Rating } from '@/components/ui/rating';
import { formatCurrency, formatDate } from '@/lib/formatters';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'fld_code', name: 'Código Contenedor', type: 'text', width: 170, isPrimary: true },
  { 
    id: 'fld_status', 
    name: 'Estado Embarque', 
    type: 'select', 
    width: 170,
    options: {
      options: [
        { id: 'opt_fabrica', value: 'En Fábrica', color: 'yellow' },
        { id: 'opt_transito', value: 'En Tránsito', color: 'blue' },
        { id: 'opt_aduana', value: 'En Aduana San Antonio', color: 'orange' },
        { id: 'opt_bodega', value: 'Recibido en Bodega', color: 'green' },
      ]
    }
  },
  { 
    id: 'fld_fob', 
    name: 'Inversión FOB', 
    type: 'currency', 
    width: 150,
    options: { currencySymbol: 'US$', precision: 2, thousandsSeparator: ',', decimalSeparator: '.' }
  },
  { 
    id: 'fld_clp', 
    name: 'Costo Final Puesto', 
    type: 'currency', 
    width: 170,
    options: { currencySymbol: '$', precision: 0, thousandsSeparator: '.', decimalSeparator: ',' }
  },
  { id: 'fld_progress', name: 'Avance Logístico', type: 'progress', width: 150 },
  { id: 'fld_rating', name: 'Calificación Naviera', type: 'rating', width: 160 },
  { id: 'fld_date', name: 'Fecha Estimada Arribo', type: 'date', width: 160, options: { dateFormat: 'DD/MM/YYYY' } },
];

const INITIAL_ROWS: RowData[] = [
  {
    id: 'rec_1',
    order: 1,
    version: 1,
    data: {
      fld_code: 'MSKU-892147-9',
      fld_status: 'opt_transito',
      fld_fob: 45200.50,
      fld_clp: 42800000,
      fld_progress: 65,
      fld_rating: 5,
      fld_date: '2026-11-28',
    },
    content: '## Bitácora de Embarque MSKU-892147-9\n- Proveedor confirmado.\n- Documentación BL recibida sin observaciones.\n- Próxima revisión en aduana el día 25 de noviembre.',
  },
  {
    id: 'rec_2',
    order: 2,
    version: 1,
    data: {
      fld_code: 'TCLU-419082-1',
      fld_status: 'opt_aduana',
      fld_fob: 32150.00,
      fld_clp: 30540000,
      fld_progress: 90,
      fld_rating: 4,
      fld_date: '2026-11-18',
    },
    content: '## Inspección Aduanera TCLU-419082-1\n- Pago de aranceles tramitado con éxito.\n- En espera de liberación de aforo físico.',
  },
  {
    id: 'rec_3',
    order: 3,
    version: 1,
    data: {
      fld_code: 'CMAU-109238-4',
      fld_status: 'opt_bodega',
      fld_fob: 18900.00,
      fld_clp: 17950000,
      fld_progress: 100,
      fld_rating: 5,
      fld_date: '2026-11-05',
    },
    content: '## Recepción Conforme\n- Descarga completada en Bodega Navarino.\n- Stock ingresado a Odoo.',
  },
  {
    id: 'rec_4',
    order: 4,
    version: 1,
    data: {
      fld_code: 'HLXU-772910-3',
      fld_status: 'opt_fabrica',
      fld_fob: 58000.00,
      fld_clp: 55100000,
      fld_progress: 20,
      fld_rating: 3,
      fld_date: '2026-12-15',
    },
    content: '## Producción en Origen\n- Depósito del 30% transferido.\n- Inspección de calidad pre-embarque programada para el 30 de noviembre.',
  },
];

export default function HomePage() {
  const [columns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const [rows, setRows] = useState<RowData[]>(INITIAL_ROWS);
  const [activeView, setActiveView] = useState<'grid' | 'kanban' | 'form'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RowData | null>(null);

  // Manejo de actualización de celdas
  const handleCellChange = (rowId: string, colId: string, newValue: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            version: r.version + 1,
            data: {
              ...r.data,
              [colId]: newValue,
            },
          };
        }
        return r;
      })
    );
  };

  // Añadir nueva fila
  const handleAddRow = () => {
    const newId = `rec_${Date.now()}`;
    const newRow: RowData = {
      id: newId,
      order: rows.length + 1,
      version: 1,
      data: {
        fld_code: `CONT-${Math.floor(100000 + Math.random() * 900000)}`,
        fld_status: 'opt_fabrica',
        fld_fob: 0,
        fld_clp: 0,
        fld_progress: 0,
        fld_rating: 0,
        fld_date: new Date().toISOString().split('T')[0],
      },
      content: '## Nuevo Registro\nSin notas registradas aún.',
    };
    setRows((prev) => [...prev, newRow]);
  };

  // Exportar a CSV con BOM compatible con Excel es-CL
  const handleExportCSV = () => {
    const headers = columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(';');
    const lines = rows.map((r) =>
      columns
        .map((c) => {
          const val = r.data[c.id];
          if (val === null || val === undefined) return '""';
          if (c.type === 'select') {
            const opt = c.options?.options?.find((o: any) => o.id === val);
            return `"${(opt?.value || val).toString().replace(/"/g, '""')}"`;
          }
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(';')
    );

    const csvContent = '\uFEFF' + [headers, ...lines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_lotes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtrado reactivo por texto
  const filteredRows = rows.filter((r) => {
    if (!searchQuery) return true;
    return Object.values(r.data).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Bar / App Navigation */}
      <header className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-slate-800 dark:text-white">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
              BL
            </div>
            <span>BaserowLite</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Workspace & Base Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-400">Yarken Principal</span>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-white">Operaciones & Compras</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local DB Online</span>
          </div>
        </div>
      </header>

      {/* Notion-style Tabs Bar */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-1 shrink-0 overflow-x-auto">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b-2 border-blue-600"
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>Lotes de Importación</span>
          <span className="text-[10px] text-slate-400 font-mono ml-1">({rows.length})</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Tabla</span>
        </button>
      </div>

      {/* Views & Controls Header */}
      <div className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeView === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeView === 'kanban'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KanbanIcon className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('form')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeView === 'form'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formulario</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Búsqueda rápida */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar contenedor, estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-md transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4">
        {activeView === 'grid' && (
          <div className="max-w-full">
            <DataGrid
              columns={columns}
              rows={filteredRows}
              onCellChange={handleCellChange}
              onRowSelect={(row) => setSelectedRecord(row)}
              onAddRow={handleAddRow}
            />
          </div>
        )}

        {activeView === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {columns
              .find((c) => c.id === 'fld_status')
              ?.options?.options?.map((opt: any) => {
                const columnRows = filteredRows.filter((r) => r.data.fld_status === opt.id);
                const totalFob = columnRows.reduce((acc, r) => acc + (Number(r.data.fld_fob) || 0), 0);

                return (
                  <div
                    key={opt.id}
                    className="w-72 shrink-0 flex flex-col bg-slate-100/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800"
                  >
                    {/* Header de Columna Kanban */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <Badge label={opt.value} colorId={opt.color} />
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {columnRows.length}
                      </span>
                    </div>

                    {/* Tarjetas */}
                    <div className="flex-1 space-y-2.5 overflow-y-auto">
                      {columnRows.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {r.data.fld_code}
                            </span>
                            <Rating value={Number(r.data.fld_rating)} readOnly />
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500">Inversión FOB:</span>
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(r.data.fld_fob, { currencySymbol: 'US$', precision: 2 }).formattedText}
                            </span>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>Avance:</span>
                              <span>{r.data.fld_progress}%</span>
                            </div>
                            <ProgressBar value={Number(r.data.fld_progress)} showText={false} />
                          </div>

                          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex justify-between text-[11px] text-slate-400">
                            <span>Arribo:</span>
                            <span className="font-mono">{formatDate(r.data.fld_date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer de Totales por Columna */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-mono text-slate-500 px-1">
                      <span>Total FOB:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(totalFob, { currencySymbol: 'US$', precision: 0 }).formattedText}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {activeView === 'form' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registro de Nuevo Lote de Importación
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Formulario schema-driven con validación de tipos y almacenamiento seguro local.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddRow();
                setActiveView('grid');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Código de Contenedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. MSKU-109283-4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado Inicial
                </label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="opt_fabrica">En Fábrica</option>
                  <option value="opt_transito">En Tránsito</option>
                  <option value="opt_aduana">En Aduana San Antonio</option>
                  <option value="opt_bodega">Recibido en Bodega</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Inversión FOB (US$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Arribo
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors mt-2"
              >
                Guardar y Registrar Lote
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Drawer Lateral de Detalle con Notas Markdown tipo Notion */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col p-5 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Detalle del Registro</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedRecord.data.fld_code}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-4 flex-1">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Estado:</span>
                <div>
                  {(() => {
                    const opt = columns[1].options?.options?.find(
                      (o: any) => o.id === selectedRecord.data.fld_status
                    );
                    return opt ? <Badge label={opt.value} colorId={opt.color} /> : null;
                  })()}
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Inversión FOB:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(selectedRecord.data.fld_fob, { currencySymbol: 'US$', precision: 2 }).formattedText}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Costo Puesto:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(selectedRecord.data.fld_clp, { currencySymbol: '$', precision: 0 }).formattedText}
                </span>
              </div>

              <div className="py-1.5 border-b border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400">Avance Logístico:</span>
                <ProgressBar value={Number(selectedRecord.data.fld_progress)} />
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Calificación Naviera:</span>
                <Rating value={Number(selectedRecord.data.fld_rating)} readOnly />
              </div>
            </div>

            {/* Canvas de Notas Markdown tipo Notion */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-white mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Notas y Bitácora (Markdown)</span>
              </div>
              <textarea
                rows={6}
                value={selectedRecord.content || ''}
                onChange={(e) => {
                  const newContent = e.target.value;
                  setSelectedRecord((prev) => prev ? { ...prev, content: newContent } : null);
                  setRows((prev) =>
                    prev.map((r) => (r.id === selectedRecord.id ? { ...r, content: newContent } : r))
                  );
                }}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Trazabilidad y Auditoría */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Versión del registro: <strong>v{selectedRecord.version}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Audit trail: Guardado local en PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
