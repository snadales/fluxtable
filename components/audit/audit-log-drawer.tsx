'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  RefreshCw, 
  Filter, 
  Bot, 
  User, 
  Terminal, 
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

interface AuditLog {
  id: string;
  tableId: string;
  recordId: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  actorType: string;
  actorId: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  changedFields?: Record<string, { old: any; new: any }>;
  createdAt: string;
}

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId?: string;
}

export function AuditLogDrawer({ isOpen, onClose, tableId }: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/v1/audit-logs?limit=50';
      if (tableId) url += `&tableId=${encodeURIComponent(tableId)}`;
      if (actionFilter !== 'all') url += `&action=${encodeURIComponent(actionFilter)}`;
      if (searchQuery.trim()) url += `&actor=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, tableId, actionFilter]);

  if (!isOpen) return null;

  const getActorBadge = (actorId: string) => {
    const lower = actorId.toLowerCase();
    if (lower.includes('n8n')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Bot className="w-3 h-3 text-purple-600" />
          n8n Workflow
        </span>
      );
    }
    if (lower.includes('antigravity')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Terminal className="w-3 h-3 text-[#1D5BD8]" />
          Antigravity Agent
        </span>
      );
    }
    if (lower.includes('claude')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Bot className="w-3 h-3 text-amber-600" />
          Claude Code
        </span>
      );
    }
    if (lower.includes('human') || lower.includes('snadales') || lower.includes('sebastián')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <User className="w-3 h-3 text-emerald-600" />
          Sebastián Nadales (Admin)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
        <ShieldCheck className="w-3 h-3 text-gray-500" />
        {actorId}
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800">CREACIÓN</span>;
      case 'update':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-[#1D5BD8]">MODIFICACIÓN</span>;
      case 'delete':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800">ELIMINACIÓN</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-800">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1D5BD8]/10 text-[#1D5BD8] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Registro de Auditoría Forense</h2>
              <p className="text-xs text-gray-500">Trazabilidad cruzada de agentes (n8n, Antigravity, Claude)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-100 bg-white flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por agente (n8n, claude, antigravity)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D5BD8]"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1D5BD8] bg-white text-gray-700"
            >
              <option value="all">Todas las acciones</option>
              <option value="create">Creación</option>
              <option value="update">Modificación</option>
              <option value="delete">Eliminación</option>
            </select>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-[#1D5BD8] hover:bg-blue-50 rounded-md border border-gray-200 transition-colors"
              title="Actualizar registro"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F8FA]">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No se encontraron eventos de auditoría con los filtros actuales.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-white border border-gray-200/80 rounded-lg p-3.5 shadow-sm text-xs hover:border-[#1D5BD8]/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {getActionBadge(log.action)}
                    {getActorBadge(log.actorId)}
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {new Date(log.createdAt).toLocaleString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2 font-mono">
                  <span>Registro: <strong className="text-gray-700">{log.recordId ? log.recordId.slice(0, 12) + '...' : 'N/A'}</strong></span>
                  <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>

                {log.changedFields && Object.keys(log.changedFields).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Campos Modificados:</span>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(log.changedFields).map(([field, diff]) => (
                        <div key={field} className="bg-gray-50 rounded p-1.5 text-[11px] font-mono flex items-center justify-between">
                          <span className="font-semibold text-gray-600 truncate max-w-[120px]">{field}:</span>
                          <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                            <span className="text-rose-600 line-through truncate">{String(diff.old ?? 'vacío')}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-emerald-700 font-medium truncate">{String(diff.new ?? 'vacío')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
