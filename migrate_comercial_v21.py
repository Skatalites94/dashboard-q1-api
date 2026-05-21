#!/usr/bin/env python3
"""Migración v21 — Dueño de marca (cuentas Supabase Auth).

Añade owner_user_id (UUID de auth.users) a brands para aislar workspaces por usuario.
Promoselect (id=1) queda con owner_user_id NULL hasta asignarlo vía ADMIN_USER_IDS en .env.

Idempotente. Compatible Postgres + SQLite.
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

VERSION = "v21"


def already_applied(conn) -> bool:
    try:
        r = conn.execute(
            text("SELECT 1 FROM schema_migrations WHERE version = :v"), {"v": VERSION}
        ).fetchone()
        return r is not None
    except Exception:
        return False


def mark_applied(conn) -> None:
    conn.execute(
        text("INSERT INTO schema_migrations (version) VALUES (:v) ON CONFLICT DO NOTHING"),
        {"v": VERSION},
    )


def main() -> None:
    pg = is_postgres()
    add_col = (
        "ALTER TABLE brands ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(36)"
        if pg
        else "ALTER TABLE brands ADD COLUMN owner_user_id VARCHAR(36)"
    )
    idx = "CREATE INDEX IF NOT EXISTS ix_brands_owner_user_id ON brands (owner_user_id)"

    with engine.begin() as conn:
        if already_applied(conn):
            print(f"migrate_comercial_{VERSION}: ya aplicada, nada que hacer.")
            return

        print(
            f"Backend: {'Postgres' if pg else 'SQLite'} — "
            f"{engine.url.render_as_string(hide_password=True)}"
        )

        if pg:
            conn.execute(text(add_col))
        else:
            try:
                conn.execute(text(add_col))
            except Exception as e:
                if "duplicate column" not in str(e).lower():
                    raise
                print("  SKIP: owner_user_id ya existe (SQLite)")

        try:
            conn.execute(text(idx))
            print("  OK: índice ix_brands_owner_user_id")
        except Exception as e:
            if pg:
                raise
            print(f"  SKIP índice: {e}")

        mark_applied(conn)
        print(f"migrate_comercial_{VERSION} completada.")
        print(
            "  Nota: asigna tu UUID de Supabase en ADMIN_USER_IDS (Railway/.env) "
            "para seguir viendo la marca Promoselect (id=1) con owner NULL."
        )


if __name__ == "__main__":
    main()
