'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Layers, Palette, Folder, Check, Sparkles } from 'lucide-react';

interface NewModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName?: string;
  existingCategories?: string[];
  onCreated: (newModule: any) => void;
}

const DEFAULT_CATEGORIES = [
  'Operaciones',
  'Comercial',
  'Seguridad',
  'Finanzas',
  'Voz & IA',
  'PIM & Catálogo',
  'Legal',
  'General',
];

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Azul Cobalto', bg: 'bg-[#1D5BD8]', ring: 'ring-[#1D5BD8]' },
  { id: 'green', label: 'Esmeralda', bg: 'bg-emerald-600', ring: 'ring-emerald-600' },
  { id: 'purple', label: 'Violeta', bg: 'bg-purple-600', ring: 'ring-purple-600' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-600', ring: 'ring-amber-600' },
  { id: 'rose', label: 'Rosa', bg: 'bg-rose-600', ring: 'ring-rose-600' },
  { id: 'cyan', label: 'Cian', bg: 'bg-cyan-600', ring: 'ring-cyan-600' },
];

export function NewModuleModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName = 'Negocios',
  existingCategories = [],
  onCreated,
}: NewModuleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operaciones');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [color, setColor] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const combinedCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter(Boolean)])
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del módulo es requerido');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() || 'General' : category;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/database/bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: name.trim(),
          description: description.trim() || null,
          category: finalCategory,
          color,
          icon: 'folder',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Error al crear módulo');
      }

      onCreated(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-[#1D5BD8]">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Nueva Carpeta / Módulo de Negocio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Workspace: <span className="font-semibold text-slate-700 dark:text-slate-200">{workspaceName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre del Módulo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Marketing · Campañas Digitales"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Área / Carpeta de Negocio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Área de Negocio (Carpeta Padre)
            </label>
            {!isCustomCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] text-slate-900 dark:text-white"
                >
                  {combinedCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Nueva Área Personalizada...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nombre de la nueva área..."
                  className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Color Temático */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Color Temático
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform ${
                    color === c.id ? `ring-2 ring-offset-2 ${c.ring} scale-110` : 'hover:scale-105'
                  }`}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción del Módulo (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo y alcance de este módulo..."
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Banner explicativo del framework unificado */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#1D5BD8] shrink-0 mt-0.5" />
            <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
              <strong>Estructura Estándar:</strong> Este módulo se creará con sus 4 subcarpetas listas:{' '}
              <span className="font-mono text-[11px] font-semibold text-[#1D5BD8]">01 Indicadores</span>,{' '}
              <span className="font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-300">02 Gráficos</span>,{' '}
              <span className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300">03 Tablas</span> y{' '}
              <span className="font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">05 Dashboards</span>.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1D5BD8] hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creando módulo...</span>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Crear Módulo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
