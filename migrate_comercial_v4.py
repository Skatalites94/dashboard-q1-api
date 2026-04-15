#!/usr/bin/env python3
"""Migration v4: KPI hybrid tracking fields + tp_kpi_config + tp_kpi_history."""

import argparse
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

parser = argparse.ArgumentParser(description="KPI hybrid tracking migration.")
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
    "ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS tracking_mode VARCHAR(30) DEFAULT 'global_only'",
    "ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'monthly'",
    "ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS grace_days INTEGER DEFAULT 3",
    "ALTER TABLE comercial_kpi_touchpoint ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE",
    "ALTER TABLE comercial_kpi_touchpoint ADD COLUMN IF NOT EXISTS target_value_local FLOAT",
    "ALTER TABLE comercial_kpi_touchpoint ADD COLUMN IF NOT EXISTS responsable_id INTEGER",
    """CREATE TABLE IF NOT EXISTS comercial_tp_kpi_history (
        id SERIAL PRIMARY KEY,
        kpi_id VARCHAR(50) NOT NULL,
        touchpoint_id INTEGER NOT NULL,
        value FLOAT NOT NULL,
        notes VARCHAR(400) DEFAULT '',
        author VARCHAR(200) DEFAULT '',
        recorded_at TIMESTAMP DEFAULT NOW()
    )""",
]

MIGRATIONS_SQLITE = [
    "ALTER TABLE comercial_kpis ADD COLUMN tracking_mode TEXT DEFAULT 'global_only'",
    "ALTER TABLE comercial_kpis ADD COLUMN frequency TEXT DEFAULT 'monthly'",
    "ALTER TABLE comercial_kpis ADD COLUMN grace_days INTEGER DEFAULT 3",
    "ALTER TABLE comercial_kpi_touchpoint ADD COLUMN is_critical INTEGER DEFAULT 0",
    "ALTER TABLE comercial_kpi_touchpoint ADD COLUMN target_value_local REAL",
    "ALTER TABLE comercial_kpi_touchpoint ADD COLUMN responsable_id INTEGER",
    """CREATE TABLE IF NOT EXISTS comercial_tp_kpi_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kpi_id TEXT NOT NULL,
        touchpoint_id INTEGER NOT NULL,
        value REAL NOT NULL,
        notes TEXT DEFAULT '',
        author TEXT DEFAULT '',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    print("migrate_comercial_v4 completada.")


if __name__ == "__main__":
    migrate()
