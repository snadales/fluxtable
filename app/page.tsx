'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid, ColumnDef, RowData } from '@/components/grid/data-grid';
import { CalendarView } from '@/components/calendar/calendar-view';
import { FilterPopover, FilterCondition } from '@/components/grid/filter-popover';
import { SortPopover, SortCondition } from '@/components/grid/sort-popover';
import { FieldsPopover } from '@/components/grid/fields-popover';
import { BaseSettingsModal, BaseMetadata } from '@/components/modals/base-settings-modal';
import { ApiTokensModal } from '@/components/modals/api-tokens-modal';
import { NewTableModal } from '@/components/modals/new-table-modal';
import { NewFieldModal } from '@/components/modals/new-field-modal';
import { WorkspacesDashboard, WorkspaceGroup } from '@/components/workspaces/workspaces-dashboard';
import { WorkspaceUserMenu } from '@/components/modals/workspace-user-menu';
import { AdminToolsModal } from '@/components/modals/admin-tools-modal';
import { MySettingsModal } from '@/components/modals/my-settings-modal';
import { TableWebhooksModal } from '@/components/modals/table-webhooks-modal';
import { TableSnapshotsModal } from '@/components/modals/table-snapshots-modal';
import { BiAnalyticsPage } from '@/components/bi/bi-analytics-page';
import { useDashboardStore } from '@/lib/bi/state/dashboard-store';
import { FluxTableLogo } from '@/components/brand/brand-logo';
import { getBaseUrl } from '@/lib/brand-config';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { AssetCatalogView } from '@/components/assets/asset-catalog-view';
import { DocumentTabBar, DocumentTab } from '@/components/navigation/document-tab-bar';
import { CommentsDrawer } from '@/components/comments/comments-drawer';
import { AuditLogDrawer } from '@/components/audit/audit-log-drawer';
import { KpiRecipeModal } from '@/components/modals/kpi-recipe-modal';
import { NewModuleModal } from '@/components/modals/new-module-modal';
import { NewFolderModal } from '@/components/modals/new-folder-modal';
import { WorkspaceMembersModal } from '@/components/modals/workspace-members-modal';
import { 
  Database, Table as TableIcon, LayoutGrid, Kanban as KanbanIcon, 
  Calendar as CalendarIcon, FileText, Search, Download, Plus, Filter, ArrowUpDown, X, 
  Clock, Trash2, RotateCcw, RefreshCw, CheckCircle2, AlertCircle, Eye, Rss, Copy, Check,
  Ship, Package, ShoppingCart, Briefcase, BarChart2, Globe, Settings,
  ChevronDown, Folder, Palette, LayoutDashboard,
  Webhook, History, Layers, MoreHorizontal, MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Rating } from '@/components/ui/rating';
import { formatCurrency, formatDate } from '@/lib/formatters';

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'Código Contenedor', name: 'Código Contenedor', type: 'text', width: 170, isPrimary: true },
  { 
    id: 'Estado Embarque', 
    name: 'Estado Embarque', 
    type: 'select', 
    width: 170,
    options: {
      options: [
        { id: 'opt_fabrica', value: 'En Fábrica', color: 'yellow' },
        { id: 'opt_transito', value: 'En Tránsito', color: 'blue' },
        { id: 'opt_aduana', value: 'En Aduana San Antonio', color: 'orange' },
        { id: 'opt_bodega', value: 'Recibido en Bodega', color: 'green' },
      ]
    }
  },
  { 
    id: 'Inversión FOB', 
    name: 'Inversión FOB', 
    type: 'currency', 
    width: 150,
    options: { currencySymbol: 'US$', precision: 2, thousandsSeparator: ',', decimalSeparator: '.' }
  },
  { 
    id: 'Costo Final Puesto', 
    name: 'Costo Final Puesto', 
    type: 'currency', 
    width: 170,
    options: { currencySymbol: '$', precision: 0, thousandsSeparator: '.', decimalSeparator: ',' }
  },
  { id: 'Avance Logístico', name: 'Avance Logístico', type: 'progress', width: 150 },
  { id: 'Calificación Naviera', name: 'Calificación Naviera', type: 'rating', width: 160 },
  { id: 'Fecha Estimada Arribo', name: 'Fecha Estimada Arribo', type: 'date', width: 160, options: { dateFormat: 'DD/MM/YYYY' } },
];

