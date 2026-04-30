#!/usr/bin/env python3
"""Migración v7: Iniciativa como espina dorsal con M:N.

Agrega:
- Campos `priority`, `area`, `tipo` a `comercial_iniciativas`.
- 5 tablas pivote: friction, touchpoint, pillar, involved (personas), dependency.
- Backfill de columnas legacy (pillar_id, touchpoint_id) hacia las pivots.
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


ALTER_PG = [
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium'",
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS area VARCHAR(60) DEFAULT ''",
    "ALTER TABLE comercial_iniciativas ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'operativa'",
]

ALTER_SQLITE = [
    "ALTER TABLE comercial_iniciativas ADD COLUMN priority VARCHAR(10) DEFAULT 'medium'",
    "ALTER TABLE comercial_iniciativas ADD COLUMN area VARCHAR(60) DEFAULT ''",
    "ALTER TABLE comercial_iniciativas ADD COLUMN tipo VARCHAR(20) DEFAULT 'operativa'",
]

CREATE_TABLES = [
    """CREATE TABLE IF NOT EXISTS comercial_initiative_friction (
        initiative_id INTEGER NOT NULL,
        friction_id VARCHAR(10) NOT NULL,
        PRIMARY KEY (initiative_id, friction_id)
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_initiative_touchpoint (
        initiative_id INTEGER NOT NULL,
        touchpoint_id INTEGER NOT NULL,
        PRIMARY KEY (initiative_id, touchpoint_id)
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_initiative_pillar (
        initiative_id INTEGER NOT NULL,
        pillar_id VARCHAR(50) NOT NULL,
        PRIMARY KEY (initiative_id, pillar_id)
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_initiative_involved (
        initiative_id INTEGER NOT NULL,
        person_id INTEGER NOT NULL,
        PRIMARY KEY (initiative_id, person_id)
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_initiative_dependency (
        initiative_id INTEGER NOT NULL,
        depends_on_id INTEGER NOT NULL,
        PRIMARY KEY (initiative_id, depends_on_id)
    )""",
]


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    alters = ALTER_PG if pg else ALTER_SQLITE

    with engine.begin() as c:
        for sql in alters:
            try:
                c.execute(text(sql))
                print(f"  OK ALTER: {sql[:80]}")
            except Exception as e:
                msg = str(e).lower()
                if "duplicate" in msg or "already exists" in msg or "exists" in msg:
                    print(f"  SKIP (existe): {sql[:80]}")
                else:
                    raise

        for sql in CREATE_TABLES:
            c.execute(text(sql))
            tname = sql.split("EXISTS")[1].split("(")[0].strip()
            print(f"  OK CREATE: {tname}")

        # Backfill desde columnas legacy
        rows = c.execute(text(
            "SELECT id, pillar_id, touchpoint_id FROM comercial_iniciativas"
        )).fetchall()
        bf_p = bf_t = 0
        for r in rows:
            ini_id, pid, tpid = r[0], r[1], r[2]
            if pid:
                c.execute(
                    text("INSERT INTO comercial_initiative_pillar (initiative_id, pillar_id) VALUES (:i, :p) ON CONFLICT DO NOTHING") if pg
                    else text("INSERT OR IGNORE INTO comercial_initiative_pillar (initiative_id, pillar_id) VALUES (:i, :p)"),
                    {"i": ini_id, "p": pid},
                )
                bf_p += 1
            if tpid:
                c.execute(
                    text("INSERT INTO comercial_initiative_touchpoint (initiative_id, touchpoint_id) VALUES (:i, :t) ON CONFLICT DO NOTHING") if pg
                    else text("INSERT OR IGNORE INTO comercial_initiative_touchpoint (initiative_id, touchpoint_id) VALUES (:i, :t)"),
                    {"i": ini_id, "t": tpid},
                )
                bf_t += 1
        print(f"  Backfill: {bf_p} pillar links, {bf_t} touchpoint links")

    print("migrate_comercial_v7 completada.")


if __name__ == "__main__":
    migrate()
