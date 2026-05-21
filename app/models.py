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

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="")
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)


class ComercialTouchpoint(Base):
    __tablename__ = "comercial_touchpoints"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
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
    description: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    # v13: 8 atributos formales — Operación
    internal_checklist = mapped_column(JSON, default=list)
    duration_minutes = mapped_column(Integer, nullable=True)
    duration_label: Mapped[str] = mapped_column(String(50), default="")
    # v13: 8 atributos formales — Diagnóstico
    classification: Mapped[str] = mapped_column(String(20), default="normal")
    leverage_point: Mapped[str] = mapped_column(String(20), default="none")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialFriction(Base):
    __tablename__ = "comercial_frictions"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    phase_id: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(400), nullable=False)
    impact: Mapped[str] = mapped_column(String(20), default="high")
    description: Mapped[str] = mapped_column(Text, default="")
    solution: Mapped[str] = mapped_column(Text, default="")
    expected_outcome: Mapped[str] = mapped_column(String(400), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    deadline = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    responsable: Mapped[str] = mapped_column(String(200), default="")
    responsable_id = mapped_column(Integer, nullable=True)
    touchpoint_id = mapped_column(Integer, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    resolution_checklist = mapped_column(JSON, default=list)
    # v13: tipo de fricción ∈ {time, repetition, channel_switch, incomplete_info,
    # unmet_expectations, cognitive_effort} — Manifesto §20
    friction_type = mapped_column(String(30), nullable=True)
    # v18: marca explícita de fricción crítica — el AI prioriza solo críticas al
    # generar iniciativas; el usuario puede filtrar el listado por críticas.
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at = mapped_column(DateTime, nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialTrustPillar(Base):
    __tablename__ = "comercial_trust_pillars"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="")
    current_state: Mapped[str] = mapped_column(Text, default="")
    target_state: Mapped[str] = mapped_column(Text, default="")
    actions: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    order: Mapped[int] = mapped_column(Integer, default=0)


class ComercialTrustPillarStep(Base):
    """v14 — Wizard Motor de Confianza (autoplan F3 / task #64).

    Cada pilar tiene N pasos accionables (qué hacer, evidencia, dueño, status).
    Pensados como bloques de construcción del Motor: pasos concretos que el
    equipo ejecuta para cerrar la brecha entre current_state y target_state.
    """
    __tablename__ = "comercial_trust_pillar_steps"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pillar_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    evidence: Mapped[str] = mapped_column(Text, default="")  # cómo sabemos que está cerrado
    responsable_id = mapped_column(Integer, nullable=True)
    due_date = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | in_progress | completed
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# v15 — F4 Tablas de gobernanza (task #66)
class ComercialGovernanceCharter(Base):
    """Carta de gobernanza singleton (id=1). Define dueño del modelo,
    ritmo de revisión, criterios de cambio y principios rectores."""
    __tablename__ = "comercial_governance_charter"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id = mapped_column(Integer, nullable=True)
    cadence: Mapped[str] = mapped_column(String(20), default="monthly")  # weekly|biweekly|monthly|quarterly
    change_criteria: Mapped[str] = mapped_column(Text, default="")
    principles: Mapped[str] = mapped_column(Text, default="")
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialGovernanceGap(Base):
    """Registro de huecos. gap_type: 'tp' | 'friction' | 'kpi' | 'pillar' | 'other'."""
    __tablename__ = "comercial_governance_gaps"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    gap_type: Mapped[str] = mapped_column(String(20), nullable=False)
    reference_id: Mapped[str] = mapped_column(String(50), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(10), default="medium")  # high|medium|low
    status: Mapped[str] = mapped_column(String(20), default="open")  # open|closed
    owner_id = mapped_column(Integer, nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    closed_at = mapped_column(DateTime, nullable=True)


class ComercialGovernanceTest(Base):
    """Pruebas de validación. test_type: 'contract' | 'market' | 'process'."""
    __tablename__ = "comercial_governance_tests"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_type: Mapped[str] = mapped_column(String(20), nullable=False)
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    hypothesis: Mapped[str] = mapped_column(Text, default="")
    evidence: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="planned")  # planned|running|passed|failed
    performed_at = mapped_column(DateTime, nullable=True)
    owner_id = mapped_column(Integer, nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialInitiative(Base):
    __tablename__ = "comercial_iniciativas"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
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
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    friction_id: Mapped[str] = mapped_column(String(10), primary_key=True)


class ComercialInitiativeTouchpoint(Base):
    __tablename__ = "comercial_initiative_touchpoint"
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    touchpoint_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class ComercialInitiativePillar(Base):
    __tablename__ = "comercial_initiative_pillar"
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pillar_id: Mapped[str] = mapped_column(String(50), primary_key=True)


class ComercialInitiativeInvolved(Base):
    __tablename__ = "comercial_initiative_involved"
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    person_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class ComercialInitiativeDependency(Base):
    __tablename__ = "comercial_initiative_dependency"
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    initiative_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    depends_on_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class ComercialCanvasLayout(Base):
    __tablename__ = "comercial_canvas_layout"
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
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
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    from_touchpoint_id: Mapped[int] = mapped_column(Integer, index=True)
    to_touchpoint_id: Mapped[int] = mapped_column(Integer, index=True)
    label = mapped_column(String(80), nullable=True)
    order = mapped_column(Integer, default=0)
    created_at = mapped_column(DateTime, server_default=func.now())


class ComercialCanvasNote(Base):
    __tablename__ = "comercial_canvas_notes"
    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(20), default="yellow")
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialKpi(Base):
    __tablename__ = "comercial_kpis"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
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
    # v13: tag para 4 maestras (Utilidad, LTV, CAC, Conversión) — Manifesto §31
    is_master: Mapped[bool] = mapped_column(Boolean, default=False)
    master_metric = mapped_column(String(20), nullable=True)  # 'utility', 'ltv', 'cac', 'conversion'
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComercialPerson(Base):
    __tablename__ = "comercial_people"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
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

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(10), default="")  # "2026-01", "2026-02", etc.
    recorded_at = mapped_column(DateTime, server_default=func.now())
    notes: Mapped[str] = mapped_column(String(400), default="")


class ComercialKpiFriction(Base):
    __tablename__ = "comercial_kpi_friction"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    friction_id: Mapped[str] = mapped_column(String(10), nullable=False)


class ComercialKpiTouchpoint(Base):
    __tablename__ = "comercial_kpi_touchpoint"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    touchpoint_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    target_value_local = mapped_column(Float, nullable=True)
    responsable_id = mapped_column(Integer, nullable=True)


class ComercialTpKpiHistory(Base):
    """Medición periódica de un KPI en el contexto de un touchpoint crítico."""
    __tablename__ = "comercial_tp_kpi_history"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[str] = mapped_column(String(50), nullable=False)
    touchpoint_id: Mapped[int] = mapped_column(Integer, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(400), default="")
    author: Mapped[str] = mapped_column(String(200), default="")
    recorded_at = mapped_column(DateTime, server_default=func.now())


class ComercialComment(Base):
    __tablename__ = "comercial_comments"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "friction", "touchpoint", "pillar"
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(200), default="")
    link: Mapped[str] = mapped_column(Text, default="")  # URL to evidence/screenshot
    created_at = mapped_column(DateTime, server_default=func.now())


