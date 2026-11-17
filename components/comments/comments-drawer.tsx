'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, X, Send, CheckCircle2, Clock, Trash2, User, 
  Bot, Sparkles, Filter, Check, AlertCircle 
} from 'lucide-react';

export interface CommentItem {
  id: string;
  targetType: 'row' | 'table' | 'dashboard' | 'card';
  targetId: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  resolved: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'row' | 'table' | 'dashboard' | 'card';
  targetId: string;
  targetTitle: string;
  currentUser?: {
    name: string;
    email: string;
  };
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  currentUser = { name: 'Sebastián Nadales', email: 'snadales@gmail.com' },
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterResolved, setFilterResolved] = useState<'all' | 'unresolved' | 'resolved'>('all');

  // Cargar comentarios
  const loadComments = async () => {
    if (!targetId || !targetType) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Error cargando comentarios:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, targetType, targetId]);

  // Enviar nuevo comentario
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          content: newCommentText.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewCommentText('');
      }
    } catch (e) {
      console.error('Error publicando comentario:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle resuelto
  const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !currentResolved }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, resolved: !currentResolved } : c))
        );
      }
    } catch (e) {
      console.error('Error actualizando comentario:', e);
    }
  };

  // Eliminar comentario
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (e) {
      console.error('Error eliminando comentario:', e);
    }
  };

  if (!isOpen) return null;

  const filteredComments = comments.filter((c) => {
    if (filterResolved === 'unresolved') return !c.resolved;
    if (filterResolved === 'resolved') return c.resolved;
    return true;
  });

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-line shadow-2xl z-50 flex flex-col select-none">
      {/* Header */}
      <div className="h-14 border-b border-line px-4 flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-accent shrink-0" />
          <div className="truncate">
            <h3 className="font-bold text-xs text-ink truncate">
              Comentarios · {targetTitle}
            </h3>
            <span className="text-[10px] text-ink-3 uppercase tracking-wider">
              {targetType} ({comments.length})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filtro: Todos / Pendientes / Resueltos */}
      <div className="px-4 py-2 border-b border-line bg-surface-sunken/40 flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-ink-2">Filtrar:</span>
        <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-line text-[11px]">
          <button
            type="button"
            onClick={() => setFilterResolved('all')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              filterResolved === 'all' ? 'bg-accent text-white font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Todos ({comments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterResolved('unresolved')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              filterResolved === 'unresolved' ? 'bg-accent text-white font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Abiertos ({comments.filter((c) => !c.resolved).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterResolved('resolved')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              filterResolved === 'resolved' ? 'bg-accent text-white font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Resueltos ({comments.filter((c) => c.resolved).length})
          </button>
        </div>
      </div>

      {/* Stream de Comentarios */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-ink-3 text-xs">
            Cargando discusión...
          </div>
        ) : filteredComments.length > 0 ? (
          filteredComments.map((c) => {
            const isAgent = c.authorName.toLowerCase().includes('n8n') || 
                            c.authorName.toLowerCase().includes('antigravity') || 
                            c.authorName.toLowerCase().includes('claude');

            return (
              <div
                key={c.id}
                className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                  c.resolved
                    ? 'bg-surface-sunken/30 border-line opacity-75'
                    : 'bg-surface border-line shadow-2xs hover:border-accent/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      isAgent ? 'bg-purple-600' : 'bg-accent'
                    }`}>
                      {isAgent ? <Bot className="w-3.5 h-3.5" /> : c.authorName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-ink flex items-center gap-1.5">
                        <span>{c.authorName}</span>
                        {isAgent && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                            AGENTE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-3">
                        {new Date(c.createdAt).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleResolve(c.id, c.resolved)}
                      className={`p-1 rounded-lg transition-colors ${
                        c.resolved
                          ? 'text-ok bg-ok-tint'
                          : 'text-ink-3 hover:text-ok hover:bg-surface-sunken'
                      }`}
                      title={c.resolved ? 'Reabrir comentario' : 'Marcar como resuelto'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1 rounded-lg text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
                      title="Eliminar comentario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-ink whitespace-pre-wrap leading-relaxed pl-8">
                  {c.content}
                </p>

                {c.resolved && (
                  <div className="pl-8 flex items-center gap-1 text-[10px] font-semibold text-ok">
                    <Check className="w-3 h-3" />
                    <span>Resuelto</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-ink-3 text-xs italic space-y-1">
            <MessageSquare className="w-8 h-8 text-ink-3/40 mx-auto mb-2" />
            <p>No hay comentarios aún en este elemento.</p>
            <p className="text-[11px]">Deja una nota o sugerencia de mejora abajo.</p>
          </div>
        )}
      </div>

      {/* Input de Nuevo Comentario */}
      <form onSubmit={handleAddComment} className="p-3 border-t border-line bg-surface shrink-0 space-y-2">
        <div className="relative">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddComment(e);
              }
            }}
            placeholder="Escribe un comentario... (Cmd+Enter para enviar)"
            rows={3}
            className="w-full p-2.5 rounded-xl border border-line bg-surface-sunken text-xs text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:bg-surface resize-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ink-3">
            Soporta @menciones
          </span>
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Comentar</span>
          </button>
        </div>
      </form>
    </div>
  );
};
