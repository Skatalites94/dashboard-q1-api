/* ── Comercial Module (Arquitectura Comercial) ── */
window.ComercialModule = (function() {
  var container = null;
  var state = {
    phases: [],
    touchpoints: [],
    frictions: [],
    trust_pillars: [],
    kpis: [],
    activity_log: [],
    comments: [],
    people: [],
    kpi_frictions: [],
    kpi_touchpoints: [],
    tp_kpi_history: [],
    kpi_history: [],
    dashboard: null
  };
  var activeTab = 'dashboard';
  var kpiSegFilter = { phase: 'all', responsable: 'all', status: 'all', search: '' };
  var expandedKpis = {};
  var frictionFilterImpact = 'all';
  var frictionFilterStatus = 'all';
  var frictionFilterPhase = 'all';
  var frictionSearch = '';
  var expandedFrictions = {};
  var pendingPhaseClick = null;
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
      .cm-table{width:100%;border-collapse:collapse;font-size:.82rem}
      .cm-table th{background:#F8FAFC;padding:10px 14px;text-align:left;font-weight:600;color:var(--text-muted,#94A3B8);text-transform:uppercase;font-size:.7rem;letter-spacing:.5px;position:sticky;top:0}
      .cm-table td{padding:9px 14px;border-bottom:1px solid var(--border,#E2E8F0);color:var(--text-primary,#1E293B)}
      .cm-table tr:last-child td{border-bottom:none}
      .cm-table tr:hover td{background:var(--bg-hover,#F0F2F5)}

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

  function apiPatch(resource, id, data) {
    return fetch('/api/comercial/' + resource + '/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (!r.ok) throw new Error('Error ' + r.status);
      return r.json();
    });
  }

  function apiPost(resource, data) {
    return fetch('/api/comercial/' + resource + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (!r.ok) throw new Error('Error ' + r.status);
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
      state.kpis = data.kpis || [];
      state.activity_log = data.activity_log || [];
      state.comments = data.comments || [];
      state.people = data.people || [];
      state.kpi_frictions = data.kpi_frictions || [];
      state.kpi_touchpoints = data.kpi_touchpoints || [];
      state.tp_kpi_history = data.tp_kpi_history || [];
      state.kpi_history = data.kpi_history || [];
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
    var fBadge = overdueCount > 0 ? '<span class="cm-tab-badge cm-tab-badge-red">(' + overdueCount + ' vencidas)</span>' : '';
    html += tabBtn('fricciones', 'Fricciones &amp; Tareas', fBadge);
    html += tabBtn('timeline', 'Linea de Tiempo', '');
    html += tabBtn('equipo', 'Equipo', '');
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
    else if (activeTab === 'fricciones') renderFricciones(main);
    else if (activeTab === 'timeline') renderTimeline(main);
    else if (activeTab === 'equipo') renderEquipo(main);
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
        html += '<div class="ph-desc">' + escHtml(phObj.description) + ' &mdash; ' + phaseTps.length + ' touchpoints</div>';
      }
      html += '</div>';
      if (!isAll) {
        html += '<button class="cm-btn cm-btn-primary cm-btn-sm cm-new-tp-btn" data-phase-id="' + escHtml(phObj.id) + '">+ Nuevo Touchpoint</button>';
      }
      html += '</div>';

      // Touchpoints Table
      if (phaseTps.length > 0) {
        html += '<div class="cm-table-wrap" style="margin-bottom:24px"><table class="cm-table">';
        html += '<thead><tr><th style="width:40px">#</th><th>Touchpoint</th><th>Canal</th><th>Responsable</th><th>KPI</th><th>Friccion</th>';
        if (!isAll) html += '<th style="width:80px;text-align:center">Acciones</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        phaseTps.forEach(function(tp, idx) {
          var hasFriction = tp.has_friction || false;
          var frictionText = tp.friction_text || '';
          var respName = personName(tp.responsable_id) || tp.responsable || '';
          html += '<tr data-tp-id="' + escHtml(tp.id) + '"' + (hasFriction ? ' style="border-left:4px solid var(--warning)"' : '') + '>';
          html += '<td>' + tp.id + '</td>';
          html += '<td style="font-weight:600">' + escHtml(tp.name) + '</td>';
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
          if (!isAll) {
            html += '<td style="text-align:center">';
            html += '<button class="cm-icon-btn cm-edit-tp" data-tp-id="' + escHtml(tp.id) + '" title="Editar">&#9998;</button>';
            html += '<button class="cm-icon-btn danger cm-delete-tp" data-tp-id="' + escHtml(tp.id) + '" title="Eliminar">&#128465;</button>';
            html += '</td>';
          }
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
      if (actions.length > 0) {
        html += '<div style="font-size:.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px">Iniciativas</div>';
        html += '<ul style="margin:0;padding-left:16px;font-size:.8rem;line-height:1.6;color:var(--text-secondary)">';
        actions.forEach(function(a) { html += '<li>' + escHtml(a) + '</li>'; });
        html += '</ul>';
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
    html += '<div class="cm-modal-field"><label>Iniciativas (una por linea)</label>';
    var actionsText = '';
    if (p.actions) {
      try { actionsText = JSON.parse(p.actions).join('\\n'); } catch(e) { actionsText = p.actions; }
    }
    html += '<textarea class="cm-textarea" id="cm-ep-actions" rows="4">' + escHtml(actionsText) + '</textarea></div>';
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
      var actionsArr = document.querySelector('#cm-ep-actions').value.split('\\n').filter(function(l) { return l.trim(); });
      var data = {
        current_state: document.querySelector('#cm-ep-current').value.trim(),
        target_state: document.querySelector('#cm-ep-target').value.trim(),
        actions: JSON.stringify(actionsArr),
      };
      apiPatch('trust-pillars', pillarId, data).then(function(updated) {
        closeModal();
        state.trust_pillars.forEach(function(pp) {
          if (pp.id === pillarId) {
            pp.current_state = data.current_state;
            pp.target_state = data.target_state;
            pp.actions = data.actions;
          }
        });
        toast('Pilar actualizado', 'success');
        renderProceso(parentEl);
      }).catch(function() { toast('Error', 'error'); });
    });
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
      html += '<div><div class="cm-person-name">' + escHtml(p.name) + '</div>';
      html += '<div class="cm-person-role">' + escHtml(p.role) + ' &middot; ' + escHtml(p.area) + '</div></div>';
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
    html += '<div class="cm-section-title" style="margin:0">KPI Board \u2014 Seguimiento ' + year + '</div>';
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
      state = { phases: [], touchpoints: [], frictions: [], trust_pillars: [], kpis: [], activity_log: [], comments: [], people: [], kpi_frictions: [], kpi_touchpoints: [], tp_kpi_history: [], kpi_history: [], dashboard: null };
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
      state = { phases: [], touchpoints: [], frictions: [], trust_pillars: [], kpis: [], activity_log: [], comments: [], people: [], kpi_frictions: [], kpi_touchpoints: [], tp_kpi_history: [], kpi_history: [], dashboard: null };
      selectedPhase = 'atraccion';
      collapsedBands = {};
      expandedKpis = {};
      kpiBoardView = 'monthly';
      kpiBoardShowAll = false;
      kpiSegFilter = { phase: 'all', responsable: 'all', status: 'all', search: '' };
    }
  };
})();
