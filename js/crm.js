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
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
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
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toLowerCase();
    e.target.setSelectionRange(pos, pos);
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
  function _options(listKey, defaultFirst = false) {
    const items = _getList(listKey);
    const blank = defaultFirst ? '' : '<option value="">-- Select --</option>';
    return blank + items.map(i => `<option>${i}</option>`).join('');
  }

  /* ── Phone row HTML (shared by main form and person widget) ── */
  function _phoneRowHTML(idx, includeAddBtn) {
    return `
      <div class="contact-row">
        <div class="form-group" style="flex:0 0 36px">
          <label class="form-label">CC</label>
          <input class="form-input" type="text" data-phone-cc data-index="${idx}"
                 value="+1" maxlength="5" autocomplete="off">
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Phone</label>
          <input class="form-input" type="tel" placeholder=""
                 data-phone data-index="${idx}" autocomplete="off">
        </div>
        <div class="form-group" style="flex:0 0 40px">
          <label class="form-label">Ext.</label>
          <input class="form-input" type="text" data-phone-ext data-index="${idx}"
                 maxlength="6" autocomplete="off">
        </div>
        <div class="form-group" style="flex:0 0 82px">
          <label class="form-label">Type</label>
          <select class="form-select" data-phone-type data-index="${idx}">
            ${_options('phoneTypes', true)}
          </select>
        </div>
        ${includeAddBtn
          ? `<button class="btn-action" data-action="add-phone" tabindex="-1" disabled>+ Phone</button>`
          : `<button class="btn-remove" type="button" title="Remove">&#10005;</button>`}
      </div>
    `;
  }

  /* ── Email row HTML (shared by main form and person widget) ── */
  function _emailRowHTML(idx, includeAddBtn) {
    return `
      <div class="contact-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" placeholder=""
                 data-email data-index="${idx}" autocomplete="off">
        </div>
        <div class="form-group" style="flex:0 0 82px">
          <label class="form-label">Type</label>
          <select class="form-select" data-email-type data-index="${idx}">
            ${_options('emailTypes', true)}
          </select>
        </div>
        ${includeAddBtn
          ? `<button class="btn-action" data-action="add-email" tabindex="-1" disabled>+ Email</button>`
          : `<button class="btn-remove" type="button" title="Remove">&#10005;</button>`}
      </div>
    `;
  }

  /* ── Reusable phone/email bind logic ──────────────────────── */
  function _bindPhoneEmailRows(containerEl, phoneContainerSel, emailContainerSel) {
    let phoneCount = 1;
    let emailCount = 1;

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

    containerEl.querySelector('input[data-phone][data-index="0"]')
      ?.addEventListener('input', _updatePhoneBtn);
    containerEl.querySelector('input[data-email][data-index="0"]')
      ?.addEventListener('input', _updateEmailBtn);

    addPhoneBtn?.addEventListener('click', function () {
      const idx = phoneCount++;
      const row = document.createElement('div');
      row.innerHTML = _phoneRowHTML(idx, false);
      const rowEl = row.firstElementChild;
      rowEl.querySelector('.btn-remove').addEventListener('click', () => {
        rowEl.remove();
        phoneCount--;
        _updatePhoneBtn();
      });
      const phoneInput = rowEl.querySelector('input[data-phone]');
      phoneInput.addEventListener('input', _updatePhoneBtn);
      phoneInput.addEventListener('input', _formatPhone);
      rowEl.querySelector('input[data-phone-cc]').addEventListener('input', _formatCC);
      rowEl.querySelector('input[data-phone-ext]').addEventListener('input', _formatExt);
      containerEl.querySelector(phoneContainerSel).appendChild(rowEl);
      _updatePhoneBtn();
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
      });
      const emailInput = rowEl.querySelector('input[data-email]');
      emailInput.addEventListener('input', _updateEmailBtn);
      emailInput.addEventListener('input', _formatEmail);
      containerEl.querySelector(emailContainerSel).appendChild(rowEl);
      _updateEmailBtn();
    });
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
  function _addressBlockHTML(index) {
    const isFirst = index === 0;
    return `
      <div data-address-block data-addr-index="${index}">
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Street Address</label>
            <input class="form-input" data-addr="street1" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 80px">
            <label class="form-label">Unit / PO Box</label>
            <input class="form-input" data-addr="street2" type="text"
                   placeholder="" autocomplete="off">
          </div>
          ${isFirst
            ? `<button class="btn-action" data-action="add-address" tabindex="-1">+ Address</button>`
            : `<div class="btn-spacer"></div>`}
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">City</label>
            <input class="form-input" data-addr="city" type="text" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 30px">
            <label class="form-label" style="left:0;right:0;text-align:center;padding:0">State</label>
            <input class="form-input" data-addr="state" type="text"
                   maxlength="3" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 78px">
            <label class="form-label">Zip Code</label>
            <input class="form-input" data-addr="zip" type="text"
                   maxlength="10" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Property Type</label>
            <select class="form-select" data-addr="prop-type">
              ${_options('propertyTypes')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Property Use</label>
            <select class="form-select" data-addr="prop-use">
              ${_options('propertyUses')}
            </select>
          </div>
          <div class="btn-spacer"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Property Notes</label>
            <textarea class="form-textarea" data-addr="notes"
                      placeholder=""></textarea>
          </div>
          <div class="btn-spacer"></div>
        </div>
      </div>
    `;
  }

  /* ── Person side widget HTML ──────────────────────────────── */
  function _personSideWidgetHTML() {
    return `
      <div class="widget-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input class="form-input" data-ap="first-name" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input class="form-input" data-ap="last-name" type="text"
                   placeholder="" autocomplete="off">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Relationship</label>
          <select class="form-select" data-ap="relationship">
            <option>Spouse</option>
            <option>Partner</option>
            <option>Co-owner</option>
            <option>Other</option>
          </select>
        </div>
        <!-- Phones -->
        <div data-container="ap-phones">
          ${_phoneRowHTML(0, true)}
        </div>
        <!-- Emails -->
        <div data-container="ap-emails">
          ${_emailRowHTML(0, true)}
        </div>
        <div class="widget-footer">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="save">Save</button>
        </div>
      </div>
    `;
  }

  /* ── Address side widget HTML ─────────────────────────────── */
  function _addressSideWidgetHTML() {
    return `
      <div class="widget-form">
        ${_addressBlockHTML(1)}
        <div class="widget-footer">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="save">Save</button>
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
  function openNewClient() {
    const id = 'new-client-' + Date.now();
    WidgetManager.open(id, 'New Client', _newClientHTML(), { width: 425, height: 510 });
    _bindNewClientForm(id);
    requestAnimationFrame(() => {
      document.getElementById('widget-' + id)
        ?.querySelector('[data-field="first-name"]')
        ?.focus();
    });
  }

  function _newClientHTML() {
    return `
      <div class="widget-form">

        <!-- Name -->
        <div class="form-row">
          <div class="form-group" style="flex:0 0 62px">
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
          <div class="form-group" style="flex:0 0 100px">
            <label class="form-label">First Name</label>
            <input class="form-input" data-field="first-name" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="form-group" style="flex:1">
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

        <!-- Lead Source / Referred By -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Lead Source</label>
            <select class="form-select" data-field="lead-source">
              ${_options('leadSources')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Referred By</label>
            <input class="form-input" data-field="referred-by" type="text"
                   placeholder="" autocomplete="off">
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Client Notes -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Client Notes</label>
            <textarea class="form-textarea" data-field="client-notes"
                      placeholder=""></textarea>
          </div>
          <div class="btn-spacer"></div>
        </div>

        <!-- Additional People (summary rows appear here) -->
        <div data-container="additional-people"></div>

        <div class="form-divider"></div>

        <!-- Primary Address -->
        ${_addressBlockHTML(0)}

        <!-- Additional Addresses (summary rows appear here) -->
        <div data-container="additional-addresses"></div>

        <!-- Status + actions on same row -->
        <div class="form-row" style="align-items:center">
          <div class="form-group" style="flex:1">
            <label class="form-label">Status</label>
            <div class="status-row">
              <label class="status-option">
                <input type="radio" name="client-status" value="Active" checked> Active
              </label>
              <label class="status-option">
                <input type="radio" name="client-status" value="Inactive"> Inactive
              </label>
            </div>
          </div>
          <button class="btn-secondary" data-action="cancel" style="margin-left:6px">Cancel</button>
          <button class="btn-primary" data-action="save" style="margin-left:6px">Save Client</button>
        </div>

      </div>
    `;
  }

  /* ── Bind new client form events ──────────────────────────── */
  function _bindNewClientForm(widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    // Phone / Email add buttons
    _bindPhoneEmailRows(el, '[data-container="phones"]', '[data-container="emails"]');

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
    let openPanelId = null;

    function _closeOpenPanel() {
      if (openPanelId) {
        WidgetManager.close(openPanelId);
        openPanelId = null;
      }
    }

    // + Person disabled until First Name has content
    const addPersonBtn = el.querySelector('[data-action="add-person"]');
    el.querySelector('[data-field="first-name"]').addEventListener('input', function () {
      addPersonBtn.disabled = this.value.trim() === '';
    });

    addPersonBtn.addEventListener('click', function () {
      addPersonBtn.disabled = true;
      const sideId   = 'side-person-' + Date.now();
      openPanelId    = sideId;
      const mainLeft = parseInt(el.style.left) || 0;
      const mainTop  = parseInt(el.style.top)  || 0;
      WidgetManager.open(sideId, 'Add Person', _personSideWidgetHTML(), {
        width:  420,
        height: 400,
        top:    mainTop + 30,
        left:   mainLeft + el.offsetWidth,
        panel:  true,
      });
      _bindPersonSideWidget(sideId, el, addPersonBtn, () => { openPanelId = null; });
    });

    // + Address → side widget
    const addAddressBtn = el.querySelector('[data-action="add-address"]');
    addAddressBtn.addEventListener('click', function () {
      addAddressBtn.disabled = true;
      const sideId   = 'side-address-' + Date.now();
      openPanelId    = sideId;
      const mainLeft = parseInt(el.style.left) || 0;
      const mainTop  = parseInt(el.style.top)  || 0;
      WidgetManager.open(sideId, 'Add Address', _addressSideWidgetHTML(), {
        width:  360,
        height: 440,
        top:    mainTop + 30,
        left:   mainLeft + el.offsetWidth,
        panel:  true,
      });
      _bindAddressSideWidget(sideId, el, addAddressBtn, () => { openPanelId = null; });
    });

    // Cancel — also closes any open panel
    el.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      _closeOpenPanel();
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
    _bindPhoneEmailRows(sideEl, '[data-container="ap-phones"]', '[data-container="ap-emails"]');

    // Formatters
    sideEl.querySelector('[data-ap="first-name"]').addEventListener('input', _formatNameField);
    sideEl.querySelector('[data-ap="last-name"]').addEventListener('input', _formatNameField);
    sideEl.querySelector('input[data-phone]').addEventListener('input', _formatPhone);
    sideEl.querySelector('input[data-phone-cc]').addEventListener('input', _formatCC);
    sideEl.querySelector('input[data-phone-ext]')?.addEventListener('input', _formatExt);
    sideEl.querySelector('input[data-email]').addEventListener('input', _formatEmail);

    function _reEnable() { addPersonBtn.disabled = false; if (onClose) onClose(); }

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
        firstName,
        lastName,
        relationship: sideEl.querySelector('[data-ap="relationship"]').value,
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

  /* ── Bind address side widget ─────────────────────────────── */
  function _bindAddressSideWidget(sideId, mainEl, addAddressBtn, onClose) {
    const sideEl = document.getElementById('widget-' + sideId);
    if (!sideEl) return;

    function _reEnable() { addAddressBtn.disabled = false; if (onClose) onClose(); }

    sideEl.querySelector('[data-addr="zip"]').addEventListener('input', _formatZip);
    sideEl.querySelector('[data-addr="state"]').addEventListener('input', _formatState);

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
      status:       el.querySelector('input[name="client-status"]:checked')?.value || 'Active',
      type:         'Client',
      clientType:   'Residential',
      title:        el.querySelector('[data-field="title"]').value,
      firstName,
      lastName,
      displayName:  lastName ? `${lastName}, ${firstName}` : firstName,
      phones:       _collectPhones(el),
      emails:       _collectEmails(el),
      leadSource:   el.querySelector('[data-field="lead-source"]').value,
      referredBy:   el.querySelector('[data-field="referred-by"]').value.trim(),
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
        status:       person.status,
        type:         'Client',
        clientType:   'Residential',
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

  return { openNewClient };

})();
