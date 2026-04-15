#!/usr/bin/env python3
"""Migration: checklist de resolución en fricciones (JSON)."""

import argparse
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

parser = argparse.ArgumentParser(
    description="Añade columna resolution_checklist a comercial_frictions.",
)
parser.add_argument(
    "--sqlite",
    action="store_true",
    help="Usar solo SQLite local (data/dashboard.db). Ignora DATABASE_URL del .env.",
)
parser.add_argument(
    "--database-url",
    metavar="URL",
    help=(
        "Postgres para esta ejecución (sustituye DATABASE_URL). "
        "En Supabase con IPv4/Railway usa el pooler, no el host db.*.supabase.co directo."
    ),
)
args = parser.parse_args()

if args.sqlite:
    os.environ["FORCE_SQLITE"] = "1"
    os.environ.pop("DATABASE_URL", None)
elif args.database_url:
    os.environ.pop("FORCE_SQLITE", None)
    os.environ["DATABASE_URL"] = args.database_url.strip()

from sqlalchemy import text  # noqa: E402

from app.database import engine, is_postgres  # noqa: E402

MIGRATIONS_PG = [
    """ALTER TABLE comercial_frictions
       ADD COLUMN IF NOT EXISTS resolution_checklist JSONB DEFAULT '[]'::jsonb""",
]

MIGRATIONS_SQLITE = [
    # SQLite: columna TEXT con JSON serializado (SQLAlchemy JSON)
    "ALTER TABLE comercial_frictions ADD COLUMN resolution_checklist TEXT DEFAULT '[]'",
]


def migrate() -> None:
    backend = "Postgres" if is_postgres() else "SQLite"
    print(f"Conectando: {backend} ({engine.url.render_as_string(hide_password=True)})")
    sqls = MIGRATIONS_PG if is_postgres() else MIGRATIONS_SQLITE
    with engine.connect() as conn:
        for sql in sqls:
            try:
                conn.execute(text(sql))
                print(f"  OK: {sql.strip().splitlines()[0][:70]}")
            except Exception as e:
                print(f"  SKIP: {e}")
        conn.commit()
    print("migrate_comercial_v3 completada.")


if __name__ == "__main__":
    migrate()
