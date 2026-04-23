/* --- Resizable Widget Dock --- */
(function () {
  const SNAP_POINTS  = [165, 330];
  const DOCK_DEFAULT = 165;

  const dockAside = document.getElementById('dock-sidebar');
  const handle    = dockAside.querySelector('.dock-resize-handle');

  function snapWidth(w) {
    return SNAP_POINTS.reduce((best, pt) =>
      Math.abs(pt - w) < Math.abs(best - w) ? pt : best
    );
  }

  function setDockWidth(w) {
    dockAside.style.width     = w + 'px';
    dockAside.style.minWidth  = w + 'px';
    dockAside.style.flexBasis = w + 'px';
    dockAside.classList.toggle('dock-wide', w > 165);
  }

  // Restore persisted width (always a snap point)
  setDockWidth(snapWidth(parseInt(localStorage.getItem('dockWidth')) || DOCK_DEFAULT));

  handle.addEventListener('mousedown', function (e) {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = dockAside.offsetWidth;

    handle.classList.add('is-resizing');
    document.body.classList.add('is-dragging');

    function onMove(e) {
      const raw     = startWidth - (e.clientX - startX);
      const snapped = snapWidth(raw);
      setDockWidth(snapped);
    }

    function onUp() {
      handle.classList.remove('is-resizing');
      document.body.classList.remove('is-dragging');
      localStorage.setItem('dockWidth', dockAside.offsetWidth);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}());

/* --- Input mode tracking (suppresses focus rings when mouse is in use) --- */
document.addEventListener('pointermove', () => document.body.classList.add('using-mouse'), { passive: true });
document.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.body.classList.remove('using-mouse'); });

/* --- Universal Search --- */
const searchInput = document.getElementById('universal-search');
let _searchDebounce = null;
let _searchOverlay  = null;
let _searchNavIndex = -1;

function _searchNavItems() {
  if (!_searchOverlay) return [];
  return [..._searchOverlay.querySelectorAll('.search-result-item, .search-create-btn')];
}

function _searchHighlight(index) {
  const items = _searchNavItems();
  items.forEach((item, i) => item.classList.toggle('is-active', i === index));
  items[index]?.scrollIntoView({ block: 'nearest' });
  _searchNavIndex = index;
}

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

function _getCompanyProperties(companyId) {
  const links = AppData.tables['Link_Property_Company'] || [];
  const props  = AppData.tables['DB_Property']          || [];
  return links
    .filter(l => l.Company_ID === companyId && !l.Date_To)
    .map(l => props.find(p => p.Property_ID === l.Property_ID))
    .filter(Boolean);
}

function _getPersonCompany(peopleId) {
  const links     = AppData.tables['Link_Company_People'] || [];
  const companies = AppData.tables['DB_Company']          || [];
  const link      = links.find(l => l.People_ID === peopleId);
  if (!link) return '';
  const co = companies.find(c => c.Company_ID === link.Company_ID);
  return co ? (co.Company_DBA || co.Company_Name) : '';
}

function _getPropertyOwner(propertyId) {
  const links  = AppData.tables['Link_Property_People'] || [];
  const people = AppData.tables['DB_People']            || [];
  const link   = links.find(l => l.Property_ID === propertyId && !l.Date_To && l.Link_Role === 'Owner');
  if (!link) return '';
  const person = people.find(p => p.People_ID === link.People_ID);
  return person ? `${person.People_Last_Name}, ${person.People_First_Name}` : '';
}

function _searchAll(query) {
  const q       = query.toLowerCase();
  const qDigits = query.replace(/\D/g, '');
  const results = [];
  const seen    = new Set();

  // One pill per person, one per company — property is context only for address searches
  function addPerson(person, property) {
    const key = `p-${person.People_ID}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ type: 'person', data: person, property: property || null });
  }

  function addCompany(company, property) {
    const key = `c-${company.Company_ID}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ type: 'company', data: company, property: property || null });
  }

  // --- Person match (name / email / phone) — no property context ---
  (AppData.tables['DB_People'] || []).forEach(person => {
    const fullName    = `${person.People_First_Name || ''} ${person.People_Last_Name || ''}`.trim().toLowerCase();
    const reverseName = `${person.People_Last_Name || ''}, ${person.People_First_Name || ''}`.trim().toLowerCase();
    const textMatch   = fullName.includes(q) || reverseName.includes(q) ||
      [person.People_First_Name, person.People_Last_Name, person.Email_1, person.Email_2, person.Email_3]
        .some(f => f && f.toLowerCase().includes(q));
    const phoneMatch  = qDigits.length >= 3 && [person.Phone_1, person.Phone_2, person.Phone_3]
      .some(f => f && f.replace(/\D/g, '').includes(qDigits));
    if (!textMatch && !phoneMatch) return;

    addPerson(person, null);

    // Also surface any company this person is linked to
    const compLinks = AppData.tables['Link_Company_People'] || [];
    const companies = AppData.tables['DB_Company']          || [];
    compLinks.filter(l => l.People_ID === person.People_ID).forEach(l => {
      const co = companies.find(c => c.Company_ID === l.Company_ID);
      if (co) addCompany(co, null);
    });
  });

  // --- Company match (name / DBA) — no property context ---
  (AppData.tables['DB_Company'] || []).forEach(company => {
    if (![company.Company_Name, company.Company_DBA]
        .some(f => f && f.toLowerCase().includes(q))) return;
    addCompany(company, null);
  });

  // --- Address match — return everyone linked to that property ---
  const allProps   = AppData.tables['DB_Property']          || [];
  const ppLinks    = AppData.tables['Link_Property_People']  || [];
  const cpLinks    = AppData.tables['Link_Property_Company'] || [];
  const allPeople  = AppData.tables['DB_People']             || [];
  const allCompanies = AppData.tables['DB_Company']          || [];

  allProps.forEach(prop => {
    if (![prop.Address_Street_1, prop.Address_City, prop.Address_Zip, prop.Full_Address_Search]
        .some(f => f && f.toLowerCase().includes(q))) return;

    ppLinks.filter(l => l.Property_ID === prop.Property_ID && !l.Date_To).forEach(l => {
      const person = allPeople.find(p => p.People_ID === l.People_ID);
      if (person) addPerson(person, prop);
    });

    cpLinks.filter(l => l.Property_ID === prop.Property_ID && !l.Date_To).forEach(l => {
      const company = allCompanies.find(c => c.Company_ID === l.Company_ID);
      if (company) addCompany(company, prop);
    });
  });

  return results.slice(0, 12);
}

