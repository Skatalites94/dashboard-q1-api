"""Seed del módulo Configurador de Gastos — datos del HTML original."""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from app.database import Base, SessionLocal, engine
from app.models import CategoriaGasto, Consultoria, Empleado, GastoFinanciero, GastoOperativo, Suscripcion

# ── Data extraída del HTML ─────────────────────────────────────

# Esquemas de pago y sus factores de costo empresa:
# nomina_gpp: Nómina completa GPP → sueldo_neto * factor_carga (default 1.35 = 35% carga social)
# poder_global: Pago vía poder global → sueldo_neto * (1 + comision_pct) (comisión ~4%)
# factura: El empleado factura → sueldo_neto * 1.0 (sin carga social, quizá + IVA)
# mixto: Parte nómina GPP + parte poder global → sueldo_imss * factor_carga + sueldo_complemento * (1 + comision_pct)
# otra_razon: Pagado por otra razón social → sueldo_neto (costo directo)

def calc_costo_empresa(e):
    """Calcula costo empresa basado en esquema de pago."""
    esquema = e.get("esquema", "nomina_gpp")
    sueldo = e.get("sueldo_neto", 0)
    factor = e.get("factor_carga", 1.35)
    comision = e.get("comision_pct", 0.04)

    if esquema == "nomina_gpp":
        return round(sueldo * factor, 2)
    elif esquema == "poder_global":
        return round(sueldo * (1 + comision), 2)
    elif esquema == "factura":
        return round(sueldo, 2)  # Sin carga social
    elif esquema == "mixto":
        imss = e.get("sueldo_imss", 0)
        complemento = e.get("sueldo_complemento", 0)
        return round(imss * factor + complemento * (1 + comision), 2)
    elif esquema == "otra_razon":
        return round(sueldo, 2)
    return round(sueldo, 2)

