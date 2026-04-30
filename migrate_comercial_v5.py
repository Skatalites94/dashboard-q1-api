#!/usr/bin/env python3
"""Migration v5: tabla comercial_iniciativas."""

import argparse
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

parser = argparse.ArgumentParser(description="Comercial initiatives migration.")
parser.add_argument("--sqlite", action="store_true", help="Force SQLite local.")
parser.add_argument("--database-url", metavar="URL", help="Explicit Postgres URI.")
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
    """CREATE TABLE IF NOT EXISTS comercial_iniciativas (
        id SERIAL PRIMARY KEY,
        pillar_id VARCHAR(50),
        title VARCHAR(300) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        responsable_id INTEGER,
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""",
]

MIGRATIONS_SQLITE = [
    """CREATE TABLE IF NOT EXISTS comercial_iniciativas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pillar_id TEXT,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        responsable_id INTEGER,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
]


def migrate() -> None:
    backend = "Postgres" if is_postgres() else "SQLite"
    print(f"Conectando: {backend} ({engine.url.render_as_string(hide_password=True)})")
    sqls = MIGRATIONS_PG if is_postgres() else MIGRATIONS_SQLITE
    with engine.connect() as conn:
        for sql in sqls:
            try:
                conn.execute(text(sql))
                label = sql.strip().splitlines()[0][:70]
                print(f"  OK: {label}")
            except Exception as e:
                print(f"  SKIP: {e}")
        conn.commit()
    print("migrate_comercial_v5 completada.")


if __name__ == "__main__":
    migrate()
