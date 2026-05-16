// export_stats.mjs — One-off analysis tool: exports season stats for seasons 1–15 to CSV.
// Run with: node export_stats.mjs
//
// Must mock localStorage before any game modules load (championship.js uses it at load time).

import { writeFileSync } from 'fs';

globalThis.localStorage = {
  getItem:    () => null,
  setItem:    () => {},
  removeItem: () => {},
};

const { TEAMS, ENGINES, TYRES } = await import('./data.js');
const { DRIVER_POOL }           = await import('./drivers.js');
const {
  getDisplayYear, getChassisEra, getEngineEra, getTyreEra,
  getActiveRoster, getDriverStats,
  getTeamStats, getTeamEngine, getTeamTyre,
  getEngineStats, getTyreStats,
} = await import('./worldstate.js');

const WORLD_SEED  = 0;
const NUM_SEASONS = 15;

// ── CSV helpers ────────────────────────────────────────────────────────────────

function escapeCell(v) {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, cols) {
  const lines = [cols.join(',')];
  for (const row of rows) {
    lines.push(cols.map(c => escapeCell(row[c])).join(','));
  }
  return lines.join('\n');
}

// ── Collect data ───────────────────────────────────────────────────────────────

const driverRows = [];
const teamRows   = [];
const engineRows = [];
const tyreRows   = [];

for (let season = 1; season <= NUM_SEASONS; season++) {
  const year       = getDisplayYear(season);
  const chassisEra = getChassisEra(season);
  const engineEra  = getEngineEra(season);
  const tyreEra    = getTyreEra(season);
  const roster     = getActiveRoster(season, WORLD_SEED);

  // Cache engine/tyre per team for this season (used in the engine/tyre loops too)
  const teamEngine = {};
  const teamTyre   = {};
  for (const team of TEAMS) {
    teamEngine[team.id] = getTeamEngine(team.id, season, WORLD_SEED);
    teamTyre[team.id]   = getTeamTyre(team.id, season, WORLD_SEED);
  }

  // ── Drivers
  for (const { driverId, teamId, birthYear } of roster) {
    const pool  = DRIVER_POOL.find(d => d.id === driverId);
    const stats = getDriverStats(driverId, season, WORLD_SEED, birthYear);
    const team  = TEAMS.find(t => t.id === teamId);
    driverRows.push({
      season,
      year,
      driverId,
      firstName:   pool.firstName,
      lastName:    pool.lastName,
      nationality: pool.nationality,
      gender:      pool.gender,
      birthYear,
      age:         year - birthYear,
      teamId,
      teamName:    team ? team.name : teamId,
      skill:       stats.skill,
      consistency: stats.consistency,
      aggression:  stats.aggression,
    });
  }

  // ── Teams
  for (const team of TEAMS) {
    const stats    = getTeamStats(team.id, season, WORLD_SEED);
    const engineId = teamEngine[team.id];
    const tyreId   = teamTyre[team.id];
    const eng      = ENGINES[engineId];
    const tyr      = TYRES[tyreId];
    teamRows.push({
      season,
      year,
      teamId:             team.id,
      teamName:           team.name,
      fundingLevel:       team.fundingLevel,
      chassisEra,
      chassisId:          `Era ${chassisEra}`,
      aero:               stats.aero,
      chassisReliability: stats.chassisReliability,
      pitCrewRating:      stats.pitCrewRating,
      setupAbility:       stats.setupAbility,
      fuelCapacity:       stats.fuelCapacity,
      engineId,
      engineName:         eng ? eng.name : engineId,
      tyreId,
      tyreName:           tyr ? tyr.name : tyreId,
    });
  }

  // ── Engines
  for (const [engineId, engineBase] of Object.entries(ENGINES)) {
    const stats = getEngineStats(engineId, season, WORLD_SEED);
    const users = TEAMS
      .filter(t => teamEngine[t.id] === engineId)
      .map(t => t.shortName)
      .join('|');
    engineRows.push({
      season,
      year,
      engineEra,
      engineId,
      engineName:   engineBase.name,
      power:        stats.power,
      reliability:  stats.reliability,
      fuelBurnRate: stats.fuelBurnRate,
      teamsUsing:   users || '(none)',
    });
  }

  // ── Tyres
  for (const [tyreId, tyreBase] of Object.entries(TYRES)) {
    const stats = getTyreStats(tyreId, season, WORLD_SEED);
    const users = TEAMS
      .filter(t => teamTyre[t.id] === tyreId)
      .map(t => t.shortName)
      .join('|');
    tyreRows.push({
      season,
      year,
      tyreEra,
      tyreId,
      tyreName:   tyreBase.name,
      maxGrip:    stats.maxGrip,
      wearRate:   stats.wearRate,
      teamsUsing: users || '(none)',
    });
  }
}

// ── Write CSVs ─────────────────────────────────────────────────────────────────

const driverCols = [
  'season','year','driverId','firstName','lastName','nationality','gender',
  'birthYear','age','teamId','teamName','skill','consistency','aggression',
];
const teamCols = [
  'season','year','teamId','teamName','fundingLevel','chassisEra',
  'aero','chassisReliability','pitCrewRating','setupAbility','fuelCapacity',
  'engineId','engineName','tyreId','tyreName',
];
const engineCols = [
  'season','year','engineEra','engineId','engineName',
  'power','reliability','fuelBurnRate','teamsUsing',
];
const tyreCols = [
  'season','year','tyreEra','tyreId','tyreName',
  'maxGrip','wearRate','teamsUsing',
];

writeFileSync('stats_drivers.csv', toCsv(driverRows, driverCols));
writeFileSync('stats_teams.csv',   toCsv(teamRows,   teamCols));
writeFileSync('stats_engines.csv', toCsv(engineRows, engineCols));
writeFileSync('stats_tyres.csv',   toCsv(tyreRows,   tyreCols));

console.log(`stats_drivers.csv — ${driverRows.length} rows`);
console.log(`stats_teams.csv   — ${teamRows.length} rows`);
console.log(`stats_engines.csv — ${engineRows.length} rows`);
console.log(`stats_tyres.csv   — ${tyreRows.length} rows`);
