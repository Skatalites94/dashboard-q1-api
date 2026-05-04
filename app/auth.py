"""HTTP Basic Auth — ASGI middleware puro.

Protege /api/* y los assets estáticos con un password compartido.
Si DASHBOARD_PASSWORD no está seteada, el server queda abierto (modo dev).

Implementado como ASGI puro (no BaseHTTPMiddleware) para no romper la
propagación de ContextVars al route handler — necesario para Workspaces.
"""
import base64
import hmac
import os


PUBLIC_PATHS = {"/health"}


def _expected_password() -> str:
    # Lee la env var en cada request — facilita tests que la modifican en runtime.
    return os.getenv("DASHBOARD_PASSWORD", "")


class BasicAuthASGIMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        password = _expected_password()
        if not password:
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if path in PUBLIC_PATHS:
            await self.app(scope, receive, send)
            return

        # Buscar header Authorization: Basic ...
        auth_header = b""
        for name, value in scope.get("headers", []):
            if name.lower() == b"authorization":
                auth_header = value
                break

        if auth_header.startswith(b"Basic "):
            try:
                decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
                _, _, supplied = decoded.partition(":")
                if hmac.compare_digest(supplied, password):
                    await self.app(scope, receive, send)
                    return
            except (ValueError, UnicodeDecodeError):
                pass

        # 401 con WWW-Authenticate
        await send({
            "type": "http.response.start",
            "status": 401,
            "headers": [
                (b"www-authenticate", b'Basic realm="Vision 2026 Dashboard"'),
                (b"content-length", b"0"),
            ],
        })
        await send({"type": "http.response.body", "body": b""})


# Compatibilidad con código que aún importe el nombre viejo (no se usa con add_middleware).
async def basic_auth_middleware(request, call_next):
    raise NotImplementedError("Use BasicAuthASGIMiddleware (ASGI puro) — esta wrapper queda solo por compatibilidad.")
