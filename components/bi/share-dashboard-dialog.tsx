'use client';

/**
 * Diálogo «Compartir dashboard» (#54): invitar por correo con rol, ver y quitar accesos y copiar
 * el enlace directo. La autorización real la hace el servidor; aquí solo se ocultan opciones.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, Loader2, Trash2, UserPlus, X } from 'lucide-react';
import {
  DashboardCapabilities,
  SHARE_ROLE_LABELS,
  ShareRole,
  buildDashboardLink,
  isValidEmail,
  normalizeEmail,
} from '@/lib/auth/dashboard-permissions';

interface ShareRow {
  id: string;
  email: string;
  role: ShareRole;
  createdBy: string | null;
  name: string | null;
  userRole: string | null;
  isActive: boolean | null;
}

interface ShareDashboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: { id: string; code: string; name: string };
  access: DashboardCapabilities;
  currentUser?: { id?: string; email?: string } | null;
}

const ROLE_HELP: Record<ShareRole, string> = {
  lector: 'Ve, filtra e imprime el dashboard.',
  colaborador: 'Además puede invitar a otras personas como lectoras.',
  propietario: 'Edita el dashboard y administra todos los accesos.',
};

export function ShareDashboardDialog({ isOpen, onClose, dashboard, access, currentUser }: ShareDashboardDialogProps) {
  const titleId = useId();
  const emailId = useId();
  const roleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>(access.grantableRoles[0] ?? 'lector');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = typeof window !== 'undefined' ? buildDashboardLink(window.location.origin, dashboard.code) : '';
  const me = normalizeEmail(currentUser?.email ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bi/dashboards/${dashboard.id}/shares`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudieron cargar los accesos');
      setShares(json.shares || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dashboard.id]);

  useEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setEmail('');
    setNotice(null);
    setCopied(false);
    setRole(access.grantableRoles[0] ?? 'lector');
    load();
    const t = setTimeout(() => emailRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen, load, access.grantableRoles]);

  // Escape cierra; Tab queda dentro del diálogo.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const target = normalizeEmail(email);
    if (!isValidEmail(target)) {
      setError('Escribe un correo electrónico válido.');
      emailRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/bi/dashboards/${dashboard.id}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudo compartir');
      setShares(json.shares || []);
      setEmail('');
      const roleLabel = SHARE_ROLE_LABELS[role].toLowerCase();
      setNotice(
        json.user?.isActive === false
          ? `Acceso guardado, pero la cuenta de ${target} está desactivada.`
          : `${target} ahora tiene acceso como ${roleLabel}. Envíale el enlace para que entre con su cuenta de Google.`
      );
      emailRef.current?.focus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: ShareRow) => {
    if (!window.confirm(`¿Quitar el acceso de ${row.email} a ${dashboard.code}?`)) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/bi/dashboards/${dashboard.id}/shares?email=${encodeURIComponent(row.email)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudo quitar el acceso');
      setShares(json.shares || []);
      setNotice(`Se quitó el acceso de ${row.email}.`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar. Selecciona el enlace y cópialo a mano.');
    }
  };

  const canRemove = (row: ShareRow) =>
    normalizeEmail(row.email) !== me &&
    (access.canManageShares || (row.role === 'lector' && row.createdBy === currentUser?.id));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold">
              Compartir dashboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-mono">{dashboard.code}</span> · {dashboard.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 -m-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3" noValidate>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 min-w-0">
              <label htmlFor={emailId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Correo de Google
              </label>
              <input
                id={emailId}
                ref={emailRef}
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="nombre@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error) && !isValidEmail(email)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-40">
              <label htmlFor={roleId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rol
              </label>
              <select
                id={roleId}
                value={role}
                onChange={(e) => setRole(e.target.value as ShareRole)}
                aria-describedby={`${roleId}-help`}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {access.grantableRoles.map((r) => (
                  <option key={r} value={r}>
                    {SHARE_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p id={`${roleId}-help`} className="text-xs text-slate-500 dark:text-slate-400">
            {ROLE_HELP[role]}
          </p>
          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
            Compartir
          </button>

          <div aria-live="polite" className="min-h-[1rem]">
            {error && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {notice && !error && <p className="text-xs text-emerald-700 dark:text-emerald-400">{notice}</p>}
          </div>
        </form>

        <section aria-labelledby={`${titleId}-list`} className="px-5 pb-4">
          <h3 id={`${titleId}-list`} className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Personas con acceso
          </h3>
          {loading ? (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Cargando accesos…
            </p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Todavía no se ha compartido con nadie.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg">
              {shares.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {row.email}
                      {normalizeEmail(row.email) === me && <span className="text-slate-500 font-normal"> (tú)</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {SHARE_ROLE_LABELS[row.role]}
                      {row.isActive === false && ' · cuenta desactivada'}
                    </p>
                  </div>
                  {canRemove(row) && (
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      aria-label={`Quitar acceso de ${row.email}`}
                      title="Quitar acceso"
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            readOnly
            value={link}
            aria-label="Enlace directo al dashboard"
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          />
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </div>
  );
}
