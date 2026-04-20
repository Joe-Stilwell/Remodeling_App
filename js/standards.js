/* ================================================================
   WIDGET STANDARDS REFERENCE
   standards.js — read this before building any new widget.

   This is the authoritative source for shared CSS classes,
   WidgetManager options, and copy-paste HTML boilerplate.
   Never re-invent a class that already exists here.
   ================================================================ */


/* ----------------------------------------------------------------
   NAMING CONVENTIONS
   ----------------------------------------------------------------
   sp-   Shared infrastructure — toolbars, buttons, grid layout,
         mode controls. Every widget gets these automatically.
         NEVER duplicate an sp- class with a widget-specific one.

   cb-   Costbook widget
   pl-   Price List widget
   est-  Estimate widget
   crm-  CRM / contact widgets (implicit, rarely prefixed)

   New widget?  Pick a two-letter prefix and add it here.
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   DESIGN TOKENS  (var(--token-name) in CSS)
   ----------------------------------------------------------------
   Colors:
     --color-brand-primary      #005A87   headers, borders, labels
     --color-brand-accent       #0096C7   hover, focus states
     --color-brand-tint         #EBF4FA   widget body bg, label bg
     --color-brand-orange       #F97316   active/click state
     --color-ink-dark           #1E293B   primary text
     --color-ink-mid            #64748B   secondary / placeholder text
     --color-ink-light          #FFFFFF   text on dark bg
     --color-border             #CBD5E1   standard input border
     --color-border-slate       #94A3B8   widget chrome border
     --color-surface-white      #FFFFFF   input background
     --color-danger             #DC2626   destructive actions

   Sizing:
     --btn-col: 80px             standard button + spacer width
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   FIELD BORDER STANDARD
   ----------------------------------------------------------------
   Every white-background field sitting on the brand-tint widget
   background MUST have a visible border on all sides:

     border: 1px solid var(--color-border-slate)   ← #CBD5E1

   This applies to: form-input, form-select, form-textarea, and any
   custom input (number fields, display boxes, inline editors).
   --color-border is an alias for --color-border-slate — both work.
   NEVER use background color alone to define a field boundary.
   ----------------------------------------------------------------

   FORM FIELD STANDARDS
   ----------------------------------------------------------------
   These classes live in input.css and apply to ALL widgets.
   The 32px row pitch is automatic — do not add margins between rows.

   CONTAINER HIERARCHY:
     .widget-form          flex column, gap:8px  (outermost form wrapper)
       .form-section       section header rule
       .form-row           flex row, gap:6px, align-items:flex-start
         .form-group       position:relative; padding-top:10px
           .form-label     absolute top:0 left:1px  ← floats in 10px slot
           .form-input     height:22px
           .form-select    height:22px
           .form-textarea  min-height:22px, resizable

   ROW PITCH MATH:
     form-group padding-top  10px  (the floating label lives here)
     form-input / form-select 22px
     ─────────────────────────────
     bottom-to-bottom pitch  32px  ← automatic, no extra margins needed

   FIELD WIDTH HELPERS  (add to .form-group)
     .f-grow    flex:1            fills remaining space (default)
     .f-md      flex:0 0 100px    first name, short text fields
     .f-sm      flex:0 0  82px    type selectors, zip code
     .f-unit    flex:0 0  80px    unit / suite / PO box
     .f-title   flex:0 0  62px    title dropdowns (Mr./Mrs.)
     .f-ext     flex:0 0  40px    phone extension
     .f-state   flex:0 0  30px    state abbreviation
     .f-cc      flex:0 0  36px    country code (+1)
     inline     style="flex:0 0 Npx"  (OK for one-off widths)

   CENTERED LABEL (narrow fields like State):
     Add .form-label-center to the .form-label element.

   SECTION DIVIDERS:
     .form-section    colored header rule — 11px bold, brand-primary
                      text + 2px bottom border. Use for named sections.
     .form-divider    thin hr — 1px border-slate. Use within a section
                      to separate logical groups without a heading.

   BUTTONS IN FORM ROWS:
     Buttons in a .form-row need margin-top:10px to align with input
     bottoms. This is automatic when using these classes:
       .btn-action / .btn-primary / .btn-secondary  placed directly in
       .form-row (the rule form-row > .btn-action applies automatically)
     .btn-spacer    invisible 80px spacer — use on rows that don't have
                    a button, to keep columns aligned with rows that do.
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   BUTTON TYPES
   ----------------------------------------------------------------
   .btn-action      Standard: tint bg, dark border, 80px, 22px tall.
   .btn-primary     Identical — use for the main CTA.
   .btn-secondary   Identical — use for secondary actions.
   .btn-danger      Red outline, margin-right:auto (left-justifies).
                    Use for Delete / destructive actions in footers.
   .btn-remove      18×18 ghost ✕ — inline row-level removal.
   .sp-btn          Toolbar variant: 22px tall, 12px font, auto width.
   .sp-btn-icon     Toolbar icon button: 26px wide, 14px font.

   Three-state interaction (all action buttons):
     default  →  dark border
     :hover   →  brand-accent border
     :active  →  brand-orange border
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   WIDGET FOOTER
   ----------------------------------------------------------------
   .widget-footer    sticky bottom, brand-tint bg, border-top.
                     Flex row, justify-content:flex-end, gap:8px.
                     Place Cancel first, primary action last.
                     A .btn-danger auto-floats left via margin-right:auto.

   Standard footer pattern:
     <div class="widget-footer">
       <button class="btn-danger"     data-action="delete">Delete</button>  ← left
       <button class="btn-secondary sp-btn" data-action="cancel">Cancel</button>
       <button class="btn-primary   sp-btn" data-action="save">Save</button>
     </div>

   Omit .btn-danger if no destructive action exists.
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   TOOLBAR  (grid and document widgets)
   ----------------------------------------------------------------
   .sp-toolbar      h:34px, flex, gap:6px, padding:0 8px, tint bg,
                    border-bottom. Always the first child of the widget root.
   .sp-btn          Text button for toolbar (22px, 12px, auto width).
   .sp-btn-icon     Icon-only toolbar button (26px wide).
   .sp-normal-ctrl  Visible in normal mode; hidden in edit mode.
   .sp-edit-ctrl    Hidden by default; shown in edit mode.

   To push items to the right side of the toolbar:
     <span style="margin-left:auto"></span>
     ... right-side buttons follow ...
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   GRID LAYOUT  (toolbar + nav + content)
   ----------------------------------------------------------------
   The widget root element (e.g. .xxx-widget) must be:
     display:flex; flex-direction:column; height:100%

   .sp-toolbar      toolbar strip (flex-shrink:0)
   .sp-body         content row below toolbar (flex:1, overflow:hidden)
     .sp-nav        left nav panel (flex-shrink:0, widget CSS sets width)
     .sp-divider    5px drag handle between nav and main
     .sp-main       right content area (flex:1, flex col, overflow:hidden)

   The widget-body must also be stripped of default padding:
     .widget-body:has(.xxx-widget) { padding:0; overflow:hidden; }
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   MODE SWITCHING  (edit vs. normal mode in grid widgets)
   ----------------------------------------------------------------
   1. Toggle a mode class on the widget root element:
        el.classList.toggle('xxx-edit-mode')

   2. Register the class in BOTH universal rules in input.css
      (search "sp-edit-ctrl" to find them):
        .xxx-edit-mode .sp-edit-ctrl   { display: inline-flex !important; }
        .xxx-edit-mode .sp-normal-ctrl { display: none !important; }

   3. Mark toolbar buttons accordingly:
        Normal-only:  class="btn-action sp-btn sp-normal-ctrl"
        Edit-only:    class="btn-action sp-btn sp-edit-ctrl"
        Always shown: class="btn-action sp-btn"
   ---------------------------------------------------------------- */


