/* --- CRM Module --- */
const CRM = (function () {

  /* ── Storage keys ─────────────────────────────────────────── */
  const KEYS = {
    people:     'crm_people',
    properties: 'crm_properties',
    links:      'crm_links',
    lists:      'crm_lists',
  };

  /* ── Default dropdown lists ───────────────────────────────── */
  const DEFAULT_LISTS = {
    leadSources:   ['Referral', 'Repeat Client', 'Online / Google', 'Yard Sign',
                    'Social Media', 'Home Show', 'Nextdoor', 'Angi / HomeAdvisor', 'Other'],
    phoneTypes:    ['Mobile', 'Home', 'Work', 'Other'],
    emailTypes:    ['Personal', 'Work', 'Other'],
    propertyTypes: ['Single Family', 'Condominium', 'Townhouse', 'Multi-Family'],
    propertyUses:  ['Primary Residence', 'Vacation Home', 'Rental Property',
                    'Main Office', 'Warehouse'],
  };

  /* ── Data helpers ─────────────────────────────────────────── */
  function _getList(key) {
    const saved = JSON.parse(localStorage.getItem(KEYS.lists) || '{}');
    return saved[key] || DEFAULT_LISTS[key] || [];
  }

  function _generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  function _getData(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  function _setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ── Input formatters ────────────────────────────────────── */
  function _formatPhone(e) {
    const digits = e.target.value.replace(/\D/g, '').substring(0, 10);
    let val = '';
    if (digits.length > 6)      val = '(' + digits.substring(0,3) + ') ' + digits.substring(3,6) + '-' + digits.substring(6);
    else if (digits.length > 3) val = '(' + digits.substring(0,3) + ') ' + digits.substring(3);
    else if (digits.length)     val = '(' + digits;
    e.target.value = val;
  }

  function _formatZip(e) {
    const digits = e.target.value.replace(/\D/g, '').substring(0, 9);
    e.target.value = digits.length > 5 ? digits.substring(0,5) + '-' + digits.substring(5) : digits;
  }

  function _formatState(e) {
    e.target.value = e.target.value.toUpperCase();
  }

  function _formatExt(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
  }

  function _formatEmail(e) {
    e.target.value = e.target.value.toLowerCase();
  }

  function _formatNameField(e) {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
    e.target.setSelectionRange(pos, pos);
  }

  function _formatCC(e) {
    let val = e.target.value.replace(/[^\d+]/g, '');
    if (val && !val.startsWith('+')) val = '+' + val;
    e.target.value = val;
  }

  /* ── Build select options HTML ────────────────────────────── */
  function _options(listKey, defaultFirst = false, selectedValue = '') {
    const items = _getList(listKey);
    const blank = defaultFirst ? '' : '<option value="">-- Select --</option>';
    return blank + items.map(i => `<option${i === selectedValue ? ' selected' : ''}>${i}</option>`).join('');
  }

  /* ── Phone row HTML (shared by main form and person widget) ── */
  function _phoneRowHTML(idx, includeAddBtn, data = {}) {
    const cc  = data.cc     || '+1';
    const num = data.number || '';
    const ext = data.ext    || '';
    const typ = data.type   || '';
    return `
      <div class="contact-row">
        <div class="form-group f-cc">
          <label class="form-label">CC</label>
          <input class="form-input" type="text" data-phone-cc data-index="${idx}"
                 value="${cc}" maxlength="5" autocomplete="off">
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Phone</label>
          <input class="form-input" type="tel" placeholder=""
                 data-phone data-index="${idx}" value="${num}" autocomplete="off">
        </div>
        <div class="form-group f-ext">
          <label class="form-label">Ext.</label>
          <input class="form-input" type="text" data-phone-ext data-index="${idx}"
                 value="${ext}" maxlength="6" autocomplete="off">
        </div>
        <div class="form-group f-sm">
          <label class="form-label">Type</label>
          <select class="form-select" data-phone-type data-index="${idx}">
            ${_options('phoneTypes', true, typ)}
          </select>
        </div>
        ${includeAddBtn
          ? `<button class="btn-action" data-action="add-phone" tabindex="-1" disabled>+ Phone</button>`
          : `<div class="btn-remove-col"><button class="btn-remove" type="button" title="Remove">&#10005;</button></div>`}
      </div>
    `;
  }

  /* ── Email row HTML (shared by main form and person widget) ── */
  function _emailRowHTML(idx, includeAddBtn, data = {}) {
    const addr = data.email || '';
    const typ  = data.type  || '';
    return `
      <div class="contact-row">
        <div class="form-group f-grow">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" placeholder=""
                 data-email data-index="${idx}" value="${addr}" autocomplete="off">
        </div>
        <div class="form-group f-sm">
          <label class="form-label">Type</label>
          <select class="form-select" data-email-type data-index="${idx}">
            ${_options('emailTypes', true, typ)}
          </select>
        </div>
        ${includeAddBtn
          ? `<button class="btn-action" data-action="add-email" tabindex="-1" disabled>+ Email</button>`
          : `<div class="btn-remove-col"><button class="btn-remove" type="button" title="Remove">&#10005;</button></div>`}
      </div>
    `;
  }

  /* ── Reusable notes row HTML ─────────────────────────────── */
  function _notesRowHTML(dataAttr, label, { spacer = true, value = '' } = {}) {
    return `
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">${label}</label>
          <textarea class="form-textarea" ${dataAttr} maxlength="2000" placeholder="">${value}</textarea>
        </div>
        ${spacer ? '<div class="btn-spacer"></div>' : ''}
      </div>
    `;
  }

  /* ── Grow widget when a notes textarea is manually resized ── */
  function _bindAutoExpand(textarea, _maxRows, widgetId) {
    if (!textarea || !widgetId) return;

    // Show internal scrollbar when typed content exceeds the visible area
    textarea.addEventListener('input', function () {
      this.style.overflowY = this.scrollHeight > this.clientHeight ? 'auto' : 'hidden';
    });

    // Grow widget live as textarea is dragged — one rAF per frame maximum
    let rafPending = false;
    const observer = new ResizeObserver(() => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; WidgetManager.resizeToContent(widgetId); });
    });
    observer.observe(textarea);

    // Definitive fallback: mouseup fires when drag handle is released
    let lastH = textarea.offsetHeight;
    document.addEventListener('mouseup', () => {
      const h = textarea.offsetHeight;
      if (h !== lastH) { lastH = h; WidgetManager.resizeToContent(widgetId); }
    });
  }

  /* ── Reusable phone/email bind logic ──────────────────────── */
  function _bindPhoneEmailRows(containerEl, phoneContainerSel, emailContainerSel, widgetId, initialPhoneCount = 1, initialEmailCount = 1) {
    let phoneCount = initialPhoneCount;
    let emailCount = initialEmailCount;

    const addPhoneBtn = containerEl.querySelector('[data-action="add-phone"]');
    const addEmailBtn = containerEl.querySelector('[data-action="add-email"]');

    function _updatePhoneBtn() {
      if (!addPhoneBtn) return;
      const inputs = containerEl.querySelectorAll('input[data-phone]');
      if (inputs.length >= 3) { addPhoneBtn.disabled = true; return; }
      const last = inputs[inputs.length - 1];
      addPhoneBtn.disabled = !last || last.value.trim() === '';
    }

    function _updateEmailBtn() {
      if (!addEmailBtn) return;
      const inputs = containerEl.querySelectorAll('input[data-email]');
      if (inputs.length >= 3) { addEmailBtn.disabled = true; return; }
      const last = inputs[inputs.length - 1];
      addEmailBtn.disabled = !last || last.value.trim() === '';
    }

    const phoneInput0 = containerEl.querySelector('input[data-phone][data-index="0"]');
    phoneInput0?.addEventListener('input',  _updatePhoneBtn);
    phoneInput0?.addEventListener('change', _updatePhoneBtn);

    const emailInput0 = containerEl.querySelector('input[data-email][data-index="0"]');
    emailInput0?.addEventListener('input',   _updateEmailBtn);
    emailInput0?.addEventListener('change',  _updateEmailBtn);
    emailInput0?.addEventListener('focusout', _updateEmailBtn);

    phoneInput0?.addEventListener('focusout', _updatePhoneBtn);

    addPhoneBtn?.addEventListener('click', function () {
      const idx = phoneCount++;
      const row = document.createElement('div');
      row.innerHTML = _phoneRowHTML(idx, false);
      const rowEl = row.firstElementChild;
      rowEl.querySelector('.btn-remove').addEventListener('click', () => {
        rowEl.remove();
        phoneCount--;
        _updatePhoneBtn();
        if (widgetId) WidgetManager.resizeToContent(widgetId);
      });
      const phoneInput = rowEl.querySelector('input[data-phone]');
      phoneInput.addEventListener('input', _updatePhoneBtn);
      phoneInput.addEventListener('input', _formatPhone);
      rowEl.querySelector('input[data-phone-cc]').addEventListener('input', _formatCC);
      rowEl.querySelector('input[data-phone-ext]').addEventListener('input', _formatExt);
      containerEl.querySelector(phoneContainerSel).appendChild(rowEl);
      _updatePhoneBtn();
      phoneInput.focus();
    });

    addEmailBtn?.addEventListener('click', function () {
      const idx = emailCount++;
      const row = document.createElement('div');
      row.innerHTML = _emailRowHTML(idx, false);
      const rowEl = row.firstElementChild;
      rowEl.querySelector('.btn-remove').addEventListener('click', () => {
        rowEl.remove();
        emailCount--;
        _updateEmailBtn();
        if (widgetId) WidgetManager.resizeToContent(widgetId);
      });
      const emailInput = rowEl.querySelector('input[data-email]');
      emailInput.addEventListener('input', _updateEmailBtn);
      emailInput.addEventListener('input', _formatEmail);
      containerEl.querySelector(emailContainerSel).appendChild(rowEl);
      _updateEmailBtn();
      emailInput.focus();
    });

    // Initial state check — enables buttons if pre-filled rows are already valid
    _updatePhoneBtn();
    _updateEmailBtn();
  }

  /* ── Collect phones/emails from a container element ──────── */
  function _collectPhones(containerEl) {
    const phones = [];
    containerEl.querySelectorAll('input[data-phone]').forEach(input => {
      if (!input.value.trim()) return;
      const idx  = input.dataset.index;
      const type = containerEl.querySelector(`[data-phone-type][data-index="${idx}"]`)?.value || 'Mobile';
      const cc   = containerEl.querySelector(`[data-phone-cc][data-index="${idx}"]`)?.value.trim() || '+1';
      const ext  = containerEl.querySelector(`[data-phone-ext][data-index="${idx}"]`)?.value.trim() || '';
      phones.push({ number: input.value.trim(), countryCode: cc, ext, type, preferred: phones.length === 0 });
    });
    return phones;
  }

  function _collectEmails(containerEl) {
    const emails = [];
    containerEl.querySelectorAll('input[data-email]').forEach(input => {
      if (!input.value.trim()) return;
      const idx  = input.dataset.index;
      const type = containerEl.querySelector(`[data-email-type][data-index="${idx}"]`)?.value || 'Personal';
      emails.push({ address: input.value.trim(), type, preferred: emails.length === 0 });
    });
    return emails;
  }

  /* ── Address block HTML ───────────────────────────────────── */
  function _addressBlockHTML(index, prop = null) {
    const isFirst = index === 0;
    const street1  = prop?.Address_Street_1 || '';
    const street2  = prop?.Address_Street_2 || '';
    const city     = prop?.Address_City     || '';
    const state    = prop?.Address_State    || '';
    const zip      = prop?.Address_Zip      || '';
    const notes    = prop?.Address_Notes    || '';
    const propType = prop?.Property_Type    || '';
    const propUse  = prop?.Property_Use     || '';
    const propId   = prop?.Property_ID      || '';
    return `
      <div data-address-block data-addr-index="${index}" ${propId ? `data-existing-prop-id="${propId}"` : ''}>
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Street Address</label>
            <input class="form-input" data-addr="street1" type="text"
                   value="${street1}" placeholder="" autocomplete="off">
          </div>
          <div class="form-group f-unit">
            <label class="form-label">Unit / PO Box</label>
            <input class="form-input" data-addr="street2" type="text"
                   value="${street2}" placeholder="" autocomplete="off">
          </div>
          ${isFirst
            ? `<button class="btn-action" data-action="add-property" tabindex="-1" ${street1 ? '' : 'disabled'}>+ Property</button>`
            : `<div class="btn-spacer"></div>`}
        </div>
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">City</label>
            <input class="form-input" data-addr="city" type="text" value="${city}" autocomplete="off">
          </div>
          <div class="form-group f-state">
            <label class="form-label form-label-center">State</label>
            <input class="form-input" data-addr="state" type="text"
                   value="${state}" maxlength="3" autocomplete="off">
          </div>
          <div class="form-group f-sm">
            <label class="form-label">Zip Code</label>
            <input class="form-input" data-addr="zip" type="text"
                   value="${zip}" maxlength="10" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Property Type</label>
            <select class="form-select" data-addr="prop-type">
              ${_options('propertyTypes', false, propType)}
            </select>
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Property Use</label>
            <select class="form-select" data-addr="prop-use">
              ${_options('propertyUses', false, propUse)}
            </select>
          </div>
          <div class="btn-spacer"></div>
        </div>
        ${_notesRowHTML('data-addr="notes"', 'Property Notes', { value: notes })}
      </div>
    `;
  }

  /* ── Person side widget HTML ──────────────────────────────── */
  function _personSideWidgetHTML(uid = Date.now()) {
    return `
      <div class="widget-form">

        <!-- Row 1: Title / First Name / Last Name -->
        <div class="form-row">
          <div class="form-group f-title">
            <label class="form-label">Title</label>
            <select class="form-select" data-ap="title">
              <option value=""></option>
              <option>Mr.</option>
              <option>Mrs.</option>
              <option>Ms.</option>
              <option>Dr.</option>
              <option>Prof.</option>
            </select>
          </div>
          <div class="form-group f-grow">
            <label class="form-label">First Name</label>
            <input class="form-input" data-ap="first-name" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Last Name</label>
            <input class="form-input" data-ap="last-name" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 2: Phone -->
        <div data-container="ap-phones">
          ${_phoneRowHTML(0, true)}
        </div>

        <!-- Row 3: Email -->
        <div data-container="ap-emails">
          ${_emailRowHTML(0, true)}
        </div>

        <!-- Row 4: Comm Preference -->
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Comm. Preference</label>
            <div class="comm-pref-options">
              <label class="comm-pref-option"><input type="radio" name="ap-comm-pref-${uid}" data-ap="comm-pref" value="Email"> Email</label>
              <label class="comm-pref-option"><input type="radio" name="ap-comm-pref-${uid}" data-ap="comm-pref" value="Text"> Text</label>
              <label class="comm-pref-option"><input type="radio" name="ap-comm-pref-${uid}" data-ap="comm-pref" value="Phone"> Phone</label>
            </div>
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 5: Contact Notes -->
        ${_notesRowHTML('data-ap="notes"', 'Contact Notes')}

        <!-- Row 6: Relationship / Cancel / Save -->
        <div class="form-row" style="align-items:flex-start">
          <div class="form-group" style="flex:1">
            <label class="form-label">Relationship</label>
            <select class="form-select" data-ap="relationship">
              <option value="">-- Select --</option>
              <option>Spouse</option>
              <option>Partner</option>
              <option>Co-owner</option>
              <option>Other</option>
            </select>
          </div>
          <button class="btn-secondary" data-action="cancel" style="margin-left:6px;margin-top:10px">Cancel</button>
          <button class="btn-primary" data-action="save" style="margin-left:6px;margin-top:10px" disabled>Save</button>
        </div>

      </div>
    `;
  }

  /* ── Address side widget HTML ─────────────────────────────── */
  function _addressSideWidgetHTML() {
    return `
      <div class="widget-form">

        <!-- Row 1: Street Address / Unit -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Street Address</label>
            <input class="form-input" data-addr="street1" type="text" autocomplete="off">
          </div>
          <div class="form-group f-unit">
            <label class="form-label">Unit / PO Box</label>
            <input class="form-input" data-addr="street2" type="text" autocomplete="off">
          </div>
        </div>

        <!-- Row 2: City / State / Zip -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">City</label>
            <input class="form-input" data-addr="city" type="text" autocomplete="off">
          </div>
          <div class="form-group f-state">
            <label class="form-label form-label-center">State</label>
            <input class="form-input" data-addr="state" type="text" maxlength="3" autocomplete="off">
          </div>
          <div class="form-group f-sm">
            <label class="form-label">Zip Code</label>
            <input class="form-input" data-addr="zip" type="text" maxlength="10" autocomplete="off">
          </div>
        </div>

        <!-- Row 3: Property Type / Property Use -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Property Type</label>
            <select class="form-select" data-addr="prop-type">
              ${_options('propertyTypes')}
            </select>
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Property Use</label>
            <select class="form-select" data-addr="prop-use">
              ${_options('propertyUses')}
            </select>
          </div>
        </div>

        <!-- Row 4: Property Notes -->
        ${_notesRowHTML('data-addr="notes"', 'Property Notes', { spacer: false })}

        <!-- Row 5: Cancel / Save -->
        <div class="widget-footer">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="save" disabled>Save</button>
        </div>

      </div>
    `;
  }

  /* ── Company side widget HTML ────────────────────────────── */
  function _companySideWidgetHTML() {
    return `
      <div class="widget-form">

        <!-- Row 1: Company Name (search + create) -->
        <div class="form-row">
          <div class="form-group" style="flex:1;position:relative">
            <label class="form-label">Company Name</label>
            <input class="form-input" data-co="name" type="text"
                   placeholder="Type to search or enter new" autocomplete="off">
            <div data-co="search-results" class="company-search-results"></div>
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 2: DBA -->
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">DBA (Doing Business As)</label>
            <input class="form-input" data-co="dba" type="text" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 3: Street / Unit -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Street Address</label>
            <input class="form-input" data-co="street1" type="text" autocomplete="off">
          </div>
          <div class="form-group f-unit">
            <label class="form-label">Unit / Suite</label>
            <input class="form-input" data-co="street2" type="text" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 4: City / State / Zip -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">City</label>
            <input class="form-input" data-co="city" type="text" autocomplete="off">
          </div>
          <div class="form-group f-state">
            <label class="form-label form-label-center">State</label>
            <input class="form-input" data-co="state" type="text" maxlength="3" autocomplete="off">
          </div>
          <div class="form-group f-sm">
            <label class="form-label">Zip Code</label>
            <input class="form-input" data-co="zip" type="text" maxlength="10" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 5: Phone -->
        <div data-container="co-phones">
          ${_phoneRowHTML(0, true)}
        </div>

        <!-- Row 6: Email -->
        <div data-container="co-emails">
          ${_emailRowHTML(0, true)}
        </div>

        <!-- Row 7: Job Title / Department -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Job Title</label>
            <input class="form-input" data-co="job-title" type="text" autocomplete="off">
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Department</label>
            <input class="form-input" data-co="department" type="text" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Row 8: Company Notes -->
        ${_notesRowHTML('data-co="notes"', 'Company Notes')}

        <!-- Row 9: Cancel / Save -->
        <div class="widget-footer">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="save" disabled>Save</button>
        </div>

      </div>
    `;
  }

  /* ── Person detail widget HTML (read-only, from summary data) */
  function _personDetailWidgetHTML(d) {
    const name = [d.firstName, d.lastName].filter(Boolean).join(' ');
    const phonesHTML = (d.phones || []).map(p =>
      `<div class="detail-row"><span class="detail-type">${p.type}</span><span>${p.countryCode} ${p.number}</span></div>`
    ).join('') || '<div class="detail-empty">No phone on file</div>';
    const emailsHTML = (d.emails || []).map(e =>
      `<div class="detail-row"><span class="detail-type">${e.type}</span><span>${e.address}</span></div>`
    ).join('') || '<div class="detail-empty">No email on file</div>';
    return `
      <div class="widget-form">
        <div class="detail-section">
          <div class="detail-name">${name}</div>
          ${d.relationship ? `<div class="detail-relationship">${d.relationship}</div>` : ''}
        </div>
        <div class="detail-group">
          <div class="detail-label">Phone</div>
          ${phonesHTML}
        </div>
        <div class="detail-group">
          <div class="detail-label">Email</div>
          ${emailsHTML}
        </div>
      </div>
    `;
  }

  /* ── Address detail widget HTML (read-only, from summary data) */
  function _addressDetailWidgetHTML(d) {
    const lines = [
      d.street1,
      d.street2,
      [d.city, d.state, d.zip].filter(Boolean).join(' '),
    ].filter(Boolean);
    return `
      <div class="widget-form">
        <div class="detail-section">
          ${lines.map(l => `<div class="detail-name">${l}</div>`).join('')}
        </div>
        ${d.propType || d.propUse ? `
        <div class="detail-group">
          ${d.propType ? `<div class="detail-row"><span class="detail-type">Type</span><span>${d.propType}</span></div>` : ''}
          ${d.propUse  ? `<div class="detail-row"><span class="detail-type">Use</span><span>${d.propUse}</span></div>`  : ''}
        </div>` : ''}
        ${d.notes ? `
        <div class="detail-group">
          <div class="detail-label">Notes</div>
          <div class="detail-notes">${d.notes}</div>
        </div>` : ''}
      </div>
    `;
  }

  /* ── New Residential Client ───────────────────────────────── */
  function openNewContact() {
    const id     = 'new-contact-' + Date.now();
    const opened = WidgetManager.open(id, 'New Contact', _newClientHTML(id), {
      width:      425,
      autoHeight: true,
      category:   'contact',
      getLabel:   (el) => {
        const last  = el.querySelector('[data-field="last-name"]')?.value.trim()  || '';
        const first = el.querySelector('[data-field="first-name"]')?.value.trim() || '';
        if (last && first) return `${last}, ${first}`;
        return last || first || '';
      },
    });
    if (opened === false) return;
    _bindNewClientForm(id);
  }

  function _newClientHTML(id) {
    return `
      <div class="widget-form">

        <!-- Name -->
        <div class="form-row">
          <div class="form-group f-title">
            <label class="form-label">Title</label>
            <select class="form-select" data-field="title">
              <option value=""></option>
              <option>Mr.</option>
              <option>Mrs.</option>
              <option>Ms.</option>
              <option>Dr.</option>
              <option>Prof.</option>
            </select>
          </div>
          <div class="form-group f-md">
            <label class="form-label">First Name</label>
            <input class="form-input" data-field="first-name" data-autofocus type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Last Name</label>
            <input class="form-input" data-field="last-name" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <button class="btn-action" data-action="add-person"
                  tabindex="-1" disabled>+ Person</button>
        </div>

        <!-- Phones -->
        <div data-container="phones">
          ${_phoneRowHTML(0, true)}
        </div>

        <!-- Emails -->
        <div data-container="emails">
          ${_emailRowHTML(0, true)}
        </div>

        <!-- Communication Preference -->
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Comm. Preference</label>
            <div class="comm-pref-options">
              <label class="comm-pref-option"><input type="radio" name="comm-pref-${id}" data-field="comm-pref" value="Email"> Email</label>
              <label class="comm-pref-option"><input type="radio" name="comm-pref-${id}" data-field="comm-pref" value="Text"> Text</label>
              <label class="comm-pref-option"><input type="radio" name="comm-pref-${id}" data-field="comm-pref" value="Phone"> Phone</label>
            </div>
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Lead Source / Referred By -->
        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Lead Source</label>
            <select class="form-select" data-field="lead-source">
              ${_options('leadSources')}
            </select>
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Referred By</label>
            <input class="form-input" data-field="referred-by" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Client Notes -->
        ${_notesRowHTML('data-field="client-notes"', 'Client Notes')}

        <!-- Additional People (summary rows appear here) -->
        <div data-container="additional-people"></div>

        <div class="form-divider"></div>

        <!-- Primary Address -->
        ${_addressBlockHTML(0)}

        <!-- Additional Addresses (summary rows appear here) -->
        <div data-container="additional-addresses"></div>

        <div class="form-divider"></div>

        <!-- Company -->
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Company / Employer</label>
          </div>
          <button class="btn-action" data-action="add-company" tabindex="-1" disabled>+ Company</button>
        </div>

        <!-- Additional Companies (summary rows appear here) -->
        <div data-container="additional-companies"></div>

        <!-- Actions -->
        <div class="form-row" style="align-items:center;justify-content:flex-end">
          <button class="btn-secondary" data-action="cancel" style="margin-left:6px">Cancel</button>
          <button class="btn-primary" data-action="save" style="margin-left:6px" disabled>Save</button>
        </div>

      </div>
    `;
  }

  /* ── Bind new client form events ──────────────────────────── */
  function _bindNewClientForm(widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    // Phone / Email add buttons
    _bindPhoneEmailRows(el, '[data-container="phones"]', '[data-container="emails"]', widgetId);

    // Notes auto-expand
    _bindAutoExpand(el.querySelector('[data-field="client-notes"]'), 5, widgetId);
    _bindAutoExpand(el.querySelector('[data-addr="notes"]'),         5, widgetId);

    // Field formatters
    el.querySelector('input[data-phone][data-index="0"]').addEventListener('input', _formatPhone);
    el.querySelector('input[data-phone-cc][data-index="0"]').addEventListener('input', _formatCC);
    el.querySelector('input[data-phone-ext][data-index="0"]').addEventListener('input', _formatExt);
    el.querySelector('input[data-email][data-index="0"]').addEventListener('input', _formatEmail);
    el.querySelector('[data-field="first-name"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-field="last-name"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-field="referred-by"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-addr="state"]').addEventListener('input', _formatState);
    el.querySelector('[data-addr="zip"]').addEventListener('input', _formatZip);

    // Track any open panel so parent Cancel can close it

    // Save disabled until Last Name + at least one Phone or Email
    const saveBtn = el.querySelector('[data-action="save"]');
    function _updateSaveBtn() {
      const hasLast  = !!el.querySelector('[data-field="last-name"]').value.trim();
      const hasPhone = [...el.querySelectorAll('input[data-phone]')].some(i => i.value.trim());
      const hasEmail = [...el.querySelectorAll('input[data-email]')].some(i => i.value.trim());
      saveBtn.disabled = !(hasLast && (hasPhone || hasEmail));
    }
    el.querySelector('[data-field="last-name"]').addEventListener('input', _updateSaveBtn);
    el.addEventListener('input', function (e) {
      if (e.target.dataset.phone !== undefined || e.target.dataset.email !== undefined) {
        _updateSaveBtn();
      }
    });

    // + Person / + Company disabled until First Name has content
    const addPersonBtn  = el.querySelector('[data-action="add-person"]');
    const addCompanyBtn = el.querySelector('[data-action="add-company"]');
    el.querySelector('[data-field="first-name"]').addEventListener('input', function () {
      const empty = this.value.trim() === '';
      addPersonBtn.disabled  = empty;
      addCompanyBtn.disabled = empty;
    });

    addPersonBtn.addEventListener('click', function () {
      addPersonBtn.disabled = true;
      const sideId   = 'side-person-' + Date.now();
      const mainLeft = parseInt(el.style.left) || 0;
      const mainTop  = parseInt(el.style.top)  || 0;
      const opened   = WidgetManager.open(sideId, 'Add Person', _personSideWidgetHTML(), {
        width:      425,
        autoHeight: true,
        top:        mainTop + 30,
        left:       mainLeft + el.offsetWidth,
        panel:      true,
        parentId:   widgetId,
      });
      if (opened === false) { addPersonBtn.disabled = false; return; }
      _bindPersonSideWidget(sideId, el, addPersonBtn, () => {});
    });

    // + Property disabled until Street Address has content
    const addAddressBtn = el.querySelector('[data-action="add-property"]');
    el.querySelector('[data-addr="street1"]').addEventListener('input', function () {
      addAddressBtn.disabled = this.value.trim() === '';
    });

    addAddressBtn.addEventListener('click', function () {
      addAddressBtn.disabled = true;
      const sideId   = 'side-address-' + Date.now();
      const mainLeft = parseInt(el.style.left) || 0;
      // Align top of panel with the divider between Client Notes and Street Address
      const workspace   = document.querySelector('.workspace');
      const wRect       = workspace.getBoundingClientRect();
      const divider     = el.querySelector('.form-divider');
      const dividerTop  = divider.getBoundingClientRect().top - wRect.top;
      const opened = WidgetManager.open(sideId, 'Add Address', _addressSideWidgetHTML(), {
        width:      360,
        autoHeight: true,
        top:        dividerTop,
        left:       mainLeft + el.offsetWidth,
        panel:      true,
        parentId:   widgetId,
      });
      if (opened === false) { addAddressBtn.disabled = false; return; }
      _bindAddressSideWidget(sideId, el, addAddressBtn, () => {});
    });

    // + Company → side widget
    addCompanyBtn.addEventListener('click', function () {
      addCompanyBtn.disabled = true;
      const sideId   = 'side-company-' + Date.now();
      const mainLeft = parseInt(el.style.left) || 0;
      const mainTop  = parseInt(el.style.top)  || 0;
      const opened   = WidgetManager.open(sideId, 'Add Company', _companySideWidgetHTML(), {
        width:      425,
        autoHeight: true,
        top:        mainTop + 30,
        left:       mainLeft + el.offsetWidth,
        panel:      true,
        parentId:   widgetId,
      });
      if (opened === false) { addCompanyBtn.disabled = false; return; }
      _bindCompanySideWidget(sideId, el, addCompanyBtn, () => {});
    });

    // Cancel — also closes any open panel
    el.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(widgetId);
    });

    // Save
    el.querySelector('[data-action="save"]').addEventListener('click', () => {
      _saveNewClient(el, widgetId);
    });
  }

  /* ── Bind person side widget ──────────────────────────────── */
  function _bindPersonSideWidget(sideId, mainEl, addPersonBtn, onClose) {
    const sideEl = document.getElementById('widget-' + sideId);
    if (!sideEl) return;

    // Phone / Email add buttons within the side widget
    _bindPhoneEmailRows(sideEl, '[data-container="ap-phones"]', '[data-container="ap-emails"]', sideId);

    // Notes auto-expand
    _bindAutoExpand(sideEl.querySelector('[data-ap="notes"]'), 5, sideId);

    // Formatters
    sideEl.querySelector('[data-ap="first-name"]').addEventListener('input', _formatNameField);
    sideEl.querySelector('[data-ap="last-name"]').addEventListener('input', _formatNameField);
    sideEl.querySelector('input[data-phone]').addEventListener('input', _formatPhone);
    sideEl.querySelector('input[data-phone-cc]').addEventListener('input', _formatCC);
    sideEl.querySelector('input[data-phone-ext]')?.addEventListener('input', _formatExt);
    sideEl.querySelector('input[data-email]').addEventListener('input', _formatEmail);

    function _reEnable() { addPersonBtn.disabled = false; if (onClose) onClose(); }

    // Save disabled until First Name + Last Name + (Phone OR Email)
    const personSaveBtn = sideEl.querySelector('[data-action="save"]');
    function _updatePersonSaveBtn() {
      const hasFirst = !!sideEl.querySelector('[data-ap="first-name"]').value.trim();
      const hasLast  = !!sideEl.querySelector('[data-ap="last-name"]').value.trim();
      const hasPhone = [...sideEl.querySelectorAll('input[data-phone]')].some(i => i.value.trim());
      const hasEmail = [...sideEl.querySelectorAll('input[data-email]')].some(i => i.value.trim());
      personSaveBtn.disabled = !(hasFirst && hasLast && (hasPhone || hasEmail));
    }
    sideEl.querySelector('[data-ap="first-name"]').addEventListener('input', _updatePersonSaveBtn);
    sideEl.querySelector('[data-ap="last-name"]').addEventListener('input', _updatePersonSaveBtn);
    sideEl.addEventListener('input', e => {
      if (e.target.dataset.phone !== undefined || e.target.dataset.email !== undefined) _updatePersonSaveBtn();
    });

    sideEl.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(sideId);
      _reEnable();
    });

    sideEl.querySelector('[data-action="save"]').addEventListener('click', () => {
      const firstName = sideEl.querySelector('[data-ap="first-name"]').value.trim();
      const lastName  = sideEl.querySelector('[data-ap="last-name"]').value.trim();
      if (!firstName && !lastName) {
        sideEl.querySelector('[data-ap="first-name"]').focus();
        return;
      }

      const personData = {
        title:        sideEl.querySelector('[data-ap="title"]').value,
        firstName,
        lastName,
        relationship: sideEl.querySelector('[data-ap="relationship"]').value,
        notes:        sideEl.querySelector('[data-ap="notes"]').value.trim(),
        phones:       _collectPhones(sideEl),
        emails:       _collectEmails(sideEl),
      };

      const name  = [firstName, lastName].filter(Boolean).join(' ');
      const label = `${name} — ${personData.relationship}`;

      _addSummaryRow(
        mainEl.querySelector('[data-container="additional-people"]'),
        label,
        'personSummary',
        personData,
        () => WidgetManager.open(
          'detail-person-' + Date.now(),
          name,
          _personDetailWidgetHTML(personData),
          { width: 300, height: 260 }
        )
      );

      WidgetManager.close(sideId);
      _reEnable();
    });
  }

  /* ── Bind company side widget ────────────────────────────── */
  function _bindCompanySideWidget(sideId, mainEl, addCompanyBtn, onClose) {
    const sideEl = document.getElementById('widget-' + sideId);
    if (!sideEl) return;

    function _reEnable() { addCompanyBtn.disabled = false; if (onClose) onClose(); }

    // Autofill phone, email, and address from parent contact form
    const parentPhone = mainEl.querySelector('input[data-phone]')?.value.trim();
    const parentEmail = mainEl.querySelector('input[data-email]')?.value.trim();
    if (parentPhone) sideEl.querySelector('input[data-phone]').value = parentPhone;
    if (parentEmail) sideEl.querySelector('input[data-email]').value = parentEmail;

    ['street1', 'street2', 'city', 'state', 'zip'].forEach(field => {
      const val = mainEl.querySelector(`[data-addr="${field}"]`)?.value.trim();
      if (val) sideEl.querySelector(`[data-co="${field}"]`).value = val;
    });

    // Save disabled until Company Name + (Phone OR Email)
    const companySaveBtn = sideEl.querySelector('[data-action="save"]');
    function _updateCompanySaveBtn() {
      const hasName  = !!sideEl.querySelector('[data-co="name"]').value.trim();
      const hasPhone = [...sideEl.querySelectorAll('input[data-phone]')].some(i => i.value.trim());
      const hasEmail = [...sideEl.querySelectorAll('input[data-email]')].some(i => i.value.trim());
      companySaveBtn.disabled = !(hasName && (hasPhone || hasEmail));
    }
    sideEl.querySelector('[data-co="name"]').addEventListener('input', _updateCompanySaveBtn);
    sideEl.addEventListener('input', e => {
      if (e.target.dataset.phone !== undefined || e.target.dataset.email !== undefined) _updateCompanySaveBtn();
    });
    _updateCompanySaveBtn(); // run once in case autofill already satisfies phone/email

    // Company name live search against AppData
    let _coSearchDebounce = null;
    let _selectedCompanyId = null;

    const nameInput     = sideEl.querySelector('[data-co="name"]');
    const searchResults = sideEl.querySelector('[data-co="search-results"]');

    function _showCoResults(results) {
      if (!results.length) { searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = results.map(c =>
        `<div class="company-search-item" data-co-id="${c.Company_ID}">
          <span class="company-search-primary">${c.Company_DBA || c.Company_Name}</span>
          ${c.Company_DBA ? `<span class="company-search-secondary">${c.Company_Name}</span>` : ''}
        </div>`
      ).join('');
      searchResults.querySelectorAll('.company-search-item').forEach(item => {
        item.addEventListener('mousedown', function (e) {
          e.preventDefault();
          const co = (AppData.tables['DB_Company'] || []).find(c => c.Company_ID === this.dataset.coId);
          if (!co) return;
          _selectedCompanyId = co.Company_ID;
          nameInput.value = co.Company_DBA || co.Company_Name;
          sideEl.querySelector('[data-co="dba"]').value       = co.Company_DBA    || '';
          searchResults.innerHTML = '';
        });
      });
    }

    // Copy Company Name → DBA when DBA is still empty
    nameInput.addEventListener('blur', function () {
      const dbaInput = sideEl.querySelector('[data-co="dba"]');
      if (this.value.trim() && !dbaInput.value.trim()) {
        dbaInput.value = this.value.trim();
      }
    });

    nameInput.addEventListener('input', function () {
      _selectedCompanyId = null;
      clearTimeout(_coSearchDebounce);
      const q = this.value.trim().toLowerCase();
      if (q.length < 2) { searchResults.innerHTML = ''; return; }
      _coSearchDebounce = setTimeout(() => {
        const matches = (AppData.tables['DB_Company'] || [])
          .filter(c => [c.Company_Name, c.Company_DBA].some(f => f && f.toLowerCase().includes(q)))
          .slice(0, 6);
        _showCoResults(matches);
      }, 150);
    });

    document.addEventListener('mousedown', function _coOutside(e) {
      if (!sideEl.contains(e.target)) {
        searchResults.innerHTML = '';
        document.removeEventListener('mousedown', _coOutside);
      }
    });

    // Formatters
    sideEl.querySelector('[data-co="state"]').addEventListener('input', _formatState);
    sideEl.querySelector('[data-co="zip"]').addEventListener('input', _formatZip);
    sideEl.querySelector('[data-co="name"]').addEventListener('input', _formatNameField);
    sideEl.querySelector('[data-co="dba"]').addEventListener('input', _formatNameField);

    // Phone / Email
    _bindPhoneEmailRows(sideEl, '[data-container="co-phones"]', '[data-container="co-emails"]', sideId);
    sideEl.querySelector('input[data-phone]').addEventListener('input', _formatPhone);
    sideEl.querySelector('input[data-phone-cc]').addEventListener('input', _formatCC);
    sideEl.querySelector('input[data-phone-ext]')?.addEventListener('input', _formatExt);
    sideEl.querySelector('input[data-email]').addEventListener('input', _formatEmail);

    // Notes
    _bindAutoExpand(sideEl.querySelector('[data-co="notes"]'), 5, sideId);

    sideEl.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(sideId);
      _reEnable();
    });

    sideEl.querySelector('[data-action="save"]').addEventListener('click', () => {
      const name = sideEl.querySelector('[data-co="name"]').value.trim();
      if (!name) { sideEl.querySelector('[data-co="name"]').focus(); return; }

      const coData = {
        companyId:  _selectedCompanyId || null,
        name,
        dba:        sideEl.querySelector('[data-co="dba"]').value.trim(),
        street1:    sideEl.querySelector('[data-co="street1"]').value.trim(),
        street2:    sideEl.querySelector('[data-co="street2"]').value.trim(),
        city:       sideEl.querySelector('[data-co="city"]').value.trim(),
        state:      sideEl.querySelector('[data-co="state"]').value.trim(),
        zip:        sideEl.querySelector('[data-co="zip"]').value.trim(),
        jobTitle:   sideEl.querySelector('[data-co="job-title"]').value.trim(),
        department: sideEl.querySelector('[data-co="department"]').value.trim(),
        notes:      sideEl.querySelector('[data-co="notes"]').value.trim(),
        phones:     _collectPhones(sideEl),
        emails:     _collectEmails(sideEl),
        isExisting: !!_selectedCompanyId,
      };

      const label = coData.dba ? `${coData.dba} (${coData.name})` : coData.name;

      _addSummaryRow(
        mainEl.querySelector('[data-container="additional-companies"]'),
        label,
        'companySummary',
        coData,
        () => {}
      );

      WidgetManager.close(sideId);
      _reEnable();
    });
  }

  /* ── Bind address side widget ─────────────────────────────── */
  function _bindAddressSideWidget(sideId, mainEl, addAddressBtn, onClose) {
    const sideEl = document.getElementById('widget-' + sideId);
    if (!sideEl) return;

    function _reEnable() { addAddressBtn.disabled = false; if (onClose) onClose(); }

    // Save disabled until Street Address + City
    const addressSaveBtn = sideEl.querySelector('[data-action="save"]');
    function _updateAddressSaveBtn() {
      const hasStreet = !!sideEl.querySelector('[data-addr="street1"]').value.trim();
      const hasCity   = !!sideEl.querySelector('[data-addr="city"]').value.trim();
      addressSaveBtn.disabled = !(hasStreet && hasCity);
    }
    sideEl.querySelector('[data-addr="street1"]').addEventListener('input', _updateAddressSaveBtn);
    sideEl.querySelector('[data-addr="city"]').addEventListener('input', _updateAddressSaveBtn);

    sideEl.querySelector('[data-addr="zip"]').addEventListener('input', _formatZip);
    sideEl.querySelector('[data-addr="state"]').addEventListener('input', _formatState);

    // Notes auto-expand
    _bindAutoExpand(sideEl.querySelector('[data-addr="notes"]'), 5, sideId);

    sideEl.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(sideId);
      _reEnable();
    });

    sideEl.querySelector('[data-action="save"]').addEventListener('click', () => {
      const street1 = sideEl.querySelector('[data-addr="street1"]').value.trim();
      const city    = sideEl.querySelector('[data-addr="city"]').value.trim();
      if (!street1 && !city) {
        sideEl.querySelector('[data-addr="street1"]').focus();
        return;
      }

      const addrData = {
        street1,
        street2:  sideEl.querySelector('[data-addr="street2"]').value.trim(),
        city,
        state:    sideEl.querySelector('[data-addr="state"]').value.trim(),
        zip:      sideEl.querySelector('[data-addr="zip"]').value.trim(),
        propType: sideEl.querySelector('[data-addr="prop-type"]').value,
        propUse:  sideEl.querySelector('[data-addr="prop-use"]').value,
        notes:    sideEl.querySelector('[data-addr="notes"]').value.trim(),
      };

      const addrLine = [street1, [city, addrData.state].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      const label    = addrData.propUse ? `${addrLine} — ${addrData.propUse}` : addrLine;

      _addSummaryRow(
        mainEl.querySelector('[data-container="additional-addresses"]'),
        label,
        'addressSummary',
        addrData,
        () => WidgetManager.open(
          'detail-address-' + Date.now(),
          addrLine,
          _addressDetailWidgetHTML(addrData),
          { width: 300, height: 260 }
        )
      );

      WidgetManager.close(sideId);
      _reEnable();
    });
  }

  /* ── Create a summary row and append to container ─────────── */
  function _addSummaryRow(container, label, dataKey, dataObj, onExpand) {
    const summaryEl = document.createElement('div');
    summaryEl.className = 'summary-row';
    summaryEl.dataset[dataKey] = JSON.stringify(dataObj);
    summaryEl.innerHTML = `
      <span class="summary-label">${label}</span>
      <button class="btn-remove" type="button" title="Remove">&#10005;</button>
    `;
    summaryEl.querySelector('.summary-label').addEventListener('click', onExpand);
    summaryEl.querySelector('.btn-remove').addEventListener('click', () => summaryEl.remove());
    container.appendChild(summaryEl);
  }

  /* ── Save new client to localStorage ─────────────────────── */
  function _saveNewClient(el, widgetId) {
    const firstName = el.querySelector('[data-field="first-name"]').value.trim();
    const lastName  = el.querySelector('[data-field="last-name"]').value.trim();

    if (!firstName) {
      const input = el.querySelector('[data-field="first-name"]');
      input.style.borderColor = 'var(--color-danger)';
      input.focus();
      return;
    }

    const now    = new Date().toISOString();
    const people = _getData(KEYS.people);

    // Primary person record
    const person = {
      id:           _generateId('PEO'),
      dateCreated:  now,
      dateModified: now,
      status:       'Active',
      title:        el.querySelector('[data-field="title"]').value,
      firstName,
      lastName,
      displayName:  lastName ? `${lastName}, ${firstName}` : firstName,
      phones:       _collectPhones(el),
      emails:       _collectEmails(el),
      leadSource:   el.querySelector('[data-field="lead-source"]').value,
      referredBy:   el.querySelector('[data-field="referred-by"]').value.trim(),
      commPref:     el.querySelector('input[data-field="comm-pref"]:checked')?.value || '',
      notes:        el.querySelector('[data-field="client-notes"]').value.trim(),
    };
    people.push(person);

    // Additional people from summary rows
    const allPersonIds = [person.id];
    el.querySelectorAll('[data-person-summary]').forEach(row => {
      const d = JSON.parse(row.dataset.personSummary);
      if (!d.firstName && !d.lastName) return;
      const ap = {
        id:           _generateId('PEO'),
        dateCreated:  now,
        dateModified: now,
        status:       'Active',
        firstName:    d.firstName,
        lastName:     d.lastName,
        displayName:  d.lastName ? `${d.lastName}, ${d.firstName}` : d.firstName,
        phones:       d.phones || [],
        emails:       d.emails || [],
        relationship: d.relationship,
        notes:        '',
      };
      people.push(ap);
      allPersonIds.push(ap.id);
    });
    _setData(KEYS.people, people);

    // Collect all address blocks
    const properties = _getData(KEYS.properties);
    const links      = _getData(KEYS.links);

    function _saveProperty(addrObj, isPrimary) {
      if (!addrObj.street1 && !addrObj.city) return;
      const property = {
        id:               _generateId('PROP'),
        dateCreated:      now,
        dateModified:     now,
        status:           'Active',
        type:             addrObj.propType || addrObj['prop-type'] || '',
        use:              addrObj.propUse  || addrObj['prop-use']  || '',
        isPrimaryBilling: isPrimary,
        street1:          addrObj.street1,
        street2:          addrObj.street2 || '',
        city:             addrObj.city,
        state:            addrObj.state || '',
        zip:              addrObj.zip   || '',
        notes:            addrObj.notes || '',
      };
      property.fullAddressSearch = [property.street1, property.street2, property.city, property.state, property.zip].filter(Boolean).join(' ');
      properties.push(property);
      allPersonIds.forEach(personId => {
        links.push({ id: _generateId('LPP'), type: 'property_people', propertyId: property.id, peopleId: personId, role: 'Owner' });
      });
    }

    // Primary address (inline block)
    el.querySelectorAll('[data-address-block]').forEach((block, idx) => {
      _saveProperty({
        street1:   block.querySelector('[data-addr="street1"]').value.trim(),
        street2:   block.querySelector('[data-addr="street2"]').value.trim(),
        city:      block.querySelector('[data-addr="city"]').value.trim(),
        state:     block.querySelector('[data-addr="state"]').value.trim(),
        zip:       block.querySelector('[data-addr="zip"]').value.trim(),
        propType:  block.querySelector('[data-addr="prop-type"]').value,
        propUse:   block.querySelector('[data-addr="prop-use"]').value,
        notes:     block.querySelector('[data-addr="notes"]').value.trim(),
      }, idx === 0);
    });

    // Additional addresses from summary rows
    el.querySelectorAll('[data-address-summary]').forEach(row => {
      _saveProperty(JSON.parse(row.dataset.addressSummary), false);
    });

    _setData(KEYS.properties, properties);
    _setData(KEYS.links, links);

    WidgetManager.close(widgetId);
  }

  /* ── Profile widget helpers ──────────────────────────────── */
  function _getPersonCompanyRecord(peopleId) {
    const links     = AppData.tables['Link_Company_People'] || [];
    const companies = AppData.tables['DB_Company']          || [];
    const link      = links.find(l => l.People_ID === peopleId);
    if (!link) return null;
    return companies.find(c => c.Company_ID === link.Company_ID) || null;
  }

  function _getPersonProperties(peopleId) {
    const ppLinks  = AppData.tables['Link_Property_People'] || [];
    const allProps = AppData.tables['DB_Property']          || [];
    return ppLinks
      .filter(l => l.People_ID === peopleId && !l.Date_To)
      .map(l => allProps.find(p => p.Property_ID === l.Property_ID))
      .filter(Boolean)
      .sort((a, b) => (b.Property_Use === 'Primary Residence') - (a.Property_Use === 'Primary Residence'));
  }

  function _getCompanyProperties(companyId) {
    const cpLinks  = AppData.tables['Link_Property_Company'] || [];
    const allProps = AppData.tables['DB_Property']           || [];
    return cpLinks
      .filter(l => l.Company_ID === companyId && !l.Date_To)
      .map(l => allProps.find(p => p.Property_ID === l.Property_ID))
      .filter(Boolean);
  }

  function _profilePhones(record) {
    return ['Phone_1','Phone_2','Phone_3']
      .map((f, i) => record[f] ? { number: record[f], type: record[`Phone_${i+1}_Type`] || '' } : null)
      .filter(Boolean);
  }

  function _profileEmails(record) {
    return ['Email_1','Email_2','Email_3']
      .map((f, i) => record[f]?.trim() ? { addr: record[f].trim(), type: record[`Email_${i+1}_Type`] || '' } : null)
      .filter(Boolean);
  }

  function _profileContactRows(phones, emails) {
    if (!phones.length && !emails.length) return '';
    return `<div class="profile-block">
      ${phones.map(p => `<div class="profile-info-row">
        <span>${p.number}</span>${p.type ? `<span class="profile-info-type">${p.type}</span>` : ''}
      </div>`).join('')}
      ${emails.map(e => `<div class="profile-info-row">
        <span>${e.addr}</span>${e.type ? `<span class="profile-info-type">${e.type}</span>` : ''}
      </div>`).join('')}
    </div>`;
  }

  function _profilePropertyPills(properties) {
    if (!properties.length) return '';
    return `<div class="profile-block">
      <div class="profile-section-label">Properties</div>
      ${properties.map(prop => {
        const parts = [prop.Address_Street_1, `${prop.Address_City}, ${prop.Address_State}`];
        if (prop.Property_Use && prop.Property_Use !== 'Primary Residence') parts.push(prop.Property_Use);
        const label = parts.filter(Boolean).join(' · ');
        return `<button class="profile-entity-pill" data-action="open-profile"
          data-type="property" data-id="${prop.Property_ID}" title="${label}">${label}</button>`;
      }).join('')}
    </div>`;
  }

  function _personProfileHTML(person) {
    const company    = _getPersonCompanyRecord(person.People_ID);
    const properties = _getPersonProperties(person.People_ID);
    const phones     = _profilePhones(person);
    const emails     = _profileEmails(person);

    const relLinks  = AppData.tables['Link_People_Relationship'] || [];
    const allPeople = AppData.tables['DB_People']                || [];
    const linkedPeople = relLinks
      .filter(l => l.People_ID_1 === person.People_ID || l.People_ID_2 === person.People_ID)
      .map(l => {
        const otherId = l.People_ID_1 === person.People_ID ? l.People_ID_2 : l.People_ID_1;
        const other   = allPeople.find(p => p.People_ID === otherId);
        return other ? { ...other, link_role: l.Link_Role } : null;
      })
      .filter(Boolean);

    const linkedPeopleHTML = linkedPeople
      .map(p => _profilePersonBlock(p, p.link_role || 'Related'))
      .join('');

    return `<div class="widget-form profile-form">
      <div class="profile-block profile-header-block">
        <div class="profile-name">${person.People_Last_Name}, ${person.People_First_Name}</div>
        ${company ? `<button class="profile-meta-link" data-action="open-profile"
          data-type="company" data-id="${company.Company_ID}">
          ${company.Company_DBA || company.Company_Name}
        </button>` : ''}
      </div>
      ${_profileContactRows(phones, emails)}
      ${linkedPeopleHTML}
      ${_profilePropertyPills(properties)}
      <div class="widget-footer">
        <button class="btn-secondary" data-action="cancel">Close</button>
        <button class="btn-primary" data-action="edit-record"
          data-type="person" data-id="${person.People_ID}">Edit Record</button>
      </div>
    </div>`;
  }

  function _companyProfileHTML(company) {
    const links      = AppData.tables['Link_Company_People'] || [];
    const allPeople  = AppData.tables['DB_People']           || [];
    const properties = _getCompanyProperties(company.Company_ID);
    const phones     = _profilePhones(company);
    const emails     = _profileEmails(company);

    const people = links
      .filter(l => l.Company_ID === company.Company_ID)
      .map(l => allPeople.find(p => p.People_ID === l.People_ID))
      .filter(Boolean);

    const peoplePills = people.length ? `<div class="profile-block">
      <div class="profile-section-label">Contacts</div>
      ${people.map(p => {
        const parts = [`${p.People_Last_Name}, ${p.People_First_Name}`, p.Phone_1 || p.Email_1 || ''].filter(Boolean);
        const label = parts.join(' · ');
        return `<button class="profile-entity-pill" data-action="open-profile"
          data-type="person" data-id="${p.People_ID}" title="${label}">${label}</button>`;
      }).join('')}
    </div>` : '';

    const vendorParts = [company.Vendor_Type, company.Vendor_Category].filter(Boolean);
    const vendorMeta  = vendorParts.join(' · ');

    return `<div class="widget-form profile-form">
      <div class="profile-block profile-header-block">
        <div class="profile-name">${company.Company_DBA || company.Company_Name}</div>
        ${company.Company_DBA ? `<div class="profile-meta">${company.Company_Name}</div>` : ''}
        ${vendorMeta ? `<div class="profile-meta">${vendorMeta}</div>` : ''}
      </div>
      ${_profileContactRows(phones, emails)}
      ${peoplePills}
      ${_profilePropertyPills(properties)}
      <div class="widget-footer">
        <button class="btn-secondary" data-action="cancel">Close</button>
        <button class="btn-primary" data-action="edit-record"
          data-type="company" data-id="${company.Company_ID}">Edit Record</button>
      </div>
    </div>`;
  }

  // Renders a labeled section block: role label + clickable name + all phones + emails
  function _profilePersonBlock(person, roleLabel) {
    const phones = _profilePhones(person);
    const emails = _profileEmails(person);
    return `<div class="profile-block">
      <div class="profile-section-label">${roleLabel}</div>
      <button class="profile-meta-link" data-action="open-profile"
        data-type="person" data-id="${person.People_ID}">
        ${person.People_Last_Name}, ${person.People_First_Name}
      </button>
      ${phones.map(p => `<div class="profile-info-row">
        <span>${p.number}</span>${p.type ? `<span class="profile-info-type">${p.type}</span>` : ''}
      </div>`).join('')}
      ${emails.map(e => `<div class="profile-info-row">
        <span>${e.addr}</span>${e.type ? `<span class="profile-info-type">${e.type}</span>` : ''}
      </div>`).join('')}
    </div>`;
  }

  function _propertyProfileHTML(property) {
    const ppLinks    = AppData.tables['Link_Property_People'] || [];
    const allPeople  = AppData.tables['DB_People']           || [];
    const allEstimates = AppData.tables['DB_Estimates']      || [];

    // Section 2: current owners/occupants (no Date_To)
    const owners = ppLinks
      .filter(l => l.Property_ID === property.Property_ID && !l.Date_To)
      .map(l => {
        const person = allPeople.find(p => p.People_ID === l.People_ID);
        return person ? { ...person, link_role: l.Link_Role } : null;
      })
      .filter(Boolean);

    // Section 3: prior work
    const estimates = allEstimates.filter(e => e.Linked_Location_ID === property.Property_ID);

    const meta = [property.Property_Type, property.Property_Use].filter(Boolean).join(' · ');

    const ownerBlocksHTML = owners.map(o => _profilePersonBlock(o, o.link_role || 'Owner')).join('');

    const priorWorkHTML = estimates.length ? `<div class="profile-block">
      <div class="profile-section-label">Prior Work</div>
      ${estimates.map(e => {
        const label = [e.Estimate_Name, e.Workflow_Status].filter(Boolean).join(' · ');
        return `<button class="profile-entity-pill" data-action="open-work"
          data-type="estimate" data-id="${e.Estimate_ID}" title="${label}">${label}</button>`;
      }).join('')}
    </div>` : '';

    return `<div class="widget-form profile-form">
      <div class="profile-block profile-header-block">
        <div class="profile-name">${property.Address_Street_1}</div>
        ${property.Address_Street_2 ? `<div class="profile-meta">${property.Address_Street_2}</div>` : ''}
        <div class="profile-meta">${property.Address_City}, ${property.Address_State} ${property.Address_Zip}</div>
        ${meta ? `<div class="profile-meta">${meta}</div>` : ''}
      </div>
      ${ownerBlocksHTML}
      ${priorWorkHTML}
      <div class="widget-footer">
        <button class="btn-secondary" data-action="cancel">Close</button>
        <button class="btn-primary" data-action="edit-record"
          data-type="property" data-id="${property.Property_ID}">Edit Record</button>
      </div>
    </div>`;
  }

  function _bindProfileWidget(widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    el.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'cancel') {
        WidgetManager.close(widgetId);
      } else if (action === 'edit-record') {
        openEditContact(btn.dataset.type, btn.dataset.id);
      } else if (action === 'open-profile') {
        openProfile(btn.dataset.type, btn.dataset.id);
      }
    });

    // Deferred so the autoHeight rAF has already made the widget visible
    requestAnimationFrame(() => {
      el.tabIndex = -1;
      el.focus();
    });
  }

  /* ── Edit Contact ────────────────────────────────────────── */
  function _editPersonHTML(person) {
    const phones = [
      person.Phone_1 ? { number: person.Phone_1, type: person.Phone_1_Type || '' } : null,
      person.Phone_2 ? { number: person.Phone_2, type: person.Phone_2_Type || '' } : null,
      person.Phone_3 ? { number: person.Phone_3, type: person.Phone_3_Type || '' } : null,
    ].filter(Boolean);

    const emails = [
      person.Email_1 ? { email: person.Email_1, type: person.Email_1_Type || '' } : null,
      person.Email_2 ? { email: person.Email_2, type: person.Email_2_Type || '' } : null,
      person.Email_3 ? { email: person.Email_3, type: person.Email_3_Type || '' } : null,
    ].filter(Boolean);

    const phoneRowsHTML = phones.length
      ? phones.map((ph, i) => _phoneRowHTML(i, i === 0, ph)).join('')
      : _phoneRowHTML(0, true);

    const emailRowsHTML = emails.length
      ? emails.map((em, i) => _emailRowHTML(i, i === 0, em)).join('')
      : _emailRowHTML(0, true);

    const ppLinks    = AppData.tables['Link_Property_People'] || [];
    const allProps   = AppData.tables['DB_Property']          || [];
    const properties = ppLinks
      .filter(l => l.People_ID === person.People_ID && !l.Date_To)
      .map(l => allProps.find(p => p.Property_ID === l.Property_ID))
      .filter(Boolean)
      .sort((a, b) => (b.Property_Use === 'Primary Residence') - (a.Property_Use === 'Primary Residence'));

    const cpLinks    = AppData.tables['Link_Company_People'] || [];
    const allCos     = AppData.tables['DB_Company']          || [];
    const compLink   = cpLinks.find(l => l.People_ID === person.People_ID);
    const company    = compLink ? allCos.find(c => c.Company_ID === compLink.Company_ID) : null;

    const primaryProp   = properties[0] || null;
    const extraProps    = properties.slice(1);

    const extraPropRowsHTML = extraProps.map(prop => {
      const addrLine = [prop.Address_Street_1, [prop.Address_City, prop.Address_State].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      const label    = prop.Property_Use ? `${addrLine} — ${prop.Property_Use}` : addrLine;
      return `<div class="summary-row" data-existing-prop-id="${prop.Property_ID}">
        <span class="summary-label">${label}</span>
        <button class="btn-remove" type="button" title="Remove">&#10005;</button>
      </div>`;
    }).join('');

    const companyRowHTML = company ? `<div class="summary-row" data-existing-company-id="${company.Company_ID}">
      <span class="summary-label">${company.Company_DBA || company.Company_Name}</span>
      <button class="btn-remove" type="button" title="Remove">&#10005;</button>
    </div>` : '';

    const commPref = person.Contact_Preference || '';
    const uid      = person.People_ID;

    return `<div class="widget-form">

      <div class="form-row">
        <div class="form-group f-title">
          <label class="form-label">Title</label>
          <select class="form-select" data-field="title">
            ${['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'].map(t =>
              `<option${t === (person.People_Title || '') ? ' selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group f-md">
          <label class="form-label">First Name</label>
          <input class="form-input" data-field="first-name" type="text"
                 value="${person.People_First_Name || ''}" autocomplete="off">
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Last Name</label>
          <input class="form-input" data-field="last-name" type="text"
                 value="${person.People_Last_Name || ''}" autocomplete="off">
        </div>
        <button class="btn-action" data-action="add-person" tabindex="-1">+ Person</button>
      </div>

      <div data-container="phones">${phoneRowsHTML}</div>
      <div data-container="emails">${emailRowsHTML}</div>

      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">Comm. Preference</label>
          <div class="comm-pref-options">
            ${['Email', 'Text', 'Phone'].map(opt =>
              `<label class="comm-pref-option"><input type="radio" name="comm-pref-${uid}"
               data-field="comm-pref" value="${opt}"${commPref === opt ? ' checked' : ''}> ${opt}</label>`
            ).join('')}
          </div>
        </div>
        <div class="btn-spacer"></div>
      </div>

      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Lead Source</label>
          <select class="form-select" data-field="lead-source">
            ${_options('leadSources', false, person.Lead_Source || '')}
          </select>
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Referred By</label>
          <input class="form-input" data-field="referred-by" type="text"
                 value="${person.Referred_By || ''}" autocomplete="off">
        </div>
        <div class="btn-spacer"></div>
      </div>

      ${_notesRowHTML('data-field="client-notes"', 'Client Notes', { value: person.People_Notes || '' })}

      <div data-container="additional-people"></div>

      <div class="form-divider"></div>

      ${_addressBlockHTML(0, primaryProp)}

      <div data-container="additional-addresses">${extraPropRowsHTML}</div>

      <div class="form-divider"></div>

      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">Company / Employer</label>
        </div>
        <button class="btn-action" data-action="add-company" tabindex="-1"${company ? ' disabled' : ''}>+ Company</button>
      </div>
      <div data-container="additional-companies">${companyRowHTML}</div>

      <div class="widget-footer">
        <button class="btn-danger" data-action="delete-record">Delete</button>
        <button class="btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn-primary" data-action="save">Save</button>
      </div>
    </div>`;
  }

  function _bindEditPersonForm(person, widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    const initialPhoneCount = el.querySelectorAll('[data-container="phones"] input[data-phone]').length;
    const initialEmailCount = el.querySelectorAll('[data-container="emails"] input[data-email]').length;

    _bindPhoneEmailRows(el, '[data-container="phones"]', '[data-container="emails"]', widgetId,
      initialPhoneCount, initialEmailCount);
    _bindAutoExpand(el.querySelector('[data-field="client-notes"]'), 5, widgetId);
    _bindAutoExpand(el.querySelector('[data-addr="notes"]'), 5, widgetId);

    // Formatters — attach to all pre-filled rows
    el.querySelectorAll('input[data-phone]').forEach(i => i.addEventListener('input', _formatPhone));
    el.querySelectorAll('input[data-phone-cc]').forEach(i => i.addEventListener('input', _formatCC));
    el.querySelectorAll('input[data-phone-ext]').forEach(i => i.addEventListener('input', _formatExt));
    el.querySelectorAll('input[data-email]').forEach(i => i.addEventListener('input', _formatEmail));
    el.querySelector('[data-field="first-name"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-field="last-name"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-field="referred-by"]')?.addEventListener('input', _formatNameField);
    el.querySelector('[data-addr="state"]').addEventListener('input', _formatState);
    el.querySelector('[data-addr="zip"]').addEventListener('input', _formatZip);

    // + Property button — enabled if primary address block already has a street value
    const addAddressBtn = el.querySelector('[data-action="add-property"]');
    el.querySelector('[data-addr="street1"]').addEventListener('input', function () {
      addAddressBtn.disabled = this.value.trim() === '';
    });
    addAddressBtn.addEventListener('click', function () {
      addAddressBtn.disabled = true;
      const sideId     = 'side-address-' + Date.now();
      const mainLeft   = parseInt(el.style.left) || 0;
      const workspace  = document.querySelector('.workspace');
      const wRect      = workspace.getBoundingClientRect();
      const divider    = el.querySelector('.form-divider');
      const dividerTop = divider.getBoundingClientRect().top - wRect.top;
      const opened = WidgetManager.open(sideId, 'Add Address', _addressSideWidgetHTML(), {
        width: 360, autoHeight: true, top: dividerTop,
        left: mainLeft + el.offsetWidth, panel: true, parentId: widgetId,
      });
      if (opened === false) { addAddressBtn.disabled = false; return; }
      _bindAddressSideWidget(sideId, el, addAddressBtn, () => {});
    });

    // + Person button
    const addPersonBtn = el.querySelector('[data-action="add-person"]');
    addPersonBtn.addEventListener('click', function () {
      addPersonBtn.disabled = true;
      const sideId = 'side-person-' + Date.now();
      const opened = WidgetManager.open(sideId, 'Add Person', _personSideWidgetHTML(), {
        width: 425, autoHeight: true,
        top: (parseInt(el.style.top) || 0) + 30,
        left: (parseInt(el.style.left) || 0) + el.offsetWidth,
        panel: true, parentId: widgetId,
      });
      if (opened === false) { addPersonBtn.disabled = false; return; }
      _bindPersonSideWidget(sideId, el, addPersonBtn, () => {});
    });

    // + Company button — re-enable if existing company row is removed
    const addCompanyBtn = el.querySelector('[data-action="add-company"]');
    el.querySelector('[data-container="additional-companies"]').addEventListener('click', function (e) {
      if (e.target.closest('.btn-remove')) addCompanyBtn.disabled = false;
    });
    addCompanyBtn.addEventListener('click', function () {
      addCompanyBtn.disabled = true;
      const sideId = 'side-company-' + Date.now();
      const opened = WidgetManager.open(sideId, 'Add Company', _companySideWidgetHTML(), {
        width: 425, autoHeight: true,
        top: (parseInt(el.style.top) || 0) + 30,
        left: (parseInt(el.style.left) || 0) + el.offsetWidth,
        panel: true, parentId: widgetId,
      });
      if (opened === false) { addCompanyBtn.disabled = false; return; }
      _bindCompanySideWidget(sideId, el, addCompanyBtn, () => {});
    });

    // Existing property summary row removes
    el.querySelectorAll('[data-existing-prop-id] .btn-remove').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('[data-existing-prop-id]').remove());
    });

    // Cancel
    el.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(widgetId);
    });

    // Delete
    el.querySelector('[data-action="delete-record"]').addEventListener('click', () => {
      if (!confirm(`Delete ${person.People_Last_Name}, ${person.People_First_Name}? This cannot be undone.`)) return;
      const people = AppData.tables['DB_People'] || [];
      const idx    = people.findIndex(p => p.People_ID === person.People_ID);
      if (idx !== -1) people.splice(idx, 1);
      WidgetManager.close(widgetId);
      const profileId = `profile-person-${person.People_ID}`;
      if (document.getElementById('widget-' + profileId)) WidgetManager.close(profileId);
    });

    // Save
    el.querySelector('[data-action="save"]').addEventListener('click', () => {
      const firstName = el.querySelector('[data-field="first-name"]').value.trim();
      const lastName  = el.querySelector('[data-field="last-name"]').value.trim();
      if (!firstName && !lastName) {
        el.querySelector('[data-field="first-name"]').style.borderColor = 'var(--color-danger)';
        el.querySelector('[data-field="first-name"]').focus();
        return;
      }

      const now    = new Date().toISOString();
      const phones = _collectPhones(el);
      const emails = _collectEmails(el);
      const people = AppData.tables['DB_People'] || [];

      // Update the existing person record
      const rec = people.find(p => p.People_ID === person.People_ID);
      if (rec) {
        rec.People_Title        = el.querySelector('[data-field="title"]').value;
        rec.People_First_Name   = firstName;
        rec.People_Last_Name    = lastName;
        rec.Display_Name        = lastName ? `${lastName}, ${firstName}` : firstName;
        rec.Phone_1             = phones[0]?.number || '';
        rec.Phone_1_Type        = phones[0]?.type   || '';
        rec.Phone_2             = phones[1]?.number || '';
        rec.Phone_2_Type        = phones[1]?.type   || '';
        rec.Phone_3             = phones[2]?.number || '';
        rec.Phone_3_Type        = phones[2]?.type   || '';
        rec.Email_1             = emails[0]?.address || '';
        rec.Email_1_Type        = emails[0]?.type    || '';
        rec.Email_2             = emails[1]?.address || '';
        rec.Email_2_Type        = emails[1]?.type    || '';
        rec.Email_3             = emails[2]?.address || '';
        rec.Email_3_Type        = emails[2]?.type    || '';
        rec.Contact_Preference  = el.querySelector('input[data-field="comm-pref"]:checked')?.value || '';
        rec.Lead_Source         = el.querySelector('[data-field="lead-source"]').value;
        rec.Referred_By         = el.querySelector('[data-field="referred-by"]').value.trim();
        rec.People_Notes        = el.querySelector('[data-field="client-notes"]').value.trim();
      }

      // Create new DB_People entries from any added persons
      const relLinks = AppData.tables['Link_People_Relationship'] || [];
      el.querySelectorAll('[data-person-summary]').forEach(row => {
        const d = JSON.parse(row.dataset.personSummary);
        if (!d.firstName && !d.lastName) return;
        const newPerson = {
          People_ID:          _generateId('PEO'),
          Date_Created:       now,
          Date_Modified:      now,
          People_Status:      'Active',
          People_Title:       d.title        || '',
          People_First_Name:  d.firstName,
          People_Last_Name:   d.lastName,
          Display_Name:       d.lastName ? `${d.lastName}, ${d.firstName}` : d.firstName,
          Phone_1:            d.phones?.[0]?.number || '',
          Phone_1_Type:       d.phones?.[0]?.type   || '',
          Phone_2:            d.phones?.[1]?.number || '',
          Phone_2_Type:       d.phones?.[1]?.type   || '',
          Email_1:            d.emails?.[0]?.address || '',
          Email_1_Type:       d.emails?.[0]?.type    || '',
          People_Notes:       d.notes || '',
        };
        people.push(newPerson);
        relLinks.push({
          Link_People_Relationship_ID: _generateId('LPR'),
          Date_Created:                now,
          People_ID_1:                 person.People_ID,
          People_ID_2:                 newPerson.People_ID,
          Link_Role:                   d.relationship || '',
        });
      });

      WidgetManager.close(widgetId);
    });
  }

  function _editCompanyHTML(company) {
    return `<div class="widget-form">
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Company Name</label>
          <input class="form-input" data-field="company-name" type="text"
                 value="${company.Company_Name || ''}" autocomplete="off">
        </div>
        <div class="btn-spacer"></div>
      </div>
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">DBA</label>
          <input class="form-input" data-field="company-dba" type="text"
                 value="${company.Company_DBA || ''}" autocomplete="off">
        </div>
        <div class="btn-spacer"></div>
      </div>
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Vendor Type</label>
          <select class="form-select" data-field="vendor-type">
            <option value="">-- Select --</option>
            ${['Subcontractor', 'Supplier', 'Professional Services'].map(t =>
              `<option${t === (company.Vendor_Type || '') ? ' selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Vendor Category</label>
          <input class="form-input" data-field="vendor-category" type="text"
                 value="${company.Vendor_Category || ''}" autocomplete="off">
        </div>
        <div class="btn-spacer"></div>
      </div>
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Lead Source</label>
          <select class="form-select" data-field="lead-source">
            ${_options('leadSources', false, company.Lead_Source || '')}
          </select>
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Referred By</label>
          <input class="form-input" data-field="referred-by" type="text"
                 value="${company.Referred_By || ''}" autocomplete="off">
        </div>
        <div class="btn-spacer"></div>
      </div>
      ${_notesRowHTML('data-field="company-notes"', 'Notes', { value: company.Notes || '' })}
      <div class="widget-footer">
        <button class="btn-danger" data-action="delete-record">Delete</button>
        <button class="btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn-primary" data-action="save">Save</button>
      </div>
    </div>`;
  }

  function _bindEditCompanyForm(company, widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    el.querySelector('[data-field="company-name"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-field="company-dba"]').addEventListener('input', _formatNameField);
    el.querySelector('[data-field="referred-by"]').addEventListener('input', _formatNameField);
    _bindAutoExpand(el.querySelector('[data-field="company-notes"]'), 5, widgetId);

    el.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(widgetId);
    });

    el.querySelector('[data-action="delete-record"]').addEventListener('click', () => {
      if (!confirm(`Delete ${company.Company_DBA || company.Company_Name}? This cannot be undone.`)) return;
      const companies = AppData.tables['DB_Company'] || [];
      const idx = companies.findIndex(c => c.Company_ID === company.Company_ID);
      if (idx !== -1) companies.splice(idx, 1);
      WidgetManager.close(widgetId);
      const profileId = `profile-company-${company.Company_ID}`;
      if (document.getElementById('widget-' + profileId)) WidgetManager.close(profileId);
    });

    el.querySelector('[data-action="save"]').addEventListener('click', () => {
      const name = el.querySelector('[data-field="company-name"]').value.trim();
      if (!name) {
        el.querySelector('[data-field="company-name"]').style.borderColor = 'var(--color-danger)';
        el.querySelector('[data-field="company-name"]').focus();
        return;
      }
      const rec = (AppData.tables['DB_Company'] || []).find(c => c.Company_ID === company.Company_ID);
      if (rec) {
        rec.Company_Name      = name;
        rec.Company_DBA       = el.querySelector('[data-field="company-dba"]').value.trim();
        rec.Vendor_Type       = el.querySelector('[data-field="vendor-type"]').value;
        rec.Vendor_Category   = el.querySelector('[data-field="vendor-category"]').value.trim();
        rec.Lead_Source       = el.querySelector('[data-field="lead-source"]').value;
        rec.Referred_By       = el.querySelector('[data-field="referred-by"]').value.trim();
        rec.Notes             = el.querySelector('[data-field="company-notes"]').value.trim();
      }
      WidgetManager.close(widgetId);
    });
  }

  function openEditContact(type, id) {
    if (type === 'person') {
      const person = (AppData.tables['DB_People'] || []).find(p => p.People_ID === id);
      if (!person) return;
      const widgetId = `edit-person-${id}`;
      const title    = `Edit — ${person.People_Last_Name}, ${person.People_First_Name}`;
      if (WidgetManager.open(widgetId, title, _editPersonHTML(person), {
        width: 425, autoHeight: true, category: 'contact',
      }) !== false) _bindEditPersonForm(person, widgetId);

    } else if (type === 'company') {
      const company = (AppData.tables['DB_Company'] || []).find(c => c.Company_ID === id);
      if (!company) return;
      const widgetId = `edit-company-${id}`;
      const title    = `Edit — ${company.Company_DBA || company.Company_Name}`;
      if (WidgetManager.open(widgetId, title, _editCompanyHTML(company), {
        width: 425, autoHeight: true, category: 'contact',
      }) !== false) _bindEditCompanyForm(company, widgetId);
    }
  }

  /* ── Phone Book helpers ──────────────────────────────────── */
  function _pbGetLabels(view) {
    if (view === 'companies') {
      return [...new Set(
        (AppData.tables['DB_Company'] || []).map(c => c.Vendor_Category).filter(Boolean)
      )].sort();
    }
    if (view === 'clients') {
      return [...new Set(
        (AppData.tables['DB_People'] || [])
          .filter(p => p.Is_Client === 'Yes')
          .map(p => p.Client_Type).filter(Boolean)
      )].sort();
    }
    return [];
  }

  function _phonebookHTML() {
    return `<div class="phonebook-widget">
      <div class="pb-sidebar">
        <button class="btn-primary pb-new-btn" data-action="new-contact">+ New Contact</button>
        <button class="pb-nav-btn active" data-view="all">All</button>
        <button class="pb-nav-btn" data-view="clients">Clients</button>
        <button class="pb-nav-btn" data-view="companies">Companies</button>
        <button class="pb-nav-btn" data-view="employees" disabled>Employees</button>
        <button class="pb-nav-btn" data-view="personal" disabled>Personal</button>
        <div class="pb-labels-section" style="display:none">
          <div class="pb-labels-header">Labels</div>
          <div class="pb-labels-list"></div>
        </div>
        <div class="pb-sidebar-footer">
          <button class="pb-nav-btn" disabled>Merge</button>
        </div>
      </div>
      <div class="pb-main">
        <div class="pb-toolbar">
          <input class="pb-search" type="text" placeholder="Search contacts..." autocomplete="off">
        </div>
        <div class="pb-col-headers">
          <div class="pb-col-header pb-col-name" data-sort="name">Name <span class="pb-sort-icon"></span></div>
          <div class="pb-col-header pb-col-phone" data-sort="phone">Phone</div>
          <div class="pb-col-header pb-col-email">Email</div>
        </div>
        <div class="pb-list-wrap">
          <div class="pb-list"></div>
        </div>
        <div class="widget-footer">
          <button class="btn-secondary" data-action="cancel">Close</button>
        </div>
      </div>
    </div>`;
  }

  function _pbRender(listEl, view, labelFilter, sortCol, sortDir, searchText) {
    const people    = AppData.tables['DB_People']  || [];
    const companies = AppData.tables['DB_Company'] || [];
    const q  = searchText.toLowerCase();
    const qD = q.replace(/\D/g, '');
    const rows = [];

    if (view !== 'companies') {
      let pool = people;
      if (view === 'clients')   pool = pool.filter(p => p.Is_Client   === 'Yes');
      if (view === 'employees') pool = pool.filter(p => p.Is_Employee === 'Yes');
      if (view === 'personal')  pool = pool.filter(p => p.Is_Personal === 'Yes');
      if (labelFilter)          pool = pool.filter(p => p.Client_Type === labelFilter);

      pool.forEach(p => {
        if (q) {
          const name = `${p.People_First_Name || ''} ${p.People_Last_Name || ''}`.toLowerCase();
          const rev  = `${p.People_Last_Name  || ''}, ${p.People_First_Name || ''}`.toLowerCase();
          const ph   = (p.Phone_1 || '').replace(/\D/g, '');
          const em   = (p.Email_1 || '').toLowerCase();
          if (!name.includes(q) && !rev.includes(q) && !em.includes(q) && !(qD.length >= 3 && ph.includes(qD))) return;
        }
        rows.push({
          type:  'person',
          id:    p.People_ID,
          key:   `${p.People_Last_Name} ${p.People_First_Name}`.toLowerCase(),
          name:  `${p.People_Last_Name}, ${p.People_First_Name}`,
          phone: p.Phone_1 || '',
          email: p.Email_1 || '',
        });
      });
    }

    if (view === 'all' || view === 'companies') {
      let pool = companies;
      if (labelFilter) pool = pool.filter(c => c.Vendor_Category === labelFilter);

      pool.forEach(c => {
        const nameLower = (c.Company_DBA || c.Company_Name || '').toLowerCase();
        if (q && !nameLower.includes(q)) return;
        rows.push({
          type:  'company',
          id:    c.Company_ID,
          key:   nameLower,
          name:  c.Company_DBA || c.Company_Name,
          phone: c.Phone_1 || '',
          email: c.Email_1 || '',
        });
      });
    }

    rows.sort((a, b) => {
      const va = sortCol === 'phone' ? a.phone.replace(/\D/g, '') : a.key;
      const vb = sortCol === 'phone' ? b.phone.replace(/\D/g, '') : b.key;
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    if (!rows.length) { listEl.innerHTML = '<div class="pb-empty">No results</div>'; return; }

    listEl.innerHTML = rows.map(r => `
      <div class="pb-row" data-type="${r.type}" data-id="${r.id}">
        <div class="pb-cell pb-col-name">${r.name}</div>
        <div class="pb-cell pb-col-phone">${r.phone}</div>
        <div class="pb-cell pb-col-email">${r.email}</div>
      </div>`).join('');
  }

  function _bindPhonebook(widgetId, editMode = false) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    let activeView  = 'all';
    let labelFilter = '';
    let sortCol     = 'name';
    let sortDir     = 'asc';
    let searchText  = '';
    let searchTimer = null;

    function _updateLabels() {
      const section  = el.querySelector('.pb-labels-section');
      const labelsEl = el.querySelector('.pb-labels-list');
      const labels   = _pbGetLabels(activeView);
      if (!labels.length) { section.style.display = 'none'; return; }
      section.style.display = '';
      labelsEl.innerHTML = labels.map(l =>
        `<button class="pb-label-btn${labelFilter === l ? ' active' : ''}" data-label="${l}">${l}</button>`
      ).join('');
    }

    function render() {
      el.querySelectorAll('.pb-col-header[data-sort] .pb-sort-icon').forEach(icon => { icon.textContent = ''; });
      const activeIcon = el.querySelector(`.pb-col-header[data-sort="${sortCol}"] .pb-sort-icon`);
      if (activeIcon) activeIcon.textContent = sortDir === 'asc' ? ' ▲' : ' ▼';
      _pbRender(el.querySelector('.pb-list'), activeView, labelFilter, sortCol, sortDir, searchText);
    }

    // Nav buttons
    el.querySelector('.pb-sidebar').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-view]');
      if (!btn || btn.disabled) return;
      activeView  = btn.dataset.view;
      labelFilter = '';
      sortCol     = 'name';
      sortDir     = 'asc';
      searchText  = '';
      el.querySelector('.pb-search').value = '';
      el.querySelectorAll('.pb-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _updateLabels();
      render();
    });

    // Label buttons
    el.querySelector('.pb-labels-list').addEventListener('click', function (e) {
      const btn = e.target.closest('.pb-label-btn');
      if (!btn) return;
      labelFilter = labelFilter === btn.dataset.label ? '' : btn.dataset.label;
      el.querySelectorAll('.pb-label-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.label === labelFilter)
      );
      render();
    });

    // Search
    el.querySelector('.pb-search').addEventListener('input', function () {
      clearTimeout(searchTimer);
      const val = this.value;
      searchTimer = setTimeout(() => { searchText = val; render(); }, 200);
    });

    // Sort
    el.querySelector('.pb-col-headers').addEventListener('click', function (e) {
      const header = e.target.closest('[data-sort]');
      if (!header) return;
      const col = header.dataset.sort;
      if (col === sortCol) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortCol = col; sortDir = 'asc'; }
      render();
    });

    // Row click
    el.querySelector('.pb-list').addEventListener('click', function (e) {
      const row = e.target.closest('.pb-row');
      if (!row) return;
      if (editMode) openEditContact(row.dataset.type, row.dataset.id);
      else openProfile(row.dataset.type, row.dataset.id);
    });

    // Footer actions
    el.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'cancel')      WidgetManager.close(widgetId);
      if (btn.dataset.action === 'new-contact') openNewContact();
    });

    _updateLabels();
    render();
  }

  /* ── Public: open phone book widget ──────────────────────── */
  function openNewContactFromSearch(query) {
    const id     = 'new-contact-' + Date.now();
    const opened = WidgetManager.open(id, 'New Contact', _newClientHTML(id), {
      width: 425, autoHeight: true, category: 'contact',
      getLabel: (el) => {
        const last  = el.querySelector('[data-field="last-name"]')?.value.trim()  || '';
        const first = el.querySelector('[data-field="first-name"]')?.value.trim() || '';
        if (last && first) return `${last}, ${first}`;
        return last || first || '';
      },
    });
    if (opened === false) return;
    _bindNewClientForm(id);

    const el     = document.getElementById('widget-' + id);
    if (!el) return;
    const digits = query.replace(/\D/g, '');

    if (digits.length >= 7) {
      // Looks like a phone number — pre-fill Phone field
      const phoneInput = el.querySelector('input[data-phone]');
      phoneInput.value = query;
      phoneInput.dispatchEvent(new Event('input'));

    } else if (/^\d+\s+\S/.test(query)) {
      // Starts with a number followed by text — likely a street address
      el.querySelector('[data-addr="street1"]').value = query;
      el.querySelector('[data-addr="street1"]').dispatchEvent(new Event('input'));

    } else {
      // Treat as a name — split on comma or whitespace
      let first = '', last = '';
      if (query.includes(',')) {
        const parts = query.split(',').map(s => s.trim());
        last  = parts[0] || '';
        first = parts[1] || '';
      } else {
        const parts = query.trim().split(/\s+/);
        first = parts[0]              || '';
        last  = parts.slice(1).join(' ') || '';
      }
      el.querySelector('[data-field="first-name"]').value = first;
      el.querySelector('[data-field="last-name"]').value  = last;
      el.querySelector('[data-field="first-name"]').dispatchEvent(new Event('input'));
      el.querySelector('[data-field="last-name"]').dispatchEvent(new Event('input'));
    }
  }

  function openPhonebook(opts = {}) {
    const editMode = !!opts.editMode;
    const widgetId = editMode ? 'phonebook-edit' : 'phonebook';
    const title    = editMode ? 'Edit Contact' : 'Phone Book';
    if (WidgetManager.open(widgetId, title, _phonebookHTML(), {
      width: 720, height: 480,
    }) !== false) _bindPhonebook(widgetId, editMode);
  }

  /* ── Public: open profile widget ─────────────────────────── */
  function openProfile(type, id) {
    const widgetId = `profile-${type}-${id}`;

    if (type === 'person') {
      const person = (AppData.tables['DB_People'] || []).find(p => p.People_ID === id);
      if (!person) return;
      const title = `${person.People_Last_Name}, ${person.People_First_Name}`;
      if (WidgetManager.open(widgetId, title, _personProfileHTML(person), {
        width: 300, autoHeight: true, noDock: true,
      }) !== false) _bindProfileWidget(widgetId);

    } else if (type === 'company') {
      const company = (AppData.tables['DB_Company'] || []).find(c => c.Company_ID === id);
      if (!company) return;
      const title = company.Company_DBA || company.Company_Name;
      if (WidgetManager.open(widgetId, title, _companyProfileHTML(company), {
        width: 300, autoHeight: true, noDock: true,
      }) !== false) _bindProfileWidget(widgetId);

    } else if (type === 'property') {
      const property = (AppData.tables['DB_Property'] || []).find(p => p.Property_ID === id);
      if (!property) return;
      const title = property.Address_Street_1;
      if (WidgetManager.open(widgetId, title, _propertyProfileHTML(property), {
        width: 300, autoHeight: true, noDock: true,
      }) !== false) _bindProfileWidget(widgetId);
    }
  }

  return { openNewContact, openNewContactFromSearch, openProfile, openPhonebook, openEditContact };

})();
