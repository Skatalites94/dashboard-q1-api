from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import KpiMeta
from app.schemas import KpiMetaCreate, KpiMetaUpdate
from app.serialize import kpi_meta_out

router = APIRouter()


@router.get("/")
def list_kpis_meta(db: Session = Depends(get_db)):
    return [kpi_meta_out(r) for r in db.query(KpiMeta).order_by(KpiMeta.id).all()]


@router.get("/{item_id}")
def get_kpi_meta(item_id: int, db: Session = Depends(get_db)):
    row = db.get(KpiMeta, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="KPI meta no encontrado")
    return kpi_meta_out(row)


@router.post("/", status_code=201)
def create_kpi_meta(body: KpiMetaCreate, db: Session = Depends(get_db)):
    row = KpiMeta(kpi=body.kpi, r25=body.r25, m26=body.m26)
    db.add(row)
    db.commit()
    db.refresh(row)
    return kpi_meta_out(row)


@router.patch("/{item_id}")
def update_kpi_meta(item_id: int, body: KpiMetaUpdate, db: Session = Depends(get_db)):
    row = db.get(KpiMeta, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="KPI meta no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return kpi_meta_out(row)


@router.delete("/{item_id}")
def delete_kpi_meta(item_id: int, db: Session = Depends(get_db)):
    row = db.get(KpiMeta, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="KPI meta no encontrado")
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}
