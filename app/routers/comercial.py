"""Router para el módulo Arquitectura Comercial."""

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    ComercialActivityLog, ComercialCanvasLayout, ComercialCanvasNote, ComercialComment, ComercialFriction, ComercialKpi,
    ComercialKpiFriction, ComercialKpiHistory, ComercialKpiTouchpoint,
    ComercialInitiative, ComercialInitiativeFriction, ComercialInitiativeTouchpoint,
    ComercialInitiativePillar, ComercialInitiativeInvolved, ComercialInitiativeDependency,
    ComercialPerson, ComercialPhase, ComercialTouchpoint, ComercialTouchpointFlow, ComercialTpKpiHistory,
    ComercialTrustPillar,
)
from app.schemas import (
    ComercialCanvasLayoutBulk, ComercialCanvasLinkRequest,
    ComercialCanvasNoteCreate, ComercialCanvasNoteUpdate,
    ComercialPhaseCreate, ComercialPhaseUpdate,
    ComercialTouchpointFlowCreate, ComercialTouchpointFlowUpdate,
    ComercialTouchpointReorderRequest,
    ComercialCommentCreate, ComercialFrictionCreate, ComercialFrictionUpdate,
    ComercialInitiativeCreate, ComercialInitiativeUpdate,
    ComercialKpiCreate, ComercialKpiFrictionLink, ComercialKpiHistoryCreate, ComercialKpiUpdate,
    ComercialPersonCreate, ComercialPersonUpdate,
    ComercialTouchpointCreate, ComercialTouchpointUpdate,
    ComercialTpKpiConfigUpdate, ComercialTpKpiMeasurement,
    ComercialTrustPillarUpdate,
)
from app.serialize import (
    comercial_activity_log_out, comercial_canvas_layout_out, comercial_canvas_note_out, comercial_comment_out, comercial_touchpoint_flow_out,
    comercial_friction_out,
    comercial_initiative_out,
    comercial_kpi_history_out, comercial_kpi_out, comercial_person_out,
    comercial_phase_out, comercial_touchpoint_out,
    comercial_trust_pillar_out,
)

router = APIRouter()


def _validate_touchpoint_for_friction(db: Session, phase_id: str, touchpoint_id: Optional[int]) -> None:
    """Si hay touchpoint, debe existir y pertenecer a la misma fase que la fricción."""
    if touchpoint_id is None:
        return
    tp = db.get(ComercialTouchpoint, touchpoint_id)
    if not tp:
        raise HTTPException(404, "Touchpoint not found")
    if tp.phase_id != phase_id:
        raise HTTPException(
            400,
            "El touchpoint debe ser de la misma fase que la fricción",
        )


def _normalize_iniciativa_scope(db: Session, data: dict) -> None:
    """Normaliza y valida que phase_id/touchpoint_id queden consistentes."""
    tp_id = data.get("touchpoint_id")
    phase_id = data.get("phase_id")
    if not tp_id:
        return
    tp = db.get(ComercialTouchpoint, tp_id)
    if not tp:
        raise HTTPException(404, "Touchpoint not found")
    if phase_id and str(phase_id) != str(tp.phase_id):
        raise HTTPException(400, "La fase no coincide con el touchpoint seleccionado")
    data["phase_id"] = tp.phase_id


def _initiative_links_map(db: Session) -> dict:
    """Pre-carga todas las pivots de iniciativas. Devuelve dict[ini_id] -> dict de listas."""
    out = {}
    def _ensure(i):
        if i not in out:
            out[i] = {"friction_ids": [], "touchpoint_ids": [], "pillar_ids": [], "involved_ids": [], "depends_on_ids": []}
        return out[i]
    for r in db.query(ComercialInitiativeFriction).all():
        _ensure(r.initiative_id)["friction_ids"].append(r.friction_id)
    for r in db.query(ComercialInitiativeTouchpoint).all():
        _ensure(r.initiative_id)["touchpoint_ids"].append(r.touchpoint_id)
    for r in db.query(ComercialInitiativePillar).all():
        _ensure(r.initiative_id)["pillar_ids"].append(r.pillar_id)
    for r in db.query(ComercialInitiativeInvolved).all():
        _ensure(r.initiative_id)["involved_ids"].append(r.person_id)
    for r in db.query(ComercialInitiativeDependency).all():
        _ensure(r.initiative_id)["depends_on_ids"].append(r.depends_on_id)
    return out


def _initiative_links_for(db: Session, ini_id: int) -> dict:
    return {
        "friction_ids": [r.friction_id for r in db.query(ComercialInitiativeFriction).filter_by(initiative_id=ini_id).all()],
        "touchpoint_ids": [r.touchpoint_id for r in db.query(ComercialInitiativeTouchpoint).filter_by(initiative_id=ini_id).all()],
        "pillar_ids": [r.pillar_id for r in db.query(ComercialInitiativePillar).filter_by(initiative_id=ini_id).all()],
        "involved_ids": [r.person_id for r in db.query(ComercialInitiativeInvolved).filter_by(initiative_id=ini_id).all()],
        "depends_on_ids": [r.depends_on_id for r in db.query(ComercialInitiativeDependency).filter_by(initiative_id=ini_id).all()],
    }


def _has_dependency_cycle(db: Session, ini_id: int, depends_on_ids: list) -> bool:
    """DFS desde cada nuevo padre buscando si llega a ini_id."""
    if not depends_on_ids:
        return False
    if ini_id in depends_on_ids:
        return True
    visited = set()

    def dfs(node):
        if node == ini_id:
            return True
        if node in visited:
            return False
        visited.add(node)
        for r in db.query(ComercialInitiativeDependency).filter_by(initiative_id=node).all():
            if dfs(r.depends_on_id):
                return True
        return False

    return any(dfs(d) for d in depends_on_ids)


def _sync_initiative_links(db: Session, ini_id: int, data: dict) -> None:
    """Sincroniza tablas pivote a partir de listas en `data`. Solo toca las que vienen presentes."""
    if "friction_ids" in data and data["friction_ids"] is not None:
        db.query(ComercialInitiativeFriction).filter_by(initiative_id=ini_id).delete()
        for fid in data["friction_ids"]:
            db.add(ComercialInitiativeFriction(initiative_id=ini_id, friction_id=fid))
    if "touchpoint_ids" in data and data["touchpoint_ids"] is not None:
        db.query(ComercialInitiativeTouchpoint).filter_by(initiative_id=ini_id).delete()
        for tid in data["touchpoint_ids"]:
            db.add(ComercialInitiativeTouchpoint(initiative_id=ini_id, touchpoint_id=tid))
    if "pillar_ids" in data and data["pillar_ids"] is not None:
        db.query(ComercialInitiativePillar).filter_by(initiative_id=ini_id).delete()
        for pid in data["pillar_ids"]:
            db.add(ComercialInitiativePillar(initiative_id=ini_id, pillar_id=pid))
    if "involved_ids" in data and data["involved_ids"] is not None:
        db.query(ComercialInitiativeInvolved).filter_by(initiative_id=ini_id).delete()
        for pid in data["involved_ids"]:
            db.add(ComercialInitiativeInvolved(initiative_id=ini_id, person_id=pid))
    if "depends_on_ids" in data and data["depends_on_ids"] is not None:
        if _has_dependency_cycle(db, ini_id, data["depends_on_ids"]):
            raise HTTPException(400, "Ciclo detectado en dependencias")
        db.query(ComercialInitiativeDependency).filter_by(initiative_id=ini_id).delete()
        for did in data["depends_on_ids"]:
            db.add(ComercialInitiativeDependency(initiative_id=ini_id, depends_on_id=did))


