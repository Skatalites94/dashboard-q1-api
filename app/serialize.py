from app.models import (
    AreaResumen, CategoriaGasto, ComercialActivityLog, ComercialCanvasLayout,
    ComercialCanvasNote, ComercialComment, ComercialTouchpointFlow,
    ComercialFriction, ComercialInitiative, ComercialKpi, ComercialKpiFriction, ComercialKpiHistory,
    ComercialPerson, ComercialPhase, ComercialTouchpoint, ComercialTrustPillar,
    Consultoria, Deal, Empleado, Escenario,
    EscenarioIngreso, GastoFinanciero, GastoOperativo, Iniciativa, KpiMeta,
    Semaforo, SimAsesor, SimConfig, SimTipoCliente, Suscripcion,
)


def comercial_touchpoint_flow_out(row: ComercialTouchpointFlow) -> dict:
    return {
        "id": row.id,
        "from_touchpoint_id": row.from_touchpoint_id,
        "to_touchpoint_id": row.to_touchpoint_id,
        "label": row.label,
        "order": row.order or 0,
    }


def comercial_canvas_note_out(row: ComercialCanvasNote) -> dict:
    return {
        "id": row.id,
        "text": row.text or "",
        "color": row.color or "yellow",
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def comercial_canvas_layout_out(row: ComercialCanvasLayout) -> dict:
    return {
        "id": row.id,
        "view_id": row.view_id,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "x": row.x,
        "y": row.y,
        "width": row.width,
        "height": row.height,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def deal_out(row: Deal) -> dict:
    return {
        "id": row.id,
        "a": row.asesor,
        "c": row.cuenta,
        "t": row.trato,
        "i": row.importe,
        "p": row.pct_util,
        "u": row.utilidad,
        "f": row.fecha,
        "m": row.mes,
        "tri": row.trimestre,
    }


def iniciativa_out(row: Iniciativa) -> dict:
    return {
        "id": row.id,
        "area": row.area,
        "resp": row.resp,
        "ini": row.ini,
        "pri": row.pri,
        "est": row.est,
        "av": row.av,
        "notas": row.notas,
        "trimestre": row.trimestre,
    }


def kpi_meta_out(row: KpiMeta) -> dict:
    return {"id": row.id, "kpi": row.kpi, "r25": row.r25, "m26": row.m26}


def semaforo_out(row: Semaforo) -> dict:
    return {
        "id": row.id,
        "kpi": row.kpi,
        "area": row.area,
        "resp": row.resp,
        "descripcion": row.descripcion,
        "meta": row.meta,
        "ene": row.ene,
        "feb": row.feb,
        "mar": row.mar,
        "est": row.est,
        "tendencia": row.tendencia,
        "trimestre": row.trimestre,
        "diagnostico": row.diagnostico,
        "recomendacion": row.recomendacion,
    }


def area_resumen_out(row: AreaResumen) -> dict:
    return {
        "id": row.id,
        "area": row.area,
        "resp": row.resp,
        "rol": row.rol,
        "verdes": row.verdes,
        "amarillos": row.amarillos,
        "rojos": row.rojos,
        "tendencia": row.tendencia,
        "trimestre": row.trimestre,
        "diagnostico": row.diagnostico,
        "recomendacion": row.recomendacion,
    }


# ── Módulo Gastos ──────────────────────────────────────────────

def categoria_gasto_out(row: CategoriaGasto) -> dict:
    return {"id": row.id, "nombre": row.nombre, "modulo": row.modulo, "color": row.color, "orden": row.orden}


def empleado_out(row: Empleado) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "depto": row.depto, "costo": row.costo,
        "sueldo_neto": row.sueldo_neto, "esquema": row.esquema,
        "factor_carga": row.factor_carga, "comision_pct": row.comision_pct,
        "sueldo_imss": row.sueldo_imss, "sueldo_complemento": row.sueldo_complemento,
        "cortado": row.cortado, "es_contratacion": row.es_contratacion,
        "nota": row.nota, "categoria_id": row.categoria_id,
    }


def gasto_operativo_out(row: GastoOperativo) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "categoria": row.categoria, "fijo": row.fijo, "cortado": row.cortado, "categoria_id": row.categoria_id}


