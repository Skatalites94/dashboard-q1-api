"""Config pública para login Supabase en el frontend."""
import os

from fastapi import APIRouter

router = APIRouter()


@router.get("/config")
def auth_config():
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    url = os.getenv("SUPABASE_URL", "").strip()
    anon = os.getenv("SUPABASE_ANON_KEY", "").strip()
    auth_enabled = bool(jwt_secret and url and anon)
    return {
        "auth_enabled": auth_enabled,
        "supabase_url": url if auth_enabled else None,
        "supabase_anon_key": anon if auth_enabled else None,
    }
