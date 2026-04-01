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

  /* ── Build select options HTML ────────────────────────────── */
  function _options(listKey, includeBlank = false) {
    const items = _getList(listKey);
    const blank = includeBlank ? '<option value="">-- Select --</option>' : '';
    return blank + items.map(i => `<option>${i}</option>`).join('');
  }

  /* ── Phone row HTML (shared by main form and person widget) ── */
  function _phoneRowHTML(idx, includeAddBtn) {
    return `
      <div class="contact-row">
        <div class="form-group" style="flex:0 0 46px">
          <label class="form-label">CC</label>
          <input class="form-input" type="text" data-phone-cc data-index="${idx}"
                 value="+1" maxlength="5" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-input" type="tel" placeholder="(000) 000-0000"
                 data-phone data-index="${idx}" autocomplete="off">
        </div>
        <div class="form-group" style="flex:0 0 100px">
          <label class="form-label">Type</label>
          <select class="form-select" data-phone-type data-index="${idx}">
            ${_options('phoneTypes')}
          </select>
        </div>
        ${includeAddBtn
          ? `<button class="btn-action" data-action="add-phone" tabindex="-1" disabled><b style="font-size:14px">+</b> Phone</button>`
          : `<button class="btn-remove" type="button" title="Remove">&#10005;</button>`}
      </div>
    `;
  }

  /* ── Email row HTML (shared by main form and person widget) ── */
  function _emailRowHTML(idx, includeAddBtn) {
    return `
      <div class="contact-row">
        <div style="flex:0 0 46px"></div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" placeholder="email@example.com"
                 data-email data-index="${idx}" autocomplete="off">
        </div>
        <div class="form-group" style="flex:0 0 100px">
          <label class="form-label">Type</label>
          <select class="form-select" data-email-type data-index="${idx}">
            ${_options('emailTypes')}
          </select>
        </div>
        ${includeAddBtn
          ? `<button class="btn-action" data-action="add-email" tabindex="-1" disabled><b style="font-size:14px">+</b> Email</button>`
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
      rowEl.querySelector('input[data-phone]').addEventListener('input', _updatePhoneBtn);
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
      rowEl.querySelector('input[data-email]').addEventListener('input', _updateEmailBtn);
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
      phones.push({ number: input.value.trim(), countryCode: cc, type, preferred: phones.length === 0 });
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
    return `
      <div data-address-block data-addr-index="${index}">
        <div class="form-group">
          <label class="form-label">Street Address</label>
          <input class="form-input" data-addr="street1" type="text"
                 placeholder="123 Main St" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">Street 2 / Unit / PO Box</label>
          <input class="form-input" data-addr="street2" type="text"
                 placeholder="Apt, Suite, Unit, PO Box..." autocomplete="off">
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">City</label>
            <input class="form-input" data-addr="city" type="text" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 44px">
            <label class="form-label">State</label>
            <input class="form-input" data-addr="state" type="text"
                   maxlength="2" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 72px">
            <label class="form-label">Zip</label>
            <input class="form-input" data-addr="zip" type="text"
                   maxlength="10" autocomplete="off">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Property Type</label>
            <select class="form-select" data-addr="prop-type">
              ${_options('propertyTypes', true)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Property Use</label>
            <select class="form-select" data-addr="prop-use">
              ${_options('propertyUses', true)}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Property Notes</label>
          <textarea class="form-textarea" data-addr="notes"
                    placeholder="Gate code, parking, access notes..."></textarea>
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
                   placeholder="First" autocomplete="off">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input class="form-input" data-ap="last-name" type="text"
                   placeholder="Last" autocomplete="off">
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
        ${_addressBlockHTML(0)}
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
    WidgetManager.open(id, 'New Client', _newClientHTML(), { width: 500, height: 600 });
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

        <div class="form-divider"></div>

        <!-- Name -->
        <div class="form-row" style="align-items:flex-end">
          <div class="form-group" style="flex:0 0 68px">
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
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input class="form-input" data-field="first-name" type="text"
                   placeholder="First" autocomplete="off">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input class="form-input" data-field="last-name" type="text"
                   placeholder="Last" autocomplete="off">
          </div>
          <button class="btn-action" data-action="add-person"
                  tabindex="-1" style="align-self:flex-end" disabled><b style="font-size:14px">+</b> Person</button>
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
              ${_options('leadSources', true)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Referred By</label>
            <input class="form-input" data-field="referred-by" type="text"
                   placeholder="Name" autocomplete="off">
          </div>
        </div>

        <!-- Client Notes -->
        <div class="form-group">
          <label class="form-label">Client Notes</label>
          <textarea class="form-textarea" data-field="client-notes"
                    placeholder="Personal notes about this client..."></textarea>
        </div>

        <!-- Additional People (summary rows appear here) -->
        <div data-container="additional-people"></div>

        <div class="form-divider"></div>

        <!-- Primary Address -->
        ${_addressBlockHTML(0)}

        <!-- Additional Addresses (summary rows appear here) -->
        <div data-container="additional-addresses"></div>
        <button class="btn-action" data-action="add-address"
                tabindex="-1" style="align-self:flex-end"><b style="font-size:14px">+</b> Address</button>

        <div class="form-divider"></div>

        <!-- Status -->
        <div class="form-group">
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

        <!-- Footer -->
        <div class="widget-footer">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="save">Save Client</button>
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