# Datos actualizados de nóminas (ENE Q2 2026 + sueldos.xlsx)
# sueldo_neto = lo que percibe el empleado mensualmente
employees = [
    # ── Dirección (Poder Global) ──
    {"nombre": "ALFONSO RAMIREZ", "depto": "DIRECCIÓN", "sueldo_neto": 125000, "esquema": "poder_global", "comision_pct": 0.04, "nota": "Poder Global"},
    {"nombre": "JERONIMO CELIS", "depto": "DIRECCIÓN", "sueldo_neto": 125000, "esquema": "poder_global", "comision_pct": 0.04, "nota": "Poder Global"},
    {"nombre": "GABRIEL CELIS", "depto": "PRODUCCIÓN", "sueldo_neto": 0, "esquema": "poder_global", "comision_pct": 0.04, "nota": "Sin sueldo actualmente en GPP"},
    # ── Producción (Mixto: nómina GPP + poder global) ──
    {"nombre": "J. DE JESÚS TABARES", "depto": "PRODUCCIÓN", "sueldo_neto": 17750, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 8299, "comision_pct": 0.04},
    {"nombre": "MISAEL MEDINA", "depto": "PRODUCCIÓN", "sueldo_neto": 19000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 19000, "comision_pct": 0.04, "nota": "100% PPP nómina"},
    {"nombre": "DAVID BADILLO", "depto": "PRODUCCIÓN", "sueldo_neto": 15000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 15000, "comision_pct": 0.04},
    {"nombre": "GABRIEL GUTIÉRREZ", "depto": "PRODUCCIÓN", "sueldo_neto": 15000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 15000, "comision_pct": 0.04},
    {"nombre": "IVÁN MARTÍNEZ (Logística)", "depto": "PRODUCCIÓN", "sueldo_neto": 13250, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 3799, "comision_pct": 0.04},
    # ── Almacén (otra razón social) ──
    {"nombre": "ANA LOURDES LOPEZ JAUREGUI", "depto": "PRODUCCIÓN", "sueldo_neto": 8571, "esquema": "otra_razon", "nota": "Otra razón social"},
    {"nombre": "ARIANA YAMILETH CAMPOS CRUZ", "depto": "PRODUCCIÓN", "sueldo_neto": 5060, "esquema": "otra_razon", "nota": "Medio tiempo, otra razón social"},
    {"nombre": "JOSE ALFREDO RODRIGUEZ GARCÍA", "depto": "PRODUCCIÓN", "sueldo_neto": 8571, "esquema": "otra_razon", "nota": "Otra razón social"},
    # ── Administración (Mixto) ──
    {"nombre": "ERIKA ZÁRATE", "depto": "COMPRAS", "sueldo_neto": 19500, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 10049, "comision_pct": 0.04},
    {"nombre": "ARTURO MANDUJANO", "depto": "SISTEMAS", "sueldo_neto": 25000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 25000, "comision_pct": 0.04},
    {"nombre": "ROCÍO SANDOVAL", "depto": "ASIST. DIRECCIÓN", "sueldo_neto": 25000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 25000, "comision_pct": 0.04},
    {"nombre": "ROGER SALAZAR", "depto": "VENTAS/GERENTE", "sueldo_neto": 35000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 35000, "comision_pct": 0.04},
    {"nombre": "GABRIELA ESPARZA", "depto": "CONTABILIDAD", "sueldo_neto": 27000, "esquema": "mixto", "sueldo_imss": 10718, "sueldo_complemento": 16282, "comision_pct": 0.04},
    {"nombre": "BLANCA GALLARDO", "depto": "COMPRAS", "sueldo_neto": 21000, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 11549, "comision_pct": 0.04},
    {"nombre": "CITLALLI RAMÍREZ", "depto": "MARKETING", "sueldo_neto": 24194, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 14743, "comision_pct": 0.04},
    {"nombre": "CINDY RUIZ PAJARITO", "depto": "RH", "sueldo_neto": 25000, "esquema": "mixto", "sueldo_imss": 25160, "sueldo_complemento": 0, "comision_pct": 0, "nota": "100% fiscal GPP"},
    {"nombre": "NANCY GONZÁLEZ (Limpieza)", "depto": "LIMPIEZA", "sueldo_neto": 9451, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 9451, "comision_pct": 0.04},
    # ── Ventas (Mixto) ──
    {"nombre": "IVETTE GARCÍA", "depto": "VENTAS SR CDMX", "sueldo_neto": 17500, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 17500, "comision_pct": 0.04},
    {"nombre": "ULISES ARIAS", "depto": "VENTAS JR", "sueldo_neto": 12500, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 12500, "comision_pct": 0.04},
    {"nombre": "MARGARITA GONZÁLEZ", "depto": "VENTAS JR", "sueldo_neto": 12500, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 12500, "comision_pct": 0.04},
    {"nombre": "ELBA KARINA HERNÁNDEZ", "depto": "VENTAS JR", "sueldo_neto": 15000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 15000, "comision_pct": 0.04},
    {"nombre": "IRMA IBARRA", "depto": "VENTAS", "sueldo_neto": 16000, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 6549, "comision_pct": 0.04, "cortado": True},
    {"nombre": "LORENA DURÁN", "depto": "VENTAS", "sueldo_neto": 16000, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 6549, "comision_pct": 0.04, "cortado": True},
    {"nombre": "ÁNGEL ESCAMILLA", "depto": "VENTAS", "sueldo_neto": 15000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 15000, "comision_pct": 0.04},
    # ── Presales / Factura ──
    {"nombre": "NANCY AGUILERA", "depto": "PRESALES", "sueldo_neto": 23000, "esquema": "factura", "nota": "Factura servicios profesionales"},
    # ── Diseño (otra razón social) ──
    {"nombre": "BEATRIZ LUMBRERAS", "depto": "DISEÑO", "sueldo_neto": 16000, "esquema": "otra_razon", "cortado": True, "nota": "Sustituir por $12K"},
    {"nombre": "DIANA RAMÍREZ", "depto": "DISEÑO", "sueldo_neto": 12500, "esquema": "otra_razon"},
    # ── Black Box ──
    {"nombre": "ANA SOFÍA GRANADOS", "depto": "BLACK BOX", "sueldo_neto": 22000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 22000, "comision_pct": 0.04},
    # ── Sistemas (otra razón / factura) ──
    {"nombre": "JORGE RAMOS", "depto": "SISTEMAS", "sueldo_neto": 13514, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 4063, "comision_pct": 0.04, "cortado": True},
    {"nombre": "MATÍAS FANGER", "depto": "SISTEMAS", "sueldo_neto": 20000, "esquema": "otra_razon", "cortado": True},
    {"nombre": "BRUNO SANTOS", "depto": "SISTEMAS", "sueldo_neto": 8000, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 8000, "comision_pct": 0.04},
    {"nombre": "ISIS VÁZQUEZ (Aux. Contable)", "depto": "CONTABILIDAD", "sueldo_neto": 5933, "esquema": "mixto", "sueldo_imss": 0, "sueldo_complemento": 5933, "comision_pct": 0.04},
    # ── Paris (Compras) ──
    {"nombre": "VALERIA PARIS", "depto": "COMPRAS", "sueldo_neto": 12000, "esquema": "mixto", "sueldo_imss": 9451, "sueldo_complemento": 2549, "comision_pct": 0.04, "cortado": True},
    # ── Freelance / Servicios ──
    {"nombre": "Videos Producción (freelance)", "depto": "MARKETING", "sueldo_neto": 12000, "esquema": "factura", "nota": "Servicio de video externo"},
    {"nombre": "Aux. Marketing (freelance)", "depto": "MARKETING", "sueldo_neto": 4000, "esquema": "factura"},
]