/* ----------------------------------------------------------------
   WIDGET CATEGORIES
   ----------------------------------------------------------------
   Pass category in WidgetManager.open() options.
   Controls the widget header color and dock pill color.

     'contact'    →  teal/green
     'workorder'  →  orange
     'estimating' →  blue
   ---------------------------------------------------------------- */


/* ================================================================
   BOILERPLATE 1 — Form Widget  (entry / edit / settings)
   Use for: New record entry, edit forms, settings popups.
   Examples: New Contact, Edit Person, Estimate Settings.
   ================================================================ */

function openXxx() {
  const id = 'xxx-' + Date.now();
  if (WidgetManager.open(id, 'Widget Title', _xxxHTML(), {
    width:         425,       // set from widest form-row content
    minWidth:      400,
    autoHeight:    true,      // snaps height to content — no manual height
    autoMinHeight: 0.5,       // minimum: 50% of viewport
    category:      'contact', // 'contact' | 'workorder' | 'estimating'
    centeredOn:    parentWidgetId, // omit if no parent; centers child over parent
  }) !== false) {
    _bindXxx(id);
  }
}

function _xxxHTML() {
  return `
    <div class="widget-form">

      <div class="form-section">Section One</div>

      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Full Name</label>
          <input class="form-input" data-field="name" placeholder="…">
        </div>
        <div class="form-group f-sm">
          <label class="form-label">Type</label>
          <select class="form-select" data-field="type">
            <option value="">— Select —</option>
          </select>
        </div>
        <button class="btn-action sp-btn" data-action="lookup">Look Up</button>
      </div>

      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" data-field="notes" rows="3"></textarea>
        </div>
        <div class="btn-spacer"></div>
      </div>

      <div class="form-section">Section Two</div>

      <div class="form-row">
        <div class="form-group f-md">
          <label class="form-label">First Name</label>
          <input class="form-input" data-field="first">
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Last Name</label>
          <input class="form-input" data-field="last">
        </div>
        <div class="btn-spacer"></div>
      </div>

      <div class="widget-footer">
        <button class="btn-secondary sp-btn" data-action="cancel">Cancel</button>
        <button class="btn-primary   sp-btn" data-action="save">Save</button>
      </div>

    </div>
  `;
}

