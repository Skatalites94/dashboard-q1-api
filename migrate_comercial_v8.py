#!/usr/bin/env python3
"""Migración v8: tabla comercial_canvas_layout para Mapa Visual canvas libre."""
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
CREATE TABLE IF NOT EXISTS comercial_canvas_layout (
    id SERIAL PRIMARY KEY,
    view_id VARCHAR(50) NOT NULL DEFAULT 'comercial_main',
    entity_type VARCHAR(20) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    width REAL,
    height REAL,
    updated_at TIMESTAMP DEFAULT NOW()
)
"""

CREATE_SQLITE = """
CREATE TABLE IF NOT EXISTS comercial_canvas_layout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    view_id TEXT NOT NULL DEFAULT 'comercial_main',
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    width REAL,
    height REAL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

UNIQUE_INDEX = """
CREATE UNIQUE INDEX IF NOT EXISTS ux_canvas_layout_view_entity
ON comercial_canvas_layout (view_id, entity_type, entity_id)
"""


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    with engine.begin() as c:
        c.execute(text(CREATE_PG if pg else CREATE_SQLITE))
        print("  OK CREATE: comercial_canvas_layout")
        c.execute(text(UNIQUE_INDEX))
        print("  OK INDEX:  ux_canvas_layout_view_entity")
    print("migrate_comercial_v8 completada.")


if __name__ == "__main__":
    migrate()
