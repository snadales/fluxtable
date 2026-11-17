'use client';

import React, { useState } from 'react';
import { 
  X, Plus, Tag, Table as TableIcon, Palette, 
  Ship, Package, ShoppingCart, Briefcase, BarChart2, Database, Globe, Check
} from 'lucide-react';

interface NewTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    tags: string[];
  }) => Promise<void>;
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
  { id: 'table', label: 'Tabla Estructurada', Icon: TableIcon },
  { id: 'package', label: 'Paquete / Stock', Icon: Package },
  { id: 'ship', label: 'Barco / Naviera', Icon: Ship },
  { id: 'cart', label: 'Compras / Retail', Icon: ShoppingCart },
  { id: 'briefcase', label: 'Negocios', Icon: Briefcase },
  { id: 'chart', label: 'Métricas / KPI', Icon: BarChart2 },
  { id: 'database', label: 'Base de Datos', Icon: Database },
  { id: 'globe', label: 'Multicanal / Web', Icon: Globe },
];

export const NewTableModal: React.FC<NewTableModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('table');
  const [color, setColor] = useState('blue');
  const [tags, setTags] = useState<string[]>(['nuevo']);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la tabla es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        tags,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear la tabla');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-table-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="new-table-title" className="font-bold text-sm text-slate-900 dark:text-white">
                Crear Nueva Tabla
              </h2>
              <p className="text-[11px] text-slate-500">
                Agrega una nueva tabla relacional en tu base activa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Tabla <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej: Proveedores Internacionales"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción o Propósito
            </label>
            <textarea
              rows={2}
              placeholder="ej: Catálogo y contactos de agentes de aduana y navieras"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Selector de Icono */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Icono de la Tabla
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map(({ id, label, Icon }) => {
                const isSelected = icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIcon(id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-medium truncate">{label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Color */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2">
              {AVAILABLE_COLORS.map(({ id, label, bg, ring }) => {
                const isSelected = color === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setColor(id)}
                    title={label}
                    className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center text-white transition-all ${
                      isSelected ? `ring-3 ${ring} scale-110 shadow-sm` : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Etiquetas (#tags)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creando...' : 'Crear Tabla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
