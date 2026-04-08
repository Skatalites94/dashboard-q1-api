"""Migration script for Simulador v2 — adds new columns to Supabase.

Run once after deploying the new code:
  python3 migrate_simulador_v2.py

For SQLite (local dev), just delete data/dashboard.db and re-seed.
This script is for PostgreSQL (Supabase) only.
"""

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL set — skipping (SQLite uses create_all)")
    exit(0)

engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    # SimTipoCliente new columns
    "ALTER TABLE sim_tipo_cliente ADD COLUMN IF NOT EXISTS frecuencia_compra_meses INTEGER DEFAULT 6",
    "ALTER TABLE sim_tipo_cliente ADD COLUMN IF NOT EXISTS deals_por_anio INTEGER DEFAULT 2",
    "ALTER TABLE sim_tipo_cliente ADD COLUMN IF NOT EXISTS horas_cotizacion FLOAT DEFAULT 2.0",
    "ALTER TABLE sim_tipo_cliente ADD COLUMN IF NOT EXISTS horas_seguimiento FLOAT DEFAULT 1.0",
    "ALTER TABLE sim_tipo_cliente ADD COLUMN IF NOT EXISTS leads_objetivo INTEGER DEFAULT 0",
    # SimAsesor new columns
    "ALTER TABLE sim_asesores ADD COLUMN IF NOT EXISTS horas_habiles_dia FLOAT DEFAULT 6.0",
    "ALTER TABLE sim_asesores ADD COLUMN IF NOT EXISTS cartera_actual JSON DEFAULT '{}'",
]

with engine.begin() as conn:
    for sql in MIGRATIONS:
        try:
            conn.execute(text(sql))
            print(f"OK: {sql[:60]}...")
        except Exception as e:
            print(f"SKIP: {sql[:60]}... ({e})")

print("\nMigration complete. Now run: python3 seed_simulador.py")
