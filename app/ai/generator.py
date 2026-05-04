"""Generador de arquitectura comercial desde narrativa libre.

Usa OpenAI Structured Outputs (response_format=json_schema) para garantizar
output válido contra el schema sin parseo manual ni alucinación de estructura.

El resultado es un DRAFT — el usuario lo revisa y acepta/edita/descarta antes
de que se persista.
"""
from __future__ import annotations

import os
from typing import Any, Dict

from openai import OpenAI

from .expert_prompt import EXPERT_SYSTEM_PROMPT


# Schema canónico para Structured Outputs.
# strict=true en OpenAI requiere additionalProperties=false y todas las keys en required.
# Optional fields se modelan con type: ["string", "null"] o similar.
ARCHITECTURE_SCHEMA: Dict[str, Any] = {
    "name": "commercial_architecture",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "summary": {
                "type": "string",
                "description": "Resumen 1-2 oraciones de cómo el experto interpretó la narrativa",
            },
            "touchpoints": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "phase_id": {
                            "type": "string",
                            "enum": ["atraccion", "captura", "conversion", "onboarding", "recompra", "confianza"],
                        },
                        "name": {"type": "string"},
                        "channel": {"type": "string"},
                        "responsible_role": {"type": "string"},
                        "objective": {"type": ["string", "null"]},
                        "moment_type": {
                            "type": ["string", "null"],
                            "enum": ["pre_venta", "venta", "post_venta", None],
                        },
                        "ux_principles_brief": {"type": ["string", "null"]},
                        "content_message": {"type": ["string", "null"]},
                        "success_signal": {"type": ["string", "null"]},
                        "inferred_fields": {
                            "type": "array",
                            "description": "Lista de atributos que el modelo infirió (no estaban explícitos en la narrativa)",
                            "items": {"type": "string"},
                        },
                        "order_hint": {
                            "type": "integer",
                            "description": "Orden sugerido dentro de la fase, 1-N",
                        },
                    },
                    "required": [
                        "phase_id", "name", "channel", "responsible_role",
                        "objective", "moment_type", "ux_principles_brief",
                        "content_message", "success_signal", "inferred_fields",
                        "order_hint",
                    ],
                },
            },
            "frictions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "touchpoint_name": {
                            "type": "string",
                            "description": "Nombre del touchpoint donde ocurre la fricción (debe coincidir con uno de los TPs generados)",
                        },
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "friction_type": {
                            "type": "string",
                            "enum": ["time", "repetition", "channel_switch", "incomplete_info", "unmet_expectations", "cognitive_effort"],
                        },
                        "severity": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                        },
                    },
                    "required": ["touchpoint_name", "name", "description", "friction_type", "severity"],
                },
            },
            "kpis": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string"},
                        "question": {
                            "type": "string",
                            "description": "Pregunta CEO que el KPI responde: '¿...?'",
                        },
                        "unit": {"type": "string", "description": "Unidad de medida: %, MXN, días, etc."},
                        "is_master": {"type": "boolean"},
                        "master_metric": {
                            "type": ["string", "null"],
                            "enum": ["utility", "ltv", "cac", "conversion", None],
                            "description": "Si is_master=true, cuál de las 4 maestras impulsa",
                        },
                        "linked_phase_id": {
                            "type": ["string", "null"],
                            "enum": ["atraccion", "captura", "conversion", "onboarding", "recompra", "confianza", None],
                            "description": "Fase principal que el KPI mide (opcional)",
                        },
                    },
                    "required": ["name", "question", "unit", "is_master", "master_metric", "linked_phase_id"],
                },
            },
            "warnings": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Cosas que el experto notó: huecos en la narrativa, supuestos que hizo, áreas que el usuario debería pulir",
            },
        },
        "required": ["summary", "touchpoints", "frictions", "kpis", "warnings"],
    },
}


def _client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY no está configurada. Agrégala al archivo .env: "
            "OPENAI_API_KEY=sk-..."
        )
    return OpenAI(api_key=api_key)


