#!/usr/bin/env python3
"""Puebla la base con los datos del módulo Arquitectura Comercial."""

import argparse
import sys
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

from sqlalchemy import delete  # noqa: E402

from app.database import SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Base, ComercialActivityLog, ComercialFriction, ComercialKpi,
    ComercialKpiFriction, ComercialKpiTouchpoint, ComercialPerson,
    ComercialPhase, ComercialTouchpoint, ComercialTrustPillar,
)

# ── Datos ─────────────────────────────────────────────────────

PHASES = [
    {"id": "atraccion",  "name": "Atracción",          "icon": "🧲", "color": "#6366f1", "description": "Cómo llegamos a nuestros prospectos", "order": 1},
    {"id": "captura",    "name": "Captura",             "icon": "📥", "color": "#8b5cf6", "description": "Cómo capturamos datos del prospecto", "order": 2},
    {"id": "conversion", "name": "Conversión",          "icon": "💰", "color": "#ec4899", "description": "Cómo convertimos prospectos en clientes", "order": 3},
    {"id": "onboarding", "name": "Onboarding",          "icon": "🚀", "color": "#14b8a6", "description": "Cómo entregamos y damos la bienvenida al cliente", "order": 4},
    {"id": "recompra",   "name": "Recompra",            "icon": "🔄", "color": "#f59e0b", "description": "Cómo hacemos que el cliente vuelva a comprar", "order": 5},
    {"id": "confianza",  "name": "Motor de Confianza",  "icon": "⚡", "color": "#22c55e", "description": "El motor que alimenta todas las fases", "order": 6},
]

