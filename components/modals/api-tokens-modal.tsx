'use client';

import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, X, ShieldCheck } from 'lucide-react';

interface ApiTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiTokensModal: React.FC<ApiTokensModalProps> = ({ isOpen, onClose }) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/tokens');
      if (res.ok) {
        const json = await res.json();
        setTokens(json.tokens || []);
      }
    } catch (e) {
      console.error('Error cargando tokens:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTokens();
      setGeneratedToken(null);
    }
  }, [isOpen]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    try {
      const res = await fetch('/api/v1/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        setGeneratedToken(json.token);
        setNewTokenName('');
        await loadTokens();
      }
    } catch (e) {
      console.error('Error creando token:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Tokens de Base de Datos (API)
              </h3>
              <p className="text-[11px] text-slate-500">
                Compatible 100% con scripts de Python, n8n y Odoo (Authorization: Token ...)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Banner de Token recién generado */}
          {generatedToken && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Token Creado Exitosamente</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Copia este token ahora. Por seguridad, no se volverá a mostrar en texto plano.
              </p>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-300 dark:border-emerald-700">
                <code className="flex-1 font-mono text-[11px] truncate text-slate-800 dark:text-white">
                  {generatedToken}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1 transition-colors text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Formulario de Creación */}
          <form onSubmit={handleCreateToken} className="space-y-2">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Crear Nuevo Token de Acceso
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="ej. navarino-compras-rw o odoo-sync"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generar</span>
              </button>
            </div>
          </form>

          {/* Lista de Tokens Existentes */}
          <div className="space-y-2 pt-2">
            <span className="font-semibold text-slate-800 dark:text-white">
              Tokens Activos ({tokens.length})
            </span>

            {isLoading ? (
              <div className="text-center py-6 text-slate-400 font-mono">Cargando tokens...</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-mono">
                No hay tokens de API generados aún.
              </div>
            ) : (
              tokens.map((t) => (
                <div
                  key={t.id}
                  className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>{t.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                        {t.prefix}...
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Creado: {new Date(t.createdAt).toLocaleDateString('es-CL')}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Lectura & Escritura
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
