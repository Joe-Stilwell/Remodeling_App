/* ================================================================
   MODULE: splitpanel.js
   Owns:   Two-panel (nav + main) resizable layout helper
   Public: SplitPanel.bindDivider
   Reads:  Nothing — zero dependencies on other modules
   Never:  Data access, widget lifecycle, AppData.
   ================================================================ */
const SplitPanel = (function () {

  /* bindDivider(dividerEl, opts)
     opts: { navEl, min, max, onMove }
       navEl  — the left/nav panel whose width is dragged
       min    — minimum nav width in px (default 80)
       max    — maximum nav width in px (default 400)
       onMove — optional callback(newWidth) for side effects */
  function bindDivider(dividerEl, opts) {
    const navEl  = opts.navEl;
    const min    = opts.min    || 80;
    const max    = opts.max    || 400;
    const onMove = opts.onMove || null;

    dividerEl.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = navEl.offsetWidth;
      document.body.classList.add('is-dragging');
      function move(ev) {
        const w = Math.max(min, Math.min(max, startW + ev.clientX - startX));
        navEl.style.width = w + 'px';
        if (onMove) onMove(w);
      }
      function up() {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  return { bindDivider };
})();
