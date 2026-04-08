/* ── Escenarios Module ── */
window.EscenariosModule = (function() {
  var container = null;
  var escenarios = [];
  var baseEscenario = null;
  var currentView = 'list'; // list | detail | compare
  var currentId = null;

  var fmt = function(n) { return '$' + Math.round(n).toLocaleString('es-MX'); };
  var fmtPct = function(n) { return n.toFixed(1) + '%'; };
  var fmtDate = function(s) {
    if (!s) return '';
    var d = new Date(s);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  var categoryLabels = {
    empleados: 'Nomina',
    gastos_operativos: 'Gastos Operativos',
    suscripciones: 'Suscripciones',
    consultorias: 'Consultorias',
    financieros: 'Gastos Financieros'
  };

  var CATS = ['empleados', 'gastos_operativos', 'suscripciones', 'consultorias', 'financieros'];

  function injectStyles() {
    if (container.querySelector('#esc-styles')) return;
    var style = document.createElement('style');
    style.id = 'esc-styles';
    style.textContent = `
      .esc-container{max-width:1440px;margin:0 auto;padding:24px}
      .esc-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px}
      .esc-header h2{font-size:1.3rem;font-weight:700;color:#1E293B}
      .esc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px}
      .esc-card{background:#fff;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)}
      .esc-card:hover{border-color:#CBD5E1;box-shadow:0 4px 6px rgba(0,0,0,.07),0 2px 4px rgba(0,0,0,.04)}
      .esc-card-top{padding:16px 20px;border-bottom:1px solid #E2E8F0}
      .esc-card-top h3{font-size:1rem;font-weight:600;margin-bottom:4px;color:#1E293B}
      .esc-card-top .desc{font-size:.8rem;color:#64748B;margin-bottom:6px}
      .esc-card-top .date{font-size:.72rem;color:#94A3B8}
      .esc-card-stats{padding:12px 20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .esc-stat .sl{font-size:.68rem;color:#94A3B8;text-transform:uppercase;letter-spacing:.3px}
      .esc-stat .sv{font-size:1rem;font-weight:700;color:#1E293B}
      .esc-stat .sv.green{color:#22C55E}
      .esc-card-actions{padding:10px 20px;border-top:1px solid #E2E8F0;display:flex;gap:6px;flex-wrap:wrap}
      .esc-btn{padding:6px 12px;border:none;border-radius:6px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
      .esc-btn-primary{background:#4C6EF5;color:#fff}
      .esc-btn-primary:hover{background:#3B5BDB}
      .esc-btn-secondary{background:transparent;border:1px solid #E2E8F0;color:#64748B}
      .esc-btn-secondary:hover{background:#F0F2F5;border-color:#CBD5E1}
      .esc-btn-success{background:#22C55E;color:#fff}
      .esc-btn-success:hover{background:#16a34a}
      .esc-btn-danger{background:#EF4444;color:#fff}
      .esc-btn-danger:hover{background:#DC2626}
      .esc-back{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:1px solid #E2E8F0;background:transparent;color:#64748B;cursor:pointer;border-radius:8px;font-size:.82rem;font-family:inherit;margin-bottom:16px;transition:all .15s}
      .esc-back:hover{color:#1E293B;border-color:#CBD5E1;background:#F0F2F5}
      .esc-empty{text-align:center;padding:80px 20px}
      .esc-empty .esc-empty-icon{font-size:64px;color:#94A3B8;margin-bottom:16px;line-height:1}
      .esc-empty h3{font-size:1.1rem;margin-bottom:8px;color:#1E293B;font-weight:600}
      .esc-empty p{font-size:.9rem;max-width:400px;margin:0 auto;color:#64748B}
      .esc-empty .esc-btn{margin-top:20px}
      .esc-panel{background:#fff;border-radius:8px;border:1px solid #E2E8F0;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)}
      .esc-panel-header{padding:14px 20px;border-bottom:1px solid #E2E8F0;font-weight:600;font-size:.9rem;color:#1E293B;display:flex;justify-content:space-between;align-items:center}
      .esc-table-wrap{overflow-x:auto}
      .esc-panel table{width:100%;border-collapse:collapse;font-size:.82rem}
      .esc-panel th{background:#F8FAFC;padding:10px 12px;text-align:left;font-weight:600;color:#94A3B8;text-transform:uppercase;font-size:.7rem;letter-spacing:.5px;position:sticky;top:0}
      .esc-panel td{padding:8px 12px;border-bottom:1px solid #E2E8F0;color:#1E293B}
      .esc-panel tfoot td{background:#F8FAFC;font-weight:700;border-top:2px solid #E2E8F0}
      .esc-panel tr.cut td{text-decoration:line-through;color:#94A3B8;background:#FEF2F2}
      .esc-panel tr.cut td:first-child{text-decoration:none}
      .esc-badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:.7rem;font-weight:600}
      .esc-badge-green{background:#F0FDF4;color:#15803D}
      .esc-badge-red{background:#FEF2F2;color:#DC2626}
      .esc-badge-muted{background:#F1F5F9;color:#64748B}
      .esc-badge-primary{background:#EDF2FF;color:#4C6EF5}
      .esc-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px}
      .esc-summary-card{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)}
      .esc-summary-card .sl{font-size:.7rem;color:#94A3B8;text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px}
      .esc-summary-card .sv{font-size:1.2rem;font-weight:700;color:#1E293B}
      .esc-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .esc-compare-col h3{font-size:.95rem;font-weight:700;margin-bottom:12px;padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #E2E8F0;color:#1E293B;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)}
      .esc-diff-row td{background:#FFFBEB}
      .esc-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
      .esc-modal{background:#fff;border:1px solid #E2E8F0;border-radius:12px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 20px 25px rgba(0,0,0,.1),0 10px 10px rgba(0,0,0,.04)}
      .esc-modal-header{padding:16px 20px;border-bottom:1px solid #E2E8F0;font-weight:600;color:#1E293B;display:flex;justify-content:space-between;align-items:center}
      .esc-modal-body{padding:20px;color:#64748B;font-size:.9rem}
      .esc-modal-footer{padding:12px 20px;border-top:1px solid #E2E8F0;display:flex;gap:8px;justify-content:flex-end}

      /* Base scenario card */
      .esc-base-card{background:#fff;border:2px solid #4C6EF5;border-radius:12px;overflow:hidden;margin-bottom:24px;box-shadow:0 4px 6px rgba(76,110,245,.1),0 2px 4px rgba(0,0,0,.04)}
      .esc-base-card .esc-card-top{padding:20px 24px;border-bottom:1px solid #E2E8F0;background:linear-gradient(135deg,#EDF2FF 0%,#fff 100%)}
      .esc-base-card .esc-card-top h3{font-size:1.15rem;font-weight:700;margin-bottom:6px;color:#1E293B;display:flex;align-items:center;gap:10px}
      .esc-base-card .esc-card-top .desc{font-size:.85rem;color:#64748B;margin-bottom:6px}
      .esc-base-card .esc-card-top .date{font-size:.75rem;color:#94A3B8}
      .esc-base-card .esc-card-stats{padding:16px 24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
      .esc-base-card .esc-stat .sv{font-size:1.15rem}
      .esc-base-card .esc-card-actions{padding:12px 24px;border-top:1px solid #E2E8F0;display:flex;gap:8px;flex-wrap:wrap}

      /* Section header for simulations */
      .esc-section-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;margin-top:8px}
      .esc-section-header h3{font-size:1rem;font-weight:700;color:#1E293B}
      .esc-section-header .esc-section-count{font-size:.75rem;color:#94A3B8;font-weight:500}
      .esc-section-divider{height:1px;background:#E2E8F0;flex:1}

      /* Ahorro vs base badge on sim cards */
      .esc-vs-base{display:flex;align-items:center;gap:6px;padding:8px 20px;background:#F8FAFC;font-size:.78rem;color:#64748B;border-top:1px solid #E2E8F0}
      .esc-vs-base strong{font-weight:700}

      @media(max-width:768px){
        .esc-container{padding:16px 12px}
        .esc-grid{grid-template-columns:1fr}
        .esc-compare-grid{grid-template-columns:1fr}
        .esc-base-card .esc-card-stats{grid-template-columns:1fr}
      }
    `;
    container.appendChild(style);
  }

  /* ── API ── */
  function fetchList() {
    return fetch('/api/escenarios/').then(function(r) { return r.json(); });
  }
  function fetchOne(id) {
    return fetch('/api/escenarios/' + id).then(function(r) { return r.json(); });
  }
  function fetchBase() {
    return fetch('/api/escenarios/base').then(function(r) { return r.json(); });
  }
  function deleteEscenario(id) {
    return fetch('/api/escenarios/' + id, { method: 'DELETE' }).then(function(r) {
      if (!r.ok) throw new Error('Error');
      return r.json();
    });
  }
  function applyEscenario(id) {
    return fetch('/api/escenarios/' + id + '/apply', { method: 'POST' }).then(function(r) {
      if (!r.ok) throw new Error('Error');
      return r.json();
    });
  }
  function fetchBootstrap() {
    return fetch('/api/gastos/bootstrap').then(function(r) { return r.json(); });
  }

  /* ── Render: List ── */
  function renderList() {
    currentView = 'list';
    var main = container.querySelector('#esc-main');

    // Separate base from simulations
    baseEscenario = null;
    var simulations = [];
    escenarios.forEach(function(esc) {
      if (esc.es_base) {
        baseEscenario = esc;
      } else {
        simulations.push(esc);
      }
    });

    // No base at all
    if (!baseEscenario) {
      main.innerHTML = `
        <div class="esc-container">
          <div class="esc-empty">
            <div class="esc-empty-icon">&#128202;</div>
            <h3>No has guardado un presupuesto base</h3>
            <p>Ve al Configurador y guarda tu estado actual como base.</p>
          </div>
        </div>
      `;
      return;
    }

    // Build base card
    var baseHTML = renderBaseCard(baseEscenario);

    // Build simulations section
    var simsHTML = '';
    if (simulations.length === 0) {
      simsHTML = `
        <div class="esc-section-header">
          <h3>Simulaciones</h3>
          <div class="esc-section-divider"></div>
        </div>
        <div class="esc-empty" style="padding:40px 20px">
          <div class="esc-empty-icon" style="font-size:48px">&#128300;</div>
          <h3>No hay simulaciones</h3>
          <p>Crea escenarios en el Configurador para comparar alternativas.</p>
        </div>
      `;
    } else {
      var simCards = simulations.map(function(esc) {
        var savePct = esc.total_original > 0 ? (esc.ahorro / esc.total_original * 100) : 0;
        var saveBadge = esc.ahorro >= 0
          ? '<span class="esc-badge esc-badge-green">' + fmtPct(savePct) + ' ahorro</span>'
          : '<span class="esc-badge esc-badge-red">' + fmtPct(Math.abs(savePct)) + ' aumento</span>';

        // Calculate delta vs base
        var deltaVsBase = baseEscenario ? (baseEscenario.total_nuevo - esc.total_nuevo) : 0;
        var deltaVsBasePct = baseEscenario && baseEscenario.total_nuevo > 0 ? (deltaVsBase / baseEscenario.total_nuevo * 100) : 0;
        var vsBaseHTML = '';
        if (baseEscenario) {
          var vsColor = deltaVsBase >= 0 ? '#22C55E' : '#EF4444';
          var vsSign = deltaVsBase >= 0 ? '+' : '';
          vsBaseHTML = `
            <div class="esc-vs-base">
              vs Base: <strong style="color:${vsColor}">${vsSign}${fmt(deltaVsBase)}</strong>
              <span style="color:${vsColor}">(${vsSign}${fmtPct(Math.abs(deltaVsBasePct))})</span>
            </div>
          `;
        }

        return `
          <div class="esc-card">
            <div class="esc-card-top">
              <h3>${esc.nombre} ${saveBadge}</h3>
              <div class="desc">${esc.descripcion || 'Sin descripcion'}</div>
              <div class="date">${fmtDate(esc.created_at || esc.updated_at)}</div>
            </div>
            <div class="esc-card-stats">
              <div class="esc-stat"><div class="sl">Original</div><div class="sv">${fmt(esc.total_original)}</div></div>
              <div class="esc-stat"><div class="sl">Nuevo</div><div class="sv">${fmt(esc.total_nuevo)}</div></div>
              <div class="esc-stat"><div class="sl">Ahorro</div><div class="sv green">${fmt(esc.ahorro)}</div></div>
            </div>
            ${vsBaseHTML}
            <div class="esc-card-actions">
              <button class="esc-btn esc-btn-primary" onclick="window.__escDetail(${esc.id})">Ver Detalle</button>
              <button class="esc-btn esc-btn-secondary" onclick="window.__escCompareVsBase(${esc.id})">Comparar vs Base</button>
              <button class="esc-btn esc-btn-secondary" onclick="window.__escExport(${esc.id})">&#8615; Exportar CSV</button>
              <button class="esc-btn esc-btn-success" onclick="window.__escApply(${esc.id})">Aplicar</button>
              <button class="esc-btn esc-btn-danger" onclick="window.__escDelete(${esc.id})">Eliminar</button>
            </div>
          </div>
        `;
      }).join('');

      simsHTML = `
        <div class="esc-section-header">
          <h3>Simulaciones</h3>
          <span class="esc-section-count">${simulations.length} escenario${simulations.length !== 1 ? 's' : ''}</span>
          <div class="esc-section-divider"></div>
        </div>
        <div class="esc-grid">${simCards}</div>
      `;
    }

    main.innerHTML = `
      <div class="esc-container">
        <div class="esc-header"><h2>Escenarios Guardados</h2></div>
        ${baseHTML}
        ${simsHTML}
      </div>
    `;
  }

  function renderBaseCard(esc) {
    var savePct = esc.total_original > 0 ? (esc.ahorro / esc.total_original * 100) : 0;
    return `
      <div class="esc-base-card">
        <div class="esc-card-top">
          <h3>
            ${esc.nombre}
            <span class="esc-badge esc-badge-primary">PRESUPUESTO BASE</span>
          </h3>
          <div class="desc">${esc.descripcion || 'Estado actual del presupuesto'}</div>
          <div class="date">${fmtDate(esc.created_at || esc.updated_at)}</div>
        </div>
        <div class="esc-card-stats">
          <div class="esc-stat"><div class="sl">Gasto Original</div><div class="sv">${fmt(esc.total_original)}</div></div>
          <div class="esc-stat"><div class="sl">Gasto Actual</div><div class="sv">${fmt(esc.total_nuevo)}</div></div>
          <div class="esc-stat"><div class="sl">Ahorro</div><div class="sv green">${fmt(esc.ahorro)} (${fmtPct(savePct)})</div></div>
        </div>
        <div class="esc-card-actions">
          <button class="esc-btn esc-btn-primary" onclick="window.__escDetail(${esc.id})">Ver Detalle</button>
          <button class="esc-btn esc-btn-secondary" onclick="window.__escExport(${esc.id})">&#8615; Exportar CSV</button>
        </div>
      </div>
    `;
  }

  /* ── Render: Detail ── */
  function renderDetail(esc) {
    currentView = 'detail';
    currentId = esc.id;
    var main = container.querySelector('#esc-main');
    var snap = esc.snapshot || {};

    var savePct = esc.total_original > 0 ? (esc.ahorro / esc.total_original * 100) : 0;

    var isBase = esc.es_base;
    var titleSuffix = isBase ? ' <span class="esc-badge esc-badge-primary">PRESUPUESTO BASE</span>' : '';

    var summaryHTML = `
      <div class="esc-summary">
        <div class="esc-summary-card"><div class="sl">Gasto Original</div><div class="sv">${fmt(esc.total_original)}</div></div>
        <div class="esc-summary-card"><div class="sl">Gasto Nuevo</div><div class="sv">${fmt(esc.total_nuevo)}</div></div>
        <div class="esc-summary-card"><div class="sl">Ahorro</div><div class="sv" style="color:#22C55E">${fmt(esc.ahorro)} (${fmtPct(savePct)})</div></div>
      </div>
    `;

    var tablesHTML = '';
    CATS.forEach(function(cat) {
      var items = snap[cat] || [];
      if (items.length === 0) return;

      var catOrig = 0, catNew = 0;
      items.forEach(function(item) {
        catOrig += item.costo || 0;
        catNew += item.cortado ? 0 : (item.costo || 0);
      });

      var rows = items.map(function(item) {
        return '<tr class="' + (item.cortado ? 'cut' : '') + '">' +
          '<td>' + item.nombre + '</td>' +
          '<td style="text-align:right">' + fmt(item.costo) + '</td>' +
          '<td style="text-align:right">' + fmt(item.cortado ? 0 : item.costo) + '</td>' +
          '<td>' + (item.cortado ? '<span class="esc-badge esc-badge-red">CORTADO</span>' : '<span class="esc-badge esc-badge-green">ACTIVO</span>') + '</td>' +
          '</tr>';
      }).join('');

      tablesHTML += `
        <div class="esc-panel">
          <div class="esc-panel-header">
            <span>${categoryLabels[cat]}</span>
            <span style="font-size:.82rem;color:#94A3B8">Ahorro: <span style="color:#22C55E">${fmt(catOrig - catNew)}</span></span>
          </div>
          <div class="esc-table-wrap"><table>
            <thead><tr><th>Nombre</th><th style="text-align:right">Costo</th><th style="text-align:right">Nuevo</th><th>Estado</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td>TOTAL</td><td style="text-align:right">${fmt(catOrig)}</td><td style="text-align:right">${fmt(catNew)}</td><td></td></tr></tfoot>
          </table></div>
        </div>
      `;
    });

    main.innerHTML = `
      <div class="esc-container">
        <button class="esc-back" onclick="window.__escBack()">&larr; Volver a escenarios</button>
        <div class="esc-header">
          <div>
            <h2>${esc.nombre}${titleSuffix}</h2>
            <p style="font-size:.85rem;color:#64748B;margin-top:4px">${esc.descripcion || ''}</p>
          </div>
          <span style="font-size:.78rem;color:#94A3B8">${fmtDate(esc.created_at || esc.updated_at)}</span>
        </div>
        ${summaryHTML}
        ${tablesHTML}
      </div>
    `;
  }

  /* ── Render: Compare vs Base ── */
  function renderCompare(esc, baseData) {
    currentView = 'compare';
    currentId = esc.id;
    var main = container.querySelector('#esc-main');
    var simSnap = esc.snapshot || {};
    var baseSnap = baseData.snapshot || {};

    // Calculate base totals from snapshot
    var baseTotal = 0;
    CATS.forEach(function(cat) {
      (baseSnap[cat] || []).forEach(function(item) {
        baseTotal += item.cortado ? 0 : (item.costo || 0);
      });
    });
    var simTotal = esc.total_nuevo;
    var delta = baseTotal - simTotal;
    var deltaPct = baseTotal > 0 ? (delta / baseTotal * 100) : 0;

    var summaryHTML = `
      <div class="esc-summary">
        <div class="esc-summary-card" style="border-color:#4C6EF5;border-width:2px">
          <div class="sl">Presupuesto Base</div>
          <div class="sv">${fmt(baseTotal)}/mes</div>
        </div>
        <div class="esc-summary-card">
          <div class="sl">Simulacion: ${esc.nombre}</div>
          <div class="sv">${fmt(simTotal)}/mes</div>
        </div>
        <div class="esc-summary-card">
          <div class="sl">Ahorro vs Base</div>
          <div class="sv" style="color:${delta >= 0 ? '#22C55E' : '#EF4444'}">${delta >= 0 ? '+' : ''}${fmt(delta)}/mes (${fmtPct(Math.abs(deltaPct))})</div>
        </div>
      </div>
    `;

    var tablesHTML = '';
    CATS.forEach(function(cat) {
      var baseItems = baseSnap[cat] || [];
      var simItems = simSnap[cat] || [];

      // Build lookup by id
      var baseMap = {};
      baseItems.forEach(function(item) { baseMap[item.id] = item; });
      var simMap = {};
      simItems.forEach(function(item) { simMap[item.id] = item; });

      // Merge all IDs
      var allIds = {};
      baseItems.forEach(function(i) { allIds[i.id] = true; });
      simItems.forEach(function(i) { allIds[i.id] = true; });
      var ids = Object.keys(allIds).map(Number).sort(function(a,b){return a-b;});

      if (ids.length === 0) return;

      var rows = ids.map(function(id) {
        var b = baseMap[id];
        var s = simMap[id];
        var nombre = (b && b.nombre) || (s && s.nombre) || '?';
        var baseVal = b ? (b.cortado ? 0 : b.costo) : 0;
        var simVal = s ? (s.cortado ? 0 : s.costo) : 0;
        var diff = baseVal - simVal;
        var isDiff = Math.abs(diff) > 0.5;
        return '<tr class="' + (isDiff ? 'esc-diff-row' : '') + '">' +
          '<td>' + nombre + '</td>' +
          '<td style="text-align:right">' + fmt(baseVal) + '</td>' +
          '<td style="text-align:right">' + fmt(simVal) + '</td>' +
          '<td style="text-align:right;color:' + (diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#94A3B8') + '">' + (diff > 0 ? '+' : '') + fmt(diff) + '</td>' +
          '</tr>';
      }).join('');

      var catBaseTotal = 0, catSimTotal = 0;
      ids.forEach(function(id) {
        var b = baseMap[id];
        var s = simMap[id];
        catBaseTotal += b ? (b.cortado ? 0 : b.costo) : 0;
        catSimTotal += s ? (s.cortado ? 0 : s.costo) : 0;
      });
      var catDiff = catBaseTotal - catSimTotal;

      tablesHTML += `
        <div class="esc-panel">
          <div class="esc-panel-header">
            <span>${categoryLabels[cat]}</span>
            <span style="font-size:.82rem;color:${catDiff >= 0 ? '#22C55E' : '#EF4444'}">Diferencia: ${catDiff >= 0 ? '+' : ''}${fmt(catDiff)}</span>
          </div>
          <div class="esc-table-wrap"><table>
            <thead><tr><th>Nombre</th><th style="text-align:right">Base</th><th style="text-align:right">Simulacion</th><th style="text-align:right">Diferencia</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr>
              <td>TOTAL</td>
              <td style="text-align:right">${fmt(catBaseTotal)}</td>
              <td style="text-align:right">${fmt(catSimTotal)}</td>
              <td style="text-align:right;color:${catDiff >= 0 ? '#22C55E' : catDiff < 0 ? '#EF4444' : '#94A3B8'}">${catDiff >= 0 ? '+' : ''}${fmt(catDiff)}</td>
            </tr></tfoot>
          </table></div>
        </div>
      `;
    });

    main.innerHTML = `
      <div class="esc-container">
        <button class="esc-back" onclick="window.__escBack()">&larr; Volver a escenarios</button>
        <div class="esc-header">
          <h2>Presupuesto Base vs ${esc.nombre}</h2>
        </div>
        ${summaryHTML}
        ${tablesHTML}
      </div>
    `;
  }

  /* ── Modal ── */
  function showModal(title, body, onConfirm) {
    var root = container.querySelector('#esc-modal-root');
    root.innerHTML = `
      <div class="esc-modal-overlay" id="esc-modal-overlay">
        <div class="esc-modal">
          <div class="esc-modal-header">
            <span>${title}</span>
            <button style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.2rem" id="esc-modal-close">&times;</button>
          </div>
          <div class="esc-modal-body">${body}</div>
          <div class="esc-modal-footer">
            <button class="esc-btn esc-btn-secondary" id="esc-modal-cancel">Cancelar</button>
            <button class="esc-btn esc-btn-primary" id="esc-modal-confirm">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    var close = function() { root.innerHTML = ''; };
    root.querySelector('#esc-modal-close').addEventListener('click', close);
    root.querySelector('#esc-modal-cancel').addEventListener('click', close);
    root.querySelector('#esc-modal-confirm').addEventListener('click', function() {
      close();
      onConfirm();
    });
    root.querySelector('#esc-modal-overlay').addEventListener('click', function(e) {
      if (e.target === e.currentTarget) close();
    });
  }

  /* ── Actions (global handlers) ── */
  window.__escBack = function() {
    loadAndRenderList();
  };

  window.__escDetail = function(id) {
    fetchOne(id).then(renderDetail).catch(function() {
      window.__toast('Error al cargar escenario', 'error');
    });
  };

  window.__escCompare = function(id) {
    Promise.all([fetchOne(id), fetchBootstrap()]).then(function(results) {
      renderCompare(results[0], results[1]);
    }).catch(function() {
      window.__toast('Error al cargar datos para comparar', 'error');
    });
  };

  window.__escCompareVsBase = function(id) {
    Promise.all([fetchOne(id), fetchBase()]).then(function(results) {
      var sim = results[0];
      var base = results[1];
      if (!base || !base.id) {
        window.__toast('No hay presupuesto base para comparar', 'error');
        return;
      }
      renderCompare(sim, base);
    }).catch(function() {
      window.__toast('Error al cargar datos para comparar', 'error');
    });
  };

  window.__escExport = function(id) {
    window.open('/api/escenarios/' + id + '/export', '_blank');
  };

  window.__escApply = function(id) {
    var esc = escenarios.find(function(e) { return e.id === id; });
    var name = esc ? esc.nombre : 'este escenario';
    showModal('Aplicar Escenario', '<p>Esto aplicara el escenario <strong>' + name + '</strong> a los datos actuales. Los costos y estados de corte se actualizaran en la base de datos.</p><p style="margin-top:8px;color:#F59E0B">Esta accion no se puede deshacer.</p>', function() {
      applyEscenario(id).then(function() {
        window.__toast('Escenario aplicado correctamente', 'success');
      }).catch(function() {
        window.__toast('Error al aplicar escenario', 'error');
      });
    });
  };

  window.__escDelete = function(id) {
    showModal('Eliminar Escenario', '<p>Seguro que quieres eliminar este escenario? Esta accion no se puede deshacer.</p>', function() {
      deleteEscenario(id).then(function() {
        escenarios = escenarios.filter(function(e) { return e.id !== id; });
        renderList();
        window.__toast('Escenario eliminado', 'success');
      }).catch(function() {
        window.__toast('Error al eliminar escenario', 'error');
      });
    });
  };

  /* ── Load ── */
  function loadAndRenderList() {
    fetchList().then(function(data) {
      escenarios = data;
      renderList();
    }).catch(function() {
      var main = container.querySelector('#esc-main');
      if (main) main.innerHTML = '<div class="esc-container"><div class="esc-empty"><div class="esc-empty-icon">&#9888;</div><h3>Error al cargar escenarios</h3><p>Verifica que el API este disponible.</p></div></div>';
    });
  }

  /* ── Public API ── */
  return {
    init: function(el) {
      container = el;
      injectStyles();
      container.innerHTML += '<div id="esc-main"><div style="text-align:center;padding:60px;color:#94A3B8">Cargando escenarios...</div></div><div id="esc-modal-root"></div>';
      loadAndRenderList();
    },
    destroy: function() {
      delete window.__escBack;
      delete window.__escDetail;
      delete window.__escCompare;
      delete window.__escCompareVsBase;
      delete window.__escExport;
      delete window.__escApply;
      delete window.__escDelete;
      container = null;
    }
  };
})();
