/* --- Universal Search --- */
const searchInput = document.getElementById('universal-search');
let _searchDebounce = null;
let _searchOverlay  = null;

function _getOrCreateOverlay() {
  if (!_searchOverlay) {
    _searchOverlay = document.createElement('div');
    _searchOverlay.className = 'search-overlay';
    document.body.appendChild(_searchOverlay);
  }
  return _searchOverlay;
}

function _positionOverlay() {
  const rect    = searchInput.getBoundingClientRect();
  const overlay = _getOrCreateOverlay();
  overlay.style.top   = (rect.bottom + 4) + 'px';
  overlay.style.left  = rect.left + 'px';
  overlay.style.width = Math.max(rect.width, 360) + 'px';
}

function _getPersonProperties(peopleId) {
  const links = AppData.tables['Link_Property_People'] || [];
  const props  = AppData.tables['DB_Property']         || [];
  return links
    .filter(l => l.People_ID === peopleId && !l.Date_To)
    .map(l => props.find(p => p.Property_ID === l.Property_ID))
    .filter(Boolean)
    .sort((a, b) => (a.Property_Use === 'Primary Residence' ? -1 : 1));
}

function _getPersonCompany(peopleId) {
  const links     = AppData.tables['Link_Company_People'] || [];
  const companies = AppData.tables['DB_Company']          || [];
  const link      = links.find(l => l.People_ID === peopleId);
  if (!link) return '';
  const co = companies.find(c => c.Company_ID === link.Company_ID);
  return co ? (co.Company_DBA || co.Company_Name) : '';
}

function _getCompanyAddress(companyId) {
  const links = AppData.tables['Link_Property_Company'] || [];
  const props  = AppData.tables['DB_Property']          || [];
  const link   = links.find(l => l.Company_ID === companyId && !l.Date_To);
  if (!link) return '';
  const prop = props.find(p => p.Property_ID === link.Property_ID);
  return prop ? `${prop.Address_Street_1}, ${prop.Address_City} ${prop.Address_State}` : '';
}

function _getPropertyOwner(propertyId) {
  const links  = AppData.tables['Link_Property_People'] || [];
  const people = AppData.tables['DB_People']             || [];
  const link   = links.find(l => l.Property_ID === propertyId && !l.Date_To && l.Link_Role === 'Owner');
  if (!link) return '';
  const person = people.find(p => p.People_ID === link.People_ID);
  return person ? `${person.People_Last_Name}, ${person.People_First_Name}` : '';
}

function _searchAll(query) {
  const q       = query.toLowerCase();
  const qDigits = query.replace(/\D/g, '');
  const results = [];

  (AppData.tables['DB_People'] || []).forEach(p => {
    const textMatch  = [p.People_First_Name, p.People_Last_Name, p.Email_1, p.Email_2, p.Email_3]
      .some(f => f && f.toLowerCase().includes(q));
    const phoneMatch = qDigits.length >= 3 && [p.Phone_1, p.Phone_2, p.Phone_3]
      .some(f => f && f.replace(/\D/g, '').includes(qDigits));
    if (textMatch || phoneMatch) {
      const properties = _getPersonProperties(p.People_ID);
      if (properties.length === 0) {
        results.push({ type: 'person', data: p, property: null });
      } else {
        properties.slice(0, 3).forEach(prop => {
          results.push({ type: 'person', data: p, property: prop });
        });
      }
    }
  });

  (AppData.tables['DB_Company'] || []).forEach(c => {
    if ([c.Company_Name, c.Company_DBA].some(f => f && f.toLowerCase().includes(q)))
      results.push({ type: 'company', data: c });
  });

  (AppData.tables['DB_Property'] || []).forEach(p => {
    if ([p.Address_Street_1, p.Address_City, p.Address_Zip, p.Full_Address_Search]
        .some(f => f && f.toLowerCase().includes(q)))
      results.push({ type: 'property', data: p });
  });

  return results.slice(0, 8);
}

