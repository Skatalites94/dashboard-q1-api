from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AreaResumen
from app.schemas import AreaResumenCreate, AreaResumenUpdate
from app.serialize import area_resumen_out

router = APIRouter()


@router.get("/")
def list_areas(db: Session = Depends(get_db)):
    return [area_resumen_out(r) for r in db.query(AreaResumen).order_by(AreaResumen.id).all()]


@router.get("/{item_id}")
def get_area(item_id: int, db: Session = Depends(get_db)):
    row = db.get(AreaResumen, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    return area_resumen_out(row)


@router.post("/", status_code=201)
def create_area(body: AreaResumenCreate, db: Session = Depends(get_db)):
    row = AreaResumen(
        area=body.area,
        resp=body.resp,
        rol=body.rol,
        verdes=body.verdes,
        amarillos=body.amarillos,
        rojos=body.rojos,
        tendencia=body.tendencia,
        trimestre=body.trimestre,
        diagnostico=body.diagnostico,
        recomendacion=body.recomendacion,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return area_resumen_out(row)


@router.patch("/{item_id}")
def update_area(item_id: int, body: AreaResumenUpdate, db: Session = Depends(get_db)):
    row = db.get(AreaResumen, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return area_resumen_out(row)


@router.delete("/{item_id}")
def delete_area(item_id: int, db: Session = Depends(get_db)):
    row = db.get(AreaResumen, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}
