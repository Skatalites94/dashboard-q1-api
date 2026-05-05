"""Migra tablas singleton (company_context, governance_charter) de
`id INTEGER NOT NULL DEFAULT 1` a un schema con secuencia auto-increment
para que la misma tabla pueda alojar el singleton de cada marca.

Síntoma sin este fix: 409 al PATCH /company-context cuando el brand_id
no es 1, porque la INSERT default=1 choca con el row existente de Promoselect.

Idempotente.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sqlalchemy import text

from app.database import engine

SINGLETON_TABLES = [
    "comercial_company_context",
    "comercial_governance_charter",
]


def main() -> int:
    if engine.dialect.name != "postgresql":
        print("Solo aplica a Postgres. No se hizo nada.")
        return 0

    fixed = 0
    skipped = 0
    failed = 0

    for tbl in SINGLETON_TABLES:
        seq_name = f"{tbl}_id_seq"
        try:
            with engine.begin() as conn:
                # ¿Existe la tabla?
                exists = conn.execute(text("SELECT to_regclass(:t) IS NOT NULL"), {"t": tbl}).scalar()
                if not exists:
                    print(f"  - {tbl}: tabla no existe, skip")
                    skipped += 1
                    continue

                # ¿Ya tiene una secuencia (es decir, ya está migrada)?
                existing_seq = conn.execute(text(
                    "SELECT pg_get_serial_sequence(:t, 'id')"
                ), {"t": tbl}).scalar()

                if existing_seq:
                    # Solo re-sincronizar
                    max_id = conn.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {tbl}")).scalar()
                    new_val = conn.execute(text(
                        "SELECT setval(:s, GREATEST(:m, 1), true)"
                    ), {"s": existing_seq, "m": max_id}).scalar()
                    print(f"  - {tbl}: ya migrada, secuencia {existing_seq} = {new_val}")
                    fixed += 1
                    continue

                # Migración: crear secuencia, asignar default, sincronizar
                conn.execute(text(f"CREATE SEQUENCE IF NOT EXISTS {seq_name}"))
                conn.execute(text(f"ALTER SEQUENCE {seq_name} OWNED BY {tbl}.id"))
                conn.execute(text(
                    f"ALTER TABLE {tbl} ALTER COLUMN id SET DEFAULT nextval('{seq_name}')"
                ))
                max_id = conn.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {tbl}")).scalar()
                new_val = conn.execute(text(
                    f"SELECT setval('{seq_name}', GREATEST(:m, 1), true)"
                ), {"m": max_id}).scalar()
                print(f"  - {tbl}: migrada → secuencia {seq_name} sincronizada en {new_val} (max actual: {max_id})")
                fixed += 1
        except Exception as exc:
            err_short = str(exc).split("\n")[0][:140]
            print(f"  - {tbl}: ERROR {err_short}")
            failed += 1

    print(f"\nResumen: {fixed} migradas/re-sincronizadas, {skipped} skipped, {failed} con error")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