TOUCHPOINTS = [
    # Atracción (12)
    {"id": 1,  "phase_id": "atraccion", "name": "Prospecto busca en Google, aparece Promoselect", "canal": "SEO - Sitios web / e-commerce", "responsable": "Marketing", "kpi": "Posición promedio, Tráfico orgánico", "friction_text": None, "has_friction": False, "order": 1},
    {"id": 2,  "phase_id": "atraccion", "name": "Prospecto da clic en anuncio Google Ads", "canal": "SEM - Landing pages", "responsable": "Marketing", "kpi": "CTR, Costo por clic", "friction_text": None, "has_friction": False, "order": 2},
    {"id": 3,  "phase_id": "atraccion", "name": "Prospecto aterriza en landing page", "canal": "Web", "responsable": "Marketing", "kpi": "Tasa de rebote, Tiempo en página", "friction_text": None, "has_friction": False, "order": 3},
    {"id": 4,  "phase_id": "atraccion", "name": "Prospecto ve anuncio en Instagram/Facebook", "canal": "Meta Ads", "responsable": "Marketing", "kpi": "Alcance, CPM, CTR", "friction_text": "Más pauta directa que branding orgánico", "has_friction": True, "order": 4},
    {"id": 5,  "phase_id": "atraccion", "name": "Prospecto da clic al anuncio Meta", "canal": "Meta Ads", "responsable": "Marketing", "kpi": "Costo por lead", "friction_text": None, "has_friction": False, "order": 5},
    {"id": 6,  "phase_id": "atraccion", "name": "Prospecto encuentra perfil de LinkedIn", "canal": "LinkedIn", "responsable": "Comercial", "kpi": "Visitas al perfil, Conexiones", "friction_text": "Solo prospección, sin contenido orgánico", "has_friction": True, "order": 6},
    {"id": 7,  "phase_id": "atraccion", "name": "Prospecto nos conoce en expo/feria", "canal": "Presencial", "responsable": "Comercial", "kpi": "Leads capturados por evento", "friction_text": None, "has_friction": False, "order": 7},
    {"id": 8,  "phase_id": "atraccion", "name": "Prospecto nos conoce vía BNI/USEM/Cámara", "canal": "Networking", "responsable": "Dirección", "kpi": "Referidos por sesión", "friction_text": None, "has_friction": False, "order": 8},
    {"id": 9,  "phase_id": "atraccion", "name": "Alguien refiere a Promoselect", "canal": "Referidos", "responsable": "(Nadie)", "kpi": "Referidos por mes", "friction_text": "SIN ESTRATEGIA — llegan muy pocos, no hay incentivo ni proceso", "has_friction": True, "order": 9},
    {"id": 10, "phase_id": "atraccion", "name": "Prospecto entra al e-commerce y contacta vía WhatsApp", "canal": "E-commerce → Wati (WhatsApp)", "responsable": "Pre-sells", "kpi": "Leads vía e-commerce/día, Tasa de contacto", "friction_text": "Nuevo canal clave: capturar visitante que navega y escribe por WhatsApp", "has_friction": True, "order": 10},
    {"id": 11, "phase_id": "atraccion", "name": "Campaña de mailing a base de prospectos pasados", "canal": "Email Marketing", "responsable": "Marketing / Comercial", "kpi": "Tasa de apertura, CTR, Leads reactivados", "friction_text": "Se necesita segmentar bases, limpiar datos, crear campañas recurrentes", "has_friction": True, "order": 11},
    {"id": 12, "phase_id": "atraccion", "name": "Prospecto llama por teléfono a números locales", "canal": "Llamadas entrantes (números locales)", "responsable": "Pre-sells / Aircall", "kpi": "Llamadas entrantes/día, Origen por ciudad", "friction_text": "Integrar números de distintas ciudades con tracking de origen a ZOHO", "has_friction": True, "order": 12},
    # Captura (10)
    {"id": 13, "phase_id": "captura", "name": "Prospecto llena formulario en landing/web", "canal": "Formularios → ZOHO", "responsable": "Automático", "kpi": "Leads capturados/día", "friction_text": None, "has_friction": False, "order": 1},
    {"id": 14, "phase_id": "captura", "name": "Prospecto escribe por WhatsApp (desde IG/FB/Web/E-commerce)", "canal": "Wati → ZOHO", "responsable": "Pre-sells", "kpi": "Leads por WhatsApp/día", "friction_text": None, "has_friction": False, "order": 2},
    {"id": 15, "phase_id": "captura", "name": "Prospecto llama por teléfono (números locales)", "canal": "Aircall → ZOHO", "responsable": "Pre-sells", "kpi": "Llamadas recibidas por ciudad", "friction_text": "Integrar números locales con tracking de origen", "has_friction": True, "order": 3},
    {"id": 16, "phase_id": "captura", "name": "Lead capturado en LinkedIn", "canal": "Manual → ZOHO", "responsable": "Comercial", "kpi": "Leads LinkedIn/semana", "friction_text": "PROCESO MANUAL — no hay integración", "has_friction": True, "order": 4},
    {"id": 17, "phase_id": "captura", "name": "Lead capturado en expo/networking", "canal": "Manual → ZOHO", "responsable": "Comercial", "kpi": "Leads por evento", "friction_text": "PROCESO MANUAL", "has_friction": True, "order": 5},
    {"id": 18, "phase_id": "captura", "name": "Lead reactivado por campaña de mailing", "canal": "Email → ZOHO", "responsable": "Marketing", "kpi": "Leads reactivados/campaña", "friction_text": "Depende de calidad de base de datos y segmentación", "has_friction": True, "order": 6},
    {"id": 19, "phase_id": "captura", "name": "Pre-sells recibe notificación del nuevo lead", "canal": "ZOHO/Wati", "responsable": "Pre-sells", "kpi": "Tiempo primera respuesta", "friction_text": "CRÍTICO: En horario < 30 min (bien). Fuera de horario/fines de semana = HASTA EL LUNES", "has_friction": True, "order": 7},
    {"id": 20, "phase_id": "captura", "name": "Pre-sells hace primer contacto con el prospecto", "canal": "WhatsApp/Teléfono", "responsable": "Pre-sells", "kpi": "% de contacto exitoso", "friction_text": "CRÍTICO: Leads se acumulan, nuevos entierran viejos. Efecto bola de nieve.", "has_friction": True, "order": 8},
    {"id": 21, "phase_id": "captura", "name": "Pre-sells perfila al prospecto (5 etapas ZOHO)", "canal": "ZOHO CRM", "responsable": "Pre-sells", "kpi": "% de perfilamiento completo", "friction_text": "ZOHO al 80% de configuración", "has_friction": True, "order": 9},
    {"id": 22, "phase_id": "captura", "name": "Pre-sells asigna lead perfilado a un asesor", "canal": "ZOHO → Tratos/Proyectos", "responsable": "Pre-sells", "kpi": "Tiempo de asignación", "friction_text": "SIN REGLAS: Asignación debe basarse en nivel asesor, % respuesta, % seguimiento, cuota cuentas activas", "has_friction": True, "order": 10},
    # Conversión (13)
    {"id": 23, "phase_id": "conversion", "name": "Asesor hace primer contacto con prospecto asignado", "canal": "WhatsApp/Llamada", "responsable": "Asesor", "kpi": "Tiempo contacto post-asignación", "friction_text": "NO ESTANDARIZADO: Falta guión/protocolo de primer contacto", "has_friction": True, "order": 1},
    {"id": 24, "phase_id": "conversion", "name": "Asesor entiende necesidad del cliente", "canal": "Llamada/Reunión", "responsable": "Asesor", "kpi": "—", "friction_text": "~48 tipos de necesidades, no hay guía diagnóstica estandarizada", "has_friction": True, "order": 2},
    {"id": 25, "phase_id": "conversion", "name": "Asesor valida presupuesto, decisor, tiempos, entrega", "canal": "Llamada/WhatsApp", "responsable": "Asesor", "kpi": "% leads calificados", "friction_text": "Sin clasificación de tipo de cliente (ciclo rápido vs lento)", "has_friction": True, "order": 3},
    {"id": 26, "phase_id": "conversion", "name": "RUTA AAA: Lead corporativo grande — reunión especial", "canal": "Reunión presencial o videollamada formal", "responsable": "Asesor Senior", "kpi": "Tasa de avance a propuesta", "friction_text": "Sin formato diferenciado: presentación profesional, casos de éxito por industria, expertise sectorial", "has_friction": True, "order": 4},
    {"id": 27, "phase_id": "conversion", "name": "Asesor solicita logotipo del cliente", "canal": "WhatsApp/Email", "responsable": "Asesor", "kpi": "—", "friction_text": None, "has_friction": False, "order": 5},
    {"id": 28, "phase_id": "conversion", "name": "Se genera propuesta PDF con marca del cliente", "canal": "Interno → Email/WhatsApp", "responsable": "Asesor + Diseño", "kpi": "Tiempo de generación de propuesta", "friction_text": "REDISEÑAR: costos ocultos, falta tiempos, sin garantías, sin diferenciadores", "has_friction": True, "order": 6},
    {"id": 29, "phase_id": "conversion", "name": "Se envía montado virtual del producto", "canal": "Email/WhatsApp", "responsable": "Diseño", "kpi": "—", "friction_text": None, "has_friction": False, "order": 7},
    {"id": 30, "phase_id": "conversion", "name": "Cliente aprueba montado y propuesta", "canal": "WhatsApp", "responsable": "Cliente → Asesor", "kpi": "Tasa de aprobación", "friction_text": None, "has_friction": False, "order": 8},
    {"id": 31, "phase_id": "conversion", "name": "Asesor da seguimiento post-cotización", "canal": "WhatsApp/Llamada/Email", "responsable": "Asesor", "kpi": "# de seguimientos por oportunidad", "friction_text": "CRÍTICO: Sin cadencia estándar. Debe ser idéntico para todos los asesores.", "has_friction": True, "order": 9},
    {"id": 32, "phase_id": "conversion", "name": "Negociación de precio/condiciones", "canal": "WhatsApp/Llamada", "responsable": "Asesor", "kpi": "—", "friction_text": "Pierden por precio — sin argumentario de valor claro", "has_friction": True, "order": 10},
    {"id": 33, "phase_id": "conversion", "name": "Captura datos fiscales y de entrega", "canal": "ZOHO/WhatsApp", "responsable": "Asesor", "kpi": "—", "friction_text": None, "has_friction": False, "order": 11},
    {"id": 34, "phase_id": "conversion", "name": "Se genera factura", "canal": "Sistema", "responsable": "Admin", "kpi": "—", "friction_text": None, "has_friction": False, "order": 12},
    {"id": 35, "phase_id": "conversion", "name": "Cliente realiza pago", "canal": "Transferencia", "responsable": "Admin", "kpi": "Tiempo de cobro", "friction_text": None, "has_friction": False, "order": 13},
    # Onboarding (13)
    {"id": 36, "phase_id": "onboarding", "name": "Se envía orden de venta con datos de pago", "canal": "Email", "responsable": "Admin", "kpi": "—", "friction_text": "NO sistematizado, diseño incompleto", "has_friction": True, "order": 1},
    {"id": 37, "phase_id": "onboarding", "name": "Cliente prellena info facturación en portal autoservicio", "canal": "Portal web / Sistema autoservicio", "responsable": "Cliente → Admin", "kpi": "% datos completos, Tiempo de llenado", "friction_text": "POR CREAR: sistema donde el cliente capture su info fiscal y entrega", "has_friction": True, "order": 2},
    {"id": 38, "phase_id": "onboarding", "name": "Alta como proveedor (solo corporativos AAA)", "canal": "Email/Docs", "responsable": "Admin", "kpi": "Tiempo de alta", "friction_text": "Documentación lista pero proceso manual", "has_friction": True, "order": 3},
    {"id": 39, "phase_id": "onboarding", "name": "Pre-factura → Factura → Pago", "canal": "Sistema", "responsable": "Admin", "kpi": "—", "friction_text": None, "has_friction": False, "order": 4},
    {"id": 40, "phase_id": "onboarding", "name": "Recordatorio de liquidación vía WhatsApp", "canal": "Wati (automatizado)", "responsable": "Sistema → Cliente", "kpi": "Tiempo entre factura y pago", "friction_text": "POR CONFIGURAR: automatizar recordatorios de pago", "has_friction": True, "order": 5},
    {"id": 41, "phase_id": "onboarding", "name": "Montado virtual final → Aprobación", "canal": "Email/WhatsApp", "responsable": "Diseño → Cliente", "kpi": "—", "friction_text": None, "has_friction": False, "order": 6},
    {"id": 42, "phase_id": "onboarding", "name": "Notificación: Pago recibido, inicia producción", "canal": "WhatsApp (Wati) / Portal", "responsable": "Sistema → Cliente", "kpi": "—", "friction_text": "POR CREAR: confirmación automática de pago + inicio producción", "has_friction": True, "order": 7},
    {"id": 43, "phase_id": "onboarding", "name": "Producción del pedido", "canal": "Interno", "responsable": "Producción", "kpi": "Tiempo de producción", "friction_text": "CUELLO DE BOTELLA: productos fuera de catálogo", "has_friction": True, "order": 8},
    {"id": 44, "phase_id": "onboarding", "name": "Evidencia de control de calidad", "canal": "WhatsApp / Portal", "responsable": "Producción → Cliente", "kpi": "—", "friction_text": "POR CREAR: fotos producto terminado antes de embalar", "has_friction": True, "order": 9},
    {"id": 45, "phase_id": "onboarding", "name": "Notificación: Montados autorizados, preparando envío", "canal": "WhatsApp (Wati) / Portal", "responsable": "Sistema → Cliente", "kpi": "—", "friction_text": "POR CREAR: actualización automática al cliente", "has_friction": True, "order": 10},
    {"id": 46, "phase_id": "onboarding", "name": "Empaque con marca Promoselect", "canal": "Físico", "responsable": "Logística", "kpi": "% de envíos con empaque de marca", "friction_text": "SIN EMPAQUE DE MARCA: cajas propias, etiquetado, evidencia fotográfica", "has_friction": True, "order": 11},
    {"id": 47, "phase_id": "onboarding", "name": "Notificación: Pedido embarcado + guía rastreo", "canal": "WhatsApp (Wati) / Portal", "responsable": "Logística → Cliente", "kpi": "—", "friction_text": "POR CREAR: guía rastreo, ruta, planeación entrega, horario estimado", "has_friction": True, "order": 12},
    {"id": 48, "phase_id": "onboarding", "name": "Entrega al cliente", "canal": "Paquetería", "responsable": "Logística", "kpi": "Tiempo de entrega, % entregas completas", "friction_text": None, "has_friction": False, "order": 13},
    # Recompra (7)
    {"id": 49, "phase_id": "recompra", "name": "Llamada de satisfacción post-entrega (2 semanas)", "canal": "Teléfono/WhatsApp", "responsable": "Asesor", "kpi": "NPS, Satisfacción", "friction_text": "NO EXISTE HOY — Implementar", "has_friction": True, "order": 1},
    {"id": 50, "phase_id": "recompra", "name": "Regalo de primera compra (cliente nuevo) + QR", "canal": "Físico (dentro del pedido)", "responsable": "Logística / Marketing", "kpi": "% clientes nuevos que reciben regalo", "friction_text": "POR CREAR: regalo segmentado por tipo de cuenta + QR a promociones", "has_friction": True, "order": 2},
    {"id": 51, "phase_id": "recompra", "name": "Felicitación de cumpleaños", "canal": "WhatsApp / Email / Físico", "responsable": "Sistema automático (ZOHO)", "kpi": "Mensajes enviados, Tasa de respuesta", "friction_text": "POR CREAR: mapear cumpleaños en ZOHO, enviar regalo/mensaje", "has_friction": True, "order": 3},
    {"id": 52, "phase_id": "recompra", "name": "Celebración primer aniversario como cliente", "canal": "WhatsApp / Email / Físico", "responsable": "Sistema automático (ZOHO)", "kpi": "Clientes celebrados, Recompras post-aniversario", "friction_text": "POR CREAR: mapear fecha primera compra, enviar detalle al año", "has_friction": True, "order": 4},
    {"id": 53, "phase_id": "recompra", "name": "Campaña reactivación clientes inactivos", "canal": "Email / WhatsApp", "responsable": "Marketing / Comercial", "kpi": "Tasa de reactivación", "friction_text": "NO EXISTE HOY — Campañas a clientes sin compra en 6+ meses", "has_friction": True, "order": 5},
    {"id": 54, "phase_id": "recompra", "name": "Contacto proactivo por temporada/evento", "canal": "WhatsApp / Teléfono", "responsable": "Asesor", "kpi": "Ventas recurrentes", "friction_text": "NO EXISTE HOY — Anticipar necesidades por historial", "has_friction": True, "order": 6},
    {"id": 55, "phase_id": "recompra", "name": "Programa de cliente frecuente", "canal": "POR DEFINIR", "responsable": "POR DEFINIR", "kpi": "Retención, Ticket promedio recurrente", "friction_text": "NO EXISTE HOY — Diseñar beneficios escalonados", "has_friction": True, "order": 7},
]

