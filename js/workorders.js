'use strict';
/*
 * workorders.js — Work Order List + Work Order Detail widgets
 * Public: WorkOrders.openWorkOrderList, openWorkOrder, openNewWorkOrder
 */

const WorkOrders = (() => {

  /* ── Mock Data ─────────────────────────────────────────────── */

  const _WO_MOCK = [
    { workOrderId: 'WO-0001', clientName: 'John & Mary Smith',  address: '1824 Millbrook Dr, Nashville',  workOrderType: 'Repair',       workOrderStatus: 'Open',   assignedTo: 'Mike Johnson', dateScheduled: '2026-04-25T09:00', dateStarted: '',              dateCompleted: '', notes: 'Client mentioned water damage near kitchen window.' },
    { workOrderId: 'WO-0002', clientName: 'Robert Johnson',      address: '456 Elm Ave, Franklin',         workOrderType: 'Service Call', workOrderStatus: 'Open',   assignedTo: 'Dave Wilson',  dateScheduled: '2026-04-26T13:00', dateStarted: '',              dateCompleted: '', notes: '' },
    { workOrderId: 'WO-0003', clientName: 'Patricia & Tom Ward', address: '892 Crestview Ln, Brentwood',   workOrderType: 'Installation', workOrderStatus: 'Open',   assignedTo: 'Mike Johnson', dateScheduled: '2026-04-28T07:30', dateStarted: '',              dateCompleted: '', notes: '' },
    { workOrderId: 'WO-0004', clientName: 'David Chen',          address: '3301 Highland Ave, Nashville',  workOrderType: 'Inspection',   workOrderStatus: 'Closed', assignedTo: 'Dave Wilson',  dateScheduled: '2026-04-18T10:00', dateStarted: '2026-04-18T10:15', dateCompleted: '2026-04-18T11:30', notes: 'Completed. Follow-up estimate requested.' },
    { workOrderId: 'WO-0005', clientName: 'Susan & Mark Torres', address: '711 Maple St, Hendersonville',  workOrderType: 'Repair',       workOrderStatus: 'Open',   assignedTo: 'Tom Davis',    dateScheduled: '2026-04-30T08:00', dateStarted: '',              dateCompleted: '', notes: '' },
  ];

  const _WO_TASKS_MOCK = {
    'WO-0001': [
      { taskId: 'WOT-0001', sortWeight: 10, description: 'Inspect and repair window frame',   instructions: 'Check for rot and damage, replace sill if needed',          status: 'Open',   notes: '' },
      { taskId: 'WOT-0002', sortWeight: 20, description: 'Caulk exterior window seal',        instructions: 'Use paintable exterior grade caulk',                         status: 'Open',   notes: '' },
      { taskId: 'WOT-0003', sortWeight: 30, description: 'Touch up paint on repaired area',   instructions: 'Match existing trim color — check paint closet for code',     status: 'Open',   notes: '' },
    ],
    'WO-0002': [
      { taskId: 'WOT-0004', sortWeight: 10, description: 'Diagnose HVAC issue in master bedroom', instructions: 'Client reports uneven cooling — check ducts and vents',  status: 'Open',   notes: '' },
      { taskId: 'WOT-0005', sortWeight: 20, description: 'Replace filter and clean return vent',  instructions: 'Standard 20x25x1 filter',                                status: 'Open',   notes: '' },
    ],
    'WO-0003': [
      { taskId: 'WOT-0006', sortWeight: 10, description: 'Install deck ledger board',         instructions: 'Lag into rim joist — 16" OC, flashing required',              status: 'Open',   notes: '' },
      { taskId: 'WOT-0007', sortWeight: 20, description: 'Set deck posts and pour footings',  instructions: '4 posts, 12" Sonotube, 36" depth',                            status: 'Open',   notes: '' },
      { taskId: 'WOT-0008', sortWeight: 30, description: 'Frame deck structure',              instructions: 'Double 2x10 beam, 2x10 joists 16" OC',                        status: 'Open',   notes: '' },
    ],
    'WO-0004': [
      { taskId: 'WOT-0009', sortWeight: 10, description: 'Pre-drywall inspection',            instructions: 'Check blocking, fire stops, and rough-in work',               status: 'Closed', notes: 'All framing and rough-in approved. Cleared for drywall.' },
    ],
    'WO-0005': [
      { taskId: 'WOT-0010', sortWeight: 10, description: 'Repair kitchen faucet leak',        instructions: 'Under-sink supply line — bring replacement lines and shutoffs', status: 'Open',   notes: '' },
      { taskId: 'WOT-0011', sortWeight: 20, description: 'Replace garbage disposal',          instructions: 'Client has new InSinkErator Evolution on site',                status: 'Open',   notes: '' },
    ],
  };

  const _WO_TYPES      = ['Repair', 'Service Call', 'Installation', 'Inspection', 'Warranty', 'Estimate Walk', 'Other'];
  const _WO_STATUSES   = ['Open', 'Closed'];
  const _TASK_STATUSES = ['Open', 'Closed'];
  const _EMPLOYEES     = ['Mike Johnson', 'Dave Wilson', 'Tom Davis', 'Sarah Brooks'];

  /* ── Work Order List ───────────────────────────────────────── */

  function _woStatusCls(s) {
    return s === 'Open' ? 'wo-badge--open' : 'wo-badge--closed';
  }

  function _woBuildRows(pool, sortCol, sortDir, showClosed, search, groupSelect) {
    let rows = pool.filter(w => showClosed || w.workOrderStatus !== 'Closed');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(w =>
        w.clientName.toLowerCase().includes(q)     ||
        w.address.toLowerCase().includes(q)        ||
        w.workOrderType.toLowerCase().includes(q)  ||
        w.assignedTo.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const va = (a[sortCol] || '').toLowerCase();
      const vb = (b[sortCol] || '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    if (!rows.length) return '<div class="wo-empty">No work orders found.</div>';
    return rows.map(w => `
      <div class="wo-row${w.workOrderStatus === 'Closed' ? ' is-closed' : ''}" data-id="${w.workOrderId}">
        ${groupSelect ? `<input type="checkbox" class="wo-row-chk" data-id="${w.workOrderId}">` : ''}
        <div class="wo-cell wo-col-client">${w.clientName}</div>
        <div class="wo-cell wo-col-addr">${w.address}</div>
        <div class="wo-cell wo-col-type">${w.workOrderType}</div>
        <div class="wo-cell wo-col-status"><span class="wo-badge ${_woStatusCls(w.workOrderStatus)}">${w.workOrderStatus}</span></div>
        <div class="wo-cell wo-col-assigned">${w.assignedTo}</div>
        <div class="wo-cell wo-col-date">${w.dateScheduled ? w.dateScheduled.replace('T', ' ') : '—'}</div>
      </div>`).join('');
  }

  function _woListHTML() {
    return `<div class="sp-widget wo-widget">
      <div class="sp-toolbar wo-toolbar">
        <button class="btn-primary sp-btn" data-action="wo-new">+ New Work Order</button>
        <input class="sp-search wo-search" type="search" placeholder="Search…" autocomplete="off">
        <div class="wo-toolbar-spacer"></div>
        <label class="wo-closed-lbl">
          <input type="checkbox" data-action="wo-show-closed"> Show Closed
        </label>
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="wo-group-select" title="Group select">&#9776;</button>
      </div>
      <div class="wo-col-hdrs">
        <div class="wo-hdr wo-col-client"   data-sort="clientName"      data-col-var="--wo-w-client">CLIENT <span class="wo-sort-arrow">↑</span><div class="wo-col-resize"></div></div>
        <div class="wo-hdr wo-col-addr"     data-sort="address"         data-col-var="--wo-w-addr">ADDRESS <span class="wo-sort-arrow"></span><div class="wo-col-resize"></div></div>
        <div class="wo-hdr wo-col-type"     data-sort="workOrderType"   data-col-var="--wo-w-type">TYPE <span class="wo-sort-arrow"></span><div class="wo-col-resize"></div></div>
        <div class="wo-hdr wo-col-status"   data-sort="workOrderStatus" data-col-var="--wo-w-status">STATUS <span class="wo-sort-arrow"></span><div class="wo-col-resize"></div></div>
        <div class="wo-hdr wo-col-assigned" data-sort="assignedTo"      data-col-var="--wo-w-assigned">ASSIGNED <span class="wo-sort-arrow"></span><div class="wo-col-resize"></div></div>
        <div class="wo-hdr wo-col-date"     data-sort="dateScheduled">SCHEDULED <span class="wo-sort-arrow"></span></div>
      </div>
      <div class="wo-list-wrap">
        <div class="wo-list">${_woBuildRows(_WO_MOCK, 'clientName', 'asc', false, '', false)}</div>
      </div>
      <div class="wo-action-bar" style="display:none">
        <span class="wo-sel-count">0 selected</span>
        <button class="btn-secondary sp-btn wo-danger-btn" data-action="wo-delete-sel">Delete Selected</button>
        <button class="btn-secondary sp-btn" data-action="wo-group-cancel">Cancel</button>
      </div>
    </div>`;
  }

  function openWorkOrderList() {
    const id = 'work-order-list';
    if (WidgetManager.open(id, 'Work Orders', _woListHTML(), {
      width: 800, height: 500, minWidth: 620, minHeight: 360, category: 'workorder',
    }) !== false) {
      _bindWorkOrderList(id);
    }
  }

  function _bindWorkOrderList(widgetId) {
    const el        = document.getElementById('widget-' + widgetId);
    if (!el) return;
    const listEl    = el.querySelector('.wo-list');
    const colHdrs   = el.querySelector('.wo-col-hdrs');
    const actionBar = el.querySelector('.wo-action-bar');
    const selCount  = el.querySelector('.wo-sel-count');

    let sortCol    = 'clientName';
    let sortDir    = 'asc';
    let showClosed = false;
    let search     = '';
    let groupSelect = false;

    function _render() {
      listEl.innerHTML = _woBuildRows(_WO_MOCK, sortCol, sortDir, showClosed, search, groupSelect);
    }

    function _updateSelCount() {
      const n = el.querySelectorAll('.wo-row-chk:checked').length;
      selCount.textContent = n + ' selected';
    }

    /* Column resize with localStorage */
    const _WO_COL_KEY = 'wo_col_widths_v1';
    const saved = JSON.parse(localStorage.getItem(_WO_COL_KEY) || 'null');
    colHdrs.querySelectorAll('[data-col-var]').forEach(hdr => {
      const v = hdr.dataset.colVar;
      if (saved?.[v]) el.style.setProperty(v, saved[v]);
      const handle = hdr.querySelector('.wo-col-resize');
      if (!handle) return;
      let startX, startW;
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startX = e.clientX;
        startW = parseInt(getComputedStyle(el).getPropertyValue(v)) || hdr.offsetWidth;
        function onMove(e) {
          el.style.setProperty(v, Math.max(60, startW + (e.clientX - startX)) + 'px');
        }
        function onUp() {
          const widths = {};
          colHdrs.querySelectorAll('[data-col-var]').forEach(h => {
            widths[h.dataset.colVar] = getComputedStyle(el).getPropertyValue(h.dataset.colVar).trim();
          });
          localStorage.setItem(_WO_COL_KEY, JSON.stringify(widths));
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    /* Sort */
    colHdrs.addEventListener('click', function (e) {
      const hdr = e.target.closest('[data-sort]');
      if (!hdr || e.target.closest('.wo-col-resize')) return;
      const col = hdr.dataset.sort;
      if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortCol = col; sortDir = 'asc'; }
      colHdrs.querySelectorAll('.wo-sort-arrow').forEach(a => a.textContent = '');
      const arrow = hdr.querySelector('.wo-sort-arrow');
      if (arrow) arrow.textContent = sortDir === 'asc' ? '↑' : '↓';
      _render();
    });

    /* Search */
    el.querySelector('.wo-search').addEventListener('input', function () {
      search = this.value.trim();
      _render();
    });

    /* Show Closed */
    el.querySelector('[data-action="wo-show-closed"]').addEventListener('change', function () {
      showClosed = this.checked;
      _render();
    });

    /* Group select */
    el.querySelector('[data-action="wo-group-select"]').addEventListener('click', () => {
      groupSelect = !groupSelect;
      el.classList.toggle('is-group-select', groupSelect);
      actionBar.style.display = groupSelect ? '' : 'none';
      _render();
    });

    el.querySelector('[data-action="wo-group-cancel"]').addEventListener('click', () => {
      groupSelect = false;
      el.classList.remove('is-group-select');
      actionBar.style.display = 'none';
      _render();
    });

    /* Row click → open WO detail */
    listEl.addEventListener('click', e => {
      if (e.target.closest('.wo-row-chk')) { _updateSelCount(); return; }
      const row = e.target.closest('.wo-row');
      if (!row) return;
      openWorkOrder(row.dataset.id);
    });

    /* New Work Order */
    el.querySelector('[data-action="wo-new"]').addEventListener('click', () => openNewWorkOrder(widgetId));
  }

  /* ── Work Order Detail ─────────────────────────────────────── */

  function _woTaskRowHTML(t, num) {
    const statusOpts = _TASK_STATUSES.map(s => `<option${s === t.status ? ' selected' : ''}>${s}</option>`).join('');
    return `<div class="wo-tg-row" data-task-id="${t.taskId}">
      <div class="wo-tg-cell wo-tg-num">${num}.</div>
      <div class="wo-tg-cell"><input class="wo-tg-inp" type="text" data-field="description"  value="${(t.description  || '').replace(/"/g, '&quot;')}" placeholder="Task description…"></div>
      <div class="wo-tg-cell"><input class="wo-tg-inp" type="text" data-field="instructions" value="${(t.instructions || '').replace(/"/g, '&quot;')}" placeholder="Instructions…"></div>
      <div class="wo-tg-cell"><input class="wo-tg-inp" type="text" data-field="notes"        value="${(t.notes        || '').replace(/"/g, '&quot;')}" placeholder="Notes…"></div>
      <div class="wo-tg-cell"><select class="wo-tg-status-sel">${statusOpts}</select></div>
      <div class="wo-tg-cell wo-tg-del-cell"><button class="wo-tg-del-btn" title="Remove">&#215;</button></div>
    </div>`;
  }

  function _woNewTaskRowHTML() {
    const statusOpts = _TASK_STATUSES.map(s => `<option>${s}</option>`).join('');
    return `<div class="wo-tg-row wo-tg-new-row" data-task-id="new">
      <div class="wo-tg-cell wo-tg-num"></div>
      <div class="wo-tg-cell"><input class="wo-tg-inp" type="text" data-field="description"  placeholder="Add a task…"></div>
      <div class="wo-tg-cell"><input class="wo-tg-inp" type="text" data-field="instructions" placeholder="Instructions…"></div>
      <div class="wo-tg-cell"><input class="wo-tg-inp" type="text" data-field="notes"        placeholder="Notes…"></div>
      <div class="wo-tg-cell"><select class="wo-tg-status-sel">${statusOpts}</select></div>
      <div class="wo-tg-cell wo-tg-del-cell"></div>
    </div>`;
  }

  function _woTasksGridHTML(tasks) {
    return `<div class="wo-tasks-grid">
      <div class="wo-tg-hdr-row">
        <div class="wo-tg-hdr">#</div>
        <div class="wo-tg-hdr">Task Description</div>
        <div class="wo-tg-hdr">Instructions</div>
        <div class="wo-tg-hdr">Notes</div>
        <div class="wo-tg-hdr">Status</div>
        <div class="wo-tg-hdr"></div>
      </div>
      ${tasks.map((t, i) => _woTaskRowHTML(t, i + 1)).join('')}
      ${_woNewTaskRowHTML()}
    </div>`;
  }

  function _woDetailHTML(wo, tasks) {
    const typeOpts     = _WO_TYPES.map(t    => `<option${t === wo.workOrderType   ? ' selected' : ''}>${t}</option>`).join('');
    const statusOpts   = _WO_STATUSES.map(s => `<option${s === wo.workOrderStatus ? ' selected' : ''}>${s}</option>`).join('');
    const assignedOpts = _EMPLOYEES.map(e   => `<option${e === wo.assignedTo      ? ' selected' : ''}>${e}</option>`).join('');

    return `<div class="sp-widget wo-detail-widget">
      <div class="sp-toolbar wo-detail-toolbar">
        <button class="btn-primary sp-btn"   data-action="wo-save">Save</button>
        <button class="btn-secondary sp-btn" data-action="wo-new-from-detail">+ New WO</button>
        <div class="wo-toolbar-spacer"></div>
        ${wo.workOrderId ? `<span class="wo-id-label">${wo.workOrderId}</span>` : ''}
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="wo-print"   title="Print">&#9113;</button>
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="wo-refresh" title="Refresh">&#8635;</button>
      </div>

      <div class="wo-detail-body">

        <div class="wo-info-grid">
          <div class="wo-info-col">
            <div class="wo-field-row">
              <label class="wo-field-lbl">Client</label>
              <input class="wo-field-inp" type="text" data-field="clientName" value="${wo.clientName || ''}" placeholder="Client name…">
            </div>
            <div class="wo-field-row">
              <label class="wo-field-lbl">Address</label>
              <input class="wo-field-inp" type="text" data-field="address" value="${wo.address || ''}" placeholder="Property address…">
            </div>
            <div class="wo-field-row">
              <label class="wo-field-lbl">WO Type</label>
              <select class="wo-field-sel" data-field="workOrderType">${typeOpts}</select>
            </div>
            <div class="wo-field-row">
              <label class="wo-field-lbl">Status</label>
              <select class="wo-field-sel" data-field="workOrderStatus">${statusOpts}</select>
            </div>
            <div class="wo-field-row">
              <label class="wo-field-lbl">Assigned To</label>
              <select class="wo-field-sel" data-field="assignedTo">${assignedOpts}</select>
            </div>
          </div>

          <div class="wo-info-col">
            <div class="wo-field-row">
              <label class="wo-field-lbl">Scheduled</label>
              <input class="wo-field-inp" type="datetime-local" data-field="dateScheduled" value="${wo.dateScheduled || ''}">
            </div>
            <div class="wo-field-row">
              <label class="wo-field-lbl">Started</label>
              <input class="wo-field-inp" type="datetime-local" data-field="dateStarted" value="${wo.dateStarted || ''}">
            </div>
            <div class="wo-field-row">
              <label class="wo-field-lbl">Completed</label>
              <input class="wo-field-inp" type="datetime-local" data-field="dateCompleted" value="${wo.dateCompleted || ''}">
            </div>
            <div class="wo-field-row wo-notes-row">
              <label class="wo-field-lbl">Notes</label>
              <textarea class="wo-field-textarea" data-field="notes" rows="3" placeholder="General notes…">${(wo.notes || '').replace(/</g, '&lt;')}</textarea>
            </div>
          </div>
        </div>

        <hr class="wo-sep">

        <div class="wo-tasks-section">
          <span class="wo-tasks-title">Tasks</span>
          ${_woTasksGridHTML(tasks)}
        </div>

      </div>
    </div>`;
  }

  function openWorkOrder(workOrderId) {
    const wo    = _WO_MOCK.find(w => w.workOrderId === workOrderId) || {
      workOrderId: workOrderId, clientName: '', address: '',
      workOrderType: 'Repair', workOrderStatus: 'Open', assignedTo: _EMPLOYEES[0],
      dateScheduled: '', dateStarted: '', dateCompleted: '', notes: '',
    };
    const tasks = (_WO_TASKS_MOCK[workOrderId] || []).slice();
    const id    = 'workorder-' + workOrderId;
    const title = 'Work Order' + (workOrderId ? ' — ' + workOrderId : '');
    if (WidgetManager.open(id, title, _woDetailHTML(wo, tasks), {
      width: 780, height: 620, minWidth: 600, minHeight: 480, category: 'workorder',
    }) !== false) {
      _bindWorkOrder(id, wo, tasks);
    }
  }

  function openNewWorkOrder(parentWidgetId) {
    const today = new Date().toISOString().slice(0, 16);
    const wo = {
      workOrderId: '', clientName: '', address: '',
      workOrderType: 'Repair', workOrderStatus: 'Open',
      assignedTo: _EMPLOYEES[0], dateScheduled: today,
      dateStarted: '', dateCompleted: '', notes: '',
    };
    const id = 'workorder-new';
    if (WidgetManager.open(id, 'Work Order — New', _woDetailHTML(wo, []), {
      width: 780, height: 620, minWidth: 600, minHeight: 480, category: 'workorder',
      centeredOn: parentWidgetId,
    }) !== false) {
      _bindWorkOrder(id, wo, []);
    }
  }

  function _bindWorkOrder(widgetId, wo, initialTasks) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;
    const grid   = el.querySelector('.wo-tasks-grid');
    let _taskSeq = initialTasks.length;

    function _allRows()    { return [...grid.querySelectorAll('.wo-tg-row:not(.wo-tg-new-row)')]; }
    function _getNewRow()  { return grid.querySelector('.wo-tg-new-row'); }

    function _renumber() {
      _allRows().forEach((row, i) => { row.querySelector('.wo-tg-num').textContent = (i + 1) + '.'; });
    }

    function _promoteNewRow(newRow) {
      _taskSeq++;
      const taskId = 'WOT-new-' + _taskSeq;
      newRow.dataset.taskId = taskId;
      newRow.classList.remove('wo-tg-new-row');
      newRow.querySelector('.wo-tg-num').textContent = (_allRows().length) + '.';
      newRow.querySelector('.wo-tg-del-cell').innerHTML = `<button class="wo-tg-del-btn" title="Remove">&#215;</button>`;
      // Append a fresh empty row
      grid.insertAdjacentHTML('beforeend', _woNewTaskRowHTML());
      _bindNewRow(_getNewRow());
    }

    function _bindNewRow(newRow) {
      newRow.querySelector('[data-field="description"]').addEventListener('blur', function () {
        if (this.value.trim()) _promoteNewRow(newRow);
      });
    }

    /* Delete — event delegation on grid */
    grid.addEventListener('click', e => {
      const btn = e.target.closest('.wo-tg-del-btn');
      if (!btn) return;
      btn.closest('.wo-tg-row').remove();
      _renumber();
    });

    _bindNewRow(_getNewRow());

    /* Save */
    el.querySelector('[data-action="wo-save"]').addEventListener('click', () => {
      Toast.show('✓ Work Order saved.');
      const rows = tasksListEl.querySelectorAll('.wo-task-row');
      rows[rows.length - 1]?.querySelector('.wo-task-desc-inp')?.focus();
    });

    /* Save */
    el.querySelector('[data-action="wo-save"]').addEventListener('click', () => {
      Toast.show('✓ Work Order saved.');
    });

    /* New WO from detail */
    el.querySelector('[data-action="wo-new-from-detail"]').addEventListener('click', () => {
      openNewWorkOrder(widgetId);
    });

    /* Print / Refresh */
    el.querySelector('[data-action="wo-print"]').addEventListener('click',   () => Toast.show('Sent to printer.'));
    el.querySelector('[data-action="wo-refresh"]').addEventListener('click', () => Toast.show('Refreshed.'));
  }

  return { openWorkOrderList, openWorkOrder, openNewWorkOrder };

})();
