'use client';

import React, { useState } from 'react';
import { 
  X, User, Lock, Mail, Bell, Sparkles, Key, Trash2, Check, Copy, ShieldCheck, Terminal
} from 'lucide-react';
import { getBaseUrl } from '@/lib/brand-config';

interface MySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
  onUpdateUser?: (name: string) => Promise<void>;
}

export const MySettingsModal: React.FC<MySettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'email' | 'tokens' | 'mcp'>('account');
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState('English');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);

  // Tokens de API de base de datos
  const [tokens, setTokens] = useState<Array<{ id: string; name: string; token: string; createdAt: string }>>([
    {
      id: 'tok_default',
      name: 'n8n & Automatizaciones Homelab',
      token: 'baserow_lite_sec_9a8f3b2c1d0e4f5a6b7c8d9e0f',
      createdAt: '2026-11-17',
    },
  ]);
  const [newTokenName, setNewTokenName] = useState('');

  if (!isOpen) return null;

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      await onUpdateUser(name);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateToken = () => {
    if (!newTokenName.trim()) return;
    const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setTokens([
      ...tokens,
      {
        id: `tok_${Date.now()}`,
        name: newTokenName.trim(),
        token: `baserow_lite_${rand}`,
        createdAt: new Date().toISOString().split('T')[0],
      },
    ]);
    setNewTokenName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col h-[520px]"
      >
        {/* Header (Print 8) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              SN
            </div>
            <h2 id="settings-title" className="font-bold text-sm text-slate-900 dark:text-white">
              My settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content with Left Sidebar (Print 8) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Settings Nav Sidebar */}
          <div className="w-48 border-r border-slate-100 dark:border-slate-800 p-2 space-y-0.5 text-xs bg-slate-50/30 dark:bg-slate-950/20 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'account'
                  ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Account</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'password'
                  ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tokens')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'tokens'
                  ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Database tokens</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mcp')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'mcp'
                  ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>MCP server</span>
            </button>
          </div>

          {/* Tab Panels */}
          <div className="flex-1 p-6 overflow-y-auto text-xs">
            {/* Account Panel (Print 8) */}
            {activeTab === 'account' && (
              <form onSubmit={handleSaveAccount} className="space-y-5 max-w-md">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                    Account
                  </h3>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Interface language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Español">Español (es-CL)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Updated!</span>
                      </>
                    ) : (
                      <span>Update account</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Password Panel */}
            {activeTab === 'password' && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password & Security
                </h3>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Autenticación Segura Activa</div>
                    <div className="text-[11px] opacity-90">
                      Tu cuenta está vinculada a Google SSO y protegida por autenticación corporativa y sesiones seguras.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Database Tokens Panel */}
            {activeTab === 'tokens' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Database Tokens
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tokens Bearer para acceso de scripts y automatizaciones
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del token (ej: Script n8n)"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateToken}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  >
                    Crear Token
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {tokens.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 dark:text-white">{t.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">{t.token}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(t.token)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                        title="Copiar token"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MCP Server Panel */}
            {activeTab === 'mcp' && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Model Context Protocol (MCP)
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Permite a asistentes IA (Antigravity, LiteLLM, Claude Code) consultar y modificar tablas de FluxTable en tiempo real mediante el protocolo MCP estándar.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] border border-slate-800 space-y-1 relative">
                  <div>{`// Conexión MCP FluxTable`}</div>
                  <div className="text-emerald-400">{`ENDPOINT = "${getBaseUrl()}/api"`}</div>
                  <div className="text-amber-300">AUTH = "Bearer token_..."</div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${getBaseUrl()}/api`);
                      setCopiedMcp(true);
                      setTimeout(() => setCopiedMcp(false), 2000);
                    }}
                    className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-white rounded"
                  >
                    {copiedMcp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
