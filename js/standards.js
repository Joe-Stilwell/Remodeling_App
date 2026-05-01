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

   ROW HEIGHT STANDARD — 22px for all interactive rows across all widgets:
     - List rows       (contact rows, estimate rows, WO rows, etc.)
     - Nav/filter rows (sidebar nav buttons, label filter buttons)
     - Grid rows       (costbook, price list, estimate line items)
     Use height:22px (not min-height) and padding:0 on vertical axis.
     Only override at the widget level when content genuinely needs more space.
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

   FORM WIDGET PADDING:
     widget-body default: padding 6px 12px 25px — left/right is 12px.
     Simple form widgets (autoHeight, no custom footer) use this automatically.
     Widgets with a custom scroll wrapper or fixed footer must strip widget-body
     padding with a :has() rule — otherwise padding doubles:
       .widget-body:has(.xxx-widget) { padding: 0; overflow: hidden; }
     Then manage padding in the inner scroll container (e.g. 10px 12px) so
     content still gets 12px left/right to match standard forms.

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
   Three sizes:
   LARGE  .btn-action / .btn-primary / .btn-secondary
            80px wide, 22px tall, 11px font.
            Use for: main entry form footers (New Contact, etc.)
   MEDIUM add .sp-btn to the above
            60px wide, 22px tall, 12px font.
            Use for: panel sub-widget footers (+ Person, + Property),
            and action buttons inside contact rows (+ Phone, + Email).
   SMALL  .btn-remove
            18×18 ghost ✕ — inline row-level removal only.

   Also:
   .btn-danger      Red outline, margin-right:auto (left-justifies).
                    Use for Delete / destructive actions in footers.
   .sp-btn-icon     Icon-only toolbar button: 26px wide, 14px font.

   BTN-SPACER RULE — spacer width must match button width in the same widget:
     Rows without a button use .btn-spacer to hold the column width.
     Default btn-spacer = 80px (matches LARGE buttons).
     In panel sub-widgets that use MEDIUM (sp-btn) buttons, override:
       <div class="btn-spacer" style="width:60px"></div>

   Three-state interaction (all action buttons):
     default  →  dark border
     :hover   →  brand-accent border
     :active  →  brand-orange border

   SPLIT SAVE BUTTON  (.split-btn)
     An 80px wrapper that looks like one button but has a left action
     (Save) and a right ▾ toggle that opens a fixed-position dropdown.
     Use on any entry form where post-save routing varies.

     HTML template:
       <div class="split-btn" style="margin-left:6px">
         <button class="btn-primary split-btn-main" data-action="save" disabled>Save</button><button class="btn-primary split-btn-toggle" data-action="save-menu" tabindex="-1" disabled>&#9660;</button>
         <div class="split-btn-dropdown" hidden>
           <button class="split-btn-item" data-action="save-new">Save &amp; New</button>
           <div class="split-btn-sep"></div>
           <button class="split-btn-item" data-action="save-event"     disabled>Save &#8212; Create Event</button>
           <button class="split-btn-item" data-action="save-workorder" disabled>Save &#8212; New Work Order</button>
           <button class="split-btn-item" data-action="save-estimate"  disabled>Save &#8212; New Estimate</button>
         </div>
       </div>

     JS wiring (add to bind function):
       const saveBtn     = el.querySelector('[data-action="save"]');
       const saveMenuBtn = el.querySelector('[data-action="save-menu"]');
       const saveDropdown = el.querySelector('.split-btn-dropdown');

       // Gate both halves on form validity
       function _updateSaveBtn() {
         const enabled = <your validity check>;
         saveBtn.disabled     = !enabled;
         saveMenuBtn.disabled = !enabled;
       }

       // Dropdown toggle — fixed position so it escapes widget overflow
       saveMenuBtn.addEventListener('click', e => {
         e.stopPropagation();
         if (!saveDropdown.hasAttribute('hidden')) { saveDropdown.setAttribute('hidden', ''); return; }
         const rect = saveMenuBtn.getBoundingClientRect();
         saveDropdown.removeAttribute('hidden');
         saveDropdown.style.top  = (rect.bottom + 2) + 'px';
         saveDropdown.style.left = (rect.right - saveDropdown.offsetWidth) + 'px';
       });

       // Close on outside click — self-cleans when widget is removed from DOM
       function _closeSaveMenu(e) {
         if (!document.contains(el)) { document.removeEventListener('click', _closeSaveMenu); return; }
         if (!el.querySelector('.split-btn').contains(e.target)) saveDropdown.setAttribute('hidden', '');
       }
       document.addEventListener('click', _closeSaveMenu);

       saveBtn.addEventListener('click', () => {
         document.removeEventListener('click', _closeSaveMenu);
         _saveRecord(el, widgetId, null);
       });
       el.querySelector('[data-action="save-new"]').addEventListener('click', () => {
         saveDropdown.setAttribute('hidden', '');
         document.removeEventListener('click', _closeSaveMenu);
         _saveRecord(el, widgetId, () => openNewWidget());
       });

     Notes:
     - Disabled dropdown items = modules not yet built; keep as placeholders.
     - Add data-action="save-workorder" / "save-event" / "save-estimate"
       handlers once those modules can receive a new record handoff.
     - The action row form-row needs: style="...;position:relative;overflow:visible"
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

   PANEL WIDGETS (side widgets / sub-forms)
   ─────────────────────────────────────────
   Panels are secondary widgets anchored to a parent entry form (e.g. + Person,
   + Property, + Company off New Contact). They share the parent's widget family.

   Opening a panel:
     WidgetManager.open(sideId, 'Title', html, {
       width:    425,
       minWidth: 360,
       autoHeight: true,
       top:   mainTop + 30,
       left:  mainLeft + el.offsetWidth,   // opens to the right of parent
       panel:    true,                     // marks as panel; hides minimize button
       parentId: widgetId,                 // links to parent; required for family behavior
     });

   Rules:
   - Pass parentId: always — this registers the panel in parent's panelIds array
   - Clicking a panel keeps is-active on the parent (WidgetManager handles this)
   - Panels are always z-indexed above their parent automatically
   - If the panel would overflow the workspace right edge, WidgetManager shifts
     the entire family (parent + sibling panels) left to fit

   BUTTON SIZES IN PANEL SUB-WIDGETS:
   - Footer Cancel/Save: use MEDIUM (btn-secondary sp-btn / btn-primary sp-btn)
   - contact-row action buttons (+ Phone, + Email, + Property): use MEDIUM (btn-action sp-btn)
   - btn-spacer on rows without a button: use style="width:60px" to align with MEDIUM buttons
   - The panel boilerplate footer below already reflects this.

   DATA ACCESS — AppData API
   ─────────────────────────
   NEVER access AppData.tables directly. Always use the wrapper methods.
   In the full build these become async API/DB calls — one layer to change.

   READ:
     AppData.get('DB_People')              // all records, always an array
     AppData.find('DB_People', id)         // by primary key (auto-detected)
     AppData.find('DB_Vendor', id, 'Company_ID')  // by explicit field

   WRITE (in-memory for prototype):
     AppData.insert('DB_People', record)   // add new record
     AppData.upsert('DB_People', record)   // insert or update by PK
     AppData.upsert('DB_Vendor', record, 'Company_ID')  // explicit PK field
     AppData.set('DB_Price_List', arr)     // replace entire table

   PRIMARY KEYS by table:
     DB_People → People_ID       DB_Company → Company_ID
     DB_Property → Property_ID   DB_Estimates → Estimate_ID
     DB_Vendor → Company_ID      DB_Costbook_Items → Item_ID
     DB_Price_List → Item_ID     DB_Workflow_Templates → Template_ID

   Junction tables (Link_*) have no single PK — use AppData.get() + .filter().

   ----------------------------------------------------------------

   WIDGET CHROME — HEADER INFO ZONE & STATUSBAR
   ─────────────────────────────────────────────
   Every non-panel widget gets these two zones automatically from WidgetManager.
   No per-widget HTML needed — just write to them from the bind function.

   HEADER INFO ZONE  (.widget-header-info)
     Sits between the title and the window controls. Empty by default (invisible).
     Use for warnings and reminders that are specific to this widget's data.

     // Show a warning pill:
     el.closest('.widget').querySelector('.widget-header-info').innerHTML =
       '<span class="widget-header-warning">⚠ Insurance expired</span>';

     // Clear it:
     el.closest('.widget').querySelector('.widget-header-info').innerHTML = '';

     CSS class  .widget-header-warning  — orange rounded pill, white bold text.
     Add multiple pills for multiple warnings; they right-align inside the zone.
     Right-aligned so warnings appear close to the controls, not near the title.

   STATUSBAR  (.widget-statusbar)
     The 25px dark-blue bar at the bottom of the widget (same color as header).
     Has two named slots:

     .widget-status-left   — record count, current context ("14 contacts")
     .widget-status-right  — transient state ("Saved", "Unsaved changes", sync status)

     // Write to the slots:
     el.closest('.widget').querySelector('.widget-status-left').textContent  = '14 contacts';
     el.closest('.widget').querySelector('.widget-status-right').textContent = 'Saved';

     // Clear a slot:
     el.closest('.widget').querySelector('.widget-status-right').textContent = '';

     Both slots are empty by default. Populate only what is relevant.
     Font-size 11px, white at 70% opacity — informational, not attention-seeking.

   SELF-CONTAINED LIST WIDGETS
     List widgets (phonebook-widget, vm-widget) use a :has() rule in input.css to
     strip widget-body padding and set overflow:hidden so content sits flush.
     Add a matching rule for each new self-contained list widget:
       .widget-body:has(.xx-widget) { padding: 0; overflow: hidden; }

   ----------------------------------------------------------------

   UI STATES — UIState + Toast
   ────────────────────────────
   UIState and Toast are global utilities defined in shell.js.

   UIState  — replaces the content of a container element.
     UIState.loading(el)                // shows a spinner
     UIState.empty(el, msg)             // shows a message string (use emoji)
     UIState.error(el, msg, onRetry)    // shows ⚠ msg + sub + Retry button

   Usage in a list bind function — show spinner on open, render on data ready:
     UIState.loading(listEl);
     AppData.ready
       .then(() => render())
       .catch(() => UIState.error(listEl, "Couldn't load your data", () => {
         UIState.loading(listEl);
         AppData.refresh().then(render).catch(() => UIState.error(listEl, "Couldn't load your data"));
       }));

   UIState in a render function — replace empty with contextual messages:
     if (!rows.length) {
       const msg = searchText
         ? `🔍 No results for "${searchText}"`
         : filters ? '🔍 No items match the current filters'
         : '📭 No items yet';
       UIState.empty(listEl, msg);
       return;
     }

   Dialog — modal overlay for confirms, alerts, and "coming soon" stubs.
     NEVER use browser alert() or confirm() — always use Dialog.
     await Dialog.alert('Something went wrong.', 'Optional Title')
     if (!await Dialog.confirm('Proceed?')) return;
     if (!await Dialog.confirmDelete('Delete "Item Name"?')) return;
     Dialog.stub('Duplicate Estimate');   // "Full Build Feature" notice
     Callers must be async. Use: element.addEventListener('click', async () => { ... })

   Toast  — activity bar notification, auto-dismisses in 3 s.
     Toast.show('✓ Saved')
     Toast.show('✓ Exported to CSV')
     Toast.show('✓ Sent to printer')
     Toast.show('⚠ Couldn\'t save — please try again', { warn: true })
     Toast.show('msg', { duration: 5000 })   // custom duration in ms

   Standard Toast messages:
     Save    : '✓ Saved'
     Delete  : '✓ Deleted'
     Export  : '✓ Exported to CSV'
     Print   : '✓ Sent to printer'
     Error   : '⚠ Couldn\'t save — please try again'  (with { warn: true })

   ----------------------------------------------------------------

   KEYBOARD SHORTCUTS
   ──────────────────
   These are wired globally in WidgetManager — no per-widget code needed.

   Tab / Shift+Tab
     Cycles through all focusable elements across the active parent widget AND
     all of its open panels as one continuous tab order. Wraps at each end.

   Ctrl+Q
     Cycles keyboard focus through the active widget's family:
       - If the active parent has open panels → cycles parent → panel 1 → panel 2
         → … → back to parent. Each step brings that widget visually to the front.
       - If no panels are open → cycles through all open non-panel widgets by z-index.
     Each step focuses the first focusable field in the target widget.
     No per-widget code needed — WidgetManager handles all families automatically.

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
