#!/usr/bin/env python3
"""Rollback de migración v13.

Revierte:
- DROP las 5 columnas de comercial_touchpoints
- DROP la columna friction_type de comercial_frictions
- DROP las 2 columnas de comercial_kpis (is_master, master_metric)
- DELETE de schema_migrations WHERE version='v13'

CRÍTICO: usar SOLO si la migración v13 falla en prod o si se necesita revertir
deliberadamente. Pre-requisito: pg_dump backup completo antes de correr.

Para Postgres: DROP COLUMN IF EXISTS — idempotente.
Para SQLite: DROP COLUMN existe desde 3.35 (2021).
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
parser.add_argument("--confirm", action="store_true", help="Required to actually run the rollback")
args = parser.parse_args()

if not args.confirm:
    print("ERROR: rollback es destructivo. Pasar --confirm para ejecutar.")
    print("Ejemplo: python3 migrate_comercial_v13_rollback.py --sqlite --confirm")
    sys.exit(1)

if args.sqlite:
    os.environ["FORCE_SQLITE"] = "1"
    os.environ.pop("DATABASE_URL", None)
elif args.database_url:
    os.environ.pop("FORCE_SQLITE", None)
    os.environ["DATABASE_URL"] = args.database_url.strip()

from sqlalchemy import text  # noqa: E402
from app.database import engine, is_postgres  # noqa: E402


VERSION = "v13"

DROPS_PG = [
    'ALTER TABLE comercial_touchpoints DROP COLUMN IF EXISTS internal_checklist',
    'ALTER TABLE comercial_touchpoints DROP COLUMN IF EXISTS duration_minutes',
    'ALTER TABLE comercial_touchpoints DROP COLUMN IF EXISTS duration_label',
    'ALTER TABLE comercial_touchpoints DROP COLUMN IF EXISTS classification',
    'ALTER TABLE comercial_touchpoints DROP COLUMN IF EXISTS leverage_point',
    'ALTER TABLE comercial_frictions DROP COLUMN IF EXISTS friction_type',
    'ALTER TABLE comercial_kpis DROP COLUMN IF EXISTS is_master',
    'ALTER TABLE comercial_kpis DROP COLUMN IF EXISTS master_metric',
]

DROPS_SQLITE = [
    'ALTER TABLE comercial_touchpoints DROP COLUMN internal_checklist',
    'ALTER TABLE comercial_touchpoints DROP COLUMN duration_minutes',
    'ALTER TABLE comercial_touchpoints DROP COLUMN duration_label',
    'ALTER TABLE comercial_touchpoints DROP COLUMN classification',
    'ALTER TABLE comercial_touchpoints DROP COLUMN leverage_point',
    'ALTER TABLE comercial_frictions DROP COLUMN friction_type',
    'ALTER TABLE comercial_kpis DROP COLUMN is_master',
    'ALTER TABLE comercial_kpis DROP COLUMN master_metric',
]


def rollback():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    print(f"⚠️  Iniciando rollback de migración {VERSION}.")

    with engine.begin() as conn:
        drops = DROPS_PG if pg else DROPS_SQLITE
        dropped = 0
        skipped = 0
        for sql in drops:
            try:
                conn.execute(text(sql))
                print(f"  DROPPED: {sql[:80]}")
                dropped += 1
            except Exception as e:
                msg = str(e).lower()
                if "no such column" in msg or "does not exist" in msg or "no column" in msg:
                    print(f"  SKIP (column no existe): {sql[:80]}")
                    skipped += 1
                else:
                    print(f"  ERROR: {sql[:80]} — {e.__class__.__name__}: {e}")
                    raise
        # Limpiar tracking
        try:
            conn.execute(text("DELETE FROM schema_migrations WHERE version = :v"), {"v": VERSION})
            print(f"  TRACKED: schema_migrations -= '{VERSION}'")
        except Exception as e:
            print(f"  WARN: no se pudo limpiar schema_migrations — {e}")

    print(f"\nRollback {VERSION} completado. Dropped: {dropped}, skipped: {skipped}.")


if __name__ == "__main__":
    rollback()
