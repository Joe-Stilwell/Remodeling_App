'use strict';
/*
 * utils.js — Shared utility functions.
 *
 * ColResize.bind(scaleEl, colHdrsEl, storageKey, opts)
 *   Attaches drag-to-resize behaviour to column header cells and persists
 *   widths to localStorage.
 *
 *   scaleEl          — element on which CSS custom properties are set
 *   colHdrsEl        — container element holding the resizable header cells
 *   storageKey       — localStorage key for width persistence
 *   opts.minWidth    (default 60)               — minimum column width in px
 *   opts.colAttr     (default 'data-col-var')   — attribute on header cells holding the CSS var name
 *   opts.handleSel   (default '.sp-col-resize') — CSS selector for the drag handle element
 */

const ColResize = (() => {

  function bind(scaleEl, colHdrsEl, storageKey, opts = {}) {
    const {
      minWidth  = 60,
      colAttr   = 'data-col-var',
      handleSel = '.sp-col-resize',
    } = opts;

    // Restore saved widths
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      colHdrsEl.querySelectorAll('[' + colAttr + ']').forEach(hdr => {
        const v = hdr.getAttribute(colAttr);
        if (saved[v]) scaleEl.style.setProperty(v, saved[v]);
      });
    } catch (_) {}

    // Drag to resize
    colHdrsEl.addEventListener('mousedown', function (e) {
      const handle = e.target.closest(handleSel);
      if (!handle) return;
      e.preventDefault();
      const hdr    = handle.closest('[' + colAttr + ']');
      if (!hdr) return;
      const colVar = hdr.getAttribute(colAttr);
      const startX = e.clientX;
      const startW = hdr.offsetWidth;
      document.body.classList.add('is-dragging');

      function onMove(e) {
        scaleEl.style.setProperty(colVar, Math.max(minWidth, startW + (e.clientX - startX)) + 'px');
      }
      function onUp() {
        document.body.classList.remove('is-dragging');
        const widths = {};
        colHdrsEl.querySelectorAll('[' + colAttr + ']').forEach(h => {
          const v   = h.getAttribute(colAttr);
          const val = scaleEl.style.getPropertyValue(v).trim();
          if (val) widths[v] = val;
        });
        localStorage.setItem(storageKey, JSON.stringify(widths));
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  return { bind };

})();
