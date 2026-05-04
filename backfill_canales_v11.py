#!/usr/bin/env python3
"""Backfill: parsear tp.canal (string) → comercial_touchpoint_channel (M:N).

NO toca tp.canal (se mantiene durante la transición). v12 lo eliminará.

Reglas:
- ZOHO, Wati, Aircall son HERRAMIENTAS, no canales — se mapean al canal real subyacente.
- "WhatsApp/Email/Físico" → 3 canales separados.
- Strings tipo "POR DEFINIR" o vacíos → sin canales.
- "Sistema", "Interno", "Manual", "Transferencia", "Formularios" no son canales externos
  → se ignoran (touchpoint queda sin canal).
"""
from app.database import SessionLocal
from app.models import ComercialTouchpoint, ComercialTouchpointChannel, ComercialChannel

# Mapping de strings (lower-cased, normalizados) → lista de canal IDs canónicos.
# Las herramientas (Wati, ZOHO, Aircall) se mapean al canal subyacente real.
CANAL_MAP = {
    # WhatsApp y variantes
    "whatsapp": ["whatsapp"],
    "wati (automatizado)": ["whatsapp"],
    "wati → zoho": ["whatsapp"],
    "e-commerce → wati (whatsapp)": ["whatsapp", "web"],
    "whatsapp (wati) / portal": ["whatsapp", "web"],
    "whatsapp / portal": ["whatsapp", "web"],
    "zoho/wati": ["whatsapp"],
    "zoho/whatsapp": ["whatsapp"],

    # Email
    "email": ["email"],
    "email marketing": ["email"],
    "email → zoho": ["email"],
    "email/docs": ["email"],

    # Email + WhatsApp combos
    "email / whatsapp": ["email", "whatsapp"],
    "email/whatsapp": ["email", "whatsapp"],
    "whatsapp/email": ["whatsapp", "email"],

    # Llamada
    "aircall → zoho": ["llamada"],
    "llamadas entrantes (números locales)": ["llamada"],
    "teléfono/whatsapp": ["llamada", "whatsapp"],
    "whatsapp / teléfono": ["whatsapp", "llamada"],
    "whatsapp/teléfono": ["whatsapp", "llamada"],
    "whatsapp/llamada": ["whatsapp", "llamada"],
    "llamada/whatsapp": ["llamada", "whatsapp"],
    "whatsapp/llamada/email": ["whatsapp", "llamada", "email"],

    # Reunión
    "llamada/reunión": ["llamada", "reunion"],
    "reunión presencial o videollamada formal": ["reunion"],

    # Web / portal
    "web": ["web"],
    "portal web / sistema autoservicio": ["web"],

    # Físico
    "físico": ["fisico"],
    "físico (dentro del pedido)": ["fisico"],
    "presencial": ["fisico"],
    "paquetería": ["fisico"],

    # Combos físicos
    "whatsapp / email / físico": ["whatsapp", "email", "fisico"],

    # LinkedIn / Ads / SEO
    "linkedin": ["linkedin"],
    "meta ads": ["meta_ads"],
    "sem - landing pages": ["sem", "web"],
    "seo - sitios web / e-commerce": ["seo", "web"],

    # Referidos
    "referidos": ["referido"],
    "networking": ["referido"],

    # Herramientas/internos: NO son canales externos → sin mapping (lista vacía)
    "zoho crm": [],
    "zoho → tratos/proyectos": [],
    "manual → zoho": [],
    "formularios → zoho": [],
    "sistema": [],
    "interno": [],
    "interno → email/whatsapp": ["email", "whatsapp"],
    "transferencia": [],

    # Placeholder
    "por definir": [],
}


def normalize(s: str) -> str:
    return (s or "").strip().lower()


def backfill():
    db = SessionLocal()
    try:
        # Verificar canales canónicos disponibles
        available = {c.id for c in db.query(ComercialChannel).all()}
        if not available:
            print("ERROR: comercial_channels vacía. Corre seed_channels.py primero.")
            return
        print(f"Canales disponibles: {sorted(available)}")

        # Limpiar el join existente para hacer el backfill idempotente
        deleted = db.query(ComercialTouchpointChannel).delete()
        print(f"Limpieza: {deleted} relaciones existentes eliminadas.\n")

        tps = db.query(ComercialTouchpoint).all()
        unmapped = set()
        rows_created = 0
        tps_with_channels = 0

        for tp in tps:
            key = normalize(tp.canal)
            if not key:
                continue
            if key not in CANAL_MAP:
                unmapped.add(tp.canal)
                continue
            channel_ids = CANAL_MAP[key]
            if not channel_ids:
                continue  # Mapeado explícitamente a vacío (herramienta/interno)
            tps_with_channels += 1
            for cid in channel_ids:
                if cid not in available:
                    print(f"  WARN: canal '{cid}' no existe en comercial_channels (tp #{tp.id})")
                    continue
                db.add(ComercialTouchpointChannel(touchpoint_id=tp.id, channel_id=cid))
                rows_created += 1

        db.commit()

        print(f"Touchpoints con canales asignados: {tps_with_channels} / {len(tps)}")
        print(f"Relaciones M:N creadas: {rows_created}")

        if unmapped:
            print(f"\nWARNING: {len(unmapped)} strings sin mapping:")
            for s in sorted(unmapped):
                print(f"  - {repr(s)}")
        else:
            print("\nTodos los strings reconocidos.")
    finally:
        db.close()


if __name__ == "__main__":
    backfill()
