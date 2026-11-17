-- =============================================================================
-- Seed Demo BI Dashboards & Tablas de Negocio (Issue #31)
-- Concepto de Negocio Unificado: Workspaces -> Bases -> Tablas & Dashboards
-- 1. D001 · Balance de Ventas y Finanzas (Origen: T865 · Lotes de Importación)
-- 2. D002 · Infraestructura Homelab & Monitoreo (Origen: T031 · Servicios Homelab)
-- 3. D003 · Operaciones, Automatizaciones y Voz (Origen: T026 · Flujos n8n)
-- 4. D004 · Panel Ejecutivo LinkedIn (Origen: T042 · Métricas y Engagement)
-- =============================================================================

DO $$
DECLARE
  v_ws_negocios_id UUID;
  v_ws_linkedin_id UUID;
  v_user_id UUID;
  v_f1_id UUID;
  v_f2_id UUID;
  v_f3_id UUID;
  v_f4_id UUID;
  v_d1_id UUID;
  v_d2_id UUID;
  v_d3_id UUID;
  v_d4_id UUID;
  v_t1_id UUID;
  v_t2_id UUID;
  v_t3_id UUID;
  v_t4_id UUID;

  -- Bases
  v_base_compras_id UUID;
  v_base_ops_id UUID;
  v_base_sec_id UUID;
  v_base_linkedin_id UUID;

  -- Tablas
  v_tbl_26_id UUID;
  v_tbl_27_id UUID;
  v_tbl_31_id UUID;
  v_tbl_32_id UUID;
  v_tbl_41_id UUID;
  v_tbl_42_id UUID;
  v_tbl_865_id UUID;

  -- Campos
  v_fld_id1 UUID;
  v_fld_id2 UUID;
  v_fld_id3 UUID;
  v_fld_id4 UUID;
  v_fld_id5 UUID;
BEGIN
  -- 1. Workspaces
  SELECT id INTO v_ws_negocios_id FROM workspaces WHERE slug = 'negocios' LIMIT 1;
  IF v_ws_negocios_id IS NULL THEN
    INSERT INTO workspaces (name, slug) VALUES ('Negocios', 'negocios') RETURNING id INTO v_ws_negocios_id;
  END IF;

  SELECT id INTO v_ws_linkedin_id FROM workspaces WHERE slug = 'linkedin' LIMIT 1;
  IF v_ws_linkedin_id IS NULL THEN
    INSERT INTO workspaces (name, slug) VALUES ('LinkedIn', 'linkedin') RETURNING id INTO v_ws_linkedin_id;
  END IF;

  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- 2. Bases de Datos
  -- 2.1 Navarino · Compras
  SELECT id INTO v_base_compras_id FROM bases WHERE workspace_id = v_ws_negocios_id AND name LIKE 'Navarino · Compras%' LIMIT 1;
  IF v_base_compras_id IS NULL THEN
    INSERT INTO bases (workspace_id, name, icon, color) VALUES (v_ws_negocios_id, 'Navarino · Compras', 'ship', 'blue') RETURNING id INTO v_base_compras_id;
  END IF;

  -- 2.2 Operaciones · Flujos n8n
  SELECT id INTO v_base_ops_id FROM bases WHERE workspace_id = v_ws_negocios_id AND name = 'Operaciones · Flujos n8n' LIMIT 1;
  IF v_base_ops_id IS NULL THEN
    INSERT INTO bases (workspace_id, name, icon, color) VALUES (v_ws_negocios_id, 'Operaciones · Flujos n8n', 'workflow', 'emerald') RETURNING id INTO v_base_ops_id;
  END IF;

  -- 2.3 Seguridad · 1Password
  SELECT id INTO v_base_sec_id FROM bases WHERE workspace_id = v_ws_negocios_id AND name = 'Seguridad · 1Password' LIMIT 1;
  IF v_base_sec_id IS NULL THEN
    INSERT INTO bases (workspace_id, name, icon, color) VALUES (v_ws_negocios_id, 'Seguridad · 1Password', 'shield', 'blue') RETURNING id INTO v_base_sec_id;
  END IF;

  -- 2.4 LinkedIn · Contenido
  SELECT id INTO v_base_linkedin_id FROM bases WHERE workspace_id = v_ws_linkedin_id AND name = 'LinkedIn · Contenido' LIMIT 1;
  IF v_base_linkedin_id IS NULL THEN
    INSERT INTO bases (workspace_id, name, icon, color) VALUES (v_ws_linkedin_id, 'LinkedIn · Contenido', 'layout', 'blue') RETURNING id INTO v_base_linkedin_id;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3. Crear Tablas de Datos Reales (T026, T027, T031, T032, T041, T042)
  -- ---------------------------------------------------------------------------
  -- 3.1 T026 · Flujos n8n
  SELECT id INTO v_tbl_26_id FROM tables WHERE legacy_id = 26 OR name = 'Flujos n8n' LIMIT 1;
  IF v_tbl_26_id IS NULL THEN
    INSERT INTO tables (base_id, name, legacy_id, description, icon, color)
    VALUES (v_base_ops_id, 'Flujos n8n', 26, 'Catálogo operacional de pipelines automatizados n8n', 'activity', 'emerald')
    RETURNING id INTO v_tbl_26_id;
  ELSE
    UPDATE tables SET base_id = v_base_ops_id, legacy_id = 26 WHERE id = v_tbl_26_id;
  END IF;

  -- Campos T026
  DELETE FROM fields WHERE table_id = v_tbl_26_id;
  INSERT INTO fields (table_id, name, type, "order", width, is_primary) VALUES (v_tbl_26_id, 'Nombre Flujo', 'text', 0, 220, true) RETURNING id INTO v_fld_id1;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_26_id, 'Tipo', 'text', 1, 150) RETURNING id INTO v_fld_id2;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_26_id, 'Estado', 'text', 2, 120) RETURNING id INTO v_fld_id3;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_26_id, 'Ejecuciones (24h)', 'number', 3, 140) RETURNING id INTO v_fld_id4;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_26_id, 'Tasa Éxito', 'text', 4, 120) RETURNING id INTO v_fld_id5;

  -- Registros T026
  DELETE FROM records WHERE table_id = v_tbl_26_id;
  INSERT INTO records (table_id, "order", version, data) VALUES
  (v_tbl_26_id, 1, 1, jsonb_build_object(v_fld_id1::text, 'PIM Supervisor', v_fld_id2::text, 'Ingesta Catálogo', v_fld_id3::text, 'Activo', v_fld_id4::text, 480, v_fld_id5::text, '99.8%')),
  (v_tbl_26_id, 2, 1, jsonb_build_object(v_fld_id1::text, 'Ingesta OCR & Docs', v_fld_id2::text, 'Extracción PDF', v_fld_id3::text, 'Activo', v_fld_id4::text, 320, v_fld_id5::text, '99.2%')),
  (v_tbl_26_id, 3, 1, jsonb_build_object(v_fld_id1::text, 'Sincronización Odoo', v_fld_id2::text, 'ERP & Inventario', v_fld_id3::text, 'Activo', v_fld_id4::text, 310, v_fld_id5::text, '99.5%')),
  (v_tbl_26_id, 4, 1, jsonb_build_object(v_fld_id1::text, 'Backups & Healthcheck', v_fld_id2::text, 'Infraestructura', v_fld_id3::text, 'Activo', v_fld_id4::text, 310, v_fld_id5::text, '100.0%'));

  -- 3.1.2 T027 · Logs de Ejecución (n8n)
  SELECT id INTO v_tbl_27_id FROM tables WHERE legacy_id = 27 OR name = 'Logs de Ejecución' LIMIT 1;
  IF v_tbl_27_id IS NULL THEN
    INSERT INTO tables (base_id, name, legacy_id, description, icon, color)
    VALUES (v_base_ops_id, 'Logs de Ejecución', 27, 'Historial forense de disparos de flujos n8n', 'list', 'emerald')
    RETURNING id INTO v_tbl_27_id;
  ELSE
    UPDATE tables SET base_id = v_base_ops_id, legacy_id = 27 WHERE id = v_tbl_27_id;
  END IF;

  DELETE FROM fields WHERE table_id = v_tbl_27_id;
  INSERT INTO fields (table_id, name, type, "order", width, is_primary) VALUES (v_tbl_27_id, 'Workflow', 'text', 0, 200, true) RETURNING id INTO v_fld_id1;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_27_id, 'Estado', 'text', 1, 120) RETURNING id INTO v_fld_id2;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_27_id, 'Duración (ms)', 'number', 2, 130) RETURNING id INTO v_fld_id3;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_27_id, 'Disparador', 'text', 3, 140) RETURNING id INTO v_fld_id4;

  DELETE FROM records WHERE table_id = v_tbl_27_id;
  INSERT INTO records (table_id, "order", version, data) VALUES
  (v_tbl_27_id, 1, 1, jsonb_build_object(v_fld_id1::text, 'PIM Supervisor', v_fld_id2::text, 'Exitoso', v_fld_id3::text, 1420, v_fld_id4::text, 'Cron (5m)')),
  (v_tbl_27_id, 2, 1, jsonb_build_object(v_fld_id1::text, 'Sincronización Odoo', v_fld_id2::text, 'Exitoso', v_fld_id3::text, 890, v_fld_id4::text, 'Webhook')),
  (v_tbl_27_id, 3, 1, jsonb_build_object(v_fld_id1::text, 'Ingesta OCR & Docs', v_fld_id2::text, 'Exitoso', v_fld_id3::text, 2340, v_fld_id4::text, 'Telegram Bot'));

  -- 3.2 T031 · Servicios Homelab
  SELECT id INTO v_tbl_31_id FROM tables WHERE legacy_id = 31 OR name = 'Servicios Homelab' LIMIT 1;
  IF v_tbl_31_id IS NULL THEN
    INSERT INTO tables (base_id, name, legacy_id, description, icon, color)
    VALUES (v_base_sec_id, 'Servicios Homelab', 31, 'Inventario de puertos y contenedores VLAN 60', 'server', 'blue')
    RETURNING id INTO v_tbl_31_id;
  ELSE
    UPDATE tables SET base_id = v_base_sec_id, legacy_id = 31 WHERE id = v_tbl_31_id;
  END IF;

  -- Campos T031
  DELETE FROM fields WHERE table_id = v_tbl_31_id;
  INSERT INTO fields (table_id, name, type, "order", width, is_primary) VALUES (v_tbl_31_id, 'Servicio', 'text', 0, 200, true) RETURNING id INTO v_fld_id1;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_31_id, 'Host', 'text', 1, 130) RETURNING id INTO v_fld_id2;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_31_id, 'Puerto', 'number', 2, 100) RETURNING id INTO v_fld_id3;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_31_id, 'Estado', 'text', 3, 120) RETURNING id INTO v_fld_id4;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_31_id, 'Categoría', 'text', 4, 140) RETURNING id INTO v_fld_id5;

  -- Registros T031
  DELETE FROM records WHERE table_id = v_tbl_31_id;
  INSERT INTO records (table_id, "order", version, data) VALUES
  (v_tbl_31_id, 1, 1, jsonb_build_object(v_fld_id1::text, 'LiteLLM Proxy', v_fld_id2::text, 'zbook', v_fld_id3::text, 4000, v_fld_id4::text, 'Activo', v_fld_id5::text, 'IA Local')),
  (v_tbl_31_id, 2, 1, jsonb_build_object(v_fld_id1::text, 'Qdrant Vector DB', v_fld_id2::text, 'zbook', v_fld_id3::text, 6333, v_fld_id4::text, 'Activo', v_fld_id5::text, 'RAG')),
  (v_tbl_31_id, 3, 1, jsonb_build_object(v_fld_id1::text, 'mcp-docs Server', v_fld_id2::text, 'zbook', v_fld_id3::text, 8095, v_fld_id4::text, 'Activo', v_fld_id5::text, 'MCP Protocol')),
  (v_tbl_31_id, 4, 1, jsonb_build_object(v_fld_id1::text, 'n8n Automations', v_fld_id2::text, 'zbook', v_fld_id3::text, 5678, v_fld_id4::text, 'Activo', v_fld_id5::text, 'Flujos')),
  (v_tbl_31_id, 5, 1, jsonb_build_object(v_fld_id1::text, 'FluxTable Engine', v_fld_id2::text, 'zbook', v_fld_id3::text, 8097, v_fld_id4::text, 'Activo', v_fld_id5::text, 'Data OS'));

  -- 3.2.2 T032 · Inventario Bóveda IA (1Password)
  SELECT id INTO v_tbl_32_id FROM tables WHERE legacy_id = 32 OR name = 'Inventario Bóveda IA' LIMIT 1;
  IF v_tbl_32_id IS NULL THEN
    INSERT INTO tables (base_id, name, legacy_id, description, icon, color)
    VALUES (v_base_sec_id, 'Inventario Bóveda IA', 32, 'Credenciales y secretos de agentes en 1Password', 'key', 'blue')
    RETURNING id INTO v_tbl_32_id;
  ELSE
    UPDATE tables SET base_id = v_base_sec_id, legacy_id = 32 WHERE id = v_tbl_32_id;
  END IF;

  DELETE FROM fields WHERE table_id = v_tbl_32_id;
  INSERT INTO fields (table_id, name, type, "order", width, is_primary) VALUES (v_tbl_32_id, 'Nombre Secreto', 'text', 0, 220, true) RETURNING id INTO v_fld_id1;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_32_id, 'Bóveda', 'text', 1, 120) RETURNING id INTO v_fld_id2;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_32_id, 'Tipo', 'text', 2, 140) RETURNING id INTO v_fld_id3;

  DELETE FROM records WHERE table_id = v_tbl_32_id;
  INSERT INTO records (table_id, "order", version, data) VALUES
  (v_tbl_32_id, 1, 1, jsonb_build_object(v_fld_id1::text, 'zbook_litellm_master_key', v_fld_id2::text, 'IA', v_fld_id3::text, 'API Key')),
  (v_tbl_32_id, 2, 1, jsonb_build_object(v_fld_id1::text, 'zbook_qdrant_api_key', v_fld_id2::text, 'IA', v_fld_id3::text, 'Token RAG'));

  -- 3.3.1 T041 · Publicaciones y Posts (LinkedIn)
  SELECT id INTO v_tbl_41_id FROM tables WHERE legacy_id = 41 OR name = 'Publicaciones y Posts' LIMIT 1;
  IF v_tbl_41_id IS NULL THEN
    INSERT INTO tables (base_id, name, legacy_id, description, icon, color)
    VALUES (v_base_linkedin_id, 'Publicaciones y Posts', 41, 'Calendario editorial y copy de publicaciones en LinkedIn', 'file-text', 'blue')
    RETURNING id INTO v_tbl_41_id;
  ELSE
    UPDATE tables SET base_id = v_base_linkedin_id, legacy_id = 41 WHERE id = v_tbl_41_id;
  END IF;

  DELETE FROM fields WHERE table_id = v_tbl_41_id;
  INSERT INTO fields (table_id, name, type, "order", width, is_primary) VALUES (v_tbl_41_id, 'Título Post', 'text', 0, 240, true) RETURNING id INTO v_fld_id1;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_41_id, 'Fecha', 'text', 1, 120) RETURNING id INTO v_fld_id2;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_41_id, 'Estado', 'text', 2, 120) RETURNING id INTO v_fld_id3;

  DELETE FROM records WHERE table_id = v_tbl_41_id;
  INSERT INTO records (table_id, "order", version, data) VALUES
  (v_tbl_41_id, 1, 1, jsonb_build_object(v_fld_id1::text, 'Lanzamiento FluxTable v2.0 (Data OS)', v_fld_id2::text, '2026-11-17', v_fld_id3::text, 'Publicado')),
  (v_tbl_41_id, 2, 1, jsonb_build_object(v_fld_id1::text, 'Arquitectura Homelab VLAN 60 con ZBook', v_fld_id2::text, '2026-11-15', v_fld_id3::text, 'Publicado'));

  -- 3.3.2 T042 · Métricas y Engagement (LinkedIn)
  SELECT id INTO v_tbl_42_id FROM tables WHERE legacy_id = 42 OR name = 'Métricas y Engagement' LIMIT 1;
  IF v_tbl_42_id IS NULL THEN
    INSERT INTO tables (base_id, name, legacy_id, description, icon, color)
    VALUES (v_base_linkedin_id, 'Métricas y Engagement', 42, 'Rendimiento y conversión de publicaciones LinkedIn', 'trending-up', 'blue')
    RETURNING id INTO v_tbl_42_id;
  ELSE
    UPDATE tables SET base_id = v_base_linkedin_id, legacy_id = 42 WHERE id = v_tbl_42_id;
  END IF;

  -- Campos T042
  DELETE FROM fields WHERE table_id = v_tbl_42_id;
  INSERT INTO fields (table_id, name, type, "order", width, is_primary) VALUES (v_tbl_42_id, 'Publicación', 'text', 0, 240, true) RETURNING id INTO v_fld_id1;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_42_id, 'Formato', 'text', 1, 130) RETURNING id INTO v_fld_id2;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_42_id, 'Impresiones', 'number', 2, 120) RETURNING id INTO v_fld_id3;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_42_id, 'Reacciones', 'number', 3, 110) RETURNING id INTO v_fld_id4;
  INSERT INTO fields (table_id, name, type, "order", width) VALUES (v_tbl_42_id, 'Engagement', 'text', 4, 110) RETURNING id INTO v_fld_id5;

  -- Registros T042
  DELETE FROM records WHERE table_id = v_tbl_42_id;
  INSERT INTO records (table_id, "order", version, data) VALUES
  (v_tbl_42_id, 1, 1, jsonb_build_object(v_fld_id1::text, 'Lanzamiento FluxTable v2.0 (Data OS)', v_fld_id2::text, 'Carrusel Documento', v_fld_id3::text, 24500, v_fld_id4::text, 1120, v_fld_id5::text, '5.3%')),
  (v_tbl_42_id, 2, 1, jsonb_build_object(v_fld_id1::text, 'Arquitectura Homelab VLAN 60 con ZBook', v_fld_id2::text, 'Imagen + Texto', v_fld_id3::text, 18200, v_fld_id4::text, 890, v_fld_id5::text, '5.6%')),
  (v_tbl_42_id, 3, 1, jsonb_build_object(v_fld_id1::text, 'Voz Service: El nuevo estándar omnicanal', v_fld_id2::text, 'Texto Técnico', v_fld_id3::text, 6200, v_fld_id4::text, 310, v_fld_id5::text, '5.7%'));

  -- ---------------------------------------------------------------------------
  -- 4. Carpetas BI
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_ws_negocios_id, 'Finanzas & Negocios', 0)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f1_id FROM bi_folders WHERE workspace_id = v_ws_negocios_id AND name = 'Finanzas & Negocios' LIMIT 1;

  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_ws_negocios_id, 'Infraestructura & Homelab', 1)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f2_id FROM bi_folders WHERE workspace_id = v_ws_negocios_id AND name = 'Infraestructura & Homelab' LIMIT 1;

  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_ws_negocios_id, 'Operaciones & Agentes IA', 2)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f3_id FROM bi_folders WHERE workspace_id = v_ws_negocios_id AND name = 'Operaciones & Agentes IA' LIMIT 1;

  INSERT INTO bi_folders (workspace_id, name, "order")
  VALUES (v_ws_linkedin_id, 'Social Media & Growth', 0)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_f4_id FROM bi_folders WHERE workspace_id = v_ws_linkedin_id AND name = 'Social Media & Growth' LIMIT 1;

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 1: D001 · Balance de Ventas y Finanzas (Trazabilidad: T865)
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D001', v_ws_negocios_id, v_f1_id,
    'D001 · Balance de Ventas y Finanzas',
    'Monitoreo ejecutivo de facturación mensual, margen bruto, cuentas por cobrar y ventas multicanal.',
    'trending-up', true, 60, '[]'::jsonb, '["ventas", "finanzas", "cobalto", "kpi"]'::jsonb, v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, folder_id = EXCLUDED.folder_id, updated_at = NOW()
  RETURNING id INTO v_d1_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d1_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order") VALUES (v_d1_id, 'Resumen Ejecutivo', 0) RETURNING id INTO v_t1_id;
  DELETE FROM bi_cards WHERE dashboard_id = v_d1_id;

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K001', v_d1_id, v_t1_id, 'Facturación del Mes', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "$ 14.850.000.-", "growth": 18.4, "subtitle": "Facturación Consolidada Nov 2026", "sourceTable": {"code": "T865", "name": "Lotes de Importación", "tableId": "865"}}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K002', v_d1_id, v_t1_id, 'Margen Bruto Promedio', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "42.6%", "growth": 2.1, "subtitle": "Margen Operativo Bruto MoM", "sourceTable": {"code": "T865", "name": "Lotes de Importación", "tableId": "865"}}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K003', v_d1_id, v_t1_id, 'Cuentas por Cobrar Pendientes', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "$ 3.200.000.-", "growth": -5.4, "subtitle": "Vigentes a 30 Días", "sourceTable": {"code": "T865", "name": "Lotes de Importación", "tableId": "865"}}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G001', v_d1_id, v_t1_id, 'Evolución Diaria de Ventas (Últimos 30 Días)', 'line', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T865", "name": "Lotes de Importación", "tableId": "865"}, "staticData": {"columns": ["dia", "ventas"], "data": [{"dia": "18 Oct", "ventas": 380000}, {"dia": "22 Oct", "ventas": 420000}, {"dia": "26 Oct", "ventas": 510000}, {"dia": "30 Oct", "ventas": 490000}, {"dia": "03 Nov", "ventas": 620000}, {"dia": "07 Nov", "ventas": 580000}, {"dia": "11 Nov", "ventas": 710000}, {"dia": "15 Nov", "ventas": 840000}, {"dia": "17 Nov", "ventas": 920000}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 8, "h": 5}'::jsonb, 3
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G002', v_d1_id, v_t1_id, 'Ingresos por Canal de Venta', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T865", "name": "Lotes de Importación", "tableId": "865"}, "staticData": {"columns": ["canal", "ingresos"], "data": [{"canal": "Falabella", "ingresos": 5400000}, {"canal": "Mercado Libre", "ingresos": 4650000}, {"canal": "Paris", "ingresos": 2900000}, {"canal": "Venta Directa", "ingresos": 1900000}]}}'::jsonb,
    '{"x": 8, "y": 3, "w": 4, "h": 5}'::jsonb, 4
  );

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 2: D002 · Infraestructura Homelab & Monitoreo (Trazabilidad: T031)
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D002', v_ws_negocios_id, v_f2_id,
    'D002 · Infraestructura Homelab & Monitoreo',
    'Supervisión de salud, consumo de memoria, latencia y estado de contenedores en nodos VLAN 60.',
    'server', true, 30, '[]'::jsonb, '["homelab", "infraestructura", "zbook", "docker", "monitoreo"]'::jsonb, v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, folder_id = EXCLUDED.folder_id, updated_at = NOW()
  RETURNING id INTO v_d2_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d2_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order") VALUES (v_d2_id, 'Nodos & Contenedores', 0) RETURNING id INTO v_t2_id;
  DELETE FROM bi_cards WHERE dashboard_id = v_d2_id;

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K004', v_d2_id, v_t2_id, 'Uptime Global del Clúster', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "99.98%", "growth": 0.02, "subtitle": "Disponibilidad Nodos VLAN 60 (30d)", "sourceTable": {"code": "T031", "name": "Servicios Homelab", "tableId": "31"}}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K005', v_d2_id, v_t2_id, 'Contenedores Docker Activos', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "48 / 48", "subtitle": "Todos los Servicios en Estado Healthy", "sourceTable": {"code": "T031", "name": "Servicios Homelab", "tableId": "31"}}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K006', v_d2_id, v_t2_id, 'Consumo Total RAM (ZBook)', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "18.2 GB / 32 GB", "growth": -1.8, "subtitle": "Uso de Memoria Bastión (56.8%)", "sourceTable": {"code": "T031", "name": "Servicios Homelab", "tableId": "31"}}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G003', v_d2_id, v_t2_id, 'Consumo de CPU por Nodo (%)', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T031", "name": "Servicios Homelab", "tableId": "31"}, "staticData": {"columns": ["nodo", "cpu_pct"], "data": [{"nodo": "zbook (Bastión)", "cpu_pct": 14.2}, {"nodo": "srv-nuc (Servarr)", "cpu_pct": 18.5}, {"nodo": "elitebook (Secundario)", "cpu_pct": 8.1}, {"nodo": "ha (Home Assistant)", "cpu_pct": 5.4}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 6, "h": 5}'::jsonb, 3
  );

  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G004', v_d2_id, v_t2_id, 'Distribución de Memoria RAM por Servicio (GB)', 'horizontal_bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T031", "name": "Servicios Homelab", "tableId": "31"}, "staticData": {"columns": ["servicio", "ram_gb"], "data": [{"servicio": "Ollama (GPU/CPU)", "ram_gb": 6.1}, {"servicio": "LiteLLM Proxy", "ram_gb": 4.2}, {"servicio": "Qdrant Vector DB", "ram_gb": 2.4}, {"servicio": "FluxTable Engine", "ram_gb": 1.1}, {"servicio": "n8n Automations", "ram_gb": 0.8}, {"servicio": "Netdata", "ram_gb": 0.4}]}}'::jsonb,
    '{"x": 6, "y": 3, "w": 6, "h": 5}'::jsonb, 4
  );

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 3: D003 · Operaciones, Automatizaciones y Voz (Trazabilidad: T026)
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D003', v_ws_negocios_id, v_f3_id,
    'D003 · Operaciones, Automatizaciones y Voz',
    'Telemetría operacional de flujos n8n, mensajería Voz Service, latencia y rendimiento de agentes.',
    'activity', true, 15, '[]'::jsonb, '["operaciones", "n8n", "voz", "litellm", "agentes"]'::jsonb, v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, folder_id = EXCLUDED.folder_id, updated_at = NOW()
  RETURNING id INTO v_d3_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d3_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order") VALUES (v_d3_id, 'Telemetría de Flujos', 0) RETURNING id INTO v_t3_id;
  DELETE FROM bi_cards WHERE dashboard_id = v_d3_id;

  -- K007: Flujos n8n (T026)
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K007', v_d3_id, v_t3_id, 'Flujos n8n Ejecutados (24h)', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "1,420", "growth": 12.5, "subtitle": "Workflows Despachados con Éxito", "sourceTable": {"code": "T026", "name": "Flujos n8n", "tableId": "26"}}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  -- K008: Mensajes Voz (T026)
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K008', v_d3_id, v_t3_id, 'Mensajes Procesados por Voz', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "342", "growth": 8.3, "subtitle": "Linter y Validación de Voz Activa", "sourceTable": {"code": "T026", "name": "Flujos n8n", "tableId": "26"}}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  -- K009: Tasa de Éxito (T026)
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K009', v_d3_id, v_t3_id, 'Tasa de Éxito Automatizaciones', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "99.4%", "growth": 0.3, "subtitle": "Disponibilidad de Pipelines", "sourceTable": {"code": "T026", "name": "Flujos n8n", "tableId": "26"}}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  -- G005: Workflows por tipo (T026)
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G005', v_d3_id, v_t3_id, 'Ejecuciones por Tipo de Workflow (n8n)', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T026", "name": "Flujos n8n", "tableId": "26"}, "staticData": {"columns": ["workflow", "ejecuciones"], "data": [{"workflow": "PIM Supervisor", "ejecuciones": 480}, {"workflow": "Ingesta OCR & Docs", "ejecuciones": 320}, {"workflow": "Sincronización Odoo", "ejecuciones": 310}, {"workflow": "Backups & Healthcheck", "ejecuciones": 310}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 6, "h": 5}'::jsonb, 3
  );

  -- G006: Latencia Inferencia (T031)
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G006', v_d3_id, v_t3_id, 'Latencia de Inferencia Local (GPU RTX A3000 / ms)', 'line', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T031", "name": "Servicios Homelab", "tableId": "31"}, "staticData": {"columns": ["hora", "latencia_ms"], "data": [{"hora": "08:00", "latencia_ms": 42}, {"hora": "10:00", "latencia_ms": 38}, {"hora": "12:00", "latencia_ms": 54}, {"hora": "14:00", "latencia_ms": 46}, {"hora": "16:00", "latencia_ms": 35}, {"hora": "18:00", "latencia_ms": 41}, {"hora": "19:30", "latencia_ms": 39}]}}'::jsonb,
    '{"x": 6, "y": 3, "w": 6, "h": 5}'::jsonb, 4
  );

  -- ---------------------------------------------------------------------------
  -- DASHBOARD 4: D004 · Panel Ejecutivo LinkedIn (Workspace LinkedIn, Trazabilidad: T042)
  -- ---------------------------------------------------------------------------
  INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
  VALUES (
    'D004', v_ws_linkedin_id, v_f4_id,
    'D004 · Panel Ejecutivo LinkedIn & Redes',
    'Métricas de engagement, impresiones, seguidores y alcance de publicaciones orgánicas en LinkedIn.',
    'layout-dashboard', true, 60, '[]'::jsonb, '["linkedin", "redes", "social", "growth"]'::jsonb, v_user_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, folder_id = EXCLUDED.folder_id, updated_at = NOW()
  RETURNING id INTO v_d4_id;

  DELETE FROM bi_dashboard_tabs WHERE dashboard_id = v_d4_id;
  INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order") VALUES (v_d4_id, 'Audiencia & Alcance', 0) RETURNING id INTO v_t4_id;
  DELETE FROM bi_cards WHERE dashboard_id = v_d4_id;

  -- K010: Seguidores Totales
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K010', v_d4_id, v_t4_id, 'Seguidores Totales LinkedIn', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "8,420", "growth": 14.2, "subtitle": "Conexiones de Alto Impacto", "sourceTable": {"code": "T042", "name": "Métricas y Engagement", "tableId": "42"}}'::jsonb,
    '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb, 0
  );

  -- K011: Impresiones Mensuales
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K011', v_d4_id, v_t4_id, 'Impresiones Totales Mes', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "48,900", "growth": 28.5, "subtitle": "Visualizaciones de Posts (Nov 2026)", "sourceTable": {"code": "T042", "name": "Métricas y Engagement", "tableId": "42"}}'::jsonb,
    '{"x": 4, "y": 0, "w": 4, "h": 3}'::jsonb, 1
  );

  -- K012: Tasa de Engagement
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'K012', v_d4_id, v_t4_id, 'Tasa de Engagement Promedio', 'kpi', 'local_baserow', '{}'::jsonb,
    '{"displayValue": "5.2%", "growth": 0.8, "subtitle": "Benchmark Industrial: 2.1%", "sourceTable": {"code": "T042", "name": "Métricas y Engagement", "tableId": "42"}}'::jsonb,
    '{"x": 8, "y": 0, "w": 4, "h": 3}'::jsonb, 2
  );

  -- G007: Impresiones por Formato
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G007', v_d4_id, v_t4_id, 'Alcance por Formato de Publicación', 'bar', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T042", "name": "Métricas y Engagement", "tableId": "42"}, "staticData": {"columns": ["formato", "impresiones"], "data": [{"formato": "Carruseles PDF", "impresiones": 24500}, {"formato": "Infografías & Capturas", "impresiones": 14200}, {"formato": "Texto & Artículos", "impresiones": 6800}, {"formato": "Vídeos Cortos", "impresiones": 3400}]}}'::jsonb,
    '{"x": 0, "y": 3, "w": 6, "h": 5}'::jsonb, 3
  );

  -- G008: Interacciones Semanales
  INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
  VALUES (
    'G008', v_d4_id, v_t4_id, 'Evolución de Interacciones Semanales', 'line', 'local_baserow', '{}'::jsonb,
    '{"color": "#1D5BD8", "sourceTable": {"code": "T042", "name": "Métricas y Engagement", "tableId": "42"}, "staticData": {"columns": ["semana", "reacciones"], "data": [{"semana": "Sem 42", "reacciones": 340}, {"semana": "Sem 43", "reacciones": 480}, {"semana": "Sem 44", "reacciones": 620}, {"semana": "Sem 45", "reacciones": 890}, {"semana": "Sem 46", "reacciones": 1120}]}}'::jsonb,
    '{"x": 6, "y": 3, "w": 6, "h": 5}'::jsonb, 4
  );

  RAISE NOTICE '🎉 Concepto de Negocio unificado y Dashboards D001..D004 sembrados exitosamente.';
END $$;