export default function HomePage() {
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [rows, setRows] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'grid' | 'kanban' | 'calendar' | 'form' | 'gallery' | 'timeline'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RowData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashItems, setTrashItems] = useState<any[]>([]);

  // Filtros, Ordenamientos y Visibilidad de Campos
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [sorts, setSorts] = useState<SortCondition[]>([]);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [hiddenFieldIds, setHiddenFieldIds] = useState<string[]>([]);
  const [showFieldsPopover, setShowFieldsPopover] = useState(false);
  const [showIcalModal, setShowIcalModal] = useState(false);
  const [conditionalFormatting, setConditionalFormatting] = useState(true);
  const [copiedIcal, setCopiedIcal] = useState(false);

  // Estados de Grid Avanzado (Issue #26)
  const [rowHeight, setRowHeight] = useState<'compact' | 'medium' | 'tall'>('medium');
  const [zebraStriping, setZebraStriping] = useState<boolean>(false);
  const [groupByColumnId, setGroupByColumnId] = useState<string | null>(null);
  const [showGroupPopover, setShowGroupPopover] = useState(false);
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showRowHeightPopover, setShowRowHeightPopover] = useState(false);
  const [showViewPickerPopover, setShowViewPickerPopover] = useState(false);

  // Estados de Comentarios Contextuales (Issue #28)
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [activeCommentTarget, setActiveCommentTarget] = useState<{
    type: 'row' | 'table' | 'dashboard' | 'card';
    id: string;
    title: string;
  }>({
    type: 'table',
    id: '865',
    title: 'Lotes de Importación',
  });

  // Metadatos de Base y Tabla (Nombres, Descripciones, Categorías, Iconos, Colores, Tags)
  const [metadata, setMetadata] = useState<BaseMetadata>({
    baseName: 'Operaciones & Compras',
    baseDescription: 'Control operativo de compras internacionales y arribos marítimos',
    baseCategory: 'Operaciones & Compras',
    baseIcon: 'ship',
    baseColor: 'blue',
    baseTags: ['logistica', 'compras', 'navarino'],
    tableName: 'Lotes de Importación',
    tableDescription: 'Contenedores marítimos, avance logístico, costos FOB y fechas de arribo',
    tableIcon: 'package',
    tableColor: 'blue',
    tableTags: ['embarques', '2026', 'puerto'],
  });

  // Usuario y Sesión
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatarInitials: string;
    isZeroTrust: boolean;
  }>({
    name: 'Sebastián Nadales',
    email: 'snadales@gmail.com',
    role: 'superadmin',
    avatarInitials: 'SN',
    isZeroTrust: true,
  });

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBaseSettingsModal, setShowBaseSettingsModal] = useState(false);
  const [showWorkspaceMembersModal, setShowWorkspaceMembersModal] = useState(false);
  const [showApiTokensModal, setShowApiTokensModal] = useState(false);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [showNewFieldModal, setShowNewFieldModal] = useState(false);
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [newModuleWorkspaceId, setNewModuleWorkspaceId] = useState<string>('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folderModalContext, setFolderModalContext] = useState<{
    baseId?: string | null;
    baseName?: string;
    parentFolderId?: string | null;
    parentFolderName?: string;
  }>({});

  // Navegación de Workspaces y Modales Globales
  const [viewMode, setViewMode] = useState<'workspaces' | 'database' | 'analytics' | 'catalog'>('workspaces');
  const [catalogContext, setCatalogContext] = useState<{
    base: any;
    defaultTab?: 'indicators' | 'charts' | 'tables' | 'dashboards';
  } | null>(null);

  // Sistema de Pestañas Multi-Documento (Issue #33)
  const [openTabs, setOpenTabs] = useState<DocumentTab[]>([
    {
      id: 'workspaces',
      title: 'Espacios de Trabajo',
      type: 'workspaces',
      closable: false,
    },
    {
      id: 'table-865',
      title: 'Lotes de Importación',
      code: 'T865',
      type: 'table',
      closable: true,
      params: { tableId: '865' },
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('workspaces');
  const [inspectingKpiCode, setInspectingKpiCode] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceGroup[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [showWorkspaceUserMenu, setShowWorkspaceUserMenu] = useState(false);
  const [showAdminToolsModal, setShowAdminToolsModal] = useState(false);
  const [showMySettingsModal, setShowMySettingsModal] = useState(false);
  const [showWebhooksModal, setShowWebhooksModal] = useState(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);

  // Tablas dinámicas y tabla activa
  const [currentBaseId, setCurrentBaseId] = useState<string>('282');
  const [currentTableId, setCurrentTableId] = useState<string>('865');
  const [tablesList, setTablesList] = useState<Array<{
    id: string;
    legacyId?: number | null;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    tags?: string[];
  }>>([]);

  // Cargar metadatos de tabla y usuario al iniciar
  const loadMetadata = useCallback(async (targetId: string = currentTableId) => {
    try {
      const [tableRes, userRes] = await Promise.all([
        fetch(`/api/database/tables/${targetId}`),
        fetch('/api/v1/auth/me'),
      ]);

      if (tableRes.ok) {
        const json = await tableRes.json();
        setMetadata((prev) => ({
          ...prev,
          baseName: json.base?.name || prev.baseName,
          baseDescription: json.base?.description || prev.baseDescription,
          baseCategory: json.base?.category || prev.baseCategory,
          baseIcon: json.base?.icon || prev.baseIcon,
          baseColor: json.base?.color || prev.baseColor,
          baseTags: json.base?.tags || prev.baseTags,
          tableName: json.name || prev.tableName,
          tableDescription: json.description || prev.tableDescription,
          tableIcon: json.icon || prev.tableIcon,
          tableColor: json.color || prev.tableColor,
          tableTags: json.tags || prev.tableTags,
        }));
      }

      if (userRes.ok) {
        const uJson = await userRes.json();
        setUser({
          name: uJson.name,
          email: uJson.email,
          role: uJson.role,
          avatarInitials: uJson.avatarInitials || 'SN',
          isZeroTrust: uJson.isZeroTrust,
        });
      }
    } catch (e) {
      console.error('Error cargando metadatos iniciales:', e);
    }
  }, [currentTableId]);

  // Cargar lista de todas las tablas activas
  const loadTablesList = useCallback(async () => {
    try {
      const res = await fetch('/api/database/tables');
      if (res.ok) {
        const list = await res.json();
        setTablesList(list);
      }
    } catch (e) {
      console.error('Error cargando lista de tablas:', e);
    }
  }, []);

  // Columnas visibles según selección del usuario
  const visibleColumns = useMemo(() => {
    return columns.filter((c) => !hiddenFieldIds.includes(c.id));
  }, [columns, hiddenFieldIds]);

  // 1. Cargar datos reales y columnas dinámicas desde la API local
  const loadData = useCallback(async (targetId: string = currentTableId) => {
    try {
      setIsLoading(true);

      // Cargar campos dinámicos
      let currentCols: ColumnDef[] = DEFAULT_COLUMNS;
      try {
        const fieldsRes = await fetch(`/api/database/fields/table/${targetId}`);
        if (fieldsRes.ok) {
          const fData = await fieldsRes.json();
          if (Array.isArray(fData) && fData.length > 0) {
            currentCols = fData.map((f: any) => ({
              id: f.name,
              name: f.name,
              type: f.type,
              width: f.width || 170,
              isPrimary: !!f.isPrimary,
              options: f.options || {},
            }));
            setColumns(currentCols);
          } else {
            setColumns(DEFAULT_COLUMNS);
          }
        }
      } catch (fErr) {
        console.warn('Usando columnas por defecto:', fErr);
        setColumns(DEFAULT_COLUMNS);
      }

      // Cargar filas
      const res = await fetch(`/api/database/rows/table/${targetId}?user_field_names=true`);
      if (res.ok) {
        const json = await res.json();
        const mappedRows: RowData[] = (json.results || []).map((r: any) => {
          const rowData: Record<string, any> = {};
          currentCols.forEach((col) => {
            rowData[col.id] = r[col.id] !== undefined ? r[col.id] : '';
          });
          return {
            id: r.id,
            order: parseFloat(r.order) || 1,
            version: r.version || 1,
            data: rowData,
            content: r.content || '## Bitácora de Registro\nNotas y documentación adjunta.',
            actorLineage: r._actor_lineage || {},
          };
        });
        setRows(mappedRows);
      }
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentTableId]);

  // Cargar workspaces
  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await fetch('/api/database/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (e) {
      console.error('Error cargando workspaces:', e);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
    loadTablesList();
    loadMetadata();
    loadData();
  }, [loadWorkspaces, loadTablesList, loadMetadata, loadData]);

  // Abrir base de datos desde el dashboard de workspaces
  const handleOpenDatabase = async (baseId: string) => {
    setCurrentBaseId(baseId);
    try {
      const res = await fetch(`/api/database/tables?base_id=${baseId}`);
      if (res.ok) {
        const tList = await res.json();
        if (tList.length > 0) {
          const firstTbl = tList[0];
          const tableIdentifier = firstTbl.legacyId ? String(firstTbl.legacyId) : firstTbl.id;
          setCurrentTableId(tableIdentifier);
          await openTableTab(tableIdentifier, firstTbl.name);
          return;
        } else {
          await loadMetadata(baseId);
          setRows([]);
        }
      }
    } catch (e) {
      console.error('Error abriendo base:', e);
    }
    setViewMode('database');
  };

  // Crear workspace
  const handleCreateWorkspace = async () => {
    const name = prompt('Nombre del nuevo Espacio de Trabajo:');
    if (!name?.trim()) return;

    try {
      const res = await fetch('/api/database/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        await loadWorkspaces();
      }
    } catch (e) {
      console.error('Error creando workspace:', e);
    }
  };

  // Crear módulo/carpeta en workspace (Issue #35)
  const handleCreateDatabaseInWorkspace = (workspaceId: string) => {
    setNewModuleWorkspaceId(workspaceId || activeWorkspaceId || workspaces[0]?.id || '');
    setShowNewModuleModal(true);
  };

  // Crear subcarpeta anidada (Issue #36)
  const handleOpenCreateSubfolder = (
    baseId?: string | null,
    baseName?: string,
    parentFolderId?: string | null,
    parentFolderName?: string
  ) => {
    setFolderModalContext({ baseId, baseName, parentFolderId, parentFolderName });
    setShowNewFolderModal(true);
  };

  // Cambiar entre tablas
  const handleSwitchTable = async (tableIdentifier: string) => {
    setCurrentTableId(tableIdentifier);
    await Promise.all([
      loadMetadata(tableIdentifier),
      loadData(tableIdentifier),
    ]);
  };

  // Selección y Conmutación de Pestañas (Issue #33)
  const handleSelectTab = useCallback(async (tabId: string) => {
    setActiveTabId(tabId);
    const targetTab = openTabs.find((t) => t.id === tabId);
    if (!targetTab) return;

    if (targetTab.type === 'workspaces') {
      setViewMode('workspaces');
    } else if (targetTab.type === 'table') {
      const targetTableId = targetTab.params?.tableId;
      if (targetTableId && targetTableId !== currentTableId) {
        await handleSwitchTable(targetTableId);
      }
      setViewMode('database');
    } else if (targetTab.type === 'dashboard') {
      const targetDashId = targetTab.params?.dashboardId;
      if (targetDashId) {
        useDashboardStore.getState().selectDashboard(targetDashId);
      }
      setViewMode('analytics');
    } else if (targetTab.type === 'catalog') {
      if (targetTab.params?.base) {
        setCatalogContext({
          base: targetTab.params.base,
          defaultTab: targetTab.params.defaultCatalogTab || 'indicators',
        });
      }
      setViewMode('catalog');
    }
  }, [openTabs, currentTableId]);

  // Abrir tabla en pestaña
  const openTableTab = useCallback(async (tableIdentifier: string, nameHint?: string) => {
    const tabId = `table-${tableIdentifier}`;
    const foundTable = tablesList.find(t => t.id === tableIdentifier || String(t.legacyId) === tableIdentifier);
    const title = nameHint || foundTable?.name || metadata.tableName || `Tabla ${tableIdentifier}`;
    const code = foundTable?.legacyId ? `T${String(foundTable.legacyId).padStart(3, '0')}` : undefined;

    setOpenTabs((prev) => {
      const exists = prev.some((t) => t.id === tabId);
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: tabId,
          title,
          type: 'table',
          code,
          closable: true,
          params: { tableId: tableIdentifier },
        },
      ];
    });

    setActiveTabId(tabId);
    await handleSwitchTable(tableIdentifier);
    setViewMode('database');
  }, [tablesList, metadata.tableName]);

  // Abrir dashboard en pestaña
  const openDashboardTab = useCallback((dashboardId: string, codeHint?: string, nameHint?: string) => {
    const tabId = `dashboard-${dashboardId}`;
    const dashboards = useDashboardStore.getState().dashboards;
    const foundDash = dashboards.find(d => d.id === dashboardId || d.code === dashboardId);
    const title = nameHint || foundDash?.name || `Dashboard ${dashboardId}`;
    const code = codeHint || foundDash?.code || 'D';

    setOpenTabs((prev) => {
      const exists = prev.some((t) => t.id === tabId);
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: tabId,
          title,
          type: 'dashboard',
          code,
          closable: true,
          params: { dashboardId },
        },
      ];
    });

    setActiveTabId(tabId);
    useDashboardStore.getState().selectDashboard(dashboardId);
    setViewMode('analytics');
  }, []);

  // Abrir catálogo en pestaña
  const openCatalogTab = useCallback((base: any, defaultTab: 'indicators' | 'charts' | 'tables' | 'dashboards' = 'indicators') => {
    const tabId = `catalog-${base.id || base.name}`;
    const title = `📁 ${base.name}`;

    setOpenTabs((prev) => {
      const exists = prev.some((t) => t.id === tabId);
      if (exists) {
        return prev.map(t => t.id === tabId ? { ...t, params: { base, defaultCatalogTab: defaultTab } } : t);
      }
      return [
        ...prev,
        {
          id: tabId,
          title,
          type: 'catalog',
          closable: true,
          params: { base, defaultCatalogTab: defaultTab },
        },
      ];
    });

    setActiveTabId(tabId);
    setCatalogContext({ base, defaultTab });
    setViewMode('catalog');
  }, []);

  // Cerrar pestaña
  const handleCloseTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      if (idx === -1) return prev;
      const nextTabs = prev.filter((t) => t.id !== tabId);

      if (tabId === activeTabId) {
        const nextActive = nextTabs[Math.max(0, idx - 1)] || nextTabs[0];
        if (nextActive) {
          setTimeout(() => {
            handleSelectTab(nextActive.id);
          }, 0);
        }
      }

      return nextTabs;
    });
  }, [activeTabId, handleSelectTab]);

  // Crear nueva tabla
  const handleCreateTable = async (newTableData: {
    name: string;
    description: string;
    icon: string;
    color: string;
    tags: string[];
  }) => {
    const res = await fetch('/api/database/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTableData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error creando tabla');
    }

    const created = await res.json();
    await loadTablesList();
    await handleSwitchTable(created.id);
  };

  // Crear nueva columna
  const handleCreateField = async (newFieldData: {
    name: string;
    type: string;
    options?: Record<string, any>;
    width?: number;
  }) => {
    const res = await fetch(`/api/database/fields/table/${currentTableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFieldData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error agregando columna');
    }

    const created = await res.json();
    const newCol: ColumnDef = {
      id: created.name,
      name: created.name,
      type: created.type,
      width: created.width || 160,
      isPrimary: !!created.isPrimary,
      options: created.options || {},
    };
    setColumns((prev) => [...prev, newCol]);
  };

  // Guardar metadatos modificados
  const handleSaveMetadata = async (newMeta: BaseMetadata) => {
    const res = await fetch(`/api/database/tables/${currentTableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMeta),
    });

    if (res.ok) {
      setMetadata(newMeta);
      await loadTablesList();
    }
  };

  // Cargar papelera
  const loadTrash = async () => {
    try {
      const res = await fetch('/api/v1/trash');
      if (res.ok) {
        const json = await res.json();
        setTrashItems(json.trash || []);
      }
    } catch (e) {
      console.error('Error al cargar papelera:', e);
    }
  };

  // 2. Manejo de actualización de celdas con guardado asíncrono
  const handleCellChange = async (rowId: string, colId: string, newValue: any) => {
    // Optimistic UI update
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            version: r.version + 1,
            data: {
              ...r.data,
              [colId]: newValue,
            },
          };
        }
        return r;
      })
    );

    // Guardado en segundo plano
    setSyncStatus('saving');
    try {
      const patchRes = await fetch(`/api/database/rows/table/${currentTableId}/${rowId}?user_field_names=true`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [colId]: newValue }),
      });
      if (patchRes.ok) {
        setSyncStatus('saved');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      console.error('Error guardando celda:', e);
      setSyncStatus('error');
    }
  };

  // 3. Añadir nueva fila
  const handleAddRow = async () => {
    setSyncStatus('saving');
    const newPayload: Record<string, any> = {};
    columns.forEach((c) => {
      if (c.isPrimary) {
        newPayload[c.id] = `${c.name.toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
      } else if (c.type === 'currency' || c.type === 'number') {
        newPayload[c.id] = 1000;
      } else if (c.type === 'select') {
        const firstOpt = c.options?.options?.[0]?.id || c.options?.options?.[0]?.value || '';
        newPayload[c.id] = firstOpt;
      } else if (c.type === 'progress') {
        newPayload[c.id] = 10;
      } else if (c.type === 'rating') {
        newPayload[c.id] = 4;
      } else if (c.type === 'date') {
        newPayload[c.id] = new Date().toISOString().split('T')[0];
      } else if (c.type === 'boolean') {
        newPayload[c.id] = false;
      } else {
        newPayload[c.id] = '';
      }
    });

    try {
      const res = await fetch(`/api/database/rows/table/${currentTableId}?user_field_names=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayload),
      });

      if (res.ok) {
        const created = await res.json();
        const newRow: RowData = {
          id: created.id,
          order: parseFloat(created.order) || rows.length + 1,
          version: 1,
          data: newPayload,
          content: '## Nuevo Registro\nRegistro inicializado con éxito.',
        };
        setRows((prev) => [newRow, ...prev]);
        setSyncStatus('saved');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      console.error('Error creando fila:', e);
      setSyncStatus('error');
    }
  };

  // 4. Eliminar fila (Soft-delete hacia papelera)
  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('¿Mover este registro a la papelera? Podrás restaurarlo en cualquier momento.')) return;

    try {
      const res = await fetch(`/api/database/rows/table/${currentTableId}/${rowId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== rowId));
        if (selectedRecord?.id === rowId) setSelectedRecord(null);
      }
    } catch (e) {
      console.error('Error eliminando fila:', e);
    }
  };

  // 5. Restaurar fila desde papelera
  const handleRestoreRow = async (recordId: string) => {
    try {
      const res = await fetch(`/api/v1/trash/${recordId}/restore`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadTrash();
        await loadData();
      }
    } catch (e) {
      console.error('Error restaurando fila:', e);
    }
  };

  // 6. Exportar a CSV con BOM compatible con Excel es-CL
  const handleExportCSV = () => {
    const headers = columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(';');
    const lines = rows.map((r) =>
      columns
        .map((c) => {
          const val = r.data[c.id];
          if (val === null || val === undefined) return '""';
          if (c.type === 'select') {
            const opt = c.options?.options?.find((o: any) => o.id === val);
            return `"${(opt?.value || val).toString().replace(/"/g, '""')}"`;
          }
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(';')
    );

    const csvContent = '\uFEFF' + [headers, ...lines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_lotes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Procesamiento reactivo: Búsqueda + Filtros Avanzados + Ordenamientos
  const processedRows = useMemo(() => {
    let result = [...rows];

    // 1. Búsqueda por texto libre
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        Object.values(r.data).some((val) =>
          String(val ?? '').toLowerCase().includes(q)
        )
      );
    }

    // 2. Filtros avanzados
    if (filters.length > 0) {
      result = result.filter((row) => {
        return filters.every((flt) => {
          const val = row.data[flt.fieldId];
          const strVal = String(val ?? '').toLowerCase();
          const targetVal = flt.value.toLowerCase();

          switch (flt.operator) {
            case 'equal':
              return strVal === targetVal;
            case 'not_equal':
              return strVal !== targetVal;
            case 'contains':
              return strVal.includes(targetVal);
            case 'not_contains':
              return !strVal.includes(targetVal);
            case 'greater':
              return Number(val) > Number(flt.value);
            case 'less':
              return Number(val) < Number(flt.value);
            case 'empty':
              return val === null || val === undefined || val === '';
            case 'not_empty':
              return val !== null && val !== undefined && val !== '';
            default:
              return true;
          }
        });
      });
    }

    // 3. Ordenamientos multinivel
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const st of sorts) {
          const valA = a.data[st.fieldId];
          const valB = b.data[st.fieldId];
          if (valA === valB) continue;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          const numA = Number(valA);
          const numB = Number(valB);
          const isNum = !isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean';

          const diff = isNum ? numA - numB : String(valA).localeCompare(String(valB));
          if (diff !== 0) {
            return st.direction === 'asc' ? diff : -diff;
          }
        }
        return 0;
      });
    }

    return result;
  }, [rows, searchQuery, filters, sorts]);

  const renderIcon = (iconName: string, className: string = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'ship': return <Ship className={className} />;
      case 'package': return <Package className={className} />;
      case 'cart': return <ShoppingCart className={className} />;
      case 'briefcase': return <Briefcase className={className} />;
      case 'chart': return <BarChart2 className={className} />;
      case 'globe': return <Globe className={className} />;
      case 'database': return <Database className={className} />;
      default: return <TableIcon className={className} />;
    }
  };

  const getThemeColor = (colorName: string) => {
    switch (colorName) {
      case 'emerald': return { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'purple': return { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'amber': return { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'rose': return { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'cyan': return { bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-600', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'indigo': return { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default: return { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* 0. Barra de Pestañas Global Multi-Documento (Issue #33) */}
      <DocumentTabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
      />

      {/* 1. Shell Principal con AppSidebar ÚNICO y Persistente (Issue #37) */}
      <div className="flex-1 flex overflow-hidden relative">
        <AppSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          workspaces={workspaces}
          currentWorkspaceId={activeWorkspaceId || workspaces[0]?.id}
          currentBaseId={currentBaseId}
          currentTableId={currentTableId}
          currentViewMode={viewMode}
          tablesList={tablesList}
          rowCount={rows.length}
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          onOpenUserMenu={() => setShowWorkspaceUserMenu(true)}
          onSelectWorkspace={(wsId) => {
            setActiveWorkspaceId(wsId);
            handleSelectTab('workspaces');
          }}
          onSelectBase={(baseId) => {
            const b = workspaces.flatMap((w) => w.bases).find((x) => x.id === baseId);
            if (b && b.subfolders) {
              openCatalogTab(b, 'tables');
            } else {
              handleOpenDatabase(baseId);
            }
          }}
          onSelectTable={(tableId) => {
            openTableTab(tableId);
          }}
          onSelectDashboard={(dashId) => {
            openDashboardTab(dashId);
          }}
          onOpenCatalog={(base, defaultTab) => {
            openCatalogTab(base, defaultTab);
          }}
          onOpenWorkspaces={() => handleSelectTab('workspaces')}
          onOpenAnalytics={() => openDashboardTab('D001')}
          onOpenTrash={() => {
            loadTrash();
            setShowTrashModal(true);
          }}
          onOpenAudit={() => setShowAuditDrawer(true)}
          onOpenMembers={() => setShowWorkspaceMembersModal(true)}
          onOpenApiDocs={() => setShowApiTokensModal(true)}
          onOpenSnapshots={() => setShowSnapshotsModal(true)}
          onRenameBase={() => setShowBaseSettingsModal(true)}
          onCreateTable={() => setShowNewTableModal(true)}
          onCreateBase={() => handleCreateDatabaseInWorkspace(activeWorkspaceId || '')}
          onCreateSubfolder={(bId, bName, pId) => handleOpenCreateSubfolder(bId, bName, pId)}
          onInspectKpi={(code) => setInspectingKpiCode(code)}
        />

        {/* Lienzo Principal de Contenido según viewMode */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {viewMode === 'workspaces' && (
            <WorkspacesDashboard
              hideSidebar={true}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={setActiveWorkspaceId}
              onOpenDatabase={handleOpenDatabase}
              onOpenDashboard={(dashId) => {
                openDashboardTab(dashId);
              }}
              onOpenCatalog={(base, defaultTab) => {
                openCatalogTab(base, defaultTab);
              }}
              onCreateWorkspace={handleCreateWorkspace}
              onCreateDatabase={handleCreateDatabaseInWorkspace}
              onOpenTrash={() => {
                loadTrash();
                setShowTrashModal(true);
              }}
              onOpenAnalytics={() => openDashboardTab('D001')}
              user={{
                name: user.name,
                email: user.email,
                role: user.role,
              }}
              onOpenUserMenu={() => setShowWorkspaceUserMenu(true)}
            />
          )}

          {viewMode === 'analytics' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-100 dark:bg-slate-900">
              <header className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('workspaces')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/60 rounded-md font-medium transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Workspaces</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <BarChart2 className="w-4 h-4 text-[#1D5BD8]" />
                    <span>Dashboards & Analítica</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTableId) {
                        openTableTab(currentTableId);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/60 rounded-md font-medium transition-colors"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Ver Tabla Activa</span>
                  </button>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto">
                <BiAnalyticsPage 
                  hideFolderSidebar={true}
                  onInspectKpi={(code) => setInspectingKpiCode(code)}
                  onNavigateToTable={async (targetTableIdentifier) => {
                    await openTableTab(targetTableIdentifier);
                  }}
                />
              </div>
            </div>
          )}

          {viewMode === 'catalog' && catalogContext && (
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-50 dark:bg-slate-950">
              <AssetCatalogView
                moduleName={catalogContext.base?.name || 'Módulo de Negocio'}
                workspaceName={workspaces.find((w) => w.id === activeWorkspaceId)?.name || 'Negocios'}
                activeTab={catalogContext.defaultTab || 'indicators'}
                indicators={catalogContext.base?.subfolders?.indicators || []}
                charts={catalogContext.base?.subfolders?.charts || []}
                tables={catalogContext.base?.subfolders?.tables || []}
                dashboards={catalogContext.base?.subfolders?.dashboards || []}
                onInspectKpi={(code) => setInspectingKpiCode(code)}
                onOpenTable={async (tblIdentifier) => {
                  await openTableTab(tblIdentifier);
                }}
                onOpenDashboard={(dashId) => {
                  openDashboardTab(dashId);
                }}
                onBackToWorkspace={() => handleSelectTab('workspaces')}
                onCreateSubfolder={() => handleOpenCreateSubfolder(catalogContext.base?.id, catalogContext.base?.name)}
              />
            </div>
          )}

          {viewMode === 'database' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Bar / App Navigation */}
        <header className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Logo y marca Yarken */}
          <div
            onClick={() => setViewMode('workspaces')}
            className="cursor-pointer hover:opacity-90 transition-opacity flex items-center"
            title="Volver a Workspaces Dashboard"
          >
            <FluxTableLogo size={26} showWordmark={true} />
          </div>

          <div className="h-4 w-px bg-line mx-2" />

          {/* Breadcrumb: Workspaces / Negocios / Base */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('workspaces')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              title="Volver al panel principal de Workspaces"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Workspaces</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-500 font-medium hidden sm:inline">
              {metadata.baseCategory || 'Negocios'}
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>

            {/* Base & Categoría con Icono, Color y Tags */}
            <div
              onClick={() => setShowBaseSettingsModal(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group font-semibold text-slate-900 dark:text-white"
              title="Clic para editar metadatos, categoría, color e icono de la base"
            >
              <div className={`p-1 rounded ${getThemeColor(metadata.baseColor).badge} flex items-center justify-center`}>
                {renderIcon(metadata.baseIcon, 'w-3.5 h-3.5')}
              </div>
              <span className="group-hover:text-blue-600 transition-colors">{metadata.baseName}</span>
              <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón rápido Volver a Workspaces */}
          <button
            type="button"
            onClick={() => setViewMode('workspaces')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors font-medium"
            title="Ir al listado de espacios de trabajo"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspaces</span>
          </button>


          {/* Indicador de Sincronización */}
          {syncStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Guardando en PG...</span>
            </div>
          )}
          {syncStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Sincronizado</span>
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span>Error de red</span>
            </div>
          )}

          {/* Botón Papelera */}
          <button
            type="button"
            onClick={() => {
              loadTrash();
              setShowTrashModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Papelera</span>
          </button>

          {/* Menú de Usuario y Sesión (Print 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWorkspaceUserMenu(!showWorkspaceUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs text-left hidden sm:flex">
                <span className="font-semibold text-slate-800 dark:text-white text-[11px]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-bold">
                  {user.role}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user.avatarInitials}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Notion-style Tabs Bar */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-2 shrink-0 overflow-x-auto">
        {tablesList.length > 0 ? (
          tablesList.map((tbl) => {
            const tableIdentifier = tbl.legacyId ? String(tbl.legacyId) : tbl.id;
            const isActive = currentTableId === tableIdentifier || currentTableId === tbl.id;
            return (
              <div
                key={tbl.id}
                onClick={() => {
                  if (!isActive) handleSwitchTable(tableIdentifier);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 border-b-2 border-blue-600 shadow-2xs font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  {renderIcon(tbl.icon || 'table', `w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`)}
                  <span>{tbl.name}</span>
                  {isActive && <span className="text-[10px] text-slate-400 font-mono">({rows.length})</span>}
                </div>

                {tbl.tags && tbl.tags.length > 0 && (
                  <div className="flex items-center gap-1 pl-1 hidden sm:flex">
                    {tbl.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {isActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBaseSettingsModal(true);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700 ml-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Editar tabla, icono o tags"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border-b-2 border-blue-600 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              {renderIcon(metadata.tableIcon, 'w-3.5 h-3.5 text-blue-600')}
              <span>{metadata.tableName}</span>
              <span className="text-[10px] text-slate-400 font-mono">({rows.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBaseSettingsModal(true)}
              className="p-0.5 text-slate-400 hover:text-slate-700 ml-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Botón "+ Nueva Tabla" */}
        <button
          type="button"
          onClick={() => setShowNewTableModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-dashed border-slate-300 dark:border-slate-700 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Tabla</span>
        </button>
      </div>

      {/* Views & Controls Header */}
      <div className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* View Switcher Dropdown (Print 1 & Issue #26/#27) */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowViewPickerPopover(!showViewPickerPopover)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface font-semibold text-xs text-ink hover:bg-surface-sunken transition-colors shadow-2xs"
            >
              {activeView === 'grid' && <LayoutGrid className="w-3.5 h-3.5 text-accent" />}
              {activeView === 'kanban' && <KanbanIcon className="w-3.5 h-3.5 text-accent" />}
              {activeView === 'calendar' && <CalendarIcon className="w-3.5 h-3.5 text-accent" />}
              {activeView === 'form' && <FileText className="w-3.5 h-3.5 text-accent" />}
              <span className="capitalize">{activeView}</span>
              <ChevronDown className="w-3 h-3 text-ink-3" />
            </button>

            {showViewPickerPopover && (
              <div
                className="absolute left-0 top-full mt-1.5 w-60 bg-surface border border-line rounded-2xl shadow-xl py-2 z-50 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 pb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar vistas"
                      className="w-full pl-7 pr-3 py-1 rounded-lg border border-line bg-surface-sunken text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
                  Colaborativo
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('grid');
                    setShowViewPickerPopover(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 hover:bg-surface-sunken transition-colors text-left ${
                    activeView === 'grid' ? 'font-bold text-accent bg-accent/5' : 'text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-ink-2" />
                    <span>Grid</span>
                  </div>
                  {activeView === 'grid' && <Check className="w-4 h-4 text-accent" />}
                </button>

                <div className="h-px bg-line my-1" />

                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
                  Tipos de Vista
                </div>

                {[
                  { id: 'grid', label: 'Cuadrícula', icon: LayoutGrid },
                  { id: 'gallery', label: 'Galería', icon: LayoutDashboard },
                  { id: 'form', label: 'Formulario', icon: FileText },
                  { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
                  { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
                  { id: 'timeline', label: 'Línea de tiempo', icon: Clock },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      if (v.id === 'grid' || v.id === 'kanban' || v.id === 'calendar' || v.id === 'form') {
                        setActiveView(v.id as any);
                      } else {
                        alert(`Vista ${v.label} seleccionada`);
                      }
                      setShowViewPickerPopover(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-sunken transition-colors text-left text-ink"
                  >
                    <div className="flex items-center gap-2">
                      <v.icon className="w-3.5 h-3.5 text-ink-3" />
                      <span>{v.label}</span>
                    </div>
                    <Plus className="w-3 h-3 text-ink-3 hover:text-accent" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="p-1.5 rounded-xl border border-line text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
            title="Opciones de vista"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls: Campos, Filtros, Orden, Colores, iCal, Búsqueda, Exportar, + Fila */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Popover Ocultar/Mostrar Campos */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFieldsPopover(!showFieldsPopover);
                setShowFilterPopover(false);
                setShowSortPopover(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors shadow-2xs ${
                hiddenFieldIds.length > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Campos {hiddenFieldIds.length > 0 ? `(${columns.length - hiddenFieldIds.length}/${columns.length})` : ''}</span>
            </button>
            {showFieldsPopover && (
              <FieldsPopover
                columns={columns}
                hiddenFieldIds={hiddenFieldIds}
                onToggleHidden={(id) =>
                  setHiddenFieldIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
                onShowAll={() => setHiddenFieldIds([])}
                onHideAll={() =>
                  setHiddenFieldIds(columns.filter((c) => !c.isPrimary).map((c) => c.id))
                }
                onClose={() => setShowFieldsPopover(false)}
              />
            )}
          </div>

          {/* Botón "+ Columna" */}
          <button
            type="button"
            onClick={() => setShowNewFieldModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs font-medium"
            title="Agregar una nueva columna a la tabla"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Columna</span>
          </button>

          {/* Popover Filtros */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFilterPopover(!showFilterPopover);
                setShowFieldsPopover(false);
                setShowSortPopover(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors shadow-2xs ${
                filters.length > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtro {filters.length > 0 ? `(${filters.length})` : ''}</span>
            </button>
            {showFilterPopover && (
              <FilterPopover
                columns={columns}
                filters={filters}
                onFiltersChange={setFilters}
                onClose={() => setShowFilterPopover(false)}
              />
            )}
          </div>

          {/* Popover Ordenamiento */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSortPopover(!showSortPopover);
                setShowFilterPopover(false);
                setShowFieldsPopover(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors shadow-2xs ${
                sorts.length > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordenar {sorts.length > 0 ? `(${sorts.length})` : ''}</span>
            </button>
            {showSortPopover && (
              <SortPopover
                columns={columns}
                sorts={sorts}
                onSortsChange={setSorts}
                onClose={() => setShowSortPopover(false)}
              />
            )}
          </div>

          {/* Popover Agrupar (Group By) - Issue #26 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowGroupPopover(!showGroupPopover);
                setShowColorPopover(false);
                setShowRowHeightPopover(false);
                setShowFilterPopover(false);
                setShowSortPopover(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors shadow-2xs ${
                groupByColumnId
                  ? 'bg-accent/10 border-accent/40 text-accent font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Agrupar {groupByColumnId ? `(1)` : ''}</span>
            </button>
            {showGroupPopover && (
              <div
                className="absolute left-0 top-full mt-1.5 w-56 bg-surface border border-line rounded-xl shadow-xl py-1.5 z-50 text-xs font-medium text-ink"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-ink-3 border-b border-line uppercase tracking-wider">
                  Agrupar por columna
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGroupByColumnId(null);
                    setShowGroupPopover(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-sunken text-left ${
                    !groupByColumnId ? 'font-bold text-accent bg-accent/5' : ''
                  }`}
                >
                  <span>Ninguno (Desagrupar)</span>
                  {!groupByColumnId && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="h-px bg-line my-1" />
                {columns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      setGroupByColumnId(col.id);
                      setShowGroupPopover(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-sunken text-left ${
                      groupByColumnId === col.id ? 'font-bold text-accent bg-accent/5' : ''
                    }`}
                  >
                    <span className="truncate">{col.name}</span>
                    {groupByColumnId === col.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popover Color y Reglas de Filas - Issue #26 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPopover(!showColorPopover);
                setShowGroupPopover(false);
                setShowRowHeightPopover(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors shadow-2xs ${
                conditionalFormatting || zebraStriping
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Color</span>
            </button>
            {showColorPopover && (
              <div
                className="absolute left-0 top-full mt-1.5 w-60 bg-surface border border-line rounded-xl shadow-xl p-3 z-50 text-xs space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">
                  Colores de Fila
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-ink">Reglas condicionales</span>
                  <input
                    type="checkbox"
                    checked={conditionalFormatting}
                    onChange={(e) => setConditionalFormatting(e.target.checked)}
                    className="w-4 h-4 rounded text-accent"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-ink">Filas intercaladas (Zebra)</span>
                  <input
                    type="checkbox"
                    checked={zebraStriping}
                    onChange={(e) => setZebraStriping(e.target.checked)}
                    className="w-4 h-4 rounded text-accent"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Popover Altura de Fila - Issue #26 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRowHeightPopover(!showRowHeightPopover);
                setShowColorPopover(false);
                setShowGroupPopover(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Ajustar altura de las filas"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="capitalize">{rowHeight === 'compact' ? 'Compacto' : rowHeight === 'tall' ? 'Ampliado' : 'Simple'}</span>
            </button>
            {showRowHeightPopover && (
              <div
                className="absolute left-0 top-full mt-1.5 w-48 bg-surface border border-line rounded-xl shadow-xl py-1 z-50 text-xs font-medium text-ink"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-ink-3 border-b border-line uppercase tracking-wider">
                  Altura de Fila
                </div>
                {[
                  { id: 'compact', label: 'Compacto (28px)' },
                  { id: 'medium', label: 'Simple / Medio (36px)' },
                  { id: 'tall', label: 'Ampliado (56px)' },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setRowHeight(h.id as any);
                      setShowRowHeightPopover(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-surface-sunken text-left ${
                      rowHeight === h.id ? 'font-bold text-accent bg-accent/5' : ''
                    }`}
                  >
                    <span>{h.label}</span>
                    {rowHeight === h.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Feed iCal (Activo en vista Calendario) */}
          {activeView === 'calendar' && (
            <button
              type="button"
              onClick={() => setShowIcalModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors shadow-2xs"
            >
              <Rss className="w-3.5 h-3.5" />
              <span>Feed iCal</span>
            </button>
          )}

          {/* Búsqueda rápida */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-md transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Botón Webhooks para n8n */}
          <button
            type="button"
            onClick={() => setShowWebhooksModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-md transition-colors shadow-2xs"
            title="Configurar Webhooks salientes a n8n"
          >
            <Webhook className="w-3.5 h-3.5 text-indigo-500" />
            <span>Webhooks</span>
          </button>

          {/* Botón Snapshots de Tabla */}
          <button
            type="button"
            onClick={() => setShowSnapshotsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-md transition-colors shadow-2xs"
            title="Historial de Snapshots y Rollback"
          >
            <History className="w-3.5 h-3.5 text-emerald-500" />
            <span>Snapshots</span>
          </button>

          {/* Botón Comentarios de Tabla (Issue #28) */}
          <button
            type="button"
            onClick={() => {
              setActiveCommentTarget({
                type: 'table',
                id: currentTableId,
                title: metadata.tableName,
              });
              setShowCommentsDrawer(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-md transition-colors shadow-2xs"
            title="Abrir panel de comentarios de la tabla"
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span>Comentarios</span>
          </button>

          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nueva Fila</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-2 text-slate-400 text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Cargando registros desde PostgreSQL...</span>
          </div>
        ) : (
          <>
            {activeView === 'grid' && (
              <div className="max-w-full">
                <DataGrid
                  columns={visibleColumns}
                  rows={processedRows}
                  highlightRules={conditionalFormatting}
                  zebraStriping={zebraStriping}
                  rowHeight={rowHeight}
                  groupByColumnId={groupByColumnId}
                  onCellChange={handleCellChange}
                  onRowSelect={(row) => setSelectedRecord(row)}
                  onAddRow={handleAddRow}
                  onFilterByColumn={(colId) => {
                    setFilters((prev) => [
                      ...prev.filter((f) => f.fieldId !== colId),
                      { id: `flt_${Date.now()}`, fieldId: colId, operator: 'contains', value: '' },
                    ]);
                    setShowFilterPopover(true);
                  }}
                  onSortByColumn={(colId, dir) => {
                    setSorts([{ id: `srt_${Date.now()}`, fieldId: colId, direction: dir }]);
                  }}
                  onHideColumn={(colId) => {
                    setHiddenFieldIds((prev) => [...prev, colId]);
                  }}
                  onEditColumn={() => {
                    setShowNewFieldModal(true);
                  }}
                  onDuplicateColumn={(col) => {
                    const newCol: ColumnDef = {
                      ...col,
                      id: `${col.id}_copia_${Date.now()}`,
                      name: `${col.name} (Copia)`,
                      isPrimary: false,
                    };
                    setColumns((prev) => [...prev, newCol]);
                  }}
                  onDeleteColumn={(colId) => {
                    setColumns((prev) => prev.filter((c) => c.id !== colId));
                  }}
                />
              </div>
            )}

            {/* VISTA KANBAN CON DRAG & DROP (Issue #27) */}
            {activeView === 'kanban' && (
              <div className="flex gap-4 overflow-x-auto pb-4 h-full select-none">
                {columns
                  .find((c) => c.id === 'Estado Embarque')
                  ?.options?.options?.map((opt: any) => {
                    const columnRows = processedRows.filter((r) => r.data['Estado Embarque'] === opt.id);
                    const totalFob = columnRows.reduce((acc, r) => acc + (Number(r.data['Inversión FOB']) || 0), 0);

                    return (
                      <div
                        key={opt.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const rowId = e.dataTransfer.getData('text/plain');
                          if (rowId) {
                            handleCellChange(rowId, 'Estado Embarque', opt.id);
                          }
                        }}
                        className="w-72 shrink-0 flex flex-col bg-surface border border-line rounded-2xl p-3 shadow-2xs"
                      >
                        {/* Header de Columna Kanban */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <Badge label={opt.value} colorId={opt.color} />
                          <span className="text-xs font-mono font-semibold text-ink-3">
                            {columnRows.length}
                          </span>
                        </div>

                        {/* Tarjetas Drag & Drop */}
                        <div className="flex-1 space-y-2.5 overflow-y-auto">
                          {columnRows.map((r) => (
                            <div
                              key={r.id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', r.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onClick={() => setSelectedRecord(r)}
                              className="p-3 bg-surface rounded-xl border border-line shadow-2xs hover:shadow-md hover:border-accent transition-all cursor-grab active:cursor-grabbing space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-ink">
                                  {r.data['Código Contenedor']}
                                </span>
                                <Rating value={Number(r.data['Calificación Naviera'])} readOnly />
                              </div>

                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-ink-3">Inversión FOB:</span>
                                <span className="font-semibold text-ok">
                                  {formatCurrency(r.data['Inversión FOB'], { currencySymbol: 'US$', precision: 2 }).formattedText}
                                </span>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] text-ink-3 mb-1">
                                  <span>Avance:</span>
                                  <span>{r.data['Avance Logístico']}%</span>
                                </div>
                                <ProgressBar value={Number(r.data['Avance Logístico'])} showText={false} />
                              </div>

                              <div className="pt-1 border-t border-line flex justify-between text-[11px] text-ink-3">
                                <span>Arribo:</span>
                                <span className="font-mono">{formatDate(r.data['Fecha Estimada Arribo'])}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer de Totales por Columna */}
                        <div className="mt-3 pt-2.5 border-t border-line flex justify-between text-xs font-mono text-ink-3 px-1">
                          <span>Total FOB:</span>
                          <span className="font-bold text-ink">
                            {formatCurrency(totalFob, { currencySymbol: 'US$', precision: 0 }).formattedText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* VISTA CALENDARIO MULTIESCALA (Issue #27) */}
            {activeView === 'calendar' && (
              <div className="h-[calc(100vh-180px)]">
                <CalendarView
                  rows={processedRows}
                  dateFieldId="Fecha Estimada Arribo"
                  titleFieldId="Código Contenedor"
                  onSelectRecord={(row) => setSelectedRecord(row)}
                  onAddRecord={() => handleAddRow()}
                />
              </div>
            )}

            {/* VISTA FORMULARIO CON TEXTO DE AYUDA (HELP TEXT) (Issue #27) */}
            {activeView === 'form' && (
              <div className="max-w-xl mx-auto bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-ink">
                    Registro de {metadata.tableName}
                  </h2>
                  <p className="text-xs text-ink-2 mt-1">
                    Formulario schema-driven con validación de tipos y textos de ayuda.
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleAddRow();
                    setActiveView('grid');
                  }}
                  className="space-y-4 text-xs"
                >
                  {columns.map((col) => {
                    const helpTexts: Record<string, string> = {
                      'Código Contenedor': 'Identificador único estándar ISO 6346 (4 letras + 6 dígitos).',
                      'Estado Embarque': 'Seleccione la fase operativa actual en la cadena logística.',
                      'Inversión FOB': 'Valor total en dólares americanos sin flete ni seguro.',
                      'Costo Final Puesto': 'Costo nacionalizado puesto en bodega central.',
                      'Avance Logístico': 'Porcentaje estimado de completitud de la ruta.',
                      'Calificación Naviera': 'Puntuación de 1 a 5 estrellas para la empresa de transporte.',
                      'Fecha Estimada Arribo': 'Fecha tentativa de descarga en puerto de destino.',
                    };

                    const help = helpTexts[col.name] || `Ingrese el valor para el campo ${col.name}.`;

                    return (
                      <div key={col.id} className="space-y-1">
                        <label className="block font-semibold text-ink">
                          {col.name} {col.isPrimary && <span className="text-danger">*</span>}
                        </label>
                        
                        {col.type === 'select' ? (
                          <select className="w-full px-3 py-2 rounded-xl border border-line bg-surface-sunken text-xs text-ink outline-none focus:ring-2 focus:ring-accent">
                            {col.options?.options?.map((o: any) => (
                              <option key={o.id} value={o.id}>{o.value}</option>
                            ))}
                          </select>
                        ) : col.type === 'date' ? (
                          <input
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 rounded-xl border border-line bg-surface-sunken text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
                          />
                        ) : col.type === 'number' || col.type === 'currency' ? (
                          <input
                            type="number"
                            placeholder={col.type === 'currency' ? '$ 0.00' : '0'}
                            className="w-full px-3 py-2 rounded-xl border border-line bg-surface-sunken text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
                          />
                        ) : (
                          <input
                            type="text"
                            required={col.isPrimary}
                            placeholder={`ej. Valor para ${col.name}`}
                            className="w-full px-3 py-2 rounded-xl border border-line bg-surface-sunken text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
                          />
                        )}

                        {/* Texto de Ayuda / Descripción */}
                        <p className="text-[11px] text-ink-3">
                          {help}
                        </p>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-accent hover:bg-accent-strong text-white font-semibold rounded-xl shadow-sm transition-colors"
                    >
                      Guardar y Crear Registro
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VISTA GALERÍA (Issue #27) */}
            {activeView === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                {processedRows.map((r) => {
                  const stateOpt = columns
                    .find((c) => c.id === 'Estado Embarque')
                    ?.options?.options?.find((o: any) => o.id === r.data['Estado Embarque']);

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-accent transition-all cursor-pointer flex flex-col group"
                    >
                      {/* Portada de Tarjeta Galería */}
                      <div className="h-28 bg-gradient-to-br from-accent/20 via-surface-sunken to-accent/5 p-4 flex flex-col justify-between border-b border-line">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-ink-3 font-bold bg-surface/80 px-2 py-0.5 rounded-full border border-line">
                            #{r.order || 1}
                          </span>
                          {stateOpt && <Badge label={stateOpt.value} colorId={stateOpt.color} />}
                        </div>
                        <h4 className="font-mono font-bold text-sm text-ink group-hover:text-accent transition-colors">
                          {r.data['Código Contenedor']}
                        </h4>
                      </div>

                      {/* Atributos clave */}
                      <div className="p-4 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-ink-2">
                            <span className="text-ink-3">FOB:</span>
                            <span className="font-mono font-semibold text-ok">
                              {formatCurrency(r.data['Inversión FOB'], { currencySymbol: 'US$', precision: 2 }).formattedText}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-ink-2">
                            <span className="text-ink-3">Arribo:</span>
                            <span className="font-mono">{formatDate(r.data['Fecha Estimada Arribo'])}</span>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-ink-3 mb-1">
                              <span>Avance:</span>
                              <span>{r.data['Avance Logístico']}%</span>
                            </div>
                            <ProgressBar value={Number(r.data['Avance Logístico'])} showText={false} />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-line flex items-center justify-between">
                          <Rating value={Number(r.data['Calificación Naviera'])} readOnly />
                          <span className="text-[10px] text-ink-3 font-semibold group-hover:text-accent">
                            Ver ficha →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA LÍNEA DE TIEMPO / TIMELINE GANTT (Issue #27) */}
            {activeView === 'timeline' && (
              <div className="bg-surface border border-line rounded-2xl p-4 space-y-4 shadow-2xs overflow-x-auto">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <h3 className="font-bold text-sm text-ink">Cronograma Operativo y Arribos</h3>
                  </div>
                  <span className="text-xs text-ink-3 font-mono">
                    {processedRows.length} embarques en curso
                  </span>
                </div>

                <div className="space-y-3 min-w-[700px]">
                  {processedRows.map((r) => {
                    const progress = Number(r.data['Avance Logístico']) || 0;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRecord(r)}
                        className="p-3 rounded-xl border border-line hover:border-accent hover:bg-surface-sunken/40 cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-ink font-mono">
                            {r.data['Código Contenedor']}
                          </span>
                          <span className="text-ink-3 font-mono text-[11px]">
                            Arribo: {formatDate(r.data['Fecha Estimada Arribo'])}
                          </span>
                        </div>

                        {/* Barra horizontal Gantt */}
                        <div className="h-4 bg-surface-sunken rounded-full overflow-hidden relative border border-line">
                          <div
                            className="h-full bg-accent transition-all rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(progress, 8)}%` }}
                          >
                            <span className="text-[9px] font-bold text-white font-mono leading-none">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawer Lateral de Detalle con Notas Markdown tipo Notion */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col p-5 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Detalle del Registro</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedRecord.data['Código Contenedor']}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCommentTarget({
                    type: 'row',
                    id: selectedRecord.id,
                    title: `Fila ${selectedRecord.data['Código Contenedor'] || selectedRecord.id}`,
                  });
                  setShowCommentsDrawer(true);
                }}
                title="Comentarios de este registro"
                className="p-1 rounded-md text-accent hover:bg-accent/10 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRow(selectedRecord.id)}
                title="Mover a la papelera"
                className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="py-4 space-y-4 flex-1">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Estado:</span>
                <div>
                  {(() => {
                    const opt = columns[1].options?.options?.find(
                      (o: any) => o.id === selectedRecord.data['Estado Embarque']
                    );
                    return opt ? <Badge label={opt.value} colorId={opt.color} /> : null;
                  })()}
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Inversión FOB:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(selectedRecord.data['Inversión FOB'], { currencySymbol: 'US$', precision: 2 }).formattedText}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Costo Puesto:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(selectedRecord.data['Costo Final Puesto'], { currencySymbol: '$', precision: 0 }).formattedText}
                </span>
              </div>

              <div className="py-1.5 border-b border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400">Avance Logístico:</span>
                <ProgressBar value={Number(selectedRecord.data['Avance Logístico'])} />
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Calificación Naviera:</span>
                <Rating value={Number(selectedRecord.data['Calificación Naviera'])} readOnly />
              </div>
            </div>

            {/* Canvas de Notas Markdown tipo Notion */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-white mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Notas y Bitácora (Markdown)</span>
              </div>
              <textarea
                rows={6}
                value={selectedRecord.content || ''}
                onChange={(e) => {
                  const newContent = e.target.value;
                  setSelectedRecord((prev) => prev ? { ...prev, content: newContent } : null);
                  setRows((prev) =>
                    prev.map((r) => (r.id === selectedRecord.id ? { ...r, content: newContent } : r))
                  );
                }}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Trazabilidad y Auditoría de Agentes */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Trazabilidad de Agentes</span>
                <span className="font-mono text-[10px] text-slate-400">v{selectedRecord.version}</span>
              </div>
              
              {/* Creado por */}
              <div className="p-2 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-purple-600 font-semibold uppercase">
                  <span>🤖 Origen / Ingesta:</span>
                  <span>{selectedRecord.actorLineage?.createdBy?.timestamp ? new Date(selectedRecord.actorLineage.createdBy.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '14:20'}</span>
                </div>
                <div className="font-semibold text-purple-900 dark:text-purple-200 truncate">
                  {selectedRecord.actorLineage?.createdBy?.name 
                    ? `${selectedRecord.actorLineage.createdBy.actor}: ${selectedRecord.actorLineage.createdBy.name}` 
                    : selectedRecord.createdBy || 'n8n Workflow (Facturación)'}
                </div>
              </div>

              {/* Modificado por */}
              <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-amber-600 font-semibold uppercase">
                  <span>🧠 Edición / Normalización:</span>
                  <span>{selectedRecord.actorLineage?.updatedBy?.timestamp ? new Date(selectedRecord.actorLineage.updatedBy.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '15:10'}</span>
                </div>
                <div className="font-semibold text-amber-900 dark:text-amber-200 truncate">
                  {selectedRecord.actorLineage?.updatedBy?.name 
                    ? `${selectedRecord.actorLineage.updatedBy.actor}: ${selectedRecord.actorLineage.updatedBy.name}` 
                    : selectedRecord.updatedBy || 'Claude Code (Normalización SKU)'}
                </div>
              </div>

              {/* Botón Ver Historial */}
              <button
                type="button"
                onClick={() => setShowAuditDrawer(true)}
                className="w-full mt-2 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-[#1D5BD8] rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver Registro Forense Completo</span>
              </button>
            </div>
          </div>
        </div>
      )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Papelera */}
      {showTrashModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Papelera de Registros</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              {trashItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-mono">
                  No hay registros eliminados en la papelera.
                </div>
              ) : (
                trashItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div>
                      <div className="font-mono font-semibold text-slate-800 dark:text-white">
                        {item.id}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Eliminado: {new Date(item.deletedAt).toLocaleString('es-CL')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreRow(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Suscripción iCal */}
      {showIcalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rss className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Suscripción a Calendario iCal (.ics)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIcalModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Suscribe tu aplicación de calendario favorita (Apple Calendar en iPhone/Mac, Google Calendar o Outlook) para sincronizar automáticamente las fechas de arribo de los contenedores.
              </p>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  URL de Suscripción Feed (HTTPS):
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    readOnly
                    value={`${getBaseUrl()}/api/v1/calendar/ical?tableId=${currentTableId}`}
                    className="flex-1 bg-transparent font-mono text-[11px] outline-none text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${getBaseUrl()}/api/v1/calendar/ical?tableId=${currentTableId}`);
                      setCopiedIcal(true);
                      setTimeout(() => setCopiedIcal(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-1 transition-colors"
                  >
                    {copiedIcal ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`${getBaseUrl().replace(/^https?:\/\//, 'webcal://')}/api/v1/calendar/ical?tableId=${currentTableId}`}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Abrir en Apple Calendar / iOS</span>
                </a>
                <p className="text-[10px] text-slate-400 text-center">
                  En iPhone o Mac esto abrirá Calendario directamente preguntando con qué frecuencia actualizar el feed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Base y Tabla */}
      <BaseSettingsModal
        initialData={metadata}
        isOpen={showBaseSettingsModal}
        onClose={() => setShowBaseSettingsModal(false)}
        onSave={handleSaveMetadata}
      />

      {/* Modal de Gestión de Miembros del Workspace (Issue #43) */}
      <WorkspaceMembersModal
        isOpen={showWorkspaceMembersModal}
        onClose={() => setShowWorkspaceMembersModal(false)}
        workspaceId={activeWorkspaceId || workspaces[0]?.id || ''}
        workspaceName={
          workspaces.find((w) => w.id === (activeWorkspaceId || workspaces[0]?.id))?.name ||
          'Mi Espacio'
        }
        currentUserEmail={user.email}
      />

      {/* Modal de Tokens de API de Base de Datos */}
      <ApiTokensModal
        isOpen={showApiTokensModal}
        onClose={() => setShowApiTokensModal(false)}
      />

      {/* Modal para Crear Nueva Tabla */}
      <NewTableModal
        isOpen={showNewTableModal}
        onClose={() => setShowNewTableModal(false)}
        onCreate={handleCreateTable}
      />

      {/* Modal para Crear Nueva Columna */}
      <NewFieldModal
        isOpen={showNewFieldModal}
        onClose={() => setShowNewFieldModal(false)}
        onCreate={handleCreateField}
      />

      {/* Menu desplegable de Usuario y Workspaces (Print 1) */}
      <WorkspaceUserMenu
        isOpen={showWorkspaceUserMenu}
        onClose={() => setShowWorkspaceUserMenu(false)}
        workspaces={workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          role: w.role,
          membersCount: w.membersCount,
          itemsCount: w.itemsCount,
        }))}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(id) => {
          setActiveWorkspaceId(id);
          setViewMode('workspaces');
        }}
        onOpenNewWorkspace={handleCreateWorkspace}
        onOpenAdminTools={() => setShowAdminToolsModal(true)}
        onOpenMySettings={() => setShowMySettingsModal(true)}
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          isZeroTrust: user.isZeroTrust,
        }}
      />

      {/* Modal Admin Tools (Prints 2, 4, 5) */}
      <AdminToolsModal
        isOpen={showAdminToolsModal}
        onClose={() => setShowAdminToolsModal(false)}
      />

      {/* Modal My Settings (Print 8) */}
      <MySettingsModal
        isOpen={showMySettingsModal}
        onClose={() => setShowMySettingsModal(false)}
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
        }}
        onUpdateUser={async (newName) => {
          setUser((prev) => ({ ...prev, name: newName }));
        }}
      />

      {/* Modal de Webhooks Salientes para n8n */}
      <TableWebhooksModal
        isOpen={showWebhooksModal}
        onClose={() => setShowWebhooksModal(false)}
        tableId={currentTableId}
        tableName={metadata.tableName || 'Lotes de Importación'}
      />

      {/* Modal de Snapshots y Rollback */}
      <TableSnapshotsModal
        isOpen={showSnapshotsModal}
        onClose={() => setShowSnapshotsModal(false)}
        tableId={currentTableId}
        tableName={metadata.tableName || 'Lotes de Importación'}
        onSnapshotRestored={() => {
          loadData();
        }}
      />

      {/* Drawer de Comentarios Polimórficos (Issue #28) */}
      <CommentsDrawer
        isOpen={showCommentsDrawer}
        onClose={() => setShowCommentsDrawer(false)}
        targetType={activeCommentTarget.type}
        targetId={activeCommentTarget.id}
        targetTitle={activeCommentTarget.title}
        currentUser={{ name: user.name, email: user.email }}
      />

      {/* Drawer de Auditoría y Trazabilidad de Agentes (Issue #29) */}
      <AuditLogDrawer
        isOpen={showAuditDrawer}
        onClose={() => setShowAuditDrawer(false)}
        tableId={currentTableId}
      />

      {/* Modal / Inspector de Receta de Construcción de KPIs (Issue #34) */}
      <KpiRecipeModal
        isOpen={!!inspectingKpiCode}
        kpiCode={inspectingKpiCode}
        onClose={() => setInspectingKpiCode(null)}
        onOpenTable={(tableId) => {
          openTableTab(tableId);
        }}
        onOpenDashboard={(dashboardId) => {
          openDashboardTab(dashboardId);
        }}
      />

      {/* Modal de Creación de Nueva Carpeta / Módulo de Negocio (Issue #35) */}
      <NewModuleModal
        isOpen={showNewModuleModal}
        onClose={() => setShowNewModuleModal(false)}
        workspaceId={newModuleWorkspaceId || activeWorkspaceId || workspaces[0]?.id || ''}
        workspaceName={workspaces.find((w) => w.id === (newModuleWorkspaceId || activeWorkspaceId))?.name || 'Negocios'}
        existingCategories={Array.from(new Set(workspaces.flatMap((w) => w.bases.map((b) => b.category)).filter(Boolean) as string[]))}
        onCreated={async (newModule) => {
          await loadWorkspaces();
          await loadTablesList();
          openCatalogTab(newModule, 'tables');
        }}
      />

      {/* Modal de Creación de Subcarpeta Anidada (Issue #36) */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        workspaceId={activeWorkspaceId || workspaces[0]?.id || ''}
        baseId={folderModalContext.baseId}
        baseName={folderModalContext.baseName}
        parentFolderId={folderModalContext.parentFolderId}
        parentFolderName={folderModalContext.parentFolderName}
        onCreated={async () => {
          await loadWorkspaces();
        }}
      />
    </div>
  );
}
