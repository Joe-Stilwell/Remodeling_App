'use strict';
/*
 * dispatch.js — Dispatch Board widget
 * Public: Dispatch.openDispatch
 */

const Dispatch = (() => {

  /* ── Constants ─────────────────────────────────────────────── */

  const _TECHS     = ['Mike Johnson', 'Dave Wilson', 'Tom Davis'];
  const _HOURS     = Array.from({ length: 24 }, (_, i) => i);

  const _TIME_W   = 62;  // px — time label column
  const _COL_W    = 120; // px — default tech column width
  const _ROW_H    = 52;  // px — default hour row height
  const _DAY_HDR  = 28;  // px — day header row
  const _TECH_HDR = 24;  // px — tech sub-header row

  /* ── Mock schedule data ───────────────────────────────────────
     Cards use absolute ISO dates computed once from today so they
     always appear in the current view and navigate correctly.
  ─────────────────────────────────────────────────────────────── */

  function _dateISO(offsetDays) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  const _GRID_CARDS = [
    { woId: 'WO-0001', clientName: 'John & Mary Smith',   phone: '(615) 555-0101', date: _dateISO(0), techIdx: 0, startHour: 9,  startMin: 0,  durationMin: 120, status: 'onsite'     },
    { woId: 'WO-0002', clientName: 'Robert Johnson',       phone: '(615) 555-0102', date: _dateISO(0), techIdx: 1, startHour: 11, startMin: 0,  durationMin: 90,  status: 'dispatched' },
    { woId: 'WO-0003', clientName: 'Patricia & Tom Ward',  phone: '(615) 555-0103', date: _dateISO(0), techIdx: 2, startHour: 8,  startMin: 0,  durationMin: 180, status: 'dispatched' },
    { woId: 'WO-0004', clientName: 'David Chen',           phone: '(615) 555-0104', date: _dateISO(1), techIdx: 0, startHour: 10, startMin: 0,  durationMin: 60,  status: 'scheduled'  },
    { woId: 'WO-0005', clientName: 'Susan & Mark Torres',  phone: '(615) 555-0105', date: _dateISO(1), techIdx: 2, startHour: 9,  startMin: 30, durationMin: 150, status: 'scheduled'  },
    { woId: 'WO-0002', clientName: 'Robert Johnson',       phone: '(615) 555-0102', date: _dateISO(2), techIdx: 1, startHour: 13, startMin: 0,  durationMin: 60,  status: 'scheduled'  },
    { woId: 'WO-0004', clientName: 'David Chen',           phone: '(615) 555-0104', date: _dateISO(5), techIdx: 1, startHour: 10, startMin: 0,  durationMin: 90,  status: 'complete'   },
    { woId: 'WO-0001', clientName: 'John & Mary Smith',   phone: '(615) 555-0101', date: _dateISO(5), techIdx: 0, startHour: 14, startMin: 0,  durationMin: 120, status: 'complete'   },
  ];

  const _UNSCHEDULED = [
    { woId: 'WO-U001', clientName: 'Alex Turner',    phone: '(615) 555-0201', woType: 'Plumbing Repair' },
    { woId: 'WO-U002', clientName: 'Karen Mitchell', phone: '(615) 555-0202', woType: 'HVAC Service'    },
  ];

  const _ONHOLD = [];

  /* ── Date helpers ──────────────────────────────────────────── */

  function _weekDays(startDate) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  }

  function _isoDate(d) {
    return d.toISOString().slice(0, 10);
  }

  function _isToday(d) {
    const t = new Date();
    return d.getFullYear() === t.getFullYear() &&
           d.getMonth()    === t.getMonth()    &&
           d.getDate()     === t.getDate();
  }

  function _fmtDayHdr(d) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function _fmtHour(h) {
    if (h === 0)  return '12:00 am';
    if (h < 12)   return h + ':00 am';
    if (h === 12) return '12:00 pm';
    return (h - 12) + ':00 pm';
  }
  function _fmtSubHour(h, m) {
    const sfx = h < 12 ? 'am' : 'pm';
    return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + sfx;
  }

  function _weekLabel(days) {
    const s = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return s + ' – ' + e;
  }

  /* ── Time column HTML (locked, not part of scroll grid) ────── */

  function _timeColHTML() {
    let html = `<div class="db-corner"></div><div class="db-tech-corner"></div>`;
    _HOURS.forEach(h => {
      html += `<div class="db-time-cell" data-hour="${h}">
        <span class="db-time-label">${_fmtHour(h)}</span>
        <div class="db-row-resize"></div>
      </div>`;
    });
    return html;
  }

  /* ── Grid inner HTML (day/tech headers + cells only) ─────── */

  function _gridInnerHTML(days, techs) {
    let html = '';

    days.forEach((d, di) => {
      const todayCls = _isToday(d) ? ' is-today' : '';
      html += `<div class="db-day-hdr${todayCls}" style="grid-column:span ${techs.length}" data-day-idx="${di}">
        <span class="db-day-label">${_fmtDayHdr(d)}</span>
        <div class="db-day-resize" data-day-idx="${di}"></div>
      </div>`;
    });

    days.forEach((_, di) => {
      techs.forEach((t, ti) => {
        const last = ti === techs.length - 1 ? ' db-day-last' : '';
        html += `<div class="db-tech-hdr${last}" data-day-idx="${di}" data-tech-idx="${ti}">
          <span class="db-tech-label">${t}</span>
        </div>`;
      });
    });

    _HOURS.forEach(h => {
      days.forEach((d, di) => {
        techs.forEach((_, ti) => {
          const last = ti === techs.length - 1 ? ' db-day-last' : '';
          html += `<div class="db-cell${last}" data-date="${_isoDate(d)}" data-hour="${h}" data-day-idx="${di}" data-tech-idx="${ti}"></div>`;
        });
      });
    });

    return html;
  }

  /* ── Widget shell HTML ─────────────────────────────────────── */

  function _dispatchHTML(days, techs, colW) {
    const colTemplate = _buildColTemplate(days, techs, colW);
    return `<div class="db-widget">
      <div class="sp-toolbar db-toolbar">
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="db-prev" title="Previous day">&#8249;</button>
        <button class="btn-secondary sp-btn sp-btn-wide db-week-btn" data-action="db-week-pick">${_weekLabel(days)}</button>
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="db-next" title="Next day">&#8250;</button>
        <button class="btn-secondary sp-btn" data-action="db-today">Today</button>
        <button class="btn-primary sp-btn sp-btn-wide" data-action="db-new-wo">+Work Order</button>
        <span style="margin-left:auto"></span>
        <button class="btn-secondary sp-btn sp-btn-wide" data-action="db-techs">Techs &#9660;</button>
      </div>
      <div class="db-body">
        <div class="db-unscheduled">
          <div class="db-lane-hdr">Unscheduled</div>
          <div class="db-lane-cards"></div>
        </div>
        <div class="db-grid-area">
          <div class="db-time-col">${_timeColHTML()}</div>
          <div class="db-grid-scroll">
            <div class="db-grid-inner" style="grid-template-columns:${colTemplate}">
              ${_gridInnerHTML(days, techs)}
            </div>
          </div>
        </div>
        <div class="db-onhold">
          <div class="db-lane-hdr">On Hold</div>
          <div class="db-lane-cards"></div>
        </div>
      </div>
    </div>`;
  }

  function _buildColTemplate(days, techs, colW) {
    const cols = [];
    for (let i = 0; i < days.length * techs.length; i++) cols.push(`${colW}px`);
    return cols.join(' ');
  }

  /* ── Open ──────────────────────────────────────────────────── */

  function openDispatch() {
    const id        = 'dispatch-board';
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const days      = _weekDays(startDate);
    if (WidgetManager.open(id, 'Dispatch Board', _dispatchHTML(days, _TECHS, _COL_W), {
      width: 1060, height: 660, minWidth: 740, minHeight: 440,
      category: 'workorder',
    }) !== false) {
      _bindDispatch(id, startDate);
      requestAnimationFrame(() => WidgetManager.toggleMaximize(id));
    }
  }

  /* ── Bind ──────────────────────────────────────────────────── */

  function _bindDispatch(widgetId, initialStart) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    let _startDate = new Date(initialStart);
    let _techs     = _TECHS.slice();
    let _colW          = _COL_W;
    let _rowH          = _ROW_H;
    let _expandedHours = new Set(); // hours expanded to 15-min sub-slots

    const scroll    = el.querySelector('.db-grid-scroll');
    const gridInner = el.querySelector('.db-grid-inner');
    const timeCol   = el.querySelector('.db-time-col');

    let _dragJustEnded = false;

    function _colTemplate() {
      return _buildColTemplate(_weekDays(_startDate), _techs, _colW);
    }

    /* Per-hour height: expanded hours are 4× taller (one sub-row per 15 min) */
    function _rowHeightForHour(h) { return _expandedHours.has(h) ? 4 * _rowH : _rowH; }

    /* Top pixel position of an hour's row within grid content (below headers) */
    function _rowTopForHour(h) {
      let top = _DAY_HDR + _TECH_HDR;
      for (let i = 0; i < h; i++) top += _rowHeightForHour(i);
      return top;
    }

    function _applyAllRowHeights() {
      _HOURS.forEach(h => {
        const rh = _rowHeightForHour(h);
        el.querySelectorAll(`.db-time-cell[data-hour="${h}"], .db-cell[data-hour="${h}"]`)
          .forEach(c => c.style.height = rh + 'px');
      });
    }

    /* Pixel height for a card spanning startHour:startMin + durationMin */
    function _cardHeightPx(startHour, startMin, durationMin) {
      let px = 0, rem = durationMin, h = startHour, m = startMin;
      while (rem > 0 && h < 24) {
        const mins = Math.min(rem, 60 - m);
        px += (mins / 60) * _rowHeightForHour(h);
        rem -= mins; m = 0; h++;
      }
      return Math.max(24, px - 2);
    }

    /* Snap column width so exactly N full days fill the grid viewport */
    function _snapColWidth() {
      const available = scroll.clientWidth;
      if (available <= 0) return;
      const dayW  = _techs.length * _colW;
      const nDays = Math.max(1, Math.round(available / dayW));
      _colW = Math.max(60, available / (nDays * _techs.length));
      el.querySelector('.db-grid-inner').style.gridTemplateColumns = _colTemplate();
      /* Align scroll to nearest day boundary so no partial day shows on left */
      const newDayW = _techs.length * _colW;
      scroll.scrollLeft = Math.round(scroll.scrollLeft / newDayW) * newDayW;
      _renderCards();
      _updateNowLine();
    }

    /* ── Grid coordinate helpers ── */
    function _posFromMouse(innerX, innerY) {
      const colIdx = Math.floor(innerX / _colW);
      if (colIdx < 0 || colIdx >= 7 * _techs.length) return { valid: false };
      const dayIdx  = Math.floor(colIdx / _techs.length);
      const techIdx = colIdx % _techs.length;
      let y = innerY - _DAY_HDR - _TECH_HDR;
      if (y < 0) return { valid: false };
      for (let h = 0; h < 24; h++) {
        const rh = _rowHeightForHour(h);
        if (y < rh) {
          const snapped = Math.round((y / rh) * 60 / 15) * 15;
          if (snapped >= 60) return snapped > 45 && h < 23
            ? { valid: true, dayIdx, techIdx, hour: h + 1, min: 0 }
            : { valid: true, dayIdx, techIdx, hour: h,     min: 45 };
          return { valid: true, dayIdx, techIdx, hour: h, min: snapped };
        }
        y -= rh;
      }
      return { valid: false };
    }

    function _cardLeft(dayIdx, techIdx) {
      return dayIdx * _techs.length * _colW + techIdx * _colW + 2;
    }
    function _cardTop(hour, min) {
      return _rowTopForHour(hour) + (min / 60) * _rowHeightForHour(hour) + 1;
    }

    /* Date at a given day-index in the current view */
    function _dateAtSlot(dayIdx) {
      const d = new Date(_startDate);
      d.setDate(_startDate.getDate() + dayIdx);
      return _isoDate(d);
    }

    /* Column index for an ISO date string (returns -1 if outside current view) */
    function _slotForDate(isoStr) {
      const cardTime  = new Date(isoStr + 'T00:00:00');
      const diffDays  = Math.round((cardTime - _startDate) / 86400000);
      return (diffDays >= 0 && diffDays <= 6) ? diffDays : -1;
    }

    /* Time-range conflict check */
    function _hasConflict(excludeCard, date, techIdx, startHour, startMin, durationMin) {
      const newStart = startHour * 60 + startMin;
      const newEnd   = newStart + durationMin;
      return _GRID_CARDS.some(c => {
        if (c === excludeCard) return false;
        if (c.date !== date || c.techIdx !== techIdx) return false;
        const cs = c.startHour * 60 + c.startMin;
        return newStart < cs + c.durationMin && cs < newEnd;
      });
    }

    /* ── Universal card drag — grid ↔ unscheduled ↔ on-hold ── */
    function _startUniversalDrag(e, cardData, source, sourceDiv) {
      e.preventDefault();
      e.stopPropagation();

      const srcR   = sourceDiv.getBoundingClientRect();
      const offX   = Math.min(e.clientX - srcR.left, _colW - 4);
      const offY   = Math.min(e.clientY - srcR.top,  _rowH - 4);
      const ghostW = _colW - 4;
      const ghostH = source === 'grid'
        ? Math.max(24, (cardData.durationMin / 60) * _rowH - 2)
        : Math.max(24, _rowH - 2);

      const ghost = document.createElement('div');
      ghost.className = `db-card db-card--${cardData.status || 'scheduled'}`;
      ghost.style.cssText = `position:fixed;width:${ghostW}px;height:${ghostH}px;pointer-events:none;z-index:200;opacity:0.85;box-sizing:border-box;`;
      ghost.innerHTML = `
        <div class="db-card-header"></div>
        <div class="db-card-body">
          <div class="db-card-name">${cardData.clientName}</div>
          <div class="db-card-phone">${cardData.phone}</div>
        </div>`;
      document.body.appendChild(ghost);

      sourceDiv.style.opacity = '0.25';
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('is-dragging');

      const unsEl  = el.querySelector('.db-unscheduled');
      const holdEl = el.querySelector('.db-onhold');

      let currentZone = null;
      let currentPos  = null;
      let lastEvt     = e;

      /* ── Horizontal auto-scroll ── */
      const H_EDGE = 60;
      let hScrollTimer = null;
      let hScrollDir   = 0;

      function _stopHScroll() { clearTimeout(hScrollTimer); hScrollTimer = null; hScrollDir = 0; }

      function _doHScroll(dir) {
        if (hScrollDir !== dir) return;
        const maxL = scroll.scrollWidth - scroll.clientWidth;
        if (dir === -1 && scroll.scrollLeft <= 0) {
          /* At left boundary: navigate one day earlier */
          _startDate.setDate(_startDate.getDate() - 1);
          _rebuild();
          scroll.scrollLeft = _techs.length * _colW; // show new rightmost shifted content
        } else if (dir === 1 && scroll.scrollLeft >= maxL - 2) {
          /* At right boundary: navigate one day forward */
          if (maxL < 3) { _stopHScroll(); return; } // all days visible — nowhere to scroll
          _startDate.setDate(_startDate.getDate() + 1);
          _rebuild();
          scroll.scrollLeft = Math.max(0, maxL - _techs.length * _colW);
        } else {
          scroll.scrollLeft = Math.max(0, Math.min(maxL, scroll.scrollLeft + dir * _techs.length * _colW));
        }
        _updateIndicator(lastEvt);
        hScrollTimer = setTimeout(() => _doHScroll(dir), 400);
      }

      function _startHScroll(dir) {
        if (hScrollDir === dir) return;
        _stopHScroll();
        hScrollDir = dir;
        hScrollTimer = setTimeout(() => _doHScroll(dir), 250);
      }

      /* ── Vertical auto-scroll ── */
      const V_EDGE = 60;
      let vScrollTimer = null;
      let vScrollDir   = 0;

      function _stopVScroll() { clearTimeout(vScrollTimer); vScrollTimer = null; vScrollDir = 0; }

      function _doVScroll(dir) {
        if (vScrollDir !== dir) return;
        const maxT = scroll.scrollHeight - scroll.clientHeight;
        scroll.scrollTop = Math.max(0, Math.min(maxT, scroll.scrollTop + dir * 8));
        _updateIndicator(lastEvt);
        const atEdge = (dir === -1 && scroll.scrollTop <= 0) || (dir === 1 && scroll.scrollTop >= maxT);
        if (!atEdge) vScrollTimer = setTimeout(() => _doVScroll(dir), 16);
        else _stopVScroll();
      }

      function _startVScroll(dir) {
        if (vScrollDir === dir) return;
        _stopVScroll();
        vScrollDir = dir;
        vScrollTimer = setTimeout(() => _doVScroll(dir), 16);
      }

      /* ── Zone + indicator update ── */
      function _updateIndicator(me) {
        const scrollR = scroll.getBoundingClientRect();
        const unsR    = unsEl.getBoundingClientRect();
        const holdR   = holdEl.getBoundingClientRect();

        const inGrid = me.clientX >= scrollR.left && me.clientX <= scrollR.right &&
                       me.clientY >= scrollR.top  && me.clientY <= scrollR.bottom;
        const inUns  = me.clientX >= unsR.left && me.clientX <= unsR.right &&
                       me.clientY >= unsR.top  && me.clientY <= unsR.bottom;
        const inHold = me.clientX >= holdR.left && me.clientX <= holdR.right &&
                       me.clientY >= holdR.top  && me.clientY <= holdR.bottom;

        unsEl.classList.remove('db-lane--drop');
        holdEl.classList.remove('db-lane--drop');
        currentZone = null;
        currentPos  = null;

        if (inGrid) {
          const ir  = gridInner.getBoundingClientRect();
          const pos = _posFromMouse(me.clientX - ir.left - offX + ghostW / 2, me.clientY - ir.top - offY);
          if (pos.valid) {
            currentZone = 'grid';
            currentPos  = pos;
          }
        } else if (inUns && source !== 'unscheduled') {
          currentZone = 'unscheduled';
          unsEl.classList.add('db-lane--drop');
        } else if (inHold && source !== 'onhold') {
          currentZone = 'onhold';
          holdEl.classList.add('db-lane--drop');
        }
      }

      function onMove(me) {
        lastEvt = me;
        _updateIndicator(me);
        if (currentZone === 'grid' && currentPos) {
          const ir = gridInner.getBoundingClientRect();
          ghost.style.left = (ir.left + _cardLeft(currentPos.dayIdx, currentPos.techIdx)) + 'px';
          ghost.style.top  = (ir.top  + _cardTop(currentPos.hour, currentPos.min)) + 'px';
        } else {
          ghost.style.left = (me.clientX - offX) + 'px';
          ghost.style.top  = (me.clientY - offY) + 'px';
        }

        const scrollR     = scroll.getBoundingClientRect();
        const cardCenterX = me.clientX - offX + ghostW / 2;
        /* Left: card-center based — stops scrolling once card centre exits into Unscheduled */
        if (cardCenterX >= scrollR.left && cardCenterX < scrollR.left + H_EDGE) {
          _startHScroll(-1);
        /* Right: mouse-position based — scrolls while mouse is inside grid, stops when mouse enters On Hold */
        } else if (me.clientX > scrollR.right - H_EDGE && me.clientX <= scrollR.right) {
          _startHScroll(1);
        } else {
          _stopHScroll();
        }
        /* Vertical */
        if (me.clientY < scrollR.top + V_EDGE)          _startVScroll(-1);
        else if (me.clientY > scrollR.bottom - V_EDGE)  _startVScroll(1);
        else                                             _stopVScroll();
      }

      function onUp(me) {
        _stopHScroll();
        _stopVScroll();
        document.body.classList.remove('is-dragging');
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        ghost.remove();
        sourceDiv.style.opacity = '';
        unsEl.classList.remove('db-lane--drop');
        holdEl.classList.remove('db-lane--drop');
        _dragJustEnded = true;
        requestAnimationFrame(() => { _dragJustEnded = false; });

        if (currentZone === 'grid' && currentPos) {
          const date    = _dateAtSlot(currentPos.dayIdx);
          const dur     = source === 'grid' ? cardData.durationMin : 60;
          const exclude = source === 'grid' ? cardData : null;
          const conflict = _hasConflict(exclude, date, currentPos.techIdx, currentPos.hour, currentPos.min, dur);

          /* Snapshot previous state for potential revert */
          const prevState = source === 'grid'
            ? { zone: 'grid', date: cardData.date, techIdx: cardData.techIdx, startHour: cardData.startHour, startMin: cardData.startMin }
            : { zone: source };

          /* Apply move unconditionally */
          let placedCard;
          if (source === 'grid') {
            cardData.date      = date;
            cardData.techIdx   = currentPos.techIdx;
            cardData.startHour = currentPos.hour;
            cardData.startMin  = currentPos.min;
            placedCard = cardData;
          } else {
            const srcArr = source === 'unscheduled' ? _UNSCHEDULED : _ONHOLD;
            srcArr.splice(srcArr.indexOf(cardData), 1);
            placedCard = {
              woId: cardData.woId, clientName: cardData.clientName, phone: cardData.phone,
              date, techIdx: currentPos.techIdx,
              startHour: currentPos.hour, startMin: currentPos.min,
              durationMin: 60, status: cardData.status || 'scheduled',
            };
            _GRID_CARDS.push(placedCard);
          }

          _renderCards();
          _renderUnscheduled();
          _renderOnHold();

          if (conflict) {
            _showConflictDialog(me.clientX, me.clientY, placedCard, prevState, cardData);
          }
        } else if (currentZone === 'unscheduled') {
          if (source === 'grid') {
            _GRID_CARDS.splice(_GRID_CARDS.indexOf(cardData), 1);
            _UNSCHEDULED.push({ woId: cardData.woId, clientName: cardData.clientName, phone: cardData.phone, woType: '', status: cardData.status });
          } else if (source === 'onhold') {
            _ONHOLD.splice(_ONHOLD.indexOf(cardData), 1);
            _UNSCHEDULED.push({ woId: cardData.woId, clientName: cardData.clientName, phone: cardData.phone, woType: '', status: cardData.status });
          }
          _renderCards();
          _renderUnscheduled();
          _renderOnHold();
        } else if (currentZone === 'onhold') {
          if (source === 'grid') {
            _GRID_CARDS.splice(_GRID_CARDS.indexOf(cardData), 1);
            _ONHOLD.push({ woId: cardData.woId, clientName: cardData.clientName, phone: cardData.phone, woType: '', status: cardData.status });
          } else if (source === 'unscheduled') {
            _UNSCHEDULED.splice(_UNSCHEDULED.indexOf(cardData), 1);
            _ONHOLD.push({ woId: cardData.woId, clientName: cardData.clientName, phone: cardData.phone, woType: '', status: cardData.status });
          }
          _renderCards();
          _renderUnscheduled();
          _renderOnHold();
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    /* ── Card resize (bottom-edge duration) ── */
    function _startResize(e, div, card) {
      e.preventDefault();
      e.stopPropagation();
      const startY   = e.clientY;
      const startDur = card.durationMin;
      document.body.classList.add('is-dragging');

      const pixPerMin = _rowHeightForHour(card.startHour) / 60;
      function onMove(me) {
        const snapped = Math.max(15, Math.round((startDur + (me.clientY - startY) / pixPerMin) / 15) * 15);
        div.style.height = _cardHeightPx(card.startHour, card.startMin, snapped) + 'px';
      }

      function onUp(me) {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        card.durationMin = Math.max(15, Math.round((startDur + (me.clientY - startY) / pixPerMin) / 15) * 15);
        _dragJustEnded   = true;
        requestAnimationFrame(() => { _dragJustEnded = false; });
        _renderCards();
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    /* ── Attach drag + resize to a grid card div ── */
    function _attachCardHandlers(div, card) {
      div.querySelector('.db-card-header').addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        _startUniversalDrag(e, card, 'grid', div);
      });
      const handle = div.querySelector('.db-card-drag-handle');
      if (handle) handle.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        _startResize(e, div, card);
      });
      div.querySelector('.db-card-body').addEventListener('dblclick', e => {
        if (_dragJustEnded) return;
        WorkOrders.openWorkOrder(card.woId);
      });
      div.addEventListener('contextmenu', e => _showCtxMenu(e, card, 'grid'));
    }

    /* ── Card context menu ── */
    const _STATUSES = [
      { key: 'scheduled',  label: 'Scheduled',  color: 'var(--color-db-status-scheduled)'  },
      { key: 'dispatched', label: 'Dispatched', color: 'var(--color-db-status-dispatched)' },
      { key: 'onsite',     label: 'On Site',    color: 'var(--color-db-status-onsite)'     },
      { key: 'complete',   label: 'Complete',   color: 'var(--color-db-status-complete)'   },
    ];

    let _ctxMenu = null;
    let _ctxTarget = null;

    function _showCtxMenu(e, card, source) {
      e.preventDefault();
      if (!_ctxMenu) {
        _ctxMenu = document.createElement('div');
        _ctxMenu.className = 'db-ctx-menu';
        document.body.appendChild(_ctxMenu);
      }
      _ctxTarget = { card, source };

      _ctxMenu.innerHTML = `
        <div class="db-ctx-section">Status</div>
        ${_STATUSES.map(s => `
          <div class="db-ctx-item${card.status === s.key ? ' is-active' : ''}" data-action="status" data-status="${s.key}">
            <span class="db-ctx-dot" style="background:${s.color}"></span>
            ${s.label}
            ${card.status === s.key ? '<span class="db-ctx-check">✓</span>' : ''}
          </div>`).join('')}
        <div class="db-ctx-sep"></div>
        ${source === 'grid' ? `
          <div class="db-ctx-item" data-action="add-tech">Add Another Tech…</div>
          <div class="db-ctx-item" data-action="return-unscheduled">Return to Unscheduled</div>
          <div class="db-ctx-sep"></div>
        ` : ''}
        <div class="db-ctx-item" data-action="open-wo">Open Work Order</div>`;

      _ctxMenu.classList.add('is-open');
      _ctxMenu.style.left = '0'; _ctxMenu.style.top = '0'; // reset before measuring
      const mw = _ctxMenu.offsetWidth, mh = _ctxMenu.offsetHeight;
      const x = (e.clientX + mw > window.innerWidth  - 8) ? e.clientX - mw : e.clientX + 2;
      const y = (e.clientY + mh > window.innerHeight - 8) ? e.clientY - mh : e.clientY + 2;
      _ctxMenu.style.left = x + 'px';
      _ctxMenu.style.top  = y + 'px';

      _ctxMenu.querySelectorAll('[data-action]').forEach(item => {
        item.addEventListener('click', ev => {
          ev.stopPropagation();
          _handleCtxAction(item.dataset.action, item.dataset.status);
          _hideCtxMenu();
        });
      });
    }

    function _hideCtxMenu() {
      if (_ctxMenu) _ctxMenu.classList.remove('is-open');
    }

    function _handleCtxAction(action, value) {
      const { card, source } = _ctxTarget;
      if (action === 'status') {
        card.status = value;
        _renderCards();
        _renderUnscheduled();
        _renderOnHold();
      } else if (action === 'add-tech') {
        Toast.show('Add Another Tech — coming in next build');
      } else if (action === 'return-unscheduled') {
        _GRID_CARDS.splice(_GRID_CARDS.indexOf(card), 1);
        _UNSCHEDULED.push({ woId: card.woId, clientName: card.clientName, phone: card.phone, woType: '', status: 'scheduled' });
        _renderCards();
        _renderUnscheduled();
      } else if (action === 'open-wo') {
        WorkOrders.openWorkOrder(card.woId);
      }
    }

    /* ── Resource conflict dialog ── */
    function _showConflictDialog(x, y, placedCard, prevState, origCardData) {
      el.querySelectorAll('.db-conflict-dialog').forEach(d => d.remove());
      const dlg = document.createElement('div');
      dlg.className = 'db-conflict-dialog';
      dlg.innerHTML = `
        <span class="db-conflict-title">Resource Conflict</span>
        <button class="db-conflict-keep"   title="Keep placement">&#10003;</button>
        <button class="db-conflict-revert" title="Snap back">&#10005;</button>`;
      document.body.appendChild(dlg);

      /* Position near drop point, constrained to viewport */
      const dw = 220, dh = 40;
      const cx = x + dw > window.innerWidth  - 8 ? x - dw : x + 8;
      const cy = y + dh > window.innerHeight - 8 ? y - dh : y + 8;
      dlg.style.left = cx + 'px';
      dlg.style.top  = cy + 'px';

      dlg.querySelector('.db-conflict-keep').addEventListener('click', () => dlg.remove());

      dlg.querySelector('.db-conflict-revert').addEventListener('click', () => {
        dlg.remove();
        if (prevState.zone === 'grid') {
          placedCard.date      = prevState.date;
          placedCard.techIdx   = prevState.techIdx;
          placedCard.startHour = prevState.startHour;
          placedCard.startMin  = prevState.startMin;
        } else {
          _GRID_CARDS.splice(_GRID_CARDS.indexOf(placedCard), 1);
          const laneArr = prevState.zone === 'unscheduled' ? _UNSCHEDULED : _ONHOLD;
          laneArr.push({ woId: origCardData.woId, clientName: origCardData.clientName, phone: origCardData.phone, woType: '', status: origCardData.status });
        }
        _renderCards();
        _renderUnscheduled();
        _renderOnHold();
      });
    }

    function _updateNowLine() {
      el.querySelectorAll('.db-now-line').forEach(l => l.remove());
      const now   = new Date();
      const topPx = _rowTopForHour(now.getHours()) + (now.getMinutes() / 60) * _rowHeightForHour(now.getHours());

      /* Line in scrollable grid — explicit width so right:0 works in CSS grid on Windows */
      const gridLine = document.createElement('div');
      gridLine.className = 'db-now-line';
      gridLine.style.cssText = `top:${topPx}px; width:${_weekDays(_startDate).length * _techs.length * _colW}px`;
      el.querySelector('.db-grid-inner').appendChild(gridLine);

      /* Matching marker in time column */
      const timeMarker = document.createElement('div');
      timeMarker.className = 'db-now-line db-now-line--time';
      timeMarker.style.top = topPx + 'px';
      timeCol.appendChild(timeMarker);
    }

    /* Render sub-labels inside expanded time cells */
    function _renderTimeCol() {
      el.querySelectorAll('.db-time-cell').forEach(cell => {
        const h = parseInt(cell.dataset.hour);
        cell.querySelectorAll('.db-time-sublabel').forEach(l => l.remove());
        if (_expandedHours.has(h)) {
          cell.classList.add('db-time-cell--expanded');
          [15, 30, 45].forEach((m, i) => {
            const sub = document.createElement('span');
            sub.className = 'db-time-sublabel';
            sub.style.top = ((i + 1) * _rowH + 2) + 'px';
            sub.textContent = ':' + String(m).padStart(2, '0');
            cell.appendChild(sub);
          });
        } else {
          cell.classList.remove('db-time-cell--expanded');
        }
      });
    }

    /* Scroll today's column to left edge */
    function _scrollTodayLeft() {
      const days     = _weekDays(_startDate);
      const todayIdx = days.findIndex(d => _isToday(d));
      if (todayIdx < 0) return;
      scroll.scrollLeft = todayIdx * _techs.length * _colW;
    }

    /* ── Render grid cards (absolute-date based) ── */
    function _renderCards() {
      el.querySelectorAll('.db-grid-inner .db-card').forEach(c => c.remove());
      const inner = el.querySelector('.db-grid-inner');

      _GRID_CARDS.forEach(card => {
        const dayIdx = _slotForDate(card.date);
        if (dayIdx < 0) return;

        const left   = _cardLeft(dayIdx, card.techIdx);
        const top    = _cardTop(card.startHour, card.startMin);
        const width  = _colW - 4;
        const height = _cardHeightPx(card.startHour, card.startMin, card.durationMin);

        const div = document.createElement('div');
        div.className = `db-card db-card--${card.status}`;
        div.dataset.woId        = card.woId;
        div.dataset.tipName     = card.clientName;
        div.dataset.tipPhone    = card.phone;
        div.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
        div.innerHTML = `
          <div class="db-card-header"></div>
          <div class="db-card-body">
            <div class="db-card-name">${card.clientName}</div>
            <div class="db-card-phone">${card.phone}</div>
          </div>
          ${card.status !== 'complete' ? '<div class="db-card-drag-handle"></div>' : ''}`;
        inner.appendChild(div);
        _attachCardHandlers(div, card);
      });
    }

    /* ── Render unscheduled lane ── */
    function _renderUnscheduled() {
      const lane = el.querySelector('.db-unscheduled .db-lane-cards');
      lane.innerHTML = _UNSCHEDULED.map(c => `
        <div class="db-card db-card--${c.status || 'scheduled'} db-card--lane" data-wo-id="${c.woId}" data-tip-name="${c.clientName}" data-tip-phone="${c.phone}">
          <div class="db-card-header"></div>
          <div class="db-card-body">
            <div class="db-card-name">${c.clientName}</div>
            <div class="db-card-phone">${c.phone}</div>
            <div class="db-card-type">${c.woType}</div>
          </div>
        </div>`).join('');
      lane.querySelectorAll('.db-card').forEach((div, i) => {
        div.querySelector('.db-card-header').addEventListener('mousedown', e => {
          if (e.button !== 0) return;
          _startUniversalDrag(e, _UNSCHEDULED[i], 'unscheduled', div);
        });
        div.querySelector('.db-card-body').addEventListener('dblclick', () => WorkOrders.openWorkOrder(_UNSCHEDULED[i].woId));
        div.addEventListener('contextmenu', e => _showCtxMenu(e, _UNSCHEDULED[i], 'unscheduled'));
      });
    }

    /* ── Render on-hold lane ── */
    function _renderOnHold() {
      const lane = el.querySelector('.db-onhold .db-lane-cards');
      lane.innerHTML = _ONHOLD.map(c => `
        <div class="db-card db-card--${c.status || 'scheduled'} db-card--lane" data-wo-id="${c.woId}" data-tip-name="${c.clientName}" data-tip-phone="${c.phone}">
          <div class="db-card-header"></div>
          <div class="db-card-body">
            <div class="db-card-name">${c.clientName}</div>
            <div class="db-card-phone">${c.phone}</div>
            <div class="db-card-type">${c.woType || ''}</div>
          </div>
        </div>`).join('');
      lane.querySelectorAll('.db-card').forEach((div, i) => {
        div.querySelector('.db-card-header').addEventListener('mousedown', e => {
          if (e.button !== 0) return;
          _startUniversalDrag(e, _ONHOLD[i], 'onhold', div);
        });
        div.querySelector('.db-card-body').addEventListener('dblclick', () => WorkOrders.openWorkOrder(_ONHOLD[i].woId));
        div.addEventListener('contextmenu', e => _showCtxMenu(e, _ONHOLD[i], 'onhold'));
      });
    }

    /* Rebuild grid on navigation */
    function _rebuild() {
      const days  = _weekDays(_startDate);
      const inner = el.querySelector('.db-grid-inner');
      inner.style.gridTemplateColumns = _buildColTemplate(days, _techs, _colW);
      inner.innerHTML = _gridInnerHTML(days, _techs);
      el.querySelector('.db-week-btn').textContent = _weekLabel(days);
      _applyAllRowHeights();
      _updateNowLine();
      _renderCards();
    }

    /* ── Initial render ── */
    _renderCards();
    _renderUnscheduled();
    _renderOnHold();

    /* Sync time col scroll with grid scroll (vertical only) */
    scroll.addEventListener('scroll', () => { timeCol.scrollTop = scroll.scrollTop; });
    timeCol.addEventListener('wheel', e => {
      e.preventDefault();
      scroll.scrollTop += e.deltaY;
    }, { passive: false });

    requestAnimationFrame(() => {
      const now = new Date();
      scroll.scrollTop = Math.max(0, (now.getHours() - 2) * _rowH + (now.getMinutes() / 60) * _rowH);
      _scrollTodayLeft();
      _snapColWidth();
    });

    /* ── Live now line ── */
    _updateNowLine();
    const _nowTimer = setInterval(() => {
      if (!document.getElementById('widget-' + widgetId)) { clearInterval(_nowTimer); return; }
      _updateNowLine();
    }, 60000);

    /* ── Navigation ── */
    el.querySelector('[data-action="db-prev"]').addEventListener('click', () => {
      _startDate.setDate(_startDate.getDate() - 1);
      _rebuild();
    });

    el.querySelector('[data-action="db-next"]').addEventListener('click', () => {
      _startDate.setDate(_startDate.getDate() + 1);
      _rebuild();
    });

    el.querySelector('[data-action="db-today"]').addEventListener('click', () => {
      _startDate = new Date(); _startDate.setHours(0, 0, 0, 0);
      _rebuild();
      requestAnimationFrame(() => {
        const now = new Date();
        scroll.scrollTop  = Math.max(0, (now.getHours() - 2) * _rowH + (now.getMinutes() / 60) * _rowH);
        scroll.scrollLeft = 0;
      });
    });

    el.querySelector('[data-action="db-week-pick"]').addEventListener('click', () => Dialog.stub('Calendar Picker'));
    el.querySelector('[data-action="db-new-wo"]').addEventListener('click', () => WorkOrders.openWorkOrderIntake());
    el.querySelector('[data-action="db-techs"]').addEventListener('click', () => Dialog.stub('Tech Select'));

    /* ── Day column resize ── */
    gridInner.addEventListener('mousedown', e => {
      const handle = e.target.closest('.db-day-resize');
      if (!handle) return;
      e.preventDefault();
      const startX = e.clientX;
      const startW = _colW;
      document.body.classList.add('is-dragging');
      function onMove(me) {
        const rawColW   = Math.max(60, startW + (me.clientX - startX) / _techs.length);
        const available = scroll.clientWidth;
        let bestN = 1, bestDiff = Infinity;
        for (let n = 1; n <= 7; n++) {
          const sw = available / (n * _techs.length);
          if (sw < 60) continue;
          const diff = Math.abs(rawColW - sw);
          if (diff < bestDiff) { bestDiff = diff; bestN = n; }
        }
        _colW = available / (bestN * _techs.length);
        el.querySelector('.db-grid-inner').style.gridTemplateColumns = _colTemplate();
        _renderCards();
      }
      function onUp() {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        _snapColWidth();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    /* ── Hour row resize (handle lives in timeCol, not gridInner) ── */
    timeCol.addEventListener('mousedown', e => {
      const handle = e.target.closest('.db-row-resize');
      if (!handle) return;
      e.preventDefault();
      const startY = e.clientY;
      const startH = _rowH;
      document.body.classList.add('is-dragging');
      function onMove(me) {
        _rowH = Math.max(28, startH + (me.clientY - startY));
        _applyAllRowHeights();
        _renderTimeCol();
        _updateNowLine();
        _renderCards();
      }
      function onUp() {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    /* ── Time label click → expand/collapse hour to 15-min sub-slots ── */
    timeCol.addEventListener('click', e => {
      const label = e.target.closest('.db-time-label');
      if (!label) return;
      const hour = parseInt(label.closest('.db-time-cell').dataset.hour);
      if (_expandedHours.has(hour)) _expandedHours.delete(hour);
      else                          _expandedHours.add(hour);
      _applyAllRowHeights();
      _renderTimeCol();
      _updateNowLine();
      _renderCards();
    });

    /* ── Lane resize ── */
    function _bindLaneResize(laneEl, side) {
      const EDGE = 8;
      laneEl.addEventListener('mousemove', e => {
        if (document.body.classList.contains('is-dragging')) return;
        const r    = laneEl.getBoundingClientRect();
        const near = side === 'left' ? e.clientX >= r.right - EDGE : e.clientX <= r.left + EDGE;
        laneEl.style.cursor = near ? 'ew-resize' : '';
      });
      laneEl.addEventListener('mouseleave', () => { laneEl.style.cursor = ''; });
      laneEl.addEventListener('mousedown', e => {
        const r    = laneEl.getBoundingClientRect();
        const near = side === 'left' ? e.clientX >= r.right - EDGE : e.clientX <= r.left + EDGE;
        if (!near) return;
        e.preventDefault();
        const startX = e.clientX;
        const startW = laneEl.offsetWidth;
        document.body.classList.add('is-dragging');
        function onMove(me) {
          const delta = side === 'left' ? me.clientX - startX : startX - me.clientX;
          const newW  = Math.max(90, Math.min(300, startW + delta));
          laneEl.style.width    = newW + 'px';
          laneEl.style.minWidth = newW + 'px';
        }
        function onUp() {
          document.body.classList.remove('is-dragging');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          _snapColWidth();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    _bindLaneResize(el.querySelector('.db-unscheduled'), 'left');
    _bindLaneResize(el.querySelector('.db-onhold'), 'right');

    const _resizeObs = new ResizeObserver(() => {
      if (!document.getElementById('widget-' + widgetId)) { _resizeObs.disconnect(); return; }
      _snapColWidth();
    });
    _resizeObs.observe(el.querySelector('.db-grid-area'));

    /* ── Cell click → new WO ── */
    gridInner.addEventListener('click', e => {
      if (_dragJustEnded) return;
      _hideCtxMenu();
      if (e.target.closest('.db-card')) return;
      if (e.target.closest('.db-cell')) Toast.show('+Work Order — coming in next build');
    });

    /* ── Dismiss context menu on outside click or Escape ── */
    document.addEventListener('mousedown', e => {
      if (_ctxMenu && !_ctxMenu.contains(e.target)) _hideCtxMenu();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') _hideCtxMenu();
    });

    /* ── Card hover tooltip ── */
    let _cardTip = null, _cardTipTimer = null;
    function _showCardTip(cardEl) {
      clearTimeout(_cardTipTimer);
      _cardTipTimer = setTimeout(() => {
        _hideCardTip();
        _cardTip = document.createElement('div');
        _cardTip.className = 'db-card-tip';
        _cardTip.innerHTML = `<div class="db-tip-name">${cardEl.dataset.tipName}</div>
          <div class="db-tip-phone">${cardEl.dataset.tipPhone}</div>`;
        document.body.appendChild(_cardTip);
        const r = cardEl.getBoundingClientRect();
        _cardTip.style.left = r.left + 'px';
        _cardTip.style.top  = r.top  + 'px';
      }, 400);
    }
    function _hideCardTip() {
      clearTimeout(_cardTipTimer);
      if (_cardTip) { _cardTip.remove(); _cardTip = null; }
    }
    el.addEventListener('mouseover', e => {
      const toCard   = e.target.closest('.db-card');
      const fromCard = e.relatedTarget?.closest?.('.db-card');
      if (!toCard || toCard === fromCard || !toCard.dataset.tipName) return;
      _showCardTip(toCard);
    });
    el.addEventListener('mouseout', e => {
      const fromCard = e.target.closest('.db-card');
      const toCard   = e.relatedTarget?.closest?.('.db-card');
      if (!fromCard || fromCard === toCard) return;
      _hideCardTip();
    });
  }

  return { openDispatch };

})();