function _bindXxx(widgetId) {
  const el = document.getElementById(widgetId);
  const f  = key => el.querySelector(`[data-field="${key}"]`);

  el.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'cancel') WidgetManager.close(widgetId);
    if (action === 'save') {
      const data = {
        name:  f('name').value.trim(),
        type:  f('type').value,
        notes: f('notes').value.trim(),
      };
      // validate → persist → close or show errors
    }
  });
}


/* ================================================================
   BOILERPLATE 2 — Panel Widget  (side panel off a parent widget)
   Use for: sub-forms that open alongside an existing widget.
   Examples: Add Person, Add Address, Add Company.
   ================================================================ */

function openXxxPanel(parentWidgetId, parentEl, triggerBtn) {
  triggerBtn.disabled = true;
  const sideId   = 'xxx-panel-' + Date.now();
  const mainLeft = parseInt(parentEl.style.left) || 0;
  const mainTop  = parseInt(parentEl.style.top)  || 0;

  const opened = WidgetManager.open(sideId, 'Panel Title', _xxxPanelHTML(), {
    width:      425,
    minWidth:   360,
    autoHeight: true,
    top:        mainTop  + 30,
    left:       mainLeft + parentEl.offsetWidth,
    panel:      true,         // no dock entry, attaches visually to parent
    parentId:   parentWidgetId,
  });

  if (opened === false) { triggerBtn.disabled = false; return; }

  const panelEl = document.getElementById(sideId);
  panelEl.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'cancel') {
      triggerBtn.disabled = false;
      WidgetManager.close(sideId);
    }
    if (action === 'save') {
      // persist → re-enable button → close panel
      triggerBtn.disabled = false;
      WidgetManager.close(sideId);
    }
  });
}