function _renderResults(results) {
  const overlay = _getOrCreateOverlay();
  _positionOverlay();

  if (!results.length) {
    overlay.innerHTML = '<div class="search-no-results">No results found</div>';
    overlay.classList.add('is-visible');
    return;
  }

  overlay.innerHTML = results.map(r => {
    let primary = '', secondary = '';
    if (r.type === 'person') {
      const name    = `${r.data.People_Last_Name}, ${r.data.People_First_Name}`;
      const company = _getPersonCompany(r.data.People_ID);
      primary = company ? `${name} — ${company}` : name;
      if (r.property) {
        const addr  = `${r.property.Address_Street_1}, ${r.property.Address_City} ${r.property.Address_State}`;
        const use   = r.property.Property_Use !== 'Primary Residence' ? ` · ${r.property.Property_Use}` : '';
        secondary = addr + use;
      }
    } else if (r.type === 'company') {
      primary   = r.data.Company_DBA || r.data.Company_Name;
      secondary = _getCompanyAddress(r.data.Company_ID);
    } else {
      primary   = `${r.data.Address_Street_1}, ${r.data.Address_City} ${r.data.Address_State}`;
      secondary = _getPropertyOwner(r.data.Property_ID);
    }
    const id = r.type === 'person' ? r.data.People_ID : r.type === 'company' ? r.data.Company_ID : r.data.Property_ID;
    const propId = r.property ? r.property.Property_ID : '';
    return `<div class="search-result-item" data-type="${r.type}" data-id="${id}" data-prop-id="${propId}">
      <span class="search-result-primary">${primary}</span>
      ${secondary ? `<span class="search-result-secondary">${secondary}</span>` : ''}
    </div>`;
  }).join('');

  overlay.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', function () {
      _closeOverlay();
      searchInput.value = '';
      // TODO: open profile widget
      console.log('Open profile:', this.dataset.type, this.dataset.id, 'property:', this.dataset.propId);
    });
  });

  overlay.classList.add('is-visible');
}

function _closeOverlay() {
  if (_searchOverlay) _searchOverlay.classList.remove('is-visible');
}

searchInput.addEventListener('input', function () {
  clearTimeout(_searchDebounce);
  const query = this.value.trim();
  if (query.length < 3) { _closeOverlay(); return; }
  _searchDebounce = setTimeout(() => _renderResults(_searchAll(query)), 200);
});

searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { _closeOverlay(); this.value = ''; this.blur(); }
});

document.addEventListener('mousedown', function (e) {
  if (_searchOverlay && !_searchOverlay.contains(e.target) && e.target !== searchInput)
    _closeOverlay();
});

/* --- Widget Routing --- */
// Maps submenu widget keys to CRM actions.
// If no match, falls back to a generic empty widget.
const WIDGET_ROUTES = {
  'new-client': () => CRM.openNewContact(),
};

const WIDGET_CATEGORIES = {
  'phonebook':     'contact',
  'new-client':    'contact',
  'new-vendor':    'contact',
  'new-employee':  'contact',
  'workorder':     'workorder',
  'new-workorder': 'workorder',
  'estimating':    'estimate',
  'new-estimate':  'estimate',
};

function _routeWidget(key, title) {
  const action = WIDGET_ROUTES[key];
  if (action) {
    action();
  } else {
    WidgetManager.open(key, title, '', { category: WIDGET_CATEGORIES[key] });
  }
}

/* --- Collapsible Navigation --- */
const navSidebar = document.getElementById('nav-sidebar');
const hamburger  = document.getElementById('hamburger');

hamburger.addEventListener('click', function () {
  navSidebar.classList.toggle('is-collapsed');
  hideSubmenu(true);
});

