#!/usr/bin/env python3
"""Puebla la base desde data/initial.json (SQLite local o Postgres si DATABASE_URL está definida)."""

import argparse
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

from sqlalchemy import delete  # noqa: E402

from app.database import SessionLocal, engine  # noqa: E402
from app.models import AreaResumen, Base, Deal, Iniciativa, KpiMeta, Semaforo  # noqa: E402


def load_json() -> dict:
    path = BASE / "data" / "initial.json"
    if not path.exists():
        raise SystemExit(f"No se encuentra {path}.")
    return json.loads(path.read_text(encoding="utf-8"))


def seed(clear: bool = True) -> None:
    Base.metadata.create_all(bind=engine)
    data = load_json()
    db = SessionLocal()
    try:
        if clear:
            db.execute(delete(Deal))
            db.execute(delete(Iniciativa))
            db.execute(delete(KpiMeta))
            db.execute(delete(Semaforo))
            db.execute(delete(AreaResumen))
            db.commit()

        for d in data["deals"]:
            db.add(
                Deal(
                    asesor=d["a"],
                    cuenta=d["c"],
                    trato=d["t"],
                    importe=float(d["i"]),
                    pct_util=float(d.get("p") or 0),
                    utilidad=float(d.get("u") or 0),
                    fecha=d["f"],
                    mes=d["m"],
                    trimestre=d.get("tri") or "Q1",
                )
            )

        for row in data["iniciativas"]:
            db.add(
                Iniciativa(
                    area=row.get("area") or "",
                    resp=row.get("resp") or "",
                    ini=row["ini"],
                    pri=str(row.get("pri") or ""),
                    est=row.get("est") or "",
                    av=float(row.get("av") or 0),
                    notas=row.get("notas") or "",
                    trimestre=row.get("trimestre") or "Q1",
                )
            )

        for row in data["kpis_meta"]:
            db.add(KpiMeta(kpi=row["kpi"], r25=row.get("r25") or "", m26=row.get("m26") or ""))

        for row in data["semaforo"]:
            db.add(
                Semaforo(
                    kpi=row.get("kpi") or "",
                    area=row.get("area") or "",
                    resp=row.get("resp") or "",
                    descripcion=row.get("descripcion") or "",
                    meta=row.get("meta") or "",
                    ene=row.get("ene") or "",
                    feb=row.get("feb") or "",
                    mar=row.get("mar") or "",
                    est=row.get("est") or "",
                    tendencia=row.get("tendencia") or "",
                    trimestre=row.get("trimestre") or "Q1",
                    diagnostico=row.get("diagnostico") or "",
                    recomendacion=row.get("recomendacion") or "",
                )
            )

        for row in data.get("area_resumen", []):
            db.add(
                AreaResumen(
                    area=row["area"],
                    resp=row.get("resp") or "",
                    rol=row.get("rol") or "",
                    verdes=int(row.get("verdes") or 0),
                    amarillos=int(row.get("amarillos") or 0),
                    rojos=int(row.get("rojos") or 0),
                    tendencia=row.get("tendencia") or "",
                    trimestre=row.get("trimestre") or "Q1",
                    diagnostico=row.get("diagnostico") or "",
                    recomendacion=row.get("recomendacion") or "",
                )
            )

        db.commit()
        print(
            "OK:",
            len(data["deals"]), "deals,",
            len(data["iniciativas"]), "iniciativas,",
            len(data["kpis_meta"]), "kpis_meta,",
            len(data["semaforo"]), "semaforo,",
            len(data.get("area_resumen", [])), "areas",
        )
    finally:
        db.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Seed dashboard desde data/initial.json (SQLite o Supabase/Postgres)")
    p.add_argument("--no-clear", action="store_true", help="No vaciar tablas antes de insertar")
    args = p.parse_args()
    seed(clear=not args.no_clear)
