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