def suscripcion_out(row: Suscripcion) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "frecuencia": row.frecuencia, "nota": row.nota, "cortado": row.cortado, "categoria_id": row.categoria_id, "usuarios": row.usuarios, "costo_por_usuario": row.costo_por_usuario, "es_por_usuario": row.es_por_usuario, "moneda": row.moneda, "tipo_cambio": row.tipo_cambio}


def consultoria_out(row: Consultoria) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "nota": row.nota, "cortado": row.cortado, "categoria_id": row.categoria_id}


def gasto_financiero_out(row: GastoFinanciero) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "nota": row.nota, "cortado": row.cortado, "categoria_id": row.categoria_id}


def escenario_out(row: Escenario) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "descripcion": row.descripcion,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "total_original": row.total_original, "total_nuevo": row.total_nuevo, "ahorro": row.ahorro,
        "es_base": row.es_base,
    }


def escenario_full_out(row: Escenario) -> dict:
    d = escenario_out(row)
    d["snapshot"] = row.snapshot
    return d


# ── Módulo Simulador ──────────────────────────────────────────

def sim_asesor_out(row: SimAsesor) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "tipo": row.tipo,
        "fecha_inicio": row.fecha_inicio, "cuota_mensual": row.cuota_mensual,
        "madurez_pct": row.madurez_pct, "max_tratos_mes": row.max_tratos_mes,
        "max_cartera_activa": row.max_cartera_activa,
        "activo": row.activo, "nota": row.nota,
        "horas_habiles_dia": row.horas_habiles_dia,
        "cartera_actual": row.cartera_actual or {},
    }


def sim_config_out(row: SimConfig) -> dict:
    return {"id": row.id, "clave": row.clave, "valor": row.valor}


def sim_tipo_cliente_out(row: SimTipoCliente) -> dict:
    return {
        "id": row.id, "codigo": row.codigo, "nombre": row.nombre,
        "leads_mensuales": row.leads_mensuales, "tasa_retencion": row.tasa_retencion,
        "tasa_cierre": row.tasa_cierre, "meses_cierre": row.meses_cierre,
        "ticket_promedio": row.ticket_promedio, "facturas_por_cliente": row.facturas_por_cliente,
        "clientes_iniciales": row.clientes_iniciales, "dias_credito": row.dias_credito,
        "frecuencia_compra_meses": row.frecuencia_compra_meses,
        "deals_por_anio": row.deals_por_anio,
        "horas_cotizacion": row.horas_cotizacion,
        "horas_seguimiento": row.horas_seguimiento,
        "leads_objetivo": row.leads_objetivo,
    }


def escenario_ingreso_out(row: EscenarioIngreso) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "descripcion": row.descripcion,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "ingreso_anual": row.ingreso_anual, "costo_equipo_anual": row.costo_equipo_anual,
        "utilidad_bruta": row.utilidad_bruta,
    }


def escenario_ingreso_full_out(row: EscenarioIngreso) -> dict:
    d = escenario_ingreso_out(row)
    d["snapshot"] = row.snapshot
    return d


# ── Módulo Arquitectura Comercial ────────────────────────────

def comercial_phase_out(row: ComercialPhase) -> dict:
    return {
        "id": row.id, "name": row.name, "icon": row.icon,
        "color": row.color, "description": row.description, "order": row.order,
    }


def comercial_touchpoint_out(row: ComercialTouchpoint, completeness_ctx: dict = None) -> dict:
    """Serializa un Touchpoint.

    `completeness_ctx` es un diccionario opcional con conteos pre-calculados:
        { tp_id: {"channel_count": N, "flow_count": N, "kpi_count": N} }
    Permite calcular completeness sin N+1 queries cuando se serializa una lista.
    Si no se pasa, devuelve completeness=None (se calcula fuera).
    """
    out = {
        "id": row.id, "phase_id": row.phase_id, "name": row.name,
        "canal": row.canal, "responsable": row.responsable,
        "responsable_id": row.responsable_id, "kpi": row.kpi,
        "friction_text": row.friction_text, "has_friction": row.has_friction,
        "order": row.order, "notes": row.notes,
        "description": getattr(row, "description", "") or "",
        # v13: 8 atributos formales
        "internal_checklist": getattr(row, "internal_checklist", None) or [],
        "duration_minutes": getattr(row, "duration_minutes", None),
        "duration_label": getattr(row, "duration_label", "") or "",
        "classification": getattr(row, "classification", "normal") or "normal",
        "leverage_point": getattr(row, "leverage_point", "none") or "none",
        # Optimistic locking — autoplan E5
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }
    if completeness_ctx is not None:
        ctx = completeness_ctx.get(row.id, {})
        out["completeness"] = _tp_completeness(row, ctx)
    return out


