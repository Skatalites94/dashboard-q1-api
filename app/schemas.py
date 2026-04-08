from __future__ import annotations

from typing import Optional

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

class SimConfigUpdate(BaseModel):
    valor: dict

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

class EscenarioIngresoCreate(BaseModel):
    nombre: str
    descripcion: str = ""
