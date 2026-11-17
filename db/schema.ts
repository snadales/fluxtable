import { 
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, uniqueIndex 
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// 1. Usuarios y Sesiones
// -----------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'), // null si se autentica exclusivamente vía Google
  googleId: text('google_id').unique(),
  role: text('role', { enum: ['superadmin', 'member'] }).default('member').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: text('session_token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 2. Espacios de Trabajo y Miembros
// -----------------------------------------------------------------------------
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['owner', 'admin', 'editor', 'viewer'] }).default('editor').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 3. Bases y Tablas
// -----------------------------------------------------------------------------
export const bases = pgTable('bases', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').default('Operaciones'),
  icon: text('icon').default('table').notNull(),
  color: text('color').default('blue').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const tables = pgTable('tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  baseId: uuid('base_id').references(() => bases.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').default('table').notNull(),
  color: text('color').default('blue').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  legacyId: integer('legacy_id').unique(),
  primaryFieldId: uuid('primary_field_id'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// -----------------------------------------------------------------------------
// 4. Campos y Metadatos de Formato (Fields)
// -----------------------------------------------------------------------------
export const fields = pgTable('fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type', { 
    enum: [
      'text',        // Texto de una línea o multilínea
      'number',      // Numérico estándar
      'currency',    // Moneda formateada ($ 190.000 / $ 1,250.50)
      'date',        // Fecha con o sin hora
      'boolean',     // Checkbox booleano
      'select',      // Selección única con paleta de colores
      'multiselect', // Tags múltiples con paleta
      'rating',      // Calificación 1 a 5 estrellas
      'progress',    // Barra porcentual visual 0-100%
      'formula',     // Expresión calculada de solo lectura
      'relation',    // Vínculo bidireccional M:N
      'rollup',      // Agregación sobre relación (SUM, COUNT, AVG)
      'lookup',      // Proyección de columna relacionada
      'attachment'   // Archivos e imágenes
    ] 
  }).notNull(),
  options: jsonb('options').$type<Record<string, any>>().default({}).notNull(),
  order: integer('order').default(0).notNull(),
  width: integer('width').default(200).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  required: boolean('required').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('fields_table_id_idx').on(t.tableId),
]);

// -----------------------------------------------------------------------------
// 5. Registros (Records)
// -----------------------------------------------------------------------------
export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').default(0).notNull(),
  version: integer('version').default(1).notNull(), // Concurrencia optimista
  data: jsonb('data').$type<Record<string, any>>().default({}).notNull(),
  content: text('content'), // Notas Markdown enriquecidas tipo Notion
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('records_table_id_idx').on(t.tableId),
  index('records_table_order_idx').on(t.tableId, t.order),
  index('records_deleted_at_idx').on(t.deletedAt),
]);

// -----------------------------------------------------------------------------
// 6. Relaciones M:N entre Registros
// -----------------------------------------------------------------------------
export const recordRelations = pgTable('record_relations', {
  id: uuid('id').defaultRandom().primaryKey(),
  fieldId: uuid('field_id').references(() => fields.id, { onDelete: 'cascade' }).notNull(),
  sourceRecordId: uuid('source_record_id').references(() => records.id, { onDelete: 'cascade' }).notNull(),
  targetRecordId: uuid('target_record_id').references(() => records.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('source_target_field_idx').on(t.fieldId, t.sourceRecordId, t.targetRecordId),
  index('source_record_idx').on(t.sourceRecordId),
  index('target_record_idx').on(t.targetRecordId),
]);

// -----------------------------------------------------------------------------
// 7. Archivos Adjuntos (Attachments)
// -----------------------------------------------------------------------------
export const recordAttachments = pgTable('record_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').references(() => records.id, { onDelete: 'cascade' }).notNull(),
  fieldId: uuid('field_id').references(() => fields.id, { onDelete: 'cascade' }).notNull(),
  filename: text('filename').notNull(),
  safeFilename: text('safe_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  storagePath: text('storage_path').notNull(),
  isImage: boolean('is_image').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 8. Vistas Guardadas (Views: Grid, Kanban, Form, Detail)
// -----------------------------------------------------------------------------
export const views = pgTable('views', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['grid', 'kanban', 'form', 'detail'] }).default('grid').notNull(),
  order: integer('order').default(0).notNull(),
  config: jsonb('config').$type<Record<string, any>>().default({}).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  publicToken: text('public_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 9. Registro de Auditoría Forense (Audit Logs)
// -----------------------------------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  tableId: uuid('table_id').notNull(),
  recordId: uuid('record_id').notNull(),
  action: text('action', { enum: ['create', 'update', 'delete', 'restore'] }).notNull(),
  actorType: text('actor_type', { enum: ['user', 'api_token', 'system'] }).notNull(),
  actorId: text('actor_id').notNull(),
  actorEmail: text('actor_email'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'),
  changedFields: jsonb('changed_fields').$type<Record<string, { old: any; new: any }>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('audit_record_idx').on(t.recordId),
  index('audit_table_created_idx').on(t.tableId, t.createdAt),
]);

// -----------------------------------------------------------------------------
// 10. Tokens de API REST
// -----------------------------------------------------------------------------
export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  prefix: text('prefix').notNull(),
  permissions: jsonb('permissions').$type<Record<string, any>>().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 11. Webhooks Salientes (Notificaciones a n8n y sistemas externos)
// -----------------------------------------------------------------------------
export const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  events: jsonb('events').$type<string[]>().default(['rows.created', 'rows.updated', 'rows.deleted']).notNull(),
  requestType: text('request_type').default('POST').notNull(),
  headers: jsonb('headers').$type<Record<string, string>>().default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('webhooks_table_id_idx').on(t.tableId),
]);

