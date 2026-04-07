from fastapi import APIRouter

from app.routers import areas, bootstrap, deals, iniciativas, kpis_meta, semaforo

api_router = APIRouter()
api_router.include_router(bootstrap.router, tags=["bootstrap"])
api_router.include_router(deals.router, prefix="/deals", tags=["deals"])
api_router.include_router(iniciativas.router, prefix="/iniciativas", tags=["iniciativas"])
api_router.include_router(kpis_meta.router, prefix="/kpis-meta", tags=["kpis-meta"])
api_router.include_router(semaforo.router, prefix="/semaforo", tags=["semaforo"])
api_router.include_router(areas.router, prefix="/areas", tags=["areas"])
