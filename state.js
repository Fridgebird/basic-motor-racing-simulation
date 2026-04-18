// state.js — Live race state and race log
// Call initRace(seed) once before the simulation starts.
// All mutable race data lives here; simulation.js reads and writes it each tick.

import { DRIVERS, TEAMS, ENGINES, TYRES, CIRCUIT } from './data.js';

// Qualifying state — populated by runQualifyingSession() before a race.
// Persisted to localStorage by championship.js.
export const qualiState = {
  results:    [],    // [{ driverName, lapTime, sectorTimes, retired, drawPosition, gridPosition }]
  isComplete: false,
};

export function resetQualiState() {
  qualiState.results    = [];
  qualiState.isComplete = false;
}

// ─── Seeded PRNG ──────────────────────────────────────────────────────────────
// Mulberry32 — fast, well-distributed, fully seedable.
// Returns a closure that produces a new float in [0, 1) on each call.
// Exported so simulation.js can continue from the same sequence after initRace().
export function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ─── Race Log ─────────────────────────────────────────────────────────────────
// Append one entry per sector tick from simulation.js (schema in CLAUDE.md).
// Pre-race setup roll events use tick/lap/sector = 0.
export const raceLog = {
  seed:    null,
  entries: [],
};

// ─── Lap Chart Data ───────────────────────────────────────────────────────────
// Populated at the end of each lap (sector 3). One entry per lap.
// Each entry maps driver name → { position, pitCompound }
// pitCompound is null unless the car pitted this lap (then 'soft'/'medium'/'hard').
// Reset by initRace().
export const lapChartData = [];

// ─── Race Progress ────────────────────────────────────────────────────────────
export const race = {
  tick:   0,   // absolute tick counter, 1–210 during the race
  lap:    0,   // current lap, 1–70
  sector: 0,   // current sector, 1–3
};

// ─── Car State ────────────────────────────────────────────────────────────────
// Populated by initRace(). One object per car, 24 total.
export let cars = [];

// ─── updatePositions ─────────────────────────────────────────────────────────
// Recalculates position and gap for every car from cumulative race time.
// Call this at the end of each sector tick in simulation.js.
// Retired cars are sorted to the back and their gap is set to null.
export function updatePositions() {
  cars.sort((a, b) => {
    const aRetired = a.status === 'retired';
    const bRetired = b.status === 'retired';
    if (aRetired && !bRetired) return 1;
    if (!aRetired && bRetired) return -1;
    // Among retired cars: sort by retirement lap descending so the most recent
    // retiree appears nearest the top of the retired section and the first
    // retiree sits at the very bottom of the leaderboard.
    if (aRetired && bRetired) return (b.retiredLap ?? 0) - (a.retiredLap ?? 0);
    return a.cumulativeTime - b.cumulativeTime;
  });

  const leaderTime = cars[0].cumulativeTime;
  cars.forEach((car, i) => {
    car.position = i + 1;
    car.gap = car.status === 'retired' ? null : +(car.cumulativeTime - leaderTime).toFixed(3);
  });
}

// ─── initRace ─────────────────────────────────────────────────────────────────
// Seeds the RNG, builds car objects, rolls pre-race setup for each car,
// runs a lightweight qualifying simulation to set the starting grid,
// and logs the setup roll for every car.
//
// Returns the rng function so simulation.js can continue the same RNG sequence
// without a gap or reset — essential for full race replayability.
/**
 * Initialise race state.
 * @param {number} seed  — Mulberry32 seed; same seed + same qualiResults = identical replay.
 * @param {Array|null} qualiResults — Qualifying results from runQualifyingSession().
 *   If provided: grid order and setup values come from qualifying (parc ferme).
 *   If null:     falls back to synthetic qualifying grid (for standalone races).
 * @param {object|null} circuit — Circuit to race on. Defaults to CIRCUIT (montjuic alias).
 * @returns {function} rng — Seeded PRNG; pass to initStrategies() then tick().
 */
