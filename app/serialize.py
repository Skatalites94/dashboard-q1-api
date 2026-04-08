from app.models import (
    AreaResumen, CategoriaGasto, Consultoria, Deal, Empleado, Escenario,
    EscenarioIngreso, GastoFinanciero, GastoOperativo, Iniciativa, KpiMeta,
    Semaforo, SimAsesor, SimConfig, SimTipoCliente, Suscripcion,
)


def deal_out(row: Deal) -> dict:
    return {
        "id": row.id,
        "a": row.asesor,
        "c": row.cuenta,
        "t": row.trato,
        "i": row.importe,
        "p": row.pct_util,
        "u": row.utilidad,
        "f": row.fecha,
        "m": row.mes,
        "tri": row.trimestre,
    }


def iniciativa_out(row: Iniciativa) -> dict:
    return {
        "id": row.id,
        "area": row.area,
        "resp": row.resp,
        "ini": row.ini,
        "pri": row.pri,
        "est": row.est,
        "av": row.av,
        "notas": row.notas,
        "trimestre": row.trimestre,
    }


def kpi_meta_out(row: KpiMeta) -> dict:
    return {"id": row.id, "kpi": row.kpi, "r25": row.r25, "m26": row.m26}


def semaforo_out(row: Semaforo) -> dict:
    return {
        "id": row.id,
        "kpi": row.kpi,
        "area": row.area,
        "resp": row.resp,
        "descripcion": row.descripcion,
        "meta": row.meta,
        "ene": row.ene,
        "feb": row.feb,
        "mar": row.mar,
        "est": row.est,
        "tendencia": row.tendencia,
        "trimestre": row.trimestre,
        "diagnostico": row.diagnostico,
        "recomendacion": row.recomendacion,
    }


def area_resumen_out(row: AreaResumen) -> dict:
    return {
        "id": row.id,
        "area": row.area,
        "resp": row.resp,
        "rol": row.rol,
        "verdes": row.verdes,
        "amarillos": row.amarillos,
        "rojos": row.rojos,
        "tendencia": row.tendencia,
        "trimestre": row.trimestre,
        "diagnostico": row.diagnostico,
        "recomendacion": row.recomendacion,
    }


# ── Módulo Gastos ──────────────────────────────────────────────

def categoria_gasto_out(row: CategoriaGasto) -> dict:
    return {"id": row.id, "nombre": row.nombre, "modulo": row.modulo, "color": row.color, "orden": row.orden}


def empleado_out(row: Empleado) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "depto": row.depto, "costo": row.costo,
        "sueldo_neto": row.sueldo_neto, "esquema": row.esquema,
        "factor_carga": row.factor_carga, "comision_pct": row.comision_pct,
        "sueldo_imss": row.sueldo_imss, "sueldo_complemento": row.sueldo_complemento,
        "cortado": row.cortado, "es_contratacion": row.es_contratacion,
        "nota": row.nota, "categoria_id": row.categoria_id,
    }


def gasto_operativo_out(row: GastoOperativo) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "categoria": row.categoria, "fijo": row.fijo, "cortado": row.cortado, "categoria_id": row.categoria_id}


def suscripcion_out(row: Suscripcion) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "frecuencia": row.frecuencia, "nota": row.nota, "cortado": row.cortado, "categoria_id": row.categoria_id, "usuarios": row.usuarios, "costo_por_usuario": row.costo_por_usuario, "es_por_usuario": row.es_por_usuario, "moneda": row.moneda, "tipo_cambio": row.tipo_cambio}


def consultoria_out(row: Consultoria) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "nota": row.nota, "cortado": row.cortado, "categoria_id": row.categoria_id}


def gasto_financiero_out(row: GastoFinanciero) -> dict:
    return {"id": row.id, "nombre": row.nombre, "costo": row.costo, "nota": row.nota, "cortado": row.cortado, "categoria_id": row.categoria_id}


def escenario_out(row: Escenario) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "descripcion": row.descripcion,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "total_original": row.total_original, "total_nuevo": row.total_nuevo, "ahorro": row.ahorro,
        "es_base": row.es_base,
    }


def escenario_full_out(row: Escenario) -> dict:
    d = escenario_out(row)
    d["snapshot"] = row.snapshot
    return d


# ── Módulo Simulador ──────────────────────────────────────────

def sim_asesor_out(row: SimAsesor) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "tipo": row.tipo,
        "fecha_inicio": row.fecha_inicio, "cuota_mensual": row.cuota_mensual,
        "madurez_pct": row.madurez_pct, "max_tratos_mes": row.max_tratos_mes,
        "max_cartera_activa": row.max_cartera_activa,
        "activo": row.activo, "nota": row.nota,
    }


def sim_config_out(row: SimConfig) -> dict:
    return {"id": row.id, "clave": row.clave, "valor": row.valor}


def sim_tipo_cliente_out(row: SimTipoCliente) -> dict:
    return {
        "id": row.id, "codigo": row.codigo, "nombre": row.nombre,
        "leads_mensuales": row.leads_mensuales, "tasa_retencion": row.tasa_retencion,
        "tasa_cierre": row.tasa_cierre, "meses_cierre": row.meses_cierre,
        "ticket_promedio": row.ticket_promedio, "facturas_por_cliente": row.facturas_por_cliente,
        "clientes_iniciales": row.clientes_iniciales, "dias_credito": row.dias_credito,
    }


def escenario_ingreso_out(row: EscenarioIngreso) -> dict:
    return {
        "id": row.id, "nombre": row.nombre, "descripcion": row.descripcion,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "ingreso_anual": row.ingreso_anual, "costo_equipo_anual": row.costo_equipo_anual,
        "utilidad_bruta": row.utilidad_bruta,
    }


def escenario_ingreso_full_out(row: EscenarioIngreso) -> dict:
    d = escenario_ingreso_out(row)
    d["snapshot"] = row.snapshot
    return d
