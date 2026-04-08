// renderer.js — Sinclair Spectrum-style canvas timing display
//
// Usage:
//   const renderer = new Renderer(document.getElementById('canvas'));
//   renderer.render();   // call after each tick or lap to refresh the display
//
// Reads directly from the live state exported by state.js.
// Has no knowledge of the simulation — pure display logic only.

import { cars, race, raceLog } from './state.js';
import { CIRCUIT } from './data.js';

// ─── Sinclair Spectrum colour palette ────────────────────────────────────────
// Authentic ZX Spectrum colours only. No gradients, no intermediate shades.
const C = {
  black:   '#000000',
  white:   '#FFFFFF',
  cyan:    '#00FFFF',
  yellow:  '#FFFF00',
  red:     '#FF0000',
  green:   '#00FF00',
  magenta: '#FF00FF',
  blue:    '#0000FF',
  // Dim variants for less prominent text (using Spectrum's "normal" brightness)
  dimCyan:  '#00D7D7',
  dimWhite: '#AAAAAA',
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const FONT      = '14px "Courier New", Courier, monospace';
const FONT_BOLD = 'bold 14px "Courier New", Courier, monospace';
const ROW_H     = 20;       // px per car row

// Vertical regions
const TITLE_Y    = 20;      // race title baseline
const LAP_Y      = 40;      // lap / sector info baseline
const COL_HDR_Y  = 64;      // column header baseline
const SEP_Y      = COL_HDR_Y + 6;   // separator line y
const ROWS_Y     = SEP_Y + 8;       // first car row top

// Canvas dimensions — exported so index.html can size the element correctly
export const CANVAS_W = 648;
export const CANVAS_H = ROWS_Y + 24 * ROW_H + 32;  // 32 px footer

// ─── Column definitions ───────────────────────────────────────────────────────
// x: left edge in px. Columns must fit within CANVAS_W.
const COLS = [
  { key: 'pos',     label: 'POS',      x:   8 },
  { key: 'driver',  label: 'DRIVER',   x:  44 },
  { key: 'team',    label: 'TEAM',     x: 156 },
  { key: 'lastLap', label: 'LAST LAP', x: 248 },
  { key: 'gap',     label: 'GAP',      x: 332 },
  { key: 'tyre',    label: 'TYRE',     x: 426 },
  { key: 'stops',   label: 'STP',      x: 502 },
  { key: 'status',  label: 'STATUS',   x: 538 },
];

// ─── Renderer class ───────────────────────────────────────────────────────────
export class Renderer {

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;  // pixel-perfect, no anti-aliasing

    // Previous positions keyed by driver name; used to detect changes each render
    this.prevPositions = new Map();
  }

  // ── render ──────────────────────────────────────────────────────────────────
  // Full redraw. Call once per lap for a smooth timing-sheet feel, or once per
  // tick if you want sector-level updates.
  render() {
    const { ctx, canvas } = this;

    // Black background
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this._drawHeader();
    this._drawColumnHeaders();
    this._drawSeparator(SEP_Y);
    this._drawCarRows();
    this._drawFooter();

    // Snapshot positions for next render cycle (drives gain/loss colouring)
    for (const car of cars) {
      this.prevPositions.set(car.driver.name, car.position);
    }
  }

  // ── _drawHeader ─────────────────────────────────────────────────────────────
  _drawHeader() {
    const { ctx } = this;
    const lap     = race.lap    || 0;
    const sector  = race.sector || 0;

    // Race name — yellow, bold
    ctx.font      = FONT_BOLD;
    ctx.fillStyle = C.yellow;
    ctx.fillText(CIRCUIT.name.toUpperCase(), 8, TITLE_Y);

    // Lap and sector counter — cyan
    ctx.font      = FONT;
    ctx.fillStyle = C.cyan;

    let lapInfo;
    if (lap === 0) {
      lapInfo = 'PRE-RACE';
    } else if (lap > CIRCUIT.totalLaps || (lap === CIRCUIT.totalLaps && sector === 3)) {
      lapInfo = `FINISHED  ${countRunning()} CLASSIFIED`;
    } else {
      lapInfo = `LAP ${String(lap).padStart(2, ' ')} / ${CIRCUIT.totalLaps}` +
                `   SECTOR ${sector}` +
                `   ${countRunning()} RUNNING`;
    }
    ctx.fillText(lapInfo, 8, LAP_Y);
  }

  // ── _drawColumnHeaders ──────────────────────────────────────────────────────
  _drawColumnHeaders() {
    const { ctx } = this;
    ctx.font      = FONT_BOLD;
    ctx.fillStyle = C.cyan;
    for (const col of COLS) {
      ctx.fillText(col.label, col.x, COL_HDR_Y);
    }
  }

  // ── _drawSeparator ──────────────────────────────────────────────────────────
  _drawSeparator(y) {
    const { ctx, canvas } = this;
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(4, y);
    ctx.lineTo(canvas.width - 4, y);
    ctx.stroke();
  }

  // ── _drawCarRows ────────────────────────────────────────────────────────────
  _drawCarRows() {
    for (let i = 0; i < cars.length; i++) {
      this._drawCarRow(cars[i], ROWS_Y + i * ROW_H);
    }
  }

  // ── _drawCarRow ─────────────────────────────────────────────────────────────
  _drawCarRow(car, rowTop) {
    const { ctx }  = this;
    const textY    = rowTop + ROW_H - 5;   // text baseline within the row
    const prev     = this.prevPositions.get(car.driver.name);
    const retired  = car.status === 'retired';
    const pitted   = car.status === 'pitted';

    // ── Row background tint ──────────────────────────────────────────────
    if (pitted) {
      ctx.fillStyle = '#1A1A00';    // dim yellow tint
      ctx.fillRect(4, rowTop, this.canvas.width - 8, ROW_H - 1);
    } else if (!retired && car.position === 1) {
      ctx.fillStyle = '#001800';    // dim green tint for leader
      ctx.fillRect(4, rowTop, this.canvas.width - 8, ROW_H - 1);
    }

    // ── Row text colour ──────────────────────────────────────────────────
    // Colours encode position delta since the last render call.
    let rowColour;
    if (retired) {
      rowColour = C.magenta;
    } else if (pitted) {
      rowColour = C.yellow;
    } else if (prev !== undefined && car.position < prev) {
      rowColour = C.green;          // gained at least one place
    } else if (prev !== undefined && car.position > prev) {
      rowColour = C.red;            // lost at least one place
    } else {
      rowColour = C.white;
    }

    ctx.font      = FONT;
    ctx.fillStyle = rowColour;

    // POS  ─────────────────────────────────────────────────────────────────
    const posStr = retired ? 'RET' : `P${car.position}`;
    ctx.fillText(posStr, COLS[0].x, textY);

    // DRIVER  ──────────────────────────────────────────────────────────────
    ctx.fillText(
      car.driver.name.toUpperCase().padEnd(13).slice(0, 13),
      COLS[1].x, textY,
    );

    // TEAM  ────────────────────────────────────────────────────────────────
    ctx.fillText(
      car.team.name.toUpperCase().padEnd(10).slice(0, 10),
      COLS[2].x, textY,
    );

    // LAST LAP  ────────────────────────────────────────────────────────────
    const lapTimeStr = car.lastLapTime != null
      ? formatLapTime(car.lastLapTime)
      : '  ---   ';
    ctx.fillText(lapTimeStr, COLS[3].x, textY);

    // GAP  ─────────────────────────────────────────────────────────────────
    let gapStr;
    if (retired) {
      // Show the reason rather than a time gap
      gapStr = car.retiredReason === 'crash' ? 'CRASH   ' : 'MECH    ';
    } else if (car.position === 1) {
      gapStr = 'LEADER  ';
    } else {
      gapStr = formatGap(car.gap);
    }
    ctx.fillText(gapStr, COLS[4].x, textY);

    // TYRE  ────────────────────────────────────────────────────────────────
    // Show compound initial and how many laps on the current set
    const compChar = car.compound[0].toUpperCase();  // S / M / H
    const age      = String(car.stintLap).padStart(2, ' ');
    ctx.fillText(`${compChar} L${age}   `, COLS[5].x, textY);

    // STOPS  ───────────────────────────────────────────────────────────────
    ctx.fillText(String(car.stopsMade), COLS[6].x, textY);

    // STATUS  ──────────────────────────────────────────────────────────────
    // Only populated for notable states; blank = racing normally
    if (pitted) {
      ctx.fillStyle = C.yellow;
      ctx.fillText('PIT', COLS[7].x, textY);
    } else if (retired) {
      ctx.fillStyle = C.magenta;
      ctx.fillText(car.retiredReason === 'crash' ? 'CRASH' : 'RETIRED', COLS[7].x, textY);
    }
    // (rowColour already set above — no need to restore for remaining cols)
  }

  // ── _drawFooter ─────────────────────────────────────────────────────────────
  _drawFooter() {
    const { ctx } = this;
    const footerY = ROWS_Y + 24 * ROW_H + 22;

    this._drawSeparator(ROWS_Y + 24 * ROW_H + 4);

    // Seed (left) — lets viewers replicate the race
    ctx.font      = FONT;
    ctx.fillStyle = C.dimCyan;
    ctx.fillText(`SEED: ${raceLog.seed}`, 8, footerY);

    // Colour legend (right)
    const legend = [
      { colour: C.green,   label: 'GAINED' },
      { colour: C.red,     label: 'LOST'   },
      { colour: C.yellow,  label: 'PIT'    },
      { colour: C.magenta, label: 'OUT'    },
    ];
    let lx = 280;
    for (const item of legend) {
      ctx.fillStyle = item.colour;
      ctx.fillText(item.label, lx, footerY);
      lx += item.label.length * 8.4 + 18;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Format a time in seconds as "M:SS.ddd" (e.g. "1:15.234")
function formatLapTime(seconds) {
  const m  = Math.floor(seconds / 60);
  const s  = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Format a gap in seconds as "+SS.ddd" or "+M:SS.d", padded to 8 chars
function formatGap(gap) {
  if (gap == null || gap < 0) return '        ';
  if (gap < 60) {
    // e.g. "+23.456"
    return ('+' + gap.toFixed(3)).padEnd(8);
  }
  // e.g. "+1:23.4"
  const m = Math.floor(gap / 60);
  const s = (gap % 60).toFixed(1).padStart(4, '0');
  return (`+${m}:${s}`).padEnd(8);
}

// Count cars still running (not retired)
function countRunning() {
  return cars.filter(c => c.status !== 'retired').length;
}