FRICTIONS = [
    {"id": "F1",  "phase_id": "captura",    "name": "Sin respuesta fuera de horario/fines de semana", "impact": "high", "solution": "Chatbot/flujo automatizado en Wati que responda 24/7, perfila y agenda para el siguiente día laboral. Flujo de 7 mensajes ya diseñado.", "expected_outcome": "Recuperar 20-30% de leads perdidos por falta de respuesta", "status": "in_progress", "deadline": "2026-04-21", "notes": "Flujo de 7 mensajes diseñado. Pendiente: configurar en Wati, integrar con ZOHO, probar."},
    {"id": "F2",  "phase_id": "conversion",  "name": "Seguimiento post-cotización sin estructura ni estándar", "impact": "high", "solution": "Crear cadencia estándar de seguimiento: guión por día, canales (WhatsApp + llamada + email), contenido de valor en cada contacto.", "expected_outcome": "Subir conversión de 3% a 10-15%", "status": "pending", "deadline": "2026-04-28", "notes": ""},
    {"id": "F3",  "phase_id": "captura",     "name": "Bola de nieve de leads (nuevos entierran viejos)", "impact": "high", "solution": "Scoring automático en ZOHO: priorizar por urgencia + tamaño de oportunidad. Cola FIFO para leads sin atender.", "expected_outcome": "Dejar de perder leads ya calientes", "status": "pending", "deadline": "2026-04-28", "notes": ""},
    {"id": "F4",  "phase_id": "conversion",  "name": "Sin diagnóstico estructurado (48 tipos de necesidades)", "impact": "high", "solution": "Crear guía de 5-10 preguntas diagnósticas que TODO asesor debe hacer antes de cotizar.", "expected_outcome": "Mejorar calidad de propuestas y reducir propuestas genéricas", "status": "pending", "deadline": "2026-04-21", "notes": ""},
    {"id": "F5",  "phase_id": "conversion",  "name": "Sin trazabilidad de seguimientos en ZOHO", "impact": "high", "solution": "Configurar ZOHO para ver: seguimientos por lead, tasa de cierre de leads nuevos vs cuentas activas.", "expected_outcome": "Visibilidad total del pipeline de ventas", "status": "pending", "deadline": "2026-05-05", "notes": ""},
    {"id": "F6",  "phase_id": "captura",     "name": "Sin reglas de asignación de leads", "impact": "high", "solution": "Definir reglas basadas en: nivel del asesor, % de respuesta, % de seguimiento, cuota de cuentas activas.", "expected_outcome": "Asignación justa, medible y que incentive el rendimiento", "status": "pending", "deadline": "2026-05-05", "notes": ""},
    {"id": "F7",  "phase_id": "conversion",  "name": "Propuesta PDF con fricción (costos ocultos, sin garantías)", "impact": "medium", "solution": "Rediseñar plantilla de propuesta: envío incluido, tiempos por producto, garantías, montado virtual, caso de éxito.", "expected_outcome": "Mejorar percepción profesional y tasa de cierre", "status": "pending", "deadline": "2026-05-15", "notes": ""},
    {"id": "F8",  "phase_id": "conversion",  "name": "Sin ruta especial para leads AAA (enterprise)", "impact": "medium", "solution": "Crear proceso diferenciado para corporativos grandes: presentación formal, casos de éxito por industria.", "expected_outcome": "Cerrar cuentas enterprise de alto valor", "status": "pending", "deadline": "2026-05-15", "notes": ""},
    {"id": "F9",  "phase_id": "conversion",  "name": "Sin clasificación de tipo de cliente", "impact": "medium", "solution": "Crear 3 categorías: Express (1 semana), Estándar (2-4 semanas), Enterprise/AAA (1-3 meses).", "expected_outcome": "Proceso adecuado por segmento, expectativas claras", "status": "pending", "deadline": "2026-05-15", "notes": ""},
    {"id": "F10", "phase_id": "conversion",  "name": "Sin argumentario de valor vs precio", "impact": "medium", "solution": "Crear battlecard con diferenciadores, ROI, garantías, respuestas a objeciones de precio.", "expected_outcome": "Reducir pérdidas por competencia de precio", "status": "pending", "deadline": "2026-05-30", "notes": ""},
    {"id": "F11", "phase_id": "conversion",  "name": "Primer contacto del asesor no estandarizado", "impact": "medium", "solution": "Protocolo obligatorio: qué dice, en cuánto tiempo, cómo presenta a Promoselect, guión escrito.", "expected_outcome": "Experiencia consistente para todo prospecto", "status": "pending", "deadline": "2026-05-30", "notes": ""},
    {"id": "F12", "phase_id": "atraccion",   "name": "Sin estrategia de referidos intencional", "impact": "medium", "solution": "Programa formal: pedir referido post-entrega exitosa, incentivo, tracking en ZOHO.", "expected_outcome": "+20% leads de alta calidad", "status": "pending", "deadline": "2026-05-30", "notes": ""},
    {"id": "F13", "phase_id": "onboarding",  "name": "Sin tracking de pedido para el cliente", "impact": "low", "solution": "Portal del cliente con 8 fases visibles y notificaciones WhatsApp automáticas.", "expected_outcome": "Mejorar NPS, confianza y generar recompra", "status": "pending", "deadline": "2026-06-30", "notes": ""},
    {"id": "F14", "phase_id": "onboarding",  "name": "Sin empaque de marca ni evidencia de calidad", "impact": "low", "solution": "Cajas propias de Promoselect, etiquetado estándar, evidencia fotográfica.", "expected_outcome": "Diferenciación y aumento de confianza", "status": "pending", "deadline": "2026-06-30", "notes": ""},
    {"id": "F15", "phase_id": "onboarding",  "name": "Cliente prellena datos manualmente (ida y vuelta)", "impact": "low", "solution": "Portal web autoservicio para datos fiscales, dirección de entrega, contacto.", "expected_outcome": "Reducir fricción operativa y tiempos de procesamiento", "status": "pending", "deadline": "2026-06-30", "notes": ""},
    {"id": "F16", "phase_id": "onboarding",  "name": "Sin recordatorios automáticos de pago", "impact": "low", "solution": "Automatizar en Wati: mensajes 3 días antes, 1 día antes, día de envío.", "expected_outcome": "Cobrar más rápido, reducir días de cartera", "status": "pending", "deadline": "2026-06-30", "notes": ""},
    {"id": "F17", "phase_id": "recompra",    "name": "Sin estrategia activa de recompra", "impact": "low", "solution": "Regalo primera compra, felicitación cumpleaños, aniversario, contacto estacional, programa frecuente.", "expected_outcome": "+30-40% ingresos recurrentes", "status": "pending", "deadline": "2026-07-15", "notes": ""},
    {"id": "F18", "phase_id": "confianza",   "name": "Motor de Confianza inactivo (5 pilares sin trabajar)", "impact": "low", "solution": "Iniciar con testimonios y casos de éxito por industria. Después: contenido, branding, reviews.", "expected_outcome": "Multiplicador general de confianza en todas las fases", "status": "pending", "deadline": "2026-07-15", "notes": ""},
    {"id": "F19", "phase_id": "captura",     "name": "ZOHO al 80% — falta 20% de integraciones", "impact": "low", "solution": "Completar: automatizaciones de asignación, integraciones Wati↔ZOHO, scoring, dashboards.", "expected_outcome": "Base tecnológica completa para todo lo demás", "status": "pending", "deadline": "2026-07-15", "notes": ""},
]