class ComercialActivityLog(Base):
    __tablename__ = "comercial_activity_log"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str] = mapped_column(Text, nullable=True)
    new_value: Mapped[str] = mapped_column(Text, nullable=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at = mapped_column(DateTime, server_default=func.now())


class ComercialChannel(Base):
    """Catálogo de canales canónicos (WhatsApp, Email, Llamada, etc).

    Reemplaza el campo libre `tp.canal` por una entidad estructurada con
    icono, color y orden. M:N con touchpoints vía `comercial_touchpoint_channel`.
    """
    __tablename__ = "comercial_channels"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="")
    color: Mapped[str] = mapped_column(String(20), default="#94A3B8")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)


class ComercialTouchpointChannel(Base):
    __tablename__ = "comercial_touchpoint_channel"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    touchpoint_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    channel_id: Mapped[str] = mapped_column(String(50), primary_key=True)


# v16 — Company Context (singleton id=1) — task #92
# Alimenta la AI con info de la empresa para que sus sugerencias estén
# calibradas. Reemplaza el campo company_context manual del modal de AI.
class ComercialCompanyContext(Base):
    __tablename__ = "comercial_company_context"

    brand_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_name: Mapped[str] = mapped_column(String(200), default="")
    industry: Mapped[str] = mapped_column(String(200), default="")
    business_model: Mapped[str] = mapped_column(String(50), default="")  # B2B/B2C/B2B2C/Marketplace
    target_segment: Mapped[str] = mapped_column(Text, default="")
    geographies: Mapped[str] = mapped_column(Text, default="")
    team_size = mapped_column(Integer, nullable=True)
    sales_team_size = mapped_column(Integer, nullable=True)
    avg_ticket_mxn = mapped_column(Float, nullable=True)
    sales_cycle_days = mapped_column(Integer, nullable=True)
    main_value_prop: Mapped[str] = mapped_column(Text, default="")
    top_competitors: Mapped[str] = mapped_column(Text, default="")
    main_pains_today: Mapped[str] = mapped_column(Text, default="")
    # v18: objetivos principales del CEO — alimentan al AI cuando sugiere
    # fricciones e iniciativas (no solo qué duele, también qué se quiere lograr).
    main_objectives: Mapped[str] = mapped_column(Text, default="")
    language_style: Mapped[str] = mapped_column(String(20), default="directo")
    notes: Mapped[str] = mapped_column(Text, default="")
    # v19: 3 pruebas de validación del workbook (Cris Urzúa, Parte 5).
    # Cada una se atestigua con un boolean + nota libre de qué se descubrió.
    validated_terreno: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_terreno_notes: Mapped[str] = mapped_column(Text, default="")
    validated_fantasma: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_fantasma_notes: Mapped[str] = mapped_column(Text, default="")
    validated_datos: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_datos_notes: Mapped[str] = mapped_column(Text, default="")
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# v20 — Workspaces (multi-marca).
# Cada marca es un workspace independiente. Promoselect ocupa id=1.
# Las 28 tablas comercial_* ahora se filtran por brand_id (default=1 para
# datos legacy). El frontend pasa el header X-Brand-Id en cada request.
class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    # UUID de Supabase Auth (auth.users.id). NULL = legacy (solo admins en ADMIN_USER_IDS).
    owner_user_id: Mapped[str] = mapped_column(String(36), nullable=True, index=True)
    created_at = mapped_column(DateTime, server_default=func.now())
