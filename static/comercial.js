/* ── Comercial Module (Arquitectura Comercial) ── */
window.ComercialModule = (function() {
  var container = null;
  var state = {
    phases: [],
    touchpoints: [],
    frictions: [],
    trust_pillars: [],
    iniciativas: [],
    kpis: [],
    activity_log: [],
    comments: [],
    people: [],
    kpi_frictions: [],
    kpi_touchpoints: [],
    tp_kpi_history: [],
    kpi_history: [],
    canvas_layout: [],
    canvas_notes: [],
    touchpoint_flows: [],
    dashboard: null
  };
  var activeTab = 'dashboard';
  var iniciativasFilter = { status: 'all', responsable: 'all', priority: 'all', area: 'all', tipo: 'all', text: '' };

  function priorityBadge(p) {
    var cfg = { high: ['Alta','#FEE2E2','#DC2626'], medium: ['Media','#FEF3C7','#B45309'], low: ['Baja','#F1F5F9','#64748B'] };
    var v = cfg[p] || cfg.medium;
    return '<span style="display:inline-block;font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:9999px;background:' + v[1] + ';color:' + v[2] + ';text-transform:uppercase;letter-spacing:.3px">' + v[0] + '</span>';
  }
  function tipoBadge(t) {
    var cfg = { estrategica: ['Estratégica','#EEF2FF','#4F46E5'], operativa: ['Operativa','#F0FDF4','#15803D'], hito: ['Hito','#FFF7ED','#C2410C'] };
    var v = cfg[t] || cfg.operativa;
    return '<span style="display:inline-block;font-size:.66rem;font-weight:600;padding:2px 8px;border-radius:6px;background:' + v[1] + ';color:' + v[2] + '">' + v[0] + '</span>';
  }
  function frictionName(fid) {
    var f = (state.frictions || []).find(function(x) { return String(x.id) === String(fid); });
    return f ? f.name : ('F-' + fid);
  }
  var kpiSegFilter = { phase: 'all', responsable: 'all', status: 'all', search: '' };
  var expandedKpis = {};
  var frictionFilterImpact = 'all';
  var frictionFilterStatus = 'all';
  var frictionFilterPhase = 'all';
  var frictionSearch = '';
  var expandedFrictions = {};
  var pendingPhaseClick = null;
  var pendingCanvasFocus = null;
  var selectedPhase = 'atraccion';
  var collapsedBands = {};
  var kpiBoardView = 'monthly';
  var kpiBoardShowAll = false;

  /* ── Helpers ── */
  var escHtml = function(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };

  var fmtPct = function(n) { return (n || 0).toFixed(1) + '%'; };

  var toast = function(msg, type) {
    if (window.__toast) window.__toast(msg, type || 'success');
  };

  function relativeTime(dateStr) {
    if (!dateStr) return '';
    var now = new Date();
    var d = new Date(dateStr);
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'hace unos segundos';
    if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + (Math.floor(diff / 3600) === 1 ? ' hora' : ' horas');
    var days = Math.floor(diff / 86400);
    if (days === 1) return 'hace 1 dia';
    if (days < 30) return 'hace ' + days + ' dias';
    var months = Math.floor(days / 30);
    return 'hace ' + months + (months === 1 ? ' mes' : ' meses');
  }

  function daysDiff(dateStr) {
    if (!dateStr) return null;
    var now = new Date(); now.setHours(0,0,0,0);
    var d = new Date(dateStr); d.setHours(0,0,0,0);
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function deadlineBand(dateStr) {
    var days = daysDiff(dateStr);
    if (days === null) return 'sin-fecha';
    if (days < 0) return 'vencidas';
    if (days <= 14) return 'semana-1-2';
    if (days <= 28) return 'semana-3-4';
    if (days <= 60) return 'mes-2';
    return 'mes-3';
  }

  var bandLabels = {
    'vencidas': 'Vencidas',
    'semana-1-2': 'Semana 1-2 (Alto)',
    'semana-3-4': 'Semana 3-4',
    'mes-2': 'Mes 2 (Medio)',
    'mes-3': 'Mes 3+ (Acum.)',
    'sin-fecha': 'Sin Fecha'
  };
  var bandColors = {
    'vencidas': '#EF4444',
    'semana-1-2': '#EF4444',
    'semana-3-4': '#F59E0B',
    'mes-2': '#22C55E',
    'mes-3': '#22C55E',
    'sin-fecha': '#94A3B8'
  };
  var bandOrder = ['vencidas', 'semana-1-2', 'semana-3-4', 'mes-2', 'mes-3', 'sin-fecha'];

  function getWeekNumber(d) {
    var onejan = new Date(d.getFullYear(), 0, 1);
    var dayOfYear = Math.ceil((d - onejan + 86400000) / 86400000);
    return Math.ceil(dayOfYear / 7);
  }

  function impactBadge(impact) {
    var cls = impact === 'high' ? 'cm-badge-red' : impact === 'medium' ? 'cm-badge-yellow' : 'cm-badge-blue';
    var label = impact === 'high' ? 'ALTO' : impact === 'medium' ? 'MEDIO' : 'BAJO';
    return '<span class="cm-badge ' + cls + '">' + label + '</span>';
  }

  function statusLabel(s) {
    if (s === 'completed') return 'Completado';
    if (s === 'in_progress') return 'En ejecución';
    if (s === 'analysis') return 'En análisis';
    if (s === 'validation') return 'Validación';
    return 'Abierta';
  }

  function statusBadge(s) {
    var cls = s === 'completed' ? 'cm-badge-green'
      : s === 'in_progress' ? 'cm-badge-purple'
      : s === 'analysis' ? 'cm-badge-yellow'
      : s === 'validation' ? 'cm-badge-primary'
      : 'cm-badge-gray';
    return '<span class="cm-badge ' + cls + '">' + statusLabel(s) + '</span>';
  }

  function initiativeStatusLabel(s) {
    if (s === 'completed') return 'Completada';
    if (s === 'in_progress') return 'En ejecución';
    return 'Abierta';
  }

  /** Prioridad visual de fila: vencida > vence pronto > sin responsable > normal */
  function initiativeRowClass(i) {
    var st = i.status || 'pending';
    if (st === 'completed') return 'cm-ini-row cm-ini-row--done';
    var dd = i.due_date ? daysDiff(i.due_date) : null;
    if (dd !== null && dd < 0) return 'cm-ini-row cm-ini-row--overdue';
    if (dd !== null && dd <= 7) return 'cm-ini-row cm-ini-row--soon';
    if (!i.responsable_id) return 'cm-ini-row cm-ini-row--unassigned';
    return 'cm-ini-row';
  }

  function initiativePriorityChip(i) {
    var st = i.status || 'pending';
    if (st === 'completed') return '';
    var dd = i.due_date ? daysDiff(i.due_date) : null;
    if (dd !== null && dd < 0) return '<span class="cm-ini-pri cm-ini-pri--overdue">Vencida</span>';
    if (dd !== null && dd <= 7) return '<span class="cm-ini-pri cm-ini-pri--soon">Próxima</span>';
    return '';
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  function personName(personId) {
    if (!personId) return '';
    var p = state.people.find(function(p) { return p.id == personId; });
    return p ? p.name : '';
  }

  function phaseName(phaseId) {
    if (!phaseId) return '';
    var p = state.phases.find(function(pp) { return String(pp.id) === String(phaseId); });
    return p ? p.name : '';
  }

  function personSelect(selectedId, fieldId, includeEmpty) {
    var html = '<select class="cm-select" id="' + fieldId + '" style="width:100%">';
    if (includeEmpty !== false) html += '<option value="">Sin asignar</option>';
    state.people.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id == selectedId ? ' selected' : '') + '>' + escHtml(p.name + (p.role ? ' (' + p.role + ')' : '')) + '</option>';
    });
    html += '</select>';
    return html;
  }

  function touchpointName(tpId) {
    if (tpId == null || tpId === '') return '';
    var t = state.touchpoints.find(function(x) { return String(x.id) === String(tpId); });
    return t ? ('#' + t.id + ' ' + t.name) : '';
  }

  function touchpointSelect(phaseId, selectedTpId, fieldId) {
    var html = '<select class="cm-select" id="' + fieldId + '" style="width:100%">';
    html += '<option value="">Sin vincular a touchpoint</option>';
    state.touchpoints.filter(function(t) { return String(t.phase_id) === String(phaseId); }).forEach(function(t) {
      html += '<option value="' + t.id + '"' + (String(t.id) === String(selectedTpId) ? ' selected' : '') + '>#' + t.id + ' ' + escHtml(t.name) + '</option>';
    });
    html += '</select>';
    return html;
  }

  function personAvatar(personId, size) {
    size = size || 28;
    var p = state.people.find(function(pp) { return pp.id == personId; });
    if (!p) return '<span class="cm-avatar" style="width:' + size + 'px;height:' + size + 'px;background:var(--text-muted);font-size:' + Math.round(size*0.4) + 'px">?</span>';
    return '<span class="cm-avatar" style="width:' + size + 'px;height:' + size + 'px;background:' + escHtml(p.avatar_color || '#4C6EF5') + ';font-size:' + Math.round(size*0.4) + 'px">' + escHtml(initials(p.name)) + '</span>';
  }

  function phaseMap() {
    var m = {};
    state.phases.forEach(function(ph) { m[ph.id] = ph; });
    return m;
  }

  function getLinkedKpisForFriction(frictionId) {
    return state.kpi_frictions.filter(function(lk) { return String(lk.friction_id) === String(frictionId); }).map(function(lk) { return lk.kpi_id; });
  }

  function getLinkedKpisForTouchpoint(tpId) {
    return state.kpi_touchpoints.filter(function(lk) { return lk.touchpoint_id == tpId; }).map(function(lk) { return lk.kpi_id; });
  }

  function kpiCheckboxes(selectedIds, prefix) {
    var html = '<div class="cm-kpi-checks">';
    state.kpis.forEach(function(k) {
      var checked = selectedIds.indexOf(k.id) >= 0;
      html += '<label class="cm-kpi-check-label">';
      html += '<input type="checkbox" value="' + escHtml(k.id) + '" ' + (checked ? 'checked' : '') + ' class="' + prefix + '-kpi-cb">';
      html += ' <span class="cm-kpi-check-name">' + escHtml(k.name) + '</span>';
      html += ' <span class="cm-kpi-check-unit">(' + escHtml(k.unit || '') + ')</span>';
      html += '</label>';
    });
    html += '</div>';
    return html;
  }

  function kpiBadges(kpiIds) {
    if (!kpiIds || kpiIds.length === 0) return '';
    var html = '';
    kpiIds.forEach(function(kid) {
      var k = state.kpis.find(function(kk) { return kk.id === kid; });
      if (k) {
        html += '<span class="cm-badge cm-badge-primary" style="font-size:.64rem;margin-right:3px">' + escHtml(k.name) + '</span>';
      }
    });
    return html;
  }

  /**
   * Renders a chip input for KPIs.
   * @param {string} containerId - unique DOM id for this chip input
   * @param {string[]} masterKpiIds - pre-selected master KPI ids (linked)
   * @param {string} customKpiText - existing KPI text field (comma-separated free-text KPIs)
   * @returns {string} HTML string
   */
  function kpiChipInputHtml(containerId, masterKpiIds, customKpiText) {
    var customChips = [];
    if (customKpiText) {
      customKpiText.split(',').forEach(function(s) {
        var t = s.trim();
        if (t) customChips.push(t);
      });
    }
    var html = '<div class="cm-chip-suggestions" id="' + containerId + '-wrap">';
    html += '<div class="cm-chip-input-wrap" id="' + containerId + '">';
    // Master KPI chips (green)
    state.kpis.forEach(function(k) {
      var selected = masterKpiIds.indexOf(k.id) >= 0;
      if (selected) {
        html += '<span class="cm-chip cm-chip-master" data-kpi-id="' + escHtml(k.id) + '" data-type="master">';
        html += escHtml(k.name);
        html += '<span class="cm-chip-x" data-remove="' + escHtml(k.id) + '">&times;</span></span>';
      }
    });
    // Custom KPI chips (blue)
    customChips.forEach(function(c) {
      // Skip if it matches a master KPI name (avoid duplicates)
      var isMaster = state.kpis.some(function(k) { return k.name.toLowerCase() === c.toLowerCase(); });
      if (!isMaster) {
        html += '<span class="cm-chip" data-type="custom" data-value="' + escHtml(c) + '">';
        html += escHtml(c);
        html += '<span class="cm-chip-x" data-remove-custom="' + escHtml(c) + '">&times;</span></span>';
      }
    });
    html += '<input type="text" class="cm-chip-text-input" id="' + containerId + '-input" placeholder="Escribe un KPI y presiona Enter...">';
    html += '</div>';
    html += '</div>'; // suggestions wrap
    return html;
  }

  function bindKpiChipInput(containerId) {
    var wrap = document.querySelector('#' + containerId);
    var input = document.querySelector('#' + containerId + '-input');
    var sugWrap = document.querySelector('#' + containerId + '-wrap');
    if (!wrap || !input) return;

    // Click on wrap focuses input
    wrap.addEventListener('click', function() { input.focus(); });

    // Remove chip
    wrap.addEventListener('click', function(e) {
      if (e.target.classList.contains('cm-chip-x')) {
        e.stopPropagation();
        var chip = e.target.closest('.cm-chip');
        if (chip) chip.remove();
      }
    });

    // Input: Enter to create chip, show dropdown on focus/type
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        addCustomChip(containerId, this.value.trim());
        this.value = '';
        hideDropdown();
      }
      if (e.key === 'Backspace' && !this.value) {
        // Remove last chip
        var chips = wrap.querySelectorAll('.cm-chip');
        if (chips.length > 0) chips[chips.length - 1].remove();
      }
    });

    // Show dropdown on focus
    input.addEventListener('focus', function() { showDropdown(containerId, this.value); });
    input.addEventListener('input', function() { showDropdown(containerId, this.value); });

    // Hide dropdown on click outside
    document.addEventListener('click', function handler(e) {
      if (!sugWrap.contains(e.target)) { hideDropdown(); }
    });

    function hideDropdown() {
      var dd = sugWrap.querySelector('.cm-chip-dropdown');
      if (dd) dd.remove();
    }

    function showDropdown(cid, query) {
      hideDropdown();
      var currentMasterIds = getChipMasterIds(cid);
      var unselected = state.kpis.filter(function(k) { return currentMasterIds.indexOf(k.id) < 0; });
      if (unselected.length === 0 && !query) return;

      var dd = document.createElement('div');
      dd.className = 'cm-chip-dropdown';

      if (unselected.length > 0) {
        var header = document.createElement('div');
        header.className = 'cm-chip-dropdown-header';
        header.textContent = 'KPIs maestros';
        dd.appendChild(header);
        unselected.forEach(function(k) {
          var item = document.createElement('div');
          item.className = 'cm-chip-dropdown-item';
          item.innerHTML = '<span style="color:var(--success)">&#9679;</span> ' + escHtml(k.name) + ' <span style="color:var(--text-muted);font-size:.7rem">(' + escHtml(k.unit || '') + ')</span>';
          item.addEventListener('click', function(e) {
            e.stopPropagation();
            addMasterChip(cid, k.id, k.name);
            hideDropdown();
            input.value = '';
            input.focus();
          });
          dd.appendChild(item);
        });
      }

      if (query && query.trim()) {
        var div = document.createElement('div');
        div.className = 'cm-chip-dropdown-divider';
        dd.appendChild(div);
        var createItem = document.createElement('div');
        createItem.className = 'cm-chip-dropdown-item';
        createItem.innerHTML = '<span style="color:var(--primary)">+</span> Crear "' + escHtml(query.trim()) + '"';
        createItem.addEventListener('click', function(e) {
          e.stopPropagation();
          addCustomChip(cid, query.trim());
          hideDropdown();
          input.value = '';
          input.focus();
        });
        dd.appendChild(createItem);
      }

      sugWrap.appendChild(dd);
    }

    function addMasterChip(cid, kpiId, kpiName) {
      var w = document.querySelector('#' + cid);
      var inp = document.querySelector('#' + cid + '-input');
      var chip = document.createElement('span');
      chip.className = 'cm-chip cm-chip-master';
      chip.dataset.kpiId = kpiId;
      chip.dataset.type = 'master';
      chip.innerHTML = escHtml(kpiName) + '<span class="cm-chip-x" data-remove="' + escHtml(kpiId) + '">&times;</span>';
      w.insertBefore(chip, inp);
    }

    function addCustomChip(cid, text) {
      var w = document.querySelector('#' + cid);
      var inp = document.querySelector('#' + cid + '-input');
      // Generate slug
      var slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      // Check if already exists as master chip
      var existingMaster = w.querySelectorAll('.cm-chip[data-kpi-id="' + slug + '"]');
      if (existingMaster.length > 0) return;
      // Create KPI as real entity via API, then add as master chip
      apiPost('kpis', { id: slug, name: text.trim() }).then(function(created) {
        // Add to local state if not already there
        if (!state.kpis.find(function(k) { return k.id === created.id; })) {
          state.kpis.push(created);
        }
        addMasterChip(cid, created.id, created.name);
        toast('KPI "' + text + '" creado', 'success');
      }).catch(function() {
        // If creation fails (maybe exists), still add as master chip
        addMasterChip(cid, slug, text);
      });
    }
  }

  function getChipMasterIds(containerId) {
    var ids = [];
    var wrap = document.querySelector('#' + containerId);
    if (!wrap) return ids;
    wrap.querySelectorAll('.cm-chip[data-type="master"]').forEach(function(chip) {
      ids.push(chip.dataset.kpiId);
    });
    return ids;
  }

  function getChipCustomTexts(containerId) {
    var texts = [];
    var wrap = document.querySelector('#' + containerId);
    if (!wrap) return texts;
    wrap.querySelectorAll('.cm-chip[data-type="custom"]').forEach(function(chip) {
      texts.push(chip.dataset.value);
    });
    return texts;
  }

  /**
   * Renders a chip input for Frictions on a touchpoint.
   * Shows existing linked frictions as chips, allows selecting existing or creating new.
   */
  function frictionChipInputHtml(containerId, touchpointId, phaseId) {
    // Find frictions already linked to this touchpoint
    var linked = state.frictions.filter(function(f) { return f.touchpoint_id == touchpointId; });
    var html = '<div class="cm-chip-suggestions" id="' + containerId + '-wrap">';
    html += '<div class="cm-chip-input-wrap" id="' + containerId + '">';
    linked.forEach(function(f) {
      var impColor = f.impact === 'high' ? '#EF4444' : f.impact === 'medium' ? '#F59E0B' : '#3B82F6';
      html += '<span class="cm-chip" style="background:' + impColor + '15;color:' + impColor + ';border-color:' + impColor + '30" data-type="friction" data-fid="' + escHtml(f.id) + '">';
      html += escHtml(f.id) + ' · ' + escHtml(f.name);
      html += '<span class="cm-chip-x" data-remove-friction="' + escHtml(f.id) + '">&times;</span></span>';
    });
    html += '<input type="text" class="cm-chip-text-input" id="' + containerId + '-input" placeholder="Buscar o crear friccion...">';
    html += '</div></div>';
    return html;
  }

  function bindFrictionChipInput(containerId, phaseId, touchpointId) {
    var wrap = document.querySelector('#' + containerId);
    var input = document.querySelector('#' + containerId + '-input');
    var sugWrap = document.querySelector('#' + containerId + '-wrap');
    if (!wrap || !input) return;

    wrap.addEventListener('click', function(e) {
      if (e.target.classList.contains('cm-chip-x')) {
        e.stopPropagation();
        var chip = e.target.closest('.cm-chip');
        if (chip) chip.remove();
      } else {
        input.focus();
      }
    });

    input.addEventListener('focus', function() { showFrictionDropdown(containerId, phaseId, this.value); });
    input.addEventListener('input', function() { showFrictionDropdown(containerId, phaseId, this.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        // Create new friction with this name
        createInlineFriction(containerId, phaseId, touchpointId, this.value.trim());
        this.value = '';
        hideFrictionDropdown();
      }
    });

    document.addEventListener('click', function(e) {
      if (!sugWrap.contains(e.target)) hideFrictionDropdown();
    });

    function hideFrictionDropdown() {
      var dd = sugWrap.querySelector('.cm-chip-dropdown');
      if (dd) dd.remove();
    }

    function showFrictionDropdown(cid, pid, query) {
      hideFrictionDropdown();
      var currentIds = getFrictionChipIds(cid);
      // Show existing frictions from same phase, not already linked
      var available = state.frictions.filter(function(f) {
        return f.phase_id === pid && currentIds.indexOf(f.id) < 0;
      });
      if (query) {
        var q = query.toLowerCase();
        available = available.filter(function(f) {
          return f.name.toLowerCase().indexOf(q) >= 0 || f.id.toLowerCase().indexOf(q) >= 0;
        });
      }

      var dd = document.createElement('div');
      dd.className = 'cm-chip-dropdown';

      if (available.length > 0) {
        var header = document.createElement('div');
        header.className = 'cm-chip-dropdown-header';
        header.textContent = 'Fricciones existentes';
        dd.appendChild(header);
        available.slice(0, 8).forEach(function(f) {
          var impColor = f.impact === 'high' ? '#EF4444' : f.impact === 'medium' ? '#F59E0B' : '#3B82F6';
          var impLabel = f.impact === 'high' ? 'Alto' : f.impact === 'medium' ? 'Medio' : 'Bajo';
          var item = document.createElement('div');
          item.className = 'cm-chip-dropdown-item';
          item.innerHTML = '<span style="color:' + impColor + ';font-size:.7rem">&#9679;</span> <strong>' + escHtml(f.id) + '</strong> ' + escHtml(f.name) + ' <span style="color:var(--text-muted);font-size:.68rem">' + impLabel + '</span>';
          item.addEventListener('click', function(e) {
            e.stopPropagation();
            addFrictionChip(cid, f);
            hideFrictionDropdown();
            input.value = '';
            input.focus();
          });
          dd.appendChild(item);
        });
      }

      if (query && query.trim()) {
        var div = document.createElement('div');
        div.className = 'cm-chip-dropdown-divider';
        dd.appendChild(div);
        var createItem = document.createElement('div');
        createItem.className = 'cm-chip-dropdown-item';
        createItem.innerHTML = '<span style="color:var(--danger)">+</span> Crear friccion: "' + escHtml(query.trim()) + '"';
        createItem.addEventListener('click', function(e) {
          e.stopPropagation();
          createInlineFriction(cid, pid, touchpointId, query.trim());
          hideFrictionDropdown();
          input.value = '';
          input.focus();
        });
        dd.appendChild(createItem);
      }

      if (dd.children.length > 0) sugWrap.appendChild(dd);
    }

    function addFrictionChip(cid, f) {
      var w = document.querySelector('#' + cid);
      var inp = document.querySelector('#' + cid + '-input');
      var impColor = f.impact === 'high' ? '#EF4444' : f.impact === 'medium' ? '#F59E0B' : '#3B82F6';
      var chip = document.createElement('span');
      chip.className = 'cm-chip';
      chip.style.cssText = 'background:' + impColor + '15;color:' + impColor + ';border-color:' + impColor + '30';
      chip.dataset.type = 'friction';
      chip.dataset.fid = f.id;
      chip.innerHTML = escHtml(f.id) + ' &middot; ' + escHtml(f.name) + '<span class="cm-chip-x" data-remove-friction="' + escHtml(f.id) + '">&times;</span>';
      w.insertBefore(chip, inp);
    }

    function createInlineFriction(cid, pid, tpId, name) {
      var newId = nextFrictionId();
      var data = {
        id: newId, phase_id: pid, name: name,
        impact: 'medium', status: 'pending',
        solution: '', expected_outcome: '',
        responsable: '', notes: '', priority: 0,
        touchpoint_id: tpId || null,
      };
      apiPost('frictions', data).then(function(created) {
        state.frictions.push(created);
        var w = document.querySelector('#' + cid);
        var inp = document.querySelector('#' + cid + '-input');
        if (w && inp) {
          var chip = document.createElement('span');
          chip.className = 'cm-chip';
          chip.style.cssText = 'background:#F59E0B15;color:#F59E0B;border-color:#F59E0B30';
          chip.dataset.type = 'friction';
          chip.dataset.fid = created.id;
          chip.innerHTML = escHtml(created.id) + ' &middot; ' + escHtml(created.name) + '<span class="cm-chip-x" data-remove-friction="' + escHtml(created.id) + '">&times;</span>';
          w.insertBefore(chip, inp);
        }
        toast('Friccion ' + newId + ' creada', 'success');
      }).catch(function() { toast('Error al crear friccion', 'error'); });
    }
  }

  function getFrictionChipIds(containerId) {
    var ids = [];
    var wrap = document.querySelector('#' + containerId);
    if (!wrap) return ids;
    wrap.querySelectorAll('.cm-chip[data-type="friction"]').forEach(function(chip) {
      ids.push(chip.dataset.fid);
    });
    return ids;
  }

  function nextFrictionId() {
    var max = 0;
    state.frictions.forEach(function(f) {
      var n = parseInt(String(f.id).replace(/^F/, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return 'F' + (max + 1);
  }

  function getOverdueCount() {
    return state.frictions.filter(function(f) {
      return f.status !== 'completed' && f.is_overdue;
    }).length;
  }

  /* ── Styles ── */
  function injectStyles() {
    if (document.querySelector('#comercial-styles')) return;
    var style = document.createElement('style');
    style.id = 'comercial-styles';
    style.textContent = `
      #comercial-module{font-family:'Inter',system-ui,-apple-system,sans-serif;max-width:1440px;margin:0 auto;padding:24px;color:var(--text-primary,#1E293B)}

      /* ── Mapa Visual ── */
      .cm-mv-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:14px;padding:18px 20px;background:#fff;border:1px solid var(--border,#E2E8F0);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
      .cm-mv-title{font-size:1.05rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-mv-subtitle{font-size:.78rem;color:var(--text-muted,#94A3B8);margin-top:2px}
      .cm-mv-legend{display:flex;gap:14px;flex-wrap:wrap}
      .cm-mv-legend-item{display:flex;align-items:center;gap:6px;font-size:.74rem;color:var(--text-secondary,#64748B)}
      .cm-mv-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0}
      .cm-mv-hint{font-size:.74rem;color:var(--text-muted,#94A3B8);margin-bottom:14px;font-style:italic}
      .cm-mv-canvas-wrap{background:#FAFBFC;border:1px solid var(--border,#E2E8F0);border-radius:12px;padding:20px;overflow:hidden}
      .cm-mv-canvas{position:relative;display:flex;gap:36px;overflow-x:auto;overflow-y:visible;padding-bottom:8px;min-height:420px}
      .cm-mv-svg{position:absolute;top:0;left:0;pointer-events:none;z-index:0}
      .cm-mv-column{flex:0 0 280px;position:relative;z-index:1}
      .cm-mv-col-header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;background:#fff;border:1px solid var(--border,#E2E8F0);border-radius:10px;margin-bottom:14px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
      .cm-mv-col-title{font-size:.84rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-mv-col-stats{display:flex;gap:4px}
      .cm-mv-col-stat{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:18px;padding:0 6px;font-size:.66rem;font-weight:700;border-radius:9999px;text-align:center}
      .cm-mv-col-body{display:flex;flex-direction:column;gap:14px}
      .cm-mv-empty{font-size:.78rem;color:var(--text-muted,#94A3B8);font-style:italic;padding:20px;text-align:center;border:1px dashed var(--border,#E2E8F0);border-radius:8px}
      .cm-mv-node{background:#fff;border:1px solid var(--border,#E2E8F0);border-radius:10px;padding:12px;cursor:pointer;transition:transform .12s, box-shadow .12s;position:relative;z-index:2}
      .cm-mv-node:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
      .cm-mv-node-header{display:flex;align-items:center;gap:6px;margin-bottom:6px}
      .cm-mv-node-id{font-size:.66rem;color:var(--text-muted,#94A3B8);font-weight:600}
      .cm-mv-node-title{font-size:.82rem;font-weight:700;color:var(--text-primary,#1E293B);flex:1}
      .cm-mv-node-meta{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
      .cm-mv-tag{display:inline-block;padding:2px 8px;font-size:.66rem;font-weight:600;background:#F1F5F9;color:#475569;border-radius:9999px;border:1px solid #E2E8F0}
      .cm-mv-tag-resp{background:#EEF2FF;color:#4F46E5;border-color:#C7D2FE}
      .cm-mv-node-kpi{padding:6px 8px;background:rgba(255,255,255,.6);border:1px solid rgba(0,0,0,.05);border-radius:6px;margin-bottom:8px}
      .cm-mv-node-stats{display:flex;flex-direction:column;gap:6px}
      .cm-mv-node-stat{display:flex;flex-direction:column;gap:2px;font-size:.74rem}
      .cm-mv-frictions{margin-top:10px;padding-left:24px;display:flex;flex-direction:column;gap:6px;position:relative;z-index:2}
      .cm-mv-friction-node{background:#fff;border:1px solid #E2E8F0;border-left:3px solid;border-radius:6px;padding:6px 8px;cursor:pointer;transition:transform .12s, box-shadow .12s}
      .cm-mv-friction-node:hover{transform:translateX(2px);box-shadow:0 2px 6px rgba(0,0,0,.06)}
      .cm-mv-fr-header{display:flex;align-items:center;gap:5px;margin-bottom:3px}
      .cm-mv-fr-impact{padding:1px 6px;font-size:.6rem;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:.3px}
      .cm-mv-fr-id{font-size:.62rem;color:var(--text-muted,#94A3B8);font-weight:600}
      .cm-mv-fr-resolved{margin-left:auto;font-size:.7rem;color:#10B981;font-weight:700}
      .cm-mv-fr-name{font-size:.7rem;font-weight:600;line-height:1.3;color:var(--text-primary,#1E293B)}
      .cm-mv-fr-progress{display:flex;align-items:center;gap:5px;margin-top:4px}

      /* Canvas libre (Mapa Visual) */
      .cm-canvas-viewport{position:relative;width:100%;height:calc(100vh - 280px);min-height:520px;background:#FAFBFC;background-image:radial-gradient(circle, #CBD5E1 1px, transparent 1px);background-size:22px 22px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;cursor:grab;user-select:none}
      .cm-canvas-viewport:active{cursor:grabbing}
      .cm-canvas-stage{position:absolute;top:0;left:0;width:0;height:0;transform-origin:0 0;will-change:transform}
      .cm-canvas-svg{position:absolute;top:0;left:0;pointer-events:none;overflow:visible}
      .cm-canvas-node{position:absolute;width:240px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;box-shadow:0 1px 3px rgba(15,23,42,.06),0 4px 12px rgba(15,23,42,.04);cursor:grab;transition:box-shadow .12s,border-color .12s,transform .12s;overflow:hidden}
      .cm-canvas-node:hover{box-shadow:0 4px 14px rgba(15,23,42,.10),0 2px 4px rgba(15,23,42,.06)}
      .cm-canvas-node:active{cursor:grabbing}
      .cm-canvas-node.selected{border-color:#4F46E5;box-shadow:0 0 0 3px rgba(79,70,229,.18),0 4px 14px rgba(15,23,42,.10)}
      .cm-canvas-node--friction{width:200px;background:#fff;border:1px solid #E2E8F0;border-left:3px solid;padding:8px 10px;border-radius:8px}
      .cm-canvas-node-bar{height:4px}
      .cm-canvas-node-body{padding:10px 12px}
      .cm-canvas-node-header{display:flex;align-items:center;gap:6px;margin-bottom:6px}
      .cm-canvas-node-id{font-size:.62rem;color:#94A3B8;font-weight:700}
      .cm-canvas-node-title{font-size:.82rem;font-weight:700;color:#1E293B;flex:1;line-height:1.3}
      .cm-canvas-node-meta{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
      .cm-canvas-node-kpi{padding:6px 8px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;margin-bottom:8px;display:flex;flex-direction:column;gap:2px}
      .cm-canvas-node-stats{display:flex;flex-direction:column;gap:6px}
      .cm-canvas-node-stat{display:flex;flex-direction:column;gap:2px;font-size:.74rem}
      .cm-canvas-fr-header{display:flex;align-items:center;gap:5px;margin-bottom:3px}
      .cm-canvas-fr-id{font-size:.62rem;color:#94A3B8;font-weight:600}
      .cm-canvas-fr-resolved{margin-left:auto;font-size:.7rem;color:#10B981;font-weight:700}
      .cm-canvas-fr-name{font-size:.72rem;font-weight:600;line-height:1.3;color:#1E293B}
      .cm-canvas-fr-progress{display:flex;align-items:center;gap:5px;margin-top:5px}
      .cm-canvas-controls{position:absolute;left:14px;bottom:14px;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:5px;box-shadow:0 2px 8px rgba(15,23,42,.08);z-index:10}
      .cm-canvas-ctrl-btn{width:30px;height:30px;border:none;background:transparent;border-radius:6px;font-size:1rem;font-weight:700;color:#475569;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s}
      .cm-canvas-ctrl-btn:hover{background:#F1F5F9;color:#1E293B}
      .cm-canvas-zoom-label{font-size:.74rem;font-weight:700;color:#475569;padding:0 8px;min-width:46px;text-align:center}
      .cm-canvas-drawer{position:fixed;top:0;right:0;bottom:0;width:380px;background:#fff;border-left:1px solid #E2E8F0;box-shadow:-4px 0 16px rgba(15,23,42,.08);transform:translateX(100%);transition:transform .22s ease;z-index:1000;overflow-y:auto}
      .cm-canvas-drawer.open{transform:translateX(0)}
      .cm-canvas-drawer-content{padding:20px}
      .cm-canvas-drawer-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
      .cm-canvas-drawer-close{width:30px;height:30px;border:none;background:transparent;font-size:1.4rem;color:#64748B;cursor:pointer;border-radius:6px;line-height:1}
      .cm-canvas-drawer-close:hover{background:#F1F5F9;color:#1E293B}
      .cm-canvas-drawer-title{font-size:1.05rem;font-weight:700;color:#1E293B;margin-bottom:10px;line-height:1.3}
      .cm-canvas-drawer-section{margin-bottom:18px}
      .cm-canvas-drawer-section-title{font-size:.7rem;color:#94A3B8;text-transform:uppercase;letter-spacing:.4px;font-weight:700;margin-bottom:8px}
      .cm-canvas-drawer-item{padding:8px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:6px}
      .cm-canvas-drawer-empty{font-size:.78rem;color:#94A3B8;font-style:italic;padding:8px}
      .cm-canvas-drawer-actions{display:flex;flex-direction:column;gap:6px;margin-top:18px;padding-top:14px;border-top:1px solid #E2E8F0}

      /* Canvas v2 — toolbar, filtros, links, banners */
      .cm-canvas-toolbar{position:sticky;top:0;z-index:50;background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:10px 14px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;box-shadow:0 1px 3px rgba(15,23,42,.04)}
      .cm-canvas-toolbar-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .cm-canvas-toolbar-row--secondary{font-size:.74rem;color:#64748B}
      .cm-canvas-toolbar-spacer{flex:1}
      .cm-canvas-search-wrap{position:relative;display:flex;align-items:center}
      .cm-canvas-search-icon{position:absolute;left:10px;font-size:.85rem;color:#94A3B8;pointer-events:none}
      .cm-canvas-search{padding:7px 12px 7px 32px;border:1px solid #E2E8F0;border-radius:8px;font-size:.82rem;font-family:inherit;width:260px;background:#F8FAFC;transition:border-color .12s,background .12s}
      .cm-canvas-search:focus{outline:none;border-color:#4F46E5;background:#fff;box-shadow:0 0 0 3px rgba(79,70,229,.12)}
      .cm-canvas-filters{display:flex;gap:6px;flex-wrap:wrap}
      .cm-canvas-filter{position:relative}
      .cm-canvas-filter-trigger{padding:6px 12px;border:1px solid #E2E8F0;background:#fff;border-radius:8px;font-size:.78rem;font-weight:600;color:#475569;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px}
      .cm-canvas-filter-trigger:hover{background:#F1F5F9}
      .cm-canvas-filter-trigger.has-selection{background:#EEF2FF;color:#4F46E5;border-color:#C7D2FE}
      .cm-canvas-filter-trigger b{background:#4F46E5;color:#fff;font-size:.66rem;padding:1px 6px;border-radius:9999px;font-weight:700}
      .cm-canvas-filter-pop{position:absolute;top:calc(100% + 4px);left:0;background:#fff;border:1px solid #E2E8F0;border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.12);min-width:200px;z-index:100;overflow:hidden}
      .cm-canvas-filter-list{max-height:240px;overflow-y:auto;padding:6px}
      .cm-canvas-filter-opt{display:flex;align-items:center;gap:8px;padding:5px 8px;font-size:.78rem;color:#1E293B;cursor:pointer;border-radius:6px}
      .cm-canvas-filter-opt:hover{background:#F1F5F9}
      .cm-canvas-filter-opt input{margin:0}
      .cm-canvas-filter-actions{padding:6px 8px;border-top:1px solid #F1F5F9;display:flex;justify-content:flex-end}
      .cm-canvas-filter-actions button{font-size:.72rem;color:#64748B;background:none;border:none;cursor:pointer;font-family:inherit}
      .cm-canvas-filter-actions button:hover{color:#4F46E5}
      .cm-canvas-tool-btn{padding:6px 12px;border:1px solid #E2E8F0;background:#fff;border-radius:8px;font-size:.78rem;font-weight:600;color:#475569;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;transition:all .12s}
      .cm-canvas-tool-btn:hover{background:#F1F5F9;color:#1E293B}
      .cm-canvas-tool-btn.active{background:#EEF2FF;color:#4F46E5;border-color:#C7D2FE}
      .cm-canvas-tool-btn.primary{background:#4F46E5;color:#fff;border-color:#4F46E5}
      .cm-canvas-tool-btn.primary:hover{background:#4338CA}
      .cm-canvas-create-wrap{position:relative}
      .cm-canvas-create-menu{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #E2E8F0;border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.12);overflow:hidden;z-index:100;min-width:180px}
      .cm-canvas-create-menu button{display:block;width:100%;padding:8px 14px;background:none;border:none;text-align:left;font-size:.82rem;color:#1E293B;cursor:pointer;font-family:inherit}
      .cm-canvas-create-menu button:hover{background:#F1F5F9}
      .cm-canvas-totals{font-weight:600}
      .cm-canvas-legend{display:flex;gap:14px;flex-wrap:wrap}
      .cm-canvas-legend-item{display:flex;align-items:center;gap:6px;font-size:.74rem;color:#64748B}
      .cm-canvas-save-indicator{padding:5px 12px;border-radius:9999px;font-size:.72rem;font-weight:700;display:inline-flex;align-items:center;gap:4px}
      .cm-canvas-save-indicator.saving{background:#FEF3C7;color:#92400E}
      .cm-canvas-save-indicator.saved{background:#D1FAE5;color:#065F46}
      .cm-canvas-save-indicator.error{background:#FEE2E2;color:#991B1B}
      .cm-canvas-mode-banner{padding:8px 14px;background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;border-radius:8px;margin-bottom:8px;font-size:.82rem;font-weight:600;text-align:center}
      .cm-canvas-viewport.dropmode{cursor:crosshair}
      .cm-canvas-viewport.linkmode{cursor:crosshair}
      .cm-canvas-viewport.locked .cm-canvas-node{cursor:default}
      .cm-canvas-link-handle{position:absolute;top:50%;right:-12px;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;background:#4F46E5;color:#fff;font-size:.95rem;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:crosshair;opacity:0;transition:opacity .12s,transform .12s;box-shadow:0 2px 6px rgba(79,70,229,.3);z-index:5;line-height:1}
      .cm-canvas-node:hover .cm-canvas-link-handle{opacity:1}
      .cm-canvas-viewport.linkmode .cm-canvas-link-handle{opacity:1}
      .cm-canvas-link-handle:hover{transform:translateY(-50%) scale(1.15)}
      .cm-canvas-dim{opacity:.22;pointer-events:none;filter:saturate(.6)}
      .cm-canvas-node--note{width:180px;padding:14px 12px 28px 12px;border:1px solid rgba(0,0,0,.05);box-shadow:0 2px 6px rgba(15,23,42,.08),0 1px 2px rgba(15,23,42,.04);font-family:'Caveat', cursive, system-ui;font-size:1rem;line-height:1.3;color:#1E293B}
      .cm-canvas-note-text{white-space:pre-wrap;word-break:break-word;min-height:30px}
      .cm-canvas-note-del{position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;border:none;background:rgba(0,0,0,.06);color:#475569;font-size:.85rem;cursor:pointer;line-height:1;display:none;align-items:center;justify-content:center}
      .cm-canvas-node--note:hover .cm-canvas-note-del{display:flex}
      .cm-color-chip{transition:transform .1s}
      .cm-fullscreen-mode .cm-tabs,.cm-fullscreen-mode .topbar,.cm-fullscreen-mode .sidebar{display:none !important}
      .cm-fullscreen-mode #cm-main{padding:14px}
      .cm-fullscreen-mode .cm-canvas-viewport{height:calc(100vh - 160px) !important;border-radius:6px}
      .cm-flow-hit:hover ~ .cm-flow-visible,.cm-flow-visible.cm-flow-hover{stroke:#3730A3;stroke-width:3.5}
      .cm-flow-visible.selected{filter:drop-shadow(0 0 4px rgba(67,56,202,.6))}

      /* 4 anchors por nodo */
      .cm-canvas-node{overflow:visible}
      .cm-anchor{position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;border:2.5px solid #4F46E5;cursor:crosshair;opacity:0;transition:opacity .15s,transform .15s,box-shadow .15s;z-index:6;pointer-events:auto}
      /* Hit-area invisible más grande para que el anchor sea fácil de clickar incluso con zoom bajo */
      .cm-anchor::before{content:"";position:absolute;inset:-12px;border-radius:50%}
      .cm-canvas-node:hover .cm-anchor{opacity:.55}
      .cm-canvas-viewport.linkmode .cm-anchor{opacity:1}
      .cm-anchor:hover{opacity:1 !important;transform:scale(1.4);box-shadow:0 0 0 4px rgba(79,70,229,.18)}
      .cm-anchor-top{top:-9px;left:50%;margin-left:-7px}
      .cm-anchor-right{top:50%;right:-9px;margin-top:-7px}
      .cm-anchor-bottom{bottom:-9px;left:50%;margin-left:-7px}
      .cm-anchor-left{top:50%;left:-9px;margin-top:-7px}

      /* Drop target durante drag-to-link */
      .cm-canvas-node.cm-drop-target{box-shadow:0 0 0 4px rgba(16,185,129,.35),0 0 0 2px #10B981 !important;border-color:#10B981 !important}
      .cm-canvas-node.cm-drop-target::after{content:'Soltar para conectar';position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;font-size:.66rem;font-weight:700;padding:3px 8px;border-radius:9999px;white-space:nowrap;pointer-events:none}

      /* Indicador touchpoint paralelo */
      .cm-canvas-node--parallel{border-style:dashed !important}
      .cm-mv-tag-parallel{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A}

      /* Edge widget HTML midpoint */
      .cm-canvas-edge-widgets-layer{position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:7}
      .cm-edge-widget{position:absolute;transform:translate(-50%,-50%);background:#fff;border:1px solid #C7D2FE;border-radius:9999px;padding:3px 8px;font-size:.7rem;font-weight:700;color:#4F46E5;display:flex;align-items:center;gap:4px;cursor:pointer;pointer-events:auto;box-shadow:0 1px 3px rgba(15,23,42,.12);transition:all .12s;white-space:nowrap;max-width:160px}
      .cm-edge-widget:hover{background:#EEF2FF;border-color:#4F46E5;transform:translate(-50%,-50%) scale(1.05)}
      .cm-edge-widget.selected{background:#4F46E5;color:#fff;border-color:#3730A3}
      .cm-edge-widget.empty{padding:0;width:22px;height:22px;justify-content:center;border-radius:50%}
      .cm-edge-widget.empty .cm-edge-widget-label{display:none}
      .cm-edge-widget.empty .cm-edge-widget-add{display:flex;align-items:center;justify-content:center;font-size:.95rem;line-height:1}
      .cm-edge-widget.empty:hover .cm-edge-widget-add{display:flex}
      .cm-edge-widget-label{overflow:hidden;text-overflow:ellipsis}
      .cm-edge-widget-del{display:none;width:18px;height:18px;border-radius:50%;border:none;background:rgba(0,0,0,.08);color:inherit;font-size:.85rem;line-height:1;cursor:pointer;align-items:center;justify-content:center;font-weight:700;padding:0}
      .cm-edge-widget:hover .cm-edge-widget-del{display:flex}
      .cm-edge-widget.selected .cm-edge-widget-del{display:flex;background:rgba(255,255,255,.25)}
      .cm-edge-widget-del:hover{background:#EF4444 !important;color:#fff}

      /* Phase frame headers HTML */
      .cm-canvas-phase-layer{position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:1}
      .cm-phase-frame-header{position:absolute;height:30px;background:#fff;border:1.5px solid;border-radius:8px;padding:0 6px 0 4px;display:flex;align-items:center;gap:4px;pointer-events:auto;box-shadow:0 2px 6px rgba(15,23,42,.08);transition:box-shadow .12s,opacity .12s}
      .cm-phase-frame-header:hover{box-shadow:0 4px 12px rgba(15,23,42,.14)}
      .cm-phase-drag{width:22px;height:22px;border:none;background:transparent;cursor:grab;color:#94A3B8;font-size:.95rem;font-weight:700;border-radius:4px;display:flex;align-items:center;justify-content:center;line-height:1}
      .cm-phase-drag:hover{background:#F1F5F9;color:#475569}
      .cm-phase-drag:active{cursor:grabbing}
      .cm-phase-name-input{flex:1;border:1px solid transparent;background:transparent;font-size:.85rem;font-weight:700;color:#1E293B;padding:3px 6px;border-radius:4px;font-family:inherit;min-width:60px}
      .cm-phase-name-input:hover{background:#F8FAFC}
      .cm-phase-name-input:focus{outline:none;background:#fff;border-color:#C7D2FE;box-shadow:0 0 0 3px rgba(79,70,229,.12)}
      .cm-phase-color-btn{width:22px;height:22px;border-radius:50%;border:2px solid #fff;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.1);transition:transform .12s}
      .cm-phase-color-btn:hover{transform:scale(1.15)}
      .cm-phase-menu-btn{width:22px;height:22px;border:none;background:transparent;color:#94A3B8;font-size:1.05rem;font-weight:700;cursor:pointer;border-radius:4px;line-height:1;display:flex;align-items:center;justify-content:center}
      .cm-phase-menu-btn:hover{background:#F1F5F9;color:#1E293B}
      .cm-phase-color-popup{position:fixed;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:8px;box-shadow:0 10px 30px rgba(15,23,42,.18);z-index:2000;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
      .cm-color-swatch{width:28px;height:28px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:transform .1s}
      .cm-color-swatch:hover{transform:scale(1.15);border-color:#1E293B}

      /* Tabla Mapa de Procesos: drag-handle + journey badges */
      .cm-tp-drag-handle{cursor:grab;color:#94A3B8;font-size:1.05rem;font-weight:700;text-align:center;user-select:none;line-height:1}
      .cm-tp-drag-handle:active{cursor:grabbing}
      .cm-tp-table tbody tr.cm-tp-dragging{opacity:.4}
      .cm-tp-table tbody tr.cm-tp-drop-above{box-shadow:inset 0 3px 0 #4F46E5}
      .cm-tp-table tbody tr.cm-tp-drop-below{box-shadow:inset 0 -3px 0 #4F46E5}
      .cm-journey-badges{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
      .cm-journey-badge{display:inline-flex;align-items:center;font-size:.62rem;font-weight:700;padding:1px 7px;border-radius:9999px;letter-spacing:.2px;text-transform:none}
      .cm-journey-badge.badge-parallel{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A}
      .cm-journey-badge.badge-fork{background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE}
      .cm-journey-badge.badge-join{background:#F0FDF4;color:#166534;border:1px solid #BBF7D0}
      .cm-journey-badge.badge-start{background:#E0E7FF;color:#3730A3;border:1px solid #C7D2FE}
      .cm-journey-badge.badge-loop{background:#FCE7F3;color:#9D174D;border:1px solid #FBCFE8}

      /* Auto-link suggestion bar */
      .cm-autolink-suggest{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 18px;border-radius:10px;display:flex;align-items:center;gap:10px;font-size:.85rem;box-shadow:0 8px 30px rgba(15,23,42,.3);z-index:3000;animation:cmSlideUp .25s ease-out}
      @keyframes cmSlideUp{from{opacity:0;transform:translate(-50%, 20px)}to{opacity:1;transform:translate(-50%, 0)}}
      .cm-autolink-suggest button{padding:5px 12px;border-radius:6px;border:none;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit}
      .cm-autolink-suggest button[data-yes]{background:#4F46E5;color:#fff}
      .cm-autolink-suggest button[data-yes]:hover{background:#4338CA}
      .cm-autolink-suggest button[data-no]{background:rgba(255,255,255,.1);color:#fff}
      .cm-autolink-suggest button[data-no]:hover{background:rgba(255,255,255,.2)}
      .cm-flow-popover{position:fixed;background:#fff;border:1px solid #E2E8F0;border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.18);padding:12px;z-index:2000;width:300px}
      .cm-flow-popover-title{font-size:.7rem;color:#64748B;text-transform:uppercase;letter-spacing:.4px;font-weight:700;margin-bottom:6px}
      .cm-flow-popover-route{font-size:.84rem;color:#1E293B;line-height:1.4}
      .cm-btn-danger{background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA}
      .cm-btn-danger:hover{background:#FECACA}

      /* Tabs */
      .cm-tabs{display:flex;gap:4px;margin-bottom:24px;border-bottom:1px solid var(--border,#E2E8F0);padding-bottom:0;flex-wrap:wrap}
      .cm-tab{padding:10px 18px;font-size:.85rem;font-weight:600;color:var(--text-secondary,#64748B);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;font-family:inherit;transition:all .15s ease;display:flex;align-items:center;gap:6px}
      .cm-tab:hover{color:var(--text-primary,#1E293B);background:var(--bg-hover,#F0F2F5)}
      .cm-tab.active{color:var(--primary,#4C6EF5);border-bottom-color:var(--primary,#4C6EF5)}
      .cm-tab-badge{font-size:.68rem;padding:1px 7px;border-radius:var(--radius-full,9999px);font-weight:700;line-height:1.4}
      .cm-tab-badge-red{background:#FEF2F2;color:#DC2626}
      .cm-tab-badge-blue{background:var(--primary-light,#EDF2FF);color:var(--primary,#4C6EF5)}

      /* KPI Cards */
      .cm-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
      .cm-kpi-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);padding:20px;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06));transition:all .2s ease}
      .cm-kpi-card:hover{box-shadow:var(--shadow-md,0 4px 6px rgba(0,0,0,.07))}
      .cm-kpi-card .label{font-size:.72rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
      .cm-kpi-card .value{font-size:1.5rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-kpi-card .value.danger{color:var(--danger,#EF4444)}
      .cm-kpi-card .value.success{color:var(--success,#22C55E)}
      .cm-kpi-card .value.primary{color:var(--primary,#4C6EF5)}
      .cm-kpi-card .sub{font-size:.78rem;color:var(--text-secondary,#64748B);margin-top:4px}

      /* Progress Bar */
      .cm-progress-wrap{margin-bottom:28px}
      .cm-progress-bar{height:10px;background:var(--bg-hover,#F0F2F5);border-radius:var(--radius-full,9999px);overflow:hidden}
      .cm-progress-fill{height:100%;background:linear-gradient(90deg,var(--primary,#4C6EF5),var(--success,#22C55E));border-radius:var(--radius-full,9999px);transition:width .2s ease}
      .cm-progress-label{display:flex;justify-content:space-between;font-size:.78rem;color:var(--text-secondary,#64748B);margin-top:6px}

      /* Section header */
      .cm-section-title{font-size:1.05rem;font-weight:700;color:var(--text-primary,#1E293B);margin-bottom:16px;display:flex;align-items:center;gap:8px}

      /* Phase Pipeline (Dashboard tab) */
      .cm-phase-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
      @media(max-width:960px){.cm-phase-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:640px){.cm-phase-grid{grid-template-columns:1fr}}
      .cm-phase-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);overflow:hidden;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06));transition:all .2s ease;cursor:pointer}
      .cm-phase-card:hover{box-shadow:var(--shadow-md,0 4px 6px rgba(0,0,0,.07));border-color:#CBD5E1;transform:translateY(-1px)}
      .cm-phase-accent{height:4px}
      .cm-phase-body{padding:16px 20px}
      .cm-phase-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
      .cm-phase-icon{font-size:1.4rem;line-height:1}
      .cm-phase-name{font-size:.92rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-phase-desc{font-size:.76rem;color:var(--text-muted,#94A3B8);margin-bottom:12px;line-height:1.4}
      .cm-phase-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
      .cm-phase-stat .sl{font-size:.66rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px}
      .cm-phase-stat .sv{font-size:1rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-phase-progress{height:6px;background:var(--bg-hover,#F0F2F5);border-radius:var(--radius-full,9999px);overflow:hidden}
      .cm-phase-progress-fill{height:100%;border-radius:var(--radius-full,9999px);transition:width .2s ease}

      /* Activity Feed */
      .cm-activity-list{list-style:none;margin:0;padding:0}
      .cm-activity-item{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border,#E2E8F0);align-items:flex-start}
      .cm-activity-item:last-child{border-bottom:none}
      .cm-activity-icon{width:32px;height:32px;border-radius:var(--radius-full,9999px);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;background:var(--bg,#F5F7FA)}
      .cm-activity-text{flex:1;font-size:.82rem;color:var(--text-primary,#1E293B);line-height:1.4}
      .cm-activity-time{font-size:.72rem;color:var(--text-muted,#94A3B8);white-space:nowrap;flex-shrink:0}

      /* Master KPIs */
      .cm-master-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px}
      .cm-master-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);padding:20px;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))}
      .cm-master-card .name{font-size:.88rem;font-weight:700;color:var(--text-primary,#1E293B);margin-bottom:4px}
      .cm-master-card .question{font-size:.74rem;color:var(--text-muted,#94A3B8);margin-bottom:12px;line-height:1.4;font-style:italic}
      .cm-master-card .unit-label{font-size:.68rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px;margin-bottom:8px}
      .cm-master-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
      .cm-master-row label{font-size:.72rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px;min-width:52px}
      .cm-master-input{border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:6px 10px;font-size:.88rem;font-family:inherit;color:var(--text-primary,#1E293B);width:100%;transition:border-color .15s ease;background:var(--bg-white,#fff)}
      .cm-master-input:focus{outline:none;border-color:var(--primary,#4C6EF5);box-shadow:0 0 0 3px rgba(76,110,245,.1)}
      .cm-master-kpi-actions{margin-top:10px}
      .cm-kpi-inline-hist{margin-top:10px;padding-top:10px;border-top:1px solid var(--border,#E2E8F0)}
      .cm-mini-table{width:100%;font-size:.76rem;border-collapse:collapse;margin-top:4px}
      .cm-mini-table th,.cm-mini-table td{padding:6px 8px;border-bottom:1px solid var(--border,#E2E8F0);text-align:left}
      .cm-kpi-record-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
      .cm-checklist-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:6px}
      .cm-checklist-row .cm-checklist-text{flex:1}
      .cm-friction-tp-line{font-size:.78rem;color:var(--text-secondary,#64748B);margin:0 20px 10px}

      /* Filter bar */
      .cm-filters{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
      .cm-search{border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:7px 12px 7px 34px;font-size:.82rem;font-family:inherit;color:var(--text-primary,#1E293B);background:var(--bg-white,#fff) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.442.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'/%3E%3C/svg%3E") no-repeat 10px center;min-width:200px;transition:border-color .15s ease}
      .cm-search:focus{outline:none;border-color:var(--primary,#4C6EF5);box-shadow:0 0 0 3px rgba(76,110,245,.1)}
      .cm-select{border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:7px 12px;font-size:.82rem;font-family:inherit;color:var(--text-primary,#1E293B);background:var(--bg-white,#fff);cursor:pointer;transition:border-color .15s ease}
      .cm-select:focus{outline:none;border-color:var(--primary,#4C6EF5)}

      /* Button */
      .cm-btn{padding:8px 16px;border:none;border-radius:var(--radius-md,6px);font-size:.82rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease;display:inline-flex;align-items:center;gap:6px}
      .cm-btn-primary{background:var(--primary,#4C6EF5);color:#fff}
      .cm-btn-primary:hover{background:var(--primary-hover,#3B5BDB)}
      .cm-btn-danger{background:var(--danger,#EF4444);color:#fff}
      .cm-btn-danger:hover{background:#DC2626}
      .cm-btn-ghost{background:transparent;color:var(--text-secondary,#64748B);border:1px solid var(--border,#E2E8F0)}
      .cm-btn-ghost:hover{background:var(--bg-hover,#F0F2F5);color:var(--text-primary,#1E293B)}
      .cm-btn-sm{padding:5px 12px;font-size:.76rem}

      /* Table */
      .cm-table-wrap{overflow-x:auto;background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06));margin-bottom:24px}
      .cm-table{width:100%;border-collapse:collapse;font-size:.82rem;table-layout:fixed}
      .cm-table th, .cm-table td{overflow:hidden;text-overflow:ellipsis;white-space:normal;word-break:break-word}
      .cm-col-resizer{position:absolute;top:0;right:-3px;width:7px;height:100%;cursor:col-resize;user-select:none;z-index:5;background:transparent;transition:background .15s}
      .cm-col-resizer:hover, .cm-col-resizer.cm-resizing{background:rgba(99,102,241,.45)}
      body.cm-col-resizing, body.cm-col-resizing *{cursor:col-resize !important;user-select:none !important}
      .cm-table th{background:#F8FAFC;padding:10px 14px;text-align:left;font-weight:600;color:var(--text-muted,#94A3B8);text-transform:uppercase;font-size:.7rem;letter-spacing:.5px;position:sticky;top:0;z-index:1}
      .cm-table td{padding:9px 14px;border-bottom:1px solid var(--border,#E2E8F0);color:var(--text-primary,#1E293B)}
      .cm-table tr:last-child td{border-bottom:none}
      .cm-table tr:hover td{background:var(--bg-hover,#F0F2F5)}
      .cm-table tr.cm-ini-row--overdue td{box-shadow:inset 3px 0 0 #EF4444}
      .cm-table tr.cm-ini-row--overdue:hover td{background-color:#FEF2F2 !important}
      .cm-table tr.cm-ini-row--soon td{box-shadow:inset 3px 0 0 #F59E0B}
      .cm-table tr.cm-ini-row--soon:hover td{background-color:#FFFBEB !important}
      .cm-table tr.cm-ini-row--unassigned td{box-shadow:inset 3px 0 0 #CBD5E1}
      .cm-table tr.cm-ini-row--unassigned:hover td{background-color:#F8FAFC !important}
      .cm-table tr.cm-ini-row--done td{opacity:.7}
      .cm-table tr.cm-ini-row--done:hover td{background:#F0FDF4 !important;opacity:1}
      .cm-table-iniciativas td{vertical-align:middle}
      .cm-table-iniciativas .cm-select{font-size:.78rem !important;padding:6px 8px !important;width:100%}
      .cm-table-iniciativas .cm-input{font-size:.78rem !important;padding:6px 8px !important;width:100%}
      .cm-table-iniciativas input[type=range]{accent-color:#6366F1}
      .cm-table-iniciativas input[type=range]::-webkit-slider-thumb{cursor:grab}
      .cm-table-iniciativas input[type=range]:active::-webkit-slider-thumb{cursor:grabbing}
      .cm-initiative-status-inline{min-width:132px;font-size:.74rem;padding:5px 8px}
      .cm-ini-prog-cell{display:flex;align-items:center;gap:8px}
      .cm-ini-prog-slider{flex:1;cursor:pointer;height:18px}
      .cm-ini-prog-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid currentColor;cursor:grab;box-shadow:0 1px 3px rgba(0,0,0,.15)}
      .cm-ini-prog-slider:active::-webkit-slider-thumb{cursor:grabbing;transform:scale(1.15)}
      .cm-ini-resp-inline,.cm-ini-pillar-inline,.cm-ini-due-inline{background:transparent;border:1px solid transparent;transition:border .15s}
      .cm-ini-resp-inline:hover,.cm-ini-pillar-inline:hover,.cm-ini-due-inline:hover{border-color:var(--border,#E2E8F0);background:#fff}
      .cm-ini-resp-inline:focus,.cm-ini-pillar-inline:focus,.cm-ini-due-inline:focus{border-color:#6366F1;background:#fff;outline:none}
      .cm-ini-pri{display:inline-block;margin-left:6px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.2px;padding:1px 6px;border-radius:9999px;vertical-align:middle}
      .cm-ini-pri--overdue{background:#FEF2F2;color:#DC2626}
      .cm-ini-pri--soon{background:#FFFBEB;color:#B45309}
      .cm-ini-pri--unassigned{background:#F1F5F9;color:#64748B}

      /* Badges */
      .cm-badge{display:inline-block;padding:2px 10px;border-radius:var(--radius-full,9999px);font-size:.7rem;font-weight:600;white-space:nowrap}
      .cm-badge-red{background:#FEF2F2;color:#DC2626}
      .cm-badge-yellow{background:#FFFBEB;color:#D97706}
      .cm-badge-blue{background:#EFF6FF;color:#2563EB}
      .cm-badge-green{background:#F0FDF4;color:#15803D}
      .cm-badge-gray{background:#F1F5F9;color:var(--text-secondary,#64748B)}
      .cm-badge-primary{background:var(--primary-light,#EDF2FF);color:var(--primary,#4C6EF5)}
      .cm-badge-purple{background:#F3F0FF;color:#7C3AED}
      .cm-badge-friction{background:#FEF2F2;color:#DC2626;font-weight:600;font-size:.72rem;padding:3px 10px}
      .cm-badge-ok{background:#F0FDF4;color:#15803D;font-weight:600;font-size:.72rem;padding:3px 10px}
      .cm-ini-detail{margin-top:4px;font-size:.76rem;color:var(--text-secondary,#64748B);line-height:1.4}
      .cm-ini-scope{display:inline-flex;gap:5px;flex-wrap:wrap;margin-top:6px}
      .cm-ini-scope-tag{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:.66rem;font-weight:600;background:#F8FAFC;color:#475569;border:1px solid #E2E8F0}
      .cm-pillar-initiative-list{margin-top:10px;padding-top:10px;border-top:1px dashed var(--border,#E2E8F0)}
      .cm-pillar-initiative-item{padding:8px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:8px}
      .cm-pillar-initiative-item:last-child{margin-bottom:0}
      .cm-pillar-initiative-item .title{font-size:.76rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-pillar-initiative-item .desc{font-size:.72rem;color:var(--text-secondary,#64748B);margin-top:3px;line-height:1.35}
      .cm-pillar-initiative-item .meta{font-size:.68rem;color:var(--text-muted,#94A3B8);margin-top:5px}

      /* ── Pipeline (Mapa de Procesos) ── */
      .cm-pipeline-wrap{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);padding:24px;margin-bottom:24px;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))}
      .cm-pipeline-title{font-size:1rem;font-weight:700;margin-bottom:20px;color:var(--text-primary,#1E293B)}
      .cm-pipeline{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap}
      .cm-pipeline-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 22px;border-radius:var(--radius-xl,12px);cursor:pointer;border:2px solid var(--border,#E2E8F0);background:var(--bg-white,#fff);transition:all .25s ease;min-width:110px;position:relative}
      .cm-pipeline-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md,0 4px 6px rgba(0,0,0,.07))}
      .cm-pipeline-card.active{transform:translateY(-5px) scale(1.08);box-shadow:var(--shadow-lg,0 25px 50px rgba(0,0,0,.15));z-index:2}
      .cm-pipeline-card .p-icon{font-size:1.5rem}
      .cm-pipeline-card .p-name{font-size:.78rem;font-weight:700;text-align:center}
      .cm-pipeline-card .p-count{font-size:.68rem;color:var(--text-muted,#94A3B8)}
      .cm-pipeline-arrow{font-size:1rem;color:var(--text-muted,#94A3B8);padding:0 8px;flex-shrink:0}
      .cm-pipeline-motor{display:flex;justify-content:center;margin-top:16px}
      .cm-pipeline-motor-btn{padding:8px 20px;border-radius:var(--radius-full,9999px);border:1px solid var(--border,#E2E8F0);background:var(--bg-white,#fff);font-size:.8rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;color:var(--text-primary,#1E293B);transition:all .15s ease}
      .cm-pipeline-motor-btn:hover{background:var(--bg-hover,#F0F2F5);border-color:#CBD5E1}

      /* Phase header below pipeline */
      .cm-phase-selected-header{display:flex;align-items:center;gap:12px;margin-bottom:20px;padding:16px 20px;background:var(--bg,#F5F7FA);border-radius:var(--radius-xl,12px)}
      .cm-phase-selected-header .ph-icon{font-size:1.6rem}
      .cm-phase-selected-header .ph-info{flex:1}
      .cm-phase-selected-header .ph-name{font-size:1rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-phase-selected-header .ph-desc{font-size:.78rem;color:var(--text-muted,#94A3B8);margin-top:2px}
      .cm-phase-selected-header .ph-count{font-size:.78rem;color:var(--text-secondary,#64748B);font-weight:600}

      /* Icon buttons */
      .cm-icon-btn{background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:var(--radius-sm,4px);color:var(--text-muted,#94A3B8);font-size:.82rem;transition:all .15s ease}
      .cm-icon-btn:hover{background:var(--bg-hover,#F0F2F5);color:var(--text-primary,#1E293B)}
      .cm-icon-btn.danger:hover{color:var(--danger,#EF4444);background:#FEF2F2}

      /* Inline edit row */
      .cm-inline-edit{background:#FAFBFC}
      .cm-inline-edit td{padding:6px 8px !important}
      .cm-inline-edit .cm-input{padding:5px 8px;font-size:.8rem}

      /* ── Filter Pills (Fricciones) ── */
      .cm-filter-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
      .cm-pill{padding:6px 14px;border-radius:var(--radius-full,9999px);font-size:.76rem;font-weight:600;border:1px solid var(--border,#E2E8F0);background:var(--bg-white,#fff);color:var(--text-secondary,#64748B);cursor:pointer;font-family:inherit;transition:all .15s ease;display:inline-flex;align-items:center;gap:5px}
      .cm-pill:hover{border-color:var(--primary,#4C6EF5);color:var(--primary,#4C6EF5)}
      .cm-pill.active{background:var(--primary,#4C6EF5);color:#fff;border-color:var(--primary,#4C6EF5)}
      .cm-pill-red.active{background:#EF4444;border-color:#EF4444}
      .cm-pill-yellow.active{background:#F59E0B;border-color:#F59E0B}
      .cm-pill-green.active{background:#22C55E;border-color:#22C55E}
      .cm-pill-sep{width:1px;height:20px;background:var(--border,#E2E8F0);margin:0 4px}
      .cm-pill-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
      .cm-pill-dot-red{background:#EF4444}
      .cm-pill-dot-yellow{background:#F59E0B}
      .cm-pill-dot-green{background:#22C55E}

      /* ── Friction Cards (PDF2 design) ── */
      .cm-friction-list{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
      .cm-friction-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);overflow:hidden;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06));transition:all .2s ease;border-left:4px solid transparent}
      .cm-friction-card:hover{box-shadow:var(--shadow-md,0 4px 6px rgba(0,0,0,.07))}
      .cm-friction-card.impact-high{border-left-color:#EF4444}
      .cm-friction-card.impact-medium{border-left-color:#F59E0B}
      .cm-friction-card.impact-low{border-left-color:#3B82F6}

      .cm-friction-top-row{padding:16px 20px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
      .cm-friction-top-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .cm-friction-top-right{display:flex;align-items:center;gap:8px}
      .cm-friction-id{font-size:.72rem;font-weight:600;color:var(--text-muted,#94A3B8)}
      .cm-friction-phase-tag{font-size:.68rem;color:var(--text-muted,#94A3B8);display:flex;align-items:center;gap:3px}

      .cm-friction-title{font-size:.95rem;font-weight:700;color:var(--text-primary,#1E293B);padding:10px 20px 12px;line-height:1.4}

      /* Grey field boxes (PDF2 design) */
      .cm-field-box{background:#F8FAFC;border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-lg,8px);padding:12px 16px;margin:0 20px 10px}
      .cm-field-box .field-label{font-size:.7rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px}
      .cm-field-box .field-value{font-size:.88rem;color:var(--text-primary,#1E293B);line-height:1.5}
      .cm-field-box .field-value.green{color:#22C55E}
      .cm-field-box .field-value.orange{color:#F59E0B}
      .cm-field-box .field-value.red{color:#EF4444}

      /* Friction expandable detail */
      .cm-friction-detail{border-top:1px solid var(--border,#E2E8F0);padding:16px 20px;margin-top:8px}
      .cm-friction-field{margin-bottom:14px}
      .cm-friction-field label{font-size:.72rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:4px;font-weight:600}
      .cm-textarea{width:100%;border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:8px 10px;font-size:.82rem;font-family:inherit;color:var(--text-primary,#1E293B);resize:vertical;min-height:60px;transition:border-color .15s ease;box-sizing:border-box}
      .cm-textarea:focus{outline:none;border-color:var(--primary,#4C6EF5);box-shadow:0 0 0 3px rgba(76,110,245,.1)}
      .cm-input{border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:6px 10px;font-size:.82rem;font-family:inherit;color:var(--text-primary,#1E293B);width:100%;box-sizing:border-box;transition:border-color .15s ease}
      .cm-input:focus{outline:none;border-color:var(--primary,#4C6EF5);box-shadow:0 0 0 3px rgba(76,110,245,.1)}

      /* Status button group */
      .cm-status-group{display:inline-flex;border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);overflow:hidden}
      .cm-status-btn{padding:6px 14px;font-size:.76rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;background:var(--bg-white,#fff);color:var(--text-secondary,#64748B);transition:all .15s ease;border-right:1px solid var(--border,#E2E8F0)}
      .cm-status-btn:last-child{border-right:none}
      .cm-status-btn:hover{background:var(--bg-hover,#F0F2F5)}
      .cm-status-btn.active-pending{background:#F1F5F9;color:var(--text-primary,#1E293B)}
      .cm-status-btn.active-in_progress{background:#F3F0FF;color:#7C3AED}
      .cm-status-btn.active-completed{background:#F0FDF4;color:#15803D}

      /* Comments */
      .cm-comments-section{margin-top:16px;border-top:1px solid var(--border,#E2E8F0);padding-top:14px}
      .cm-comments-title{font-size:.76rem;font-weight:700;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px}
      .cm-comment{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9}
      .cm-comment:last-of-type{border-bottom:none}
      .cm-comment-body{flex:1}
      .cm-comment-header{display:flex;align-items:center;gap:8px;margin-bottom:2px}
      .cm-comment-author{font-size:.78rem;font-weight:600;color:var(--text-primary,#1E293B)}
      .cm-comment-time{font-size:.7rem;color:var(--text-muted,#94A3B8)}
      .cm-comment-text{font-size:.82rem;color:var(--text-primary,#1E293B);line-height:1.4}
      .cm-comment-link{font-size:.76rem;color:var(--primary,#4C6EF5);text-decoration:none;word-break:break-all}
      .cm-comment-link:hover{text-decoration:underline}
      .cm-comment-delete{background:none;border:none;color:var(--text-muted,#94A3B8);cursor:pointer;font-size:.7rem;padding:2px 4px;transition:color .15s ease}
      .cm-comment-delete:hover{color:var(--danger,#EF4444)}
      .cm-comment-form{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
      .cm-comment-form input{flex:1;min-width:120px}
      .cm-comment-form textarea{flex:2;min-width:200px;min-height:36px}

      /* Detail actions */
      .cm-detail-actions{display:flex;gap:10px;margin-top:16px;justify-content:space-between;flex-wrap:wrap}
      .cm-detail-actions-right{display:flex;gap:8px}

      /* ── Timeline (Tab 4) ── */
      .cm-timeline-group{margin-bottom:24px}
      .cm-timeline-band-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--border,#E2E8F0)}
      .cm-timeline-band-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
      .cm-timeline-band-label{font-size:.88rem;font-weight:700;color:var(--text-primary,#1E293B)}
      .cm-timeline-band-count{font-size:.72rem;padding:2px 8px;border-radius:var(--radius-full,9999px);background:var(--bg,#F5F7FA);color:var(--text-secondary,#64748B);font-weight:600}
      .cm-timeline-band-line{flex:1;height:1px;background:var(--border,#E2E8F0)}
      .cm-timeline-item{display:flex;gap:14px;padding:12px 0 12px 8px;border-bottom:1px solid #F1F5F9;align-items:flex-start}
      .cm-timeline-item:last-child{border-bottom:none}
      .cm-timeline-circle{width:28px;height:28px;border-radius:50%;border:2px solid var(--border,#E2E8F0);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.72rem;flex-shrink:0;transition:all .15s ease;background:var(--bg-white,#fff)}
      .cm-timeline-circle:hover{border-color:var(--primary,#4C6EF5);background:var(--primary-light,#EDF2FF)}
      .cm-timeline-circle.pending{color:var(--text-muted,#94A3B8)}
      .cm-timeline-circle.analysis{color:#D97706}
      .cm-timeline-circle.in_progress{background:var(--primary,#4C6EF5);border-color:var(--primary,#4C6EF5);color:#fff}
      .cm-timeline-circle.validation{background:#EDE9FE;border-color:#7C3AED;color:#5B21B6}
      .cm-timeline-circle.completed{background:var(--success,#22C55E);border-color:var(--success,#22C55E);color:#fff}
      .cm-timeline-content{flex:1;min-width:0}
      .cm-timeline-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
      .cm-timeline-fid{font-size:.72rem;font-weight:700;color:var(--text-muted,#94A3B8)}
      .cm-timeline-fname{font-size:.88rem;font-weight:600;color:var(--text-primary,#1E293B)}
      .cm-timeline-bottom{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
      .cm-timeline-solution{font-size:.78rem;color:var(--text-muted,#94A3B8);flex:1;min-width:150px;line-height:1.4}
      .cm-timeline-right{text-align:right;flex-shrink:0}
      .cm-timeline-date{font-size:.78rem;color:var(--text-secondary,#64748B);font-weight:600}
      .cm-timeline-outcome{font-size:.76rem;color:#22C55E;margin-top:2px}

      /* ── Leverage points ── */
      .cm-leverage-grid{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
      .cm-leverage-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-lg,8px);padding:16px 20px;display:flex;gap:16px;align-items:flex-start;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))}
      .cm-leverage-accent{width:4px;border-radius:2px;align-self:stretch;flex-shrink:0}
      .cm-leverage-content{flex:1}
      .cm-leverage-title{font-size:.88rem;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}
      .cm-leverage-desc{font-size:.8rem;color:var(--text-secondary,#64748B);line-height:1.5;margin-bottom:6px}
      .cm-leverage-frictions{font-size:.72rem;color:var(--text-muted,#94A3B8)}

      /* Metrics master (Tab 4) */
      .cm-metrics-grid{display:flex;flex-direction:column;gap:12px;margin-bottom:28px}
      .cm-metric-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-lg,8px);padding:16px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))}
      .cm-metric-icon{font-size:1.3rem;flex-shrink:0}
      .cm-metric-info{flex:1}
      .cm-metric-name{font-size:.85rem;font-weight:700}
      .cm-metric-question{font-size:.74rem;color:var(--text-muted,#94A3B8);margin-top:2px;font-style:italic}
      .cm-metric-inputs{display:flex;gap:8px;flex-shrink:0}
      .cm-metric-inputs label{font-size:.68rem;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px}
      .cm-metric-inputs input{width:80px}

      /* Avatar */
      .cm-avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-full,9999px);color:#fff;font-weight:700;flex-shrink:0;letter-spacing:-.5px}
      .cm-avatar-assigned{background:var(--primary,#4C6EF5)}
      .cm-avatar-empty{background:var(--border,#E2E8F0);color:var(--text-muted,#94A3B8)}

      /* Equipo tab */
      .cm-people-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px}
      .cm-person-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);padding:20px;box-shadow:var(--shadow-sm);transition:all var(--transition-base,.2s ease);cursor:pointer}
      .cm-person-card:hover{box-shadow:var(--shadow-md);border-color:var(--border-hover,#CBD5E1)}
      .cm-person-header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
      .cm-person-name{font-size:.92rem;font-weight:700;color:var(--text-primary)}
      .cm-person-role{font-size:.78rem;color:var(--text-secondary)}
      .cm-person-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .cm-person-stat{text-align:center}
      .cm-person-stat .sv{font-size:1.1rem;font-weight:700}
      .cm-person-stat .sl{font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px}
      .cm-person-detail{margin-top:20px}
      .cm-person-section{margin-bottom:20px}
      .cm-person-section-title{font-size:.88rem;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}

      /* Modal */
      .cm-modal-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:9998;display:flex;align-items:center;justify-content:center;animation:cmFadeIn .15s ease}
      @keyframes cmFadeIn{from{opacity:0}to{opacity:1}}
      .cm-modal{background:var(--bg-white,#fff);border-radius:var(--radius-xl,12px);box-shadow:var(--shadow-lg,0 25px 50px rgba(0,0,0,.15));max-width:560px;width:92%;max-height:85vh;overflow-y:auto;padding:28px;z-index:9999;animation:cmSlideUp .2s ease}
      @keyframes cmSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      .cm-modal-title{font-size:1.1rem;font-weight:700;color:var(--text-primary,#1E293B);margin-bottom:20px}
      .cm-modal-field{margin-bottom:14px}
      .cm-modal-field label{font-size:.76rem;font-weight:600;color:var(--text-secondary,#64748B);display:block;margin-bottom:4px}
      .cm-modal-field .required{color:var(--danger,#EF4444)}
      .cm-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--border,#E2E8F0)}

      /* Confirm dialog */
      .cm-confirm-text{font-size:.88rem;color:var(--text-primary,#1E293B);margin-bottom:20px;line-height:1.5}

      /* Empty state */
      .cm-empty{text-align:center;padding:60px 20px;color:var(--text-muted,#94A3B8);font-size:.9rem}

      /* Trust/Motor grid */
      .cm-motor-section{margin-top:32px;padding-top:24px;border-top:2px solid var(--border,#E2E8F0)}
      .cm-trust-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
      .cm-trust-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);padding:16px;box-shadow:var(--shadow-sm);transition:all .2s ease}
      .cm-trust-card:hover{box-shadow:var(--shadow-md);border-color:#CBD5E1}
      .cm-empty-icon{font-size:2rem;margin-bottom:8px;opacity:.5}

      /* Loading */
      .cm-loading{text-align:center;padding:60px;color:var(--text-muted,#94A3B8);font-size:.88rem}

      /* Flex spacer */
      .cm-spacer{flex:1}

      /* Status select inline */
      .cm-status-select-inline{border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:4px 8px;font-size:.72rem;font-weight:600;background:var(--bg-white,#fff);cursor:pointer;color:var(--text-secondary,#64748B)}

      /* KPI Checkboxes */
      .cm-kpi-checks{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
      .cm-chip-input-wrap{border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-lg,8px);padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:42px;cursor:text;transition:border-color .15s ease;background:var(--bg-white,#fff)}
      .cm-chip-input-wrap:focus-within{border-color:var(--primary,#4C6EF5);box-shadow:0 0 0 3px rgba(76,110,245,.1)}
      .cm-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:var(--radius-full,9999px);font-size:.78rem;font-weight:600;background:var(--primary-light,#EDF2FF);color:var(--primary,#4C6EF5);border:1px solid rgba(76,110,245,.2)}
      .cm-chip .cm-chip-x{cursor:pointer;font-size:.7rem;color:var(--text-muted,#94A3B8);margin-left:2px;line-height:1;padding:1px}
      .cm-chip .cm-chip-x:hover{color:var(--danger,#EF4444)}
      .cm-chip.cm-chip-master{background:#F0FDF4;color:#15803D;border-color:rgba(34,197,94,.2)}
      .cm-chip-text-input{border:none;outline:none;font-size:.82rem;font-family:inherit;color:var(--text-primary,#1E293B);flex:1;min-width:100px;padding:2px 0;background:transparent}
      .cm-chip-text-input::placeholder{color:var(--text-muted,#94A3B8)}
      .cm-chip-suggestions{position:relative}
      .cm-chip-dropdown{position:absolute;top:100%;left:0;right:0;background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-lg,8px);box-shadow:var(--shadow-lg);z-index:10;max-height:180px;overflow-y:auto;margin-top:4px}
      .cm-chip-dropdown-item{padding:8px 12px;font-size:.82rem;cursor:pointer;display:flex;align-items:center;gap:6px}
      .cm-chip-dropdown-item:hover{background:var(--bg-hover,#F0F2F5)}
      .cm-chip-dropdown-item.selected{background:var(--primary-light,#EDF2FF);color:var(--primary,#4C6EF5)}
      .cm-chip-dropdown-divider{border-top:1px solid var(--border,#E2E8F0);margin:4px 0}
      .cm-chip-dropdown-header{padding:6px 12px;font-size:.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;font-weight:600}
      .cm-kpi-check-label{display:flex;align-items:center;gap:4px;font-size:.8rem;cursor:pointer;padding:4px 10px;border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-full,9999px);transition:all .15s ease;background:var(--bg-white,#fff)}
      .cm-kpi-check-label:has(input:checked){background:var(--primary-light,#EDF2FF);border-color:var(--primary,#4C6EF5)}
      .cm-kpi-check-label input{accent-color:var(--primary,#4C6EF5)}
      .cm-kpi-check-name{font-weight:600;color:var(--text-primary,#1E293B)}
      .cm-kpi-check-unit{color:var(--text-muted,#94A3B8);font-size:.7rem}

      /* Responsive */
      @media(max-width:768px){
        .cm-pipeline{flex-direction:column;gap:8px}
        .cm-pipeline-arrow{transform:rotate(90deg)}
      }

      /* KPI Board Table */
      .cm-kpi-board{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-xl,12px);overflow:hidden;box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))}
      .cm-kpi-grid-wrap{overflow-x:auto}
      .cm-kpi-board-table{width:100%;border-collapse:collapse;font-size:.82rem}
      .cm-kpi-board-table thead th{padding:10px 8px;text-align:center;font-size:.68rem;font-weight:600;color:var(--text-muted,#94A3B8);text-transform:uppercase;letter-spacing:.3px;background:#F8FAFC;border-bottom:2px solid var(--border,#E2E8F0);white-space:nowrap}
      .cm-kpi-th-name{text-align:left!important;min-width:200px;position:sticky;left:0;z-index:3;background:#F8FAFC!important}
      .cm-current-col{background:var(--primary-light,#EDF2FF)!important}

      .cm-kpi-row{border-bottom:1px solid var(--border,#E2E8F0);transition:background .15s ease}
      .cm-kpi-row:hover{background:var(--bg-hover,#F0F2F5)}
      .cm-kpi-td-name{padding:12px 14px;text-align:left;position:sticky;left:0;z-index:2;background:var(--bg-white,#fff)}
      .cm-kpi-row:hover .cm-kpi-td-name{background:var(--bg-hover,#F0F2F5)}
      .cm-kpi-td-val{padding:6px 4px;text-align:center;vertical-align:middle;min-width:64px}

      .cm-kpi-row-name{font-weight:600;font-size:.88rem;cursor:pointer;color:var(--text-primary,#1E293B)}
      .cm-kpi-row-name:hover{color:var(--primary,#4C6EF5)}
      .cm-kpi-row-meta{font-size:.72rem;color:var(--text-muted,#94A3B8);margin-top:2px;display:flex;align-items:center;gap:4px}
      .cm-kpi-row-target{font-size:.68rem;color:var(--text-muted,#94A3B8);margin-top:2px}

      /* Star toggle */
      .cm-kpi-star{background:none;border:none;font-size:.9rem;cursor:pointer;color:var(--border,#E2E8F0);padding:0;line-height:1;transition:color .15s}
      .cm-kpi-star:hover{color:var(--warning,#F59E0B)}
      .cm-kpi-star.active{color:var(--warning,#F59E0B)}

      /* Semaphore dot small */
      .cm-sem-dot-sm{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0;background:var(--text-muted,#94A3B8)}
      .cm-sem-dot-sm.cm-sem-super-green{background:#059669}
      .cm-sem-dot-sm.cm-sem-green{background:#22C55E}
      .cm-sem-dot-sm.cm-sem-yellow{background:#F59E0B}
      .cm-sem-dot-sm.cm-sem-red{background:#EF4444}

      /* Semaphore dots */
      .cm-sem{display:inline-flex;align-items:center;gap:4px;font-weight:600;font-size:.85rem}
      .cm-sem-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}
      .cm-sem-super-green .cm-sem-dot{background:#059669}
      .cm-sem-green .cm-sem-dot{background:#22C55E}
      .cm-sem-yellow .cm-sem-dot{background:#F59E0B}
      .cm-sem-red .cm-sem-dot{background:#EF4444}
      .cm-sem-none{color:var(--text-muted,#94A3B8);font-size:.78rem}

      /* Value cells */
      .cm-kpi-cell{min-height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-md,8px);cursor:pointer;transition:background .15s}
      .cm-kpi-cell.has-value:hover{background:rgba(76,110,245,.06)}
      .cm-kpi-cell.empty{position:relative}
      .cm-cell-plus{color:transparent;font-size:.9rem;font-weight:300;transition:color .15s}
      .cm-kpi-cell.empty:hover .cm-cell-plus{color:var(--primary,#4C6EF5)}
      .cm-kpi-cell.empty:hover{background:rgba(76,110,245,.04);border-radius:var(--radius-md,8px)}
      .cm-kpi-cell-input{width:56px;border:2px solid var(--primary,#4C6EF5);border-radius:var(--radius-md,8px);padding:4px;font-size:.82rem;text-align:center;font-family:inherit;outline:none;background:var(--bg-white,#fff)}

      /* Threshold config (expanded row) */
      .cm-kpi-expand{background:#F8FAFC;padding:16px 20px;border-top:1px solid var(--border,#E2E8F0)}
      .cm-threshold-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}
      .cm-threshold-grid-v2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
      @media(min-width:900px){.cm-threshold-grid-v2{grid-template-columns:repeat(4,1fr)}}
      .cm-threshold-card{background:var(--bg-white,#fff);border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-lg,8px);padding:12px 14px}
      .cm-threshold-desc{width:100%;border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,6px);padding:6px 8px;font-size:.76rem;font-family:inherit;color:var(--text-secondary,#64748B);resize:vertical;margin-top:6px;min-height:40px;transition:border-color .15s}
      .cm-threshold-desc:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 2px rgba(76,110,245,.08)}
      .cm-threshold-desc::placeholder{color:var(--text-muted,#94A3B8)}
      .cm-threshold-item{text-align:center}
      .cm-threshold-item label{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:4px}
      .cm-threshold-item.super-green label{color:#059669}
      .cm-threshold-item.green label{color:#22C55E}
      .cm-threshold-item.yellow label{color:#F59E0B}
      .cm-threshold-item.red label{color:#EF4444}
      .cm-threshold-input{width:100%;border:1px solid var(--border,#E2E8F0);border-radius:var(--radius-md,8px);padding:6px 8px;text-align:center;font-size:.85rem;font-family:inherit}
      .cm-threshold-input:focus{border-color:var(--primary,#4C6EF5);box-shadow:0 0 0 2px rgba(76,110,245,.1);outline:none}

      /* Phase pill in KPI row */
      .cm-kpi-phase-pill{font-size:.6rem;padding:1px 6px;border-radius:var(--radius-full,9999px);font-weight:600}

      /* Expand row */
      .cm-kpi-expand-row td{background:#F8FAFC}
    `;
    document.head.appendChild(style);
  }

  function removeStyles() {
    var el = document.querySelector('#comercial-styles');
    if (el) el.remove();
  }

  /* ── API helpers ── */
  function apiFetch(path) {
    return fetch('/api/comercial/' + path).then(function(r) {
      if (!r.ok) throw new Error('Error ' + r.status);
      return r.json();
    });
  }

  function _parseApiError(r) {
    return r.json().then(function(body) {
      var msg = (body && body.detail) ? body.detail : ('Error ' + r.status);
      throw new Error(msg);
    }, function() { throw new Error('Error ' + r.status); });
  }
  function apiPatch(resource, id, data) {
    return fetch('/api/comercial/' + resource + '/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (!r.ok) return _parseApiError(r);
      return r.json();
    });
  }

  function apiPost(resource, data) {
    return fetch('/api/comercial/' + resource + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (!r.ok) return _parseApiError(r);
      return r.json();
    });
  }

  function apiDelete(resource, id) {
    return fetch('/api/comercial/' + resource + '/' + id, {
      method: 'DELETE'
    }).then(function(r) {
      if (!r.ok) throw new Error('Error ' + r.status);
      return r.json();
    });
  }

  /* ── Data loading ── */
  function loadBootstrap() {
    return apiFetch('bootstrap').then(function(data) {
      state.phases = data.phases || [];
      state.touchpoints = data.touchpoints || [];
      state.frictions = data.frictions || [];
      state.trust_pillars = data.trust_pillars || [];
      state.iniciativas = data.iniciativas || [];
      state.kpis = data.kpis || [];
      state.activity_log = data.activity_log || [];
      state.comments = data.comments || [];
      state.people = data.people || [];
      state.kpi_frictions = data.kpi_frictions || [];
      state.kpi_touchpoints = data.kpi_touchpoints || [];
      state.tp_kpi_history = data.tp_kpi_history || [];
      state.kpi_history = data.kpi_history || [];
      state.canvas_layout = data.canvas_layout || [];
      state.canvas_notes = data.canvas_notes || [];
      state.touchpoint_flows = data.touchpoint_flows || [];
    });
  }

  function loadDashboard() {
    return apiFetch('dashboard').then(function(data) {
      state.dashboard = data;
    });
  }

  function refreshAll() {
    return Promise.all([loadBootstrap(), loadDashboard()]);
  }

  function loadAll() {
    return refreshAll().then(function() {
      if (pendingPhaseClick) {
        activeTab = 'fricciones';
        frictionFilterPhase = pendingPhaseClick;
        pendingPhaseClick = null;
      }
      render();
    }).catch(function(err) {
      console.error('Comercial bootstrap error:', err);
      var root = container.querySelector('#comercial-module');
      if (root) root.innerHTML = '<div class="cm-empty" style="color:var(--danger,#EF4444)">Error al cargar datos. Verifica que el API este disponible.</div>';
    });
  }

  /* ── Shell ── */
  function renderShell() {
    container.innerHTML = '<div id="comercial-module"><div class="cm-loading">Cargando arquitectura comercial...</div></div>';
    injectStyles();
  }

  function render() {
    var root = container.querySelector('#comercial-module');
    if (!root) return;

    var overdueCount = getOverdueCount();

    var html = '';
    html += '<div class="cm-tabs">';
    html += tabBtn('dashboard', 'Dashboard', '');
    html += tabBtn('proceso', 'Mapa de Procesos', '');
    html += tabBtn('mapavisual', 'Mapa Visual', '');
    var fBadge = overdueCount > 0 ? '<span class="cm-tab-badge cm-tab-badge-red">(' + overdueCount + ' vencidas)</span>' : '';
    html += tabBtn('fricciones', 'Fricciones &amp; Tareas', fBadge);
    html += tabBtn('timeline', 'Linea de Tiempo', '');
    html += tabBtn('equipo', 'Equipo', '');
    var iniciOverdue = state.iniciativas.filter(function(i) { return i.status !== 'completed' && i.due_date && daysDiff(i.due_date) < 0; }).length;
    var iniciBadge = iniciOverdue > 0 ? '<span class="cm-tab-badge cm-tab-badge-red">(' + iniciOverdue + ' vencidas)</span>' : '';
    html += tabBtn('iniciativas', 'Iniciativas', iniciBadge);
    var critCount = state.kpi_touchpoints.filter(function(lk) { return lk.is_critical; }).length;
    var kpiBadge2 = critCount > 0 ? '<span class="cm-tab-badge cm-tab-badge-blue">' + critCount + '</span>' : '';
    html += tabBtn('kpis', 'KPIs Seguimiento', kpiBadge2);
    html += '</div>';
    html += '<div id="cm-main"></div>';
    root.innerHTML = html;

    root.querySelectorAll('.cm-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        activeTab = this.dataset.tab;
        render();
      });
    });

    renderTab();
  }

  function tabBtn(id, label, badge) {
    return '<button class="cm-tab' + (activeTab === id ? ' active' : '') + '" data-tab="' + id + '">' + label + (badge || '') + '</button>';
  }

  function renderTab() {
    var main = container.querySelector('#cm-main');
    if (!main) return;
    if (activeTab === 'dashboard') renderDashboard(main);
    else if (activeTab === 'proceso') renderProceso(main);
    else if (activeTab === 'mapavisual') renderMapaVisual(main);
    else if (activeTab === 'fricciones') renderFricciones(main);
    else if (activeTab === 'timeline') renderTimeline(main);
    else if (activeTab === 'equipo') renderEquipo(main);
    else if (activeTab === 'iniciativas') renderIniciativas(main);
    else if (activeTab === 'kpis') renderKpisSeguimiento(main);
  }

  /* ──────────────────────────────────────────────────
     TAB 1: DASHBOARD
     ────────────────────────────────────────────────── */
  function renderDashboard(el) {
    var d = state.dashboard;
    if (!d) { el.innerHTML = '<div class="cm-empty"><div class="cm-empty-icon">&#128202;</div>Sin datos de dashboard</div>'; return; }

    var html = '';

    // KPI cards
    var fTotal = d.total_frictions || 0;
    var fActive = d.frictions_active != null ? d.frictions_active : ((d.frictions_pending || 0) + (d.frictions_in_progress || 0) + (d.frictions_analysis || 0) + (d.frictions_validation || 0));
    var fInProgress = d.frictions_in_progress || 0;
    var fAnalysis = d.frictions_analysis || 0;
    var fValidation = d.frictions_validation || 0;
    var fPendingOnly = d.frictions_pending || 0;
    var pct = d.progress_percent || 0;
    var overdue = d.frictions_overdue || 0;
    var leadAvg = d.lead_time_days_avg;

    html += '<div class="cm-kpi-grid">';
    html += '<div class="cm-kpi-card"><div class="label">Activas (no cerradas)</div><div class="value">' + fActive + '<span style="font-size:.8rem;font-weight:400;color:var(--text-muted)"> / ' + fTotal + '</span></div><div class="sub">Seguimiento operativo</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Abiertas</div><div class="value">' + fPendingOnly + '</div><div class="sub">Sin iniciar resolución</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">En análisis</div><div class="value">' + fAnalysis + '</div><div class="sub">Diagnóstico / plan</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">En ejecución</div><div class="value primary">' + fInProgress + '</div><div class="sub">Implementación</div></div>';
    html += '</div>';
    html += '<div class="cm-kpi-grid" style="margin-top:12px">';
    html += '<div class="cm-kpi-card"><div class="label">Validación</div><div class="value">' + fValidation + '</div><div class="sub">Antes de cerrar</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Progreso</div><div class="value success">' + fmtPct(pct) + '</div><div class="sub">Fricciones completadas</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Vencidas</div><div class="value' + (overdue > 0 ? ' danger' : '') + '">' + overdue + '</div><div class="sub">' + (overdue > 0 ? 'Requieren atención' : 'Al día') + '</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Lead time medio</div><div class="value">' + (leadAvg != null ? leadAvg + ' d' : '—') + '</div><div class="sub">Cierre → inicio</div></div>';
    html += '</div>';

    // Overall progress bar
    html += '<div class="cm-progress-wrap">';
    html += '<div class="cm-progress-bar"><div class="cm-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="cm-progress-label"><span>Progreso general de fricciones</span><span>' + fmtPct(pct) + '</span></div>';
    html += '</div>';

    // Phase pipeline grid
    html += '<div class="cm-section-title">Pipeline de Fases</div>';
    html += '<div class="cm-phase-grid">';
    var phases = (d.phases || []).slice().sort(function(a,b) { return (a.order||0) - (b.order||0); });
    phases.forEach(function(ph) {
      var phPct = ph.friction_count > 0 ? Math.round(ph.friction_done / ph.friction_count * 100) : 0;
      var color = ph.color || '#4C6EF5';
      html += '<div class="cm-phase-card" data-phase-id="' + escHtml(ph.id) + '">';
      html += '<div class="cm-phase-accent" style="background:' + escHtml(color) + '"></div>';
      html += '<div class="cm-phase-body">';
      html += '<div class="cm-phase-header">';
      html += '<span class="cm-phase-icon">' + (ph.icon || '') + '</span>';
      html += '<span class="cm-phase-name">' + escHtml(ph.name) + '</span>';
      html += '</div>';
      if (ph.description) {
        html += '<div class="cm-phase-desc">' + escHtml(ph.description) + '</div>';
      }
      html += '<div class="cm-phase-stats">';
      html += '<div class="cm-phase-stat"><div class="sl">Touchpoints</div><div class="sv">' + (ph.touchpoint_count || 0) + '</div></div>';
      html += '<div class="cm-phase-stat"><div class="sl">Fricciones</div><div class="sv">' + (ph.friction_count || 0) + '</div></div>';
      html += '<div class="cm-phase-stat"><div class="sl">Resueltas</div><div class="sv">' + (ph.friction_done || 0) + '</div></div>';
      html += '</div>';
      html += '<div class="cm-phase-progress"><div class="cm-phase-progress-fill" style="width:' + phPct + '%;background:' + escHtml(color) + '"></div></div>';
      html += '</div></div>';
    });
    html += '</div>';

    // Activity Feed (latest 10)
    html += '<div class="cm-section-title">Actividad Reciente</div>';
    var recentActivity = state.activity_log.slice(0, 10);
    if (recentActivity.length === 0) {
      html += '<div class="cm-empty">No hay actividad registrada</div>';
    } else {
      html += '<ul class="cm-activity-list">';
      recentActivity.forEach(function(a) {
        var icon = a.action === 'created' || a.action === 'create' ? '&#10133;' : a.action === 'update' ? '&#9998;' : a.action === 'delete' || a.action === 'deleted' ? '&#128465;' : '&#128204;';
        html += '<li class="cm-activity-item">';
        html += '<div class="cm-activity-icon">' + icon + '</div>';
        html += '<div class="cm-activity-text">' + escHtml(a.detail || a.description || a.action || '') + '</div>';
        html += '<div class="cm-activity-time">' + relativeTime(a.created_at || a.timestamp) + '</div>';
        html += '</li>';
      });
      html += '</ul>';
    }

    // Master KPIs
    html += '<div style="margin-top:28px"></div>';
    html += '<div class="cm-section-title">KPIs Maestros</div>';
    html += '<div class="cm-master-grid" id="cm-master-kpis">';
    (d.kpis || state.kpis || []).forEach(function(k) {
      html += masterKpiCard(k);
    });
    html += '</div>';

    el.innerHTML = html;
    bindDashboardEvents(el);
  }

  function masterKpiCard(k) {
    var html = '<div class="cm-master-card" data-kpi-id="' + escHtml(k.id) + '">';
    html += '<div class="name">' + escHtml(k.name) + '</div>';
    if (k.question) {
      html += '<div class="question">' + escHtml(k.question) + '</div>';
    }
    // Owner + phase badges
    var ownerName = personName(k.owner_id);
    var pm2 = phaseMap();
    var kpiPhase = pm2[k.phase_id] || {};
    if (ownerName || kpiPhase.name) {
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">';
      if (ownerName) {
        html += '<span style="display:inline-flex;align-items:center;gap:4px">';
        html += personAvatar(k.owner_id, 20);
        html += '<span style="font-size:.74rem;color:var(--text-secondary)">' + escHtml(ownerName) + '</span>';
        html += '</span>';
      }
      if (kpiPhase.name) {
        html += '<span class="cm-badge cm-badge-primary" style="font-size:.64rem">' + escHtml(kpiPhase.name) + '</span>';
      }
      // Linked frictions count
      var linkedFrictions = state.kpi_frictions.filter(function(kf) { return kf.kpi_id == k.id; });
      if (linkedFrictions.length > 0) {
        html += '<span class="cm-badge cm-badge-gray" style="font-size:.64rem">' + linkedFrictions.length + ' fricciones</span>';
      }
      html += '</div>';
    }
    if (k.unit) {
      html += '<div class="unit-label">Unidad: ' + escHtml(k.unit) + '</div>';
    }
    html += '<div class="cm-master-row"><label>Actual</label><input class="cm-master-input" data-field="current_value" value="' + escHtml(String(k.current_value || '')) + '"></div>';
    html += '<div class="cm-master-row"><label>Meta</label><input class="cm-master-input" data-field="target_value" value="' + escHtml(String(k.target_value || '')) + '"></div>';
    html += '<div class="cm-master-kpi-actions"><button type="button" class="cm-btn cm-btn-ghost cm-btn-sm cm-kpi-hist-toggle" data-kpi-id="' + escHtml(k.id) + '">Historial y registro</button></div>';
    html += '<div class="cm-kpi-inline-hist" data-kpi-panel="' + escHtml(k.id) + '" style="display:none"></div>';
    html += '</div>';
    return html;
  }

  function loadKpiHistoryPanel(kpiId, panelEl, dashboardMainEl) {
    panelEl.innerHTML = '<div style="font-size:.78rem;color:var(--text-muted)">Cargando historial...</div>';
    fetch('/api/comercial/kpis/' + encodeURIComponent(kpiId) + '/history')
      .then(function(r) { return r.json(); })
      .then(function(rows) {
        var html = '<table class="cm-mini-table"><thead><tr><th>Fecha</th><th>Valor</th><th>Notas</th></tr></thead><tbody>';
        (rows || []).slice(0, 20).forEach(function(h) {
          var dt = (h.recorded_at || '').replace('T', ' ').substring(0, 16);
          html += '<tr><td>' + escHtml(dt) + '</td><td>' + escHtml(String(h.value)) + '</td><td>' + escHtml(h.notes || '') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += '<div class="cm-kpi-record-row">';
        html += '<input type="number" step="any" class="cm-input cm-kpi-new-val" placeholder="Nuevo valor" style="max-width:120px">';
        html += '<input type="text" class="cm-input cm-kpi-new-notes" placeholder="Notas (opcional)" style="flex:1;min-width:140px">';
        html += '<button type="button" class="cm-btn cm-btn-primary cm-btn-sm cm-kpi-record-submit">Registrar medición</button>';
        html += '</div>';
        panelEl.innerHTML = html;
        panelEl.querySelector('.cm-kpi-record-submit').addEventListener('click', function() {
          var v = panelEl.querySelector('.cm-kpi-new-val').value;
          var notes = panelEl.querySelector('.cm-kpi-new-notes').value.trim();
          if (!v) { toast('Indica un valor numérico', 'error'); return; }
          fetch('/api/comercial/kpis/' + encodeURIComponent(kpiId) + '/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: parseFloat(v, 10), notes: notes })
          }).then(function(r) {
            if (!r.ok) throw new Error('bad');
            return r.json();
          }).then(function() {
            toast('Medición registrada', 'success');
            loadKpiHistoryPanel(kpiId, panelEl, dashboardMainEl);
            if (dashboardMainEl) {
              refreshAll().then(function() { renderDashboard(dashboardMainEl); });
            }
          }).catch(function() { toast('Error al registrar', 'error'); });
        });
      }).catch(function() {
        panelEl.innerHTML = '<div style="font-size:.78rem;color:var(--danger)">No se pudo cargar el historial</div>';
      });
  }

  function bindDashboardEvents(el) {
    // Master KPI editing
    el.querySelectorAll('.cm-master-card').forEach(function(card) {
      var kpiId = card.dataset.kpiId;
      card.querySelectorAll('.cm-master-input').forEach(function(input) {
        input.addEventListener('focus', function() { this.select(); });
        input.addEventListener('blur', function() {
          var field = this.dataset.field;
          var val = this.value.trim();
          var body = {};
          body[field] = val;
          apiPatch('kpis', kpiId, body).then(function() {
            toast('KPI actualizado', 'success');
          }).catch(function() {
            toast('Error al actualizar KPI', 'error');
          });
        });
      });
      var histBtn = card.querySelector('.cm-kpi-hist-toggle');
      var histPanel = card.querySelector('.cm-kpi-inline-hist');
      if (histBtn && histPanel) {
        histBtn.addEventListener('click', function() {
          var open = histPanel.style.display !== 'none';
          histPanel.style.display = open ? 'none' : 'block';
          if (!open) loadKpiHistoryPanel(kpiId, histPanel, el);
        });
      }
    });

    // Phase card clicks -> navigate to Fricciones filtered
    el.querySelectorAll('.cm-phase-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var phaseId = this.dataset.phaseId;
        frictionFilterPhase = phaseId;
        activeTab = 'fricciones';
        render();
      });
    });
  }

  /* ──────────────────────────────────────────────────
     Journey badges helpers (derivados del grafo de flechas)
     ────────────────────────────────────────────────── */
  function _journeyBadges(tp) {
    var flows = state.touchpoint_flows || [];
    var outs = flows.filter(function(f){ return f.from_touchpoint_id === tp.id; });
    var ins = flows.filter(function(f){ return f.to_touchpoint_id === tp.id; });
    var inSamePhase = function(otherId) {
      var o = state.touchpoints.find(function(t){ return t.id === otherId; });
      return o && o.phase_id === tp.phase_id;
    };
    var hasInPhase = outs.some(function(f){ return inSamePhase(f.to_touchpoint_id); }) ||
                     ins.some(function(f){ return inSamePhase(f.from_touchpoint_id); });
    var badges = [];
    if (!hasInPhase) badges.push({ text: '⏱ Paralelo', cls: 'badge-parallel' });
    if (outs.length > 1) badges.push({ text: '→ Bifurca a ' + outs.length, cls: 'badge-fork' });
    if (ins.length > 1) badges.push({ text: '← Une desde ' + ins.length, cls: 'badge-join' });
    if (outs.length === 1 && ins.length === 0) badges.push({ text: '⚓ Inicio', cls: 'badge-start' });
    if (_hasCycle(tp.id)) badges.push({ text: '🔁 Bucle', cls: 'badge-loop' });
    return badges;
  }

  function _hasCycle(startId) {
    var flows = state.touchpoint_flows || [];
    var visited = {};
    var stack = [startId];
    while (stack.length > 0) {
      var cur = stack.pop();
      var children = flows.filter(function(f){ return f.from_touchpoint_id === cur; }).map(function(f){ return f.to_touchpoint_id; });
      for (var i = 0; i < children.length; i++) {
        if (children[i] === startId) return true;
        if (!visited[children[i]]) { visited[children[i]] = true; stack.push(children[i]); }
      }
    }
    return false;
  }

  function _badgesHTML(badges) {
    if (!badges || badges.length === 0) return '';
    return '<div class="cm-journey-badges">' + badges.map(function(b) {
      return '<span class="cm-journey-badge ' + b.cls + '">' + escHtml(b.text) + '</span>';
    }).join('') + '</div>';
  }

  function _canvasFocusOn(type, id) {
    activeTab = 'mapavisual';
    pendingCanvasFocus = { type: type, id: String(id) };
    render();
  }

  /* ──────────────────────────────────────────────────
     Resizable table columns (cm-table)
     - Adds drag-handle on right edge of each <th>
     - Persists per-table widths in localStorage(key)
     ────────────────────────────────────────────────── */
  function _makeTableResizable(table, storageKey) {
    if (!table || table.dataset.resizableInited === '1') return;
    table.dataset.resizableInited = '1';

    var saved = null;
    try {
      var raw = storageKey ? localStorage.getItem('cm.colw.' + storageKey) : null;
      if (raw) saved = JSON.parse(raw);
    } catch(e) { saved = null; }

    var ths = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    var minW = 48;

    // Apply saved widths if any (and same column count)
    if (saved && Array.isArray(saved) && saved.length === ths.length) {
      ths.forEach(function(th, i) {
        if (saved[i] && saved[i] > 0) th.style.width = saved[i] + 'px';
      });
    }

    function persist() {
      if (!storageKey) return;
      try {
        var widths = ths.map(function(th){ return Math.round(th.getBoundingClientRect().width); });
        localStorage.setItem('cm.colw.' + storageKey, JSON.stringify(widths));
      } catch(e) {}
    }

    ths.forEach(function(th, i) {
      // No resizer on last column (avoids extra horizontal scroll)
      if (i === ths.length - 1) return;
      // Skip if resizer already present
      if (th.querySelector('.cm-col-resizer')) return;
      var grip = document.createElement('div');
      grip.className = 'cm-col-resizer';
      grip.addEventListener('mousedown', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var startX = ev.clientX;
        var startW = th.getBoundingClientRect().width;
        grip.classList.add('cm-resizing');
        document.body.classList.add('cm-col-resizing');

        function onMove(e) {
          var dx = e.clientX - startX;
          var newW = Math.max(minW, startW + dx);
          th.style.width = newW + 'px';
        }
        function onUp() {
          grip.classList.remove('cm-resizing');
          document.body.classList.remove('cm-col-resizing');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          persist();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      // Prevent the th drag handlers (e.g., draggable rows) from interfering
      grip.addEventListener('click', function(e) { e.stopPropagation(); });
      th.appendChild(grip);
    });
  }

  /* ──────────────────────────────────────────────────
     TAB 2: MAPA DE PROCESOS
     ────────────────────────────────────────────────── */
  function renderProceso(el) {
    var html = '';
    var pm = phaseMap();
    var sortedPhases = state.phases.slice().sort(function(a,b) { return (a.order||0) - (b.order||0); });

    // Ensure selectedPhase is valid
    if (!pm[selectedPhase] && sortedPhases.length > 0) {
      selectedPhase = sortedPhases[0].id;
    }
    var activePhaseObj = pm[selectedPhase] || {};

    // A) Macro Proceso Comercial pipeline
    html += '<div class="cm-pipeline-wrap">';
    html += '<div class="cm-pipeline-title">Macro Proceso Comercial</div>';
    html += '<div class="cm-pipeline">';
    // "Ver Todos" card first
    var isAll = selectedPhase === '__all__';
    html += '<div class="cm-pipeline-card' + (isAll ? ' active' : '') + '" data-phase-id="__all__" style="' + (isAll ? 'border-color:var(--primary);box-shadow:0 8px 25px rgba(76,110,245,.15);' : '') + '">';
    html += '<span class="p-icon">&#128209;</span>';
    html += '<span class="p-name">Ver Todos</span>';
    html += '<span class="p-count">' + state.touchpoints.length + ' pts</span>';
    html += '</div>';
    html += '<span class="cm-pipeline-arrow">|</span>';
    sortedPhases.forEach(function(ph, idx) {
      if (idx > 0) {
        html += '<span class="cm-pipeline-arrow">&rarr;</span>';
      }
      var tpCount = state.touchpoints.filter(function(tp) { return String(tp.phase_id) === String(ph.id); }).length;
      var color = ph.color || '#4C6EF5';
      var isActive = String(ph.id) === String(selectedPhase);
      var cardStyle = '';
      if (isActive) {
        cardStyle = 'border-color:' + escHtml(color) + ';box-shadow:0 8px 25px ' + escHtml(color) + '20;';
      }
      html += '<div class="cm-pipeline-card' + (isActive ? ' active' : '') + '" data-phase-id="' + escHtml(ph.id) + '" style="' + cardStyle + '">';
      html += '<span class="p-icon">' + (ph.icon || '') + '</span>';
      html += '<span class="p-name">' + escHtml(ph.name) + '</span>';
      html += '<span class="p-count">' + tpCount + ' pts</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // B) Render touchpoints per phase (or all phases)
    var phasesToShow = isAll ? sortedPhases : [activePhaseObj];

    phasesToShow.forEach(function(phObj) {
      if (!phObj || !phObj.id) return;
      var phaseTps = state.touchpoints.filter(function(tp) { return String(tp.phase_id) === String(phObj.id); });
      phaseTps.sort(function(a,b) { return (a.order||0) - (b.order||0); });

      // Phase header
      html += '<div class="cm-phase-selected-header">';
      html += '<span class="ph-icon">' + (phObj.icon || '') + '</span>';
      html += '<div class="ph-info">';
      html += '<div class="ph-name">' + escHtml(phObj.name || '') + '</div>';
      if (phObj.description) {
        var phaseIniCount = state.iniciativas.filter(function(ii) { return String(ii.phase_id || '') === String(phObj.id); }).length;
        html += '<div class="ph-desc">' + escHtml(phObj.description) + ' &mdash; ' + phaseTps.length + ' touchpoints &mdash; ' + phaseIniCount + ' iniciativas</div>';
      }
      html += '</div>';
      if (!isAll) {
        html += '<button class="cm-btn cm-btn-primary cm-btn-sm cm-new-tp-btn" data-phase-id="' + escHtml(phObj.id) + '">+ Nuevo Touchpoint</button>';
      }
      html += '</div>';

      // Touchpoints Table
      if (phaseTps.length > 0) {
        html += '<div class="cm-table-wrap" style="margin-bottom:24px"><table class="cm-table cm-tp-table" data-phase-id="' + escHtml(phObj.id) + '">';
        html += '<thead><tr><th style="width:28px"></th><th style="width:40px">#</th><th>Touchpoint</th><th>Canal</th><th>Responsable</th><th>KPI</th><th>Friccion</th><th style="width:120px">Iniciativas</th>';
        html += '<th style="width:120px;text-align:center">Acciones</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        phaseTps.forEach(function(tp, idx) {
          var hasFriction = tp.has_friction || false;
          var frictionText = tp.friction_text || '';
          var respName = personName(tp.responsable_id) || tp.responsable || '';
          var badges = _journeyBadges(tp);
          html += '<tr data-tp-id="' + escHtml(tp.id) + '" draggable="true"' + (hasFriction ? ' style="border-left:4px solid var(--warning)"' : '') + '>';
          html += '<td class="cm-tp-drag-handle" title="Arrastra para reordenar (display only)">⠿</td>';
          html += '<td>' + tp.id + '</td>';
          html += '<td style="font-weight:600">' + escHtml(tp.name) + _badgesHTML(badges) + '</td>';
          html += '<td>' + escHtml(tp.canal || '') + '</td>';
          html += '<td>' + (tp.responsable_id ? personAvatar(tp.responsable_id, 20) + ' ' : '') + escHtml(respName) + '</td>';
          var tpKpis = getLinkedKpisForTouchpoint(tp.id);
          html += '<td>' + escHtml(tp.kpi || '');
          if (tpKpis.length > 0) {
            html += '<div style="margin-top:4px">' + kpiBadges(tpKpis) + '</div>';
          }
          html += '</td>';
          if (hasFriction && frictionText) {
            html += '<td><span class="cm-badge-friction">' + escHtml(frictionText) + '</span></td>';
          } else {
            html += '<td><span class="cm-badge-ok">&#10003; OK</span></td>';
          }
          // Iniciativas chip
          var tpInis = state.iniciativas.filter(function(ii) {
            var tids = ii.touchpoint_ids || (ii.touchpoint_id ? [ii.touchpoint_id] : []);
            return tids.indexOf(tp.id) >= 0;
          });
          var tpDone = tpInis.filter(function(ii){ return ii.status === 'completed'; }).length;
          var tpAvg = tpInis.length > 0 ? Math.round(tpInis.reduce(function(s,ii){ return s + (ii.progress||0); }, 0) / tpInis.length) : 0;
          html += '<td>';
          if (tpInis.length > 0) {
            var col = tpAvg >= 100 ? '#10B981' : (tpAvg >= 50 ? '#6366F1' : (tpAvg > 0 ? '#F59E0B' : '#94A3B8'));
            html += '<div style="font-size:.72rem;font-weight:700;color:' + col + '">' + tpDone + '/' + tpInis.length + ' · ' + tpAvg + '%</div>';
            html += '<div style="height:4px;background:#E2E8F0;border-radius:9999px;overflow:hidden;margin-top:3px"><div style="height:100%;width:' + tpAvg + '%;background:' + col + '"></div></div>';
          } else {
            html += '<span style="font-size:.7rem;color:var(--text-muted);font-style:italic">Sin iniciativas</span>';
          }
          html += '</td>';
          html += '<td style="text-align:center">';
          html += '<button class="cm-icon-btn cm-tp-view-canvas" data-tp-id="' + escHtml(tp.id) + '" title="Ver en Mapa Visual">&#128065;</button>';
          if (!isAll) {
            html += '<button class="cm-icon-btn cm-edit-tp" data-tp-id="' + escHtml(tp.id) + '" title="Editar">&#9998;</button>';
            html += '<button class="cm-icon-btn danger cm-delete-tp" data-tp-id="' + escHtml(tp.id) + '" title="Eliminar">&#128465;</button>';
          }
          html += '</td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }
    });

    // C) Motor de Confianza section (always visible below)
    html += '<div class="cm-motor-section">';
    html += '<div class="cm-section-title" style="margin-top:8px">&#9889; Motor de Confianza</div>';
    html += '<div class="cm-trust-grid">';
    state.trust_pillars.forEach(function(p) {
      var actions = [];
      if (typeof p.actions === 'string') {
        try { actions = JSON.parse(p.actions); } catch(e) { actions = p.actions.split('\\n').filter(Boolean); }
      } else if (Array.isArray(p.actions)) { actions = p.actions; }

      html += '<div class="cm-trust-card" data-pillar-id="' + escHtml(p.id) + '">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
      html += '<span style="font-size:1.3rem">' + (p.icon || '') + '</span>';
      html += '<span style="font-size:.92rem;font-weight:700;flex:1">' + escHtml(p.name) + '</span>';
      html += statusBadge(p.status || 'pending');
      html += '</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">';
      html += '<div class="cm-field-box" style="margin:0"><div class="field-label">Estado Actual</div><div class="field-value" style="font-size:.8rem">' + escHtml(p.current_state || 'Sin definir') + '</div></div>';
      html += '<div class="cm-field-box" style="margin:0"><div class="field-label">Estado Objetivo</div><div class="field-value" style="font-size:.8rem">' + escHtml(p.target_state || 'Sin definir') + '</div></div>';
      html += '</div>';
      var linkedInitiatives = state.iniciativas.filter(function(ii) {
        var pids = ii.pillar_ids || (ii.pillar_id ? [ii.pillar_id] : []);
        return pids.indexOf(p.id) >= 0;
      });
      var doneCount = linkedInitiatives.filter(function(ii){ return ii.status === 'completed'; }).length;
      var avgProgress = linkedInitiatives.length > 0
        ? Math.round(linkedInitiatives.reduce(function(s, ii){ return s + (ii.progress || 0); }, 0) / linkedInitiatives.length)
        : 0;
      var pillarHeader = '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;margin-bottom:4px">';
      pillarHeader += '<div style="font-size:.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;font-weight:700">Iniciativas (' + doneCount + '/' + linkedInitiatives.length + ')</div>';
      pillarHeader += '<button class="cm-icon-btn cm-pillar-add-ini" data-pid="' + escHtml(p.id) + '" title="Agregar iniciativa" style="font-size:.85rem">+</button>';
      pillarHeader += '</div>';
      if (linkedInitiatives.length > 0) {
        pillarHeader += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
        pillarHeader += '<div style="flex:1;height:6px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + avgProgress + '%;background:#6366F1;transition:width .3s"></div></div>';
        pillarHeader += '<span style="font-size:.7rem;font-weight:700;color:var(--text-secondary);min-width:32px;text-align:right">' + avgProgress + '%</span>';
        pillarHeader += '</div>';
      }
      html += pillarHeader;
      if (linkedInitiatives.length > 0) {
        html += '<div class="cm-pillar-initiative-list" style="margin-top:0;padding-top:0;border-top:none">';
        linkedInitiatives.forEach(function(ii) {
          var resp = personName(ii.responsable_id) || 'Sin asignar';
          var due = ii.due_date ? fmtDate(ii.due_date) : '';
          var prog = ii.progress || 0;
          html += '<div class="cm-pillar-initiative-item">';
          html += '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">';
          html += '<div class="title" style="flex:1">' + escHtml(ii.title || '') + '</div>';
          html += statusBadge(ii.status || 'pending');
          html += '</div>';
          if (ii.target) html += '<div class="desc" style="color:#475569"><b>Meta:</b> ' + escHtml(ii.target) + '</div>';
          if (ii.description) html += '<div class="desc">' + escHtml(ii.description) + '</div>';
          html += '<div style="display:flex;align-items:center;gap:6px;margin-top:6px">';
          html += '<div style="flex:1;height:5px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + prog + '%;background:' + (prog >= 100 ? '#10B981' : '#6366F1') + ';transition:width .3s"></div></div>';
          html += '<span style="font-size:.66rem;font-weight:700;color:var(--text-muted);min-width:30px;text-align:right">' + prog + '%</span>';
          html += '</div>';
          html += '<div class="meta" style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:6px">';
          html += '<span><b>' + escHtml(resp) + '</b>' + (due ? ' · ' + escHtml(due) : '') + '</span>';
          html += '<button class="cm-icon-btn cm-pillar-edit-ini" data-id="' + escHtml(ii.id) + '" title="Editar" style="padding:2px 6px">&#9998;</button>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      } else if (actions.length > 0) {
        html += '<div style="font-size:.72rem;color:var(--text-muted);font-style:italic">Sugerencias: ' + actions.map(escHtml).join(', ') + '</div>';
      }
      html += '<div style="margin-top:10px;display:flex;gap:6px">';
      html += '<select class="cm-select cm-pillar-status" data-pid="' + escHtml(p.id) + '" style="font-size:.76rem">';
      ['pending','in_progress','completed'].forEach(function(s) {
        html += '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + statusLabel(s) + '</option>';
      });
      html += '</select>';
      html += '<button class="cm-icon-btn cm-edit-pillar" data-pid="' + escHtml(p.id) + '" title="Editar">&#9998;</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    el.innerHTML = html;

    // Make every touchpoint table resizable (one storage key per phase)
    el.querySelectorAll('.cm-tp-table').forEach(function(tbl) {
      var phaseKey = tbl.getAttribute('data-phase-id') || 'all';
      _makeTableResizable(tbl, 'tp.' + phaseKey);
    });

    // Bind pipeline card clicks
    el.querySelectorAll('.cm-pipeline-card').forEach(function(card) {
      card.addEventListener('click', function() {
        selectedPhase = this.dataset.phaseId;
        renderProceso(el);
      });
    });

    // New touchpoint buttons
    el.querySelectorAll('.cm-new-tp-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showCreateTouchpointModal(this.dataset.phaseId, el);
      });
    });

    // Edit touchpoint buttons
    el.querySelectorAll('.cm-edit-tp').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showEditTouchpointRow(this.dataset.tpId, el);
      });
    });

    // Delete touchpoint buttons
    el.querySelectorAll('.cm-delete-tp').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteTouchpoint(this.dataset.tpId, el);
      });
    });

    // View in canvas buttons
    el.querySelectorAll('.cm-tp-view-canvas').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _canvasFocusOn('touchpoint', this.dataset.tpId);
      });
    });

    // Drag-and-drop reorder de touchpoints (display order only)
    el.querySelectorAll('.cm-tp-table').forEach(function(tbl) {
      var phaseId = tbl.getAttribute('data-phase-id');
      var tbody = tbl.querySelector('tbody');
      if (!tbody) return;
      var dragRow = null;
      tbody.querySelectorAll('tr[data-tp-id]').forEach(function(tr) {
        tr.addEventListener('dragstart', function(e) {
          dragRow = this;
          this.classList.add('cm-tp-dragging');
          if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', this.dataset.tpId); }
        });
        tr.addEventListener('dragend', function() {
          if (dragRow) dragRow.classList.remove('cm-tp-dragging');
          dragRow = null;
          tbody.querySelectorAll('.cm-tp-drop-above,.cm-tp-drop-below').forEach(function(r){ r.classList.remove('cm-tp-drop-above','cm-tp-drop-below'); });
        });
        tr.addEventListener('dragover', function(e) {
          if (!dragRow || dragRow === this) return;
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          var rect = this.getBoundingClientRect();
          var midY = rect.top + rect.height / 2;
          tbody.querySelectorAll('.cm-tp-drop-above,.cm-tp-drop-below').forEach(function(r){ r.classList.remove('cm-tp-drop-above','cm-tp-drop-below'); });
          if (e.clientY < midY) this.classList.add('cm-tp-drop-above');
          else this.classList.add('cm-tp-drop-below');
        });
        tr.addEventListener('drop', function(e) {
          if (!dragRow || dragRow === this) return;
          e.preventDefault();
          var rect = this.getBoundingClientRect();
          var before = e.clientY < rect.top + rect.height / 2;
          if (before) tbody.insertBefore(dragRow, this);
          else tbody.insertBefore(dragRow, this.nextSibling);
          // Persistir
          var ids = Array.from(tbody.querySelectorAll('tr[data-tp-id]')).map(function(r){ return parseInt(r.dataset.tpId, 10); });
          fetch('/api/comercial/touchpoints/reorder', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase_id: phaseId, ids: ids })
          }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
            .then(function() {
              ids.forEach(function(id, idx) {
                var t = state.touchpoints.find(function(x){ return x.id === id; });
                if (t) t.order = idx;
              });
              toast('Orden actualizado', 'success');
            }).catch(function(){ toast('Error al reordenar','error'); renderProceso(el); });
        });
      });
    });

    // Pillar status changes
    el.querySelectorAll('.cm-pillar-status').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var pid = this.dataset.pid;
        apiPatch('trust-pillars', pid, { status: this.value }).then(function() {
          state.trust_pillars.forEach(function(p) { if (p.id === pid) p.status = sel.value; });
          toast('Pilar actualizado', 'success');
          renderProceso(el);
        }).catch(function() { toast('Error', 'error'); });
      });
    });

    // Edit pillar buttons
    el.querySelectorAll('.cm-edit-pillar').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showEditPillarModal(this.dataset.pid, el);
      });
    });

    // Add initiative to pillar
    el.querySelectorAll('.cm-pillar-add-ini').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showInitiativeModal(null, el, { pillar_id: this.dataset.pid });
      });
    });

    // Edit linked initiative from pillar card
    el.querySelectorAll('.cm-pillar-edit-ini').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showInitiativeModal(this.dataset.id, el);
      });
    });
  }

  /* ──────────────────────────────────────────────────
     MAPA VISUAL — vista canvas del proceso comercial
     ────────────────────────────────────────────────── */
  function _initiativesForTouchpoint(tpId) {
    return state.iniciativas.filter(function(ii) {
      var tids = ii.touchpoint_ids || (ii.touchpoint_id ? [ii.touchpoint_id] : []);
      return tids.indexOf(tpId) >= 0;
    });
  }
  function _initiativesForFriction(fId) {
    return state.iniciativas.filter(function(ii) {
      var fids = ii.friction_ids || [];
      return fids.indexOf(fId) >= 0 || fids.indexOf(String(fId)) >= 0;
    });
  }
  function _frictionsForTouchpoint(tpId) {
    return (state.frictions || []).filter(function(f) {
      return f.touchpoint_id === tpId;
    });
  }
  function _kpiSemColor(k) {
    if (!k || k.current_value == null) return null;
    var v = k.current_value;
    var dir = k.direction || 'higher';
    var sg = k.threshold_super_green, gn = k.threshold_green, yl = k.threshold_yellow;
    if (sg == null && gn == null && yl == null) return null;
    if (dir === 'higher') {
      if (sg != null && v >= sg) return 'green';
      if (gn != null && v >= gn) return 'green';
      if (yl != null && v >= yl) return 'yellow';
      return 'red';
    } else {
      if (sg != null && v <= sg) return 'green';
      if (gn != null && v <= gn) return 'green';
      if (yl != null && v <= yl) return 'yellow';
      return 'red';
    }
  }
  function computeTouchpointHealth(tp) {
    var fricts = _frictionsForTouchpoint(tp.id);
    var inis = _initiativesForTouchpoint(tp.id);
    var score = 0;
    fricts.forEach(function(f) {
      if (f.status === 'completed') return;
      var fInis = _initiativesForFriction(f.id);
      var avgFInisProg = fInis.length > 0 ? (fInis.reduce(function(s,ii){return s + (ii.progress||0);},0) / fInis.length) : 0;
      if (f.impact === 'high') {
        if (fInis.length === 0) score += 3;
        else if (avgFInisProg < 30) score += 2;
        else score += 1;
      } else if (f.impact === 'medium') {
        score += 1;
      }
    });
    var tpKpiLinks = state.kpi_touchpoints.filter(function(lk){ return lk.touchpoint_id === tp.id; });
    tpKpiLinks.forEach(function(lk) {
      var k = state.kpis.find(function(x){ return x.id === lk.kpi_id; });
      if (!k) return;
      var sem = _kpiSemColor(k);
      if (sem === 'red') score += 2;
      else if (sem === 'yellow') score += 1;
    });
    inis.forEach(function(ii) {
      if (ii.status !== 'completed' && ii.due_date && daysDiff(ii.due_date) < 0) score += 2;
    });
    var hasData = fricts.length > 0 || inis.length > 0 || tpKpiLinks.length > 0;
    if (!hasData) return { level: 'gray', score: 0 };
    if (score >= 4) return { level: 'red', score: score };
    if (score >= 2) return { level: 'yellow', score: score };
    return { level: 'green', score: score };
  }
  var _healthCfg = {
    green:  { bg: '#F0FDF4', border: '#BBF7D0', dot: '#10B981', label: 'Sano' },
    yellow: { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', label: 'Atención' },
    red:    { bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', label: 'Crítico' },
    gray:   { bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8', label: 'Sin datos' }
  };
  var _impactCfg = {
    high:   { color: '#EF4444', bg: '#FEF2F2', label: 'Alto' },
    medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'Medio' },
    low:    { color: '#94A3B8', bg: '#F1F5F9', label: 'Bajo' }
  };

  /* ──────────────────────────────────────────────────
     MAPA VISUAL v2 — Canvas con toolbar, fullscreen,
     filtros, drag-to-link, crear nodos, bandas de fase
     ────────────────────────────────────────────────── */
  var canvasState = {
    x: 0, y: 0, zoom: 1,
    layout: {},
    pendingSaves: {},
    saveTimer: null,
    saveStatus: 'idle',     // idle | saving | saved | error
    saveStatusTimer: null,
    selectedKey: null,
    isPanning: false,
    panStart: null,
    filters: { q: '', phase: [], resp: [], impact: [], health: [] },
    critical: false,
    locked: false,
    snap: false,
    linkMode: false,
    fullscreen: false,
    linkDraft: null,        // { fromType, fromId, fromSide, fromX, fromY, currentX, currentY }
    dropMode: null,         // null | 'touchpoint' | 'friction' | 'note'
    selectedFlowId: null,   // edge seleccionado
    dropTargetKey: null,    // key del nodo bajo cursor durante drag-to-link
    phaseDrag: null,        // { phaseId, startX, startY, originals: {tpId: {x,y}} }
    edgeMidpoints: {}       // flowId -> {x,y} para colocar widgets
  };

  var _activeDrag = null;
  var _PHASE_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6'];

  function _layoutKey(type, id) { return type + ':' + id; }

  function _autoSeedLayout(force) {
    var phases = state.phases.slice().sort(function(a,b){ return (a.order||0) - (b.order||0); });
    var COL_W = 320, COL_GAP = 60, ROW_H = 200, NODE_W = 240;
    var FRICTION_OFFSET_Y = 140, FRICTION_GAP = 60, FRICTION_W = 200;
    phases.forEach(function(ph, phIdx) {
      var phTps = state.touchpoints
        .filter(function(t){ return t.phase_id === ph.id; })
        .sort(function(a,b){ return (a.order||0) - (b.order||0); });
      var colX = phIdx * (COL_W + COL_GAP);
      phTps.forEach(function(tp, i) {
        var k = _layoutKey('touchpoint', String(tp.id));
        if (force || !canvasState.layout[k]) {
          canvasState.layout[k] = { x: colX, y: i * ROW_H };
        }
        var fricts = _frictionsForTouchpoint(tp.id);
        fricts.forEach(function(f, fi) {
          var fk = _layoutKey('friction', String(f.id));
          if (force || !canvasState.layout[fk]) {
            var tpPos = canvasState.layout[k];
            canvasState.layout[fk] = {
              x: tpPos.x + (NODE_W - FRICTION_W) / 2 + (fi % 2 === 0 ? -110 : 110),
              y: tpPos.y + FRICTION_OFFSET_Y + Math.floor(fi / 2) * FRICTION_GAP
            };
          }
        });
      });
    });
    // Notas: posición por defecto en (50,50) +offset si no tienen
    (state.canvas_notes || []).forEach(function(n, i) {
      var nk = _layoutKey('note', String(n.id));
      if (!canvasState.layout[nk]) {
        canvasState.layout[nk] = { x: 50 + i * 30, y: 50 + i * 30 };
      }
    });
  }

  function _loadLayoutFromState() {
    canvasState.layout = {};
    (state.canvas_layout || []).forEach(function(row) {
      var x = Number(row.x), y = Number(row.y);
      if (!isFinite(x) || !isFinite(y)) return;
      canvasState.layout[_layoutKey(row.entity_type, row.entity_id)] = { x: x, y: y };
    });
  }

  function _setSaveStatus(status) {
    canvasState.saveStatus = status;
    var el = document.querySelector('#cm-canvas-save-indicator');
    if (!el) return;
    el.classList.remove('saving','saved','error');
    if (status === 'saving') {
      el.textContent = '💾 Guardando…';
      el.classList.add('saving');
      el.style.display = 'inline-flex';
    } else if (status === 'saved') {
      el.textContent = '✓ Guardado';
      el.classList.add('saved');
      el.style.display = 'inline-flex';
      if (canvasState.saveStatusTimer) clearTimeout(canvasState.saveStatusTimer);
      canvasState.saveStatusTimer = setTimeout(function() {
        el.style.display = 'none';
        canvasState.saveStatus = 'idle';
      }, 1500);
    } else if (status === 'error') {
      el.textContent = '⚠ Error al guardar';
      el.classList.add('error');
      el.style.display = 'inline-flex';
    } else {
      el.style.display = 'none';
    }
  }

  function _scheduleLayoutSave(key, entityType, entityId, x, y) {
    canvasState.pendingSaves[key] = { entity_type: entityType, entity_id: String(entityId), x: x, y: y };
    if (canvasState.saveTimer) clearTimeout(canvasState.saveTimer);
    _setSaveStatus('saving');
    canvasState.saveTimer = setTimeout(function() {
      var items = Object.keys(canvasState.pendingSaves).map(function(k){ return canvasState.pendingSaves[k]; });
      canvasState.pendingSaves = {};
      if (items.length === 0) return;
      fetch('/api/comercial/canvas-layout/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view_id: 'comercial_main', items: items })
      }).then(function(r) {
        if (!r.ok) throw new Error('save failed');
        return r.json();
      }).then(function(rows) {
        state.canvas_layout = rows;
        _setSaveStatus('saved');
      }).catch(function() {
        _setSaveStatus('error');
        toast('Error al guardar posiciones', 'error');
      });
    }, 400);
  }

  // Flush sincrónico de saves pendientes al cerrar la pestaña.
  // Sin esto, el debounce de 400ms se pierde si cierras justo después de mover.
  function _flushPendingLayoutSaves() {
    var items = Object.keys(canvasState.pendingSaves).map(function(k){ return canvasState.pendingSaves[k]; });
    if (items.length === 0) return;
    canvasState.pendingSaves = {};
    if (canvasState.saveTimer) { clearTimeout(canvasState.saveTimer); canvasState.saveTimer = null; }
    var payload = JSON.stringify({ view_id: 'comercial_main', items: items });
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/comercial/canvas-layout/bulk', blob);
    } else {
      fetch('/api/comercial/canvas-layout/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: payload, keepalive: true,
      });
    }
  }
  if (!window._cmCanvasBeforeUnloadInited) {
    window._cmCanvasBeforeUnloadInited = true;
    window.addEventListener('beforeunload', _flushPendingLayoutSaves);
    window.addEventListener('pagehide', _flushPendingLayoutSaves);
  }

  function _saveAllLayout() {
    var items = Object.keys(canvasState.layout).map(function(k) {
      var parts = k.split(':');
      var pos = canvasState.layout[k];
      return { entity_type: parts[0], entity_id: parts[1], x: pos.x, y: pos.y };
    });
    if (items.length === 0) return Promise.resolve();
    _setSaveStatus('saving');
    return fetch('/api/comercial/canvas-layout/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_id: 'comercial_main', items: items })
    }).then(function(r) {
      if (!r.ok) throw new Error('save failed');
      return r.json();
    }).then(function(rows) {
      state.canvas_layout = rows;
      _setSaveStatus('saved');
    }).catch(function() {
      _setSaveStatus('error');
    });
  }

  function _applyTransform(stage) {
    if (!stage) return;
    stage.style.transform = 'translate(' + canvasState.x + 'px, ' + canvasState.y + 'px) scale(' + canvasState.zoom + ')';
    var lbl = document.querySelector('#cm-canvas-zoom-label');
    if (lbl) lbl.textContent = Math.round(canvasState.zoom * 100) + '%';
  }

  function _canvasSnapValue(v) {
    if (!canvasState.snap) return v;
    return Math.round(v / 20) * 20;
  }

  function renderMapaVisual(el) {
    _loadLayoutFromState();
    _autoSeedLayout(false);
    canvasState.x = 0; canvasState.y = 0; canvasState.zoom = 1;
    canvasState.selectedKey = null;
    canvasState.linkDraft = null;
    canvasState.dropMode = null;

    var totals = { tps: state.touchpoints.length, fricts: (state.frictions||[]).length, inis: state.iniciativas.length };
    var counts = { green: 0, yellow: 0, red: 0, gray: 0 };
    state.touchpoints.forEach(function(tp) {
      var h = computeTouchpointHealth(tp);
      counts[h.level] = (counts[h.level] || 0) + 1;
    });

    var html = '';

    // Toolbar sticky
    html += '<div class="cm-canvas-toolbar" id="cm-canvas-toolbar">';
    html += '<div class="cm-canvas-toolbar-row">';
    html += '<div class="cm-canvas-search-wrap">';
    html += '<span class="cm-canvas-search-icon">🔍</span>';
    html += '<input type="text" class="cm-canvas-search" id="cm-canvas-search" placeholder="Buscar touchpoint o fricción..." value="' + escHtml(canvasState.filters.q) + '">';
    html += '</div>';
    html += '<div class="cm-canvas-filters">';
    html += _filterDropdown('phase', 'Fase', state.phases.map(function(p){ return { value: p.id, label: p.name }; }));
    var respOpts = (state.people || []).map(function(p){ return { value: String(p.id), label: p.name }; });
    html += _filterDropdown('resp', 'Responsable', respOpts);
    html += _filterDropdown('impact', 'Impacto', [{value:'high',label:'Alto'},{value:'medium',label:'Medio'},{value:'low',label:'Bajo'}]);
    html += _filterDropdown('health', 'Salud', [{value:'red',label:'🔴 Crítico'},{value:'yellow',label:'🟡 Riesgo'},{value:'green',label:'🟢 Sano'},{value:'gray',label:'⚪ Sin datos'}]);
    html += '</div>';
    html += '<div class="cm-canvas-toolbar-spacer"></div>';
    html += '<button class="cm-canvas-tool-btn ' + (canvasState.critical ? 'active' : '') + '" id="cm-canvas-critical-btn" title="Mostrar solo problemas (rojos/amarillos)">🎯 Ruta crítica</button>';
    html += '<div class="cm-canvas-create-wrap">';
    html += '<button class="cm-canvas-tool-btn primary" id="cm-canvas-create-btn">+ Crear ▾</button>';
    html += '<div class="cm-canvas-create-menu" id="cm-canvas-create-menu" style="display:none">';
    html += '<button data-create="touchpoint">＋ Touchpoint</button>';
    html += '<button data-create="friction">＋ Fricción</button>';
    html += '<button data-create="note">＋ Nota libre</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cm-canvas-toolbar-row cm-canvas-toolbar-row--secondary">';
    html += '<div class="cm-canvas-totals">' + totals.tps + ' touchpoints · ' + totals.fricts + ' fricciones · ' + totals.inis + ' iniciativas</div>';
    html += '<div class="cm-canvas-legend">';
    ['red','yellow','green','gray'].forEach(function(lvl) {
      var cfg = _healthCfg[lvl];
      html += '<div class="cm-canvas-legend-item"><span class="cm-mv-dot" style="background:' + cfg.dot + '"></span>' + cfg.label + ' <b>' + counts[lvl] + '</b></div>';
    });
    html += '</div>';
    html += '<div class="cm-canvas-toolbar-spacer"></div>';
    html += '<span class="cm-canvas-save-indicator" id="cm-canvas-save-indicator" style="display:none"></span>';
    html += '<button class="cm-canvas-tool-btn ' + (canvasState.locked ? 'active' : '') + '" id="cm-canvas-lock-btn" title="Bloquear/desbloquear movimiento">🔒</button>';
    html += '<button class="cm-canvas-tool-btn ' + (canvasState.snap ? 'active' : '') + '" id="cm-canvas-snap-btn" title="Snap a grilla 20px">🧲</button>';
    html += '<button class="cm-canvas-tool-btn" id="cm-canvas-autolayout-btn" title="Re-aplicar auto-layout (sobrescribe posiciones)">📐 Auto</button>';
    html += '<button class="cm-canvas-tool-btn ' + (canvasState.linkMode ? 'active' : '') + '" id="cm-canvas-linkmode-btn" title="Modo conexión: arrastrar de un nodo a otro">🔗 Enlace</button>';
    html += '<button class="cm-canvas-tool-btn" id="cm-canvas-fullscreen-btn" title="Pantalla completa">⛶</button>';
    html += '</div>';
    html += '</div>';

    // Banner de modo (drop / link)
    html += '<div class="cm-canvas-mode-banner" id="cm-canvas-mode-banner" style="display:none"></div>';

    // Viewport + Stage
    html += '<div class="cm-canvas-viewport" id="cm-canvas-viewport">';
    html += '<div class="cm-canvas-stage" id="cm-canvas-stage">';
    html += '<svg class="cm-canvas-svg" id="cm-canvas-svg" xmlns="http://www.w3.org/2000/svg"></svg>';
    html += '<div class="cm-canvas-phase-layer" id="cm-canvas-phase-layer"></div>';
    state.touchpoints.forEach(function(tp) { html += renderCanvasTouchpointNode(tp); });
    (state.frictions || []).forEach(function(f) { html += renderCanvasFrictionNode(f); });
    (state.canvas_notes || []).forEach(function(n) { html += renderCanvasNoteNode(n); });
    html += '<div class="cm-canvas-edge-widgets-layer" id="cm-canvas-edge-widgets-layer"></div>';
    html += '</div>';
    html += '<div class="cm-canvas-controls">';
    html += '<button class="cm-canvas-ctrl-btn" id="cm-canvas-zoom-in" title="Zoom in">+</button>';
    html += '<button class="cm-canvas-ctrl-btn" id="cm-canvas-zoom-out" title="Zoom out">−</button>';
    html += '<button class="cm-canvas-ctrl-btn" id="cm-canvas-fit" title="Ajustar todo">⊡</button>';
    html += '<button class="cm-canvas-ctrl-btn" id="cm-canvas-reset" title="Reset">↺</button>';
    html += '<span class="cm-canvas-zoom-label" id="cm-canvas-zoom-label">100%</span>';
    html += '</div>';
    html += '</div>';

    // Drawer
    html += '<div class="cm-canvas-drawer" id="cm-canvas-drawer"><div class="cm-canvas-drawer-content" id="cm-canvas-drawer-content"></div></div>';

    el.innerHTML = html;

    _initGlobalDragHandlers();
    _initGlobalLinkHandlers();
    _initGlobalKeyHandlers();
    _initFullscreenChangeHandler();
    _initFlowEdgeClickHandler();
    requestAnimationFrame(function() {
      _bindCanvasEvents(el);
      _attachNodeDragHandlers(el);
      _drawCanvasEdges();
      _renderPhaseFrameHeaders();
      _renderEdgeWidgets();
      _canvasFit();
      _applyCanvasFilters();
      _bindMultiCheckSearch(document);
      // Focus opcional desde tabla
      if (pendingCanvasFocus) {
        var pf = pendingCanvasFocus;
        pendingCanvasFocus = null;
        _focusCanvasNode(pf.type, pf.id);
      }
      var vp = el.querySelector('#cm-canvas-viewport');
      if (vp) vp.addEventListener('click', function(e) {
        if (e.target === vp || e.target.id === 'cm-canvas-stage') {
          _closeCanvasDrawer();
          if (canvasState.selectedFlowId) {
            canvasState.selectedFlowId = null;
            _drawCanvasEdges();
            _renderEdgeWidgets();
          }
        }
      });
    });
  }

  function _filterDropdown(key, label, opts) {
    var sel = canvasState.filters[key] || [];
    var count = sel.length;
    var items = opts.map(function(o) {
      var checked = sel.indexOf(o.value) >= 0 ? 'checked' : '';
      return '<label class="cm-canvas-filter-opt"><input type="checkbox" data-filter="' + key + '" value="' + escHtml(o.value) + '" ' + checked + '> <span>' + escHtml(o.label) + '</span></label>';
    }).join('');
    var html = '';
    html += '<div class="cm-canvas-filter">';
    html += '<button class="cm-canvas-filter-trigger ' + (count > 0 ? 'has-selection' : '') + '" data-filter-trigger="' + key + '">' + label + (count > 0 ? ' <b>' + count + '</b>' : '') + ' ▾</button>';
    html += '<div class="cm-canvas-filter-pop" data-filter-pop="' + key + '" style="display:none">';
    html += '<div class="cm-canvas-filter-list">' + (items || '<div style="font-size:.74rem;color:#94A3B8;padding:6px">Sin opciones</div>') + '</div>';
    html += '<div class="cm-canvas-filter-actions"><button data-filter-clear="' + key + '">Limpiar</button></div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderCanvasTouchpointNode(tp) {
    var k = _layoutKey('touchpoint', String(tp.id));
    var pos = canvasState.layout[k] || { x: 0, y: 0 };
    var h = computeTouchpointHealth(tp);
    var cfg = _healthCfg[h.level];
    var fricts = _frictionsForTouchpoint(tp.id);
    var inis = _initiativesForTouchpoint(tp.id);
    var doneInis = inis.filter(function(ii){ return ii.status === 'completed'; }).length;
    var avgInis = inis.length > 0 ? Math.round(inis.reduce(function(s,ii){return s + (ii.progress||0);},0) / inis.length) : 0;
    var resp = personName(tp.responsable_id) || tp.responsable || '';
    var tpKpiLinks = state.kpi_touchpoints.filter(function(lk){ return lk.touchpoint_id === tp.id; });
    var primaryKpi = null, primaryKpiSem = null;
    if (tpKpiLinks.length > 0) {
      primaryKpi = state.kpis.find(function(x){ return x.id === tpKpiLinks[0].kpi_id; });
      primaryKpiSem = _kpiSemColor(primaryKpi);
    }

    // ¿Touchpoint paralelo? (sin flechas dentro de su misma fase)
    var flowsAll = state.touchpoint_flows || [];
    var hasInPhaseFlow = flowsAll.some(function(f) {
      if (f.from_touchpoint_id !== tp.id && f.to_touchpoint_id !== tp.id) return false;
      var otherId = f.from_touchpoint_id === tp.id ? f.to_touchpoint_id : f.from_touchpoint_id;
      var other = state.touchpoints.find(function(t){ return t.id === otherId; });
      return other && other.phase_id === tp.phase_id;
    });
    var isParallel = !hasInPhaseFlow;

    var html = '';
    html += '<div class="cm-canvas-node cm-canvas-node--tp' + (isParallel ? ' cm-canvas-node--parallel' : '') + '" data-mv-tp="' + escHtml(tp.id) + '" data-key="' + escHtml(k) + '" data-phase="' + escHtml(tp.phase_id || '') + '" data-resp="' + escHtml(tp.responsable_id || '') + '" data-health="' + h.level + '"';
    html += ' style="left:' + pos.x + 'px;top:' + pos.y + 'px;background:#fff;border-color:' + cfg.border + '">';
    html += '<span class="cm-anchor cm-anchor-top" data-link-from="touchpoint:' + escHtml(tp.id) + '" data-side="top" title="Arrastra para conectar"></span>';
    html += '<span class="cm-anchor cm-anchor-right" data-link-from="touchpoint:' + escHtml(tp.id) + '" data-side="right" title="Arrastra para conectar"></span>';
    html += '<span class="cm-anchor cm-anchor-bottom" data-link-from="touchpoint:' + escHtml(tp.id) + '" data-side="bottom" title="Arrastra para conectar"></span>';
    html += '<span class="cm-anchor cm-anchor-left" data-link-from="touchpoint:' + escHtml(tp.id) + '" data-side="left" title="Arrastra para conectar"></span>';
    html += '<div class="cm-canvas-node-bar" style="background:' + cfg.dot + '"></div>';
    html += '<div class="cm-canvas-node-body">';
    html += '<div class="cm-canvas-node-header">';
    html += '<span class="cm-mv-dot" style="background:' + cfg.dot + ';width:10px;height:10px"></span>';
    html += '<span class="cm-canvas-node-id">#' + tp.id + '</span>';
    html += '<span class="cm-canvas-node-title">' + escHtml(tp.name) + '</span>';
    html += '</div>';
    html += '<div class="cm-canvas-node-meta">';
    if (tp.canal) html += '<span class="cm-mv-tag">' + escHtml(tp.canal) + '</span>';
    if (resp) html += '<span class="cm-mv-tag cm-mv-tag-resp">' + escHtml(resp) + '</span>';
    if (isParallel) html += '<span class="cm-mv-tag cm-mv-tag-parallel" title="Sin dependencias en su fase, sucede durante esta etapa">⏱ paralelo</span>';
    html += '</div>';
    if (primaryKpi) {
      var semColor = primaryKpiSem ? _healthCfg[primaryKpiSem === 'green' ? 'green' : primaryKpiSem === 'yellow' ? 'yellow' : 'red'].dot : '#94A3B8';
      html += '<div class="cm-canvas-node-kpi">';
      html += '<div style="display:flex;align-items:center;gap:6px;font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px"><span class="cm-mv-dot" style="background:' + semColor + ';width:6px;height:6px"></span>KPI</div>';
      html += '<div style="font-size:.78rem;font-weight:600">' + escHtml(primaryKpi.name) + '</div>';
      if (primaryKpi.current_value != null) {
        html += '<div style="font-size:.72rem;color:var(--text-secondary)">' + primaryKpi.current_value + (primaryKpi.unit || '');
        if (primaryKpi.target_value != null) html += ' / ' + primaryKpi.target_value + (primaryKpi.unit || '');
        html += '</div>';
      }
      html += '</div>';
    }
    html += '<div class="cm-canvas-node-stats">';
    if (inis.length > 0) {
      var iniCol = avgInis >= 100 ? '#10B981' : (avgInis >= 50 ? '#6366F1' : (avgInis > 0 ? '#F59E0B' : '#94A3B8'));
      html += '<div class="cm-canvas-node-stat">';
      html += '<span style="font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px">Iniciativas</span>';
      html += '<span style="font-weight:700;color:' + iniCol + '">' + doneInis + '/' + inis.length + ' · ' + avgInis + '%</span>';
      html += '<div style="height:3px;background:#E2E8F0;border-radius:9999px;overflow:hidden;margin-top:2px"><div style="height:100%;width:' + avgInis + '%;background:' + iniCol + '"></div></div>';
      html += '</div>';
    }
    if (fricts.length > 0) {
      var critCnt = fricts.filter(function(f){ return f.impact === 'high' && f.status !== 'completed'; }).length;
      html += '<div class="cm-canvas-node-stat">';
      html += '<span style="font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px">Fricciones</span>';
      html += '<span style="font-weight:700">' + fricts.length + (critCnt > 0 ? ' <span style="color:#DC2626">(' + critCnt + ' crít.)</span>' : '') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderCanvasFrictionNode(f) {
    var k = _layoutKey('friction', String(f.id));
    var pos = canvasState.layout[k] || { x: 0, y: 0 };
    var icfg = _impactCfg[f.impact || 'medium'] || _impactCfg.medium;
    var fInis = _initiativesForFriction(f.id);
    var avgProg = fInis.length > 0 ? Math.round(fInis.reduce(function(s,ii){return s + (ii.progress||0);},0) / fInis.length) : 0;
    var isResolved = f.status === 'completed';
    var tpId = f.touchpoint_id;
    var tp = tpId ? state.touchpoints.find(function(x){ return x.id === tpId; }) : null;
    var phaseId = tp ? tp.phase_id : '';
    var fHealth = isResolved ? 'green' : (f.impact === 'high' ? 'red' : (f.impact === 'medium' ? 'yellow' : 'gray'));

    var html = '';
    html += '<div class="cm-canvas-node cm-canvas-node--friction" data-mv-friction="' + escHtml(f.id) + '" data-key="' + escHtml(k) + '" data-phase="' + escHtml(phaseId) + '" data-impact="' + escHtml(f.impact||'medium') + '" data-health="' + fHealth + '"';
    html += ' style="left:' + pos.x + 'px;top:' + pos.y + 'px;border-left-color:' + icfg.color + (isResolved ? ';opacity:.55' : '') + '">';
    html += '<span class="cm-anchor cm-anchor-top" data-link-from="friction:' + escHtml(f.id) + '" data-side="top"></span>';
    html += '<span class="cm-anchor cm-anchor-right" data-link-from="friction:' + escHtml(f.id) + '" data-side="right"></span>';
    html += '<span class="cm-anchor cm-anchor-bottom" data-link-from="friction:' + escHtml(f.id) + '" data-side="bottom"></span>';
    html += '<span class="cm-anchor cm-anchor-left" data-link-from="friction:' + escHtml(f.id) + '" data-side="left"></span>';
    html += '<div class="cm-canvas-fr-header">';
    html += '<span class="cm-mv-fr-impact" style="background:' + icfg.bg + ';color:' + icfg.color + '">' + icfg.label + '</span>';
    html += '<span class="cm-canvas-fr-id">' + escHtml(f.id) + '</span>';
    if (isResolved) html += '<span class="cm-canvas-fr-resolved">✓</span>';
    html += '</div>';
    html += '<div class="cm-canvas-fr-name">' + escHtml(f.name) + '</div>';
    if (fInis.length > 0) {
      var col = avgProg >= 100 ? '#10B981' : (avgProg >= 50 ? '#6366F1' : '#F59E0B');
      html += '<div class="cm-canvas-fr-progress"><div style="flex:1;height:3px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + avgProg + '%;background:' + col + '"></div></div><span style="font-size:.62rem;font-weight:700;color:' + col + '">' + fInis.length + ' ini · ' + avgProg + '%</span></div>';
    } else {
      html += '<div style="font-size:.62rem;color:#DC2626;font-style:italic;margin-top:4px">⚠ Sin iniciativas</div>';
    }
    html += '</div>';
    return html;
  }

  function renderCanvasNoteNode(n) {
    var k = _layoutKey('note', String(n.id));
    var pos = canvasState.layout[k] || { x: 0, y: 0 };
    var palette = { yellow:'#FEF3C7', blue:'#DBEAFE', pink:'#FCE7F3', green:'#D1FAE5' };
    var bg = palette[n.color] || palette.yellow;
    var html = '';
    html += '<div class="cm-canvas-node cm-canvas-node--note" data-mv-note="' + n.id + '" data-key="' + escHtml(k) + '"';
    html += ' style="left:' + pos.x + 'px;top:' + pos.y + 'px;background:' + bg + '">';
    html += '<div class="cm-canvas-note-text">' + escHtml(n.text || '(nota vacía)') + '</div>';
    html += '<button class="cm-canvas-note-del" data-note-del="' + n.id + '" title="Eliminar nota">×</button>';
    html += '</div>';
    return html;
  }

  function _oppositeSide(s) {
    return s === 'left' ? 'right' : s === 'right' ? 'left' : s === 'top' ? 'bottom' : 'top';
  }

  function _anchorPoint(box, side) {
    if (side === 'top') return { x: box.x, y: box.top };
    if (side === 'right') return { x: box.right, y: box.y };
    if (side === 'bottom') return { x: box.x, y: box.bottom };
    return { x: box.left, y: box.y };
  }

  function _computeBestAnchorPair(a, b, forcedFromSide) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var fromSide, toSide;
    if (forcedFromSide) {
      fromSide = forcedFromSide;
    } else {
      if (Math.abs(dx) > Math.abs(dy)) fromSide = dx > 0 ? 'right' : 'left';
      else fromSide = dy > 0 ? 'bottom' : 'top';
    }
    // Target side: el opuesto preferentemente
    if (fromSide === 'right') toSide = dx >= -10 ? 'left' : (Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 'top' : 'bottom') : 'right');
    else if (fromSide === 'left') toSide = dx <= 10 ? 'right' : (Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 'top' : 'bottom') : 'left');
    else if (fromSide === 'bottom') toSide = dy >= -10 ? 'top' : (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : 'bottom');
    else toSide = dy <= 10 ? 'bottom' : (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : 'top');
    return { fromSide: fromSide, toSide: toSide };
  }

  function _bezierPath(p1, side1, p2, side2) {
    var dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    var k = Math.max(40, dist / 3);
    var cp1 = _offsetFromSide(p1, side1, k);
    var cp2 = _offsetFromSide(p2, side2, k);
    var d = 'M ' + p1.x + ' ' + p1.y + ' C ' + cp1.x + ' ' + cp1.y + ', ' + cp2.x + ' ' + cp2.y + ', ' + p2.x + ' ' + p2.y;
    return { d: d, cp1: cp1, cp2: cp2 };
  }

  function _offsetFromSide(p, side, k) {
    if (side === 'right') return { x: p.x + k, y: p.y };
    if (side === 'left')  return { x: p.x - k, y: p.y };
    if (side === 'top')   return { x: p.x, y: p.y - k };
    return { x: p.x, y: p.y + k };
  }

  function _bezierPoint(p0, p1, p2, p3, t) {
    var u = 1 - t;
    var tt = t*t, uu = u*u;
    var x = uu*u*p0.x + 3*uu*t*p1.x + 3*u*tt*p2.x + tt*t*p3.x;
    var y = uu*u*p0.y + 3*uu*t*p1.y + 3*u*tt*p2.y + tt*t*p3.y;
    return { x: x, y: y };
  }

  function _drawCanvasEdges() {
    var svg = document.querySelector('#cm-canvas-svg');
    if (!svg) return;
    var phases = state.phases.slice().sort(function(a,b){ return (a.order||0) - (b.order||0); });
    var bands = _phaseBandsHTML(phases);
    var paths = '';
    paths += '<defs>';
    paths += '<marker id="cmv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8"/></marker>';
    paths += '<marker id="cmv-arrow-manual" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4F46E5"/></marker>';
    paths += '</defs>';

    // IMPORTANT: estas constantes deben declararse ANTES del loop manualFlows porque
    // tpCenter las usa internamente. Aunque las funciones tpCenter/frCenter se hoistean,
    // los inicializadores `var X = ...` no, así que TP_W sería undefined y produciría NaN
    // en `px + TP_W/2` rompiendo el path.
    var TP_W = 240, TP_HEIGHT_EST = 130;
    var FR_W = 200, FR_HEIGHT_EST = 70;

    // Manual flows (touchpoint→touchpoint editables) con smart anchor + bezier
    var manualFlows = state.touchpoint_flows || [];
    var sourcesWithManual = {};
    manualFlows.forEach(function(fl) { sourcesWithManual[fl.from_touchpoint_id] = true; });
    canvasState.edgeMidpoints = {};

    manualFlows.forEach(function(fl) {
      var from = state.touchpoints.find(function(t){ return t.id === fl.from_touchpoint_id; });
      var to = state.touchpoints.find(function(t){ return t.id === fl.to_touchpoint_id; });
      if (!from || !to) return;
      var a = tpCenter(from), b = tpCenter(to);
      if (!a || !b) return;
      var pair = _computeBestAnchorPair(a, b);
      var p1 = _anchorPoint(a, pair.fromSide);
      var p2 = _anchorPoint(b, pair.toSide);
      var bz = _bezierPath(p1, pair.fromSide, p2, pair.toSide);
      var isSelected = String(canvasState.selectedFlowId) === String(fl.id);
      var stroke = isSelected ? '#4338CA' : '#4F46E5';
      var width = isSelected ? 3.2 : 2.4;
      paths += '<path class="cm-flow-hit" data-flow-id="' + fl.id + '" d="' + bz.d + '" stroke="transparent" stroke-width="18" fill="none" style="cursor:pointer;pointer-events:stroke"/>';
      paths += '<path class="cm-flow-visible' + (isSelected ? ' selected' : '') + '" data-flow-id="' + fl.id + '" d="' + bz.d + '" stroke="' + stroke + '" stroke-width="' + width + '" fill="none" marker-end="url(#cmv-arrow-manual)" style="pointer-events:none"/>';
      var mid = _bezierPoint(p1, bz.cp1, bz.cp2, p2, 0.5);
      canvasState.edgeMidpoints[fl.id] = mid;
    });

    function tpCenter(tp) {
      var pos = canvasState.layout[_layoutKey('touchpoint', String(tp.id))];
      if (!pos) return null;
      var px = Number(pos.x), py = Number(pos.y);
      if (!isFinite(px) || !isFinite(py)) return null;
      var node = document.querySelector('[data-mv-tp="' + tp.id + '"]');
      var h = node ? node.offsetHeight : TP_HEIGHT_EST;
      return { x: px + TP_W/2, y: py + h/2, top: py, bottom: py + h, left: px, right: px + TP_W };
    }
    function frCenter(f) {
      var pos = canvasState.layout[_layoutKey('friction', String(f.id))];
      if (!pos) return null;
      var px = Number(pos.x), py = Number(pos.y);
      if (!isFinite(px) || !isFinite(py)) return null;
      var node = document.querySelector('[data-mv-friction="' + f.id + '"]');
      var h = node ? node.offsetHeight : FR_HEIGHT_EST;
      return { x: px + FR_W/2, y: py + h/2, top: py, bottom: py + h, left: px, right: px + FR_W };
    }

    phases.forEach(function(ph, phIdx) {
      var phTps = state.touchpoints
        .filter(function(t){ return t.phase_id === ph.id; })
        .sort(function(a,b){ return (a.order||0) - (b.order||0); });
      // Auto edges solo desde touchpoints SIN flows manuales salientes
      for (var i = 0; i < phTps.length - 1; i++) {
        if (sourcesWithManual[phTps[i].id]) continue;
        var a = tpCenter(phTps[i]); var b = tpCenter(phTps[i+1]);
        if (!a || !b) continue;
        var dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dy) > Math.abs(dx)) {
          paths += '<path d="M ' + a.x + ' ' + a.bottom + ' L ' + b.x + ' ' + b.top + '" stroke="#CBD5E1" stroke-width="2" fill="none" marker-end="url(#cmv-arrow)"/>';
        } else {
          paths += '<path d="M ' + a.right + ' ' + a.y + ' L ' + b.left + ' ' + b.y + '" stroke="#CBD5E1" stroke-width="2" fill="none" marker-end="url(#cmv-arrow)"/>';
        }
      }
      if (phIdx < phases.length - 1) {
        var nextPhTps = state.touchpoints
          .filter(function(t){ return t.phase_id === phases[phIdx+1].id; })
          .sort(function(a,b){ return (a.order||0) - (b.order||0); });
        if (phTps.length > 0 && nextPhTps.length > 0 && !sourcesWithManual[phTps[phTps.length - 1].id]) {
          var lastA = tpCenter(phTps[phTps.length - 1]);
          var firstB = tpCenter(nextPhTps[0]);
          if (lastA && firstB) {
            var x1 = lastA.right, y1 = lastA.y, x2 = firstB.left, y2 = firstB.y;
            var midX = (x1 + x2) / 2;
            paths += '<path d="M ' + x1 + ' ' + y1 + ' C ' + midX + ' ' + y1 + ', ' + midX + ' ' + y2 + ', ' + x2 + ' ' + y2 + '" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" fill="none" marker-end="url(#cmv-arrow)"/>';
          }
        }
      }
      phTps.forEach(function(tp) {
        var tpC = tpCenter(tp);
        if (!tpC) return;
        var fricts = _frictionsForTouchpoint(tp.id);
        fricts.forEach(function(f) {
          var fC = frCenter(f);
          if (!fC) return;
          var fx = fC.left + 10, fy = fC.y;
          paths += '<path d="M ' + tpC.x + ' ' + tpC.bottom + ' Q ' + tpC.x + ' ' + ((tpC.bottom + fy) / 2) + ', ' + fx + ' ' + fy + '" stroke="#FDA4AF" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>';
        });
      });
    });

    // Link draft (preview) — bezier desde anchor
    if (canvasState.linkDraft) {
      var ld = canvasState.linkDraft;
      if (isFinite(ld.fromX) && isFinite(ld.fromY) && isFinite(ld.currentX) && isFinite(ld.currentY)) {
        var pp1 = { x: ld.fromX, y: ld.fromY };
        var pp2 = { x: ld.currentX, y: ld.currentY };
        var bzd = _bezierPath(pp1, ld.fromSide || 'right', pp2, _oppositeSide(ld.fromSide || 'right'));
        paths += '<path d="' + bzd.d + '" stroke="#4F46E5" stroke-width="2.4" stroke-dasharray="6 4" fill="none" style="pointer-events:none"/>';
      }
    }

    // Bounding box
    var maxX = 0, maxY = 0, minX = 0, minY = 0;
    Object.keys(canvasState.layout).forEach(function(k) {
      var p = canvasState.layout[k];
      if (p.x + 300 > maxX) maxX = p.x + 300;
      if (p.y + 200 > maxY) maxY = p.y + 200;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    });
    svg.setAttribute('width', maxX - Math.min(0, minX) + 200);
    svg.setAttribute('height', maxY - Math.min(0, minY) + 200);
    svg.innerHTML = bands + paths;
  }

  function _phaseBandBboxes() {
    var phases = state.phases.slice().sort(function(a,b){ return (a.order||0) - (b.order||0); });
    var out = [];
    phases.forEach(function(ph, phIdx) {
      var phTps = state.touchpoints.filter(function(t){ return t.phase_id === ph.id; });
      if (phTps.length === 0) return;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      var any = false;
      phTps.forEach(function(tp) {
        var pos = canvasState.layout[_layoutKey('touchpoint', String(tp.id))];
        if (!pos) return;
        any = true;
        if (pos.x < minX) minX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.x + 240 > maxX) maxX = pos.x + 240;
        if (pos.y + 220 > maxY) maxY = pos.y + 220;
        var fricts = _frictionsForTouchpoint(tp.id);
        fricts.forEach(function(f) {
          var fp = canvasState.layout[_layoutKey('friction', String(f.id))];
          if (!fp) return;
          if (fp.x < minX) minX = fp.x;
          if (fp.y < minY) minY = fp.y;
          if (fp.x + 200 > maxX) maxX = fp.x + 200;
          if (fp.y + 90 > maxY) maxY = fp.y + 90;
        });
      });
      if (!any) return;
      var pad = 30;
      var color = ph.color && ph.color.indexOf('#') === 0 ? ph.color : _PHASE_COLORS[phIdx % _PHASE_COLORS.length];
      out.push({
        phase: ph, color: color,
        x: minX - pad, y: minY - pad - 38,
        width: (maxX - minX) + pad*2,
        height: (maxY - minY) + pad*2 + 38,
        bodyTop: minY - pad
      });
    });
    return out;
  }

  function _phaseBandsHTML(phases) {
    // SVG fill rects (sin texto — el header va como HTML)
    var bboxes = _phaseBandBboxes();
    var html = '';
    bboxes.forEach(function(bb) {
      html += '<g class="cm-canvas-phase-band">';
      html += '<rect x="' + bb.x + '" y="' + bb.y + '" width="' + bb.width + '" height="' + bb.height + '" rx="14" fill="' + bb.color + '" fill-opacity="0.05" stroke="' + bb.color + '" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="6 4"/>';
      html += '</g>';
    });
    return html;
  }

  function _renderPhaseFrameHeaders() {
    var layer = document.querySelector('#cm-canvas-phase-layer');
    if (!layer) return;
    var bboxes = _phaseBandBboxes();
    var html = '';
    bboxes.forEach(function(bb) {
      var ph = bb.phase;
      html += '<div class="cm-phase-frame-header" data-phase-id="' + escHtml(ph.id) + '" style="left:' + bb.x + 'px;top:' + bb.y + 'px;width:' + bb.width + 'px;border-color:' + bb.color + '">';
      html += '<button class="cm-phase-drag" title="Arrastra para mover toda la fase" data-phase-id="' + escHtml(ph.id) + '">⠿</button>';
      html += '<input class="cm-phase-name-input" data-phase-id="' + escHtml(ph.id) + '" value="' + escHtml(ph.name) + '" />';
      html += '<button class="cm-phase-color-btn" data-phase-id="' + escHtml(ph.id) + '" style="background:' + bb.color + '" title="Cambiar color"></button>';
      html += '<button class="cm-phase-menu-btn" data-phase-id="' + escHtml(ph.id) + '" title="Más opciones">⋯</button>';
      html += '</div>';
    });
    layer.innerHTML = html;
    _bindPhaseFrameEvents();
  }

  function _bindPhaseFrameEvents() {
    var layer = document.querySelector('#cm-canvas-phase-layer');
    if (!layer) return;
    layer.querySelectorAll('.cm-phase-name-input').forEach(function(input) {
      var orig = input.value;
      input.addEventListener('focus', function(){ orig = this.value; });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
        if (e.key === 'Escape') { this.value = orig; this.blur(); }
      });
      input.addEventListener('change', function() {
        var pid = this.getAttribute('data-phase-id');
        var newName = this.value.trim();
        if (!newName || newName === orig) return;
        _setSaveStatus('saving');
        fetch('/api/comercial/phases/' + encodeURIComponent(pid), {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function(updated) {
            state.phases = state.phases.map(function(p){ return p.id === updated.id ? updated : p; });
            _setSaveStatus('saved');
          }).catch(function(){ _setSaveStatus('error'); input.value = orig; toast('Error al guardar nombre','error'); });
      });
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
    });
    layer.querySelectorAll('.cm-phase-color-btn').forEach(function(btn) {
      btn.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _showPhaseColorPicker(this.getAttribute('data-phase-id'), this);
      });
    });
    layer.querySelectorAll('.cm-phase-menu-btn').forEach(function(btn) {
      btn.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _showPhaseMenu(this.getAttribute('data-phase-id'), this);
      });
    });
    layer.querySelectorAll('.cm-phase-drag').forEach(function(btn) {
      btn.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.stopPropagation(); e.preventDefault();
        var pid = this.getAttribute('data-phase-id');
        _startPhaseDrag(pid, e);
      });
    });
  }

  function _showPhaseColorPicker(phaseId, anchor) {
    var existing = document.querySelector('#cm-phase-color-popup');
    if (existing) existing.remove();
    var palette = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6','#EF4444','#64748B'];
    var rect = anchor.getBoundingClientRect();
    var pop = document.createElement('div');
    pop.id = 'cm-phase-color-popup';
    pop.className = 'cm-phase-color-popup';
    pop.style.left = rect.left + 'px';
    pop.style.top = (rect.bottom + 6) + 'px';
    pop.innerHTML = palette.map(function(c) {
      return '<button class="cm-color-swatch" data-color="' + c + '" style="background:' + c + '"></button>';
    }).join('');
    document.body.appendChild(pop);
    pop.querySelectorAll('[data-color]').forEach(function(b) {
      b.addEventListener('click', function() {
        var col = this.getAttribute('data-color');
        pop.remove();
        _setSaveStatus('saving');
        fetch('/api/comercial/phases/' + encodeURIComponent(phaseId), {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color: col })
        }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function(updated) {
            state.phases = state.phases.map(function(p){ return p.id === updated.id ? updated : p; });
            _setSaveStatus('saved');
            _drawCanvasEdges();
            _renderPhaseFrameHeaders();
          }).catch(function(){ _setSaveStatus('error'); toast('Error al cambiar color','error'); });
      });
    });
    setTimeout(function() {
      document.addEventListener('click', function dismiss(e) {
        if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', dismiss); }
      });
    }, 50);
  }

  function _showPhaseMenu(phaseId, anchor) {
    var existing = document.querySelector('#cm-phase-menu-popup');
    if (existing) existing.remove();
    var ph = state.phases.find(function(p){ return p.id === phaseId; });
    var hasTps = state.touchpoints.some(function(t){ return t.phase_id === phaseId; });
    var rect = anchor.getBoundingClientRect();
    var pop = document.createElement('div');
    pop.id = 'cm-phase-menu-popup';
    pop.className = 'cm-canvas-create-menu';
    pop.style.position = 'fixed';
    pop.style.left = (rect.right - 180) + 'px';
    pop.style.top = (rect.bottom + 6) + 'px';
    pop.style.minWidth = '180px';
    pop.style.display = 'block';
    var btnDel = '<button data-action="delete"' + (hasTps ? ' disabled style="opacity:.5;cursor:not-allowed"' : '') + '>🗑️ Eliminar fase' + (hasTps ? ' (tiene touchpoints)' : '') + '</button>';
    pop.innerHTML = btnDel;
    document.body.appendChild(pop);
    pop.querySelectorAll('[data-action]').forEach(function(b) {
      b.addEventListener('click', function() {
        var act = this.getAttribute('data-action');
        pop.remove();
        if (act === 'delete' && !hasTps) {
          if (!confirm('¿Eliminar fase "' + (ph ? ph.name : phaseId) + '"?')) return;
          fetch('/api/comercial/phases/' + encodeURIComponent(phaseId), { method: 'DELETE' })
            .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
            .then(function() {
              state.phases = state.phases.filter(function(p){ return p.id !== phaseId; });
              var main = document.querySelector('#cm-main');
              if (main) renderMapaVisual(main);
            }).catch(function(){ toast('Error al eliminar fase','error'); });
        }
      });
    });
    setTimeout(function() {
      document.addEventListener('click', function dismiss(e) {
        if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', dismiss); }
      });
    }, 50);
  }

  function _startPhaseDrag(phaseId, e) {
    var originals = {};
    state.touchpoints.filter(function(t){ return t.phase_id === phaseId; }).forEach(function(tp) {
      var k = _layoutKey('touchpoint', String(tp.id));
      var pos = canvasState.layout[k];
      if (pos) originals[k] = { x: pos.x, y: pos.y };
      _frictionsForTouchpoint(tp.id).forEach(function(f) {
        var fk = _layoutKey('friction', String(f.id));
        var fp = canvasState.layout[fk];
        if (fp) originals[fk] = { x: fp.x, y: fp.y };
      });
    });
    canvasState.phaseDrag = {
      phaseId: phaseId,
      startX: e.clientX,
      startY: e.clientY,
      originals: originals
    };
  }

  function _renderEdgeWidgets() {
    var layer = document.querySelector('#cm-canvas-edge-widgets-layer');
    if (!layer) return;
    var flows = state.touchpoint_flows || [];
    var html = '';
    flows.forEach(function(fl) {
      var mid = canvasState.edgeMidpoints[fl.id];
      if (!mid) return;
      var isSel = String(canvasState.selectedFlowId) === String(fl.id);
      var label = fl.label ? escHtml(fl.label) : '';
      html += '<div class="cm-edge-widget' + (isSel ? ' selected' : '') + (label ? '' : ' empty') + '" data-flow-id="' + fl.id + '" style="left:' + mid.x + 'px;top:' + mid.y + 'px">';
      if (label) html += '<span class="cm-edge-widget-label">' + label + '</span>';
      else html += '<span class="cm-edge-widget-label cm-edge-widget-add">+</span>';
      html += '<button class="cm-edge-widget-del" data-flow-del="' + fl.id + '" title="Eliminar conexión">×</button>';
      html += '</div>';
    });
    layer.innerHTML = html;
    _bindEdgeWidgetEvents();
  }

  function _bindEdgeWidgetEvents() {
    var layer = document.querySelector('#cm-canvas-edge-widgets-layer');
    if (!layer) return;
    layer.querySelectorAll('.cm-edge-widget').forEach(function(w) {
      w.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      w.addEventListener('click', function(e) {
        if (e.target.closest('.cm-edge-widget-del')) return;
        e.stopPropagation();
        var fid = this.getAttribute('data-flow-id');
        canvasState.selectedFlowId = fid;
        _drawCanvasEdges();
        _renderEdgeWidgets();
        _openFlowPopover(fid, e.clientX, e.clientY);
      });
    });
    layer.querySelectorAll('[data-flow-del]').forEach(function(btn) {
      btn.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var fid = this.getAttribute('data-flow-del');
        if (!confirm('¿Eliminar esta conexión de flujo?')) return;
        // Optimistic delete: remove from local state and redraw
        var prev = state.touchpoint_flows || [];
        var removed = prev.find(function(x){ return String(x.id) === String(fid); });
        state.touchpoint_flows = prev.filter(function(x){ return String(x.id) !== String(fid); });
        if (String(canvasState.selectedFlowId) === String(fid)) canvasState.selectedFlowId = null;
        _setSaveStatus('saving');
        _drawCanvasEdges();
        _renderEdgeWidgets();
        fetch('/api/comercial/touchpoint-flows/' + fid, { method: 'DELETE' })
          .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function() { _setSaveStatus('saved'); })
          .catch(function() {
            // Rollback
            if (removed) state.touchpoint_flows = state.touchpoint_flows.concat([removed]);
            _drawCanvasEdges();
            _renderEdgeWidgets();
            _setSaveStatus('error');
            toast('Error al eliminar','error');
          });
      });
    });
  }

  function _bindCanvasEvents(el) {
    var viewport = el.querySelector('#cm-canvas-viewport');
    var stage = el.querySelector('#cm-canvas-stage');
    if (!viewport || !stage) return;
    _applyTransform(stage);

    // Pan
    viewport.addEventListener('mousedown', function(e) {
      if (canvasState.dropMode) return; // handled separately on click
      if (e.target.closest('.cm-canvas-node')) return;
      if (e.target.closest('.cm-canvas-controls')) return;
      if (e.target.closest('.cm-canvas-toolbar')) return;
      canvasState.isPanning = true;
      canvasState.panStart = { x: e.clientX - canvasState.x, y: e.clientY - canvasState.y };
      viewport.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function(e) {
      if (canvasState.isPanning) {
        canvasState.x = e.clientX - canvasState.panStart.x;
        canvasState.y = e.clientY - canvasState.panStart.y;
        _applyTransform(stage);
      }
    });
    window.addEventListener('mouseup', function() {
      if (canvasState.isPanning) {
        canvasState.isPanning = false;
        viewport.style.cursor = '';
      }
    });

    // Click on empty viewport: cierra drawer o ejecuta dropMode
    viewport.addEventListener('click', function(e) {
      if (e.target.closest('.cm-canvas-node')) return;
      if (e.target.closest('.cm-canvas-controls')) return;
      if (e.target.closest('.cm-canvas-toolbar')) return;
      if (canvasState.dropMode) {
        var coords = _viewportToStageCoords(e.clientX, e.clientY, viewport);
        _handleCanvasDrop(canvasState.dropMode, coords.x, coords.y);
        return;
      }
      _closeCanvasDrawer();
    });

    // Wheel zoom
    viewport.addEventListener('wheel', function(e) {
      e.preventDefault();
      var rect = viewport.getBoundingClientRect();
      var cx = e.clientX - rect.left;
      var cy = e.clientY - rect.top;
      var prevZoom = canvasState.zoom;
      var delta = e.deltaY < 0 ? 1.1 : 0.9;
      var newZoom = Math.max(0.3, Math.min(2.5, prevZoom * delta));
      var sx = (cx - canvasState.x) / prevZoom;
      var sy = (cy - canvasState.y) / prevZoom;
      canvasState.zoom = newZoom;
      canvasState.x = cx - sx * newZoom;
      canvasState.y = cy - sy * newZoom;
      _applyTransform(stage);
    }, { passive: false });

    // Zoom buttons
    function zoomBy(factor) {
      var rect = viewport.getBoundingClientRect();
      var cx = rect.width / 2, cy = rect.height / 2;
      var prevZoom = canvasState.zoom;
      var newZoom = Math.max(0.3, Math.min(2.5, prevZoom * factor));
      var sx = (cx - canvasState.x) / prevZoom;
      var sy = (cy - canvasState.y) / prevZoom;
      canvasState.zoom = newZoom;
      canvasState.x = cx - sx * newZoom;
      canvasState.y = cy - sy * newZoom;
      _applyTransform(stage);
    }
    var btnIn = el.querySelector('#cm-canvas-zoom-in');
    var btnOut = el.querySelector('#cm-canvas-zoom-out');
    var btnFit = el.querySelector('#cm-canvas-fit');
    var btnReset = el.querySelector('#cm-canvas-reset');
    if (btnIn) btnIn.addEventListener('click', function() { zoomBy(1.2); });
    if (btnOut) btnOut.addEventListener('click', function() { zoomBy(1/1.2); });
    if (btnFit) btnFit.addEventListener('click', _canvasFit);
    if (btnReset) btnReset.addEventListener('click', function() {
      canvasState.x = 0; canvasState.y = 0; canvasState.zoom = 1;
      _applyTransform(stage);
    });

    // Toolbar bindings
    _bindToolbar(el);

    // Note delete buttons
    el.querySelectorAll('[data-note-del]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var nid = this.getAttribute('data-note-del');
        if (!confirm('¿Eliminar nota?')) return;
        // Optimistic: remove DOM node + state, redraw edges only
        var noteEl = document.querySelector('[data-key="note:' + nid + '"]');
        if (noteEl && noteEl.parentNode) noteEl.parentNode.removeChild(noteEl);
        var prevNotes = state.canvas_notes || [];
        var removed = prevNotes.find(function(n){ return String(n.id) === String(nid); });
        state.canvas_notes = prevNotes.filter(function(n){ return String(n.id) !== String(nid); });
        var lkey = _layoutKey('note', nid);
        var prevPos = canvasState.layout[lkey];
        delete canvasState.layout[lkey];
        _drawCanvasEdges();
        fetch('/api/comercial/canvas-notes/' + nid, { method: 'DELETE' })
          .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .catch(function(){
            // Rollback
            if (removed) state.canvas_notes = state.canvas_notes.concat([removed]);
            if (prevPos) canvasState.layout[lkey] = prevPos;
            toast('Error al eliminar nota', 'error');
            renderMapaVisual(el);
          });
      });
    });
  }

  function _bindToolbar(el) {
    // Search
    var search = el.querySelector('#cm-canvas-search');
    if (search) {
      search.addEventListener('input', function() {
        canvasState.filters.q = this.value || '';
        _applyCanvasFilters();
      });
    }

    // Filter dropdowns
    el.querySelectorAll('[data-filter-trigger]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = this.getAttribute('data-filter-trigger');
        var pop = el.querySelector('[data-filter-pop="' + key + '"]');
        var open = pop && pop.style.display !== 'none';
        // close all
        el.querySelectorAll('[data-filter-pop]').forEach(function(p){ p.style.display = 'none'; });
        if (pop && !open) pop.style.display = 'block';
      });
    });
    el.querySelectorAll('[data-filter]').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var key = this.getAttribute('data-filter');
        var arr = canvasState.filters[key] || [];
        if (this.checked) {
          if (arr.indexOf(this.value) < 0) arr.push(this.value);
        } else {
          arr = arr.filter(function(v){ return v !== cb.value; });
        }
        canvasState.filters[key] = arr;
        _updateFilterTriggerLabels(el);
        _applyCanvasFilters();
      });
    });
    el.querySelectorAll('[data-filter-clear]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.getAttribute('data-filter-clear');
        canvasState.filters[key] = [];
        el.querySelectorAll('[data-filter="' + key + '"]').forEach(function(cb){ cb.checked = false; });
        _updateFilterTriggerLabels(el);
        _applyCanvasFilters();
      });
    });
    // Click outside closes filter pops
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.cm-canvas-filter')) {
        el.querySelectorAll('[data-filter-pop]').forEach(function(p){ p.style.display = 'none'; });
      }
    });

    // Critical
    var critBtn = el.querySelector('#cm-canvas-critical-btn');
    if (critBtn) critBtn.addEventListener('click', function() {
      canvasState.critical = !canvasState.critical;
      this.classList.toggle('active', canvasState.critical);
      _applyCanvasFilters();
    });

    // Lock / Snap / Auto-layout
    var lockBtn = el.querySelector('#cm-canvas-lock-btn');
    if (lockBtn) lockBtn.addEventListener('click', function() {
      canvasState.locked = !canvasState.locked;
      this.classList.toggle('active', canvasState.locked);
      var vp = el.querySelector('#cm-canvas-viewport');
      if (vp) vp.classList.toggle('locked', canvasState.locked);
    });
    var snapBtn = el.querySelector('#cm-canvas-snap-btn');
    if (snapBtn) snapBtn.addEventListener('click', function() {
      canvasState.snap = !canvasState.snap;
      this.classList.toggle('active', canvasState.snap);
    });
    var autoBtn = el.querySelector('#cm-canvas-autolayout-btn');
    if (autoBtn) autoBtn.addEventListener('click', function() {
      if (!confirm('Re-aplicar auto-layout sobrescribirá las posiciones actuales. ¿Continuar?')) return;
      _autoSeedLayout(true);
      _saveAllLayout();
      renderMapaVisual(el);
    });

    // Link mode
    var linkBtn = el.querySelector('#cm-canvas-linkmode-btn');
    if (linkBtn) linkBtn.addEventListener('click', function() {
      canvasState.linkMode = !canvasState.linkMode;
      this.classList.toggle('active', canvasState.linkMode);
      _updateModeBanner(el);
      var vp = el.querySelector('#cm-canvas-viewport');
      if (vp) vp.classList.toggle('linkmode', canvasState.linkMode);
    });

    // Fullscreen
    var fsBtn = el.querySelector('#cm-canvas-fullscreen-btn');
    if (fsBtn) fsBtn.addEventListener('click', _toggleFullscreen);

    // Create menu
    var createBtn = el.querySelector('#cm-canvas-create-btn');
    var createMenu = el.querySelector('#cm-canvas-create-menu');
    if (createBtn && createMenu) {
      createBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        createMenu.style.display = createMenu.style.display === 'none' ? 'block' : 'none';
      });
      createMenu.querySelectorAll('[data-create]').forEach(function(b) {
        b.addEventListener('click', function() {
          createMenu.style.display = 'none';
          canvasState.dropMode = this.getAttribute('data-create');
          _updateModeBanner(el);
          var vp = el.querySelector('#cm-canvas-viewport');
          if (vp) vp.classList.add('dropmode');
        });
      });
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#cm-canvas-create-btn') && !e.target.closest('#cm-canvas-create-menu')) {
          createMenu.style.display = 'none';
        }
      });
    }
  }

  function _updateFilterTriggerLabels(el) {
    ['phase','resp','impact','health'].forEach(function(key) {
      var trigger = el.querySelector('[data-filter-trigger="' + key + '"]');
      if (!trigger) return;
      var labels = { phase:'Fase', resp:'Responsable', impact:'Impacto', health:'Salud' };
      var count = (canvasState.filters[key] || []).length;
      trigger.innerHTML = labels[key] + (count > 0 ? ' <b>' + count + '</b>' : '') + ' ▾';
      trigger.classList.toggle('has-selection', count > 0);
    });
  }

  function _updateModeBanner(el) {
    var b = el.querySelector('#cm-canvas-mode-banner');
    if (!b) return;
    if (canvasState.dropMode) {
      var labels = { touchpoint: 'touchpoint', friction: 'fricción', note: 'nota libre' };
      b.textContent = '➕ Click en el canvas para colocar el nuevo ' + labels[canvasState.dropMode] + ' · Esc para cancelar';
      b.style.display = 'block';
    } else if (canvasState.linkMode) {
      b.textContent = '🔗 Modo conexión activo · arrastra del + de un nodo a otro · Esc para salir';
      b.style.display = 'block';
    } else {
      b.style.display = 'none';
    }
  }

  function _applyCanvasFilters() {
    var f = canvasState.filters;
    var q = (f.q || '').trim().toLowerCase();
    var nodes = document.querySelectorAll('.cm-canvas-node');
    nodes.forEach(function(node) {
      if (node.classList.contains('cm-canvas-node--note')) {
        // notas no se filtran
        node.classList.remove('cm-canvas-dim');
        return;
      }
      var match = true;
      if (q) {
        var text = (node.textContent || '').toLowerCase();
        if (text.indexOf(q) < 0) match = false;
      }
      if (match && f.phase && f.phase.length > 0) {
        var ph = node.getAttribute('data-phase') || '';
        if (f.phase.indexOf(ph) < 0) match = false;
      }
      if (match && f.resp && f.resp.length > 0) {
        var r = node.getAttribute('data-resp') || '';
        if (f.resp.indexOf(r) < 0) match = false;
      }
      if (match && f.impact && f.impact.length > 0) {
        var imp = node.getAttribute('data-impact') || '';
        // touchpoints no tienen impact directo — filtrar solo fricciones, dejar tps si filtro de impacto activo
        if (node.classList.contains('cm-canvas-node--friction')) {
          if (f.impact.indexOf(imp) < 0) match = false;
        }
      }
      if (match && f.health && f.health.length > 0) {
        var hv = node.getAttribute('data-health') || '';
        if (f.health.indexOf(hv) < 0) match = false;
      }
      if (match && canvasState.critical) {
        var hv2 = node.getAttribute('data-health') || '';
        if (hv2 !== 'red' && hv2 !== 'yellow') match = false;
      }
      node.classList.toggle('cm-canvas-dim', !match);
    });
  }

  function _attachNodeDragHandlers(el) {
    el.querySelectorAll('.cm-canvas-node').forEach(function(node) {
      node.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        if (e.target.closest('.cm-anchor')) return;
        if (e.target.closest('.cm-canvas-note-del')) return;
        if (canvasState.locked) return;
        if (canvasState.linkMode) {
          var fromKey = this.dataset.key;
          var parts = fromKey.split(':');
          if (parts[0] === 'note') return;
          _startLinkDragFromAnchor(parts[0], parts[1], 'right', e);
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        var k = this.dataset.key;
        var pos = canvasState.layout[k] || { x: 0, y: 0 };
        _activeDrag = {
          node: this,
          key: k,
          startX: e.clientX,
          startY: e.clientY,
          origX: pos.x,
          origY: pos.y,
          moved: false
        };
      });
    });

    // Anchor handles (4 lados)
    el.querySelectorAll('.cm-anchor').forEach(function(anchor) {
      anchor.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        var spec = this.getAttribute('data-link-from') || '';
        var side = this.getAttribute('data-side') || 'right';
        var parts = spec.split(':');
        _startLinkDragFromAnchor(parts[0], parts[1], side, e);
      });
    });
  }

  function _initGlobalDragHandlers() {
    if (window._cmCanvasDragInited) return;
    window._cmCanvasDragInited = true;
    document.addEventListener('mousemove', function(e) {
      // Phase drag (mover toda la fase)
      if (canvasState.phaseDrag) {
        var pd = canvasState.phaseDrag;
        var ddx = (e.clientX - pd.startX) / canvasState.zoom;
        var ddy = (e.clientY - pd.startY) / canvasState.zoom;
        Object.keys(pd.originals).forEach(function(k) {
          var orig = pd.originals[k];
          var nx = orig.x + ddx, ny = orig.y + ddy;
          canvasState.layout[k] = { x: nx, y: ny };
          var n = document.querySelector('[data-key="' + k + '"]');
          if (n) { n.style.left = nx + 'px'; n.style.top = ny + 'px'; }
        });
        _drawCanvasEdges();
        _renderPhaseFrameHeaders();
        _renderEdgeWidgets();
        return;
      }
      // Node drag normal
      if (!_activeDrag) return;
      var dx = (e.clientX - _activeDrag.startX) / canvasState.zoom;
      var dy = (e.clientY - _activeDrag.startY) / canvasState.zoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) _activeDrag.moved = true;
      var newX = _activeDrag.origX + dx;
      var newY = _activeDrag.origY + dy;
      canvasState.layout[_activeDrag.key] = { x: newX, y: newY };
      _activeDrag.node.style.left = newX + 'px';
      _activeDrag.node.style.top = newY + 'px';
      _drawCanvasEdges();
      _renderPhaseFrameHeaders();
      _renderEdgeWidgets();
    });
    document.addEventListener('mouseup', function() {
      // Phase drag end → save bulk
      if (canvasState.phaseDrag) {
        var keys = Object.keys(canvasState.phaseDrag.originals);
        var items = keys.map(function(k) {
          var pos = canvasState.layout[k];
          var parts = k.split(':');
          return { entity_type: parts[0], entity_id: parts[1], x: pos.x, y: pos.y };
        });
        canvasState.phaseDrag = null;
        _setSaveStatus('saving');
        fetch('/api/comercial/canvas-layout/bulk', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ view_id: 'comercial_main', items: items })
        }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function(rows){ state.canvas_layout = rows; _setSaveStatus('saved'); })
          .catch(function(){ _setSaveStatus('error'); toast('Error al guardar fase','error'); });
        return;
      }
      if (!_activeDrag) return;
      if (_activeDrag.moved) {
        var parts = _activeDrag.key.split(':');
        var pos = canvasState.layout[_activeDrag.key];
        var sx = _canvasSnapValue(pos.x);
        var sy = _canvasSnapValue(pos.y);
        if (sx !== pos.x || sy !== pos.y) {
          canvasState.layout[_activeDrag.key] = { x: sx, y: sy };
          _activeDrag.node.style.left = sx + 'px';
          _activeDrag.node.style.top = sy + 'px';
          _drawCanvasEdges();
        }
        _scheduleLayoutSave(_activeDrag.key, parts[0], parts[1], sx, sy);
        _renderPhaseFrameHeaders();
        _renderEdgeWidgets();
      } else {
        var parts2 = _activeDrag.key.split(':');
        _selectCanvasNode(parts2[0], parts2[1]);
      }
      _activeDrag = null;
    });
  }

  function _startLinkDragFromAnchor(fromType, fromId, fromSide, e) {
    var key = _layoutKey(fromType, fromId);
    var pos = canvasState.layout[key];
    if (!pos) return;
    var px = Number(pos.x), py = Number(pos.y);
    if (!isFinite(px) || !isFinite(py)) return;
    var w = fromType === 'touchpoint' ? 240 : (fromType === 'friction' ? 200 : 180);
    var node = document.querySelector('[data-key="' + key + '"]');
    var h = node ? node.offsetHeight : 100;
    var box = { x: px + w/2, y: py + h/2, top: py, bottom: py + h, left: px, right: px + w };
    var anchor = _anchorPoint(box, fromSide);
    canvasState.linkDraft = {
      fromType: fromType,
      fromId: fromId,
      fromSide: fromSide,
      fromX: anchor.x,
      fromY: anchor.y,
      currentX: anchor.x,
      currentY: anchor.y
    };
  }

  // Compatibilidad — alias del nombre anterior
  function _startLinkDragFromNode(fromType, fromId, e) {
    _startLinkDragFromAnchor(fromType, fromId, 'right', e);
  }

  function _initGlobalLinkHandlers() {
    if (window._cmCanvasLinkInited) return;
    window._cmCanvasLinkInited = true;
    document.addEventListener('mousemove', function(e) {
      if (!canvasState.linkDraft) return;
      var viewport = document.querySelector('#cm-canvas-viewport');
      if (!viewport) return;
      var coords = _viewportToStageCoords(e.clientX, e.clientY, viewport);
      canvasState.linkDraft.currentX = coords.x;
      canvasState.linkDraft.currentY = coords.y;
      // Detectar nodo bajo cursor para drop highlight (busca debajo de overlays)
      var node = _findCanvasNodeAt(e.clientX, e.clientY);
      var newKey = null;
      if (node) {
        var k = node.dataset.key;
        var pp = k.split(':');
        var sameAsSource = pp[0] === canvasState.linkDraft.fromType && pp[1] === canvasState.linkDraft.fromId;
        if (!sameAsSource && pp[0] !== 'note') newKey = k;
      }
      if (newKey !== canvasState.dropTargetKey) {
        if (canvasState.dropTargetKey) {
          var prev = document.querySelector('[data-key="' + canvasState.dropTargetKey + '"]');
          if (prev) prev.classList.remove('cm-drop-target');
        }
        canvasState.dropTargetKey = newKey;
        if (newKey) {
          var nxt = document.querySelector('[data-key="' + newKey + '"]');
          if (nxt) nxt.classList.add('cm-drop-target');
        }
      }
      _drawCanvasEdges();
    });
    document.addEventListener('mouseup', function(e) {
      if (!canvasState.linkDraft) return;
      var draft = canvasState.linkDraft;
      canvasState.linkDraft = null;
      // Limpia drop target visual
      if (canvasState.dropTargetKey) {
        var prev = document.querySelector('[data-key="' + canvasState.dropTargetKey + '"]');
        if (prev) prev.classList.remove('cm-drop-target');
        canvasState.dropTargetKey = null;
      }
      var node = _findCanvasNodeAt(e.clientX, e.clientY);
      _drawCanvasEdges();
      if (!node) return;
      var key = node.dataset.key || '';
      var parts = key.split(':');
      var toType = parts[0], toId = parts[1];
      if (toType === 'note') { toast('No se puede conectar a una nota libre', 'error'); return; }
      if (draft.fromType === toType && draft.fromId === toId) return;
      _saveLink(draft.fromType, draft.fromId, toType, toId);
    });
  }

  // Busca el primer .cm-canvas-node bajo (clientX, clientY), atravesando capas
  // como cm-edge-widget y cm-phase-frame-header que tienen pointer-events:auto
  function _findCanvasNodeAt(x, y) {
    // elementsFromPoint devuelve todos los elementos apilados en orden z-index descendente
    var stack = (typeof document.elementsFromPoint === 'function')
      ? document.elementsFromPoint(x, y)
      : [document.elementFromPoint(x, y)].filter(Boolean);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (!el) continue;
      var node = el.closest && el.closest('.cm-canvas-node');
      if (node) return node;
    }
    return null;
  }

  function _saveLink(fromType, fromId, toType, toId) {
    _setSaveStatus('saving');
    // Touchpoint→Touchpoint: optimistic — append flow + redraw edges, no full re-render
    if (fromType === 'touchpoint' && toType === 'touchpoint') {
      // Optimistic: insert provisional flow with negative tmp id
      var tmpId = -Date.now();
      var optimistic = {
        id: tmpId,
        from_touchpoint_id: parseInt(fromId, 10),
        to_touchpoint_id: parseInt(toId, 10),
        label: '',
        order: 0
      };
      state.touchpoint_flows = (state.touchpoint_flows || []).concat([optimistic]);
      _drawCanvasEdges();
      _renderEdgeWidgets();
      return fetch('/api/comercial/touchpoint-flows/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_touchpoint_id: parseInt(fromId,10), to_touchpoint_id: parseInt(toId,10) })
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(j){ throw new Error(j.detail || 'link failed'); }, function(){ throw new Error('link failed'); });
        return r.json();
      }).then(function(saved) {
        // Replace tmp with real
        state.touchpoint_flows = state.touchpoint_flows.map(function(x){ return x.id === tmpId ? saved : x; });
        _setSaveStatus('saved');
        _drawCanvasEdges();
        _renderEdgeWidgets();
        var fromTp = state.touchpoints.find(function(t){ return t.id === parseInt(fromId,10); });
        var toTp = state.touchpoints.find(function(t){ return t.id === parseInt(toId,10); });
        var fromName = fromTp ? fromTp.name : '#' + fromId;
        var toName = toTp ? toTp.name : '#' + toId;
        toast('Conectado: ' + fromName + ' → ' + toName, 'success');
      }).catch(function(err) {
        // Rollback
        state.touchpoint_flows = state.touchpoint_flows.filter(function(x){ return x.id !== tmpId; });
        _drawCanvasEdges();
        _renderEdgeWidgets();
        _setSaveStatus('error');
        toast(err.message || 'Error al crear conexión', 'error');
      });
    }
    // Other link types (touchpoint↔friction, friction↔initiative, touchpoint↔initiative)
    fetch('/api/comercial/canvas-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_type: fromType, from_id: String(fromId), to_type: toType, to_id: String(toId) })
    }).then(function(r) {
      if (!r.ok) {
        return r.json().then(function(j){ throw new Error(j.detail || 'link failed'); }, function(){ throw new Error('link failed'); });
      }
      return r.json();
    }).then(function() {
      _setSaveStatus('saved');
      // Refresh just the affected pieces locally without nuking the canvas
      return loadBootstrap();
    }).then(function() {
      _drawCanvasEdges();
      _renderEdgeWidgets();
    }).catch(function(err) {
      _setSaveStatus('error');
      toast(err.message || 'Conexión no permitida', 'error');
    });
  }

  function _initFlowEdgeClickHandler() {
    if (window._cmCanvasFlowClickInited) return;
    window._cmCanvasFlowClickInited = true;
    // Click sobre la línea SVG (cm-flow-hit) selecciona la flecha
    document.addEventListener('click', function(e) {
      var hit = e.target && e.target.closest && e.target.closest('.cm-flow-hit');
      if (!hit) return;
      e.stopPropagation();
      var flowId = hit.getAttribute('data-flow-id');
      canvasState.selectedFlowId = flowId;
      _drawCanvasEdges();
      _renderEdgeWidgets();
    });
  }

  function _openFlowPopover(flowId, clientX, clientY) {
    var existing = document.querySelector('#cm-flow-popover');
    if (existing) existing.remove();
    var fl = (state.touchpoint_flows || []).find(function(x){ return String(x.id) === String(flowId); });
    if (!fl) return;
    var from = state.touchpoints.find(function(t){ return t.id === fl.from_touchpoint_id; });
    var to = state.touchpoints.find(function(t){ return t.id === fl.to_touchpoint_id; });
    var pop = document.createElement('div');
    pop.id = 'cm-flow-popover';
    pop.className = 'cm-flow-popover';
    pop.style.left = (clientX + 8) + 'px';
    pop.style.top = (clientY + 8) + 'px';
    var html = '';
    html += '<div class="cm-flow-popover-title">Conexión de flujo</div>';
    html += '<div class="cm-flow-popover-route"><b>' + escHtml(from ? from.name : '?') + '</b> → <b>' + escHtml(to ? to.name : '?') + '</b></div>';
    html += '<label style="display:block;font-size:.7rem;color:#64748B;margin-top:8px;text-transform:uppercase;letter-spacing:.3px;font-weight:700">Etiqueta (opcional)</label>';
    html += '<input id="cm-flow-label" class="cm-input" style="margin-top:4px" placeholder="ej: si califica, si rechaza..." value="' + escHtml(fl.label||'') + '">';
    html += '<div style="display:flex;gap:6px;margin-top:10px">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-flow-cancel" style="flex:1">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-danger" id="cm-flow-delete">Eliminar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-flow-save" style="flex:1">Guardar</button>';
    html += '</div>';
    pop.innerHTML = html;
    document.body.appendChild(pop);
    // Reposition if off-screen
    var rect = pop.getBoundingClientRect();
    if (rect.right > window.innerWidth - 10) pop.style.left = (window.innerWidth - rect.width - 10) + 'px';
    if (rect.bottom > window.innerHeight - 10) pop.style.top = (window.innerHeight - rect.height - 10) + 'px';

    var close = function() { pop.remove(); };
    document.querySelector('#cm-flow-cancel').addEventListener('click', close);
    document.querySelector('#cm-flow-save').addEventListener('click', function() {
      var label = document.querySelector('#cm-flow-label').value;
      _setSaveStatus('saving');
      fetch('/api/comercial/touchpoint-flows/' + flowId, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label })
      }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function(updated) {
          state.touchpoint_flows = state.touchpoint_flows.map(function(x){ return x.id===updated.id ? updated : x; });
          _setSaveStatus('saved');
          _drawCanvasEdges();
          _renderEdgeWidgets();
          close();
        }).catch(function(){ _setSaveStatus('error'); toast('Error al guardar etiqueta','error'); });
    });
    document.querySelector('#cm-flow-delete').addEventListener('click', function() {
      if (!confirm('¿Eliminar esta conexión de flujo?')) return;
      _setSaveStatus('saving');
      fetch('/api/comercial/touchpoint-flows/' + flowId, { method: 'DELETE' })
        .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function() {
          state.touchpoint_flows = state.touchpoint_flows.filter(function(x){ return String(x.id) !== String(flowId); });
          _setSaveStatus('saved');
          _drawCanvasEdges();
          _renderEdgeWidgets();
          close();
        }).catch(function(){ _setSaveStatus('error'); toast('Error al eliminar','error'); });
    });
    setTimeout(function() {
      document.addEventListener('click', function dismiss(e) {
        if (!pop.contains(e.target)) { close(); document.removeEventListener('click', dismiss); }
      });
    }, 50);
  }

  function _initGlobalKeyHandlers() {
    if (window._cmCanvasKeyInited) return;
    window._cmCanvasKeyInited = true;
    document.addEventListener('keydown', function(e) {
      var isInput = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (e.key === 'Escape') {
        if (canvasState.dropMode) {
          canvasState.dropMode = null;
          var vp = document.querySelector('#cm-canvas-viewport');
          if (vp) vp.classList.remove('dropmode');
          var el = document.querySelector('#cm-main');
          if (el) _updateModeBanner(el);
        } else if (canvasState.linkMode) {
          canvasState.linkMode = false;
          var btn = document.querySelector('#cm-canvas-linkmode-btn');
          if (btn) btn.classList.remove('active');
          var vp2 = document.querySelector('#cm-canvas-viewport');
          if (vp2) vp2.classList.remove('linkmode');
          var el2 = document.querySelector('#cm-main');
          if (el2) _updateModeBanner(el2);
        } else if (canvasState.selectedFlowId) {
          canvasState.selectedFlowId = null;
          _drawCanvasEdges();
          _renderEdgeWidgets();
        } else if (canvasState.selectedKey) {
          _closeCanvasDrawer();
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && canvasState.selectedFlowId) {
        e.preventDefault();
        var fid = canvasState.selectedFlowId;
        if (!confirm('¿Eliminar la conexión seleccionada?')) return;
        _setSaveStatus('saving');
        fetch('/api/comercial/touchpoint-flows/' + fid, { method: 'DELETE' })
          .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function() {
            state.touchpoint_flows = state.touchpoint_flows.filter(function(x){ return String(x.id) !== String(fid); });
            canvasState.selectedFlowId = null;
            _setSaveStatus('saved');
            _drawCanvasEdges();
            _renderEdgeWidgets();
          }).catch(function(){ _setSaveStatus('error'); toast('Error al eliminar','error'); });
      }
    });
  }

  function _toggleFullscreen() {
    var el = document.querySelector('#comercial-module') || document.querySelector('#cm-main');
    if (!el) return;
    if (!document.fullscreenElement) {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    } else {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  }

  function _initFullscreenChangeHandler() {
    if (window._cmCanvasFsInited) return;
    window._cmCanvasFsInited = true;
    document.addEventListener('fullscreenchange', function() {
      canvasState.fullscreen = !!document.fullscreenElement;
      var btn = document.querySelector('#cm-canvas-fullscreen-btn');
      if (btn) btn.classList.toggle('active', canvasState.fullscreen);
      var root = document.querySelector('#comercial-module');
      if (root) root.classList.toggle('cm-fullscreen-mode', canvasState.fullscreen);
    });
  }

  function _viewportToStageCoords(clientX, clientY, viewport) {
    var rect = viewport.getBoundingClientRect();
    var vx = clientX - rect.left;
    var vy = clientY - rect.top;
    return {
      x: (vx - canvasState.x) / canvasState.zoom,
      y: (vy - canvasState.y) / canvasState.zoom
    };
  }

  function _handleCanvasDrop(type, x, y) {
    var sx = _canvasSnapValue(x);
    var sy = _canvasSnapValue(y);
    canvasState.dropMode = null;
    var vp = document.querySelector('#cm-canvas-viewport');
    if (vp) vp.classList.remove('dropmode');
    var el = document.querySelector('#cm-main');
    if (el) _updateModeBanner(el);
    if (type === 'note') {
      _showCreateNoteMini(sx, sy);
    } else if (type === 'touchpoint') {
      _showCreateTouchpointMini(sx, sy);
    } else if (type === 'friction') {
      _showCreateFrictionMini(sx, sy);
    }
  }

  function _showCreateNoteMini(x, y) {
    var html = '<div class="cm-modal-backdrop" id="cm-mini-bd"><div class="cm-modal" style="max-width:380px">';
    html += '<div class="cm-modal-title">Nueva nota libre</div>';
    html += '<div class="cm-modal-field"><label>Texto</label><textarea id="cm-mini-text" rows="4" class="cm-textarea" placeholder="Escribe una nota..."></textarea></div>';
    html += '<div class="cm-modal-field"><label>Color</label><div style="display:flex;gap:8px">';
    ['yellow','blue','pink','green'].forEach(function(c, i) {
      var bgs = { yellow:'#FEF3C7', blue:'#DBEAFE', pink:'#FCE7F3', green:'#D1FAE5' };
      html += '<label style="cursor:pointer"><input type="radio" name="cm-mini-color" value="' + c + '" ' + (i===0?'checked':'') + ' style="display:none"><span class="cm-color-chip" style="background:' + bgs[c] + ';width:30px;height:30px;border-radius:6px;display:inline-block;border:2px solid #E2E8F0"></span></label>';
    });
    html += '</div></div>';
    html += '<div class="cm-modal-actions"><button class="cm-btn cm-btn-ghost" id="cm-mini-cancel">Cancelar</button><button class="cm-btn cm-btn-primary" id="cm-mini-save">Crear</button></div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
    document.querySelector('#cm-mini-cancel').addEventListener('click', function(){ document.querySelector('#cm-mini-bd').remove(); });
    document.querySelector('#cm-mini-save').addEventListener('click', function() {
      var text = document.querySelector('#cm-mini-text').value || '';
      var color = (document.querySelector('input[name=cm-mini-color]:checked') || {}).value || 'yellow';
      fetch('/api/comercial/canvas-notes/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, color: color })
      }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function(note) {
          state.canvas_notes = (state.canvas_notes || []).concat([note]);
          var k = _layoutKey('note', String(note.id));
          canvasState.layout[k] = { x: x, y: y };
          return fetch('/api/comercial/canvas-layout/bulk', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ view_id: 'comercial_main', items: [{ entity_type: 'note', entity_id: String(note.id), x: x, y: y }] })
          });
        }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function(rows) {
          state.canvas_layout = rows;
          document.querySelector('#cm-mini-bd').remove();
          var main = document.querySelector('#cm-main');
          if (main) renderMapaVisual(main);
        }).catch(function(){ toast('Error al crear nota','error'); });
    });
  }

  function _showCreateTouchpointMini(x, y) {
    var phaseOpts = state.phases.map(function(p){ return '<option value="' + escHtml(p.id) + '">' + escHtml(p.name) + '</option>'; }).join('');
    var html = '<div class="cm-modal-backdrop" id="cm-mini-bd"><div class="cm-modal" style="max-width:420px">';
    html += '<div class="cm-modal-title">Nuevo Touchpoint</div>';
    html += '<div class="cm-modal-field"><label>Nombre *</label><input id="cm-mini-name" class="cm-input" placeholder="Ej: Llamada de descubrimiento"></div>';
    html += '<div class="cm-modal-field"><label>Fase *</label><select id="cm-mini-phase" class="cm-input">' + phaseOpts + '</select></div>';
    html += '<div class="cm-modal-field"><label>Canal</label><input id="cm-mini-canal" class="cm-input" placeholder="Email, Llamada, Web..."></div>';
    html += '<div class="cm-modal-actions"><button class="cm-btn cm-btn-ghost" id="cm-mini-cancel">Cancelar</button><button class="cm-btn cm-btn-primary" id="cm-mini-save">Crear</button></div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
    document.querySelector('#cm-mini-cancel').addEventListener('click', function(){ document.querySelector('#cm-mini-bd').remove(); });
    document.querySelector('#cm-mini-save').addEventListener('click', function() {
      var name = document.querySelector('#cm-mini-name').value.trim();
      if (!name) { toast('Nombre requerido','error'); return; }
      var phase_id = document.querySelector('#cm-mini-phase').value;
      var canal = document.querySelector('#cm-mini-canal').value.trim();
      var newTpId = null;
      fetch('/api/comercial/touchpoints/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phase_id: phase_id, canal: canal || null, order: 999 })
      }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function(tp) {
          newTpId = tp.id;
          var k = _layoutKey('touchpoint', String(tp.id));
          canvasState.layout[k] = { x: x, y: y };
          return fetch('/api/comercial/canvas-layout/bulk', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ view_id: 'comercial_main', items: [{ entity_type: 'touchpoint', entity_id: String(tp.id), x: x, y: y }] })
          }).then(function(){ return loadBootstrap(); });
        }).then(function() {
          document.querySelector('#cm-mini-bd').remove();
          var main = document.querySelector('#cm-main');
          if (main) renderMapaVisual(main);
          // Sugerencia de auto-link: ofrecer conectar desde el touchpoint anterior en la fase
          if (newTpId) _suggestAutoLink(newTpId, phase_id);
        }).catch(function(){ toast('Error al crear touchpoint','error'); });
    });
  }

  function _suggestAutoLink(newTpId, phaseId) {
    var phaseTps = state.touchpoints.filter(function(t){ return t.phase_id === phaseId && t.id !== newTpId; });
    if (phaseTps.length === 0) return;
    var flows = state.touchpoint_flows || [];
    // Candidato: el último touchpoint de la fase (mayor order) que aún no tenga saliente
    var candidates = phaseTps.slice().sort(function(a,b){ return (b.order||0) - (a.order||0); });
    var prev = null;
    for (var i = 0; i < candidates.length; i++) {
      var hasOut = flows.some(function(f){ return f.from_touchpoint_id === candidates[i].id; });
      if (!hasOut) { prev = candidates[i]; break; }
    }
    if (!prev) return;
    var bar = document.createElement('div');
    bar.className = 'cm-autolink-suggest';
    bar.innerHTML = '<span>¿Conectar este touchpoint desde <b>' + escHtml(prev.name) + '</b>?</span>' +
      '<button data-yes>Sí, crear flecha</button>' +
      '<button data-no>No</button>';
    document.body.appendChild(bar);
    var dismiss = function() { if (bar.parentNode) bar.parentNode.removeChild(bar); };
    var t = setTimeout(dismiss, 8000);
    bar.querySelector('[data-no]').addEventListener('click', function(){ clearTimeout(t); dismiss(); });
    bar.querySelector('[data-yes]').addEventListener('click', function() {
      clearTimeout(t); dismiss();
      // Optimistic insert
      var tmpId = -Date.now();
      var optimistic = { id: tmpId, from_touchpoint_id: prev.id, to_touchpoint_id: newTpId, label: '', order: 0 };
      state.touchpoint_flows = (state.touchpoint_flows || []).concat([optimistic]);
      _setSaveStatus('saving');
      _drawCanvasEdges();
      _renderEdgeWidgets();
      fetch('/api/comercial/touchpoint-flows/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_touchpoint_id: prev.id, to_touchpoint_id: newTpId })
      }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function(saved) {
          state.touchpoint_flows = state.touchpoint_flows.map(function(x){ return x.id === tmpId ? saved : x; });
          _setSaveStatus('saved');
          _drawCanvasEdges();
          _renderEdgeWidgets();
        }).catch(function(){
          state.touchpoint_flows = state.touchpoint_flows.filter(function(x){ return x.id !== tmpId; });
          _drawCanvasEdges();
          _renderEdgeWidgets();
          _setSaveStatus('error');
          toast('Error al crear conexión','error');
        });
    });
  }

  function _showCreateFrictionMini(x, y) {
    var tpOpts = '<option value="">(sin touchpoint)</option>' + state.touchpoints.map(function(t){ return '<option value="' + t.id + '">' + escHtml(t.name) + '</option>'; }).join('');
    var html = '<div class="cm-modal-backdrop" id="cm-mini-bd"><div class="cm-modal" style="max-width:420px">';
    html += '<div class="cm-modal-title">Nueva Fricción</div>';
    html += '<div class="cm-modal-field"><label>ID *</label><input id="cm-mini-fid" class="cm-input" placeholder="Ej: F-99"></div>';
    html += '<div class="cm-modal-field"><label>Nombre *</label><input id="cm-mini-name" class="cm-input"></div>';
    html += '<div class="cm-modal-field"><label>Touchpoint</label><select id="cm-mini-tp" class="cm-input">' + tpOpts + '</select></div>';
    html += '<div class="cm-modal-field"><label>Impacto</label><select id="cm-mini-impact" class="cm-input"><option value="high">Alto</option><option value="medium" selected>Medio</option><option value="low">Bajo</option></select></div>';
    html += '<div class="cm-modal-actions"><button class="cm-btn cm-btn-ghost" id="cm-mini-cancel">Cancelar</button><button class="cm-btn cm-btn-primary" id="cm-mini-save">Crear</button></div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
    document.querySelector('#cm-mini-cancel').addEventListener('click', function(){ document.querySelector('#cm-mini-bd').remove(); });
    document.querySelector('#cm-mini-save').addEventListener('click', function() {
      var fid = document.querySelector('#cm-mini-fid').value.trim();
      var name = document.querySelector('#cm-mini-name').value.trim();
      if (!fid || !name) { toast('ID y nombre requeridos','error'); return; }
      var tpVal = document.querySelector('#cm-mini-tp').value;
      var impact = document.querySelector('#cm-mini-impact').value;
      fetch('/api/comercial/frictions/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fid, name: name, touchpoint_id: tpVal ? parseInt(tpVal,10) : null, impact: impact, status: 'pending' })
      }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
        .then(function(f) {
          var k = _layoutKey('friction', String(f.id));
          canvasState.layout[k] = { x: x, y: y };
          return fetch('/api/comercial/canvas-layout/bulk', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ view_id: 'comercial_main', items: [{ entity_type: 'friction', entity_id: String(f.id), x: x, y: y }] })
          }).then(function(){ return loadBootstrap(); });
        }).then(function() {
          document.querySelector('#cm-mini-bd').remove();
          var main = document.querySelector('#cm-main');
          if (main) renderMapaVisual(main);
        }).catch(function(){ toast('Error al crear fricción','error'); });
    });
  }

  function _focusCanvasNode(type, id) {
    var key = _layoutKey(type, String(id));
    var pos = canvasState.layout[key];
    if (!pos) return;
    var viewport = document.querySelector('#cm-canvas-viewport');
    var stage = document.querySelector('#cm-canvas-stage');
    if (!viewport || !stage) return;
    var rect = viewport.getBoundingClientRect();
    canvasState.zoom = 1;
    var w = type === 'touchpoint' ? 240 : 200;
    var h = type === 'touchpoint' ? 200 : 90;
    canvasState.x = rect.width / 2 - (pos.x + w/2);
    canvasState.y = rect.height / 2 - (pos.y + h/2);
    _applyTransform(stage);
    _selectCanvasNode(type, String(id));
  }

  function _canvasFit() {
    var viewport = document.querySelector('#cm-canvas-viewport');
    var stage = document.querySelector('#cm-canvas-stage');
    if (!viewport || !stage) return;
    var keys = Object.keys(canvasState.layout);
    if (keys.length === 0) return;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    keys.forEach(function(k) {
      var p = canvasState.layout[k];
      var w = k.indexOf('touchpoint:') === 0 ? 240 : (k.indexOf('note:') === 0 ? 180 : 200);
      var h = k.indexOf('touchpoint:') === 0 ? 200 : (k.indexOf('note:') === 0 ? 100 : 90);
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + w > maxX) maxX = p.x + w;
      if (p.y + h > maxY) maxY = p.y + h;
    });
    var pad = 40;
    var contentW = (maxX - minX) + pad * 2;
    var contentH = (maxY - minY) + pad * 2;
    var rect = viewport.getBoundingClientRect();
    var zoomX = rect.width / contentW;
    var zoomY = rect.height / contentH;
    var zoom = Math.min(zoomX, zoomY, 1);
    // Allow zoom down to 0.2 so large graphs fit; below that anchor top-left and let content scroll within stage
    canvasState.zoom = Math.max(0.2, zoom);
    var z = canvasState.zoom;
    var scaledW = contentW * z;
    var scaledH = contentH * z;
    // Horizontal: center if fits, else anchor left with pad
    canvasState.x = (scaledW <= rect.width)
      ? (rect.width - scaledW) / 2 - minX * z + pad * z
      : pad - minX * z;
    // Vertical: center if fits, else anchor top with pad — guarantees no node lands above the viewport
    canvasState.y = (scaledH <= rect.height)
      ? (rect.height - scaledH) / 2 - minY * z + pad * z
      : pad - minY * z;
    _applyTransform(stage);
  }

  function _selectCanvasNode(type, id) {
    canvasState.selectedKey = type + ':' + id;
    document.querySelectorAll('.cm-canvas-node.selected').forEach(function(n){ n.classList.remove('selected'); });
    var sel = document.querySelector('[data-key="' + canvasState.selectedKey + '"]');
    if (sel) sel.classList.add('selected');
    if (type === 'touchpoint') _showCanvasDrawerTouchpoint(id);
    else if (type === 'friction') _showCanvasDrawerFriction(id);
    else if (type === 'note') _showCanvasDrawerNote(id);
  }

  function _closeCanvasDrawer() {
    var drawer = document.querySelector('#cm-canvas-drawer');
    if (drawer) drawer.classList.remove('open');
    document.querySelectorAll('.cm-canvas-node.selected').forEach(function(n){ n.classList.remove('selected'); });
    canvasState.selectedKey = null;
  }

  function _showCanvasDrawerTouchpoint(tpId) {
    var tp = state.touchpoints.find(function(x){ return String(x.id) === String(tpId); });
    if (!tp) return;
    var fricts = _frictionsForTouchpoint(tp.id);
    var inis = _initiativesForTouchpoint(tp.id);
    var h = computeTouchpointHealth(tp);
    var cfg = _healthCfg[h.level];
    var resp = personName(tp.responsable_id) || tp.responsable || 'Sin responsable';

    var html = '';
    html += '<div class="cm-canvas-drawer-header">';
    html += '<div style="display:flex;align-items:center;gap:10px"><span class="cm-mv-dot" style="background:' + cfg.dot + ';width:12px;height:12px"></span><span style="font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;font-weight:700">Touchpoint #' + tp.id + '</span></div>';
    html += '<button class="cm-canvas-drawer-close" id="cm-canvas-drawer-close">×</button>';
    html += '</div>';
    html += '<div class="cm-canvas-drawer-title">' + escHtml(tp.name) + '</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
    if (tp.canal) html += '<span class="cm-mv-tag">' + escHtml(tp.canal) + '</span>';
    html += '<span class="cm-mv-tag cm-mv-tag-resp">' + escHtml(resp) + '</span>';
    html += '<span class="cm-mv-tag" style="background:' + cfg.bg + ';color:' + cfg.dot + ';border-color:' + cfg.border + '">' + cfg.label + '</span>';
    html += '</div>';

    html += '<div class="cm-canvas-drawer-section">';
    html += '<div class="cm-canvas-drawer-section-title">Iniciativas (' + inis.length + ')</div>';
    if (inis.length === 0) {
      html += '<div class="cm-canvas-drawer-empty">Sin iniciativas vinculadas</div>';
    } else {
      inis.forEach(function(ii) {
        var prog = ii.progress || 0;
        var col = prog >= 100 ? '#10B981' : (prog >= 50 ? '#6366F1' : (prog > 0 ? '#F59E0B' : '#94A3B8'));
        html += '<div class="cm-canvas-drawer-item">';
        html += '<div style="font-size:.78rem;font-weight:600">' + escHtml(ii.title) + ' ' + statusBadge(ii.status||'pending') + '</div>';
        html += '<div style="display:flex;align-items:center;gap:6px;margin-top:4px"><div style="flex:1;height:4px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + prog + '%;background:' + col + '"></div></div><span style="font-size:.7rem;font-weight:700;color:' + col + '">' + prog + '%</span></div>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="cm-canvas-drawer-section">';
    html += '<div class="cm-canvas-drawer-section-title">Fricciones (' + fricts.length + ')</div>';
    if (fricts.length === 0) {
      html += '<div class="cm-canvas-drawer-empty">Sin fricciones reportadas</div>';
    } else {
      fricts.forEach(function(f) {
        var icfg = _impactCfg[f.impact||'medium'] || _impactCfg.medium;
        html += '<div class="cm-canvas-drawer-item" style="border-left:3px solid ' + icfg.color + '">';
        html += '<div style="font-size:.78rem"><b>' + escHtml(f.id) + '</b> · ' + escHtml(f.name) + '</div>';
        html += '<div style="font-size:.66rem;color:' + icfg.color + ';font-weight:700;text-transform:uppercase;margin-top:3px">' + icfg.label + ' · ' + escHtml(f.status||'pending') + '</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="cm-canvas-drawer-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-canvas-goto-proceso">Editar en Mapa de Procesos</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-canvas-goto-fricciones">Ver fricciones</button>';
    html += '</div>';

    var drawer = document.querySelector('#cm-canvas-drawer');
    var content = document.querySelector('#cm-canvas-drawer-content');
    if (drawer && content) {
      content.innerHTML = html;
      drawer.classList.add('open');
      var btnClose = document.querySelector('#cm-canvas-drawer-close');
      if (btnClose) btnClose.addEventListener('click', _closeCanvasDrawer);
      var btn1 = document.querySelector('#cm-canvas-goto-proceso');
      if (btn1) btn1.addEventListener('click', function() { activeTab = 'proceso'; render(); });
      var btn2 = document.querySelector('#cm-canvas-goto-fricciones');
      if (btn2) btn2.addEventListener('click', function() { activeTab = 'fricciones'; render(); });
    }
  }

  function _showCanvasDrawerFriction(fId) {
    var f = (state.frictions || []).find(function(x){ return String(x.id) === String(fId); });
    if (!f) return;
    var fInis = _initiativesForFriction(f.id);
    var icfg = _impactCfg[f.impact||'medium'] || _impactCfg.medium;

    var html = '';
    html += '<div class="cm-canvas-drawer-header">';
    html += '<div style="display:flex;align-items:center;gap:10px"><span class="cm-mv-fr-impact" style="background:' + icfg.bg + ';color:' + icfg.color + '">' + icfg.label + '</span><span style="font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;font-weight:700">Fricción ' + escHtml(f.id) + '</span></div>';
    html += '<button class="cm-canvas-drawer-close" id="cm-canvas-drawer-close">×</button>';
    html += '</div>';
    html += '<div class="cm-canvas-drawer-title">' + escHtml(f.name) + '</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
    html += '<span class="cm-mv-tag">' + statusBadge(f.status||'pending') + '</span>';
    html += '</div>';

    if (f.expected_outcome) {
      html += '<div class="cm-canvas-drawer-section">';
      html += '<div class="cm-canvas-drawer-section-title">Resultado esperado</div>';
      html += '<div style="font-size:.82rem;color:var(--text-secondary);line-height:1.4">' + escHtml(f.expected_outcome) + '</div>';
      html += '</div>';
    }

    html += '<div class="cm-canvas-drawer-section">';
    html += '<div class="cm-canvas-drawer-section-title">Iniciativas que la atienden (' + fInis.length + ')</div>';
    if (fInis.length === 0) {
      html += '<div class="cm-canvas-drawer-empty" style="color:#DC2626">⚠ Sin iniciativas vinculadas</div>';
    } else {
      fInis.forEach(function(ii) {
        var prog = ii.progress || 0;
        var col = prog >= 100 ? '#10B981' : (prog >= 50 ? '#6366F1' : (prog > 0 ? '#F59E0B' : '#94A3B8'));
        html += '<div class="cm-canvas-drawer-item">';
        html += '<div style="font-size:.78rem;font-weight:600">' + escHtml(ii.title) + ' ' + statusBadge(ii.status||'pending') + '</div>';
        html += '<div style="display:flex;align-items:center;gap:6px;margin-top:4px"><div style="flex:1;height:4px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + prog + '%;background:' + col + '"></div></div><span style="font-size:.7rem;font-weight:700;color:' + col + '">' + prog + '%</span></div>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="cm-canvas-drawer-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-canvas-goto-fr">Editar fricción</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-canvas-create-ini">+ Crear iniciativa</button>';
    html += '</div>';

    var drawer = document.querySelector('#cm-canvas-drawer');
    var content = document.querySelector('#cm-canvas-drawer-content');
    if (drawer && content) {
      content.innerHTML = html;
      drawer.classList.add('open');
      var btnClose = document.querySelector('#cm-canvas-drawer-close');
      if (btnClose) btnClose.addEventListener('click', _closeCanvasDrawer);
      var btn1 = document.querySelector('#cm-canvas-goto-fr');
      if (btn1) btn1.addEventListener('click', function() { activeTab = 'fricciones'; render(); });
      var btn2 = document.querySelector('#cm-canvas-create-ini');
      if (btn2) btn2.addEventListener('click', function() {
        showInitiativeModal(null, document.querySelector('#cm-main'), { friction_ids: [f.id] });
      });
    }
  }

  function _showCanvasDrawerNote(noteId) {
    var n = (state.canvas_notes || []).find(function(x){ return String(x.id) === String(noteId); });
    if (!n) return;
    var palette = { yellow:'#FEF3C7', blue:'#DBEAFE', pink:'#FCE7F3', green:'#D1FAE5' };
    var html = '';
    html += '<div class="cm-canvas-drawer-header">';
    html += '<div style="font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;font-weight:700">Nota libre</div>';
    html += '<button class="cm-canvas-drawer-close" id="cm-canvas-drawer-close">×</button>';
    html += '</div>';
    html += '<div class="cm-canvas-drawer-section"><div class="cm-canvas-drawer-section-title">Texto</div>';
    html += '<textarea id="cm-canvas-note-text" rows="6" class="cm-textarea">' + escHtml(n.text||'') + '</textarea>';
    html += '</div>';
    html += '<div class="cm-canvas-drawer-section"><div class="cm-canvas-drawer-section-title">Color</div><div style="display:flex;gap:8px">';
    ['yellow','blue','pink','green'].forEach(function(c) {
      html += '<label style="cursor:pointer"><input type="radio" name="cm-note-color" value="' + c + '" ' + (n.color===c?'checked':'') + ' style="display:none"><span class="cm-color-chip" style="background:' + palette[c] + ';width:30px;height:30px;border-radius:6px;display:inline-block;border:2px solid ' + (n.color===c ? '#4F46E5' : '#E2E8F0') + '"></span></label>';
    });
    html += '</div></div>';
    html += '<div class="cm-canvas-drawer-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-canvas-note-del">Eliminar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-canvas-note-save">Guardar</button>';
    html += '</div>';

    var drawer = document.querySelector('#cm-canvas-drawer');
    var content = document.querySelector('#cm-canvas-drawer-content');
    if (drawer && content) {
      content.innerHTML = html;
      drawer.classList.add('open');
      document.querySelector('#cm-canvas-drawer-close').addEventListener('click', _closeCanvasDrawer);
      document.querySelector('#cm-canvas-note-save').addEventListener('click', function() {
        var text = document.querySelector('#cm-canvas-note-text').value;
        var color = (document.querySelector('input[name=cm-note-color]:checked')||{}).value || n.color;
        fetch('/api/comercial/canvas-notes/' + n.id, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text, color: color })
        }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function(updated) {
            state.canvas_notes = state.canvas_notes.map(function(x){ return x.id===updated.id ? updated : x; });
            var main = document.querySelector('#cm-main');
            if (main) renderMapaVisual(main);
            toast('Nota guardada', 'success');
          }).catch(function(){ toast('Error al guardar','error'); });
      });
      document.querySelector('#cm-canvas-note-del').addEventListener('click', function() {
        if (!confirm('¿Eliminar esta nota?')) return;
        fetch('/api/comercial/canvas-notes/' + n.id, { method: 'DELETE' })
          .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
          .then(function() {
            state.canvas_notes = state.canvas_notes.filter(function(x){ return x.id !== n.id; });
            delete canvasState.layout[_layoutKey('note', String(n.id))];
            var main = document.querySelector('#cm-main');
            if (main) renderMapaVisual(main);
          }).catch(function(){ toast('Error al eliminar','error'); });
      });
    }
  }



  function showEditPillarModal(pillarId, parentEl) {
    var p = state.trust_pillars.find(function(pp) { return pp.id === pillarId; });
    if (!p) return;

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal">';
    html += '<div class="cm-modal-title">' + (p.icon || '') + ' Editar ' + escHtml(p.name) + '</div>';
    html += '<div class="cm-modal-field"><label>Estado Actual</label>';
    html += '<textarea class="cm-textarea" id="cm-ep-current" rows="2">' + escHtml(p.current_state || '') + '</textarea></div>';
    html += '<div class="cm-modal-field"><label>Estado Objetivo</label>';
    html += '<textarea class="cm-textarea" id="cm-ep-target" rows="2">' + escHtml(p.target_state || '') + '</textarea></div>';
    var linkedInis = state.iniciativas.filter(function(ii) {
      var pids = ii.pillar_ids || (ii.pillar_id ? [ii.pillar_id] : []);
      return pids.indexOf(p.id) >= 0;
    });
    html += '<div class="cm-modal-field"><label>Iniciativas vinculadas (' + linkedInis.length + ')</label>';
    if (linkedInis.length > 0) {
      html += '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px">';
      linkedInis.forEach(function(ii) {
        var resp = personName(ii.responsable_id) || 'Sin asignar';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0;font-size:.78rem">';
        html += '<span>' + escHtml(ii.title || '') + '</span>';
        html += '<span style="color:var(--text-muted);font-size:.7rem">' + statusBadge(ii.status || 'pending') + ' &middot; ' + escHtml(resp) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<div style="color:var(--text-muted);font-size:.78rem;font-style:italic">Sin iniciativas. Agrégalas desde el botón + en la card del pilar.</div>';
    }
    html += '<div style="font-size:.7rem;color:var(--text-muted);margin-top:6px">Las iniciativas se gestionan desde la card del pilar (botón + y ✎).</div>';
    html += '</div>';
    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-ep-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-ep-save">Guardar</button>';
    html += '</div></div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
    document.querySelector('#cm-ep-cancel').addEventListener('click', closeModal);
    document.querySelector('#cm-ep-save').addEventListener('click', function() {
      var data = {
        current_state: document.querySelector('#cm-ep-current').value.trim(),
        target_state: document.querySelector('#cm-ep-target').value.trim(),
      };
      apiPatch('trust-pillars', pillarId, data).then(function(updated) {
        closeModal();
        state.trust_pillars.forEach(function(pp) {
          if (pp.id === pillarId) {
            pp.current_state = data.current_state;
            pp.target_state = data.target_state;
          }
        });
        toast('Pilar actualizado', 'success');
        renderProceso(parentEl);
      }).catch(function() { toast('Error', 'error'); });
    });
  }

  function renderIniciativas(el) {
    var filtered = state.iniciativas.filter(function(i) {
      if (iniciativasFilter.status !== 'all' && i.status !== iniciativasFilter.status) return false;
      if (iniciativasFilter.responsable !== 'all' && String(i.responsable_id || '') !== String(iniciativasFilter.responsable || '')) return false;
      if (iniciativasFilter.priority !== 'all' && (i.priority || 'medium') !== iniciativasFilter.priority) return false;
      if (iniciativasFilter.area !== 'all' && (i.area || '') !== iniciativasFilter.area) return false;
      if (iniciativasFilter.tipo !== 'all' && (i.tipo || 'operativa') !== iniciativasFilter.tipo) return false;
      if (iniciativasFilter.text) {
        var q = iniciativasFilter.text.toLowerCase();
        var hay = (i.title + ' ' + (i.target||'') + ' ' + (i.description||'') + ' ' + (i.area||'')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var total = state.iniciativas.length;
    var completed = state.iniciativas.filter(function(i) { return i.status === 'completed'; }).length;
    var overdue = state.iniciativas.filter(function(i) { return i.status !== 'completed' && i.due_date && daysDiff(i.due_date) < 0; }).length;
    var noOwner = state.iniciativas.filter(function(i) { return !i.responsable_id; }).length;
    var avgProgress = total > 0 ? Math.round(state.iniciativas.reduce(function(s, ii){ return s + (ii.progress || 0); }, 0) / total) : 0;
    var highPending = state.iniciativas.filter(function(i){ return (i.priority||'medium') === 'high' && i.status !== 'completed'; }).length;
    var html = '';
    html += '<div class="cm-kpi-grid">';
    html += '<div class="cm-kpi-card"><div class="label">Total iniciativas</div><div class="value">' + total + '</div><div class="sub">Backlog comercial</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Progreso promedio</div><div class="value">' + avgProgress + '%</div><div class="sub" style="margin-top:4px"><div style="height:5px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + avgProgress + '%;background:#6366F1"></div></div></div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Alta prioridad activas</div><div class="value' + (highPending > 0 ? ' danger' : '') + '">' + highPending + '</div><div class="sub">Foco semanal</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Completadas</div><div class="value success">' + completed + '</div><div class="sub">Cierre operativo</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Vencidas</div><div class="value' + (overdue > 0 ? ' danger' : '') + '">' + overdue + '</div><div class="sub">Requieren atención</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Sin responsable</div><div class="value">' + noOwner + '</div><div class="sub">Asignación pendiente</div></div>';
    html += '</div>';

    var areas = {};
    state.iniciativas.forEach(function(i){ if (i.area) areas[i.area] = true; });
    html += '<div class="cm-friction-filters" style="margin-top:16px;flex-wrap:wrap">';
    html += '<input type="text" class="cm-input" id="cm-iniciativas-filter-text" placeholder="Buscar..." value="' + escHtml(iniciativasFilter.text) + '" style="max-width:200px">';
    html += '<select class="cm-select" id="cm-iniciativas-filter-status">';
    html += '<option value="all"' + (iniciativasFilter.status === 'all' ? ' selected' : '') + '>Todos los estados</option>';
    html += '<option value="pending"' + (iniciativasFilter.status === 'pending' ? ' selected' : '') + '>Abierta</option>';
    html += '<option value="in_progress"' + (iniciativasFilter.status === 'in_progress' ? ' selected' : '') + '>En ejecución</option>';
    html += '<option value="completed"' + (iniciativasFilter.status === 'completed' ? ' selected' : '') + '>Completada</option>';
    html += '</select>';
    html += '<select class="cm-select" id="cm-iniciativas-filter-priority">';
    html += '<option value="all"' + (iniciativasFilter.priority === 'all' ? ' selected' : '') + '>Toda prioridad</option>';
    ['high','medium','low'].forEach(function(p) {
      var lbl = {high:'Alta',medium:'Media',low:'Baja'}[p];
      html += '<option value="' + p + '"' + (iniciativasFilter.priority === p ? ' selected' : '') + '>' + lbl + '</option>';
    });
    html += '</select>';
    html += '<select class="cm-select" id="cm-iniciativas-filter-tipo">';
    html += '<option value="all"' + (iniciativasFilter.tipo === 'all' ? ' selected' : '') + '>Todo tipo</option>';
    [['estrategica','Estratégica'],['operativa','Operativa'],['hito','Hito']].forEach(function(t) {
      html += '<option value="' + t[0] + '"' + (iniciativasFilter.tipo === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
    });
    html += '</select>';
    if (Object.keys(areas).length > 0) {
      html += '<select class="cm-select" id="cm-iniciativas-filter-area">';
      html += '<option value="all"' + (iniciativasFilter.area === 'all' ? ' selected' : '') + '>Toda área</option>';
      Object.keys(areas).sort().forEach(function(a) {
        html += '<option value="' + escHtml(a) + '"' + (iniciativasFilter.area === a ? ' selected' : '') + '>' + escHtml(a) + '</option>';
      });
      html += '</select>';
    }
    html += '<select class="cm-select" id="cm-iniciativas-filter-responsable">';
    html += '<option value="all"' + (iniciativasFilter.responsable === 'all' ? ' selected' : '') + '>Todos los responsables</option>';
    state.people.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (String(iniciativasFilter.responsable) === String(p.id) ? ' selected' : '') + '>' + escHtml(p.name) + '</option>';
    });
    html += '</select>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-new-initiative">+ Nueva Iniciativa</button>';
    html += '</div>';

    if (filtered.length === 0) {
      html += '<div class="cm-empty"><div class="cm-empty-icon">&#128221;</div>No hay iniciativas que coincidan con los filtros</div>';
      el.innerHTML = html;
      bindIniciativasEvents(el);
      return;
    }

    html += '<div class="cm-table-wrap" style="margin-top:12px"><table class="cm-table cm-table-iniciativas">';
    html += '<thead><tr><th style="min-width:240px">Iniciativa</th><th style="width:110px">Prioridad</th><th style="width:130px">Tipo</th><th style="width:130px">Progreso</th><th style="min-width:140px">Impacta en</th><th style="width:140px">Estado</th><th style="min-width:160px">Responsable</th><th style="width:140px">Compromiso</th><th style="text-align:center;width:80px">Acciones</th></tr></thead><tbody>';
    filtered.forEach(function(i) {
      var resp = personName(i.responsable_id) || 'Sin asignar';
      var due = i.due_date ? fmtDate(i.due_date) : 'Sin fecha';
      var dueDays = i.due_date ? daysDiff(i.due_date) : null;
      var rowCls = initiativeRowClass(i);
      var st = i.status || 'pending';
      var tpNm = touchpointName(i.touchpoint_id);
      var prog = i.progress || 0;
      var progColor = prog >= 100 ? '#10B981' : (prog >= 50 ? '#6366F1' : (prog > 0 ? '#F59E0B' : '#94A3B8'));
      var pIds = i.pillar_ids || (i.pillar_id ? [i.pillar_id] : []);
      var fIds = i.friction_ids || [];
      var tIds = i.touchpoint_ids || (i.touchpoint_id ? [i.touchpoint_id] : []);
      var involvedIds = i.involved_ids || [];
      html += '<tr class="' + rowCls + '">';
      html += '<td style="vertical-align:top"><div style="font-weight:600;color:var(--text-primary,#1E293B)">' + escHtml(i.title || '') + initiativePriorityChip(i) + '</div>';
      if (i.target) html += '<div style="font-size:.74rem;color:#475569;margin-top:4px;display:flex;gap:4px"><span style="color:#94A3B8;flex-shrink:0">&#127919;</span><span><b>Meta:</b> ' + escHtml(i.target) + '</span></div>';
      if (i.description) html += '<div class="cm-ini-detail" style="margin-top:3px">' + escHtml(i.description) + '</div>';
      if (i.area) html += '<div style="font-size:.66rem;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:.3px">' + escHtml(i.area) + '</div>';
      html += '</td>';
      // Priority inline
      html += '<td>';
      html += '<select class="cm-select cm-ini-priority-inline" data-ini-id="' + escHtml(i.id) + '">';
      [['high','Alta'],['medium','Media'],['low','Baja']].forEach(function(opt) {
        html += '<option value="' + opt[0] + '"' + ((i.priority||'medium') === opt[0] ? ' selected' : '') + '>' + opt[1] + '</option>';
      });
      html += '</select>';
      html += '</td>';
      // Tipo inline
      html += '<td>';
      html += '<select class="cm-select cm-ini-tipo-inline" data-ini-id="' + escHtml(i.id) + '">';
      [['operativa','Operativa'],['estrategica','Estratégica'],['hito','Hito']].forEach(function(opt) {
        html += '<option value="' + opt[0] + '"' + ((i.tipo||'operativa') === opt[0] ? ' selected' : '') + '>' + opt[1] + '</option>';
      });
      html += '</select>';
      html += '</td>';
      html += '<td style="vertical-align:middle">';
      html += '<div class="cm-ini-prog-cell" data-ini-id="' + escHtml(i.id) + '">';
      html += '<input type="range" class="cm-ini-prog-slider" min="0" max="100" step="5" value="' + prog + '" data-ini-id="' + escHtml(i.id) + '" style="flex:1;min-width:60px;accent-color:' + progColor + '">';
      html += '<span class="cm-ini-prog-label" style="font-size:.72rem;font-weight:700;color:' + progColor + ';min-width:34px;text-align:right">' + prog + '%</span>';
      html += '</div>';
      html += '</td>';
      html += '<td style="vertical-align:top">';
      html += '<div style="display:flex;flex-wrap:wrap;gap:3px">';
      pIds.forEach(function(pid) {
        var pp = state.trust_pillars.find(function(x){ return String(x.id) === String(pid); });
        if (pp) html += '<span class="cm-ini-scope-tag" style="background:#EEF2FF;color:#4F46E5;border-color:#C7D2FE">' + escHtml(pp.name) + '</span>';
      });
      tIds.forEach(function(tid) {
        var tp = state.touchpoints.find(function(x){ return x.id === tid; });
        if (tp) html += '<span class="cm-ini-scope-tag" style="background:#F0F9FF;color:#0284C7;border-color:#BAE6FD" title="Touchpoint: ' + escHtml(tp.name) + '">TP #' + tp.id + '</span>';
      });
      fIds.forEach(function(fid) {
        var f = (state.frictions || []).find(function(x){ return String(x.id) === String(fid); });
        if (f) html += '<span class="cm-ini-scope-tag" style="background:#FEF2F2;color:#DC2626;border-color:#FECACA" title="' + escHtml(f.name) + '">' + escHtml(fid) + '</span>';
      });
      if (pIds.length === 0 && tIds.length === 0 && fIds.length === 0) {
        html += '<span style="font-size:.7rem;color:var(--text-muted);font-style:italic">Sin vincular</span>';
      }
      html += '</div>';
      html += '</td>';
      html += '<td style="vertical-align:middle"><select class="cm-select cm-initiative-status-inline" data-ini-id="' + escHtml(i.id) + '" title="Cambiar estado">';
      ['pending', 'in_progress', 'completed'].forEach(function(s) {
        html += '<option value="' + s + '"' + (st === s ? ' selected' : '') + '>' + escHtml(initiativeStatusLabel(s)) + '</option>';
      });
      html += '</select></td>';
      html += '<td>';
      html += '<select class="cm-select cm-ini-resp-inline" data-ini-id="' + escHtml(i.id) + '" title="Asignar responsable">';
      html += '<option value="">Sin asignar</option>';
      state.people.forEach(function(pp) {
        html += '<option value="' + pp.id + '"' + (String(i.responsable_id || '') === String(pp.id) ? ' selected' : '') + '>' + escHtml(pp.name) + '</option>';
      });
      html += '</select>';
      if (involvedIds.length > 0) {
        var involvedNames = involvedIds.map(function(pid){ return personName(pid) || ('#' + pid); }).join(', ');
        html += '<div style="font-size:.66rem;color:var(--text-muted);margin-top:3px" title="Involucrados: ' + escHtml(involvedNames) + '">+' + involvedIds.length + ' involucrado' + (involvedIds.length > 1 ? 's' : '') + '</div>';
      }
      html += '</td>';
      html += '<td>';
      html += '<input type="date" class="cm-input cm-ini-due-inline" data-ini-id="' + escHtml(i.id) + '" value="' + escHtml(i.due_date || '') + '">';
      if (dueDays !== null) {
        html += dueDays < 0 ? '<div style="margin-top:3px"><span class="cm-badge cm-badge-red">Vencida</span></div>' : (dueDays <= 7 && st !== 'completed' ? '<div style="margin-top:3px"><span class="cm-badge cm-badge-yellow">' + dueDays + ' d</span></div>' : '');
      }
      html += '</td>';
      html += '<td style="text-align:center;vertical-align:middle">';
      html += '<button class="cm-icon-btn cm-edit-initiative" data-id="' + escHtml(i.id) + '" title="Editar">&#9998;</button>';
      html += '<button class="cm-icon-btn danger cm-delete-initiative" data-id="' + escHtml(i.id) + '" title="Eliminar">&#128465;</button>';
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
    var iniTable = el.querySelector('table.cm-table-iniciativas');
    if (iniTable) _makeTableResizable(iniTable, 'iniciativas');
    bindIniciativasEvents(el);
  }

  function bindIniciativasEvents(el) {
    var fs = el.querySelector('#cm-iniciativas-filter-status');
    var fr = el.querySelector('#cm-iniciativas-filter-responsable');
    var fp = el.querySelector('#cm-iniciativas-filter-priority');
    var ft = el.querySelector('#cm-iniciativas-filter-tipo');
    var fa = el.querySelector('#cm-iniciativas-filter-area');
    var ftext = el.querySelector('#cm-iniciativas-filter-text');
    if (fs) fs.addEventListener('change', function() { iniciativasFilter.status = this.value; renderIniciativas(el); });
    if (fr) fr.addEventListener('change', function() { iniciativasFilter.responsable = this.value; renderIniciativas(el); });
    if (fp) fp.addEventListener('change', function() { iniciativasFilter.priority = this.value; renderIniciativas(el); });
    if (ft) ft.addEventListener('change', function() { iniciativasFilter.tipo = this.value; renderIniciativas(el); });
    if (fa) fa.addEventListener('change', function() { iniciativasFilter.area = this.value; renderIniciativas(el); });
    if (ftext) {
      var deb;
      ftext.addEventListener('input', function() {
        clearTimeout(deb);
        var v = this.value;
        deb = setTimeout(function() { iniciativasFilter.text = v; renderIniciativas(el); }, 200);
      });
    }
    var createBtn = el.querySelector('#cm-new-initiative');
    if (createBtn) createBtn.addEventListener('click', function() { showInitiativeModal(null, el); });
    el.querySelectorAll('.cm-edit-initiative').forEach(function(btn) {
      btn.addEventListener('click', function() { showInitiativeModal(this.dataset.id, el); });
    });
    el.querySelectorAll('.cm-delete-initiative').forEach(function(btn) {
      btn.addEventListener('click', function() { deleteInitiative(this.dataset.id, el); });
    });
    el.querySelectorAll('.cm-initiative-status-inline').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var newStatus = this.value;
        var item = state.iniciativas.find(function(x) { return String(x.id) === String(iniId); });
        var prev = item ? (item.status || 'pending') : 'pending';
        if (newStatus === prev) return;
        apiPatch('iniciativas', iniId, { status: newStatus }).then(function() {
          state.iniciativas.forEach(function(x) {
            if (String(x.id) === String(iniId)) x.status = newStatus;
          });
          toast('Estado actualizado', 'success');
          renderIniciativas(el);
          render();
        }).catch(function() {
          sel.value = prev;
          toast('Error al actualizar estado', 'error');
        });
      });
    });

    // Progress slider — live label, save on release
    el.querySelectorAll('.cm-ini-prog-slider').forEach(function(slider) {
      var label = slider.parentElement.querySelector('.cm-ini-prog-label');
      slider.addEventListener('input', function() {
        var v = parseInt(this.value, 10);
        var color = v >= 100 ? '#10B981' : (v >= 50 ? '#6366F1' : (v > 0 ? '#F59E0B' : '#94A3B8'));
        label.textContent = v + '%';
        label.style.color = color;
        slider.style.accentColor = color;
      });
      slider.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var v = parseInt(this.value, 10) || 0;
        var item = state.iniciativas.find(function(x) { return String(x.id) === String(iniId); });
        var prev = item ? (item.progress || 0) : 0;
        if (v === prev) return;
        apiPatch('iniciativas', iniId, { progress: v }).then(function() {
          state.iniciativas.forEach(function(x) { if (String(x.id) === String(iniId)) x.progress = v; });
          toast('Progreso actualizado', 'success');
        }).catch(function() {
          slider.value = prev;
          slider.dispatchEvent(new Event('input'));
          toast('Error al actualizar progreso', 'error');
        });
      });
    });

    // Pillar select inline
    el.querySelectorAll('.cm-ini-pillar-inline').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var newPillar = this.value || null;
        var item = state.iniciativas.find(function(x) { return String(x.id) === String(iniId); });
        var prev = item ? (item.pillar_id || null) : null;
        apiPatch('iniciativas', iniId, { pillar_id: newPillar }).then(function() {
          state.iniciativas.forEach(function(x) { if (String(x.id) === String(iniId)) x.pillar_id = newPillar; });
          toast('Pilar actualizado', 'success');
          renderIniciativas(el);
        }).catch(function() {
          sel.value = prev || '';
          toast('Error', 'error');
        });
      });
    });

    // Responsable select inline
    el.querySelectorAll('.cm-ini-resp-inline').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var newResp = this.value ? parseInt(this.value, 10) : null;
        var item = state.iniciativas.find(function(x) { return String(x.id) === String(iniId); });
        var prev = item ? (item.responsable_id || null) : null;
        apiPatch('iniciativas', iniId, { responsable_id: newResp }).then(function() {
          state.iniciativas.forEach(function(x) { if (String(x.id) === String(iniId)) x.responsable_id = newResp; });
          toast('Responsable actualizado', 'success');
          renderIniciativas(el);
        }).catch(function() {
          sel.value = prev || '';
          toast('Error', 'error');
        });
      });
    });

    // Due date inline
    el.querySelectorAll('.cm-ini-due-inline').forEach(function(input) {
      input.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var newDue = this.value || null;
        var item = state.iniciativas.find(function(x) { return String(x.id) === String(iniId); });
        var prev = item ? (item.due_date || null) : null;
        apiPatch('iniciativas', iniId, { due_date: newDue }).then(function() {
          state.iniciativas.forEach(function(x) { if (String(x.id) === String(iniId)) x.due_date = newDue; });
          toast('Fecha actualizada', 'success');
          renderIniciativas(el);
        }).catch(function() {
          input.value = prev || '';
          toast('Error', 'error');
        });
      });
    });

    // Priority inline
    el.querySelectorAll('.cm-ini-priority-inline').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var v = this.value;
        apiPatch('iniciativas', iniId, { priority: v }).then(function() {
          state.iniciativas.forEach(function(x) { if (String(x.id) === String(iniId)) x.priority = v; });
          toast('Prioridad actualizada', 'success');
          renderIniciativas(el);
        }).catch(function() { toast('Error', 'error'); });
      });
    });

    // Tipo inline
    el.querySelectorAll('.cm-ini-tipo-inline').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var iniId = this.dataset.iniId;
        var v = this.value;
        apiPatch('iniciativas', iniId, { tipo: v }).then(function() {
          state.iniciativas.forEach(function(x) { if (String(x.id) === String(iniId)) x.tipo = v; });
          toast('Tipo actualizado', 'success');
        }).catch(function() { toast('Error', 'error'); });
      });
    });
  }

  function _multiCheckList(idPrefix, items, selectedSet, labelFn) {
    var selectedCount = items.filter(function(i){ return selectedSet[String(i.id)] === true; }).length;
    var html = '<div class="cm-multicheck" data-prefix="' + idPrefix + '" style="border:1px solid var(--border,#E2E8F0);border-radius:8px;background:#fff;overflow:hidden">';
    // Header: count + search
    html += '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#F8FAFC;border-bottom:1px solid #E2E8F0">';
    html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    html += '<input type="text" class="cm-multicheck-search" placeholder="Buscar..." style="flex:1;border:none;background:transparent;font-size:.74rem;outline:none">';
    html += '<span class="cm-multicheck-count" style="font-size:.66rem;color:var(--text-muted);font-weight:700;white-space:nowrap">' + selectedCount + '/' + items.length + '</span>';
    html += '</div>';
    // List
    html += '<div class="cm-multicheck-list" style="max-height:160px;overflow-y:auto;padding:6px 8px">';
    if (items.length === 0) {
      html += '<div style="font-size:.74rem;color:var(--text-muted);font-style:italic;padding:6px 0">Sin opciones</div>';
    } else {
      items.forEach(function(item) {
        var isSel = selectedSet[String(item.id)] === true;
        var label = labelFn(item);
        html += '<label class="cm-multicheck-item" data-search="' + escHtml(label.toLowerCase()) + '" style="display:flex;gap:8px;align-items:center;padding:5px 6px;font-size:.78rem;cursor:pointer;border-radius:4px;transition:background .1s">';
        html += '<input type="checkbox" class="' + idPrefix + '" value="' + escHtml(item.id) + '"' + (isSel ? ' checked' : '') + '>';
        html += '<span style="flex:1">' + escHtml(label) + '</span>';
        html += '</label>';
      });
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _bindMultiCheckSearch(scope) {
    (scope || document).querySelectorAll('.cm-multicheck').forEach(function(box) {
      var search = box.querySelector('.cm-multicheck-search');
      var count = box.querySelector('.cm-multicheck-count');
      var list = box.querySelector('.cm-multicheck-list');
      var prefix = box.dataset.prefix;
      var items = list.querySelectorAll('.cm-multicheck-item');
      if (search) {
        search.addEventListener('input', function() {
          var q = this.value.toLowerCase().trim();
          items.forEach(function(it) {
            it.style.display = (!q || it.dataset.search.indexOf(q) >= 0) ? '' : 'none';
          });
        });
      }
      // Update count on change
      box.querySelectorAll('input.' + prefix).forEach(function(cb) {
        cb.addEventListener('change', function() {
          var sel = box.querySelectorAll('input.' + prefix + ':checked').length;
          count.textContent = sel + '/' + items.length;
        });
      });
      // Hover effect via JS (avoids inline pseudo)
      items.forEach(function(it) {
        it.addEventListener('mouseenter', function(){ this.style.background = '#F1F5F9'; });
        it.addEventListener('mouseleave', function(){ this.style.background = ''; });
      });
    });
  }

  function _readMultiCheck(className, asInt) {
    var out = [];
    document.querySelectorAll('.' + className + ':checked').forEach(function(cb) {
      out.push(asInt ? parseInt(cb.value, 10) : cb.value);
    });
    return out;
  }

  function showInitiativeModal(initiativeId, parentEl, defaults) {
    defaults = defaults || {};
    var existing = null;
    if (initiativeId != null) {
      existing = state.iniciativas.find(function(i) { return String(i.id) === String(initiativeId); });
      if (!existing) return;
    }
    var isEdit = !!existing;
    var pillarSet = {}, tpSet = {}, frSet = {}, invSet = {}, depSet = {};
    var srcPillars = existing ? (existing.pillar_ids || (existing.pillar_id ? [existing.pillar_id] : [])) : (defaults.pillar_ids || (defaults.pillar_id ? [defaults.pillar_id] : []));
    var srcTps = existing ? (existing.touchpoint_ids || (existing.touchpoint_id ? [existing.touchpoint_id] : [])) : (defaults.touchpoint_ids || []);
    var srcFr = existing ? (existing.friction_ids || []) : (defaults.friction_ids || []);
    var srcInv = existing ? (existing.involved_ids || []) : (defaults.involved_ids || []);
    var srcDep = existing ? (existing.depends_on_ids || []) : [];
    srcPillars.forEach(function(x){ pillarSet[String(x)] = true; });
    srcTps.forEach(function(x){ tpSet[String(x)] = true; });
    srcFr.forEach(function(x){ frSet[String(x)] = true; });
    srcInv.forEach(function(x){ invSet[String(x)] = true; });
    srcDep.forEach(function(x){ depSet[String(x)] = true; });

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal" style="max-width:780px">';
    html += '<div class="cm-modal-title">' + (isEdit ? 'Editar' : 'Nueva') + ' iniciativa</div>';

    // Identidad
    html += '<div class="cm-modal-field"><label>Título <span class="required">*</span></label>';
    html += '<input type="text" class="cm-input" id="cm-ini-title" value="' + escHtml(existing ? (existing.title || '') : '') + '" placeholder="Describe la iniciativa"></div>';
    html += '<div class="cm-modal-field"><label>Descripción</label>';
    html += '<textarea class="cm-textarea" id="cm-ini-description" rows="2" placeholder="Qué se va a hacer, alcance...">' + escHtml(existing ? (existing.description || '') : '') + '</textarea></div>';
    html += '<div class="cm-modal-field"><label>Meta / objetivo</label>';
    html += '<input type="text" class="cm-input" id="cm-ini-target" value="' + escHtml(existing ? (existing.target || '') : '') + '" placeholder="Ej. 10 testimonios capturados al mes"></div>';

    // Clasificación
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Prioridad</label><select class="cm-select" id="cm-ini-priority">';
    [['high','Alta'],['medium','Media'],['low','Baja']].forEach(function(o) {
      html += '<option value="' + o[0] + '"' + ((existing ? (existing.priority||'medium') : 'medium') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    });
    html += '</select></div>';
    html += '<div class="cm-modal-field"><label>Tipo</label><select class="cm-select" id="cm-ini-tipo">';
    [['operativa','Operativa'],['estrategica','Estratégica'],['hito','Hito']].forEach(function(o) {
      html += '<option value="' + o[0] + '"' + ((existing ? (existing.tipo||'operativa') : 'operativa') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    });
    html += '</select></div>';
    html += '<div class="cm-modal-field"><label>Área</label>';
    html += '<input type="text" class="cm-input" id="cm-ini-area" list="cm-ini-area-opts" value="' + escHtml(existing ? (existing.area || '') : '') + '" placeholder="Marketing, Ventas, ...">';
    var existingAreas = {};
    state.iniciativas.forEach(function(ii){ if (ii.area) existingAreas[ii.area] = true; });
    html += '<datalist id="cm-ini-area-opts">';
    Object.keys(existingAreas).sort().forEach(function(a){ html += '<option value="' + escHtml(a) + '">'; });
    html += '</datalist></div>';
    html += '</div>';

    // Estado / fecha / progreso
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Estado</label><select class="cm-select" id="cm-ini-status">';
    ['pending', 'in_progress', 'completed'].forEach(function(s) {
      var selected = (existing ? existing.status : 'pending') === s;
      html += '<option value="' + s + '"' + (selected ? ' selected' : '') + '>' + initiativeStatusLabel(s) + '</option>';
    });
    html += '</select></div>';
    html += '<div class="cm-modal-field"><label>Fecha compromiso</label><input type="date" class="cm-input" id="cm-ini-due" value="' + escHtml(existing && existing.due_date ? existing.due_date : '') + '"></div>';
    html += '<div class="cm-modal-field"><label>Progreso (' + (existing ? (existing.progress || 0) : 0) + '%)</label>';
    html += '<input type="range" min="0" max="100" step="5" id="cm-ini-progress" value="' + (existing ? (existing.progress || 0) : 0) + '" style="width:100%">';
    html += '</div>';
    html += '</div>';

    // Equipo
    html += '<div class="cm-modal-field"><label>Responsable principal</label>' + personSelect(existing ? existing.responsable_id : null, 'cm-ini-responsable', true) + '</div>';
    html += '<div class="cm-modal-field"><label>Involucrados (apoyan, no son responsables)</label>';
    html += _multiCheckList('cm-ini-inv', state.people, invSet, function(p){ return p.name + (p.role ? ' (' + p.role + ')' : ''); });
    html += '</div>';

    // Vínculos
    html += '<div class="cm-modal-field" style="border-top:1px solid var(--border,#E2E8F0);padding-top:14px"><label style="font-weight:700;color:var(--text-primary)">Impacta en</label></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Pilares (Motor de Confianza)</label>';
    html += _multiCheckList('cm-ini-pillars', state.trust_pillars, pillarSet, function(p){ return (p.icon ? p.icon + ' ' : '') + p.name; });
    html += '</div>';
    html += '<div class="cm-modal-field"><label>Touchpoints</label>';
    var tpSorted = state.touchpoints.slice().sort(function(a,b){
      var pa = (state.phases.find(function(x){return x.id===a.phase_id;}) || {order:0}).order || 0;
      var pb = (state.phases.find(function(x){return x.id===b.phase_id;}) || {order:0}).order || 0;
      return (pa - pb) || ((a.order||0) - (b.order||0));
    });
    html += _multiCheckList('cm-ini-tps', tpSorted, tpSet, function(t){ return '#' + t.id + ' ' + t.name + ' (' + (phaseName(t.phase_id) || '?') + ')'; });
    html += '</div>';
    html += '<div class="cm-modal-field"><label>Fricciones</label>';
    html += _multiCheckList('cm-ini-frs', (state.frictions||[]), frSet, function(f){ return f.id + ' — ' + f.name.substring(0, 50) + (f.name.length > 50 ? '…' : ''); });
    html += '</div>';
    html += '</div>';

    // Dependencias
    html += '<div class="cm-modal-field"><label>Depende de (otras iniciativas)</label>';
    var depCandidates = state.iniciativas.filter(function(x){ return !existing || x.id !== existing.id; });
    html += _multiCheckList('cm-ini-deps', depCandidates, depSet, function(d){ return d.title; });
    html += '</div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-ini-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-ini-save">' + (isEdit ? 'Guardar' : 'Crear') + '</button>';
    html += '</div></div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);
    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    document.querySelector('#cm-ini-cancel').addEventListener('click', closeModal);
    _bindMultiCheckSearch();
    var progSlider = document.querySelector('#cm-ini-progress');
    var progLabel = progSlider.parentElement.querySelector('label');
    progSlider.addEventListener('input', function() { progLabel.textContent = 'Progreso (' + this.value + '%)'; });

    document.querySelector('#cm-ini-save').addEventListener('click', function() {
      var title = document.querySelector('#cm-ini-title').value.trim();
      if (!title) { toast('El título es obligatorio', 'error'); return; }
      var payload = {
        title: title,
        description: document.querySelector('#cm-ini-description').value.trim(),
        motor: 'trust',
        status: document.querySelector('#cm-ini-status').value || 'pending',
        responsable_id: parseInt(document.querySelector('#cm-ini-responsable').value, 10) || null,
        due_date: document.querySelector('#cm-ini-due').value || null,
        target: document.querySelector('#cm-ini-target').value.trim(),
        progress: parseInt(document.querySelector('#cm-ini-progress').value, 10) || 0,
        priority: document.querySelector('#cm-ini-priority').value,
        area: document.querySelector('#cm-ini-area').value.trim(),
        tipo: document.querySelector('#cm-ini-tipo').value,
        pillar_ids: _readMultiCheck('cm-ini-pillars', false),
        touchpoint_ids: _readMultiCheck('cm-ini-tps', true),
        friction_ids: _readMultiCheck('cm-ini-frs', false),
        involved_ids: _readMultiCheck('cm-ini-inv', true),
        depends_on_ids: _readMultiCheck('cm-ini-deps', true)
      };
      var req = isEdit ? apiPatch('iniciativas', existing.id, payload) : apiPost('iniciativas', payload);
      req.then(function() {
        closeModal();
        toast(isEdit ? 'Iniciativa actualizada' : 'Iniciativa creada', 'success');
        return loadBootstrap().then(function() { renderTab(); render(); });
      }).catch(function(e) {
        var msg = (e && e.message) ? e.message : 'Error al guardar iniciativa';
        toast(msg, 'error');
      });
    });
  }

  function deleteInitiative(initiativeId, parentEl) {
    var item = state.iniciativas.find(function(i) { return String(i.id) === String(initiativeId); });
    if (!item) return;
    if (!confirm('Eliminar iniciativa "' + item.title + '"?')) return;
    apiDelete('iniciativas', initiativeId).then(function() {
      toast('Iniciativa eliminada', 'success');
      return loadBootstrap().then(function() { renderTab(); render(); });
    }).catch(function() { toast('Error al eliminar iniciativa', 'error'); });
  }

  /* ── Touchpoint CRUD ── */
  function showCreateTouchpointModal(phaseId, parentEl) {
    var maxOrder = 0;
    state.touchpoints.forEach(function(tp) {
      if (String(tp.phase_id) === String(phaseId) && (tp.order || 0) > maxOrder) maxOrder = tp.order;
    });

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal">';
    html += '<div class="cm-modal-title">Nuevo Touchpoint</div>';

    html += '<div class="cm-modal-field"><label>Nombre <span class="required">*</span></label>';
    html += '<input type="text" class="cm-input" id="cm-ntp-name" placeholder="Nombre del touchpoint..."></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Canal</label>';
    html += '<input type="text" class="cm-input" id="cm-ntp-canal" placeholder="Canal"></div>';
    html += '<div class="cm-modal-field"><label>Responsable</label>';
    html += personSelect(null, 'cm-ntp-resp');
    html += '</div>';
    html += '</div>';

    html += '<div class="cm-modal-field"><label>KPIs</label>';
    html += kpiChipInputHtml('cm-ntp-kpis', [], '');
    html += '</div>';

    html += '<div class="cm-modal-field"><label>Fricciones</label>';
    html += frictionChipInputHtml('cm-ntp-frictions', null, phaseId);
    html += '</div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-ntp-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-ntp-create">Crear Touchpoint</button>';
    html += '</div>';

    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    var backdrop = document.querySelector('#cm-modal-backdrop');
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) closeModal();
    });

    document.querySelector('#cm-ntp-cancel').addEventListener('click', closeModal);
    bindKpiChipInput('cm-ntp-kpis');
    bindFrictionChipInput('cm-ntp-frictions', phaseId, null);

    document.querySelector('#cm-ntp-create').addEventListener('click', function() {
      var name = document.querySelector('#cm-ntp-name').value.trim();
      if (!name) { toast('El nombre es requerido', 'error'); return; }
      var linkedFrictionIds = getFrictionChipIds('cm-ntp-frictions');
      var allKpiIds = getChipMasterIds('cm-ntp-kpis');
      var kpiNames = allKpiIds.map(function(kid) { var k = state.kpis.find(function(kk) { return kk.id === kid; }); return k ? k.name : kid; });
      var data = {
        phase_id: phaseId,
        name: name,
        canal: document.querySelector('#cm-ntp-canal').value.trim() || null,
        responsable_id: parseInt(document.querySelector('#cm-ntp-resp').value) || null,
        kpi: kpiNames.join(', '),
        friction_text: linkedFrictionIds.length > 0 ? linkedFrictionIds.join(', ') : null,
        has_friction: linkedFrictionIds.length > 0,
        order: maxOrder + 1,
        notes: null
      };
      var selectedKpis = allKpiIds;

      apiPost('touchpoints', data).then(function(created) {
        // Link frictions to this touchpoint
        var promises = [];
        linkedFrictionIds.forEach(function(fid) {
          promises.push(apiPatch('frictions', fid, { touchpoint_id: created.id }));
        });
        // Link KPIs
        if (selectedKpis.length > 0 && created && created.id) {
          promises.push(fetch('/api/comercial/touchpoints/' + created.id + '/kpis', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedKpis)
          }));
        }
        return Promise.all(promises).then(function() { return created; });
      }).then(function(created) {
        closeModal();
        toast('Touchpoint "' + name + '" creado', 'success');
        return refreshAll().then(function() {
          renderProceso(parentEl);
        });
      }).catch(function() {
        toast('Error al crear touchpoint', 'error');
      });
    });
  }

  function showEditTouchpointRow(tpId, parentEl) {
    var tp = state.touchpoints.find(function(t) { return String(t.id) === String(tpId); });
    if (!tp) return;

    var linkedKpis = getLinkedKpisForTouchpoint(tp.id);

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal" style="max-width:600px">';
    html += '<div class="cm-modal-title">Editar Touchpoint #' + tp.id + '</div>';

    html += '<div class="cm-modal-field"><label>Nombre</label>';
    html += '<input type="text" class="cm-input" id="cm-etp-name" value="' + escHtml(tp.name) + '"></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Canal</label>';
    html += '<input type="text" class="cm-input" id="cm-etp-canal" value="' + escHtml(tp.canal || '') + '"></div>';
    html += '<div class="cm-modal-field"><label>Responsable</label>';
    html += personSelect(tp.responsable_id, 'cm-etp-resp');
    html += '</div>';
    html += '</div>';

    html += '<div class="cm-modal-field"><label>KPIs</label>';
    html += kpiChipInputHtml('cm-etp-kpis', linkedKpis, tp.kpi || '');
    html += '</div>';

    html += '<div class="cm-modal-field"><label>Fricciones</label>';
    html += frictionChipInputHtml('cm-etp-frictions', tp.id, tp.phase_id);
    html += '</div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-etp-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-etp-save">Guardar</button>';
    html += '</div>';

    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
    document.querySelector('#cm-etp-cancel').addEventListener('click', closeModal);
    bindKpiChipInput('cm-etp-kpis');
    bindFrictionChipInput('cm-etp-frictions', tp.phase_id, tp.id);
    document.querySelector('#cm-etp-save').addEventListener('click', function() {
      var linkedFrictionIds = getFrictionChipIds('cm-etp-frictions');
      var allKpiIds = getChipMasterIds('cm-etp-kpis');
      var kpiNames = allKpiIds.map(function(kid) { var k = state.kpis.find(function(kk) { return kk.id === kid; }); return k ? k.name : kid; });
      var data = {
        name: document.querySelector('#cm-etp-name').value.trim(),
        canal: document.querySelector('#cm-etp-canal').value.trim(),
        responsable_id: parseInt(document.querySelector('#cm-etp-resp').value) || null,
        kpi: kpiNames.join(', '),
        friction_text: linkedFrictionIds.length > 0 ? linkedFrictionIds.join(', ') : null,
        has_friction: linkedFrictionIds.length > 0,
      };

      var selectedKpis = allKpiIds;

      // Save touchpoint fields
      apiPatch('touchpoints', tpId, data).then(function() {
        var promises = [];
        // Save KPI links via PUT
        promises.push(fetch('/api/comercial/touchpoints/' + tpId + '/kpis', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedKpis)
        }));
        // Update friction touchpoint_id links
        // Unlink frictions that were removed
        var prevLinked = state.frictions.filter(function(f) { return f.touchpoint_id == tpId; });
        prevLinked.forEach(function(f) {
          if (linkedFrictionIds.indexOf(f.id) < 0) {
            promises.push(apiPatch('frictions', f.id, { touchpoint_id: null }));
          }
        });
        // Link newly added frictions
        linkedFrictionIds.forEach(function(fid) {
          var already = prevLinked.some(function(f) { return f.id === fid; });
          if (!already) {
            promises.push(apiPatch('frictions', fid, { touchpoint_id: parseInt(tpId) }));
          }
        });
        return Promise.all(promises);
      }).then(function() {
        closeModal();
        toast('Touchpoint actualizado', 'success');
        return refreshAll().then(function() {
          renderProceso(parentEl);
        });
      }).catch(function() { toast('Error al actualizar', 'error'); });
    });
  }

  function deleteTouchpoint(tpId, parentEl) {
    var tp = state.touchpoints.find(function(t) { return String(t.id) === String(tpId); });
    var tpName = tp ? tp.name : tpId;
    showDeleteConfirmGeneric(
      'Eliminar Touchpoint',
      'Eliminar touchpoint "' + tpName + '"? Esta accion no se puede deshacer.',
      function() {
        apiDelete('touchpoints', tpId).then(function() {
          state.touchpoints = state.touchpoints.filter(function(t) { return String(t.id) !== String(tpId); });
          toast('Touchpoint eliminado', 'success');
          refreshAll().then(function() {
            renderProceso(parentEl);
          });
        }).catch(function() {
          toast('Error al eliminar touchpoint', 'error');
        });
      }
    );
  }

  /* ──────────────────────────────────────────────────
     TAB 3: FRICCIONES & TAREAS
     ────────────────────────────────────────────────── */
  function filterFrictions() {
    var search = frictionSearch.toLowerCase();
    return state.frictions.filter(function(f) {
      if (frictionFilterImpact !== 'all' && f.impact !== frictionFilterImpact) return false;
      if (frictionFilterStatus !== 'all' && frictionFilterStatus !== 'overdue' && f.status !== frictionFilterStatus) return false;
      if (frictionFilterPhase !== 'all' && String(f.phase_id) !== String(frictionFilterPhase)) return false;
      if (search) {
        var haystack = ((f.name || '') + ' ' + (f.solution || '') + ' ' + (f.notes || '') + ' ' + (f.responsable || '') + ' ' + personName(f.responsable_id) + ' ' + (f.id || '') + ' ' + touchpointName(f.touchpoint_id)).toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });
  }

  function renderFricciones(el) {
    var html = '';

    // Count frictions by category for pills
    var allFrictions = state.frictions;
    var countAll = allFrictions.length;
    var countHigh = allFrictions.filter(function(f){ return f.impact === 'high'; }).length;
    var countMedium = allFrictions.filter(function(f){ return f.impact === 'medium'; }).length;
    var countLow = allFrictions.filter(function(f){ return f.impact === 'low'; }).length;
    var countInProgress = allFrictions.filter(function(f){ return f.status === 'in_progress'; }).length;
    var countCompleted = allFrictions.filter(function(f){ return f.status === 'completed'; }).length;
    var countOverdue = allFrictions.filter(function(f){ return f.status !== 'completed' && f.is_overdue; }).length;

    // A) Filter pills (PDF2 design)
    html += '<div class="cm-filter-pills">';
    html += '<button class="cm-pill' + (frictionFilterImpact === 'all' && frictionFilterStatus === 'all' ? ' active' : '') + '" data-filter="all" data-type="reset">Todas (' + countAll + ')</button>';
    html += '<button class="cm-pill cm-pill-red' + (frictionFilterImpact === 'high' ? ' active' : '') + '" data-filter="high" data-type="impact"><span class="cm-pill-dot cm-pill-dot-red"></span> Alto (' + countHigh + ')</button>';
    html += '<button class="cm-pill cm-pill-yellow' + (frictionFilterImpact === 'medium' ? ' active' : '') + '" data-filter="medium" data-type="impact"><span class="cm-pill-dot cm-pill-dot-yellow"></span> Medio (' + countMedium + ')</button>';
    html += '<button class="cm-pill cm-pill-green' + (frictionFilterImpact === 'low' ? ' active' : '') + '" data-filter="low" data-type="impact"><span class="cm-pill-dot cm-pill-dot-green"></span> Acum. (' + countLow + ')</button>';
    html += '<span class="cm-pill-sep"></span>';
    html += '<button class="cm-pill' + (frictionFilterStatus === 'in_progress' ? ' active' : '') + '" data-filter="in_progress" data-type="status">&#9654; Progreso (' + countInProgress + ')</button>';
    html += '<button class="cm-pill' + (frictionFilterStatus === 'completed' ? ' active' : '') + '" data-filter="completed" data-type="status">&#10003; Hechas (' + countCompleted + ')</button>';
    html += '<button class="cm-pill' + (frictionFilterStatus === 'overdue' ? ' active' : '') + '" data-filter="overdue" data-type="status">&#9888; Vencidas (' + countOverdue + ')</button>';
    html += '</div>';

    // Search + phase filter + new button
    html += '<div class="cm-filters">';
    html += '<input type="text" class="cm-search" id="cm-f-search" placeholder="Buscar fricciones..." value="' + escHtml(frictionSearch) + '">';
    html += '<select class="cm-select" id="cm-f-phase">';
    html += '<option value="all"' + (frictionFilterPhase === 'all' ? ' selected' : '') + '>Todas las Fases</option>';
    state.phases.slice().sort(function(a,b){ return (a.order||0)-(b.order||0); }).forEach(function(ph) {
      html += '<option value="' + escHtml(ph.id) + '"' + (frictionFilterPhase === ph.id ? ' selected' : '') + '>' + escHtml(ph.name) + '</option>';
    });
    html += '</select>';
    html += '<div class="cm-spacer"></div>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-new-friction">+ Nueva Friccion</button>';
    html += '</div>';

    // Apply filters
    var frictions;
    if (frictionFilterStatus === 'overdue') {
      var savedStatus = frictionFilterStatus;
      frictionFilterStatus = 'all';
      frictions = filterFrictions().filter(function(f) { return f.status !== 'completed' && f.is_overdue; });
      frictionFilterStatus = savedStatus;
    } else {
      frictions = filterFrictions();
    }

    if (frictions.length === 0) {
      html += '<div class="cm-empty"><div class="cm-empty-icon">&#128270;</div>No hay fricciones que coincidan con los filtros</div>';
    } else {
      html += '<div class="cm-friction-list">';
      frictions.forEach(function(f) { html += renderFrictionCard(f); });
      html += '</div>';
    }

    el.innerHTML = html;
    bindFrictionEvents(el);
  }

  /* ── Friction Card (PDF2 design) ── */
  function renderFrictionCard(f) {
    var pm2 = phaseMap();
    var phase = pm2[f.phase_id] || {};
    var days = daysDiff(f.deadline);
    var deadlineDateText = f.deadline ? fmtDate(f.deadline) : 'Sin fecha';
    var deadlineDaysText = '';
    var deadlineColorCls = '';
    if (f.deadline && days !== null) {
      if (days < 0) { deadlineDaysText = '(' + Math.abs(days) + 'd vencido)'; deadlineColorCls = 'red'; }
      else if (days <= 7) { deadlineDaysText = '(' + days + 'd restantes)'; deadlineColorCls = 'orange'; }
      else { deadlineDaysText = '(' + days + 'd restantes)'; deadlineColorCls = 'green'; }
    }

    var expanded = !!expandedFrictions[f.id];
    var impactCls = f.impact === 'high' ? 'impact-high' : f.impact === 'medium' ? 'impact-medium' : 'impact-low';

    var html = '<div class="cm-friction-card ' + impactCls + '" data-fid="' + escHtml(f.id) + '">';

    // Top row: ID + badges + phase + controls
    html += '<div class="cm-friction-top-row">';
    html += '<div class="cm-friction-top-left">';
    html += '<span class="cm-friction-id">' + escHtml(f.id) + '</span>';
    html += impactBadge(f.impact);
    html += statusBadge(f.status);
    if (phase.name) {
      html += '<span class="cm-friction-phase-tag">&#128205; ' + escHtml(phase.name) + '</span>';
    }
    html += '</div>';
    html += '<div class="cm-friction-top-right">';
    // Status dropdown
    html += '<select class="cm-status-select-inline cm-f-status-select" data-fid="' + escHtml(f.id) + '">';
    ['pending','analysis','in_progress','validation','completed'].forEach(function(s) {
      var ic = s === 'pending' ? '&#9675;' : s === 'analysis' ? '&#128269;' : s === 'in_progress' ? '&#9654;' : s === 'validation' ? '&#10004;' : '&#10003;';
      html += '<option value="' + s + '"' + (f.status === s ? ' selected' : '') + '>' + ic + ' ' + statusLabel(s) + '</option>';
    });
    html += '</select>';
    // Edit icon
    html += '<button class="cm-icon-btn cm-friction-edit-toggle" data-fid="' + escHtml(f.id) + '" title="Editar">&#9998;</button>';
    html += '</div>';
    html += '</div>';

    // Title
    html += '<div class="cm-friction-title">' + escHtml(f.name) + '</div>';

    if (f.touchpoint_id) {
      html += '<div class="cm-friction-tp-line">&#128205; Touchpoint: ' + escHtml(touchpointName(f.touchpoint_id)) + '</div>';
    }

    // Solution box
    html += '<div class="cm-field-box">';
    html += '<div class="field-label">Solucion</div>';
    html += '<div class="field-value">' + escHtml(f.solution || 'Sin solucion definida') + '</div>';
    html += '</div>';

    // Expected outcome box (green text)
    html += '<div class="cm-field-box">';
    html += '<div class="field-label">Resultado Esperado</div>';
    html += '<div class="field-value green">' + escHtml(f.expected_outcome || 'Sin resultado definido') + '</div>';
    html += '</div>';

    // Deadline + Responsable row
    html += '<div style="display:flex;gap:10px;margin:0 20px 16px">';
    html += '<div class="cm-field-box" style="margin:0;flex:1">';
    html += '<div class="field-label">Fecha Limite</div>';
    html += '<div class="field-value">';
    html += '<span class="' + (deadlineColorCls ? deadlineColorCls : '') + '">' + escHtml(deadlineDateText) + '</span>';
    if (deadlineDaysText) {
      html += ' <span style="color:var(--text-muted,#94A3B8);font-size:.8rem">' + deadlineDaysText + '</span>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="cm-field-box" style="margin:0;flex:1">';
    html += '<div class="field-label">Responsable</div>';
    var respName = personName(f.responsable_id) || f.responsable || 'Sin asignar';
    html += '<div class="field-value" style="display:flex;align-items:center;gap:8px">';
    if (f.responsable_id) html += personAvatar(f.responsable_id, 24);
    html += '<span style="font-size:.88rem">' + escHtml(respName) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // KPI badges
    var fKpis = getLinkedKpisForFriction(f.id);
    if (fKpis.length > 0) {
      html += '<div style="margin:0 20px 12px">' + kpiBadges(fKpis) + '</div>';
    }

    // Expandable edit section
    if (expanded) {
      html += '<div class="cm-friction-detail">';
      html += renderFrictionDetail(f);
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderFrictionChecklist(f) {
    var rows = (f.resolution_checklist && f.resolution_checklist.length) ? f.resolution_checklist : [{ text: '', done: false }];
    var html = '<div class="cm-friction-field"><label>Checklist de resolución</label>';
    html += '<div class="cm-checklist-wrap" data-fid="' + escHtml(f.id) + '">';
    rows.forEach(function(row) {
      html += '<div class="cm-checklist-row" data-fid="' + escHtml(f.id) + '">';
      html += '<input type="checkbox" class="cm-checklist-done" ' + (row.done ? 'checked' : '') + '>';
      html += '<input type="text" class="cm-input cm-checklist-text" value="' + escHtml(row.text || '') + '" placeholder="Paso o criterio de cierre">';
      html += '</div>';
    });
    html += '<button type="button" class="cm-btn cm-btn-ghost cm-btn-sm cm-checklist-add" data-fid="' + escHtml(f.id) + '">+ Añadir paso</button>';
    html += '</div></div>';
    return html;
  }

  function renderFrictionDetail(f) {
    var html = '';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">';

    html += '<div class="cm-friction-field"><label>Fecha Limite</label>';
    html += '<input type="date" class="cm-input cm-detail-field" data-fid="' + escHtml(f.id) + '" data-field="deadline" value="' + escHtml(f.deadline || '') + '"></div>';

    html += '<div class="cm-friction-field"><label>Impacto</label>';
    html += '<select class="cm-select cm-detail-field" data-fid="' + escHtml(f.id) + '" data-field="impact" style="width:100%">';
    html += '<option value="high"' + (f.impact === 'high' ? ' selected' : '') + '>Alto</option>';
    html += '<option value="medium"' + (f.impact === 'medium' ? ' selected' : '') + '>Medio</option>';
    html += '<option value="low"' + (f.impact === 'low' ? ' selected' : '') + '>Bajo</option>';
    html += '</select></div>';

    html += '<div class="cm-friction-field"><label>Responsable</label>';
    html += personSelect(f.responsable_id, 'cm-ef-resp-' + f.id);
    html += '</div>';

    html += '</div>';

    html += '<div class="cm-friction-field"><label>Touchpoint (opcional)</label>';
    html += touchpointSelect(f.phase_id, f.touchpoint_id, 'cm-ef-tp-' + f.id);
    html += '<div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">Vincula la fricción al punto del mapa cuando aplique (misma fase).</div></div>';

    html += renderFrictionChecklist(f);

    html += '<div class="cm-friction-field"><label>Notas de Progreso</label>';
    html += '<textarea class="cm-textarea cm-detail-field" data-fid="' + escHtml(f.id) + '" data-field="notes" rows="3">' + escHtml(f.notes || '') + '</textarea></div>';

    html += '<div class="cm-modal-field"><label style="font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px">KPIs que impacta esta friccion</label>';
    var fLinkedKpis = getLinkedKpisForFriction(f.id);
    html += kpiCheckboxes(fLinkedKpis, 'cm-ef-' + f.id);
    html += '</div>';

    // Iniciativas vinculadas que la atienden
    html += renderFrictionInitiatives(f);

    // Action buttons
    html += '<div class="cm-detail-actions">';
    html += '<button class="cm-btn cm-btn-primary cm-save-friction" data-fid="' + escHtml(f.id) + '">Guardar</button>';
    html += '<div class="cm-detail-actions-right">';
    html += '<button class="cm-btn cm-btn-danger cm-btn-sm cm-delete-friction" data-fid="' + escHtml(f.id) + '" data-fname="' + escHtml(f.name) + '">Eliminar</button>';
    html += '</div></div>';

    // Comments section
    html += renderCommentsSection(f);

    return html;
  }

  function showLinkInitiativeToFrictionModal(frictionId, parentEl) {
    var unlinked = state.iniciativas.filter(function(ii) {
      var fids = ii.friction_ids || [];
      return fids.indexOf(frictionId) < 0 && fids.indexOf(String(frictionId)) < 0;
    });
    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal" style="max-width:520px">';
    html += '<div class="cm-modal-title">Vincular iniciativa existente</div>';
    html += '<div class="cm-modal-field" style="display:flex;align-items:center;gap:8px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 12px;margin-bottom:10px">';
    html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    html += '<input type="text" class="cm-input" id="cm-link-search" placeholder="Buscar por título, responsable, estado..." style="flex:1;border:none;background:transparent;outline:none;padding:0">';
    html += '</div>';
    html += '<div class="cm-modal-field"><label>Iniciativas disponibles (' + unlinked.length + ')</label>';
    html += '<div id="cm-link-list" style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:6px">';
    if (unlinked.length === 0) {
      html += '<div style="font-size:.8rem;color:var(--text-muted);font-style:italic;padding:10px">Todas las iniciativas ya están vinculadas o no hay iniciativas creadas.</div>';
    } else {
      unlinked.forEach(function(ii) {
        var resp = personName(ii.responsable_id) || 'Sin asignar';
        var searchBlob = ((ii.title||'') + ' ' + resp + ' ' + (ii.status||'') + ' ' + (ii.area||'')).toLowerCase();
        html += '<div class="cm-link-item" data-id="' + escHtml(ii.id) + '" data-title="' + escHtml(searchBlob) + '" style="padding:8px;border-radius:6px;cursor:pointer;font-size:.8rem">';
        html += '<div style="font-weight:600">' + escHtml(ii.title) + '</div>';
        html += '<div style="font-size:.7rem;color:var(--text-muted)">' + escHtml(resp) + ' · ' + (ii.progress||0) + '% · ' + escHtml(ii.status||'pending') + '</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
    html += '<div class="cm-modal-actions"><button class="cm-btn cm-btn-ghost" id="cm-link-cancel">Cerrar</button></div>';
    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    document.querySelector('#cm-link-cancel').addEventListener('click', closeModal);
    var search = document.querySelector('#cm-link-search');
    if (search) {
      search.addEventListener('input', function() {
        var q = this.value.toLowerCase();
        document.querySelectorAll('.cm-link-item').forEach(function(el2) {
          el2.style.display = el2.dataset.title.indexOf(q) >= 0 ? '' : 'none';
        });
      });
    }
    document.querySelectorAll('.cm-link-item').forEach(function(item) {
      item.addEventListener('mouseenter', function(){ this.style.background = '#F1F5F9'; });
      item.addEventListener('mouseleave', function(){ this.style.background = ''; });
      item.addEventListener('click', function() {
        var iniId = this.dataset.id;
        var ii = state.iniciativas.find(function(x){ return String(x.id) === String(iniId); });
        if (!ii) return;
        var newFids = (ii.friction_ids || []).slice();
        if (newFids.indexOf(frictionId) < 0) newFids.push(frictionId);
        apiPatch('iniciativas', iniId, { friction_ids: newFids }).then(function() {
          closeModal();
          toast('Iniciativa vinculada', 'success');
          return loadBootstrap().then(function() { renderTab(); render(); });
        }).catch(function(e) { toast(e.message || 'Error', 'error'); });
      });
    });
  }

  function renderFrictionInitiatives(f) {
    var linked = state.iniciativas.filter(function(ii) {
      var fids = ii.friction_ids || [];
      return fids.indexOf(f.id) >= 0 || fids.indexOf(String(f.id)) >= 0;
    });
    var avgProg = linked.length > 0 ? Math.round(linked.reduce(function(s,ii){ return s + (ii.progress||0); }, 0) / linked.length) : 0;
    var done = linked.filter(function(ii){ return ii.status === 'completed'; }).length;

    // Salud vs avance hint
    var hint = '';
    if (linked.length > 0 && avgProg >= 80 && (f.status === 'pending' || f.status === 'analysis')) {
      hint = '<div style="font-size:.74rem;color:#B45309;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:6px 10px;margin-bottom:10px">⚠️ Status de la fricción es "' + escHtml(f.status) + '" pero las iniciativas vinculadas están al ' + avgProg + '% — ¿revisar status?</div>';
    }

    var html = '<div class="cm-friction-initiatives" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border,#E2E8F0)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    html += '<label style="font-size:.78rem;font-weight:700;color:var(--text-primary)">Iniciativas que la atienden (' + done + '/' + linked.length + ')';
    if (linked.length > 0) html += ' · Avance ' + avgProg + '%';
    html += '</label>';
    html += '<div style="display:flex;gap:6px">';
    html += '<button class="cm-btn cm-btn-sm cm-friction-link-ini" data-fid="' + escHtml(f.id) + '" type="button">+ Vincular existente</button>';
    html += '<button class="cm-btn cm-btn-primary cm-btn-sm cm-friction-create-ini" data-fid="' + escHtml(f.id) + '" type="button">+ Crear iniciativa</button>';
    html += '</div>';
    html += '</div>';
    html += hint;

    if (linked.length === 0) {
      html += '<div style="font-size:.78rem;color:var(--text-muted);font-style:italic;padding:8px 0">Sin iniciativas vinculadas. Crea una para empezar a resolverla.</div>';
    } else {
      linked.forEach(function(ii) {
        var resp = personName(ii.responsable_id) || 'Sin asignar';
        var prog = ii.progress || 0;
        var color = prog >= 100 ? '#10B981' : (prog >= 50 ? '#6366F1' : (prog > 0 ? '#F59E0B' : '#94A3B8'));
        html += '<div style="display:grid;grid-template-columns:1fr 100px 110px 28px;gap:10px;align-items:center;padding:8px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:6px">';
        html += '<div><div style="font-weight:600;font-size:.82rem">' + escHtml(ii.title) + ' ' + statusBadge(ii.status||'pending') + '</div>';
        if (ii.target) html += '<div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">🎯 ' + escHtml(ii.target) + '</div>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:5px;background:#E2E8F0;border-radius:9999px;overflow:hidden"><div style="height:100%;width:' + prog + '%;background:' + color + '"></div></div><span style="font-size:.7rem;font-weight:700;color:' + color + '">' + prog + '%</span></div>';
        html += '<div style="font-size:.74rem;color:var(--text-secondary)">' + escHtml(resp) + '</div>';
        html += '<button class="cm-icon-btn cm-friction-edit-ini" data-id="' + escHtml(ii.id) + '" title="Editar" style="padding:2px 6px">&#9998;</button>';
        html += '</div>';
      });
    }
    html += '</div>';
    return html;
  }

  function renderCommentsSection(f) {
    var html = '<div class="cm-comments-section">';
    html += '<div class="cm-comments-title">Comentarios</div>';

    var frictionComments = state.comments.filter(function(c) {
      return c.entity_type === 'friction' && String(c.entity_id) === String(f.id);
    });

    if (frictionComments.length > 0) {
      frictionComments.forEach(function(c) {
        html += '<div class="cm-comment">';
        html += '<span class="cm-avatar cm-avatar-assigned" style="width:28px;height:28px;font-size:.62rem">' + escHtml(initials(c.author || 'U')) + '</span>';
        html += '<div class="cm-comment-body">';
        html += '<div class="cm-comment-header">';
        html += '<span class="cm-comment-author">' + escHtml(c.author || 'Usuario') + '</span>';
        html += '<span class="cm-comment-time">' + relativeTime(c.created_at) + '</span>';
        html += '<button class="cm-comment-delete" data-cid="' + c.id + '" title="Eliminar comentario">&#x2715;</button>';
        html += '</div>';
        html += '<div class="cm-comment-text">' + escHtml(c.text) + '</div>';
        if (c.link) {
          html += '<a class="cm-comment-link" href="' + escHtml(c.link) + '" target="_blank" rel="noopener">' + escHtml(c.link) + '</a>';
        }
        html += '</div></div>';
      });
    } else {
      html += '<div style="font-size:.8rem;color:var(--text-muted);margin-bottom:8px">Sin comentarios aun</div>';
    }

    // Add comment form
    html += '<div class="cm-comment-form" data-fid="' + escHtml(f.id) + '">';
    html += '<input type="text" class="cm-input cm-comment-author-input" placeholder="Tu nombre" value="" style="max-width:120px">';
    html += '<input type="text" class="cm-input cm-comment-text-input" placeholder="Escribe un comentario..." style="flex:2">';
    html += '<button class="cm-btn cm-btn-primary cm-btn-sm cm-add-comment" data-fid="' + escHtml(f.id) + '">Enviar</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  /* ── Friction Event Binding ── */
  function bindFrictionEvents(el) {
    // Search
    var searchEl = el.querySelector('#cm-f-search');
    if (searchEl) {
      var searchTimeout = null;
      searchEl.addEventListener('input', function() {
        var val = this.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
          frictionSearch = val;
          renderFricciones(el);
        }, 250);
      });
    }

    // Filter pill clicks
    el.querySelectorAll('.cm-pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        var filterVal = this.dataset.filter;
        var filterType = this.dataset.type;
        if (filterType === 'reset') {
          frictionFilterImpact = 'all';
          frictionFilterStatus = 'all';
        } else if (filterType === 'impact') {
          frictionFilterStatus = 'all';
          frictionFilterImpact = frictionFilterImpact === filterVal ? 'all' : filterVal;
        } else if (filterType === 'status') {
          frictionFilterImpact = 'all';
          frictionFilterStatus = frictionFilterStatus === filterVal ? 'all' : filterVal;
        }
        renderFricciones(el);
      });
    });

    // Phase filter
    var phaseEl = el.querySelector('#cm-f-phase');
    if (phaseEl) phaseEl.addEventListener('change', function() { frictionFilterPhase = this.value; renderFricciones(el); });

    // New friction button
    var newBtn = el.querySelector('#cm-new-friction');
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        showCreateFrictionModal();
      });
    }

    // Friction → create initiative
    el.querySelectorAll('.cm-friction-create-ini').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        showInitiativeModal(null, el, { friction_ids: [this.dataset.fid] });
      });
    });

    // Friction → link existing initiative
    el.querySelectorAll('.cm-friction-link-ini').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        showLinkInitiativeToFrictionModal(this.dataset.fid, el);
      });
    });

    // Friction initiative card → edit
    el.querySelectorAll('.cm-friction-edit-ini').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        showInitiativeModal(this.dataset.id, el);
      });
    });

    // Edit toggle (pencil icon)
    el.querySelectorAll('.cm-friction-edit-toggle').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var fid = this.dataset.fid;
        expandedFrictions[fid] = !expandedFrictions[fid];
        renderFricciones(el);
      });
    });

    // Status select
    el.querySelectorAll('.cm-f-status-select').forEach(function(sel) {
      sel.addEventListener('click', function(e) { e.stopPropagation(); });
      sel.addEventListener('change', function() {
        var fid = this.dataset.fid;
        var newStatus = this.value;
        apiPatch('frictions', fid, { status: newStatus }).then(function() {
          state.frictions.forEach(function(f) { if (String(f.id) === String(fid)) f.status = newStatus; });
          toast('Estado actualizado', 'success');
          loadDashboard().then(function() { renderFricciones(el); });
        }).catch(function() { toast('Error al actualizar estado', 'error'); });
      });
    });

    // Checklist add row
    el.querySelectorAll('.cm-checklist-add').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var fid = this.dataset.fid;
        var wrap = el.querySelector('.cm-checklist-wrap[data-fid="' + fid + '"]');
        if (!wrap) return;
        var div = document.createElement('div');
        div.className = 'cm-checklist-row';
        div.setAttribute('data-fid', fid);
        div.innerHTML = '<input type="checkbox" class="cm-checklist-done"> <input type="text" class="cm-input cm-checklist-text" placeholder="Paso o criterio">';
        wrap.insertBefore(div, this);
      });
    });

    // Save friction
    el.querySelectorAll('.cm-save-friction').forEach(function(btn) {
      btn.addEventListener('click', function() {
        saveFrictionDetail(this.dataset.fid, el);
      });
    });

    // Delete friction
    el.querySelectorAll('.cm-delete-friction').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var fid = this.dataset.fid;
        var fname = this.dataset.fname;
        showDeleteConfirm(fid, fname, el);
      });
    });

    // Add comment
    el.querySelectorAll('.cm-add-comment').forEach(function(btn) {
      btn.addEventListener('click', function() {
        addComment(this.dataset.fid, el);
      });
    });

    // Delete comment
    el.querySelectorAll('.cm-comment-delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteComment(this.dataset.cid, el);
      });
    });
  }

  function saveFrictionDetail(fid, parentEl) {
    var card = parentEl.querySelector('.cm-friction-card[data-fid="' + fid + '"]');
    if (!card) return;

    var body = {};
    card.querySelectorAll('.cm-detail-field').forEach(function(input) {
      if (input.dataset.fid !== fid) return;
      var field = input.dataset.field;
      var val = input.tagName === 'TEXTAREA' ? input.value : input.tagName === 'SELECT' ? input.value : input.value;
      body[field] = val || null;
    });
    // Read responsable_id from person select
    var respSelect = card.querySelector('#cm-ef-resp-' + fid);
    if (respSelect) {
      body.responsable_id = parseInt(respSelect.value) || null;
    }

    var tpSel = card.querySelector('#cm-ef-tp-' + fid);
    if (tpSel) {
      body.touchpoint_id = tpSel.value ? parseInt(tpSel.value, 10) : null;
    }

    var checklist = [];
    card.querySelectorAll('.cm-checklist-wrap[data-fid="' + fid + '"] .cm-checklist-row').forEach(function(row) {
      var txt = row.querySelector('.cm-checklist-text');
      var doneEl = row.querySelector('.cm-checklist-done');
      var t = txt ? txt.value.trim() : '';
      if (!t && !(doneEl && doneEl.checked)) return;
      if (t) checklist.push({ text: t, done: !!(doneEl && doneEl.checked) });
    });
    body.resolution_checklist = checklist;

    // Collect selected KPI checkboxes for this friction
    var selectedKpis = [];
    card.querySelectorAll('.cm-ef-' + fid + '-kpi-cb:checked').forEach(function(cb) {
      selectedKpis.push(cb.value);
    });

    apiPatch('frictions', fid, body).then(function(updated) {
      state.frictions = state.frictions.map(function(f) {
        if (String(f.id) === String(fid)) {
          Object.keys(body).forEach(function(k) { f[k] = body[k]; });
          if (updated) {
            f.is_overdue = updated.is_overdue;
            f.days_remaining = updated.days_remaining;
            f.completed_at = updated.completed_at;
            if (updated.resolution_checklist) f.resolution_checklist = updated.resolution_checklist;
          }
        }
        return f;
      });
      // Save KPI links via PUT
      return fetch('/api/comercial/frictions/' + fid + '/kpis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedKpis)
      }).then(function(r) {
        if (!r.ok) throw new Error('kpis');
        return r.json();
      }).then(function(newLinks) {
        state.kpi_frictions = state.kpi_frictions.filter(function(lk) { return String(lk.friction_id) !== String(fid); });
        (newLinks || []).forEach(function(lk) { state.kpi_frictions.push(lk); });
      });
    }).then(function() {
      toast('Friccion actualizada', 'success');
      loadDashboard().then(function() { renderFricciones(parentEl); });
    }).catch(function() {
      toast('Error al guardar cambios', 'error');
    });
  }

  /* ── Create Friction Modal ── */
  function showCreateFrictionModal() {
    var suggestedId = nextFrictionId();

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal">';
    html += '<div class="cm-modal-title">Nueva Friccion</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';

    html += '<div class="cm-modal-field"><label>ID</label>';
    html += '<input type="text" class="cm-input" id="cm-nf-id" value="' + escHtml(suggestedId) + '"></div>';

    html += '<div class="cm-modal-field"><label>Fase</label>';
    html += '<select class="cm-select" id="cm-nf-phase" style="width:100%">';
    state.phases.slice().sort(function(a,b){ return (a.order||0)-(b.order||0); }).forEach(function(ph) {
      html += '<option value="' + escHtml(ph.id) + '">' + escHtml(ph.name) + '</option>';
    });
    html += '</select></div>';

    html += '</div>';

    html += '<div class="cm-modal-field"><label>Nombre <span class="required">*</span></label>';
    html += '<input type="text" class="cm-input" id="cm-nf-name" placeholder="Describe la friccion..."></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">';

    html += '<div class="cm-modal-field"><label>Impacto</label>';
    html += '<select class="cm-select" id="cm-nf-impact" style="width:100%">';
    html += '<option value="high">Alto</option>';
    html += '<option value="medium">Medio</option>';
    html += '<option value="low">Bajo</option>';
    html += '</select></div>';

    html += '<div class="cm-modal-field"><label>Responsable</label>';
    html += personSelect(null, 'cm-nf-resp');
    html += '</div>';

    html += '<div class="cm-modal-field"><label>Fecha Limite</label>';
    html += '<input type="date" class="cm-input" id="cm-nf-deadline"></div>';

    html += '</div>';

    html += '<div class="cm-modal-field"><label>Touchpoint (opcional)</label>';
    html += '<select class="cm-select" id="cm-nf-tp" style="width:100%"></select>';
    html += '<div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">Vincula al punto del mapa si la fricción aplica a un touchpoint concreto.</div></div>';

    html += '<div class="cm-modal-field"><label>Solucion</label>';
    html += '<textarea class="cm-textarea" id="cm-nf-solution" rows="2" placeholder="Solucion propuesta..."></textarea></div>';

    html += '<div class="cm-modal-field"><label>Resultado Esperado</label>';
    html += '<textarea class="cm-textarea" id="cm-nf-outcome" rows="2" placeholder="Que resultado esperas..."></textarea></div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-nf-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-nf-create">Crear Friccion</button>';
    html += '</div>';

    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    var backdrop = document.querySelector('#cm-modal-backdrop');
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) closeModal();
    });

    document.querySelector('#cm-nf-cancel').addEventListener('click', closeModal);

    function fillNfTouchpoints(phaseId) {
      var sel = document.querySelector('#cm-nf-tp');
      if (!sel) return;
      var prev = sel.value;
      sel.innerHTML = '<option value="">Sin touchpoint</option>';
      state.touchpoints.filter(function(t) { return String(t.phase_id) === String(phaseId); }).forEach(function(t) {
        var opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = '#' + t.id + ' ' + t.name;
        sel.appendChild(opt);
      });
      if (prev) sel.value = prev;
    }
    fillNfTouchpoints(document.querySelector('#cm-nf-phase').value);
    document.querySelector('#cm-nf-phase').addEventListener('change', function() {
      fillNfTouchpoints(this.value);
    });

    document.querySelector('#cm-nf-create').addEventListener('click', function() {
      var name = document.querySelector('#cm-nf-name').value.trim();
      if (!name) {
        toast('El nombre es requerido', 'error');
        return;
      }

      var data = {
        id: document.querySelector('#cm-nf-id').value.trim() || suggestedId,
        phase_id: document.querySelector('#cm-nf-phase').value,
        name: name,
        impact: document.querySelector('#cm-nf-impact').value,
        responsable_id: parseInt(document.querySelector('#cm-nf-resp').value) || null,
        deadline: document.querySelector('#cm-nf-deadline').value || null,
        solution: document.querySelector('#cm-nf-solution').value.trim(),
        expected_outcome: document.querySelector('#cm-nf-outcome').value.trim(),
        status: 'pending',
        notes: '',
        priority: 0,
        touchpoint_id: (function() {
          var el = document.querySelector('#cm-nf-tp');
          return el && el.value ? parseInt(el.value, 10) : null;
        })(),
        resolution_checklist: []
      };

      apiPost('frictions', data).then(function(created) {
        closeModal();
        toast('Friccion "' + name + '" creada', 'success');
        return refreshAll().then(function() {
          var main = container.querySelector('#cm-main');
          if (main) renderFricciones(main);
        });
      }).catch(function() {
        toast('Error al crear friccion', 'error');
      });
    });
  }

  /* ── Delete Confirm Modal ── */
  function showDeleteConfirm(fid, fname, parentEl) {
    showDeleteConfirmGeneric(
      'Eliminar Friccion',
      'Eliminar friccion <strong>' + escHtml(fid) + '</strong>: "' + escHtml(fname) + '"?<br><br>Esta accion no se puede deshacer.',
      function() {
        apiDelete('frictions', fid).then(function() {
          closeModal();
          delete expandedFrictions[fid];
          toast('Friccion eliminada', 'success');
          return refreshAll().then(function() {
            renderFricciones(parentEl);
          });
        }).catch(function() {
          toast('Error al eliminar friccion', 'error');
        });
      }
    );
  }

  function showDeleteConfirmGeneric(title, message, onConfirm) {
    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal" style="max-width:420px">';
    html += '<div class="cm-modal-title">' + escHtml(title) + '</div>';
    html += '<div class="cm-confirm-text">' + message + '</div>';
    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-del-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-danger" id="cm-del-confirm">Eliminar</button>';
    html += '</div>';
    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    var backdrop = document.querySelector('#cm-modal-backdrop');
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) closeModal();
    });

    document.querySelector('#cm-del-cancel').addEventListener('click', closeModal);
    document.querySelector('#cm-del-confirm').addEventListener('click', function() {
      closeModal();
      onConfirm();
    });
  }

  function closeModal() {
    var backdrop = document.querySelector('#cm-modal-backdrop');
    if (backdrop) backdrop.remove();
  }

  /* ── Comments ── */
  function addComment(fid, parentEl) {
    var form = parentEl.querySelector('.cm-comment-form[data-fid="' + fid + '"]');
    if (!form) return;
    var authorInput = form.querySelector('.cm-comment-author-input');
    var textInput = form.querySelector('.cm-comment-text-input');
    var author = authorInput ? authorInput.value.trim() : '';
    var text = textInput ? textInput.value.trim() : '';

    if (!text) { toast('Escribe un comentario', 'error'); return; }
    if (!author) author = 'Usuario';

    apiPost('comments', {
      entity_type: 'friction',
      entity_id: fid,
      text: text,
      author: author,
      link: null
    }).then(function(created) {
      state.comments.push(created);
      toast('Comentario agregado', 'success');
      renderFricciones(parentEl);
    }).catch(function() {
      toast('Error al agregar comentario', 'error');
    });
  }

  function deleteComment(cid, parentEl) {
    apiDelete('comments', cid).then(function() {
      state.comments = state.comments.filter(function(c) { return String(c.id) !== String(cid); });
      toast('Comentario eliminado', 'success');
      renderFricciones(parentEl);
    }).catch(function() {
      toast('Error al eliminar comentario', 'error');
    });
  }

  /* ──────────────────────────────────────────────────
     TAB 4: LINEA DE TIEMPO
     ────────────────────────────────────────────────── */
  function renderTimeline(el) {
    var html = '';

    // Header
    html += '<div style="margin-bottom:24px">';
    html += '<div class="cm-section-title" style="margin-bottom:4px">Roadmap 30/60/90 dias</div>';
    html += '<div style="font-size:.8rem;color:var(--text-muted,#94A3B8)">Clic en el circulo para cambiar estado</div>';
    html += '</div>';

    // Group frictions by deadline bands
    var groups = {};
    bandOrder.forEach(function(b) { groups[b] = []; });
    state.frictions.forEach(function(f) {
      var band = deadlineBand(f.deadline);
      groups[band].push(f);
    });

    // Render timeline groups
    bandOrder.forEach(function(band) {
      if (groups[band].length === 0) return;
      var color = bandColors[band] || '#94A3B8';
      var isCollapsed = !!collapsedBands[band];

      html += '<div class="cm-timeline-group">';
      html += '<div class="cm-timeline-band-header" data-band="' + band + '" style="cursor:pointer;border-bottom-color:' + color + '">';
      html += '<span class="cm-timeline-band-dot" style="background:' + color + '"></span>';
      html += '<span class="cm-timeline-band-label">' + bandLabels[band] + '</span>';
      html += '<span class="cm-timeline-band-count">' + groups[band].length + '</span>';
      html += '<span class="cm-timeline-band-line"></span>';
      html += '<span style="font-size:.72rem;color:var(--text-muted);transition:transform .15s ease;' + (isCollapsed ? 'transform:rotate(-90deg)' : '') + '">&#9660;</span>';
      html += '</div>';

      if (!isCollapsed) {
        groups[band].forEach(function(f) {
          var pm2 = phaseMap();
          var phase = pm2[f.phase_id] || {};
          var circleClass = f.status || 'pending';
          var circleIcon = '&#9675;';
          if (f.status === 'completed') circleIcon = '&#10003;';
          else if (f.status === 'in_progress') circleIcon = '&#9654;';
          else if (f.status === 'analysis') circleIcon = '&#128269;';
          else if (f.status === 'validation') circleIcon = '&#10004;';

          html += '<div class="cm-timeline-item" data-fid="' + escHtml(f.id) + '">';
          html += '<div class="cm-timeline-circle ' + circleClass + '" data-fid="' + escHtml(f.id) + '" title="Cambiar estado">' + circleIcon + '</div>';
          html += '<div class="cm-timeline-content">';
          html += '<div class="cm-timeline-top">';
          html += '<span class="cm-timeline-fid">' + escHtml(f.id) + '</span>';
          if (f.responsable_id) html += personAvatar(f.responsable_id, 22);
          html += '<span class="cm-timeline-fname">' + escHtml(f.name) + '</span>';
          if (phase.name) {
            html += '<span class="cm-badge cm-badge-primary" style="font-size:.64rem">' + escHtml(phase.name) + '</span>';
          }
          var tlRespName = personName(f.responsable_id) || f.responsable;
          if (tlRespName) {
            html += '<span style="font-size:.72rem;color:var(--text-secondary)">' + escHtml(tlRespName) + '</span>';
          }
          html += '</div>';
          html += '<div class="cm-timeline-bottom">';
          html += '<div class="cm-timeline-solution">' + escHtml(f.solution || '') + '</div>';
          html += '<div class="cm-timeline-right">';
          if (f.deadline) {
            html += '<div class="cm-timeline-date">' + fmtDate(f.deadline) + '</div>';
          }
          if (f.expected_outcome) {
            html += '<div class="cm-timeline-outcome">' + escHtml(f.expected_outcome) + '</div>';
          }
          html += '</div>';
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
      }

      html += '</div>';
    });

    // 4 Metricas Maestras
    html += '<div style="margin-top:32px"></div>';
    html += '<div class="cm-section-title">4 Metricas Maestras</div>';
    html += '<div class="cm-metrics-grid" id="cm-tl-metrics">';
    var kpis = state.kpis || [];
    if (kpis.length === 0) {
      html += '<div class="cm-empty">No hay KPIs configurados</div>';
    } else {
      var kpiColors = ['#4C6EF5', '#22C55E', '#F59E0B', '#EF4444'];
      kpis.forEach(function(k, idx) {
        var kColor = kpiColors[idx % kpiColors.length];
        html += '<div class="cm-metric-card" data-kpi-id="' + escHtml(k.id) + '">';
        html += '<div class="cm-metric-icon">' + (k.icon || '&#128200;') + '</div>';
        html += '<div class="cm-metric-info">';
        html += '<div class="cm-metric-name" style="color:' + kColor + '">' + escHtml(k.name) + '</div>';
        if (k.question) {
          html += '<div class="cm-metric-question">' + escHtml(k.question) + '</div>';
        }
        var tlOwner = personName(k.owner_id);
        var tlPm = phaseMap();
        var tlKpiPhase = tlPm[k.phase_id] || {};
        if (tlOwner || tlKpiPhase.name) {
          html += '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">';
          if (tlOwner) {
            html += personAvatar(k.owner_id, 18);
            html += '<span style="font-size:.72rem;color:var(--text-secondary)">' + escHtml(tlOwner) + '</span>';
          }
          if (tlKpiPhase.name) html += '<span class="cm-badge cm-badge-primary" style="font-size:.62rem">' + escHtml(tlKpiPhase.name) + '</span>';
          var tlLinked = state.kpi_frictions.filter(function(kf) { return kf.kpi_id == k.id; });
          if (tlLinked.length > 0) html += '<span class="cm-badge cm-badge-gray" style="font-size:.62rem">' + tlLinked.length + ' fricciones</span>';
          html += '</div>';
        }
        html += '</div>';
        html += '<div class="cm-metric-inputs">';
        html += '<div><label>Actual</label><input class="cm-input cm-metric-input" data-kpi-id="' + escHtml(k.id) + '" data-field="current_value" value="' + escHtml(String(k.current_value || '')) + '" style="width:80px"></div>';
        html += '<div><label>Meta</label><input class="cm-input cm-metric-input" data-kpi-id="' + escHtml(k.id) + '" data-field="target_value" value="' + escHtml(String(k.target_value || '')) + '" style="width:80px"></div>';
        html += '</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    // 3 Puntos de Apalancamiento
    html += '<div class="cm-section-title">3 Puntos de Apalancamiento</div>';
    html += '<div class="cm-leverage-grid">';

    var leveragePoints = [
      { icon: '&#9889;', name: 'Velocidad Estrategica', desc: 'Responde rapido Y con direccion. Meta: <1 hora.', frictions: 'F1, F2, F11', color: '#4C6EF5' },
      { icon: '&#128269;', name: 'Diagnostico con Relevancia', desc: 'Entiende el problema mejor que el cliente.', frictions: 'F4, F8, F9', color: '#22C55E' },
      { icon: '&#128260;', name: 'Persistencia Inteligente', desc: 'Seguimiento multicanal con valor.', frictions: 'F2, F5, F10', color: '#F59E0B' }
    ];

    leveragePoints.forEach(function(lp) {
      html += '<div class="cm-leverage-card">';
      html += '<div class="cm-leverage-accent" style="background:' + lp.color + '"></div>';
      html += '<div class="cm-leverage-content">';
      html += '<div class="cm-leverage-title">' + lp.icon + ' <span style="color:' + lp.color + '">' + escHtml(lp.name) + '</span></div>';
      html += '<div class="cm-leverage-desc">' + escHtml(lp.desc) + '</div>';
      html += '<div class="cm-leverage-frictions">Fricciones: ' + escHtml(lp.frictions) + '</div>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';

    el.innerHTML = html;
    bindTimelineEvents(el);
  }

  function bindTimelineEvents(el) {
    // Band header collapse/expand
    el.querySelectorAll('.cm-timeline-band-header').forEach(function(hdr) {
      hdr.addEventListener('click', function() {
        var band = this.dataset.band;
        collapsedBands[band] = !collapsedBands[band];
        renderTimeline(el);
      });
    });

    // Circle click: cycle status
    el.querySelectorAll('.cm-timeline-circle').forEach(function(circle) {
      circle.addEventListener('click', function(e) {
        e.stopPropagation();
        var fid = this.dataset.fid;
        var friction = state.frictions.find(function(f) { return String(f.id) === String(fid); });
        if (!friction) return;

        var currentStatus = friction.status || 'pending';
        var cycle = ['pending', 'analysis', 'in_progress', 'validation', 'completed'];
        var idx = cycle.indexOf(currentStatus);
        if (idx < 0) idx = 0;
        var nextStatus = cycle[(idx + 1) % cycle.length];

        apiPatch('frictions', fid, { status: nextStatus }).then(function(updated) {
          state.frictions.forEach(function(f) {
            if (String(f.id) === String(fid)) {
              f.status = nextStatus;
              if (updated) {
                f.is_overdue = updated.is_overdue;
                f.completed_at = updated.completed_at;
              }
            }
          });
          toast('Estado: ' + statusLabel(nextStatus), 'success');
          loadDashboard().then(function() { renderTimeline(el); });
        }).catch(function() {
          toast('Error al actualizar estado', 'error');
        });
      });
    });

    // KPI metric inputs
    el.querySelectorAll('.cm-metric-input').forEach(function(input) {
      input.addEventListener('focus', function() { this.select(); });
      input.addEventListener('blur', function() {
        var kpiId = this.dataset.kpiId;
        var field = this.dataset.field;
        var val = this.value.trim();
        var body = {};
        body[field] = val;
        apiPatch('kpis', kpiId, body).then(function() {
          toast('KPI actualizado', 'success');
        }).catch(function() {
          toast('Error al actualizar KPI', 'error');
        });
      });
    });
  }

  /* ──────────────────────────────────────────────────
     TAB 5: EQUIPO
     ────────────────────────────────────────────────── */
  function renderEquipo(el) {
    var html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">';
    html += '<div class="cm-section-title">Equipo</div>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-new-person">+ Nueva Persona</button>';
    html += '</div>';

    html += '<div class="cm-people-grid">';
    state.people.forEach(function(p) {
      var assigned = state.frictions.filter(function(f) { return f.responsable_id == p.id; });
      var active = assigned.filter(function(f) { return f.status !== 'completed'; }).length;
      var completed = assigned.filter(function(f) { return f.status === 'completed'; }).length;
      var overdue = assigned.filter(function(f) { return f.is_overdue; }).length;

      html += '<div class="cm-person-card" data-person-id="' + p.id + '">';
      html += '<div class="cm-person-header">';
      html += personAvatar(p.id, 40);
      html += '<div style="flex:1"><div class="cm-person-name">' + escHtml(p.name) + '</div>';
      html += '<div class="cm-person-role">' + escHtml(p.role) + ' &middot; ' + escHtml(p.area) + '</div></div>';
      html += '<button class="cm-icon-btn cm-edit-person" data-person-id="' + p.id + '" title="Editar" style="align-self:flex-start">&#9998;</button>';
      html += '</div>';

      html += '<div class="cm-person-stats">';
      html += '<div class="cm-person-stat"><div class="sv" style="color:var(--primary)">' + active + '</div><div class="sl">Activas</div></div>';
      html += '<div class="cm-person-stat"><div class="sv" style="color:var(--success)">' + completed + '</div><div class="sl">Completadas</div></div>';
      html += '<div class="cm-person-stat"><div class="sv" style="color:var(--warning)">' + assigned.length + '</div><div class="sl">Asignadas</div></div>';
      html += '</div>';

      if (overdue > 0) {
        html += '<div style="margin-top:10px;text-align:center"><span class="cm-badge cm-badge-red">' + overdue + ' vencida' + (overdue > 1 ? 's' : '') + '</span></div>';
      }

      html += '</div>';
    });
    html += '</div>';

    if (state.people.length === 0) {
      html += '<div class="cm-empty"><div class="cm-empty-icon">&#128101;</div>No hay personas registradas</div>';
    }

    el.innerHTML = html;

    el.querySelectorAll('.cm-person-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var pid = parseInt(this.dataset.personId);
        renderPersonDetail(el, pid);
      });
    });

    el.querySelectorAll('.cm-edit-person').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        showEditPersonModal(parseInt(this.dataset.personId), el);
      });
    });

    var newBtn = el.querySelector('#cm-new-person');
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        showCreatePersonModal(el);
      });
    }
  }

  function renderPersonDetail(el, personId) {
    var person = state.people.find(function(p) { return p.id === personId; });
    if (!person) return;

    var assigned = state.frictions.filter(function(f) { return f.responsable_id == personId; });
    var touchpoints = state.touchpoints.filter(function(t) { return t.responsable_id == personId; });
    var pm = phaseMap();

    var html = '';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-back-people" style="margin-bottom:16px">&larr; Volver al equipo</button>';

    html += '<div class="cm-person-header" style="margin-bottom:24px">';
    html += personAvatar(personId, 48);
    html += '<div><div class="cm-person-name" style="font-size:1.2rem">' + escHtml(person.name) + '</div>';
    html += '<div class="cm-person-role">' + escHtml(person.role) + ' &middot; ' + escHtml(person.area) + '</div></div>';
    html += '</div>';

    if (assigned.length > 0) {
      html += '<div class="cm-person-section">';
      html += '<div class="cm-person-section-title">Fricciones Asignadas (' + assigned.length + ')</div>';
      assigned.sort(function(a,b) {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
      assigned.forEach(function(f) {
        var phase = pm[f.phase_id] || {};
        var days = daysDiff(f.deadline);
        var deadlineText = f.deadline ? fmtDate(f.deadline) : 'Sin fecha';
        if (days !== null && days < 0) deadlineText += ' (vencida)';
        else if (days !== null) deadlineText += ' (' + days + 'd)';

        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">';
        html += '<span style="font-size:.78rem;color:var(--text-muted);min-width:28px">' + escHtml(f.id) + '</span>';
        html += impactBadge(f.impact);
        html += statusBadge(f.status);
        html += '<span style="font-size:.88rem;font-weight:600;flex:1">' + escHtml(f.name) + '</span>';
        if (phase.name) html += '<span class="cm-badge cm-badge-primary">' + escHtml(phase.name) + '</span>';
        html += '<span style="font-size:.78rem;color:' + (days !== null && days < 0 ? 'var(--danger)' : 'var(--text-muted)') + '">' + deadlineText + '</span>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="cm-empty" style="padding:20px">Sin fricciones asignadas</div>';
    }

    if (touchpoints.length > 0) {
      html += '<div class="cm-person-section">';
      html += '<div class="cm-person-section-title">Touchpoints Responsable (' + touchpoints.length + ')</div>';
      touchpoints.forEach(function(t) {
        var phase = pm[t.phase_id] || {};
        html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">';
        html += '<span style="font-size:.78rem;color:var(--text-muted)">#' + t.id + '</span>';
        html += '<span style="font-size:.85rem;flex:1">' + escHtml(t.name) + '</span>';
        if (phase.name) html += '<span class="cm-badge cm-badge-primary" style="font-size:.66rem">' + escHtml(phase.name) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;

    el.querySelector('#cm-back-people').addEventListener('click', function() {
      renderEquipo(el);
    });
  }

  function showCreatePersonModal(parentEl) {
    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal">';
    html += '<div class="cm-modal-title">Nueva Persona</div>';

    html += '<div class="cm-modal-field"><label>Nombre <span style="color:var(--danger)">*</span></label>';
    html += '<input type="text" class="cm-input" id="cm-np-name" placeholder="Nombre completo"></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Rol</label>';
    html += '<input type="text" class="cm-input" id="cm-np-role" placeholder="Ej: Director Comercial"></div>';
    html += '<div class="cm-modal-field"><label>Area</label>';
    html += '<input type="text" class="cm-input" id="cm-np-area" placeholder="Ej: Comercial"></div>';
    html += '</div>';

    html += '<div class="cm-modal-field"><label>Email</label>';
    html += '<input type="email" class="cm-input" id="cm-np-email" placeholder="correo@empresa.com"></div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-np-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-np-create">Crear Persona</button>';
    html += '</div>';

    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
    document.querySelector('#cm-np-cancel').addEventListener('click', closeModal);
    document.querySelector('#cm-np-create').addEventListener('click', function() {
      var name = document.querySelector('#cm-np-name').value.trim();
      if (!name) { toast('El nombre es requerido', 'error'); return; }

      var data = {
        name: name,
        role: document.querySelector('#cm-np-role').value.trim(),
        area: document.querySelector('#cm-np-area').value.trim(),
        email: document.querySelector('#cm-np-email').value.trim() || null
      };

      apiPost('people', data).then(function() {
        closeModal();
        toast('Persona creada', 'success');
        return refreshAll().then(function() {
          var main = container.querySelector('#cm-main');
          if (main) renderEquipo(main);
        });
      }).catch(function() { toast('Error al crear persona', 'error'); });
    });
  }

  function showEditPersonModal(personId, parentEl) {
    var p = state.people.find(function(pp) { return pp.id === personId; });
    if (!p) return;

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal">';
    html += '<div class="cm-modal-title">Editar Persona</div>';

    html += '<div class="cm-modal-field"><label>Nombre</label>';
    html += '<input type="text" class="cm-input" id="cm-ep-name" value="' + escHtml(p.name) + '"></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Rol</label>';
    html += '<input type="text" class="cm-input" id="cm-ep-role" value="' + escHtml(p.role || '') + '"></div>';
    html += '<div class="cm-modal-field"><label>Area</label>';
    html += '<input type="text" class="cm-input" id="cm-ep-area" value="' + escHtml(p.area || '') + '"></div>';
    html += '</div>';

    html += '<div class="cm-modal-field"><label>Email</label>';
    html += '<input type="email" class="cm-input" id="cm-ep-email" value="' + escHtml(p.email || '') + '"></div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-ep-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-ep-save">Guardar</button>';
    html += '</div>';
    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    document.querySelector('#cm-ep-cancel').addEventListener('click', closeModal);
    document.querySelector('#cm-ep-save').addEventListener('click', function() {
      var data = {
        name: document.querySelector('#cm-ep-name').value.trim(),
        role: document.querySelector('#cm-ep-role').value.trim(),
        area: document.querySelector('#cm-ep-area').value.trim(),
        email: document.querySelector('#cm-ep-email').value.trim() || null,
      };
      if (!data.name) { toast('El nombre es requerido', 'error'); return; }
      apiPatch('people', personId, data).then(function() {
        state.people = state.people.map(function(pp) { return pp.id === personId ? Object.assign(pp, data) : pp; });
        closeModal();
        toast('Persona actualizada', 'success');
        renderEquipo(parentEl);
      }).catch(function() { toast('Error al actualizar', 'error'); });
    });
  }

  /* ──────────────────────────────────────────────────
     TAB 6: KPIs SEGUIMIENTO
     ────────────────────────────────────────────────── */

  function frequencyLabel(f) {
    return { daily: 'Diaria', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }[f] || f;
  }
  function frequencyDays(f) {
    return { daily: 1, weekly: 7, biweekly: 14, monthly: 30 }[f] || 30;
  }

  function buildKpiRows() {
    var rows = [];
    var pm = phaseMap();
    var now = new Date();
    state.kpi_touchpoints.forEach(function(link) {
      var kpi = state.kpis.find(function(k) { return k.id === link.kpi_id; });
      var tp = state.touchpoints.find(function(t) { return String(t.id) === String(link.touchpoint_id); });
      if (!kpi || !tp) return;
      var phase = pm[tp.phase_id] || {};
      var isCrit = link.is_critical;
      var effTarget = link.target_value_local != null ? link.target_value_local : kpi.target_value;
      var effResp = link.responsable_id || tp.responsable_id || kpi.owner_id;

      var lastCapture = null;
      var lastValue = null;
      state.tp_kpi_history.forEach(function(h) {
        if (String(h.touchpoint_id) === String(link.touchpoint_id) && h.kpi_id === link.kpi_id) {
          var d = new Date(h.recorded_at);
          if (!lastCapture || d > lastCapture) { lastCapture = d; lastValue = h.value; }
        }
      });

      var captureStatus = 'no_data';
      var daysUntilDue = null;
      if (isCrit) {
        var freqD = frequencyDays(kpi.frequency);
        var grace = kpi.grace_days != null ? kpi.grace_days : 3;
        if (lastCapture) {
          var diff = (now - lastCapture) / 86400000;
          if (diff <= freqD) captureStatus = 'on_time';
          else if (diff <= freqD + grace) captureStatus = 'due';
          else captureStatus = 'overdue';
          daysUntilDue = Math.round(freqD - diff);
        } else {
          captureStatus = 'overdue';
        }
      }

      var currentVal = lastValue != null ? lastValue : kpi.current_value;
      var pctTarget = (effTarget && currentVal != null) ? Math.round((currentVal / effTarget) * 100 * 10) / 10 : null;

      rows.push({
        link_id: link.id,
        touchpoint_id: link.touchpoint_id,
        touchpoint_name: tp.name,
        phase_id: tp.phase_id,
        phase_name: phase.name || tp.phase_id,
        phase_color: phase.color || '#4C6EF5',
        kpi_id: link.kpi_id,
        kpi_name: kpi.name,
        unit: kpi.unit || '',
        frequency: kpi.frequency || 'monthly',
        current_value: currentVal,
        target_value: effTarget,
        pct_target: pctTarget,
        capture_status: captureStatus,
        days_until_due: daysUntilDue,
        last_capture: lastCapture,
        responsable_id: effResp,
        is_critical: isCrit,
      });
    });
    return rows;
  }

  function captureStatusBadge(s) {
    if (s === 'on_time') return '<span class="cm-badge cm-badge-green">Al d\u00eda</span>';
    if (s === 'due') return '<span class="cm-badge cm-badge-yellow">Por vencer</span>';
    if (s === 'overdue') return '<span class="cm-badge cm-badge-red">Vencida</span>';
    return '<span class="cm-badge cm-badge-gray">Sin datos</span>';
  }

  function pctBar(pct) {
    if (pct == null) return '<span style="color:var(--text-muted)">—</span>';
    var color = pct >= 90 ? 'var(--success,#22C55E)' : pct >= 70 ? 'var(--warning,#F59E0B)' : 'var(--danger,#EF4444)';
    return '<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:var(--bg-hover,#F0F2F5);border-radius:9999px;overflow:hidden;min-width:60px"><div style="height:100%;width:' + Math.min(pct, 100) + '%;background:' + color + ';border-radius:9999px"></div></div><span style="font-size:.78rem;font-weight:600;color:' + color + '">' + pct + '%</span></div>';
  }

  function getSemaphoreClass(value, kpi) {
    if (value == null) return 'cm-sem-none';
    var sg = kpi.threshold_super_green;
    var g = kpi.threshold_green;
    var y = kpi.threshold_yellow;
    var dir = kpi.direction || 'higher';

    // If thresholds are configured
    if (sg != null && g != null && y != null) {
      if (dir === 'higher') {
        if (value >= sg) return 'cm-sem-super-green';
        if (value >= g) return 'cm-sem-green';
        if (value >= y) return 'cm-sem-yellow';
        return 'cm-sem-red';
      } else {
        // Lower is better (e.g., CAC)
        if (value <= sg) return 'cm-sem-super-green';
        if (value <= g) return 'cm-sem-green';
        if (value <= y) return 'cm-sem-yellow';
        return 'cm-sem-red';
      }
    }

    // Fallback: use target_value
    if (kpi.target_value != null && kpi.target_value > 0) {
      var pct = (value / kpi.target_value) * 100;
      if (dir === 'lower') pct = (kpi.target_value / value) * 100;
      if (pct >= 100) return 'cm-sem-super-green';
      if (pct >= 70) return 'cm-sem-green';
      if (pct >= 40) return 'cm-sem-yellow';
      return 'cm-sem-red';
    }

    return 'cm-sem-green'; // no thresholds, no target, just show green
  }

  function formatKpiValue(val, unit) {
    if (val == null) return '-';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    if (unit === '%') return val.toFixed(1) + '%';
    return String(val);
  }

  function renderKpiThresholdConfig(k) {
    var units = [
      {v: '', l: 'Sin unidad'}, {v: '%', l: 'Porcentaje (%)'}, {v: '#', l: 'Numero (#)'},
      {v: 'MXN', l: 'Pesos (MXN)'}, {v: 'USD', l: 'Dolares (USD)'}, {v: 'dias', l: 'Dias'},
      {v: 'hrs', l: 'Horas'}, {v: 'leads', l: 'Leads'}, {v: 'pts', l: 'Puntos/Score'},
    ];

    var html = '<div class="cm-kpi-expand">';
    html += '<div style="font-size:.88rem;font-weight:700;margin-bottom:14px">Configurar Semaforo \u2014 ' + escHtml(k.name) + '</div>';

    // Unit + Direction + Frequency row
    html += '<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px;flex-wrap:wrap">';
    html += '<div><label style="font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px">Unidad</label>';
    html += '<select class="cm-select" id="cm-ks-unit-' + escHtml(k.id) + '" style="min-width:130px">';
    units.forEach(function(u) {
      html += '<option value="' + u.v + '"' + (k.unit === u.v ? ' selected' : '') + '>' + u.l + '</option>';
    });
    html += '</select></div>';
    html += '<div><label style="font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px">Direccion</label>';
    html += '<select class="cm-select" id="cm-ks-dir-' + escHtml(k.id) + '">';
    html += '<option value="higher"' + (k.direction !== 'lower' ? ' selected' : '') + '>Mayor es mejor</option>';
    html += '<option value="lower"' + (k.direction === 'lower' ? ' selected' : '') + '>Menor es mejor</option>';
    html += '</select></div>';
    html += '<div><label style="font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px">Frecuencia</label>';
    html += '<select class="cm-select" id="cm-ks-freq-' + escHtml(k.id) + '">';
    ['monthly','biweekly','weekly','daily'].forEach(function(f) {
      var lab = f === 'monthly' ? 'Mensual' : f === 'biweekly' ? 'Quincenal' : f === 'weekly' ? 'Semanal' : 'Diario';
      html += '<option value="' + f + '"' + (k.frequency === f ? ' selected' : '') + '>' + lab + '</option>';
    });
    html += '</select></div>';
    html += '</div>';

    // 4 threshold cards with value + description
    html += '<div class="cm-threshold-grid-v2">';

    var levels = [
      {key: 'super_green', color: '#059669', label: 'Super Verde (\u2265)', descField: 'desc_super_green'},
      {key: 'green', color: '#22C55E', label: 'Verde (\u2265)', descField: 'desc_green'},
      {key: 'yellow', color: '#F59E0B', label: 'Amarillo (\u2265)', descField: 'desc_yellow'},
      {key: 'red', color: '#EF4444', label: 'Rojo', descField: 'desc_red'},
    ];

    levels.forEach(function(lv) {
      var threshVal = k['threshold_' + lv.key];
      var descVal = k[lv.descField] || '';

      html += '<div class="cm-threshold-card" style="border-left:4px solid ' + lv.color + '">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">';
      html += '<span style="width:10px;height:10px;border-radius:50%;background:' + lv.color + ';display:inline-block"></span>';
      html += '<span style="font-size:.78rem;font-weight:700;color:' + lv.color + '">' + lv.label + '</span>';
      html += '</div>';

      if (lv.key !== 'red') {
        html += '<input type="number" class="cm-threshold-input" data-kpi-id="' + escHtml(k.id) + '" data-field="threshold_' + lv.key + '" value="' + (threshVal != null ? threshVal : '') + '" step="any" placeholder="Valor">';
      } else {
        html += '<div style="padding:6px 0;font-size:.8rem;color:var(--text-muted)">&lt; Valor de Amarillo</div>';
      }

      html += '<textarea class="cm-threshold-desc" data-kpi-id="' + escHtml(k.id) + '" data-field="' + lv.descField + '" placeholder="Describe que significa este nivel..." rows="2">' + escHtml(descVal) + '</textarea>';
      html += '</div>';
    });

    html += '</div>';

    html += '<div style="display:flex;justify-content:flex-end;margin-top:12px">';
    html += '<button class="cm-btn cm-btn-primary cm-btn-sm cm-ks-save-thresholds" data-kpi-id="' + escHtml(k.id) + '">Guardar Configuracion</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderKpisSeguimiento(el) {
    var year = new Date().getFullYear();
    var currentMonth = new Date().getMonth();
    var currentWeek = getWeekNumber(new Date());

    // Filter KPIs based on tracked toggle
    var kpisToShow = state.kpis.filter(function(k) {
      if (!kpiBoardShowAll && !k.is_tracked) return false;
      return true;
    });

    // Apply phase/responsable/search filters
    var filtered = kpisToShow.filter(function(k) {
      if (kpiSegFilter.phase !== 'all' && k.phase_id !== kpiSegFilter.phase) return false;
      if (kpiSegFilter.responsable !== 'all' && String(k.owner_id) !== String(kpiSegFilter.responsable)) return false;
      if (kpiSegFilter.search) {
        var hay = (k.name + ' ' + (k.phase_id || '') + ' ' + personName(k.owner_id)).toLowerCase();
        if (hay.indexOf(kpiSegFilter.search.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var trackedCount = state.kpis.filter(function(k) { return k.is_tracked; }).length;
    var totalCount = state.kpis.length;

    // Build column headers based on view
    var columns = [];
    if (kpiBoardView === 'weekly') {
      var startWeek = Math.max(1, currentWeek - 4);
      for (var w = startWeek; w < startWeek + 12 && w <= 52; w++) {
        columns.push({
          key: year + '-W' + String(w).padStart(2, '0'),
          label: 'S' + w,
          isCurrent: w === currentWeek
        });
      }
    } else {
      var monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      for (var m = 0; m < 12; m++) {
        columns.push({
          key: year + '-' + String(m + 1).padStart(2, '0'),
          label: monthNames[m],
          isCurrent: m === currentMonth
        });
      }
    }

    // Build history lookup
    var historyByKpi = {};
    state.kpi_history.forEach(function(h) {
      if (!historyByKpi[h.kpi_id]) historyByKpi[h.kpi_id] = {};
      historyByKpi[h.kpi_id][h.period] = h;
    });

    // Summary cards
    var kpisWithData = filtered.filter(function(k) { return k.current_value != null; }).length;
    var kpisOnTarget = filtered.filter(function(k) {
      if (k.current_value == null || k.target_value == null || k.target_value === 0) return false;
      var pct = (k.current_value / k.target_value) * 100;
      if (k.direction === 'lower') pct = (k.target_value / k.current_value) * 100;
      return pct >= 70;
    }).length;
    var kpisAtRisk = filtered.filter(function(k) {
      if (k.current_value == null || k.target_value == null || k.target_value === 0) return false;
      var pct = (k.current_value / k.target_value) * 100;
      if (k.direction === 'lower') pct = (k.target_value / k.current_value) * 100;
      return pct < 40;
    }).length;

    var html = '';
    html += '<div class="cm-kpi-grid">';
    html += '<div class="cm-kpi-card"><div class="label">KPIs en board</div><div class="value">' + filtered.length + '</div><div class="sub">' + (!kpiBoardShowAll ? 'Marcados para seguimiento' : 'Todos los KPIs') + '</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">Con datos</div><div class="value success">' + kpisWithData + '</div><div class="sub">Tienen valor actual</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">En meta (\u226570%)</div><div class="value primary">' + kpisOnTarget + '</div><div class="sub">Cumplimiento aceptable</div></div>';
    html += '<div class="cm-kpi-card"><div class="label">En riesgo (&lt;40%)</div><div class="value' + (kpisAtRisk > 0 ? ' danger' : '') + '">' + kpisAtRisk + '</div><div class="sub">Bajo meta</div></div>';
    html += '</div>';

    // Header with toggles
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    html += '<div class="cm-section-title" style="margin:0">KPI Board \u2014 Seguimiento ' + year + '</div>';
    html += '<button class="cm-btn cm-btn-primary cm-btn-sm" id="cm-new-kpi">+ Crear KPI</button>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;align-items:center">';

    // Tracked toggle
    html += '<div class="cm-view-toggle">';
    html += '<button class="cm-view-btn' + (!kpiBoardShowAll ? ' active' : '') + '" id="cm-kb-tracked">\u2605 Medidos (' + trackedCount + ')</button>';
    html += '<button class="cm-view-btn' + (kpiBoardShowAll ? ' active' : '') + '" id="cm-kb-all">Todos (' + totalCount + ')</button>';
    html += '</div>';

    // View toggle
    html += '<div class="cm-view-toggle">';
    html += '<button class="cm-view-btn' + (kpiBoardView === 'monthly' ? ' active' : '') + '" id="cm-kb-monthly">Mensual</button>';
    html += '<button class="cm-view-btn' + (kpiBoardView === 'weekly' ? ' active' : '') + '" id="cm-kb-weekly">Semanal</button>';
    html += '</div>';

    html += '</div></div>';

    // Filters
    html += '<div class="cm-filters">';
    html += '<select class="cm-select" id="cm-ks-phase"><option value="all">Todas las fases</option>';
    state.phases.slice().sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).forEach(function(ph) {
      html += '<option value="' + escHtml(ph.id) + '"' + (kpiSegFilter.phase === ph.id ? ' selected' : '') + '>' + escHtml(ph.name) + '</option>';
    });
    html += '</select>';
    html += '<select class="cm-select" id="cm-ks-resp"><option value="all">Todos los responsables</option>';
    state.people.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (String(kpiSegFilter.responsable) === String(p.id) ? ' selected' : '') + '>' + escHtml(p.name) + '</option>';
    });
    html += '</select>';
    html += '<input type="text" class="cm-search" id="cm-ks-search" placeholder="Buscar KPI..." value="' + escHtml(kpiSegFilter.search) + '">';
    html += '</div>';

    // The board
    if (filtered.length === 0) {
      html += '<div class="cm-empty"><div class="cm-empty-icon">&#128200;</div>No hay KPIs' + (!kpiBoardShowAll ? ' marcados para seguimiento. Usa "Todos" para ver y marcar KPIs.' : ' que coincidan con los filtros.') + '</div>';
      el.innerHTML = html;
      bindKpiBoardToggles(el);
      bindKpiBoardEvents(el);
      return;
    }

    html += '<div class="cm-kpi-board">';
    html += '<div class="cm-kpi-grid-wrap">';
    html += '<table class="cm-kpi-board-table">';

    // Header
    html += '<thead><tr>';
    html += '<th class="cm-kpi-th-name">KPI</th>';
    columns.forEach(function(col) {
      html += '<th class="' + (col.isCurrent ? 'cm-current-col' : '') + '">' + col.label + '</th>';
    });
    html += '</tr></thead>';

    // Rows
    html += '<tbody>';
    filtered.forEach(function(k) {
      var history = historyByKpi[k.id] || {};
      var expanded = expandedKpis[k.id];
      var pm = phaseMap();
      var phase = pm[k.phase_id] || {};

      // Current semaphore
      var latestVal = k.current_value;
      var semClass = getSemaphoreClass(latestVal, k);

      html += '<tr class="cm-kpi-row" data-kpi-id="' + escHtml(k.id) + '">';

      // Name cell
      html += '<td class="cm-kpi-td-name">';
      html += '<div style="display:flex;align-items:center;gap:6px">';
      // Star toggle
      html += '<button class="cm-kpi-star' + (k.is_tracked ? ' active' : '') + '" data-kpi-star="' + escHtml(k.id) + '" title="' + (k.is_tracked ? 'Dejar de medir' : 'Marcar para medir') + '">\u2605</button>';
      // Semaphore dot + name
      html += '<span class="cm-sem-dot-sm ' + semClass + '"></span>';
      html += '<span class="cm-kpi-row-name" data-kpi-expand="' + escHtml(k.id) + '">' + escHtml(k.name) + '</span>';
      html += '</div>';
      // Meta row
      html += '<div class="cm-kpi-row-meta">';
      if (k.owner_id) html += personAvatar(k.owner_id, 14) + ' ';
      html += '<span>' + escHtml(personName(k.owner_id) || '') + '</span>';
      if (phase.name) html += ' <span class="cm-kpi-phase-pill" style="background:' + escHtml(phase.color || '#4C6EF5') + '15;color:' + escHtml(phase.color || '#4C6EF5') + '">' + escHtml(phase.name) + '</span>';
      html += '</div>';
      // Target row
      if (k.target_value != null) {
        html += '<div class="cm-kpi-row-target">Meta: ' + formatKpiValue(k.target_value, k.unit) + '</div>';
      }
      html += '</td>';

      // Period cells
      columns.forEach(function(col) {
        var entry = history[col.key];
        var cellClass = col.isCurrent ? ' cm-current-col' : '';

        html += '<td class="cm-kpi-td-val' + cellClass + '">';
        if (entry) {
          var valSem = getSemaphoreClass(entry.value, k);
          html += '<div class="cm-kpi-cell has-value" data-kpi-id="' + escHtml(k.id) + '" data-period="' + escHtml(col.key) + '">';
          html += '<span class="cm-sem ' + valSem + '"><span class="cm-sem-dot"></span>' + formatKpiValue(entry.value, k.unit) + '</span>';
          html += '</div>';
        } else {
          html += '<div class="cm-kpi-cell empty" data-kpi-id="' + escHtml(k.id) + '" data-period="' + escHtml(col.key) + '">';
          html += '<span class="cm-cell-plus">+</span>';
          html += '</div>';
        }
        html += '</td>';
      });

      html += '</tr>';

      // Expanded threshold config row
      if (expanded) {
        html += '<tr class="cm-kpi-expand-row"><td colspan="' + (columns.length + 1) + '" style="padding:0">';
        html += renderKpiThresholdConfig(k);
        html += '</td></tr>';
      }
    });

    html += '</tbody></table></div></div>';

    el.innerHTML = html;
    bindKpiBoardToggles(el);
    bindKpiBoardEvents(el);
  }

  function bindKpiBoardToggles(el) {
    var trackedBtn = el.querySelector('#cm-kb-tracked');
    var allBtn = el.querySelector('#cm-kb-all');
    if (trackedBtn) trackedBtn.addEventListener('click', function() { kpiBoardShowAll = false; renderKpisSeguimiento(el); });
    if (allBtn) allBtn.addEventListener('click', function() { kpiBoardShowAll = true; renderKpisSeguimiento(el); });

    var monthlyBtn = el.querySelector('#cm-kb-monthly');
    var weeklyBtn = el.querySelector('#cm-kb-weekly');
    if (monthlyBtn) monthlyBtn.addEventListener('click', function() { kpiBoardView = 'monthly'; renderKpisSeguimiento(el); });
    if (weeklyBtn) weeklyBtn.addEventListener('click', function() { kpiBoardView = 'weekly'; renderKpisSeguimiento(el); });

    var newKpiBtn = el.querySelector('#cm-new-kpi');
    if (newKpiBtn) newKpiBtn.addEventListener('click', function() { showCreateKpiModal(el); });
  }

  function showCreateKpiModal(parentEl) {
    var units = [
      {v: '', l: 'Sin unidad'}, {v: '%', l: 'Porcentaje (%)'}, {v: '#', l: 'Numero (#)'},
      {v: 'MXN', l: 'Pesos (MXN)'}, {v: 'USD', l: 'Dolares (USD)'}, {v: 'dias', l: 'Dias'},
      {v: 'hrs', l: 'Horas'}, {v: 'leads', l: 'Leads'}, {v: 'pts', l: 'Puntos/Score'},
    ];

    var html = '<div class="cm-modal-backdrop" id="cm-modal-backdrop">';
    html += '<div class="cm-modal" style="max-width:550px">';
    html += '<div class="cm-modal-title">Crear KPI</div>';

    html += '<div class="cm-modal-field"><label>Nombre <span style="color:var(--danger)">*</span></label>';
    html += '<input type="text" class="cm-input" id="cm-nk-name" placeholder="Ej: Tasa de conversion, Leads por semana..."></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Unidad</label>';
    html += '<select class="cm-select" id="cm-nk-unit" style="width:100%">';
    units.forEach(function(u) { html += '<option value="' + u.v + '">' + u.l + '</option>'; });
    html += '</select></div>';
    html += '<div class="cm-modal-field"><label>Fase (opcional)</label>';
    html += '<select class="cm-select" id="cm-nk-phase" style="width:100%">';
    html += '<option value="">Sin fase</option>';
    state.phases.forEach(function(ph) { html += '<option value="' + escHtml(ph.id) + '">' + escHtml(ph.name) + '</option>'; });
    html += '</select></div>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Responsable</label>';
    html += personSelect(null, 'cm-nk-owner');
    html += '</div>';
    html += '<div class="cm-modal-field"><label>Frecuencia</label>';
    html += '<select class="cm-select" id="cm-nk-freq" style="width:100%">';
    html += '<option value="monthly">Mensual</option><option value="biweekly">Quincenal</option>';
    html += '<option value="weekly">Semanal</option><option value="daily">Diario</option>';
    html += '</select></div>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html += '<div class="cm-modal-field"><label>Meta (target)</label>';
    html += '<input type="number" class="cm-input" id="cm-nk-target" placeholder="Valor objetivo" step="any"></div>';
    html += '<div class="cm-modal-field"><label>Direccion</label>';
    html += '<select class="cm-select" id="cm-nk-dir" style="width:100%">';
    html += '<option value="higher">Mayor es mejor</option><option value="lower">Menor es mejor</option>';
    html += '</select></div>';
    html += '</div>';

    html += '<div class="cm-modal-field"><label>Pregunta orientadora</label>';
    html += '<input type="text" class="cm-input" id="cm-nk-question" placeholder="Ej: Cuantos prospectos se convierten en clientes?"></div>';

    html += '<div style="display:flex;align-items:center;gap:8px;margin:10px 0">';
    html += '<input type="checkbox" id="cm-nk-tracked" checked>';
    html += '<label for="cm-nk-tracked" style="font-size:.82rem;cursor:pointer">Marcar para seguimiento activo</label>';
    html += '</div>';

    html += '<div class="cm-modal-actions">';
    html += '<button class="cm-btn cm-btn-ghost" id="cm-nk-cancel">Cancelar</button>';
    html += '<button class="cm-btn cm-btn-primary" id="cm-nk-create">Crear KPI</button>';
    html += '</div>';
    html += '</div></div>';

    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv.firstChild);

    document.querySelector('#cm-modal-backdrop').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    document.querySelector('#cm-nk-cancel').addEventListener('click', closeModal);
    document.querySelector('#cm-nk-create').addEventListener('click', function() {
      var name = document.querySelector('#cm-nk-name').value.trim();
      if (!name) { toast('El nombre es requerido', 'error'); return; }
      var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      var targetVal = document.querySelector('#cm-nk-target').value.trim();
      var data = {
        id: slug,
        name: name,
        unit: document.querySelector('#cm-nk-unit').value,
        phase_id: document.querySelector('#cm-nk-phase').value || null,
        owner_id: parseInt(document.querySelector('#cm-nk-owner').value) || null,
        question: document.querySelector('#cm-nk-question').value.trim(),
      };
      apiPost('kpis', data).then(function(created) {
        // Set additional fields via PATCH
        var patchData = {
          frequency: document.querySelector('#cm-nk-freq').value,
          direction: document.querySelector('#cm-nk-dir').value,
          is_tracked: document.querySelector('#cm-nk-tracked').checked,
        };
        if (targetVal) patchData.target_value = parseFloat(targetVal);
        return apiPatch('kpis', created.id, patchData).then(function(updated) { return updated; });
      }).then(function(final) {
        state.kpis.push(final);
        closeModal();
        toast('KPI "' + name + '" creado', 'success');
        renderKpisSeguimiento(parentEl);
      }).catch(function() { toast('Error al crear KPI', 'error'); });
    });
  }

  function bindKpiBoardEvents(el) {
    // Filters
    var phaseEl = el.querySelector('#cm-ks-phase');
    var respEl = el.querySelector('#cm-ks-resp');
    var searchEl = el.querySelector('#cm-ks-search');
    if (phaseEl) phaseEl.addEventListener('change', function() { kpiSegFilter.phase = this.value; renderKpisSeguimiento(el); });
    if (respEl) respEl.addEventListener('change', function() { kpiSegFilter.responsable = this.value; renderKpisSeguimiento(el); });
    if (searchEl) {
      var to = null;
      searchEl.addEventListener('input', function() {
        var v = this.value;
        clearTimeout(to);
        to = setTimeout(function() { kpiSegFilter.search = v; renderKpisSeguimiento(el); }, 250);
      });
    }

    // Star toggle
    el.querySelectorAll('.cm-kpi-star').forEach(function(star) {
      star.addEventListener('click', function(e) {
        e.stopPropagation();
        var kid = this.dataset.kpiStar;
        var kpi = state.kpis.find(function(k) { return k.id === kid; });
        if (!kpi) return;
        var newVal = !kpi.is_tracked;
        apiPatch('kpis', kid, { is_tracked: newVal }).then(function() {
          kpi.is_tracked = newVal;
          toast(newVal ? 'KPI marcado para seguimiento' : 'KPI desmarcado', 'success');
          renderKpisSeguimiento(el);
        }).catch(function() { toast('Error', 'error'); });
      });
    });

    // KPI name click -> expand/collapse threshold config
    el.querySelectorAll('.cm-kpi-row-name').forEach(function(name) {
      name.addEventListener('click', function() {
        var kid = this.dataset.kpiExpand;
        expandedKpis[kid] = !expandedKpis[kid];
        renderKpisSeguimiento(el);
      });
    });

    // Cell click -> inline input for value capture
    el.querySelectorAll('.cm-kpi-cell').forEach(function(cell) {
      cell.addEventListener('click', function() {
        var kid = this.dataset.kpiId;
        var period = this.dataset.period;
        var existing = this.querySelector('.cm-kpi-cell-input');
        if (existing) return;
        this.innerHTML = '<input type="number" class="cm-kpi-cell-input" value="" placeholder="Valor" step="any">';
        var inp = this.querySelector('.cm-kpi-cell-input');
        inp.focus();
        inp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            submitKpiValue(kid, period, parseFloat(this.value), el);
          }
          if (e.key === 'Escape') {
            renderKpisSeguimiento(el);
          }
        });
        inp.addEventListener('blur', function() {
          if (this.value.trim()) {
            submitKpiValue(kid, period, parseFloat(this.value), el);
          } else {
            renderKpisSeguimiento(el);
          }
        });
      });
    });

    // Save thresholds button
    el.querySelectorAll('.cm-ks-save-thresholds').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var kid = this.dataset.kpiId;
        var data = {};
        // Threshold values
        el.querySelectorAll('.cm-threshold-input[data-kpi-id="' + kid + '"]').forEach(function(inp) {
          var val = inp.value.trim();
          data[inp.dataset.field] = val !== '' ? parseFloat(val) : null;
        });
        // Descriptions
        el.querySelectorAll('.cm-threshold-desc[data-kpi-id="' + kid + '"]').forEach(function(ta) {
          data[ta.dataset.field] = ta.value.trim();
        });
        // Unit, direction, frequency
        var unitEl = el.querySelector('#cm-ks-unit-' + kid);
        if (unitEl) data.unit = unitEl.value;
        data.direction = el.querySelector('#cm-ks-dir-' + kid).value;
        data.frequency = el.querySelector('#cm-ks-freq-' + kid).value;

        apiPatch('kpis', kid, data).then(function(updated) {
          state.kpis = state.kpis.map(function(k) { return k.id === kid ? Object.assign(k, data) : k; });
          toast('Semaforo configurado', 'success');
          renderKpisSeguimiento(el);
        }).catch(function() { toast('Error al guardar', 'error'); });
      });
    });
  }

  function submitKpiValue(kpiId, period, value, parentEl) {
    if (isNaN(value)) { renderKpisSeguimiento(parentEl); return; }
    fetch('/api/comercial/kpis/' + encodeURIComponent(kpiId) + '/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: value, period: period })
    }).then(function(r) {
      if (!r.ok) throw new Error('err');
      return r.json();
    }).then(function(entry) {
      // Add to local history (replace if same period exists)
      state.kpi_history = state.kpi_history.filter(function(h) {
        return !(h.kpi_id === kpiId && h.period === period);
      });
      state.kpi_history.push(entry);
      // Update current_value on the KPI
      state.kpis = state.kpis.map(function(k) { return k.id === kpiId ? Object.assign(k, { current_value: value }) : k; });
      toast('Valor registrado', 'success');
      renderKpisSeguimiento(parentEl);
    }).catch(function() { toast('Error al registrar', 'error'); });
  }

  /* ── Public API ── */
  return {
    init: function(el) {
      container = el;
      state = { phases: [], touchpoints: [], frictions: [], trust_pillars: [], kpis: [], activity_log: [], comments: [], people: [], kpi_frictions: [], kpi_touchpoints: [], tp_kpi_history: [], kpi_history: [], canvas_layout: [], canvas_notes: [], touchpoint_flows: [], iniciativas: [], dashboard: null };
      activeTab = 'dashboard';
      frictionFilterImpact = 'all';
      frictionFilterStatus = 'all';
      frictionFilterPhase = 'all';
      frictionSearch = '';
      expandedFrictions = {};
      expandedKpis = {};
      pendingPhaseClick = null;
      selectedPhase = 'atraccion';
      collapsedBands = {};
      kpiBoardView = 'monthly';
      kpiBoardShowAll = false;
      kpiSegFilter = { phase: 'all', responsable: 'all', status: 'all', search: '' };
      renderShell();
      loadAll();
    },
    destroy: function() {
      closeModal();
      removeStyles();
      container = null;
      state = { phases: [], touchpoints: [], frictions: [], trust_pillars: [], kpis: [], activity_log: [], comments: [], people: [], kpi_frictions: [], kpi_touchpoints: [], tp_kpi_history: [], kpi_history: [], canvas_layout: [], canvas_notes: [], touchpoint_flows: [], iniciativas: [], dashboard: null };
      selectedPhase = 'atraccion';
      collapsedBands = {};
      expandedKpis = {};
      kpiBoardView = 'monthly';
      kpiBoardShowAll = false;
      kpiSegFilter = { phase: 'all', responsable: 'all', status: 'all', search: '' };
    }
  };
})();
