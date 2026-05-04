"""Resolución de la marca activa por request (Workspaces).

Cada request HTTP del frontend lleva el header `X-Brand-Id: <int>`. Un
middleware en `app/main.py` lo extrae y lo guarda en el ContextVar
`current_brand_id_var` para que sea accesible desde cualquier parte
del request lifecycle (event listeners de SQLAlchemy, helpers, etc).

Sin header → DEFAULT_BRAND_ID = 1 (Promoselect, legacy).

Helpers expuestos:
- current_brand_id_var: ContextVar — fuente de verdad de la marca activa
- current_brand_id():   FastAPI Depends — para endpoints que necesitan el id
- use_brand(int):       context manager para sobrescribir la marca temporalmente
                         (útil al crear una marca y seedear sus fases base)
"""
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Optional

from fastapi import Header

DEFAULT_BRAND_ID = 1  # Promoselect

current_brand_id_var: ContextVar[int] = ContextVar("current_brand_id", default=DEFAULT_BRAND_ID)


def current_brand_id(x_brand_id: Optional[str] = Header(default=None)) -> int:
    """FastAPI Depends: extrae brand_id del header (con fallback al contextvar)."""
    if x_brand_id:
        try:
            bid = int(x_brand_id)
            if bid > 0:
                return bid
        except (TypeError, ValueError):
            pass
    return current_brand_id_var.get()


@contextmanager
def use_brand(brand_id: int):
    """Sobrescribe la marca activa dentro de un bloque (no thread-safe; usa contextvars)."""
    token = current_brand_id_var.set(brand_id)
    try:
        yield
    finally:
        current_brand_id_var.reset(token)
