"""Seed del Simulador de Ingresos — asesores, config, tipos de cliente."""

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from app.database import Base, SessionLocal, engine
from app.models import EscenarioIngreso, SimAsesor, SimConfig, SimTipoCliente

asesores = [
    {"nombre": "Ivette García", "tipo": "senior", "fecha_inicio": "2024-01-01", "cuota_mensual": 2500000, "madurez_pct": 80},
    {"nombre": "Ulises Arias", "tipo": "junior", "fecha_inicio": "2025-01-01", "cuota_mensual": 1200000, "madurez_pct": 70},
    {"nombre": "Margarita González", "tipo": "junior", "fecha_inicio": "2025-01-01", "cuota_mensual": 1200000, "madurez_pct": 80},
    {"nombre": "Elba Karina Hernández", "tipo": "rookie", "fecha_inicio": "2026-01-01", "cuota_mensual": 1200000, "madurez_pct": 60},
    {"nombre": "Ángel Escamilla", "tipo": "junior", "fecha_inicio": "2026-01-01", "cuota_mensual": 1200000, "madurez_pct": 50},
    {"nombre": "Irma Ibarra", "tipo": "rookie", "fecha_inicio": "2025-11-01", "cuota_mensual": 1200000, "madurez_pct": 0, "activo": False, "nota": "Cortada en escenario actual"},
    {"nombre": "Lorena Durán", "tipo": "rookie", "fecha_inicio": "2025-11-01", "cuota_mensual": 1200000, "madurez_pct": 0, "activo": False, "nota": "Cortada en escenario actual"},
]

config_entries = [
    ("seasonality", {
        "Ene": 0.91, "Feb": 0.69, "Mar": 1.22, "Abr": 0.98, "May": 1.04, "Jun": 1.35,
        "Jul": 1.40, "Ago": 0.93, "Sep": 0.71, "Oct": 1.04, "Nov": 0.86, "Dic": 0.54,
    }),
    ("cuotas_default", {"rookie": 600000, "junior": 1200000, "senior": 2000000}),
    ("margen_bruto", 0.28),
    ("factor_friccion", 0.85),
    ("comisiones", {
        "senior": {"sueldo": 25000, "base_pct": 0.065, "accel_pct": 0.015, "overhead": 2850},
        "junior": {"sueldo": 16000, "base_pct": 0.055, "accel_pct": 0.015, "overhead": 2850},
        "rookie": {"sueldo": 15000, "base_pct": 0.05, "accel_pct": 0.01, "overhead": 2850},
    }),
    ("marketing", {
        "presupuesto_mensual": 77745,
        "canales": {
            "Pautas digitales": {"pct": 0.30, "cpl": 500},
            "Eventos": {"pct": 0.40, "cpl": 2000},
            "SEO/Orgánico": {"pct": 0.15, "cpl": 200},
            "Referidos": {"pct": 0.15, "cpl": 0},
        },
        "tasa_calificacion": 0.40,
        "distribucion_calidad": {"AAAH": 0.10, "AAAC": 0.20, "A": 0.70},
    }),
]

tipos_cliente = [
    {"codigo": "AAAH", "nombre": "Alto Valor Histórico", "leads_mensuales": 0, "tasa_retencion": 0.80, "tasa_cierre": 0.50, "meses_cierre": 3, "ticket_promedio": 688198, "facturas_por_cliente": 0.34},
    {"codigo": "AAAC", "nombre": "Alto Valor Cierre", "leads_mensuales": 0, "tasa_retencion": 0.80, "tasa_cierre": 0.50, "meses_cierre": 3, "ticket_promedio": 213723, "facturas_por_cliente": 1.35},
    {"codigo": "A", "nombre": "Regular", "leads_mensuales": 0, "tasa_retencion": 0.70, "tasa_cierre": 0.50, "meses_cierre": 1, "ticket_promedio": 72869, "facturas_por_cliente": 0.46},
]


def seed_simulador(clear=True):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if clear:
            for model in [SimAsesor, SimConfig, SimTipoCliente, EscenarioIngreso]:
                db.query(model).delete()
            db.commit()

        for a in asesores:
            db.add(SimAsesor(
                nombre=a["nombre"], tipo=a["tipo"],
                fecha_inicio=a.get("fecha_inicio", ""),
                cuota_mensual=a.get("cuota_mensual", 0),
                madurez_pct=a.get("madurez_pct", 0),
                activo=a.get("activo", True),
                nota=a.get("nota", ""),
            ))

        for clave, valor in config_entries:
            db.add(SimConfig(clave=clave, valor=valor))

        for tc in tipos_cliente:
            db.add(SimTipoCliente(**tc))

        db.commit()
        print(f"OK: {len(asesores)} asesores, {len(config_entries)} configs, {len(tipos_cliente)} tipos cliente")
    finally:
        db.close()


if __name__ == "__main__":
    seed_simulador()
