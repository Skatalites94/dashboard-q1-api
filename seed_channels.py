#!/usr/bin/env python3
"""Seed: 11 canales canónicos en comercial_channels.

Idempotente: actualiza si ya existen.

Los 11 canales son los medios reales por los que el touchpoint se ejecuta.
Herramientas (ZOHO, Wati, Aircall) NO son canales — son el software detrás.
"""
from app.database import SessionLocal
from app.models import ComercialChannel

CHANNELS = [
    # id, name, icon, color, description
    ("whatsapp",  "WhatsApp",  "💬", "#25D366", "Mensajería WhatsApp (manual o vía Wati)"),
    ("email",     "Email",     "✉️", "#3B82F6", "Correo electrónico (incluye automatizaciones de marketing)"),
    ("llamada",   "Llamada",   "📞", "#8B5CF6", "Llamada telefónica (entrantes, salientes, vía Aircall u otros)"),
    ("reunion",   "Reunión",   "🤝", "#F59E0B", "Reunión presencial o videollamada formal"),
    ("web",       "Web",       "🌐", "#06B6D4", "Sitio web, portal autoservicio, e-commerce"),
    ("linkedin",  "LinkedIn",  "💼", "#0A66C2", "LinkedIn (orgánico, InMail o Ads)"),
    ("meta_ads",  "Meta Ads",  "📢", "#1877F2", "Anuncios pagados en Facebook / Instagram"),
    ("sem",       "SEM",       "🎯", "#EA4335", "Google Ads y otras búsquedas pagadas"),
    ("seo",       "SEO",       "🔍", "#34A853", "Tráfico orgánico desde buscadores"),
    ("fisico",    "Físico",    "📦", "#78716C", "Entrega física, paquetería, contacto presencial"),
    ("referido",  "Referido",  "🌟", "#EC4899", "Referencia o recomendación de un cliente o partner"),
]


def seed():
    db = SessionLocal()
    try:
        for i, (cid, name, icon, color, desc) in enumerate(CHANNELS):
            row = db.get(ComercialChannel, cid)
            if row:
                row.name = name
                row.icon = icon
                row.color = color
                row.description = desc
                row.order = i
                action = "updated"
            else:
                db.add(ComercialChannel(
                    id=cid, name=name, icon=icon, color=color,
                    description=desc, order=i,
                ))
                action = "created"
            print(f"  {action}: {cid} — {name}")
        db.commit()
        total = db.query(ComercialChannel).count()
        print(f"\nseed_channels completado. Total: {total} canales.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