function _xxxPanelHTML() {
  return `
    <div class="widget-form">

      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Field Label</label>
          <input class="form-input" data-field="value">
        </div>
      </div>

      <div class="widget-footer">
        <button class="btn-secondary sp-btn" data-action="cancel">Cancel</button>
        <button class="btn-primary   sp-btn" data-action="save">Add</button>
      </div>

    </div>
  `;
}


/* ================================================================
   BOILERPLATE 3 — Grid / Toolbar Widget  (data grid with toolbar)
   Use for: browsable data tables with optional left nav.
   Examples: Costbook, Price List.

   REQUIRED CSS in input.css (two lines):
     .xxx-widget { display:flex; flex-direction:column; height:100%; }
     .widget-body:has(.xxx-widget) { padding:0; overflow:hidden; }

   REQUIRED CSS in input.css (mode switching — add to existing rules):
     .xxx-edit-mode .sp-edit-ctrl   { display: inline-flex !important; }
     .xxx-edit-mode .sp-normal-ctrl { display: none !important; }
   ================================================================ */

function openXxxGrid() {
  const id = 'xxx-' + Date.now();
  if (WidgetManager.open(id, 'Widget Title', _xxxGridHTML(), {
    width:     900,
    height:    580,
    minWidth:  600,
    minHeight: 400,
    category:  'estimating',
  }) !== false) {
    _bindXxxGrid(id);
  }
}

function _xxxGridHTML() {
  return `
    <div class="xxx-widget">

      <div class="sp-toolbar">
        <button class="btn-action sp-btn sp-normal-ctrl" data-action="new-item">+ New</button>
        <button class="btn-action sp-btn sp-normal-ctrl" data-action="edit-mode">Edit Layout</button>
        <button class="btn-action sp-btn sp-edit-ctrl"   data-action="save-layout">Save Layout</button>
        <button class="btn-action sp-btn sp-edit-ctrl"   data-action="cancel-edit">Cancel</button>
        <span style="margin-left:auto"></span>
        <button class="btn-action sp-btn-icon sp-btn" data-action="refresh" title="Refresh">↻</button>
      </div>

      <div class="sp-body">

        <div class="sp-nav xxx-nav">
          <!-- category / division tree; widget CSS sets width -->
        </div>
        <div class="sp-divider"></div>

        <div class="sp-main">
          <!-- grid rows rendered here by JS -->
        </div>

      </div>

    </div>
  `;
}

function _bindXxxGrid(widgetId) {
  const el = document.getElementById(widgetId);

  el.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'edit-mode')    el.classList.add('xxx-edit-mode');
    if (action === 'cancel-edit')  el.classList.remove('xxx-edit-mode');
    if (action === 'save-layout')  { /* persist layout */ el.classList.remove('xxx-edit-mode'); }
    if (action === 'refresh')      { /* reload data */ }
    if (action === 'new-item')     { /* open edit form */ }
  });
}


/* ================================================================
   FIELD SNIPPETS — copy-paste building blocks
   ================================================================ */

