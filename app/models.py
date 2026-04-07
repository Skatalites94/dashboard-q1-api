from sqlalchemy import Float, Integer, String, Text
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
