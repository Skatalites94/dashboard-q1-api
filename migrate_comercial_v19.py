#!/usr/bin/env python3
"""Migración v19 — atestaciones de validación del workbook (Cris Urzúa).

Agrega 6 columnas a `comercial_company_context` (singleton id=1) para registrar
si el equipo ejecutó las 3 pruebas de validación del workbook + notas libres
de qué descubrieron en cada una:

- validated_terreno BOOLEAN — vendedor de campo recorrió el mapa
- validated_terreno_notes TEXT — divergencias detectadas
- validated_fantasma BOOLEAN — alguien pasó como prospecto end-to-end
- validated_fantasma_notes TEXT — qué descubrió el cliente fantasma
- validated_datos BOOLEAN — auditoría con datos reales (CRM, email, WA)
- validated_datos_notes TEXT — divergencias entre proceso documentado y métricas

Idempotente vía schema_migrations + ADD COLUMN IF NOT EXISTS / catch.
"""
import argparse
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

parser = argparse.ArgumentParser()
parser.add_argument("--sqlite", action="store_true")
parser.add_argument("--database-url")
args = parser.parse_args()

if args.sqlite:
    os.environ["FORCE_SQLITE"] = "1"
    os.environ.pop("DATABASE_URL", None)
elif args.database_url:
    os.environ.pop("FORCE_SQLITE", None)
    os.environ["DATABASE_URL"] = args.database_url.strip()

from sqlalchemy import text  # noqa: E402
from app.database import engine, is_postgres  # noqa: E402


VERSION = "v19"

ALTERS_PG = [
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS validated_terreno BOOLEAN DEFAULT FALSE",
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS validated_terreno_notes TEXT DEFAULT ''",
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS validated_fantasma BOOLEAN DEFAULT FALSE",
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS validated_fantasma_notes TEXT DEFAULT ''",
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS validated_datos BOOLEAN DEFAULT FALSE",
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS validated_datos_notes TEXT DEFAULT ''",
]

ALTERS_SQLITE = [
    "ALTER TABLE comercial_company_context ADD COLUMN validated_terreno BOOLEAN DEFAULT 0",
    "ALTER TABLE comercial_company_context ADD COLUMN validated_terreno_notes TEXT DEFAULT ''",
    "ALTER TABLE comercial_company_context ADD COLUMN validated_fantasma BOOLEAN DEFAULT 0",
    "ALTER TABLE comercial_company_context ADD COLUMN validated_fantasma_notes TEXT DEFAULT ''",
    "ALTER TABLE comercial_company_context ADD COLUMN validated_datos BOOLEAN DEFAULT 0",
    "ALTER TABLE comercial_company_context ADD COLUMN validated_datos_notes TEXT DEFAULT ''",
]


def already_applied(conn) -> bool:
    try:
        r = conn.execute(text("SELECT 1 FROM schema_migrations WHERE version = :v"), {"v": VERSION}).fetchone()
        return r is not None
    except Exception:
        return False


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")

    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(20) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        ))

        if already_applied(conn):
            print(f"  SKIP: {VERSION} ya aplicada.")
            return

        alters = ALTERS_PG if pg else ALTERS_SQLITE
        applied = 0
        skipped = 0

        for sql in alters:
            try:
                conn.execute(text(sql))
                print(f"  OK: {sql[:80]}")
                applied += 1
            except Exception as e:
                msg = str(e).lower()
                if "duplicate" in msg or "already exists" in msg:
                    print(f"  SKIP (existe): {sql[:80]}")
                    skipped += 1
                else:
                    print(f"  ERROR: {sql[:80]} — {e.__class__.__name__}: {e}")
                    raise

        conn.execute(
            text("INSERT INTO schema_migrations (version) VALUES (:v) ON CONFLICT DO NOTHING") if pg
            else text("INSERT OR IGNORE INTO schema_migrations (version) VALUES (:v)"),
            {"v": VERSION},
        )
        print(f"  TRACKED: schema_migrations += '{VERSION}'")
        print(f"\nMigración {VERSION} aplicada. Aplicadas: {applied}, omitidas: {skipped}.")


if __name__ == "__main__":
    migrate()