TRUST_PILLARS = [
    {"id": "contenido",   "name": "CONTENIDO",   "icon": "📝", "current_state": "Poco contenido generado, sin estrategia", "target_state": "TikTok con interacción humana, presencia digital fuerte", "actions": '["Crear calendario de contenido semanal", "Iniciar TikTok con videos cortos de productos", "LinkedIn orgánico con contenido de valor", "Blog con SEO intencional"]', "status": "pending", "order": 1},
    {"id": "testimonios", "name": "TESTIMONIOS", "icon": "⭐", "current_state": "No se capturan testimonios de clientes satisfechos", "target_state": "Captura sistemática, newsletters, video testimonials", "actions": '["Pedir testimonio después de llamada de satisfacción", "Crear formato de caso de éxito por industria", "Publicar en web y redes", "Newsletter mensual con casos"]', "status": "pending", "order": 2},
    {"id": "marca",       "name": "MARCA",       "icon": "🎨", "current_state": "Estética decente pero inconsistente entre canales", "target_state": "Postales primer pedido, empaque de marca, touchpoints cuidados", "actions": '["Estandarizar empaque", "Postales/tarjetas en cada envío", "Manual de marca para asesores", "Templates de propuesta consistentes"]', "status": "pending", "order": 3},
    {"id": "autoridad",   "name": "AUTORIDAD",   "icon": "🏆", "current_state": "Algo de SEO/blogs sin intención estratégica", "target_state": "Blogs posicionados, presencia en medios, expertos por industria", "actions": '["Casos de éxito segmentados por industria para leads AAA", "Blog con keywords de alta intención", "Participación en medios/podcasts", "Certificaciones visibles"]', "status": "pending", "order": 4},
    {"id": "comunidad",   "name": "COMUNIDAD",   "icon": "🤝", "current_state": "Nada activo — sin reviews ni comunidad", "target_state": "Reviews en e-commerce, Google Maps, grupo de clientes top", "actions": '["Reviews en Google Maps post-entrega", "Reviews en e-commerce", "Impactómetro de productos entregados", "Grupo exclusivo de clientes top"]', "status": "pending", "order": 5},
]

