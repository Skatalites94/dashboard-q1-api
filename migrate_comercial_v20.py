#!/usr/bin/env python3
"""Migración v20 — Workspaces (multi-marca).

Convierte la app de single-tenant (un solo "Promoselect") a multi-tenant por marca:

1. Crea tabla `brands` (id, slug, name, created_at).
2. Inserta Promoselect como brand id=1.
3. Añade columna `brand_id INT NOT NULL DEFAULT 1` a las 28 tablas comercial_*.
   - Las filas existentes quedan asignadas a Promoselect (brand_id=1).
4. Añade índices en brand_id para las tablas más consultadas.
5. Añade UNIQUE(brand_id) en comercial_company_context y comercial_governance_charter
   (ambas son "singleton por marca").

Idempotente vía schema_migrations + ADD COLUMN IF NOT EXISTS / catch.
Compatible Postgres + SQLite.
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


VERSION = "v20"

TABLES_WITH_BRAND_ID = [
    "comercial_phases",
    "comercial_touchpoints",
    "comercial_frictions",
    "comercial_trust_pillars",
    "comercial_trust_pillar_steps",
    "comercial_governance_charter",
    "comercial_governance_gaps",
    "comercial_governance_tests",
    "comercial_company_context",
    "comercial_iniciativas",
    "comercial_initiative_dependency",
    "comercial_initiative_friction",
    "comercial_initiative_involved",
    "comercial_initiative_pillar",
    "comercial_initiative_touchpoint",
    "comercial_kpis",
    "comercial_kpi_friction",
    "comercial_kpi_history",
    "comercial_kpi_touchpoint",
    "comercial_tp_kpi_history",
    "comercial_canvas_layout",
    "comercial_canvas_notes",
    "comercial_channels",
    "comercial_comments",
    "comercial_activity_log",
    "comercial_people",
    "comercial_touchpoint_channel",
    "comercial_touchpoint_flow",
]

# Tablas con muchas filas o queries frecuentes — vale la pena indexar
TABLES_TO_INDEX = [
    "comercial_touchpoints",
    "comercial_frictions",
    "comercial_kpis",
    "comercial_iniciativas",
    "comercial_kpi_history",
    "comercial_tp_kpi_history",
    "comercial_kpi_touchpoint",
    "comercial_touchpoint_channel",
    "comercial_activity_log",
    "comercial_comments",
]

# Tablas singleton-por-marca: una sola fila por brand_id permitida
SINGLETON_TABLES = [
    "comercial_company_context",
    "comercial_governance_charter",
]


def already_applied(conn) -> bool:
    try:
        r = conn.execute(text("SELECT 1 FROM schema_migrations WHERE version = :v"), {"v": VERSION}).fetchone()
        return r is not None
    except Exception:
        return False


def add_brand_id_column(conn, table: str, pg: bool) -> str:
    """Añade brand_id a una tabla. Devuelve 'ok'|'skip'."""
    if pg:
        sql = (
            f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS brand_id INTEGER NOT NULL DEFAULT 1"
        )
        conn.execute(text(sql))
        return "ok"
    # SQLite: no soporta IF NOT EXISTS en ADD COLUMN; capturamos el error
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN brand_id INTEGER NOT NULL DEFAULT 1"))
        return "ok"
    except Exception as e:
        if "duplicate column" in str(e).lower():
            return "skip"
        raise


def add_brand_id_index(conn, table: str, pg: bool):
    idx_name = f"ix_{table}_brand_id"
    if pg:
        conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}(brand_id)"))
    else:
        try:
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}(brand_id)"))
        except Exception:
            pass


def add_unique_brand_id(conn, table: str, pg: bool):
    """Añade UNIQUE(brand_id) — para tablas singleton-por-marca."""
    constraint_name = f"uq_{table}_brand_id"
    try:
        if pg:
            conn.execute(text(
                f"ALTER TABLE {table} ADD CONSTRAINT {constraint_name} UNIQUE (brand_id)"
            ))
        else:
            # SQLite no soporta ADD CONSTRAINT vía ALTER. Usamos índice único.
            conn.execute(text(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {constraint_name} ON {table}(brand_id)"
            ))
    except Exception as e:
        msg = str(e).lower()
        if "already exists" in msg or "duplicate" in msg:
            return
        raise


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")

    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(20) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        ))

        if already_applied(conn):
            print(f"  SKIP: {VERSION} ya aplicada.")
            return

        # 1) Crear tabla brands
        if pg:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS brands (
                    id SERIAL PRIMARY KEY,
                    slug VARCHAR(80) NOT NULL UNIQUE,
                    name VARCHAR(160) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS brands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    slug VARCHAR(80) NOT NULL UNIQUE,
                    name VARCHAR(160) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
        print("  OK: CREATE TABLE brands")

        # 2) Insertar Promoselect como id=1 si no existe
        if pg:
            conn.execute(text("""
                INSERT INTO brands (id, slug, name)
                VALUES (1, 'promoselect', 'Promoselect')
                ON CONFLICT (id) DO NOTHING
            """))
            # Ajustar la sequence para que el siguiente insert no choque con id=1
            conn.execute(text("SELECT setval('brands_id_seq', GREATEST(1, (SELECT MAX(id) FROM brands)))"))
        else:
            conn.execute(text("INSERT OR IGNORE INTO brands (id, slug, name) VALUES (1, 'promoselect', 'Promoselect')"))
        print("  OK: INSERT brands -> Promoselect (id=1)")

        # 3) Añadir brand_id a las 28 tablas
        applied = 0
        skipped = 0
        for table in TABLES_WITH_BRAND_ID:
            try:
                result = add_brand_id_column(conn, table, pg)
                if result == "ok":
                    print(f"  OK: ADD COLUMN brand_id en {table}")
                    applied += 1
                else:
                    print(f"  SKIP (existe): brand_id en {table}")
                    skipped += 1
            except Exception as e:
                msg = str(e).lower()
                if "does not exist" in msg or "no such table" in msg:
                    print(f"  SKIP (tabla no existe): {table}")
                    skipped += 1
                else:
                    print(f"  ERROR en {table}: {e.__class__.__name__}: {e}")
                    raise

        # 4) Indexar tablas grandes
        for table in TABLES_TO_INDEX:
            try:
                add_brand_id_index(conn, table, pg)
                print(f"  OK: index brand_id en {table}")
            except Exception as e:
                print(f"  WARN: index {table} — {e.__class__.__name__}")

        # 5) UNIQUE(brand_id) en singletons
        for table in SINGLETON_TABLES:
            try:
                add_unique_brand_id(conn, table, pg)
                print(f"  OK: UNIQUE(brand_id) en {table}")
            except Exception as e:
                print(f"  WARN: UNIQUE en {table} — {e.__class__.__name__}: {e}")

        # 6) Tracker
        conn.execute(
            text("INSERT INTO schema_migrations (version) VALUES (:v) ON CONFLICT DO NOTHING") if pg
            else text("INSERT OR IGNORE INTO schema_migrations (version) VALUES (:v)"),
            {"v": VERSION},
        )
        print(f"  TRACKED: schema_migrations += '{VERSION}'")
        print(f"\nMigración {VERSION} aplicada. Aplicadas: {applied}, omitidas: {skipped}.")


if __name__ == "__main__":
    migrate()