export function initRace(seed, qualiResults = null, circuit = null) {

  // Reset shared state
  raceLog.seed    = seed;
  raceLog.entries = [];
  lapChartData.length = 0;
  race.tick   = 0;
  race.lap    = 0;
  race.sector = 3;  // so first tick() produces lap=1, sector=1 (not a phantom lap 0)

  const activeCircuit = circuit || CIRCUIT;
  const rng = createRng(seed);

  // Build lookup map for quick team access
  const teamMap = Object.fromEntries(TEAMS.map(t => [t.id, t]));

  // ── Build one car object per driver ────────────────────────────────────────
  const rawCars = DRIVERS.map(driver => {
    const team   = teamMap[driver.team];
    const engine = ENGINES[team.engine];
    const tyres  = TYRES[team.tyres];

    // Pre-race setup roll (no practice or qualifying session in v1).
    // Formula: newSetup = base + rng() × (setupAbility/100) × (100 - base)
    // Diminishing returns: the higher the base, the smaller the possible gain.
    const setupBase = 50;
    const setupGain = rng() * (team.setupAbility / 100) * (100 - setupBase);
    const setup     = Math.round(setupBase + setupGain);

    return {
      // ── Identity (references into data.js) ──────────────────────────────
      driver,   // full driver object  { name, team, skill, consistency, aggression }
      team,     // full team object    { id, name, engine, tyres, aero, ... }
      engine,   // full engine object  { name, power, reliability }
      tyres,    // full tyre object    { name, maxGrip, wearRate }

      // ── Tyre state ────────────────────────────────────────────────────────
      compound:     'medium',  // all cars start on mediums; pit AI may change this
      tyreWear:     0,         // 0.0 = new, 1.0 = worn out; drives tyreFactor
      stintLap:     0,         // laps completed on current tyre set
      tyreHistory:  [],        // compounds used so far e.g. ['S','H','M']

      // ── Fuel ──────────────────────────────────────────────────────────────
      fuel: activeCircuit.fuelCapacity,   // kg; full tank at lights-out

      // ── Setup ─────────────────────────────────────────────────────────────
      setup,    // 0–100; feeds setupFactor = 1.0 + (1 - setup/100) × 0.04

      // ── Mechanical health ─────────────────────────────────────────────────
      // reliabilityFactor starts at 1.0 (no effect) and rises on degraded failures.
      // Multiple failures stack — car deteriorates progressively.
      reliabilityFactor: 1.0,
      degradedLabel:     null,  // e.g. 'Turbo', 'Gearbox' once a failure fires

      // ── Pit stops ─────────────────────────────────────────────────────────
      stopsMade: 0,

      // ── Timing ────────────────────────────────────────────────────────────
      // cumulativeTime is the single source of truth for gaps and position.
      cumulativeTime:     0,
      lastLapTime:        null,   // null until first lap is complete
      currentSectorTimes: [],     // sector times building up within the current lap

      // ── Race status ───────────────────────────────────────────────────────
      status:        'racing',  // 'racing' | 'pitted' | 'retired'
      retiredReason: null,      // 'mechanical' | 'crash'

      // ── Leaderboard display ───────────────────────────────────────────────
      position:     0,     // 1–24; set by updatePositions()
      gridPosition: 0,     // starting grid slot; set below after quali sort
      gap:          0,     // seconds behind race leader (0 for leader)

      // Temp field used for qualifying sort; removed before cars[] is finalised
      _qualiScore: 0,
      // Temp field used to log the setup roll; removed after logging
      _setupBase: setupBase,
    };
  });

  // ── Grid order ─────────────────────────────────────────────────────────────
  if (qualiResults && qualiResults.length > 0) {
    // Real qualifying results: apply saved grid order and setup values (parc ferme).
    // qualiResults is sorted P1 → P24 (retired cars at back).
    const qualiMap = Object.fromEntries(qualiResults.map(r => [r.driverName, r]));
    rawCars.sort((a, b) => {
      const qa = qualiMap[a.driver.name];
      const qb = qualiMap[b.driver.name];
      return (qa ? qa.gridPosition : 999) - (qb ? qb.gridPosition : 999);
    });
    rawCars.forEach((car, i) => {
      const qr = qualiMap[car.driver.name];
      // Restore setup from qualifying (parc ferme — same setup carries through to race)
      if (qr && qr.setup != null) car.setup = qr.setup;
      car.position     = i + 1;
      car.gridPosition = i + 1;
      car.cumulativeTime = i * 0.3;
    });
  } else {
    // Fallback: synthetic qualifying grid (standalone race / no qualifying session).
    // Weights mirror what matters on a mixed circuit:
    //   driver skill 50%, engine power 25%, chassis aero 15%, car setup 10%
    // A small random jitter (±4 points) ensures the grid varies between races.
    rawCars.forEach(car => {
      const score =
        car.driver.skill  * 0.50 +
        car.engine.power  * 0.25 +
        car.team.aero     * 0.15 +
        car.setup         * 0.10 +
        (rng() * 8 - 4);          // jitter
      car._qualiScore = score;
    });

    rawCars.sort((a, b) => b._qualiScore - a._qualiScore);

    rawCars.forEach((car, i) => {
      car.position     = i + 1;
      car.gridPosition = i + 1;
      // Stagger starting cumulative times by 0.3 s per grid slot.
      // Represents the physical gap between cars on the grid at lights-out;
      // prevents a dead-heat at tick 1 and gives the field a natural initial spread.
      car.cumulativeTime = i * 0.3;
    });
  }

  // ── Log pre-race setup rolls ────────────────────────────────────────────────
  rawCars.forEach(car => {
    raceLog.entries.push({
      tick:   0,
      lap:    0,
      sector: 0,
      car:    car.driver.name,
      events: [
        {
          type:        'setup_roll',
          previous:    car._setupBase,
          result:      car.setup,
          sessionType: qualiResults ? 'from_qualifying' : 'pre_race',
        },
      ],
    });
    delete car._qualiScore;
    delete car._setupBase;
  });

  // Publish to module-level export
  cars.length = 0;
  cars.push(...rawCars);

  // Return the rng so simulation.js picks up exactly where we left off —
  // no reseeding, no skipped calls, guaranteed replayability.
  return rng;
}