# ── Bootstrap: carga todo en una llamada ─────────────────────

@router.get("/bootstrap")
def comercial_bootstrap(db: Session = Depends(get_db)):
    phases = db.query(ComercialPhase).order_by(ComercialPhase.order).all()
    touchpoints = db.query(ComercialTouchpoint).order_by(ComercialTouchpoint.phase_id, ComercialTouchpoint.order).all()
    frictions = db.query(ComercialFriction).all()
    pillars = db.query(ComercialTrustPillar).order_by(ComercialTrustPillar.order).all()
    initiatives = db.query(ComercialInitiative).order_by(ComercialInitiative.due_date.asc(), ComercialInitiative.id.desc()).all()
    kpis = db.query(ComercialKpi).all()
    logs = db.query(ComercialActivityLog).order_by(ComercialActivityLog.created_at.desc()).limit(50).all()
    comments = db.query(ComercialComment).order_by(ComercialComment.created_at.desc()).all()
    people = db.query(ComercialPerson).filter(ComercialPerson.is_active == True).order_by(ComercialPerson.order).all()  # noqa: E712
    kpi_frictions = db.query(ComercialKpiFriction).all()
    kpi_touchpoints = db.query(ComercialKpiTouchpoint).all()
    tp_kpi_history = db.query(ComercialTpKpiHistory).order_by(ComercialTpKpiHistory.recorded_at.desc()).limit(200).all()
    kpi_history = db.query(ComercialKpiHistory).order_by(ComercialKpiHistory.recorded_at.desc()).limit(500).all()
    canvas_layout = db.query(ComercialCanvasLayout).filter(ComercialCanvasLayout.view_id == "comercial_main").all()
    canvas_notes = db.query(ComercialCanvasNote).all()
    touchpoint_flows = db.query(ComercialTouchpointFlow).order_by(ComercialTouchpointFlow.order, ComercialTouchpointFlow.id).all()

    links_map = _initiative_links_map(db)

    return {
        "phases": [comercial_phase_out(r) for r in phases],
        "touchpoints": [comercial_touchpoint_out(r) for r in touchpoints],
        "frictions": [comercial_friction_out(r) for r in frictions],
        "trust_pillars": [comercial_trust_pillar_out(r) for r in pillars],
        "iniciativas": [comercial_initiative_out(r, links_map.get(r.id, {})) for r in initiatives],
        "kpis": [comercial_kpi_out(r) for r in kpis],
        "activity_log": [comercial_activity_log_out(r) for r in logs],
        "comments": [comercial_comment_out(r) for r in comments],
        "people": [comercial_person_out(r) for r in people],
        "kpi_frictions": [{"kpi_id": r.kpi_id, "friction_id": r.friction_id} for r in kpi_frictions],
        "kpi_touchpoints": [{
            "id": r.id, "kpi_id": r.kpi_id, "touchpoint_id": r.touchpoint_id,
            "is_critical": r.is_critical if hasattr(r, "is_critical") else False,
            "target_value_local": getattr(r, "target_value_local", None),
            "responsable_id": getattr(r, "responsable_id", None),
        } for r in kpi_touchpoints],
        "tp_kpi_history": [{
            "id": h.id, "kpi_id": h.kpi_id, "touchpoint_id": h.touchpoint_id,
            "value": h.value, "notes": h.notes, "author": h.author,
            "recorded_at": h.recorded_at.isoformat() if h.recorded_at else None,
        } for h in tp_kpi_history],
        "kpi_history": [comercial_kpi_history_out(r) for r in kpi_history],
        "canvas_layout": [comercial_canvas_layout_out(r) for r in canvas_layout],
        "canvas_notes": [comercial_canvas_note_out(r) for r in canvas_notes],
        "touchpoint_flows": [comercial_touchpoint_flow_out(r) for r in touchpoint_flows],
    }


# ── Dashboard agregado ───────────────────────────────────────

@router.get("/dashboard")
def comercial_dashboard(db: Session = Depends(get_db)):
    phases = db.query(ComercialPhase).order_by(ComercialPhase.order).all()
    touchpoints = db.query(ComercialTouchpoint).all()
    frictions = db.query(ComercialFriction).all()
    kpis = db.query(ComercialKpi).all()

    total_f = len(frictions)
    completed = sum(1 for f in frictions if f.status == "completed")
    in_progress = sum(1 for f in frictions if f.status == "in_progress")
    pending = sum(1 for f in frictions if f.status == "pending")
    analysis = sum(1 for f in frictions if f.status == "analysis")
    validation = sum(1 for f in frictions if f.status == "validation")
    active = sum(1 for f in frictions if f.status != "completed")
    overdue = sum(1 for f in frictions if f.status != "completed" and f.deadline and f.deadline < date.today())
    high_total = sum(1 for f in frictions if f.impact == "high")
    high_done = sum(1 for f in frictions if f.impact == "high" and f.status == "completed")

    lead_times = []
    for f in frictions:
        if f.status == "completed" and f.completed_at and f.created_at:
            delta = (f.completed_at - f.created_at).total_seconds() / 86400.0
            if delta >= 0:
                lead_times.append(delta)
    lead_time_avg = round(sum(lead_times) / len(lead_times), 1) if lead_times else None

    phase_stats = []
    for p in phases:
        tp_count = sum(1 for t in touchpoints if t.phase_id == p.id)
        f_count = sum(1 for f in frictions if f.phase_id == p.id)
        f_done = sum(1 for f in frictions if f.phase_id == p.id and f.status == "completed")
        f_with_issues = sum(1 for t in touchpoints if t.phase_id == p.id and t.has_friction)
        d = comercial_phase_out(p)
        d["touchpoint_count"] = tp_count
        d["friction_count"] = f_count
        d["friction_done"] = f_done
        d["friction_with_issues"] = f_with_issues
        phase_stats.append(d)

    return {
        "total_touchpoints": len(touchpoints),
        "total_frictions": total_f,
        "frictions_completed": completed,
        "frictions_in_progress": in_progress,
        "frictions_pending": pending,
        "frictions_analysis": analysis,
        "frictions_validation": validation,
        "frictions_active": active,
        "frictions_overdue": overdue,
        "lead_time_days_avg": lead_time_avg,
        "high_impact_total": high_total,
        "high_impact_done": high_done,
        "progress_percent": round((completed / total_f) * 100) if total_f > 0 else 0,
        "phases": phase_stats,
        "kpis": [comercial_kpi_out(k) for k in kpis],
    }


