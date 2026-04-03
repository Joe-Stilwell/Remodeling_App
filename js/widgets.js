/* --- Widget Manager --- */
const WidgetManager = (function () {

  const WORKSPACE      = () => document.querySelector('.workspace');
  const DOCK           = () => document.querySelector('.widget-dock-icons');
  const MIN_WIDTH      = 280;
  const MIN_HEIGHT     = 200;
  const CASCADE_BASE   = { top: 20, left: 110 }; // left clears the submenu flyout
  const CASCADE_STEP   = 30;
  const SNAP_THRESHOLD = 12;

  // state[id] = { el, dockIcon, isMinimized, preMaximize }
  const state = {};
  let cascadeCount = 0;

  /* ── Public: open ─────────────────────────────────────────── */
  function open(id, title, contentHTML = '', options = {}) {
    if (state[id]) {
      restore(id);
      return;
    }

    const w          = options.width  || 320;
    const autoHeight = !!options.autoHeight;
    const h          = autoHeight ? 0 : (options.height || 400);

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = 'widget-' + id;
    const workspace = WORKSPACE();
    let top, left;
    if (options.top !== undefined && options.left !== undefined) {
      top  = options.top;
      left = options.left;
    } else {
      const offset  = cascadeCount * CASCADE_STEP;
      const maxLeft = workspace.clientWidth  - w;
      const maxTop  = workspace.clientHeight - (autoHeight ? MIN_HEIGHT : h);
      top  = Math.min(CASCADE_BASE.top  + offset, maxTop);
      left = Math.min(CASCADE_BASE.left + offset, maxLeft);
      cascadeCount++;
    }

    const isPanel = !!options.panel;
    widget.style.cssText = `width:${w}px; height:${autoHeight ? workspace.clientHeight + 'px' : h + 'px'}; top:${top}px; left:${left}px;`;
    if (autoHeight) widget.style.visibility = 'hidden';
    if (isPanel) widget.classList.add('is-panel');

    if (isPanel) {
      widget.innerHTML = `<div class="widget-body">${contentHTML}</div>`;
    } else {
      widget.innerHTML = `
        <div class="widget-header">
          <span class="widget-title">${title}</span>
          <div class="widget-controls">
            <button class="widget-btn widget-btn-minimize" title="Minimize">&#8722;</button>
            <button class="widget-btn widget-btn-maximize" title="Maximize">&#9633;</button>
            <button class="widget-btn widget-btn-close" title="Close">&#10005;</button>
          </div>
        </div>
        <div class="widget-body">${contentHTML}</div>
        <div class="widget-resize-handle"></div>
      `;
    }

    workspace.appendChild(widget);

    let dockIcon = null;
    if (!isPanel) {
      dockIcon = _createDockIcon(id, title);
      widget.querySelector('.widget-btn-minimize').addEventListener('click', () => minimize(id));
      widget.querySelector('.widget-btn-maximize').addEventListener('click', () => toggleMaximize(id));
      widget.querySelector('.widget-btn-close').addEventListener('click', () => close(id));
      _initDrag(widget);
      _initResize(widget);
    }
    state[id] = { el: widget, dockIcon, isMinimized: false, preMaximize: null };

    if (autoHeight) {
      requestAnimationFrame(() => {
        const header  = widget.querySelector('.widget-header');
        const body    = widget.querySelector('.widget-body');
        const form    = widget.querySelector('.widget-form');
        const headerH = header ? header.offsetHeight : 0;
        const padTop  = parseInt(getComputedStyle(body).paddingTop) || 0;
        const formH   = form ? form.offsetHeight : body.scrollHeight;
        const afterH  = 16; // ::after chrome strip
        const natural = headerH + padTop + formH + afterH;
        const maxH    = workspace.clientHeight - top;
        widget.style.height      = Math.min(natural, maxH) + 'px';
        widget.style.visibility  = '';
      });
    }

    widget.addEventListener('mousedown', () => _bringToFront(widget));
    _bringToFront(widget);
  }

  /* ── Public: close ────────────────────────────────────────── */
  function close(id) {
    if (!state[id]) return;
    const wasActive = state[id].el.classList.contains('is-active');
    state[id].el.remove();
    if (state[id].dockIcon) state[id].dockIcon.remove();
    delete state[id];
    if (Object.keys(state).length === 0) cascadeCount = 0;
    if (wasActive) _activateNext();
  }

  /* ── Public: minimize ─────────────────────────────────────── */
  function minimize(id) {
    if (!state[id] || state[id].isMinimized) return;
    const wasActive = state[id].el.classList.contains('is-active');
    state[id].el.style.display = 'none';
    state[id].el.classList.remove('is-active');
    state[id].dockIcon.classList.add('is-minimized');
    state[id].dockIcon.classList.remove('is-active');
    state[id].isMinimized = true;
    if (wasActive) _activateNext();
  }

  /* ── Public: restore ──────────────────────────────────────── */
  function restore(id) {
    if (!state[id] || !state[id].isMinimized) return;
    state[id].el.style.display = 'flex';
    state[id].dockIcon.classList.remove('is-minimized');
    state[id].isMinimized = false;
    _bringToFront(state[id].el);
  }

  /* ── Public: toggleMaximize ───────────────────────────────── */
  function toggleMaximize(id) {
    if (!state[id]) return;
    const widget    = state[id].el;
    const workspace = WORKSPACE();

    if (state[id].preMaximize) {
      const s = state[id].preMaximize;
      widget.style.width  = s.width;
      widget.style.height = s.height;
      widget.style.top    = s.top;
      widget.style.left   = s.left;
      state[id].preMaximize = null;
    } else {
      state[id].preMaximize = {
        width:  widget.style.width,
        height: widget.style.height,
        top:    widget.style.top,
        left:   widget.style.left,
      };
      widget.style.top    = '0px';
      widget.style.left   = '0px';
      widget.style.width  = workspace.clientWidth  + 'px';
      widget.style.height = workspace.clientHeight + 'px';
    }
  }

  /* ── Private: dock icon ───────────────────────────────────── */
  function _createDockIcon(id, title) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dock-icon';

    const titleEl = document.createElement('span');
    titleEl.className = 'dock-icon-title';
    titleEl.textContent = title;
    titleEl.title = title;
    titleEl.addEventListener('click', () => {
      if (!state[id]) return;
      state[id].isMinimized ? restore(id) : minimize(id);
    });

    const btnGroup = document.createElement('div');
    btnGroup.className = 'dock-icon-btns';

    const maxBtn = document.createElement('button');
    maxBtn.className = 'dock-icon-btn';
    maxBtn.innerHTML = '&#9633;';
    maxBtn.title = 'Maximize';
    maxBtn.addEventListener('click', () => {
      if (!state[id]) return;
      if (state[id].isMinimized) restore(id);
      toggleMaximize(id);
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'dock-icon-btn dock-icon-btn-close';
    closeBtn.innerHTML = '&#10005;';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => close(id));

    btnGroup.appendChild(maxBtn);
    btnGroup.appendChild(closeBtn);
    wrapper.appendChild(titleEl);
    wrapper.appendChild(btnGroup);
    DOCK().appendChild(wrapper);
    return wrapper;
  }

  /* ── Private: activate the next visible top widget ───────── */
  function _activateNext() {
    let topId = null;
    let maxZ  = -1;
    Object.entries(state).forEach(([id, s]) => {
      if (!s.isMinimized) {
        const z = parseInt(s.el.style.zIndex) || 100;
        if (z > maxZ) { maxZ = z; topId = id; }
      }
    });
    if (topId) {
      document.querySelectorAll('.widget').forEach(w => w.classList.remove('is-active'));
      Object.values(state).forEach(s => s.dockIcon.classList.remove('is-active'));
      state[topId].el.classList.add('is-active');
      state[topId].dockIcon.classList.add('is-active');
    }
  }

  /* ── Private: z-index management + active state ──────────── */
  function _bringToFront(widget) {
    document.querySelectorAll('.widget').forEach(w => w.classList.remove('is-active'));
    Object.values(state).forEach(s => s.dockIcon.classList.remove('is-active'));

    let maxZ = 100;
    document.querySelectorAll('.widget').forEach(w => {
      const z = parseInt(w.style.zIndex) || 100;
      if (z > maxZ) maxZ = z;
    });
    widget.style.zIndex = maxZ + 1;
    widget.classList.add('is-active');

    const id = widget.id.replace('widget-', '');
    if (state[id]) state[id].dockIcon.classList.add('is-active');
  }

  /* ── Private: collect snap lines from workspace + widgets ─── */
  function _getSnapLines(excludeWidget) {
    const workspace = WORKSPACE();
    const vLines = [0, workspace.clientWidth];
    const hLines = [0, workspace.clientHeight];

    document.querySelectorAll('.widget').forEach(other => {
      if (other === excludeWidget || other.style.display === 'none') return;
      const ol = parseInt(other.style.left) || 0;
      const ot = parseInt(other.style.top)  || 0;
      vLines.push(ol, ol + other.offsetWidth);
      hLines.push(ot, ot + other.offsetHeight);
    });

    return { vLines, hLines };
  }

  /* ── Private: snap position during drag ───────────────────── */
  function _snapPosition(widget, rawLeft, rawTop) {
    const workspace = WORKSPACE();
    const ww = workspace.clientWidth;
    const wh = workspace.clientHeight;
    const w  = widget.offsetWidth;
    const h  = widget.offsetHeight;
    const { vLines, hLines } = _getSnapLines(widget);

    let sl = rawLeft;
    let st = rawTop;

    // Snap left or right edge to nearest vertical line
    let bestH = SNAP_THRESHOLD;
    vLines.forEach(line => {
      if (Math.abs(rawLeft - line) < bestH) {
        bestH = Math.abs(rawLeft - line);
        sl = line;
      }
      if (Math.abs((rawLeft + w) - line) < bestH) {
        bestH = Math.abs((rawLeft + w) - line);
        sl = line - w;
      }
    });

    // Snap top or bottom edge to nearest horizontal line
    let bestV = SNAP_THRESHOLD;
    hLines.forEach(line => {
      if (Math.abs(rawTop - line) < bestV) {
        bestV = Math.abs(rawTop - line);
        st = line;
      }
      if (Math.abs((rawTop + h) - line) < bestV) {
        bestV = Math.abs((rawTop + h) - line);
        st = line - h;
      }
    });

    // Clamp to workspace bounds
    return {
      left: Math.max(0, Math.min(sl, ww - w)),
      top:  Math.max(0, Math.min(st, wh - h)),
    };
  }

  /* ── Private: snap size during resize ─────────────────────── */
  function _snapSize(widget, rawWidth, rawHeight) {
    const workspace = WORKSPACE();
    const left = parseInt(widget.style.left) || 0;
    const top  = parseInt(widget.style.top)  || 0;
    const { vLines, hLines } = _getSnapLines(widget);

    const rawRight  = left + rawWidth;
    const rawBottom = top  + rawHeight;

    let sw = rawWidth;
    let sh = rawHeight;

    // Snap right edge to nearest vertical line
    let bestH = SNAP_THRESHOLD;
    vLines.forEach(line => {
      if (Math.abs(rawRight - line) < bestH) {
        bestH = Math.abs(rawRight - line);
        sw = line - left;
      }
    });

    // Snap bottom edge to nearest horizontal line
    let bestV = SNAP_THRESHOLD;
    hLines.forEach(line => {
      if (Math.abs(rawBottom - line) < bestV) {
        bestV = Math.abs(rawBottom - line);
        sh = line - top;
      }
    });

    // Clamp to minimums and workspace bounds
    return {
      width:  Math.max(MIN_WIDTH,  Math.min(sw, workspace.clientWidth  - left)),
      height: Math.max(MIN_HEIGHT, Math.min(sh, workspace.clientHeight - top)),
    };
  }

  /* ── Private: drag ────────────────────────────────────────── */
  function _initDrag(widget) {
    const header = widget.querySelector('.widget-header');

    header.addEventListener('mousedown', function (e) {
      if (e.target.closest('.widget-controls')) return;
      e.preventDefault();

      const startX    = e.clientX;
      const startY    = e.clientY;
      const startLeft = parseInt(widget.style.left) || 0;
      const startTop  = parseInt(widget.style.top)  || 0;

      function onMove(e) {
        const rawLeft = startLeft + e.clientX - startX;
        const rawTop  = startTop  + e.clientY - startY;
        const pos     = _snapPosition(widget, rawLeft, rawTop);
        widget.style.left = pos.left + 'px';
        widget.style.top  = pos.top  + 'px';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  /* ── Private: resize ──────────────────────────────────────── */
  function _initResize(widget) {
    const handle = widget.querySelector('.widget-resize-handle');

    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const startX      = e.clientX;
      const startY      = e.clientY;
      const startWidth  = widget.offsetWidth;
      const startHeight = widget.offsetHeight;

      function onMove(e) {
        const rawWidth  = startWidth  + e.clientX - startX;
        const rawHeight = startHeight + e.clientY - startY;
        const size      = _snapSize(widget, rawWidth, rawHeight);
        widget.style.width  = size.width  + 'px';
        widget.style.height = size.height + 'px';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  return { open, close, minimize, restore };

})();
