'use client';

import React, { useEffect, useState } from 'react';
import { FolderTreeSidebar } from './folder-tree-sidebar';
import { DashboardView } from './dashboard-view';
import { NewBiDashboardModal } from '@/components/modals/new-bi-dashboard-modal';
import { NewBiCardModal } from '@/components/modals/new-bi-card-modal';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';

interface BiAnalyticsPageProps {
  onNavigateToTable?: (tableId: string) => void;
}

export function BiAnalyticsPage({ onNavigateToTable }: BiAnalyticsPageProps = {}) {
  const { fetchDashboardsAndFolders, isKioskMode } = useDashboardStore();
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardsAndFolders();
  }, []);

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Barra Lateral de Carpetas y Dashboards (oculta en modo Kiosko) */}
      {!isKioskMode && (
        <FolderTreeSidebar
          onNewDashboard={() => setIsDashboardModalOpen(true)}
        />
      )}

      {/* Vista Principal de Dashboard */}
      <DashboardView
        onNewCard={() => setIsCardModalOpen(true)}
        onNavigateToTable={onNavigateToTable}
      />

      {/* Modales de Creación */}
      <NewBiDashboardModal
        isOpen={isDashboardModalOpen}
        onClose={() => setIsDashboardModalOpen(false)}
      />

      <NewBiCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
}
