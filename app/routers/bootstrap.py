from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AreaResumen, Deal, Iniciativa, KpiMeta, Semaforo
from app.serialize import area_resumen_out, deal_out, iniciativa_out, kpi_meta_out, semaforo_out

router = APIRouter()


@router.get("/bootstrap")
def get_bootstrap(db: Session = Depends(get_db)):
    deals = [deal_out(r) for r in db.query(Deal).order_by(Deal.id).all()]
    iniciativas = [iniciativa_out(r) for r in db.query(Iniciativa).order_by(Iniciativa.id).all()]
    kpis_meta = [kpi_meta_out(r) for r in db.query(KpiMeta).order_by(KpiMeta.id).all()]
    semaforo = [semaforo_out(r) for r in db.query(Semaforo).order_by(Semaforo.id).all()]
    areas = [area_resumen_out(r) for r in db.query(AreaResumen).order_by(AreaResumen.id).all()]
    return {
        "deals": deals,
        "iniciativas": iniciativas,
        "kpis_meta": kpis_meta,
        "semaforo": semaforo,
        "areas": areas,
    }
