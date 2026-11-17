'use client';

import React, { useState } from 'react';
import { 
  X, Save, Tag, Folder, Table as TableIcon, Palette, 
  Ship, Package, ShoppingCart, Briefcase, BarChart2, Database, Globe, Check
} from 'lucide-react';

export interface BaseMetadata {
  baseName: string;
  baseDescription: string;
  baseCategory: string;
  baseIcon: string;
  baseColor: string;
  baseTags: string[];
  tableName: string;
  tableDescription: string;
  tableIcon: string;
  tableColor: string;
  tableTags: string[];
}

interface BaseSettingsModalProps {
  initialData: BaseMetadata;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BaseMetadata) => Promise<void>;
}

const AVAILABLE_COLORS = [
  { id: 'blue', label: 'Azul', bg: 'bg-blue-600', ring: 'ring-blue-400' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-600', ring: 'ring-purple-400' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-600', ring: 'ring-amber-400' },
  { id: 'rose', label: 'Rosa', bg: 'bg-rose-600', ring: 'ring-rose-400' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-600', ring: 'ring-cyan-400' },
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-600', ring: 'ring-indigo-400' },
];

const AVAILABLE_ICONS = [
  { id: 'ship', label: 'Barco / Naviera', Icon: Ship },
  { id: 'package', label: 'Paquete / Stock', Icon: Package },
  { id: 'table', label: 'Tabla Estructurada', Icon: TableIcon },
  { id: 'cart', label: 'Compras / Retail', Icon: ShoppingCart },
  { id: 'briefcase', label: 'Negocios', Icon: Briefcase },
  { id: 'chart', label: 'Métricas / KPI', Icon: BarChart2 },
  { id: 'database', label: 'Base de Datos', Icon: Database },
  { id: 'globe', label: 'Multicanal / Web', Icon: Globe },
];

const AVAILABLE_CATEGORIES = [
  'Operaciones & Compras',
  'Comercial & Marketplaces',
  'Finanzas & Liquidaciones',
  'Inventario & Logística',
  'RRHH & Postulaciones',
  'Homelab & Automatizaciones',
];

export const BaseSettingsModal: React.FC<BaseSettingsModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onSave,
}) => {
  const [data, setData] = useState<BaseMetadata>(initialData);
  const [activeTab, setActiveTab] = useState<'base' | 'table'>('base');
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = (target: 'base' | 'table') => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (!trimmed) return;

    if (target === 'base') {
      if (!data.baseTags.includes(trimmed)) {
        setData({ ...data, baseTags: [...data.baseTags, trimmed] });
      }
    } else {
      if (!data.tableTags.includes(trimmed)) {
        setData({ ...data, tableTags: [...data.tableTags, trimmed] });
      }
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (target: 'base' | 'table', tagToRemove: string) => {
    if (target === 'base') {
      setData({ ...data, baseTags: data.baseTags.filter((t) => t !== tagToRemove) });
    } else {
      setData({ ...data, tableTags: data.tableTags.filter((t) => t !== tagToRemove) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(data);
      onClose();
    } catch (err) {
      console.error('Error guardando configuración:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Configuración Visual y Metadatos
              </h3>
              <p className="text-[11px] text-slate-500">
                Personaliza nombres, descripciones, categorías, colores, iconos y etiquetas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Base vs Tabla */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('base')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'base'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Base de Datos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabla Activa</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'base' ? (
            <>
              {/* Nombre de Base */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Base *
                </label>
                <input
                  type="text"
                  required
                  value={data.baseName}
                  onChange={(e) => setData({ ...data, baseName: e.target.value })}
                  placeholder="ej. Operaciones & Compras"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoría del Ecosistema
                </label>
                <select
                  value={data.baseCategory}
                  onChange={(e) => setData({ ...data, baseCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {AVAILABLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={data.baseDescription}
                  onChange={(e) => setData({ ...data, baseDescription: e.target.value })}
                  placeholder="Breve propósito o notas de negocio de esta base..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Color de la Base */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setData({ ...data, baseColor: c.id })}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform ${
                        data.baseColor === c.id ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.label}
                    >
                      {data.baseColor === c.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icono de la Base */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Icono Representativo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setData({ ...data, baseIcon: id })}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        data.baseIcon === id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-blue-600" />
                      <span className="text-[11px] truncate">{label.split(' / ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags de la Base */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Etiquetas / Tags de la Base
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {data.baseTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag('base', tag)}
                        className="hover:text-red-500"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('base'))}
                    placeholder="Escribe un tag y presiona Enter..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag('base')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Añadir Tag
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Nombre de Tabla */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Tabla *
                </label>
                <input
                  type="text"
                  required
                  value={data.tableName}
                  onChange={(e) => setData({ ...data, tableName: e.target.value })}
                  placeholder="ej. Lotes de Importación"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Descripción de Tabla */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del Conjunto de Datos
                </label>
                <textarea
                  rows={2}
                  value={data.tableDescription}
                  onChange={(e) => setData({ ...data, tableDescription: e.target.value })}
                  placeholder="ej. Registro y seguimiento de costos FOB, arribos y desaduanamiento."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Color de la Tabla */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color de la Pestaña
                </label>
                <div className="flex items-center gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setData({ ...data, tableColor: c.id })}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform ${
                        data.tableColor === c.id ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.label}
                    >
                      {data.tableColor === c.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags de la Tabla */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Etiquetas de la Tabla
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {data.tableTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag('table', tag)}
                        className="hover:text-red-500"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('table'))}
                    placeholder="Escribe un tag de tabla..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag('table')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Añadir Tag
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
