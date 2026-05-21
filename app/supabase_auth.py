"""Autenticación con Supabase Auth (JWT ES256 / HS256).

Si SUPABASE_JWT_SECRET está definido, /api/* exige Bearer token válido salvo rutas públicas.
ADMIN_USER_IDS (UUIDs separados por coma) pueden ver marcas legacy sin owner y todas las marcas.
"""
from __future__ import annotations

import os
from contextvars import ContextVar
from typing import Optional

import jwt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Brand

current_user_id_var: ContextVar[Optional[str]] = ContextVar("current_user_id", default=None)

PUBLIC_API_PREFIXES = (
    "/api/auth/",
)

PUBLIC_API_EXACT = frozenset({
    "/api/auth/config",
})


def is_auth_enabled() -> bool:
    return bool(_jwt_secret())


def _jwt_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip()


def get_admin_user_ids() -> frozenset[str]:
    raw = os.getenv("ADMIN_USER_IDS", "").strip()
    if not raw:
        return frozenset()
    return frozenset(x.strip() for x in raw.split(",") if x.strip())


def current_user_id() -> Optional[str]:
    return current_user_id_var.get()


def is_current_user_admin() -> bool:
    uid = current_user_id()
    return bool(uid and uid in get_admin_user_ids())


_jwks_client = None


def _get_jwks_client():
    """Cliente JWKS para verificar tokens con clave asimétrica (ES256/RS256)."""
    global _jwks_client
    if _jwks_client is None:
        base = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
        _jwks_client = jwt.PyJWKClient(base + "/auth/v1/.well-known/jwks.json")
    return _jwks_client


def _decode_claims(token: str, key, algorithms: list) -> dict:
    try:
        return jwt.decode(
            token, key, algorithms=algorithms,
            audience="authenticated", options={"require": ["sub", "exp"]},
        )
    except jwt.InvalidAudienceError:
        return jwt.decode(
            token, key, algorithms=algorithms,
            options={"require": ["sub", "exp"], "verify_aud": False},
        )


def verify_access_token(token: str) -> str:
    """Devuelve el `sub` (UUID usuario). Lanza HTTPException si inválido.

    Soporta tokens con clave asimétrica (ES256/RS256 vía JWKS — default en
    proyectos Supabase nuevos) y con secreto compartido HS256 (proyectos legacy).
    """
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")

    if alg.startswith(("ES", "RS", "PS", "Ed")):
        try:
            key = _get_jwks_client().get_signing_key_from_jwt(token).key
        except (jwt.PyJWKClientError, jwt.InvalidTokenError):
            raise HTTPException(status_code=401, detail="Token inválido.")
        algorithms = [alg]
    else:
        key = _jwt_secret()
        if not key:
            raise HTTPException(status_code=503, detail="Autenticación no configurada en el servidor.")
        algorithms = ["HS256"]

    try:
        payload = _decode_claims(token, key, algorithms)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesión expirada. Vuelve a iniciar sesión.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Token sin identificador de usuario.")
    return sub


def is_public_api_path(path: str) -> bool:
    if path in PUBLIC_API_EXACT:
        return True
    return any(path.startswith(p) for p in PUBLIC_API_PREFIXES)


def user_can_access_brand(db: Session, brand_id: int, user_id: Optional[str]) -> bool:
    if not is_auth_enabled():
        return True
    if not user_id:
        return False
    if user_id in get_admin_user_ids():
        return True
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        return False
    if brand.owner_user_id is None:
        return False
    return brand.owner_user_id == user_id


class SupabaseAuthASGIMiddleware:
    """Valida JWT y rellena current_user_id_var."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if not is_auth_enabled():
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if not path.startswith("/api/") or is_public_api_path(path):
            await self.app(scope, receive, send)
            return

        auth_header = b""
        for name, value in scope.get("headers", []):
            if name.lower() == b"authorization":
                auth_header = value
                break

        token = None
        if auth_header.startswith(b"Bearer "):
            try:
                token = auth_header[7:].decode("utf-8").strip()
            except UnicodeDecodeError:
                pass

        if not token:
            await _send_json_401(send, "Inicia sesión para continuar.")
            return

        try:
            user_id = verify_access_token(token)
        except HTTPException as exc:
            await _send_json(send, exc.status_code, {"detail": exc.detail})
            return

        token_ctx = current_user_id_var.set(user_id)
        try:
            await self.app(scope, receive, send)
        finally:
            current_user_id_var.reset(token_ctx)


class BrandAccessASGIMiddleware:
    """Tras resolver X-Brand-Id, verifica que el usuario sea dueño (o admin)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if not is_auth_enabled():
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if not path.startswith("/api/") or is_public_api_path(path):
            await self.app(scope, receive, send)
            return

        # Listar/crear marcas: el router filtra por owner; no exige marca activa.
        if path.rstrip("/") in ("/api/brands", "/api/brands/"):
            await self.app(scope, receive, send)
            return

        user_id = current_user_id_var.get()
        if not user_id:
            await _send_json_401(send, "Inicia sesión para continuar.")
            return

        if user_id in get_admin_user_ids():
            await self.app(scope, receive, send)
            return

        brand_id = None
        for name, value in scope.get("headers", []):
            if name.lower() == b"x-brand-id":
                try:
                    parsed = int(value.decode("latin-1"))
                    if parsed > 0:
                        brand_id = parsed
                except (TypeError, ValueError, UnicodeDecodeError):
                    pass
                break

        if brand_id is None:
            from app.brand_context import current_brand_id_var

            brand_id = current_brand_id_var.get()

        if brand_id is None or brand_id < 1:
            await self.app(scope, receive, send)
            return

        from app.database import SessionLocal

        db = SessionLocal()
        try:
            if not user_can_access_brand(db, brand_id, user_id):
                await _send_json(
                    send,
                    403,
                    {"detail": "No tienes acceso a esta marca. Selecciona una marca tuya."},
                )
                return
        finally:
            db.close()

        await self.app(scope, receive, send)


async def _send_json(send, status: int, body: dict) -> None:
    import json

    payload = json.dumps(body).encode("utf-8")
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(payload)).encode()),
        ],
    })
    await send({"type": "http.response.body", "body": payload})


async def _send_json_401(send, detail: str) -> None:
    await _send_json(send, 401, {"detail": detail})