# ── Completeness contract — autoplan §3.2.1 (task #71) ───────────────────
# 8 predicados booleanos exactos. Pure function. Testeable.

_VALID_CLASSIFICATIONS = {"critical", "invisible", "redundant", "unnecessary", "normal"}


def _tp_completeness(row: ComercialTouchpoint, ctx: dict = None) -> dict:
    """Devuelve el detalle de completeness de un TP. 8 predicados booleanos.

    `ctx` debe contener (si se provee):
        - channel_count: int (rows en comercial_touchpoint_channel)
        - flow_count: int (rows en comercial_touchpoint_flow donde row.id participa)
        - kpi_count: int (rows en comercial_kpi_touchpoint)
        - responsable_active: bool (responsable_id existe y person.is_active)
    Si falta algún campo del ctx, ese predicado es False (conservador).
    """
    ctx = ctx or {}
    checks = {
        "has_name": bool(row.name and len(row.name.strip()) > 0),
        "has_phase": bool(row.phase_id),
        "has_channel": ctx.get("channel_count", 0) > 0,
        "has_responsable": bool(row.responsable_id) and ctx.get("responsable_active", False),
        "has_sequence": ctx.get("flow_count", 0) > 0,
        "has_kpi": ctx.get("kpi_count", 0) > 0,
        "has_checklist": isinstance(getattr(row, "internal_checklist", None), list)
                         and len(row.internal_checklist) >= 3,
        "has_diagnosis": getattr(row, "classification", "normal") in _VALID_CLASSIFICATIONS
                         and getattr(row, "classification", "normal") != "normal",
    }
    score = sum(1 for v in checks.values() if v)
    # Two-tier completeness — autoplan UC-3
    usable = checks["has_name"] and checks["has_phase"] and checks["has_responsable"]
    return {
        "checks": checks,
        "score": score,         # 0-8
        "total": 8,
        "is_usable": usable,    # 3-field minimum
        "is_complete": score == 8,
    }


def comercial_friction_out(row: ComercialFriction) -> dict:
    from datetime import date
    days_remaining = None
    is_overdue = False
    if row.deadline:
        days_remaining = (row.deadline - date.today()).days
        is_overdue = row.status != "completed" and row.deadline < date.today()
    return {
        "id": row.id, "phase_id": row.phase_id, "name": row.name,
        "impact": row.impact, "solution": row.solution,
        "description": getattr(row, "description", "") or "",
        "expected_outcome": row.expected_outcome, "status": row.status,
        "deadline": row.deadline.isoformat() if row.deadline else None,
        "notes": row.notes,
        "completed_at": row.completed_at.isoformat() if row.completed_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "days_remaining": days_remaining,
        "is_overdue": is_overdue,
        "responsable": row.responsable or "",
        "responsable_id": row.responsable_id,
        "touchpoint_id": row.touchpoint_id,
        "priority": row.priority or 0,
        "resolution_checklist": row.resolution_checklist if row.resolution_checklist is not None else [],
        # v13: tipo de fricción
        "friction_type": getattr(row, "friction_type", None),
        # v18: marca crítica para que AI priorice al generar iniciativas
        "is_critical": bool(getattr(row, "is_critical", False)),
    }


def comercial_trust_pillar_out(row: ComercialTrustPillar) -> dict:
    return {
        "id": row.id, "name": row.name, "icon": row.icon,
        "current_state": row.current_state, "target_state": row.target_state,
        "actions": row.actions, "status": row.status, "order": row.order,
    }


