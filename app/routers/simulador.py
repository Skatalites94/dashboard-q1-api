"""Router del Simulador de Ingresos — equipo de ventas, pipeline, marketing, P&L."""

import math
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Escenario, EscenarioIngreso, SimAsesor, SimConfig, SimTipoCliente,
)
from app.schemas import (
    EscenarioIngresoCreate, SimAsesorCreate, SimAsesorUpdate,
    SimConfigUpdate, SimTipoClienteCreate, SimTipoClienteUpdate,
)
from app.serialize import (
    escenario_ingreso_full_out, escenario_ingreso_out, escenario_full_out,
    sim_asesor_out, sim_config_out, sim_tipo_cliente_out,
)

router = APIRouter()

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

DEFAULT_SEASONALITY = {
    "Ene": 0.91, "Feb": 0.69, "Mar": 1.22, "Abr": 0.98, "May": 1.04, "Jun": 1.35,
    "Jul": 1.40, "Ago": 0.93, "Sep": 0.71, "Oct": 1.04, "Nov": 0.86, "Dic": 0.54,
}

DEFAULT_CUOTAS = {"rookie": 600000, "junior": 1200000, "senior": 2000000}

DEFAULT_COMISIONES = {
    "senior": {"sueldo": 25000, "base_pct": 0.065, "accel_pct": 0.015, "overhead": 2850},
    "junior": {"sueldo": 16000, "base_pct": 0.055, "accel_pct": 0.015, "overhead": 2850},
    "rookie": {"sueldo": 15000, "base_pct": 0.05, "accel_pct": 0.01, "overhead": 2850},
}

DEFAULT_MKT = {
    "presupuesto_mensual": 77745,
    "canales": {
        "Pautas digitales": {"pct": 0.30, "cpl": 500},
        "Eventos": {"pct": 0.40, "cpl": 2000},
        "SEO/Orgánico": {"pct": 0.15, "cpl": 200},
        "Referidos": {"pct": 0.15, "cpl": 0},
    },
    "tasa_calificacion": 0.40,
    "distribucion_calidad": {"AAAH": 0.10, "AAAC": 0.20, "A": 0.70},
}


# ── Helpers ────────────────────────────────────────────────────

def _get_config(db: Session) -> dict:
    """Load all config into a dict keyed by clave."""
    rows = db.query(SimConfig).all()
    return {r.clave: r.valor for r in rows}


