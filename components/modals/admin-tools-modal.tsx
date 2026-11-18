'use client';

import React, { useState } from 'react';
import { 
  X, LayoutDashboard, Key, ShieldCheck, Activity, Users, 
  Briefcase, Award, CheckCircle2, Search, ExternalLink, MoreHorizontal
} from 'lucide-react';

interface AdminToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminToolsModal: React.FC<AdminToolsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'workspaces' | 'auth' | 'licenses'>('dashboard');
  const [searchUser, setSearchUser] = useState('');
  const [searchWorkspace, setSearchWorkspace] = useState('');

  if (!isOpen) return null;

  // Datos empíricos tomados de las capturas del usuario (Prints 2, 4, 5)
  const usersList = [
    {
      id: '1',
      username: 'admin@fluxtable.local',
      name: 'Administrador',
      workspaces: ['Principal', 'Finanzas', 'Operaciones'],
      lastLogin: '11/17/2026 8:06 AM',
      signedUp: '10/09/2026 4:55 PM',
      active: true,
      tfa: false,
      initials: 'AD',
    },
    {
      id: '2',
      username: 'analista@fluxtable.local',
      name: 'Analista de Datos',
      workspaces: ['Principal'],
      lastLogin: '11/13/2026 3:01 PM',
      signedUp: '10/27/2026 8:39 AM',
      active: true,
      tfa: false,
      initials: 'AN',
    },
  ];

  const workspacesList = [
    {
      id: 'ws_principal',
      name: 'Principal',
      members: ['admin@fluxtable.local', 'analista@fluxtable.local'],
      applications: 19,
      rowCount: '22,852',
      storageUsed: '14.2 MB',
      created: '10/09/2026 4:56 PM',
    },
    {
      id: 'ws_operaciones',
      name: 'Operaciones',
      members: ['admin@fluxtable.local'],
      applications: 2,
      rowCount: '290,193',
      storageUsed: '48.6 MB',
      created: '10/12/2026 5:05 PM',
    },
    {
      id: 'ws_general',
      name: 'General',
      members: ['admin@fluxtable.local'],
      applications: 2,
      rowCount: '420',
      storageUsed: '1.8 MB',
      created: '10/19/2026 4:21 PM',
    },
    {
      id: 'ws_salud_priv',
      name: 'Salud (privado)',
      members: ['snadales@gmail.com'],
      applications: 1,
      rowCount: '93',
      storageUsed: '0.4 MB',
      created: '11/08/2026 11:20 AM',
    },
    {
      id: 'ws_salud_roshi',
      name: 'Salud-Roshi',
      members: ['snadales@gmail.com'],
      applications: 2,
      rowCount: '90',
      storageUsed: '0.3 MB',
      created: '11/08/2026 12:03 PM',
    },
  ];

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredWorkspaces = workspacesList.filter((w) =>
    w.name.toLowerCase().includes(searchWorkspace.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-settings-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col h-[640px]"
      >
        {/* Header (Print 2) */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">‹</span>
            <h2 id="admin-settings-title" className="font-bold text-sm text-slate-900 dark:text-white">
              Admin settings
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

        {/* Content with Left Nav (Prints 2, 4, 5) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Admin Sidebar */}
          <div className="w-52 border-r border-slate-100 dark:border-slate-800 p-3 space-y-4 text-xs bg-slate-50/40 dark:bg-slate-950/20 shrink-0 overflow-y-auto">
            {/* General Section */}
            <div>
              <div className="px-2 py-1 font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                General
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('auth')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTab === 'auth'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Authentication</span>
                </button>
              </div>
            </div>

            {/* People Section */}
            <div>
              <div className="px-2 py-1 font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                People
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTab === 'users'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Users</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('workspaces')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTab === 'workspaces'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>Workspaces</span>
                </button>
              </div>
            </div>

            {/* Licenses Section */}
            <div>
              <div className="px-2 py-1 font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                Licenses
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('licenses')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTab === 'licenses'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-slate-500" />
                  <span>Manage licenses</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Panel Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 1. Dashboard Tab (Print 2) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Dashboard
                </h3>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Totals */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Totals</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total users</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total workspaces</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total applications</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">29</span>
                      </div>
                    </div>
                  </div>

                  {/* New Users */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">New users</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">New users last 24 hours</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">New users last 7 days</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">New users last 30 days</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">1</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Active users</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active users last 24 hours</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">1</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active users last 7 days</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active users last 30 days</span>
                        <span className="font-bold text-sm text-emerald-600">2 (+100%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Chart (Print 2) */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-white">
                      User activity over time
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 bg-emerald-500 rounded" />
                        <span className="text-slate-500">New users</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 bg-blue-500 rounded" />
                        <span className="text-slate-500">Active users</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-44 w-full">
                    <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                      <line x1="0" y1="100" x2="600" y2="100" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="600" y2="50" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="0" y1="10" x2="600" y2="10" stroke="#e2e8f0" strokeDasharray="3 3" />
                      
                      {/* Active Users Path */}
                      <path
                        d="M 0 50 Q 50 10 100 50 T 200 10 T 300 50 T 400 10 T 500 10 T 600 50"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                      />
                      {/* New Users Path */}
                      <path
                        d="M 0 100 L 150 100 Q 180 50 200 100 L 600 100"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                    <span>Oct 19</span>
                    <span>Oct 25</span>
                    <span>Nov 1</span>
                    <span>Nov 7</span>
                    <span>Nov 14</span>
                    <span>Nov 17</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Users Tab (Print 4) */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    All users
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="bg-transparent outline-none w-full"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Username</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Workspaces</th>
                        <th className="py-2.5 px-3">Last login</th>
                        <th className="py-2.5 px-3">Signed up</th>
                        <th className="py-2.5 px-3 text-center">Active</th>
                        <th className="py-2.5 px-3 text-center">2FA</th>
                        <th className="py-2.5 px-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                                {u.initials}
                              </div>
                              <span className="font-mono text-slate-900 dark:text-white">{u.username}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.workspaces.map((w) => (
                                <span key={w} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {w}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{u.lastLogin}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{u.signedUp}</td>
                          <td className="py-3 px-3 text-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[10px] font-mono text-slate-400">Disabled</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Workspaces Tab (Print 5) */}
            {activeTab === 'workspaces' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    All workspaces
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchWorkspace}
                      onChange={(e) => setSearchWorkspace(e.target.value)}
                      className="bg-transparent outline-none w-full"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Members</th>
                        <th className="py-2.5 px-3 text-center">Applications</th>
                        <th className="py-2.5 px-3 text-right">Row count</th>
                        <th className="py-2.5 px-3 text-right">Storage Used</th>
                        <th className="py-2.5 px-3">Created</th>
                        <th className="py-2.5 px-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredWorkspaces.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{w.name}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {w.members.map((m) => (
                                <span key={m} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">{w.applications}</td>
                          <td className="py-3 px-3 text-right font-mono font-semibold">{w.rowCount}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500">{w.storageUsed}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{w.created}</td>
                          <td className="py-3 px-3 text-right">
                            <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Authentication Tab */}
            {activeTab === 'auth' && (
              <div className="space-y-4 max-w-lg">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Authentication Providers
                </h3>
                <p className="text-xs text-slate-500">
                  Proveedores de autenticación habilitados para FluxTable.
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Google OAuth SSO</div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Inicio de sesión rápido con cuenta Google (@gmail.com)</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">Activo</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Cloudflare Access Zero Trust</div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Validación de perímetro por encabezado Cf-Access</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">Activo</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Licenses Tab */}
            {activeTab === 'licenses' && (
              <div className="space-y-4 max-w-lg">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Manage Licenses
                </h3>
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                    <span>FluxTable · Edición Open-Source Soberana</span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    A diferencia de Baserow clásico que bloquea SSO, auditoría y vistas avanzadas bajo planes de pago Premium y Advanced, FluxTable incluye todas las capacidades de base de datos y BI analítico habilitadas de forma 100% gratuita y soberana.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
