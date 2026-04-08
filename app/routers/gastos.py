"""Routers para el módulo Configurador de Gastos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CategoriaGasto, Consultoria, Empleado, GastoFinanciero, GastoOperativo, Suscripcion
from app.schemas import (
    CategoriaGastoCreate, CategoriaGastoUpdate,
    ConsultoriaCreate, ConsultoriaUpdate,
    EmpleadoCreate, EmpleadoUpdate,
    GastoFinancieroCreate, GastoFinancieroUpdate,
    GastoOperativoCreate, GastoOperativoUpdate,
    SuscripcionCreate, SuscripcionUpdate,
)
from app.serialize import (
    categoria_gasto_out, consultoria_out, empleado_out, gasto_financiero_out,
    gasto_operativo_out, suscripcion_out,
)

router = APIRouter()


# ── Bootstrap: carga todo el módulo en una llamada ─────────────

@router.get("/bootstrap")
def gastos_bootstrap(db: Session = Depends(get_db)):
    return {
        "categorias": [categoria_gasto_out(r) for r in db.query(CategoriaGasto).order_by(CategoriaGasto.modulo, CategoriaGasto.orden).all()],
        "empleados": [empleado_out(r) for r in db.query(Empleado).order_by(Empleado.id).all()],
        "gastos_operativos": [gasto_operativo_out(r) for r in db.query(GastoOperativo).order_by(GastoOperativo.id).all()],
        "suscripciones": [suscripcion_out(r) for r in db.query(Suscripcion).order_by(Suscripcion.id).all()],
        "consultorias": [consultoria_out(r) for r in db.query(Consultoria).order_by(Consultoria.id).all()],
        "financieros": [gasto_financiero_out(r) for r in db.query(GastoFinanciero).order_by(GastoFinanciero.id).all()],
    }


# ── Categorías ─────────────────────────────────────────────────

@router.get("/categorias/")
def list_categorias(modulo: str = None, db: Session = Depends(get_db)):
    q = db.query(CategoriaGasto).order_by(CategoriaGasto.modulo, CategoriaGasto.orden)
    if modulo:
        q = q.filter(CategoriaGasto.modulo == modulo)
    return [categoria_gasto_out(r) for r in q.all()]


@router.post("/categorias/", status_code=201)
def create_categoria(body: CategoriaGastoCreate, db: Session = Depends(get_db)):
    row = CategoriaGasto(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return categoria_gasto_out(row)


@router.patch("/categorias/{item_id}")
def update_categoria(item_id: int, body: CategoriaGastoUpdate, db: Session = Depends(get_db)):
    row = db.get(CategoriaGasto, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return categoria_gasto_out(row)


@router.delete("/categorias/{item_id}")
def delete_categoria(item_id: int, db: Session = Depends(get_db)):
    row = db.get(CategoriaGasto, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── Empleados (Nómina) ────────────────────────────────────────

@router.get("/empleados/")
def list_empleados(db: Session = Depends(get_db)):
    return [empleado_out(r) for r in db.query(Empleado).order_by(Empleado.costo.desc()).all()]


@router.get("/empleados/{item_id}")
def get_empleado(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Empleado, item_id)
    if not row:
        raise HTTPException(404)
    return empleado_out(row)


@router.post("/empleados/", status_code=201)
def create_empleado(body: EmpleadoCreate, db: Session = Depends(get_db)):
    row = Empleado(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return empleado_out(row)


@router.patch("/empleados/{item_id}")
def update_empleado(item_id: int, body: EmpleadoUpdate, db: Session = Depends(get_db)):
    row = db.get(Empleado, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return empleado_out(row)


@router.delete("/empleados/{item_id}")
def delete_empleado(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Empleado, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── Gastos Operativos ─────────────────────────────────────────

@router.get("/operativos/")
def list_gastos_op(db: Session = Depends(get_db)):
    return [gasto_operativo_out(r) for r in db.query(GastoOperativo).order_by(GastoOperativo.costo.desc()).all()]


@router.post("/operativos/", status_code=201)
def create_gasto_op(body: GastoOperativoCreate, db: Session = Depends(get_db)):
    row = GastoOperativo(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return gasto_operativo_out(row)


@router.patch("/operativos/{item_id}")
def update_gasto_op(item_id: int, body: GastoOperativoUpdate, db: Session = Depends(get_db)):
    row = db.get(GastoOperativo, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return gasto_operativo_out(row)


@router.delete("/operativos/{item_id}")
def delete_gasto_op(item_id: int, db: Session = Depends(get_db)):
    row = db.get(GastoOperativo, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── Suscripciones ─────────────────────────────────────────────

@router.get("/suscripciones/")
def list_suscripciones(db: Session = Depends(get_db)):
    return [suscripcion_out(r) for r in db.query(Suscripcion).order_by(Suscripcion.costo.desc()).all()]


@router.post("/suscripciones/", status_code=201)
def create_suscripcion(body: SuscripcionCreate, db: Session = Depends(get_db)):
    row = Suscripcion(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return suscripcion_out(row)


@router.patch("/suscripciones/{item_id}")
def update_suscripcion(item_id: int, body: SuscripcionUpdate, db: Session = Depends(get_db)):
    row = db.get(Suscripcion, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return suscripcion_out(row)


@router.delete("/suscripciones/{item_id}")
def delete_suscripcion(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Suscripcion, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── Consultorías ───────────────────────────────────────────────

@router.get("/consultorias/")
def list_consultorias(db: Session = Depends(get_db)):
    return [consultoria_out(r) for r in db.query(Consultoria).order_by(Consultoria.costo.desc()).all()]


@router.post("/consultorias/", status_code=201)
def create_consultoria(body: ConsultoriaCreate, db: Session = Depends(get_db)):
    row = Consultoria(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return consultoria_out(row)


@router.patch("/consultorias/{item_id}")
def update_consultoria(item_id: int, body: ConsultoriaUpdate, db: Session = Depends(get_db)):
    row = db.get(Consultoria, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return consultoria_out(row)


@router.delete("/consultorias/{item_id}")
def delete_consultoria(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Consultoria, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── Gastos Financieros ────────────────────────────────────────

@router.get("/financieros/")
def list_financieros(db: Session = Depends(get_db)):
    return [gasto_financiero_out(r) for r in db.query(GastoFinanciero).order_by(GastoFinanciero.costo.desc()).all()]


@router.post("/financieros/", status_code=201)
def create_financiero(body: GastoFinancieroCreate, db: Session = Depends(get_db)):
    row = GastoFinanciero(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return gasto_financiero_out(row)


@router.patch("/financieros/{item_id}")
def update_financiero(item_id: int, body: GastoFinancieroUpdate, db: Session = Depends(get_db)):
    row = db.get(GastoFinanciero, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return gasto_financiero_out(row)


@router.delete("/financieros/{item_id}")
def delete_financiero(item_id: int, db: Session = Depends(get_db)):
    row = db.get(GastoFinanciero, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}