gastos_operativos = [
    {"nombre": "Fletes", "costo": 47530, "categoria": "Venta", "fijo": True},
    {"nombre": "Talleres", "costo": 44891, "categoria": "Venta", "fijo": True},
    {"nombre": "Marketing", "costo": 35180, "categoria": "Admin"},
    {"nombre": "Marketing - Eventos", "costo": 42565, "categoria": "Admin"},
    {"nombre": "Almacenamiento", "costo": 31751, "categoria": "Venta"},
    {"nombre": "Comisiones Admin", "costo": 31124, "categoria": "Admin"},
    {"nombre": "Paquetería", "costo": 29572, "categoria": "Venta", "fijo": True},
    {"nombre": "Comisiones de Venta", "costo": 27091, "categoria": "Venta"},
    {"nombre": "Bodega", "costo": 27367, "categoria": "Admin", "fijo": True},
    {"nombre": "Mano de obra (BBVA)", "costo": 26718, "categoria": "Venta"},
    {"nombre": "Publicidad (Pautas)", "costo": 17960, "categoria": "Venta"},
    {"nombre": "Mantenimiento Vehículos", "costo": 17491, "categoria": "Admin", "fijo": True},
    {"nombre": "Mantenimiento Oficina", "costo": 14788, "categoria": "Admin", "fijo": True},
    {"nombre": "FaceBK / Meta Ads", "costo": 14307, "categoria": "Admin"},
    {"nombre": "Aduanas", "costo": 13457, "categoria": "Venta", "fijo": True},
    {"nombre": "Gasolina", "costo": 11926, "categoria": "Admin"},
    {"nombre": "Insumos (Jeeves)", "costo": 6452, "categoria": "Venta"},
    {"nombre": "Insumos", "costo": 10734, "categoria": "Venta"},
    {"nombre": "Celulares", "costo": 10417, "categoria": "Admin"},
    {"nombre": "Oficina (Efectivo)", "costo": 9121, "categoria": "Admin"},
    {"nombre": "Oficina", "costo": 9402, "categoria": "Admin"},
    {"nombre": "Mantenimiento Bodega", "costo": 7859, "categoria": "Admin", "fijo": True},
    {"nombre": "Cultura RH", "costo": 7188, "categoria": "Admin"},
    {"nombre": "Muestras", "costo": 5273, "categoria": "Venta"},
    {"nombre": "Internet COEFICIENTE", "costo": 5437, "categoria": "Admin", "fijo": True},
    {"nombre": "Otros Gastos (AMEX)", "costo": 3776, "categoria": "Admin"},
    {"nombre": "Uniformes", "costo": 3340, "categoria": "Admin"},
    {"nombre": "Nómina Becarios", "costo": 3310, "categoria": "Admin"},
    {"nombre": "Despensa (Jeeves)", "costo": 2785, "categoria": "Admin"},
    {"nombre": "Networking", "costo": 2874, "categoria": "Admin"},
    {"nombre": "Camaleón", "costo": 2540, "categoria": "Admin"},
    {"nombre": "Uber (AMEX)", "costo": 2265, "categoria": "Venta"},
    {"nombre": "Caja chica Almacén", "costo": 2233, "categoria": "Admin"},
    {"nombre": "Meses sin Intereses", "costo": 2121, "categoria": "Admin"},
    {"nombre": "Internet MEGA", "costo": 1667, "categoria": "Admin", "fijo": True},
    {"nombre": "Papelería (Jeeves)", "costo": 1409, "categoria": "Admin"},
    {"nombre": "Capacitaciones", "costo": 1472, "categoria": "Admin"},
    {"nombre": "Reclutamiento", "costo": 1165, "categoria": "Admin"},
    {"nombre": "Uber", "costo": 1117, "categoria": "Venta"},
    {"nombre": "Mano de obra (Efectivo)", "costo": 867, "categoria": "Venta"},
    {"nombre": "Nómina Limpieza (Efvo)", "costo": 1067, "categoria": "Admin"},
    {"nombre": "Servicios Legales", "costo": 5443, "categoria": "Admin"},
    {"nombre": "Depreciación Activos Fijos", "costo": 28061, "categoria": "Admin", "fijo": True},
    {"nombre": "IMSS", "costo": 33863, "categoria": "Admin", "fijo": True},
    {"nombre": "Prestaciones Dirección", "costo": 51641, "categoria": "Admin"},
    {"nombre": "Despensa (BBVA)", "costo": 252, "categoria": "Admin"},
    {"nombre": "Cultura Posada", "costo": 216, "categoria": "Admin"},
    {"nombre": "Cultura Ventas", "costo": 115, "categoria": "Admin"},
    {"nombre": "Limpieza", "costo": 76, "categoria": "Admin"},
    {"nombre": "Otros Gastos (Jeeves)", "costo": 314, "categoria": "Admin"},
    {"nombre": "Otros Gastos (BanRegio)", "costo": 90, "categoria": "Admin"},
]

