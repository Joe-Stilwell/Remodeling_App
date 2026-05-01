'use strict';
/*
 * subwidgets.js — Single source of truth for shared panel widget HTML.
 *
 * SubWidgets.personPanelHTML()  — +Person panel (Title / Name / Phone / Email /
 *                                   Comm Pref / Notes / Relationship)
 * SubWidgets.addressPanelHTML() — +Property panel (Street / City / State / Zip /
 *                                   Type / Use / Notes)
 *
 * Both CRM (crm.js) and Work Order intake (workorders.js) call these instead of
 * maintaining their own copies. Any visual change to either panel is made here once.
 *
 * Bind functions remain in each module — save behavior differs by context:
 *   CRM   — collects data, appends summary row, re-enables trigger button
 *   WO    — collects data, calls onSave callback to fill intake fields
 *
 * Launch dimensions (all callers must match):
 *   Person:  width 360, minWidth 300, autoHeight true
 *   Address: width 360, minWidth 300, autoHeight true
 */

const SubWidgets = (() => {

  const _PHONE_TYPES = ['Mobile', 'Home', 'Work', 'Other'];
  const _EMAIL_TYPES = ['Personal', 'Work', 'Other'];
  const _PROP_TYPES  = ['Single Family', 'Condominium', 'Townhouse', 'Multi-Family',
                        'Office Building', 'Industrial', 'Retail'];
  const _PROP_USES   = ['Primary Residence', 'Vacation Home', 'Rental Property',
                        'Main Office', 'Warehouse', 'Retail Location'];

  function personPanelHTML() {
    const uid       = Date.now();
    const phoneOpts = _PHONE_TYPES.map(t => `<option>${t}</option>`).join('');
    const emailOpts = _EMAIL_TYPES.map(t => `<option>${t}</option>`).join('');
    return `
      <div class="widget-form">

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
            <input class="form-input" data-ap="first-name" type="text" autocomplete="off">
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Last Name</label>
            <input class="form-input" data-ap="last-name" type="text" autocomplete="off">
          </div>
          <div class="btn-spacer" style="width:60px"></div>
        </div>

        <div data-container="ap-phones">
          <div class="contact-row">
            <div class="form-group f-cc">
              <label class="form-label">CC</label>
              <input class="form-input" type="text" data-phone-cc data-index="0"
                     value="+1" maxlength="5" autocomplete="off">
            </div>
            <div class="form-group f-grow">
              <label class="form-label">Phone</label>
              <input class="form-input" type="tel" data-phone data-index="0" autocomplete="off">
            </div>
            <div class="form-group f-ext">
              <label class="form-label">Ext.</label>
              <input class="form-input" type="text" data-phone-ext data-index="0"
                     maxlength="6" autocomplete="off">
            </div>
            <div class="form-group f-sm">
              <label class="form-label">Type</label>
              <select class="form-select" data-phone-type data-index="0">${phoneOpts}</select>
            </div>
            <button class="btn-action sp-btn" data-action="add-phone" tabindex="-1" disabled>+ Phone</button>
          </div>
        </div>

        <div data-container="ap-emails">
          <div class="contact-row">
            <div class="form-group f-grow">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" data-email data-index="0" autocomplete="off">
            </div>
            <div class="form-group f-sm">
              <label class="form-label">Type</label>
              <select class="form-select" data-email-type data-index="0">${emailOpts}</select>
            </div>
            <button class="btn-action sp-btn" data-action="add-email" tabindex="-1" disabled>+ Email</button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Comm. Preference</label>
            <div class="comm-pref-options">
              <label class="comm-pref-option"><input type="radio" name="ap-comm-pref-${uid}" data-ap="comm-pref" value="Email"> Email</label>
              <label class="comm-pref-option"><input type="radio" name="ap-comm-pref-${uid}" data-ap="comm-pref" value="Text"> Text</label>
              <label class="comm-pref-option"><input type="radio" name="ap-comm-pref-${uid}" data-ap="comm-pref" value="Phone"> Phone</label>
            </div>
          </div>
          <div class="btn-spacer" style="width:60px"></div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Contact Notes</label>
            <textarea class="form-textarea" data-ap="notes" maxlength="2000"></textarea>
          </div>
          <div class="btn-spacer" style="width:60px"></div>
        </div>

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
          <button class="btn-secondary sp-btn" data-action="cancel" style="margin-left:6px;margin-top:10px">Cancel</button>
          <button class="btn-primary   sp-btn" data-action="save"   style="margin-left:6px;margin-top:10px" disabled>Save</button>
        </div>

      </div>`;
  }

  function addressPanelHTML() {
    const typeOpts = '<option value="">-- Select --</option>' +
      _PROP_TYPES.map(t => `<option>${t}</option>`).join('');
    const useOpts  = '<option value="">-- Select --</option>' +
      _PROP_USES.map(u => `<option>${u}</option>`).join('');
    return `
      <div class="widget-form">

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

        <div class="form-row">
          <div class="form-group f-grow">
            <label class="form-label">Property Type</label>
            <select class="form-select" data-addr="prop-type">${typeOpts}</select>
          </div>
          <div class="form-group f-grow">
            <label class="form-label">Property Use</label>
            <select class="form-select" data-addr="prop-use">${useOpts}</select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Property Notes</label>
            <textarea class="form-textarea" data-addr="notes" maxlength="2000"></textarea>
          </div>
        </div>

        <div class="widget-footer">
          <button class="btn-secondary sp-btn" data-action="cancel">Cancel</button>
          <button class="btn-primary   sp-btn" data-action="save" disabled>Save</button>
        </div>

      </div>`;
  }

  return { personPanelHTML, addressPanelHTML };

})();
