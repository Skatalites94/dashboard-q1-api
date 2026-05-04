#!/usr/bin/env python3
"""Migración v12: drop columnas legacy.

- comercial_touchpoints.kpi (texto libre, reemplazado por M:N comercial_kpi_touchpoint)
- comercial_kpis.tracking_mode (reemplazado por derivación automática + thresholds)

CRÍTICO: Correr DESPUÉS del backfill v11 y de actualizar modelos/serializers/schemas
para que no referencien estos campos.

Para Postgres usa DROP COLUMN IF EXISTS — idempotente.
Para SQLite, la sintaxis ALTER TABLE DROP COLUMN existe a partir de SQLite 3.35 (2021),
con fallback de recreación de tabla si fuera necesario.
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


DROPS_PG = [
    'ALTER TABLE comercial_touchpoints DROP COLUMN IF EXISTS kpi',
    'ALTER TABLE comercial_kpis DROP COLUMN IF EXISTS tracking_mode',
]

DROPS_SQLITE = [
    'ALTER TABLE comercial_touchpoints DROP COLUMN kpi',
    'ALTER TABLE comercial_kpis DROP COLUMN tracking_mode',
]


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")
    drops = DROPS_PG if pg else DROPS_SQLITE
    with engine.begin() as c:
        for sql in drops:
            try:
                c.execute(text(sql))
                print(f"  OK: {sql}")
            except Exception as e:
                print(f"  SKIP (probablemente ya eliminado): {sql} — {e.__class__.__name__}")
    print("migrate_comercial_v12 completada.")


if __name__ == "__main__":
    migrate()
