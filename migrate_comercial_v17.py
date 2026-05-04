#!/usr/bin/env python3
"""Migración v17 — `description` en touchpoints y fricciones.

Hoy un TP solo tiene `notes` (texto libre semi-oculto) y una fricción solo
tiene `solution` + `expected_outcome`. Falta un campo `description` formal
para explicar el QUÉ del touchpoint o la fricción de manera clara.

Cambios:
- comercial_touchpoints: + description TEXT DEFAULT ''
- comercial_frictions:   + description TEXT DEFAULT ''

Idempotente: skip por schema_migrations + IF NOT EXISTS / catch exception.
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


VERSION = "v17"

ALTERS_PG = [
    "ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
    "ALTER TABLE comercial_frictions   ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
]

ALTERS_SQLITE = [
    "ALTER TABLE comercial_touchpoints ADD COLUMN description TEXT DEFAULT ''",
    "ALTER TABLE comercial_frictions   ADD COLUMN description TEXT DEFAULT ''",
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
