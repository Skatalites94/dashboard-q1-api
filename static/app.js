const e = React.createElement;
const { useState, useMemo, useEffect, useCallback } = React;

const API = "";

/* ─── helpers ─── */
const fmt = (n) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n.toFixed(0);
};
const fmtFull = (n) =>
  "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pct = (n) => n.toFixed(1) + "%";

const TRIMESTRES = ["Q1", "Q2", "Q3", "Q4"];
const MESES_BY_TRI = {
  Q1: ["Ene", "Feb", "Mar"],
  Q2: ["Abr", "May", "Jun"],
  Q3: ["Jul", "Ago", "Sep"],
  Q4: ["Oct", "Nov", "Dic"],
};
const MES_COLS = { Q1: ["ene", "feb", "mar"], Q2: ["abr", "may", "jun"], Q3: ["jul", "ago", "sep"], Q4: ["oct", "nov", "dic"] };

async function apiPatch(path, body) {
  const r = await fetch(API + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.text()) || r.status + "");
  return r.json();
}

async function apiPost(path, body) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.text()) || r.status + "");
  return r.json();
}

async function apiDelete(path) {
  const r = await fetch(API + path, { method: "DELETE" });
  if (!r.ok) throw new Error((await r.text()) || r.status + "");
  return r.json();
}

function computeAsesores(deals) {
  const m = {};
  deals.forEach((d) => {
    const a = d.a || "Sin asignar";
    if (!m[a]) m[a] = { name: a, deals: 0, imp: 0, util: 0 };
    m[a].deals++;
    m[a].imp += d.i;
    m[a].util += d.u;
  });
  return Object.values(m).sort((a, b) => b.imp - a.imp);
}

function computeMesesData(deals, tri) {
  const meses = MESES_BY_TRI[tri] || MESES_BY_TRI.Q1;
  const m = {};
  deals.forEach((d) => {
    const k = d.m || "Sin";
    if (!m[k]) m[k] = { name: k, deals: 0, imp: 0, util: 0 };
    m[k].deals++;
    m[k].imp += d.i;
    m[k].util += d.u;
  });
  return meses.map((n) => m[n] || { name: n, deals: 0, imp: 0, util: 0 });
}

/* ─── Root ─── */
function Root() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [deals, setDeals] = useState([]);
  const [iniciativas, setIniciativas] = useState([]);
  const [kpisMeta, setKpisMeta] = useState([]);
  const [semaforo, setSemaforo] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    fetch(API + "/api/bootstrap")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((d) => {
        setDeals(d.deals);
        setIniciativas(d.iniciativas);
        setKpisMeta(d.kpis_meta);
        setSemaforo(d.semaforo);
        setAreas(d.areas || []);
        setLoading(false);
      })
      .catch((er) => setErr(String(er)));
  }, []);

  if (err) return e("div", { className: "app", style: { padding: 24 } }, "Error cargando datos: ", err);
  if (loading) return e("div", { className: "app", style: { padding: 24, textAlign: "center" } }, "Cargando datos…");

  return e(App, { deals, setDeals, iniciativas, setIniciativas, kpisMeta, setKpisMeta, semaforo, setSemaforo, areas, setAreas });
}

/* ─── App ─── */
function App({ deals, setDeals, iniciativas, setIniciativas, kpisMeta, setKpisMeta, semaforo, setSemaforo, areas, setAreas }) {
  const [tab, setTab] = useState("resumen");
  const [tri, setTri] = useState("Q1");

  const filteredDeals = useMemo(() => deals.filter((d) => (d.tri || "Q1") === tri), [deals, tri]);
  const filteredIni = useMemo(() => iniciativas.filter((i) => (i.trimestre || "Q1") === tri), [iniciativas, tri]);
  const filteredSem = useMemo(() => semaforo.filter((s) => (s.trimestre || "Q1") === tri), [semaforo, tri]);
  const filteredAreas = useMemo(() => areas.filter((a) => (a.trimestre || "Q1") === tri), [areas, tri]);

  const tabs = [
    { id: "resumen", label: "Resumen Ejecutivo" },
    { id: "areas", label: "Áreas y Responsables" },
    { id: "semaforo", label: "Semáforo KPIs" },
    { id: "iniciativas", label: "Iniciativas" },
    { id: "deals", label: "Tratos Ganados" },
    { id: "financiero", label: "Financiero x Mes" },
    { id: "equipo", label: "Equipo Comercial" },
  ];

  return e(
    "div",
    { className: "app" },
    e(
      "header",
      { className: "header" },
      e("h1", null, "Visión 2026 — Tablero de Seguimiento"),
      e("p", null, "Promoselect / Stencil Group")
    ),
    // Quarter selector
    e(
      "div",
      { className: "tri-selector" },
      TRIMESTRES.map((q) =>
        e(
          "button",
          {
            key: q,
            className: "tri-btn" + (tri === q ? " active" : ""),
            onClick: () => setTri(q),
          },
          q,
          tri === q && e("span", { className: "tri-label" }, " " + (q === "Q1" ? "Ene-Mar" : q === "Q2" ? "Abr-Jun" : q === "Q3" ? "Jul-Sep" : "Oct-Dic"))
        )
      )
    ),
    // Nav tabs
    e(
      "nav",
      { className: "nav" },
      tabs.map((t) =>
        e(
          "button",
          { key: t.id, className: tab === t.id ? "active" : "", onClick: () => setTab(t.id) },
          t.label
        )
      )
    ),
    tab === "resumen" && e(Resumen, { deals: filteredDeals, kpisMeta, setKpisMeta, semaforo: filteredSem, iniciativas: filteredIni, areas: filteredAreas, tri }),
    tab === "areas" && e(AreasView, { areas: filteredAreas, setAreas, semaforo: filteredSem, iniciativas: filteredIni, setIniciativas, setSemaforo, tri }),
    tab === "semaforo" && e(SemaforoView, { semaforo: filteredSem, setSemaforo, tri }),
    tab === "iniciativas" && e(IniciativasView, { iniciativas: filteredIni, setIniciativas, tri }),
    tab === "deals" && e(DealsView, { deals: filteredDeals, setDeals }),
    tab === "financiero" && e(FinancieroView, { deals: filteredDeals, tri }),
    tab === "equipo" && e(EquipoView, { deals: filteredDeals })
  );
}

/* ─── KpiCard ─── */
function KpiCard({ label, value, sub, color }) {
  return e(
    "div",
    { className: "kpi-card" },
    e("div", { className: "accent", style: { background: color } }),
    e("div", { className: "label" }, label),
    e("div", { className: "value", style: { color } }, value),
    sub && e("div", { className: "sub" }, sub)
  );
}

