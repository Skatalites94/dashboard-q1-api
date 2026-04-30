"""HTTP Basic Auth middleware.

Protege /api/* y los assets estáticos con un password compartido.
Si DASHBOARD_PASSWORD no está seteada, el server queda abierto (modo dev).
El navegador cachea la credencial tras el primer prompt y la incluye
automáticamente en navegaciones y fetch() del mismo origen, así que no
hay que tocar el frontend.
"""
import base64
import hmac
import os

from fastapi import Request
from fastapi.responses import Response

DASHBOARD_PASSWORD = os.getenv("DASHBOARD_PASSWORD", "")
PUBLIC_PATHS = {"/health"}


async def basic_auth_middleware(request: Request, call_next):
    if not DASHBOARD_PASSWORD:
        return await call_next(request)

    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    auth = request.headers.get("Authorization", "")
    if auth.startswith("Basic "):
        try:
            decoded = base64.b64decode(auth[6:]).decode("utf-8")
            _, _, password = decoded.partition(":")
            if hmac.compare_digest(password, DASHBOARD_PASSWORD):
                return await call_next(request)
        except (ValueError, UnicodeDecodeError):
            pass

    return Response(
        status_code=401,
        headers={"WWW-Authenticate": 'Basic realm="Vision 2026 Dashboard"'},
    )
