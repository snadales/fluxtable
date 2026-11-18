'use client';

import React, { useState, useEffect } from 'react';
import { X, Webhook, Plus, Trash2, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface TableWebhooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
}

export const TableWebhooksModal: React.FC<TableWebhooksModalProps> = ({
  isOpen,
  onClose,
  tableId,
  tableName,
}) => {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [createdEvent, setCreatedEvent] = useState(true);
  const [updatedEvent, setUpdatedEvent] = useState(true);
  const [deletedEvent, setDeletedEvent] = useState(true);
  const [testStatus, setTestStatus] = useState<{ [id: string]: string }>({});

  const fetchWebhooks = async () => {
    if (!tableId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/database/webhooks/table/${tableId}`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (err) {
      console.error('Error fetching webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWebhooks();
    }
  }, [isOpen, tableId]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const events: string[] = [];
    if (createdEvent) events.push('rows.created');
    if (updatedEvent) events.push('rows.updated');
    if (deletedEvent) events.push('rows.deleted');

    try {
      const res = await fetch(`/api/database/webhooks/table/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, events }),
      });
      if (res.ok) {
        setName('');
        setUrl('');
        setShowAddForm(false);
        fetchWebhooks();
      }
    } catch (err) {
      console.error('Error creating webhook:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este webhook?')) return;
    try {
      const res = await fetch(`/api/database/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error('Error deleting webhook:', err);
    }
  };

  const handleToggleActive = async (hook: WebhookItem) => {
    try {
      const res = await fetch(`/api/database/webhooks/${hook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !hook.isActive }),
      });
      if (res.ok) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === hook.id ? { ...w, isActive: !w.isActive } : w))
        );
      }
    } catch (err) {
      console.error('Error toggling webhook:', err);
    }
  };

  const handleTest = async (id: string) => {
    setTestStatus((prev) => ({ ...prev, [id]: 'testing' }));
    try {
      const res = await fetch(`/api/database/webhooks/${id}/test`, { method: 'POST' });
      if (res.ok) {
        setTestStatus((prev) => ({ ...prev, [id]: 'success' }));
      } else {
        setTestStatus((prev) => ({ ...prev, [id]: 'failed' }));
      }
    } catch {
      setTestStatus((prev) => ({ ...prev, [id]: 'failed' }));
    }
    setTimeout(() => {
      setTestStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex flex-col w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Webhooks Salientes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Notifica eventos en tiempo real a n8n para la tabla <span className="font-medium text-slate-700 dark:text-slate-300">{tableName}</span>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Webhooks Configurados ({webhooks.length})
            </span>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Webhook
              </button>
            )}
          </div>

          {/* Formulario de creación */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Registrar Webhook para n8n
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nombre del Webhook
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Sincronización n8n - Pipeline Lotes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    URL de Destino (Endpoint de n8n)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://tu-servidor.com/webhook/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Eventos a Escuchar
                  </label>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createdEvent}
                        onChange={(e) => setCreatedEvent(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Fila Creada (rows.created)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updatedEvent}
                        onChange={(e) => setUpdatedEvent(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Fila Actualizada (rows.updated)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deletedEvent}
                        onChange={(e) => setDeletedEvent(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Fila Eliminada (rows.deleted)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Guardar Webhook
                </button>
              </div>
            </form>
          )}

          {/* Listado de webhooks */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-xs">Cargando webhooks...</span>
            </div>
          ) : webhooks.length === 0 && !showAddForm ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Webhook className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                No hay webhooks registrados para esta tabla
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Registra un webhook para recibir datos en n8n automáticamente al modificar filas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
                >
                  <div className="space-y-1 max-w-[65%]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {hook.name}
                      </span>
                      <button
                        onClick={() => handleToggleActive(hook)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                          hook.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {hook.isActive ? 'Activo' : 'Pausado'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {hook.url}
                    </p>
                    <div className="flex gap-1.5 flex-wrap pt-0.5">
                      {(hook.events || []).map((ev) => (
                        <span
                          key={ev}
                          className="text-[10px] bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(hook.id)}
                      disabled={testStatus[hook.id] === 'testing'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
                      title="Enviar ping de prueba a n8n"
                    >
                      {testStatus[hook.id] === 'testing' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : testStatus[hook.id] === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : testStatus[hook.id] === 'failed' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>Probar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(hook.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Eliminar webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
          <span>Los webhooks se envían asíncronamente con timeout de 5s sin afectar el rendimiento.</span>
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
