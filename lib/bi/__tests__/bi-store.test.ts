import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../state/dashboard-store';

describe('BI Dashboard State Store', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      dashboards: [],
      folders: [],
      activeDashboard: null,
      activeTabId: null,
      crossFilters: {},
      isKioskMode: false,
      autoRefreshSeconds: 0,
      searchQuery: '',
    });
  });

  it('debe manipular filtros cruzados (set, toggle y clear)', () => {
    const store = useDashboardStore.getState();

    // 1. Agregar filtro cruzado
    store.setCrossFilter('estado', {
      field: 'estado_embarque',
      value: 'opt_transito',
      label: 'Estado: En Tránsito',
    });

    expect(useDashboardStore.getState().crossFilters['estado']).toBeDefined();
    expect(useDashboardStore.getState().crossFilters['estado'].value).toBe('opt_transito');

    // 2. Toggle: al llamar de nuevo con el mismo valor, se remueve
    store.setCrossFilter('estado', {
      field: 'estado_embarque',
      value: 'opt_transito',
      label: 'Estado: En Tránsito',
    });

    expect(useDashboardStore.getState().crossFilters['estado']).toBeUndefined();

    // 3. Agregar múltiples filtros y limpiar todo
    store.setCrossFilter('estado', {
      field: 'estado_embarque',
      value: 'opt_aduana',
      label: 'Estado: Aduana',
    });
    store.setCrossFilter('cliente', {
      field: 'cliente_id',
      value: 'CLI-01',
      label: 'Cliente: Bambú',
    });

    expect(Object.keys(useDashboardStore.getState().crossFilters).length).toBe(2);

    store.clearAllCrossFilters();
    expect(Object.keys(useDashboardStore.getState().crossFilters).length).toBe(0);
  });

  it('debe alternar modo kiosko correctamente', () => {
    const store = useDashboardStore.getState();
    expect(useDashboardStore.getState().isKioskMode).toBe(false);

    store.toggleKioskMode();
    expect(useDashboardStore.getState().isKioskMode).toBe(true);

    store.toggleKioskMode();
    expect(useDashboardStore.getState().isKioskMode).toBe(false);
  });

  it('debe actualizar el rango temporal activo', () => {
    const store = useDashboardStore.getState();
    store.setTimeRange({
      field: 'fecha_estimada_arribo',
      preset: 'this_month',
    });

    expect(useDashboardStore.getState().activeTimeRange.preset).toBe('this_month');
    expect(useDashboardStore.getState().activeTimeRange.field).toBe('fecha_estimada_arribo');
  });
});