def _format_company_context_from_db(db_session) -> str:
    """Lee el singleton ComercialCompanyContext y lo formatea como bloque de texto.

    Solo incluye campos no vacíos. Si no hay fila o todos los campos están
    vacíos, regresa ''.
    """
    try:
        from app.models import ComercialCompanyContext
        row = db_session.query(ComercialCompanyContext).filter(ComercialCompanyContext.id == 1).first()
    except Exception:
        return ""
    if not row:
        return ""

    lines = []
    if row.company_name: lines.append(f"- Empresa: {row.company_name}")
    if row.industry: lines.append(f"- Industria: {row.industry}")
    if row.business_model: lines.append(f"- Modelo: {row.business_model}")
    if row.target_segment: lines.append(f"- Segmento objetivo: {row.target_segment}")
    if row.geographies: lines.append(f"- Geografía: {row.geographies}")
    if row.team_size: lines.append(f"- Equipo total: {row.team_size} personas")
    if row.sales_team_size: lines.append(f"- Equipo comercial: {row.sales_team_size} asesores")
    if row.avg_ticket_mxn:
        lines.append(f"- Ticket promedio: ${row.avg_ticket_mxn:,.0f} MXN")
    if row.sales_cycle_days:
        lines.append(f"- Ciclo de venta: ~{row.sales_cycle_days} días")
    if row.main_value_prop: lines.append(f"- Propuesta de valor: {row.main_value_prop}")
    if row.top_competitors: lines.append(f"- Competidores principales: {row.top_competitors}")
    if row.main_pains_today: lines.append(f"- Dolores actuales: {row.main_pains_today}")
    if getattr(row, "main_objectives", "") and row.main_objectives.strip():
        lines.append(f"- Objetivos principales del CEO: {row.main_objectives}")
    if row.language_style and row.language_style != "directo":
        lines.append(f"- Estilo de comunicación preferido: {row.language_style}")
    if row.notes: lines.append(f"- Notas: {row.notes}")

    return "\n".join(lines) if lines else ""


# ── Schemas para sugerencias contextuales (task #107, #108) ────────

# Fricciones sugeridas para un touchpoint existente.
# Output corto: 2-4 fricciones plausibles dadas las características del TP
# y el contexto de la empresa. Cada una con tipo, severidad y por qué.
FRICTION_SUGGESTIONS_SCHEMA: Dict[str, Any] = {
    "name": "friction_suggestions",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "summary": {"type": "string", "description": "1 oración: cómo interpretó el TP"},
            "frictions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string", "description": "Nombre corto, accionable"},
                        "description": {"type": "string", "description": "Qué pasa exactamente, con detalle"},
                        "friction_type": {
                            "type": "string",
                            "enum": ["time", "repetition", "channel_switch", "incomplete_info", "unmet_expectations", "cognitive_effort"],
                        },
                        "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                        "is_critical": {"type": "boolean", "description": "Si bloquea el avance del cliente o destruye confianza, true"},
                        "rationale": {"type": "string", "description": "Por qué es típica en este TP/industria"},
                    },
                    "required": ["name", "description", "friction_type", "severity", "is_critical", "rationale"],
                },
            },
        },
        "required": ["summary", "frictions"],
    },
}


# Iniciativas sugeridas para resolver fricciones críticas.
# Output: 2-3 alternativas con motor, tipo, target medible, primeros pasos.
INITIATIVE_SUGGESTIONS_SCHEMA: Dict[str, Any] = {
    "name": "initiative_suggestions",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "summary": {"type": "string", "description": "1-2 oraciones: cómo entendió el problema y qué tipo de respuesta propone"},
            "initiatives": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "title": {"type": "string", "description": "Título corto, verbo + objeto"},
                        "description": {"type": "string", "description": "Qué se va a hacer, alcance, 2-3 oraciones"},
                        "target": {"type": "string", "description": "Meta concreta y medible — ej. '10 testimonios capturados al mes', '50% reducción en tiempo de respuesta'"},
                        "motor": {
                            "type": "string",
                            "enum": ["trust", "atraccion", "captura", "conversion", "onboarding", "recompra"],
                            "description": "Qué motor de la arquitectura impulsa principalmente",
                        },
                        "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                        "tipo": {"type": "string", "enum": ["operativa", "estrategica", "hito"]},
                        "estimated_weeks": {"type": "integer", "description": "Semanas estimadas de ejecución"},
                        "first_steps": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "3-5 primeros pasos concretos para arrancar",
                        },
                        "rationale": {"type": "string", "description": "Por qué esta iniciativa es la indicada para las fricciones dadas"},
                    },
                    "required": ["title", "description", "target", "motor", "priority", "tipo", "estimated_weeks", "first_steps", "rationale"],
                },
            },
        },
        "required": ["summary", "initiatives"],
    },
}