KPIS = [
    {"id": "utilidad",   "name": "Utilidad",   "question": "¿Te queda dinero después de todo?", "current_value": None, "target_value": None, "unit": "MXN"},
    {"id": "cac",        "name": "CAC",        "question": "¿Cuánto cuesta adquirir un cliente?", "current_value": None, "target_value": None, "unit": "MXN"},
    {"id": "ltv",        "name": "LTV",        "question": "¿Cuánto vale un cliente en su vida?", "current_value": None, "target_value": None, "unit": "MXN"},
    {"id": "conversion", "name": "Conversión", "question": "De 10 prospectos, ¿cuántos compran?", "current_value": 3, "target_value": 50, "unit": "%"},
]


PEOPLE = [
    {"id": 1, "name": "Jerónimo Celis", "role": "Director General", "area": "Dirección", "avatar_color": "#6366f1", "order": 1},
    {"id": 2, "name": "Equipo Marketing", "role": "Marketing Digital", "area": "Marketing", "avatar_color": "#ec4899", "order": 2},
    {"id": 3, "name": "Equipo Pre-sells", "role": "Pre-ventas", "area": "Comercial", "avatar_color": "#8b5cf6", "order": 3},
    {"id": 4, "name": "Equipo Comercial", "role": "Asesores de Venta", "area": "Comercial", "avatar_color": "#f59e0b", "order": 4},
    {"id": 5, "name": "Equipo Admin", "role": "Administración", "area": "Operaciones", "avatar_color": "#14b8a6", "order": 5},
    {"id": 6, "name": "Equipo Diseño", "role": "Diseño Gráfico", "area": "Operaciones", "avatar_color": "#22c55e", "order": 6},
    {"id": 7, "name": "Equipo Logística", "role": "Logística y Envíos", "area": "Operaciones", "avatar_color": "#ef4444", "order": 7},
    {"id": 8, "name": "Equipo Producción", "role": "Producción", "area": "Operaciones", "avatar_color": "#f97316", "order": 8},
]

