"""Router de marcas (Workspaces).

GET  /api/brands                  → lista todas las marcas
GET  /api/brands/{brand_id}       → detalle
POST /api/brands                  → crea marca + auto-seedea las 6 fases vacías
"""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.brand_context import use_brand
from app.database import get_db
from app.models import Brand, ComercialPhase
from app.supabase_auth import (
    current_user_id,
    is_auth_enabled,
    is_current_user_admin,
    user_can_access_brand,
)

router = APIRouter()


# Las 6 fases base que toda marca arranca en blanco. Sin touchpoints.
PHASES_TEMPLATE = [
    {"id": "atraccion",  "name": "Atracción",          "icon": "🧲", "color": "#6366f1", "description": "Cómo llegamos a nuestros prospectos", "order": 1},
    {"id": "captura",    "name": "Captura",             "icon": "📥", "color": "#8b5cf6", "description": "Cómo capturamos datos del prospecto", "order": 2},
    {"id": "conversion", "name": "Conversión",          "icon": "💰", "color": "#ec4899", "description": "Cómo convertimos prospectos en clientes", "order": 3},
    {"id": "onboarding", "name": "Onboarding",          "icon": "🚀", "color": "#14b8a6", "description": "Cómo entregamos y damos la bienvenida al cliente", "order": 4},
    {"id": "recompra",   "name": "Recompra",            "icon": "🔄", "color": "#f59e0b", "description": "Cómo hacemos que el cliente vuelva a comprar", "order": 5},
    {"id": "confianza",  "name": "Motor de Confianza",  "icon": "⚡", "color": "#22c55e", "description": "El motor que alimenta todas las fases", "order": 6},
]


class BrandCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: Optional[str] = None  # opcional: si no viene, lo derivamos del nombre


class BrandOut(BaseModel):
    id: int
    slug: str
    name: str

    class Config:
        from_attributes = True


def slugify(name: str) -> str:
    """nombre → slug url-safe simple. 'Marca Beta!' → 'marca-beta'."""
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "marca"


@router.get("/")
def list_brands(db: Session = Depends(get_db)):
    q = db.query(Brand)
    if is_auth_enabled() and not is_current_user_admin():
        uid = current_user_id()
        if not uid:
            raise HTTPException(status_code=401, detail="Inicia sesión para continuar.")
        q = q.filter(Brand.owner_user_id == uid)
    rows = q.order_by(Brand.id).all()
    return [{"id": r.id, "slug": r.slug, "name": r.name} for r in rows]


@router.get("/{brand_id}")
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    if is_auth_enabled() and not user_can_access_brand(db, brand_id, current_user_id()):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta marca.")
    return {"id": b.id, "slug": b.slug, "name": b.name}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_brand(body: BrandCreate, db: Session = Depends(get_db)):
    name = body.name.strip()
    owner_uid = current_user_id() if is_auth_enabled() else None
    if is_auth_enabled() and not owner_uid:
        raise HTTPException(status_code=401, detail="Inicia sesión para crear una marca.")

    base_slug = slugify(body.slug) if body.slug else slugify(name)

    # garantizar slug único
    slug = base_slug
    n = 2
    while db.query(Brand).filter(Brand.slug == slug).first():
        slug = f"{base_slug}-{n}"
        n += 1

    brand = Brand(slug=slug, name=name, owner_user_id=owner_uid)
    db.add(brand)
    db.flush()  # asigna id

    # Seed: las 6 fases base vacías, vinculadas a esta brand.
    # PK de comercial_phases es String global (legacy), así que sufijamos
    # con _b{brand_id} para evitar colisión con Promoselect (brand 1) que
    # ya tiene ids "atraccion", "captura", etc.
    suffix = "" if brand.id == 1 else f"_b{brand.id}"
    with use_brand(brand.id):
        for ph in PHASES_TEMPLATE:
            db.add(ComercialPhase(
                id=f"{ph['id']}{suffix}",
                brand_id=brand.id,
                name=ph["name"],
                icon=ph["icon"],
                color=ph["color"],
                description=ph["description"],
                order=ph["order"],
            ))

    db.commit()
    db.refresh(brand)
    return {"id": brand.id, "slug": brand.slug, "name": brand.name}
