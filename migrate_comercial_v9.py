#!/usr/bin/env python3
"""Migración v9: tabla comercial_canvas_notes para notas libres en el Mapa Visual."""
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
CREATE TABLE IF NOT EXISTS comercial_canvas_notes (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL DEFAULT '',
    color VARCHAR(20) NOT NULL DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)
"""

CREATE_SQLITE = """
CREATE TABLE IF NOT EXISTS comercial_canvas_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    with engine.begin() as c:
        c.execute(text(CREATE_PG if pg else CREATE_SQLITE))
        print("  OK CREATE: comercial_canvas_notes")
    print("migrate_comercial_v9 completada.")


if __name__ == "__main__":
    migrate()
