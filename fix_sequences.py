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

# El script auto-descubre TODAS las (tabla, columna) con secuencia serial
# en el schema public de Postgres consultando information_schema. Así no
# se nos olvida ninguna cuando se añaden tablas nuevas.
DISCOVERY_SQL = """
SELECT
    n.nspname || '.' || c.relname AS table_full,
    a.attname AS col,
    pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) AS seq
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL
ORDER BY c.relname, a.attname;
"""


def main() -> int:
    dialect = engine.dialect.name
    if dialect != "postgresql":
        print(f"Dialect={dialect} — fix_sequences solo aplica a Postgres. No se hizo nada.")
        return 0

    # Auto-discover todas las tablas con secuencia serial
    with engine.connect() as conn:
        rows = conn.execute(text(DISCOVERY_SQL)).fetchall()

    print(f"Encontradas {len(rows)} columnas serial en schema public.\n")

    fixed = 0
    failed = 0

    # Una transacción por tabla — si una falla, las demás siguen.
    for full_table, col, seq in rows:
        try:
            with engine.begin() as conn:
                max_id = conn.execute(text(f"SELECT COALESCE(MAX({col}), 0) FROM {full_table}")).scalar()
                new_val = conn.execute(text(
                    "SELECT setval(:s, GREATEST(:m, 1), true)"
                ), {"s": seq, "m": max_id}).scalar()
                print(f"  - {full_table}.{col}: max={max_id} → {seq} = {new_val}")
                fixed += 1
        except Exception as exc:
            err_short = str(exc).split("\n")[0][:140]
            print(f"  - {full_table}.{col}: ERROR {err_short}")
            failed += 1

    skipped = 0  # auto-discovery descarta las que no aplican

    print(f"\nResumen: {fixed} secuencias corregidas, {skipped} omitidas, {failed} con error")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
