#!/usr/bin/env python3
"""Migración v16 — Company Context (singleton id=1).

Crea la tabla `comercial_company_context` con id=1 como fila única.
Se usa para alimentar al generador AI con info robusta de la empresa
(industria, segmento, ticket, dolores, etc.) sin que el usuario tenga
que re-pegar contexto cada vez que genera.

Idempotente con CREATE TABLE IF NOT EXISTS y schema_migrations tracking.
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

VERSION = "v16"

STMTS_PG = [
    """CREATE TABLE IF NOT EXISTS comercial_company_context (
        id INTEGER PRIMARY KEY DEFAULT 1,
        company_name VARCHAR(200) DEFAULT '',
        industry VARCHAR(200) DEFAULT '',
        business_model VARCHAR(50) DEFAULT '',
        target_segment TEXT DEFAULT '',
        geographies TEXT DEFAULT '',
        team_size INTEGER NULL,
        sales_team_size INTEGER NULL,
        avg_ticket_mxn DOUBLE PRECISION NULL,
        sales_cycle_days INTEGER NULL,
        main_value_prop TEXT DEFAULT '',
        top_competitors TEXT DEFAULT '',
        main_pains_today TEXT DEFAULT '',
        language_style VARCHAR(20) DEFAULT 'directo',
        notes TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
]

STMTS_SQLITE = [
    """CREATE TABLE IF NOT EXISTS comercial_company_context (
        id INTEGER PRIMARY KEY,
        company_name VARCHAR(200) DEFAULT '',
        industry VARCHAR(200) DEFAULT '',
        business_model VARCHAR(50) DEFAULT '',
        target_segment TEXT DEFAULT '',
        geographies TEXT DEFAULT '',
        team_size INTEGER NULL,
        sales_team_size INTEGER NULL,
        avg_ticket_mxn REAL NULL,
        sales_cycle_days INTEGER NULL,
        main_value_prop TEXT DEFAULT '',
        top_competitors TEXT DEFAULT '',
        main_pains_today TEXT DEFAULT '',
        language_style VARCHAR(20) DEFAULT 'directo',
        notes TEXT DEFAULT '',
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

        # Singleton row
        if pg:
            conn.execute(text("INSERT INTO comercial_company_context (id) VALUES (1) ON CONFLICT DO NOTHING"))
        else:
            conn.execute(text("INSERT OR IGNORE INTO comercial_company_context (id) VALUES (1)"))

        try:
            conn.execute(
                text("INSERT INTO schema_migrations (version) VALUES (:v) ON CONFLICT DO NOTHING") if pg
                else text("INSERT OR IGNORE INTO schema_migrations (version) VALUES (:v)"),
                {"v": VERSION},
            )
            print(f"  TRACKED: schema_migrations += '{VERSION}'")
        except Exception as e:
            print(f"  WARN tracking: {e}")

    print(f"\nMigración {VERSION} aplicada.")


if __name__ == "__main__":
    migrate()