suscripciones = [
    {"nombre": "WATI.IO (WhatsApp API)", "costo": 8646, "frecuencia": "Mensual+Variable", "nota": "Subió mucho en Q1 2026"},
    {"nombre": "ROAM HQ (oficina virtual)", "costo": 5719, "frecuencia": "Mensual", "nota": "3 cobros/mes — ¿necesitas 3?"},
    {"nombre": "CURSOR AI", "costo": 2959, "frecuencia": "Mensual", "nota": "~6-8 licencias de desarrollo"},
    {"nombre": "CHATGPT", "costo": 2202, "frecuencia": "Mensual", "nota": "Múltiples licencias"},
    {"nombre": "ZOHO CRM", "costo": 2686, "frecuencia": "Mixto (anual+mensual)", "nota": "Cobro mensual $209 + anuales"},
    {"nombre": "IDEJEWEBSDE", "costo": 2024, "frecuencia": "Mensual", "nota": "$2,024 fijo mensual"},
    {"nombre": "CLAUDE / ANTHROPIC", "costo": 2060, "frecuencia": "Mensual", "nota": "2 planes distintos"},
    {"nombre": "GOOGLE CLOUD + One", "costo": 2065, "frecuencia": "Mensual", "nota": "Múltiples servicios cloud"},
    {"nombre": "ALEGRA (contabilidad)", "costo": 1999, "frecuencia": "Mensual", "nota": "Software contable"},
    {"nombre": "ADOBE (×4 licencias)", "costo": 1970, "frecuencia": "Mensual", "nota": "Jeeves + AMEX"},
    {"nombre": "LOVABLE (AI código)", "costo": 1552, "frecuencia": "Mensual", "nota": "¿Se sigue usando?"},
    {"nombre": "FIGMA", "costo": 1437, "frecuencia": "Anual $17K + mensual", "nota": "Anual pagado Feb 2026"},
    {"nombre": "ALGOLIA (búsqueda)", "costo": 1375, "frecuencia": "Mensual"},
    {"nombre": "NOTION", "costo": 1154, "frecuencia": "Mensual"},
    {"nombre": "AMAZON AWS", "costo": 1076, "frecuencia": "Mensual", "nota": "Creciente"},
    {"nombre": "BANAHOSTING", "costo": 750, "frecuencia": "Anual ~$9K", "nota": "Pagado Q1 2026"},
    {"nombre": "GODADDY (dominios)", "costo": 822, "frecuencia": "Mixto", "nota": "Renovaciones anuales"},
    {"nombre": "MICROSOFT 365", "costo": 767, "frecuencia": "Mensual"},
    {"nombre": "AIRTABLE", "costo": 588, "frecuencia": "Mensual", "nota": "¿Duplica ClickUp?"},
    {"nombre": "WISPR (AI dictation)", "costo": 522, "frecuencia": "Mensual"},
    {"nombre": "CANVA", "costo": 447, "frecuencia": "Mensual"},
    {"nombre": "LOOM", "costo": 434, "frecuencia": "Mensual"},
    {"nombre": "SUPABASE", "costo": 448, "frecuencia": "Mensual"},
    {"nombre": "VERCEL", "costo": 370, "frecuencia": "Mensual"},
    {"nombre": "CLICKUP", "costo": 348, "frecuencia": "Mensual"},
    {"nombre": "SINCH MAILGUN", "costo": 354, "frecuencia": "Mensual"},
    {"nombre": "LINKTREE", "costo": 255, "frecuencia": "Mensual", "nota": "¿Necesitas plan de pago?"},
    {"nombre": "AIRCALL (telefonía)", "costo": 1653, "frecuencia": "Anual $60K (pagado 2025)", "nota": "Cobros Q1 son ajustes"},
    {"nombre": "MAX (streaming)", "costo": 167, "frecuencia": "Mensual", "nota": "Posible gasto personal"},
    {"nombre": "OPENAI API", "costo": 103, "frecuencia": "Mensual", "nota": "Bajo uso actual"},
    {"nombre": "ELEVENLABS", "costo": 133, "frecuencia": "Mensual"},
    {"nombre": "MANUS AI", "costo": 125, "frecuencia": "Mensual"},
    {"nombre": "PROTON", "costo": 61, "frecuencia": "Mensual"},
]

