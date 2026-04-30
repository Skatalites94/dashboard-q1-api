"""Global exception handlers para errores de SQLAlchemy.

Convierte excepciones de BD en respuestas HTTP estructuradas con logging,
para que multi-user no quede mudo cuando algo falla.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError

logger = logging.getLogger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        logger.warning(
            "IntegrityError on %s %s: %s",
            request.method, request.url.path, str(exc.orig)[:200],
        )
        return JSONResponse(
            status_code=409,
            content={"detail": "Conflicto con el estado actual de la base de datos. Recarga e intenta de nuevo."},
        )

    @app.exception_handler(OperationalError)
    async def operational_error_handler(request: Request, exc: OperationalError):
        logger.error(
            "OperationalError on %s %s: %s",
            request.method, request.url.path, str(exc.orig)[:200],
        )
        return JSONResponse(
            status_code=503,
            content={"detail": "Servicio temporalmente no disponible. Reintenta en unos segundos."},
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        logger.error(
            "SQLAlchemyError on %s %s: %s",
            request.method, request.url.path, str(exc)[:200],
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno de base de datos."},
        )
