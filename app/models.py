from sqlalchemy import Boolean, Date, DateTime, Float, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asesor: Mapped[str] = mapped_column(String(200), nullable=False)
    cuenta: Mapped[str] = mapped_column(String(400), nullable=False)
    trato: Mapped[str] = mapped_column(Text, nullable=False)
    importe: Mapped[float] = mapped_column(Float, nullable=False)
    pct_util: Mapped[float] = mapped_column(Float, default=0.0)
    utilidad: Mapped[float] = mapped_column(Float, default=0.0)
    fecha: Mapped[str] = mapped_column(String(20), nullable=False)
    mes: Mapped[str] = mapped_column(String(10), nullable=False)
    trimestre: Mapped[str] = mapped_column(String(10), default="Q1")


class Iniciativa(Base):
    __tablename__ = "iniciativas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area: Mapped[str] = mapped_column(String(200), default="")
    resp: Mapped[str] = mapped_column(String(200), default="")
    ini: Mapped[str] = mapped_column(Text, nullable=False)
    pri: Mapped[str] = mapped_column(String(20), default="")
    est: Mapped[str] = mapped_column(String(80), default="")
    av: Mapped[float] = mapped_column(Float, default=0.0)
    notas: Mapped[str] = mapped_column(Text, default="")
    trimestre: Mapped[str] = mapped_column(String(10), default="Q1")


class KpiMeta(Base):
    __tablename__ = "kpis_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi: Mapped[str] = mapped_column(String(200), nullable=False)
    r25: Mapped[str] = mapped_column(String(120), default="")
    m26: Mapped[str] = mapped_column(String(120), default="")


class Semaforo(Base):
    __tablename__ = "semaforo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi: Mapped[str] = mapped_column(Text, default="")
    area: Mapped[str] = mapped_column(String(200), default="")
    resp: Mapped[str] = mapped_column(String(200), default="")
    descripcion: Mapped[str] = mapped_column(Text, default="")
    meta: Mapped[str] = mapped_column(Text, default="")
    ene: Mapped[str] = mapped_column(Text, default="")
    feb: Mapped[str] = mapped_column(Text, default="")
    mar: Mapped[str] = mapped_column(Text, default="")
    est: Mapped[str] = mapped_column(String(80), default="")
    tendencia: Mapped[str] = mapped_column(String(80), default="")
    trimestre: Mapped[str] = mapped_column(String(10), default="Q1")
    diagnostico: Mapped[str] = mapped_column(Text, default="")
    recomendacion: Mapped[str] = mapped_column(Text, default="")


class AreaResumen(Base):
    """Resumen ejecutivo por área y trimestre."""
    __tablename__ = "area_resumen"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area: Mapped[str] = mapped_column(String(200), nullable=False)
    resp: Mapped[str] = mapped_column(String(200), default="")
    rol: Mapped[str] = mapped_column(Text, default="")
    verdes: Mapped[int] = mapped_column(Integer, default=0)
    amarillos: Mapped[int] = mapped_column(Integer, default=0)
    rojos: Mapped[int] = mapped_column(Integer, default=0)
    tendencia: Mapped[str] = mapped_column(String(200), default="")
    trimestre: Mapped[str] = mapped_column(String(10), default="Q1")
    diagnostico: Mapped[str] = mapped_column(Text, default="")
    recomendacion: Mapped[str] = mapped_column(Text, default="")


# ── Módulo Gastos ──────────────────────────────────────────────

class CategoriaGasto(Base):
    __tablename__ = "categorias_gasto"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    modulo: Mapped[str] = mapped_column(String(50), nullable=False)  # nomina, operativos, suscripciones, consultorias, financieros
    color: Mapped[str] = mapped_column(String(20), default="#4C6EF5")
    orden: Mapped[int] = mapped_column(Integer, default=0)


class Empleado(Base):
    __tablename__ = "gastos_empleados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    depto: Mapped[str] = mapped_column(String(200), default="")
    costo: Mapped[float] = mapped_column(Float, nullable=False)  # Costo empresa total mensual (calculado)
    sueldo_neto: Mapped[float] = mapped_column(Float, default=0)  # Lo que percibe el empleado
    esquema: Mapped[str] = mapped_column(String(50), default="nomina_gpp")  # nomina_gpp, poder_global, factura, mixto, otra_razon
    factor_carga: Mapped[float] = mapped_column(Float, default=1.35)  # Factor para calcular costo empresa (ej. 1.35 = 35% carga social)
    comision_pct: Mapped[float] = mapped_column(Float, default=0)  # % comisión (para poder global, ej. 0.04 = 4%)
    sueldo_imss: Mapped[float] = mapped_column(Float, default=0)  # Parte registrada en IMSS (para esquema mixto)
    sueldo_complemento: Mapped[float] = mapped_column(Float, default=0)  # Parte pagada por otra vía (poder global, otra razón social)
    cortado: Mapped[bool] = mapped_column(Boolean, default=False)
    es_contratacion: Mapped[bool] = mapped_column(Boolean, default=False)
    nota: Mapped[str] = mapped_column(String(400), default="")
    categoria_id: Mapped[int] = mapped_column(Integer, nullable=True)


