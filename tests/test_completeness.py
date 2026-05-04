"""Tests del contrato §3.2.1 — completeness de Touchpoint.

8 predicados booleanos exactos, two-tier (usable vs completo). Pure function,
sin BD: usamos un objeto stub.
"""
from app.serialize import _tp_completeness


class _TpStub:
    def __init__(self, **kw):
        self.name = kw.get("name", "Test")
        self.phase_id = kw.get("phase_id", "atraccion")
        self.responsable_id = kw.get("responsable_id", None)
        self.internal_checklist = kw.get("internal_checklist", None)
        self.classification = kw.get("classification", "normal")


def test_completeness_zero_when_empty():
    tp = _TpStub(name="", phase_id=None)
    c = _tp_completeness(tp, {})
    assert c["score"] == 0
    assert c["is_usable"] is False
    assert c["is_complete"] is False


def test_completeness_usable_minimum():
    # Necesita: name + phase + responsable_id + responsable_active=True
    tp = _TpStub(name="Llamada inicial", phase_id="atraccion", responsable_id=42)
    c = _tp_completeness(tp, {"responsable_active": True})
    assert c["checks"]["has_name"] is True
    assert c["checks"]["has_phase"] is True
    assert c["checks"]["has_responsable"] is True
    assert c["is_usable"] is True
    assert c["is_complete"] is False
    assert c["score"] == 3


def test_completeness_responsable_inactive_breaks_usable():
    tp = _TpStub(name="Llamada", phase_id="atraccion", responsable_id=42)
    c = _tp_completeness(tp, {"responsable_active": False})
    assert c["checks"]["has_responsable"] is False
    assert c["is_usable"] is False


def test_completeness_complete_8_of_8():
    tp = _TpStub(
        name="Llamada de descubrimiento",
        phase_id="captura",
        responsable_id=42,
        internal_checklist=[{"text": "Pregunta 1"}, {"text": "Pregunta 2"}, {"text": "Pregunta 3"}],
        classification="critical",
    )
    ctx = {
        "channel_count": 2,
        "flow_count": 1,
        "kpi_count": 1,
        "responsable_active": True,
    }
    c = _tp_completeness(tp, ctx)
    assert c["score"] == 8
    assert c["is_usable"] is True
    assert c["is_complete"] is True
    for k, v in c["checks"].items():
        assert v is True, f"{k} should be True"


def test_completeness_classification_normal_doesnt_count():
    tp = _TpStub(name="X", phase_id="x", responsable_id=1, classification="normal")
    c = _tp_completeness(tp, {"responsable_active": True})
    assert c["checks"]["has_diagnosis"] is False


def test_completeness_classification_invalid_doesnt_count():
    tp = _TpStub(name="X", phase_id="x", responsable_id=1, classification="bogus")
    c = _tp_completeness(tp, {"responsable_active": True})
    assert c["checks"]["has_diagnosis"] is False


def test_completeness_checklist_under_3_doesnt_count():
    tp = _TpStub(name="X", phase_id="x", responsable_id=1,
                 internal_checklist=[{"text": "uno"}, {"text": "dos"}])
    c = _tp_completeness(tp, {"responsable_active": True})
    assert c["checks"]["has_checklist"] is False


def test_completeness_checklist_exactly_3_counts():
    tp = _TpStub(name="X", phase_id="x", responsable_id=1,
                 internal_checklist=[{"text": "1"}, {"text": "2"}, {"text": "3"}])
    c = _tp_completeness(tp, {"responsable_active": True})
    assert c["checks"]["has_checklist"] is True


def test_completeness_no_ctx_uses_safe_defaults():
    # Sin ctx, conteos contextuales son 0/False — predicados conservadores
    tp = _TpStub(name="X", phase_id="x", responsable_id=1, classification="critical")
    c = _tp_completeness(tp)
    assert c["checks"]["has_channel"] is False
    assert c["checks"]["has_sequence"] is False
    assert c["checks"]["has_kpi"] is False
    assert c["checks"]["has_responsable"] is False  # responsable_active no provisto
    assert c["score"] == 3  # name + phase + diagnosis