# ── Phases ───────────────────────────────────────────────────

@router.get("/phases/")
def list_phases(db: Session = Depends(get_db)):
    return [comercial_phase_out(r) for r in db.query(ComercialPhase).order_by(ComercialPhase.order).all()]


@router.get("/phases/{phase_id}")
def get_phase(phase_id: str, db: Session = Depends(get_db)):
    row = db.get(ComercialPhase, phase_id)
    if not row:
        raise HTTPException(404, "Phase not found")
    d = comercial_phase_out(row)
    d["touchpoints"] = [comercial_touchpoint_out(t) for t in db.query(ComercialTouchpoint).filter(ComercialTouchpoint.phase_id == phase_id).order_by(ComercialTouchpoint.order).all()]
    d["frictions"] = [comercial_friction_out(f) for f in db.query(ComercialFriction).filter(ComercialFriction.phase_id == phase_id).all()]
    return d


@router.patch("/phases/{phase_id}")
def update_phase(phase_id: str, body: ComercialPhaseUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialPhase, phase_id)
    if not row:
        raise HTTPException(404, "Phase not found")
    if body.name is not None: row.name = body.name
    if body.icon is not None: row.icon = body.icon
    if body.color is not None: row.color = body.color
    if body.description is not None: row.description = body.description
    if body.order is not None: row.order = body.order
    db.commit(); db.refresh(row)
    return comercial_phase_out(row)


@router.post("/phases/", status_code=201)
def create_phase(body: ComercialPhaseCreate, db: Session = Depends(get_db)):
    if db.get(ComercialPhase, body.id):
        raise HTTPException(409, "Phase id already exists")
    row = ComercialPhase(
        id=body.id, name=body.name, icon=body.icon or "",
        color=body.color or "#6366f1", description=body.description or "", order=body.order or 0,
    )
    db.add(row); db.commit(); db.refresh(row)
    return comercial_phase_out(row)


@router.delete("/phases/{phase_id}")
def delete_phase(phase_id: str, db: Session = Depends(get_db)):
    row = db.get(ComercialPhase, phase_id)
    if not row:
        raise HTTPException(404, "Phase not found")
    # Bloquear si tiene touchpoints
    if db.query(ComercialTouchpoint).filter(ComercialTouchpoint.phase_id == phase_id).first():
        raise HTTPException(409, "Phase has touchpoints. Move or delete them first.")
    db.delete(row); db.commit()
    return {"ok": True}


# ── Touchpoints ──────────────────────────────────────────────

@router.get("/touchpoints/")
def list_touchpoints(phase: str = None, db: Session = Depends(get_db)):
    q = db.query(ComercialTouchpoint).order_by(ComercialTouchpoint.phase_id, ComercialTouchpoint.order)
    if phase:
        q = q.filter(ComercialTouchpoint.phase_id == phase)
    return [comercial_touchpoint_out(r) for r in q.all()]


@router.get("/touchpoints/{item_id}")
def get_touchpoint(item_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialTouchpoint, item_id)
    if not row:
        raise HTTPException(404, "Touchpoint not found")
    return comercial_touchpoint_out(row)


