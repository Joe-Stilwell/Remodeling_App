/* --- Universal Search --- */
const searchInput = document.getElementById('universal-search');

searchInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      // TODO: route query to the appropriate module (CRM, Estimating, etc.)
      console.log('Universal search:', query);
      event.target.value = '';
      event.target.blur();
    }
  }
});

/* --- Collapsible Navigation --- */
const navSidebar  = document.getElementById('nav-sidebar');
const hamburger   = document.getElementById('hamburger');

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
      { title: 'Work Orders',  widget: 'workorder' },
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
      { title: 'Help',    widget: 'help' },
      { title: 'About',   widget: 'about' },
    ],
  },
};

/* --- Submenu Panel --- */
const submenuPanel = document.createElement('div');
submenuPanel.className = 'submenu';
document.body.appendChild(submenuPanel);

let hideTimer     = null;
let activeMenuKey = null;

function showSubmenu(key, anchorEl) {
  if (!SUBMENUS[key]) return;
  clearTimeout(hideTimer);

  const def  = SUBMENUS[key];
  const rect = anchorEl.getBoundingClientRect();
  const sidebarWidth = navSidebar.classList.contains('is-collapsed') ? 40 : 165;

  submenuPanel.innerHTML = `
    <div class="submenu-label">${def.label}</div>
    ${def.items.map(item =>
      `<a class="submenu-item" data-widget="${item.widget}" data-title="${item.title}">${item.title}</a>`
    ).join('')}
  `;

  submenuPanel.style.top  = rect.top + 'px';
  submenuPanel.style.left = sidebarWidth + 'px';
  submenuPanel.classList.add('is-visible');
  activeMenuKey = key;

  submenuPanel.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      WidgetManager.open(this.dataset.widget, this.dataset.title);
      hideSubmenu(true);
    });
  });
}

function hideSubmenu(immediate) {
  clearTimeout(hideTimer);
  if (immediate) {
    submenuPanel.classList.remove('is-visible');
    activeMenuKey = null;
  } else {
    hideTimer = setTimeout(() => {
      submenuPanel.classList.remove('is-visible');
      activeMenuKey = null;
    }, 200);
  }
}

/* --- Wire Nav Items --- */
document.querySelectorAll('.menu-item[data-submenu]').forEach(link => {
  link.addEventListener('mouseenter', function () {
    showSubmenu(this.dataset.submenu, this);
  });
  link.addEventListener('mouseleave', function () {
    hideSubmenu(false);
  });
  link.addEventListener('click', function (e) {
    e.preventDefault();
  });
});

submenuPanel.addEventListener('mouseenter', function () {
  clearTimeout(hideTimer);
});
submenuPanel.addEventListener('mouseleave', function () {
  hideSubmenu(false);
});
