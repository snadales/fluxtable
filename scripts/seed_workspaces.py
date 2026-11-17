#!/usr/bin/env python3
"""
Seed Workspaces and Databases Taxonomy (Schema-Only, No Data Migration)
Recrea la estructura exacta de workspaces y bases de las capturas (Prints 1, 4, 5, 7)
sin copiar ni tocar los datos de producción de Baserow clásico.
"""
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

DB_URL = os.getenv('DATABASE_URL', 'postgresql://baserow:baserow_pass@127.0.0.1:5435/baserow_lite')

WORKSPACES = [
    {
        'name': 'Negocios',
        'slug': 'negocios',
        'bases': [
            {'name': 'Voz · Casos dorados', 'category': 'Voz', 'icon': 'database'},
            {'name': 'LinkedIn · Contenido', 'category': 'Comercial', 'icon': 'database'},
            {'name': 'Navarino · Pricing y Simulador', 'category': 'Operaciones', 'icon': 'database'},
            {'name': 'Navarino · Compras', 'category': 'Operaciones & Compras', 'icon': 'ship'},
            {'name': 'Operaciones · Navegadores', 'category': 'Operaciones', 'icon': 'database'},
            {'name': 'Negocios · Calidad de fichas PIM', 'category': 'PIM', 'icon': 'database'},
            {'name': 'Negocios · Voz', 'category': 'Voz', 'icon': 'database'},
            {'name': 'Operaciones · Flujos n8n', 'category': 'Automatizaciones', 'icon': 'database'},
            {'name': 'D002 · Publicidad especial', 'category': 'Marketing', 'icon': 'chart'},
            {'name': 'D001 · Balance de ventas y publicidad', 'category': 'Finanzas', 'icon': 'chart'},
            {'name': 'Navarino · SII', 'category': 'Finanzas', 'icon': 'database'},
            {'name': 'Voz · Pruebas A/B de perfil', 'category': 'Voz', 'icon': 'database'},
            {'name': 'Seguridad · 1Password', 'category': 'Seguridad', 'icon': 'database'},
            {'name': 'Avance Scraping', 'category': 'Operaciones', 'icon': 'database'},
            {'name': 'Negocios · Balance', 'category': 'Finanzas', 'icon': 'database'},
            {'name': 'Navarino · Backlog publicaciones ...', 'category': 'Comercial', 'icon': 'database'},
            {'name': 'Negocios · Firmas', 'category': 'Legal', 'icon': 'database'},
            {'name': 'Operaciones · Notificaciones', 'category': 'Operaciones', 'icon': 'database'},
            {'name': 'Operaciones · RAG', 'category': 'IA', 'icon': 'database'},
        ]
    },
    {
        'name': 'LinkedIn',
        'slug': 'linkedin',
        'bases': [
            {'name': 'LinkedIn · Empleo', 'category': 'Reclutamiento', 'icon': 'database'},
            {'name': 'Panel LinkedIn', 'category': 'Dashboard', 'icon': 'chart'},
        ]
    },
    {
        'name': 'Yarken',
        'slug': 'yarken',
        'bases': [
            {'name': 'Contactos & Relaciones', 'category': 'CRM', 'icon': 'database'},
            {'name': 'Documentos y OCR', 'category': 'Archivos', 'icon': 'database'},
        ]
    },
    {
        'name': 'Salud (privado)',
        'slug': 'salud-privado',
        'bases': [
            {'name': 'Salud · Historial clínico', 'category': 'Salud', 'icon': 'database'},
        ]
    },
    {
        'name': 'Salud-Roshi',
        'slug': 'salud-roshi',
        'bases': [
            {'name': 'Roshi · Ficha médica', 'category': 'Veterinaria', 'icon': 'database'},
        ]
    },
]

def seed():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("🌱 Sembrando taxonomía de Workspaces y Bases...")

    # Obtener o crear usuarios
    cur.execute("SELECT id FROM users WHERE email = 'snadales@gmail.com';")
    user_row = cur.fetchone()
    if not user_row:
        cur.execute("""
            INSERT INTO users (email, name, role, is_active)
            VALUES ('snadales@gmail.com', 'Sebastián Nadales', 'superadmin', true)
            RETURNING id;
        """)
        user_id = cur.fetchone()['id']
    else:
        user_id = user_row['id']

    # Crear segundo usuario agente si no existe
    cur.execute("SELECT id FROM users WHERE email = 'agente-optimizador@yarken.cl';")
    agente_row = cur.fetchone()
    if not agente_row:
        cur.execute("""
            INSERT INTO users (email, name, role, is_active)
            VALUES ('agente-optimizador@yarken.cl', 'Agente Optimizador', 'member', true)
            RETURNING id;
        """)
        agente_id = cur.fetchone()['id']
    else:
        agente_id = agente_row['id']

    for ws_def in WORKSPACES:
        # Upsert workspace
        cur.execute("SELECT id FROM workspaces WHERE slug = %s;", (ws_def['slug'],))
        ws = cur.fetchone()
        if not ws:
            cur.execute("""
                INSERT INTO workspaces (name, slug)
                VALUES (%s, %s)
                RETURNING id;
            """, (ws_def['name'], ws_def['slug']))
            ws_id = cur.fetchone()['id']
            print(f"  + Creado workspace: {ws_def['name']}")
        else:
            ws_id = ws['id']
            cur.execute("UPDATE workspaces SET name = %s WHERE id = %s;", (ws_def['name'], ws_id))

        # Asignar miembros
        cur.execute("""
            INSERT INTO workspace_members (workspace_id, userId, role)
            SELECT %s, %s, 'owner'
            WHERE NOT EXISTS (
                SELECT 1 FROM workspace_members WHERE workspace_id = %s AND user_id = %s
            );
        """, (ws_id, user_id, ws_id, user_id))

        if ws_def['name'] == 'Negocios':
            cur.execute("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                SELECT %s, %s, 'editor'
                WHERE NOT EXISTS (
                    SELECT 1 FROM workspace_members WHERE workspace_id = %s AND user_id = %s
                );
            """, (ws_id, agente_id, ws_id, agente_id))

        # Vincular base existente Navarino · Compras a Negocios
        if ws_def['name'] == 'Negocios':
            cur.execute("""
                UPDATE bases SET workspace_id = %s, name = 'Navarino · Compras'
                WHERE name ILIKE '%Compras%' OR name ILIKE '%Operaciones%';
            """, (ws_id,))

        # Crear bases de este workspace
        for b in ws_def['bases']:
            cur.execute("SELECT id FROM bases WHERE workspace_id = %s AND name = %s;", (ws_id, b['name']))
            existing_base = cur.fetchone()
            if not existing_base:
                cur.execute("""
                    INSERT INTO bases (workspace_id, name, category, icon, color)
                    VALUES (%s, %s, %s, %s, 'blue')
                    RETURNING id;
                """, (ws_id, b['name'], b['category'], b['icon']))
                new_base_id = cur.fetchone()['id']
                print(f"    - Creada base: {b['name']}")

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Taxonomía de Workspaces y Bases sembrada exitosamente!")

if __name__ == '__main__':
    seed()
