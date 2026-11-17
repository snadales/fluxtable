-- Migración 0002: Motor Unificado de BI & Analytics (EPIC-BI-01)
-- 1. Esquema bi_views para vistas SQL tipadas
CREATE SCHEMA IF NOT EXISTS bi_views;

-- 2. Funciones SQL seguras a prueba de crash de tipos
CREATE OR REPLACE FUNCTION public.safe_numeric(val text)
RETURNS numeric AS $$
BEGIN
    RETURN val::numeric;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.safe_timestamptz(val text)
RETURNS timestamptz AS $$
BEGIN
    RETURN val::timestamptz;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Tablas Core de BI & Analytics

-- Carpetas jerárquicas
CREATE TABLE IF NOT EXISTS bi_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES bi_folders(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_folders_workspace_idx ON bi_folders(workspace_id);
CREATE INDEX IF NOT EXISTS bi_folders_parent_idx ON bi_folders(parent_id);

-- Dashboards principales
CREATE TABLE IF NOT EXISTS bi_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES bi_folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'layout-dashboard',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    auto_refresh_interval INTEGER NOT NULL DEFAULT 0,
    layout_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_dashboards_workspace_idx ON bi_dashboards(workspace_id);
CREATE INDEX IF NOT EXISTS bi_dashboards_folder_idx ON bi_dashboards(folder_id);
CREATE INDEX IF NOT EXISTS bi_dashboards_code_idx ON bi_dashboards(code);

-- Pestañas de Dashboard
CREATE TABLE IF NOT EXISTS bi_dashboard_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES bi_dashboards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_dashboard_tabs_dashboard_idx ON bi_dashboard_tabs(dashboard_id);

-- Datasets unificados (fuentes de datos)
CREATE TABLE IF NOT EXISTS bi_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'local_baserow', 'odoo_ro', 'voz_ro', 'pimcore_ro'
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_datasets_workspace_idx ON bi_datasets(workspace_id);
CREATE INDEX IF NOT EXISTS bi_datasets_source_type_idx ON bi_datasets(source_type);

-- Tarjetas / Preguntas / Gráficos
CREATE TABLE IF NOT EXISTS bi_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL, -- 'K001', 'G001', 'T001', etc.
    dashboard_id UUID NOT NULL REFERENCES bi_dashboards(id) ON DELETE CASCADE,
    tab_id UUID REFERENCES bi_dashboard_tabs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    chart_type TEXT NOT NULL, -- 'kpi', 'line', 'bar', 'horizontal_bar', 'table', 'markdown'
    source_type TEXT NOT NULL, -- 'local_baserow', 'odoo_ro', 'voz_ro', 'pimcore_ro'
    query_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    visual_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    grid_pos_json JSONB NOT NULL DEFAULT '{"x":0,"y":0,"w":6,"h":4}'::jsonb,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_cards_dashboard_idx ON bi_cards(dashboard_id);
CREATE INDEX IF NOT EXISTS bi_cards_tab_idx ON bi_cards(tab_id);
CREATE INDEX IF NOT EXISTS bi_cards_code_idx ON bi_cards(code);

-- Umbrales de semáforo
CREATE TABLE IF NOT EXISTS bi_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES bi_cards(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL,
    warning_value TEXT NOT NULL,
    critical_value TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'above', -- 'above', 'below'
    color_scheme TEXT NOT NULL DEFAULT 'green-yellow-red',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_thresholds_card_idx ON bi_thresholds(card_id);

-- Alertas automáticas
CREATE TABLE IF NOT EXISTS bi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES bi_cards(id) ON DELETE CASCADE,
    condition_type TEXT NOT NULL DEFAULT 'threshold', -- 'threshold', 'anomaly'
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    webhook_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bi_alerts_card_idx ON bi_alerts(card_id);

-- Historial de sincronización de datasets / caché
CREATE TABLE IF NOT EXISTS bi_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES bi_datasets(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'error'
    rows_synced INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS bi_sync_runs_dataset_idx ON bi_sync_runs(dataset_id);
