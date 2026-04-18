/* CostGrid — shared CSS-Grid module for Estimate, Costbook, and Price List */
const CostGrid = (function () {

  /* config(prefix, columns) → cfg object
     Column shape:
       key, label, width, minWidth, align ('left'|'center'|'right'),
       sticky (bool), flex (bool — fills remaining space via minmax),
       hideable (bool), resize (bool, default true), visible (bool, default true) */
  function config(prefix, columns) {
    const cols = columns.map(c => ({
      key:      c.key,
      label:    c.label,
      width:    c.width    || 80,
      minWidth: c.minWidth || 30,
      align:    c.align    || 'right',
      sticky:   !!c.sticky,
      flex:     !!c.flex,
      hideable: !!c.hideable,
      resize:   c.resize !== false,
      visible:  c.visible !== false,
      varName:  `--cg-${prefix}-${c.key}`,
    }));
    return { prefix, cols };
  }

  function _tmpl(cfg) {
    return cfg.cols
      .filter(c => c.visible !== false)
      .map(c => c.flex ? `minmax(var(${c.varName}), 1fr)` : `var(${c.varName})`)
      .join(' ');
  }

  /* init(el, cfg) — set CSS vars + template on container el */
  function init(el, cfg) {
    cfg.cols.forEach(c => el.style.setProperty(c.varName, c.width + 'px'));
    el.style.setProperty(`--cg-${cfg.prefix}-tmpl`, _tmpl(cfg));
  }

  /* headerHTML(cfg, opts) — returns header row HTML string
     opts.prefix — raw HTML to prepend inside the header row (e.g. expand icon column) */
  function headerHTML(cfg, opts) {
    const pre   = (opts && opts.prefix) || '';
    const cells = cfg.cols.map(c => {
      const sticky = c.sticky ? ' cgrid-sticky' : '';
      const handle = c.resize ? '<span class="cgrid-resize"></span>' : '';
      return `<span class="cgrid-hdr-cell ${cfg.prefix}-col-${c.key}${sticky}" data-cg-col="${c.varName}"><span class="cgrid-hdr-label">${c.label}</span>${handle}</span>`;
    }).join('');
    return `<div class="cgrid-hdr">${pre}${cells}</div>`;
  }

  /* bindResize(el, cfg) — wire resize drag on header cells with cgrid-resize handles */
  function bindResize(el, cfg) {
    const hdr = el.querySelector('.cgrid-hdr');
    if (!hdr) return;
    hdr.querySelectorAll('.cgrid-resize').forEach(handle => {
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const cell    = this.closest('[data-cg-col]');
        const varName = cell.dataset.cgCol;
        const col     = cfg.cols.find(c => c.varName === varName);
        if (!col) return;
        const startX = e.clientX;
        const startW = cell.offsetWidth;
        document.body.classList.add('is-dragging');
        function onMove(ev) {
          el.style.setProperty(varName, Math.max(col.minWidth, startW + ev.clientX - startX) + 'px');
        }
        function onUp() {
          document.body.classList.remove('is-dragging');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  /* setColVisible(el, cfg, key, visible) — toggle column visibility + rebuild template */
  function setColVisible(el, cfg, key, visible) {
    const col = cfg.cols.find(c => c.key === key);
    if (!col) return;
    col.visible = visible;
    el.style.setProperty(`--cg-${cfg.prefix}-tmpl`, _tmpl(cfg));
    el.querySelectorAll(`.${cfg.prefix}-col-${key}`).forEach(cell => {
      cell.style.display = visible ? '' : 'none';
    });
  }

  return { config, init, headerHTML, bindResize, setColVisible };
})();
