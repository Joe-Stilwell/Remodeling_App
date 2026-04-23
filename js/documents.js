/* ================================================================
   MODULE: documents.js
   Owns:   DB_Documents — document templates and editor
   Public: (see return block — openDocumentEditor, etc.)
   Reads:  AppData (get/find), WidgetManager
   Never:  Contact or estimate business logic. Own DB_Estimates.
   ================================================================

   Documents Module
   Template storage and document editor.

   PLACEHOLDER ARCHITECTURE:
   - Editor: browser contentEditable + execCommand
   - Storage: localStorage (mirrors Sheets pattern)
   - Full-stack: replace editor div with Tiptap instance;
     replace localStorage calls with Sheets/DB writes.
     Interface boundary: _loadDocs() / _saveDocs() are the
     only two functions that touch storage — swap those and
     nothing else changes.
   ============================================================ */

const Documents = (function () {

  const DOC_TYPES = ['Proposal', 'Contract', 'Change Order', 'Letter', 'Internal'];

  const TYPE_COLORS = {
    'Proposal':     'var(--color-brand-primary)',
    'Contract':     '#6b46c1',
    'Change Order': '#c05621',
    'Letter':       '#276749',
    'Internal':     'var(--color-ink-mid)',
  };

  // Merge field tokens — insert at cursor in editor
  // Full-stack: these resolve against live estimate/client data at print/export time
  const MERGE_FIELDS = {
    'Client':   ['{{client_name}}', '{{client_address}}', '{{client_phone}}', '{{client_email}}'],
    'Project':  ['{{project_name}}', '{{project_address}}'],
    'Estimate': ['{{estimate_number}}', '{{estimate_date}}', '{{project_total}}', '{{deposit_amount}}'],
    'Company':  ['{{company_name}}', '{{company_phone}}', '{{company_email}}', '{{license_number}}'],
    'Dates':    ['{{today}}', '{{start_date}}', '{{completion_date}}'],
  };

  // Seed templates — realistic content so the demo feels real
  const DOC_SEED = [
    {
      id: 'doc-001',
      title: 'Standard Remodeling Proposal',
      type: 'Proposal',
      dateModified: '4/16/26',
      content: `<p><strong>{{company_name}}</strong><br>{{company_phone}} &nbsp;|&nbsp; {{company_email}}</p>
<p>&nbsp;</p>
<p><strong>PROPOSAL</strong></p>
<p>Date: {{today}}<br>
Prepared for: {{client_name}}<br>
Project: {{project_name}}<br>
Address: {{project_address}}</p>
<p>&nbsp;</p>
<p>Dear {{client_name}},</p>
<p>Thank you for the opportunity to present this proposal for your remodeling project. We are pleased to offer the following scope of work and pricing for your consideration.</p>
<p>&nbsp;</p>
<p><strong>SCOPE OF WORK</strong></p>
<p>[Describe project scope here]</p>
<p>&nbsp;</p>
<p><strong>PROJECT INVESTMENT</strong></p>
<p>Total Project Cost:&nbsp; {{project_total}}<br>
Deposit Due at Signing:&nbsp; {{deposit_amount}}<br>
Estimated Start Date:&nbsp; {{start_date}}<br>
Estimated Completion:&nbsp; {{completion_date}}</p>
<p>&nbsp;</p>
<p>This proposal is valid for 30 days from the date above. All pricing is based on current material costs and is subject to adjustment if market conditions change significantly prior to contract execution.</p>
<p>&nbsp;</p>
<p>We look forward to working with you on this project.</p>
<p>&nbsp;</p>
<p>Sincerely,<br>
<strong>{{company_name}}</strong><br>
{{company_phone}}<br>
License #{{license_number}}</p>`
    },
    {
      id: 'doc-002',
      title: 'Remodeling Contract',
      type: 'Contract',
      dateModified: '4/10/26',
      content: `<p style="text-align:center"><strong>REMODELING CONTRACT</strong></p>
<p>&nbsp;</p>
<p>This agreement is entered into on <strong>{{today}}</strong> between <strong>{{company_name}}</strong>, License #{{license_number}} ("Contractor"), and <strong>{{client_name}}</strong> ("Owner").</p>
<p>&nbsp;</p>
<p><strong>PROJECT:&nbsp;</strong> {{project_name}}<br>
<strong>LOCATION:&nbsp;</strong> {{project_address}}</p>
<p>&nbsp;</p>
<p><strong>1. SCOPE OF WORK</strong><br>
Contractor agrees to furnish all labor, materials, and equipment necessary to complete the following work: [Detailed scope of work to be inserted here]</p>
<p>&nbsp;</p>
<p><strong>2. CONTRACT PRICE</strong><br>
Owner agrees to pay Contractor the sum of <strong>{{project_total}}</strong> for complete performance of this contract, subject to additions and deductions by written change order.</p>
<p>&nbsp;</p>
<p><strong>3. PAYMENT SCHEDULE</strong><br>
Deposit of <strong>{{deposit_amount}}</strong> is due upon signing this agreement.<br>
Progress payments per schedule attached as Exhibit A.<br>
Final payment due upon substantial completion.</p>
<p>&nbsp;</p>
<p><strong>4. START AND COMPLETION</strong><br>
Work shall commence on or about <strong>{{start_date}}</strong> and be substantially complete by <strong>{{completion_date}}</strong>, subject to delays caused by weather, material availability, or conditions beyond Contractor's reasonable control.</p>
<p>&nbsp;</p>
<p><strong>5. CHANGES IN WORK</strong><br>
Any changes to the scope of work must be agreed to in writing via a signed Change Order before work proceeds. Verbal authorizations will not be binding.</p>
<p>&nbsp;</p>
<p><strong>6. WARRANTY</strong><br>
Contractor warrants all workmanship for a period of one (1) year from the date of substantial completion. This warranty does not cover damage caused by Owner neglect or misuse.</p>
<p>&nbsp;</p>
<p>IN WITNESS WHEREOF the parties have executed this agreement on the date first written above.</p>
<p>&nbsp;</p>
<p>___________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___________________________<br>
Contractor Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Owner Signature</p>
<p>&nbsp;</p>
<p>___________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___________________________<br>
Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</p>`
    },
    {
      id: 'doc-003',
      title: 'Change Order',
      type: 'Change Order',
      dateModified: '3/28/26',
      content: `<p style="text-align:center"><strong>CHANGE ORDER</strong></p>
<p>&nbsp;</p>
<p>Date: {{today}}<br>
Project: {{project_name}}<br>
Client: {{client_name}}<br>
Address: {{project_address}}<br>
Change Order #: ________</p>
<p>&nbsp;</p>
<p><strong>DESCRIPTION OF CHANGE</strong></p>
<p>[Describe the change in scope, reason for change, and any impact on schedule]</p>
<p>&nbsp;</p>
<p><strong>COST IMPACT</strong><br>
Additional Cost: $__________<br>
Credit: $__________<br>
Net Change This Order: $__________</p>
<p>&nbsp;</p>
<p><strong>REVISED CONTRACT SUMMARY</strong><br>
Original Contract Value:&nbsp; {{project_total}}<br>
Previous Change Orders:&nbsp; $__________<br>
This Change Order:&nbsp; $__________<br>
New Contract Total:&nbsp; $__________</p>
<p>&nbsp;</p>
<p><strong>SCHEDULE IMPACT</strong><br>
Revised Completion Date:&nbsp; __________</p>
<p>&nbsp;</p>
<p>By signing below, both parties agree to the above change in scope and price.</p>
<p>&nbsp;</p>
<p>___________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___________________________<br>
Contractor Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Owner Signature</p>`
    },
    {
      id: 'doc-004',
      title: 'Project Completion Letter',
      type: 'Letter',
      dateModified: '3/15/26',
      content: `<p>{{today}}</p>
<p>&nbsp;</p>
<p>{{client_name}}<br>
{{client_address}}</p>
<p>&nbsp;</p>
<p>Re: Completion of {{project_name}}</p>
<p>&nbsp;</p>
<p>Dear {{client_name}},</p>
<p>Congratulations on the completion of your {{project_name}} project! It has been a pleasure working with you, and we hope you are absolutely thrilled with the results.</p>
<p>&nbsp;</p>
<p><strong>YOUR WARRANTY</strong><br>
Your project is covered by our one-year workmanship warranty beginning today, {{today}}. Please retain this letter for your records. Should you experience any issues covered under warranty, contact us at {{company_phone}} and we will respond promptly.</p>
<p>&nbsp;</p>
<p><strong>CARE AND MAINTENANCE</strong><br>
[Insert any product-specific care instructions here]</p>
<p>&nbsp;</p>
<p>Our business grows almost entirely through referrals from satisfied clients. If you know someone considering a remodeling project, we would be grateful for the introduction. We also welcome reviews on Google or Houzz.</p>
<p>&nbsp;</p>
<p>Thank you again for choosing {{company_name}}. We look forward to serving you on future projects.</p>
<p>&nbsp;</p>
<p>Warmly,<br>
<strong>{{company_name}}</strong><br>
{{company_phone}}<br>
{{company_email}}</p>`
    },
    {
      id: 'doc-005',
      title: 'Subcontractor Agreement',
      type: 'Contract',
      dateModified: '2/20/26',
      content: `<p style="text-align:center"><strong>SUBCONTRACTOR AGREEMENT</strong></p>
<p>&nbsp;</p>
<p>This agreement is between <strong>{{company_name}}</strong> ("Contractor") and _________________________ ("Subcontractor") for work on the following project:</p>
<p>&nbsp;</p>
<p><strong>PROJECT:&nbsp;</strong> {{project_name}}<br>
<strong>OWNER:&nbsp;</strong> {{client_name}}<br>
<strong>LOCATION:&nbsp;</strong> {{project_address}}</p>
<p>&nbsp;</p>
<p><strong>SCOPE OF WORK</strong><br>
[Describe the subcontractor's specific scope here]</p>
<p>&nbsp;</p>
<p><strong>SUBCONTRACT PRICE</strong><br>
Total subcontract value: $__________<br>
Payment terms: [Net 15 / Net 30 / Progress billing]</p>
<p>&nbsp;</p>
<p><strong>SCHEDULE</strong><br>
Start: {{start_date}}<br>
Completion: {{completion_date}}</p>
<p>&nbsp;</p>
<p><strong>INSURANCE REQUIREMENTS</strong><br>
Subcontractor shall maintain General Liability insurance of not less than $1,000,000 per occurrence and provide a certificate of insurance naming {{company_name}} as additional insured prior to commencing work.</p>
<p>&nbsp;</p>
<p>___________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___________________________<br>
{{company_name}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Subcontractor</p>`
    },
  ];

  /* ── Storage ──────────────────────────────────────────────────
     Full-stack swap point: replace localStorage calls here with
     Sheets / database read-write calls. Nothing else changes.   */
  function _loadDocs() {
    const stored = JSON.parse(localStorage.getItem('doc_templates') || 'null');
    return stored || JSON.parse(JSON.stringify(DOC_SEED)); // deep copy seed
  }

  function _saveDocs(docs) {
    localStorage.setItem('doc_templates', JSON.stringify(docs));
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function _typeBadge(type) {
    const bg = TYPE_COLORS[type] || 'var(--color-ink-mid)';
    return `<span class="doc-type-badge" style="background:${bg}">${type}</span>`;
  }

  function _fmtToday() {
    const d = new Date();
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2);
  }

  function _insertAtCursor(text) {
    // Works in contentEditable without deprecated execCommand
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ── Widget HTML ─────────────────────────────────────────── */
  function _docWidgetHTML() {
    const mergeFieldsHTML = Object.entries(MERGE_FIELDS).map(([group, fields]) => `
      <div class="doc-merge-group-lbl">${group}</div>
      ${fields.map(f => `<div class="doc-merge-item" data-field="${f}">${f}</div>`).join('')}
    `).join('');

    return `<div class="doc-widget">

      <!-- Left: template list -->
      <div class="doc-sidebar">
        <div class="doc-sidebar-hdr">
          <button class="btn-primary cb-btn" data-action="doc-new">+ New</button>
          <input class="doc-search" type="text" placeholder="Search..." autocomplete="off">
        </div>
        <div class="doc-type-filters">
          <button class="doc-filter active" data-type="">All</button>
          ${DOC_TYPES.map(t => `<button class="doc-filter" data-type="${t}">${t}</button>`).join('')}
        </div>
        <div class="doc-list"></div>
      </div>

      <div class="doc-panel-divider"></div>

      <!-- Right: editor -->
      <div class="doc-main">

        <div class="doc-empty-state">
          <div class="doc-empty-icon">&#128196;</div>
          <div class="doc-empty-msg">Select a template or create a new one</div>
        </div>

        <div class="doc-editor" style="display:none">

          <div class="doc-editor-hdr">
            <input class="doc-title-inp" type="text" placeholder="Template title...">
            <select class="doc-type-sel">
              ${DOC_TYPES.map(t => `<option>${t}</option>`).join('')}
            </select>
            <span class="doc-mod-lbl"></span>
          </div>

          <div class="doc-fmt-bar">
            <div class="doc-fmt-group">
              <button class="doc-fmt-btn" data-cmd="bold"      title="Bold"><b>B</b></button>
              <button class="doc-fmt-btn" data-cmd="italic"    title="Italic"><i>I</i></button>
              <button class="doc-fmt-btn" data-cmd="underline" title="Underline"><u>U</u></button>
            </div>
            <div class="doc-fmt-divider"></div>
            <div class="doc-fmt-group">
              <button class="doc-fmt-btn" data-cmd="justifyLeft"   title="Align Left">&#8676;</button>
              <button class="doc-fmt-btn" data-cmd="justifyCenter" title="Center">&#8703;</button>
              <button class="doc-fmt-btn" data-cmd="justifyRight"  title="Align Right">&#8677;</button>
            </div>
            <div class="doc-fmt-divider"></div>
            <div class="doc-fmt-group">
              <button class="doc-fmt-btn" data-cmd="insertUnorderedList" title="Bullet List">&#8226; &#8212;</button>
              <button class="doc-fmt-btn" data-cmd="insertOrderedList"   title="Numbered List">1. &#8212;</button>
            </div>
            <div class="doc-fmt-divider"></div>
            <div class="doc-merge-wrap">
              <button class="btn-secondary cb-btn doc-merge-btn">&#123;&#123;&nbsp;&#125;&#125; Merge Field &#9660;</button>
              <div class="doc-merge-menu" style="display:none">${mergeFieldsHTML}</div>
            </div>
          </div>

          <div class="doc-body" contenteditable="true" spellcheck="true"></div>

          <div class="doc-editor-footer">
            <span class="doc-placeholder-note">&#9432;&nbsp; Placeholder editor &mdash; replaces with Tiptap in full-stack build</span>
            <button class="btn-primary cb-btn" data-action="doc-save">Save</button>
          </div>

        </div>
      </div>
    </div>`;
  }

  /* ── Render list ─────────────────────────────────────────── */
  function _renderList(listEl, docs, typeFilter, searchText) {
    const q = searchText.toLowerCase();
    let pool = docs;
    if (typeFilter) pool = pool.filter(d => d.type === typeFilter);
    if (q)          pool = pool.filter(d =>
      d.title.toLowerCase().includes(q) || (d.type || '').toLowerCase().includes(q)
    );
    if (!pool.length) {
      listEl.innerHTML = '<div class="doc-list-empty">No templates found</div>';
      return;
    }
    listEl.innerHTML = pool.map(d => `
      <div class="doc-list-item" data-doc-id="${d.id}">
        <div class="doc-list-title">${d.title}</div>
        <div class="doc-list-meta">${_typeBadge(d.type)}<span class="doc-list-date">${d.dateModified || ''}</span></div>
      </div>
    `).join('');
  }

  /* ── Bind ────────────────────────────────────────────────── */
  function _bindDocuments(widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    let docs       = _loadDocs();
    let activeId   = null;
    let typeFilter = '';
    let searchText = '';

    const listEl    = el.querySelector('.doc-list');
    const emptyEl   = el.querySelector('.doc-empty-state');
    const editorEl  = el.querySelector('.doc-editor');
    const titleInp  = el.querySelector('.doc-title-inp');
    const typeSel   = el.querySelector('.doc-type-sel');
    const modLbl    = el.querySelector('.doc-mod-lbl');
    const bodyEl    = el.querySelector('.doc-body');
    const mergeMenu = el.querySelector('.doc-merge-menu');

    function render() {
      _renderList(listEl, docs, typeFilter, searchText);
      // Re-apply active highlight
      if (activeId) {
        const item = listEl.querySelector(`[data-doc-id="${activeId}"]`);
        if (item) item.classList.add('active');
      }
    }

    render();

    function openDoc(id) {
      const doc = docs.find(d => d.id === id);
      if (!doc) return;
      activeId          = id;
      titleInp.value    = doc.title;
      typeSel.value     = doc.type;
      modLbl.textContent = doc.dateModified ? 'Saved ' + doc.dateModified : '';
      bodyEl.innerHTML  = doc.content || '';
      emptyEl.style.display  = 'none';
      editorEl.style.display = 'flex';
      el.querySelectorAll('.doc-list-item').forEach(r =>
        r.classList.toggle('active', r.dataset.docId === id)
      );
    }

    function saveDoc() {
      if (!activeId) return;
      const idx     = docs.findIndex(d => d.id === activeId);
      const dateStr = _fmtToday();
      const updated = {
        ...(docs[idx] || {}),
        id:           activeId,
        title:        titleInp.value.trim() || 'Untitled',
        type:         typeSel.value,
        content:      bodyEl.innerHTML,
        dateModified: dateStr,
      };
      if (idx >= 0) docs[idx] = updated; else docs.push(updated);
      _saveDocs(docs);
      modLbl.textContent = 'Saved ' + dateStr;
      render();
    }

    function newDoc() {
      const id      = 'doc-' + Date.now();
      const dateStr = _fmtToday();
      docs.unshift({ id, title: 'New Template', type: 'Proposal', content: '', dateModified: dateStr });
      _saveDocs(docs);
      render();
      openDoc(id);
      setTimeout(() => { titleInp.focus(); titleInp.select(); }, 50);
    }

    // ── Doc list ──
    listEl.addEventListener('click', e => {
      const item = e.target.closest('.doc-list-item');
      if (item) openDoc(item.dataset.docId);
    });

    // ── Type filters ──
    el.querySelector('.doc-type-filters').addEventListener('click', e => {
      const btn = e.target.closest('.doc-filter');
      if (!btn) return;
      typeFilter = btn.dataset.type;
      el.querySelectorAll('.doc-filter').forEach(b => b.classList.toggle('active', b === btn));
      render();
    });

    // ── Search ──
    el.querySelector('.doc-search').addEventListener('input', function () {
      searchText = this.value;
      render();
    });

    // ── Formatting ──
    el.querySelector('.doc-fmt-bar').addEventListener('mousedown', e => {
      const btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      e.preventDefault(); // keep focus in editor
      document.execCommand(btn.dataset.cmd, false, null);
    });

    // ── Merge field dropdown ──
    el.querySelector('.doc-merge-btn').addEventListener('click', e => {
      e.stopPropagation();
      mergeMenu.style.display = mergeMenu.style.display === 'none' ? 'block' : 'none';
    });
    mergeMenu.addEventListener('click', e => {
      const item = e.target.closest('.doc-merge-item');
      if (!item) return;
      mergeMenu.style.display = 'none';
      bodyEl.focus();
      _insertAtCursor(item.dataset.field);
    });
    document.addEventListener('click', e => {
      if (!el.querySelector('.doc-merge-wrap')?.contains(e.target))
        mergeMenu.style.display = 'none';
    });

    // ── Panel divider drag ──
    const sidebar = el.querySelector('.doc-sidebar');
    el.querySelector('.doc-panel-divider').addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX, startW = sidebar.offsetWidth;
      document.body.classList.add('is-dragging');
      function onMove(e) { sidebar.style.width = Math.max(160, Math.min(320, startW + e.clientX - startX)) + 'px'; }
      function onUp()   { document.body.classList.remove('is-dragging'); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // ── Actions ──
    el.addEventListener('click', e => {
      if (e.target.closest('[data-action="doc-new"]'))  { newDoc(); return; }
      if (e.target.closest('[data-action="doc-save"]')) { saveDoc(); return; }
      if (e.target.closest('[data-action="cancel"]'))   { WidgetManager.close(widgetId); return; }
    });
  }

  /* ── Public ──────────────────────────────────────────────── */
  async function openDocuments() {
    await AppData.ready;
    const id = 'documents';
    if (WidgetManager.open(id, 'Documents', _docWidgetHTML(), {
      width: 980, height: 680, minWidth: 720, minHeight: 500, category: 'documents',
    }) !== false) _bindDocuments(id);
  }

  return { openDocuments };

})();
