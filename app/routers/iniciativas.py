from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Iniciativa
from app.schemas import IniciativaCreate, IniciativaUpdate
from app.serialize import iniciativa_out

router = APIRouter()


@router.get("/")
def list_iniciativas(db: Session = Depends(get_db)):
    return [iniciativa_out(r) for r in db.query(Iniciativa).order_by(Iniciativa.id).all()]


@router.get("/{item_id}")
def get_iniciativa(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Iniciativa, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Iniciativa no encontrada")
    return iniciativa_out(row)


@router.post("/", status_code=201)
def create_iniciativa(body: IniciativaCreate, db: Session = Depends(get_db)):
    row = Iniciativa(
        area=body.area,
        resp=body.resp,
        ini=body.ini,
        pri=body.pri,
        est=body.est,
        av=body.av,
        notas=body.notas,
        trimestre=body.trimestre,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return iniciativa_out(row)


@router.patch("/{item_id}")
def update_iniciativa(item_id: int, body: IniciativaUpdate, db: Session = Depends(get_db)):
    row = db.get(Iniciativa, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Iniciativa no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return iniciativa_out(row)


@router.delete("/{item_id}")
def delete_iniciativa(item_id: int, db: Session = Depends(get_db)):
    row = db.get(Iniciativa, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Iniciativa no encontrada")
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}