class GastoOperativo(Base):
    __tablename__ = "gastos_operativos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    costo: Mapped[float] = mapped_column(Float, nullable=False)
    categoria: Mapped[str] = mapped_column(String(100), default="Admin")
    fijo: Mapped[bool] = mapped_column(Boolean, default=False)
    cortado: Mapped[bool] = mapped_column(Boolean, default=False)
    categoria_id: Mapped[int] = mapped_column(Integer, nullable=True)


class Suscripcion(Base):
    __tablename__ = "gastos_suscripciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    costo: Mapped[float] = mapped_column(Float, nullable=False)
    frecuencia: Mapped[str] = mapped_column(String(100), default="Mensual")
    nota: Mapped[str] = mapped_column(String(400), default="")
    cortado: Mapped[bool] = mapped_column(Boolean, default=False)
    categoria_id: Mapped[int] = mapped_column(Integer, nullable=True)
    usuarios: Mapped[int] = mapped_column(Integer, default=1)
    costo_por_usuario: Mapped[float] = mapped_column(Float, nullable=True)
    es_por_usuario: Mapped[bool] = mapped_column(Boolean, default=False)
    moneda: Mapped[str] = mapped_column(String(10), default="MXN")
    tipo_cambio: Mapped[float] = mapped_column(Float, default=17.5)


class Consultoria(Base):
    __tablename__ = "gastos_consultorias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    costo: Mapped[float] = mapped_column(Float, nullable=False)
    nota: Mapped[str] = mapped_column(String(400), default="")
    cortado: Mapped[bool] = mapped_column(Boolean, default=False)
    categoria_id: Mapped[int] = mapped_column(Integer, nullable=True)


class GastoFinanciero(Base):
    __tablename__ = "gastos_financieros"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    costo: Mapped[float] = mapped_column(Float, nullable=False)
    nota: Mapped[str] = mapped_column(String(400), default="")
    cortado: Mapped[bool] = mapped_column(Boolean, default=False)
    categoria_id: Mapped[int] = mapped_column(Integer, nullable=True)


class Escenario(Base):
    __tablename__ = "escenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    snapshot = mapped_column(JSON, nullable=False)
    total_original: Mapped[float] = mapped_column(Float, default=0)
    total_nuevo: Mapped[float] = mapped_column(Float, default=0)
    ahorro: Mapped[float] = mapped_column(Float, default=0)
    es_base: Mapped[bool] = mapped_column(Boolean, default=False)


# ── Módulo Simulador de Ingresos ───────────────────────────────

class SimAsesor(Base):
    __tablename__ = "sim_asesores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # rookie, junior, senior
    fecha_inicio: Mapped[str] = mapped_column(String(20), default="")
    cuota_mensual: Mapped[float] = mapped_column(Float, default=0)  # 0 = usar default del tipo
    madurez_pct: Mapped[float] = mapped_column(Float, default=0)  # 0 = auto-calc por tenure
    max_tratos_mes: Mapped[int] = mapped_column(Integer, default=25)  # max deals/month
    max_cartera_activa: Mapped[int] = mapped_column(Integer, default=40)  # max active clients
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    nota: Mapped[str] = mapped_column(String(400), default="")
    horas_habiles_dia: Mapped[float] = mapped_column(Float, default=6.0)  # productive hours/day
    cartera_actual = mapped_column(JSON, default={})  # {"AAAH": 3, "AAAC": 5, "A": 10, "B": 2}


class SimConfig(Base):
    __tablename__ = "sim_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clave: Mapped[str] = mapped_column(String(100), nullable=False)
    valor = mapped_column(JSON, nullable=False)


