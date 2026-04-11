// renderer.js — HTML-based timing sheet and commentary pane
//
// Replaces the canvas renderer with responsive DOM updates.
// Reads directly from state.js on each render() call.
//
// Usage:
//   const r = new Renderer();
//   r.render();   // call after each tick
//   r.reset();    // call on race reset

import { cars, race, raceLog } from './state.js';
import { CIRCUIT } from './data.js';

export class Renderer {

  constructor() {
    this._tbody          = document.getElementById('timing-body');
    this._statusEl       = document.getElementById('timing-status');
    this._commentaryFeed = document.getElementById('commentary-feed');
    this._seedDisplay    = document.getElementById('seed-display');
    this._stripCanvas    = document.getElementById('spacing-strip');
    this._stripScroll    = document.getElementById('strip-scroll');
    this._zoomLabel      = document.getElementById('strip-zoom-label');

    // Commentary focus filter — 'all', 'top10', 'top5'
    this._commentaryFilter = 'all';
    const filterLevels = ['all', 'top10', 'top5'];
    const filterLabels = { all: 'ALL', top10: 'TOP 10', top5: 'TOP 5' };
    const filterBtn = document.getElementById('commentary-filter-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        const idx = filterLevels.indexOf(this._commentaryFilter);
        this._commentaryFilter = filterLevels[(idx + 1) % filterLevels.length];
        filterBtn.textContent = filterLabels[this._commentaryFilter];
        this._rebuildCommentary();
      });
    }

    // Zoom levels — seconds of race gap visible in one strip-height
    this._zoomLevels = [120, 60, 30, 15, 5];
    this._zoomIdx    = 0;   // start fully zoomed out (120s)

    const zoomIn  = document.getElementById('strip-zoom-in');
    const zoomOut = document.getElementById('strip-zoom-out');
    // + zooms in (fewer seconds visible = higher index), − zooms out (more seconds)
    if (zoomIn)  zoomIn .addEventListener('click', () => this._changeZoom(+1));
    if (zoomOut) zoomOut.addEventListener('click', () => this._changeZoom(-1));

    // Previous positions — drives gained/lost row colouring each render
    this.prevPositions = new Map();

    // Commentary: only process raceLog entries newer than this tick number
    this._lastCommentaryTick = -1;

    // Set to false at Very Fast / Instant speed — game loop controls this
    this.animationsEnabled = true;

    // Gap column mode: 'gap' = gap to leader, 'interval' = gap to car ahead
    this._gapMode = 'gap';
    this._gapHeader = document.getElementById('gap-toggle-header');
    if (this._gapHeader) {
      this._gapHeader.style.cursor = 'pointer';
      this._gapHeader.title = 'Click to toggle gap / interval';
      this._gapHeader.addEventListener('click', () => {
        this._gapMode = this._gapMode === 'gap' ? 'interval' : 'gap';
        this._gapHeader.textContent = this._gapMode === 'gap' ? 'GAP ▾' : 'INT ▾';
        this._updateTimingTable();
      });
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  render() {
    this._updateHeader();
    this._updateTimingTable();
    this._updateSpacingStrip();
    this._updateCommentary();
    this._updateFooter();

    // Snapshot positions for next render's gain/loss detection
    for (const car of cars) {
      this.prevPositions.set(car.driver.name, car.position);
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  reset() {
    this.prevPositions.clear();
    this._lastCommentaryTick = -1;
    this._commentaryFilter = 'all';
    const filterBtn = document.getElementById('commentary-filter-btn');
    if (filterBtn) filterBtn.textContent = 'ALL';
    this._zoomIdx = 0;
    if (this._zoomLabel) this._zoomLabel.textContent = `${this._zoomLevels[0]}s`;
    if (this._stripCanvas) {
      this._stripCanvas.getContext('2d')
        .clearRect(0, 0, this._stripCanvas.width, this._stripCanvas.height);
    }
    this.render();
    // Clear after render — render() would re-populate from the old raceLog otherwise.
    // Also reset the tick cursor AFTER render() has consumed old entries, so the
    // new race's ticks (starting from 1) are not silently skipped.
    if (this._commentaryFeed) this._commentaryFeed.innerHTML = '';
    this._lastCommentaryTick = -1;
  }

  // ── _updateHeader ──────────────────────────────────────────────────────────
  _updateHeader() {
    if (!this._statusEl) return;
    const lap     = race.lap    || 0;
    const sector  = race.sector || 0;
    const running = cars.filter(c => c.status !== 'retired').length;

    let status;
    if (cars.length === 0 || lap === 0) {
      status = 'PRE-RACE';
    } else if (lap >= CIRCUIT.totalLaps && sector >= 3) {
      status = `FINISHED — ${running} CLASSIFIED`;
    } else {
      status = `LAP ${String(lap).padStart(2)} / ${CIRCUIT.totalLaps}   S${sector}   ${running} RUNNING`;
    }
    this._statusEl.textContent = status;
  }

  // ── _updateTimingTable ─────────────────────────────────────────────────────
  _updateTimingTable() {
    if (!this._tbody) return;

    // ── FLIP step 1: snapshot current row positions ────────────────────────
    // Also clear any in-progress transform so we read resting positions, not
    // mid-animation positions from a previous tick.
    const snapshots = new Map();
    if (this.animationsEnabled) {
      for (const row of this._tbody.rows) {
        row.style.transition = 'none';
        row.style.transform  = '';
      }
      // Force layout flush so cleared transforms are applied before reading
      if (this._tbody.rows.length) this._tbody.rows[0].getBoundingClientRect();

      for (const row of this._tbody.rows) {
        if (row.dataset.driver) {
          snapshots.set(row.dataset.driver, row.getBoundingClientRect().top);
        }
      }
    }

    this._tbody.innerHTML = '';

    let firstRetired = true;

    for (const car of cars) {
      const tr      = document.createElement('tr');
      tr.dataset.driver = car.driver.name;   // needed for FLIP lookup

      const prev    = this.prevPositions.get(car.driver.name);
      const retired = car.status === 'retired';
      const pitted  = car.status === 'pitted';

      // Visual separator before the first retired car
      if (retired && firstRetired) {
        tr.classList.add('first-retired');
        firstRetired = false;
      }

      // Row class — controls text colour and background tint
      if      (retired)                                        tr.classList.add('retired');
      else if (pitted)                                         tr.classList.add('pitted');
      else if (car.position === 1)                             tr.classList.add('leader');
      else if (prev !== undefined && car.position < prev)      tr.classList.add('gained');
      else if (prev !== undefined && car.position > prev)      tr.classList.add('lost');

      // POS
      tr.appendChild(cell(retired ? 'RET' : `P${car.position}`, 'col-pos'));

      // # — driver number
      tr.appendChild(cell(String(car.driver.number ?? ''), 'col-num'));

      // DRIVER
      tr.appendChild(cell(car.driver.name.toUpperCase(), 'col-driver'));

      // TEAM — hidden on mobile
      tr.appendChild(cell(car.team.name.toUpperCase(), 'col-team hide-mobile'));

      // LAST LAP — hidden on mobile
      tr.appendChild(cell(
        car.lastLapTime != null ? formatLapTime(car.lastLapTime) : '---',
        'col-lastlap hide-mobile',
      ));

      // GAP / INTERVAL
      let gapStr;
      if (retired) {
        gapStr = '';
      } else if (car.position === 1) {
        gapStr = this._gapMode === 'gap' ? 'LEADER' : 'INTERVAL';
      } else if (this._gapMode === 'gap') {
        gapStr = formatGap(car.gap);
      } else {
        // Interval: gap to the car immediately ahead in the sorted array
        const idx  = cars.indexOf(car);
        const prev2 = idx > 0 ? cars[idx - 1] : null;
        const interval = prev2 && prev2.gap != null && car.gap != null
          ? car.gap - prev2.gap
          : null;
        gapStr = formatGap(interval);
      }
      tr.appendChild(cell(gapStr, 'col-gap'));

      // TYRE — compound initial + laps on current set
      tr.appendChild(cell(
        `${car.compound[0].toUpperCase()} (${car.stintLap})`,
        'col-tyre',
      ));

      // WEAR — colour-coded; hidden on mobile
      const wearPct = Math.round(car.tyreWear * 100);
      const wearTd  = cell(`${wearPct}%`, 'col-wear hide-mobile');
      if (!retired) {
        if      (wearPct >= 71) wearTd.classList.add('warn-red');
        else if (wearPct >= 41) wearTd.classList.add('warn-yellow');
      }
      tr.appendChild(wearTd);

      // FUEL — colour-coded; hidden on mobile
      const fuelKg = Math.round(car.fuel);
      const fuelTd = cell(`${fuelKg}kg`, 'col-fuel hide-mobile');
      if (!retired) {
        if      (fuelKg < 15) fuelTd.classList.add('warn-red');
        else if (fuelKg < 30) fuelTd.classList.add('warn-yellow');
      }
      tr.appendChild(fuelTd);

      // STOPS — hidden on mobile
      tr.appendChild(cell(String(car.stopsMade), 'col-stops hide-mobile'));

      // HEALTH — damage label or retirement cause
      let healthStr = '';
      if (retired) {
        const cause = car.retiredReason === 'crash'
          ? 'CRASH'
          : (car.degradedLabel || 'MECH').toUpperCase();
        healthStr = car.retiredLap != null ? `${cause} L${car.retiredLap}` : cause;
      } else if (car.degradedLabel) {
        healthStr = car.degradedLabel.toUpperCase();
      }
      const healthTd = cell(healthStr, 'col-health');
      if (retired)              healthTd.classList.add('health-out');
      else if (car.degradedLabel) healthTd.classList.add('health-dmg');
      tr.appendChild(healthTd);

      this._tbody.appendChild(tr);
    }

    // ── FLIP steps 2–4: invert → flush → play ─────────────────────────────
    if (this.animationsEnabled && snapshots.size > 0) {
      // Step 2 — force layout so new row positions are computed
      this._tbody.getBoundingClientRect();

      // Step 3 — invert: snap each moved row back to its old visual position
      const movedRows = [];
      for (const row of this._tbody.rows) {
        const name   = row.dataset.driver;
        const oldTop = snapshots.get(name);
        if (oldTop === undefined) continue;
        const newTop = row.getBoundingClientRect().top;
        const delta  = oldTop - newTop;
        if (Math.abs(delta) < 1) continue;   // didn't move — skip

        row.style.transition = 'none';
        row.style.transform  = `translateY(${delta}px)`;

        // Flash: green for rows moving up (gained), red for rows dropping
        if (delta > 0) row.classList.add('anim-pass');
        else           row.classList.add('anim-drop');

        movedRows.push(row);
      }

      if (movedRows.length) {
        // Step 4 — force flush to register the inverted positions, then play
        this._tbody.getBoundingClientRect();
        for (const row of movedRows) {
          row.style.transition = 'transform 350ms ease-out';
          row.style.transform  = '';
        }
        // Clean up flash classes after the animation completes
        setTimeout(() => {
          for (const row of movedRows) {
            row.classList.remove('anim-pass', 'anim-drop');
          }
        }, 650);
      }
    }
  }

  // ── _updateCommentary ──────────────────────────────────────────────────────
  _updateCommentary() {
    if (!this._commentaryFeed) return;

    // Only process entries we haven't shown yet
    const newEntries = raceLog.entries.filter(
      e => e.tick > this._lastCommentaryTick && e.events && e.events.length > 0,
    );
    if (newEntries.length === 0) return;

    // Iterate forward (chronological) and prepend each entry — newest ends at top
    for (const entry of newEntries) {
      if (!this._passesFilter(entry)) continue;
      for (const ev of entry.events) {
        const el = this._formatEvent(entry, ev);
        if (el) this._commentaryFeed.insertBefore(el, this._commentaryFeed.firstChild);
      }
    }

    // Cap at 150 entries so the DOM doesn't grow indefinitely
    while (this._commentaryFeed.children.length > 150) {
      this._commentaryFeed.removeChild(this._commentaryFeed.lastChild);
    }

    this._lastCommentaryTick = newEntries[newEntries.length - 1].tick;
  }

  // ── _rebuildCommentary ─────────────────────────────────────────────────────
  // Rebuilds the feed from scratch using the current filter. Called when the
  // user changes the filter level mid-race.
  _rebuildCommentary() {
    if (!this._commentaryFeed) return;
    this._commentaryFeed.innerHTML = '';

    const allEntries = raceLog.entries.filter(
      e => e.tick > 0 && e.events && e.events.length > 0,
    );

    // Iterate chronologically, prepend each — newest ends at top
    for (const entry of allEntries) {
      if (!this._passesFilter(entry)) continue;
      for (const ev of entry.events) {
        const el = this._formatEvent(entry, ev);
        if (el) this._commentaryFeed.insertBefore(el, this._commentaryFeed.firstChild);
      }
    }

    while (this._commentaryFeed.children.length > 150) {
      this._commentaryFeed.removeChild(this._commentaryFeed.lastChild);
    }
  }

  // ── _passesFilter ──────────────────────────────────────────────────────────
  // Returns true if the entry's car is within the current filter threshold.
  _passesFilter(entry) {
    if (this._commentaryFilter === 'all') return true;
    const limit = this._commentaryFilter === 'top5' ? 5 : 10;
    const car = cars.find(c => c.driver.name === entry.car);
    return car != null && car.position <= limit;
  }

  // ── _formatEvent ───────────────────────────────────────────────────────────
  _formatEvent(entry, ev) {
    // Skip setup rolls and failed overtake attempts (too noisy)
    if (ev.type === 'setup_roll') return null;
    if (ev.type === 'overtake' && ev.result === 'failed') return null;

    const lapStr = entry.sector > 0
      ? `L${entry.lap} S${entry.sector}`
      : `L${entry.lap}`;

    let tag, tagClass, detail;

    if (ev.type === 'pit') {
      tag      = 'PIT';
      tagClass = 'tag-pit';
      detail   = `${entry.car.toUpperCase()} — ${ev.compound[0].toUpperCase()} tyres +${ev.fuelAdded}kg (${ev.duration}s)`;

    } else if (ev.type === 'mechanical' && ev.severity === 'retirement') {
      tag      = 'OUT';
      tagClass = 'tag-out';
      detail   = `${entry.car.toUpperCase()} — ${ev.label.toUpperCase()}`;

    } else if (ev.type === 'driver_error' && ev.severity === 'crash') {
      tag      = 'CRASH';
      tagClass = 'tag-crash';
      detail   = `${entry.car.toUpperCase()} — OUT`;

    } else if (ev.type === 'mechanical' && ev.severity === 'degraded') {
      tag      = 'DMG';
      tagClass = 'tag-dmg';
      detail   = `${entry.car.toUpperCase()} — ${ev.label.toUpperCase()}`;

    } else if (ev.type === 'driver_error' && ev.severity === 'slow_sector') {
      tag      = 'SPIN';
      tagClass = 'tag-spin';
      detail   = `${entry.car.toUpperCase()} — spin / lock-up`;

    } else if (ev.type === 'overtake' && ev.result === 'success') {
      tag      = 'PASS';
      tagClass = 'tag-pass';
      const posStr = ev.position != null ? ` for ${ordinal(ev.position)}` : '';
      const verb   = wheelToWheelVerb(entry.sector);
      detail   = `${entry.car.toUpperCase()} ${verb} ${ev.passed.toUpperCase()}${posStr}`;

    } else if (ev.type === 'silent_pass') {
      tag      = 'PASS';
      tagClass = 'tag-pass';
      const posStr = ev.position != null ? ` for ${ordinal(ev.position)}` : '';
      const verb   = silentPassVerb();
      detail   = `${entry.car.toUpperCase()} ${verb} ${ev.passed.toUpperCase()}${posStr}`;

    } else {
      return null;
    }

    const div = document.createElement('div');
    div.className = 'c-entry';
    div.innerHTML =
      `<span class="c-lap">${lapStr}</span> ` +
      `<span class="c-tag ${tagClass}">[${tag}]</span> ` +
      `<span class="c-detail">${detail}</span>`;
    return div;
  }

  // ── _changeZoom ────────────────────────────────────────────────────────────
  _changeZoom(dir) {
    this._zoomIdx = Math.max(0, Math.min(this._zoomLevels.length - 1, this._zoomIdx + dir));
    if (this._zoomLabel) {
      this._zoomLabel.textContent = `${this._zoomLevels[this._zoomIdx]}s`;
    }
    this._updateSpacingStrip();
  }

  // ── _updateSpacingStrip ────────────────────────────────────────────────────
  // Draws one dot + label per active car at a y-position proportional to their
  // real gap from the leader. Min spacing prevents overlap; zoom in to separate
  // battles. Canvas is always taller than the scroll container so a scrollbar
  // appears and the full field is reachable.
  _updateSpacingStrip() {
    const canvas = this._stripCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width;   // 64px

    // GAP_CAP covers the full realistic field spread (~7 laps = 630s in a
    // 90s/lap race). MAX_CANVAS caps height so the browser stays happy.
    const GAP_CAP      = 630;
    const MAX_CANVAS   = 5000;
    const visibleSecs  = this._zoomLevels[this._zoomIdx];
    const BASE_H       = 560;   // matches scroll container max-height
    const PPS          = BASE_H / visibleSecs;          // pixels per second
    // Canvas is always at least BASE_H + 1 so a scrollbar always appears
    const H            = Math.min(MAX_CANVAS, Math.max(BASE_H + 1, Math.round(GAP_CAP * PPS)));

    if (canvas.height !== H) canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    // Subtle left-edge guide line
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 1, H);

    const active = cars.filter(c => c.status !== 'retired' && c.gap != null);
    if (active.length === 0) return;

    ctx.font = '10px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    // Small top padding so the leader dot isn't clipped at the canvas edge
    const TOP_PAD = 8;

    // Minimum pixel gap between successive labels — prevents overlap.
    // At low zoom the user zooms in until dots separate naturally.
    const MIN_STEP = 13;
    let lastY = -Infinity;

    for (const car of active) {
      const rawY = Math.min(TOP_PAD + car.gap * PPS, H - 8);
      const y    = Math.max(rawY, lastY + MIN_STEP);
      lastY = y;

      const isLeader = car.position === 1;
      const isPitted = car.status === 'pitted';

      // Dot colour
      ctx.fillStyle = isLeader ? '#ffff00' : isPitted ? '#555' : '#00ffff';
      ctx.fillRect(4, y - 3, 5, 5);

      // Label: "12 SEN"
      const abbr = car.driver.name.replace(/\s+/g, '').toUpperCase().slice(0, 3);
      ctx.fillStyle = isLeader ? '#ffff00' : isPitted ? '#666' : '#ccc';
      ctx.fillText(`${car.driver.number} ${abbr}`, 13, y);
    }
  }

  // ── _updateFooter ──────────────────────────────────────────────────────────
  _updateFooter() {
    if (this._seedDisplay && raceLog.seed != null) {
      this._seedDisplay.textContent = `SEED: ${raceLog.seed}`;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cell(text, className) {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) className.split(' ').forEach(c => c && td.classList.add(c));
  return td;
}

function formatLapTime(seconds) {
  const m  = Math.floor(seconds / 60);
  const s  = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Sector-varied verb for a wheel-to-wheel overtake.
// Derives the sector character from circuit power/aero weights rather than
// sector number — so it works correctly across different circuit layouts.
function wheelToWheelVerb(sector) {
  const def      = CIRCUIT.sectors[sector - 1];
  const isPower  = def && def.powerWeight > def.aeroWeight;   // straight-dominant
  const isCorner = def && def.aeroWeight  > def.powerWeight;  // corner-dominant
  const power    = ['blasts past', 'pulls alongside and passes', 'drives past'];
  const corner   = ['outbrakes', 'dives inside', 'squeezes past'];
  const mixed    = ['muscles past', 'forces the issue on', 'makes the move on'];
  const pool     = isPower ? power : isCorner ? corner : mixed;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Verb for a pace-based silent pass
function silentPassVerb() {
  const verbs = ['powers past', 'glides past', 'sails by', 'steals past', 'sweeps past'];
  return verbs[Math.floor(Math.random() * verbs.length)];
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatGap(gap) {
  if (gap == null || gap < 0) return '';
  if (gap < 60) return `+${gap.toFixed(3)}`;
  const m = Math.floor(gap / 60);
  const s = (gap % 60).toFixed(1).padStart(4, '0');
  return `+${m}:${s}`;
}
