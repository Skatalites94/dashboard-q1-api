from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class DealBase(BaseModel):
    a: str = Field(..., description="Asesor")
    c: str = Field(..., description="Cuenta")
    t: str = Field(..., description="Trato")
    i: float = Field(..., description="Importe")
    p: float = 0.0
    u: float = 0.0
    f: str = Field(..., description="Fecha ISO")
    m: str = Field(..., description="Mes (Ene/Feb/Mar)")
    tri: str = "Q1"


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    a: Optional[str] = None
    c: Optional[str] = None
    t: Optional[str] = None
    i: Optional[float] = None
    p: Optional[float] = None
    u: Optional[float] = None
    f: Optional[str] = None
    m: Optional[str] = None
    tri: Optional[str] = None


class IniciativaBase(BaseModel):
    area: str = ""
    resp: str = ""
    ini: str
    pri: str = ""
    est: str = ""
    av: float = 0.0
    notas: str = ""
    trimestre: str = "Q1"


class IniciativaCreate(IniciativaBase):
    pass


class IniciativaUpdate(BaseModel):
    area: Optional[str] = None
    resp: Optional[str] = None
    ini: Optional[str] = None
    pri: Optional[str] = None
    est: Optional[str] = None
    av: Optional[float] = None
    notas: Optional[str] = None
    trimestre: Optional[str] = None


class KpiMetaBase(BaseModel):
    kpi: str
    r25: str = ""
    m26: str = ""


class KpiMetaCreate(KpiMetaBase):
    pass


class KpiMetaUpdate(BaseModel):
    kpi: Optional[str] = None
    r25: Optional[str] = None
    m26: Optional[str] = None


class SemaforoBase(BaseModel):
    kpi: str = ""
    area: str = ""
    resp: str = ""
    descripcion: str = ""
    meta: str = ""
    ene: str = ""
    feb: str = ""
    mar: str = ""
    est: str = ""
    tendencia: str = ""
    trimestre: str = "Q1"
    diagnostico: str = ""
    recomendacion: str = ""


class SemaforoCreate(SemaforoBase):
    pass


class SemaforoUpdate(BaseModel):
    kpi: Optional[str] = None
    area: Optional[str] = None
    resp: Optional[str] = None
    descripcion: Optional[str] = None
    meta: Optional[str] = None
    ene: Optional[str] = None
    feb: Optional[str] = None
    mar: Optional[str] = None
    est: Optional[str] = None
    tendencia: Optional[str] = None
    trimestre: Optional[str] = None
    diagnostico: Optional[str] = None
    recomendacion: Optional[str] = None


class AreaResumenBase(BaseModel):
    area: str
    resp: str = ""
    rol: str = ""
    verdes: int = 0
    amarillos: int = 0
    rojos: int = 0
    tendencia: str = ""
    trimestre: str = "Q1"
    diagnostico: str = ""
    recomendacion: str = ""


class AreaResumenCreate(AreaResumenBase):
    pass


class AreaResumenUpdate(BaseModel):
    area: Optional[str] = None
    resp: Optional[str] = None
    rol: Optional[str] = None
    verdes: Optional[int] = None
    amarillos: Optional[int] = None
    rojos: Optional[int] = None
    tendencia: Optional[str] = None
    trimestre: Optional[str] = None
    diagnostico: Optional[str] = None
    recomendacion: Optional[str] = None


# ── Módulo Gastos ──────────────────────────────────────────────

class CategoriaGastoCreate(BaseModel):
    nombre: str
    modulo: str
    color: str = "#4C6EF5"
    orden: int = 0

class CategoriaGastoUpdate(BaseModel):
    nombre: Optional[str] = None
    modulo: Optional[str] = None
    color: Optional[str] = None
    orden: Optional[int] = None


