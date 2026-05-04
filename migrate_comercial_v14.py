#!/usr/bin/env python3
"""Migración v14 — F3 Wizard Motor de Confianza.

Crea tabla `comercial_trust_pillar_steps` (pasos accionables por pilar).
Idempotente: usa CREATE TABLE IF NOT EXISTS.
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

VERSION = "v14"

DDL_PG = """
CREATE TABLE IF NOT EXISTS comercial_trust_pillar_steps (
    id SERIAL PRIMARY KEY,
    pillar_id VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    evidence TEXT DEFAULT '',
    responsable_id INTEGER NULL,
    due_date DATE NULL,
    status VARCHAR(20) DEFAULT 'pending',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_trust_pillar_steps_pillar ON comercial_trust_pillar_steps(pillar_id);
"""

DDL_SQLITE = """
CREATE TABLE IF NOT EXISTS comercial_trust_pillar_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pillar_id VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    evidence TEXT DEFAULT '',
    responsable_id INTEGER NULL,
    due_date DATE NULL,
    status VARCHAR(20) DEFAULT 'pending',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_trust_pillar_steps_pillar ON comercial_trust_pillar_steps(pillar_id);
"""


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    ddl = DDL_PG if pg else DDL_SQLITE
    with engine.begin() as conn:
        # Idempotency tracking
        try:
            conn.execute(text("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(20) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"))
            r = conn.execute(text("SELECT 1 FROM schema_migrations WHERE version = :v"), {"v": VERSION}).fetchone()
            if r:
                print(f"  SKIP: {VERSION} ya aplicada (schema_migrations).")
                return
        except Exception:
            pass

        # ddl tiene 2 statements; SQLAlchemy text no soporta múltiples por defecto, ejecutamos por separado
        for stmt in [s.strip() for s in ddl.split(";") if s.strip()]:
            conn.execute(text(stmt))
            print(f"  RUN: {stmt[:80]}")

        try:
            conn.execute(text("INSERT INTO schema_migrations (version) VALUES (:v) ON CONFLICT DO NOTHING") if pg else
                         text("INSERT OR IGNORE INTO schema_migrations (version) VALUES (:v)"),
                         {"v": VERSION})
            print(f"  TRACKED: schema_migrations += '{VERSION}'")
        except Exception as e:
            print(f"  WARN tracking: {e}")

    print(f"\nMigración {VERSION} aplicada.")


if __name__ == "__main__":
    migrate()