consultorias = [
    {"nombre": "SIEFO (contable/fiscal)", "costo": 26000, "nota": "Consultor fiscal mensual"},
    {"nombre": "Arquetipo", "costo": 17842, "nota": "Consultoría mensual"},
    {"nombre": "Sistemas externo", "costo": 16273, "nota": "Soporte IT externo"},
    {"nombre": "Consultores SEO", "costo": 15000, "nota": "Nuevo en 2026"},
]

financieros = [
    {"nombre": "Intereses Bancarios", "costo": 78834, "nota": "Tendencia a la baja (-25% vs 2025)"},
    {"nombre": "Arrendamientos", "costo": 5792, "nota": "Fijo"},
    {"nombre": "Comisiones Bancarias", "costo": 3229, "nota": "Variable"},
    {"nombre": "Seguros de Préstamo", "costo": 1422, "nota": "Fijo"},
]


# ── Categorías iniciales ───────────────────────────────────────

categorias_iniciales = [
    # Nómina
    {"nombre": "Dirección", "modulo": "nomina", "color": "#6366F1", "orden": 1},
    {"nombre": "Ventas", "modulo": "nomina", "color": "#22C55E", "orden": 2},
    {"nombre": "Producción", "modulo": "nomina", "color": "#F59E0B", "orden": 3},
    {"nombre": "Administración", "modulo": "nomina", "color": "#3B82F6", "orden": 4},
    {"nombre": "Sistemas", "modulo": "nomina", "color": "#8B5CF6", "orden": 5},
    {"nombre": "Diseño/Marketing", "modulo": "nomina", "color": "#EC4899", "orden": 6},
    {"nombre": "Compras", "modulo": "nomina", "color": "#14B8A6", "orden": 7},
    # Operativos
    {"nombre": "Venta", "modulo": "operativos", "color": "#22C55E", "orden": 1},
    {"nombre": "Admin", "modulo": "operativos", "color": "#3B82F6", "orden": 2},
    {"nombre": "Fijo / No controlable", "modulo": "operativos", "color": "#94A3B8", "orden": 3},
    # Suscripciones
    {"nombre": "AI / Dev Tools", "modulo": "suscripciones", "color": "#8B5CF6", "orden": 1},
    {"nombre": "Comunicación", "modulo": "suscripciones", "color": "#22C55E", "orden": 2},
    {"nombre": "Infraestructura", "modulo": "suscripciones", "color": "#F59E0B", "orden": 3},
    {"nombre": "Productividad", "modulo": "suscripciones", "color": "#3B82F6", "orden": 4},
    {"nombre": "Diseño", "modulo": "suscripciones", "color": "#EC4899", "orden": 5},
    {"nombre": "Contabilidad", "modulo": "suscripciones", "color": "#14B8A6", "orden": 6},
    # Consultorías
    {"nombre": "Fiscal/Legal", "modulo": "consultorias", "color": "#6366F1", "orden": 1},
    {"nombre": "Tecnología", "modulo": "consultorias", "color": "#8B5CF6", "orden": 2},
    {"nombre": "Marketing", "modulo": "consultorias", "color": "#EC4899", "orden": 3},
    # Financieros
    {"nombre": "Bancarios", "modulo": "financieros", "color": "#EF4444", "orden": 1},
    {"nombre": "Seguros/Arrendamientos", "modulo": "financieros", "color": "#F59E0B", "orden": 2},
]


