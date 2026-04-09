// Headless race runner — prints results to stdout
import { initRace, cars, raceLog } from './state.js';
import { tick, isRaceOver } from './simulation.js';

const seed = 198804;
const rng = initRace(seed);
while (!isRaceOver()) tick(rng);

// Final standings
console.log('\n=== FINAL STANDINGS ===');
[...cars]
  .sort((a, b) => a.position - b.position)
  .forEach(car => {
    const status = car.status === 'retired'
      ? `RETIRED lap ${car.retiredLap} (${car.retiredReason}${car.degradedLabel ? ' – ' + car.degradedLabel : ''})`
      : `+${car.gap}s`;
    console.log(`${String(car.position).padStart(2)}. ${car.driver.name.padEnd(12)} ${car.team.name.padEnd(10)} ${status}`);
  });

// Cheever's events
console.log('\n=== CHEEVER EVENTS ===');
raceLog.entries
  .filter(e => e.car === 'Cheever' && e.events.length > 0)
  .forEach(e => {
    e.events.forEach(ev => {
      console.log(`Lap ${e.lap} S${e.sector}: ${JSON.stringify(ev)}`);
    });
  });
