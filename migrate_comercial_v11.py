#!/usr/bin/env python3
"""Migración v11: canales como entidad M:N.

Crea:
- comercial_channels (catálogo de canales canónicos: WhatsApp, Email, Llamada...)
- comercial_touchpoint_channel (M:N touchpoint ↔ canal)

NO toca tp.canal todavía (se mantiene durante el backfill y se elimina en v12).
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


CHANNELS_PG = """
CREATE TABLE IF NOT EXISTS comercial_channels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '',
    color VARCHAR(20) DEFAULT '#94A3B8',
    description TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0
)
"""

CHANNELS_SQLITE = """
CREATE TABLE IF NOT EXISTS comercial_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '#94A3B8',
    description TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0
)
"""

TP_CHANNEL_PG = """
CREATE TABLE IF NOT EXISTS comercial_touchpoint_channel (
    touchpoint_id INTEGER NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (touchpoint_id, channel_id)
)
"""

TP_CHANNEL_SQLITE = """
CREATE TABLE IF NOT EXISTS comercial_touchpoint_channel (
    touchpoint_id INTEGER NOT NULL,
    channel_id TEXT NOT NULL,
    PRIMARY KEY (touchpoint_id, channel_id)
)
"""

INDEX_TP = """
CREATE INDEX IF NOT EXISTS ix_tp_channel_tp ON comercial_touchpoint_channel (touchpoint_id)
"""
INDEX_CH = """
CREATE INDEX IF NOT EXISTS ix_tp_channel_ch ON comercial_touchpoint_channel (channel_id)
"""


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    with engine.begin() as c:
        c.execute(text(CHANNELS_PG if pg else CHANNELS_SQLITE))
        print("  OK CREATE: comercial_channels")
        c.execute(text(TP_CHANNEL_PG if pg else TP_CHANNEL_SQLITE))
        print("  OK CREATE: comercial_touchpoint_channel")
        c.execute(text(INDEX_TP))
        c.execute(text(INDEX_CH))
        print("  OK INDEXES: ix_tp_channel_tp, ix_tp_channel_ch")
    print("migrate_comercial_v11 completada.")


if __name__ == "__main__":
    migrate()