/* ─── Resumen Ejecutivo ─── */
function Resumen({ deals, kpisMeta, setKpisMeta, semaforo, iniciativas, areas, tri }) {
  const totalImp = deals.reduce((s, d) => s + d.i, 0);
  const totalUtil = deals.reduce((s, d) => s + d.u, 0);
  const meta = 70000000 / 4;
  const pctMeta = totalImp / meta * 100;
  const n = deals.length;
  const semVerdes = semaforo.filter((s) => s.est && s.est.includes("🟢")).length;
  const semRojos = semaforo.filter((s) => s.est && s.est.includes("🔴")).length;
  const semAmarillos = semaforo.filter((s) => s.est && s.est.includes("🟡")).length;
  const iniTotal = iniciativas.length;
  const iniDone = iniciativas.filter((i) => i.av >= 100).length;
  const iniProgress = iniciativas.filter((i) => i.av > 0 && i.av < 100).length;
  const iniPending = iniciativas.filter((i) => i.av === 0).length;
  const iniPct = iniTotal ? ((iniDone + iniProgress * 0.5) / iniTotal * 100) : 0;

  const [editingKpi, setEditingKpi] = useState(null);
  const [draftKpi, setDraftKpi] = useState(null);

  const saveKpi = async (id) => {
    try {
      const u = await apiPatch("/api/kpis-meta/" + id, { kpi: draftKpi.kpi, r25: draftKpi.r25, m26: draftKpi.m26 });
      setKpisMeta((prev) => prev.map((x) => (x.id === id ? u : x)));
      setEditingKpi(null);
    } catch (e2) {
      alert("Error: " + e2.message);
    }
  };

  return e(
    "div",
    null,
    // KPI cards
    e(
      "div",
      { className: "grid g4", style: { marginBottom: 20 } },
      e(KpiCard, { label: "Ventas " + tri, value: fmt(totalImp), sub: pct(pctMeta) + " de meta trimestral", color: "var(--teal)" }),
      e(KpiCard, { label: "Utilidad Bruta", value: fmt(totalUtil), sub: pct(totalImp ? totalUtil / totalImp * 100 : 0) + " margen", color: "var(--lime)" }),
      e(KpiCard, { label: "Tratos Cerrados", value: String(n), sub: n ? "Ticket prom: " + fmt(totalImp / n) : "", color: "var(--gold)" }),
      e(KpiCard, { label: "Avance Iniciativas", value: pct(iniPct), sub: iniDone + " completadas de " + iniTotal, color: iniPct >= 50 ? "var(--green)" : "var(--coral)" })
    ),
    // Semáforo global resumen
    e(
      "div",
      { className: "section" },
      e("div", { className: "section-title" }, "Semáforo Global " + tri),
      e(
        "div",
        { className: "grid g3", style: { marginBottom: 20 } },
        e(
          "div",
          { className: "kpi-card", style: { borderLeft: "4px solid var(--green)" } },
          e("div", { className: "label" }, "KPIs en Verde"),
          e("div", { className: "value", style: { color: "var(--green)" } }, String(semVerdes)),
          e("div", { className: "sub" }, "de " + semaforo.length + " totales")
        ),
        e(
          "div",
          { className: "kpi-card", style: { borderLeft: "4px solid var(--yellow)" } },
          e("div", { className: "label" }, "KPIs en Amarillo"),
          e("div", { className: "value", style: { color: "var(--yellow)" } }, String(semAmarillos)),
          e("div", { className: "sub" }, "requieren atención")
        ),
        e(
          "div",
          { className: "kpi-card", style: { borderLeft: "4px solid var(--red)" } },
          e("div", { className: "label" }, "KPIs en Rojo"),
          e("div", { className: "value", style: { color: "var(--red)" } }, String(semRojos)),
          e("div", { className: "sub" }, "acción urgente")
        )
      )
    ),
    // Resumen por áreas
    areas.length > 0 &&
      e(
        "div",
        { className: "section" },
        e("div", { className: "section-title" }, "Resumen por Área"),
        e(
          "div",
          { className: "panel" },
          e(
            "div",
            { className: "table-wrap" },
            e(
              "table",
              null,
              e(
                "thead",
                null,
                e(
                  "tr",
                  null,
                  e("th", null, "Área"),
                  e("th", null, "Responsable"),
                  e("th", { style: { textAlign: "center" } }, "🟢"),
                  e("th", { style: { textAlign: "center" } }, "🟡"),
                  e("th", { style: { textAlign: "center" } }, "🔴"),
                  e("th", null, "Tendencia")
                )
              ),
              e(
                "tbody",
                null,
                areas.map((a, i) =>
                  e(
                    "tr",
                    { key: i, style: a.rojos > 0 ? { background: "rgba(239,83,80,.08)" } : a.amarillos > 0 ? { background: "rgba(255,193,7,.05)" } : {} },
                    e("td", { style: { fontWeight: 600 } }, a.area),
                    e("td", null, a.resp),
                    e("td", { style: { textAlign: "center", color: "var(--green)" } }, a.verdes),
                    e("td", { style: { textAlign: "center", color: "var(--yellow)" } }, a.amarillos),
                    e("td", { style: { textAlign: "center", color: "var(--red)" } }, a.rojos),
                    e("td", null, a.tendencia)
                  )
                )
              )
            )
          )
        )
      ),
    // KPIs Meta anuales
    e(
      "div",
      { className: "section", style: { marginTop: 20 } },
      e("div", { className: "section-title" }, "Metas Anuales 2026"),
      e(
        "div",
        { className: "panel" },
        e(
          "div",
          { className: "table-wrap" },
          e(
            "table",
            null,
            e("thead", null, e("tr", null, e("th", null, "KPI"), e("th", null, "Real 2025"), e("th", null, "Meta 2026"), e("th", null, ""))),
            e(
              "tbody",
              null,
              kpisMeta.map((k) =>
                e(
                  "tr",
                  { key: k.id },
                  editingKpi === k.id
                    ? [
                        e("td", { key: "k" }, e("input", { className: "inp-inline", value: draftKpi.kpi, onChange: (ev) => setDraftKpi({ ...draftKpi, kpi: ev.target.value }) })),
                        e("td", { key: "r" }, e("input", { className: "inp-inline", value: draftKpi.r25, onChange: (ev) => setDraftKpi({ ...draftKpi, r25: ev.target.value }) })),
                        e("td", { key: "m" }, e("input", { className: "inp-inline", value: draftKpi.m26, onChange: (ev) => setDraftKpi({ ...draftKpi, m26: ev.target.value }) })),
                        e(
                          "td",
                          { key: "a" },
                          e("button", { className: "btn-inline", onClick: () => saveKpi(k.id), style: { marginRight: 4 } }, "Guardar"),
                          e("button", { className: "btn-inline", onClick: () => setEditingKpi(null) }, "Cancelar")
                        ),
                      ]
                    : [
                        e("td", { key: "k" }, k.kpi),
                        e("td", { key: "r" }, k.r25),
                        e("td", { key: "m", style: { fontWeight: 600 } }, k.m26),
                        e("td", { key: "a" }, e("button", { className: "btn-inline", onClick: () => { setEditingKpi(k.id); setDraftKpi({ ...k }); } }, "Editar")),
                      ]
                )
              )
            )
          )
        )
      )
    )
  );
}

