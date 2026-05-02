// renderer.js — HTML-based timing sheet and commentary pane
//
// Replaces the canvas renderer with responsive DOM updates.
// Reads directly from state.js on each render() call.
//
// Usage:
//   const r = new Renderer();
//   r.render();   // call after each tick
//   r.reset();    // call on race reset

import { cars, race, raceLog, lapChartData } from './state.js';
import { CIRCUIT as DEFAULT_CIRCUIT } from './data.js';

// Active circuit — updated by setCurrentCircuit() before each race/qualifying.
let currentCircuit = DEFAULT_CIRCUIT;

/** Call before rendering a race or qualifying session on a specific circuit. */
export function setCurrentCircuit(circuit) {
  currentCircuit = circuit;
}

export class Renderer {

  constructor() {
    this._tbody          = document.getElementById('timing-body');
    this._statusEl       = document.getElementById('timing-status');
    this._commentaryFeed = document.getElementById('commentary-feed');
    this._seedDisplay    = document.getElementById('seed-display');
    this._stripCanvas    = document.getElementById('spacing-strip');
    this._stripScroll    = document.getElementById('strip-scroll');
    this._zoomLabel      = document.getElementById('strip-zoom-label');
    this._lapChartCanvas = document.getElementById('lap-chart-canvas');
    this._livePill       = document.getElementById('live-pill');
    this._metaLapSector  = document.getElementById('meta-lap-sector');
    this._fastestLap     = null;   // { time, driver } — tracks race fastest lap

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
    this._zoomLevels = [240, 120, 60, 30, 15, 5];
    this._zoomIdx    = 0;   // start fully zoomed out (240s)

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
    this._gapMode = 'interval';
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

    // Snapshot history for sector stepping (◀ / ▶ in pause mode)
    this._snapshots = [];
    this._viewIdx   = -1;   // -1 = live; >= 0 = replay index

    // Set true only during a forward step render so FLIP and row colouring fire
    this._animateForwardStep = false;
  }

  // ── Display source getters ─────────────────────────────────────────────────
  // All render methods read from these so replay mode is transparent.
  get _displayCars() { return this._viewIdx >= 0 ? this._snapshots[this._viewIdx].cars : cars; }
  get _displayRace() { return this._viewIdx >= 0 ? this._snapshots[this._viewIdx].race : race; }
  get inReplay()     { return this._viewIdx >= 0; }
  get canStepBack()  { return this._viewIdx >= 0 ? this._viewIdx > 0 : this._snapshots.length >= 2; }

  // Show/hide the Live pill — called from the game loop on start/pause/finish/reset.
  set isLive(v) {
    if (this._livePill) this._livePill.style.display = v ? 'flex' : 'none';
  }

  // ── Snapshot API ───────────────────────────────────────────────────────────
  // Called by the game loop after each tick() to save state for stepping.
  pushSnapshot() {
    this._snapshots.push({
      race: { lap: race.lap, sector: race.sector, tick: race.tick },
      cars: cars.map(c => ({
        // static refs — driver/team/tyres/engine never change during a race
        driver:          c.driver,
        team:            c.team,
        tyres:           c.tyres,
        engine:          c.engine,
        // set once at race start, never changes
        gridPosition:    c.gridPosition,
        // mutable simulation state — copy by value
        position:        c.position,
        gap:             c.gap,
        cumulativeTime:  c.cumulativeTime,
        status:          c.status,
        lastLapTime:     c.lastLapTime,
        compound:        c.compound,
        tyreHistory:     c.tyreHistory ? [...c.tyreHistory] : [],
        stintLap:        c.stintLap,
        tyreWear:        c.tyreWear,
        fuel:            c.fuel,
        stopsMade:       c.stopsMade,
        degradedLabel:   c.degradedLabel,
        retiredReason:   c.retiredReason,
        retiredLap:      c.retiredLap,
      })),
    });
  }