class EmpleadoCreate(BaseModel):
    nombre: str
    depto: str = ""
    costo: float = 0
    sueldo_neto: float = 0
    esquema: str = "nomina_gpp"
    factor_carga: float = 1.35
    comision_pct: float = 0
    sueldo_imss: float = 0
    sueldo_complemento: float = 0
    cortado: bool = False
    es_contratacion: bool = False
    nota: str = ""
    categoria_id: Optional[int] = None

class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = None
    depto: Optional[str] = None
    costo: Optional[float] = None
    sueldo_neto: Optional[float] = None
    esquema: Optional[str] = None
    factor_carga: Optional[float] = None
    comision_pct: Optional[float] = None
    sueldo_imss: Optional[float] = None
    sueldo_complemento: Optional[float] = None
    cortado: Optional[bool] = None
    es_contratacion: Optional[bool] = None
    nota: Optional[str] = None
    categoria_id: Optional[int] = None


class GastoOperativoCreate(BaseModel):
    nombre: str
    costo: float
    categoria: str = "Admin"
    fijo: bool = False
    cortado: bool = False
    categoria_id: Optional[int] = None

class GastoOperativoUpdate(BaseModel):
    nombre: Optional[str] = None
    costo: Optional[float] = None
    categoria: Optional[str] = None
    fijo: Optional[bool] = None
    cortado: Optional[bool] = None
    categoria_id: Optional[int] = None


class SuscripcionCreate(BaseModel):
    nombre: str
    costo: float
    frecuencia: str = "Mensual"
    nota: str = ""
    cortado: bool = False
    categoria_id: Optional[int] = None
    usuarios: int = 1
    costo_por_usuario: Optional[float] = None
    es_por_usuario: bool = False
    moneda: str = "MXN"
    tipo_cambio: float = 17.5

class SuscripcionUpdate(BaseModel):
    nombre: Optional[str] = None
    costo: Optional[float] = None
    frecuencia: Optional[str] = None
    nota: Optional[str] = None
    cortado: Optional[bool] = None
    categoria_id: Optional[int] = None
    usuarios: Optional[int] = None
    costo_por_usuario: Optional[float] = None
    es_por_usuario: Optional[bool] = None
    moneda: Optional[str] = None
    tipo_cambio: Optional[float] = None


class ConsultoriaCreate(BaseModel):
    nombre: str
    costo: float
    nota: str = ""
    cortado: bool = False
    categoria_id: Optional[int] = None

class ConsultoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    costo: Optional[float] = None
    nota: Optional[str] = None
    cortado: Optional[bool] = None
    categoria_id: Optional[int] = None


class GastoFinancieroCreate(BaseModel):
    nombre: str
    costo: float
    nota: str = ""
    cortado: bool = False
    categoria_id: Optional[int] = None

class GastoFinancieroUpdate(BaseModel):
    nombre: Optional[str] = None
    costo: Optional[float] = None
    nota: Optional[str] = None
    cortado: Optional[bool] = None
    categoria_id: Optional[int] = None


# ── Escenarios ─────────────────────────────────────────────────

class EscenarioCreate(BaseModel):
    nombre: str
    descripcion: str = ""

class EscenarioFromSnapshot(BaseModel):
    nombre: str
    descripcion: str = ""
    snapshot: dict
    total_original: float = 0
    total_nuevo: float = 0
    ahorro: float = 0
    es_base: bool = False

class EscenarioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None


# ── Simulador de Ingresos ─────────────────────────────────────

class SimAsesorCreate(BaseModel):
    nombre: str
    tipo: str = "junior"
    fecha_inicio: str = ""
    cuota_mensual: float = 0
    madurez_pct: float = 0
    max_tratos_mes: int = 25
    max_cartera_activa: int = 40
    activo: bool = True
    nota: str = ""
    horas_habiles_dia: float = 6.0
    cartera_actual: Optional[dict] = None

class SimAsesorUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    fecha_inicio: Optional[str] = None
    cuota_mensual: Optional[float] = None
    madurez_pct: Optional[float] = None
    max_tratos_mes: Optional[int] = None
    max_cartera_activa: Optional[int] = None
    activo: Optional[bool] = None
    nota: Optional[str] = None
    horas_habiles_dia: Optional[float] = None
    cartera_actual: Optional[dict] = None

