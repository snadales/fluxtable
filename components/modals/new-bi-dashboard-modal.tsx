'use client';

import React, { useState } from 'react';
import { X, LayoutDashboard, Folder, Plus } from 'lucide-react';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';

interface NewBiDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewBiDashboardModal({ isOpen, onClose }: NewBiDashboardModalProps) {
  const { folders, fetchDashboardsAndFolders, selectDashboard } = useDashboardStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/bi/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          folderId: folderId || null,
          autoRefreshInterval: Number(autoRefreshInterval),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error al crear dashboard');
      }

      await fetchDashboardsAndFolders();
      if (json.dashboard?.id) {
        await selectDashboard(json.dashboard.id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Nuevo Dashboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Dashboard *
            </label>
            <input
              type="text"
              required
              placeholder="ej. Balance Negocios & Rentabilidad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción Corta
            </label>
            <textarea
              rows={2}
              placeholder="Objetivo y alcance de las métricas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Carpeta Contenedora
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">(Raíz / General)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intervalo de Auto-Refresco
            </label>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value={0}>Desactivado (manual)</option>
              <option value={30}>Cada 30 segundos</option>
              <option value={60}>Cada 1 minuto</option>
              <option value={300}>Cada 5 minutos</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creando...' : 'Crear Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