_FRICTION_SUGGEST_PROMPT = """Eres un experto en arquitectura comercial (metodología Cris Urzúa).
El usuario te muestra UN touchpoint existente en su proceso comercial. Tu trabajo es identificar las fricciones más probables que ese touchpoint tiene HOY, dado el contexto de la empresa.

Reglas:
- Genera 2-4 fricciones (no más). Calidad > cantidad.
- Cada fricción debe ser plausible para esta industria y este momento del journey.
- Usa los 6 tipos canónicos: time, repetition, channel_switch, incomplete_info, unmet_expectations, cognitive_effort.
- Marca is_critical=true SOLO si la fricción bloquea el avance del cliente o destruye confianza (no si solo es molesta).
- No inventes datos del cliente. Si la narrativa es vaga, apóyate en patrones típicos de la industria y di "asumiendo X" en el rationale.
- Español MX, directo, sin floritura. Estilo CEO operativo.
- Si el touchpoint ya tiene fricciones reportadas, NO las repitas — sugiere las que faltan.
"""


_INITIATIVE_SUGGEST_PROMPT = """Eres un experto en arquitectura comercial (metodología Cris Urzúa) y un operador disciplinado.
El usuario te da un objetivo y un set de fricciones (idealmente las críticas). Tu trabajo es proponer 2-3 ALTERNATIVAS de iniciativa que resuelvan el problema. Cada alternativa debe ser una propuesta diferente — no variaciones cosméticas.

Reglas:
- 2-3 iniciativas, ni más ni menos.
- Cada una con title corto, description clara, target MEDIBLE (no "mejorar" → "aumentar 30%").
- Asigna `motor` correcto: trust (Motor de Confianza) si es construcción de credibilidad; atraccion/captura/conversion/onboarding/recompra si es ataque a una fase.
- `tipo`: operativa (ejecución diaria), estrategica (cambio de modelo), hito (one-shot grande).
- `first_steps`: 3-5 pasos concretos arrancables esta semana, no genéricos.
- Las 3 alternativas deben tener enfoques distintos (ej: una conservadora, una agresiva, una de palanca/automatización).
- Español MX, directo, lenguaje del CEO operativo.
- Si las fricciones son ambiguas, en `rationale` di qué asumiste.
"""


def suggest_frictions_for_touchpoint(
    tp: Dict[str, Any],
    existing_friction_names: list = None,
    company_context: str | None = None,
    db_session=None,
) -> Dict[str, Any]:
    """Sugiere 2-4 fricciones plausibles para un touchpoint dado.

    Args:
        tp: dict con al menos {id, name, phase_id, canal, responsable, description, kpi}.
        existing_friction_names: lista de nombres de fricciones ya reportadas en este TP.
        company_context: si None, se carga del singleton.
        db_session: SQLAlchemy session.
    """
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    if (not company_context or not company_context.strip()) and db_session is not None:
        company_context = _format_company_context_from_db(db_session) or None

    parts = []
    if company_context:
        parts.append(f"# Contexto de la empresa\n{company_context}\n")
    parts.append(
        "# Touchpoint a analizar\n"
        f"- Nombre: {tp.get('name','')}\n"
        f"- Fase: {tp.get('phase_id','')}\n"
        f"- Canal: {tp.get('canal','') or '(sin canal)'}\n"
        f"- Responsable: {tp.get('responsable','') or '(sin asignar)'}\n"
        f"- Descripción: {tp.get('description','') or '(sin descripción)'}\n"
        f"- KPI vinculado: {tp.get('kpi','') or '(ninguno)'}\n"
    )
    if existing_friction_names:
        parts.append(
            "# Fricciones ya reportadas en este TP (no las repitas)\n"
            + "\n".join(f"- {n}" for n in existing_friction_names)
        )
    user_msg = "\n".join(parts)

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _FRICTION_SUGGEST_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_schema", "json_schema": FRICTION_SUGGESTIONS_SCHEMA},
        temperature=0.5,
    )
    import json
    content = resp.choices[0].message.content or "{}"
    parsed = json.loads(content)
    parsed["_meta"] = {
        "model": model,
        "usage": {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else None,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else None,
            "total_tokens": resp.usage.total_tokens if resp.usage else None,
        },
    }
    return parsed


