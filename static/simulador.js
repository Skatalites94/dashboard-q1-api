/* ── Simulador de Ingresos Module ── */
window.SimuladorModule = (function() {
  var container = null;
  var state = {
    asesores: [],
    config: {},
    tipos_cliente: [],
    simulation: null,
    expenseScenarios: [],
    revenueScenarios: [],
    selectedRevId: null,
    selectedExpId: null,
    plData: null,
    leadsOverride: {},    // { tipo_id: [12 monthly values] }
    leadsOverrideActive: {} // { tipo_id: bool }
  };
  var activeTab = 'config';
  var simTimer = null;
  var editTimer = null;

  var MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  var fmt = function(n) {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('es-MX');
  };
  var fmtPct = function(n) {
    if (n == null || isNaN(n)) return '0%';
    return (n * 100).toFixed(1) + '%';
  };
  var fmtPctRaw = function(n) {
    if (n == null || isNaN(n)) return '0%';
    return n.toFixed(1) + '%';
  };
  var fmtNum = function(n) {
    if (n == null || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('es-MX');
  };
  var fmtNumRaw = function(n) {
    var num = typeof n === 'string' ? parseFloat(n) : n;
    if (num == null || isNaN(num)) return '0';
    return Math.round(num).toLocaleString('es-MX');
  };
  window.__fmtNumRaw = fmtNumRaw;

  /* ── CSS Injection ── */
  function injectStyles() {
    if (container.querySelector('#sim-styles')) return;
    var style = document.createElement('style');
    style.id = 'sim-styles';
    style.textContent = [
      '.sim-container{max-width:1440px;margin:0 auto;padding:0 24px 40px}',

      /* KPI strip */
      '.sim-kpi-strip{max-width:1440px;margin:0 auto;padding:16px 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}',
      '.sim-kpi{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px 16px;position:relative;overflow:hidden;transition:border-color .2s;box-shadow:0 1px 3px rgba(0,0,0,.06)}',
      '.sim-kpi:hover{border-color:#CBD5E1}',
      '.sim-kpi .kl{font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}',
      '.sim-kpi .kv{font-size:22px;font-weight:700;color:#1E293B}',
      '.sim-kpi .kv.green{color:#22C55E}',
      '.sim-kpi .kv.blue{color:#4C6EF5}',
      '.sim-kpi .ks{font-size:12px;color:#64748B;margin-top:2px}',
      '.sim-kpi .accent-top{position:absolute;top:0;left:0;right:0;height:3px}',

      /* Tabs */
      '.sim-tabs{display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid #E2E8F0;flex-wrap:wrap}',
      '.sim-tab{padding:10px 16px;border:none;background:transparent;color:#64748B;cursor:pointer;border-radius:0;font-size:13px;font-weight:500;transition:all .2s;font-family:inherit;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-2px}',
      '.sim-tab.active{color:#4C6EF5;border-bottom:2px solid #4C6EF5}',
      '.sim-tab:hover:not(.active){color:#1E293B}',

      /* Cards & Panels */
      '.sim-card{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}',
      '.sim-card h4{font-size:13px;font-weight:600;color:#1E293B;margin-bottom:10px}',
      '.sim-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px}',
      '.sim-card-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}',

      /* Panel / Table */
      '.sim-panel{background:#fff;border-radius:8px;border:1px solid #E2E8F0;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}',
      '.sim-panel-header{padding:14px 20px;border-bottom:1px solid #E2E8F0;font-weight:600;font-size:14px;color:#1E293B;display:flex;justify-content:space-between;align-items:center}',
      '.sim-table-wrap{overflow-x:auto}',
      '.sim-panel table{width:100%;border-collapse:collapse;font-size:13px}',
      '.sim-panel th{background:#F8FAFC;padding:10px 12px;text-align:left;font-weight:600;color:#94A3B8;text-transform:uppercase;font-size:11px;letter-spacing:.5px;position:sticky;top:0;z-index:2}',
      '.sim-panel td{padding:8px 12px;border-bottom:1px solid #E2E8F0;color:#1E293B}',
      '.sim-panel tfoot td{background:#F8FAFC;font-weight:700;border-top:2px solid #E2E8F0}',
      '.sim-panel tr:hover td{background:#F8FAFC}',

      /* Inputs */
      '.sim-input{padding:6px 10px;border-radius:6px;border:1px solid #E2E8F0;background:#fff;color:#1E293B;font-size:13px;font-family:inherit;text-align:right;outline:none;transition:border-color .2s,box-shadow .2s;width:100px}',
      '.sim-input:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,.1)}',
      '.sim-input-sm{width:70px;padding:4px 6px;font-size:12px}',
      '.sim-input-xs{width:52px;padding:3px 4px;font-size:11px}',
      '.sim-select{padding:6px 10px;border-radius:6px;border:1px solid #E2E8F0;background:#fff;color:#1E293B;font-size:13px;font-family:inherit;outline:none;cursor:pointer}',
      '.sim-select:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,.1)}',

      /* Buttons */
      '.sim-btn{padding:8px 16px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}',
      '.sim-btn-primary{background:#4C6EF5;color:#fff}',
      '.sim-btn-primary:hover{background:#3B5BDB}',
      '.sim-btn-ghost{background:transparent;border:1px solid #E2E8F0;color:#64748B}',
      '.sim-btn-ghost:hover{background:#F0F2F5;border-color:#CBD5E1}',
      '.sim-btn-danger{background:transparent;border:none;color:#EF4444;font-size:12px;padding:4px 8px}',
      '.sim-btn-danger:hover{background:#FEF2F2;border-radius:4px}',
      '.sim-btn-success{background:#22C55E;color:#fff}',
      '.sim-btn-success:hover{background:#16A34A}',
      '.sim-btn-sm{padding:5px 10px;font-size:12px}',

      /* Badges */
      '.sim-badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600}',
      '.sim-badge-equipo{background:#FEF2F2;color:#DC2626}',
      '.sim-badge-demanda{background:#FFF7ED;color:#C2410C}',
      '.sim-badge-balance{background:#F0FDF4;color:#15803D}',
      '.sim-badge-green{background:#F0FDF4;color:#15803D}',
      '.sim-badge-blue{background:#EDF2FF;color:#4C6EF5}',

      /* Toggle */
      '.sim-toggle{position:relative;width:38px;height:20px;display:inline-block;flex-shrink:0}',
      '.sim-toggle input{opacity:0;width:0;height:0}',
      '.sim-toggle .slider{position:absolute;inset:0;background:#CBD5E1;border-radius:20px;cursor:pointer;transition:all .2s}',
      '.sim-toggle .slider::before{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:all .2s}',
      '.sim-toggle input:checked+.slider{background:#22C55E}',
      '.sim-toggle input:checked+.slider::before{transform:translateX(18px)}',

      /* Bar chart */
      '.sim-chart{display:flex;align-items:flex-end;gap:6px;height:160px;padding:10px 0;margin:16px 0}',
      '.sim-chart-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}',
      '.sim-chart-bar{width:100%;border-radius:4px 4px 0 0;min-height:2px;transition:height .3s}',
      '.sim-chart-label{font-size:10px;color:#94A3B8;text-align:center}',
      '.sim-chart-val{font-size:10px;color:#1E293B;font-weight:600;text-align:center}',
      '.sim-stacked-bar{width:100%;display:flex;flex-direction:column-reverse;gap:1px}',

      /* SVG Chart (projection) */
      '.sim-svg-chart{width:100%;height:200px;margin:16px 0}',

      /* Field label */
      '.sim-field{margin-bottom:10px}',
      '.sim-field label{display:block;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px}',

      /* Modal */
      '.sim-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}',
      '.sim-modal{background:#fff;border:1px solid #E2E8F0;border-radius:12px;width:100%;max-width:560px;overflow:hidden;box-shadow:0 20px 25px rgba(0,0,0,.1)}',
      '.sim-modal-header{padding:16px 20px;border-bottom:1px solid #E2E8F0;font-weight:600;color:#1E293B;display:flex;justify-content:space-between;align-items:center}',
      '.sim-modal-body{padding:20px;max-height:70vh;overflow-y:auto}',
      '.sim-modal-footer{padding:12px 20px;border-top:1px solid #E2E8F0;display:flex;gap:8px;justify-content:flex-end}',

      /* Section title */
      '.sim-section{margin:24px 0 12px;font-size:14px;font-weight:600;color:#1E293B}',

      /* P&L specific */
      '.sim-pl-selectors{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}',
      '.sim-pl-selectors label{font-size:12px;color:#64748B;font-weight:500}',

      /* Capacity gauge */
      '.sim-cap-gauge{display:flex;align-items:flex-end;gap:6px;margin:16px 0}',
      '.sim-cap-bar-wrap{flex:1;text-align:center}',
      '.sim-cap-bar{height:24px;border-radius:4px;margin:0 auto;position:relative;min-width:4px}',
      '.sim-cap-bar-label{font-size:10px;color:#1E293B;font-weight:600;margin-bottom:2px}',
      '.sim-cap-bar-month{font-size:10px;color:#94A3B8;margin-top:4px}',

      /* Alert */
      '.sim-alert{padding:12px 16px;border-radius:8px;margin-bottom:12px;font-size:13px;display:flex;align-items:center;gap:8px}',
      '.sim-alert-warning{background:#FFFBEB;border:1px solid #FDE68A;color:#92400E}',
      '.sim-alert-icon{font-size:16px;flex-shrink:0}',

      /* Scenario card grid */
      '.sim-scenario-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:20px}',
      '.sim-scenario-card{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:8px}',
      '.sim-scenario-card .sc-name{font-size:14px;font-weight:600;color:#1E293B}',
      '.sim-scenario-card .sc-date{font-size:11px;color:#94A3B8}',
      '.sim-scenario-card .sc-metrics{display:flex;gap:16px;margin-top:4px}',
      '.sim-scenario-card .sc-metric{font-size:12px;color:#64748B}',
      '.sim-scenario-card .sc-metric span{display:block;font-size:16px;font-weight:700;color:#1E293B}',
      '.sim-scenario-card .sc-actions{display:flex;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid #E2E8F0}',

      /* Leads override mini table */
      '.sim-leads-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:8px}',
      '.sim-leads-grid .lg-header{font-size:9px;color:#94A3B8;text-align:center;font-weight:600}',

      /* Responsive */
      '@media(max-width:768px){',
      '  .sim-kpi-strip{grid-template-columns:repeat(2,1fr);padding:12px 16px}',
      '  .sim-container{padding:0 16px 24px}',
      '  .sim-card-grid{grid-template-columns:1fr}',
      '  .sim-leads-grid{grid-template-columns:repeat(6,1fr)}',
      '}'
    ].join('\n');
    container.appendChild(style);
  }

  /* ── API Helpers ── */
  function api(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(path, opts).then(function(r) {
      if (!r.ok) throw new Error('API Error ' + r.status);
      return r.json();
    });
  }
  function apiFireAndForget(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    fetch(path, opts).catch(function() {});
  }

  /* ── Simulation Debounce ── */
  function runSimulation() {
    if (simTimer) cancelAnimationFrame(simTimer);
    simTimer = requestAnimationFrame(function() {
      simTimer = null;
      var scrollTop = container ? container.scrollTop || (container.parentElement && container.parentElement.scrollTop) || 0 : 0;
      api('POST', '/api/simulador/simular', {}).then(function(data) {
        state.simulation = data;
        renderContent();
        if (container && container.parentElement) container.parentElement.scrollTop = scrollTop;
      }).catch(function() {
        if (window.__toast) window.__toast('Error al simular', 'error');
      });
    });
  }
  function runSimulationDebounced() {
    if (editTimer) clearTimeout(editTimer);
    editTimer = setTimeout(function() {
      runSimulation();
    }, 300);
  }

  /* ── Render Shell ── */
  function renderShell() {
    container.innerHTML = '';
    injectStyles();
    container.innerHTML += [
      '<div id="sim-kpis"></div>',
      '<div class="sim-container">',
      '  <div class="sim-tabs" id="sim-tabs"></div>',
      '  <div id="sim-content"></div>',
      '</div>',
      '<div id="sim-modal-root"></div>'
    ].join('');
    renderTabs();
  }

  function renderTabs() {
    var tabs = [
      { key: 'config', label: 'Configuracion' },
      { key: 'marketing', label: 'Marketing' },
      { key: 'equipo', label: 'Equipo de Ventas' },
      { key: 'pipeline', label: 'Pipeline de Clientes' },
      { key: 'proyeccion', label: 'Proyeccion Integrada' }
    ];
    var el = container.querySelector('#sim-tabs');
    if (!el) return;
    el.innerHTML = tabs.map(function(t) {
      return '<button class="sim-tab' + (t.key === activeTab ? ' active' : '') + '" onclick="window.__simTab(\'' + t.key + '\')">' + t.label + '</button>';
    }).join('');
  }

  /* ── KPI Bar ── */
  function renderKPIs() {
    var el = container.querySelector('#sim-kpis');
    if (!el) return;
    var sim = state.simulation;
    if (!sim || !sim.kpis) {
      el.innerHTML = '<div class="sim-kpi-strip"><div style="color:#94A3B8;font-size:13px">Cargando simulacion...</div></div>';
      return;
    }
    var k = sim.kpis;
    el.innerHTML = [
      '<div class="sim-kpi-strip">',
      kpiCard('Ingreso Anual', fmt(k.ingreso_anual), '', 'green', '#22C55E'),
      kpiCard('Costo Equipo', fmt(k.costo_equipo_anual), '', '', '#EF4444'),
      kpiCard('Utilidad Bruta', fmt(k.utilidad_bruta), '', k.utilidad_bruta >= 0 ? 'green' : '', '#4C6EF5'),
      kpiCard('Margen', fmtPct(k.margen_pct), '', k.margen_pct >= 0.2 ? 'green' : '', '#F59E0B'),
      kpiCard('Leads Anuales', fmtNum(k.total_leads_anual), '', 'blue', '#3B82F6'),
      kpiCard('CAC', fmt(k.cac), '', '', '#7C3AED'),
      '</div>'
    ].join('');
  }

  function kpiCard(label, value, sub, valClass, accentColor) {
    return [
      '<div class="sim-kpi">',
      '<div class="accent-top" style="background:' + (accentColor || '#4C6EF5') + '"></div>',
      '<div class="kl">' + label + '</div>',
      '<div class="kv ' + (valClass || '') + '">' + value + '</div>',
      sub ? '<div class="ks">' + sub + '</div>' : '',
      '</div>'
    ].join('');
  }

  /* ── Main Content Router ── */
  function renderContent() {
    renderKPIs();
    var el = container.querySelector('#sim-content');
    if (!el) return;
    if (!state.simulation) {
      el.innerHTML = '<div style="text-align:center;padding:60px;color:#94A3B8">Cargando simulacion...</div>';
      return;
    }
    switch (activeTab) {
      case 'config': renderConfig(el); break;
      case 'marketing': renderMarketing(el); break;
      case 'equipo': renderEquipo(el); break;
      case 'pipeline': renderPipeline(el); break;
      case 'proyeccion': renderProyeccion(el); break;
    }
  }

  /* ══════════════════════════════════════════════
     TAB 0: CONFIGURACION
     ══════════════════════════════════════════════ */
  function renderConfig(el) {
    var html = '';

    // ── Section A: Account Types ──
    html += '<div class="sim-section">Tipos de Cuenta</div>';
    html += '<div class="sim-card-grid">';
    var tipos = state.tipos_cliente || [];
    tipos.forEach(function(tc) {
      html += '<div class="sim-card">';
      html += '<h4>' + escHtml(tc.nombre) + ' <span class="sim-badge sim-badge-blue">' + escHtml(tc.codigo) + '</span></h4>';
      html += cfgField(tc.id, 'ticket_promedio', 'Ticket Promedio ($)', tc.ticket_promedio, 'money');
      html += cfgField(tc.id, 'frecuencia_compra_meses', 'Frecuencia de Compra (meses)', tc.frecuencia_compra_meses, 'int');
      html += cfgField(tc.id, 'deals_por_anio', 'Deals por Año', tc.deals_por_anio, 'int');
      html += cfgField(tc.id, 'tasa_cierre', 'Tasa de Cierre', tc.tasa_cierre, 'pct');
      html += cfgField(tc.id, 'tasa_retencion', 'Tasa de Retencion', tc.tasa_retencion, 'pct');
      html += cfgField(tc.id, 'meses_cierre', 'Meses para Cerrar', tc.meses_cierre, 'int');
      html += cfgField(tc.id, 'horas_cotizacion', 'Horas Cotizacion (por trato)', tc.horas_cotizacion, 'hours');
      html += cfgField(tc.id, 'horas_seguimiento', 'Horas Seguimiento (por trato)', tc.horas_seguimiento, 'hours');
      html += cfgField(tc.id, 'clientes_iniciales', 'Clientes Iniciales', tc.clientes_iniciales, 'int');
      html += cfgField(tc.id, 'dias_credito', 'Dias de Credito', tc.dias_credito, 'int');
      html += cfgField(tc.id, 'facturas_por_cliente', 'Facturas/Mes/Cliente', tc.facturas_por_cliente, 'float');
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="margin-bottom:16px"><button class="sim-btn sim-btn-ghost" onclick="window.__simAddTipoCliente()">+ Agregar Tipo de Cuenta</button></div>';

    // ── Section B: Advisor Type Defaults ──
    html += '<div class="sim-section">Tipos de Asesor</div>';
    var comisiones = getConfigVal('comisiones') || {};
    var cuotas = getConfigVal('cuotas_default') || {};
    var maduracion = getConfigVal('maduracion') || {};
    var tiposAsesor = ['rookie', 'junior', 'senior'];
    var tipoLabels = { rookie: 'Rookie', junior: 'Junior', senior: 'Senior' };
    var tipoColors = { rookie: '#F59E0B', junior: '#4C6EF5', senior: '#22C55E' };

    html += '<div class="sim-card-grid">';
    tiposAsesor.forEach(function(tipo) {
      var com = comisiones[tipo] || {};
      html += '<div class="sim-card">';
      html += '<h4><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + tipoColors[tipo] + ';margin-right:6px"></span>' + tipoLabels[tipo] + '</h4>';
      html += cfgComField(tipo, 'cuota', 'Cuota Mensual ($)', cuotas[tipo] || 0, 'money');
      html += cfgComField(tipo, 'sueldo', 'Sueldo ($)', com.sueldo || 0, 'money');
      html += cfgComField(tipo, 'base_pct', 'Comision Base', com.base_pct || 0, 'pct');
      html += cfgComField(tipo, 'accel_pct', 'Acelerador', com.accel_pct || 0, 'pct');
      html += cfgComField(tipo, 'overhead', 'Overhead ($)', com.overhead || 0, 'money');
      html += '</div>';
    });
    html += '</div>';

    // Maturation config
    html += '<div class="sim-card" style="margin-bottom:16px">';
    html += '<h4>Maduracion</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">';
    html += '<div class="sim-field"><label>Rookie → Junior (meses) <span title="Meses que tarda un Rookie en madurar a Junior. Afecta la proyeccion de cuando alcanza mayor productividad." style="cursor:help;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#E2E8F0;color:#64748B;font-size:10px;font-weight:700;font-style:italic;font-family:serif;vertical-align:middle;line-height:1">i</span></label><input class="sim-input" type="number" min="1" value="' + (maduracion.rookie_to_junior_meses || 12) + '" onchange="window.__simCfgMaduracion(\'rookie_to_junior_meses\',this.value)"></div>';
    html += '<div class="sim-field"><label>Junior → Senior (meses) <span title="Meses adicionales que tarda un Junior en madurar a Senior. Se suma al tiempo de Rookie para calcular el total." style="cursor:help;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#E2E8F0;color:#64748B;font-size:10px;font-weight:700;font-style:italic;font-family:serif;vertical-align:middle;line-height:1">i</span></label><input class="sim-input" type="number" min="1" value="' + (maduracion.junior_to_senior_meses || 24) + '" onchange="window.__simCfgMaduracion(\'junior_to_senior_meses\',this.value)"></div>';
    html += '</div></div>';

    // ── Section C: Global Parameters ──
    html += '<div class="sim-section">Parametros Globales</div>';
    var margen = getConfigVal('margen_bruto');
    var friccion = getConfigVal('factor_friccion');
    var diasLab = getConfigVal('dias_laborables_mes');
    var factorMant = getConfigVal('factor_mantenimiento');

    html += '<div class="sim-card" style="margin-bottom:16px">';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">';
    html += '<div class="sim-field"><label>Margen Bruto <span title="Margen de utilidad sobre ventas. 28% = de cada $100 vendidos, $28 son utilidad bruta. Afecta comisiones y utilidad proyectada." style="cursor:help;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#E2E8F0;color:#64748B;font-size:10px;font-weight:700;font-style:italic;font-family:serif;vertical-align:middle;line-height:1">i</span></label><div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(margen != null ? margen : 0.28) + '" onchange="window.__simCfgGlobal(\'margen_bruto\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
    html += '<div class="sim-field"><label>Factor de Friccion <span title="Ajuste de realidad: del 100% teorico, que % se concreta. 85% = pierdes 15% por ineficiencias, tratos perdidos, tiempos muertos" style="cursor:help;color:#94A3B8">&#9432;</span></label><div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(friccion != null ? friccion : 0.85) + '" onchange="window.__simCfgGlobal(\'factor_friccion\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
    html += '<div class="sim-field"><label>Dias Laborables/Mes <span title="Dias productivos al mes. Se multiplica por hrs/dia de cada asesor para calcular las horas disponibles del equipo." style="cursor:help;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#E2E8F0;color:#64748B;font-size:10px;font-weight:700;font-style:italic;font-family:serif;vertical-align:middle;line-height:1">i</span></label><input class="sim-input sim-input-sm" type="number" min="1" max="31" value="' + (diasLab || 22) + '" onchange="window.__simCfgGlobal(\'dias_laborables_mes\',parseInt(this.value))"></div>';
    html += '<div class="sim-field"><label>Factor Mantenimiento <span title="% del tiempo de seguimiento que se dedica a cuentas que NO estan comprando este mes (mantenimiento de relacion)" style="cursor:help;color:#94A3B8">&#9432;</span></label><div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(factorMant != null ? factorMant : 0.3) + '" onchange="window.__simCfgGlobal(\'factor_mantenimiento\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
    html += '</div></div>';

    // Seasonality
    var seasonality = getConfigVal('seasonality') || {};
    html += '<div class="sim-card" style="margin-bottom:16px">';
    html += '<h4>Estacionalidad (multiplicadores mensuales) <span title="Factor que ajusta las ventas por temporalidad. 1.0 = mes promedio, mayor a 1 = temporada alta, menor a 1 = temporada baja. Se aplica a la venta de cada asesor y al ingreso del pipeline." style="cursor:help;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#E2E8F0;color:#64748B;font-size:10px;font-weight:700;font-style:italic;font-family:serif;vertical-align:middle;line-height:1">i</span></h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px">';
    MESES.forEach(function(m) {
      html += '<div class="sim-field"><label>' + m + '</label><input class="sim-input sim-input-sm" type="number" step="0.01" min="0" value="' + (seasonality[m] != null ? seasonality[m] : 1) + '" onchange="window.__simCfgSeasonality(\'' + m + '\',this.value)"></div>';
    });
    html += '</div></div>';

    el.innerHTML = html;
  }

  // ── Tooltips informativos por campo ──
  var FIELD_TIPS = {
    ticket_promedio: 'Valor promedio de cada trato/factura de este tipo de cuenta. Afecta directamente el ingreso proyectado.',
    frecuencia_compra_meses: 'Cada cuantos meses compra este tipo de cuenta. Ej: 6 = compra 2 veces al ano. Afecta la distribucion de ingresos mes a mes.',
    deals_por_anio: 'Cantidad de tratos/proyectos que genera este tipo de cuenta al ano.',
    tasa_cierre: 'De cada 100 leads, que % se convierte en cliente. Afecta cuantos clientes nuevos entran al pipeline.',
    tasa_retencion: 'Que % de clientes activos se mantiene de un mes a otro. 80% = pierdes 20% de clientes cada mes.',
    meses_cierre: 'Cuantos meses tarda desde que llega el lead hasta que cierra como cliente. Afecta el desfase entre marketing y ventas.',
    horas_cotizacion: 'Horas que invierte un asesor en cotizar un trato de este tipo. Afecta la capacidad disponible del equipo.',
    horas_seguimiento: 'Horas de seguimiento por trato. Se aplica completo si esta comprando, o parcial (segun factor mantenimiento) si no.',
    clientes_iniciales: 'Con cuantos clientes activos de este tipo arranca la simulacion en Enero.',
    dias_credito: 'Dias que tarda el cliente en pagar. Afecta el flujo de efectivo (cashflow), no el ingreso.',
    facturas_por_cliente: 'Promedio de facturas que genera cada cliente activo por mes. Multiplicado por ticket promedio da el ingreso.',
    cuota: 'Meta de venta mensual para este tipo de asesor. Se multiplica por madurez y estacionalidad para proyectar la venta real.',
    sueldo: 'Sueldo fijo mensual. Se suma a comisiones y overhead para calcular el costo total del asesor.',
    base_pct: 'Comision base sobre la utilidad generada. Ej: 6.5% de la utilidad bruta de sus ventas.',
    accel_pct: 'Comision adicional sobre utilidad que exceda la meta. Incentivo por rebasar el objetivo.',
    overhead: 'Costos fijos por asesor: CRM, telefonia, correo, celular, etc. Se suma al costo mensual.'
  };

  function tipIcon(field) {
    var tip = FIELD_TIPS[field];
    if (!tip) return '';
    return ' <span title="' + tip + '" style="cursor:help;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#E2E8F0;color:#64748B;font-size:10px;font-weight:700;font-style:italic;font-family:serif;vertical-align:middle;line-height:1">i</span>';
  }

  // ── Config helper: render a field for tipo_cliente ──
  function cfgField(tipoId, field, label, value, type) {
    var inputAttrs = 'class="sim-input sim-input-sm" ';
    var displayVal = value != null ? value : 0;
    var handler = 'window.__simPatchTipo(' + tipoId + ',\'' + field + '\',' + (type === 'pct' ? 'pctParse(this.value)' : 'this.value') + ')';
    var lbl = label + tipIcon(field);

    if (type === 'pct') {
      displayVal = pctDisplay(value || 0);
      return '<div class="sim-field"><label>' + lbl + '</label><div style="display:flex;align-items:center;gap:4px"><input ' + inputAttrs + 'type="number" step="1" min="0" max="100" value="' + displayVal + '" onchange="' + handler + '"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
    }
    if (type === 'money') {
      return '<div class="sim-field"><label>' + lbl + '</label><div style="display:flex;align-items:center;gap:4px"><span style="font-size:12px;color:#94A3B8;font-weight:600">$</span><input ' + inputAttrs + 'type="text" inputmode="numeric" value="' + fmtNumRaw(Math.round(displayVal)) + '" onfocus="this.value=this.value.replace(/,/g,\'\')" onblur="this.value=window.__fmtNumRaw(this.value.replace(/,/g,\'\'))" onchange="' + handler.replace('this.value', 'this.value.replace(/,/g,\'\')') + '"></div></div>';
    }
    if (type === 'int') {
      return '<div class="sim-field"><label>' + lbl + '</label><input ' + inputAttrs + 'type="number" step="1" min="0" value="' + Math.round(displayVal) + '" onchange="' + handler + '"></div>';
    }
    if (type === 'hours') {
      return '<div class="sim-field"><label>' + lbl + '</label><div style="display:flex;align-items:center;gap:4px"><input ' + inputAttrs + 'type="number" step="0.5" min="0" value="' + displayVal + '" onchange="' + handler + '"><span style="font-size:12px;color:#94A3B8">hrs</span></div></div>';
    }
    // float
    return '<div class="sim-field"><label>' + lbl + '</label><input ' + inputAttrs + 'type="number" step="0.1" min="0" value="' + displayVal + '" onchange="' + handler + '"></div>';
  }

  // ── Config helper: render a field for comisiones/cuotas config ──
  function cfgComField(tipo, field, label, value, type) {
    var inputAttrs = 'class="sim-input sim-input-sm" ';
    var displayVal = value != null ? value : 0;
    var lbl = label + tipIcon(field);

    if (type === 'pct') {
      displayVal = pctDisplay(value || 0);
      return '<div class="sim-field"><label>' + lbl + '</label><div style="display:flex;align-items:center;gap:4px"><input ' + inputAttrs + 'type="number" step="1" min="0" max="100" value="' + displayVal + '" onchange="window.__simCfgComision(\'' + tipo + '\',\'' + field + '\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
    }
    if (field === 'cuota' || type === 'money') {
      var onchangeHandler = field === 'cuota'
        ? 'window.__simCfgCuota(\'' + tipo + '\',this.value.replace(/,/g,\'\'))'
        : 'window.__simCfgComision(\'' + tipo + '\',\'' + field + '\',parseFloat(this.value.replace(/,/g,\'\')))';
      return '<div class="sim-field"><label>' + lbl + '</label><div style="display:flex;align-items:center;gap:4px"><span style="font-size:12px;color:#94A3B8;font-weight:600">$</span><input ' + inputAttrs + 'type="text" inputmode="numeric" value="' + fmtNumRaw(Math.round(displayVal)) + '" onfocus="this.value=this.value.replace(/,/g,\'\')" onblur="this.value=window.__fmtNumRaw(this.value.replace(/,/g,\'\'))" onchange="' + onchangeHandler + '"></div></div>';
    }
    return '<div class="sim-field"><label>' + lbl + '</label><input ' + inputAttrs + 'type="number" value="' + Math.round(displayVal) + '" onchange="window.__simCfgComision(\'' + tipo + '\',\'' + field + '\',parseFloat(this.value))"></div>';
  }

  // ── Percentage helpers (display as 65, store as 0.65) ──
  function pctDisplay(v) { return Math.round((v || 0) * 100); }
  function pctParse(v) { return parseFloat(v) / 100; }
  // Make pctParse available in inline handlers
  window.pctParse = pctParse;

  // ── Config value getter (from state.config array) ──
  function getConfigVal(clave) {
    var configs = state.config;
    if (Array.isArray(configs)) {
      var entry = configs.find(function(c) { return c.clave === clave; });
      return entry ? entry.valor : null;
    }
    return configs[clave] || null;
  }

  /* ══════════════════════════════════════════════
     TAB 1: MARKETING
     ══════════════════════════════════════════════ */
  function renderMarketing(el) {
    var sim = state.simulation;
    var mkt = sim.marketing;
    var cfg = mkt.config || {};
    var canales = cfg.canales || {};
    var tipos = state.tipos_cliente || [];

    var html = '';

    // ── Section 1: Lead Objectives (THE PRIMARY INPUT) ──
    html += '<div class="sim-section">Objetivos de Leads por Tipo de Cuenta</div>';
    html += '<div class="sim-card" style="margin-bottom:16px">';
    html += '<p style="font-size:12px;color:#64748B;margin-bottom:12px">Define cuantos leads calificados mensuales buscas por cada tipo de cuenta. Estos alimentan directamente el pipeline de ventas.</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">';
    var totalLeads = 0;
    tipos.forEach(function(tc) {
      var leads = tc.leads_objetivo || 0;
      totalLeads += leads;
      html += '<div>';
      html += '<div style="font-size:12px;font-weight:600;color:#1E293B;margin-bottom:4px">' + escHtml(tc.nombre) + ' <span class="sim-badge sim-badge-blue">' + escHtml(tc.codigo) + '</span></div>';
      html += '<input class="sim-input" type="number" min="0" value="' + leads + '" style="width:100%" onchange="window.__simPatchTipo(' + tc.id + ',\'leads_objetivo\',parseInt(this.value))">';
      html += '<div style="font-size:11px;color:#94A3B8;margin-top:4px">leads/mes</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E2E8F0;display:flex;gap:24px">';
    html += '<div><span style="font-size:11px;color:#94A3B8">Total Leads/Mes</span><div style="font-size:20px;font-weight:700;color:#4C6EF5">' + fmtNum(totalLeads) + '</div></div>';
    html += '<div><span style="font-size:11px;color:#94A3B8">Total Leads/Año</span><div style="font-size:20px;font-weight:700;color:#4C6EF5">' + fmtNum(totalLeads * 12) + '</div></div>';
    html += '</div>';
    html += '</div>';

    // ── Section 2: Conversion Funnel (calculated, read-only) ──
    html += '<div class="sim-section">Embudo de Conversion (estimado)</div>';
    html += '<div class="sim-panel"><div class="sim-table-wrap"><table>';
    html += '<thead><tr><th>Tipo</th><th>Leads/Mes</th><th>Tasa Cierre</th><th>Nuevos Clientes/Mes</th><th>Ticket Promedio</th><th>Ingreso Potencial/Mes</th></tr></thead>';
    html += '<tbody>';
    var totalIngPotencial = 0;
    tipos.forEach(function(tc) {
      var leads = tc.leads_objetivo || 0;
      var nuevos = leads * (tc.tasa_cierre || 0.5);
      var ingPot = nuevos * (tc.ticket_promedio || 0);
      totalIngPotencial += ingPot;
      html += '<tr>';
      html += '<td style="font-weight:500">' + escHtml(tc.nombre) + '</td>';
      html += '<td>' + fmtNum(leads) + '</td>';
      html += '<td>' + pctDisplay(tc.tasa_cierre || 0) + '%</td>';
      html += '<td style="font-weight:600">' + nuevos.toFixed(1) + '</td>';
      html += '<td>' + fmt(tc.ticket_promedio || 0) + '</td>';
      html += '<td style="color:#22C55E;font-weight:600">' + fmt(ingPot) + '</td>';
      html += '</tr>';
    });
    html += '</tbody>';
    html += '<tfoot><tr><td colspan="4"></td><td>Total Potencial/Mes</td><td style="font-weight:700;color:#22C55E">' + fmt(totalIngPotencial) + '</td></tr></tfoot>';
    html += '</table></div></div>';

    // ── Section 3: Marketing Config (reference, secondary) ──
    html += '<div class="sim-section">Configuracion de Canales (referencia)</div>';
    html += '<div class="sim-card-grid">';
    html += '<div class="sim-card"><div class="sim-field"><label>Presupuesto Mensual MKT</label>' +
      '<input class="sim-input" type="number" value="' + (cfg.presupuesto_mensual || 0) + '" onchange="window.__simMktConfig(\'presupuesto_mensual\',parseFloat(this.value))"></div></div>';
    html += '<div class="sim-card"><div class="sim-field"><label>Tasa Calificacion MQL-SQL</label>' +
      '<div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(cfg.tasa_calificacion || 0) + '" onchange="window.__simMktConfig(\'tasa_calificacion\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div></div>';
    html += '</div>';

    // Channels table
    html += '<div class="sim-panel" style="margin-bottom:16px"><div class="sim-table-wrap"><table>';
    html += '<thead><tr><th>Canal</th><th>Presupuesto (%)</th><th>CPL</th><th>Leads/Mes (estimado)</th></tr></thead>';
    html += '<tbody>';
    var canalKeys = Object.keys(canales);
    canalKeys.forEach(function(key) {
      var c = canales[key];
      var leadsPerMonth = cfg.presupuesto_mensual > 0 && c.cpl > 0 ? Math.round(cfg.presupuesto_mensual * c.pct / c.cpl) : 0;
      html += '<tr>';
      html += '<td style="font-weight:500">' + key + '</td>';
      html += '<td><div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(c.pct || 0) + '" onchange="window.__simMktCanal(\'' + key + '\',\'pct\',pctParse(this.value))"><span style="font-size:11px;color:#94A3B8">%</span></div></td>';
      html += '<td><input class="sim-input sim-input-sm" type="number" value="' + (c.cpl || 0) + '" onchange="window.__simMktCanal(\'' + key + '\',\'cpl\',parseFloat(this.value))"></td>';
      html += '<td>' + fmtNum(leadsPerMonth) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    // KPI cards
    html += '<div class="sim-card-row">';
    html += '<div class="sim-card"><div class="kl">Total Leads Objetivo/Mes</div><div class="kv blue">' + fmtNum(totalLeads) + '</div></div>';
    html += '<div class="sim-card"><div class="kl">Ingreso Potencial/Mes</div><div class="kv green">' + fmt(totalIngPotencial) + '</div></div>';
    html += '<div class="sim-card"><div class="kl">Ingreso Potencial/Año</div><div class="kv green">' + fmt(totalIngPotencial * 12) + '</div></div>';
    html += '<div class="sim-card"><div class="kl">Inversion MKT Anual</div><div class="kv">' + fmt(mkt.inversion_anual) + '</div></div>';
    html += '</div>';

    // 12-month leads chart
    html += '<div class="sim-section">Leads Calificados por Mes</div>';
    html += renderBarChart(mkt.leads_por_mes.map(function(m) { return m.leads_calificados || 0; }), '#4C6EF5');

    el.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     TAB 2: EQUIPO DE VENTAS
     ══════════════════════════════════════════════ */
  function renderEquipo(el) {
    var sim = state.simulation;
    var eq = sim.equipo;

    var html = '<div class="sim-section">Asesores de Venta</div>';
    html += '<div style="margin-bottom:12px"><button class="sim-btn sim-btn-primary" onclick="window.__simAddAsesor()">+ Agregar Asesor</button></div>';
    html += '<div class="sim-panel"><div class="sim-table-wrap"><table>';
    html += '<thead><tr><th>Activo</th><th>Nombre</th><th>Tipo</th><th>Fecha Inicio</th><th>Cuota ($)</th><th>Madurez (%)</th><th>Hrs/Dia</th><th>Costo Mensual</th><th>Proyeccion Anual</th><th></th></tr></thead>';
    html += '<tbody>';

    var asesores = eq.por_asesor || [];
    var tipos = state.tipos_cliente || [];
    asesores.forEach(function(a) {
      var asesorState = state.asesores.find(function(x) { return x.id === a.id; }) || {};
      var activo = asesorState.activo !== false;
      html += '<tr' + (!activo ? ' style="opacity:.5"' : '') + '>';
      html += '<td><label class="sim-toggle"><input type="checkbox"' + (activo ? ' checked' : '') + ' onchange="window.__simToggleAsesor(' + a.id + ',this.checked)"><span class="slider"></span></label></td>';
      html += '<td><input class="sim-input" style="text-align:left;width:130px" value="' + escHtml(a.nombre) + '" onchange="window.__simPatchAsesor(' + a.id + ',\'nombre\',this.value)"></td>';
      html += '<td><select class="sim-select" onchange="window.__simPatchAsesor(' + a.id + ',\'tipo\',this.value)">' +
        '<option value="rookie"' + (a.tipo === 'rookie' ? ' selected' : '') + '>Rookie</option>' +
        '<option value="junior"' + (a.tipo === 'junior' ? ' selected' : '') + '>Junior</option>' +
        '<option value="senior"' + (a.tipo === 'senior' ? ' selected' : '') + '>Senior</option>' +
        '</select></td>';
      html += '<td><input class="sim-input sim-input-sm" type="date" value="' + (a.fecha_inicio || asesorState.fecha_inicio || '') + '" onchange="window.__simPatchAsesor(' + a.id + ',\'fecha_inicio\',this.value)"></td>';
      html += '<td><input class="sim-input sim-input-sm" type="number" value="' + (a.cuota_mensual || a.cuota || 0) + '" onchange="window.__simPatchAsesor(' + a.id + ',\'cuota_mensual\',this.value)"></td>';
      html += '<td><input class="sim-input sim-input-xs" type="number" min="0" max="100" value="' + (a.madurez_pct != null ? a.madurez_pct : (a.madurez || 0)) + '" onchange="window.__simPatchAsesor(' + a.id + ',\'madurez_pct\',this.value)"></td>';
      html += '<td><input class="sim-input sim-input-xs" type="number" step="0.5" min="1" max="12" value="' + (a.horas_habiles_dia || asesorState.horas_habiles_dia || 6) + '" onchange="window.__simPatchAsesor(' + a.id + ',\'horas_habiles_dia\',this.value)"></td>';
      var costoMensual = a.costo_meses ? Math.round(a.costo_meses.reduce(function(s, v) { return s + v; }, 0) / 12) : 0;
      html += '<td>' + fmt(costoMensual) + '</td>';
      html += '<td style="font-weight:600">' + fmt(a.total) + '</td>';
      html += '<td><button class="sim-btn-danger" onclick="window.__simDeleteAsesor(' + a.id + ')">Eliminar</button></td>';
      html += '</tr>';

      // ── Maturation Timeline ──
      var tl = a.maturation_timeline || [];
      if (tl.length && a.tipo !== 'senior') {
        var juniorDate = null, seniorDate = null;
        tl.forEach(function(t) {
          if (t.transicion === 'rookie_to_junior' && !juniorDate) juniorDate = t.mes;
          if (t.transicion === 'junior_to_senior' && !seniorDate) seniorDate = t.mes;
        });
        html += '<tr style="background:#F8FAFC"><td colspan="10" style="padding:6px 12px">';
        html += '<div style="display:flex;align-items:center;gap:8px;font-size:11px">';
        html += '<span style="color:#94A3B8">Proyeccion:</span>';
        var tipoColors = { rookie: '#F59E0B', junior: '#4C6EF5', senior: '#22C55E' };
        if (a.tipo === 'rookie') {
          html += '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:9999px;font-weight:600">Rookie</span>';
          if (juniorDate) html += '<span style="color:#94A3B8">→</span><span style="background:#EDF2FF;color:#4C6EF5;padding:2px 8px;border-radius:9999px;font-weight:600">Junior ' + juniorDate + '</span>';
          if (seniorDate) html += '<span style="color:#94A3B8">→</span><span style="background:#F0FDF4;color:#15803D;padding:2px 8px;border-radius:9999px;font-weight:600">Senior ' + seniorDate + '</span>';
        } else if (a.tipo === 'junior') {
          html += '<span style="background:#EDF2FF;color:#4C6EF5;padding:2px 8px;border-radius:9999px;font-weight:600">Junior</span>';
          if (seniorDate) html += '<span style="color:#94A3B8">→</span><span style="background:#F0FDF4;color:#15803D;padding:2px 8px;border-radius:9999px;font-weight:600">Senior ' + seniorDate + '</span>';
        }
        html += '</div></td></tr>';
      }

      // ── Portfolio per advisor ──
      var cartera = a.cartera_actual || asesorState.cartera_actual || {};
      html += '<tr style="background:#FAFBFC"><td colspan="10" style="padding:6px 12px">';
      html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
      html += '<span style="font-size:11px;color:#94A3B8;font-weight:600">Cartera actual:</span>';
      tipos.forEach(function(tc) {
        var count = cartera[tc.codigo] || 0;
        html += '<div style="display:flex;align-items:center;gap:4px;font-size:11px"><span style="color:#64748B">' + tc.codigo + '</span>';
        html += '<input class="sim-input sim-input-xs" type="number" min="0" value="' + count + '" onchange="window.__simPatchCartera(' + a.id + ',\'' + tc.codigo + '\',this.value)">';
        html += '</div>';
      });
      var totalCartera = Object.values(cartera).reduce(function(s, v) { return s + (v || 0); }, 0);
      html += '<span style="font-size:11px;color:#94A3B8">Total: <strong>' + totalCartera + '</strong></span>';
      html += '</div></td></tr>';
    });

    html += '</tbody>';
    html += '<tfoot><tr><td colspan="7">TOTAL</td><td>' + fmt(eq.costo_anual ? eq.costo_anual / 12 : 0) + '/mes</td><td style="font-weight:700">' + fmt(eq.total_anual || 0) + '</td><td></td></tr></tfoot>';
    html += '</table></div></div>';

    // 12-month capacity chart (stacked by advisor)
    html += '<div class="sim-section">Capacidad Mensual por Asesor</div>';
    html += renderStackedBarChart(asesores, '#4C6EF5');

    // ── NEW FEATURE A: Capacity Planning ──
    var capacidad = sim.capacidad || [];
    if (capacidad.length) {
      html += '<div class="sim-section">Capacidad del Equipo</div>';

      // Hiring alerts
      var alerts = capacidad.filter(function(c) { return c.deficit > 0; });
      if (alerts.length) {
        alerts.forEach(function(c) {
          html += '<div class="sim-alert sim-alert-warning"><span class="sim-alert-icon">&#9888;</span> Se necesitan <strong>' + c.deficit + '</strong> asesores adicionales en <strong>' + c.mes + '</strong> (utilizacion: ' + fmtPctRaw(c.utilizacion_pct) + ')</div>';
        });
      }

      // Capacity gauge bars
      html += '<div class="sim-cap-gauge">';
      capacidad.forEach(function(c) {
        var pct = c.utilizacion_pct || 0;
        var color = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#22C55E';
        var barH = Math.max(8, Math.round(pct * 0.8));
        html += '<div class="sim-cap-bar-wrap">';
        html += '<div class="sim-cap-bar-label">' + fmtPctRaw(pct) + '</div>';
        html += '<div class="sim-cap-bar" style="height:' + barH + 'px;background:' + color + '"></div>';
        html += '<div class="sim-cap-bar-month">' + c.mes + '</div>';
        html += '</div>';
      });
      html += '</div>';

      // Capacity detail table (hours-based)
      html += '<div class="sim-panel"><div class="sim-panel-header"><span>Detalle de Capacidad por Horas</span></div>';
      html += '<div class="sim-table-wrap"><table>';
      html += '<thead><tr><th>Mes</th><th>Hrs Disponibles</th><th>Hrs Ocupadas</th><th>Hrs Restantes</th><th>Utilizacion</th><th>Nuevos Tratos Posibles</th><th>Asesores Necesarios</th><th>Deficit</th></tr></thead>';
      html += '<tbody>';
      capacidad.forEach(function(c) {
        var pct = c.utilizacion_pct || 0;
        var color = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#22C55E';
        html += '<tr>';
        html += '<td style="font-weight:500">' + c.mes + '</td>';
        html += '<td>' + fmtNum(c.horas_disponibles || 0) + '</td>';
        html += '<td>' + fmtNum(c.horas_ocupadas || 0) + '</td>';
        html += '<td style="font-weight:600;color:#4C6EF5">' + fmtNum(c.horas_restantes || 0) + '</td>';
        html += '<td style="color:' + color + ';font-weight:600">' + fmtPctRaw(pct) + '</td>';
        html += '<td>' + fmtNum(c.nuevos_tratos_posibles || 0) + '</td>';
        html += '<td>' + fmtNum(c.asesores_necesarios) + '</td>';
        html += '<td style="color:' + (c.deficit > 0 ? '#EF4444' : '#22C55E') + ';font-weight:600">' + (c.deficit > 0 ? '+' + c.deficit : '0') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div></div>';
    }

    el.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     TAB 3: PIPELINE DE CLIENTES
     ══════════════════════════════════════════════ */
  function renderPipeline(el) {
    var sim = state.simulation;
    var pip = sim.pipeline;

    var html = '<div class="sim-section">Tipos de Cliente</div>';
    html += '<div class="sim-card-grid">';

    var tipos = pip.por_tipo || [];
    tipos.forEach(function(t) {
      var tc = state.tipos_cliente.find(function(x) { return x.codigo === t.codigo; }) || {};
      var totalClientes = t.activos ? t.activos[t.activos.length - 1] || 0 : 0;

      html += '<div class="sim-card">';
      html += '<h4>' + escHtml(t.nombre) + ' <span class="sim-badge sim-badge-blue">' + t.codigo + '</span></h4>';
      html += '<div class="sim-field"><label>Tasa de Retencion</label><div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(tc.tasa_retencion || 0) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'tasa_retencion\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
      html += '<div class="sim-field"><label>Tasa de Cierre</label><div style="display:flex;align-items:center;gap:4px"><input class="sim-input sim-input-sm" type="number" step="1" min="0" max="100" value="' + pctDisplay(tc.tasa_cierre || 0) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'tasa_cierre\',pctParse(this.value))"><span style="font-size:12px;color:#94A3B8">%</span></div></div>';
      html += '<div class="sim-field"><label>Meses para Cerrar</label><input class="sim-input sim-input-sm" type="number" min="1" value="' + (tc.meses_cierre || 1) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'meses_cierre\',this.value)"></div>';
      html += '<div class="sim-field"><label>Ticket Promedio $</label><input class="sim-input" type="number" value="' + (tc.ticket_promedio || 0) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'ticket_promedio\',this.value)"></div>';
      // BUG FIX: use facturas_por_cliente instead of facturas_mes
      html += '<div class="sim-field"><label>Facturas/Mes/Cliente</label><input class="sim-input sim-input-sm" type="number" step="0.1" value="' + (tc.facturas_por_cliente != null ? tc.facturas_por_cliente : (tc.facturas_mes || 0)) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'facturas_por_cliente\',this.value)"></div>';

      // NEW FEATURE B: Client Payment Terms
      html += '<div class="sim-field"><label>Clientes Iniciales</label><input class="sim-input sim-input-sm" type="number" min="0" value="' + (tc.clientes_iniciales || 0) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'clientes_iniciales\',this.value)"></div>';
      html += '<div class="sim-field"><label>Dias de Credito</label><input class="sim-input sim-input-sm" type="number" min="0" value="' + (tc.dias_credito || 0) + '" onchange="window.__simPatchTipo(' + tc.id + ',\'dias_credito\',this.value)"></div>';

      html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E2E8F0">';
      html += '<div style="font-size:12px;color:#94A3B8;margin-bottom:4px">Clientes activos a Dic</div>';
      html += '<div style="font-size:20px;font-weight:700;color:#1E293B">' + fmtNum(totalClientes) + '</div>';
      html += '<div style="font-size:12px;color:#94A3B8;margin-top:4px">Ingreso anual</div>';
      html += '<div style="font-size:18px;font-weight:700;color:#22C55E">' + fmt(t.total) + '</div>';
      html += '</div>';

      // NEW FEATURE E: Monthly Leads Override toggle
      var overrideActive = !!state.leadsOverrideActive[tc.id];
      html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E2E8F0;display:flex;align-items:center;gap:8px">';
      html += '<label class="sim-toggle"><input type="checkbox"' + (overrideActive ? ' checked' : '') + ' onchange="window.__simToggleLeadsOverride(' + tc.id + ',this.checked)"><span class="slider"></span></label>';
      html += '<span style="font-size:12px;color:#64748B">Ajustar leads por mes</span>';
      html += '</div>';

      if (overrideActive) {
        var overrideVals = state.leadsOverride[tc.id] || [];
        var baseLeads = tc.leads_mensuales || 0;
        html += '<div class="sim-leads-grid" style="margin-top:8px">';
        MESES.forEach(function(m) {
          html += '<div class="lg-header">' + m + '</div>';
        });
        MESES.forEach(function(m, i) {
          var val = overrideVals[i] != null ? overrideVals[i] : baseLeads;
          html += '<input class="sim-input sim-input-xs" type="number" min="0" value="' + val + '" onchange="window.__simSetLeadMonth(' + tc.id + ',' + i + ',this.value)">';
        });
        html += '</div>';
      }

      html += '</div>';
    });
    html += '</div>';

    // 12-month demand chart (stacked by type)
    html += '<div class="sim-section">Demanda Mensual por Tipo de Cliente</div>';
    html += renderDemandChart(tipos);

    el.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     TAB 4: PROYECCION INTEGRADA
     ══════════════════════════════════════════════ */
  function renderProyeccion(el) {
    var sim = state.simulation;
    var proy = sim.proyeccion || [];

    var html = '';

    // Projection table
    html += '<div class="sim-section">Proyeccion Mensual</div>';
    html += '<div class="sim-panel"><div class="sim-table-wrap"><table>';
    html += '<thead><tr><th>Mes</th><th>Cap. Equipo</th><th>Demanda Pipeline</th><th>Proyeccion Real</th><th>Cuello Botella</th><th>Costo Equipo</th><th>Utilidad</th></tr></thead>';
    html += '<tbody>';

    var totCap = 0, totDem = 0, totProy = 0, totCost = 0, totUtil = 0;
    proy.forEach(function(p) {
      var badgeClass = p.cuello_botella === 'EQUIPO' ? 'sim-badge-equipo' : p.cuello_botella === 'DEMANDA' ? 'sim-badge-demanda' : 'sim-badge-balance';
      html += '<tr>';
      html += '<td style="font-weight:500">' + p.mes + '</td>';
      html += '<td>' + fmt(p.capacidad_equipo) + '</td>';
      html += '<td>' + fmt(p.demanda_pipeline) + '</td>';
      html += '<td style="font-weight:600">' + fmt(p.proyeccion) + '</td>';
      html += '<td><span class="sim-badge ' + badgeClass + '">' + p.cuello_botella + '</span></td>';
      html += '<td>' + fmt(p.costo_equipo) + '</td>';
      html += '<td style="color:' + (p.utilidad_bruta >= 0 ? '#22C55E' : '#EF4444') + ';font-weight:600">' + fmt(p.utilidad_bruta) + '</td>';
      html += '</tr>';
      totCap += p.capacidad_equipo || 0;
      totDem += p.demanda_pipeline || 0;
      totProy += p.proyeccion || 0;
      totCost += p.costo_equipo || 0;
      totUtil += p.utilidad_bruta || 0;
    });

    html += '</tbody>';
    html += '<tfoot><tr><td>TOTAL</td><td>' + fmt(totCap) + '</td><td>' + fmt(totDem) + '</td><td>' + fmt(totProy) + '</td><td></td><td>' + fmt(totCost) + '</td><td>' + fmt(totUtil) + '</td></tr></tfoot>';
    html += '</table></div></div>';

    // SVG chart: Capacidad vs Demanda vs Proyeccion
    html += '<div class="sim-section">Capacidad vs Demanda vs Proyeccion</div>';
    html += renderProjectionChart(proy);

    // ── NEW FEATURE C: Cashflow Section ──
    var cashflow = sim.cashflow || [];
    if (cashflow.length) {
      html += '<div class="sim-section">Flujo de Efectivo (Cashflow)</div>';
      html += '<div class="sim-panel"><div class="sim-table-wrap"><table>';
      html += '<thead><tr><th>Mes</th><th>Cobros</th><th>Egresos Equipo</th><th>Flujo Neto</th></tr></thead>';
      html += '<tbody>';
      var totCobros = 0, totEgresos = 0, totFlujo = 0;
      cashflow.forEach(function(c) {
        var flujoColor = (c.flujo_neto || 0) >= 0 ? '#22C55E' : '#EF4444';
        html += '<tr>';
        html += '<td style="font-weight:500">' + c.mes + '</td>';
        html += '<td>' + fmt(c.cobros) + '</td>';
        html += '<td>' + fmt(c.egresos_equipo) + '</td>';
        html += '<td style="color:' + flujoColor + ';font-weight:600">' + fmt(c.flujo_neto) + '</td>';
        html += '</tr>';
        totCobros += c.cobros || 0;
        totEgresos += c.egresos_equipo || 0;
        totFlujo += c.flujo_neto || 0;
      });
      html += '</tbody>';
      html += '<tfoot><tr><td>TOTAL</td><td>' + fmt(totCobros) + '</td><td>' + fmt(totEgresos) + '</td><td style="color:' + (totFlujo >= 0 ? '#22C55E' : '#EF4444') + '">' + fmt(totFlujo) + '</td></tr></tfoot>';
      html += '</table></div></div>';
    }

    // Scenario actions
    html += '<div class="sim-section">Escenarios</div>';
    html += '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">';
    html += '<button class="sim-btn sim-btn-success" onclick="window.__simSaveScenario()">Guardar Escenario de Ingresos</button>';
    html += '</div>';

    // ── NEW FEATURE D: Revenue Scenarios Cards ──
    if (state.revenueScenarios.length > 0) {
      html += '<div class="sim-scenario-grid">';
      state.revenueScenarios.forEach(function(s) {
        var dateStr = s.fecha_creacion || s.created_at || '';
        if (dateStr) {
          try { dateStr = new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); } catch(e) { /* keep raw */ }
        }
        html += '<div class="sim-scenario-card">';
        html += '<div class="sc-name">' + escHtml(s.nombre) + '</div>';
        if (dateStr) html += '<div class="sc-date">' + escHtml(dateStr) + '</div>';
        if (s.descripcion) html += '<div style="font-size:12px;color:#64748B">' + escHtml(s.descripcion) + '</div>';
        html += '<div class="sc-metrics">';
        if (s.ingreso_anual != null) html += '<div class="sc-metric">Ingreso<span>' + fmt(s.ingreso_anual) + '</span></div>';
        if (s.utilidad != null) html += '<div class="sc-metric">Utilidad<span>' + fmt(s.utilidad) + '</span></div>';
        html += '</div>';
        html += '<div class="sc-actions">';
        html += '<button class="sim-btn sim-btn-ghost sim-btn-sm" onclick="window.__simViewScenario(' + s.id + ')">Ver Detalle</button>';
        html += '<button class="sim-btn-danger" onclick="window.__simDeleteRevScenario(' + s.id + ')">Eliminar</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Scenario selectors for P&L
    html += '<div class="sim-section">Estado de Resultados (P&L)</div>';
    html += '<div class="sim-pl-selectors">';
    html += '<div><label>Escenario de Ingresos</label><br><select class="sim-select" id="sim-rev-select" onchange="window.__simSelectRev(this.value)">';
    html += '<option value="">-- Seleccionar --</option>';
    state.revenueScenarios.forEach(function(s) {
      html += '<option value="' + s.id + '"' + (state.selectedRevId == s.id ? ' selected' : '') + '>' + escHtml(s.nombre) + '</option>';
    });
    html += '</select></div>';
    html += '<div><label>Escenario de Gastos</label><br><select class="sim-select" id="sim-exp-select" onchange="window.__simSelectExp(this.value)">';
    html += '<option value="">-- Seleccionar --</option>';
    state.expenseScenarios.forEach(function(s) {
      html += '<option value="' + s.id + '"' + (state.selectedExpId == s.id ? ' selected' : '') + '>' + escHtml(s.nombre) + '</option>';
    });
    html += '</select></div>';
    html += '</div>';

    // P&L table
    if (state.plData) {
      html += renderPL(state.plData);
    }

    el.innerHTML = html;
  }

  /* ── P&L Table ── */
  function renderPL(pl) {
    // BUG FIX: backend returns pl_mensual, not meses or proyeccion
    var meses = pl.pl_mensual || pl.meses || pl.proyeccion || [];
    if (!meses.length) return '<div style="color:#94A3B8;padding:20px;text-align:center">No hay datos P&L disponibles.</div>';

    var html = '<div class="sim-panel"><div class="sim-table-wrap"><table>';
    html += '<thead><tr><th>Mes</th><th>Ingreso</th><th>Costo Ventas</th><th>Utilidad Bruta</th><th>Costo Equipo</th><th>Gastos Op</th><th>Utilidad Op</th><th>Margen %</th></tr></thead>';
    html += '<tbody>';

    meses.forEach(function(m) {
      var ingreso = m.ingreso || 0;
      var costoVentas = m.costo_ventas || 0;
      var utilBruta = m.utilidad_bruta || 0;
      var costoEquipo = m.costo_equipo || 0;
      var gastosOp = m.gastos_operativos || 0;
      var utilOp = m.utilidad_operativa || 0;
      var margen = ingreso > 0 ? (utilOp / ingreso) : 0;

      html += '<tr>';
      html += '<td style="font-weight:500">' + (m.mes || '') + '</td>';
      html += '<td>' + fmt(ingreso) + '</td>';
      html += '<td>' + fmt(costoVentas) + '</td>';
      html += '<td>' + fmt(utilBruta) + '</td>';
      html += '<td>' + fmt(costoEquipo) + '</td>';
      html += '<td>' + fmt(gastosOp) + '</td>';
      html += '<td style="color:' + (utilOp >= 0 ? '#22C55E' : '#EF4444') + ';font-weight:600">' + fmt(utilOp) + '</td>';
      html += '<td>' + fmtPct(margen) + '</td>';
      html += '</tr>';
    });

    html += '</tbody>';

    // BUG FIX: show data.totales for annual summary row
    var tot = pl.totales || {};
    var totIng = tot.ingreso || 0;
    var totCV = tot.costo_ventas || 0;
    var totUB = tot.utilidad_bruta || 0;
    var totCE = tot.costo_equipo || 0;
    var totGO = tot.gastos_operativos || 0;
    var totUO = tot.utilidad_operativa || 0;

    // Fallback: if totales is empty, compute from rows
    if (!tot.ingreso && meses.length) {
      meses.forEach(function(m) {
        totIng += m.ingreso || 0;
        totCV += m.costo_ventas || 0;
        totUB += m.utilidad_bruta || 0;
        totCE += m.costo_equipo || 0;
        totGO += m.gastos_operativos || 0;
        totUO += m.utilidad_operativa || 0;
      });
    }
    var totMargen = totIng > 0 ? totUO / totIng : 0;
    html += '<tfoot><tr><td>TOTAL</td><td>' + fmt(totIng) + '</td><td>' + fmt(totCV) + '</td><td>' + fmt(totUB) + '</td><td>' + fmt(totCE) + '</td><td>' + fmt(totGO) + '</td><td style="color:' + (totUO >= 0 ? '#22C55E' : '#EF4444') + '">' + fmt(totUO) + '</td><td>' + fmtPct(totMargen) + '</td></tr></tfoot>';
    html += '</table></div></div>';

    // Show scenario names if available
    var meta = '';
    if (pl.escenario_ingreso) meta += '<span style="font-size:12px;color:#64748B">Ingreso: <strong>' + escHtml(pl.escenario_ingreso) + '</strong></span> ';
    if (pl.escenario_gasto) meta += '<span style="font-size:12px;color:#64748B">Gasto: <strong>' + escHtml(pl.escenario_gasto) + '</strong></span>';
    if (meta) html = '<div style="margin-bottom:8px">' + meta + '</div>' + html;

    return html;
  }

  /* ══════════════════════════════════════════════
     CHARTS (CSS-based)
     ══════════════════════════════════════════════ */

  function renderBarChart(values, color) {
    var max = Math.max.apply(null, values.concat([1]));
    var html = '<div class="sim-chart">';
    values.forEach(function(v, i) {
      var h = Math.round((v / max) * 140);
      html += '<div class="sim-chart-bar-wrap">';
      html += '<div class="sim-chart-val">' + fmtNum(v) + '</div>';
      html += '<div class="sim-chart-bar" style="height:' + h + 'px;background:' + color + '"></div>';
      html += '<div class="sim-chart-label">' + MESES[i] + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderStackedBarChart(asesores, baseColor) {
    var colors = ['#4C6EF5', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#3B82F6', '#EC4899', '#14B8A6'];
    var monthlyTotals = [];
    for (var m = 0; m < 12; m++) {
      var total = 0;
      asesores.forEach(function(a) { total += (a.meses && a.meses[m]) || 0; });
      monthlyTotals.push(total);
    }
    var max = Math.max.apply(null, monthlyTotals.concat([1]));

    var html = '<div class="sim-chart">';
    for (var m = 0; m < 12; m++) {
      html += '<div class="sim-chart-bar-wrap">';
      html += '<div class="sim-chart-val">' + fmt(monthlyTotals[m]) + '</div>';
      html += '<div class="sim-stacked-bar" style="height:140px">';
      asesores.forEach(function(a, idx) {
        var v = (a.meses && a.meses[m]) || 0;
        var h = max > 0 ? Math.round((v / max) * 140) : 0;
        html += '<div style="height:' + h + 'px;background:' + colors[idx % colors.length] + ';border-radius:2px;min-height:' + (v > 0 ? '2' : '0') + 'px" title="' + escHtml(a.nombre) + ': ' + fmt(v) + '"></div>';
      });
      html += '</div>';
      html += '<div class="sim-chart-label">' + MESES[m] + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Legend
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">';
    asesores.forEach(function(a, idx) {
      html += '<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748B"><div style="width:10px;height:10px;border-radius:2px;background:' + colors[idx % colors.length] + '"></div>' + escHtml(a.nombre) + '</div>';
    });
    html += '</div>';

    return html;
  }

  function renderDemandChart(tipos) {
    var colors = ['#4C6EF5', '#22C55E', '#F59E0B', '#EF4444'];
    var monthlyTotals = [];
    for (var m = 0; m < 12; m++) {
      var total = 0;
      tipos.forEach(function(t) { total += (t.ingresos && t.ingresos[m]) || 0; });
      monthlyTotals.push(total);
    }
    var max = Math.max.apply(null, monthlyTotals.concat([1]));

    var html = '<div class="sim-chart">';
    for (var m = 0; m < 12; m++) {
      html += '<div class="sim-chart-bar-wrap">';
      html += '<div class="sim-chart-val">' + fmt(monthlyTotals[m]) + '</div>';
      html += '<div class="sim-stacked-bar" style="height:140px">';
      tipos.forEach(function(t, idx) {
        var v = (t.ingresos && t.ingresos[m]) || 0;
        var h = max > 0 ? Math.round((v / max) * 140) : 0;
        html += '<div style="height:' + h + 'px;background:' + colors[idx % colors.length] + ';border-radius:2px;min-height:' + (v > 0 ? '2' : '0') + 'px" title="' + escHtml(t.nombre) + ': ' + fmt(v) + '"></div>';
      });
      html += '</div>';
      html += '<div class="sim-chart-label">' + MESES[m] + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Legend
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">';
    tipos.forEach(function(t, idx) {
      html += '<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748B"><div style="width:10px;height:10px;border-radius:2px;background:' + colors[idx % colors.length] + '"></div>' + escHtml(t.nombre) + '</div>';
    });
    html += '</div>';

    return html;
  }

  function renderProjectionChart(proy) {
    if (!proy.length) return '';
    var maxVal = 1;
    proy.forEach(function(p) {
      maxVal = Math.max(maxVal, p.capacidad_equipo || 0, p.demanda_pipeline || 0, p.proyeccion || 0);
    });

    var W = 800, H = 200, PAD = 40;
    var plotW = W - PAD * 2, plotH = H - PAD * 2;
    var stepX = plotW / 11;

    function y(v) { return PAD + plotH - (v / maxVal * plotH); }
    function x(i) { return PAD + i * stepX; }

    var capPoints = [], demPoints = [], projPoints = [], projAreaPoints = [];
    proy.forEach(function(p, i) {
      capPoints.push(x(i) + ',' + y(p.capacidad_equipo || 0));
      demPoints.push(x(i) + ',' + y(p.demanda_pipeline || 0));
      projPoints.push(x(i) + ',' + y(p.proyeccion || 0));
      projAreaPoints.push(x(i) + ',' + y(p.proyeccion || 0));
    });
    projAreaPoints.push(x(11) + ',' + (PAD + plotH));
    projAreaPoints.push(x(0) + ',' + (PAD + plotH));

    var svg = '<svg class="sim-svg-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';

    // Grid lines
    for (var g = 0; g <= 4; g++) {
      var gy = PAD + plotH * g / 4;
      var gv = maxVal * (4 - g) / 4;
      svg += '<line x1="' + PAD + '" y1="' + gy + '" x2="' + (W - PAD) + '" y2="' + gy + '" stroke="#E2E8F0" stroke-width="1"/>';
      svg += '<text x="' + (PAD - 4) + '" y="' + (gy + 3) + '" text-anchor="end" font-size="9" fill="#94A3B8">' + fmt(gv) + '</text>';
    }

    // X labels
    proy.forEach(function(p, i) {
      svg += '<text x="' + x(i) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9" fill="#94A3B8">' + p.mes + '</text>';
    });

    // Projection area fill
    svg += '<polygon points="' + projAreaPoints.join(' ') + '" fill="#4C6EF5" fill-opacity="0.1"/>';

    // Lines
    svg += '<polyline points="' + capPoints.join(' ') + '" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    svg += '<polyline points="' + demPoints.join(' ') + '" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    svg += '<polyline points="' + projPoints.join(' ') + '" fill="none" stroke="#4C6EF5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';

    // Dots
    proy.forEach(function(p, i) {
      svg += '<circle cx="' + x(i) + '" cy="' + y(p.capacidad_equipo || 0) + '" r="3" fill="#22C55E"/>';
      svg += '<circle cx="' + x(i) + '" cy="' + y(p.demanda_pipeline || 0) + '" r="3" fill="#F59E0B"/>';
      svg += '<circle cx="' + x(i) + '" cy="' + y(p.proyeccion || 0) + '" r="3" fill="#4C6EF5"/>';
    });

    svg += '</svg>';

    // Legend
    svg += '<div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;font-size:12px;color:#64748B">';
    svg += '<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:3px;background:#22C55E;border-radius:2px"></div>Capacidad Equipo</div>';
    svg += '<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:3px;background:#F59E0B;border-radius:2px"></div>Demanda Pipeline</div>';
    svg += '<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:3px;background:#4C6EF5;border-radius:2px"></div>Proyeccion Real</div>';
    svg += '</div>';

    return svg;
  }

  /* ── Util ── */
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Modal ── */
  function showModal(title, bodyHtml, onConfirm) {
    var root = container.querySelector('#sim-modal-root');
    root.innerHTML = [
      '<div class="sim-modal-overlay" id="sim-modal-overlay">',
      '  <div class="sim-modal">',
      '    <div class="sim-modal-header"><span>' + title + '</span><button style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.2rem" id="sim-modal-close">&times;</button></div>',
      '    <div class="sim-modal-body">' + bodyHtml + '</div>',
      '    <div class="sim-modal-footer">',
      '      <button class="sim-btn sim-btn-ghost" id="sim-modal-cancel">Cancelar</button>',
      '      <button class="sim-btn sim-btn-primary" id="sim-modal-confirm">Confirmar</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    var close = function() { root.innerHTML = ''; };
    root.querySelector('#sim-modal-close').addEventListener('click', close);
    root.querySelector('#sim-modal-cancel').addEventListener('click', close);
    root.querySelector('#sim-modal-confirm').addEventListener('click', function() {
      onConfirm();
      close();
    });
    root.querySelector('#sim-modal-overlay').addEventListener('click', function(e) {
      if (e.target === e.currentTarget) close();
    });
  }

  /* Show a read-only detail modal (no confirm button) */
  function showDetailModal(title, bodyHtml) {
    var root = container.querySelector('#sim-modal-root');
    root.innerHTML = [
      '<div class="sim-modal-overlay" id="sim-modal-overlay">',
      '  <div class="sim-modal" style="max-width:720px">',
      '    <div class="sim-modal-header"><span>' + title + '</span><button style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.2rem" id="sim-modal-close">&times;</button></div>',
      '    <div class="sim-modal-body">' + bodyHtml + '</div>',
      '    <div class="sim-modal-footer">',
      '      <button class="sim-btn sim-btn-ghost" id="sim-modal-cancel">Cerrar</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    var close = function() { root.innerHTML = ''; };
    root.querySelector('#sim-modal-close').addEventListener('click', close);
    root.querySelector('#sim-modal-cancel').addEventListener('click', close);
    root.querySelector('#sim-modal-overlay').addEventListener('click', function(e) {
      if (e.target === e.currentTarget) close();
    });
  }

  /* ══════════════════════════════════════════════
     GLOBAL HANDLERS (window.__)
     ══════════════════════════════════════════════ */

  window.__simTab = function(tab) {
    activeTab = tab;
    renderTabs();
    renderContent();
  };

  /* ── Marketing Config ── */
  window.__simMktConfig = function(key, val) {
    var cfg = state.simulation.marketing.config || {};
    cfg[key] = typeof val === 'number' ? val : parseFloat(val);
    apiFireAndForget('PUT', '/api/simulador/config/marketing', { valor: cfg });
    runSimulationDebounced();
  };

  window.__simMktDist = function(key, val) {
    var cfg = state.simulation.marketing.config || {};
    if (!cfg.distribucion_calidad) cfg.distribucion_calidad = {};
    cfg.distribucion_calidad[key] = typeof val === 'number' ? val : parseFloat(val);
    apiFireAndForget('PUT', '/api/simulador/config/marketing', { valor: cfg });
    runSimulationDebounced();
  };

  window.__simMktCanal = function(canal, field, val) {
    var cfg = state.simulation.marketing.config || {};
    if (!cfg.canales) cfg.canales = {};
    if (!cfg.canales[canal]) cfg.canales[canal] = {};
    cfg.canales[canal][field] = typeof val === 'number' ? val : parseFloat(val);
    apiFireAndForget('PUT', '/api/simulador/config/marketing', { valor: cfg });
    runSimulationDebounced();
  };

  /* ── Configuration Tab Handlers ── */
  window.__simCfgComision = function(tipo, field, val) {
    var configs = Array.isArray(state.config) ? state.config : [];
    var entry = configs.find(function(c) { return c.clave === 'comisiones'; });
    var comisiones = entry ? Object.assign({}, entry.valor) : {};
    if (!comisiones[tipo]) comisiones[tipo] = {};
    comisiones[tipo] = Object.assign({}, comisiones[tipo]);
    comisiones[tipo][field] = val;
    if (entry) entry.valor = comisiones;
    apiFireAndForget('PUT', '/api/simulador/config/comisiones', { valor: comisiones });
    runSimulationDebounced();
  };

  window.__simCfgCuota = function(tipo, val) {
    var configs = Array.isArray(state.config) ? state.config : [];
    var entry = configs.find(function(c) { return c.clave === 'cuotas_default'; });
    var cuotas = entry ? Object.assign({}, entry.valor) : {};
    cuotas[tipo] = parseFloat(val) || 0;
    if (entry) entry.valor = cuotas;
    apiFireAndForget('PUT', '/api/simulador/config/cuotas_default', { valor: cuotas });
    runSimulationDebounced();
  };

  window.__simCfgMaduracion = function(field, val) {
    var configs = Array.isArray(state.config) ? state.config : [];
    var entry = configs.find(function(c) { return c.clave === 'maduracion'; });
    var mad = entry ? Object.assign({}, entry.valor) : {};
    mad[field] = parseInt(val) || 12;
    if (entry) entry.valor = mad;
    apiFireAndForget('PUT', '/api/simulador/config/maduracion', { valor: mad });
    runSimulationDebounced();
  };

  window.__simCfgGlobal = function(clave, val) {
    var configs = Array.isArray(state.config) ? state.config : [];
    var entry = configs.find(function(c) { return c.clave === clave; });
    if (entry) entry.valor = val;
    apiFireAndForget('PUT', '/api/simulador/config/' + clave, { valor: val });
    runSimulationDebounced();
  };

  window.__simCfgSeasonality = function(mes, val) {
    var configs = Array.isArray(state.config) ? state.config : [];
    var entry = configs.find(function(c) { return c.clave === 'seasonality'; });
    var seas = entry ? Object.assign({}, entry.valor) : {};
    seas[mes] = parseFloat(val) || 1;
    if (entry) entry.valor = seas;
    apiFireAndForget('PUT', '/api/simulador/config/seasonality', { valor: seas });
    runSimulationDebounced();
  };

  window.__simAddTipoCliente = function() {
    showModal('Agregar Tipo de Cuenta', [
      '<div class="sim-field"><label>Codigo</label><input class="sim-input" style="width:100%;text-align:left" id="sim-new-tc-codigo" placeholder="Ej: C"></div>',
      '<div class="sim-field"><label>Nombre</label><input class="sim-input" style="width:100%;text-align:left" id="sim-new-tc-nombre" placeholder="Nombre descriptivo"></div>',
      '<div class="sim-field"><label>Ticket Promedio ($)</label><input class="sim-input" type="number" id="sim-new-tc-ticket" value="50000" style="width:100%"></div>',
      '<div class="sim-field"><label>Frecuencia de Compra (meses)</label><input class="sim-input" type="number" id="sim-new-tc-freq" value="3" min="1" style="width:100%"></div>'
    ].join(''), function() {
      var codigo = document.getElementById('sim-new-tc-codigo').value || 'X';
      var nombre = document.getElementById('sim-new-tc-nombre').value || 'Nuevo Tipo';
      var ticket = parseFloat(document.getElementById('sim-new-tc-ticket').value) || 50000;
      var freq = parseInt(document.getElementById('sim-new-tc-freq').value) || 3;
      api('POST', '/api/simulador/tipos-cliente/', {
        codigo: codigo, nombre: nombre, ticket_promedio: ticket, frecuencia_compra_meses: freq
      }).then(function(newTC) {
        state.tipos_cliente.push(newTC);
        if (window.__toast) window.__toast('Tipo de cuenta agregado', 'success');
        renderContent();
      }).catch(function() {
        if (window.__toast) window.__toast('Error al agregar tipo', 'error');
      });
    });
  };

  /* ── Equipo (Asesores) ── */
  window.__simToggleAsesor = function(id, checked) {
    var a = state.asesores.find(function(x) { return x.id === id; });
    if (a) a.activo = checked;
    apiFireAndForget('PATCH', '/api/simulador/asesores/' + id, { activo: checked });
    runSimulationDebounced();
  };

  window.__simPatchAsesor = function(id, field, val) {
    var data = {};
    if (field === 'nombre' || field === 'tipo') {
      data[field] = val;
    } else {
      data[field] = parseFloat(val);
    }
    var a = state.asesores.find(function(x) { return x.id === id; });
    if (a) a[field] = data[field];
    apiFireAndForget('PATCH', '/api/simulador/asesores/' + id, data);
    runSimulationDebounced();
  };

  window.__simAddAsesor = function() {
    showModal('Agregar Asesor', [
      '<div class="sim-field"><label>Nombre</label><input class="sim-input" style="width:100%;text-align:left" id="sim-new-nombre" placeholder="Nombre del asesor"></div>',
      '<div class="sim-field"><label>Tipo</label><select class="sim-select" id="sim-new-tipo" style="width:100%"><option value="rookie">Rookie</option><option value="junior">Junior</option><option value="senior">Senior</option></select></div>',
      '<div class="sim-field"><label>Cuota Mensual ($)</label><input class="sim-input" type="number" id="sim-new-cuota" value="1500000" style="width:100%"></div>',
      '<div class="sim-field"><label>Madurez (%)</label><input class="sim-input" type="number" id="sim-new-madurez" value="50" min="0" max="100" style="width:100%"></div>',
      '<div class="sim-field"><label>Max Tratos/Mes</label><input class="sim-input" type="number" id="sim-new-max-tratos" value="10" min="0" style="width:100%"></div>',
      '<div class="sim-field"><label>Max Cartera Activa</label><input class="sim-input" type="number" id="sim-new-max-cartera" value="40" min="0" style="width:100%"></div>'
    ].join(''), function() {
      var nombre = document.getElementById('sim-new-nombre').value || 'Nuevo Asesor';
      var tipo = document.getElementById('sim-new-tipo').value;
      // BUG FIX: send cuota_mensual and madurez_pct (not cuota and madurez)
      var cuota_mensual = parseFloat(document.getElementById('sim-new-cuota').value) || 1500000;
      var madurez_pct = parseFloat(document.getElementById('sim-new-madurez').value) || 50;
      var max_tratos_mes = parseFloat(document.getElementById('sim-new-max-tratos').value) || 10;
      var max_cartera_activa = parseFloat(document.getElementById('sim-new-max-cartera').value) || 40;
      api('POST', '/api/simulador/asesores/', {
        nombre: nombre,
        tipo: tipo,
        cuota_mensual: cuota_mensual,
        madurez_pct: madurez_pct,
        max_tratos_mes: max_tratos_mes,
        max_cartera_activa: max_cartera_activa
      }).then(function(newA) {
        state.asesores.push(newA);
        if (window.__toast) window.__toast('Asesor agregado', 'success');
        runSimulation();
      }).catch(function() {
        if (window.__toast) window.__toast('Error al agregar asesor', 'error');
      });
    });
  };

  window.__simDeleteAsesor = function(id) {
    showModal('Eliminar Asesor', '<p>Seguro que quieres eliminar este asesor? Esta accion no se puede deshacer.</p>', function() {
      api('DELETE', '/api/simulador/asesores/' + id, null).then(function() {
        state.asesores = state.asesores.filter(function(a) { return a.id !== id; });
        if (window.__toast) window.__toast('Asesor eliminado', 'success');
        runSimulation();
      }).catch(function() {
        if (window.__toast) window.__toast('Error al eliminar asesor', 'error');
      });
    });
  };

  /* ── Cartera (Portfolio per Advisor) ── */
  window.__simPatchCartera = function(id, tipoCodigo, val) {
    var a = state.asesores.find(function(x) { return x.id === id; });
    if (a) {
      if (!a.cartera_actual) a.cartera_actual = {};
      a.cartera_actual[tipoCodigo] = parseInt(val) || 0;
      apiFireAndForget('PATCH', '/api/simulador/asesores/' + id, { cartera_actual: a.cartera_actual });
      runSimulationDebounced();
    }
  };

  /* ── Pipeline (Tipos de Cliente) ── */
  window.__simPatchTipo = function(id, field, val) {
    var data = {};
    data[field] = typeof val === 'number' ? val : parseFloat(val);
    var t = state.tipos_cliente.find(function(x) { return x.id === id; });
    if (t) t[field] = data[field];
    apiFireAndForget('PATCH', '/api/simulador/tipos-cliente/' + id, data);
    runSimulationDebounced();
  };

  /* ── Monthly Leads Override (Feature E) ── */
  window.__simToggleLeadsOverride = function(id, checked) {
    state.leadsOverrideActive[id] = checked;
    if (checked) {
      var tc = state.tipos_cliente.find(function(x) { return x.id === id; });
      var base = (tc && tc.leads_mensuales) || 0;
      if (!state.leadsOverride[id]) {
        var arr = [];
        for (var i = 0; i < 12; i++) arr.push(base);
        state.leadsOverride[id] = arr;
      }
    }
    renderContent();
  };

  window.__simSetLeadMonth = function(tipoId, monthIdx, val) {
    if (!state.leadsOverride[tipoId]) {
      var tc = state.tipos_cliente.find(function(x) { return x.id === tipoId; });
      var base = (tc && tc.leads_mensuales) || 0;
      var arr = [];
      for (var i = 0; i < 12; i++) arr.push(base);
      state.leadsOverride[tipoId] = arr;
    }
    state.leadsOverride[tipoId][monthIdx] = parseInt(val) || 0;
    // Compute average and update leads_mensuales on the backend
    var sum = state.leadsOverride[tipoId].reduce(function(s, v) { return s + v; }, 0);
    var avg = Math.round(sum / 12);
    var tc = state.tipos_cliente.find(function(x) { return x.id === tipoId; });
    if (tc) tc.leads_mensuales = avg;
    apiFireAndForget('PATCH', '/api/simulador/tipos-cliente/' + tipoId, { leads_mensuales: avg });
    runSimulationDebounced();
  };

  /* ── Proyeccion: Scenarios ── */
  window.__simSaveScenario = function() {
    showModal('Guardar Escenario de Ingresos', [
      '<div class="sim-field"><label>Nombre</label><input class="sim-input" style="width:100%;text-align:left" id="sim-esc-nombre" placeholder="Nombre del escenario"></div>',
      '<div class="sim-field"><label>Descripcion</label><textarea class="sim-input" style="width:100%;text-align:left;height:60px;resize:vertical" id="sim-esc-desc" placeholder="Descripcion opcional"></textarea></div>'
    ].join(''), function() {
      var nombre = document.getElementById('sim-esc-nombre').value || 'Escenario';
      var descripcion = document.getElementById('sim-esc-desc').value || '';
      api('POST', '/api/simulador/escenarios/', { nombre: nombre, descripcion: descripcion }).then(function(saved) {
        state.revenueScenarios.push(saved);
        if (window.__toast) window.__toast('Escenario guardado', 'success');
        renderContent();
      }).catch(function() {
        if (window.__toast) window.__toast('Error al guardar escenario', 'error');
      });
    });
  };

  window.__simDeleteRevScenario = function(id) {
    showModal('Eliminar Escenario', '<p>Seguro que quieres eliminar este escenario de ingresos?</p>', function() {
      api('DELETE', '/api/simulador/escenarios/' + id, null).then(function() {
        state.revenueScenarios = state.revenueScenarios.filter(function(s) { return s.id !== id; });
        if (state.selectedRevId == id) { state.selectedRevId = null; state.plData = null; }
        if (window.__toast) window.__toast('Escenario eliminado', 'success');
        renderContent();
      }).catch(function() {
        if (window.__toast) window.__toast('Error al eliminar escenario', 'error');
      });
    });
  };

  // NEW FEATURE D: View scenario detail
  window.__simViewScenario = function(id) {
    api('GET', '/api/simulador/escenarios/' + id).then(function(data) {
      var body = '';
      body += '<div style="margin-bottom:12px"><strong>' + escHtml(data.nombre || '') + '</strong></div>';
      if (data.descripcion) body += '<div style="font-size:13px;color:#64748B;margin-bottom:12px">' + escHtml(data.descripcion) + '</div>';

      // Show snapshot data if available
      var snap = data.snapshot || data;
      if (snap.kpis) {
        var k = snap.kpis;
        body += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">';
        if (k.ingreso_anual != null) body += '<div class="sim-card" style="padding:10px"><div class="kl">Ingreso Anual</div><div style="font-size:16px;font-weight:700;color:#22C55E">' + fmt(k.ingreso_anual) + '</div></div>';
        if (k.costo_equipo_anual != null) body += '<div class="sim-card" style="padding:10px"><div class="kl">Costo Equipo</div><div style="font-size:16px;font-weight:700">' + fmt(k.costo_equipo_anual) + '</div></div>';
        if (k.utilidad_bruta != null) body += '<div class="sim-card" style="padding:10px"><div class="kl">Utilidad Bruta</div><div style="font-size:16px;font-weight:700;color:' + (k.utilidad_bruta >= 0 ? '#22C55E' : '#EF4444') + '">' + fmt(k.utilidad_bruta) + '</div></div>';
        if (k.margen_pct != null) body += '<div class="sim-card" style="padding:10px"><div class="kl">Margen</div><div style="font-size:16px;font-weight:700">' + fmtPct(k.margen_pct) + '</div></div>';
        if (k.total_leads_anual != null) body += '<div class="sim-card" style="padding:10px"><div class="kl">Leads Anuales</div><div style="font-size:16px;font-weight:700;color:#4C6EF5">' + fmtNum(k.total_leads_anual) + '</div></div>';
        if (k.cac != null) body += '<div class="sim-card" style="padding:10px"><div class="kl">CAC</div><div style="font-size:16px;font-weight:700">' + fmt(k.cac) + '</div></div>';
        body += '</div>';
      }

      // Show monthly projection if available
      var proy = snap.proyeccion || [];
      if (proy.length) {
        body += '<div style="font-size:13px;font-weight:600;margin-bottom:8px">Proyeccion Mensual</div>';
        body += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
        body += '<thead><tr style="background:#F8FAFC"><th style="padding:6px 8px;text-align:left;font-size:10px;color:#94A3B8">Mes</th><th style="padding:6px 8px;text-align:right;font-size:10px;color:#94A3B8">Proyeccion</th><th style="padding:6px 8px;text-align:right;font-size:10px;color:#94A3B8">Utilidad</th></tr></thead>';
        body += '<tbody>';
        proy.forEach(function(p) {
          body += '<tr><td style="padding:4px 8px;border-bottom:1px solid #E2E8F0">' + p.mes + '</td>';
          body += '<td style="padding:4px 8px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600">' + fmt(p.proyeccion) + '</td>';
          body += '<td style="padding:4px 8px;border-bottom:1px solid #E2E8F0;text-align:right;color:' + ((p.utilidad_bruta || 0) >= 0 ? '#22C55E' : '#EF4444') + '">' + fmt(p.utilidad_bruta) + '</td></tr>';
        });
        body += '</tbody></table>';
      }

      showDetailModal('Detalle del Escenario', body);
    }).catch(function() {
      if (window.__toast) window.__toast('Error al cargar detalle', 'error');
    });
  };

  window.__simSelectRev = function(val) {
    state.selectedRevId = val ? parseInt(val) : null;
    tryLoadPL();
  };

  window.__simSelectExp = function(val) {
    state.selectedExpId = val ? parseInt(val) : null;
    tryLoadPL();
  };

  function tryLoadPL() {
    if (state.selectedRevId && state.selectedExpId) {
      api('GET', '/api/simulador/pl/' + state.selectedRevId + '/' + state.selectedExpId).then(function(data) {
        state.plData = data;
        renderContent();
      }).catch(function() {
        if (window.__toast) window.__toast('Error al cargar P&L', 'error');
      });
    } else {
      state.plData = null;
      renderContent();
    }
  }

  /* ══════════════════════════════════════════════
     DATA LOADING
     ══════════════════════════════════════════════ */

  function loadBootstrap() {
    return api('GET', '/api/simulador/bootstrap').then(function(data) {
      state.asesores = data.asesores || [];
      state.config = data.config || {};
      state.tipos_cliente = data.tipos_cliente || [];
    });
  }

  function loadScenarios() {
    return Promise.all([
      api('GET', '/api/simulador/escenarios/').then(function(data) {
        state.revenueScenarios = data || [];
      }).catch(function() { state.revenueScenarios = []; }),
      api('GET', '/api/escenarios/').then(function(data) {
        state.expenseScenarios = data || [];
      }).catch(function() { state.expenseScenarios = []; })
    ]);
  }

  function loadData() {
    Promise.all([loadBootstrap(), loadScenarios()]).then(function() {
      return api('POST', '/api/simulador/simular', {});
    }).then(function(sim) {
      state.simulation = sim;
      renderContent();
    }).catch(function(err) {
      var el = container.querySelector('#sim-content');
      if (el) el.innerHTML = '<div style="text-align:center;padding:60px;color:#94A3B8">Error al cargar datos del simulador. Verifica que el API este disponible.</div>';
    });
  }

  /* ══════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════ */
  return {
    init: function(el) {
      container = el;
      state = {
        asesores: [],
        config: {},
        tipos_cliente: [],
        simulation: null,
        expenseScenarios: [],
        revenueScenarios: [],
        selectedRevId: null,
        selectedExpId: null,
        plData: null,
        leadsOverride: {},
        leadsOverrideActive: {}
      };
      activeTab = 'config';
      simTimer = null;
      editTimer = null;
      renderShell();
      loadData();
    },
    destroy: function() {
      if (simTimer) cancelAnimationFrame(simTimer);
      if (editTimer) clearTimeout(editTimer);
      delete window.__simTab;
      delete window.__simMktConfig;
      delete window.__simMktDist;
      delete window.__simMktCanal;
      delete window.__simToggleAsesor;
      delete window.__simPatchAsesor;
      delete window.__simAddAsesor;
      delete window.__simDeleteAsesor;
      delete window.__simPatchTipo;
      delete window.__simSaveScenario;
      delete window.__simDeleteRevScenario;
      delete window.__simSelectRev;
      delete window.__simSelectExp;
      delete window.__simViewScenario;
      delete window.__simToggleLeadsOverride;
      delete window.__simSetLeadMonth;
      delete window.__simPatchCartera;
      delete window.__simCfgComision;
      delete window.__simCfgCuota;
      delete window.__simCfgMaduracion;
      delete window.__simCfgGlobal;
      delete window.__simCfgSeasonality;
      delete window.__simAddTipoCliente;
      delete window.pctParse;
      delete window.__fmtNumRaw;
      container = null;
    }
  };
})();