function _renderResults(results, query) {
  const overlay = _getOrCreateOverlay();
  _positionOverlay();
  _searchNavIndex = -1;
  overlay.scrollTop = 0;

  const createRow = `<div class="search-create-row">
    <button class="search-create-btn">+ New Contact</button>
  </div>`;

  if (!results.length) {
    overlay.innerHTML = '<div class="search-no-results">No results found</div>' + createRow;
  } else {
    overlay.innerHTML = results.map(r => {
      let primary = '', secondary = '';
      if (r.type === 'person') {
        const company = _getPersonCompany(r.data.People_ID);
        primary = `${r.data.People_Last_Name}, ${r.data.People_First_Name}`;
        if (company) primary += ` — ${company}`;
        if (r.property) {
          const use = r.property.Property_Use && r.property.Property_Use !== 'Primary Residence'
            ? ` · ${r.property.Property_Use}` : '';
          secondary = `${r.property.Address_Street_1}, ${r.property.Address_City} ${r.property.Address_State}${use}`;
        } else {
          secondary = r.data.Phone_1 || r.data.Phone_2 || '';
        }
      } else {
        primary = r.data.Company_DBA || r.data.Company_Name;
        if (r.property) {
          const owner = _getPropertyOwner(r.property.Property_ID);
          if (owner) primary += ` — ${owner}`;
          secondary = `${r.property.Address_Street_1}, ${r.property.Address_City} ${r.property.Address_State}`;
        }
      }
      const id     = r.type === 'person' ? r.data.People_ID : r.data.Company_ID;
      const propId = r.property ? r.property.Property_ID : '';
      return `<div class="search-result-item" data-type="${r.type}" data-id="${id}" data-prop-id="${propId}">
        <span class="search-result-primary">${primary}</span>
        ${secondary ? `<span class="search-result-secondary">${secondary}</span>` : ''}
      </div>`;
    }).join('') + createRow;

    overlay.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', function () {
        _closeOverlay();
        searchInput.value = '';
        CRM.openProfile(this.dataset.type, this.dataset.id);
      });
    });
  }

  overlay.querySelector('.search-create-btn').addEventListener('click', function () {
    _closeOverlay();
    searchInput.value = '';
    CRM.openNewContactFromSearch(query);
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
  _searchDebounce = setTimeout(() => _renderResults(_searchAll(query), query), 200);
});

searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { _closeOverlay(); this.value = ''; this.blur(); return; }

  if (!_searchOverlay?.classList.contains('is-visible')) return;
  const items = _searchNavItems();
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _searchHighlight(Math.min(_searchNavIndex + 1, items.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _searchHighlight(Math.max(_searchNavIndex - 1, 0));
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (_searchNavIndex >= 0 && items[_searchNavIndex]) {
      this.blur();
      items[_searchNavIndex].click();
    }
  }
});

document.addEventListener('mousedown', function (e) {
  if (_searchOverlay && !_searchOverlay.contains(e.target) && e.target !== searchInput)
    _closeOverlay();
});

/* --- Widget Routing --- */
// Maps submenu widget keys to CRM actions.
// If no match, falls back to a generic empty widget.
const WIDGET_ROUTES = {
  'phonebook':      () => CRM.openPhonebook(),
  'new-contact':    () => CRM.openNewContact(),
  'vendor-mgmt':    () => CRM.openVendorMgmt(),
  'estimating':     () => Estimating.openEstimateList(),
  'new-estimate':   () => Estimating.openEstimateSettings(null, null),
  'costbook':       () => Estimating.openCostbook(),
  'price-list':     () => Estimating.openPriceList(),
  'documents':      () => Documents.openDocuments(),
};

const WIDGET_CATEGORIES = {
  'phonebook':     'contact',
  'new-contact':   'contact',
  'costbook':      'estimating',
  'price-list':    'estimating',
  'documents':     'documents',
  'vendor-mgmt':   'contact',
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
    label: 'Contacts',
    items: [
      { title: 'New Contact',       widget: 'new-contact' },
      { title: 'Contact List',      widget: 'phonebook' },
      { title: 'Vendor Management', widget: 'vendor-mgmt' },
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
      { title: 'Costbook',     widget: 'costbook' },
      { title: 'Price List',   widget: 'price-list' },
    ],
  },
  documents: {
    label: 'Documents',
    items: [
      { title: 'Documents',     widget: 'documents' },
      { title: 'New Document',  widget: 'new-document' },
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
