import { create } from 'zustand';
import { DateRangeConfig } from '../analytics/query-builder';

export interface CrossFilterItem {
  field: string;
  value: any;
  label: string;
}

export interface DashboardState {
  dashboards: any[];
  folders: any[];
  activeDashboard: any | null;
  activeTabId: string | null;
  activeTimeRange: DateRangeConfig;
  crossFilters: Record<string, CrossFilterItem>;
  isKioskMode: boolean;
  autoRefreshSeconds: number;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardsAndFolders: () => Promise<void>;
  selectDashboard: (idOrCode: string) => Promise<void>;
  setActiveTab: (tabId: string | null) => void;
  setTimeRange: (range: DateRangeConfig) => void;
  setCrossFilter: (key: string, filter: CrossFilterItem) => void;
  clearCrossFilter: (key: string) => void;
  clearAllCrossFilters: () => void;
  toggleKioskMode: () => void;
  setAutoRefresh: (seconds: number) => void;
  setSearchQuery: (query: string) => void;
  refreshActiveDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: [],
  folders: [],
  activeDashboard: null,
  activeTabId: null,
  activeTimeRange: {
    field: 'created_at',
    preset: 'last_30_days',
  },
  crossFilters: {},
  isKioskMode: false,
  autoRefreshSeconds: 0,
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchDashboardsAndFolders: async () => {
    try {
      set({ isLoading: true, error: null });
      const [dashRes, foldRes] = await Promise.all([
        fetch('/api/bi/dashboards'),
        fetch('/api/bi/folders'),
      ]);

      const dashData = await dashRes.json();
      const foldData = await foldRes.json();

      set({
        dashboards: dashData.dashboards || [],
        folders: foldData.folders || [],
        isLoading: false,
      });

      // Si no hay dashboard seleccionado y hay al menos uno, seleccionar el primero
      if (!get().activeDashboard && dashData.dashboards && dashData.dashboards.length > 0) {
        get().selectDashboard(dashData.dashboards[0].id);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectDashboard: async (idOrCode: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch(`/api/bi/dashboards/${idOrCode}`);
      const data = await res.json();

      if (data.dashboard) {
        const firstTabId = data.dashboard.tabs && data.dashboard.tabs.length > 0
          ? data.dashboard.tabs[0].id
          : null;

        set({
          activeDashboard: data.dashboard,
          activeTabId: firstTabId,
          crossFilters: {}, // Resetear filtros cruzados al cambiar de dashboard
          autoRefreshSeconds: data.dashboard.autoRefreshInterval || 0,
          isLoading: false,
        });
      } else {
        set({ error: data.message || 'Dashboard no encontrado', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setActiveTab: (tabId: string | null) => {
    set({ activeTabId: tabId });
  },

  setTimeRange: (range: DateRangeConfig) => {
    set({ activeTimeRange: range });
  },

  setCrossFilter: (key: string, filter: CrossFilterItem) => {
    set((state) => {
      // Toggle: si ya está seleccionado el mismo valor, deseleccionar
      if (state.crossFilters[key] && state.crossFilters[key].value === filter.value) {
        const next = { ...state.crossFilters };
        delete next[key];
        return { crossFilters: next };
      }
      return {
        crossFilters: {
          ...state.crossFilters,
          [key]: filter,
        },
      };
    });
  },

  clearCrossFilter: (key: string) => {
    set((state) => {
      const next = { ...state.crossFilters };
      delete next[key];
      return { crossFilters: next };
    });
  },

  clearAllCrossFilters: () => {
    set({ crossFilters: {} });
  },

  toggleKioskMode: () => {
    set((state) => ({ isKioskMode: !state.isKioskMode }));
  },

  setAutoRefresh: (seconds: number) => {
    set({ autoRefreshSeconds: seconds });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  refreshActiveDashboard: async () => {
    const active = get().activeDashboard;
    if (active) {
      await get().selectDashboard(active.id);
    }
  },
}));
