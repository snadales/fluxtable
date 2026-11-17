-- =============================================================================
-- Seed Demo BI Dashboards (Issue #30)
-- 1. D001 · Balance de Ventas y Finanzas
-- 2. D002 · Infraestructura Homelab & Monitoreo
-- 3. D003 · Operaciones, Automatizaciones y Voz
-- =============================================================================

DO $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
  v_f1_id UUID;
  v_f2_id UUID;
  v_f3_id UUID;
  v_d1_id UUID;
  v_d2_id UUID;
  v_d3_id UUID;
  v_t1_id UUID;
  v_t2_id UUID;
  v_t3_id UUID;
BEGIN
  -- 1. Workspace y Usuario
  SELECT id INTO v_workspace_id FROM workspaces WHERE slug = 'negocios' LIMIT 1;
  IF v_workspace_id IS NULL THEN
    SELECT id INTO v_workspace_id FROM workspaces LIMIT 1;
  END IF;

  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- 2. Carpetas BI
  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_workspace_id, 'Finanzas & Negocios', 0)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f1_id FROM bi_folders WHERE workspace_id = v_workspace_id AND name = 'Finanzas & Negocios' LIMIT 1;

  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_workspace_id, 'Infraestructura & Homelab', 1)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f2_id FROM bi_folders WHERE workspace_id = v_workspace_id AND name = 'Infraestructura & Homelab' LIMIT 1;

  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_workspace_id, 'Operaciones & Agentes IA', 2)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f3_id FROM bi_folders WHERE workspace_id = v_workspace_id AND name = 'Operaciones & Agentes IA' LIMIT 1;

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 1: D001 · Balance de Ventas y Finanzas
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D001',
    v_workspace_id,
    v_f1_id,
    'D001 · Balance de Ventas y Finanzas',
    'Monitoreo ejecutivo de facturación mensual, margen bruto, cuentas por cobrar y ventas multicanal.',
    'trending-up',
    true,
    60,
    '[]'::jsonb,
    '["ventas", "finanzas", "cobalto", "kpi"]'::jsonb,
    v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    folder_id = EXCLUDED.folder_id,
    updated_at = NOW()
  RETURNING id INTO v_d1_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d1_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order")
  VALUES (v_d1_id, 'Resumen Ejecutivo', 0)
  RETURNING id INTO v_t1_id;

  DELETE FROM bi_cards WHERE dashboard_id = v_d1_id;

  -- K001: Facturación del Mes
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K001', v_d1_id, v_t1_id, 'Facturación del Mes', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "$ 14.850.000.-", "growth": 18.4, "subtitle": "Facturación Consolidada Nov 2026", "format": "currency"}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  -- K002: Margen Bruto Promedio
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K002', v_d1_id, v_t1_id, 'Margen Bruto Promedio', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "42.6%", "growth": 2.1, "subtitle": "Margen Operativo Bruto MoM"}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  -- K003: Cuentas por Cobrar Pendientes
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K003', v_d1_id, v_t1_id, 'Cuentas por Cobrar Pendientes', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "$ 3.200.000.-", "growth": -5.4, "subtitle": "Vigentes a 30 Días"}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  -- G001: Evolución Diaria de Ventas
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G001', v_d1_id, v_t1_id, 'Evolución Diaria de Ventas (Últimos 30 Días)', 'line', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "staticData": {"columns": ["dia", "ventas"], "data": [{"dia": "18 Oct", "ventas": 380000}, {"dia": "22 Oct", "ventas": 420000}, {"dia": "26 Oct", "ventas": 510000}, {"dia": "30 Oct", "ventas": 490000}, {"dia": "03 Nov", "ventas": 620000}, {"dia": "07 Nov", "ventas": 580000}, {"dia": "11 Nov", "ventas": 710000}, {"dia": "15 Nov", "ventas": 840000}, {"dia": "17 Nov", "ventas": 920000}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 8, "h": 5}'::jsonb, 3
  );

  -- G002: Ingresos por Canal
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G002', v_d1_id, v_t1_id, 'Ingresos por Canal de Venta', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "staticData": {"columns": ["canal", "ingresos"], "data": [{"canal": "Falabella", "ingresos": 5400000}, {"canal": "Mercado Libre", "ingresos": 4650000}, {"canal": "Paris", "ingresos": 2900000}, {"canal": "Venta Directa", "ingresos": 1900000}]}}'::jsonb,
    '{"x": 8, "y": 3, "w": 4, "h": 5}'::jsonb, 4
  );

  -- T001: Top Clientes
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'T001', v_d1_id, v_t1_id, 'Top Clientes & Cuentas Clave', 'table', 'local_baserow', '{}'::jsonb,
    '{"staticData": {"columns": ["cliente", "canal", "pedidos", "total_comprado", "estado"], "data": [{"cliente": "Distribuidora del Norte SpA", "canal": "Directa", "pedidos": 18, "total_comprado": "$ 3.450.000.-", "estado": "Al Día"}, {"cliente": "Inversiones Austral Limitada", "canal": "Falabella", "pedidos": 14, "total_comprado": "$ 2.890.000.-", "estado": "Al Día"}, {"cliente": "Comercializadora Pacífico", "canal": "Mercado Libre", "pedidos": 22, "total_comprado": "$ 2.410.000.-", "estado": "Al Día"}, {"cliente": "Retail Express Chile", "canal": "Paris", "pedidos": 9, "total_comprado": "$ 1.950.000.-", "estado": "Pendiente"}, {"cliente": "Logística San Antonio", "canal": "Directa", "pedidos": 12, "total_comprado": "$ 1.620.000.-", "estado": "Al Día"}]}}'::jsonb,
    '{"x": 0, "y": 8, "w": 12, "h": 4}'::jsonb, 5
  );

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 2: D002 · Infraestructura Homelab & Monitoreo
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D002',
    v_workspace_id,
    v_f2_id,
    'D002 · Infraestructura Homelab & Monitoreo',
    'Supervisión de salud, consumo de memoria, latencia y estado de contenedores en nodos VLAN 60.',
    'server',
    true,
    30,
    '[]'::jsonb,
    '["homelab", "infraestructura", "zbook", "docker", "monitoreo"]'::jsonb,
    v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    folder_id = EXCLUDED.folder_id,
    updated_at = NOW()
  RETURNING id INTO v_d2_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d2_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order")
  VALUES (v_d2_id, 'Nodos & Contenedores', 0)
  RETURNING id INTO v_t2_id;

  DELETE FROM bi_cards WHERE dashboard_id = v_d2_id;

  -- K004: Uptime Global
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K004', v_d2_id, v_t2_id, 'Uptime Global del Clúster', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "99.98%", "growth": 0.02, "subtitle": "Disponibilidad Nodos VLAN 60 (30d)"}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  -- K005: Contenedores Activos
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K005', v_d2_id, v_t2_id, 'Contenedores Docker Activos', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "48 / 48", "subtitle": "Todos los Servicios en Estado Healthy"}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  -- K006: Consumo RAM
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K006', v_d2_id, v_t2_id, 'Consumo Total RAM (ZBook)', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "18.2 GB / 32 GB", "growth": -1.8, "subtitle": "Uso de Memoria Bastión (56.8%)"}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  -- G003: CPU por Nodo
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G003', v_d2_id, v_t2_id, 'Consumo de CPU por Nodo (%)', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "staticData": {"columns": ["nodo", "cpu_pct"], "data": [{"nodo": "zbook (Bastión)", "cpu_pct": 14.2}, {"nodo": "srv-nuc (Servarr)", "cpu_pct": 18.5}, {"nodo": "elitebook (Secundario)", "cpu_pct": 8.1}, {"nodo": "ha (Home Assistant)", "cpu_pct": 5.4}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 6, "h": 5}'::jsonb, 3
  );

  -- G004: RAM por Servicio
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G004', v_d2_id, v_t2_id, 'Distribución de Memoria RAM por Servicio (GB)', 'horizontal_bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "staticData": {"columns": ["servicio", "ram_gb"], "data": [{"servicio": "Ollama (GPU/CPU)", "ram_gb": 6.1}, {"servicio": "LiteLLM Proxy", "ram_gb": 4.2}, {"servicio": "Qdrant Vector DB", "ram_gb": 2.4}, {"servicio": "FluxTable Engine", "ram_gb": 1.1}, {"servicio": "n8n Automations", "ram_gb": 0.8}, {"servicio": "Netdata", "ram_gb": 0.4}]}}'::jsonb,
    '{"x": 6, "y": 3, "w": 6, "h": 5}'::jsonb, 4
  );

  -- T002: Respaldos Restic
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'T002', v_d2_id, v_t2_id, 'Estado de Respaldos Restic & Bóvedas', 'table', 'local_baserow', '{}'::jsonb,
    '{"staticData": {"columns": ["servicio", "destino", "tamano", "duracion", "ultimo_backup", "estado"], "data": [{"servicio": "PostgreSQL BaserowLite", "destino": "NAS QNAP (VLAN 60)", "tamano": "248 MB", "duracion": "18s", "ultimo_backup": "Hoy 04:00", "estado": "Exitoso"}, {"servicio": "Qdrant Vector Store", "destino": "NAS QNAP (VLAN 60)", "tamano": "1.8 GB", "duracion": "42s", "ultimo_backup": "Hoy 04:15", "estado": "Exitoso"}, {"servicio": "Pimcore & Media Assets", "destino": "NAS QNAP (VLAN 60)", "tamano": "8.4 GB", "duracion": "2m 14s", "ultimo_backup": "Hoy 04:30", "estado": "Exitoso"}, {"servicio": "Configs Docker & Compose", "destino": "GitHub Private", "tamano": "14 MB", "duracion": "4s", "ultimo_backup": "Hoy 05:00", "estado": "Sincronizado"}]}}'::jsonb,
    '{"x": 0, "y": 8, "w": 12, "h": 4}'::jsonb, 5
  );

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 3: D003 · Operaciones, Automatizaciones y Voz
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D003',
    v_workspace_id,
    v_f3_id,
    'D003 · Operaciones, Automatizaciones y Voz',
    'Telemetría operacional de flujos n8n, mensajería Voz Service, latencia y rendimiento de agentes.',
    'activity',
    true,
    15,
    '[]'::jsonb,
    '["operaciones", "n8n", "voz", "litellm", "agentes"]'::jsonb,
    v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    folder_id = EXCLUDED.folder_id,
    updated_at = NOW()
  RETURNING id INTO v_d3_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d3_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order")
  VALUES (v_d3_id, 'Telemetría de Flujos', 0)
  RETURNING id INTO v_t3_id;

  DELETE FROM bi_cards WHERE dashboard_id = v_d3_id;

  -- K007: Flujos n8n
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K007', v_d3_id, v_t3_id, 'Flujos n8n Ejecutados (24h)', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "1,420", "growth": 12.5, "subtitle": "Workflows Despachados con Éxito"}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  -- K008: Mensajes Voz
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K008', v_d3_id, v_t3_id, 'Mensajes Procesados por Voz', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "342", "growth": 8.3, "subtitle": "Linter y Validación de Voz Activa"}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  -- K009: Tasa de Éxito
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K009', v_d3_id, v_t3_id, 'Tasa de Éxito Automatizaciones', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "99.4%", "growth": 0.3, "subtitle": "Disponibilidad de Pipelines"}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  -- G005: Workflows por tipo
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G005', v_d3_id, v_t3_id, 'Ejecuciones por Tipo de Workflow (n8n)', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "staticData": {"columns": ["workflow", "ejecuciones"], "data": [{"workflow": "PIM Supervisor", "ejecuciones": 480}, {"workflow": "Ingesta OCR & Docs", "ejecuciones": 320}, {"workflow": "Sincronización Odoo", "ejecuciones": 310}, {"workflow": "Backups & Healthcheck", "ejecuciones": 310}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 6, "h": 5}'::jsonb, 3
  );

  -- G006: Latencia Inferencia
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G006', v_d3_id, v_t3_id, 'Latencia de Inferencia Local (GPU RTX A3000 / ms)', 'line', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "staticData": {"columns": ["hora", "latencia_ms"], "data": [{"hora": "08:00", "latencia_ms": 42}, {"hora": "10:00", "latencia_ms": 38}, {"hora": "12:00", "latencia_ms": 54}, {"hora": "14:00", "latencia_ms": 46}, {"hora": "16:00", "latencia_ms": 35}, {"hora": "18:00", "latencia_ms": 41}, {"hora": "19:30", "latencia_ms": 39}]}}'::jsonb,
    '{"x": 6, "y": 3, "w": 6, "h": 5}'::jsonb, 4
  );

  RAISE NOTICE '🎉 Dashboards D001, D002 y D003 sembrados exitosamente.';
END $$;