# Mapeo responsable texto → persona_id
RESPONSABLE_MAP = {
    "Marketing": 2, "Marketing / Comercial": 2,
    "Pre-sells": 3, "Pre-sells / Aircall": 3,
    "Comercial": 4, "Asesor": 4, "Asesor Senior": 4, "Cliente → Asesor": 4,
    "Admin": 5, "Automático": None, "(Nadie)": None,
    "Diseño": 6, "Asesor + Diseño": 4, "Diseño → Cliente": 6,
    "Logística": 7, "Logística / Marketing": 7, "Logística → Cliente": 7,
    "Producción": 8, "Producción → Cliente": 8,
    "Dirección": 1, "Sistema → Cliente": None, "Sistema automático (ZOHO)": None,
    "POR DEFINIR": None, "Cliente → Admin": 5,
}

# Mapeo fricción → touchpoint que afecta
FRICTION_TOUCHPOINT_MAP = {
    "F1": 19, "F2": 31, "F3": 20, "F4": 24, "F5": 31, "F6": 22,
    "F7": 28, "F8": 26, "F9": 25, "F10": 32, "F11": 23, "F12": 9,
    "F13": 47, "F14": 46, "F15": 37, "F16": 40, "F17": 49, "F18": None, "F19": 21,
}

# Vínculos KPI ↔ fase/owner
KPI_LINKS = {
    "utilidad": {"phase_id": None, "owner_id": 1},
    "cac": {"phase_id": "atraccion", "owner_id": 2},
    "ltv": {"phase_id": "recompra", "owner_id": 4},
    "conversion": {"phase_id": "conversion", "owner_id": 4},
}

