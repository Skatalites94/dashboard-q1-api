#!/usr/bin/env python3
"""Migración v10: tabla comercial_touchpoint_flow para conexiones editables (journey con bifurcaciones)."""
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


CREATE_PG = """
CREATE TABLE IF NOT EXISTS comercial_touchpoint_flow (
    id SERIAL PRIMARY KEY,
    from_touchpoint_id INTEGER NOT NULL,
    to_touchpoint_id INTEGER NOT NULL,
    label VARCHAR(80),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
)
"""

CREATE_SQLITE = """
CREATE TABLE IF NOT EXISTS comercial_touchpoint_flow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_touchpoint_id INTEGER NOT NULL,
    to_touchpoint_id INTEGER NOT NULL,
    label TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

UNIQUE_INDEX = """
CREATE UNIQUE INDEX IF NOT EXISTS ux_tp_flow_pair
ON comercial_touchpoint_flow (from_touchpoint_id, to_touchpoint_id)
"""


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    with engine.begin() as c:
        c.execute(text(CREATE_PG if pg else CREATE_SQLITE))
        print("  OK CREATE: comercial_touchpoint_flow")
        c.execute(text(UNIQUE_INDEX))
        print("  OK INDEX:  ux_tp_flow_pair")
    print("migrate_comercial_v10 completada.")


if __name__ == "__main__":
    migrate()
