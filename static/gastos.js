/* ── Gastos Module ── */
window.GastosModule = (function() {
  var container = null;
  var state = { empleados: [], gastos_operativos: [], suscripciones: [], consultorias: [], financieros: [], categorias: [] };
  var activeTab = 'nomina';
  var searchTerm = '';
  var tipoCambioGlobal = 17.5;
  var categoryFilter = {};  // per-tab category filter: { nomina: null, operativos: null, ... }
  var baseScenario = null;

  var endpointMap = {
    empleados: 'empleados',
    gastos_operativos: 'operativos',
    suscripciones: 'suscripciones',
    consultorias: 'consultorias',
    financieros: 'financieros'
  };

  var categoryLabels = {
    empleados: 'Nomina',
    gastos_operativos: 'Operativos',
    suscripciones: 'Suscripciones',
    consultorias: 'Consultorias',
    financieros: 'Financieros'
  };

  // Map tab names to modulo names for categories
  var tabModuloMap = {
    nomina: 'nomina',
    operativos: 'operativos',
    suscripciones: 'suscripciones',
    consultorias: 'consultorias',
    financieros: 'financieros'
  };

  var tabCollectionMap = {
    nomina: 'empleados',
    operativos: 'gastos_operativos',
    suscripciones: 'suscripciones',
    consultorias: 'consultorias',
    financieros: 'financieros'
  };

  var tabEndpointMap = {
    nomina: 'empleados',
    operativos: 'operativos',
    suscripciones: 'suscripciones',
    consultorias: 'consultorias',
    financieros: 'financieros'
  };

  var fmt = function(n) { return '$' + Math.round(n).toLocaleString('es-MX'); };
  var fmtPct = function(n) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'; };

  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function patchItem(endpoint, id, data) {
    fetch('/api/gastos/' + endpoint + '/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function() {});
  }

  function apiPost(endpoint, data) {
    return fetch('/api/gastos/' + endpoint + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (!r.ok) throw new Error('Error ' + r.status);
      return r.json();
    });
  }

  function apiDelete(endpoint, id) {
    return fetch('/api/gastos/' + endpoint + '/' + id, {
      method: 'DELETE'
    }).then(function(r) {
      if (!r.ok) throw new Error('Error ' + r.status);
      return r.json();
    });
  }

  /* ── Category API helpers ── */
  function apiCategoryPost(data) {
    return fetch('/api/gastos/categorias/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) { if (!r.ok) throw new Error('Error'); return r.json(); });
  }

  function apiCategoryPatch(id, data) {
    return fetch('/api/gastos/categorias/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) { if (!r.ok) throw new Error('Error'); return r.json(); });
  }

  function apiCategoryDelete(id) {
    return fetch('/api/gastos/categorias/' + id, {
      method: 'DELETE'
    }).then(function(r) { if (!r.ok) throw new Error('Error'); return r.json(); });
  }

  /* ── Categories helpers ── */
  function getCategoriesForTab(tab) {
    var modulo = tabModuloMap[tab];
    return state.categorias.filter(function(c) { return c.modulo === modulo; });
  }

  function getCategoryById(id) {
    return state.categorias.find(function(c) { return c.id === id; }) || null;
  }

  /* ── Esquemas de pago (Nómina) ── */
  var esquemaLabels = {
    'nomina_gpp': 'Nómina GPP',
    'poder_global': 'Poder Global',
    'factura': 'Factura',
    'mixto': 'Mixto',
    'otra_razon': 'Otra Razón'
  };
  var esquemaBadgeClass = {
    'nomina_gpp': 'b-accent',
    'poder_global': 'b-purple',
    'factura': 'b-orange',
    'mixto': 'b-teal',
    'otra_razon': 'b-gray'
  };

  function calcCostoFromEsquema(e) {
    var sueldo = e.sueldo_neto || 0;
    var factor = e.factor_carga || 1.35;
    var comision = e.comision_pct || 0.04;
    var esquema = e.esquema || 'nomina_gpp';
    if (esquema === 'nomina_gpp') return Math.round(sueldo * factor);
    if (esquema === 'poder_global') return Math.round(sueldo * (1 + comision));
    if (esquema === 'factura') return Math.round(sueldo);
    if (esquema === 'mixto') {
      var imss = e.sueldo_imss || 0;
      var comp = e.sueldo_complemento || 0;
      return Math.round(imss * factor + comp * (1 + comision));
    }
    if (esquema === 'otra_razon') return Math.round(sueldo);
    return Math.round(sueldo);
  }

  function esquemaSelect(item) {
    var html = '<select class="g-inline-select" onchange="window.__gEsquemaChange(' + item.id + ',this.value)">';
    for (var key in esquemaLabels) {
      html += '<option value="' + key + '"' + (item.esquema === key ? ' selected' : '') + '>' + esquemaLabels[key] + '</option>';
    }
    html += '</select>';
    return html;
  }

  /* ── Suscripciones: costo MXN calculation ── */
  function calcCostoMXN(item) {
    var costo = item.costo || 0;
    if (item.moneda === 'USD') return costo * (item.tipo_cambio || tipoCambioGlobal);
    return costo;
  }

  /* ── KPIs ── */
  function calcKPIs() {
    var totalActual = 0, totalNew = 0, nomActual = 0, nomNew = 0;
    var catTotals = {};
    for (var key of ['empleados', 'gastos_operativos', 'suscripciones', 'consultorias', 'financieros']) {
      var catNew = 0;
      for (var item of state[key]) {
        var orig = item._originalCosto;
        var curr = key === 'suscripciones' ? calcCostoMXN(item) : item.costo;
        totalActual += orig;
        var itemNew = item.cortado ? 0 : curr;
        totalNew += itemNew;
        catNew += itemNew;
        if (key === 'empleados') {
          nomActual += orig;
          nomNew += item.cortado ? 0 : curr;
        }
      }
      catTotals[key] = catNew;
    }

    var ahorro = totalActual - totalNew;
    var pct = totalActual > 0 ? (ahorro / totalActual * 100) : 0;
    var goalPct = Math.min(100, ahorro / 200000 * 100);

    var el = function(id) { return container.querySelector('#' + id); };
    var set = function(id, val) { var e = el(id); if (e) e.textContent = val; };

    set('gk-total', fmt(totalActual));
    set('gk-new', fmt(totalNew));
    set('gk-save', fmt(ahorro));
    set('gk-save-pct', fmtPct(pct) + ' vs actual');
    set('gk-goal', goalPct.toFixed(1) + '%');
    var goalBar = el('gk-goal-bar');
    if (goalBar) goalBar.style.width = goalPct + '%';
    set('gk-nom-act', fmt(nomActual));
    set('gk-nom-new', fmt(nomNew));
    set('gk-nom-sub', 'Ahorro: ' + fmt(nomActual - nomNew));

    // Monthly budget cards
    set('gk-cat-empleados', fmt(catTotals.empleados) + '/mes');
    set('gk-cat-gastos_operativos', fmt(catTotals.gastos_operativos) + '/mes');
    set('gk-cat-suscripciones', fmt(catTotals.suscripciones) + '/mes');
    set('gk-cat-consultorias', fmt(catTotals.consultorias) + '/mes');
    set('gk-cat-financieros', fmt(catTotals.financieros) + '/mes');
  }

  /* ── Render ── */
  function renderShell() {
    container.innerHTML = `
      <style>
        .g-kpi-strip{max-width:1440px;margin:0 auto;padding:16px 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
        .g-kpi{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:14px 16px;position:relative;overflow:hidden;transition:border-color .2s;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
        .g-kpi:hover{border-color:#CBD5E1}
        .g-kpi .kl{font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .g-kpi .kv{font-size:24px;font-weight:700;color:#1E293B}
        .g-kpi .ks{font-size:12px;color:#64748B;margin-top:2px}
        .g-kpi .bar{height:6px;border-radius:3px;background:#F1F5F9;margin-top:8px;overflow:hidden}
        .g-kpi .bar-fill{height:100%;border-radius:3px;background:#4C6EF5;transition:width .4s ease}
        .g-kpi .accent-top{position:absolute;top:0;left:0;right:0;height:3px}
        .green-top{background:#22C55E}
        .red-top{background:#EF4444}
        .accent-top-main{background:#4C6EF5}
        .yellow-top{background:#F59E0B}
        .g-container{max-width:1440px;margin:0 auto;padding:0 24px 40px}
        .g-tabs{display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid #E2E8F0;flex-wrap:wrap}
        .g-tab{padding:10px 16px;border:none;background:transparent;color:#64748B;cursor:pointer;border-radius:0;font-size:13px;font-weight:500;transition:all .2s;font-family:inherit;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-2px}
        .g-tab.active{background:transparent;color:#4C6EF5;border-bottom:2px solid #4C6EF5;box-shadow:none}
        .g-tab:hover:not(.active){color:#1E293B}
        .g-search input{width:100%;max-width:360px;padding:10px 14px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
        .g-search input:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,0.1)}
        .g-search input::placeholder{color:#94A3B8}
        .g-panel{background:#FFFFFF;border-radius:8px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
        .g-table-wrap{overflow-x:auto;max-height:70vh;overflow-y:auto}
        .g-panel table{width:100%;border-collapse:collapse;font-size:13px}
        .g-panel th{background:#F8FAFC;padding:10px 12px;text-align:left;font-weight:600;color:#94A3B8;text-transform:uppercase;font-size:11px;letter-spacing:.5px;position:sticky;top:0;z-index:2}
        .g-panel td{padding:8px 12px;border-bottom:1px solid #E2E8F0;vertical-align:middle;color:#1E293B}
        .g-panel tr:hover td{background:#F8FAFC}
        .g-panel tfoot td{background:#F8FAFC;font-weight:700;border-top:2px solid #E2E8F0;position:sticky;bottom:0;z-index:1}
        .g-panel tr.cut td{background:#FEF2F2;text-decoration:line-through;color:#94A3B8}
        .g-panel tr.cut td:first-child{text-decoration:none}
        .g-panel tr.cut .g-badge{opacity:.5}
        .g-toggle{position:relative;width:38px;height:20px;display:inline-block;flex-shrink:0}
        .g-toggle input{opacity:0;width:0;height:0}
        .g-toggle .slider{position:absolute;inset:0;background:#CBD5E1;border:1px solid #CBD5E1;border-radius:20px;cursor:pointer;transition:all .2s}
        .g-toggle .slider::before{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#FFFFFF;transition:all .2s}
        .g-toggle input:checked+.slider{background:#EF4444;border-color:#EF4444}
        .g-toggle input:checked+.slider::before{transform:translateX(18px);background:#FFFFFF}
        .g-cost-input{width:110px;padding:6px 8px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:13px;font-family:inherit;text-align:right;outline:none;transition:border-color .2s,box-shadow .2s}
        .g-cost-input:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,0.1)}
        .g-cost-input.changed{border-color:#F59E0B;background:#FFFBEB;box-shadow:0 0 0 2px rgba(245,158,11,.15)}
        .g-badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;white-space:nowrap}
        .b-green{background:#F0FDF4;color:#15803D}
        .b-red{background:#FEF2F2;color:#DC2626}
        .b-orange{background:#FFF7ED;color:#C2410C}
        .b-yellow{background:#FFFBEB;color:#B45309}
        .b-gray{background:#F1F5F9;color:#64748B}
        .b-purple{background:#F3E8FF;color:#7C3AED}
        .b-teal{background:#E0F7FA;color:#0D9488}
        .b-orange{background:#FFF7ED;color:#C2410C}
        .b-purple{background:#F3E8FF;color:#7C3AED}
        .b-teal{background:#F0FDFA;color:#0D9488}
        .b-blue{background:#EFF6FF;color:#2563EB}
        .b-accent{background:#EDF2FF;color:#4C6EF5}
        .money-green{color:#22C55E}
        .money-red{color:#EF4444}
        .var-pos{color:#22C55E}
        .var-neg{color:#EF4444}
        .g-nota{max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#64748B;font-size:12px}
        .g-nota:hover{white-space:normal}
        .g-btn{padding:8px 16px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
        .g-btn-primary{background:#4C6EF5;color:#FFFFFF}
        .g-btn-primary:hover{background:#3B5BDB;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
        .g-btn-secondary{background:transparent;border:1px solid #E2E8F0;color:#64748B}
        .g-btn-secondary:hover{background:#F8FAFC}
        .g-btn-danger{background:transparent;border:none;color:#EF4444;font-size:12px;padding:4px 8px}
        .g-btn-danger:hover{background:#FEF2F2}
        .g-btn-save{background:#4C6EF5;color:#FFFFFF}
        .g-btn-save:hover{background:#3B5BDB;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
        .g-btn-base{background:#22C55E;color:#FFFFFF;margin-right:8px}
        .g-btn-base:hover{background:#16A34A;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
        .g-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
        .g-modal{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;width:100%;max-width:480px;overflow:hidden;box-shadow:0 20px 25px rgba(0,0,0,0.1),0 10px 10px rgba(0,0,0,0.04)}
        .g-modal-header{padding:20px 24px;border-bottom:1px solid #E2E8F0;font-weight:600;font-size:16px;display:flex;justify-content:space-between;align-items:center;color:#1E293B}
        .g-modal-body{padding:24px}
        .g-modal-footer{padding:16px 24px;border-top:1px solid #E2E8F0;display:flex;gap:8px;justify-content:flex-end}
        .g-field{margin-bottom:14px}
        .g-field label{display:block;font-size:12px;color:#1E293B;margin-bottom:4px;font-weight:500}
        .g-field input,.g-field select,.g-field textarea{width:100%;padding:8px 12px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
        .g-field input:focus,.g-field select:focus,.g-field textarea:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,0.1)}
        .g-field-check{display:flex;align-items:center;gap:8px;margin-bottom:14px}
        .g-field-check input{width:auto}
        .g-field-check label{font-size:13px;color:#1E293B}
        .g-budget-strip{max-width:1440px;margin:0 auto;padding:0 24px 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
        .g-budget-card{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
        .g-budget-card .bl{font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px}
        .g-budget-card .bv{font-size:1rem;font-weight:600;color:#1E293B}
        .g-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
        .g-del-btn{background:none;border:none;color:#EF4444;cursor:pointer;font-size:.9rem;opacity:.5;transition:opacity .15s;padding:2px 6px}
        .g-del-btn:hover{opacity:1;background:#FEF2F2;border-radius:4px}
        .g-editable{cursor:pointer;border-bottom:1px dashed transparent;transition:border-color .2s;padding:2px 4px;border-radius:4px}
        .g-editable:hover{border-bottom-color:#CBD5E1;background:#F8FAFC}
        .g-inline-input{padding:4px 8px;border-radius:6px;border:1px solid #4C6EF5;background:#FFFFFF;color:#1E293B;font-size:13px;font-family:inherit;outline:none;box-shadow:0 0 0 3px rgba(76,110,245,0.1);width:100%;max-width:200px}
        .g-inline-number{width:70px;padding:4px 6px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:12px;font-family:inherit;text-align:right;outline:none;transition:border-color .2s}
        .g-inline-number:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,0.1)}
        .g-inline-select{padding:4px 6px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:12px;font-family:inherit;outline:none;cursor:pointer}
        .g-inline-select:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,0.1)}
        .g-cat-select{padding:4px 8px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:12px;font-family:inherit;outline:none;cursor:pointer;max-width:140px}
        .g-cat-select:focus{border-color:#4C6EF5}
        .g-cat-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle}
        .g-cat-header{background:#F8FAFC;border-left:4px solid;padding:6px 12px;font-size:12px;font-weight:600;color:#1E293B;letter-spacing:.3px}
        .g-cat-header td{background:#F8FAFC !important;text-decoration:none !important;color:#1E293B !important}
        .g-tc-field{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
        .g-tc-field label{font-size:12px;color:#64748B;font-weight:500;white-space:nowrap}
        .g-tc-field input{width:80px;padding:6px 8px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:13px;font-family:inherit;text-align:right;outline:none}
        .g-tc-field input:focus{border-color:#4C6EF5;box-shadow:0 0 0 3px rgba(76,110,245,0.1)}
        .g-toggle-sm{position:relative;width:30px;height:16px;display:inline-block;flex-shrink:0}
        .g-toggle-sm input{opacity:0;width:0;height:0}
        .g-toggle-sm .slider{position:absolute;inset:0;background:#CBD5E1;border:1px solid #CBD5E1;border-radius:16px;cursor:pointer;transition:all .2s}
        .g-toggle-sm .slider::before{content:'';position:absolute;top:1px;left:1px;width:12px;height:12px;border-radius:50%;background:#FFFFFF;transition:all .2s}
        .g-toggle-sm input:checked+.slider{background:#4C6EF5;border-color:#4C6EF5}
        .g-toggle-sm input:checked+.slider::before{transform:translateX(14px)}
        .g-base-indicator{max-width:1440px;margin:0 auto;padding:0 24px 8px}
        .g-base-indicator .inner{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:8px 16px;font-size:12px;color:#15803D;display:flex;align-items:center;gap:8px}
        .g-filter-select{padding:6px 10px;border-radius:6px;border:1px solid #E2E8F0;background:#FFFFFF;color:#1E293B;font-size:12px;font-family:inherit;outline:none;cursor:pointer}
        .g-filter-select:focus{border-color:#4C6EF5}
        .g-cat-list-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #E2E8F0}
        .g-cat-list-item:last-child{border-bottom:none}
        .g-cat-color-input{width:32px;height:24px;border:1px solid #E2E8F0;border-radius:4px;padding:0;cursor:pointer;background:none}
        .g-cat-name-input{flex:1;padding:4px 8px;border:1px solid #E2E8F0;border-radius:4px;font-size:13px;font-family:inherit;outline:none}
        .g-cat-name-input:focus{border-color:#4C6EF5}
        @media(max-width:768px){
          .g-kpi-strip{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));padding:12px 16px;gap:8px}
          .g-container{padding:0 12px 32px}
          .g-kpi .kv{font-size:1.1rem}
          .g-tabs{gap:0}
          .g-tab{padding:8px 12px;font-size:12px}
          .g-budget-strip{padding:0 12px 12px;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
        }
      </style>
      <div class="g-kpi-strip">
        <div class="g-kpi"><div class="accent-top accent-top-main"></div><div class="kl">Gasto Fijo Actual</div><div class="kv" id="gk-total">&mdash;</div><div class="ks">Total mensual</div></div>
        <div class="g-kpi"><div class="accent-top green-top"></div><div class="kl">Gasto Fijo Nuevo</div><div class="kv" id="gk-new">&mdash;</div><div class="ks">Con ahorros</div></div>
        <div class="g-kpi"><div class="accent-top yellow-top"></div><div class="kl">Ahorro Total</div><div class="kv money-green" id="gk-save">&mdash;</div><div class="ks" id="gk-save-pct">&mdash;</div></div>
        <div class="g-kpi"><div class="accent-top accent-top-main"></div><div class="kl">Objetivo $200K</div><div class="kv" id="gk-goal">0%</div><div class="bar"><div class="bar-fill" id="gk-goal-bar" style="width:0%"></div></div></div>
        <div class="g-kpi"><div class="accent-top accent-top-main"></div><div class="kl">Nomina Actual</div><div class="kv" id="gk-nom-act">&mdash;</div><div class="ks">Empleados</div></div>
        <div class="g-kpi"><div class="accent-top green-top"></div><div class="kl">Nomina Nueva</div><div class="kv" id="gk-nom-new">&mdash;</div><div class="ks" id="gk-nom-sub">&mdash;</div></div>
      </div>
      <div id="g-base-indicator" class="g-base-indicator" style="display:none">
        <div class="inner"><span>&#9989;</span> <span id="g-base-text"></span></div>
      </div>
      <div class="g-budget-strip">
        <div class="g-budget-card"><div class="bl">Nomina</div><div class="bv" id="gk-cat-empleados">&mdash;</div></div>
        <div class="g-budget-card"><div class="bl">Operativos</div><div class="bv" id="gk-cat-gastos_operativos">&mdash;</div></div>
        <div class="g-budget-card"><div class="bl">Suscripciones</div><div class="bv" id="gk-cat-suscripciones">&mdash;</div></div>
        <div class="g-budget-card"><div class="bl">Consultorias</div><div class="bv" id="gk-cat-consultorias">&mdash;</div></div>
        <div class="g-budget-card"><div class="bl">Financieros</div><div class="bv" id="gk-cat-financieros">&mdash;</div></div>
      </div>
      <div class="g-container">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;gap:8px;">
          <button class="g-btn g-btn-base" id="gk-save-base">&#128274; Guardar como Base</button>
          <button class="g-btn g-btn-save" id="gk-save-scenario">&#128190; Guardar Escenario</button>
        </div>
        <div class="g-tabs" id="g-tabs">
          <button class="g-tab active" data-tab="nomina">Nomina (Personas)</button>
          <button class="g-tab" data-tab="operativos">Gastos Operativos</button>
          <button class="g-tab" data-tab="suscripciones">Suscripciones</button>
          <button class="g-tab" data-tab="consultorias">Consultorias</button>
          <button class="g-tab" data-tab="financieros">Gastos Financieros</button>
        </div>
        <div id="g-content"><div style="text-align:center;padding:60px;color:#94A3B8;font-size:.9rem;">Cargando datos...</div></div>
      </div>
      <div id="g-modal-root"></div>
    `;
    attachEvents();
  }

  function attachEvents() {
    container.querySelector('#g-tabs').addEventListener('click', function(e) {
      var btn = e.target.closest('.g-tab');
      if (!btn) return;
      activeTab = btn.dataset.tab;
      searchTerm = '';
      renderTabs();
      renderContent(false);
    });

    container.querySelector('#gk-save-scenario').addEventListener('click', showSaveScenarioModal);
    container.querySelector('#gk-save-base').addEventListener('click', saveAsBase);
  }

  function renderTabs() {
    container.querySelectorAll('.g-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === activeTab);
    });
  }

  /* ── Inline editable helpers ── */
  function editableCell(collection, item, field, displayValue) {
    var val = item[field] || '';
    var display = displayValue || val || '\u2014';
    return '<span class="g-editable" onclick="window.__gEditField(\'' + collection + '\',' + item.id + ',\'' + field + '\',this)">' + escHtml(String(display)) + '</span>';
  }

  window.__gEditField = function(collection, id, field, el) {
    var item = state[collection].find(function(i) { return i.id === id; });
    if (!item) return;
    var currentVal = item[field] || '';
    var input = document.createElement('input');
    input.className = 'g-inline-input';
    input.type = 'text';
    input.value = currentVal;
    el.innerHTML = '';
    el.appendChild(input);
    input.focus();
    input.select();

    var saving = false;
    function save() {
      if (saving) return;
      saving = true;
      var newVal = input.value.trim();
      item[field] = newVal;
      patchItem(endpointMap[collection], id, (function() { var o = {}; o[field] = newVal; return o; })());
      el.innerHTML = escHtml(newVal || '\u2014');
    }
    input.addEventListener('blur', save);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { saving = true; el.innerHTML = escHtml(currentVal || '\u2014'); }
    });
  };

  /* ── Category dropdown per row ── */
  function categorySelect(collection, item, tab) {
    var cats = getCategoriesForTab(tab);
    var currentCat = getCategoryById(item.categoria_id);
    var html = '<select class="g-cat-select" onchange="window.__gCatChange(\'' + collection + '\',' + item.id + ',this.value)">';
    html += '<option value="">' + (currentCat ? '' : 'Sin categoria') + '</option>';
    cats.forEach(function(c) {
      html += '<option value="' + c.id + '"' + (item.categoria_id === c.id ? ' selected' : '') + '>' + escHtml(c.nombre) + '</option>';
    });
    html += '</select>';
    if (currentCat) {
      html = '<span class="g-cat-dot" style="background:' + escHtml(currentCat.color) + '"></span>' + html;
    }
    return html;
  }

  window.__gCatChange = function(collection, id, catId) {
    var item = state[collection].find(function(i) { return i.id === id; });
    if (!item) return;
    item.categoria_id = catId ? parseInt(catId) : null;
    patchItem(endpointMap[collection], id, { categoria_id: item.categoria_id });
    renderContent();
  };

  /* ── Category filter dropdown ── */
  function categoryFilterHTML(tab) {
    var cats = getCategoriesForTab(tab);
    if (cats.length === 0) return '';
    var currentFilter = categoryFilter[tab] || '';
    var html = '<select class="g-filter-select" onchange="window.__gCatFilter(\'' + tab + '\',this.value)">';
    html += '<option value="">Todas las categorias</option>';
    html += '<option value="__none"' + (currentFilter === '__none' ? ' selected' : '') + '>Sin categoria</option>';
    cats.forEach(function(c) {
      html += '<option value="' + c.id + '"' + (currentFilter == c.id ? ' selected' : '') + '>';
      html += escHtml(c.nombre) + '</option>';
    });
    html += '</select>';
    return html;
  }

  window.__gCatFilter = function(tab, val) {
    categoryFilter[tab] = val || '';
    renderContent();
  };

  /* ── Group items by category ── */
  function groupByCategory(items, tab) {
    var cats = getCategoriesForTab(tab);
    var grouped = [];
    var catMap = {};
    cats.forEach(function(c) { catMap[c.id] = { cat: c, items: [] }; });
    var uncategorized = [];

    items.forEach(function(item) {
      if (item.categoria_id && catMap[item.categoria_id]) {
        catMap[item.categoria_id].items.push(item);
      } else {
        uncategorized.push(item);
      }
    });

    // Sort by category orden
    cats.sort(function(a, b) { return (a.orden || 0) - (b.orden || 0); });
    cats.forEach(function(c) {
      if (catMap[c.id].items.length > 0) {
        grouped.push({ type: 'header', cat: c });
        catMap[c.id].items.forEach(function(item) { grouped.push({ type: 'item', item: item }); });
      }
    });
    if (uncategorized.length > 0) {
      grouped.push({ type: 'header', cat: { nombre: 'Sin categoria', color: '#94A3B8' } });
      uncategorized.forEach(function(item) { grouped.push({ type: 'item', item: item }); });
    }
    return grouped;
  }

  function filterByCategory(items, tab) {
    var filter = categoryFilter[tab] || '';
    if (!filter) return items;
    if (filter === '__none') return items.filter(function(i) { return !i.categoria_id; });
    var catId = parseInt(filter);
    return items.filter(function(i) { return i.categoria_id === catId; });
  }

  /* ── Esquema/Sueldo handlers ── */
  window.__gEsquemaChange = function(id, value) {
    var item = state.empleados.find(function(i) { return i.id === id; });
    if (!item) return;
    item.esquema = value;
    item.costo = calcCostoFromEsquema(item);
    patchItem('empleados', id, { esquema: value, costo: item.costo });
    renderContent(true);
  };

  window.__gSueldoNetoChange = function(id, value) {
    var item = state.empleados.find(function(i) { return i.id === id; });
    if (!item) return;
    item.sueldo_neto = parseFloat(value) || 0;
    item.costo = calcCostoFromEsquema(item);
    patchItem('empleados', id, { sueldo_neto: item.sueldo_neto, costo: item.costo });
    // Update costo empresa cell directly
    var costoEl = document.getElementById('g-costo-emp-' + id);
    if (costoEl) costoEl.textContent = fmt(item.costo);
    var nuevoEl = document.getElementById('g-nuevo-empleados-' + id);
    if (nuevoEl) nuevoEl.textContent = fmt(item.cortado ? 0 : item.costo);
    calcKPIs();
    updateFooter();
  };

  /* ── Global handlers ── */
  window.__gToggle = function(collection, id) {
    var item = state[collection].find(function(i) { return i.id === id; });
    if (!item) return;
    item.cortado = !item.cortado;
    patchItem(endpointMap[collection], id, { cortado: item.cortado });

    // Targeted DOM update: update the row styling, nuevo value, and footer
    var row = container.querySelector('#g-nuevo-' + collection + '-' + id);
    if (row) {
      var tr = row.closest('tr');
      if (tr) {
        tr.classList.toggle('cut', item.cortado);
      }
      var costoMXN = collection === 'suscripciones' ? calcCostoMXN(item) : item.costo;
      var nuevoVal = item.cortado ? 0 : costoMXN;
      row.textContent = fmt(nuevoVal);
    }
    // Update the status badge
    var badgeCell = container.querySelector('#g-nuevo-' + collection + '-' + id);
    if (badgeCell) {
      var tr = badgeCell.closest('tr');
      if (tr) {
        var badges = tr.querySelectorAll('.g-badge');
        badges.forEach(function(b) {
          if (item.cortado) {
            b.className = 'g-badge b-red';
            b.textContent = 'SALE';
          } else if (item.es_contratacion) {
            b.className = 'g-badge b-orange';
            b.textContent = 'NUEVA CONTRATACION';
          } else {
            b.className = 'g-badge b-green';
            b.textContent = 'ACTIVO';
          }
        });
      }
    }
    updateFooter(collection);
    calcKPIs();
  };

  window.__gCostChange = function(collection, id, value) {
    var item = state[collection].find(function(i) { return i.id === id; });
    if (!item) return;
    var num = parseFloat(value) || 0;
    item.costo = num;
    patchItem(endpointMap[collection], id, { costo: num });
    calcKPIs();
    // Inline updates
    var costoMXN = collection === 'suscripciones' ? calcCostoMXN(item) : num;
    var nuevoVal = item.cortado ? 0 : costoMXN;
    var nuevoEl = container.querySelector('#g-nuevo-' + collection + '-' + id);
    if (nuevoEl) nuevoEl.textContent = fmt(nuevoVal);
    var varEl = container.querySelector('#g-var-' + collection + '-' + id);
    if (varEl) {
      var diff = num - item._originalCosto;
      varEl.textContent = fmt(diff);
      varEl.className = diff <= 0 ? 'var-pos' : 'var-neg';
    }
    var inp = container.querySelector('#g-input-' + collection + '-' + id);
    if (inp) inp.classList.toggle('changed', num !== item._originalCosto);
    // Update costo MXN display for suscripciones
    if (collection === 'suscripciones') {
      var mxnEl = container.querySelector('#g-costomxn-' + id);
      if (mxnEl) mxnEl.textContent = fmt(calcCostoMXN(item));
    }
    updateFooter(collection);
  };

  var _searchTimer = null;
  window.__gSearch = function(v) {
    searchTerm = v;
    if (_searchTimer) clearTimeout(_searchTimer);
    _searchTimer = setTimeout(function() { renderContent(); }, 150);
  };

  window.__gDelete = function(collection, id) {
    showConfirmModal('Eliminar item', 'Seguro que quieres eliminar este item?', function() {
      apiDelete(endpointMap[collection], id).then(function() {
        state[collection] = state[collection].filter(function(i) { return i.id !== id; });
        renderContent();
        calcKPIs();
        window.__toast('Item eliminado', 'success');
      }).catch(function() {
        window.__toast('Error al eliminar', 'error');
      });
    });
  };

  /* ── Suscripciones-specific handlers ── */
  window.__gMonedaChange = function(id, value) {
    var item = state.suscripciones.find(function(i) { return i.id === id; });
    if (!item) return;
    item.moneda = value;
    if (value === 'USD') item.tipo_cambio = tipoCambioGlobal;
    patchItem('suscripciones', id, { moneda: value, tipo_cambio: item.tipo_cambio });
    renderContent();
    calcKPIs();
  };

  window.__gUsuariosChange = function(id, value) {
    var item = state.suscripciones.find(function(i) { return i.id === id; });
    if (!item) return;
    item.usuarios = parseInt(value) || 1;
    patchItem('suscripciones', id, { usuarios: item.usuarios });
    if (item.es_por_usuario && item.costo_por_usuario) {
      item.costo = item.usuarios * item.costo_por_usuario;
      patchItem('suscripciones', id, { costo: item.costo });
    }
    renderContent();
    calcKPIs();
  };

  window.__gCostoPorUsuarioChange = function(id, value) {
    var item = state.suscripciones.find(function(i) { return i.id === id; });
    if (!item) return;
    item.costo_por_usuario = parseFloat(value) || 0;
    patchItem('suscripciones', id, { costo_por_usuario: item.costo_por_usuario });
    if (item.es_por_usuario) {
      item.costo = (item.usuarios || 1) * item.costo_por_usuario;
      patchItem('suscripciones', id, { costo: item.costo });
    }
    renderContent();
    calcKPIs();
  };

  window.__gTogglePorUsuario = function(id) {
    var item = state.suscripciones.find(function(i) { return i.id === id; });
    if (!item) return;
    item.es_por_usuario = !item.es_por_usuario;
    patchItem('suscripciones', id, { es_por_usuario: item.es_por_usuario });
    if (item.es_por_usuario && item.costo_por_usuario && item.usuarios) {
      item.costo = item.usuarios * item.costo_por_usuario;
      patchItem('suscripciones', id, { costo: item.costo });
    }
    renderContent();
    calcKPIs();
  };

  window.__gTipoCambioChange = function(value) {
    tipoCambioGlobal = parseFloat(value) || 17.5;
    state.suscripciones.forEach(function(s) {
      if (s.moneda === 'USD') {
        s.tipo_cambio = tipoCambioGlobal;
        patchItem('suscripciones', s.id, { tipo_cambio: tipoCambioGlobal });
      }
    });
    renderContent();
    calcKPIs();
  };

  /* ── Esquema helpers ── */
  var esquemaLabels = {
    nomina_gpp: 'Nomina GPP',
    poder_global: 'Poder Global',
    factura: 'Factura',
    mixto: 'Mixto',
    otra_razon: 'Otra Razon'
  };

  var esquemaBadgeClass = {
    nomina_gpp: 'b-blue',
    poder_global: 'b-purple',
    factura: 'b-orange',
    mixto: 'b-teal',
    otra_razon: 'b-gray'
  };

  function calcCostoFromEsquema(e) {
    var esquema = e.esquema || 'nomina_gpp';
    var sueldo = e.sueldo_neto || 0;
    if (esquema === 'nomina_gpp') return sueldo * (e.factor_carga || 1.35);
    if (esquema === 'poder_global') return sueldo * (1 + (e.comision_pct || 0.04));
    if (esquema === 'factura') return sueldo;
    if (esquema === 'mixto') return (e.sueldo_imss || 0) * (e.factor_carga || 1.35) + (e.sueldo_complemento || 0) * (1 + (e.comision_pct || 0.04));
    if (esquema === 'otra_razon') return sueldo;
    return sueldo;
  }

  function esquemaSelect(item) {
    var current = item.esquema || 'nomina_gpp';
    var html = '<select class="g-inline-select" onchange="window.__gEsquemaChange(' + item.id + ',this.value)">';
    Object.keys(esquemaLabels).forEach(function(key) {
      html += '<option value="' + key + '"' + (current === key ? ' selected' : '') + '>' + esquemaLabels[key] + '</option>';
    });
    html += '</select>';
    return html;
  }

  function esquemaBadge(item) {
    var esquema = item.esquema || 'nomina_gpp';
    return '<span class="g-badge ' + (esquemaBadgeClass[esquema] || 'b-gray') + '">' + (esquemaLabels[esquema] || esquema) + '</span>';
  }

  window.__gEsquemaChange = function(id, value) {
    var item = state.empleados.find(function(i) { return i.id === id; });
    if (!item) return;
    item.esquema = value;
    item.costo = calcCostoFromEsquema(item);
    patchItem('empleados', id, { esquema: value, costo: item.costo });
    // Update DOM inline
    var costoEl = container.querySelector('#g-costo-empleados-' + id);
    if (costoEl) costoEl.textContent = fmt(item.costo);
    var varEl = container.querySelector('#g-var-empleados-' + id);
    if (varEl) {
      var diff = (item.cortado ? 0 : item.costo) - item._originalCosto;
      varEl.textContent = diff !== 0 ? fmt(diff) : '\u2014';
      varEl.className = diff <= 0 ? 'var-pos' : 'var-neg';
    }
    updateFooter('empleados');
    calcKPIs();
  };

  window.__gSueldoNetoChange = function(id, value) {
    var item = state.empleados.find(function(i) { return i.id === id; });
    if (!item) return;
    var num = parseFloat(value) || 0;
    item.sueldo_neto = num;
    item.costo = calcCostoFromEsquema(item);
    patchItem('empleados', id, { sueldo_neto: num, costo: item.costo });
    // Update DOM inline
    var costoEl = container.querySelector('#g-costo-empleados-' + id);
    if (costoEl) costoEl.textContent = fmt(item.costo);
    var varEl = container.querySelector('#g-var-empleados-' + id);
    if (varEl) {
      var diff = (item.cortado ? 0 : item.costo) - item._originalCosto;
      varEl.textContent = diff !== 0 ? fmt(diff) : '\u2014';
      varEl.className = diff <= 0 ? 'var-pos' : 'var-neg';
    }
    var inp = container.querySelector('#g-input-sueldo-' + id);
    if (inp) inp.classList.toggle('changed', item.costo !== item._originalCosto);
    updateFooter('empleados');
    calcKPIs();
  };

  function updateFooter(collection) {
    var items = state[collection];
    var sumOrig = 0, sumNew = 0;
    items.forEach(function(i) {
      sumOrig += i._originalCosto;
      var cost = collection === 'suscripciones' ? calcCostoMXN(i) : i.costo;
      sumNew += i.cortado ? 0 : cost;
    });
    var fOrig = container.querySelector('#g-foot-orig-' + collection);
    var fNew = container.querySelector('#g-foot-new-' + collection);
    if (fOrig) fOrig.textContent = fmt(sumOrig);
    if (fNew) fNew.textContent = fmt(sumNew);

    // Update empleados-specific footer fields
    if (collection === 'empleados') {
      var sumSueldo = 0;
      var activeCount = 0;
      items.forEach(function(i) {
        if (!i.cortado) {
          sumSueldo += (i.sueldo_neto || 0);
          activeCount++;
        }
      });
      var fSueldo = container.querySelector('#g-foot-sueldo-empleados');
      if (fSueldo) fSueldo.textContent = fmt(sumSueldo);
      var fCount = container.querySelector('#g-foot-count-empleados');
      if (fCount) fCount.textContent = 'TOTAL (' + items.length + ' personas)';
      var fVar = container.querySelector('#g-foot-var-empleados');
      if (fVar) {
        var varVal = sumNew - sumOrig;
        fVar.innerHTML = '<span class="' + (varVal <= 0 ? 'var-pos' : 'var-neg') + '">' + fmt(varVal) + '</span>';
      }
    }
  }

  /* ── HTML helpers ── */
  function statusBadge(item) {
    if (item.cortado) return '<span class="g-badge b-red">SALE</span>';
    if (item.es_contratacion) return '<span class="g-badge b-orange">NUEVA CONTRATACION</span>';
    return '<span class="g-badge b-green">ACTIVO</span>';
  }

  function toggleHTML(collection, item) {
    return '<label class="g-toggle"><input type="checkbox" ' + (item.cortado ? 'checked' : '') + ' onchange="window.__gToggle(\'' + collection + '\',' + item.id + ')"><span class="slider"></span></label>';
  }

  function costInput(collection, item) {
    var changed = item.costo !== item._originalCosto;
    return '<input class="g-cost-input' + (changed ? ' changed' : '') + '" id="g-input-' + collection + '-' + item.id + '" type="number" value="' + item.costo + '" onchange="window.__gCostChange(\'' + collection + '\',' + item.id + ',this.value)">';
  }

  function nuevoCell(collection, item) {
    var costoMXN = collection === 'suscripciones' ? calcCostoMXN(item) : item.costo;
    var val = item.cortado ? 0 : costoMXN;
    return '<span id="g-nuevo-' + collection + '-' + item.id + '">' + fmt(val) + '</span>';
  }

  function deleteBtn(collection, item) {
    return '<button class="g-del-btn" title="Eliminar" onclick="window.__gDelete(\'' + collection + '\',' + item.id + ')">&#10005;</button>';
  }

  /* ── Category header row ── */
  function categoryHeaderRow(cat, colspan) {
    return '<tr class="g-cat-header"><td colspan="' + colspan + '" style="border-left-color:' + escHtml(cat.color || '#94A3B8') + '"><span class="g-cat-dot" style="background:' + escHtml(cat.color || '#94A3B8') + '"></span> ' + escHtml(cat.nombre) + '</td></tr>';
  }

  /* ── Scroll-preserving render helper ── */
  function saveScrollPositions() {
    var positions = { window: window.scrollY || window.pageYOffset || 0 };
    if (container) {
      positions.container = container.scrollTop || 0;
    }
    var tableWrap = container ? container.querySelector('.g-table-wrap') : null;
    if (tableWrap) {
      positions.tableWrapX = tableWrap.scrollLeft || 0;
      positions.tableWrapY = tableWrap.scrollTop || 0;
    }
    return positions;
  }

  function restoreScrollPositions(positions) {
    if (!positions) return;
    // Use requestAnimationFrame to ensure DOM has been updated
    requestAnimationFrame(function() {
      window.scrollTo(0, positions.window);
      if (container) container.scrollTop = positions.container;
      var tableWrap = container ? container.querySelector('.g-table-wrap') : null;
      if (tableWrap) {
        tableWrap.scrollLeft = positions.tableWrapX || 0;
        tableWrap.scrollTop = positions.tableWrapY || 0;
      }
    });
  }

  /* ── Tab content rendering ── */
  function renderContent(preserveScroll) {
    // Default to preserving scroll unless explicitly told not to
    if (preserveScroll === undefined) preserveScroll = true;
    var scrollPos = preserveScroll ? saveScrollPositions() : null;

    var el = container.querySelector('#g-content');
    var html = '';

    var collection = tabCollectionMap[activeTab];

    // Toolbar with add button, manage categories, and filter
    html += '<div class="g-toolbar">';
    html += '<button class="g-btn g-btn-primary" onclick="window.__gShowAdd(\'' + activeTab + '\')">+ Agregar</button>';
    html += '<button class="g-btn g-btn-secondary" onclick="window.__gManageCats(\'' + activeTab + '\')">Gestionar Categorias</button>';
    html += categoryFilterHTML(activeTab);
    html += '</div>';

    if (activeTab === 'nomina') {
      var allItems = state.empleados;
      var filtered = allItems.filter(function(e) {
        if (!searchTerm) return true;
        var s = searchTerm.toLowerCase();
        return (e.nombre || '').toLowerCase().includes(s) || (e.depto || '').toLowerCase().includes(s);
      });
      filtered = filterByCategory(filtered, 'nomina');
      var sumOrig = 0, sumNew = 0;
      state.empleados.forEach(function(e) { sumOrig += e._originalCosto; sumNew += e.cortado ? 0 : e.costo; });
      var grouped = groupByCategory(filtered, 'nomina');
      var colCount = 10;

      html += '<div class="g-search" style="margin-bottom:12px"><input id="g-search-input" type="text" placeholder="Buscar por nombre o departamento..." value="' + escHtml(searchTerm) + '" oninput="window.__gSearch(this.value)"></div>';
      var sumNeto = 0;
      state.empleados.forEach(function(e) { if (!e.cortado) sumNeto += (e.sueldo_neto || 0); });
      var colCount = 11;
      html += '<div class="g-panel"><div class="g-table-wrap"><table><thead><tr><th>Cortar</th><th>Empleado</th><th>Departamento</th><th>Esquema</th><th>Sueldo Neto</th><th>Costo Empresa</th><th>Var</th><th>Estado</th><th>Nota</th><th>Cat.</th><th></th></tr></thead><tbody>';
      grouped.forEach(function(entry) {
        if (entry.type === 'header') {
          html += categoryHeaderRow(entry.cat, colCount);
        } else {
          var e = entry.item;
          var costoEmp = e.costo || 0;
          var nuevoVal = e.cortado ? 0 : costoEmp;
          var diff = nuevoVal - e._originalCosto;
          html += '<tr class="' + (e.cortado ? 'cut' : '') + '">';
          html += '<td>' + toggleHTML('empleados', e) + '</td>';
          html += '<td>' + editableCell('empleados', e, 'nombre') + '</td>';
          html += '<td>' + editableCell('empleados', e, 'depto') + '</td>';
          html += '<td>' + esquemaSelect(e) + '</td>';
          html += '<td><input class="g-inline-number" type="number" value="' + (e.sueldo_neto || 0) + '" onchange="window.__gSueldoNetoChange(' + e.id + ',this.value)" style="width:90px"></td>';
          html += '<td id="g-costo-emp-' + e.id + '">' + fmt(costoEmp) + '</td>';
          html += '<td><span id="g-nuevo-empleados-' + e.id + '" class="' + (diff <= 0 ? 'var-pos' : 'var-neg') + '">' + (diff !== 0 ? fmt(diff) : '\u2014') + '</span></td>';
          html += '<td>' + statusBadge(e) + '</td>';
          html += '<td class="g-nota">' + editableCell('empleados', e, 'nota', e.nota || '\u2014') + '</td>';
          html += '<td>' + categorySelect('empleados', e, 'nomina') + '</td>';
          html += '<td>' + deleteBtn('empleados', e) + '</td>';
          html += '</tr>';
        }
      });
      html += '</tbody><tfoot><tr>';
      html += '<td colspan="4" style="text-align:right">TOTAL (' + state.empleados.length + ' personas)</td>';
      html += '<td id="g-foot-neto-empleados">' + fmt(sumNeto) + '</td>';
      html += '<td id="g-foot-orig-empleados">' + fmt(sumNew) + '</td>';
      html += '<td id="g-foot-var-empleados"><span class="' + (sumNew - sumOrig <= 0 ? 'var-pos' : 'var-neg') + '">' + fmt(sumNew - sumOrig) + '</span></td>';
      html += '<td colspan="4"></td>';
      html += '</tr></tfoot></table></div></div>';
    }

    else if (activeTab === 'operativos') {
      var sumOrig = 0, sumNew = 0;
      state.gastos_operativos.forEach(function(g) { sumOrig += g._originalCosto; sumNew += g.cortado ? 0 : g.costo; });
      var filtered = filterByCategory(state.gastos_operativos, 'operativos');
      var grouped = groupByCategory(filtered, 'operativos');
      var colCount = 9;
      html += '<div class="g-panel"><div class="g-table-wrap"><table><thead><tr><th>Cortar</th><th>Partida</th><th>Categoria</th><th>Cat. Tipo</th><th>Actual/Mes</th><th>Nuevo/Mes</th><th>Var</th><th>Nota</th><th></th></tr></thead><tbody>';
      grouped.forEach(function(entry) {
        if (entry.type === 'header') {
          html += categoryHeaderRow(entry.cat, colCount);
        } else {
          var g = entry.item;
          var nuevoVal = g.cortado ? 0 : g.costo;
          var diff = nuevoVal - g._originalCosto;
          var catBadge = g.fijo
            ? '<span class="g-badge b-gray">NO CONTROLABLE</span>'
            : '<span class="g-badge b-accent">' + escHtml(g.categoria || '\u2014') + '</span>';
          html += '<tr class="' + (g.cortado ? 'cut' : '') + '">';
          html += '<td>' + toggleHTML('gastos_operativos', g) + '</td>';
          html += '<td>' + editableCell('gastos_operativos', g, 'nombre') + '</td>';
          html += '<td>' + categorySelect('gastos_operativos', g, 'operativos') + '</td>';
          html += '<td>' + catBadge + '</td>';
          html += '<td>' + costInput('gastos_operativos', g) + '</td>';
          html += '<td>' + nuevoCell('gastos_operativos', g) + '</td>';
          html += '<td><span class="' + (diff <= 0 ? 'var-pos' : 'var-neg') + '">' + (diff !== 0 ? fmt(diff) : '\u2014') + '</span></td>';
          html += '<td class="g-nota">' + editableCell('gastos_operativos', g, 'nota', g.nota || '\u2014') + '</td>';
          html += '<td>' + deleteBtn('gastos_operativos', g) + '</td>';
          html += '</tr>';
        }
      });
      html += '</tbody><tfoot><tr><td colspan="4" style="text-align:right">TOTAL</td>';
      html += '<td id="g-foot-orig-gastos_operativos">' + fmt(sumOrig) + '</td>';
      html += '<td id="g-foot-new-gastos_operativos">' + fmt(sumNew) + '</td>';
      html += '<td id="g-foot-var-gastos_operativos"><span class="' + (sumNew - sumOrig <= 0 ? 'var-pos' : 'var-neg') + '">' + fmt(sumNew - sumOrig) + '</span></td>';
      html += '<td colspan="2"></td></tr></tfoot></table></div></div>';
    }

    else if (activeTab === 'suscripciones') {
      var sumOrig = 0, sumNew = 0;
      state.suscripciones.forEach(function(s) { sumOrig += s._originalCosto; sumNew += s.cortado ? 0 : calcCostoMXN(s); });
      var filtered = filterByCategory(state.suscripciones, 'suscripciones');
      var grouped = groupByCategory(filtered, 'suscripciones');
      var colCount = 13;

      // Tipo de cambio field
      html += '<div class="g-tc-field">';
      html += '<label>Tipo de Cambio USD/MXN:</label>';
      html += '<input type="number" step="0.01" value="' + tipoCambioGlobal + '" onchange="window.__gTipoCambioChange(this.value)">';
      html += '</div>';

      html += '<div class="g-panel"><div class="g-table-wrap"><table><thead><tr>';
      html += '<th>Cortar</th><th>Suscripcion</th><th>Usuarios</th><th>$/Usuario</th>';
      html += '<th>Moneda</th><th>Costo Mensual</th><th>Costo MXN</th>';
      html += '<th>Nuevo/Mes</th><th>Var</th><th>Categoria</th><th>Frecuencia</th><th>Por Usuario</th><th>Nota</th><th></th>';
      html += '</tr></thead><tbody>';
      grouped.forEach(function(entry) {
        if (entry.type === 'header') {
          html += categoryHeaderRow(entry.cat, colCount);
        } else {
          var s = entry.item;
          var costoMXN = calcCostoMXN(s);
          var nuevoVal = s.cortado ? 0 : costoMXN;
          html += '<tr class="' + (s.cortado ? 'cut' : '') + '">';
          html += '<td>' + toggleHTML('suscripciones', s) + '</td>';
          html += '<td>' + editableCell('suscripciones', s, 'nombre') + '</td>';
          // Usuarios
          html += '<td><input class="g-inline-number" type="number" min="1" value="' + (s.usuarios || 1) + '" onchange="window.__gUsuariosChange(' + s.id + ',this.value)"></td>';
          // $/Usuario (only visible if es_por_usuario)
          if (s.es_por_usuario) {
            html += '<td><input class="g-inline-number" type="number" step="0.01" value="' + (s.costo_por_usuario || 0) + '" onchange="window.__gCostoPorUsuarioChange(' + s.id + ',this.value)"></td>';
          } else {
            html += '<td style="color:#94A3B8;font-size:11px;text-align:center">\u2014</td>';
          }
          // Moneda dropdown
          html += '<td><select class="g-inline-select" onchange="window.__gMonedaChange(' + s.id + ',this.value)">';
          html += '<option value="MXN"' + ((s.moneda || 'MXN') === 'MXN' ? ' selected' : '') + '>MXN</option>';
          html += '<option value="USD"' + (s.moneda === 'USD' ? ' selected' : '') + '>USD</option>';
          html += '</select></td>';
          // Costo Mensual
          html += '<td>' + costInput('suscripciones', s) + '</td>';
          // Costo MXN
          html += '<td id="g-costomxn-' + s.id + '">' + fmt(costoMXN) + '</td>';
          // Nuevo/Mes
          html += '<td><span id="g-nuevo-suscripciones-' + s.id + '">' + fmt(nuevoVal) + '</span></td>';
          // Var
          var sDiff = nuevoVal - s._originalCosto;
          html += '<td><span class="' + (sDiff <= 0 ? 'var-pos' : 'var-neg') + '">' + (sDiff !== 0 ? fmt(sDiff) : '\u2014') + '</span></td>';
          // Categoria
          html += '<td>' + categorySelect('suscripciones', s, 'suscripciones') + '</td>';
          // Frecuencia
          html += '<td>' + editableCell('suscripciones', s, 'frecuencia', s.frecuencia || '\u2014') + '</td>';
          // Toggle por usuario
          html += '<td><label class="g-toggle-sm"><input type="checkbox" ' + (s.es_por_usuario ? 'checked' : '') + ' onchange="window.__gTogglePorUsuario(' + s.id + ')"><span class="slider"></span></label></td>';
          // Nota
          html += '<td class="g-nota">' + editableCell('suscripciones', s, 'nota', s.nota || '\u2014') + '</td>';
          html += '<td>' + deleteBtn('suscripciones', s) + '</td>';
          html += '</tr>';
        }
      });
      html += '</tbody><tfoot><tr><td colspan="6" style="text-align:right">TOTAL</td>';
      html += '<td id="g-foot-orig-suscripciones">' + fmt(sumOrig) + '</td>';
      html += '<td id="g-foot-new-suscripciones">' + fmt(sumNew) + '</td>';
      html += '<td><span class="' + (sumNew - sumOrig <= 0 ? 'var-pos' : 'var-neg') + '">' + fmt(sumNew - sumOrig) + '</span></td>';
      html += '<td colspan="5"></td></tr></tfoot></table></div></div>';
    }

    else if (activeTab === 'consultorias') {
      var sumOrig = 0, sumNew = 0;
      state.consultorias.forEach(function(c) { sumOrig += c._originalCosto; sumNew += c.cortado ? 0 : c.costo; });
      var filtered = filterByCategory(state.consultorias, 'consultorias');
      var grouped = groupByCategory(filtered, 'consultorias');
      var colCount = 8;
      html += '<div class="g-panel"><div class="g-table-wrap"><table><thead><tr><th>Cortar</th><th>Consultoria</th><th>Categoria</th><th>Actual/Mes</th><th>Nuevo/Mes</th><th>Var</th><th>Nota</th><th></th></tr></thead><tbody>';
      grouped.forEach(function(entry) {
        if (entry.type === 'header') {
          html += categoryHeaderRow(entry.cat, colCount);
        } else {
          var c = entry.item;
          var cNuevo = c.cortado ? 0 : c.costo;
          var cDiff = cNuevo - c._originalCosto;
          html += '<tr class="' + (c.cortado ? 'cut' : '') + '">';
          html += '<td>' + toggleHTML('consultorias', c) + '</td>';
          html += '<td>' + editableCell('consultorias', c, 'nombre') + '</td>';
          html += '<td>' + categorySelect('consultorias', c, 'consultorias') + '</td>';
          html += '<td>' + costInput('consultorias', c) + '</td>';
          html += '<td>' + nuevoCell('consultorias', c) + '</td>';
          html += '<td><span class="' + (cDiff <= 0 ? 'var-pos' : 'var-neg') + '">' + (cDiff !== 0 ? fmt(cDiff) : '\u2014') + '</span></td>';
          html += '<td class="g-nota">' + editableCell('consultorias', c, 'nota', c.nota || '\u2014') + '</td>';
          html += '<td>' + deleteBtn('consultorias', c) + '</td>';
          html += '</tr>';
        }
      });
      html += '</tbody><tfoot><tr><td colspan="3" style="text-align:right">TOTAL</td>';
      html += '<td id="g-foot-orig-consultorias">' + fmt(sumOrig) + '</td>';
      html += '<td id="g-foot-new-consultorias">' + fmt(sumNew) + '</td>';
      html += '<td><span class="' + (sumNew - sumOrig <= 0 ? 'var-pos' : 'var-neg') + '">' + fmt(sumNew - sumOrig) + '</span></td>';
      html += '<td colspan="2"></td></tr></tfoot></table></div></div>';
    }

    else if (activeTab === 'financieros') {
      var sumOrig = 0, sumNew = 0;
      state.financieros.forEach(function(f) { sumOrig += f._originalCosto; sumNew += f.cortado ? 0 : f.costo; });
      var filtered = filterByCategory(state.financieros, 'financieros');
      var grouped = groupByCategory(filtered, 'financieros');
      var colCount = 8;
      html += '<div class="g-panel"><div class="g-table-wrap"><table><thead><tr><th>Cortar</th><th>Concepto</th><th>Categoria</th><th>Actual/Mes</th><th>Nuevo/Mes</th><th>Var</th><th>Nota</th><th></th></tr></thead><tbody>';
      grouped.forEach(function(entry) {
        if (entry.type === 'header') {
          html += categoryHeaderRow(entry.cat, colCount);
        } else {
          var f = entry.item;
          var fNuevo = f.cortado ? 0 : f.costo;
          var fDiff = fNuevo - f._originalCosto;
          html += '<tr class="' + (f.cortado ? 'cut' : '') + '">';
          html += '<td>' + toggleHTML('financieros', f) + '</td>';
          html += '<td>' + editableCell('financieros', f, 'nombre') + '</td>';
          html += '<td>' + categorySelect('financieros', f, 'financieros') + '</td>';
          html += '<td>' + costInput('financieros', f) + '</td>';
          html += '<td>' + nuevoCell('financieros', f) + '</td>';
          html += '<td><span class="' + (fDiff <= 0 ? 'var-pos' : 'var-neg') + '">' + (fDiff !== 0 ? fmt(fDiff) : '\u2014') + '</span></td>';
          html += '<td class="g-nota">' + editableCell('financieros', f, 'nota', f.nota || '\u2014') + '</td>';
          html += '<td>' + deleteBtn('financieros', f) + '</td>';
          html += '</tr>';
        }
      });
      html += '</tbody><tfoot><tr><td colspan="3" style="text-align:right">TOTAL</td>';
      html += '<td id="g-foot-orig-financieros">' + fmt(sumOrig) + '</td>';
      html += '<td id="g-foot-new-financieros">' + fmt(sumNew) + '</td>';
      html += '<td><span class="' + (sumNew - sumOrig <= 0 ? 'var-pos' : 'var-neg') + '">' + fmt(sumNew - sumOrig) + '</span></td>';
      html += '<td colspan="2"></td></tr></tfoot></table></div></div>';
    }

    // Save focused element info before replacing DOM
    var activeEl = document.activeElement;
    var focusedId = activeEl ? activeEl.id : null;
    var focusedSelStart = null;
    var focusedSelEnd = null;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      try { focusedSelStart = activeEl.selectionStart; focusedSelEnd = activeEl.selectionEnd; } catch(e) {}
    }

    el.innerHTML = html;

    if (preserveScroll && scrollPos) {
      restoreScrollPositions(scrollPos);
    }

    // Restore focus to the previously focused element (e.g., search input)
    if (focusedId) {
      var refocus = container.querySelector('#' + focusedId);
      if (refocus) {
        refocus.focus();
        if (focusedSelStart !== null) {
          try { refocus.setSelectionRange(focusedSelStart, focusedSelEnd); } catch(e) {}
        }
      }
    }
  }

  /* ── Add Item Modal ── */
  window.__gShowAdd = function(tab) {
    var fields = '';

    if (tab === 'nomina') {
      fields = `
        <div class="g-field"><label>Nombre</label><input id="add-nombre" type="text"></div>
        <div class="g-field"><label>Departamento</label><input id="add-depto" type="text"></div>
        <div class="g-field"><label>Costo mensual</label><input id="add-costo" type="number" value="0"></div>
        <div class="g-field-check"><input id="add-contratacion" type="checkbox"><label for="add-contratacion">Es nueva contratacion</label></div>
      `;
    } else if (tab === 'operativos') {
      fields = `
        <div class="g-field"><label>Nombre</label><input id="add-nombre" type="text"></div>
        <div class="g-field"><label>Costo mensual</label><input id="add-costo" type="number" value="0"></div>
        <div class="g-field"><label>Categoria</label><select id="add-categoria"><option value="Venta">Venta</option><option value="Admin">Admin</option></select></div>
        <div class="g-field-check"><input id="add-fijo" type="checkbox"><label for="add-fijo">No controlable (fijo)</label></div>
      `;
    } else if (tab === 'suscripciones') {
      fields = `
        <div class="g-field"><label>Nombre</label><input id="add-nombre" type="text"></div>
        <div class="g-field"><label>Costo mensual</label><input id="add-costo" type="number" value="0"></div>
        <div class="g-field"><label>Moneda</label><select id="add-moneda"><option value="MXN">MXN</option><option value="USD">USD</option></select></div>
        <div class="g-field"><label>Frecuencia</label><input id="add-frecuencia" type="text" value="Mensual"></div>
        <div class="g-field"><label>Nota</label><input id="add-nota" type="text"></div>
        <div class="g-field-check"><input id="add-porusuario" type="checkbox"><label for="add-porusuario">Precio por usuario</label></div>
        <div class="g-field"><label>Usuarios</label><input id="add-usuarios" type="number" value="1" min="1"></div>
        <div class="g-field"><label>Costo por usuario</label><input id="add-costousuario" type="number" value="0" step="0.01"></div>
      `;
    } else if (tab === 'consultorias') {
      fields = `
        <div class="g-field"><label>Nombre</label><input id="add-nombre" type="text"></div>
        <div class="g-field"><label>Costo mensual</label><input id="add-costo" type="number" value="0"></div>
        <div class="g-field"><label>Nota</label><input id="add-nota" type="text"></div>
      `;
    } else if (tab === 'financieros') {
      fields = `
        <div class="g-field"><label>Nombre</label><input id="add-nombre" type="text"></div>
        <div class="g-field"><label>Costo mensual</label><input id="add-costo" type="number" value="0"></div>
        <div class="g-field"><label>Nota</label><input id="add-nota" type="text"></div>
      `;
    }

    var tabLabel = { nomina: 'Empleado', operativos: 'Gasto Operativo', suscripciones: 'Suscripcion', consultorias: 'Consultoria', financieros: 'Gasto Financiero' };

    showModal('Agregar ' + tabLabel[tab], fields, function() {
      var nombre = (container.querySelector('#add-nombre').value || '').trim();
      var costo = parseFloat(container.querySelector('#add-costo').value) || 0;
      if (!nombre) { window.__toast('El nombre es requerido', 'error'); return; }

      var body = { nombre: nombre, costo: costo };

      if (tab === 'nomina') {
        body.depto = (container.querySelector('#add-depto').value || '').trim();
        body.es_contratacion = container.querySelector('#add-contratacion').checked;
      } else if (tab === 'operativos') {
        body.categoria = container.querySelector('#add-categoria').value;
        body.fijo = container.querySelector('#add-fijo').checked;
      } else if (tab === 'suscripciones') {
        body.frecuencia = (container.querySelector('#add-frecuencia').value || '').trim();
        body.nota = (container.querySelector('#add-nota').value || '').trim();
        body.moneda = container.querySelector('#add-moneda').value;
        body.es_por_usuario = container.querySelector('#add-porusuario').checked;
        body.usuarios = parseInt(container.querySelector('#add-usuarios').value) || 1;
        body.costo_por_usuario = parseFloat(container.querySelector('#add-costousuario').value) || 0;
        if (body.moneda === 'USD') body.tipo_cambio = tipoCambioGlobal;
      } else {
        body.nota = (container.querySelector('#add-nota').value || '').trim();
      }

      apiPost(tabEndpointMap[tab], body).then(function(newItem) {
        newItem._originalCosto = newItem.costo;
        state[tabCollectionMap[tab]].push(newItem);
        renderContent();
        calcKPIs();
        closeModal();
        window.__toast('Item creado', 'success');
      }).catch(function() {
        window.__toast('Error al crear', 'error');
      });
    });
  };

  /* ── Save Scenario Modal ── */
  function showSaveScenarioModal() {
    var fields = `
      <div class="g-field"><label>Nombre del escenario</label><input id="esc-nombre" type="text" placeholder="Ej: Escenario conservador Q2"></div>
      <div class="g-field"><label>Descripcion</label><textarea id="esc-desc" rows="3" placeholder="Notas sobre este escenario..."></textarea></div>
    `;

    showModal('Guardar Escenario', fields, function() {
      var nombre = (container.querySelector('#esc-nombre').value || '').trim();
      var desc = (container.querySelector('#esc-desc').value || '').trim();
      if (!nombre) { window.__toast('El nombre es requerido', 'error'); return; }

      // Build snapshot from current in-memory state
      var snapshot = {};
      var totalOriginal = 0, totalNuevo = 0;
      for (var key of ['empleados', 'gastos_operativos', 'suscripciones', 'consultorias', 'financieros']) {
        snapshot[key] = state[key].map(function(item) {
          var obj = Object.assign({}, item);
          delete obj._originalCosto;
          return obj;
        });
        state[key].forEach(function(item) {
          totalOriginal += item._originalCosto;
          totalNuevo += item.cortado ? 0 : item.costo;
        });
      }

      var body = {
        nombre: nombre,
        descripcion: desc,
        snapshot: snapshot,
        total_original: totalOriginal,
        total_nuevo: totalNuevo,
        ahorro: totalOriginal - totalNuevo
      };

      fetch('/api/escenarios/from-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(r) {
        if (!r.ok) throw new Error('Error');
        return r.json();
      }).then(function() {
        closeModal();
        window.__toast('Escenario guardado correctamente', 'success');
      }).catch(function() {
        window.__toast('Error al guardar escenario', 'error');
      });
    });
  }

  /* ── Save as Base ── */
  function saveAsBase() {
    var now = new Date();
    var dateStr = now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    var body = {
      nombre: 'Estado Base',
      descripcion: 'Presupuesto base guardado el ' + dateStr
    };

    fetch('/api/escenarios/set-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function(r) {
      if (!r.ok) throw new Error('Error');
      return r.json();
    }).then(function(data) {
      baseScenario = data;
      renderBaseIndicator();
      window.__toast('Base guardada correctamente', 'success');
    }).catch(function() {
      window.__toast('Error al guardar base', 'error');
    });
  }

  function loadBaseScenario() {
    fetch('/api/escenarios/base')
      .then(function(r) {
        if (!r.ok) throw new Error('No base');
        return r.json();
      })
      .then(function(data) {
        if (data && data.id) {
          baseScenario = data;
          renderBaseIndicator();
        }
      })
      .catch(function() { /* no base scenario, that is fine */ });
  }

  function renderBaseIndicator() {
    var el = container.querySelector('#g-base-indicator');
    var textEl = container.querySelector('#g-base-text');
    if (!el || !textEl) return;
    if (!baseScenario) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    var fecha = baseScenario.created_at ? new Date(baseScenario.created_at).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' }) : '';
    textEl.textContent = 'Base guardada: ' + (baseScenario.nombre || 'Estado Base') + (fecha ? ' \u2014 ' + fecha : '');
  }

  /* ── Manage Categories Modal ── */
  window.__gManageCats = function(tab) {
    var modulo = tabModuloMap[tab];
    renderCategoryModal(modulo, tab);
  };

  function renderCategoryModal(modulo, tab) {
    var cats = state.categorias.filter(function(c) { return c.modulo === modulo; });

    var bodyHTML = '<div id="g-cat-list">';
    cats.forEach(function(c) {
      bodyHTML += '<div class="g-cat-list-item" data-cat-id="' + c.id + '">';
      bodyHTML += '<input type="color" class="g-cat-color-input" value="' + escHtml(c.color || '#6366F1') + '" data-field="color">';
      bodyHTML += '<input type="text" class="g-cat-name-input" value="' + escHtml(c.nombre) + '" data-field="nombre">';
      bodyHTML += '<button class="g-del-btn" title="Eliminar categoria" data-action="delete-cat">&#10005;</button>';
      bodyHTML += '</div>';
    });
    bodyHTML += '</div>';
    bodyHTML += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E2E8F0;">';
    bodyHTML += '<div style="display:flex;gap:8px;align-items:center">';
    bodyHTML += '<input type="color" id="new-cat-color" value="#6366F1" class="g-cat-color-input">';
    bodyHTML += '<input type="text" id="new-cat-name" placeholder="Nueva categoria..." class="g-cat-name-input" style="flex:1">';
    bodyHTML += '<button class="g-btn g-btn-primary" id="add-cat-btn" style="padding:6px 12px;font-size:12px">+ Agregar</button>';
    bodyHTML += '</div></div>';

    showModal('Gestionar Categorias \u2014 ' + categoryLabels[tabCollectionMap[tab]], bodyHTML, function() {
      // Save all edits on confirm
      var items = container.querySelectorAll('.g-cat-list-item');
      items.forEach(function(el) {
        var catId = parseInt(el.dataset.catId);
        var nameInput = el.querySelector('[data-field="nombre"]');
        var colorInput = el.querySelector('[data-field="color"]');
        var cat = state.categorias.find(function(c) { return c.id === catId; });
        if (cat) {
          var changed = false;
          if (nameInput && nameInput.value !== cat.nombre) { cat.nombre = nameInput.value; changed = true; }
          if (colorInput && colorInput.value !== cat.color) { cat.color = colorInput.value; changed = true; }
          if (changed) apiCategoryPatch(catId, { nombre: cat.nombre, color: cat.color });
        }
      });
      closeModal();
      renderContent();
    });

    // Attach add button handler after modal renders
    setTimeout(function() {
      var addBtn = container.querySelector('#add-cat-btn');
      if (addBtn) {
        addBtn.addEventListener('click', function() {
          var nameEl = container.querySelector('#new-cat-name');
          var colorEl = container.querySelector('#new-cat-color');
          var nombre = (nameEl.value || '').trim();
          if (!nombre) { window.__toast('Nombre requerido', 'error'); return; }
          var color = colorEl.value || '#6366F1';
          var orden = cats.length + 1;

          apiCategoryPost({ nombre: nombre, modulo: modulo, color: color, orden: orden })
            .then(function(newCat) {
              state.categorias.push(newCat);
              closeModal();
              renderCategoryModal(modulo, tab);
              window.__toast('Categoria creada', 'success');
            })
            .catch(function() { window.__toast('Error al crear categoria', 'error'); });
        });
      }

      // Attach delete handlers
      var delBtns = container.querySelectorAll('[data-action="delete-cat"]');
      delBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var catItem = btn.closest('.g-cat-list-item');
          var catId = parseInt(catItem.dataset.catId);
          apiCategoryDelete(catId)
            .then(function() {
              state.categorias = state.categorias.filter(function(c) { return c.id !== catId; });
              // Remove categoria_id from items that had this category
              ['empleados', 'gastos_operativos', 'suscripciones', 'consultorias', 'financieros'].forEach(function(key) {
                state[key].forEach(function(item) {
                  if (item.categoria_id === catId) item.categoria_id = null;
                });
              });
              closeModal();
              renderCategoryModal(modulo, tab);
              window.__toast('Categoria eliminada', 'success');
            })
            .catch(function() { window.__toast('Error al eliminar', 'error'); });
        });
      });
    }, 50);
  }

  /* ── Modal utils ── */
  function showModal(title, bodyHTML, onConfirm) {
    var root = container.querySelector('#g-modal-root');
    root.innerHTML = `
      <div class="g-modal-overlay" id="g-modal-overlay">
        <div class="g-modal">
          <div class="g-modal-header">
            <span>${title}</span>
            <button style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.2rem" id="g-modal-close">&times;</button>
          </div>
          <div class="g-modal-body">${bodyHTML}</div>
          <div class="g-modal-footer">
            <button class="g-btn g-btn-secondary" id="g-modal-cancel">Cancelar</button>
            <button class="g-btn g-btn-primary" id="g-modal-confirm">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    root.querySelector('#g-modal-close').addEventListener('click', closeModal);
    root.querySelector('#g-modal-cancel').addEventListener('click', closeModal);
    root.querySelector('#g-modal-confirm').addEventListener('click', onConfirm);
    root.querySelector('#g-modal-overlay').addEventListener('click', function(e) {
      if (e.target === e.currentTarget) closeModal();
    });
  }

  function showConfirmModal(title, message, onConfirm) {
    showModal(title, '<p style="color:#64748B;font-size:.9rem">' + message + '</p>', function() {
      closeModal();
      onConfirm();
    });
  }

  function closeModal() {
    var root = container.querySelector('#g-modal-root');
    if (root) root.innerHTML = '';
  }

  /* ── Bootstrap ── */
  function loadData() {
    fetch('/api/gastos/bootstrap')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        // Load categorias
        state.categorias = data.categorias || [];

        for (var key of ['empleados', 'gastos_operativos', 'suscripciones', 'consultorias', 'financieros']) {
          if (data[key]) {
            data[key].forEach(function(item) { item._originalCosto = item.costo; });
          }
          state[key] = data[key] || [];
        }

        // Set tipo_cambio from first USD suscripcion if available
        state.suscripciones.forEach(function(s) {
          if (s.moneda === 'USD' && s.tipo_cambio) {
            tipoCambioGlobal = s.tipo_cambio;
          }
        });

        calcKPIs();
        renderContent();
        loadBaseScenario();
      })
      .catch(function(err) {
        var el = container.querySelector('#g-content');
        if (el) el.innerHTML = '<div style="text-align:center;padding:60px;color:#EF4444;font-size:.9rem;">Error al cargar datos. Verifica que el API este disponible.</div>';
        console.error('Gastos bootstrap error:', err);
      });
  }

  /* ── Public API ── */
  return {
    init: function(el) {
      container = el;
      state = { empleados: [], gastos_operativos: [], suscripciones: [], consultorias: [], financieros: [], categorias: [] };
      activeTab = 'nomina';
      searchTerm = '';
      tipoCambioGlobal = 17.5;
      categoryFilter = {};
      baseScenario = null;
      renderShell();
      loadData();
    },
    destroy: function() {
      // Clean up global handlers
      delete window.__gToggle;
      delete window.__gCostChange;
      delete window.__gSearch;
      delete window.__gDelete;
      delete window.__gShowAdd;
      delete window.__gEditField;
      delete window.__gCatChange;
      delete window.__gCatFilter;
      delete window.__gManageCats;
      delete window.__gMonedaChange;
      delete window.__gUsuariosChange;
      delete window.__gCostoPorUsuarioChange;
      delete window.__gTogglePorUsuario;
      delete window.__gTipoCambioChange;
      delete window.__gEsquemaChange;
      delete window.__gSueldoNetoChange;
      container = null;
    }
  };
})();
