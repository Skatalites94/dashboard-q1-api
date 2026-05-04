"""SQLAlchemy event listeners que aplican el scoping por brand_id automáticamente.

Diseño:
- `do_orm_execute` → cada SELECT sobre un modelo Comercial* recibe un
  `with_loader_criteria(Cls, lambda c: c.brand_id == brand_id)` que añade
  un AND filter transparente. Los routers no necesitan llamar `.filter(...)`.
- `before_flush` → cada INSTANCIA nueva con `brand_id is None` recibe
  el brand_id del ContextVar.

Esto se activa una sola vez al importar este módulo (en `app/main.py`).
Los modelos Comercial* se descubren dinámicamente desde Base.registry,
así que añadir un nuevo modelo no requiere actualizar listas.

Excepciones:
- `Brand` (la tabla brands) NO se filtra ni se inyecta — es global.
- Modelos no comercial_* tampoco se tocan.
"""
from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria

from app.brand_context import current_brand_id_var
from app.database import Base


def _is_comercial_model(cls) -> bool:
    """Modelo cuya tabla empieza con comercial_ (excluye Brand y otros)."""
    try:
        return getattr(cls, "__tablename__", "").startswith("comercial_")
    except Exception:
        return False


def _comercial_models():
    """Lista dinámica de clases Comercial* mapeadas en Base.registry."""
    return [m.class_ for m in Base.registry.mappers if _is_comercial_model(m.class_)]


def install_brand_scope():
    """Registra los listeners. Idempotente: se puede llamar múltiples veces."""

    @event.listens_for(Session, "do_orm_execute")
    def _auto_filter_by_brand(execute_state):
        # Solo SELECTs que no sean lazy-loads de relaciones
        if not execute_state.is_select:
            return
        if execute_state.is_relationship_load:
            return
        brand_id = current_brand_id_var.get()
        # IMPORTANTE: capturar brand_id con default arg para evitar late-binding en el closure
        # (todos los lambdas comparten la misma variable de bucle si no se usa default).
        for cls in _comercial_models():
            criteria_fn = (lambda b: lambda entity_cls: entity_cls.brand_id == b)(brand_id)
            execute_state.statement = execute_state.statement.options(
                with_loader_criteria(cls, criteria_fn, include_aliases=True)
            )

    @event.listens_for(Session, "before_flush")
    def _set_brand_id_on_new(session, flush_context, instances):
        brand_id = current_brand_id_var.get()
        for obj in session.new:
            cls = obj.__class__
            if not _is_comercial_model(cls):
                continue
            if not hasattr(obj, "brand_id"):
                continue
            if getattr(obj, "brand_id", None) is None:
                obj.brand_id = brand_id
