// race_detail.mjs — Detailed per-stint breakdown for a single race.
// Run with: node race_detail.mjs [seed]

import { initRace, cars, raceLog } from './state.js';
import { tick, isRaceOver }        from './simulation.js';

const SEED = process.argv[2] ? parseInt(process.argv[2]) : 198804;

const rng = initRace(SEED);
while (!isRaceOver()) tick(rng);

// ── Build per-car stint data from the race log ────────────────────────────────

function buildStints(driverName) {
  const entries = raceLog.entries.filter(e => e.car === driverName && e.sector !== 0);
  if (!entries.length) return [];

  const stints = [];
  let stintStart  = 1;
  let compound    = null; // set from first entry or pit events

  // Detect starting compound from first pit event's plannedStrategy
  let startCompound = 'medium';
  for (const e of entries) {
    const pit = e.events?.find(ev => ev.type === 'pit');
    if (pit?.plannedStrategy) { startCompound = pit.plannedStrategy[0].toLowerCase(); break; }
  }
  compound = startCompound;

  // Group entries by lap
  const byLap = new Map();
  for (const e of entries) {
    if (!byLap.has(e.lap)) byLap.set(e.lap, []);
    byLap.get(e.lap).push(e);
  }

  // Walk laps, accumulate sector times into lap times, detect pit/retirement
  let startFuel   = null;  // fuel at start of stint (approximated from first sector)
  let lapTimes    = [];
  let pitThisLap  = false;

  const laps = [...byLap.keys()].sort((a, b) => a - b);

  for (const lap of laps) {
    const sectors = byLap.get(lap);
    const s1 = sectors.find(e => e.sector === 1);

    // First lap of stint: capture starting fuel from sector-1 fuel + sector-1 burn
    if (startFuel === null && s1) {
      // s1.fuel is post-burn; add back the burn to estimate pre-lap fuel
      const burnS1 = s1.fuel !== undefined
        ? (s1.fuel - (sectors.find(e=>e.sector===2)?.fuel ?? s1.fuel))   // can't easily reverse
        : null;
      startFuel = s1.fuel ?? 0;  // approximation: use post-S1 fuel as proxy for start-of-stint
    }

    // Lap time = sum of the 3 sector times (skip laps with fewer than 3 sectors = incomplete last lap)
    const sectorTimes = [1, 2, 3].map(s => sectors.find(e => e.sector === s)?.sectorTime ?? null);
    if (sectorTimes.every(t => t !== null)) {
      lapTimes.push(+(sectorTimes[0] + sectorTimes[1] + sectorTimes[2]).toFixed(3));
    }

    // Check for pit on sector 3
    const s3 = sectors.find(e => e.sector === 3);
    const pit = s3?.events?.find(ev => ev.type === 'pit');

    if (pit) {
      stints.push({
        compound,
        laps:     lapTimes.length,
        avgLap:   lapTimes.length ? +(lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length).toFixed(2) : null,
        startFuel: +startFuel.toFixed(1),
        fuelAdded: pit.fuelAdded,
        pitDuration: pit.duration,
      });
      compound   = pit.compound;
      stintStart = lap + 1;
      startFuel  = null;
      lapTimes   = [];
    }

    // Check for retirement
    const retired = sectors.some(e =>
      e.events?.some(ev =>
        (ev.type === 'mechanical' && ev.severity === 'retirement') ||
        (ev.type === 'driver_error' && ev.severity === 'crash')
      )
    );
    if (retired) break;
  }

  // Final stint
  if (lapTimes.length > 0) {
    stints.push({
      compound,
      laps:      lapTimes.length,
      avgLap:    +(lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length).toFixed(2),
      startFuel: +startFuel.toFixed(1),
      fuelAdded: null,
      pitDuration: null,
    });
  }

  return stints;
}

// ── Early-lap factor comparison (first 5 laps) ────────────────────────────────

