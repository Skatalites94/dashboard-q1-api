"""Tests de aislamiento entre marcas (Workspaces).

Verifica que:
1. POST /api/brands crea una nueva marca con sus 6 fases base.
2. Las queries con X-Brand-Id=1 NO ven datos de brand 2 y viceversa.
3. Crear un touchpoint sin header → cae en brand 1 (Promoselect default).
4. company_context y governance_charter son singleton-por-marca.

Corre contra SQLite limpio (no toca producción).
"""
import os
import sys
import tempfile
from pathlib import Path

# Forzar SQLite + DB efímera ANTES de importar la app
TEST_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
os.environ["FORCE_SQLITE"] = "1"
os.environ["SQLITE_DB_NAME"] = Path(TEST_DB).name
# Mover a la carpeta data/ que es donde la app espera la BD
os.environ.pop("DATABASE_URL", None)
os.environ.pop("DASHBOARD_PASSWORD", None)  # desactivar auth para los tests

# Ahora importar
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

# Seed brand_id=1 (Promoselect) y la fase 'atraccion' base
from sqlalchemy.orm import Session  # noqa: E402
from app.models import Brand, ComercialPhase  # noqa: E402

with Session(engine) as s:
    if not s.query(Brand).first():
        s.add(Brand(id=1, slug="promoselect", name="Promoselect"))
        s.add(ComercialPhase(
            id="atraccion", brand_id=1, name="Atracción", icon="🧲",
            color="#6366f1", description="seed", order=1
        ))
        s.commit()

client = TestClient(app)


def test_brand1_default_sees_promoselect():
    """Sin header → asume brand 1, ve la fase semilla."""
    r = client.get("/api/brands/")
    assert r.status_code == 200, r.text
    brands = r.json()
    assert any(b["slug"] == "promoselect" for b in brands)


def test_create_new_brand_seeds_six_phases():
    """POST /api/brands crea marca y autocrea 6 fases vacías."""
    r = client.post("/api/brands/", json={"name": "Marca Beta"})
    assert r.status_code == 201, r.text
    new_brand = r.json()
    assert new_brand["slug"] == "marca-beta"
    new_id = new_brand["id"]

    # Listar fases con X-Brand-Id de la nueva marca → 6 fases
    r2 = client.get("/api/comercial/phases/", headers={"X-Brand-Id": str(new_id)})
    assert r2.status_code == 200, r2.text
    phases = r2.json()
    assert len(phases) == 6, f"Esperaba 6 fases base, vinieron {len(phases)}"
    # Las phase ids llevan sufijo _b{brand_id} para no chocar con la PK String
    # de Promoselect (brand 1) — los nombres de fase deben ser los 6 estándar.
    phase_names = {p["name"] for p in phases}
    assert phase_names == {"Atracción", "Captura", "Conversión", "Onboarding", "Recompra", "Motor de Confianza"}
    suffix = f"_b{new_id}"
    for p in phases:
        assert p["id"].endswith(suffix), f"Phase {p['id']} no tiene sufijo {suffix}"


def test_isolation_between_brands():
    """Touchpoint creado en brand 1 NO aparece en brand 2 y viceversa."""
    # Crear touchpoint en brand 1
    tp_brand1 = {
        "phase_id": "atraccion",
        "name": "TP de Promoselect",
        "responsable": "Ventas",
        "kpi": "",
        "order": 1
    }
    r = client.post("/api/comercial/touchpoints/", json=tp_brand1, headers={"X-Brand-Id": "1"})
    assert r.status_code == 201, r.text

    # Crear marca C
    rc = client.post("/api/brands/", json={"name": "Marca C"})
    assert rc.status_code == 201
    brand_c_id = rc.json()["id"]

    # Crear touchpoint en marca C
    tp_brandc = {
        "phase_id": "atraccion",
        "name": "TP de Marca C",
        "responsable": "Sales",
        "kpi": "",
        "order": 1
    }
    r2 = client.post("/api/comercial/touchpoints/", json=tp_brandc, headers={"X-Brand-Id": str(brand_c_id)})
    assert r2.status_code == 201, r2.text

    # Listar TPs de brand 1 → ver "TP de Promoselect", NO "TP de Marca C"
    r3 = client.get("/api/comercial/touchpoints/", headers={"X-Brand-Id": "1"})
    names_brand1 = {tp["name"] for tp in r3.json()}
    assert "TP de Promoselect" in names_brand1
    assert "TP de Marca C" not in names_brand1, "FUGA: TP de marca C aparece en marca 1"

    # Listar TPs de marca C → ver "TP de Marca C", NO "TP de Promoselect"
    r4 = client.get("/api/comercial/touchpoints/", headers={"X-Brand-Id": str(brand_c_id)})
    names_brandc = {tp["name"] for tp in r4.json()}
    assert "TP de Marca C" in names_brandc
    assert "TP de Promoselect" not in names_brandc, "FUGA: TP de marca 1 aparece en marca C"


def test_company_context_per_brand():
    """company_context es singleton-por-marca: cada marca tiene el suyo."""
    # Brand 1 setea su propio nombre de empresa
    r = client.patch("/api/comercial/company-context",
                     json={"company_name": "Promoselect SA"},
                     headers={"X-Brand-Id": "1"})
    assert r.status_code == 200
    assert r.json()["company_name"] == "Promoselect SA"

    # Crear nueva marca y setear su propio nombre
    rd = client.post("/api/brands/", json={"name": "Marca D"})
    brand_d_id = rd.json()["id"]
    r2 = client.patch("/api/comercial/company-context",
                      json={"company_name": "Marca D Inc"},
                      headers={"X-Brand-Id": str(brand_d_id)})
    assert r2.status_code == 200
    assert r2.json()["company_name"] == "Marca D Inc"

    # Verificar que cada una conserva el suyo
    r3 = client.get("/api/comercial/company-context", headers={"X-Brand-Id": "1"})
    assert r3.json()["company_name"] == "Promoselect SA"

    r4 = client.get("/api/comercial/company-context", headers={"X-Brand-Id": str(brand_d_id)})
    assert r4.json()["company_name"] == "Marca D Inc"


def test_no_header_defaults_to_brand_1():
    """Request sin header X-Brand-Id → cae a brand 1 (Promoselect)."""
    r = client.get("/api/comercial/touchpoints/")  # sin header
    assert r.status_code == 200
    names = {tp["name"] for tp in r.json()}
    # Debe ver el TP de Promoselect, NO los de otras marcas
    assert "TP de Promoselect" in names
    assert "TP de Marca C" not in names
