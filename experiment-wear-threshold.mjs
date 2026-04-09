// Experiment: does pitting earlier or later produce better race times?
// Each strategy is tested across many seeds. All cars use the same threshold.
// Metric: average cumulative race time for finishers (lower = faster race).

import { initRace, cars } from './state.js';
import { tick, isRaceOver, pitConfig } from './simulation.js';

const STRATEGIES = [
  { name: 'Never pit *',     min: 99,   max: 99   },  // threshold unreachable
  { name: 'Threshold 0.90',  min: 0.90, max: 0.90 },
  { name: 'Threshold 0.80',  min: 0.80, max: 0.80 },
  { name: 'Threshold 0.70',  min: 0.70, max: 0.70 },
  { name: 'Current (random)',min: 0.60, max: 0.70 },  // baseline
  { name: 'Threshold 0.60',  min: 0.60, max: 0.60 },
  { name: 'Threshold 0.50',  min: 0.50, max: 0.50 },
];

const SEEDS = [
  198804, 12345, 99999, 54321, 11111,
  22222,  33333, 44444, 55555, 66666,
  77777,  88888, 13579, 24680, 31415,
  27182,  16180, 42042, 10001, 56789,
];

function runRace(seed) {
  const rng = initRace(seed);
  while (!isRaceOver()) tick(rng);
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean   = values.reduce((s, v) => s + v, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  return { mean: mean.toFixed(1), median: median.toFixed(1), min: sorted[0].toFixed(1) };
}

console.log(`\nWear threshold experiment — ${SEEDS.length} seeds\n`);
console.log(
  'Strategy'.padEnd(20),
  'DNF%'.padStart(5),
  'Avg stops'.padStart(10),
  'Avg finish time'.padStart(16),
  'Median finish time'.padStart(19),
  'Best finish time'.padStart(17),
);
console.log('─'.repeat(90));

for (const strategy of STRATEGIES) {
  pitConfig.wearMin = strategy.min;
  pitConfig.wearMax = strategy.max;

  const dnfCounts      = [];
  const stopCounts     = [];
  const finishTimes    = [];

  for (const seed of SEEDS) {
    runRace(seed);

    const finishers = cars.filter(c => c.status !== 'retired');
    const retirees  = cars.filter(c => c.status === 'retired');

    dnfCounts.push(retirees.length);
    finishTimes.push(...finishers.map(c => c.cumulativeTime));
    stopCounts.push(...cars.map(c => c.stopsMade));
  }

  const avgDnf   = (dnfCounts.reduce((s, v) => s + v, 0) / dnfCounts.length).toFixed(1);
  const dnfPct   = ((dnfCounts.reduce((s, v) => s + v, 0) / (SEEDS.length * cars.length)) * 100).toFixed(1);
  const avgStops = (stopCounts.reduce((s, v) => s + v, 0) / stopCounts.length).toFixed(2);
  const s        = stats(finishTimes);

  console.log(
    strategy.name.padEnd(20),
    `${dnfPct}%`.padStart(5),
    avgStops.padStart(10),
    s.mean.padStart(16),
    s.median.padStart(19),
    s.min.padStart(17),
  );
}

// Reset to default so other scripts aren't affected
pitConfig.wearMin = 0.60;
pitConfig.wearMax = 0.70;

console.log('\n* Never pit: emergency fuel stops may still occur');
console.log('  Finish time = cumulative race time in seconds (lower = faster)');
