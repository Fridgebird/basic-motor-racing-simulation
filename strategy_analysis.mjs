// Strategy analysis — runs N full races and reports per-car strategy outcomes.
// Run with: node strategy_analysis.mjs [numRaces]

import { initRace, race, cars, raceLog }          from './state.js';
import { tick, isRaceOver, initStrategies }        from './simulation.js';

const NUM_RACES = process.argv[2] ? parseInt(process.argv[2]) : 8;

function pad(str, n)  { return String(str ?? '').padEnd(n); }
function lpad(str, n) { return String(str ?? '').padStart(n); }
function stopsLabel(n) { return `${n}-stop`; }

// ── Run one race and capture what we need ────────────────────────────────────

function runRace(seed) {
  const rng = initRace(seed);
  initStrategies(rng);
  while (!isRaceOver()) tick(rng);

  // Snapshot cars and log (they get reset on next initRace)
  const snapshot = cars.map(car => ({ ...car }));
  const logSnap  = raceLog.entries.map(e => ({ ...e, events: [...(e.events ?? [])] }));
  return { cars: snapshot, log: logSnap };
}

// ── Extract stint breakdown from race log for one car ────────────────────────

function getStints(driverName, log) {
  const entries = log.filter(e => e.car === driverName);
  const stints  = [];
  let stintStart = 1;

  // Detect starting compound from the strategy_init event logged at race start.
  // Fallback to 'M' if not found (retired before first sector, etc.).
  let curCompound = 'M';
  for (const e of entries) {
    const init = e.events?.find(ev => ev.type === 'strategy_init');
    if (init) {
      curCompound = init.compound[0].toUpperCase();
      break;
    }
  }

  entries.forEach(e => {
    const pit = e.events?.find(ev => ev.type === 'pit');
    if (pit && e.sector === 3) {
      const len = e.lap - stintStart + 1;
      stints.push(`${len}L(${curCompound})`);
      stintStart  = e.lap + 1;
      curCompound = pit.compound[0].toUpperCase();
    }
    const crash = e.events?.find(ev => ev.type === 'driver_error' && ev.severity === 'crash');
    const mech  = e.events?.find(ev => ev.type === 'mechanical'   && ev.severity === 'retirement');
    if ((crash || mech) && stints.length === 0 && stintStart === 1) {
      // DNF on first stint — nothing to add here, handled below
    }
  });

  // Final / only stint
  const lastEntry = entries.at(-1);
  const lastLap   = lastEntry?.lap ?? 0;
  const len = lastLap - stintStart + 1;
  if (len > 0) stints.push(`${len}L(${curCompound})`);

  return stints.join(' → ');
}

function getRetireReason(driverName, log) {
  const entries = log.filter(e => e.car === driverName);
  for (const e of entries) {
    for (const ev of (e.events ?? [])) {
      if (ev.type === 'mechanical'   && ev.severity === 'retirement') return 'mech';
      if (ev.type === 'driver_error' && ev.severity === 'crash')      return 'crash';
    }
  }
  return null;
}

// ── Aggregate counters ───────────────────────────────────────────────────────

const stratCounts = {};
let totalFinishers = 0, totalMech = 0, totalCrash = 0;

// ── Main loop ────────────────────────────────────────────────────────────────

for (let r = 0; r < NUM_RACES; r++) {
  const seed   = 198804 + r * 7;
  const result = runRace(seed);

  const sorted = [...result.cars].sort((a, b) => {
    if (a.status === 'retired' && b.status !== 'retired') return 1;
    if (b.status === 'retired' && a.status !== 'retired') return -1;
    return a.cumulativeTime - b.cumulativeTime;
  });

  console.log(`\n${'═'.repeat(96)}`);
  console.log(`RACE ${r + 1}  seed=${seed}`);
  console.log('═'.repeat(96));
  console.log(
    lpad('Pos', 4) + '  ' + pad('Driver', 14) + pad('Tyre co.', 9) +
    pad('Stops', 7) + pad('Stints', 38) + pad('Status', 10) + 'Time/gap'
  );
  console.log('─'.repeat(96));

  let leaderTime = null;

  sorted.forEach((car, idx) => {
    const isRetired = car.status === 'retired';
    const pos       = isRetired ? 'DNF' : idx + 1;
    const stints    = getStints(car.driver.name, result.log);
    const reason    = isRetired ? getRetireReason(car.driver.name, result.log) : null;
    const statusStr = isRetired ? `(${reason ?? 'DNF'})` : 'racing';
    const label     = stopsLabel(car.stopsMade);

    let timeStr;
    if (isRetired) {
      const lastLap = result.log.filter(e => e.car === car.driver.name).at(-1)?.lap ?? '?';
      timeStr = `lap ${lastLap}`;
    } else if (leaderTime === null) {
      leaderTime = car.cumulativeTime;
      timeStr = `${(car.cumulativeTime / 60).toFixed(2)} min`;
    } else {
      timeStr = `+${(car.cumulativeTime - leaderTime).toFixed(1)}s`;
    }

    console.log(
      lpad(pos, 4) + '  ' +
      pad(car.driver.name.split(' ').slice(-1)[0], 14) +
      pad(car.tyres.name, 9) +
      pad(label, 7) +
      pad(stints, 38) +
      pad(statusStr, 10) +
      timeStr
    );

    if (!isRetired) {
      totalFinishers++;
      stratCounts[label] = (stratCounts[label] ?? 0) + 1;
    } else {
      if (reason === 'mech')  totalMech++;
      else                    totalCrash++;
    }
  });

  // Winner summary
  const winner = sorted.find(c => c.status !== 'retired');
  const p2     = sorted.filter(c => c.status !== 'retired')[1];
  if (winner) {
    const gap = p2 ? `  gap to P2: ${(p2.cumulativeTime - winner.cumulativeTime).toFixed(1)}s` : '';
    console.log(`\n  ★ Winner: ${winner.driver.name} (${winner.tyres.name}, ${stopsLabel(winner.stopsMade)})${gap}`);
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`STRATEGY SUMMARY  (${NUM_RACES} races, ${NUM_RACES * 24} starts)`);
console.log('═'.repeat(60));

console.log('\nStop strategy distribution (finishers only):');
const total = Object.values(stratCounts).reduce((s, n) => s + n, 0);
[...Object.entries(stratCounts)]
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([label, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / total) * 40));
    console.log(`  ${pad(label, 9)} ${lpad(count, 4)} cars  ${lpad(pct, 5)}%  ${bar}`);
  });

const retireTotal = totalMech + totalCrash;
const retirePct   = ((retireTotal / (NUM_RACES * 24)) * 100).toFixed(1);
console.log(`\nRetirements: ${retireTotal} (${retirePct}%) — ${totalMech} mechanical, ${totalCrash} crash`);
console.log(`Finishers:   ${totalFinishers} / ${NUM_RACES * 24}`);
