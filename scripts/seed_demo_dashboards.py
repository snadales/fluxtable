#!/usr/bin/env python3
"""
Seed Demo BI Dashboards (Issue #30)
Inserta o actualiza los 3 Dashboards de Demostración y Producción para FluxTable:
1. D001 · Balance de Ventas y Finanzas
2. D002 · Infraestructura Homelab & Monitoreo
3. D003 · Operaciones, Automatizaciones y Voz
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DB_URL = os.getenv('DATABASE_URL', 'postgresql://baserow:baserow_pass@127.0.0.1:5435/baserow_lite')

def seed():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. Obtener workspace Negocios y usuario admin
        cur.execute("SELECT id FROM workspaces WHERE slug = 'negocios' LIMIT 1;")
        ws = cur.fetchone()
        if not ws:
            cur.execute("SELECT id FROM workspaces LIMIT 1;")
            ws = cur.fetchone()
        workspace_id = ws['id']

        cur.execute("SELECT id FROM users LIMIT 1;")
        usr = cur.fetchone()
        user_id = usr['id'] if usr else None

        print(f"[*] Workspace: {workspace_id}, User: {user_id}")

        # 2. Carpetas BI
        folders = [
            {'name': 'Finanzas & Negocios', 'order': 0},
            {'name': 'Infraestructura & Homelab', 'order': 1},
            {'name': 'Operaciones & Agentes IA', 'order': 2},
        ]
        folder_map = {}
        for f in folders:
            cur.execute("""
                INSERT INTO bi_folders (workspace_id, name, "order")
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
                RETURNING id;
            """, (workspace_id, f['name'], f['order']))
            row = cur.fetchone()
            if row:
                folder_map[f['name']] = row['id']
            else:
                cur.execute("SELECT id FROM bi_folders WHERE workspace_id = %s AND name = %s;", (workspace_id, f['name']))
                folder_map[f['name']] = cur.fetchone()['id']

        print(f"[+] Carpetas BI configuradas: {list(folder_map.keys())}")

        # ---------------------------------------------------------------------
        # DASHBOARD 1: D001 · Balance de Ventas y Finanzas
        # ---------------------------------------------------------------------
        d1_folder = folder_map['Finanzas & Negocios']
        cur.execute("""
            INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                folder_id = EXCLUDED.folder_id,
                updated_at = NOW()
            RETURNING id;
        """, (
            'D001',
            workspace_id,
            d1_folder,
            'D001 · Balance de Ventas y Finanzas',
            'Monitoreo ejecutivo de facturación mensual, margen bruto, cuentas por cobrar y ventas multicanal.',
            'trending-up',
            True,
            60,
            json.dumps([]),
            json.dumps(['ventas', 'finanzas', 'cobalto', 'kpi']),
            user_id
        ))
        d1_id = cur.fetchone()['id']

        # Tab Resumen
        cur.execute("""
            INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order")
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (d1_id, 'Resumen Ejecutivo', 0))
        d1_tab_id = cur.fetchone()['id']

        # Cards D001
        cur.execute("DELETE FROM bi_cards WHERE dashboard_id = %s;", (d1_id,))

        d1_cards = [
            {
                'code': 'K001',
                'name': 'Facturación del Mes',
                'chart_type': 'kpi',
                'grid_pos': {'x': 0, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '$ 14.850.000.-',
                    'growth': 18.4,
                    'subtitle': 'Facturación Consolidada Nov 2026',
                    'format': 'currency',
                }
            },
            {
                'code': 'K002',
                'name': 'Margen Bruto Promedio',
                'chart_type': 'kpi',
                'grid_pos': {'x': 4, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '42.6%',
                    'growth': 2.1,
                    'subtitle': 'Margen Operativo Bruto MoM',
                }
            },
            {
                'code': 'K003',
                'name': 'Cuentas por Cobrar Pendientes',
                'chart_type': 'kpi',
                'grid_pos': {'x': 8, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '$ 3.200.000.-',
                    'growth': -5.4,
                    'subtitle': 'Vigentes a 30 Días',
                }
            },
            {
                'code': 'G001',
                'name': 'Evolución Diaria de Ventas (Últimos 30 Días)',
                'chart_type': 'line',
                'grid_pos': {'x': 0, 'y': 3, 'w': 8, 'h': 5},
                'visual': {
                    'color': '#1D5BD8',
                    'staticData': {
                        'columns': ['dia', 'ventas'],
                        'data': [
                            {'dia': '18 Oct', 'ventas': 380000},
                            {'dia': '22 Oct', 'ventas': 420000},
                            {'dia': '26 Oct', 'ventas': 510000},
                            {'dia': '30 Oct', 'ventas': 490000},
                            {'dia': '03 Nov', 'ventas': 620000},
                            {'dia': '07 Nov', 'ventas': 580000},
                            {'dia': '11 Nov', 'ventas': 710000},
                            {'dia': '15 Nov', 'ventas': 840000},
                            {'dia': '17 Nov', 'ventas': 920000},
                        ]
                    }
                }
            },
            {
                'code': 'G002',
                'name': 'Ingresos por Canal de Venta',
                'chart_type': 'bar',
                'grid_pos': {'x': 8, 'y': 3, 'w': 4, 'h': 5},
                'visual': {
                    'color': '#1D5BD8',
                    'staticData': {
                        'columns': ['canal', 'ingresos'],
                        'data': [
                            {'canal': 'Falabella', 'ingresos': 5400000},
                            {'canal': 'Mercado Libre', 'ingresos': 4650000},
                            {'canal': 'Paris', 'ingresos': 2900000},
                            {'canal': 'Venta Directa', 'ingresos': 1900000},
                        ]
                    }
                }
            },
            {
                'code': 'T001',
                'name': 'Top 5 Clientes & Cuentas Clave',
                'chart_type': 'table',
                'grid_pos': {'x': 0, 'y': 8, 'w': 12, 'h': 4},
                'visual': {
                    'staticData': {
                        'columns': ['cliente', 'canal', 'pedidos', 'total_comprado', 'estado'],
                        'data': [
                            {'cliente': 'Distribuidora del Norte SpA', 'canal': 'Directa', 'pedidos': 18, 'total_comprado': '$ 3.450.000.-', 'estado': 'Al Día'},
                            {'cliente': 'Inversiones Austral Limitada', 'canal': 'Falabella', 'pedidos': 14, 'total_comprado': '$ 2.890.000.-', 'estado': 'Al Día'},
                            {'cliente': 'Comercializadora Pacífico', 'canal': 'Mercado Libre', 'pedidos': 22, 'total_comprado': '$ 2.410.000.-', 'estado': 'Al Día'},
                            {'cliente': 'Retail Express Chile', 'canal': 'Paris', 'pedidos': 9, 'total_comprado': '$ 1.950.000.-', 'estado': 'Pendiente'},
                            {'cliente': 'Logística San Antonio', 'canal': 'Directa', 'pedidos': 12, 'total_comprado': '$ 1.620.000.-', 'estado': 'Al Día'},
                        ]
                    }
                }
            }
        ]

        for idx, c in enumerate(d1_cards):
            cur.execute("""
                INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                c['code'], d1_id, d1_tab_id, c['name'], c['chart_type'], 'local_baserow',
                json.dumps({}), json.dumps(c['visual']), json.dumps(c['grid_pos']), idx
            ))

        print("[+] D001 · Balance de Ventas y Finanzas cargado exitosamente.")

        # ---------------------------------------------------------------------
        # DASHBOARD 2: D002 · Infraestructura Homelab & Monitoreo
        # ---------------------------------------------------------------------
        d2_folder = folder_map['Infraestructura & Homelab']
        cur.execute("""
            INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                folder_id = EXCLUDED.folder_id,
                updated_at = NOW()
            RETURNING id;
        """, (
            'D002',
            workspace_id,
            d2_folder,
            'D002 · Infraestructura Homelab & Monitoreo',
            'Supervisión de salud, consumo de memoria, latencia y estado de contenedores en nodos VLAN 60.',
            'server',
            True,
            30,
            json.dumps([]),
            json.dumps(['homelab', 'infraestructura', 'zbook', 'docker', 'monitoreo']),
            user_id
        ))
        d2_id = cur.fetchone()['id']

        cur.execute("""
            INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order")
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (d2_id, 'Nodos & Contenedores', 0))
        d2_tab_id = cur.fetchone()['id']

        cur.execute("DELETE FROM bi_cards WHERE dashboard_id = %s;", (d2_id,))

        d2_cards = [
            {
                'code': 'K004',
                'name': 'Uptime Global del Clúster',
                'chart_type': 'kpi',
                'grid_pos': {'x': 0, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '99.98%',
                    'growth': 0.02,
                    'subtitle': 'Disponibilidad Nodos VLAN 60 (30d)',
                }
            },
            {
                'code': 'K005',
                'name': 'Contenedores Docker Activos',
                'chart_type': 'kpi',
                'grid_pos': {'x': 4, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '48 / 48',
                    'subtitle': 'Todos los Servicios en Estado Healthy',
                }
            },
            {
                'code': 'K006',
                'name': 'Consumo Total RAM (ZBook)',
                'chart_type': 'kpi',
                'grid_pos': {'x': 8, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '18.2 GB / 32 GB',
                    'growth': -1.8,
                    'subtitle': 'Uso de Memoria Bastión (56.8%)',
                }
            },
            {
                'code': 'G003',
                'name': 'Consumo de CPU por Nodo (%)',
                'chart_type': 'bar',
                'grid_pos': {'x': 0, 'y': 3, 'w': 6, 'h': 5},
                'visual': {
                    'color': '#1D5BD8',
                    'staticData': {
                        'columns': ['nodo', 'cpu_pct'],
                        'data': [
                            {'nodo': 'zbook (Bastión)', 'cpu_pct': 14.2},
                            {'nodo': 'srv-nuc (Servarr)', 'cpu_pct': 18.5},
                            {'nodo': 'elitebook (Secundario)', 'cpu_pct': 8.1},
                            {'nodo': 'ha (Home Assistant)', 'cpu_pct': 5.4},
                        ]
                    }
                }
            },
            {
                'code': 'G004',
                'name': 'Distribución de Memoria RAM por Servicio (GB)',
                'chart_type': 'horizontal_bar',
                'grid_pos': {'x': 6, 'y': 3, 'w': 6, 'h': 5},
                'visual': {
                    'color': '#1D5BD8',
                    'staticData': {
                        'columns': ['servicio', 'ram_gb'],
                        'data': [
                            {'servicio': 'Ollama (GPU/CPU)', 'ram_gb': 6.1},
                            {'servicio': 'LiteLLM Proxy', 'ram_gb': 4.2},
                            {'servicio': 'Qdrant Vector DB', 'ram_gb': 2.4},
                            {'servicio': 'FluxTable Engine', 'ram_gb': 1.1},
                            {'servicio': 'n8n Automations', 'ram_gb': 0.8},
                            {'servicio': 'Netdata & Observabilidad', 'ram_gb': 0.4},
                        ]
                    }
                }
            },
            {
                'code': 'T002',
                'name': 'Estado de Respaldos Restic & Bóvedas',
                'chart_type': 'table',
                'grid_pos': {'x': 0, 'y': 8, 'w': 12, 'h': 4},
                'visual': {
                    'staticData': {
                        'columns': ['servicio', 'destino', 'tamano', 'duracion', 'ultimo_backup', 'estado'],
                        'data': [
                            {'servicio': 'PostgreSQL BaserowLite', 'destino': 'NAS QNAP (VLAN 60)', 'tamano': '248 MB', 'duracion': '18s', 'ultimo_backup': 'Hoy 04:00', 'estado': 'Exitoso'},
                            {'servicio': 'Qdrant Vector Store', 'destino': 'NAS QNAP (VLAN 60)', 'tamano': '1.8 GB', 'duracion': '42s', 'ultimo_backup': 'Hoy 04:15', 'estado': 'Exitoso'},
                            {'servicio': 'Pimcore & Media Assets', 'destino': 'NAS QNAP (VLAN 60)', 'tamano': '8.4 GB', 'duracion': '2m 14s', 'ultimo_backup': 'Hoy 04:30', 'estado': 'Exitoso'},
                            {'servicio': 'Configs Docker & Compose', 'destino': 'GitHub Private', 'tamano': '14 MB', 'duracion': '4s', 'ultimo_backup': 'Hoy 05:00', 'estado': 'Sincronizado'},
                        ]
                    }
                }
            }
        ]

        for idx, c in enumerate(d2_cards):
            cur.execute("""
                INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                c['code'], d2_id, d2_tab_id, c['name'], c['chart_type'], 'local_baserow',
                json.dumps({}), json.dumps(c['visual']), json.dumps(c['grid_pos']), idx
            ))

        print("[+] D002 · Infraestructura Homelab & Monitoreo cargado exitosamente.")

        # ---------------------------------------------------------------------
        # DASHBOARD 3: D003 · Operaciones, Automatizaciones y Voz
        # ---------------------------------------------------------------------
        d3_folder = folder_map['Operaciones & Agentes IA']
        cur.execute("""
            INSERT INTO bi_dashboards (code, workspace_id, folder_id, name, description, icon, is_favorite, auto_refresh_interval, layout_json, tags, created_by_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                folder_id = EXCLUDED.folder_id,
                updated_at = NOW()
            RETURNING id;
        """, (
            'D003',
            workspace_id,
            d3_folder,
            'D003 · Operaciones, Automatizaciones y Voz',
            'Telemetría operacional de flujos n8n, mensajería Voz Service, latencia y rendimiento de agentes.',
            'activity',
            True,
            15,
            json.dumps([]),
            json.dumps(['operaciones', 'n8n', 'voz', 'litellm', 'agentes']),
            user_id
        ))
        d3_id = cur.fetchone()['id']

        cur.execute("""
            INSERT INTO bi_dashboard_tabs (dashboard_id, name, "order")
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (d3_id, 'Telemetría de Flujos', 0))
        d3_tab_id = cur.fetchone()['id']

        cur.execute("DELETE FROM bi_cards WHERE dashboard_id = %s;", (d3_id,))

        d3_cards = [
            {
                'code': 'K007',
                'name': 'Flujos n8n Ejecutados (24h)',
                'chart_type': 'kpi',
                'grid_pos': {'x': 0, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '1,420',
                    'growth': 12.5,
                    'subtitle': 'Ejecuciones Totales Despachadas',
                }
            },
            {
                'code': 'K008',
                'name': 'Mensajes Procesados por Voz',
                'chart_type': 'kpi',
                'grid_pos': {'x': 4, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '342',
                    'growth': 8.3,
                    'subtitle': 'Linter y Validación de Voz Activa',
                }
            },
            {
                'code': 'K009',
                'name': 'Tasa de Éxito Automatizaciones',
                'chart_type': 'kpi',
                'grid_pos': {'x': 8, 'y': 0, 'w': 4, 'h': 3},
                'visual': {
                    'displayValue': '99.4%',
                    'growth': 0.3,
                    'subtitle': 'Disponibilidad de Pipelines',
                }
            },
            {
                'code': 'G005',
                'name': 'Ejecuciones por Tipo de Workflow (n8n)',
                'chart_type': 'bar',
                'grid_pos': {'x': 0, 'y': 3, 'w': 6, 'h': 5},
                'visual': {
                    'color': '#1D5BD8',
                    'staticData': {
                        'columns': ['workflow', 'ejecuciones'],
                        'data': [
                            {'workflow': 'PIM Supervisor', 'ejecuciones': 480},
                            {'workflow': 'Ingesta OCR & Docs', 'ejecuciones': 320},
                            {'workflow': 'Sincronización Odoo', 'ejecuciones': 310},
                            {'workflow': 'Backups & Healthcheck', 'ejecuciones': 310},
                        ]
                    }
                }
            },
            {
                'code': 'G006',
                'name': 'Latencia de Inferencia Local (GPU RTX A3000 / ms)',
                'chart_type': 'line',
                'grid_pos': {'x': 6, 'y': 3, 'w': 6, 'h': 5},
                'visual': {
                    'color': '#1D5BD8',
                    'staticData': {
                        'columns': ['hora', 'latencia_ms'],
                        'data': [
                            {'hora': '08:00', 'latencia_ms': 42},
                            {'hora': '10:00', 'latencia_ms': 38},
                            {'hora': '12:00', 'latencia_ms': 54},
                            {'hora': '14:00', 'latencia_ms': 46},
                            {'hora': '16:00', 'latencia_ms': 35},
                            {'hora': '18:00', 'latencia_ms': 41},
                            {'hora': '19:30', 'latencia_ms': 39},
                        ]
                    }
                }
            }
        ]

        for idx, c in enumerate(d3_cards):
            cur.execute("""
                INSERT INTO bi_cards (code, dashboard_id, tab_id, name, chart_type, source_type, query_config_json, visual_config_json, grid_pos_json, "order")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                c['code'], d3_id, d3_tab_id, c['name'], c['chart_type'], 'local_baserow',
                json.dumps({}), json.dumps(c['visual']), json.dumps(c['grid_pos']), idx
            ))

        print("[+] D003 · Operaciones, Automatizaciones y Voz cargado exitosamente.")

        conn.commit()
        print("\n🎉 Todos los Dashboards BI de Demostración y Producción fueron sembrados exitosamente.")

    except Exception as e:
        conn.rollback()
        print(f"[!] Error durante el sembrado de dashboards: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed()
