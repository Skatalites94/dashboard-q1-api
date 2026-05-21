import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import BasicAuthASGIMiddleware
from app.supabase_auth import BrandAccessASGIMiddleware, SupabaseAuthASGIMiddleware
from app.brand_context import current_brand_id_var
from app.brand_scope import install_brand_scope
from app.database import Base, engine
from app.error_handlers import register_error_handlers
from app.routers import api_router


class BrandContextASGIMiddleware:
    """Raw ASGI middleware: extrae X-Brand-Id y lo escribe al ContextVar.

    Usamos ASGI puro (no BaseHTTPMiddleware) porque BaseHTTPMiddleware no
    propaga ContextVars al route handler — ver issue starlette/issues/472.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        bid = 1
        for name, value in scope.get("headers", []):
            if name.lower() == b"x-brand-id":
                try:
                    parsed = int(value.decode("latin-1"))
                    if parsed > 0:
                        bid = parsed
                except (TypeError, ValueError, UnicodeDecodeError):
                    pass
                break
        token = current_brand_id_var.set(bid)
        try:
            await self.app(scope, receive, send)
        finally:
            current_brand_id_var.reset(token)


app = FastAPI(title="Dashboard Q1 2026 — Stencil Group", version="1.0.0")

# Activa scoping automático por brand_id en queries y inserts (Workspaces).
install_brand_scope()

# Middlewares ASGI puros (sin BaseHTTPMiddleware) para que el ContextVar de
# brand_id se propague correctamente al route handler.
# add_middleware aplica en orden inverso: el último añadido es el más externo.
app.add_middleware(BrandAccessASGIMiddleware)
app.add_middleware(BrandContextASGIMiddleware)
app.add_middleware(SupabaseAuthASGIMiddleware)
app.add_middleware(BasicAuthASGIMiddleware)
register_error_handlers(app)

_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
_allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()] or [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging
        logging.warning(f"Could not create tables on startup: {e}")


app.include_router(api_router, prefix="/api")

_static_dir = Path(__file__).resolve().parent.parent / "static"
if _static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
