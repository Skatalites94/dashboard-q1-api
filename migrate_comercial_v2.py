#!/usr/bin/env python3
"""Migration: agrega People, KPI History, KPI-Friction links y columnas nuevas."""

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

from sqlalchemy import text  # noqa: E402
from app.database import engine  # noqa: E402

MIGRATIONS = [
    # New tables
    """CREATE TABLE IF NOT EXISTS comercial_people (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        role VARCHAR(200) DEFAULT '',
        area VARCHAR(200) DEFAULT '',
        email VARCHAR(300),
        avatar_color VARCHAR(20) DEFAULT '#4C6EF5',
        is_active BOOLEAN DEFAULT TRUE,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_kpi_history (
        id SERIAL PRIMARY KEY,
        kpi_id VARCHAR(50) NOT NULL,
        value FLOAT NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW(),
        notes VARCHAR(400) DEFAULT ''
    )""",
    """CREATE TABLE IF NOT EXISTS comercial_kpi_friction (
        id SERIAL PRIMARY KEY,
        kpi_id VARCHAR(50) NOT NULL,
        friction_id VARCHAR(10) NOT NULL
    )""",
    # New columns on existing tables
    "ALTER TABLE comercial_touchpoints ADD COLUMN IF NOT EXISTS responsable_id INTEGER",
    "ALTER TABLE comercial_frictions ADD COLUMN IF NOT EXISTS responsable_id INTEGER",
    "ALTER TABLE comercial_frictions ADD COLUMN IF NOT EXISTS touchpoint_id INTEGER",
    "ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS phase_id VARCHAR(50)",
    "ALTER TABLE comercial_kpis ADD COLUMN IF NOT EXISTS owner_id INTEGER",
]


def migrate():
    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                label = sql.strip().split("\n")[0][:60]
                print(f"  OK: {label}")
            except Exception as e:
                print(f"  SKIP: {e}")
        conn.commit()
    print("Migration completada.")


if __name__ == "__main__":
    migrate()