// -----------------------------------------------------------------------------
// 12. Snapshots de Tablas y Bases (Respaldos en caliente)
// -----------------------------------------------------------------------------
export const snapshots = pgTable('snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }),
  baseId: uuid('base_id').references(() => bases.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<{
    table?: any;
    fields?: any[];
    views?: any[];
    records?: any[];
    base?: any;
  }>().notNull(),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('snapshots_table_id_idx').on(t.tableId),
  index('snapshots_base_id_idx').on(t.baseId),
]);

// -----------------------------------------------------------------------------
// 13. BI & Analytics Engine (EPIC-BI-01)
// -----------------------------------------------------------------------------

export const biFolders = pgTable('bi_folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  parentId: uuid('parent_id'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_folders_workspace_idx').on(t.workspaceId),
  index('bi_folders_parent_idx').on(t.parentId),
]);

export const biDashboards = pgTable('bi_dashboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'D001'
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  folderId: uuid('folder_id').references(() => biFolders.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').default('layout-dashboard').notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  autoRefreshInterval: integer('auto_refresh_interval').default(0).notNull(),
  layoutJson: jsonb('layout_json').$type<any[]>().default([]).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_dashboards_workspace_idx').on(t.workspaceId),
  index('bi_dashboards_folder_idx').on(t.folderId),
  index('bi_dashboards_code_idx').on(t.code),
]);

export const biDashboardTabs = pgTable('bi_dashboard_tabs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dashboardId: uuid('dashboard_id').references(() => biDashboards.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_dashboard_tabs_dashboard_idx').on(t.dashboardId),
]);

export const biDatasets = pgTable('bi_datasets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  sourceType: text('source_type', {
    enum: ['local_baserow', 'odoo_ro', 'voz_ro', 'pimcore_ro'],
  }).notNull(),
  configJson: jsonb('config_json').$type<Record<string, any>>().default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_datasets_workspace_idx').on(t.workspaceId),
  index('bi_datasets_source_type_idx').on(t.sourceType),
]);

export const biCards = pgTable('bi_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(), // 'K001', 'G001', etc.
  dashboardId: uuid('dashboard_id').references(() => biDashboards.id, { onDelete: 'cascade' }).notNull(),
  tabId: uuid('tab_id').references(() => biDashboardTabs.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  chartType: text('chart_type', {
    enum: ['kpi', 'line', 'bar', 'horizontal_bar', 'table', 'markdown'],
  }).notNull(),
  sourceType: text('source_type', {
    enum: ['local_baserow', 'odoo_ro', 'voz_ro', 'pimcore_ro'],
  }).notNull(),
  queryConfigJson: jsonb('query_config_json').$type<Record<string, any>>().default({}).notNull(),
  visualConfigJson: jsonb('visual_config_json').$type<Record<string, any>>().default({}).notNull(),
  gridPosJson: jsonb('grid_pos_json').$type<{ x: number; y: number; w: number; h: number }>().default({
    x: 0,
    y: 0,
    w: 6,
    h: 4,
  }).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_cards_dashboard_idx').on(t.dashboardId),
  index('bi_cards_tab_idx').on(t.tabId),
  index('bi_cards_code_idx').on(t.code),
]);

export const biThresholds = pgTable('bi_thresholds', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => biCards.id, { onDelete: 'cascade' }).notNull(),
  metricKey: text('metric_key').notNull(),
  warningValue: text('warning_value').notNull(),
  criticalValue: text('critical_value').notNull(),
  direction: text('direction', { enum: ['above', 'below'] }).default('above').notNull(),
  colorScheme: text('color_scheme').default('green-yellow-red').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_thresholds_card_idx').on(t.cardId),
]);

export const biAlerts = pgTable('bi_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => biCards.id, { onDelete: 'cascade' }).notNull(),
  conditionType: text('condition_type', { enum: ['threshold', 'anomaly'] }).default('threshold').notNull(),
  payloadJson: jsonb('payload_json').$type<Record<string, any>>().default({}).notNull(),
  webhookUrl: text('webhook_url'),
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bi_alerts_card_idx').on(t.cardId),
]);

export const biSyncRuns = pgTable('bi_sync_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  datasetId: uuid('dataset_id').references(() => biDatasets.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', { enum: ['running', 'success', 'error'] }).default('running').notNull(),
  rowsSynced: integer('rows_synced').default(0).notNull(),
  durationMs: integer('duration_ms').default(0).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
}, (t) => [
  index('bi_sync_runs_dataset_idx').on(t.datasetId),
]);
