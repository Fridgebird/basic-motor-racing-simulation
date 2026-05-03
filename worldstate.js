// worldstate.js — Season-aware stat resolution for Simple Motor Racing
//
// All team/driver/engine/tyre stats are functions of (season, worldSeed).
// Nothing is authored — values are seeded so they're deterministic and replayable.
// The only authored content is in data.js (identities, permanent properties) and
// drivers.js (names, birth years, portrait indices).
//
// Core principle: getSeasonSnapshot(season, worldSeed) returns a fully resolved
// world state that the simulation can consume directly. Past races always use the
// stats from their season — changing worldSeed requires resetting cached results.

import { TEAMS, ENGINES, TYRES, CIRCUITS, SEASON_SCHEDULE } from './data.js';
import { DRIVER_POOL } from './drivers.js';
import { getStandings } from './championship.js';

// ─── Era detection ────────────────────────────────────────────────────────────

/** Display year for a season (Season 1 = 1930). */
export function getDisplayYear(season) {
  return 1929 + season;
}

/** Chassis regulation era — resets every 5 seasons. */
export function getChassisEra(season) {
  return Math.floor((season - 1) / 5) + 1;
}

/** Engine regulation era — resets every 3 seasons. */
export function getEngineEra(season) {
  return Math.floor((season - 1) / 3) + 1;
}

/** Tyre regulation era — resets every 2 seasons. */
export function getTyreEra(season) {
  return Math.floor((season - 1) / 2) + 1;
}