def suggest_initiatives(
    objective: str,
    frictions: list = None,
    related_touchpoints: list = None,
    company_context: str | None = None,
    db_session=None,
) -> Dict[str, Any]:
    """Sugiere 2-3 iniciativas alternativas para resolver fricciones críticas.

    Args:
        objective: objetivo en prosa del CEO ("quiero subir conversión 20% este Q").
        frictions: lista de dicts {name, description, friction_type, severity, is_critical}.
        related_touchpoints: lista opcional de dicts {name, phase_id, canal} para más contexto.
        company_context: si None, se carga del singleton.
        db_session: SQLAlchemy session.
    """
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    if (not company_context or not company_context.strip()) and db_session is not None:
        company_context = _format_company_context_from_db(db_session) or None

    parts = []
    if company_context:
        parts.append(f"# Contexto de la empresa\n{company_context}\n")
    parts.append(f"# Objetivo a impulsar\n{objective.strip() or '(sin objetivo explícito — propón generales para el motor que más convenga)'}")

    if frictions:
        crit = [f for f in frictions if f.get("is_critical")]
        rest = [f for f in frictions if not f.get("is_critical")]
        if crit:
            parts.append("# Fricciones críticas a resolver (prioridad)\n" + "\n".join(
                f"- [{f.get('friction_type','?')}/{f.get('severity','?')}] {f.get('name','')} — {f.get('description','')}"
                for f in crit
            ))
        if rest:
            parts.append("# Otras fricciones del journey (contexto secundario)\n" + "\n".join(
                f"- [{f.get('friction_type','?')}] {f.get('name','')}"
                for f in rest[:5]
            ))

    if related_touchpoints:
        parts.append("# Touchpoints donde ocurren\n" + "\n".join(
            f"- {t.get('name','')} (fase {t.get('phase_id','')}, canal {t.get('canal','-')})"
            for t in related_touchpoints[:8]
        ))

    user_msg = "\n\n".join(parts)

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _INITIATIVE_SUGGEST_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_schema", "json_schema": INITIATIVE_SUGGESTIONS_SCHEMA},
        temperature=0.6,
    )
    import json
    content = resp.choices[0].message.content or "{}"
    parsed = json.loads(content)
    parsed["_meta"] = {
        "model": model,
        "usage": {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else None,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else None,
            "total_tokens": resp.usage.total_tokens if resp.usage else None,
        },
    }
    return parsed


def generate_architecture_from_narrative(
    narrative: str,
    company_context: str | None = None,
    target_phase_id: str | None = None,
    db_session=None,
) -> Dict[str, Any]:
    """Toma una narrativa libre del usuario y devuelve un draft de arquitectura.

    Args:
        narrative: texto libre describiendo el proceso comercial.
        company_context: contexto opcional (giro, tamaño, segmento). Si es
            None, se intenta cargar desde la BD via db_session.
        target_phase_id: si se da, restringe la generación a esa fase.
        db_session: SQLAlchemy session — opcional, sólo si quieres auto-cargar
            company_context desde el singleton.

    Returns:
        Dict con keys: summary, touchpoints[], frictions[], kpis[], warnings[]
    """
    if not narrative or not narrative.strip():
        raise ValueError("narrative vacía")

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    # Auto-cargar contexto desde BD si no se pasó explícito
    if (not company_context or not company_context.strip()) and db_session is not None:
        company_context = _format_company_context_from_db(db_session) or None

    user_msg_parts = []
    if company_context:
        user_msg_parts.append(f"# Contexto de la empresa\n{company_context}\n")
    if target_phase_id:
        user_msg_parts.append(
            f"# Fase objetivo\nGenera SOLAMENTE touchpoints para la fase "
            f"`{target_phase_id}`. Las fricciones y KPIs sí pueden tocar otras fases si la narrativa lo amerita.\n"
        )
    user_msg_parts.append(f"# Narrativa del proceso\n{narrative.strip()}")
    user_msg = "\n".join(user_msg_parts)

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": EXPERT_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": ARCHITECTURE_SCHEMA,
        },
        temperature=0.4,
    )

    import json
    content = resp.choices[0].message.content or "{}"
    parsed = json.loads(content)

    # Metadata útil para debugging y costos visibles al usuario
    parsed["_meta"] = {
        "model": model,
        "usage": {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else None,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else None,
            "total_tokens": resp.usage.total_tokens if resp.usage else None,
        },
    }
    return parsed


# ── Resolución estructurada de UNA fricción (CEO plan 2026-05-04) ──

