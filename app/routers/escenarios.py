"""Router de Escenarios — guardar, cargar, comparar y exportar configuraciones de gastos."""

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Consultoria, Empleado, Escenario, GastoFinanciero, GastoOperativo, Suscripcion
from app.schemas import EscenarioCreate, EscenarioFromSnapshot, EscenarioUpdate
from app.serialize import (
    consultoria_out, empleado_out, escenario_full_out, escenario_out,
    gasto_financiero_out, gasto_operativo_out, suscripcion_out,
)

router = APIRouter()


def _build_snapshot(db: Session) -> dict:
    """Build snapshot from current live gastos tables."""
    return {
        "empleados": [empleado_out(r) for r in db.query(Empleado).order_by(Empleado.id).all()],
        "gastos_operativos": [gasto_operativo_out(r) for r in db.query(GastoOperativo).order_by(GastoOperativo.id).all()],
        "suscripciones": [suscripcion_out(r) for r in db.query(Suscripcion).order_by(Suscripcion.id).all()],
        "consultorias": [consultoria_out(r) for r in db.query(Consultoria).order_by(Consultoria.id).all()],
        "financieros": [gasto_financiero_out(r) for r in db.query(GastoFinanciero).order_by(GastoFinanciero.id).all()],
    }


def _calc_totals(snapshot: dict) -> tuple[float, float]:
    """Returns (total_original, total_nuevo) from a snapshot."""
    total_orig = 0.0
    total_new = 0.0
    for cat in ["empleados", "gastos_operativos", "suscripciones", "consultorias", "financieros"]:
        for item in snapshot.get(cat, []):
            cost = item.get("costo", 0)
            total_orig += cost
            if not item.get("cortado", False):
                total_new += cost
    return total_orig, total_new


@router.get("/")
def list_escenarios(db: Session = Depends(get_db)):
    rows = db.query(Escenario).order_by(Escenario.es_base.desc(), Escenario.updated_at.desc()).all()
    return [escenario_out(r) for r in rows]


@router.get("/base")
def get_base(db: Session = Depends(get_db)):
    """Get the current base scenario."""
    row = db.query(Escenario).filter(Escenario.es_base == True).first()
    if not row:
        return None
    return escenario_full_out(row)