def _calc_madurez(tipo: str, fecha_inicio: str, today: date = None) -> float:
    """S-curve logistic maturity calculation."""
    if not fecha_inicio:
        return 50.0
    if today is None:
        today = date.today()
    try:
        inicio = datetime.strptime(fecha_inicio[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return 50.0
    dias = (today - inicio).days
    if dias < 0:
        return 10.0

    params = {
        "rookie": {"meta": 70, "mid": 120, "k": 0.025},
        "junior": {"meta": 85, "mid": 180, "k": 0.02},
        "senior": {"meta": 95, "mid": 90, "k": 0.03},
    }
    p = params.get(tipo, params["junior"])
    madurez = p["meta"] / (1 + math.exp(-p["k"] * (dias - p["mid"])))
    return round(max(10, min(madurez, p["meta"])), 1)


def _project_maturation(tipo: str, fecha_inicio: str, config_mad: dict = None) -> list:
    """Project maturation timeline for 24 months."""
    if not fecha_inicio:
        return []
    try:
        inicio = datetime.strptime(fecha_inicio[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return []

    today = date.today()
    mad_cfg = config_mad or {}
    umbrales = mad_cfg.get("umbrales", {"junior": 0.70, "senior": 0.85})
    rookie_to_junior = mad_cfg.get("rookie_to_junior_meses", 12)
    junior_to_senior = mad_cfg.get("junior_to_senior_meses", 24)

    params = {
        "rookie": {"meta": 70, "mid": 120, "k": 0.025},
        "junior": {"meta": 85, "mid": 180, "k": 0.02},
        "senior": {"meta": 95, "mid": 90, "k": 0.03},
    }

    timeline = []
    current_tipo = tipo
    for m in range(24):
        proj_date = date(today.year, today.month, 1)
        proj_date = date(proj_date.year + (proj_date.month + m - 1) // 12,
                         (proj_date.month + m - 1) % 12 + 1, 1)
        dias = (proj_date - inicio).days
        p = params.get(current_tipo, params["junior"])
        madurez = p["meta"] / (1 + math.exp(-p["k"] * (dias - p["mid"])))
        madurez = max(10, min(madurez, p["meta"]))
        madurez_pct = round(madurez, 1)

        transicion = None
        if current_tipo == "rookie" and dias >= rookie_to_junior * 30:
            current_tipo = "junior"
            transicion = "rookie_to_junior"
        elif current_tipo == "junior" and dias >= (rookie_to_junior + junior_to_senior) * 30:
            current_tipo = "senior"
            transicion = "junior_to_senior"

        timeline.append({
            "mes": MESES[proj_date.month - 1] + " " + str(proj_date.year),
            "tipo": current_tipo,
            "madurez_pct": madurez_pct,
            "transicion": transicion,
        })

    return timeline


def _run_simulation(db: Session) -> dict:
    """Run the full 12-month simulation."""
    config = _get_config(db)
    asesores = [sim_asesor_out(r) for r in db.query(SimAsesor).filter(SimAsesor.activo == True).all()]
    tipos_cliente = [sim_tipo_cliente_out(r) for r in db.query(SimTipoCliente).all()]

    seasonality = config.get("seasonality", DEFAULT_SEASONALITY)
    cuotas = config.get("cuotas_default", DEFAULT_CUOTAS)
    comisiones = config.get("comisiones", DEFAULT_COMISIONES)
    margen = config.get("margen_bruto", 0.28)
    mkt_config = config.get("marketing", DEFAULT_MKT)
    friction = config.get("factor_friccion", 0.85)

    today = date.today()

    # ── Marketing → Leads (objective-driven) ─────────────
    mkt_presupuesto = mkt_config.get("presupuesto_mensual", 0)
    canales = mkt_config.get("canales", {})
    tasa_calif = mkt_config.get("tasa_calificacion", 0.4)
    dist_calidad = mkt_config.get("distribucion_calidad", {"AAAH": 0.1, "AAAC": 0.2, "A": 0.7})

    # Build leads_objetivo map from tipos_cliente
    leads_objetivo_total = sum(tc.get("leads_objetivo", 0) for tc in tipos_cliente)
    use_objective_mode = leads_objetivo_total > 0

    mkt_leads_por_mes = []
    for i, mes in enumerate(MESES):
        if use_objective_mode:
            # Objective mode: leads come directly from tipo targets
            leads_calificados = leads_objetivo_total
            leads_brutos = int(leads_calificados / tasa_calif) if tasa_calif > 0 else leads_calificados
        else:
            # Legacy budget mode
            leads_brutos = 0
            for canal_name, canal_data in canales.items():
                ppto_canal = mkt_presupuesto * canal_data.get("pct", 0)
                cpl = canal_data.get("cpl", 0)
                leads_canal = int(ppto_canal / cpl) if cpl > 0 else 15
                leads_brutos += leads_canal
            leads_calificados = int(leads_brutos * tasa_calif)

        # Channel breakdown (informational)
        canal_detalle = {}
        for canal_name, canal_data in canales.items():
            ppto_canal = mkt_presupuesto * canal_data.get("pct", 0)
            cpl = canal_data.get("cpl", 0)
            leads_canal = int(ppto_canal / cpl) if cpl > 0 else 15
            canal_detalle[canal_name] = {"presupuesto": round(ppto_canal), "leads": leads_canal, "cpl": cpl}

        mkt_leads_por_mes.append({
            "mes": mes, "leads_brutos": leads_brutos,
            "leads_calificados": leads_calificados,
            "canales": canal_detalle,
        })

    # ── Equipo de Ventas → Capacidad ──────────────────
    equipo_por_asesor = []
    equipo_total_mensual = [0.0] * 12
    costo_equipo_mensual = [0.0] * 12

    for a in asesores:
        tipo = a["tipo"]
        cuota = a["cuota_mensual"] if a["cuota_mensual"] > 0 else cuotas.get(tipo, 1200000)
        mad = a["madurez_pct"] if a["madurez_pct"] > 0 else _calc_madurez(tipo, a["fecha_inicio"], today)
        mad_pct = mad / 100.0

        com_config = comisiones.get(tipo, comisiones.get("junior", {}))
        sueldo = com_config.get("sueldo", 16000)
        overhead = com_config.get("overhead", 2850)

        meses_venta = []
        meses_costo = []
        for i, mes in enumerate(MESES):
            s_idx = seasonality.get(mes, 1.0)
            venta = cuota * mad_pct * s_idx
            # Commission calc
            utilidad = venta * margen
            meta_util = cuota * margen
            com_base = utilidad * com_config.get("base_pct", 0.05)
            excedente = max(0, utilidad - meta_util)
            com_accel = excedente * com_config.get("accel_pct", 0.01)
            costo_mes = sueldo + com_base + com_accel + overhead

            meses_venta.append(round(venta))
            meses_costo.append(round(costo_mes))
            equipo_total_mensual[i] += venta
            costo_equipo_mensual[i] += costo_mes

        mad_config = config.get("maduracion", {})
        maturation_tl = _project_maturation(tipo, a["fecha_inicio"], mad_config)

        equipo_por_asesor.append({
            "id": a["id"], "nombre": a["nombre"], "tipo": tipo,
            "fecha_inicio": a.get("fecha_inicio", ""),
            "cuota_mensual": cuota, "cuota": cuota, "madurez_pct": round(mad, 1), "madurez": round(mad, 1),
            "max_tratos_mes": a.get("max_tratos_mes", 25),
            "max_cartera_activa": a.get("max_cartera_activa", 40),
            "horas_habiles_dia": a.get("horas_habiles_dia", 6.0),
            "cartera_actual": a.get("cartera_actual", {}),
            "meses": meses_venta, "total": sum(meses_venta),
            "costo_meses": meses_costo, "costo_total": sum(meses_costo),
            "maturation_timeline": maturation_tl,
        })

    # ── Pipeline → Demanda ────────────────────────────
    pipeline_por_tipo = []
    pipeline_total_mensual = [0.0] * 12

    for tc in tipos_cliente:
        codigo = tc["codigo"]
        dist_pct = dist_calidad.get(codigo, 0.3)

        leads_nuevos = []
        for i in range(12):
            # Priority: leads_objetivo > leads_mensuales > marketing distribution
            if tc.get("leads_objetivo", 0) > 0:
                leads_nuevos.append(tc["leads_objetivo"])
            elif tc["leads_mensuales"] > 0:
                leads_nuevos.append(tc["leads_mensuales"])
            else:
                leads_cal = mkt_leads_por_mes[i]["leads_calificados"] if i < len(mkt_leads_por_mes) else 0
                leads_nuevos.append(int(leads_cal * dist_pct))

        retencion = tc["tasa_retencion"]
        cierre = tc["tasa_cierre"]
        meses_cierre = tc["meses_cierre"]
        ticket = tc["ticket_promedio"]
        fact_por_cliente = tc["facturas_por_cliente"]

        activos = [0.0] * 12
        nuevos_clientes = [0.0] * 12
        ingresos = [0.0] * 12

        for i in range(12):
            # New clients from leads that entered meses_cierre months ago
            if i >= meses_cierre:
                pool = leads_nuevos[i - meses_cierre]
                # Add retained leads from previous periods
                for j in range(max(0, i - meses_cierre - 2), i - meses_cierre):
                    pool += leads_nuevos[j] * (retencion ** (i - meses_cierre - j))
                nuevos_clientes[i] = pool * cierre
            elif i == 0 and meses_cierre <= 1:
                nuevos_clientes[i] = leads_nuevos[i] * cierre

            prev = activos[i - 1] if i > 0 else tc.get("clientes_iniciales", 6.0)
            activos[i] = prev * retencion + nuevos_clientes[i]

            facturas = activos[i] * fact_por_cliente
            s_idx = seasonality.get(MESES[i], 1.0)
            ingresos[i] = facturas * ticket * s_idx

            pipeline_total_mensual[i] += ingresos[i]

        pipeline_por_tipo.append({
            "codigo": codigo, "nombre": tc["nombre"],
            "leads_nuevos": leads_nuevos,
            "nuevos_clientes": [round(x, 1) for x in nuevos_clientes],
            "activos": [round(x, 1) for x in activos],
            "ingresos": [round(x) for x in ingresos],
            "total": round(sum(ingresos)),
        })

    # ── Proyección Integrada (Supply vs Demand) ───────
    proyeccion_mensual = []
    for i, mes in enumerate(MESES):
        cap = equipo_total_mensual[i]
        dem = pipeline_total_mensual[i]
        proj = min(cap, dem) * friction
        bottleneck = "EQUIPO" if dem > cap else ("DEMANDA" if cap > dem * 1.15 else "BALANCE")
        proyeccion_mensual.append({
            "mes": mes,
            "capacidad_equipo": round(cap),
            "demanda_pipeline": round(dem),
            "proyeccion": round(proj),
            "cuello_botella": bottleneck,
            "costo_equipo": round(costo_equipo_mensual[i]),
            "utilidad_bruta": round(proj * margen - costo_equipo_mensual[i]),
        })

    # ── Capacidad por Horas ─────────────────────────────
    dias_lab = config.get("dias_laborables_mes", 22)
    factor_mant = config.get("factor_mantenimiento", 0.3)
    tipos_dict = {tc["codigo"]: tc for tc in tipos_cliente}

    # Compute total clients active per month
    total_clientes_activos_mes = []
    for i in range(12):
        activos_mes = sum(t["activos"][i] if i < len(t.get("activos", [])) else 0 for t in pipeline_por_tipo)
        total_clientes_activos_mes.append(round(activos_mes, 1))

    capacidad_info = []
    for i, mes in enumerate(MESES):
        horas_disp_equipo = 0
        horas_ocup_equipo = 0

        for a in asesores:
            horas_dia = a.get("horas_habiles_dia", 6.0)
            horas_disp = horas_dia * dias_lab
            horas_disp_equipo += horas_disp

            cartera = a.get("cartera_actual", {}) or {}
            horas_ocup = 0
            for tipo_codigo, num_cuentas in cartera.items():
                tipo = tipos_dict.get(tipo_codigo, {})
                freq = tipo.get("frecuencia_compra_meses", 6)
                h_cot = tipo.get("horas_cotizacion", 2.0)
                h_seg = tipo.get("horas_seguimiento", 1.0)
                if freq > 0:
                    cuentas_comprando = num_cuentas / freq
                else:
                    cuentas_comprando = num_cuentas
                cuentas_mant = num_cuentas - cuentas_comprando
                horas_ocup += cuentas_comprando * (h_cot + h_seg)
                horas_ocup += cuentas_mant * (h_seg * factor_mant)

            horas_ocup_equipo += horas_ocup

        horas_rest_equipo = max(0, horas_disp_equipo - horas_ocup_equipo)
        utilizacion = (horas_ocup_equipo / horas_disp_equipo * 100) if horas_disp_equipo > 0 else 0

        # Estimate new deals possible with remaining hours
        avg_h_deal = 0
        n_tipos = len(tipos_dict)
        if n_tipos > 0:
            avg_h_deal = sum(t.get("horas_cotizacion", 2) + t.get("horas_seguimiento", 1) for t in tipos_dict.values()) / n_tipos
        nuevos_tratos = horas_rest_equipo / avg_h_deal if avg_h_deal > 0 else 0

        # Asesores needed: based on hours occupied growing with new clients
        cli_activos = total_clientes_activos_mes[i]
        max_cartera_equipo = sum(a.get("max_cartera_activa", 40) for a in asesores)
        necesidad = math.ceil(cli_activos / 40) if cli_activos > 0 else 1

        capacidad_info.append({
            "mes": mes,
            "clientes_activos": cli_activos,
            "max_cartera_equipo": max_cartera_equipo,
            "horas_disponibles": round(horas_disp_equipo, 1),
            "horas_ocupadas": round(horas_ocup_equipo, 1),
            "horas_restantes": round(horas_rest_equipo, 1),
            "utilizacion_pct": round(min(utilizacion, 200), 1),
            "nuevos_tratos_posibles": round(nuevos_tratos, 1),
            "asesores_necesarios": necesidad,
            "asesores_actuales": len(asesores),
            "deficit": max(0, necesidad - len(asesores)),
        })

    # ── Cashflow (considerando días de crédito) ───────
    cashflow_mensual = []
    for i in range(12):
        cobros = 0
        for tc in tipos_cliente:
            dias_cred = tc.get("dias_credito", 30)
            meses_delay = max(0, round(dias_cred / 30))
            src_month = i - meses_delay
            if src_month >= 0 and src_month < 12:
                # Revenue from src_month gets collected in month i
                for pt in pipeline_por_tipo:
                    if pt["codigo"] == tc["codigo"]:
                        cobros += pt["ingresos"][src_month] if src_month < len(pt["ingresos"]) else 0
        egresos = costo_equipo_mensual[i]
        cashflow_mensual.append({
            "mes": MESES[i],
            "cobros": round(cobros),
            "egresos_equipo": round(egresos),
            "flujo_neto": round(cobros - egresos),
        })

    # ── KPIs ──────────────────────────────────────────
    ingreso_anual = sum(p["proyeccion"] for p in proyeccion_mensual)
    costo_eq_anual = sum(p["costo_equipo"] for p in proyeccion_mensual)
    utilidad_bruta = ingreso_anual * margen - costo_eq_anual

    # ── Marketing KPIs ────────────────────────────────
    total_leads = sum(m["leads_calificados"] for m in mkt_leads_por_mes)
    total_nuevos_clientes = sum(sum(t["nuevos_clientes"]) for t in pipeline_por_tipo)
    inversion_mkt_anual = mkt_presupuesto * 12
    cac = inversion_mkt_anual / total_nuevos_clientes if total_nuevos_clientes > 0 else 0
    cpl_promedio = inversion_mkt_anual / total_leads if total_leads > 0 else 0

    return {
        "marketing": {
            "presupuesto_mensual": mkt_presupuesto,
            "inversion_anual": inversion_mkt_anual,
            "leads_por_mes": mkt_leads_por_mes,
            "total_leads_anual": total_leads,
            "cpl_promedio": round(cpl_promedio),
            "cac": round(cac),
            "config": mkt_config,
        },
        "equipo": {
            "por_asesor": equipo_por_asesor,
            "total_mensual": [round(x) for x in equipo_total_mensual],
            "total_anual": round(sum(equipo_total_mensual)),
            "costo_mensual": [round(x) for x in costo_equipo_mensual],
            "costo_anual": round(sum(costo_equipo_mensual)),
        },
        "pipeline": {
            "por_tipo": pipeline_por_tipo,
            "total_mensual": [round(x) for x in pipeline_total_mensual],
            "total_anual": round(sum(pipeline_total_mensual)),
        },
        "proyeccion": proyeccion_mensual,
        "kpis": {
            "ingreso_anual": round(ingreso_anual),
            "ingreso_equipo": round(sum(equipo_total_mensual)),
            "ingreso_pipeline": round(sum(pipeline_total_mensual)),
            "costo_equipo_anual": round(costo_eq_anual),
            "utilidad_bruta": round(utilidad_bruta),
            "margen_pct": margen,
            "total_asesores": len(asesores),
            "total_leads_anual": total_leads,
            "cac": round(cac),
            "cpl_promedio": round(cpl_promedio),
        },
        "capacidad": capacidad_info,
        "cashflow": cashflow_mensual,
        "config": config,
    }


# ── Bootstrap ──────────────────────────────────────────────────

@router.get("/bootstrap")
def sim_bootstrap(db: Session = Depends(get_db)):
    return {
        "asesores": [sim_asesor_out(r) for r in db.query(SimAsesor).order_by(SimAsesor.id).all()],
        "config": [sim_config_out(r) for r in db.query(SimConfig).all()],
        "tipos_cliente": [sim_tipo_cliente_out(r) for r in db.query(SimTipoCliente).order_by(SimTipoCliente.id).all()],
    }


# ── Simulación ─────────────────────────────────────────────────

@router.post("/simular")
def run_simulation(db: Session = Depends(get_db)):
    return _run_simulation(db)


# ── Asesores CRUD ──────────────────────────────────────────────

@router.get("/asesores/")
def list_asesores(db: Session = Depends(get_db)):
    return [sim_asesor_out(r) for r in db.query(SimAsesor).order_by(SimAsesor.id).all()]


@router.post("/asesores/", status_code=201)
def create_asesor(body: SimAsesorCreate, db: Session = Depends(get_db)):
    row = SimAsesor(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return sim_asesor_out(row)


@router.patch("/asesores/{item_id}")
def update_asesor(item_id: int, body: SimAsesorUpdate, db: Session = Depends(get_db)):
    row = db.get(SimAsesor, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return sim_asesor_out(row)


@router.delete("/asesores/{item_id}")
def delete_asesor(item_id: int, db: Session = Depends(get_db)):
    row = db.get(SimAsesor, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── Config ─────────────────────────────────────────────────────

@router.get("/config/")
def list_config(db: Session = Depends(get_db)):
    return [sim_config_out(r) for r in db.query(SimConfig).all()]


@router.put("/config/{clave}")
def upsert_config(clave: str, body: SimConfigUpdate, db: Session = Depends(get_db)):
    row = db.query(SimConfig).filter(SimConfig.clave == clave).first()
    if row:
        row.valor = body.valor
    else:
        row = SimConfig(clave=clave, valor=body.valor)
        db.add(row)
    db.commit()
    db.refresh(row)
    return sim_config_out(row)


# ── Tipos de Cliente ───────────────────────────────────────────

@router.get("/tipos-cliente/")
def list_tipos_cliente(db: Session = Depends(get_db)):
    return [sim_tipo_cliente_out(r) for r in db.query(SimTipoCliente).order_by(SimTipoCliente.id).all()]


@router.post("/tipos-cliente/", status_code=201)
def create_tipo_cliente(body: SimTipoClienteCreate, db: Session = Depends(get_db)):
    row = SimTipoCliente(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return sim_tipo_cliente_out(row)


@router.patch("/tipos-cliente/{item_id}")
def update_tipo_cliente(item_id: int, body: SimTipoClienteUpdate, db: Session = Depends(get_db)):
    row = db.get(SimTipoCliente, item_id)
    if not row:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return sim_tipo_cliente_out(row)


# ── Escenarios de Ingresos ─────────────────────────────────────

@router.get("/escenarios/")
def list_escenarios_ingreso(db: Session = Depends(get_db)):
    rows = db.query(EscenarioIngreso).order_by(EscenarioIngreso.updated_at.desc()).all()
    return [escenario_ingreso_out(r) for r in rows]


@router.get("/escenarios/{item_id}")
def get_escenario_ingreso(item_id: int, db: Session = Depends(get_db)):
    row = db.get(EscenarioIngreso, item_id)
    if not row:
        raise HTTPException(404)
    return escenario_ingreso_full_out(row)


@router.post("/escenarios/", status_code=201)
def save_escenario_ingreso(body: EscenarioIngresoCreate, db: Session = Depends(get_db)):
    sim = _run_simulation(db)
    row = EscenarioIngreso(
        nombre=body.nombre, descripcion=body.descripcion,
        snapshot=sim,
        ingreso_anual=sim["kpis"]["ingreso_anual"],
        costo_equipo_anual=sim["kpis"]["costo_equipo_anual"],
        utilidad_bruta=sim["kpis"]["utilidad_bruta"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return escenario_ingreso_out(row)


@router.delete("/escenarios/{item_id}")
def delete_escenario_ingreso(item_id: int, db: Session = Depends(get_db)):
    row = db.get(EscenarioIngreso, item_id)
    if not row:
        raise HTTPException(404)
    db.delete(row)
    db.commit()
    return {"ok": True, "id": item_id}


# ── P&L Integrado ─────────────────────────────────────────────

@router.get("/pl/{rev_id}/{exp_id}")
def get_pl(rev_id: int, exp_id: int, db: Session = Depends(get_db)):
    """Combine a revenue scenario with an expense scenario into a monthly P&L."""
    rev = db.get(EscenarioIngreso, rev_id)
    exp = db.get(Escenario, exp_id)
    if not rev or not exp:
        raise HTTPException(404, "Escenario no encontrado")

    snap_rev = rev.snapshot
    snap_exp = exp.snapshot
    margen = snap_rev.get("kpis", {}).get("margen_pct", 0.28)
    proyeccion = snap_rev.get("proyeccion", [])

    # Calculate monthly expense from snapshot
    gasto_mensual = exp.total_nuevo  # monthly total from expense scenario

    pl_mensual = []
    for i, mes_data in enumerate(proyeccion):
        ingreso = mes_data.get("proyeccion", 0)
        costo_ventas = ingreso * (1 - margen)
        utilidad_bruta = ingreso * margen
        costo_equipo = mes_data.get("costo_equipo", 0)
        gasto_op = gasto_mensual  # total monthly fixed expenses
        utilidad_op = utilidad_bruta - gasto_op - costo_equipo
        pl_mensual.append({
            "mes": mes_data["mes"],
            "ingreso": round(ingreso),
            "costo_ventas": round(costo_ventas),
            "utilidad_bruta": round(utilidad_bruta),
            "costo_equipo": round(costo_equipo),
            "gastos_operativos": round(gasto_op),
            "utilidad_operativa": round(utilidad_op),
            "margen_op_pct": round(utilidad_op / ingreso * 100, 1) if ingreso > 0 else 0,
        })

    total_ingreso = sum(p["ingreso"] for p in pl_mensual)
    total_utilidad = sum(p["utilidad_operativa"] for p in pl_mensual)

    return {
        "escenario_ingreso": {"id": rev.id, "nombre": rev.nombre},
        "escenario_gasto": {"id": exp.id, "nombre": exp.nombre},
        "pl_mensual": pl_mensual,
        "totales": {
            "ingreso_anual": total_ingreso,
            "utilidad_anual": total_utilidad,
            "margen_anual_pct": round(total_utilidad / total_ingreso * 100, 1) if total_ingreso > 0 else 0,
            "gasto_mensual": round(gasto_mensual),
        },
    }