/*
  TEXT INPUT
  ──────────
  <div class="form-group f-grow">
    <label class="form-label">Label</label>
    <input class="form-input" data-field="name" placeholder="…">
  </div>

  SELECT / DROPDOWN
  ─────────────────
  <div class="form-group f-sm">
    <label class="form-label">Type</label>
    <select class="form-select" data-field="type">
      <option value="">— Select —</option>
    </select>
  </div>

  TEXTAREA
  ────────
  <div class="form-group f-grow">
    <label class="form-label">Notes</label>
    <textarea class="form-textarea" data-field="notes" rows="3"></textarea>
  </div>

  NUMBER  (spinners are suppressed globally inside .widget-form)
  ──────────────────────────────────────────────────────────────
  <div class="form-group f-ext">
    <label class="form-label">Qty</label>
    <input class="form-input" type="number" data-field="qty" step="0.01" placeholder="0">
  </div>

  ROW WITH ACTION BUTTON
  ──────────────────────
  <div class="form-row">
    <div class="form-group f-grow">
      <label class="form-label">Label</label>
      <input class="form-input" data-field="value">
    </div>
    <button class="btn-action sp-btn" data-action="lookup">Look Up</button>
  </div>

  ROW WITHOUT BUTTON  (use .btn-spacer to keep columns aligned)
  ─────────────────────────────────────────────────────────────
  <div class="form-row">
    <div class="form-group f-grow">
      <label class="form-label">Label</label>
      <input class="form-input" data-field="value">
    </div>
    <div class="btn-spacer"></div>
  </div>

  SECTION HEADER  (colored rule with text)
  ────────────────────────────────────────
  <div class="form-section">Section Name</div>

  THIN SEPARATOR  (within a section, no heading)
  ───────────────────────────────────────────────
  <hr class="form-divider">

  RADIO GROUP  (horizontal, inside a field box)
  ─────────────────────────────────────────────
  <div class="form-group f-grow">
    <label class="form-label">Preference</label>
    <div class="comm-pref-options">
      <label class="comm-pref-option">
        <input type="radio" name="pref" value="a"> Option A
      </label>
      <label class="comm-pref-option">
        <input type="radio" name="pref" value="b"> Option B
      </label>
    </div>
  </div>

  FOOTER WITH DELETE
  ──────────────────
  <div class="widget-footer">
    <button class="btn-danger"           data-action="delete">Delete</button>
    <button class="btn-secondary sp-btn" data-action="cancel">Cancel</button>
    <button class="btn-primary   sp-btn" data-action="save">Save</button>
  </div>
*/