function earlyFactors(driverName, numLaps = 5) {
  const entries = raceLog.entries.filter(
    e => e.car === driverName && e.lap >= 1 && e.lap <= numLaps && e.sector !== 0
  );
  const rows = [];
  const byLap = new Map();
  for (const e of entries) {
    if (!byLap.has(e.lap)) byLap.set(e.lap, []);
    byLap.get(e.lap).push(e);
  }
  for (const [lap, secs] of [...byLap.entries()].sort((a,b)=>a[0]-b[0])) {
    const lapTime = [1,2,3].map(s => secs.find(e=>e.sector===s)?.sectorTime ?? 0).reduce((a,b)=>a+b,0);
    const s1 = secs.find(e=>e.sector===1);
    rows.push({
      lap,
      lapTime: +lapTime.toFixed(2),
      tyre:    s1?.factors?.tyre?.toFixed(4) ?? '-',
      fuel:    s1?.factors?.fuel?.toFixed(4) ?? '-',
      driver:  s1?.factors?.driver?.toFixed(4) ?? '-',
      engine:  s1?.factors?.engine?.toFixed(4) ?? '-',
      chassis: s1?.factors?.chassis?.toFixed(4) ?? '-',
      setup:   s1?.factors?.setup?.toFixed(4) ?? '-',
      wear:    s1?.wear?.toFixed(3) ?? '-',
      fuelKg:  s1?.fuel?.toFixed(1) ?? '-',
    });
  }
  return rows;
}

// ── Sort finishers by position ────────────────────────────────────────────────

const sorted = [...cars].sort((a, b) => {
  if (a.status === 'retired' && b.status !== 'retired') return 1;
  if (b.status === 'retired' && a.status !== 'retired') return -1;
  return a.cumulativeTime - b.cumulativeTime;
});

const top10 = sorted.filter(c => c.status !== 'retired').slice(0, 10);

// ── Print stint summary for top 10 ───────────────────────────────────────────

const leaderTime = top10[0]?.cumulativeTime ?? 0;

console.log(`\n${'═'.repeat(88)}`);
console.log(`RACE  seed=${SEED}   Top-10 Stint Breakdown`);
console.log('═'.repeat(88));

for (let i = 0; i < top10.length; i++) {
  const car    = top10[i];
  const stints = buildStints(car.driver.name);
  const gap    = i === 0 ? `${(car.cumulativeTime/60).toFixed(2)} min` : `+${(car.cumulativeTime-leaderTime).toFixed(1)}s`;

  console.log(`\nP${i+1}  ${car.driver.name}  (${car.tyres.name}, ${car.stopsMade}-stop)  ${gap}`);
  console.log('    ' + '─'.repeat(68));
  console.log(`    ${'Stint'.padEnd(6)} ${'Compound'.padEnd(10)} ${'Laps'.padEnd(6)} ${'Avg lap'.padEnd(10)} ${'Start fuel'.padEnd(12)} ${'Pit stop'}`);

  stints.forEach((s, idx) => {
    const pitInfo = s.pitDuration ? `${s.pitDuration}s (+${s.fuelAdded}kg)` : '(finish)';
    const cmp = s.compound.padEnd(10);
    console.log(`    Stint ${idx+1}  ${cmp} ${String(s.laps).padEnd(6)} ${String(s.avgLap+'s').padEnd(10)} ${String(s.startFuel+'kg').padEnd(12)} ${pitInfo}`);
  });
}

// ── Early-lap comparison: Senna vs Prost ─────────────────────────────────────

console.log(`\n${'═'.repeat(88)}`);
console.log('EARLY-LAP FACTOR COMPARISON — Senna vs Prost (laps 1–8)');
console.log('═'.repeat(88));

for (const name of ['Senna', 'Prost']) {
  const rows = earlyFactors(name, 8);
  const startCompound = raceLog.entries.find(
    e => e.car === name && e.events?.some(ev => ev.type === 'pit')
  )?.events?.find(ev => ev.type === 'pit')?.plannedStrategy?.[0] ?? 'M';

  console.log(`\n${name}  (planned start: ${startCompound})`);
  console.log('  Lap  LapTime   Tyre    Fuel    Driver  Engine  Chassis Setup   Wear   FuelKg');
  console.log('  ' + '─'.repeat(80));
  for (const r of rows) {
    console.log(
      `  ${String(r.lap).padStart(3)}  ${String(r.lapTime).padEnd(9)} ` +
      `${r.tyre}  ${r.fuel}  ${r.driver}  ${r.engine}  ${r.chassis}  ${r.setup}  ` +
      `${r.wear}  ${r.fuelKg}`
    );
  }
}
