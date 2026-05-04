#!/usr/bin/env python3
"""Migración v13 endurecida: 8 atributos formales TP + tipos fricción + métricas maestras.

Cambios vs migraciones previas (v3..v12):
- Single transaction: si una sentencia falla, rollback total (no estado parcial).
- Tracking via tabla `schema_migrations`: idempotente por versión, no por columna.
- Rollback script paralelo: `migrate_comercial_v13_rollback.py`.

Pre-requisitos:
- Backup de Postgres con `pg_dump` (Supabase dashboard → SQL → pg_dump) ANTES de prod.

Cambios al esquema:
- comercial_touchpoints: + internal_checklist (JSON), + duration_minutes (INT NULL),
  + duration_label (VARCHAR(50)), + classification (VARCHAR(20)), + leverage_point (VARCHAR(20))
- comercial_frictions: + friction_type (VARCHAR(30))
- comercial_kpis: + is_master (BOOLEAN DEFAULT FALSE), + master_metric (VARCHAR(20))
- NUEVO: tabla `schema_migrations` (version PK, applied_at)
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


VERSION = "v13"

SCHEMA_MIGRATIONS_PG = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

SCHEMA_MIGRATIONS_SQLITE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

# Postgres: IF NOT EXISTS por columna — idempotente nativo.
ALTERS_PG = [
    'ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS internal_checklist JSONB DEFAULT \'[]\'::jsonb',
    'ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS duration_minutes INTEGER',
    'ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS duration_label VARCHAR(50) DEFAULT \'\'',
    'ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS classification VARCHAR(20) DEFAULT \'normal\'',
    'ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS leverage_point VARCHAR(20) DEFAULT \'none\'',
    'ALTER TABLE comercial_frictions ADD COLUMN IF NOT EXISTS friction_type VARCHAR(30)',
    'ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE',
    'ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS master_metric VARCHAR(20)',
]

# SQLite: ALTER TABLE ADD COLUMN no soporta IF NOT EXISTS antes de 3.35.
# Estrategia: catch exception. Combinada con schema_migrations check, es idempotente.
ALTERS_SQLITE = [
    'ALTER TABLE comercial_touchpoints ADD COLUMN internal_checklist TEXT DEFAULT \'[]\'',
    'ALTER TABLE comercial_touchpoints ADD COLUMN duration_minutes INTEGER',
    'ALTER TABLE comercial_touchpoints ADD COLUMN duration_label TEXT DEFAULT \'\'',
    'ALTER TABLE comercial_touchpoints ADD COLUMN classification TEXT DEFAULT \'normal\'',
    'ALTER TABLE comercial_touchpoints ADD COLUMN leverage_point TEXT DEFAULT \'none\'',
    'ALTER TABLE comercial_frictions ADD COLUMN friction_type TEXT',
    'ALTER TABLE comercial_kpis ADD COLUMN is_master BOOLEAN DEFAULT 0',
    'ALTER TABLE comercial_kpis ADD COLUMN master_metric TEXT',
]


def already_applied(conn) -> bool:
    """Verifica si v13 ya está marcado en schema_migrations."""
    try:
        result = conn.execute(text("SELECT 1 FROM schema_migrations WHERE version = :v"), {"v": VERSION})
        return result.fetchone() is not None
    except Exception:
        # La tabla no existe todavía
        return False


def migrate():
    pg = is_postgres()
    print(f"Backend: {'Postgres' if pg else 'SQLite'} — {engine.url.render_as_string(hide_password=True)}")

    with engine.begin() as conn:
        # Asegurar tabla de tracking
        conn.execute(text(SCHEMA_MIGRATIONS_PG if pg else SCHEMA_MIGRATIONS_SQLITE))

        if already_applied(conn):
            print(f"  SKIP: {VERSION} ya está aplicada según schema_migrations.")
            return

        alters = ALTERS_PG if pg else ALTERS_SQLITE
        applied_count = 0
        skipped_count = 0

        for sql in alters:
            try:
                conn.execute(text(sql))
                print(f"  OK: {sql[:80]}{'...' if len(sql) > 80 else ''}")
                applied_count += 1
            except Exception as e:
                # SQLite: column ya existe → ok, idempotente vía exception.
                # Postgres con IF NOT EXISTS: no debería entrar aquí salvo error real.
                msg = str(e).lower()
                if "duplicate" in msg or "already exists" in msg or "duplicate column" in msg:
                    print(f"  SKIP (column ya existe): {sql[:80]}")
                    skipped_count += 1
                else:
                    print(f"  ERROR: {sql[:80]} — {e.__class__.__name__}: {e}")
                    raise  # Single-tx: rollback total.

        # Marcar versión como aplicada
        conn.execute(text("INSERT INTO schema_migrations (version) VALUES (:v)"), {"v": VERSION})
        print(f"  TRACKED: schema_migrations += '{VERSION}'")

        print(f"\nmigrate_comercial_v13 completada. Aplicadas: {applied_count}, omitidas: {skipped_count}.")


if __name__ == "__main__":
    migrate()
