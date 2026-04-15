from fastapi import APIRouter

from app.routers import areas, bootstrap, comercial, deals, escenarios, gastos, iniciativas, kpis_meta, semaforo, simulador

api_router = APIRouter()
api_router.include_router(bootstrap.router, tags=["bootstrap"])
api_router.include_router(deals.router, prefix="/deals", tags=["deals"])
api_router.include_router(iniciativas.router, prefix="/iniciativas", tags=["iniciativas"])
api_router.include_router(kpis_meta.router, prefix="/kpis-meta", tags=["kpis-meta"])
api_router.include_router(semaforo.router, prefix="/semaforo", tags=["semaforo"])
api_router.include_router(areas.router, prefix="/areas", tags=["areas"])
api_router.include_router(gastos.router, prefix="/gastos", tags=["gastos"])
api_router.include_router(escenarios.router, prefix="/escenarios", tags=["escenarios"])
api_router.include_router(simulador.router, prefix="/simulador", tags=["simulador"])
api_router.include_router(comercial.router, prefix="/comercial", tags=["comercial"])