/* ================================================================
   LIST WIDGET STANDARDS
   Reference: Estimate List (el-), Phone Book (pb-)
   ================================================================

   COLUMN HEADERS
   ──────────────
   - Background:  var(--color-brand-tint)
   - Bottom border: 2px solid var(--color-border-slate)
   - Right border: 1px solid var(--color-border-slate) on all but last column
     (.xx-hdr:not(:last-child) { border-right: 1px solid var(--color-border-slate); })
   - Text: var(--color-brand-primary), 10px, 700, uppercase, 0.06em tracking
   - Hover text: var(--color-brand-dark)
   - Sort indicator: ↑ / ↓ in a <span class="xx-sort-arrow"> (appended by JS)
   - Resize handle: <div class="xx-col-resize"> as last child of each resizable header
     (position:absolute, right:0, top:0, bottom:0, width:5px, cursor:col-resize)
   - position:relative required on the header cell for the handle to position correctly

   RESIZABLE COLUMNS
   ─────────────────
   - Define CSS variables on the widget CONTENT element (e.g. .xx-widget), NOT the
     outer widget container. The content element has its own stylesheet declaration
     that overrides inherited values — always target it directly:
       const xxContent = el.querySelector('.xx-widget');
       xxContent.style.setProperty(varName, w + 'px');
   - Use var() in grid-template-columns on both the header row and data rows
   - Load saved widths from localStorage on bind; persist on mouseup
   - Minimum column width: 50px; last column has no handle (stretches to fill)
   - data-col-var="--xx-w-colname" attribute on each resizable header drives the handler

   SEARCH BOX
   ──────────
   - Use class: sp-search  (defined in shared CSS)
   - Height: 24px, border: 1px solid var(--color-border-slate), border-radius: 4px
   - Focus: border-color: var(--color-brand-primary)

   TOOLBAR
   ───────
   - Background: var(--color-brand-tint)  ← NOT white
   - Order (left to right): + New [Record] | sp-search | Filter ▾ | [spacer] | Show Archived | Group Select icon

   ROW STANDARD
   ────────────
   - Height: 32px, border-bottom: 1px solid #f0f4f8
   - Hover: background var(--color-brand-tint)
   - Archived rows: opacity 0.55

   CLICK / DOUBLE-CLICK PATTERN  (required for all list widgets)
   ─────────────────────────────
   Single click → toggle summary card (open if closed, close if open)
   Double click → open the record's primary widget directly, no card side-effect
   Implementation: 220ms timer on click; dblclick cancels the timer.

     let _clickTimer = null;
     listEl.addEventListener('click', e => {
       const row = e.target.closest('.xx-row');
       if (!row) return;
       const rowId = row.dataset.id;          // capture ID at click time
       clearTimeout(_clickTimer);
       _clickTimer = setTimeout(() => {
         _clickTimer = null;
         const cardId = 'xx-summary-' + rowId;
         if (WidgetManager.isOpen(cardId)) { WidgetManager.close(cardId); return; }
         openXxSummary(findRecord(rowId), { left: ..., top: ... });
       }, 220);
     });
     listEl.addEventListener('dblclick', e => {
       clearTimeout(_clickTimer);
       _clickTimer = null;
       const row = e.target.closest('.xx-row');
       if (!row) return;
       openXxRecord(row.dataset.id);
     });

   STATUS BADGES  (.el-badge)
   ───────────────────────────
   - Active:   green bg #d4edda / text #155724
   - Draft:    amber bg #fff3cd / text #856404
   - Archived: gray  bg #e2e3e5 / text #495057
   - Font: 10px, 700, uppercase, 0.04em tracking, border-radius 10px, padding 2px 7px

   GROUP SELECT MODE
   ─────────────────
   - Toggle via .is-group-select class on the widget CONTENT element (not outer container)
   - Adds a 24px checkbox column (first) to both header and row grid templates
   - Action bar appears at bottom: count | Archive | Delete | Cancel
   - Checkbox class: xx-row-chk

   SUMMARY CARD
   ────────────
   - noDock: true, autoHeight: true + WidgetManager.resizeToContent(id)
   - Width: 300px
   - Position: right of the list widget, clamped to workspace bounds:
       const ws    = document.querySelector('.workspace');   // NOT getElementById
       const wRect = el.getBoundingClientRect();
       const wsRect= ws.getBoundingClientRect();
       const cardW = 300;
       opts.left = Math.max(0, Math.min(Math.round(wRect.right - wsRect.left + 8),
                                        ws.clientWidth - cardW - 8));
       opts.top  = parseInt(el.style.top) || 0;
   - Toggle: check WidgetManager.isOpen(cardId) before opening; close if already open
   - Buttons at bottom: Open [Record] | Edit/Settings | Archive | Delete

   BOILERPLATE — LIST WIDGET
   ──────────────────────────
  <div class="sp-widget xx-widget">
    <div class="sp-toolbar xx-toolbar">
      <button class="btn-primary sp-btn" data-action="xx-new">+ New Record</button>
      <input class="sp-search xx-search" type="search" placeholder="Search…">
      <button class="btn-secondary sp-btn" data-action="xx-filter">Filter ▾</button>
      <div class="xx-toolbar-spacer" style="flex:1"></div>
      <label class="sp-normal-ctrl">
        <input type="checkbox" data-action="xx-show-archived"> Show Archived
      </label>
      <button class="btn-secondary sp-btn sp-btn-icon" data-action="xx-group-select" title="Group select">&#9776;</button>
    </div>
    <div class="xx-col-hdrs">
      <div class="xx-hdr xx-col-name" data-sort="name" data-col-var="--xx-w-name">
        NAME <span class="xx-sort-arrow">↑</span><div class="xx-col-resize"></div>
      </div>
      <!-- more columns... last column has no resize handle, no data-col-var -->
      <div class="xx-hdr xx-col-modified" data-sort="dateModified">MODIFIED <span class="xx-sort-arrow"></span></div>
    </div>
    <div class="xx-list-wrap" style="flex:1;overflow-y:auto">
      <div class="xx-list"><!-- rows rendered by JS --></div>
    </div>
    <div class="xx-action-bar" style="display:none">
      <span class="xx-sel-count">0 selected</span>
      <button class="btn-secondary sp-btn" data-action="xx-archive-sel">Archive Selected</button>
      <button class="btn-secondary sp-btn" data-action="xx-delete-sel">Delete Selected</button>
      <button class="btn-secondary sp-btn" data-action="xx-group-cancel">Cancel</button>
    </div>
  </div>
*/