FRICTION_RESOLUTION_SCHEMA: Dict[str, Any] = {
    "name": "friction_resolution",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "solution": {
                "type": "string",
                "description": "Qué hacer concretamente para resolver esta fricción. 2-4 oraciones, accionable.",
            },
            "expected_outcome": {
                "type": "string",
                "description": "Resultado esperado MEDIBLE — ej. 'Recuperar 15% de cotizaciones abandonadas en 30d', 'Reducir tiempo de respuesta de 8h a 2h'.",
            },
            "deadline_days": {
                "type": "integer",
                "description": "Días sugeridos desde hoy para cerrar la resolución, basado en complejidad y severidad. 7-60 típico.",
            },
            "checklist": {
                "type": "array",
                "description": "4-6 pasos accionables para llegar al expected_outcome. Cada paso debe ser arrancable esta semana.",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "text": {"type": "string"},
                    },
                    "required": ["text"],
                },
            },
            "suggested_kpi_ids": {
                "type": "array",
                "description": "IDs de KPIs existentes (de la lista provista) que esta resolución debería mover. Subset de los IDs disponibles. Vacío si ninguno aplica.",
                "items": {"type": "string"},
            },
            "suggested_new_kpi": {
                "type": ["object", "null"],
                "description": "Si ningún KPI existente encaja Y la resolución necesita medirse, propón uno nuevo. null si no aplica.",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "question": {"type": "string", "description": "Pregunta CEO que el KPI responde: '¿...?'"},
                    "unit": {"type": "string"},
                },
                "required": ["name", "question", "unit"],
            },
            "rationale": {
                "type": "string",
                "description": "Por qué esta es la resolución indicada y qué supuestos hiciste (si la descripción de la fricción era vaga).",
            },
        },
        "required": [
            "solution", "expected_outcome", "deadline_days",
            "checklist", "suggested_kpi_ids", "suggested_new_kpi", "rationale",
        ],
    },
}


_FRICTION_RESOLUTION_PROMPT = """Eres un experto en arquitectura comercial (metodología Cris Urzúa) y un operador disciplinado.
El usuario te muestra UNA fricción específica de su proceso comercial. Tu trabajo es proponer una resolución concreta y arrancable: qué hacer, qué resultado esperar, en qué pasos, y qué KPIs medirán el avance.

Reglas:
- `solution`: 2-4 oraciones, accionable. No genérico ("mejorar comunicación") — específico ("implementar follow-up automático a las 24h vía WhatsApp con plantilla de 3 líneas").
- `expected_outcome`: MEDIBLE con número y plazo. No "mejorar conversión" → "subir conversión de cotización→cierre de 12% a 18% en 60 días".
- `deadline_days`: realista. Fricciones simples 7-21 días. Cambios de proceso 30-60 días.
- `checklist`: 4-6 pasos. Cada uno arrancable esta semana, no genérico. Ej: "Configurar trigger en HubSpot para mensajes >24h sin respuesta" no "Mejorar el CRM".
- `suggested_kpi_ids`: SOLO IDs que aparezcan en la lista de KPIs provista. NO inventes IDs. Si ninguno encaja, lista vacía.
- `suggested_new_kpi`: solo si la resolución necesita medirse y NINGÚN KPI existente encaja. Si los existentes alcanzan, devuelve null.
- Español MX, directo, lenguaje del CEO operativo.
- Si la descripción de la fricción es vaga, en `rationale` di qué asumiste.
"""


