'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Folder, Check, Sparkles, Layers } from 'lucide-react';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  parentFolderId?: string | null;
  parentFolderName?: string;
  baseId?: string | null;
  baseName?: string;
  onCreated: (folder: any) => void;
}

const EMOJI_OPTIONS = [
  '📁', '💼', '🤖', '📊', '⚡', '🔒', '👥', '📦', '🚛', '🎯', '💡', '📈', '💰', '🛒'
];

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Azul Cobalto', bg: 'bg-[#1D5BD8]', hex: '#1D5BD8', ring: 'ring-[#1D5BD8]' },
  { id: 'green', label: 'Esmeralda Operativo', bg: 'bg-emerald-600', hex: '#059669', ring: 'ring-emerald-600' },
  { id: 'purple', label: 'Violeta Estratégico', bg: 'bg-purple-600', hex: '#7C3AED', ring: 'ring-purple-600' },
  { id: 'amber', label: 'Ámbar Alertas', bg: 'bg-amber-600', hex: '#D97706', ring: 'ring-amber-600' },
  { id: 'rose', label: 'Carmesí Riesgo', bg: 'bg-rose-600', hex: '#E11D48', ring: 'ring-rose-600' },
  { id: 'cyan', label: 'Cian Integraciones', bg: 'bg-cyan-600', hex: '#0891B2', ring: 'ring-cyan-600' },
];

export function NewFolderModal({
  isOpen,
  onClose,
  workspaceId,
  parentFolderId = null,
  parentFolderName,
  baseId = null,
  baseName,
  onCreated,
}: NewFolderModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [color, setColor] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la carpeta es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/bi/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          baseId: baseId || null,
          parentId: parentFolderId || null,
          name: name.trim(),
          code: code.trim() || null,
          icon: emoji,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Error al crear la carpeta');
      }

      onCreated(data.folder);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextTitle = parentFolderName
    ? `Subcarpeta en «${parentFolderName}»`
    : baseName
    ? `Carpeta en «${baseName}»`
    : 'Nueva Carpeta de Negocio';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-xl">
              {emoji}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {parentFolderId ? '+ Nueva Subcarpeta' : '+ Nueva Carpeta'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {contextTitle}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Selector de Emoji */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Icono / Emoji del Módulo
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                    emoji === e
                      ? 'bg-white dark:bg-slate-700 shadow-xs border border-[#1D5BD8] scale-110'
                      : 'hover:bg-white/80 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre y Código */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Código
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="05.2"
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] text-slate-900 dark:text-white"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre de la Carpeta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: R014 · Invitaciones Pendientes"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Color Temático */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Color de Acento
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

          {/* Banner de Garantía de Invarianza */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#1D5BD8] shrink-0 mt-0.5" />
            <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
              <strong>Desacoplamiento Total:</strong> Esta carpeta es una etiqueta organizativa virtual. Podrás mover tablas, KPIs o reportes hacia ella sin alterar ninguna consulta SQL ni flujos de n8n.
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
                <span>Creando carpeta...</span>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Crear Carpeta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