@router.post("/touchpoints/", status_code=201)
def create_touchpoint(body: ComercialTouchpointCreate, db: Session = Depends(get_db)):
    # Auto-assign next order within the phase
    max_order = db.query(ComercialTouchpoint).filter(
        ComercialTouchpoint.phase_id == body.phase_id
    ).count()
    data = body.model_dump()
    if data["order"] == 0:
        data["order"] = max_order + 1
    row = ComercialTouchpoint(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return comercial_touchpoint_out(row)


@router.patch("/touchpoints/{item_id}")
def update_touchpoint(item_id: int, body: ComercialTouchpointUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialTouchpoint, item_id)
    if not row:
        raise HTTPException(404, "Touchpoint not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return comercial_touchpoint_out(row)


@router.post("/touchpoints/reorder")
def reorder_touchpoints(body: ComercialTouchpointReorderRequest, db: Session = Depends(get_db)):
    """Reasigna order=índice a los touchpoints listados, dentro de phase_id."""
    if not db.get(ComercialPhase, body.phase_id):
        raise HTTPException(404, f"Fase '{body.phase_id}' no existe")
    missing = [tp_id for tp_id in body.ids if not db.get(ComercialTouchpoint, tp_id)]
    if missing:
        raise HTTPException(404, f"Touchpoints no encontrados: {missing}")
    for idx, tp_id in enumerate(body.ids):
        row = db.get(ComercialTouchpoint, tp_id)
        row.order = idx
        if row.phase_id != body.phase_id:
            row.phase_id = body.phase_id
    db.commit()
    rows = db.query(ComercialTouchpoint).filter(
        ComercialTouchpoint.phase_id == body.phase_id
    ).order_by(ComercialTouchpoint.order).all()
    return [comercial_touchpoint_out(r) for r in rows]


@router.delete("/touchpoints/{item_id}")
def delete_touchpoint(item_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialTouchpoint, item_id)
    if not row:
        raise HTTPException(404, "Touchpoint not found")
    db.query(ComercialKpiTouchpoint).filter(ComercialKpiTouchpoint.touchpoint_id == item_id).delete()
    db.query(ComercialTouchpointFlow).filter(
        (ComercialTouchpointFlow.from_touchpoint_id == item_id) |
        (ComercialTouchpointFlow.to_touchpoint_id == item_id)
    ).delete(synchronize_session=False)
    db.query(ComercialCanvasLayout).filter(
        ComercialCanvasLayout.entity_type == "touchpoint",
        ComercialCanvasLayout.entity_id == str(item_id),
    ).delete(synchronize_session=False)
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── Frictions ────────────────────────────────────────────────

@router.get("/frictions/")
def list_frictions(impact: str = None, status: str = None, overdue: bool = None, db: Session = Depends(get_db)):
    q = db.query(ComercialFriction)
    if impact:
        q = q.filter(ComercialFriction.impact == impact)
    if status:
        q = q.filter(ComercialFriction.status == status)
    results = [comercial_friction_out(r) for r in q.all()]
    if overdue:
        results = [r for r in results if r["is_overdue"]]
    return results


@router.get("/frictions/{item_id}")
def get_friction(item_id: str, db: Session = Depends(get_db)):
    row = db.get(ComercialFriction, item_id)
    if not row:
        raise HTTPException(404, "Friction not found")
    return comercial_friction_out(row)


@router.post("/frictions/", status_code=201)
def create_friction(body: ComercialFrictionCreate, db: Session = Depends(get_db)):
    existing = db.get(ComercialFriction, body.id)
    if existing:
        raise HTTPException(409, f"Friction {body.id} already exists")
    data = body.model_dump()
    if data.get("deadline"):
        data["deadline"] = date.fromisoformat(data["deadline"])
    if data.get("resolution_checklist") is None:
        data["resolution_checklist"] = []
    _validate_touchpoint_for_friction(db, data["phase_id"], data.get("touchpoint_id"))
    row = ComercialFriction(**data)
    db.add(row)
    log = ComercialActivityLog(
        entity_type="friction", entity_id=body.id,
        action="created", new_value=body.name,
        detail=f"Fricción {body.id} creada: {body.name}",
    )
    db.add(log)
    db.commit()
    db.refresh(row)
    return comercial_friction_out(row)


@router.patch("/frictions/{item_id}")
def update_friction(item_id: str, body: ComercialFrictionUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialFriction, item_id)
    if not row:
        raise HTTPException(404, "Friction not found")

    data = body.model_dump(exclude_unset=True)
    old_status = row.status

    if "deadline" in data:
        data["deadline"] = date.fromisoformat(data["deadline"]) if data["deadline"] else None

    phase_after = data.get("phase_id", row.phase_id)
    tp_after = data["touchpoint_id"] if "touchpoint_id" in data else row.touchpoint_id
    _validate_touchpoint_for_friction(db, phase_after, tp_after)

    for k, v in data.items():
        setattr(row, k, v)

    if "responsable_id" in data:
        pid = row.responsable_id
        if pid:
            person = db.get(ComercialPerson, pid)
            if person:
                row.responsable = person.name
        else:
            row.responsable = ""

    # Handle status changes
    new_status = data.get("status")
    if new_status and new_status != old_status:
        if new_status == "completed":
            row.completed_at = datetime.now()
        elif old_status == "completed":
            row.completed_at = None

        log = ComercialActivityLog(
            entity_type="friction", entity_id=item_id,
            action="status_change", old_value=old_status,
            new_value=new_status, detail=f"Fricción {item_id} cambió de {old_status} a {new_status}",
        )
        db.add(log)

    if "responsable" in data:
        log = ComercialActivityLog(
            entity_type="friction", entity_id=item_id,
            action="assignee_change", new_value=data["responsable"],
            detail=f"Responsable asignado: {data['responsable']}",
        )
        db.add(log)

    db.commit()
    db.refresh(row)
    return comercial_friction_out(row)


@router.delete("/frictions/{item_id}")
def delete_friction(item_id: str, db: Session = Depends(get_db)):
    row = db.get(ComercialFriction, item_id)
    if not row:
        raise HTTPException(404, "Friction not found")
    db.query(ComercialKpiFriction).filter(ComercialKpiFriction.friction_id == item_id).delete()
    db.query(ComercialComment).filter(
        ComercialComment.entity_type == "friction",
        ComercialComment.entity_id == item_id,
    ).delete()
    db.query(ComercialCanvasLayout).filter(
        ComercialCanvasLayout.entity_type == "friction",
        ComercialCanvasLayout.entity_id == item_id,
    ).delete(synchronize_session=False)
    log = ComercialActivityLog(
        entity_type="friction", entity_id=item_id,
        action="deleted", old_value=row.name,
        detail=f"Fricción {item_id} eliminada: {row.name}",
    )
    db.add(log)
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── Comments ─────────────────────────────────────────────────

@router.get("/comments/")
def list_comments(entity_type: str = None, entity_id: str = None, db: Session = Depends(get_db)):
    q = db.query(ComercialComment).order_by(ComercialComment.created_at.asc())
    if entity_type:
        q = q.filter(ComercialComment.entity_type == entity_type)
    if entity_id:
        q = q.filter(ComercialComment.entity_id == entity_id)
    return [comercial_comment_out(r) for r in q.all()]


@router.post("/comments/", status_code=201)
def create_comment(body: ComercialCommentCreate, db: Session = Depends(get_db)):
    row = ComercialComment(**body.model_dump())
    db.add(row)
    log = ComercialActivityLog(
        entity_type=body.entity_type, entity_id=body.entity_id,
        action="comment_added", detail=body.text[:200],
    )
    db.add(log)
    db.commit()
    db.refresh(row)
    return comercial_comment_out(row)


@router.delete("/comments/{item_id}")
def delete_comment(item_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialComment, item_id)
    if not row:
        raise HTTPException(404, "Comment not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── Trust Pillars ────────────────────────────────────────────

@router.get("/trust-pillars/")
def list_trust_pillars(db: Session = Depends(get_db)):
    return [comercial_trust_pillar_out(r) for r in db.query(ComercialTrustPillar).order_by(ComercialTrustPillar.order).all()]


@router.patch("/trust-pillars/{item_id}")
def update_trust_pillar(item_id: str, body: ComercialTrustPillarUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialTrustPillar, item_id)
    if not row:
        raise HTTPException(404, "Trust pillar not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return comercial_trust_pillar_out(row)


# ── Iniciativas Comerciales ──────────────────────────────────

@router.get("/iniciativas/")
def list_iniciativas(status: str = None, responsable_id: int = None, db: Session = Depends(get_db)):
    q = db.query(ComercialInitiative).order_by(ComercialInitiative.due_date.asc(), ComercialInitiative.id.desc())
    if status:
        q = q.filter(ComercialInitiative.status == status)
    if responsable_id is not None:
        q = q.filter(ComercialInitiative.responsable_id == responsable_id)
    links_map = _initiative_links_map(db)
    return [comercial_initiative_out(r, links_map.get(r.id, {})) for r in q.all()]


_LINK_KEYS = {"friction_ids", "touchpoint_ids", "pillar_ids", "involved_ids", "depends_on_ids"}


@router.post("/iniciativas/", status_code=201)
def create_iniciativa(body: ComercialInitiativeCreate, db: Session = Depends(get_db)):
    data = body.model_dump()
    if data.get("due_date"):
        data["due_date"] = date.fromisoformat(data["due_date"])
    _normalize_iniciativa_scope(db, data)
    link_data = {k: data.pop(k) for k in list(data.keys()) if k in _LINK_KEYS}
    # Backfill single FK -> M:N convenience
    if data.get("pillar_id") and link_data.get("pillar_ids") is None:
        link_data["pillar_ids"] = [data["pillar_id"]]
    if data.get("touchpoint_id") and link_data.get("touchpoint_ids") is None:
        link_data["touchpoint_ids"] = [data["touchpoint_id"]]
    row = ComercialInitiative(**data)
    db.add(row)
    db.flush()
    _sync_initiative_links(db, row.id, link_data)
    db.add(ComercialActivityLog(
        entity_type="iniciativa",
        entity_id=str(row.id),
        action="created",
        new_value=row.status,
        detail=f"Iniciativa creada: {row.title}",
    ))
    db.commit()
    db.refresh(row)
    return comercial_initiative_out(row, _initiative_links_for(db, row.id))


@router.patch("/iniciativas/{item_id}")
def update_iniciativa(item_id: int, body: ComercialInitiativeUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialInitiative, item_id)
    if not row:
        raise HTTPException(404, "Initiative not found")

    data = body.model_dump(exclude_unset=True)
    old_status = row.status
    old_responsable_id = row.responsable_id
    if "due_date" in data:
        data["due_date"] = date.fromisoformat(data["due_date"]) if data["due_date"] else None
    link_data = {k: data.pop(k) for k in list(data.keys()) if k in _LINK_KEYS}
    normalized = {
        "phase_id": data.get("phase_id", row.phase_id),
        "touchpoint_id": data.get("touchpoint_id", row.touchpoint_id),
    }
    _normalize_iniciativa_scope(db, normalized)
    if "phase_id" in data or "touchpoint_id" in data:
        data["phase_id"] = normalized["phase_id"]
        data["touchpoint_id"] = normalized["touchpoint_id"]
    for k, v in data.items():
        setattr(row, k, v)
    _sync_initiative_links(db, item_id, link_data)

    if "status" in data and row.status != old_status:
        db.add(ComercialActivityLog(
            entity_type="iniciativa",
            entity_id=str(item_id),
            action="status_change",
            old_value=old_status,
            new_value=row.status,
            detail=f"Iniciativa {item_id} cambió de {old_status} a {row.status}",
        ))
    if "responsable_id" in data and row.responsable_id != old_responsable_id:
        db.add(ComercialActivityLog(
            entity_type="iniciativa",
            entity_id=str(item_id),
            action="assignee_change",
            old_value=str(old_responsable_id) if old_responsable_id else "",
            new_value=str(row.responsable_id) if row.responsable_id else "",
            detail=f"Responsable actualizado para iniciativa {item_id}",
        ))
    db.commit()
    db.refresh(row)
    return comercial_initiative_out(row, _initiative_links_for(db, row.id))


@router.delete("/iniciativas/{item_id}")
def delete_iniciativa(item_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialInitiative, item_id)
    if not row:
        raise HTTPException(404, "Initiative not found")
    db.add(ComercialActivityLog(
        entity_type="iniciativa",
        entity_id=str(item_id),
        action="deleted",
        old_value=row.status,
        detail=f"Iniciativa eliminada: {row.title}",
    ))
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── KPIs ─────────────────────────────────────────────────────

@router.get("/kpis/")
def list_kpis(db: Session = Depends(get_db)):
    return [comercial_kpi_out(r) for r in db.query(ComercialKpi).all()]


@router.post("/kpis/", status_code=201)
def create_kpi(body: ComercialKpiCreate, db: Session = Depends(get_db)):
    existing = db.get(ComercialKpi, body.id)
    if existing:
        return comercial_kpi_out(existing)
    row = ComercialKpi(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return comercial_kpi_out(row)


@router.patch("/kpis/{item_id}")
def update_kpi(item_id: str, body: ComercialKpiUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialKpi, item_id)
    if not row:
        raise HTTPException(404, "KPI not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return comercial_kpi_out(row)


# ── Activity Log ─────────────────────────────────────────────

@router.get("/activity-log/")
def list_activity_log(entity: str = None, entity_id: str = None, db: Session = Depends(get_db)):
    q = db.query(ComercialActivityLog).order_by(ComercialActivityLog.created_at.desc())
    if entity:
        q = q.filter(ComercialActivityLog.entity_type == entity)
    if entity_id:
        q = q.filter(ComercialActivityLog.entity_id == entity_id)
    return [comercial_activity_log_out(r) for r in q.limit(50).all()]


# ── People ───────────────────────────────────────────────────

@router.get("/people/")
def list_people(area: str = None, active: bool = None, db: Session = Depends(get_db)):
    q = db.query(ComercialPerson).order_by(ComercialPerson.order)
    if area:
        q = q.filter(ComercialPerson.area == area)
    if active is not None:
        q = q.filter(ComercialPerson.is_active == active)
    return [comercial_person_out(r) for r in q.all()]


@router.get("/people/{item_id}")
def get_person(item_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialPerson, item_id)
    if not row:
        raise HTTPException(404, "Person not found")
    d = comercial_person_out(row)
    # Add summary stats
    frictions = db.query(ComercialFriction).filter(ComercialFriction.responsable_id == item_id).all()
    d["frictions_total"] = len(frictions)
    d["frictions_completed"] = sum(1 for f in frictions if f.status == "completed")
    d["frictions_in_progress"] = sum(1 for f in frictions if f.status == "in_progress")
    d["frictions_overdue"] = sum(1 for f in frictions if f.status != "completed" and f.deadline and f.deadline < date.today())
    d["touchpoints_owned"] = db.query(ComercialTouchpoint).filter(ComercialTouchpoint.responsable_id == item_id).count()
    return d


@router.post("/people/", status_code=201)
def create_person(body: ComercialPersonCreate, db: Session = Depends(get_db)):
    row = ComercialPerson(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return comercial_person_out(row)


@router.patch("/people/{item_id}")
def update_person(item_id: int, body: ComercialPersonUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialPerson, item_id)
    if not row:
        raise HTTPException(404, "Person not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return comercial_person_out(row)


@router.delete("/people/{item_id}")
def delete_person(item_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialPerson, item_id)
    if not row:
        raise HTTPException(404, "Person not found")
    row.is_active = False
    db.commit()
    return {"ok": True}


# ── KPI History ──────────────────────────────────────────────

@router.get("/kpis/{kpi_id}/history")
def kpi_history(kpi_id: str, db: Session = Depends(get_db)):
    rows = db.query(ComercialKpiHistory).filter(
        ComercialKpiHistory.kpi_id == kpi_id
    ).order_by(ComercialKpiHistory.recorded_at.desc()).all()
    return [comercial_kpi_history_out(r) for r in rows]


@router.post("/kpis/{kpi_id}/history", status_code=201)
def record_kpi_value(kpi_id: str, body: ComercialKpiHistoryCreate, db: Session = Depends(get_db)):
    kpi = db.get(ComercialKpi, kpi_id)
    if not kpi:
        raise HTTPException(404, "KPI not found")
    period = body.period or date.today().strftime("%Y-%m")
    row = ComercialKpiHistory(kpi_id=kpi_id, value=body.value, period=period, notes=body.notes)
    db.add(row)
    kpi.current_value = body.value
    db.commit()
    db.refresh(row)
    return comercial_kpi_history_out(row)


# ── KPI-Friction Links ──────────────────────────────────────

@router.get("/kpis/{kpi_id}/frictions")
def kpi_frictions(kpi_id: str, db: Session = Depends(get_db)):
    links = db.query(ComercialKpiFriction).filter(ComercialKpiFriction.kpi_id == kpi_id).all()
    friction_ids = [l.friction_id for l in links]
    frictions = [comercial_friction_out(f) for f in db.query(ComercialFriction).filter(ComercialFriction.id.in_(friction_ids)).all()] if friction_ids else []
    return frictions


@router.post("/kpis/{kpi_id}/frictions", status_code=201)
def link_kpi_friction(kpi_id: str, body: ComercialKpiFrictionLink, db: Session = Depends(get_db)):
    existing = db.query(ComercialKpiFriction).filter(
        ComercialKpiFriction.kpi_id == kpi_id,
        ComercialKpiFriction.friction_id == body.friction_id,
    ).first()
    if existing:
        return {"kpi_id": kpi_id, "friction_id": body.friction_id}
    row = ComercialKpiFriction(kpi_id=kpi_id, friction_id=body.friction_id)
    db.add(row)
    db.commit()
    return {"kpi_id": kpi_id, "friction_id": body.friction_id}


@router.get("/frictions/{friction_id}/kpis")
def friction_kpis(friction_id: str, db: Session = Depends(get_db)):
    row = db.get(ComercialFriction, friction_id)
    if not row:
        raise HTTPException(404, "Friction not found")
    links = db.query(ComercialKpiFriction).filter(ComercialKpiFriction.friction_id == friction_id).all()
    return [{"kpi_id": l.kpi_id, "friction_id": l.friction_id} for l in links]


@router.put("/frictions/{friction_id}/kpis")
def set_friction_kpis(
    friction_id: str,
    kpi_ids: list[str] = Body(...),
    db: Session = Depends(get_db),
):
    row = db.get(ComercialFriction, friction_id)
    if not row:
        raise HTTPException(404, "Friction not found")
    db.query(ComercialKpiFriction).filter(ComercialKpiFriction.friction_id == friction_id).delete()
    for kid in kpi_ids:
        db.add(ComercialKpiFriction(kpi_id=kid, friction_id=friction_id))
    db.commit()
    return [{"kpi_id": kid, "friction_id": friction_id} for kid in kpi_ids]


@router.delete("/kpis/{kpi_id}/frictions/{friction_id}")
def unlink_kpi_friction(kpi_id: str, friction_id: str, db: Session = Depends(get_db)):
    row = db.query(ComercialKpiFriction).filter(
        ComercialKpiFriction.kpi_id == kpi_id,
        ComercialKpiFriction.friction_id == friction_id,
    ).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}


# ── Touchpoint-KPI Links ─────────────────────────────────────

@router.get("/touchpoints/{tp_id}/kpis")
def touchpoint_kpis(tp_id: int, db: Session = Depends(get_db)):
    links = db.query(ComercialKpiTouchpoint).filter(ComercialKpiTouchpoint.touchpoint_id == tp_id).all()
    return [{"kpi_id": l.kpi_id, "touchpoint_id": l.touchpoint_id} for l in links]


@router.post("/touchpoints/{tp_id}/kpis", status_code=201)
def link_touchpoint_kpi(tp_id: int, body: ComercialKpiFrictionLink, db: Session = Depends(get_db)):
    # Reuse friction_id field as kpi_id from the body (it's just a string ID)
    kpi_id = body.friction_id  # repurpose schema field
    existing = db.query(ComercialKpiTouchpoint).filter(
        ComercialKpiTouchpoint.kpi_id == kpi_id,
        ComercialKpiTouchpoint.touchpoint_id == tp_id,
    ).first()
    if existing:
        return {"kpi_id": kpi_id, "touchpoint_id": tp_id}
    row = ComercialKpiTouchpoint(kpi_id=kpi_id, touchpoint_id=tp_id)
    db.add(row)
    db.commit()
    return {"kpi_id": kpi_id, "touchpoint_id": tp_id}


@router.delete("/touchpoints/{tp_id}/kpis/{kpi_id}")
def unlink_touchpoint_kpi(tp_id: int, kpi_id: str, db: Session = Depends(get_db)):
    row = db.query(ComercialKpiTouchpoint).filter(
        ComercialKpiTouchpoint.kpi_id == kpi_id,
        ComercialKpiTouchpoint.touchpoint_id == tp_id,
    ).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}


@router.put("/touchpoints/{tp_id}/kpis")
def set_touchpoint_kpis(tp_id: int, kpi_ids: list[str], db: Session = Depends(get_db)):
    """Replace all KPI links for a touchpoint with the given list."""
    db.query(ComercialKpiTouchpoint).filter(ComercialKpiTouchpoint.touchpoint_id == tp_id).delete()
    for kid in kpi_ids:
        db.add(ComercialKpiTouchpoint(kpi_id=kid, touchpoint_id=tp_id))
    db.commit()
    return [{"kpi_id": kid, "touchpoint_id": tp_id} for kid in kpi_ids]


# ── Touchpoint-KPI Config (critical / local overrides) ──────

@router.patch("/touchpoints/{tp_id}/kpis/{kpi_id}/config")
def update_tp_kpi_config(
    tp_id: int,
    kpi_id: str,
    body: ComercialTpKpiConfigUpdate,
    db: Session = Depends(get_db),
):
    link = db.query(ComercialKpiTouchpoint).filter(
        ComercialKpiTouchpoint.touchpoint_id == tp_id,
        ComercialKpiTouchpoint.kpi_id == kpi_id,
    ).first()
    if not link:
        raise HTTPException(404, "Touchpoint-KPI link not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(link, k, v)
    db.commit()
    db.refresh(link)
    return {
        "id": link.id, "kpi_id": link.kpi_id, "touchpoint_id": link.touchpoint_id,
        "is_critical": link.is_critical, "target_value_local": link.target_value_local,
        "responsable_id": link.responsable_id,
    }


# ── Touchpoint-KPI Measurement (periodic capture) ───────────

@router.get("/touchpoints/{tp_id}/kpis/{kpi_id}/history")
def tp_kpi_history(tp_id: int, kpi_id: str, db: Session = Depends(get_db)):
    rows = db.query(ComercialTpKpiHistory).filter(
        ComercialTpKpiHistory.touchpoint_id == tp_id,
        ComercialTpKpiHistory.kpi_id == kpi_id,
    ).order_by(ComercialTpKpiHistory.recorded_at.desc()).all()
    return [{
        "id": r.id, "kpi_id": r.kpi_id, "touchpoint_id": r.touchpoint_id,
        "value": r.value, "notes": r.notes, "author": r.author,
        "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
    } for r in rows]


@router.post("/touchpoints/{tp_id}/kpis/{kpi_id}/history", status_code=201)
def record_tp_kpi_value(
    tp_id: int,
    kpi_id: str,
    body: ComercialTpKpiMeasurement,
    db: Session = Depends(get_db),
):
    link = db.query(ComercialKpiTouchpoint).filter(
        ComercialKpiTouchpoint.touchpoint_id == tp_id,
        ComercialKpiTouchpoint.kpi_id == kpi_id,
    ).first()
    if not link:
        raise HTTPException(404, "Touchpoint-KPI link not found")
    row = ComercialTpKpiHistory(
        kpi_id=kpi_id, touchpoint_id=tp_id,
        value=body.value, notes=body.notes, author=body.author,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id, "kpi_id": row.kpi_id, "touchpoint_id": row.touchpoint_id,
        "value": row.value, "notes": row.notes, "author": row.author,
        "recorded_at": row.recorded_at.isoformat() if row.recorded_at else None,
    }


# ── KPI Seguimiento: pendientes por responsable ─────────────

def _frequency_days(freq: str) -> int:
    return {"daily": 1, "weekly": 7, "biweekly": 14, "monthly": 30}.get(freq, 30)


@router.get("/kpis/seguimiento")
def kpi_seguimiento(responsable_id: int = None, db: Session = Depends(get_db)):
    """Returns all critical tp-kpi combos with capture status (on-time / due / overdue)."""
    kpis = {k.id: k for k in db.query(ComercialKpi).all()}
    links = db.query(ComercialKpiTouchpoint).filter(ComercialKpiTouchpoint.is_critical == True).all()  # noqa: E712
    touchpoints = {t.id: t for t in db.query(ComercialTouchpoint).all()}
    all_history = db.query(ComercialTpKpiHistory).all()

    history_map: dict[tuple, datetime | None] = {}
    for h in all_history:
        key = (h.touchpoint_id, h.kpi_id)
        prev = history_map.get(key)
        if prev is None or (h.recorded_at and h.recorded_at > prev):
            history_map[key] = h.recorded_at

    now = datetime.now()
    results = []
    for link in links:
        kpi = kpis.get(link.kpi_id)
        tp = touchpoints.get(link.touchpoint_id)
        if not kpi or not tp:
            continue
        effective_resp = link.responsable_id or tp.responsable_id or kpi.owner_id
        if responsable_id is not None and effective_resp != responsable_id:
            continue
        last_capture = history_map.get((link.touchpoint_id, link.kpi_id))
        freq_days = _frequency_days(kpi.frequency or "monthly")
        grace = kpi.grace_days if kpi.grace_days is not None else 3

        if last_capture:
            days_since = (now - last_capture).total_seconds() / 86400.0
            if days_since <= freq_days:
                capture_status = "on_time"
            elif days_since <= freq_days + grace:
                capture_status = "due"
            else:
                capture_status = "overdue"
            days_until_due = round(freq_days - days_since, 1)
        else:
            capture_status = "overdue"
            days_until_due = None

        effective_target = link.target_value_local if link.target_value_local is not None else kpi.target_value
        latest_value = None
        for h in all_history:
            if h.touchpoint_id == link.touchpoint_id and h.kpi_id == link.kpi_id:
                if latest_value is None or (h.recorded_at and (not latest_value[1] or h.recorded_at > latest_value[1])):
                    latest_value = (h.value, h.recorded_at)
        current_val = latest_value[0] if latest_value else kpi.current_value
        pct_target = round((current_val / effective_target) * 100, 1) if effective_target and current_val is not None else None

        results.append({
            "touchpoint_id": link.touchpoint_id,
            "touchpoint_name": tp.name,
            "phase_id": tp.phase_id,
            "kpi_id": link.kpi_id,
            "kpi_name": kpi.name,
            "unit": kpi.unit,
            "frequency": kpi.frequency or "monthly",
            "current_value": current_val,
            "target_value": effective_target,
            "pct_target": pct_target,
            "capture_status": capture_status,
            "days_until_due": days_until_due,
            "last_capture": last_capture.isoformat() if last_capture else None,
            "responsable_id": effective_resp,
            "is_critical": True,
        })

    return results


# ── Canvas layout (Mapa Visual) ──────────────────────────────

@router.get("/canvas-layout/")
def list_canvas_layout(view_id: str = "comercial_main", db: Session = Depends(get_db)):
    rows = db.query(ComercialCanvasLayout).filter(ComercialCanvasLayout.view_id == view_id).all()
    return [comercial_canvas_layout_out(r) for r in rows]


@router.post("/canvas-layout/bulk")
def upsert_canvas_layout_bulk(body: ComercialCanvasLayoutBulk, db: Session = Depends(get_db)):
    """Upsert por (view_id, entity_type, entity_id)."""
    view_id = body.view_id or "comercial_main"
    for item in body.items:
        existing = db.query(ComercialCanvasLayout).filter_by(
            view_id=view_id,
            entity_type=item.entity_type,
            entity_id=item.entity_id,
        ).first()
        if existing:
            existing.x = item.x
            existing.y = item.y
            if item.width is not None:
                existing.width = item.width
            if item.height is not None:
                existing.height = item.height
        else:
            db.add(ComercialCanvasLayout(
                view_id=view_id,
                entity_type=item.entity_type,
                entity_id=item.entity_id,
                x=item.x,
                y=item.y,
                width=item.width,
                height=item.height,
            ))
    db.commit()
    rows = db.query(ComercialCanvasLayout).filter(ComercialCanvasLayout.view_id == view_id).all()
    return [comercial_canvas_layout_out(r) for r in rows]


# ── Canvas Notes (notas libres en el Mapa Visual) ──────────────

@router.get("/canvas-notes/")
def list_canvas_notes(db: Session = Depends(get_db)):
    rows = db.query(ComercialCanvasNote).all()
    return [comercial_canvas_note_out(r) for r in rows]


@router.post("/canvas-notes/", status_code=201)
def create_canvas_note(body: ComercialCanvasNoteCreate, db: Session = Depends(get_db)):
    note = ComercialCanvasNote(text=body.text or "", color=body.color or "yellow")
    db.add(note)
    db.commit()
    db.refresh(note)
    return comercial_canvas_note_out(note)


@router.patch("/canvas-notes/{note_id}")
def update_canvas_note(note_id: int, body: ComercialCanvasNoteUpdate, db: Session = Depends(get_db)):
    note = db.query(ComercialCanvasNote).filter(ComercialCanvasNote.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    if body.text is not None:
        note.text = body.text
    if body.color is not None:
        note.color = body.color
    db.commit()
    db.refresh(note)
    return comercial_canvas_note_out(note)


@router.delete("/canvas-notes/{note_id}")
def delete_canvas_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(ComercialCanvasNote).filter(ComercialCanvasNote.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    db.delete(note)
    db.query(ComercialCanvasLayout).filter(
        ComercialCanvasLayout.entity_type == "note",
        ComercialCanvasLayout.entity_id == str(note_id),
    ).delete(synchronize_session=False)
    db.commit()
    return {"ok": True}


# ── Touchpoint Flows (journey editable con bifurcaciones) ──────

@router.get("/touchpoint-flows/")
def list_touchpoint_flows(db: Session = Depends(get_db)):
    rows = db.query(ComercialTouchpointFlow).order_by(ComercialTouchpointFlow.order, ComercialTouchpointFlow.id).all()
    return [comercial_touchpoint_flow_out(r) for r in rows]


@router.post("/touchpoint-flows/", status_code=201)
def create_touchpoint_flow(body: ComercialTouchpointFlowCreate, db: Session = Depends(get_db)):
    if body.from_touchpoint_id == body.to_touchpoint_id:
        raise HTTPException(422, "from y to no pueden ser el mismo touchpoint")
    if not db.get(ComercialTouchpoint, body.from_touchpoint_id) or not db.get(ComercialTouchpoint, body.to_touchpoint_id):
        raise HTTPException(404, "Touchpoint no existe")
    existing = db.query(ComercialTouchpointFlow).filter_by(
        from_touchpoint_id=body.from_touchpoint_id,
        to_touchpoint_id=body.to_touchpoint_id,
    ).first()
    if existing:
        return comercial_touchpoint_flow_out(existing)
    row = ComercialTouchpointFlow(
        from_touchpoint_id=body.from_touchpoint_id,
        to_touchpoint_id=body.to_touchpoint_id,
        label=body.label,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return comercial_touchpoint_flow_out(row)


@router.patch("/touchpoint-flows/{flow_id}")
def update_touchpoint_flow(flow_id: int, body: ComercialTouchpointFlowUpdate, db: Session = Depends(get_db)):
    row = db.get(ComercialTouchpointFlow, flow_id)
    if not row:
        raise HTTPException(404, "Flow not found")
    if body.label is not None:
        row.label = body.label
    if body.order is not None:
        row.order = body.order
    db.commit()
    db.refresh(row)
    return comercial_touchpoint_flow_out(row)


@router.delete("/touchpoint-flows/{flow_id}")
def delete_touchpoint_flow(flow_id: int, db: Session = Depends(get_db)):
    row = db.get(ComercialTouchpointFlow, flow_id)
    if not row:
        raise HTTPException(404, "Flow not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── Canvas Link (drag-to-link genérico) ────────────────────────

def _normalize_link(from_type: str, from_id: str, to_type: str, to_id: str):
    """Normalize a link request to (parent_type, parent_id, child_type, child_id).

    Valid pairs (any order):
      touchpoint <-> friction
      friction   <-> initiative
      touchpoint <-> initiative
    """
    pair = tuple(sorted([from_type, to_type]))
    valid = {
        ("friction", "touchpoint"),
        ("friction", "initiative"),
        ("initiative", "touchpoint"),
    }
    if pair not in valid:
        return None
    mapping = {from_type: from_id, to_type: to_id}
    return pair, mapping


@router.post("/canvas-link")
def create_canvas_link(body: ComercialCanvasLinkRequest, db: Session = Depends(get_db)):
    norm = _normalize_link(body.from_type, body.from_id, body.to_type, body.to_id)
    if norm is None:
        raise HTTPException(422, f"Invalid link pair: {body.from_type}↔{body.to_type}")
    pair, ids = norm

    if pair == ("friction", "touchpoint"):
        f = db.query(ComercialFriction).filter(ComercialFriction.id == ids["friction"]).first()
        tp = db.query(ComercialTouchpoint).filter(ComercialTouchpoint.id == int(ids["touchpoint"])).first()
        if not f or not tp:
            raise HTTPException(404, "Friction or touchpoint not found")
        f.touchpoint_id = tp.id
        db.commit()
        return {"ok": True, "type": "tp_friction", "friction_id": f.id, "touchpoint_id": tp.id}

    if pair == ("friction", "initiative"):
        existing = db.query(ComercialInitiativeFriction).filter_by(
            initiative_id=int(ids["initiative"]), friction_id=ids["friction"]
        ).first()
        if not existing:
            db.add(ComercialInitiativeFriction(
                initiative_id=int(ids["initiative"]), friction_id=ids["friction"]
            ))
            db.commit()
        return {"ok": True, "type": "ini_friction", "initiative_id": int(ids["initiative"]), "friction_id": ids["friction"]}

    if pair == ("initiative", "touchpoint"):
        existing = db.query(ComercialInitiativeTouchpoint).filter_by(
            initiative_id=int(ids["initiative"]), touchpoint_id=int(ids["touchpoint"])
        ).first()
        if not existing:
            db.add(ComercialInitiativeTouchpoint(
                initiative_id=int(ids["initiative"]), touchpoint_id=int(ids["touchpoint"])
            ))
            db.commit()
        return {"ok": True, "type": "ini_touchpoint", "initiative_id": int(ids["initiative"]), "touchpoint_id": int(ids["touchpoint"])}

    raise HTTPException(422, "Unsupported link pair")


@router.delete("/canvas-link")
def delete_canvas_link(body: ComercialCanvasLinkRequest, db: Session = Depends(get_db)):
    norm = _normalize_link(body.from_type, body.from_id, body.to_type, body.to_id)
    if norm is None:
        raise HTTPException(422, f"Invalid link pair: {body.from_type}↔{body.to_type}")
    pair, ids = norm

    if pair == ("friction", "touchpoint"):
        f = db.query(ComercialFriction).filter(ComercialFriction.id == ids["friction"]).first()
        if f and f.touchpoint_id == int(ids["touchpoint"]):
            f.touchpoint_id = None
            db.commit()
        return {"ok": True}

    if pair == ("friction", "initiative"):
        db.query(ComercialInitiativeFriction).filter_by(
            initiative_id=int(ids["initiative"]), friction_id=ids["friction"]
        ).delete()
        db.commit()
        return {"ok": True}

    if pair == ("initiative", "touchpoint"):
        db.query(ComercialInitiativeTouchpoint).filter_by(
            initiative_id=int(ids["initiative"]), touchpoint_id=int(ids["touchpoint"])
        ).delete()
        db.commit()
        return {"ok": True}

    raise HTTPException(422, "Unsupported link pair")


@router.get("/kpis/compliance-summary")
def kpi_compliance_summary(db: Session = Depends(get_db)):
    """Executive summary: capture discipline + target performance."""
    items = kpi_seguimiento(db=db)
    total = len(items)
    on_time = sum(1 for i in items if i["capture_status"] == "on_time")
    due = sum(1 for i in items if i["capture_status"] == "due")
    overdue = sum(1 for i in items if i["capture_status"] == "overdue")
    at_risk = sum(1 for i in items if i["pct_target"] is not None and i["pct_target"] < 70)
    on_track = sum(1 for i in items if i["pct_target"] is not None and i["pct_target"] >= 70)
    return {
        "total_critical_kpis": total,
        "capture_on_time": on_time,
        "capture_due": due,
        "capture_overdue": overdue,
        "capture_pct": round((on_time / total) * 100) if total else 0,
        "performance_at_risk": at_risk,
        "performance_on_track": on_track,
    }