@router.post("/set-base", status_code=201)
def set_base(body: EscenarioCreate, db: Session = Depends(get_db)):
    """Save current live state as the base scenario. Replaces any existing base."""
    db.query(Escenario).filter(Escenario.es_base == True).update({"es_base": False})
    snapshot = _build_snapshot(db)
    total_orig, total_new = _calc_totals(snapshot)
    row = Escenario(
        nombre=body.nombre or "Estado Base",
        descripcion=body.descripcion or "Presupuesto base actual",
        snapshot=snapshot, total_original=total_orig,
        total_nuevo=total_new, ahorro=total_orig - total_new,
        es_base=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return escenario_out(row)


@router.get("/{item_id}")
def get_escenario(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Escenario, item_id)
    if not row:
        raise HTTPException(404)
    return escenario_full_out(row)


@router.post("/", status_code=201)
def create_escenario_from_live(body: EscenarioCreate, db: Session = Depends(get_db)):
    """Save current live gastos state as a new scenario."""
    snapshot = _build_snapshot(db)
    total_orig, total_new = _calc_totals(snapshot)
    row = Escenario(
        nombre=body.nombre, descripcion=body.descripcion,
        snapshot=snapshot, total_original=total_orig,
        total_nuevo=total_new, ahorro=total_orig - total_new,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return escenario_out(row)


@router.post("/from-snapshot", status_code=201)
def create_escenario_from_snapshot(body: EscenarioFromSnapshot, db: Session = Depends(get_db)):
    """Save a client-provided snapshot as a scenario."""
    row = Escenario(
        nombre=body.nombre, descripcion=body.descripcion,
        snapshot=body.snapshot, total_original=body.total_original,
        total_nuevo=body.total_nuevo, ahorro=body.ahorro,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return escenario_out(row)


@router.patch("/{item_id}")
def update_escenario(item_id: int, body: EscenarioUpdate, db: Session = Depends(get_db)):
    row = db.get(Escenario, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return escenario_out(row)


@router.delete("/{item_id}")
def delete_escenario(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Escenario, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


@router.post("/{item_id}/apply")
def apply_escenario(item_id: int, db: Session = Depends(get_db)):
    """Apply a saved scenario to the live gastos tables."""
    row = db.get(Escenario, item_id)
    if not row:
        raise HTTPException(404)
    snap = row.snapshot

    # Apply empleados
    for item in snap.get("empleados", []):
        emp = db.get(Empleado, item["id"])
        if emp:
            emp.costo = item["costo"]
            emp.cortado = item.get("cortado", False)

    # Apply gastos operativos
    for item in snap.get("gastos_operativos", []):
        g = db.get(GastoOperativo, item["id"])
        if g:
            g.costo = item["costo"]
            g.cortado = item.get("cortado", False)

    # Apply suscripciones
    for item in snap.get("suscripciones", []):
        s = db.get(Suscripcion, item["id"])
        if s:
            s.costo = item["costo"]
            s.cortado = item.get("cortado", False)

    # Apply consultorias
    for item in snap.get("consultorias", []):
        c = db.get(Consultoria, item["id"])
        if c:
            c.costo = item["costo"]
            c.cortado = item.get("cortado", False)

    # Apply financieros
    for item in snap.get("financieros", []):
        f = db.get(GastoFinanciero, item["id"])
        if f:
            f.costo = item["costo"]
            f.cortado = item.get("cortado", False)

    db.commit()
    return {"ok": True, "applied": row.nombre}


@router.get("/{item_id}/export")
def export_escenario_csv(item_id: int, db: Session = Depends(get_db)):
    """Export scenario as CSV for the finance team."""
    row = db.get(Escenario, item_id)
    if not row:
        raise HTTPException(404)

    snap = row.snapshot
    buf = io.StringIO()
    writer = csv.writer(buf)

    writer.writerow([f"Escenario: {row.nombre}"])
    writer.writerow([f"Descripción: {row.descripcion}"])
    writer.writerow([])

    # Category mapping
    categories = [
        ("Nómina", "empleados", ["nombre", "depto", "costo", "cortado", "nota"]),
        ("Gastos Operativos", "gastos_operativos", ["nombre", "categoria", "costo", "fijo", "cortado"]),
        ("Suscripciones", "suscripciones", ["nombre", "frecuencia", "costo", "cortado", "nota"]),
        ("Consultorías", "consultorias", ["nombre", "costo", "cortado", "nota"]),
        ("Gastos Financieros", "financieros", ["nombre", "costo", "cortado", "nota"]),
    ]

    grand_orig = 0
    grand_new = 0

    for cat_name, key, fields in categories:
        items = snap.get(key, [])
        writer.writerow([cat_name.upper()])
        writer.writerow(fields)
        cat_orig = 0
        cat_new = 0
        for item in items:
            writer.writerow([item.get(f, "") for f in fields])
            cost = item.get("costo", 0)
            cat_orig += cost
            if not item.get("cortado", False):
                cat_new += cost
        writer.writerow(["TOTAL", "", f"${cat_orig:,.0f}", "", f"${cat_new:,.0f}"])
        writer.writerow([])
        grand_orig += cat_orig
        grand_new += cat_new

    writer.writerow(["RESUMEN"])
    writer.writerow(["Gasto Original", f"${grand_orig:,.0f}"])
    writer.writerow(["Gasto Nuevo", f"${grand_new:,.0f}"])
    writer.writerow(["Ahorro", f"${grand_orig - grand_new:,.0f}"])

    buf.seek(0)
    filename = f"escenario_{row.nombre.replace(' ', '_')}.csv"
    return StreamingResponse(
        buf, media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