/* ─── Areas y Responsables (vista principal nueva) ─── */
function AreasView({ areas, setAreas, semaforo, iniciativas, setIniciativas, setSemaforo, tri }) {
  const [selectedArea, setSelectedArea] = useState(null);
  const [editingIni, setEditingIni] = useState(null);
  const [draftIni, setDraftIni] = useState(null);
  const [editingSem, setEditingSem] = useState(null);
  const [draftSem, setDraftSem] = useState(null);

  const area = selectedArea ? areas.find((a) => a.area === selectedArea) : null;
  const areaKpis = useMemo(() => semaforo.filter((s) => s.area === selectedArea), [semaforo, selectedArea]);
  const areaInis = useMemo(() => iniciativas.filter((i) => i.area === selectedArea), [iniciativas, selectedArea]);

  const saveIni = async (id) => {
    try {
      const u = await apiPatch("/api/iniciativas/" + id, draftIni);
      setIniciativas((prev) => prev.map((x) => (x.id === id ? u : x)));
      setEditingIni(null);
    } catch (e2) {
      alert("Error: " + e2.message);
    }
  };

  const saveSem = async (id) => {
    try {
      const u = await apiPatch("/api/semaforo/" + id, draftSem);
      setSemaforo((prev) => prev.map((x) => (x.id === id ? u : x)));
      setEditingSem(null);
    } catch (e2) {
      alert("Error: " + e2.message);
    }
  };

  if (!selectedArea) {
    // Grid de áreas
    return e(
      "div",
      null,
      e("div", { className: "section-title" }, "Áreas de la Empresa — " + tri),
      e(
        "div",
        { className: "grid g3" },
        areas.map((a, i) => {
          const aInis = iniciativas.filter((ini) => ini.area === a.area);
          const done = aInis.filter((ini) => ini.av >= 100).length;
          const progress = aInis.filter((ini) => ini.av > 0 && ini.av < 100).length;
          const total = aInis.length;
          const avgAv = total ? aInis.reduce((s, ini) => s + ini.av, 0) / total : 0;
          const borderColor = a.rojos > 0 ? "var(--red)" : a.amarillos > 0 ? "var(--yellow)" : a.verdes > 0 ? "var(--green)" : "var(--border)";

          return e(
            "div",
            {
              key: i,
              className: "area-card",
              style: { borderLeft: "4px solid " + borderColor, cursor: "pointer" },
              onClick: () => setSelectedArea(a.area),
            },
            e(
              "div",
              { className: "area-header", style: { flexDirection: "column", alignItems: "flex-start", gap: 8 } },
              e("div", { style: { fontWeight: 700, fontSize: "1rem" } }, a.area),
              e("div", { style: { color: "var(--muted)", fontSize: "0.82rem" } }, a.resp),
              e(
                "div",
                { style: { display: "flex", gap: 12, marginTop: 4, fontSize: "0.78rem" } },
                a.verdes > 0 && e("span", { style: { color: "var(--green)" } }, "🟢 " + a.verdes),
                a.amarillos > 0 && e("span", { style: { color: "var(--yellow)" } }, "🟡 " + a.amarillos),
                a.rojos > 0 && e("span", { style: { color: "var(--red)" } }, "🔴 " + a.rojos)
              ),
              e("div", { style: { fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 } }, a.tendencia)
            ),
            e(
              "div",
              { style: { padding: "0 18px 14px" } },
              e(
                "div",
                { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 } },
                e("span", null, "Iniciativas: " + done + "/" + total + " completadas"),
                e("span", null, pct(avgAv) + " avance")
              ),
              e("div", { className: "bar" }, e("div", { className: "bar-fill", style: { width: pct(avgAv), background: avgAv >= 50 ? "var(--green)" : avgAv > 0 ? "var(--yellow)" : "var(--red)" } }))
            )
          );
        })
      ),
      areas.length === 0 &&
        e("div", { style: { textAlign: "center", padding: 40, color: "var(--muted)" } }, "No hay datos de áreas para " + tri + ". Agrega áreas para este trimestre.")
    );
  }

  // Detalle de un área
  return e(
    "div",
    null,
    e("button", { className: "back-btn", onClick: () => setSelectedArea(null) }, "← Volver a todas las áreas"),
    area &&
      e(
        "div",
        { className: "panel", style: { marginBottom: 20 } },
        e(
          "div",
          { className: "panel-header", style: { flexDirection: "column", alignItems: "flex-start", gap: 6 } },
          e("div", { style: { fontSize: "1.2rem", fontWeight: 700 } }, area.area),
          e("div", { style: { color: "var(--muted)", fontSize: "0.85rem" } }, "Responsable: ", e("strong", null, area.resp)),
          area.rol && e("div", { style: { color: "var(--muted)", fontSize: "0.8rem", marginTop: 4 } }, area.rol)
        ),
        e(
          "div",
          { style: { padding: 20, display: "flex", gap: 20, flexWrap: "wrap" } },
          e(
            "div",
            { style: { display: "flex", gap: 16 } },
            e("span", { style: { color: "var(--green)", fontSize: "1.1rem" } }, "🟢 " + area.verdes),
            e("span", { style: { color: "var(--yellow)", fontSize: "1.1rem" } }, "🟡 " + area.amarillos),
            e("span", { style: { color: "var(--red)", fontSize: "1.1rem" } }, "🔴 " + area.rojos)
          ),
          e("div", { style: { color: "var(--muted)" } }, area.tendencia)
        ),
        (area.diagnostico || area.recomendacion) &&
          e(
            "div",
            { style: { padding: "0 20px 20px", display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" } },
            area.diagnostico &&
              e(
                "div",
                { style: { background: "var(--navy2)", borderRadius: 10, padding: 14 } },
                e("div", { style: { fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 } }, "Diagnóstico"),
                e("div", { style: { fontSize: "0.83rem" } }, area.diagnostico)
              ),
            area.recomendacion &&
              e(
                "div",
                { style: { background: "var(--navy2)", borderRadius: 10, padding: 14 } },
                e("div", { style: { fontSize: "0.75rem", color: "var(--teal)", textTransform: "uppercase", marginBottom: 6 } }, "Recomendación Q2"),
                e("div", { style: { fontSize: "0.83rem" } }, area.recomendacion)
              )
          )
      ),

    // KPIs del área — tracking mensual
    areaKpis.length > 0 &&
      e(
        "div",
        { className: "section" },
        e("div", { className: "section-title" }, "KPIs — Seguimiento Mensual"),
        e(
          "div",
          { className: "panel" },
          e(
            "div",
            { className: "table-wrap" },
            e(
              "table",
              null,
              e(
                "thead",
                null,
                e(
                  "tr",
                  null,
                  e("th", null, "KPI"),
                  e("th", null, "Meta"),
                  e("th", null, MESES_BY_TRI[tri][0]),
                  e("th", null, MESES_BY_TRI[tri][1]),
                  e("th", null, MESES_BY_TRI[tri][2]),
                  e("th", null, "Estatus"),
                  e("th", null, "Tendencia"),
                  e("th", null, "")
                )
              ),
              e(
                "tbody",
                null,
                areaKpis.map((s) => {
                  const isEditing = editingSem === s.id;
                  const statusColor = s.est.includes("🔴") ? "rgba(239,83,80,.1)" : s.est.includes("🟡") ? "rgba(255,193,7,.08)" : "";

                  if (isEditing) {
                    return e(
                      "tr",
                      { key: s.id },
                      e("td", null, e("input", { className: "inp-inline", value: draftSem.kpi, onChange: (ev) => setDraftSem({ ...draftSem, kpi: ev.target.value }) })),
                      e("td", null, e("input", { className: "inp-inline", value: draftSem.meta, onChange: (ev) => setDraftSem({ ...draftSem, meta: ev.target.value }) })),
                      e("td", null, e("input", { className: "inp-inline", value: draftSem.ene, onChange: (ev) => setDraftSem({ ...draftSem, ene: ev.target.value }) })),
                      e("td", null, e("input", { className: "inp-inline", value: draftSem.feb, onChange: (ev) => setDraftSem({ ...draftSem, feb: ev.target.value }) })),
                      e("td", null, e("input", { className: "inp-inline", value: draftSem.mar, onChange: (ev) => setDraftSem({ ...draftSem, mar: ev.target.value }) })),
                      e(
                        "td",
                        null,
                        e("select", { className: "inp-inline", value: draftSem.est, onChange: (ev) => setDraftSem({ ...draftSem, est: ev.target.value }) },
                          e("option", { value: "🟢" }, "🟢 Verde"),
                          e("option", { value: "🟡" }, "🟡 Amarillo"),
                          e("option", { value: "🔴" }, "🔴 Rojo")
                        )
                      ),
                      e("td", null, e("input", { className: "inp-inline", value: draftSem.tendencia || "", onChange: (ev) => setDraftSem({ ...draftSem, tendencia: ev.target.value }) })),
                      e(
                        "td",
                        null,
                        e("button", { className: "btn-inline", onClick: () => saveSem(s.id), style: { marginRight: 4 } }, "Guardar"),
                        e("button", { className: "btn-inline", onClick: () => setEditingSem(null) }, "Cancelar")
                      )
                    );
                  }

                  return e(
                    "tr",
                    { key: s.id, style: statusColor ? { background: statusColor } : {} },
                    e(
                      "td",
                      null,
                      e("div", { style: { fontWeight: 600 } }, s.kpi),
                      s.descripcion && e("div", { style: { fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 } }, s.descripcion)
                    ),
                    e("td", { style: { fontWeight: 500 } }, s.meta),
                    e("td", null, s.ene),
                    e("td", null, s.feb),
                    e("td", null, s.mar),
                    e("td", { className: "sem" }, s.est),
                    e("td", { style: { fontSize: "0.8rem" } }, s.tendencia),
                    e("td", null, e("button", { className: "btn-inline", onClick: () => { setEditingSem(s.id); setDraftSem({ ...s }); } }, "Editar"))
                  );
                })
              )
            )
          )
        ),
        // Diagnóstico y recomendación por KPI
        areaKpis.filter((s) => s.diagnostico || s.recomendacion).length > 0 &&
          e(
            "div",
            { style: { marginTop: 12 } },
            areaKpis
              .filter((s) => s.diagnostico || s.recomendacion)
              .map((s) =>
                e(
                  "div",
                  { key: s.id, style: { background: "var(--card)", borderRadius: 10, padding: 12, marginBottom: 8, border: "1px solid var(--border)" } },
                  e("div", { style: { fontWeight: 600, fontSize: "0.82rem", marginBottom: 4 } }, s.kpi),
                  s.diagnostico && e("div", { style: { fontSize: "0.78rem", color: "var(--muted)" } }, "Diagnóstico: ", s.diagnostico),
                  s.recomendacion && e("div", { style: { fontSize: "0.78rem", color: "var(--teal)", marginTop: 2 } }, "Recomendación: ", s.recomendacion)
                )
              )
          )
      ),

    // Iniciativas del área
    e(
      "div",
      { className: "section", style: { marginTop: 20 } },
      e("div", { className: "section-title" }, "Iniciativas Visión 2026"),
      e(
        "div",
        { style: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" } },
        e("div", { className: "chip", style: { background: "rgba(76,175,80,.15)", color: "var(--green)" } }, "Completadas: " + areaInis.filter((i) => i.est === "Completada").length),
        e("div", { className: "chip", style: { background: "rgba(255,193,7,.15)", color: "var(--yellow)" } }, "En Progreso: " + areaInis.filter((i) => i.est === "En Progreso").length),
        e("div", { className: "chip", style: { background: "rgba(239,83,80,.15)", color: "var(--coral)" } }, "Pendientes: " + areaInis.filter((i) => i.est === "Pendiente").length)
      ),
      areaInis.map((ini) => {
        const isEditing = editingIni === ini.id;
        const statusColor = ini.est === "Completada" ? "var(--green)" : ini.est === "En Progreso" ? "var(--yellow)" : "var(--coral)";
        const priBg = ini.pri === "Alta" ? "rgba(239,83,80,.15)" : ini.pri === "Media" ? "rgba(255,193,7,.15)" : "rgba(136,153,170,.15)";
        const priColor = ini.pri === "Alta" ? "var(--coral)" : ini.pri === "Media" ? "var(--yellow)" : "var(--muted)";

        if (isEditing) {
          return e(
            "div",
            { key: ini.id, className: "ini-edit-card" },
            e("div", { style: { fontWeight: 600, marginBottom: 8, fontSize: "0.85rem" } }, "Editando iniciativa"),
            e(
              "div",
              { className: "edit-grid" },
              e("label", null, "Iniciativa"),
              e("textarea", { className: "inp-inline", rows: 2, value: draftIni.ini, onChange: (ev) => setDraftIni({ ...draftIni, ini: ev.target.value }) }),
              e("label", null, "Prioridad"),
              e("select", { className: "inp-inline", value: draftIni.pri, onChange: (ev) => setDraftIni({ ...draftIni, pri: ev.target.value }) },
                e("option", { value: "Alta" }, "Alta"),
                e("option", { value: "Media" }, "Media"),
                e("option", { value: "Baja" }, "Baja")
              ),
              e("label", null, "Estatus"),
              e("select", { className: "inp-inline", value: draftIni.est, onChange: (ev) => setDraftIni({ ...draftIni, est: ev.target.value }) },
                e("option", { value: "Pendiente" }, "Pendiente"),
                e("option", { value: "En Progreso" }, "En Progreso"),
                e("option", { value: "Completada" }, "Completada")
              ),
              e("label", null, "Avance %"),
              e("input", { className: "inp-inline", type: "number", min: 0, max: 100, value: draftIni.av, onChange: (ev) => setDraftIni({ ...draftIni, av: Number(ev.target.value) }) }),
              e("label", null, "Notas"),
              e("textarea", { className: "inp-inline", rows: 2, value: draftIni.notas, onChange: (ev) => setDraftIni({ ...draftIni, notas: ev.target.value }) })
            ),
            e(
              "div",
              { style: { marginTop: 10, display: "flex", gap: 8 } },
              e("button", { className: "btn-inline", style: { background: "var(--teal)", color: "#fff", border: "none", padding: "6px 16px" }, onClick: () => saveIni(ini.id) }, "Guardar"),
              e("button", { className: "btn-inline", onClick: () => setEditingIni(null) }, "Cancelar")
            )
          );
        }

        return e(
          "div",
          { key: ini.id, className: "ini-item", style: { display: "flex", flexDirection: "column", gap: 6 } },
          e(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
            e(
              "div",
              { style: { flex: 1 } },
              e(
                "div",
                { style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 4 } },
                e("span", { className: "tag", style: { background: priBg, color: priColor } }, ini.pri),
                e("span", { className: "chip", style: { background: statusColor === "var(--green)" ? "rgba(76,175,80,.15)" : statusColor === "var(--yellow)" ? "rgba(255,193,7,.15)" : "rgba(239,83,80,.15)", color: statusColor, fontSize: "0.7rem" } }, ini.est)
              ),
              e("div", { style: { fontSize: "0.85rem" } }, ini.ini)
            ),
            e("button", { className: "btn-inline", style: { flexShrink: 0 }, onClick: () => { setEditingIni(ini.id); setDraftIni({ ...ini }); } }, "Editar")
          ),
          e(
            "div",
            { style: { display: "flex", gap: 12, alignItems: "center" } },
            e("div", { className: "bar", style: { flex: 1 } }, e("div", { className: "bar-fill", style: { width: pct(ini.av), background: statusColor } })),
            e("span", { style: { fontSize: "0.78rem", fontWeight: 600, minWidth: 40, textAlign: "right" } }, pct(ini.av))
          ),
          ini.notas && e("div", { style: { fontSize: "0.75rem", color: "var(--muted)" } }, ini.notas)
        );
      })
    )
  );
}

/* ─── Semáforo de KPIs ─── */
function SemaforoView({ semaforo, setSemaforo, tri }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [filterArea, setFilterArea] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const allAreas = useMemo(() => [...new Set(semaforo.map((s) => s.area).filter(Boolean))].sort(), [semaforo]);

  const filtered = useMemo(() => {
    let f = semaforo;
    if (filterArea) f = f.filter((s) => s.area === filterArea);
    if (filterStatus) f = f.filter((s) => s.est.includes(filterStatus));
    return f;
  }, [semaforo, filterArea, filterStatus]);

  const save = async (id) => {
    try {
      const u = await apiPatch("/api/semaforo/" + id, draft);
      setSemaforo((prev) => prev.map((x) => (x.id === id ? u : x)));
      setEditingId(null);
    } catch (e2) {
      alert("Error: " + e2.message);
    }
  };

  return e(
    "div",
    null,
    e("div", { className: "section-title" }, "Semáforo de KPIs — " + tri),
    // Filters
    e(
      "div",
      { style: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" } },
      e(
        "select",
        { className: "inp-inline", style: { width: 200 }, value: filterArea, onChange: (ev) => setFilterArea(ev.target.value) },
        e("option", { value: "" }, "Todas las áreas"),
        allAreas.map((a) => e("option", { key: a, value: a }, a))
      ),
      e(
        "select",
        { className: "inp-inline", style: { width: 160 }, value: filterStatus, onChange: (ev) => setFilterStatus(ev.target.value) },
        e("option", { value: "" }, "Todos los estatus"),
        e("option", { value: "🟢" }, "🟢 Verde"),
        e("option", { value: "🟡" }, "🟡 Amarillo"),
        e("option", { value: "🔴" }, "🔴 Rojo")
      )
    ),
    e(
      "div",
      { className: "panel" },
      e(
        "div",
        { className: "table-wrap" },
        e(
          "table",
          null,
          e(
            "thead",
            null,
            e(
              "tr",
              null,
              e("th", null, "KPI"),
              e("th", null, "Área"),
              e("th", null, "Responsable"),
              e("th", null, "Meta"),
              e("th", null, MESES_BY_TRI[tri][0]),
              e("th", null, MESES_BY_TRI[tri][1]),
              e("th", null, MESES_BY_TRI[tri][2]),
              e("th", null, "Estatus"),
              e("th", null, "Tendencia"),
              e("th", null, "")
            )
          ),
          e(
            "tbody",
            null,
            filtered.map((s) => {
              if (editingId === s.id) {
                return e(
                  "tr",
                  { key: s.id },
                  e("td", null, e("input", { className: "inp-inline", value: draft.kpi, onChange: (ev) => setDraft({ ...draft, kpi: ev.target.value }) })),
                  e("td", null, s.area),
                  e("td", null, e("input", { className: "inp-inline", value: draft.resp || "", onChange: (ev) => setDraft({ ...draft, resp: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.meta, onChange: (ev) => setDraft({ ...draft, meta: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.ene, onChange: (ev) => setDraft({ ...draft, ene: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.feb, onChange: (ev) => setDraft({ ...draft, feb: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.mar, onChange: (ev) => setDraft({ ...draft, mar: ev.target.value }) })),
                  e("td", null,
                    e("select", { className: "inp-inline", value: draft.est, onChange: (ev) => setDraft({ ...draft, est: ev.target.value }) },
                      e("option", { value: "🟢" }, "🟢"), e("option", { value: "🟡" }, "🟡"), e("option", { value: "🔴" }, "🔴")
                    )
                  ),
                  e("td", null, e("input", { className: "inp-inline", value: draft.tendencia || "", onChange: (ev) => setDraft({ ...draft, tendencia: ev.target.value }) })),
                  e("td", null,
                    e("button", { className: "btn-inline", onClick: () => save(s.id), style: { marginRight: 4 } }, "OK"),
                    e("button", { className: "btn-inline", onClick: () => setEditingId(null) }, "X")
                  )
                );
              }

              const bg = s.est.includes("🔴") ? "rgba(239,83,80,.08)" : s.est.includes("🟡") ? "rgba(255,193,7,.05)" : "";
              return e(
                "tr",
                { key: s.id, style: bg ? { background: bg } : {} },
                e(
                  "td",
                  null,
                  e("div", { style: { fontWeight: 600 } }, s.kpi),
                  s.descripcion && e("div", { style: { fontSize: "0.7rem", color: "var(--muted)" } }, s.descripcion)
                ),
                e("td", null, s.area),
                e("td", null, s.resp),
                e("td", { style: { fontWeight: 500 } }, s.meta),
                e("td", null, s.ene),
                e("td", null, s.feb),
                e("td", null, s.mar),
                e("td", { className: "sem" }, s.est),
                e("td", { style: { fontSize: "0.8rem" } }, s.tendencia),
                e("td", null, e("button", { className: "btn-inline", onClick: () => { setEditingId(s.id); setDraft({ ...s }); } }, "Editar"))
              );
            })
          )
        )
      )
    )
  );
}

/* ─── Iniciativas ─── */
function IniciativasView({ iniciativas, setIniciativas, tri }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [filterArea, setFilterArea] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [openAreas, setOpenAreas] = useState({});

  const allAreas = useMemo(() => [...new Set(iniciativas.map((i) => i.area).filter(Boolean))].sort(), [iniciativas]);

  const filtered = useMemo(() => {
    let f = iniciativas;
    if (filterArea) f = f.filter((i) => i.area === filterArea);
    if (filterStatus) f = f.filter((i) => i.est === filterStatus);
    return f;
  }, [iniciativas, filterArea, filterStatus]);

  const groupedByArea = useMemo(() => {
    const m = {};
    filtered.forEach((i) => {
      const a = i.area || "Sin área";
      if (!m[a]) m[a] = [];
      m[a].push(i);
    });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const totalInis = iniciativas.length;
  const doneInis = iniciativas.filter((i) => i.est === "Completada").length;
  const progInis = iniciativas.filter((i) => i.est === "En Progreso").length;
  const pendInis = iniciativas.filter((i) => i.est === "Pendiente").length;

  const save = async (id) => {
    try {
      const u = await apiPatch("/api/iniciativas/" + id, draft);
      setIniciativas((prev) => prev.map((x) => (x.id === id ? u : x)));
      setEditingId(null);
    } catch (e2) {
      alert("Error: " + e2.message);
    }
  };

  const toggleArea = (area) => {
    setOpenAreas((prev) => ({ ...prev, [area]: !prev[area] }));
  };

  return e(
    "div",
    null,
    e("div", { className: "section-title" }, "Iniciativas Visión 2026 — " + tri),
    // Summary cards
    e(
      "div",
      { className: "grid g4", style: { marginBottom: 16 } },
      e(KpiCard, { label: "Total", value: String(totalInis), color: "var(--teal)" }),
      e(KpiCard, { label: "Completadas", value: String(doneInis), sub: pct(totalInis ? doneInis / totalInis * 100 : 0), color: "var(--green)" }),
      e(KpiCard, { label: "En Progreso", value: String(progInis), color: "var(--yellow)" }),
      e(KpiCard, { label: "Pendientes", value: String(pendInis), sub: pct(totalInis ? pendInis / totalInis * 100 : 0), color: "var(--coral)" })
    ),
    // Filters
    e(
      "div",
      { style: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" } },
      e(
        "select",
        { className: "inp-inline", style: { width: 200 }, value: filterArea, onChange: (ev) => setFilterArea(ev.target.value) },
        e("option", { value: "" }, "Todas las áreas"),
        allAreas.map((a) => e("option", { key: a, value: a }, a))
      ),
      e(
        "select",
        { className: "inp-inline", style: { width: 160 }, value: filterStatus, onChange: (ev) => setFilterStatus(ev.target.value) },
        e("option", { value: "" }, "Todos los estatus"),
        e("option", { value: "Completada" }, "Completada"),
        e("option", { value: "En Progreso" }, "En Progreso"),
        e("option", { value: "Pendiente" }, "Pendiente")
      )
    ),
    // Grouped by area
    groupedByArea.map(([area, items]) => {
      const isOpen = openAreas[area] !== false;
      const done = items.filter((i) => i.est === "Completada").length;
      const avgAv = items.length ? items.reduce((s, i) => s + i.av, 0) / items.length : 0;
      const resp = items[0] ? items[0].resp : "";

      return e(
        "div",
        { key: area, className: "area-card", style: { marginBottom: 12 } },
        e(
          "div",
          { className: "area-header", onClick: () => toggleArea(area) },
          e(
            "div",
            null,
            e("span", { style: { fontWeight: 700 } }, area),
            e("span", { style: { color: "var(--muted)", marginLeft: 8, fontSize: "0.8rem" } }, resp),
            e("span", { style: { color: "var(--muted)", marginLeft: 12, fontSize: "0.78rem" } }, done + "/" + items.length + " completadas · " + pct(avgAv) + " avance")
          ),
          e("span", { style: { fontSize: "1.2rem" } }, isOpen ? "▾" : "▸")
        ),
        isOpen &&
          e(
            "div",
            { className: "area-body" },
            e("div", { className: "bar", style: { marginBottom: 12 } }, e("div", { className: "bar-fill", style: { width: pct(avgAv), background: avgAv >= 50 ? "var(--green)" : avgAv > 0 ? "var(--yellow)" : "var(--red)" } })),
            items.map((ini) => {
              const statusColor = ini.est === "Completada" ? "var(--green)" : ini.est === "En Progreso" ? "var(--yellow)" : "var(--coral)";

              if (editingId === ini.id) {
                return e(
                  "div",
                  { key: ini.id, className: "ini-edit-card" },
                  e(
                    "div",
                    { className: "edit-grid" },
                    e("label", null, "Iniciativa"),
                    e("textarea", { className: "inp-inline", rows: 2, value: draft.ini, onChange: (ev) => setDraft({ ...draft, ini: ev.target.value }) }),
                    e("label", null, "Prioridad"),
                    e("select", { className: "inp-inline", value: draft.pri, onChange: (ev) => setDraft({ ...draft, pri: ev.target.value }) },
                      e("option", { value: "Alta" }, "Alta"), e("option", { value: "Media" }, "Media"), e("option", { value: "Baja" }, "Baja")
                    ),
                    e("label", null, "Estatus"),
                    e("select", { className: "inp-inline", value: draft.est, onChange: (ev) => setDraft({ ...draft, est: ev.target.value }) },
                      e("option", { value: "Pendiente" }, "Pendiente"), e("option", { value: "En Progreso" }, "En Progreso"), e("option", { value: "Completada" }, "Completada")
                    ),
                    e("label", null, "Avance %"),
                    e("input", { className: "inp-inline", type: "number", min: 0, max: 100, value: draft.av, onChange: (ev) => setDraft({ ...draft, av: Number(ev.target.value) }) }),
                    e("label", null, "Notas"),
                    e("textarea", { className: "inp-inline", rows: 2, value: draft.notas, onChange: (ev) => setDraft({ ...draft, notas: ev.target.value }) })
                  ),
                  e(
                    "div",
                    { style: { marginTop: 10, display: "flex", gap: 8 } },
                    e("button", { className: "btn-inline", style: { background: "var(--teal)", color: "#fff", border: "none", padding: "6px 16px" }, onClick: () => save(ini.id) }, "Guardar"),
                    e("button", { className: "btn-inline", onClick: () => setEditingId(null) }, "Cancelar")
                  )
                );
              }

              return e(
                "div",
                { key: ini.id, className: "ini-item" },
                e(
                  "div",
                  { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 } },
                  e(
                    "div",
                    { style: { flex: 1 } },
                    e(
                      "div",
                      { style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 3 } },
                      e("span", { className: "tag", style: { background: ini.pri === "Alta" ? "rgba(239,83,80,.15)" : ini.pri === "Media" ? "rgba(255,193,7,.15)" : "rgba(136,153,170,.15)", color: ini.pri === "Alta" ? "var(--coral)" : ini.pri === "Media" ? "var(--yellow)" : "var(--muted)" } }, ini.pri),
                      e("span", { className: "chip", style: { background: statusColor === "var(--green)" ? "rgba(76,175,80,.15)" : statusColor === "var(--yellow)" ? "rgba(255,193,7,.15)" : "rgba(239,83,80,.15)", color: statusColor, fontSize: "0.7rem" } }, ini.est)
                    ),
                    e("div", null, ini.ini)
                  ),
                  e("button", { className: "btn-inline", onClick: () => { setEditingId(ini.id); setDraft({ ...ini }); } }, "Editar")
                ),
                e(
                  "div",
                  { style: { display: "flex", gap: 8, alignItems: "center" } },
                  e("div", { className: "bar", style: { flex: 1 } }, e("div", { className: "bar-fill", style: { width: pct(ini.av), background: statusColor } })),
                  e("span", { style: { fontSize: "0.78rem", fontWeight: 600, minWidth: 40, textAlign: "right" } }, pct(ini.av))
                ),
                ini.notas && e("div", { style: { fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 } }, ini.notas)
              );
            })
          )
      );
    })
  );
}

/* ─── Deals View ─── */
function DealsView({ deals, setDeals }) {
  const [search, setSearch] = useState("");
  const [filterMes, setFilterMes] = useState("");
  const [sortCol, setSortCol] = useState("f");
  const [sortDir, setSortDir] = useState(-1);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const allMeses = useMemo(() => [...new Set(deals.map((d) => d.m).filter(Boolean))], [deals]);
  const allAsesores = useMemo(() => [...new Set(deals.map((d) => d.a).filter(Boolean))].sort(), [deals]);

  const filtered = useMemo(() => {
    let f = deals;
    if (search) {
      const s = search.toLowerCase();
      f = f.filter((d) => (d.a + " " + d.c + " " + d.t).toLowerCase().includes(s));
    }
    if (filterMes) f = f.filter((d) => d.m === filterMes);
    f = [...f].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (typeof va === "number") return (va - vb) * sortDir;
      return String(va || "").localeCompare(String(vb || "")) * sortDir;
    });
    return f;
  }, [deals, search, filterMes, sortCol, sortDir]);

  const totalImp = filtered.reduce((s, d) => s + d.i, 0);
  const totalUtil = filtered.reduce((s, d) => s + d.u, 0);
  const n = filtered.length;

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d * -1);
    else { setSortCol(col); setSortDir(-1); }
  };

  const save = async (id) => {
    try {
      const u = await apiPatch("/api/deals/" + id, { a: draft.a, c: draft.c, t: draft.t, i: draft.i, p: draft.p, u: draft.u, f: draft.f, m: draft.m });
      setDeals((prev) => prev.map((x) => (x.id === id ? u : x)));
      setEditingId(null);
    } catch (e2) {
      alert("Error: " + e2.message);
    }
  };

  return e(
    "div",
    null,
    e(
      "div",
      { className: "grid g4", style: { marginBottom: 16 } },
      e(KpiCard, { label: "Tratos", value: String(n), color: "var(--teal)" }),
      e(KpiCard, { label: "Ventas", value: fmt(totalImp), color: "var(--lime)" }),
      e(KpiCard, { label: "Utilidad", value: fmt(totalUtil), color: "var(--gold)" }),
      e(KpiCard, { label: "Ticket Prom", value: n ? fmt(totalImp / n) : "$0", color: "var(--coral)" })
    ),
    e(
      "div",
      { style: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" } },
      e("input", { className: "search-box", style: { flex: 1, minWidth: 200 }, placeholder: "Buscar asesor, cuenta o trato...", value: search, onChange: (ev) => setSearch(ev.target.value) }),
      e(
        "select",
        { className: "inp-inline", style: { width: 120 }, value: filterMes, onChange: (ev) => setFilterMes(ev.target.value) },
        e("option", { value: "" }, "Todos"),
        allMeses.map((m) => e("option", { key: m, value: m }, m))
      )
    ),
    e(
      "div",
      { className: "panel" },
      e(
        "div",
        { className: "table-wrap" },
        e(
          "table",
          null,
          e(
            "thead",
            null,
            e(
              "tr",
              null,
              ["a", "c", "t", "i", "p", "u", "m", "f"].map((col) => {
                const labels = { a: "Asesor", c: "Cuenta", t: "Trato", i: "Importe", p: "Margen%", u: "Utilidad", m: "Mes", f: "Fecha" };
                return e("th", { key: col, style: { cursor: "pointer" }, onClick: () => toggleSort(col) }, labels[col], sortCol === col && (sortDir > 0 ? " ↑" : " ↓"));
              }),
              e("th", null, "")
            )
          ),
          e(
            "tbody",
            null,
            filtered.map((d) => {
              if (editingId === d.id) {
                return e(
                  "tr",
                  { key: d.id },
                  e("td", null, e("input", { className: "inp-inline", value: draft.a, onChange: (ev) => setDraft({ ...draft, a: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.c, onChange: (ev) => setDraft({ ...draft, c: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.t, onChange: (ev) => setDraft({ ...draft, t: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", type: "number", value: draft.i, onChange: (ev) => setDraft({ ...draft, i: Number(ev.target.value) }) })),
                  e("td", null, e("input", { className: "inp-inline", type: "number", value: draft.p, onChange: (ev) => setDraft({ ...draft, p: Number(ev.target.value) }) })),
                  e("td", null, e("input", { className: "inp-inline", type: "number", value: draft.u, onChange: (ev) => setDraft({ ...draft, u: Number(ev.target.value) }) })),
                  e("td", null, e("input", { className: "inp-inline", value: draft.m, onChange: (ev) => setDraft({ ...draft, m: ev.target.value }) })),
                  e("td", null, e("input", { className: "inp-inline", type: "date", value: draft.f, onChange: (ev) => setDraft({ ...draft, f: ev.target.value }) })),
                  e("td", null,
                    e("button", { className: "btn-inline", onClick: () => save(d.id), style: { marginRight: 4 } }, "OK"),
                    e("button", { className: "btn-inline", onClick: () => setEditingId(null) }, "X")
                  )
                );
              }
              return e(
                "tr",
                { key: d.id },
                e("td", null, d.a),
                e("td", null, d.c),
                e("td", null, d.t),
                e("td", { className: "money" }, fmtFull(d.i)),
                e("td", null, pct(d.p)),
                e("td", { className: "money-gold" }, fmtFull(d.u)),
                e("td", null, d.m),
                e("td", null, d.f),
                e("td", null, e("button", { className: "btn-inline", onClick: () => { setEditingId(d.id); setDraft({ ...d }); } }, "Editar"))
              );
            })
          )
        )
      )
    )
  );
}

/* ─── Financiero x Mes ─── */
function FinancieroView({ deals, tri }) {
  const MESES_DATA = useMemo(() => computeMesesData(deals, tri), [deals, tri]);
  const totalImp = deals.reduce((s, d) => s + d.i, 0);
  const totalUtil = deals.reduce((s, d) => s + d.u, 0);
  const meta = 70000000 / 4;

  return e(
    "div",
    null,
    e("div", { className: "section-title" }, "Desglose Financiero — " + tri),
    e(
      "div",
      { className: "grid g3", style: { marginBottom: 20 } },
      MESES_DATA.map((m, i) => {
        const margin = m.imp ? m.util / m.imp * 100 : 0;
        const metaMes = meta / 3;
        const pctMes = m.imp / metaMes * 100;
        return e(
          "div",
          { key: i, className: "panel" },
          e("div", { className: "panel-header" }, m.name),
          e(
            "div",
            { style: { padding: 20 } },
            e("div", { style: { fontSize: "0.78rem", color: "var(--muted)", marginBottom: 4 } }, "Ventas"),
            e("div", { style: { fontSize: "1.4rem", fontWeight: 700, color: "var(--teal)" } }, fmt(m.imp)),
            e("div", { className: "bar", style: { margin: "8px 0" } }, e("div", { className: "bar-fill", style: { width: pct(Math.min(pctMes, 100)), background: pctMes >= 100 ? "var(--green)" : pctMes >= 70 ? "var(--yellow)" : "var(--red)" } })),
            e("div", { style: { fontSize: "0.75rem", color: "var(--muted)" } }, pct(pctMes) + " de meta mensual"),
            e("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: "0.82rem" } },
              e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.72rem" } }, "Utilidad"), e("div", { style: { fontWeight: 600, color: "var(--gold)" } }, fmt(m.util))),
              e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.72rem" } }, "Margen"), e("div", { style: { fontWeight: 600 } }, pct(margin))),
              e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.72rem" } }, "Tratos"), e("div", { style: { fontWeight: 600 } }, String(m.deals)))
            )
          )
        );
      })
    ),
    // Totals
    e(
      "div",
      { className: "panel" },
      e("div", { className: "panel-header" }, "Resumen " + tri),
      e(
        "div",
        { style: { padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 20 } },
        e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.75rem" } }, "Ventas Totales"), e("div", { style: { fontSize: "1.3rem", fontWeight: 700, color: "var(--teal)" } }, fmt(totalImp))),
        e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.75rem" } }, "Utilidad Total"), e("div", { style: { fontSize: "1.3rem", fontWeight: 700, color: "var(--gold)" } }, fmt(totalUtil))),
        e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.75rem" } }, "Meta Trimestral"), e("div", { style: { fontSize: "1.3rem", fontWeight: 700 } }, fmt(meta))),
        e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.75rem" } }, "% Cumplimiento"), e("div", { style: { fontSize: "1.3rem", fontWeight: 700, color: totalImp / meta >= 1 ? "var(--green)" : "var(--coral)" } }, pct(totalImp / meta * 100))),
        e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.75rem" } }, "Proyección Anual"), e("div", { style: { fontSize: "1.3rem", fontWeight: 700 } }, fmt(totalImp * 4)))
      )
    ),
    // Bar chart
    e(
      "div",
      { className: "panel", style: { marginTop: 16 } },
      e("div", { className: "panel-header" }, "Ventas por Mes"),
      e(
        "div",
        { style: { padding: 20 } },
        MESES_DATA.map((m, i) => {
          const maxImp = Math.max(...MESES_DATA.map((x) => x.imp), 1);
          return e(
            "div",
            { key: i, className: "chart-bar-h" },
            e("span", { className: "bar-label" }, m.name),
            e(
              "div",
              { className: "bar-track" },
              e("div", { className: "bar-value", style: { width: pct(m.imp / maxImp * 100), background: ["var(--teal)", "var(--lime)", "var(--gold)"][i % 3] } }, m.deals + " tratos")
            ),
            e("span", { className: "bar-amount money" }, fmt(m.imp))
          );
        })
      )
    )
  );
}

/* ─── Equipo Comercial ─── */
function EquipoView({ deals }) {
  const [selectedAsesor, setSelectedAsesor] = useState(null);
  const ASESORES = useMemo(() => computeAsesores(deals), [deals]);
  const totalImp = deals.reduce((s, d) => s + d.i, 0);

  if (selectedAsesor) {
    const asesorDeals = deals.filter((d) => d.a === selectedAsesor);
    const asesorImp = asesorDeals.reduce((s, d) => s + d.i, 0);
    const asesorUtil = asesorDeals.reduce((s, d) => s + d.u, 0);

    return e(
      "div",
      null,
      e("button", { className: "back-btn", onClick: () => setSelectedAsesor(null) }, "← Volver al equipo"),
      e("div", { className: "section-title" }, selectedAsesor),
      e(
        "div",
        { className: "grid g4", style: { marginBottom: 16 } },
        e(KpiCard, { label: "Tratos", value: String(asesorDeals.length), color: "var(--teal)" }),
        e(KpiCard, { label: "Ventas", value: fmt(asesorImp), color: "var(--lime)" }),
        e(KpiCard, { label: "Utilidad", value: fmt(asesorUtil), color: "var(--gold)" }),
        e(KpiCard, { label: "% del Total", value: pct(totalImp ? asesorImp / totalImp * 100 : 0), color: "var(--coral)" })
      ),
      e(
        "div",
        { className: "panel" },
        e(
          "div",
          { className: "table-wrap" },
          e(
            "table",
            null,
            e("thead", null, e("tr", null, e("th", null, "Cuenta"), e("th", null, "Trato"), e("th", null, "Importe"), e("th", null, "Margen"), e("th", null, "Utilidad"), e("th", null, "Mes"), e("th", null, "Fecha"))),
            e(
              "tbody",
              null,
              asesorDeals.map((d) =>
                e("tr", { key: d.id },
                  e("td", null, d.c),
                  e("td", null, d.t),
                  e("td", { className: "money" }, fmtFull(d.i)),
                  e("td", null, pct(d.p)),
                  e("td", { className: "money-gold" }, fmtFull(d.u)),
                  e("td", null, d.m),
                  e("td", null, d.f)
                )
              )
            )
          )
        )
      )
    );
  }

  return e(
    "div",
    null,
    e("div", { className: "section-title" }, "Equipo Comercial"),
    e(
      "div",
      { className: "grid g3" },
      ASESORES.map((a, i) =>
        e(
          "div",
          { key: i, className: "kpi-card", onClick: () => setSelectedAsesor(a.name), style: { cursor: "pointer" } },
          e("div", { className: "accent", style: { background: "hsl(" + (170 + i * 20) + ",65%,45%)" } }),
          e("div", { style: { fontWeight: 700, marginBottom: 4 } }, a.name),
          e("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.82rem" } },
            e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.72rem" } }, "Ventas"), e("div", { className: "money", style: { fontWeight: 600 } }, fmt(a.imp))),
            e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.72rem" } }, "Tratos"), e("div", { style: { fontWeight: 600 } }, String(a.deals))),
            e("div", null, e("div", { style: { color: "var(--muted)", fontSize: "0.72rem" } }, "Utilidad"), e("div", { className: "money-gold", style: { fontWeight: 600 } }, fmt(a.util)))
          ),
          e("div", { style: { fontSize: "0.72rem", color: "var(--muted)", marginTop: 6 } }, pct(totalImp ? a.imp / totalImp * 100 : 0) + " del total")
        )
      )
    )
  );
}

/* ─── Mount ─── */
ReactDOM.createRoot(document.getElementById("root")).render(e(Root));
