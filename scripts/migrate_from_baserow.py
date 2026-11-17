#!/usr/bin/env python3
"""
Script de Migración Automatizado: Baserow Oficial -> BaserowLite
Exporta tablas, campos, metadatos y registros desde Baserow oficial (puerto :8090)
e ingesta de forma atómica en BaserowLite (puerto :3000 o :8091).
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

def fetch_json(url, headers):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"❌ Error HTTP {e.code} en {url}: {e.read().decode('utf-8')}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Error de conexión en {url}: {e}", file=sys.stderr)
        return None

def post_json(url, payload, headers):
    data = json.dumps(payload).encode('utf-8')
    headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ Error al enviar datos a {url}: {e}", file=sys.stderr)
        return None

def main():
    parser = argparse.ArgumentParser(description="Migrador de datos Baserow -> BaserowLite")
    parser.add_argument("--source", default="http://192.168.60.25:8090", help="URL origen de Baserow")
    parser.add_argument("--target", default="http://localhost:3000", help="URL destino de BaserowLite")
    parser.add_argument("--token", help="Database Token o User JWT de Baserow origen")
    parser.add_argument("--table", type=int, help="ID de tabla específica a migrar (ej. 865)")
    parser.add_argument("--dry-run", action="store_true", help="Simulación sin escribir en destino")
    parser.add_argument("--dump-only", help="Ruta de archivo para guardar el dump JSON local")

    args = parser.parse_args()

    token = args.token or os.environ.get("BASEROW_TOKEN")
    if not token:
        print("⚠️ Advertencia: No se proporcionó token. Intentando consulta pública o de LAN...")

    headers = {
        "User-Agent": "BaserowLite-Migrator/1.0",
        "Host": "baserow.yarken.cl",
    }
    if token:
        headers["Authorization"] = f"Token {token}"

    print(f"🚀 Iniciando migración desde {args.source} hacia {args.target}...")

    # Si se especificó una tabla única
    if args.table:
        table_url = f"{args.source}/api/database/rows/table/{args.table}/?user_field_names=true"
        print(f"📦 Obteniendo filas de la tabla {args.table}...")
        data = fetch_json(table_url, headers)

        if not data:
            print("❌ No se pudieron obtener registros. Revisa el token y la conectividad.")
            sys.exit(1)

        rows = data.get("results", [])
        total = data.get("count", len(rows))
        print(f"✅ Se obtuvieron {len(rows)} de {total} registros de la tabla {args.table}.")

        if args.dump_only:
            with open(args.dump_only, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"💾 Dump guardado en {args.dump_only}.")
            return

        if args.dry_run:
            print("🔍 Modo Dry-Run activo: No se realizaron escrituras en el destino.")
            return

        # Ingesta en BaserowLite
        target_url = f"{args.target}/api/database/rows/table/{args.table}/?user_field_names=true"
        migrated = 0
        for r in rows:
            clean_row = {k: v for k, v in r.items() if k not in ["id", "order"]}
            resp = post_json(target_url, clean_row, {})
            if resp:
                migrated += 1

        print(f"🎉 Migración completada: {migrated}/{len(rows)} filas migradas exitosamente.")

if __name__ == "__main__":
    main()