def suggest_friction_resolution(
    friction: Dict[str, Any],
    existing_kpis: list = None,
    related_touchpoint: Dict[str, Any] = None,
    company_context: str | None = None,
    db_session=None,
) -> Dict[str, Any]:
    """Sugiere una resolución estructurada para UNA fricción específica.

    Args:
        friction: dict con {id, name, description, impact, phase_id, friction_type, is_critical}.
        existing_kpis: lista de dicts {id, name, question, unit} de KPIs de la marca.
        related_touchpoint: dict opcional {name, phase_id, canal} si la fricción tiene TP vinculado.
        company_context: si None, se carga del singleton.
        db_session: SQLAlchemy session.
    """
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    if (not company_context or not company_context.strip()) and db_session is not None:
        company_context = _format_company_context_from_db(db_session) or None

    parts = []
    if company_context:
        parts.append(f"# Contexto de la empresa\n{company_context}\n")
    parts.append(
        "# Fricción a resolver\n"
        f"- ID: {friction.get('id','')}\n"
        f"- Nombre: {friction.get('name','')}\n"
        f"- Fase: {friction.get('phase_id','')}\n"
        f"- Impacto: {friction.get('impact','')}\n"
        f"- Tipo: {friction.get('friction_type','') or '(sin clasificar)'}\n"
        f"- Crítica: {'sí' if friction.get('is_critical') else 'no'}\n"
        f"- Descripción: {friction.get('description','') or '(sin descripción)'}\n"
    )
    if related_touchpoint:
        parts.append(
            "# Touchpoint relacionado\n"
            f"- Nombre: {related_touchpoint.get('name','')}\n"
            f"- Fase: {related_touchpoint.get('phase_id','')}\n"
            f"- Canal: {related_touchpoint.get('canal','') or '(sin canal)'}\n"
        )
    if existing_kpis:
        kpi_lines = "\n".join(
            f"- ID: {k['id']} | {k['name']} | unidad: {k.get('unit') or '(sin unidad)'} | pregunta: {k.get('question') or '(sin pregunta)'}"
            for k in existing_kpis
        )
        parts.append(
            "# KPIs existentes en la marca (usa estos IDs si encajan, no inventes)\n"
            + kpi_lines
        )
    else:
        parts.append("# KPIs existentes en la marca\n(ninguno todavía — si la resolución necesita medirse, propón uno nuevo en suggested_new_kpi)")
    user_msg = "\n".join(parts)

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _FRICTION_RESOLUTION_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_schema", "json_schema": FRICTION_RESOLUTION_SCHEMA},
        temperature=0.4,
    )
    import json
    content = resp.choices[0].message.content or "{}"
    parsed = json.loads(content)
    parsed["_meta"] = {
        "model": model,
        "usage": {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else None,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else None,
            "total_tokens": resp.usage.total_tokens if resp.usage else None,
        },
    }
    return parsed


# ── Detector de duplicados al crear fricción ──

FRICTION_DUPLICATE_SCHEMA: Dict[str, Any] = {
    "name": "friction_duplicate_check",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "best_match_id": {
                "type": ["string", "null"],
                "description": "ID de la fricción existente más similar. null si ninguna alcanza umbral de similaridad razonable.",
            },
            "similarity_score": {
                "type": "number",
                "description": "Score 0.0-1.0. >= 0.7 sugiere posible duplicado. < 0.5 son fricciones distintas.",
            },
            "reason": {
                "type": "string",
                "description": "Por qué se considera (o no) similar. 1 oración.",
            },
        },
        "required": ["best_match_id", "similarity_score", "reason"],
    },
}


_FRICTION_DUPLICATE_PROMPT = """Eres un detector de duplicados para fricciones comerciales. El usuario propone una fricción NUEVA y te da una lista de fricciones EXISTENTES en la misma fase del proceso.
Tu trabajo: decir si la nueva fricción es la misma raíz (root cause) que alguna existente.

Reglas:
- Compara por ROOT CAUSE, no por palabras. "Cliente no contesta WhatsApp" y "Lead se pierde después de pedir cotización" pueden ser la misma raíz si ambas son falta de seguimiento.
- similarity_score >= 0.7 → casi seguro la misma raíz. 0.5-0.7 → relacionadas pero distintas. < 0.5 → fricciones diferentes.
- best_match_id solo si score >= 0.5. Si nada encaja, null.
- En reason, sé concreto: "ambas atacan falta de follow-up post-cotización" vs "una es de canal, la otra de tiempo de respuesta".
- Si la lista existente está vacía, devuelve null y score 0.
- Español MX, 1 oración en reason.
"""


