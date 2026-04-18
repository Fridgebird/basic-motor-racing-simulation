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
export function getCurrentEvent(dateStr) {
  const base = dateStr || todayISO();
  const devOffset = parseInt(localStorage.getItem('smr_dev_offset') || '0', 10);
  const rawOffset = daysBetween(SEASON_1_START, base);
  const dayOffset = rawOffset + devOffset;

  const len         = SEASON_SCHEDULE.length;
  const seasonIndex = Math.floor(dayOffset / len);   // 0-based season number
  const eventIndex  = ((dayOffset % len) + len) % len; // guard against negative offsets

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
 */
export function getSeedForEvent(event) {
  // Mix season + round + eventType flag so qualifying and race have different seeds
  const typeFlag = event.eventType === 'qualifying' ? 0 : 1;
  return (event.season * 10000) + (event.round * 10) + typeFlag;
}

// ─── Dev navigation ──────────────────────────────────────────────────────────

/** Step forward one event in dev mode */
export function advanceDevEvent() {
  const cur = parseInt(localStorage.getItem('smr_dev_offset') || '0', 10);
  localStorage.setItem('smr_dev_offset', String(cur + 1));
}

/** Step backward one event in dev mode */
export function retreatDevEvent() {
  const cur = parseInt(localStorage.getItem('smr_dev_offset') || '0', 10);
  localStorage.setItem('smr_dev_offset', String(cur - 1));
}

/** Clear dev offset (return to real calendar) */
export function clearDevOffset() {
  localStorage.removeItem('smr_dev_offset');
}

/** True if a dev offset is currently active */
export function isDevMode() {
  return localStorage.getItem('smr_dev_offset') !== null;
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

// ─── Championship state localStorage ─────────────────────────────────────────

const CHAMP_KEY = 'smr_championship';

function loadChampionshipState() {
  const raw = localStorage.getItem(CHAMP_KEY);
  return raw ? JSON.parse(raw) : { seasons: {} };
}

function saveChampionshipState(state) {
  localStorage.setItem(CHAMP_KEY, JSON.stringify(state));
}
