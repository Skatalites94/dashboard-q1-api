#!/usr/bin/env python3
"""Migración v18 — `is_critical` en fricciones + `main_objectives` en company_context.

Cambios:
- comercial_frictions: + is_critical BOOLEAN DEFAULT FALSE
- comercial_company_context: + main_objectives TEXT DEFAULT ''

Estos campos alimentan al agente AI:
  · is_critical → al generar iniciativas, AI prioriza solo las críticas.
  · main_objectives → contexto extra para que las sugerencias se alineen
    con lo que el CEO quiere lograr (no solo qué duele hoy).

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


VERSION = "v18"

ALTERS_PG = [
    "ALTER TABLE comercial_frictions ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE",
    "ALTER TABLE comercial_company_context ADD COLUMN IF NOT EXISTS main_objectives TEXT DEFAULT ''",
]

ALTERS_SQLITE = [
    "ALTER TABLE comercial_frictions ADD COLUMN is_critical BOOLEAN DEFAULT 0",
    "ALTER TABLE comercial_company_context ADD COLUMN main_objectives TEXT DEFAULT ''",
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
