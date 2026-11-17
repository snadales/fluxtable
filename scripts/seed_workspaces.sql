-- Sembrado de Taxonomía de Workspaces y Bases (Schema-Only, No Data Migration)

-- 1. Usuarios
INSERT INTO users (email, name, role, is_active)
VALUES 
  ('snadales@gmail.com', 'Sebastián Nadales', 'superadmin', true),
  ('agente-optimizador@yarken.cl', 'Agente Optimizador', 'member', true)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 2. Workspaces
INSERT INTO workspaces (name, slug)
VALUES 
  ('Negocios', 'negocios'),
  ('LinkedIn', 'linkedin'),
  ('Yarken', 'yarken'),
  ('Salud (privado)', 'salud-privado'),
  ('Salud-Roshi', 'salud-roshi')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 3. Asignar miembros a workspaces
DO $$
DECLARE
  v_user_id uuid;
  v_agente_id uuid;
  v_ws_negocios uuid;
  v_ws_linkedin uuid;
  v_ws_yarken uuid;
  v_ws_salud_priv uuid;
  v_ws_salud_roshi uuid;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = 'snadales@gmail.com';
  SELECT id INTO v_agente_id FROM users WHERE email = 'agente-optimizador@yarken.cl';

  SELECT id INTO v_ws_negocios FROM workspaces WHERE slug = 'negocios';
  SELECT id INTO v_ws_linkedin FROM workspaces WHERE slug = 'linkedin';
  SELECT id INTO v_ws_yarken FROM workspaces WHERE slug = 'yarken';
  SELECT id INTO v_ws_salud_priv FROM workspaces WHERE slug = 'salud-privado';
  SELECT id INTO v_ws_salud_roshi FROM workspaces WHERE slug = 'salud-roshi';

  -- Membresías de Sebastián Nadales
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES 
    (v_ws_negocios, v_user_id, 'owner'),
    (v_ws_linkedin, v_user_id, 'owner'),
    (v_ws_yarken, v_user_id, 'owner'),
    (v_ws_salud_priv, v_user_id, 'owner'),
    (v_ws_salud_roshi, v_user_id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Membresía de Agente Optimizador
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_ws_negocios, v_agente_id, 'editor')
  ON CONFLICT DO NOTHING;

  -- Vincular base existente 'Navarino · Compras' al workspace Negocios
  UPDATE bases 
  SET workspace_id = v_ws_negocios, name = 'Navarino · Compras'
  WHERE name ILIKE '%Compras%' OR name ILIKE '%Operaciones%';

  -- Bases de Negocios
  INSERT INTO bases (workspace_id, name, category, icon, color)
  SELECT v_ws_negocios, name, category, icon, 'blue'
  FROM (VALUES 
    ('Voz · Casos dorados', 'Voz', 'database'),
    ('LinkedIn · Contenido', 'Comercial', 'database'),
    ('Navarino · Pricing y Simulador', 'Operaciones', 'database'),
    ('Operaciones · Navegadores', 'Operaciones', 'database'),
    ('Negocios · Calidad de fichas PIM', 'PIM', 'database'),
    ('Negocios · Voz', 'Voz', 'database'),
    ('Operaciones · Flujos n8n', 'Automatizaciones', 'database'),
    ('D002 · Publicidad especial', 'Marketing', 'chart'),
    ('D001 · Balance de ventas y publicidad', 'Finanzas', 'chart'),
    ('Navarino · SII', 'Finanzas', 'database'),
    ('Voz · Pruebas A/B de perfil', 'Voz', 'database'),
    ('Seguridad · 1Password', 'Seguridad', 'database'),
    ('Avance Scraping', 'Operaciones', 'database'),
    ('Negocios · Balance', 'Finanzas', 'database'),
    ('Navarino · Backlog publicaciones ...', 'Comercial', 'database'),
    ('Negocios · Firmas', 'Legal', 'database'),
    ('Operaciones · Notificaciones', 'Operaciones', 'database'),
    ('Operaciones · RAG', 'IA', 'database')
  ) AS t(name, category, icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM bases WHERE workspace_id = v_ws_negocios AND bases.name = t.name
  );

  -- Bases de LinkedIn
  INSERT INTO bases (workspace_id, name, category, icon, color)
  SELECT v_ws_linkedin, name, category, icon, 'blue'
  FROM (VALUES 
    ('LinkedIn · Empleo', 'Reclutamiento', 'database'),
    ('Panel LinkedIn', 'Dashboard', 'chart')
  ) AS t(name, category, icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM bases WHERE workspace_id = v_ws_linkedin AND bases.name = t.name
  );

  -- Bases de Yarken
  INSERT INTO bases (workspace_id, name, category, icon, color)
  SELECT v_ws_yarken, name, category, icon, 'blue'
  FROM (VALUES 
    ('Contactos & Relaciones', 'CRM', 'database'),
    ('Documentos y OCR', 'Archivos', 'database')
  ) AS t(name, category, icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM bases WHERE workspace_id = v_ws_yarken AND bases.name = t.name
  );

  -- Bases de Salud (privado)
  INSERT INTO bases (workspace_id, name, category, icon, color)
  SELECT v_ws_salud_priv, name, category, icon, 'blue'
  FROM (VALUES 
    ('Salud · Historial clínico', 'Salud', 'database')
  ) AS t(name, category, icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM bases WHERE workspace_id = v_ws_salud_priv AND bases.name = t.name
  );

  -- Bases de Salud-Roshi
  INSERT INTO bases (workspace_id, name, category, icon, color)
  SELECT v_ws_salud_roshi, name, category, icon, 'blue'
  FROM (VALUES 
    ('Roshi · Ficha médica', 'Veterinaria', 'database')
  ) AS t(name, category, icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM bases WHERE workspace_id = v_ws_salud_roshi AND bases.name = t.name
  );

END $$;