# KPI ↔ Fricciones que los impactan
KPI_FRICTION_LINKS = [
    {"kpi_id": "conversion", "friction_id": "F1"}, {"kpi_id": "conversion", "friction_id": "F2"},
    {"kpi_id": "conversion", "friction_id": "F4"}, {"kpi_id": "conversion", "friction_id": "F5"},
    {"kpi_id": "conversion", "friction_id": "F11"},
    {"kpi_id": "cac", "friction_id": "F3"}, {"kpi_id": "cac", "friction_id": "F6"},
    {"kpi_id": "cac", "friction_id": "F12"}, {"kpi_id": "cac", "friction_id": "F19"},
    {"kpi_id": "ltv", "friction_id": "F17"}, {"kpi_id": "ltv", "friction_id": "F9"},
    {"kpi_id": "utilidad", "friction_id": "F7"}, {"kpi_id": "utilidad", "friction_id": "F10"},
]


def seed(clear: bool = True) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if clear:
            db.execute(delete(ComercialActivityLog))
            db.execute(delete(ComercialKpiTouchpoint))
            db.execute(delete(ComercialKpiFriction))
            db.execute(delete(ComercialTouchpoint))
            db.execute(delete(ComercialFriction))
            db.execute(delete(ComercialTrustPillar))
            db.execute(delete(ComercialKpi))
            db.execute(delete(ComercialPhase))
            db.execute(delete(ComercialPerson))
            db.commit()

        # Phases
        for p in PHASES:
            db.merge(ComercialPhase(**p))
        db.commit()

        # Touchpoints
        for t in TOUCHPOINTS:
            existing = db.get(ComercialTouchpoint, t["id"])
            if not existing:
                db.add(ComercialTouchpoint(**t))
        db.commit()

        # Frictions
        for f in FRICTIONS:
            data = {**f}
            if data["deadline"]:
                data["deadline"] = date.fromisoformat(data["deadline"])
            if data.get("resolution_checklist") is None:
                data["resolution_checklist"] = []
            db.merge(ComercialFriction(**data))
        db.commit()

        # Trust Pillars
        for p in TRUST_PILLARS:
            db.merge(ComercialTrustPillar(**p))
        db.commit()

        # KPIs
        for k in KPIS:
            db.merge(ComercialKpi(**k))
        db.commit()

        # People
        for p in PEOPLE:
            data = {k: v for k, v in p.items() if k != "id"}
            existing = db.get(ComercialPerson, p["id"])
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(ComercialPerson(id=p["id"], **data))
        db.commit()

        # Backfill responsable_id on touchpoints
        for tp in db.query(ComercialTouchpoint).all():
            if tp.responsable and not tp.responsable_id:
                pid = RESPONSABLE_MAP.get(tp.responsable)
                if pid:
                    tp.responsable_id = pid
        db.commit()

        # Backfill responsable_id and touchpoint_id on frictions
        for f in db.query(ComercialFriction).all():
            fid = f.id
            tp_id = FRICTION_TOUCHPOINT_MAP.get(fid)
            if tp_id and not f.touchpoint_id:
                f.touchpoint_id = tp_id
        db.commit()

        # KPI phase/owner links
        for kpi_id, links in KPI_LINKS.items():
            kpi = db.get(ComercialKpi, kpi_id)
            if kpi:
                if links.get("phase_id"):
                    kpi.phase_id = links["phase_id"]
                if links.get("owner_id"):
                    kpi.owner_id = links["owner_id"]
        db.commit()

        # KPI-Friction links
        for link in KPI_FRICTION_LINKS:
            existing = db.query(ComercialKpiFriction).filter(
                ComercialKpiFriction.kpi_id == link["kpi_id"],
                ComercialKpiFriction.friction_id == link["friction_id"],
            ).first()
            if not existing:
                db.add(ComercialKpiFriction(**link))
        db.commit()

        print(f"✓ {len(PHASES)} fases")
        print(f"✓ {len(TOUCHPOINTS)} touchpoints")
        print(f"✓ {len(FRICTIONS)} fricciones")
        print(f"✓ {len(TRUST_PILLARS)} pilares de confianza")
        print(f"✓ {len(KPIS)} KPIs maestros")
        print(f"✓ {len(PEOPLE)} personas")
        print(f"✓ {len(KPI_FRICTION_LINKS)} vínculos KPI↔fricción")

        # Create granular KPIs from touchpoint kpi text and link them
        import re
        kpi_count = 0
        link_count = 0
        for tp in db.query(ComercialTouchpoint).all():
            if not tp.kpi or tp.kpi.strip() == "—" or tp.kpi.strip() == "":
                continue
            # Split by comma
            parts = [p.strip() for p in tp.kpi.split(",") if p.strip() and p.strip() != "—"]
            for part in parts:
                # Generate slug ID
                slug = re.sub(r'[^a-z0-9]+', '_', part.lower().strip()).strip('_')
                if not slug:
                    continue
                # Create KPI if not exists
                existing = db.get(ComercialKpi, slug)
                if not existing:
                    db.add(ComercialKpi(
                        id=slug, name=part.strip(), question="",
                        unit="", phase_id=tp.phase_id,
                    ))
                    db.flush()
                    kpi_count += 1
                # Create link if not exists
                link_exists = db.query(ComercialKpiTouchpoint).filter(
                    ComercialKpiTouchpoint.kpi_id == slug,
                    ComercialKpiTouchpoint.touchpoint_id == tp.id,
                ).first()
                if not link_exists:
                    db.add(ComercialKpiTouchpoint(kpi_id=slug, touchpoint_id=tp.id))
                    link_count += 1
        db.commit()
        print(f"✓ {kpi_count} KPIs granulares creados")
        print(f"✓ {link_count} vínculos KPI↔touchpoint")

        print("✅ Seed comercial completado.")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed datos Arquitectura Comercial")
    parser.add_argument("--no-clear", action="store_true", help="No borrar datos existentes")
    args = parser.parse_args()
    seed(clear=not args.no_clear)
