"""Smoke tests de endpoints clave (TestClient + SQLite local).

Cubre: bootstrap, dashboard.master_metrics, reorder, optimistic locking 409,
friction_type round-trip, export.json.
"""
import os

os.environ.setdefault("FORCE_SQLITE", "1")
os.environ.pop("DATABASE_URL", None)

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_bootstrap_ok_and_completeness_present(client):
    r = client.get("/api/comercial/bootstrap")
    assert r.status_code == 200
    d = r.json()
    assert "phases" in d and len(d["phases"]) > 0
    assert "touchpoints" in d
    if d["touchpoints"]:
        tp = d["touchpoints"][0]
        # v13 fields
        for f in ["classification", "leverage_point", "internal_checklist",
                  "duration_minutes", "duration_label", "updated_at", "completeness"]:
            assert f in tp, f"bootstrap tp missing field: {f}"
        c = tp["completeness"]
        for k in ["has_name", "has_phase", "has_channel", "has_responsable",
                  "has_sequence", "has_kpi", "has_checklist", "has_diagnosis"]:
            assert k in c["checks"]


def test_dashboard_returns_master_metrics(client):
    r = client.get("/api/comercial/dashboard")
    assert r.status_code == 200
    d = r.json()
    assert "master_metrics" in d
    mm = d["master_metrics"]
    assert set(mm.keys()) == {"utility", "ltv", "cac", "conversion"}
    for m in mm.values():
        assert m["color"] in {"green", "yellow", "red", "gray"}
        assert "drivers" in m


def test_touchpoints_reorder_roundtrip(client):
    boot = client.get("/api/comercial/bootstrap").json()
    phase = boot["phases"][0]
    tps_phase = sorted(
        [t for t in boot["touchpoints"] if t["phase_id"] == phase["id"]],
        key=lambda x: x.get("order", 0),
    )
    if len(tps_phase) < 2:
        pytest.skip("phase has < 2 touchpoints")
    orig_ids = [t["id"] for t in tps_phase]
    rev_ids = list(reversed(orig_ids))
    r = client.post("/api/comercial/touchpoints/reorder",
                    json={"phase_id": phase["id"], "ids": rev_ids})
    assert r.status_code == 200
    out_ids = [t["id"] for t in r.json()]
    assert out_ids == rev_ids
    # restore
    client.post("/api/comercial/touchpoints/reorder",
                json={"phase_id": phase["id"], "ids": orig_ids})


def test_friction_type_create_patch_delete(client):
    fid = "F-PYTEST"
    # cleanup if exists
    client.delete(f"/api/comercial/frictions/{fid}")
    r = client.post("/api/comercial/frictions/", json={
        "id": fid, "phase_id": "atraccion", "name": "pytest tipada",
        "impact": "medium", "friction_type": "time", "status": "pending",
    })
    assert r.status_code == 201
    assert r.json()["friction_type"] == "time"
    r2 = client.patch(f"/api/comercial/frictions/{fid}", json={"friction_type": "channel_switch"})
    assert r2.status_code == 200
    assert r2.json()["friction_type"] == "channel_switch"
    r3 = client.delete(f"/api/comercial/frictions/{fid}")
    assert r3.status_code == 200


def test_optimistic_locking_returns_409(client):
    boot = client.get("/api/comercial/bootstrap").json()
    if not boot["touchpoints"]:
        pytest.skip("no touchpoints")
    tp = boot["touchpoints"][0]
    stale = "1900-01-01T00:00:00"
    r = client.patch(f"/api/comercial/touchpoints/{tp['id']}",
                     json={"name": tp["name"], "expected_updated_at": stale})
    assert r.status_code == 409
    body = r.json()
    detail = body.get("detail") or body
    assert detail.get("error") == "stale"


def test_export_json_returns_full_snapshot(client):
    r = client.get("/api/comercial/export.json")
    assert r.status_code == 200
    d = r.json()
    # debe contener varias tablas claves
    for k in ["phases", "touchpoints", "frictions", "trust_pillars", "kpis", "people"]:
        assert k in d, f"export missing key: {k}"
