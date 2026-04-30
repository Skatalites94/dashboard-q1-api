#!/usr/bin/env python3
"""Migration v6: robustecer iniciativas comerciales (descripcion + linkage proceso)."""

import argparse
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

parser = argparse.ArgumentParser(description="Comercial initiatives v6 migration.")
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
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS motor VARCHAR(40) DEFAULT 'trust'",
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS phase_id VARCHAR(50)",
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS touchpoint_id INTEGER",
]

MIGRATIONS_SQLITE = [
    "ALTER TABLE comercial_iniciativas ADD COLUMN description TEXT DEFAULT ''",
    "ALTER TABLE comercial_iniciativas ADD COLUMN motor TEXT DEFAULT 'trust'",
    "ALTER TABLE comercial_iniciativas ADD COLUMN phase_id TEXT",
    "ALTER TABLE comercial_iniciativas ADD COLUMN touchpoint_id INTEGER",
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
    print("migrate_comercial_v6 completada.")


if __name__ == "__main__":
    migrate()
