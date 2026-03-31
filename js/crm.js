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

  /* ── Address block HTML (reused for primary + additional) ─── */
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

  /* ── Additional person block HTML ─────────────────────────── */
  function _additionalPersonHTML(index) {
    return `
      <div data-person-block data-person-index="${index}"
           style="border-left:3px solid var(--color-brand-accent);
                  padding-left:8px; margin-top:6px">
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
        <div class="contact-row" style="margin-top:6px">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" data-ap="phone" type="tel"
                   placeholder="(000) 000-0000" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 88px">
            <label class="form-label">Type</label>
            <select class="form-select" data-ap="phone-type">
              ${_options('phoneTypes')}
            </select>
          </div>
        </div>
        <div class="contact-row" style="margin-top:6px">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" data-ap="email" type="email"
                   placeholder="email@example.com" autocomplete="off">
          </div>
          <div class="form-group" style="flex:0 0 88px">
            <label class="form-label">Type</label>
            <select class="form-select" data-ap="email-type">
              ${_options('emailTypes')}
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:6px">
          <label class="form-label">Relationship</label>
          <select class="form-select" data-ap="relationship">
            <option>Spouse</option>
            <option>Partner</option>
            <option>Co-owner</option>
            <option>Other</option>
          </select>
        </div>
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
          <button class="btn-action" data-action="add-person" tabindex="-1">+ Add Person</button>
        </div>

        <div class="form-divider"></div>

        <!-- Phones -->
        <div data-container="phones">
          <div class="contact-row">
            <div class="form-group" style="flex:0 0 46px">
              <label class="form-label">CC</label>
              <input class="form-input" type="text" data-phone-cc data-index="0"
                     value="+1" maxlength="5" autocomplete="off">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" type="tel" placeholder="(000) 000-0000"
                     data-phone data-index="0" autocomplete="off">
            </div>
            <div class="form-group" style="flex:0 0 100px">
              <label class="form-label">Type</label>
              <select class="form-select" data-phone-type data-index="0">
                ${_options('phoneTypes')}
              </select>
            </div>
            <button class="btn-action" data-action="add-phone" tabindex="-1">+ Add Phone</button>
          </div>
        </div>

        <div class="form-divider"></div>

        <!-- Emails -->
        <div data-container="emails">
          <div class="contact-row">
            <div style="flex:0 0 46px"></div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" placeholder="email@example.com"
                     data-email data-index="0" autocomplete="off">
            </div>
            <div class="form-group" style="flex:0 0 100px">
              <label class="form-label">Type</label>
              <select class="form-select" data-email-type data-index="0">
                ${_options('emailTypes')}
              </select>
            </div>
            <button class="btn-action" data-action="add-email" tabindex="-1">+ Add Email</button>
          </div>
        </div>

        <div class="form-divider"></div>

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

        <!-- Additional People -->
        <div data-container="additional-people"></div>

        <div class="form-divider"></div>

        <!-- Primary Address -->
        ${_addressBlockHTML(0)}

        <!-- Additional Addresses -->
        <div data-container="additional-addresses"></div>
        <button class="btn-action" data-action="add-address"
                tabindex="-1" style="margin-top:6px">+ Add Address</button>

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

    let phoneCount   = 1;
    let emailCount   = 1;
    let personCount  = 0;
    let addressCount = 1;

    // + Add Phone
    el.querySelector('[data-action="add-phone"]').addEventListener('click', function () {
      if (phoneCount >= 3) { this.style.display = 'none'; return; }
      const idx = phoneCount++;
      const row = document.createElement('div');
      row.className = 'contact-row';
      row.style.marginTop = '4px';
      row.innerHTML = `
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
      `;
      el.querySelector('[data-container="phones"]').appendChild(row);
      if (phoneCount >= 3) this.style.display = 'none';
    });

    // + Add Email
    el.querySelector('[data-action="add-email"]').addEventListener('click', function () {
      if (emailCount >= 3) { this.style.display = 'none'; return; }
      const idx = emailCount++;
      const row = document.createElement('div');
      row.className = 'contact-row';
      row.style.marginTop = '4px';
      row.innerHTML = `
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
      `;
      el.querySelector('[data-container="emails"]').appendChild(row);
      if (emailCount >= 3) this.style.display = 'none';
    });

    // + Add Person
    el.querySelector('[data-action="add-person"]').addEventListener('click', function () {
      const idx = personCount++;
      const wrap = document.createElement('div');
      wrap.innerHTML = _additionalPersonHTML(idx);
      el.querySelector('[data-container="additional-people"]').appendChild(wrap.firstElementChild);
    });

    // + Add Address
    el.querySelector('[data-action="add-address"]').addEventListener('click', function () {
      const idx = addressCount++;
      const wrap = document.createElement('div');
      wrap.innerHTML = _addressBlockHTML(idx);
      const block = wrap.firstElementChild;
      block.style.marginTop = '8px';
      block.style.paddingTop = '8px';
      block.style.borderTop = '1px solid var(--color-border-slate)';
      el.querySelector('[data-container="additional-addresses"]').appendChild(block);
    });

    // Cancel
    el.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      WidgetManager.close(widgetId);
    });

    // Save
    el.querySelector('[data-action="save"]').addEventListener('click', () => {
      _saveNewClient(el, widgetId);
    });
  }

  /* ── Save new client to localStorage ─────────────────────── */
  function _saveNewClient(el, widgetId) {
    const firstName = el.querySelector('[data-field="first-name"]').value.trim();
    const lastName  = el.querySelector('[data-field="last-name"]').value.trim();

    // First name required
    if (!firstName) {
      const input = el.querySelector('[data-field="first-name"]');
      input.style.borderColor = 'var(--color-danger)';
      input.focus();
      return;
    }

    // Collect phones (first entry is preferred)
    const phones = [];
    el.querySelectorAll('input[data-phone]').forEach(input => {
      if (input.value.trim()) {
        const idx  = input.dataset.index;
        const type = el.querySelector(`[data-phone-type][data-index="${idx}"]`)?.value || 'Mobile';
        const cc   = el.querySelector(`[data-phone-cc][data-index="${idx}"]`)?.value.trim() || '+1';
        phones.push({ number: input.value.trim(), countryCode: cc, type, preferred: phones.length === 0 });
      }
    });

    // Collect emails (first entry is preferred)
    const emails = [];
    el.querySelectorAll('input[data-email]').forEach(input => {
      if (input.value.trim()) {
        const idx  = input.dataset.index;
        const type = el.querySelector(`[data-email-type][data-index="${idx}"]`)?.value || 'Personal';
        emails.push({ address: input.value.trim(), type, preferred: emails.length === 0 });
      }
    });

    const now = new Date().toISOString();
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
      phones,
      emails,
      leadSource:   el.querySelector('[data-field="lead-source"]').value,
      referredBy:   el.querySelector('[data-field="referred-by"]').value.trim(),
      notes:        el.querySelector('[data-field="client-notes"]').value.trim(),
    };
    people.push(person);

    // Additional people (spouses, co-owners, etc.)
    const allPersonIds = [person.id];
    el.querySelectorAll('[data-person-block]').forEach(block => {
      const apFirst = block.querySelector('[data-ap="first-name"]').value.trim();
      const apLast  = block.querySelector('[data-ap="last-name"]').value.trim();
      if (!apFirst && !apLast) return;
      const apPhone = block.querySelector('[data-ap="phone"]').value.trim();
      const apEmail = block.querySelector('[data-ap="email"]').value.trim();
      const ap = {
        id:           _generateId('PEO'),
        dateCreated:  now,
        dateModified: now,
        status:       person.status,
        type:         'Client',
        clientType:   'Residential',
        firstName:    apFirst,
        lastName:     apLast,
        displayName:  apLast ? `${apLast}, ${apFirst}` : apFirst,
        phones:       apPhone ? [{ number: apPhone, type: block.querySelector('[data-ap="phone-type"]').value, preferred: true }] : [],
        emails:       apEmail ? [{ address: apEmail, type: block.querySelector('[data-ap="email-type"]').value, preferred: true }] : [],
        relationship: block.querySelector('[data-ap="relationship"]').value,
        notes:        '',
      };
      people.push(ap);
      allPersonIds.push(ap.id);
    });
    _setData(KEYS.people, people);

    // Collect all address blocks (primary + additional)
    const properties = _getData(KEYS.properties);
    const links      = _getData(KEYS.links);
    el.querySelectorAll('[data-address-block]').forEach((block, blockIdx) => {
      const street1 = block.querySelector('[data-addr="street1"]').value.trim();
      const city    = block.querySelector('[data-addr="city"]').value.trim();
      if (!street1 && !city) return;

      const property = {
        id:                _generateId('PROP'),
        dateCreated:       now,
        dateModified:      now,
        status:            'Active',
        type:              block.querySelector('[data-addr="prop-type"]').value,
        use:               block.querySelector('[data-addr="prop-use"]').value,
        isPrimaryBilling:  blockIdx === 0,
        street1,
        street2:           block.querySelector('[data-addr="street2"]').value.trim(),
        city,
        state:             block.querySelector('[data-addr="state"]').value.trim(),
        zip:               block.querySelector('[data-addr="zip"]').value.trim(),
        notes:             block.querySelector('[data-addr="notes"]').value.trim(),
      };
      property.fullAddressSearch =
        [property.street1, property.street2, property.city, property.state, property.zip]
          .filter(Boolean).join(' ');

      properties.push(property);

      // Link every person to this property
      allPersonIds.forEach(personId => {
        links.push({
          id:         _generateId('LPP'),
          type:       'property_people',
          propertyId: property.id,
          peopleId:   personId,
          role:       'Owner',
        });
      });
    });
    _setData(KEYS.properties, properties);
    _setData(KEYS.links, links);

    WidgetManager.close(widgetId);
  }

  return { openNewClient };

})();