class SimTipoCliente(Base):
    __tablename__ = "sim_tipo_cliente"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    leads_mensuales: Mapped[int] = mapped_column(Integer, default=0)
    tasa_retencion: Mapped[float] = mapped_column(Float, default=0.7)
    tasa_cierre: Mapped[float] = mapped_column(Float, default=0.5)
    meses_cierre: Mapped[int] = mapped_column(Integer, default=1)
    ticket_promedio: Mapped[float] = mapped_column(Float, default=0)
    facturas_por_cliente: Mapped[float] = mapped_column(Float, default=0.5)
    clientes_iniciales: Mapped[int] = mapped_column(Integer, default=6)
    dias_credito: Mapped[int] = mapped_column(Integer, default=30)
    frecuencia_compra_meses: Mapped[int] = mapped_column(Integer, default=6)  # purchase every N months
    deals_por_anio: Mapped[int] = mapped_column(Integer, default=2)  # deals/projects per year
    horas_cotizacion: Mapped[float] = mapped_column(Float, default=2.0)  # quoting hours per deal
    horas_seguimiento: Mapped[float] = mapped_column(Float, default=1.0)  # follow-up hours per deal
    leads_objetivo: Mapped[int] = mapped_column(Integer, default=0)  # target monthly leads


class EscenarioIngreso(Base):
    __tablename__ = "sim_escenarios_ingreso"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    snapshot = mapped_column(JSON, nullable=False)
    ingreso_anual: Mapped[float] = mapped_column(Float, default=0)
    costo_equipo_anual: Mapped[float] = mapped_column(Float, default=0)
    utilidad_bruta: Mapped[float] = mapped_column(Float, default=0)


# ── Módulo Arquitectura Comercial ─────────────────────────────

class ComercialPhase(Base):
    __tablename__ = "comercial_phases"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="")
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)


class ComercialTouchpoint(Base):
    __tablename__ = "comercial_touchpoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phase_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(400), nullable=False)
    canal: Mapped[str] = mapped_column(String(300), default="")
    responsable: Mapped[str] = mapped_column(String(200), default="")
    responsable_id = mapped_column(Integer, nullable=True)
    kpi: Mapped[str] = mapped_column(String(400), default="")
    friction_text: Mapped[str] = mapped_column(Text, nullable=True)
    has_friction: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialFriction(Base):
    __tablename__ = "comercial_frictions"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    phase_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(400), nullable=False)
    impact: Mapped[str] = mapped_column(String(20), default="high")
    solution: Mapped[str] = mapped_column(Text, default="")
    expected_outcome: Mapped[str] = mapped_column(String(400), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    deadline = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    responsable: Mapped[str] = mapped_column(String(200), default="")
    responsable_id = mapped_column(Integer, nullable=True)
    touchpoint_id = mapped_column(Integer, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    # Checklist de resolución: [{ "text": str, "done": bool }, ...]
    resolution_checklist = mapped_column(JSON, default=list)
    completed_at = mapped_column(DateTime, nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialTrustPillar(Base):
    __tablename__ = "comercial_trust_pillars"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="")
    current_state: Mapped[str] = mapped_column(Text, default="")
    target_state: Mapped[str] = mapped_column(Text, default="")
    actions: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    order: Mapped[int] = mapped_column(Integer, default=0)


class ComercialInitiative(Base):
    __tablename__ = "comercial_iniciativas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pillar_id: Mapped[str] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    motor: Mapped[str] = mapped_column(String(40), default="trust")
    phase_id: Mapped[str] = mapped_column(String(50), nullable=True)
    touchpoint_id = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    responsable_id = mapped_column(Integer, nullable=True)
    due_date = mapped_column(Date, nullable=True)
    target: Mapped[str] = mapped_column(Text, default="")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    area: Mapped[str] = mapped_column(String(60), default="")
    tipo: Mapped[str] = mapped_column(String(20), default="operativa")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialInitiativeFriction(Base):
    __tablename__ = "comercial_initiative_friction"
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    friction_id: Mapped[str] = mapped_column(String(10), primary_key=True)


class ComercialInitiativeTouchpoint(Base):
    __tablename__ = "comercial_initiative_touchpoint"
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    touchpoint_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class ComercialInitiativePillar(Base):
    __tablename__ = "comercial_initiative_pillar"
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pillar_id: Mapped[str] = mapped_column(String(50), primary_key=True)


class ComercialInitiativeInvolved(Base):
    __tablename__ = "comercial_initiative_involved"
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    person_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class ComercialInitiativeDependency(Base):
    __tablename__ = "comercial_initiative_dependency"
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    depends_on_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class ComercialCanvasLayout(Base):
    __tablename__ = "comercial_canvas_layout"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    view_id: Mapped[str] = mapped_column(String(50), default="comercial_main")
    entity_type: Mapped[str] = mapped_column(String(20))
    entity_id: Mapped[str] = mapped_column(String(50))
    x: Mapped[float] = mapped_column(Float, default=0.0)
    y: Mapped[float] = mapped_column(Float, default=0.0)
    width = mapped_column(Float, nullable=True)
    height = mapped_column(Float, nullable=True)
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialTouchpointFlow(Base):
    __tablename__ = "comercial_touchpoint_flow"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    from_touchpoint_id: Mapped[int] = mapped_column(Integer, index=True)
    to_touchpoint_id: Mapped[int] = mapped_column(Integer, index=True)
    label = mapped_column(String(80), nullable=True)
    order = mapped_column(Integer, default=0)
    created_at = mapped_column(DateTime, server_default=func.now())


class ComercialCanvasNote(Base):
    __tablename__ = "comercial_canvas_notes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(20), default="yellow")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialKpi(Base):
    __tablename__ = "comercial_kpis"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    question: Mapped[str] = mapped_column(Text, default="")
    current_value = mapped_column(Float, nullable=True)
    target_value = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="")
    phase_id: Mapped[str] = mapped_column(String(50), nullable=True)
    owner_id = mapped_column(Integer, nullable=True)
    # Hybrid tracking fields
    tracking_mode: Mapped[str] = mapped_column(String(30), default="global_only")
    frequency: Mapped[str] = mapped_column(String(20), default="monthly")
    grace_days: Mapped[int] = mapped_column(Integer, default=3)
    # Semaphore thresholds (4 levels: super_green >= green >= yellow >= red)
    # "higher_is_better" means value >= threshold_super_green is best
    # thresholds define boundaries: >= super_green = super_green, >= green = green, >= yellow = yellow, < yellow = red
    threshold_super_green = mapped_column(Float, nullable=True)
    threshold_green = mapped_column(Float, nullable=True)
    threshold_yellow = mapped_column(Float, nullable=True)
    direction: Mapped[str] = mapped_column(String(20), default="higher")
    is_tracked: Mapped[bool] = mapped_column(Boolean, default=False)
    # Descriptions per semaphore level
    desc_super_green: Mapped[str] = mapped_column(String(400), default="")
    desc_green: Mapped[str] = mapped_column(String(400), default="")
    desc_yellow: Mapped[str] = mapped_column(String(400), default="")
    desc_red: Mapped[str] = mapped_column(String(400), default="")
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialPerson(Base):
    __tablename__ = "comercial_people"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(200), default="")
    area: Mapped[str] = mapped_column(String(200), default="")
    email: Mapped[str] = mapped_column(String(300), nullable=True)
    avatar_color: Mapped[str] = mapped_column(String(20), default="#4C6EF5")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at = mapped_column(DateTime, server_default=func.now())