/** True if this season begins a new chassis era. */
export function isNewChassisEra(season) {
  return season > 1 && getChassisEra(season) !== getChassisEra(season - 1);
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
// Mulberry32 hash — fast, well-distributed, fully reversible from seed.
// Returns a single float [0, 1) from integer inputs (no closure needed).

function hash32(a, b = 0, c = 0, d = 0) {
  // Mix four integers into one deterministic float.
  let s = ((a ^ (b * 2654435761)) ^ (c * 1664525) ^ (d * 1013904223)) >>> 0;
  s = (s + 0x6D2B79F5) >>> 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
}

/** Seeded random float in [min, max]. */
function seededFloat(min, max, ...hashArgs) {
  return min + hash32(...hashArgs) * (max - min);
}

/** Seeded random integer in [min, max] inclusive. */
function seededInt(min, max, ...hashArgs) {
  return Math.floor(seededFloat(min, max + 0.9999, ...hashArgs));
}

/** Pick a random element from an array, seeded. */
function seededPick(arr, ...hashArgs) {
  return arr[seededInt(0, arr.length - 1, ...hashArgs)];
}

// ─── Numeric IDs for hashing ──────────────────────────────────────────────────
// Hash functions need integer inputs. Map string IDs to stable integers.

const TEAM_INDEX   = Object.fromEntries(TEAMS.map((t, i) => [t.id, i]));
const ENGINE_INDEX = Object.fromEntries(Object.keys(ENGINES).map((k, i) => [k, i + 100]));
const TYRE_INDEX   = Object.fromEntries(Object.keys(TYRES).map((k, i) => [k, i + 200]));

// Salt constants to avoid collisions between team/engine/tyre hashes in same era
const SALT_TEAM_BASE  = 0x10000;
const SALT_ENGINE     = 0x20000;
const SALT_TYRE       = 0x30000;
const SALT_DRIVER     = 0x40000;
const SALT_CONTRACT   = 0x50000;
const SALT_RETIRE     = 0x60000;
const SALT_DEVELOP    = 0x70000;

// ─── Team chassis stats ───────────────────────────────────────────────────────
// At each chassis era boundary: all stats rerolled fresh (no memory of prior era).
// Funding level gives a small upward bias but variance is large enough for reversals.
// Within an era: teams develop at season end, scaled by funding, with diminishing returns.

const CHASSIS_STATS = ['aero', 'chassisReliability', 'pitCrewRating', 'setupAbility'];
const CHASSIS_RANGES = {
  aero:               { min: 38, max: 95 },
  chassisReliability: { min: 55, max: 95 },
  pitCrewRating:      { min: 42, max: 95 },
  setupAbility:       { min: 40, max: 95 },
};
const FUEL_CAP_RANGE = { min: 85, max: 142 };

function fundingBias(fundingLevel) {
  // Adds 0 (funding=0) to +8 (funding=100) to the random roll.
  return (fundingLevel / 100) * 8;
}

/** Resolved team chassis stats for a specific season. */
export function getTeamStats(teamId, season, worldSeed) {
  const team       = TEAMS.find(t => t.id === teamId);
  if (!team) throw new Error(`Unknown teamId: ${teamId}`);
  const ti         = TEAM_INDEX[teamId];
  const chassisEra = getChassisEra(season);
  const eraStart   = (chassisEra - 1) * 5 + 1;  // first season of this era
  const bias       = fundingBias(team.fundingLevel);

  // Base stats at era start — fresh roll, no memory
  const base = {};
  for (const stat of CHASSIS_STATS) {
    const { min, max } = CHASSIS_RANGES[stat];
    base[stat] = Math.round(
      Math.min(max,
        seededFloat(min, max, worldSeed + SALT_TEAM_BASE, ti, chassisEra, stat.charCodeAt(0))
        + bias
      )
    );
  }

  // fuelCapacity — also rerolled at era start
  base.fuelCapacity = Math.round(
    Math.min(FUEL_CAP_RANGE.max,
      seededFloat(FUEL_CAP_RANGE.min, FUEL_CAP_RANGE.max, worldSeed + SALT_TEAM_BASE, ti, chassisEra, 999)
      + bias
    )
  );

  // Season-end development increments within era
  const resolved = { ...base };
  const maxDevPerSeason = (team.fundingLevel / 100) * 8;

  for (let s = eraStart + 1; s <= season; s++) {
    for (const stat of CHASSIS_STATS) {
      const current         = resolved[stat];
      const { max }         = CHASSIS_RANGES[stat];
      const diminishing     = (max - current) / max;
      const maxGain         = maxDevPerSeason * diminishing;
      const gain            = seededFloat(0, maxGain, worldSeed + SALT_DEVELOP, ti, s, stat.charCodeAt(0));
      resolved[stat]        = Math.min(max, Math.round(resolved[stat] + gain));
    }
    // fuelCapacity: subtle development each season within era (better packaging)
    const fcDim = (FUEL_CAP_RANGE.max - resolved.fuelCapacity) / FUEL_CAP_RANGE.max;
    const fcGain = seededFloat(0, 2 * fcDim, worldSeed + SALT_DEVELOP, ti, s, 888);
    resolved.fuelCapacity = Math.min(FUEL_CAP_RANGE.max, Math.round(resolved.fuelCapacity + fcGain));
  }

  return resolved;
}

// ─── Engine stats ─────────────────────────────────────────────────────────────

const ENGINE_STAT_RANGES = {
  power:       { min: 55, max: 95 },
  reliability: { min: 50, max: 95 },
};

export function getEngineStats(engineId, season, worldSeed) {
  const ei         = ENGINE_INDEX[engineId];
  const engineEra  = getEngineEra(season);
  const eraStart   = (engineEra - 1) * 3 + 1;

  const base = {};
  for (const stat of ['power', 'reliability']) {
    const { min, max } = ENGINE_STAT_RANGES[stat];
    base[stat] = Math.round(
      seededFloat(min, max, worldSeed + SALT_ENGINE, ei, engineEra, stat.charCodeAt(0))
    );
  }

  // fuelBurnRate: also seeded per era — range 0.95–1.20
  base.fuelBurnRate = +seededFloat(0.95, 1.20, worldSeed + SALT_ENGINE, ei, engineEra, 777).toFixed(3);

  // Season-end development
  const resolved = { ...base };
  const devRate  = 4; // max power/reliability gain per season
  for (let s = eraStart + 1; s <= season; s++) {
    for (const stat of ['power', 'reliability']) {
      const { max }     = ENGINE_STAT_RANGES[stat];
      const diminishing = (max - resolved[stat]) / max;
      const gain        = seededFloat(0, devRate * diminishing, worldSeed + SALT_DEVELOP, ei + 1000, s, stat.charCodeAt(0));
      resolved[stat]    = Math.min(max, Math.round(resolved[stat] + gain));
    }
  }

  return resolved;
}

// ─── Tyre stats ───────────────────────────────────────────────────────────────

export function getTyreStats(tyreId, season, worldSeed) {
  const ti      = TYRE_INDEX[tyreId];
  const tyreEra = getTyreEra(season);
  const eraStart = (tyreEra - 1) * 2 + 1;

  const base = {
    maxGrip:  Math.round(seededFloat(78, 94, worldSeed + SALT_TYRE, ti, tyreEra, 1)),
    wearRate: +seededFloat(0.0090, 0.0145, worldSeed + SALT_TYRE, ti, tyreEra, 2).toFixed(5),
  };

  // Minor development within era
  const resolved = { ...base };
  for (let s = eraStart + 1; s <= season; s++) {
    const dimGrip = (94 - resolved.maxGrip) / 94;
    resolved.maxGrip = Math.min(94, Math.round(
      resolved.maxGrip + seededFloat(0, 2 * dimGrip, worldSeed + SALT_DEVELOP, ti + 2000, s, 1)
    ));
    // Wear rate improves (falls) slightly each season
    resolved.wearRate = Math.max(0.0090, +(
      resolved.wearRate - seededFloat(0, 0.0003, worldSeed + SALT_DEVELOP, ti + 2000, s, 2)
    ).toFixed(5));
  }

  return resolved;
}

// ─── Engine contracting ───────────────────────────────────────────────────────
// Works teams always use their own engine.
// Garagiste teams re-contract every 2 seasons; seeded from worldSeed + teamId + period.

const NON_WORKS_ENGINES = Object.keys(ENGINES).filter(
  eid => !TEAMS.some(t => t.isWorks && t.worksEngineId === eid)
);

export function getTeamEngine(teamId, season, worldSeed) {
  const team = TEAMS.find(t => t.id === teamId);
  if (team.isWorks) return team.worksEngineId;
  const contractPeriod = Math.floor((season - 1) / 2);
  const ti = TEAM_INDEX[teamId];
  return seededPick(NON_WORKS_ENGINES, worldSeed + SALT_CONTRACT, ti, contractPeriod);
}

// ─── Tyre contracting ─────────────────────────────────────────────────────────
// All teams re-contract tyres every season.

const ALL_TYRE_IDS = Object.keys(TYRES);

export function getTeamTyre(teamId, season, worldSeed) {
  const ti = TEAM_INDEX[teamId];
  return seededPick(ALL_TYRE_IDS, worldSeed + SALT_CONTRACT, ti + 500, season);
}

// ─── Driver stats ─────────────────────────────────────────────────────────────
// Each driver has base stats seeded from their id + worldSeed.
// Stats follow a career arc: rising through early career, peaking at prime, declining late.

function driverAge(driver, season) {
  return getDisplayYear(season) - driver.birthYear;
}

/** Career arc multiplier for skill: rises to 1.0 at prime, falls off late career. */
function skillArcMultiplier(age) {
  if (age < 20) return 0.70;
  if (age < 24) return 0.70 + (age - 20) / 4 * 0.18;   // 0.70 → 0.88 during development
  if (age < 30) return 0.88 + (age - 24) / 6 * 0.12;   // 0.88 → 1.00 peak approach
  if (age < 36) return 1.00;                              // prime years — at ceiling
  if (age < 44) return 1.00 - (age - 36) / 8 * 0.25;   // 1.00 → 0.75 decline
  return Math.max(0.50, 0.75 - (age - 44) / 6 * 0.25); // accelerating dropoff
}

/** Consistency arc: peaks mid-career, holds longer than skill. */
function consistencyArcMultiplier(age) {
  if (age < 22) return 0.80;
  if (age < 28) return 0.80 + (age - 22) / 6 * 0.20;   // rising to 1.0
  if (age < 40) return 1.00;                              // peak consistency window
  if (age < 48) return 1.00 - (age - 40) / 8 * 0.20;   // gentle decline
  return 0.80;
}

export function getDriverStats(driverId, season, worldSeed) {
  const driver = DRIVER_POOL.find(d => d.id === driverId);
  if (!driver) throw new Error(`Unknown driverId: ${driverId}`);

  const age         = driverAge(driver, season);
  const skillArc    = skillArcMultiplier(age);
  const conArc      = consistencyArcMultiplier(age);

  // Small per-season variance on top of base arc
  const variance    = seededFloat(-3, 3, worldSeed + SALT_DRIVER, driverId, season);

  return {
    skill:       Math.max(20, Math.min(100, Math.round(driver.baseSkill * skillArc + variance))),
    consistency: Math.max(20, Math.min(100, Math.round(driver.baseConsistency * conArc + variance * 0.5))),
    aggression:  driver.baseAggression, // aggression is a personality trait — doesn't change
  };
}

export function getDriverAge(driverId, season) {
  const driver = DRIVER_POOL.find(d => d.id === driverId);
  return driver ? driverAge(driver, season) : null;
}

// ─── Driver lifecycle ─────────────────────────────────────────────────────────
// Computed forward from Season 1; never stored (fully deterministic from worldSeed).
//
// Each season end:
//   1. Performance-based firing: if effectiveSkill < team minimum, driver is released.
//   2. Age-based retirement: probability rises steeply after 38.
//   3. Vacant slots: filled by next eligible rookie from DRIVER_POOL (by id order).

function retirementProbability(age) {
  if (age < 35) return 0.02;
  if (age < 38) return 0.05;
  if (age < 40) return 0.15;
  if (age < 42) return 0.30;
  if (age < 44) return 0.55;
  if (age < 46) return 0.80;
  return 0.96;
}

function teamMinSkill(team) {
  // Only truly poor performers at established teams get dropped.
  // Range 40–60: avoids firing developing drivers who haven't peaked yet.
  return Math.round(40 + (team.fundingLevel / 100) * 20);
}

/** Returns the active driver roster for the start of a season: Array<{driverId, teamId}>. */
export function getActiveRoster(season, worldSeed) {
  // Season 1: start with all S1 drivers assigned to their startTeam
  let roster = DRIVER_POOL
    .filter(d => driverAge(d, 1) >= 20)
    .map(d => ({ driverId: d.id, teamId: d.startTeam }));

  // Track which pool drivers have entered (to avoid re-entry)
  const entered = new Set(roster.map(r => r.driverId));

  // Advance season by season from S2
  for (let s = 2; s <= season; s++) {
    roster = applySeasonEndTransitions(roster, s, worldSeed, entered);
  }

  return roster;
}

function applySeasonEndTransitions(roster, season, worldSeed, entered) {
  // Step 1: Check each driver for firing or retirement
  const active = roster.filter(entry => {
    const driver = DRIVER_POOL.find(d => d.id === entry.driverId);
    if (!driver) return false;

    const age        = driverAge(driver, season - 1); // age at END of previous season
    const team       = TEAMS.find(t => t.id === entry.teamId);
    const stats      = getDriverStats(entry.driverId, season - 1, worldSeed);

    // Performance-based firing: drop drivers whose skill falls below the team's floor.
    // Threshold range is 40–60 (low enough that developing drivers are safe unless
    // genuinely poor; only clear backmarkers at established teams get cut).
    const minSkill = teamMinSkill(team);
    if (stats.skill < minSkill) return false; // fired

    // Age-based retirement
    const retireProb = retirementProbability(age);
    const retireRoll = hash32(worldSeed + SALT_RETIRE, entry.driverId, season);
    return retireRoll >= retireProb; // true = stays; false = retires
  });

  // Step 2: Fill vacant team slots with rookies
  const teamSlots = {};
  for (const team of TEAMS) {
    teamSlots[team.id] = active.filter(r => r.teamId === team.id).length;
  }

  for (const team of TEAMS) {
    while (teamSlots[team.id] < 2) {
      // Find the next eligible rookie: born so they're 20–22 this season, not yet entered
      const rookie = DRIVER_POOL.find(d =>
        !entered.has(d.id) &&
        driverAge(d, season) >= 20 &&
        driverAge(d, season) <= 22
      );
      if (!rookie) break; // pool exhausted for this season — leave slot vacant

      active.push({ driverId: rookie.id, teamId: team.id });
      entered.add(rookie.id);
      teamSlots[team.id]++;
    }
  }

  return active;
}

// ─── Car numbers ──────────────────────────────────────────────────────────────
// The reigning champion's team gets 1 and 2 (champion = 1, teammate = 2).
// All other teams use their permanent baseNumbers from data.js.

export function getCarNumbers(season, worldSeed) {
  const numbers = new Map(); // driverId → carNumber

  // Try to get last season's champion
  let champDriverName = null;
  if (season > 1) {
    try {
      const standings = getStandings(season - 1);
      if (standings && standings.drivers && standings.drivers.length > 0) {
        champDriverName = standings.drivers[0].name;
      }
    } catch {
      // No standings yet — season 1 behaviour
    }
  }

  const roster = getActiveRoster(season, worldSeed);

  if (champDriverName) {
    // Find the champion's driverId from the roster
    const champEntry = roster.find(r => {
      const d = DRIVER_POOL.find(p => p.id === r.driverId);
      return d && `${d.firstName} ${d.lastName}` === champDriverName;
    });

    if (champEntry) {
      // Champion gets 1; their teammate gets 2
      numbers.set(champEntry.driverId, 1);
      const teammate = roster.find(r =>
        r.teamId === champEntry.teamId && r.driverId !== champEntry.driverId
      );
      if (teammate) numbers.set(teammate.driverId, 2);
    }
  }

  // All other drivers: use team baseNumbers
  for (const entry of roster) {
    if (numbers.has(entry.driverId)) continue;
    const team    = TEAMS.find(t => t.id === entry.teamId);
    if (!team) continue;
    const teammates = roster.filter(r => r.teamId === entry.teamId);
    const isLead    = teammates[0].driverId === entry.driverId;
    numbers.set(entry.driverId, isLead ? team.baseNumbers[0] : team.baseNumbers[1]);
  }

  return numbers;
}

// ─── Era sprite sheet ─────────────────────────────────────────────────────────
// Returns the car sprite sheet filename for the current chassis era.
// Falls back to era 1 sheet if the era's asset hasn't been provided yet.

const ERA_SPRITE_SHEETS = {
  1: 'car_sprites_1930_gemini_context.png',  // S1–5  (1930–1934)
  // Add future era sheets here as they are provided:
  // 2: 'car_sprites_1935_era2.png',         // S6–10 (1935–1939)
  // 3: 'car_sprites_1940_era3.png',
};

export function getCarSpriteSheet(season) {
  const era = getChassisEra(season);
  return ERA_SPRITE_SHEETS[era] ?? ERA_SPRITE_SHEETS[1];
}

export function getCarSpriteSheetForEra(chassisEra) {
  return ERA_SPRITE_SHEETS[chassisEra] ?? ERA_SPRITE_SHEETS[1];
}

// ─── Full season snapshot ─────────────────────────────────────────────────────
// Returns everything the simulation needs for one season, fully resolved.
// race.html and qualifying.html call this before initRace().

export function getSeasonSnapshot(season, worldSeed) {
  const roster     = getActiveRoster(season, worldSeed);
  const carNumbers = getCarNumbers(season, worldSeed);

  // Build resolved driver objects (matching the shape state.js expects)
  const drivers = roster.map(({ driverId, teamId }) => {
    const poolDriver = DRIVER_POOL.find(d => d.id === driverId);
    const stats      = getDriverStats(driverId, season, worldSeed);
    const number     = carNumbers.get(driverId) ?? 0;
    return {
      id:          driverId,
      name:        `${poolDriver.firstName} ${poolDriver.lastName}`,
      lastName:    poolDriver.lastName,
      team:        teamId,
      number,
      portraitIndex: poolDriver.portraitIndex,
      gender:      poolDriver.gender,
      nationality: poolDriver.nationality,
      birthYear:   poolDriver.birthYear,
      age:         getDriverAge(driverId, season),
      ...stats,
    };
  });

  // Build resolved team objects (each team augmented with season stats)
  const teams = TEAMS.map(team => {
    const chassisStats = getTeamStats(team.id, season, worldSeed);
    const engineId     = getTeamEngine(team.id, season, worldSeed);
    const tyreId       = getTeamTyre(team.id, season, worldSeed);
    return {
      ...team,               // identity, baseNumbers, fundingLevel, strategy
      ...chassisStats,       // aero, chassisReliability, pitCrewRating, setupAbility, fuelCapacity
      engine: engineId,      // current engine id (for simulation lookup)
      tyres:  tyreId,        // current tyre id  (for simulation lookup)
    };
  });

  // Build resolved engine objects
  const engines = {};
  for (const [engineId, engineBase] of Object.entries(ENGINES)) {
    engines[engineId] = { ...engineBase, ...getEngineStats(engineId, season, worldSeed) };
  }

  // Build resolved tyre objects
  const tyres = {};
  for (const [tyreId, tyreBase] of Object.entries(TYRES)) {
    tyres[tyreId] = { ...tyreBase, ...getTyreStats(tyreId, season, worldSeed) };
  }

  return { drivers, teams, engines, tyres, season, worldSeed, carNumbers };
}
