from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text, func
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
