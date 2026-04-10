import { initRace, cars, raceLog } from './state.js';
import { tick, isRaceOver } from './simulation.js';

const rng = initRace(198804);
while (!isRaceOver()) tick(rng);

const attempts   = raceLog.entries.filter(e => e.events.some(ev => ev.type === 'overtake'));
const successful = attempts.filter(e => e.events.some(ev => ev.result === 'success'));
const failed     = attempts.filter(e => e.events.some(ev => ev.result === 'failed'));

console.log(`Attempts: ${attempts.length}  |  Successful: ${successful.length}  |  Failed: ${failed.length}\n`);

console.log('Successful overtakes:');
successful.forEach(e => {
  const ev = e.events.find(ev => ev.type === 'overtake');
  console.log(`  Lap ${String(e.lap).padStart(2)} S${e.sector}: ${e.car.padEnd(12)} passes ${ev.passed.padEnd(12)} gap=${ev.gap}s prob=${ev.prob} roll=${ev.roll}`);
});
