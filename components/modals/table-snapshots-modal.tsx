'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Plus, Trash2, RotateCcw, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface SnapshotItem {
  id: string;
  name: string;
  tableId: string;
  createdAt: string;
}

interface TableSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
  onSnapshotRestored?: () => void;
}

export const TableSnapshotsModal: React.FC<TableSnapshotsModalProps> = ({
  isOpen,
  onClose,
  tableId,
  tableName,
  onSnapshotRestored,
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSnapshots = async () => {
    if (!tableId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/database/snapshots/table/${tableId}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error('Error fetching snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
      setMessage(null);
    }
  }, [isOpen, tableId]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/database/snapshots/table/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: snapshotName.trim() || undefined }),
      });
      if (res.ok) {
        setSnapshotName('');
        setMessage({ text: 'Snapshot creado correctamente', type: 'success' });
        fetchSnapshots();
      } else {
        setMessage({ text: 'Error al crear snapshot', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (snapshot: SnapshotItem) => {
    if (!confirm(`¿Estás seguro de restaurar la tabla desde '${snapshot.name}'? Los registros actuales serán reemplazados por los de esta copia.`)) {
      return;
    }
    setRestoringId(snapshot.id);
    try {
      const res = await fetch(`/api/database/snapshots/${snapshot.id}/restore`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setMessage({ text: `Restauración exitosa: ${data.restoredCount} registros recuperados`, type: 'success' });
        if (onSnapshotRestored) onSnapshotRestored();
      } else {
        setMessage({ text: 'Error al restaurar snapshot', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error de red al restaurar', type: 'error' });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este snapshot?')) return;
    try {
      const res = await fetch(`/api/database/snapshots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnapshots((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting snapshot:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex flex-col w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Snapshots y Respaldos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copias puntuales del estado de la tabla <span className="font-medium text-slate-700 dark:text-slate-300">{tableName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de feedback */}
        {message && (
          <div className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {/* Formulario nuevo snapshot */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del snapshot (ej. Antes de sincronizar n8n)"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Crear Snapshot</span>
            </button>
          </form>

          {/* Listado */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Historial de Snapshots ({snapshots.length})
            </span>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs">Cargando snapshots...</span>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No hay snapshots para esta tabla
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Crea un snapshot antes de transformaciones masivas para tener rollback inmediato.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
                  >
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {snap.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(snap.createdAt).toLocaleString('es-CL')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(snap)}
                        disabled={restoringId === snap.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
                        title="Restaurar este estado"
                      >
                        {restoringId === snap.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Restaurar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(snap.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Eliminar snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
          <span>Los snapshots capturan estructura, vistas y registros en JSONB de PostgreSQL.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
