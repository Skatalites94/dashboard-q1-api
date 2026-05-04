"""Tests del rollup §6.1 — 4 maestras (utility, ltv, cac, conversion).

Pure-function tests sobre `comercial_master_metrics_rollup`. No requieren BD.
"""
from app.serialize import comercial_master_metrics_rollup, _kpi_pct_achievement


def _kpi(name, current, target, master_metric=None, direction="higher", unit="%"):
    return {
        "id": name.lower().replace(" ", "_"),
        "name": name,
        "current_value": current,
        "target_value": target,
        "unit": unit,
        "direction": direction,
        "is_master": master_metric is not None,
        "master_metric": master_metric,
    }


def test_rollup_no_drivers():
    out = comercial_master_metrics_rollup([])
    assert set(out.keys()) == {"utility", "ltv", "cac", "conversion"}
    for m in ["utility", "ltv", "cac", "conversion"]:
        assert out[m]["driver_count"] == 0
        assert out[m]["score_pct"] is None
        assert out[m]["color"] == "gray"


def test_rollup_only_non_master_kpis_ignored():
    kpis = [_kpi("X", 100, 100), _kpi("Y", 50, 100)]
    out = comercial_master_metrics_rollup(kpis)
    assert out["utility"]["driver_count"] == 0


def test_rollup_single_driver_green():
    kpis = [_kpi("Margen", 95, 100, master_metric="utility")]
    u = comercial_master_metrics_rollup(kpis)["utility"]
    assert u["driver_count"] == 1
    assert u["drivers_with_data"] == 1
    assert u["score_pct"] == 95.0
    assert u["color"] == "green"


def test_rollup_yellow_threshold():
    kpis = [_kpi("Margen", 75, 100, master_metric="utility")]
    u = comercial_master_metrics_rollup(kpis)["utility"]
    assert u["score_pct"] == 75.0
    assert u["color"] == "yellow"


def test_rollup_red_threshold():
    kpis = [_kpi("Margen", 50, 100, master_metric="utility")]
    u = comercial_master_metrics_rollup(kpis)["utility"]
    assert u["score_pct"] == 50.0
    assert u["color"] == "red"


def test_rollup_multiple_drivers_average():
    kpis = [
        _kpi("Margen", 90, 100, master_metric="utility"),     # 90%
        _kpi("EBITDA", 50, 100, master_metric="utility"),     # 50%
    ]
    u = comercial_master_metrics_rollup(kpis)["utility"]
    assert u["driver_count"] == 2
    assert u["score_pct"] == 70.0   # (90+50)/2
    assert u["color"] == "yellow"


def test_rollup_lower_direction_cac():
    # CAC: lower is better. target=100, current=80 → 100/80=125%
    kpis = [_kpi("CAC", 80, 100, master_metric="cac", direction="lower", unit="MXN")]
    c = comercial_master_metrics_rollup(kpis)["cac"]
    assert c["score_pct"] == 125.0
    assert c["color"] == "green"


def test_rollup_lower_direction_overshoot_red():
    # CAC current 200 vs target 100 → 100/200 = 50% (red)
    kpis = [_kpi("CAC", 200, 100, master_metric="cac", direction="lower")]
    c = comercial_master_metrics_rollup(kpis)["cac"]
    assert c["score_pct"] == 50.0
    assert c["color"] == "red"


def test_rollup_target_zero_skipped():
    # target=0 produce pct None, queda fuera del promedio
    kpis = [
        _kpi("X", 50, 100, master_metric="ltv"),     # 50%
        _kpi("Y", 50, 0, master_metric="ltv"),       # ignorada
    ]
    out = comercial_master_metrics_rollup(kpis)["ltv"]
    assert out["driver_count"] == 2
    assert out["drivers_with_data"] == 1
    assert out["score_pct"] == 50.0


def test_rollup_no_data_drivers():
    # KPIs maestros pero current=None → score=None pero driver_count=2
    kpis = [
        _kpi("X", None, 100, master_metric="conversion"),
        _kpi("Y", None, 100, master_metric="conversion"),
    ]
    out = comercial_master_metrics_rollup(kpis)["conversion"]
    assert out["driver_count"] == 2
    assert out["drivers_with_data"] == 0
    assert out["score_pct"] is None
    assert out["color"] == "gray"


def test_rollup_drivers_list_complete():
    kpis = [_kpi("Conv. landing", 30, 50, master_metric="conversion", unit="%")]
    out = comercial_master_metrics_rollup(kpis)["conversion"]
    assert len(out["drivers"]) == 1
    d = out["drivers"][0]
    assert d["name"] == "Conv. landing"
    assert d["current_value"] == 30
    assert d["target_value"] == 50
    assert d["pct"] == 60.0


def test_kpi_pct_higher_direction_default():
    assert _kpi_pct_achievement({"current_value": 80, "target_value": 100}) == 80.0


def test_kpi_pct_returns_none_when_missing():
    assert _kpi_pct_achievement({"current_value": None, "target_value": 100}) is None
    assert _kpi_pct_achievement({"current_value": 80, "target_value": None}) is None
    assert _kpi_pct_achievement({"current_value": 80, "target_value": 0}) is None
