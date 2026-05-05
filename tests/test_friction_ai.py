"""Tests para los endpoints AI nuevos del módulo Fricciones.

Cubre:
- POST /ai/suggest-friction-resolution → 404 si la fricción no existe.
- POST /ai/check-friction-duplicate → noop cuando no hay fricciones existentes en la fase.
- POST /ai/suggest-friction-priority → 404 si la fricción no existe.

NO llama a OpenAI realmente — solo prueba shape de los endpoints, gating
y rescue de errores. Llamadas reales se prueban con OPENAI_API_KEY local.
"""
import os
import sys
import tempfile
from pathlib import Path

TEST_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
os.environ["FORCE_SQLITE"] = "1"
os.environ["SQLITE_DB_NAME"] = Path(TEST_DB).name
os.environ.pop("DATABASE_URL", None)
os.environ.pop("DASHBOARD_PASSWORD", None)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

# Forzar OPENAI_API_KEY vacía DESPUÉS de imports (load_dotenv en app/database
# re-llena la env desde .env, así que tenemos que vaciar acá para forzar el
# path de error gracioso del generator).
os.environ["OPENAI_API_KEY"] = ""

Base.metadata.create_all(bind=engine)

from sqlalchemy.orm import Session  # noqa: E402
from app.models import Brand, ComercialPhase, ComercialFriction  # noqa: E402

with Session(engine) as s:
    # Cada pieza es independiente: si test anteriores ya sembraron Brand pero no la fase
    # o la fricción que necesitamos, los agregamos sin chocar.
    if not s.query(Brand).filter_by(id=1).first():
        s.add(Brand(id=1, slug="promoselect", name="Promoselect"))
        s.flush()
    if not s.query(ComercialPhase).filter_by(id="atraccion", brand_id=1).first():
        s.add(ComercialPhase(
            id="atraccion", brand_id=1, name="Atracción", icon="🧲",
            color="#6366f1", description="seed", order=1
        ))
        s.flush()
    if not s.query(ComercialFriction).filter_by(id="FR-1", brand_id=1).first():
        s.add(ComercialFriction(
            brand_id=1, id="FR-1", phase_id="atraccion",
            name="Lead se pierde tras pedir cotización",
            description="No hay follow-up automático.",
            impact="high", status="pending",
        ))
    s.commit()

client = TestClient(app)


def test_suggest_friction_resolution_404_for_unknown_id():
    """Endpoint del drawer → 404 si la fricción no existe."""
    r = client.post(
        "/api/comercial/ai/suggest-friction-resolution",
        json={"friction_id": "FR-NOEXISTE"},
    )
    assert r.status_code == 404, r.text


def test_check_friction_duplicate_no_existing_returns_zero_score():
    """Sin OPENAI_API_KEY no debe romper. Si no hay fricciones existentes en la fase, devuelve score 0."""
    r = client.post(
        "/api/comercial/ai/check-friction-duplicate",
        json={
            "name": "Otra fricción nueva",
            "description": "...",
            "phase_id": "fase-no-existe",  # sin fricciones
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["best_match_id"] is None
    assert data["similarity_score"] == 0.0


def test_check_friction_duplicate_no_api_key_does_not_block():
    """Si OPENAI_API_KEY no está configurada Y hay fricciones existentes,
    el endpoint NO debe romper — debe devolver score 0 con error en _meta."""
    # Forzar key vacía en este test específico (otros tests en la suite pueden
    # haber re-cargado .env y restaurado la key)
    prev = os.environ.get("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = ""
    try:
        r = client.post(
            "/api/comercial/ai/check-friction-duplicate",
            json={
                "name": "Lead se evapora después de cotizar",
                "description": "Cliente no contesta",
                "phase_id": "atraccion",
            },
        )
    finally:
        if prev is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = prev
    assert r.status_code == 200, r.text
    data = r.json()
    # No bloquea: devuelve score 0 (sea via skip por lista vacía o via rescue de error)
    assert data["similarity_score"] == 0.0
    assert data["best_match_id"] is None


def test_suggest_friction_priority_404_for_unknown_id():
    r = client.post(
        "/api/comercial/ai/suggest-friction-priority",
        json={"friction_id": "FR-NOEXISTE"},
    )
    assert r.status_code == 404, r.text


def test_suggest_friction_priority_no_api_key_returns_safe_default():
    """Sin OPENAI_API_KEY, el endpoint devuelve 200 con is_critical=false."""
    prev = os.environ.get("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = ""
    try:
        r = client.post(
            "/api/comercial/ai/suggest-friction-priority",
            json={"friction_id": "FR-1"},
        )
    finally:
        if prev is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = prev
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["is_critical"] is False
    assert "reason" in data


def test_suggest_friction_resolution_no_api_key_returns_503():
    """Sin OPENAI_API_KEY, el endpoint del drawer devuelve 503 (no 500),
    porque el drawer SÍ es un flujo interactivo donde el usuario debe enterarse."""
    prev = os.environ.get("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = ""
    try:
        r = client.post(
            "/api/comercial/ai/suggest-friction-resolution",
            json={"friction_id": "FR-1"},
        )
    finally:
        if prev is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = prev
    assert r.status_code == 503, r.text
    assert "OPENAI_API_KEY" in r.text or "no está configurada" in r.text.lower()
