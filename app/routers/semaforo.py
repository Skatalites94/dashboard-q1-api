from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Semaforo
from app.schemas import SemaforoCreate, SemaforoUpdate
from app.serialize import semaforo_out

router = APIRouter()


@router.get("/")
def list_semaforo(db: Session = Depends(get_db)):
    return [semaforo_out(r) for r in db.query(Semaforo).order_by(Semaforo.id).all()]


@router.get("/{item_id}")
def get_semaforo(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Semaforo, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Semáforo no encontrado")
    return semaforo_out(row)


@router.post("/", status_code=201)
def create_semaforo(body: SemaforoCreate, db: Session = Depends(get_db)):
    row = Semaforo(
        kpi=body.kpi,
        area=body.area,
        resp=body.resp,
        descripcion=body.descripcion,
        meta=body.meta,
        ene=body.ene,
        feb=body.feb,
        mar=body.mar,
        est=body.est,
        tendencia=body.tendencia,
        trimestre=body.trimestre,
        diagnostico=body.diagnostico,
        recomendacion=body.recomendacion,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return semaforo_out(row)


@router.patch("/{item_id}")
def update_semaforo(item_id: int, body: SemaforoUpdate, db: Session = Depends(get_db)):
    row = db.get(Semaforo, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Semáforo no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return semaforo_out(row)


@router.delete("/{item_id}")
def delete_semaforo(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Semaforo, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Semáforo no encontrado")
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}
