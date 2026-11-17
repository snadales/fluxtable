'use client';

import React, { useState } from 'react';
import { X, Bell, ShieldAlert, Check } from 'lucide-react';

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardName: string;
  metricKey: string;
  initialThreshold?: {
    warningValue?: string;
    criticalValue?: string;
    direction?: 'above' | 'below';
  };
  onSave: (config: {
    warningValue: string;
    criticalValue: string;
    direction: 'above' | 'below';
    webhookUrl?: string;
  }) => Promise<void>;
}

export function ThresholdConfigModal({
  isOpen,
  onClose,
  cardId,
  cardName,
  metricKey,
  initialThreshold,
  onSave,
}: ThresholdConfigModalProps) {
  const [warningValue, setWarningValue] = useState(initialThreshold?.warningValue || '50000');
  const [criticalValue, setCriticalValue] = useState(initialThreshold?.criticalValue || '100000');
  const [direction, setDirection] = useState<'above' | 'below'>(initialThreshold?.direction || 'above');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        warningValue,
        criticalValue,
        direction,
        webhookUrl: webhookUrl.trim() || undefined,
      });
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
            <Bell className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Configurar Semáforo y Alertas</h2>
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

          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Tarjeta: <span className="font-semibold text-slate-800">{cardName}</span>
            <br />
            Métrica evaluada: <span className="font-mono text-blue-600">{metricKey}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Condición de Disparo
            </label>
            <select
              value={direction}
              onChange={(e: any) => setDirection(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="above">Alertar cuando el valor SUPERE el umbral (&gt;=)</option>
              <option value="below">Alertar cuando el valor CAIGA bajo el umbral (&lt;=)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Umbral Advertencia
              </label>
              <input
                type="number"
                required
                value={warningValue}
                onChange={(e) => setWarningValue(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Umbral Crítico
              </label>
              <input
                type="number"
                required
                value={criticalValue}
                onChange={(e) => setCriticalValue(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Webhook para Notificación (n8n / Telegram)
            </label>
            <input
              type="url"
              placeholder="https://n8n.yarken.cl/webhook/alertas-bi"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
            />
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
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Umbral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