class SimConfigUpdate(BaseModel):
    valor: Any

class SimTipoClienteCreate(BaseModel):
    codigo: str
    nombre: str
    leads_mensuales: int = 0
    tasa_retencion: float = 0.7
    tasa_cierre: float = 0.5
    meses_cierre: int = 1
    ticket_promedio: float = 0
    facturas_por_cliente: float = 0.5
    clientes_iniciales: int = 6
    dias_credito: int = 30
    frecuencia_compra_meses: int = 6
    deals_por_anio: int = 2
    horas_cotizacion: float = 2.0
    horas_seguimiento: float = 1.0
    leads_objetivo: int = 0

class SimTipoClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    leads_mensuales: Optional[int] = None
    tasa_retencion: Optional[float] = None
    tasa_cierre: Optional[float] = None
    meses_cierre: Optional[int] = None
    ticket_promedio: Optional[float] = None
    facturas_por_cliente: Optional[float] = None
    clientes_iniciales: Optional[int] = None
    dias_credito: Optional[int] = None
    frecuencia_compra_meses: Optional[int] = None
    deals_por_anio: Optional[int] = None
    horas_cotizacion: Optional[float] = None
    horas_seguimiento: Optional[float] = None
    leads_objetivo: Optional[int] = None

class EscenarioIngresoCreate(BaseModel):
    nombre: str
    descripcion: str = ""


# ── Módulo Arquitectura Comercial ─────────────────────────────

class ComercialTouchpointUpdate(BaseModel):
    name: Optional[str] = None
    phase_id: Optional[str] = None
    canal: Optional[str] = None
    responsable: Optional[str] = None
    responsable_id: Optional[int] = None
    kpi: Optional[str] = None
    friction_text: Optional[str] = None
    has_friction: Optional[bool] = None
    notes: Optional[str] = None
    order: Optional[int] = None


class ComercialTouchpointReorderRequest(BaseModel):
    phase_id: str
    ids: List[int]


class ComercialPersonCreate(BaseModel):
    name: str
    role: str = ""
    area: str = ""
    email: Optional[str] = None
    avatar_color: str = "#4C6EF5"
    is_active: bool = True
    order: int = 0


class ComercialPersonUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    area: Optional[str] = None
    email: Optional[str] = None
    avatar_color: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


class ComercialTouchpointCreate(BaseModel):
    phase_id: str
    name: str
    canal: str = ""
    responsable: str = ""
    responsable_id: Optional[int] = None
    kpi: str = ""
    friction_text: Optional[str] = None
    has_friction: bool = False
    order: int = 0
    notes: str = ""


class ComercialFrictionCreate(BaseModel):
    id: str
    phase_id: str
    name: str
    impact: str = "medium"
    solution: str = ""
    expected_outcome: str = ""
    status: str = "pending"
    deadline: Optional[str] = None
    notes: str = ""
    responsable: str = ""
    responsable_id: Optional[int] = None
    touchpoint_id: Optional[int] = None
    priority: int = 0
    resolution_checklist: Optional[list] = None


class ComercialFrictionUpdate(BaseModel):
    name: Optional[str] = None
    phase_id: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    impact: Optional[str] = None
    solution: Optional[str] = None
    expected_outcome: Optional[str] = None
    responsable: Optional[str] = None
    responsable_id: Optional[int] = None
    touchpoint_id: Optional[int] = None
    priority: Optional[int] = None
    resolution_checklist: Optional[list] = None


class ComercialTrustPillarUpdate(BaseModel):
    status: Optional[str] = None
    actions: Optional[str] = None
    current_state: Optional[str] = None
    target_state: Optional[str] = None


