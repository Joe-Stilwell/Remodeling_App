'use strict';
/*
 * leads.js — Lead Pipeline Kanban + Lead Detail widget
 * Public: Leads.openKanban, Leads.openNewLead
 */

const Leads = (() => {

  /* ── Mock Data ─────────────────────────────────────────────── */

  const _STAGES = [
    'New Inquiry', 'Meeting Scheduled', 'Preliminary', 'Design',
    'Estimating', 'Proposal Sent', 'Negotiating',
  ];

  const _SOURCES = [
    'Referral', 'Repeat Client', 'Google / Web', 'Yard Sign',
    'Social Media', 'Home Show', 'Insurance', 'Direct / Cold Call', 'Other',
  ];

  const _MOCK = [
    { leadId: 'LEAD-0001', clientName: 'Smith, John & Mary',     propertyAddr: '1824 Millbrook Dr, Nashville',  clientType: 'Residential', leadSource: 'Referral',           referralSource: 'Tom Reynolds',        projectDescription: 'Full kitchen remodel — open concept, quartz countertops', estimatedValue: 35000,  followUpDate: '2026-04-28', leadStage: 'Meeting Scheduled', isArchived: false, notes: '' },
    { leadId: 'LEAD-0002', clientName: 'Johnson, Robert',        propertyAddr: '456 Elm Ave, Franklin',         clientType: 'Residential', leadSource: 'Google / Web',       referralSource: '',                    projectDescription: 'Master bath renovation — walk-in shower, double vanity',      estimatedValue: 22000,  followUpDate: '2026-04-30', leadStage: 'New Inquiry',        isArchived: false, notes: '' },
    { leadId: 'LEAD-0003', clientName: 'Ward, Patricia & Tom',   propertyAddr: '892 Crestview Ln, Brentwood',   clientType: 'Residential', leadSource: 'Referral',           referralSource: 'Allison Parker, AIA', projectDescription: 'Whole-home design & remodel — 3,200 sqft',                    estimatedValue: 185000, followUpDate: '',           leadStage: 'Design',             isArchived: false, notes: '' },
    { leadId: 'LEAD-0004', clientName: 'Chen, David',            propertyAddr: '3301 Highland Ave, Nashville',  clientType: 'Residential', leadSource: 'Repeat Client',      referralSource: '',                    projectDescription: 'Deck addition and screened porch',                            estimatedValue: 48000,  followUpDate: '2026-05-05', leadStage: 'Estimating',         isArchived: false, notes: '' },
    { leadId: 'LEAD-0005', clientName: 'Torres, Susan & Mark',   propertyAddr: '711 Maple St, Hendersonville',  clientType: 'Residential', leadSource: 'Yard Sign',          referralSource: '',                    projectDescription: 'Basement finish — home office and guest suite',               estimatedValue: 67000,  followUpDate: '',           leadStage: 'Proposal Sent',      isArchived: false, notes: '' },
    { leadId: 'LEAD-0006', clientName: 'GreenLeaf Properties',   propertyAddr: '200 Commerce St, Nashville',    clientType: 'Commercial',  leadSource: 'Direct / Cold Call', referralSource: '',                    projectDescription: 'Office suite buildout — 4,500 sqft tenant improvement',        estimatedValue: 210000, followUpDate: '2026-05-10', leadStage: 'Preliminary',        isArchived: false, notes: '' },
    { leadId: 'LEAD-0007', clientName: 'Murphy, Brian & Colleen',propertyAddr: '55 Ridgetop Rd, Nolensville',   clientType: 'Residential', leadSource: 'Home Show',          referralSource: '',                    projectDescription: 'Kitchen and two bath remodel',                                estimatedValue: 58000,  followUpDate: '',           leadStage: 'Negotiating',        isArchived: false, notes: '' },
    { leadId: 'LEAD-0008', clientName: 'Harrison, William',      propertyAddr: '1420 West End Ave, Nashville',  clientType: 'Residential', leadSource: 'Referral',           referralSource: '',                    projectDescription: 'Bathroom remodel inquiry — no budget established',            estimatedValue: 0,      followUpDate: '2026-04-20', leadStage: 'New Inquiry',        isArchived: true,  notes: 'Left voicemail twice. No response.' },
    { leadId: 'LEAD-0009', clientName: 'Patel, Raj',             propertyAddr: '987 Sundown Blvd, Murfreesboro',clientType: 'Residential', leadSource: 'Google / Web',       referralSource: '',                    projectDescription: 'Roof and siding replacement',                                 estimatedValue: 18000,  followUpDate: '',           leadStage: 'Meeting Scheduled',  isArchived: true,  notes: 'Price too high. Closed.' },
  ];

  let _leads = _MOCK.map(l => ({ ...l }));
  let _seq    = _MOCK.length;

  /* ── Helpers ──────────────────────────────────────────────── */

  function _fmt$(v) { return v ? '$' + Number(v).toLocaleString() : ''; }

  function _fmtDate(d) {
    if (!d) return '';
    const [, m, day] = d.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1] + ' ' + +day;
  }

  function _isOverdue(d) { return d && new Date(d + 'T00:00') < new Date(); }

  /* ── Kanban board HTML ────────────────────────────────────── */

  function _cardHTML(l) {
    const overdue = _isOverdue(l.followUpDate);
    return `
      <div class="lk-card${l.isArchived ? ' lk-card--archived' : ''}" data-id="${l.leadId}">
        <div class="lk-card-name">${l.clientName}</div>
        ${l.projectDescription ? `<div class="lk-card-desc">${l.projectDescription}</div>` : ''}
        <div class="lk-card-footer">
          <span class="lk-card-type lk-type--${l.clientType === 'Commercial' ? 'com' : 'res'}">${l.clientType === 'Commercial' ? 'Com' : 'Res'}</span>
          ${l.estimatedValue ? `<span class="lk-card-value">${_fmt$(l.estimatedValue)}</span>` : ''}
          ${l.followUpDate   ? `<span class="lk-card-followup${overdue ? ' is-overdue' : ''}">&#x1F4C5; ${_fmtDate(l.followUpDate)}</span>` : ''}
        </div>
      </div>`;
  }

  function _colHTML(stage) {
    const active   = _leads.filter(l => l.leadStage === stage && !l.isArchived);
    const archived = _leads.filter(l => l.leadStage === stage &&  l.isArchived);
    return `
      <div class="lk-column" data-stage="${stage}">
        <div class="lk-col-header">
          <span class="lk-col-name">${stage}</span>
          <span class="lk-col-count">${active.length}</span>
        </div>
        <div class="lk-col-body">
          ${active.map(_cardHTML).join('')}
          ${archived.length ? `
            <div class="lk-archived-section">
              <button class="lk-archived-toggle">Archived (${archived.length})</button>
              <div class="lk-archived-body">${archived.map(_cardHTML).join('')}</div>
            </div>` : ''}
        </div>
      </div>`;
  }

  function _boardHTML(q) {
    if (q) {
      const lc    = q.toLowerCase();
      const found = _leads.filter(l =>
        l.clientName.toLowerCase().includes(lc) ||
        l.projectDescription.toLowerCase().includes(lc) ||
        (l.propertyAddr || '').toLowerCase().includes(lc)
      );
      return found.length
        ? `<div class="lk-search-results">${found.map(_cardHTML).join('')}</div>`
        : '<div class="lk-empty">No leads match your search.</div>';
    }
    return _STAGES.map(_colHTML).join('');
  }

  /* ── Kanban open / bind ───────────────────────────────────── */

  function openKanban() {
    if (WidgetManager.focusWidget('lead-kanban')) return;

    const html = `
      <div class="lk-widget">
        <div class="sp-toolbar">
          <button class="btn-primary sp-btn" data-action="new-lead">+ New Lead</button>
          <div style="flex:1"></div>
          <input type="search" class="sp-search lk-search" placeholder="Search leads…" autocomplete="off">
        </div>
        <div class="lk-board-wrap">
          <div class="lk-board">${_boardHTML('')}</div>
        </div>
      </div>`;

    WidgetManager.open('lead-kanban', 'Lead Pipeline', html, {
      category: 'contact',
      width: 1150,
      height: 580,
      minWidth: 620,
      minHeight: 380,
    });

    _bindKanban(document.getElementById('widget-lead-kanban'));
  }

  function _refreshBoard(el, q) {
    const board = el.querySelector('.lk-board');
    if (board) board.innerHTML = _boardHTML(q);
    _bindBoard(el);
  }

  function _refreshKanban() {
    const el = document.getElementById('widget-lead-kanban');
    if (!el) return;
    _refreshBoard(el, el.querySelector('.lk-search')?.value.trim() || '');
  }

  function _bindBoard(el) {
    const board = el.querySelector('.lk-board');
    if (!board) return;

    board.addEventListener('click', e => {
      if (e.target.closest('.lk-archived-toggle')) return;
      const card = e.target.closest('.lk-card');
      if (card) openLeadDetail(card.dataset.id);
    });

    board.querySelectorAll('.lk-archived-toggle').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const sec  = this.closest('.lk-archived-section');
        const open = sec.classList.toggle('is-open');
        const n    = sec.querySelectorAll('.lk-card').length;
        this.textContent = open ? 'Hide Archived' : `Archived (${n})`;
      });
    });
  }

  function _bindKanban(el) {
    el.querySelector('[data-action="new-lead"]').addEventListener('click', () => openNewLead());
    let _t = null;
    el.querySelector('.lk-search').addEventListener('input', function () {
      clearTimeout(_t);
      _t = setTimeout(() => _refreshBoard(el, this.value.trim()), 180);
    });
    _bindBoard(el);
  }

  /* ── Lead Detail / New Lead HTML ──────────────────────────── */

  function _detailHTML(l, isNew) {
    const stageOpts  = _STAGES .map(s => `<option value="${s}"${l.leadStage  === s ? ' selected' : ''}>${s}</option>`).join('');
    const sourceOpts = _SOURCES.map(s => `<option value="${s}"${l.leadSource === s ? ' selected' : ''}>${s}</option>`).join('');

    const nameBlock = isNew
      ? `<input class="ld-name-inp" data-field="clientName" placeholder="Client name…" value="">`
      : `<span class="ld-client-name">${l.clientName}</span>`;

    const addrBlock = isNew
      ? `<input class="ld-field-inp" data-field="propertyAddr" placeholder="Street address…" value="">`
      : `<span class="ld-val">${l.propertyAddr || '—'}</span>`;

    return `
      <div class="ld-widget">
        <div class="ld-header-row">
          ${nameBlock}
          <div class="ld-header-right">
            <select class="ld-stage-sel" data-field="leadStage">${stageOpts}</select>
            ${!isNew && l.isArchived ? '<span class="ld-archived-badge">Archived</span>' : ''}
          </div>
        </div>

        <div class="ld-grid">
          <div class="ld-section">
            <div class="ld-sec-label">Property</div>
            <div class="ld-row"><span class="ld-lbl">Address</span>${addrBlock}</div>
            <div class="ld-row"><span class="ld-lbl">Client Type</span>
              <select class="ld-field-sel" data-field="clientType">
                <option value="Residential"${l.clientType === 'Residential' ? ' selected' : ''}>Residential</option>
                <option value="Commercial"${l.clientType  === 'Commercial'  ? ' selected' : ''}>Commercial</option>
              </select>
            </div>
          </div>

          <div class="ld-section">
            <div class="ld-sec-label">Lead Info</div>
            <div class="ld-row"><span class="ld-lbl">Source</span>
              <select class="ld-field-sel" data-field="leadSource">${sourceOpts}</select>
            </div>
            <div class="ld-row"><span class="ld-lbl">Referral From</span>
              <input class="ld-field-inp" data-field="referralSource" value="${l.referralSource || ''}" placeholder="Name or leave blank">
            </div>
            <div class="ld-row"><span class="ld-lbl">Est. Value</span>
              <input type="number" class="ld-field-inp" data-field="estimatedValue" value="${l.estimatedValue || ''}">
            </div>
            <div class="ld-row"><span class="ld-lbl">Follow-Up</span>
              <input type="date" class="ld-field-inp" data-field="followUpDate" value="${l.followUpDate || ''}">
            </div>
          </div>
        </div>

        <div class="ld-full-row">
          <div class="ld-sec-label">Project Description</div>
          <textarea class="ld-textarea" data-field="projectDescription" rows="3" placeholder="Brief description of the project…">${l.projectDescription || ''}</textarea>
        </div>

        <div class="ld-full-row">
          <div class="ld-sec-label">Notes</div>
          <textarea class="ld-textarea" data-field="notes" rows="2" placeholder="Internal notes…">${l.notes || ''}</textarea>
        </div>

        <div class="ld-footer">
          ${!isNew ? `<button class="btn-secondary sp-btn" data-action="archive">${l.isArchived ? 'Unarchive' : 'Archive'}</button>` : ''}
          <div style="flex:1"></div>
          <button class="btn-secondary sp-btn" data-action="cancel">Cancel</button>
          <button class="btn-primary sp-btn"   data-action="save">Save</button>
        </div>
      </div>`;
  }

  function _collectFields(el, target) {
    el.querySelectorAll('[data-field]').forEach(inp => {
      const f = inp.dataset.field;
      target[f] = inp.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value;
    });
  }

  /* ── Open Lead Detail ─────────────────────────────────────── */

  function openLeadDetail(leadId) {
    const l = _leads.find(x => x.leadId === leadId);
    if (!l) return;
    const wid = 'lead-detail-' + leadId;
    if (WidgetManager.focusWidget(wid)) return;

    WidgetManager.open(wid, 'Lead — ' + l.clientName, _detailHTML(l, false), {
      category: 'contact',
      width:    520,
      height:   500,
      minWidth: 420,
    });

    const el = document.getElementById('widget-' + wid);
    el.querySelector('[data-action="save"]').addEventListener('click', () => {
      _collectFields(el, l);
      Toast.show('✓ Lead saved');
      WidgetManager.close(wid);
      _refreshKanban();
    });
    el.querySelector('[data-action="cancel"]').addEventListener('click', () =>
      WidgetManager.close(wid));
    el.querySelector('[data-action="archive"]')?.addEventListener('click', () => {
      l.isArchived = !l.isArchived;
      Toast.show(l.isArchived ? 'Lead archived' : 'Lead unarchived');
      WidgetManager.close(wid);
      _refreshKanban();
    });
  }

  /* ── Open New Lead ────────────────────────────────────────── */

  function openNewLead() {
    const wid = 'lead-new';
    if (WidgetManager.focusWidget(wid)) return;

    const blank = {
      leadId: '', clientName: '', propertyAddr: '',
      clientType: 'Residential', leadSource: 'Referral', referralSource: '',
      projectDescription: '', estimatedValue: 0, followUpDate: '',
      leadStage: _STAGES[0], isArchived: false, notes: '',
    };

    WidgetManager.open(wid, 'New Lead', _detailHTML(blank, true), {
      category: 'contact',
      width:    520,
      height:   500,
      minWidth: 420,
    });

    const el = document.getElementById('widget-' + wid);
    el.querySelector('[data-action="save"]').addEventListener('click', () => {
      _collectFields(el, blank);
      if (!blank.clientName.trim()) {
        Toast.show('⚠ Client name is required', { warn: true });
        return;
      }
      blank.leadId = 'LEAD-' + String(++_seq).padStart(4, '0');
      _leads.push({ ...blank });
      Toast.show('✓ Lead saved');
      WidgetManager.close(wid);
      _refreshKanban();
    });
    el.querySelector('[data-action="cancel"]').addEventListener('click', () =>
      WidgetManager.close(wid));
  }

  /* ── Public API ───────────────────────────────────────────── */
  return { openKanban, openNewLead };

})();
