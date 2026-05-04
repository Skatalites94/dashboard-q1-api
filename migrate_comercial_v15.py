#!/usr/bin/env python3
"""Migración v15 — F4 Tablas de gobernanza.

Crea 3 tablas: charter (singleton), gaps (registro de huecos), tests (pruebas
de validación contractuales/mercado/proceso). Idempotente con CREATE TABLE
IF NOT EXISTS.
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

VERSION = "v15"

# Statements separados — se ejecutan uno por uno
STMTS_PG = [
    # Charter (singleton: id=1)
    """CREATE TABLE IF NOT EXISTS comercial_governance_charter (
        id INTEGER PRIMARY KEY DEFAULT 1,
        owner_id INTEGER NULL,
        cadence VARCHAR(20) DEFAULT 'monthly',
        change_criteria TEXT DEFAULT '',
        principles TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
    # Gaps registry
    """CREATE TABLE IF NOT EXISTS comercial_governance_gaps (
        id SERIAL PRIMARY KEY,
        gap_type VARCHAR(20) NOT NULL,
        reference_id VARCHAR(50) NULL,
        description TEXT NOT NULL,
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        owner_id INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL
    )""",
    # Validation tests
    """CREATE TABLE IF NOT EXISTS comercial_governance_tests (
        id SERIAL PRIMARY KEY,
        test_type VARCHAR(20) NOT NULL,
        subject VARCHAR(300) NOT NULL,
        hypothesis TEXT DEFAULT '',
        evidence TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'planned',
        performed_at TIMESTAMP NULL,
        owner_id INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
]

STMTS_SQLITE = [
    """CREATE TABLE IF NOT EXISTS comercial_governance_charter (
        id INTEGER PRIMARY KEY,
        owner_id INTEGER NULL,
        cadence VARCHAR(20) DEFAULT 'monthly',
        change_criteria TEXT DEFAULT '',
        principles TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_governance_gaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gap_type VARCHAR(20) NOT NULL,
        reference_id VARCHAR(50) NULL,
        description TEXT NOT NULL,
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        owner_id INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_governance_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_type VARCHAR(20) NOT NULL,
        subject VARCHAR(300) NOT NULL,
        hypothesis TEXT DEFAULT '',
        evidence TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'planned',
        performed_at TIMESTAMP NULL,
        owner_id INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
]


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    stmts = STMTS_PG if pg else STMTS_SQLITE
    with engine.begin() as conn:
        try:
            conn.execute(text("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(20) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"))
            r = conn.execute(text("SELECT 1 FROM schema_migrations WHERE version = :v"), {"v": VERSION}).fetchone()
            if r:
                print(f"  SKIP: {VERSION} ya aplicada.")
                return
        except Exception:
            pass

        for stmt in stmts:
            conn.execute(text(stmt))
            print(f"  RUN: {stmt[:60].strip()}...")

        # Singleton charter row
        conn.execute(text("INSERT OR IGNORE INTO comercial_governance_charter (id, cadence) VALUES (1, 'monthly')") if not pg else
                     text("INSERT INTO comercial_governance_charter (id, cadence) VALUES (1, 'monthly') ON CONFLICT DO NOTHING"))

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
