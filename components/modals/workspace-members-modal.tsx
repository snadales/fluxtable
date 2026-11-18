'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Shield, Trash2, Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: string;
  createdAt: string;
}

interface WorkspaceMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  currentUserEmail?: string;
}

export function WorkspaceMembersModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  currentUserEmail,
}: WorkspaceMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMembers = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/database/workspaces/${workspaceId}/members`);
      const data = await res.json();
      if (data.ok) {
        setMembers(data.members || []);
      }
    } catch (err: any) {
      console.error('Error fetching members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchMembers();
      setFeedback(null);
      setEmailInput('');
    }
  }, [isOpen, workspaceId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/database/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), role: roleInput }),
      });
      const data = await res.json();

      if (data.ok) {
        setFeedback({
          type: 'success',
          message: data.updated ? 'Rol de miembro actualizado exitosamente' : 'Miembro agregado exitosamente al espacio',
        });
        setEmailInput('');
        fetchMembers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error al agregar miembro' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error de conexión' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string | null) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${memberEmail || 'este usuario'} del espacio?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/database/workspaces/${workspaceId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setFeedback({ type: 'success', message: 'Miembro eliminado del espacio' });
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        setFeedback({ type: 'error', message: data.error || 'No se pudo eliminar el miembro' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error de conexión' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface-sunken/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Gestión de Miembros</h2>
              <p className="text-xs text-ink-3">Espacio: <span className="font-semibold text-ink-2">{workspaceName}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2.5 mx-5 mt-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-ok-tint/20 text-ok border border-ok/30'
                : 'bg-danger-tint/20 text-danger border border-danger/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Invite / Add Member Form */}
        <form onSubmit={handleAddMember} className="p-5 border-b border-line space-y-3 bg-surface">
          <label className="text-xs font-semibold text-ink-2 block">Añadir o Invitar Miembro</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-ink-3" />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="px-3 py-2 text-xs bg-surface-sunken border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Visor</option>
            </select>
            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-accent hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Añadir</span>
            </button>
          </div>
        </form>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-2">
            Miembros Actuales ({members.length})
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-ink-3 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent" />
              <span>Cargando miembros...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-6 text-xs text-ink-3">
              No se encontraron miembros en este espacio.
            </div>
          ) : (
            members.map((member) => {
              const isSelf = member.userEmail?.toLowerCase() === currentUserEmail?.toLowerCase();
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface hover:bg-surface-sunken/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(member.userName || member.userEmail || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-ink truncate">
                          {member.userName || member.userEmail?.split('@')[0]}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-accent/10 text-accent font-bold">
                            Tú
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-3 font-mono truncate block">
                        {member.userEmail}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                        member.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                          : member.role === 'editor'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {member.role}
                    </span>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id, member.userEmail)}
                        title="Eliminar del espacio"
                        className="p-1 rounded text-ink-3 hover:text-danger hover:bg-danger-tint/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-surface-sunken/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-ink-2 bg-surface hover:bg-surface-sunken border border-line rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
