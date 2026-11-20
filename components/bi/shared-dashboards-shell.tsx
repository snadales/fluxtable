'use client';

/**
 * Vista reducida para usuarios invitados (rol global `shared`, #54): solo los dashboards compartidos
 * con ellos. Sin tablas, catálogo, carpetas ni administración (el servidor también lo bloquea).
 */
import React, { useEffect } from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';
import { DashboardView } from './dashboard-view';

interface SharedDashboardsShellProps {
  user: { id?: string; name: string; email: string };
}

export function SharedDashboardsShell({ user }: SharedDashboardsShellProps) {
  const { dashboards, activeDashboard, fetchDashboardsAndFolders, selectDashboard, isKioskMode, isLoading } =
    useDashboardStore();

  useEffect(() => {
    (async () => {
      await fetchDashboardsAndFolders();
      const st = useDashboardStore.getState();
      // Si el enlace directo no abrió uno, se abre el primero compartido.
      if (!st.activeDashboard && st.dashboards?.length) {
        let pending = false;
        try {
          pending = Boolean(sessionStorage.getItem('ft_deeplink'));
        } catch {
          /* sin sessionStorage */
        }
        if (!pending) await selectDashboard(st.dashboards[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = dashboards || [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {!isKioskMode && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">Dashboards compartidos</span>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-none" title={user.email}>
              {user.email}
            </span>
            <a
              href="/cdn-cgi/access/logout"
              className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Salir
            </a>
          </div>
        </header>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {!isKioskMode && list.length > 1 && (
          <nav
            aria-label="Dashboards compartidos contigo"
            className="md:w-60 shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2 overflow-x-auto md:overflow-y-auto"
          >
            <ul className="flex md:flex-col gap-1">
              {list.map((d: any) => {
                const active = activeDashboard?.id === d.id;
                return (
                  <li key={d.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => selectDashboard(d.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono text-[10px]">{d.code}</span>
                      <span className="truncate max-w-[160px]">{d.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {list.length === 0 && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <LayoutDashboard className="w-10 h-10 text-slate-300 mb-3" aria-hidden="true" />
            <h1 className="text-sm font-semibold">Aún no tienes dashboards compartidos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Pide a quien administra el dashboard que te lo comparta con {user.email}.
            </p>
          </div>
        ) : (
          // Sin onNewCard ni onNavigateToTable: un invitado no crea tarjetas ni abre tablas.
          <DashboardView currentUser={user} />
        )}
      </div>
    </div>
  );
}