def seed_gastos(clear=True):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if clear:
            for model in [CategoriaGasto, Empleado, GastoOperativo, Suscripcion, Consultoria, GastoFinanciero]:
                db.query(model).delete()
            db.commit()

        # Seed categorías
        cat_map = {}
        for c in categorias_iniciales:
            row = CategoriaGasto(**c)
            db.add(row)
            db.flush()
            cat_map[(c["modulo"], c["nombre"])] = row.id

        for e in employees:
            costo = calc_costo_empresa(e)
            db.add(Empleado(
                nombre=e["nombre"], depto=e.get("depto", ""),
                costo=costo,
                sueldo_neto=e.get("sueldo_neto", 0),
                esquema=e.get("esquema", "nomina_gpp"),
                factor_carga=e.get("factor_carga", 1.35),
                comision_pct=e.get("comision_pct", 0),
                sueldo_imss=e.get("sueldo_imss", 0),
                sueldo_complemento=e.get("sueldo_complemento", 0),
                cortado=e.get("cortado", False),
                es_contratacion=e.get("es_contratacion", False),
                nota=e.get("nota", ""),
            ))

        for g in gastos_operativos:
            db.add(GastoOperativo(
                nombre=g["nombre"], costo=g["costo"],
                categoria=g.get("categoria", "Admin"),
                fijo=g.get("fijo", False),
            ))

        for s in suscripciones:
            db.add(Suscripcion(
                nombre=s["nombre"], costo=s["costo"],
                frecuencia=s.get("frecuencia", "Mensual"),
                nota=s.get("nota", ""),
                usuarios=s.get("usuarios", 1),
                costo_por_usuario=s.get("costo_por_usuario"),
                es_por_usuario=s.get("es_por_usuario", False),
                moneda=s.get("moneda", "MXN"),
            ))

        for c in consultorias:
            db.add(Consultoria(nombre=c["nombre"], costo=c["costo"], nota=c.get("nota", "")))

        for f in financieros:
            db.add(GastoFinanciero(nombre=f["nombre"], costo=f["costo"], nota=f.get("nota", "")))

        db.commit()
        print(f"OK: {len(categorias_iniciales)} categorías, {len(employees)} empleados, "
              f"{len(gastos_operativos)} gastos op., {len(suscripciones)} suscripciones, "
              f"{len(consultorias)} consultorías, {len(financieros)} financieros")
    finally:
        db.close()


if __name__ == "__main__":
    seed_gastos()