def check_friction_duplicate(
    new_friction: Dict[str, Any],
    existing_frictions: list = None,
    db_session=None,
) -> Dict[str, Any]:
    """Detecta si new_friction es duplicado de alguna en existing_frictions.

    Args:
        new_friction: dict con {name, description, phase_id, friction_type?}.
        existing_frictions: lista de dicts {id, name, description, friction_type?}
            ya filtrados por phase_id == new_friction.phase_id (mismo brand asumido).

    Returns:
        Dict con {best_match_id, similarity_score, reason, _meta}.
    """
    if not existing_frictions:
        return {
            "best_match_id": None,
            "similarity_score": 0.0,
            "reason": "No hay fricciones existentes en esta fase contra las que comparar.",
            "_meta": {"skipped": True},
        }

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    parts = [
        "# Fricción NUEVA propuesta\n"
        f"- Nombre: {new_friction.get('name','')}\n"
        f"- Fase: {new_friction.get('phase_id','')}\n"
        f"- Tipo: {new_friction.get('friction_type','') or '(sin clasificar)'}\n"
        f"- Descripción: {new_friction.get('description','') or '(sin descripción)'}\n"
    ]
    existing_lines = "\n\n".join(
        f"- ID: {f['id']}\n  Nombre: {f.get('name','')}\n  Tipo: {f.get('friction_type','') or '(sin clasificar)'}\n  Descripción: {f.get('description','') or '(sin descripción)'}"
        for f in existing_frictions
    )
    parts.append(f"# Fricciones existentes en la misma fase\n{existing_lines}")
    user_msg = "\n".join(parts)

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _FRICTION_DUPLICATE_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_schema", "json_schema": FRICTION_DUPLICATE_SCHEMA},
        temperature=0.2,
    )
    import json
    content = resp.choices[0].message.content or "{}"
    parsed = json.loads(content)
    parsed["_meta"] = {
        "model": model,
        "usage": {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else None,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else None,
            "total_tokens": resp.usage.total_tokens if resp.usage else None,
        },
    }
    return parsed


# ── Auto-priority: ¿debería is_critical=true? ──

FRICTION_PRIORITY_SCHEMA: Dict[str, Any] = {
    "name": "friction_priority_check",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "is_critical": {
                "type": "boolean",
                "description": "true si la fricción bloquea el avance del cliente o destruye confianza. false si solo es molesta.",
            },
            "reason": {
                "type": "string",
                "description": "1 oración: por qué sí/no. Concreto con la fricción específica.",
            },
        },
        "required": ["is_critical", "reason"],
    },
}


_FRICTION_PRIORITY_PROMPT = """Decides si una fricción debe marcarse como CRÍTICA.

Una fricción es CRÍTICA si:
- Bloquea al cliente de avanzar al siguiente paso del journey, o
- Destruye confianza de manera difícil de recuperar, o
- Sale repetidamente como queja en post-mortems / retroalimentación.

NO es crítica si solo es molesta, lenta, o estéticamente fea pero el cliente igual avanza.

Reglas de salida:
- is_critical: bool.
- reason: 1 oración, en español MX, directo. Específica a esta fricción.
"""


def suggest_friction_priority(
    friction: Dict[str, Any],
    related_touchpoint: Dict[str, Any] = None,
    company_context: str | None = None,
    db_session=None,
) -> Dict[str, Any]:
    """Decide si la fricción debería marcarse is_critical=true.

    Args:
        friction: dict con {name, description, impact, phase_id, friction_type}.
        related_touchpoint: opcional {name, phase_id, canal}.
        company_context: si None, se carga del singleton.

    Returns:
        Dict con {is_critical, reason, _meta}.
    """
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    if (not company_context or not company_context.strip()) and db_session is not None:
        company_context = _format_company_context_from_db(db_session) or None

    parts = []
    if company_context:
        parts.append(f"# Contexto de la empresa\n{company_context}\n")
    parts.append(
        "# Fricción a evaluar\n"
        f"- Nombre: {friction.get('name','')}\n"
        f"- Fase: {friction.get('phase_id','')}\n"
        f"- Impacto declarado: {friction.get('impact','')}\n"
        f"- Tipo: {friction.get('friction_type','') or '(sin clasificar)'}\n"
        f"- Descripción: {friction.get('description','') or '(sin descripción)'}\n"
    )
    if related_touchpoint:
        parts.append(
            "# Touchpoint relacionado\n"
            f"- Nombre: {related_touchpoint.get('name','')}\n"
            f"- Canal: {related_touchpoint.get('canal','') or '(sin canal)'}\n"
        )
    user_msg = "\n".join(parts)

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _FRICTION_PRIORITY_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_schema", "json_schema": FRICTION_PRIORITY_SCHEMA},
        temperature=0.2,
    )
    import json
    content = resp.choices[0].message.content or "{}"
    parsed = json.loads(content)
    parsed["_meta"] = {
        "model": model,
        "usage": {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else None,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else None,
            "total_tokens": resp.usage.total_tokens if resp.usage else None,
        },
    }
    return parsed