/* --- Submenu Config --- */
const SUBMENUS = {
  phonebook: {
    label: 'Phone Book',
    items: [
      { title: 'Phone Book',   widget: 'phonebook' },
      { title: 'New Client',   widget: 'new-client' },
      { title: 'New Vendor',   widget: 'new-vendor' },
      { title: 'New Employee', widget: 'new-employee' },
    ],
  },
  workorder: {
    label: 'Work Order',
    items: [
      { title: 'Work Orders',    widget: 'workorder' },
      { title: 'New Work Order', widget: 'new-workorder' },
    ],
  },
  estimating: {
    label: 'Estimating',
    items: [
      { title: 'Estimates',    widget: 'estimating' },
      { title: 'New Estimate', widget: 'new-estimate' },
    ],
  },
  settings: {
    label: 'Settings',
    items: [
      { title: 'Settings', widget: 'settings' },
    ],
  },
  help: {
    label: 'Help',
    items: [
      { title: 'Help',  widget: 'help' },
      { title: 'About', widget: 'about' },
    ],
  },
};

/* --- Submenu Panel --- */
const submenuPanel = document.createElement('div');
submenuPanel.className = 'submenu';
document.body.appendChild(submenuPanel);

let activeMenuKey = null;
let hideTimer     = null;
let switchTimer   = null;

function getSidebarWidth() {
  return navSidebar.classList.contains('is-collapsed') ? 40 : 165;
}

function _renderSubmenu(key, anchorEl) {
  if (!SUBMENUS[key]) return;

  const def = SUBMENUS[key];

  submenuPanel.innerHTML = def.items.map(item =>
    `<a class="submenu-item" data-widget="${item.widget}" data-title="${item.title}">${item.title}</a>`
  ).join('');

  // Measure first item height with panel temporarily visible off-screen
  submenuPanel.style.visibility = 'hidden';
  submenuPanel.style.left = getSidebarWidth() + 'px';
  submenuPanel.style.top  = '0px';
  submenuPanel.classList.add('is-visible');

  const anchorRect    = anchorEl.getBoundingClientRect();
  const firstItem     = submenuPanel.firstElementChild;
  const firstItemRect = firstItem.getBoundingClientRect();

  // Align first item's bottom to anchor's bottom
  const topPos = anchorRect.bottom - firstItemRect.height;

  submenuPanel.style.top        = topPos + 'px';
  submenuPanel.style.visibility = '';
  activeMenuKey = key;

  submenuPanel.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      _routeWidget(this.dataset.widget, this.dataset.title);
      hideSubmenu(true);
    });
  });
}

function showSubmenu(key, anchorEl) {
  clearTimeout(hideTimer);

  // If a different submenu is already open, wait briefly before switching —
  // this prevents accidental switches when the mouse skims a lower nav item
  // while traveling diagonally toward the open submenu.
  if (activeMenuKey && activeMenuKey !== key) {
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => _renderSubmenu(key, anchorEl), 300);
  } else {
    clearTimeout(switchTimer);
    _renderSubmenu(key, anchorEl);
  }
}

function hideSubmenu(immediate) {
  clearTimeout(switchTimer);
  if (immediate) {
    clearTimeout(hideTimer);
    submenuPanel.classList.remove('is-visible');
    activeMenuKey = null;
  } else {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      submenuPanel.classList.remove('is-visible');
      activeMenuKey = null;
    }, 250);
  }
}

/* --- Wire Nav Items --- */
document.querySelectorAll('.menu-item[data-submenu]').forEach(link => {
  link.addEventListener('mouseenter', function () {
    showSubmenu(this.dataset.submenu, this);
  });
  link.addEventListener('mouseleave', function () {
    hideSubmenu(false);   // 250ms grace period
  });
  link.addEventListener('click', function (e) {
    e.preventDefault();
  });
});

submenuPanel.addEventListener('mouseenter', function () {
  clearTimeout(hideTimer);
  clearTimeout(switchTimer);
});
submenuPanel.addEventListener('mouseleave', function () {
  hideSubmenu(true);
});
