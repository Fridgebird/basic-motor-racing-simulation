// Two-part experiment:
//   Part 1 — sweep tyre penalty coefficient; find where strategy spread becomes meaningful
//   Part 2 — fix that coefficient; sweep track abrasiveness to show how optimal strategy shifts

import { initRace, cars } from './state.js';
import { tick, isRaceOver, pitConfig, tyreConfig } from './simulation.js';

const STRATEGIES = [
  { name: 'Never pit',      min: 99,   max: 99   },
  { name: '0.90',           min: 0.90, max: 0.90 },
  { name: '0.80',           min: 0.80, max: 0.80 },
  { name: '0.70',           min: 0.70, max: 0.70 },
  { name: '0.60 (current)', min: 0.60, max: 0.60 },
  { name: '0.50',           min: 0.50, max: 0.50 },
];

const SEEDS = [
  198804, 12345, 99999, 54321, 11111,
  22222,  33333, 44444, 55555, 66666,
  77777,  88888, 13579, 24680, 31415,
  27182,  16180, 42042, 10001, 56789,
];

function runAll() {
  // Returns { avgTime, avgStops } for the current pitConfig/tyreConfig settings
  let totalTime  = 0;
  let timeCount  = 0;
  let totalStops = 0;
  let stopCount  = 0;

  for (const seed of SEEDS) {
    const rng = initRace(seed);
    while (!isRaceOver()) tick(rng);

    for (const car of cars) {
      if (car.status !== 'retired') {
        totalTime += car.cumulativeTime;
        timeCount++;
      }
      totalStops += car.stopsMade;
      stopCount++;
    }
  }

  return {
    avgTime:  totalTime  / timeCount,
    avgStops: totalStops / stopCount,
  };
}

function row(label, results, baselineTime) {
  const best = Math.min(...results.map(r => r.avgTime));
  return results.map((r, i) => {
    const delta  = r.avgTime - best;
    const marker = delta < 1 ? ' ← best' : '';
    return `  ${STRATEGIES[i].name.padEnd(14)} ${r.avgTime.toFixed(1).padStart(8)}s  `
         + `(+${delta.toFixed(1).padStart(5)}s vs best)  `
         + `${r.avgStops.toFixed(2)} stops${marker}`;
  }).join('\n');
}

// ── Part 1: Sweep penalty coefficient at fixed abrasiveness 0.80 ─────────────

const COEFFICIENTS = [0.08, 0.10, 0.13, 0.16, 0.20, 0.25];

console.log('═'.repeat(70));
console.log('PART 1 — Tyre penalty coefficient sweep (abrasiveness fixed at 0.80)');
console.log('═'.repeat(70));
console.log('Metric: avg finish time for non-retired cars across 20 seeds\n');

for (const coeff of COEFFICIENTS) {
  tyreConfig.penaltyCoeff  = coeff;
  tyreConfig.abrasiveness  = 0.80;

  const results = [];
  for (const strat of STRATEGIES) {
    pitConfig.wearMin = strat.min;
    pitConfig.wearMax = strat.max;
    results.push(runAll());
  }

  const best  = Math.min(...results.map(r => r.avgTime));
  const worst = Math.max(...results.map(r => r.avgTime));
  const spread = (worst - best).toFixed(1);

  console.log(`Coefficient ${coeff.toFixed(2)}  (spread best→worst: ${spread}s)`);
  console.log(row(coeff, results));
  console.log();
}

// ── Part 2: Sweep abrasiveness at the most interesting coefficient ────────────

const CHOSEN_COEFF = 0.16;
const ABRASIVENESS_LEVELS = [
  { val: 0.50, label: 'Low   (smooth street circuit)' },
  { val: 0.65, label: 'Med   (flowing permanent circuit)' },
  { val: 0.80, label: 'High  (current / abrasive)' },
  { val: 0.95, label: 'Extreme (rough surface)' },
];

console.log('═'.repeat(70));
console.log(`PART 2 — Track abrasiveness sweep (coefficient fixed at ${CHOSEN_COEFF})`);
console.log('═'.repeat(70));
console.log('Shows how optimal pit window shifts with circuit characteristics\n');

for (const ab of ABRASIVENESS_LEVELS) {
  tyreConfig.penaltyCoeff = CHOSEN_COEFF;
  tyreConfig.abrasiveness = ab.val;

  const results = [];
  for (const strat of STRATEGIES) {
    pitConfig.wearMin = strat.min;
    pitConfig.wearMax = strat.max;
    results.push(runAll());
  }

  const best   = Math.min(...results.map(r => r.avgTime));
  const worst  = Math.max(...results.map(r => r.avgTime));
  const spread = (worst - best).toFixed(1);

  console.log(`Abrasiveness ${ab.val}  ${ab.label}  (spread: ${spread}s)`);
  console.log(row(ab.val, results));
  console.log();
}

// Reset defaults
tyreConfig.penaltyCoeff = 0.08;
tyreConfig.abrasiveness = 0.80;
pitConfig.wearMin = 0.60;
pitConfig.wearMax = 0.70;
