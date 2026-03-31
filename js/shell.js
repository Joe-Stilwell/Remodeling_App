/* --- Universal Search --- */
const searchInput = document.getElementById('universal-search');

searchInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      console.log('Universal search:', query);
      event.target.value = '';
      event.target.blur();
    }
  }
});

/* --- Widget Routing --- */
// Maps submenu widget keys to CRM actions.
// If no match, falls back to a generic empty widget.
const WIDGET_ROUTES = {
  'new-client': () => CRM.openNewClient(),
};

function _routeWidget(key, title) {
  const action = WIDGET_ROUTES[key];
  if (action) {
    action();
  } else {
    WidgetManager.open(key, title);
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
