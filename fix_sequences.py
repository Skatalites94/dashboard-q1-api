"""Re-sincroniza las secuencias de auto-increment de Postgres con el MAX(id)
real de cada tabla.

Esto pasa cuando se insertan rows con id explícito (seeds, migraciones, etc) y
la secuencia no avanza, así que el siguiente INSERT con id auto-generado choca
con un id que ya existe.

Uso:
    railway run python3 fix_sequences.py

Idempotente: se puede correr múltiples veces sin problema.
Solo afecta Postgres (en SQLite las secuencias funcionan distinto y `select last_insert_rowid()` ya maneja esto).
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sqlalchemy import text

from app.database import engine

# Tablas con id auto-increment Integer que pueden tener este problema.
# (Modelos con id String como ComercialPhase, ComercialFriction, etc no aplican.)
TABLES = [
    ("comercial_people", "id"),
    ("comercial_kpi_friction", "id"),
    ("comercial_kpi_touchpoint", "id"),
    ("comercial_kpi_history", "id"),
    ("comercial_tp_kpi_history", "id"),
    ("comercial_activity_log", "id"),
    ("comercial_canvas_layout", "id"),
    ("comercial_canvas_notes", "id"),
    ("comercial_touchpoint_flow", "id"),
    ("comercial_iniciativas", "id"),
    ("comercial_initiative_friction", "id"),
    ("comercial_initiative_touchpoint", "id"),
    ("comercial_initiative_kpi", "id"),
    ("comercial_trust_pillars", "id"),
    ("comercial_trust_pillar_steps", "id"),
    ("comercial_governance_gaps", "id"),
    ("comercial_governance_tests", "id"),
    ("comercial_touchpoint_channels", "id"),
    ("comercial_channels", "id"),
    ("comercial_touchpoints", "id"),
    ("brands", "id"),
]


def main() -> int:
    dialect = engine.dialect.name
    if dialect != "postgresql":
        print(f"Dialect={dialect} — fix_sequences solo aplica a Postgres. No se hizo nada.")
        return 0

    fixed = 0
    skipped = 0
    failed = 0

    # Una transacción por tabla — si una falla, las demás siguen.
    for table, pk in TABLES:
        try:
            with engine.begin() as conn:
                # Verificar que la tabla existe
                exists = conn.execute(text(
                    "SELECT to_regclass(:t) IS NOT NULL"
                ), {"t": table}).scalar()
                if not exists:
                    print(f"  - {table}: no existe, skip")
                    skipped += 1
                    continue

                # Obtener el nombre real de la secuencia
                seq_name = conn.execute(text(
                    "SELECT pg_get_serial_sequence(:t, :p)"
                ), {"t": table, "p": pk}).scalar()
                if not seq_name:
                    print(f"  - {table}.{pk}: sin secuencia asociada (no es serial), skip")
                    skipped += 1
                    continue

                max_id = conn.execute(text(f"SELECT COALESCE(MAX({pk}), 0) FROM {table}")).scalar()
                new_val = conn.execute(text(
                    "SELECT setval(:s, GREATEST(:m, 1), true)"
                ), {"s": seq_name, "m": max_id}).scalar()
                print(f"  - {table}.{pk}: max={max_id} → seq={seq_name} reseteado a {new_val}")
                fixed += 1
        except Exception as exc:
            # Solo la primera línea del error (psycopg2 vuelca el SQL)
            err_short = str(exc).split("\n")[0][:120]
            print(f"  - {table}.{pk}: ERROR {err_short}")
            failed += 1

    print(f"\nResumen: {fixed} secuencias corregidas, {skipped} omitidas, {failed} con error")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
