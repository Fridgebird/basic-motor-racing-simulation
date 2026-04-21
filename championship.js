// championship.js — Calendar resolution, points, standings, and localStorage persistence.
//
// Global world model:
//   - Season 1 starts on SEASON_1_START (defined in data.js)
//   - Each entry in SEASON_SCHEDULE consumes one real calendar day
//   - The schedule wraps: after the last event of season N, season N+1 begins
//   - Every visitor on the same date sees the same event — one global reality
//
// Dev mode:
//   - Set localStorage key 'smr_dev_offset' to an integer to override today's date
//   - Increment it via advanceDevEvent() to step through the schedule

import { CIRCUITS, SEASON_SCHEDULE, SEASON_1_START } from './data.js';

// Points awarded to finishing positions 1–10
const POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// ─── Calendar ────────────────────────────────────────────────────────────────

/** Return today's date as an ISO string (YYYY-MM-DD) */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Parse an ISO date string to a UTC midnight timestamp */
function parseISO(str) {
  const [y, m, d] = str.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Number of whole days between two ISO date strings */
function daysBetween(fromISO, toISO) {
  return Math.floor((parseISO(toISO) - parseISO(fromISO)) / 86_400_000);
}

/**
 * Resolve the current championship event.
 * @param {string} [dateStr] — ISO date override (defaults to today; dev offset applied on top)
 * @returns {{ round, eventType, circuitId, season, eventIndex, dayOffset }}
 */
export function getCurrentEvent() {
  const dayOffset  = getTodayDayOffset();
  const len        = SEASON_SCHEDULE.length;
  const seasonIndex = Math.floor(dayOffset / len);
  const eventIndex  = ((dayOffset % len) + len) % len;

  return {
    ...SEASON_SCHEDULE[eventIndex],
    season:     seasonIndex + 1,
    eventIndex,
    dayOffset,
  };
}

/** Return the circuit object for a given event */
export function getCircuit(event) {
  return CIRCUITS[event.circuitId];
}

/**
 * Deterministic seed for a given event.
 * Same event on any device on any day produces the same seed.
 * worldSeed shifts the entire universe — all events get a different outcome.
 */
export function getSeedForEvent(event, worldSeed = 0) {
  // Mix season + round + eventType flag so qualifying and race have different seeds
  const typeFlag = event.eventType === 'qualifying' ? 0 : 1;
  return (event.season * 10000) + (event.round * 10) + typeFlag + worldSeed;
}

/**
 * Return the event object for a specific season/round/type.
 * Used by qualifying.html and race.html when loaded with URL params.
 */
export function getEventForRound(season, round, eventType) {
  const idx = SEASON_SCHEDULE.findIndex(e => e.round === round && e.eventType === eventType);
  if (idx < 0) return null;
  const dayOffset = (season - 1) * SEASON_SCHEDULE.length + idx;
  return { ...SEASON_SCHEDULE[idx], season, eventIndex: idx, dayOffset };
}

/**
 * Returns today's absolute day offset.
 * In dev mode, returns the directly-stored dev day (ignores real date entirely).
 * In prod, returns days since SEASON_1_START.
 */
export function getTodayDayOffset() {
  const devDay = localStorage.getItem('smr_dev_today');
  if (devDay !== null) return parseInt(devDay, 10);
  return daysBetween(SEASON_1_START, todayISO());
}

// ─── World seed ───────────────────────────────────────────────────────────────
// Shifts the entire season universe — changing it produces a completely different
// set of qualifying results and races across all rounds and seasons.
// In prod, set WORLD_SEED_DEFAULT to a fixed arbitrary number before deploying.
// In dev mode, overridable via the topbar input (stored in localStorage).

export const WORLD_SEED_DEFAULT = 0;

export function getWorldSeed() {
  const stored = localStorage.getItem('smr_world_seed');
  return stored !== null ? parseInt(stored, 10) : WORLD_SEED_DEFAULT;
}

export function setWorldSeed(n) {
  localStorage.setItem('smr_world_seed', String(n));
}

/** Return the ISO date string for a given absolute day offset from SEASON_1_START */
export function getEventDate(absoluteDayOffset) {
  const ts = parseISO(SEASON_1_START) + absoluteDayOffset * 86_400_000;
  return new Date(ts).toISOString().slice(0, 10);
}

/** Format an ISO date as e.g. "Apr 21" */
export function formatShortDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

// ─── Dev mode ────────────────────────────────────────────────────────────────
// Activated by visiting any page with ?dev=1 in the URL.
// Persists in localStorage (smr_dev_mode = '1') until explicitly exited.
// smr_dev_today stores the current "virtual today" as an absolute day offset.
// Advancing/retreating changes this value directly — real date is ignored entirely.

/** True if dev mode is active */
export function isDevMode() {
  return localStorage.getItem('smr_dev_mode') === '1';
}

/**
 * Activate dev mode. Sets smr_dev_mode and initialises smr_dev_today to the
 * current real day offset if not already set.
 */
export function enterDevMode() {
  localStorage.setItem('smr_dev_mode', '1');
  if (localStorage.getItem('smr_dev_today') === null) {
    localStorage.setItem('smr_dev_today', String(daysBetween(SEASON_1_START, todayISO())));
  }
}

/** Deactivate dev mode and clear the virtual today. Returns to real calendar. */
export function exitDevMode() {
  localStorage.removeItem('smr_dev_mode');
  localStorage.removeItem('smr_dev_today');
}

/** Step virtual today forward one day */
export function advanceDevEvent() {
  const cur = getTodayDayOffset();
  localStorage.setItem('smr_dev_today', String(cur + 1));
}

/** Step virtual today backward one day */
export function retreatDevEvent() {
  const cur = getTodayDayOffset();
  localStorage.setItem('smr_dev_today', String(cur - 1));
}

// ─── Points & Results ─────────────────────────────────────────────────────────

/**
 * Store a race result and update championship standings in localStorage.
 * @param {number} season
 * @param {number} round
 * @param {Array<{driverName: string, teamId: string, position: number, retired: boolean}>} finishOrder
 *   Array sorted by finishing position (index 0 = race winner).
 */
export function addRaceResult(season, round, finishOrder) {
  const state = loadChampionshipState();

  if (!state.seasons[season]) state.seasons[season] = { races: {}, drivers: {}, constructors: {} };
  const s = state.seasons[season];

  // Don't double-count if result already stored
  if (s.races[round]) return;

  // Store raw result
  s.races[round] = finishOrder.map((entry, i) => ({
    ...entry,
    points: POINTS_TABLE[i] || 0,
  }));

  // Accumulate driver points
  finishOrder.forEach((entry, i) => {
    const pts = POINTS_TABLE[i] || 0;
    if (!s.drivers[entry.driverName]) {
      s.drivers[entry.driverName] = { points: 0, wins: 0, podiums: 0, teamId: entry.teamId };
    }
    s.drivers[entry.driverName].points += pts;
    if (i === 0) s.drivers[entry.driverName].wins += 1;
    if (i < 3)  s.drivers[entry.driverName].podiums += 1;
  });

  // Accumulate constructor points (top two cars per team score)
  const teamTally = {};
  finishOrder.forEach((entry, i) => {
    const pts = POINTS_TABLE[i] || 0;
    if (!teamTally[entry.teamId]) teamTally[entry.teamId] = 0;
    // Each team's top two finishers score (like historical constructors rules)
    const scored = s.races[round].filter(r => r.teamId === entry.teamId && r.points > 0).length;
    if (scored <= 2) {
      if (!s.constructors[entry.teamId]) s.constructors[entry.teamId] = { points: 0, wins: 0 };
      s.constructors[entry.teamId].points += pts;
      if (i === 0) s.constructors[entry.teamId].wins += 1;
    }
  });

  saveChampionshipState(state);
}

/**
 * Return standings for a season.
 * @returns {{ drivers: Array, constructors: Array, races: Object }}
 */
export function getStandings(season) {
  const state = loadChampionshipState();
  const s = state.seasons[season] || { races: {}, drivers: {}, constructors: {} };

  const drivers = Object.entries(s.drivers)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  const constructors = Object.entries(s.constructors)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  return { drivers, constructors, races: s.races };
}

// ─── Qualifying results persistence ──────────────────────────────────────────

const QUALI_KEY = (season, round) => `smr_quali_${season}_${round}`;

/** Save qualifying results for a given season/round */
export function saveQualiResults(season, round, results) {
  localStorage.setItem(QUALI_KEY(season, round), JSON.stringify(results));
}

/** Load qualifying results for a given season/round, or null if not found */
export function loadQualiResults(season, round) {
  const raw = localStorage.getItem(QUALI_KEY(season, round));
  return raw ? JSON.parse(raw) : null;
}

/** True if a race result has been stored for this season/round */
export function hasRaceResult(season, round) {
  const state = loadChampionshipState();
  return !!(state.seasons[season] && state.seasons[season].races[round]);
}

// ─── Championship state localStorage ─────────────────────────────────────────

const CHAMP_KEY = 'smr_championship';

function loadChampionshipState() {
  const raw = localStorage.getItem(CHAMP_KEY);
  return raw ? JSON.parse(raw) : { seasons: {} };
}

function saveChampionshipState(state) {
  localStorage.setItem(CHAMP_KEY, JSON.stringify(state));
}