class ComercialInitiativeCreate(BaseModel):
    pillar_id: Optional[str] = None
    title: str
    description: str = ""
    motor: str = "trust"
    phase_id: Optional[str] = None
    touchpoint_id: Optional[int] = None
    status: str = "pending"
    responsable_id: Optional[int] = None
    due_date: Optional[str] = None
    target: str = ""
    progress: int = 0
    priority: str = "medium"
    area: str = ""
    tipo: str = "operativa"
    friction_ids: Optional[List[str]] = None
    touchpoint_ids: Optional[List[int]] = None
    pillar_ids: Optional[List[str]] = None
    involved_ids: Optional[List[int]] = None
    depends_on_ids: Optional[List[int]] = None


class ComercialCanvasLayoutItem(BaseModel):
    entity_type: str
    entity_id: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None


class ComercialCanvasLayoutBulk(BaseModel):
    view_id: str = "comercial_main"
    items: List[ComercialCanvasLayoutItem]


class ComercialPhaseUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class ComercialPhaseCreate(BaseModel):
    id: str
    name: str
    icon: Optional[str] = ""
    color: Optional[str] = "#6366f1"
    description: Optional[str] = ""
    order: Optional[int] = 0


class ComercialTouchpointFlowCreate(BaseModel):
    from_touchpoint_id: int
    to_touchpoint_id: int
    label: Optional[str] = None


class ComercialTouchpointFlowUpdate(BaseModel):
    label: Optional[str] = None
    order: Optional[int] = None


class ComercialCanvasNoteCreate(BaseModel):
    text: str = ""
    color: str = "yellow"


class ComercialCanvasNoteUpdate(BaseModel):
    text: Optional[str] = None
    color: Optional[str] = None


class ComercialCanvasLinkRequest(BaseModel):
    from_type: str
    from_id: str
    to_type: str
    to_id: str


class ComercialInitiativeUpdate(BaseModel):
    pillar_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    motor: Optional[str] = None
    phase_id: Optional[str] = None
    touchpoint_id: Optional[int] = None
    status: Optional[str] = None
    responsable_id: Optional[int] = None
    due_date: Optional[str] = None
    target: Optional[str] = None
    progress: Optional[int] = None
    priority: Optional[str] = None
    area: Optional[str] = None
    tipo: Optional[str] = None
    friction_ids: Optional[List[str]] = None
    touchpoint_ids: Optional[List[int]] = None
    pillar_ids: Optional[List[str]] = None
    involved_ids: Optional[List[int]] = None
    depends_on_ids: Optional[List[int]] = None


class ComercialKpiCreate(BaseModel):
    id: str
    name: str
    question: str = ""
    unit: str = ""
    phase_id: Optional[str] = None
    owner_id: Optional[int] = None


class ComercialKpiUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    phase_id: Optional[str] = None
    owner_id: Optional[int] = None
    tracking_mode: Optional[str] = None
    frequency: Optional[str] = None
    grace_days: Optional[int] = None
    threshold_super_green: Optional[float] = None
    threshold_green: Optional[float] = None
    threshold_yellow: Optional[float] = None
    direction: Optional[str] = None
    is_tracked: Optional[bool] = None
    desc_super_green: Optional[str] = None
    desc_green: Optional[str] = None
    desc_yellow: Optional[str] = None
    desc_red: Optional[str] = None


class ComercialTpKpiConfigUpdate(BaseModel):
    is_critical: Optional[bool] = None
    target_value_local: Optional[float] = None
    responsable_id: Optional[int] = None


class ComercialTpKpiMeasurement(BaseModel):
    value: float
    notes: str = ""
    author: str = ""


class ComercialKpiHistoryCreate(BaseModel):
    value: float
    period: str = ""  # "2026-04" format, auto-filled if empty
    notes: str = ""


class ComercialKpiFrictionLink(BaseModel):
    friction_id: str


class ComercialCommentCreate(BaseModel):
    entity_type: str
    entity_id: str
    text: str
    author: str = ""
    link: str = ""