  // Step one sector back. Returns false if already at the beginning.
  stepBack() {
    const target = this._viewIdx >= 0 ? this._viewIdx - 1 : this._snapshots.length - 2;
    if (target < 0) return false;
    this._viewIdx = target;
    this.render();
    return true;
  }

  // Step one sector forward. Exits replay when reaching the latest snapshot.
  stepForward() {
    if (this._viewIdx < 0) return false;
    if (this._viewIdx >= this._snapshots.length - 1) {
      this.exitReplay();
      return true;
    }

    // Load the current snapshot's positions into prevPositions so the FLIP
    // animation has a valid "before" to compare against.
    for (const car of this._snapshots[this._viewIdx].cars) {
      this.prevPositions.set(car.driver.name, car.position);
    }

    this._viewIdx++;
    this._animateForwardStep = true;
    this.render();
    this._animateForwardStep = false;
    return true;
  }

  // Return to live view.
  exitReplay() {
    this._viewIdx = -1;
    this.prevPositions.clear();   // avoid spurious flash on first live render
    this.render();
  }

  // Wipe all snapshots — called on race reset.
  clearSnapshots() {
    this._snapshots = [];
    this._viewIdx   = -1;
  }

  // ── render ────────────────────────────────────────────────────────────────
  render() {
    this._checkFastestLap(this._displayCars);  // must run before _updateTimingTable
    this._updateHeader();
    this._updateTimingTable();
    this._updateSpacingStrip();

    // Commentary: in replay show all entries up to this snapshot's tick;
    // in live mode run the normal incremental update.
    if (this.inReplay) {
      this._rebuildCommentaryUpTo(this._snapshots[this._viewIdx].race.tick);
    } else {
      this._updateCommentary();
    }

    this._updateFooter();
    this._drawLapChart();

    // Update prevPositions in live mode, and also after a forward step so the
    // next step has correct "before" positions to compare against.
    // Skip in replay mode (stepBack / no-anim renders) to avoid stale state.
    if (!this.inReplay || this._animateForwardStep) {
      for (const car of this._displayCars) {
        this.prevPositions.set(car.driver.name, car.position);
      }
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  reset() {
    this.clearSnapshots();
    this.prevPositions.clear();
    this._lastCommentaryTick = -1;
    this._fastestLap = null;
    const flDisplay = document.getElementById('fastest-lap-display');
    if (flDisplay) flDisplay.style.visibility = 'hidden';
    this._commentaryFilter = 'all';
    const filterBtn = document.getElementById('commentary-filter-btn');
    if (filterBtn) filterBtn.textContent = 'ALL';
    this._zoomIdx = 0;
    if (this._zoomLabel) this._zoomLabel.textContent = `${this._zoomLevels[0]} s`;
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
    const displayRace = this._displayRace;
    const displayCars = this._displayCars;
    const lap     = displayRace.lap    || 0;
    const sector  = displayRace.sector || 0;
    const running = displayCars.filter(c => c.status !== 'retired').length;

    // Topbar status — concise: running count, replay info, pre/finished state
    let status;
    // Info bar lap/sector — shown alongside "Race 1" in the sub-header
    let lapSector = '';

    if (this.inReplay) {
      const total = this._snapshots.length;
      const idx   = this._viewIdx + 1;
      status    = `◀ REPLAY (${idx}/${total}) ▶`;
      lapSector = lap > 0 ? `LAP ${lap} / ${currentCircuit.totalLaps}   S${sector}` : '';
    } else if (displayCars.length === 0 || lap === 0) {
      status    = 'PRE-RACE';
      lapSector = currentCircuit ? `${currentCircuit.totalLaps} LAPS` : '';
    } else if (lap >= currentCircuit.totalLaps && sector >= 3) {
      status    = `FINISHED · ${running} CLASSIFIED`;
      lapSector = `LAP ${currentCircuit.totalLaps} / ${currentCircuit.totalLaps}`;
    } else {
      status    = `${running} RUNNING`;
      lapSector = `LAP ${lap} / ${currentCircuit.totalLaps}   S${sector}`;
    }

    this._statusEl.textContent = status;

    if (this._metaLapSector) {
      this._metaLapSector.textContent  = lapSector;
      this._metaLapSector.style.visibility = lapSector ? 'visible' : 'hidden';
    }
  }

  // ── _updateTimingTable ─────────────────────────────────────────────────────
  _updateTimingTable() {
    if (!this._tbody) return;

    // ── FLIP step 1: snapshot current row positions ────────────────────────
    // Also clear any in-progress transform so we read resting positions, not
    // mid-animation positions from a previous tick.
    // Skip FLIP in replay mode, except on an explicit forward step where we want
    // to show the row-swap animation. Always animate forward steps regardless of
    // the speed setting (user is paused and stepping deliberately).
    const snapshots = new Map();
    if ((this.animationsEnabled || this._animateForwardStep) && (!this.inReplay || this._animateForwardStep)) {
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

    for (const car of this._displayCars) {
      const tr      = document.createElement('tr');
      tr.dataset.driver = car.driver.name;   // needed for FLIP lookup

      // Skip gain/loss colouring in replay mode, except on a forward step where
      // prevPositions has been loaded with the previous snapshot's positions.
      const prev    = (this.inReplay && !this._animateForwardStep)
        ? undefined
        : this.prevPositions.get(car.driver.name);
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

      // POS — with p1/p2 accent classes
      {
        const posTd = document.createElement('td');
        posTd.className = 'col-pos pos-cell';
        if (retired) {
          posTd.textContent = 'RET';
          posTd.classList.add('ret');
        } else {
          posTd.textContent = `P${car.position}`;
          if (car.position === 1)      posTd.classList.add('p1');
          else if (car.position === 2) posTd.classList.add('p2');
        }
        tr.appendChild(posTd);
      }

      // # — driver number
      tr.appendChild(cell(String(car.driver.number ?? ''), 'col-num'));

      // DRIVER — team colour dot + stacked name / team-tag
      {
        const driverTd = document.createElement('td');
        driverTd.className = 'col-driver';

        const wrap = document.createElement('div');
        wrap.className = 'driver-cell';

        const dot = document.createElement('span');
        dot.className = 'team-dot';
        dot.style.background = car.team.colour || '#888';

        const info = document.createElement('div');
        info.className = 'driver-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 't-driver';
        nameDiv.textContent = car.driver.name.toUpperCase();

        const tagDiv = document.createElement('div');
        tagDiv.className = 't-team-tag';
        const tName = car.team.shortName.toUpperCase();
        const eName = car.team.engine.toUpperCase();
        tagDiv.textContent = car.team.isWorks ? tName : `${tName}-${eName}`;

        info.appendChild(nameDiv);
        info.appendChild(tagDiv);
        wrap.appendChild(dot);
        wrap.appendChild(info);
        driverTd.appendChild(wrap);
        tr.appendChild(driverTd);
      }

      // TEAM — "SHORTNAME-ENGINE" concat; works teams show shortName only; hidden on mobile
      const teamName   = car.team.shortName.toUpperCase();
      const engineName = car.team.engine.toUpperCase();
      const teamEngineLabel = car.team.isWorks ? teamName : `${teamName}-${engineName}`;
      tr.appendChild(cell(teamEngineLabel, 'col-team hide-mobile'));

      // TYRE MFR — single letter: G = Goodyear, P = Pirelli; hidden on mobile
      tr.appendChild(cell(car.tyres.name[0].toUpperCase(), 'col-tyre-mfr hide-mobile'));

      // LAST LAP — hidden on mobile; purple if this driver holds the fastest lap
      {
        const lapTd = document.createElement('td');
        lapTd.className = 'col-lastlap hide-mobile';
        lapTd.textContent = car.lastLapTime != null ? formatLapTime(car.lastLapTime) : '—';
        if (this._fastestLap && car.lastLapTime != null
            && car.lastLapTime === this._fastestLap.time
            && car.driver.name === this._fastestLap.driver) {
          lapTd.classList.add('lap-fast');
        }
        tr.appendChild(lapTd);
      }

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
        const idx  = this._displayCars.indexOf(car);
        const prev2 = idx > 0 ? this._displayCars[idx - 1] : null;
        const interval = prev2 && prev2.gap != null && car.gap != null
          ? car.gap - prev2.gap
          : null;
        gapStr = formatGap(interval);
      }
      tr.appendChild(cell(gapStr, 'col-gap'));

      // COMP — pip dots for compound history + lap count on current stint
      // Previous stints shown as small dimmed pips; current as full-brightness pip
      {
        const tyreTd = document.createElement('td');
        tyreTd.className = 'col-tyre';

        const wrap = document.createElement('div');
        wrap.className = 'tyre-cell';

        const history = car.tyreHistory ?? [];

        // Previous compounds: hollow ring in compound colour
        for (const c of history.slice(0, -1)) {
          const pip = document.createElement('span');
          pip.className = `pip pip-${c.toLowerCase()} pip-past`;
          wrap.appendChild(pip);
        }

        // Current compound: full-brightness pip
        const curPip = document.createElement('span');
        curPip.className = `pip pip-${car.compound[0].toLowerCase()}`;
        wrap.appendChild(curPip);

        // Stint lap count
        const lapCount = document.createElement('span');
        lapCount.className = 'tyre-laps';
        lapCount.textContent = String(car.stintLap);
        wrap.appendChild(lapCount);

        tyreTd.appendChild(wrap);
        tr.appendChild(tyreTd);
      }

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

  // ── _rebuildCommentaryUpTo ─────────────────────────────────────────────────
  // Replay-mode version: shows only entries up to (and including) the given tick.
  _rebuildCommentaryUpTo(tick) {
    if (!this._commentaryFeed) return;
    this._commentaryFeed.innerHTML = '';
    const entries = raceLog.entries.filter(
      e => e.tick > 0 && e.tick <= tick && e.events && e.events.length > 0,
    );
    for (const entry of entries) {
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
    const car = this._displayCars.find(c => c.driver.name === entry.car);
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
      const estLaps = ev.aiEstimates?.[ev.compound]?.estLaps;
      const estStr  = estLaps != null ? ` · est ${estLaps}L` : '';
      detail   = `${entry.car.toUpperCase()} — ${ev.compound[0].toUpperCase()} tyres +${ev.fuelAdded}kg (${ev.duration}s)${estStr}`;

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
      this._zoomLabel.textContent = `${this._zoomLevels[this._zoomIdx]} s`;
    }
    this._updateSpacingStrip();
  }

  // ── _checkFastestLap ───────────────────────────────────────────────────────
  // Scans the current display state and updates the all-race fastest lap record.
  // Only ever lowers the time (never increases it), so stepping back in replay
  // won't remove a previously seen fastest lap. Updates the race info bar.
  _checkFastestLap(displayCars) {
    for (const car of displayCars) {
      if (car.lastLapTime != null) {
        if (!this._fastestLap || car.lastLapTime < this._fastestLap.time) {
          this._fastestLap = { time: car.lastLapTime, driver: car.driver.name };
        }
      }
    }

    if (!this._fastestLap) return;

    const flTimeEl   = document.getElementById('fastest-lap-time');
    const flDriverEl = document.getElementById('fastest-lap-driver');
    const flDisplay  = document.getElementById('fastest-lap-display');
    if (flTimeEl)   flTimeEl.textContent   = formatLapTime(this._fastestLap.time);
    if (flDriverEl) flDriverEl.textContent = this._fastestLap.driver.toUpperCase();
    if (flDisplay)  flDisplay.style.visibility = 'visible';
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
    ctx.fillStyle = '#1e2f44';
    ctx.fillRect(0, 0, 1, H);

    const active = this._displayCars.filter(c => c.status !== 'retired' && c.gap != null);
    if (active.length === 0) return;

    ctx.font = '10px Square, "Courier New", monospace';
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

      // Dot colour — team colour; pitted cars dimmed to grey
      // Leader dot uses team colour too; only the label goes yellow
      const teamColour = car.team.colour || '#4a6a88';
      ctx.fillStyle = isPitted ? '#2a4055' : teamColour;
      ctx.fillRect(4, y - 3, 5, 5);

      // Label: "12 SEN"
      const abbr = car.driver.lastName.toUpperCase().slice(0, 3);
      ctx.fillStyle = isLeader ? '#ffffff' : isPitted ? '#2a4055' : '#4a6a88';
      ctx.fillText(`${car.driver.number} ${abbr}`, 13, y);
    }
  }

  // ── _updateFooter ──────────────────────────────────────────────────────────
  _updateFooter() {
    if (this._seedDisplay && raceLog.seed != null) {
      this._seedDisplay.textContent = `SEED: ${raceLog.seed}`;
    }
  }

  // ── _drawLapChart ─────────────────────────────────────────────────────────
  // Draws a position-over-laps chart on the lap-chart-canvas element.
  // One line per driver, coloured by team. Second driver per team uses a
  // dashed line. Pit stops shown as coloured dots on the line:
  //   soft = red (#ff4444), medium = yellow (#ffff00), hard = white (#eeeeee)
  _drawLapChart() {
    const canvas = this._lapChartCanvas;
    if (!canvas) return;

    const totalLaps = currentCircuit.totalLaps;
    // In replay mode, only show laps up to the snapshot's position.
    // lapChartData is populated at end of sector 3, so a mid-lap snapshot
    // (sector 1 or 2) only has data through the previous completed lap.
    const displayRace = this._displayRace;
    // lapChartData[0] is the grid (lap 0); lapChartData[i] = end of lap i.
    // Replay: sector 3 means lap i is fully recorded, so include up to lap+1 entries.
    // Mid-lap (sector 1/2): only show through the previous completed lap (lap entries).
    const lapLimit = this.inReplay
      ? (displayRace.sector === 3 ? displayRace.lap + 1 : displayRace.lap)
      : lapChartData.length;
    const lapsRecorded = Math.min(lapChartData.length, lapLimit);

    // Size canvas to its CSS display width
    const W = canvas.clientWidth || 900;
    const H = 480;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width  = W;
      canvas.height = H;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Layout constants
    const PAD_LEFT   = 56;   // room for start driver labels
    const PAD_RIGHT  = 64;   // room for driver name labels on the right
    const PAD_TOP    = 24;   // room for top x-axis lap labels
    const PAD_BOTTOM = 6;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;
    const numCars = 24;

    // Nothing to draw yet
    if (lapsRecorded === 0) {
      ctx.fillStyle = '#4a6a88';
      ctx.font = '13px Square, "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('RACE NOT STARTED', PAD_LEFT + 4, PAD_TOP + 20);
      return;
    }

    // Helper: lap index → x pixel
    const lapX = lap => PAD_LEFT + (lap / totalLaps) * chartW;
    // Helper: position → y pixel (position 1 at top)
    const posY = pos => PAD_TOP + ((pos - 1) / (numCars - 1)) * chartH;

    // ── Grid lines ────────────────────────────────────────────────────────
    ctx.strokeStyle = '#1e2f44';
    ctx.lineWidth   = 1;

    // Horizontal grid: one line per position (no labels — driver names serve as reference)
    for (let p = 1; p <= numCars; p++) {
      const y = posY(p);
      ctx.strokeStyle = '#1e2f44';
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(PAD_LEFT + chartW, y);
      ctx.stroke();
    }

    // Vertical grid: every 10 laps, labelled at the top
    ctx.font = '13px Square, "Courier New", monospace';
    ctx.textAlign = 'center';
    for (let l = 0; l <= totalLaps; l += 10) {
      const x = lapX(l);
      ctx.strokeStyle = l === 0 ? '#1e2f44' : '#14202e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, PAD_TOP);
      ctx.lineTo(x, PAD_TOP + chartH);
      ctx.stroke();
      // Tick mark protruding above the chart
      ctx.strokeStyle = '#2a4055';
      ctx.beginPath();
      ctx.moveTo(x, PAD_TOP - 5);
      ctx.lineTo(x, PAD_TOP);
      ctx.stroke();
      // Label above the tick
      ctx.fillStyle = '#4a6a88';
      ctx.fillText(l === 0 ? 'LAP' : String(l), x, PAD_TOP - 7);
    }

    // ── Determine driver order for right-side labels ──────────────────────
    // Use the last recorded lap's positions, fall back to cars[] order
    const lastEntry = lapChartData[lapsRecorded - 1];
    const displayCars = this._displayCars;

    // Build per-driver team lookup from live cars[]
    const driverTeam = new Map();
    for (const car of displayCars) {
      driverTeam.set(car.driver.name, car.team);
    }

    // Identify second driver per team (higher gridPosition = second driver)
    const teamDrivers = new Map(); // teamId → [car, car]
    for (const car of displayCars) {
      const list = teamDrivers.get(car.team.id) ?? [];
      list.push(car);
      teamDrivers.set(car.team.id, list);
    }
    const secondDrivers = new Set();
    for (const [, drivers] of teamDrivers) {
      if (drivers.length === 2) {
        // Higher gridPosition = listed second in the team
        const second = drivers[0].gridPosition > drivers[1].gridPosition
          ? drivers[0] : drivers[1];
        secondDrivers.add(second.driver.name);
      }
    }

    // ── Draw one line per driver ──────────────────────────────────────────
    const PIT_COLOURS = { soft: '#ff4444', medium: '#ffff00', hard: '#eeeeee' };

    for (const car of displayCars) {
      const name   = car.driver.name;
      const colour = car.team.colour || '#00ffff';
      const isDash = secondDrivers.has(name);
      const label  = `${car.driver.number} ${car.driver.lastName.toUpperCase().slice(0, 3)}`;

      ctx.strokeStyle = colour;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash(isDash ? [4, 3] : []);

      let started  = false;
      let firstX = 0, firstY = 0;
      let lastX  = 0, lastY  = 0;
      let startCompound = null;

      // Collect pit dots to draw after the line (so they sit on top)
      const pitDots = [];

      for (let i = 0; i < lapsRecorded; i++) {
        const entry = lapChartData[i];
        const d     = entry[name];
        if (!d || d.position === null) continue;

        const x = lapX(i);   // lapChartData[0]=grid(lap 0), lapChartData[i]=lap i
        const y = posY(d.position);

        if (!started) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          started = true;
          firstX  = x;
          firstY  = y;
          // Starting compound: first letter of tyreHistory maps to compound name
          const hist = car.tyreHistory ?? [];
          const firstLetter = hist[0] ?? 'M';
          startCompound = firstLetter === 'S' ? 'soft'
                        : firstLetter === 'H' ? 'hard'
                        : 'medium';
        } else {
          ctx.lineTo(x, y);
        }

        if (d.pitCompound) {
          pitDots.push({ x, y, compound: d.pitCompound });
        }

        lastX = x;
        lastY = y;
      }

      if (started) ctx.stroke();

      // Start dot — compound colour of starting tyre
      ctx.setLineDash([]);
      if (started && startCompound) {
        ctx.fillStyle = PIT_COLOURS[startCompound];
        ctx.beginPath();
        ctx.arc(firstX, firstY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pit dots on the line
      for (const dot of pitDots) {
        ctx.fillStyle = PIT_COLOURS[dot.compound] || '#fff';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels — start (right-aligned before the line) and end (left of right edge)
      if (started) {
        ctx.font = '13px Square, "Courier New", monospace';
        ctx.fillStyle = colour;
        ctx.textAlign = 'right';
        ctx.fillText(label, firstX - 5, firstY + 4);
        ctx.textAlign = 'left';
        ctx.fillText(label, lastX + 4, lastY + 4);
      }
    }

    // Reset dash
    ctx.setLineDash([]);
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
  const def      = currentCircuit.sectors[sector - 1];
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
