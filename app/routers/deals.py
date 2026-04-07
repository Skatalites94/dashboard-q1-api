from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Deal
from app.schemas import DealCreate, DealUpdate
from app.serialize import deal_out

router = APIRouter()


@router.get("/")
def list_deals(db: Session = Depends(get_db)):
    return [deal_out(r) for r in db.query(Deal).order_by(Deal.id).all()]


@router.get("/{deal_id}")
def get_deal(deal_id: int, db: Session = Depends(get_db)):
    row = db.get(Deal, deal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    return deal_out(row)


@router.post("/", status_code=201)
def create_deal(body: DealCreate, db: Session = Depends(get_db)):
    row = Deal(
        asesor=body.a,
        cuenta=body.c,
        trato=body.t,
        importe=body.i,
        pct_util=body.p,
        utilidad=body.u,
        fecha=body.f,
        mes=body.m,
        trimestre=body.tri,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return deal_out(row)


@router.patch("/{deal_id}")
def update_deal(deal_id: int, body: DealUpdate, db: Session = Depends(get_db)):
    row = db.get(Deal, deal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    data = body.model_dump(exclude_unset=True)
    mapping = {"a": "asesor", "c": "cuenta", "t": "trato", "i": "importe", "p": "pct_util", "u": "utilidad", "f": "fecha", "m": "mes", "tri": "trimestre"}
    for short_key, val in data.items():
        setattr(row, mapping[short_key], val)
    db.commit()
    db.refresh(row)
    return deal_out(row)


@router.delete("/{deal_id}")
def delete_deal(deal_id: int, db: Session = Depends(get_db)):
    row = db.get(Deal, deal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Deal no encontrado")
    db.delete(row)
    db.commit()
    return {"ok": True, "id": deal_id}