def comercial_initiative_out(row: ComercialInitiative, links: dict = None) -> dict:
    links = links or {}
    return {
        "id": row.id,
        "pillar_id": row.pillar_id,
        "title": row.title,
        "description": row.description or "",
        "motor": row.motor or "trust",
        "phase_id": row.phase_id,
        "touchpoint_id": row.touchpoint_id,
        "status": row.status,
        "responsable_id": row.responsable_id,
        "due_date": row.due_date.isoformat() if row.due_date else None,
        "target": row.target or "",
        "progress": row.progress if row.progress is not None else 0,
        "priority": row.priority or "medium",
        "area": row.area or "",
        "tipo": row.tipo or "operativa",
        "friction_ids": links.get("friction_ids", []),
        "touchpoint_ids": links.get("touchpoint_ids", []),
        "pillar_ids": links.get("pillar_ids", []),
        "involved_ids": links.get("involved_ids", []),
        "depends_on_ids": links.get("depends_on_ids", []),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def comercial_kpi_out(row: ComercialKpi) -> dict:
    return {
        "id": row.id, "name": row.name, "question": row.question,
        "current_value": row.current_value, "target_value": row.target_value,
        "unit": row.unit, "phase_id": row.phase_id, "owner_id": row.owner_id,
        "tracking_mode": row.tracking_mode or "global_only",
        "frequency": row.frequency or "monthly",
        "grace_days": row.grace_days if row.grace_days is not None else 3,
        "threshold_super_green": getattr(row, "threshold_super_green", None),
        "threshold_green": getattr(row, "threshold_green", None),
        "threshold_yellow": getattr(row, "threshold_yellow", None),
        "direction": getattr(row, "direction", "higher"),
        "is_tracked": getattr(row, "is_tracked", False),
        "desc_super_green": getattr(row, "desc_super_green", "") or "",
        "desc_green": getattr(row, "desc_green", "") or "",
        "desc_yellow": getattr(row, "desc_yellow", "") or "",
        "desc_red": getattr(row, "desc_red", "") or "",
        # v13: tag para 4 maestras
        "is_master": getattr(row, "is_master", False),
        "master_metric": getattr(row, "master_metric", None),
    }


# ── 4 maestras rollup — autoplan §6.1 (task #69) ─────────────────────────
# Contrato:
#   Para cada métrica maestra (utility, ltv, cac, conversion):
#     - drivers = lista de KPIs con is_master=True y master_metric==M
#     - score   = promedio del % logro (current/target) de los drivers
#     - color   = green ≥90, yellow ≥70, red <70 (cuando direction=higher)
#                 invertido cuando direction=lower (CAC: menor es mejor)
# Pure function. Sin queries — recibe lista pre-cargada.
_MAESTRAS = ["utility", "ltv", "cac", "conversion"]
_MAESTRA_LABELS = {
    "utility": "Utilidad",
    "ltv": "LTV",
    "cac": "CAC",
    "conversion": "Conversión",
}


def _kpi_pct_achievement(kpi_dict: dict):
    """% de logro vs target. Considera direction (higher/lower)."""
    cv = kpi_dict.get("current_value")
    tv = kpi_dict.get("target_value")
    if cv is None or tv is None or tv == 0:
        return None
    direction = kpi_dict.get("direction", "higher") or "higher"
    if direction == "lower":
        # menos es mejor (CAC). Si cv ≤ tv → 100%+, sino degradación
        return round((tv / cv) * 100, 1) if cv > 0 else None
    return round((cv / tv) * 100, 1)


def comercial_master_metrics_rollup(kpis_serialized) -> dict:
    """Devuelve el rollup de las 4 maestras a partir de KPIs ya serializados."""
    out = {}
    for m in _MAESTRAS:
        drivers = [k for k in kpis_serialized if k.get("is_master") and k.get("master_metric") == m]
        pcts = [_kpi_pct_achievement(k) for k in drivers]
        pcts = [p for p in pcts if p is not None]
        if pcts:
            score = round(sum(pcts) / len(pcts), 1)
            if score >= 90:
                color = "green"
            elif score >= 70:
                color = "yellow"
            else:
                color = "red"
        else:
            score = None
            color = "gray"
        out[m] = {
            "metric": m,
            "label": _MAESTRA_LABELS[m],
            "score_pct": score,
            "color": color,
            "driver_count": len(drivers),
            "drivers_with_data": len(pcts),
            "drivers": [
                {"id": d["id"], "name": d["name"], "current_value": d.get("current_value"),
                 "target_value": d.get("target_value"), "unit": d.get("unit"),
                 "pct": _kpi_pct_achievement(d)}
                for d in drivers
            ],
        }
    return out


def comercial_gov_charter_out(row) -> dict:
    return {
        "id": row.id,
        "owner_id": row.owner_id,
        "cadence": row.cadence or "monthly",
        "change_criteria": row.change_criteria or "",
        "principles": row.principles or "",
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def comercial_company_context_out(row) -> dict:
    """Singleton id=1 — task #92 Quick Start."""
    return {
        "id": row.id,
        "company_name": row.company_name or "",
        "industry": row.industry or "",
        "business_model": row.business_model or "",
        "target_segment": row.target_segment or "",
        "geographies": row.geographies or "",
        "team_size": row.team_size,
        "sales_team_size": row.sales_team_size,
        "avg_ticket_mxn": row.avg_ticket_mxn,
        "sales_cycle_days": row.sales_cycle_days,
        "main_value_prop": row.main_value_prop or "",
        "top_competitors": row.top_competitors or "",
        "main_pains_today": row.main_pains_today or "",
        "main_objectives": getattr(row, "main_objectives", "") or "",
        "language_style": row.language_style or "directo",
        "notes": row.notes or "",
        # v19: 3 atestaciones de validación del workbook
        "validated_terreno": bool(getattr(row, "validated_terreno", False)),
        "validated_terreno_notes": getattr(row, "validated_terreno_notes", "") or "",
        "validated_fantasma": bool(getattr(row, "validated_fantasma", False)),
        "validated_fantasma_notes": getattr(row, "validated_fantasma_notes", "") or "",
        "validated_datos": bool(getattr(row, "validated_datos", False)),
        "validated_datos_notes": getattr(row, "validated_datos_notes", "") or "",
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def comercial_gov_gap_out(row) -> dict:
    return {
        "id": row.id,
        "gap_type": row.gap_type,
        "reference_id": row.reference_id,
        "description": row.description,
        "priority": row.priority or "medium",
        "status": row.status or "open",
        "owner_id": row.owner_id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "closed_at": row.closed_at.isoformat() if row.closed_at else None,
    }


def comercial_gov_test_out(row) -> dict:
    return {
        "id": row.id,
        "test_type": row.test_type,
        "subject": row.subject,
        "hypothesis": row.hypothesis or "",
        "evidence": row.evidence or "",
        "status": row.status or "planned",
        "performed_at": row.performed_at.isoformat() if row.performed_at else None,
        "owner_id": row.owner_id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def comercial_trust_pillar_step_out(row) -> dict:
    return {
        "id": row.id,
        "pillar_id": row.pillar_id,
        "title": row.title,
        "description": row.description or "",
        "evidence": row.evidence or "",
        "responsable_id": row.responsable_id,
        "due_date": row.due_date.isoformat() if row.due_date else None,
        "status": row.status or "pending",
        "order": row.order or 0,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def comercial_person_out(row: ComercialPerson) -> dict:
    return {
        "id": row.id, "name": row.name, "role": row.role,
        "area": row.area, "email": row.email,
        "avatar_color": row.avatar_color, "is_active": row.is_active,
        "order": row.order,
    }


def comercial_kpi_history_out(row: ComercialKpiHistory) -> dict:
    return {
        "id": row.id, "kpi_id": row.kpi_id, "value": row.value,
        "period": getattr(row, "period", "") or "",
        "recorded_at": row.recorded_at.isoformat() if row.recorded_at else None,
        "notes": row.notes,
    }


def comercial_comment_out(row: ComercialComment) -> dict:
    return {
        "id": row.id, "entity_type": row.entity_type,
        "entity_id": row.entity_id, "text": row.text,
        "author": row.author, "link": row.link,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def comercial_activity_log_out(row: ComercialActivityLog) -> dict:
    return {
        "id": row.id, "entity_type": row.entity_type,
        "entity_id": row.entity_id, "action": row.action,
        "old_value": row.old_value, "new_value": row.new_value,
        "detail": row.detail,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def comercial_channel_out(row) -> dict:
    return {
        "id": row.id, "name": row.name, "icon": row.icon,
        "color": row.color, "description": row.description, "order": row.order,
    }