class ComercialKpiHistory(Base):
    __tablename__ = "comercial_kpi_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(10), default="")  # "2026-01", "2026-02", etc.
    recorded_at = mapped_column(DateTime, server_default=func.now())
    notes: Mapped[str] = mapped_column(String(400), default="")


class ComercialKpiFriction(Base):
    __tablename__ = "comercial_kpi_friction"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    friction_id: Mapped[str] = mapped_column(String(10), nullable=False)


class ComercialKpiTouchpoint(Base):
    __tablename__ = "comercial_kpi_touchpoint"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    touchpoint_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    target_value_local = mapped_column(Float, nullable=True)
    responsable_id = mapped_column(Integer, nullable=True)


class ComercialTpKpiHistory(Base):
    """Medición periódica de un KPI en el contexto de un touchpoint crítico."""
    __tablename__ = "comercial_tp_kpi_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    touchpoint_id: Mapped[int] = mapped_column(Integer, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(400), default="")
    author: Mapped[str] = mapped_column(String(200), default="")
    recorded_at = mapped_column(DateTime, server_default=func.now())


class ComercialComment(Base):
    __tablename__ = "comercial_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "friction", "touchpoint", "pillar"
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(200), default="")
    link: Mapped[str] = mapped_column(Text, default="")  # URL to evidence/screenshot
    created_at = mapped_column(DateTime, server_default=func.now())


class ComercialActivityLog(Base):
    __tablename__ = "comercial_activity_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str] = mapped_column(Text, nullable=True)
    new_value: Mapped[str] = mapped_column(Text, nullable=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at = mapped_column(DateTime, server_default=func.now())
