/* ================================================================
   MODULE: widgets.js
   Owns:   Widget chrome lifecycle — open, close, minimize,
           maximize, drag, resize, z-order, focus, tab-trap,
           Ctrl+Q family cycling, dock icon management
   Public: WidgetManager.open, close, minimize, restore,
           resizeToContent, isOpen, hasMoved, getOpenIds
   Reads:  Nothing — zero dependencies on other modules
   Never:  Business logic, data access, or widget content HTML.
           Touch AppData directly.
   ================================================================ */
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

  /* Measure natural content height of the widget body.
     .widget-form elements size themselves by content — use offsetHeight.
     .sp-widget elements use height:100% (inflated) — temporarily set auto to measure. */
  function _measureBodyContent(body, form) {
    if (form) return form.offsetHeight;
    const spW = body.querySelector(':scope > .sp-widget');
    if (spW) {
      const saved = spW.style.height;
      spW.style.height = 'auto';
      const h = spW.scrollHeight;
      spW.style.height = saved;
      return h;
    }
    return body.scrollHeight;
  }

  /* ── Public: open ─────────────────────────────────────────── */
  function open(id, title, contentHTML = '', options = {}) {
    if (state[id]) {
      restore(id);
      return false;
    }

    const w          = options.width  || 320;
    const autoHeight = !!options.autoHeight;
    const h          = autoHeight ? 0 : (options.height || 400);

    const widget = document.createElement('div');
    widget.className = 'widget';
    if (options.category) widget.classList.add('widget--' + options.category);
    widget.id = 'widget-' + id;
    const workspace = WORKSPACE();
    let top, left;
    if (options.top !== undefined && options.left !== undefined) {
      top  = options.top;
      left = options.left;
    } else if (options.centeredOn && state[options.centeredOn]) {
      // Center horizontally over the parent; offset 30px from parent top
      const pEl   = state[options.centeredOn].el;
      const pTop  = parseInt(pEl.style.top)  || 0;
      const pLeft = parseInt(pEl.style.left) || 0;
      const pW    = pEl.offsetWidth;
      const pH    = pEl.offsetHeight;
      const cH    = autoHeight ? MIN_HEIGHT : h;
      const rawLeft = pLeft + (pW - w)   / 2;
      const rawTop  = pTop  + (pH - cH)  / 2;
      left = Math.max(0, Math.min(rawLeft, workspace.clientWidth  - w));
      top  = Math.max(0, Math.min(rawTop,  workspace.clientHeight - cH));
    } else {
      const offset  = cascadeCount * CASCADE_STEP;
      const maxLeft = workspace.clientWidth  - w;
      const maxTop  = workspace.clientHeight - (autoHeight ? MIN_HEIGHT : h);
      top  = Math.min(CASCADE_BASE.top  + offset, maxTop);
      left = Math.min(CASCADE_BASE.left + offset, maxLeft);
      cascadeCount++;
    }

    const isPanel = !!options.panel;

    // Check workspace has room for the widget before opening
    if (!isPanel && (w > workspace.clientWidth || (autoHeight ? MIN_HEIGHT : h) > workspace.clientHeight)) {
      _showToast('Not enough room — please widen the workspace or close other windows.');
      return false;
    }

    widget.style.cssText = `width:${w}px; height:${autoHeight ? workspace.clientHeight + 'px' : h + 'px'}; top:${top}px; left:${left}px;`;
    if (options.minWidth)  widget.style.minWidth  = options.minWidth  + 'px';
    if (options.minHeight) widget.style.minHeight = options.minHeight + 'px';
    if (autoHeight) widget.style.visibility = 'hidden';
    if (isPanel) widget.classList.add('is-panel');

    if (isPanel) {
      widget.innerHTML = `<div class="widget-body">${contentHTML}</div>`;
    } else {
      widget.innerHTML = `
        <div class="widget-header">
          <span class="widget-title">${title}</span>
          <div class="widget-header-info"></div>
          <div class="widget-controls">
            <button class="widget-btn widget-btn-minimize" title="Minimize">&#8722;</button>
            <button class="widget-btn widget-btn-maximize" title="Maximize">&#9633;</button>
            <button class="widget-btn widget-btn-close" title="Close">&#10005;</button>
          </div>
        </div>
        <div class="widget-body">${contentHTML}</div>
        <div class="widget-statusbar">
          <span class="widget-status-left"></span>
          <span class="widget-status-right"></span>
        </div>
        <div class="widget-resize-handle" data-dir="n"></div>
        <div class="widget-resize-handle" data-dir="ne"></div>
        <div class="widget-resize-handle" data-dir="e"></div>
        <div class="widget-resize-handle" data-dir="se"></div>
        <div class="widget-resize-handle" data-dir="s"></div>
        <div class="widget-resize-handle" data-dir="sw"></div>
        <div class="widget-resize-handle" data-dir="w"></div>
        <div class="widget-resize-handle" data-dir="nw"></div>
      `;
    }

    workspace.appendChild(widget);

    let dockIcon = null;
    if (!isPanel) {
      const noDock = !!options.noDock;
      if (noDock) {
        widget.querySelector('.widget-btn-minimize').style.display = 'none';
        widget.querySelector('.widget-btn-maximize').tabIndex = -1;
        widget.querySelector('.widget-btn-close').tabIndex = -1;
      } else {
        dockIcon = _createDockIcon(id, title, options.category);
        widget.querySelector('.widget-btn-minimize').addEventListener('click', () => minimize(id));
        if (typeof options.getLabel === 'function') {
          widget.addEventListener('input', () => {
            const label = options.getLabel(widget);
            dockIcon.updateLabel(label);
          });
        }
      }
      widget.querySelector('.widget-btn-maximize').addEventListener('click', () => toggleMaximize(id));
      widget.querySelector('.widget-btn-close').addEventListener('click', () => close(id));
      _initDrag(widget, id);
      _initResize(widget, id);
    }
    state[id] = { el: widget, dockIcon, isMinimized: false, preMaximize: null, panelIds: [], parentId: options.parentId || null, isResizing: false, userResized: false, userMoved: false };

    if (options.parentId && state[options.parentId]) {
      state[options.parentId].panelIds.push(id);
      _updateMaximizeBtn(options.parentId);

      // If panel would extend beyond the right workspace edge, push the group left
      const ww        = workspace.clientWidth;
      const overflow  = left + w - ww;
      if (overflow > 0) {
        const parentEl   = state[options.parentId].el;
        const parentLeft = parseInt(parentEl.style.left) || 0;
        const newLeft    = Math.max(0, parentLeft - overflow);
        const dx         = newLeft - parentLeft;

        // If even pushing to left:0 isn't enough, workspace is too narrow — abort
        if (newLeft === 0 && parentEl.offsetWidth + w > ww) {
          state[options.parentId].panelIds = state[options.parentId].panelIds.filter(pid => pid !== id);
          _updateMaximizeBtn(options.parentId);
          widget.remove();
          delete state[id];
          _showToast('Not enough room — please widen the workspace or close other windows.');
          return false;
        }

        parentEl.style.left = newLeft + 'px';
        widget.style.left   = (left + dx) + 'px';
        // Shift any sibling panels already open
        state[options.parentId].panelIds.forEach(pid => {
          if (pid === id || !state[pid]) return;
          const sibEl = state[pid].el;
          sibEl.style.left = (parseInt(sibEl.style.left) || 0) + dx + 'px';
        });
      }
    }

    if (autoHeight) {
      requestAnimationFrame(() => {
        const header  = widget.querySelector('.widget-header');
        const body    = widget.querySelector('.widget-body');
        const form    = widget.querySelector('.widget-form');
        const headerH = header ? header.offsetHeight : 0;
        const padTop  = parseInt(getComputedStyle(body).paddingTop)    || 0;
        const padBot  = parseInt(getComputedStyle(body).paddingBottom) || 0;
        const formH   = _measureBodyContent(body, form);
        const afterH  = isPanel ? 0 : 16; // panels have no ::after chrome strip
        const natural = headerH + padTop + formH + padBot + afterH + 6; // buffer prevents scrollbar from pixel rounding
        const maxH    = workspace.clientHeight - top;
        widget.style.height      = Math.min(natural, maxH) + 'px';
        if (options.autoMinHeight) widget.style.minHeight = Math.round(natural * options.autoMinHeight) + 'px';
        widget.style.visibility  = '';

        // Auto-focus: honour data-autofocus if present, else first input
        const firstInput = widget.querySelector('[data-autofocus]')
          || widget.querySelector('input:not([type="radio"]):not([type="checkbox"]), select, textarea');
        firstInput?.focus();
      });
    }

    if (isPanel) {
      // Clicking a panel keeps focus on the parent
      widget.addEventListener('mousedown', () => {
        const parentId = state[widget.id.replace('widget-', '')]?.parentId;
        if (parentId && state[parentId]) _bringToFront(state[parentId].el);
      });
      // Activate parent when panel opens
      if (options.parentId && state[options.parentId]) {
        _bringToFront(state[options.parentId].el);
      }
    } else {
      widget.addEventListener('mousedown', () => _bringToFront(widget));
      _bringToFront(widget);
    }
  }

  /* ── Public: close ────────────────────────────────────────── */
  function close(id) {
    if (!state[id]) return;
    const { parentId, panelIds } = state[id];
    const wasActive = state[id].el.classList.contains('is-active');

    // Close all attached panels first
    [...panelIds].forEach(pid => close(pid));

    state[id].el.remove();
    if (state[id].dockIcon) state[id].dockIcon.remove();
    delete state[id];
    if (parentId && state[parentId]) {
      state[parentId].panelIds = state[parentId].panelIds.filter(pid => pid !== id);
      _updateMaximizeBtn(parentId);
    }
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
    // Hide all attached panels
    state[id].panelIds.forEach(pid => {
      if (state[pid]) state[pid].el.style.display = 'none';
    });
    if (wasActive) _activateNext();
  }

  /* ── Public: restore ──────────────────────────────────────── */
  function restore(id) {
    if (!state[id] || !state[id].isMinimized) return;
    state[id].el.style.display = 'flex';
    state[id].dockIcon.classList.remove('is-minimized');
    state[id].isMinimized = false;
    // Restore all attached panels
    state[id].panelIds.forEach(pid => {
      if (state[pid]) state[pid].el.style.display = 'flex';
    });
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

  /* ── Private: enable/disable maximize btn based on panels ─── */
  function _updateMaximizeBtn(id) {
    if (!state[id]) return;
    const hasPanels = state[id].panelIds.length > 0;
    [
      state[id].el.querySelector('.widget-btn-maximize'),
      state[id].dockIcon?.querySelector('.dock-icon-btn:first-child'),
    ].forEach(btn => {
      if (!btn) return;
      btn.disabled = hasPanels;
      btn.style.opacity = hasPanels ? '0.3' : '';
      btn.style.cursor  = hasPanels ? 'not-allowed' : '';
    });
  }

  /* ── Private: toast notification ────────────────────────────── */
  function _showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'widget-toast';
    toast.textContent = message;
    WORKSPACE().appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('widget-toast-visible'));
    setTimeout(() => {
      toast.classList.remove('widget-toast-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 5000);
  }

  /* ── Private: dock icon ───────────────────────────────────── */
  function _createDockIcon(id, title, category) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dock-icon';
    if (category) wrapper.classList.add('dock-icon--' + category);

    const titleEl = document.createElement('span');
    titleEl.className = 'dock-icon-title';
    titleEl.textContent = title;
    titleEl.title = title;
    titleEl.addEventListener('click', () => {
      if (!state[id]) return;
      if (state[id].isMinimized) {
        restore(id);
      } else if (state[id].el.classList.contains('is-active')) {
        minimize(id);
      } else {
        _bringToFront(state[id].el);
      }
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
    wrapper.updateLabel = (text) => {
      titleEl.textContent = text || title;
      titleEl.title       = text || title;
    };
    DOCK().prepend(wrapper);
    _initDockDrag(wrapper);
    return wrapper;
  }

  /* ── Private: dock drag-to-reorder ───────────────────────── */

  // 2D insert-point: above a pill's row = before it; same row, left of center = before it.
  function _findDockInsertPoint(pills, cursorX, cursorY) {
    for (const pill of pills) {
      const rect = pill.getBoundingClientRect();
      if (cursorY < rect.top) return pill;
      if (cursorY <= rect.bottom && cursorX < rect.left + rect.width / 2) return pill;
    }
    return null;
  }

  // Returns the {left, top, width} the ghost should snap to for a given slot.
  function _getDockSlotPos(pills, insertBefore) {
    const dock    = DOCK();
    const dr      = dock.getBoundingClientRect();
    const GAP     = 4;
    const PAD     = 6;

    if (insertBefore) {
      const r = insertBefore.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width };
    }
    if (pills.length > 0) {
      const last = pills[pills.length - 1];
      const lr   = last.getBoundingClientRect();
      // Room for another pill in the same row?
      if (lr.right + GAP + last.offsetWidth <= dr.right - PAD + 2) {
        return { left: lr.right + GAP, top: lr.top, width: last.offsetWidth };
      }
      return { left: dr.left + PAD, top: lr.bottom + GAP, width: lr.width };
    }
    return { left: dr.left + PAD, top: dr.top + PAD, width: dr.width - PAD * 2 };
  }

  function _initDockDrag(wrapper) {
    wrapper.addEventListener('mousedown', function (e) {
      if (e.target.closest('.dock-icon-btns')) return;

      const startY  = e.clientY;
      let dragging  = false;
      let ghost     = null;
      let indicator = null;

      function onSelectStart(e) { e.preventDefault(); }
      document.addEventListener('selectstart', onSelectStart);

      function onMove(e) {
        if (!dragging && Math.abs(e.clientY - startY) > 5) {
          dragging = true;
          document.body.classList.add('is-dragging');

          const rect = wrapper.getBoundingClientRect();
          ghost = wrapper.cloneNode(true);
          ghost.style.cssText = [
            'position:fixed',
            'pointer-events:none',
            'z-index:9999',
            `width:${rect.width}px`,
            `left:${rect.left}px`,
            `top:${rect.top}px`,
            'opacity:0.85',
            'transition:left 80ms ease, top 80ms ease',
          ].join(';');
          document.body.appendChild(ghost);

          indicator = document.createElement('div');
          indicator.style.cssText = [
            'position:fixed',
            'pointer-events:none',
            'z-index:10000',
            'height:3px',
            'background-color:var(--color-brand-accent)',
            'border-radius:2px',
            'transition:left 80ms ease, top 80ms ease',
          ].join(';');
          document.body.appendChild(indicator);

          wrapper.style.opacity = '0.25';
        }

        if (!dragging) return;

        const dock         = DOCK();
        const pills        = [...dock.querySelectorAll('.dock-icon')].filter(p => p !== wrapper);
        const insertBefore = _findDockInsertPoint(pills, e.clientX, e.clientY);
        const pos          = _getDockSlotPos(pills, insertBefore);

        ghost.style.left = pos.left + 'px';
        ghost.style.top  = pos.top  + 'px';

        indicator.style.left  = pos.left + 'px';
        indicator.style.top   = (pos.top - 2) + 'px';
        indicator.style.width = pos.width + 'px';
      }

      function onUp(e) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        document.removeEventListener('selectstart', onSelectStart);

        if (!dragging) return;
        document.body.classList.remove('is-dragging');
        ghost.remove();
        indicator.remove();
        wrapper.style.opacity = '';

        wrapper.addEventListener('click', ev => ev.stopPropagation(), { once: true, capture: true });

        const dock         = DOCK();
        const pills        = [...dock.querySelectorAll('.dock-icon')].filter(p => p !== wrapper);
        const insertBefore = _findDockInsertPoint(pills, e.clientX, e.clientY);
        if (insertBefore) {
          dock.insertBefore(wrapper, insertBefore);
        } else {
          dock.appendChild(wrapper);
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
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
      Object.values(state).forEach(s => s.dockIcon?.classList.remove('is-active'));
      state[topId].el.classList.add('is-active');
      state[topId].dockIcon?.classList.add('is-active');
    }
  }

  /* ── Private: z-index management + active state ──────────── */
  function _bringToFront(widget) {
    document.querySelectorAll('.widget').forEach(w => w.classList.remove('is-active'));
    Object.values(state).forEach(s => s.dockIcon?.classList.remove('is-active'));

    let maxZ = 100;
    document.querySelectorAll('.widget').forEach(w => {
      const z = parseInt(w.style.zIndex) || 100;
      if (z > maxZ) maxZ = z;
    });
    widget.style.zIndex = maxZ + 1;
    widget.classList.add('is-active');

    const id = widget.id.replace('widget-', '');
    if (state[id]) {
      state[id].dockIcon?.classList.add('is-active');
      // Keep panels always above their parent
      state[id].panelIds.forEach((pid, i) => {
        if (state[pid]) state[pid].el.style.zIndex = maxZ + 2 + i;
      });
    }
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

  /* ── Private: snap a single edge to the nearest snap line ─── */
  function _snapEdge(raw, lines) {
    let best = SNAP_THRESHOLD;
    let snapped = raw;
    lines.forEach(line => {
      const d = Math.abs(raw - line);
      if (d < best) { best = d; snapped = line; }
    });
    return snapped;
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

    // Clamp to minimums (per-widget override or global fallback) and workspace bounds
    const minW = parseInt(widget.style.minWidth)  || MIN_WIDTH;
    const minH = parseInt(widget.style.minHeight) || MIN_HEIGHT;
    return {
      width:  Math.max(minW, Math.min(sw, workspace.clientWidth  - left)),
      height: Math.max(minH, Math.min(sh, workspace.clientHeight - top)),
    };
  }

  /* ── Private: drag ────────────────────────────────────────── */
  function _initDrag(widget, id) {
    const header = widget.querySelector('.widget-header');

    header.addEventListener('mousedown', function (e) {
      if (e.target.closest('.widget-controls')) return;
      e.preventDefault();

      const startX    = e.clientX;
      const startY    = e.clientY;
      const startLeft = parseInt(widget.style.left) || 0;
      const startTop  = parseInt(widget.style.top)  || 0;

      // Capture all attached panels and their start positions at mousedown
      const panels = (state[id]?.panelIds || []).map(pid => {
        const el = state[pid]?.el;
        return el ? { el, startLeft: parseInt(el.style.left) || 0, startTop: parseInt(el.style.top) || 0 } : null;
      }).filter(Boolean);

      function onMove(e) {
        const workspace = WORKSPACE();
        const ww = workspace.clientWidth;
        const wh = workspace.clientHeight;

        // Snap parent position first, then derive a shared delta for the group
        const rawLeft = startLeft + e.clientX - startX;
        const rawTop  = startTop  + e.clientY - startY;
        const snapped = _snapPosition(widget, rawLeft, rawTop);
        let dx = snapped.left - startLeft;
        let dy = snapped.top  - startTop;

        // Clamp delta further so every panel also stays within workspace bounds
        panels.forEach(p => {
          dx = Math.max(dx, -p.startLeft);
          dx = Math.min(dx, ww - p.el.offsetWidth  - p.startLeft);
          dy = Math.max(dy, -p.startTop);
          dy = Math.min(dy, wh - p.el.offsetHeight - p.startTop);
        });

        // Apply the same delta to parent and all panels
        widget.style.left = (startLeft + dx) + 'px';
        widget.style.top  = (startTop  + dy) + 'px';
        panels.forEach(p => {
          p.el.style.left = (p.startLeft + dx) + 'px';
          p.el.style.top  = (p.startTop  + dy) + 'px';
        });
      }

      document.body.classList.add('is-dragging');

      function onUp() {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        const movedLeft = parseInt(widget.style.left) || 0;
        const movedTop  = parseInt(widget.style.top)  || 0;
        if (movedLeft !== startLeft || movedTop !== startTop) {
          if (state[id]) state[id].userMoved = true;
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  /* ── Public: resize widget to fit current content ────────── */
  function resizeToContent(id) {
    if (!state[id]) return;
    if (state[id].isResizing) return;           // suppress during handle drag
    const widget    = state[id].el;
    const workspace = WORKSPACE();
    const header    = widget.querySelector('.widget-header');
    const body      = widget.querySelector('.widget-body');
    const form      = widget.querySelector('.widget-form');
    const isPanel   = widget.classList.contains('is-panel');
    const headerH   = header ? header.offsetHeight : 0;
    const padTop    = parseInt(getComputedStyle(body).paddingTop)    || 0;
    const padBot    = parseInt(getComputedStyle(body).paddingBottom) || 0;
    const formH     = _measureBodyContent(body, form);
    const afterH    = isPanel ? 0 : 16;
    const natural   = headerH + padTop + formH + padBot + afterH + 6;
    const top       = parseInt(widget.style.top) || 0;
    const maxH      = workspace.clientHeight - top;
    const clamped   = Math.min(natural, maxH);
    // After a manual resize: only grow, never shrink back below the user-set height
    if (state[id].userResized && clamped <= widget.offsetHeight) return;
    widget.style.height = clamped + 'px';
  }

  /* ── Private: resize ──────────────────────────────────────── */
  function _initResize(widget, id) {
    widget.querySelectorAll('.widget-resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (state[id]) state[id].isResizing = true;

        const dir         = handle.dataset.dir;
        const startX      = e.clientX;
        const startY      = e.clientY;
        const startWidth  = widget.offsetWidth;
        const startHeight = widget.offsetHeight;
        const startLeft   = parseInt(widget.style.left) || 0;
        const startTop    = parseInt(widget.style.top)  || 0;

        // Panels track the right edge when it moves
        const panels = (state[id]?.panelIds || []).map(pid => {
          const el = state[pid]?.el;
          return el ? { el, startLeft: parseInt(el.style.left) || 0 } : null;
        }).filter(Boolean);

        function onMove(e) {
          const dx        = e.clientX - startX;
          const dy        = e.clientY - startY;
          const workspace = WORKSPACE();
          const minW      = parseInt(widget.style.minWidth)  || MIN_WIDTH;
          const minH      = parseInt(widget.style.minHeight) || MIN_HEIGHT;
          const { vLines, hLines } = _getSnapLines(widget);

          // Each edge is independent — snap the moving edge, fixed edge stays put
          if (dir.includes('e')) {
            const newRight = Math.max(startLeft + minW, Math.min(_snapEdge(startLeft + startWidth + dx, vLines), workspace.clientWidth));
            const newWidth = newRight - startLeft;
            widget.style.width = newWidth + 'px';
            const dw = newWidth - startWidth;
            panels.forEach(p => { p.el.style.left = (p.startLeft + dw) + 'px'; });
          }
          if (dir.includes('s')) {
            const newBottom = Math.max(startTop + minH, Math.min(_snapEdge(startTop + startHeight + dy, hLines), workspace.clientHeight));
            widget.style.height = (newBottom - startTop) + 'px';
          }
          if (dir.includes('w')) {
            const fixedRight = startLeft + startWidth;
            const newLeft    = Math.max(0, Math.min(_snapEdge(startLeft + dx, vLines), fixedRight - minW));
            widget.style.left  = newLeft + 'px';
            widget.style.width = (fixedRight - newLeft) + 'px';
          }
          if (dir.includes('n')) {
            const fixedBottom = startTop + startHeight;
            const newTop      = Math.max(0, Math.min(_snapEdge(startTop + dy, hLines), fixedBottom - minH));
            widget.style.top    = newTop + 'px';
            widget.style.height = (fixedBottom - newTop) + 'px';
          }
        }

        document.body.classList.add('is-dragging');

        function onUp() {
          if (state[id]) { state[id].isResizing = false; state[id].userResized = true; }
          document.body.classList.remove('is-dragging');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
      });
    });
  }

  /* ── Tab trap: keep focus within active widget + its panels ─── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;

    // Find the active parent widget
    const activeEntry = Object.entries(state).find(([, s]) =>
      !s.el.classList.contains('is-panel') && s.el.classList.contains('is-active')
    );
    if (!activeEntry) return;

    const activeState = activeEntry[1];

    // Collect focusable elements from parent body + all panel bodies, in DOM order
    const FOCUSABLE = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';
    const containers = [
      activeState.el.querySelector('.widget-body'),
      activeState.el.querySelector('.widget-footer'),
      ...activeState.panelIds.map(pid => state[pid]?.el).filter(Boolean),
    ].filter(Boolean);

    const focusable = containers.flatMap(c => [...c.querySelectorAll(FOCUSABLE)]);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  });

  /* ── Ctrl+Q: cycle within panel family, or all widgets if no panels ── */
  document.addEventListener('keydown', function (e) {
    if (!e.ctrlKey || e.code !== 'KeyQ') return;
    e.preventDefault();
    e.stopPropagation();

    const FOCUSABLE = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';

    // Find the active parent widget
    const activeEntry = Object.entries(state).find(([, s]) =>
      !s.el.classList.contains('is-panel') && s.el.classList.contains('is-active')
    );

    if (activeEntry) {
      const [parentId, parentState] = activeEntry;
      const openPanels = parentState.panelIds.filter(pid => state[pid]);

      if (openPanels.length > 0) {
        // Build family: parent first, then panels in order
        const family = [
          { id: parentId, el: parentState.el },
          ...openPanels.map(pid => ({ id: pid, el: state[pid].el })),
        ];
        // Determine which family member currently contains keyboard focus
        const focused  = document.activeElement;
        let currentIdx = family.findIndex(f => f.el.contains(focused));
        if (currentIdx === -1) currentIdx = 0;
        const next = family[(currentIdx + 1) % family.length];

        // Bring parent to front (sets is-active + base z-order for all panels)
        _bringToFront(parentState.el);
        // If the target is a panel, boost it above its siblings
        if (next.id !== parentId) {
          const maxZ = Math.max(...[...document.querySelectorAll('.widget')].map(w => parseInt(w.style.zIndex) || 100));
          next.el.style.zIndex = maxZ + 1;
        }

        const firstInput = next.el.querySelector(FOCUSABLE);
        if (firstInput) firstInput.focus();
        return;
      }
    }

    // No panels open — cycle all non-panel, non-minimized widgets by z-index
    const candidates = Object.entries(state)
      .filter(([, s]) => !s.isMinimized && !s.el.classList.contains('is-panel'))
      .sort(([, a], [, b]) => (parseInt(a.el.style.zIndex) || 100) - (parseInt(b.el.style.zIndex) || 100));

    if (candidates.length < 2) return;

    const activeIdx = candidates.findIndex(([, s]) => s.el.classList.contains('is-active'));
    const nextIdx   = (activeIdx + 1) % candidates.length;
    _bringToFront(candidates[nextIdx][1].el);
  });

  function isOpen(id)    { return !!state[id]; }
  function hasMoved(id)  { return !!(state[id]?.userMoved); }
  function getOpenIds()  { return Object.keys(state); }

  return { open, close, minimize, restore, resizeToContent, isOpen, hasMoved, getOpenIds };

})();
