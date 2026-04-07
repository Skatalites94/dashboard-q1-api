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
