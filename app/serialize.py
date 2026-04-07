from app.models import AreaResumen, Deal, Iniciativa, KpiMeta, Semaforo


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
